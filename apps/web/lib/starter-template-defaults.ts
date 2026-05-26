import { problemsApi } from '@/services/problem.apis';

export function diffSupportedLanguages(previous: string[], next: string[]) {
  const prevKeys = new Set(previous.map((l) => l.trim().toUpperCase()));
  const nextKeys = new Set(next.map((l) => l.trim().toUpperCase()));
  const added = next.filter((l) => !prevKeys.has(l.trim().toUpperCase()));
  const removed = previous.filter((l) => !nextKeys.has(l.trim().toUpperCase()));
  return { added, removed };
}

function normalizeTemplateCode(record: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'string') {
      out[key.trim().toUpperCase()] = value;
    }
  }
  return out;
}

/**
 * Khi bật thêm ngôn ngữ: điền boilerplate mặc định (stdin + solve trống).
 * Khi tắt ngôn ngữ: xóa entry template tương ứng.
 */
export async function applySupportedLanguagesWithDefaultTemplates(params: {
  previousLanguages: string[];
  nextLanguages: string[];
  templateCode: Record<string, string>;
  testCases?: Array<{ input: string }>;
}): Promise<{ supportedLanguages: string[]; templateCode: Record<string, string> }> {
  const { added, removed } = diffSupportedLanguages(
    params.previousLanguages,
    params.nextLanguages,
  );
  const supportedLanguages = params.nextLanguages.map((l) => l.trim().toUpperCase());
  let templateCode = normalizeTemplateCode(params.templateCode);

  for (const lang of removed) {
    delete templateCode[lang.trim().toUpperCase()];
  }

  const langsNeedingDefault = added
    .map((l) => l.trim().toUpperCase())
    .filter((key) => !templateCode[key]?.trim());

  if (langsNeedingDefault.length > 0) {
    const resolved = await problemsApi.previewStarterTemplates({
      supportedLanguages: langsNeedingDefault,
      templateCode,
      testCases: params.testCases?.map((tc) => ({ input: tc.input ?? '' })),
    });
    for (const key of langsNeedingDefault) {
      const code = resolved[key];
      if (code?.trim()) {
        templateCode[key] = code;
      }
    }
  }

  return { supportedLanguages, templateCode };
}

/** Điền boilerplate cho các ngôn ngữ đã chọn nhưng chưa có template (vd. form tạo bài mới). */
export async function fillMissingDefaultTemplates(params: {
  supportedLanguages: string[];
  templateCode: Record<string, string>;
  testCases?: Array<{ input: string }>;
}): Promise<{ supportedLanguages: string[]; templateCode: Record<string, string> }> {
  const supportedLanguages = params.supportedLanguages.map((l) => l.trim().toUpperCase());
  const templateCode = normalizeTemplateCode(params.templateCode);
  const missing = supportedLanguages.filter((key) => !templateCode[key]?.trim());

  if (missing.length === 0) {
    return { supportedLanguages, templateCode };
  }

  const resolved = await problemsApi.previewStarterTemplates({
    supportedLanguages: missing,
    templateCode,
    testCases: params.testCases?.map((tc) => ({ input: tc.input ?? '' })),
  });

  for (const key of missing) {
    const code = resolved[key];
    if (code?.trim()) {
      templateCode[key] = code;
    }
  }

  return { supportedLanguages, templateCode };
}
