import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from '../common';
import {
  buildAiTestcaseMessages,
  generatedTestcaseSchema,
  GeneratedTestcaseOutput,
} from './ai-testcase.prompt';
import { GenerateAiTestcaseDto } from './dto/generate-ai-testcase.dto';
import { QuickGenerateAiTestcaseDto } from './dto/quick-generate-ai-testcase.dto';

interface GenerateDraftResult {
  provider: 'openai' | 'google';
  model: string;
  promptVersion: string;
  raw: string;
  parsed: GeneratedTestcaseOutput | null;
  parseError?: string;
}

@Injectable()
export class AiTestcaseService {
  constructor(private readonly config: ConfigService) {}

  async quickGenerate(input: QuickGenerateAiTestcaseDto): Promise<GenerateDraftResult> {
    return this.generateDraft({
      title: input.title,
      statement: input.statement,
      ioSpec: input.ioSpec,
      provider: input.provider,
      model: input.model,
      difficulty: 'not-specified',
      timeLimitMs: 10000,
      memoryLimitMb: 256,
      maxTestCases: 8,
    });
  }

  async generateDraft(input: GenerateAiTestcaseDto): Promise<GenerateDraftResult> {
    const fastMode = this.isFastModeEnabled();
    const primaryProvider = input.provider ?? this.getDefaultProvider();
    const primaryModel = input.model ?? this.getDefaultModel(primaryProvider);
    const promptVersion = this.config.get<string>(EnvKeys.AI_PROMPT_VERSION) ?? 'ai-testcase-v1';
    const configuredMaxTokens = Number(this.config.get<string>(EnvKeys.AI_MAX_TOKENS) ?? 2000);
    const maxTokens = fastMode ? Math.min(configuredMaxTokens, 2500) : configuredMaxTokens;
    const configuredTemperature = Number(this.config.get<string>(EnvKeys.AI_TEMPERATURE) ?? 0.2);
    const temperature = fastMode ? 0 : configuredTemperature;

    const messages = buildAiTestcaseMessages(input, promptVersion);
    const effectiveMessages = fastMode ? this.buildFastModeMessages(messages) : messages;
    const fallbackProvider: 'openai' | 'google' = primaryProvider === 'google' ? 'openai' : 'google';
    const fallbackModel = this.getDefaultModel(fallbackProvider);

    const plans: Array<{ provider: 'openai' | 'google'; model: string }> = fastMode
      ? [{ provider: primaryProvider, model: primaryModel }]
      : [
          { provider: primaryProvider, model: primaryModel },
          { provider: fallbackProvider, model: fallbackModel },
        ];

    let text = '';
    let usedProvider = primaryProvider;
    let usedModel = primaryModel;
    let lastError: unknown;

    for (const plan of plans) {
      try {
        text = await this.generateWithRetry(
          plan.provider,
          plan.model,
          effectiveMessages,
          temperature,
          maxTokens,
          fastMode ? 1 : 3,
        );
        usedProvider = plan.provider;
        usedModel = plan.model;
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!text) {
      throw new Error(
        `All AI providers failed. Last error: ${
          lastError instanceof Error ? lastError.message : 'unknown error'
        }`,
      );
    }

    let parsed: GeneratedTestcaseOutput | null = null;
    let parseError: string | undefined;
    try {
      parsed = this.parseOutput(text);
      if (parsed.testCases.length > (input.maxTestCases ?? 10)) {
        throw new Error('AI output exceeds maxTestCases');
      }
    } catch (error) {
      if (!fastMode && this.isLikelyTruncatedOutput(text)) {
        const compactMessages = this.buildCompactRetryMessages(messages);
        try {
          const retryText = await this.generateWithRetry(
            usedProvider,
            usedModel,
            compactMessages,
            0,
            maxTokens,
            1,
          );
          text = retryText;
          parsed = this.parseOutput(retryText);
          if (parsed.testCases.length > (input.maxTestCases ?? 10)) {
            throw new Error('AI output exceeds maxTestCases');
          }
          parseError = undefined;
        } catch (retryError) {
          parseError = retryError instanceof Error ? retryError.message : 'Unknown parse error';
        }
      } else {
        parseError = error instanceof Error ? error.message : 'Unknown parse error';
      }
    }

    return {
      provider: usedProvider,
      model: usedModel,
      promptVersion,
      raw: text,
      parsed,
      parseError,
    };
  }

  private async generateWithRetry(
    provider: 'openai' | 'google',
    modelName: string,
    messages: Array<{ role: 'system' | 'user'; content: string }>,
    temperature: number,
    maxTokens: number,
    maxAttempts: number,
  ): Promise<string> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.generate(provider, modelName, messages, temperature, maxTokens);
      } catch (error) {
        lastError = error;
        const retryable = this.isRetryableError(error);
        if (!retryable || attempt === maxAttempts) {
          throw error;
        }
        await this.delay(300 * 2 ** (attempt - 1));
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Unknown generation error');
  }

  private async generate(
    provider: 'openai' | 'google',
    modelName: string,
    messages: Array<{ role: 'system' | 'user'; content: string }>,
    temperature: number,
    maxTokens: number,
  ): Promise<string> {
    if (provider === 'google') {
      const key = this.config.get<string>(EnvKeys.GOOGLE_GENERATIVE_AI_API_KEY);
      if (!key) {
        throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set');
      }
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
              responseMimeType: 'application/json',
            },
            contents: messages.map((item) => ({
              role: item.role === 'system' ? 'user' : item.role,
              parts: [{ text: item.content }],
            })),
          }),
        },
      );
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Google AI request failed (${response.status}): ${errorBody}`);
      }
      const payload = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      return (
        payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('')?.trim() ?? ''
      );
    }

    const key = this.config.get<string>(EnvKeys.OPENAI_API_KEY);
    if (!key) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: modelName,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: messages.map((item) => ({
          role: item.role,
          content: item.content,
        })),
      }),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI request failed (${response.status}): ${errorBody}`);
    }
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return payload.choices?.[0]?.message?.content?.trim() ?? '';
  }

  private parseOutput(raw: string): GeneratedTestcaseOutput {
    const normalized = raw.trim().replace(/^\uFEFF/, '');
    const fencedBlocks = [...normalized.matchAll(/```[a-zA-Z0-9_-]*\s*([\s\S]*?)\s*```/g)].map(
      (match) => match[1]?.trim(),
    );

    const candidates: string[] = [];
    for (const block of fencedBlocks) {
      if (block) {
        candidates.push(block);
      }
    }

    // Fallback: remove leading/trailing markdown fence if present.
    const deFenced = normalized
      .replace(/^```[a-zA-Z0-9_-]*\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    if (deFenced !== normalized) {
      candidates.push(deFenced);
    }

    // Remove all fence markers globally, then retry.
    const stripAllFences = normalized.replace(/```[a-zA-Z0-9_-]*\s*|```/g, '').trim();
    if (stripAllFences && stripAllFences !== normalized) {
      candidates.push(stripAllFences);
    }

    // Extract first balanced JSON object from text.
    const extractedJsonObject = this.extractFirstJsonObject(normalized);
    if (extractedJsonObject) {
      candidates.push(extractedJsonObject);
    }

    candidates.push(normalized);

    let lastError: unknown;
    for (const candidate of candidates) {
      try {
        const json = JSON.parse(candidate) as unknown;
        return generatedTestcaseSchema.parse(json);
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(
      `Failed to parse AI output as JSON. Last error: ${
        lastError instanceof Error ? lastError.message : 'unknown parse error'
      }`,
    );
  }

  private extractFirstJsonObject(text: string): string | null {
    const start = text.indexOf('{');
    if (start < 0) {
      return null;
    }

    let depth = 0;
    let inString = false;
    let escaping = false;

    for (let i = start; i < text.length; i++) {
      const ch = text[i];

      if (inString) {
        if (escaping) {
          escaping = false;
          continue;
        }
        if (ch === '\\') {
          escaping = true;
          continue;
        }
        if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }

      if (ch === '{') {
        depth++;
        continue;
      }

      if (ch === '}') {
        depth--;
        if (depth === 0) {
          return text.slice(start, i + 1).trim();
        }
      }
    }

    return null;
  }

  private getDefaultProvider(): 'openai' | 'google' {
    const configured = (this.config.get<string>(EnvKeys.AI_DEFAULT_PROVIDER) ?? 'openai').toLowerCase();
    return configured === 'google' ? 'google' : 'openai';
  }

  private getDefaultModel(provider: 'openai' | 'google'): string {
    if (provider === 'google') {
      return this.config.get<string>(EnvKeys.AI_DEFAULT_MODEL_GOOGLE) ?? 'gemini-2.5-flash';
    }
    return this.config.get<string>(EnvKeys.AI_DEFAULT_MODEL_OPENAI) ?? 'gpt-4.1-mini';
  }

  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    return /(429|500|502|503|504|UNAVAILABLE|timeout|temporar)/i.test(error.message);
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private buildCompactRetryMessages(
    messages: Array<{ role: 'system' | 'user'; content: string }>,
  ): Array<{ role: 'system' | 'user'; content: string }> {
    const compactInstruction =
      '\nReturn valid compact JSON only (no markdown, no code fence, no explanation). Keep output concise.';
    return messages.map((message, index) =>
      index === 0
        ? { ...message, content: `${message.content}${compactInstruction}` }
        : message,
    );
  }

  private buildFastModeMessages(
    messages: Array<{ role: 'system' | 'user'; content: string }>,
  ): Array<{ role: 'system' | 'user'; content: string }> {
    const fastInstruction =
      '\nFAST MODE: prioritize response speed. Return concise compact JSON only. Limit to 3-5 high-value testcases. Keep explanations empty or very short.';
    return messages.map((message, index) =>
      index === 0
        ? { ...message, content: `${message.content}${fastInstruction}` }
        : message,
    );
  }

  private isLikelyTruncatedOutput(raw: string): boolean {
    const text = raw.trim();
    if (!text) {
      return false;
    }

    // Obvious truncation signals.
    if (!/[}\]]\s*```?\s*$/.test(text) && /"[^"]*$/.test(text)) {
      return true;
    }

    let brace = 0;
    let bracket = 0;
    let inString = false;
    let escaping = false;

    for (const ch of text) {
      if (inString) {
        if (escaping) {
          escaping = false;
          continue;
        }
        if (ch === '\\') {
          escaping = true;
          continue;
        }
        if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }
      if (ch === '{') brace++;
      if (ch === '}') brace--;
      if (ch === '[') bracket++;
      if (ch === ']') bracket--;
    }

    return inString || brace > 0 || bracket > 0;
  }

  private isFastModeEnabled(): boolean {
    const raw = (this.config.get<string>(EnvKeys.AI_FAST_MODE) ?? '').toLowerCase().trim();
    return ['1', 'true', 'yes', 'on'].includes(raw);
  }
}
