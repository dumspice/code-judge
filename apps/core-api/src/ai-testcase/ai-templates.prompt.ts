import { z } from 'zod';
import type { GenerateAiTemplatesDto } from './dto/generate-ai-templates.dto';

// Schema for the AI-generated templates: a map from language identifier to code string.
export const generatedTemplatesSchema = z.record(z.string());

export type GeneratedTemplates = z.infer<typeof generatedTemplatesSchema>;

/** Bump when prompt rules change (traceability). */
export const PROMPT_VERSION = 'ai-templates-v3-comments-safe';

const FORBIDDEN_RULES = `
STRICT RULES — VIOLATIONS ARE NOT ALLOWED:
1. DO NOT implement the problem algorithm or any logic that produces the correct answer.
2. DO NOT copy formulas, loops, DP, graph traversal, or shortcuts from the statement into working code.
3. The student must write ALL solution logic themselves. Your output is only a starter scaffold.
4. Function solve (or equivalent) body MUST be empty: use pass / TODO / NotImplementedError / return placeholder only (e.g. return 0 or null) — never the real computation.
5. You MAY read and parse stdin (or prepare variables from input format described in the statement) and MAY call solve(...) then print its return value — but solve must not contain the answer logic.
6. Infer input format only from the problem statement (Input section + sample lines). Use sensible variable names.
`;

const COMMENT_RULES_VI = `
QUY TẮC COMMENT (rất quan trọng — tránh lộ đề):
- Trong thân hàm solve (hoặc chỗ học viên viết logic), CHỈ được có ĐÚNG MỘT dòng comment: "# Viết logic tại đây".
- KHÔNG được comment mô tả thuật toán, công thức, bước giải, ý tưởng DP/greedy/graph, tổng/hiệu/max/min, Fibonacci, LCA, palindrome, hay diễn giải lại đề bài.
- KHÔNG comment trên dòng đọc stdin (để trống hoặc không comment).
- Không dùng comment tiếng Anh giải thích bài toán.
`;

const COMMENT_RULES_EN = `
COMMENT RULES (critical — do not leak the solution):
- Inside solve (or where the student writes logic), use EXACTLY ONE comment line: "# Write some logic here" (Python) or "// Write some logic here" (other languages).
- NEVER comment about the algorithm, formulas, solution steps, DP/greedy/graph hints, sum/product/max/min, Fibonacci, LCA, palindrome, or restating the problem.
- Do NOT add comments on stdin-reading lines.
- No narrative comments anywhere in the template.
`;

const SYSTEM_PROMPT_VI = `Bạn tạo STARTER CODE cho bài competitive programming — KHÔNG phải lời giải.

Trả về DUY NHẤT một JSON object hợp lệ (không markdown fence):
{
  "<LANGUAGE>": "<CODE TEMPLATE>",
  ...
}
Key là mã ngôn ngữ: PYTHON, CPP, JAVA, GO, RUST, JAVASCRIPT (đúng như danh sách yêu cầu).

Mỗi template PHẢI gồm:
- Đọc/parse stdin theo định dạng Input trong đề (số dòng, kiểu dữ liệu).
- Hàm solve (hoặc tương đương) với chữ ký tham số khớp input đã parse — THÂN HÀM chỉ placeholder (pass / TODO / NotImplementedError), KHÔNG giải bài.
- Phần main/driver (nếu cần): gọi solve với biến đã đọc, in kết quả — KHÔNG viết thuật toán trong main thay cho solve.
${FORBIDDEN_RULES}
${COMMENT_RULES_VI}

Ví dụ SAI (cấm): # Tính tổng hai số rồi in ra
Ví dụ ĐÚNG: # Viết logic tại đây (chỉ dòng này trong solve)
`;

const SYSTEM_PROMPT_EN = `You generate STARTER CODE for competitive programming — NOT a full solution.

Return ONLY a valid JSON object (no markdown fences):
{
  "<LANGUAGE>": "<CODE TEMPLATE>",
  ...
}
Keys are language identifiers: PYTHON, CPP, JAVA, GO, RUST, JAVASCRIPT (exactly as requested).

Each template MUST include:
- stdin read/parse matching the problem Input format (line count, types).
- A solve (or equivalent) function with parameters matching parsed input — body MUST be placeholder only (pass / TODO / throw / stub return), NEVER the actual algorithm.
- Optional main/driver: call solve with parsed variables and print result — do NOT implement the algorithm in main instead of solve.
${FORBIDDEN_RULES}
${COMMENT_RULES_EN}

WRONG (forbidden): // Compute the maximum of a and b
RIGHT (only inside solve): // Write some logic here
`;

/**
 * Build messages for the AI model to generate code templates.
 * @param input DTO containing problem title, statement, and target languages.
 * @returns Array of messages suitable for the LLM.
 */
export function buildAiTemplatesMessages(input: GenerateAiTemplatesDto) {
  const locale = input.locale === 'en' ? 'en' : 'vi';
  const system = locale === 'en' ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_VI;

  const parts: string[] = [];
  parts.push('<prompt_version>' + PROMPT_VERSION + '</prompt_version>');
  parts.push('<task>starter_io_and_stub_only</task>');
  parts.push('<title>' + input.title.trim() + '</title>');
  parts.push('<statement>' + input.statement.trim() + '</statement>');
  parts.push('<languages>' + input.languages.join(',') + '</languages>');
  parts.push(
    '<reminder>No solution hints in comments. Only one generic logic placeholder inside solve.</reminder>',
  );

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: parts.join('\n') },
  ];
}

export { PROMPT_VERSION as AI_TEMPLATES_PROMPT_VERSION };
