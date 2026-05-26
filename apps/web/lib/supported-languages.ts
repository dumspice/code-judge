/** Ngôn ngữ thuật toán hỗ trợ (Judge0 + template mặc định backend). */
export const SUPPORTED_LANGUAGES = [
  'PYTHON',
  'JAVASCRIPT',
  'CPP',
  'JAVA',
  'GO',
  'RUST',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Ngôn ngữ được phép làm bài — chỉ từ `problem.supportedLanguages` (không gộp thêm). */
export function getProblemSupportedLanguages(
  supportedLanguages: string[] | null | undefined,
): string[] {
  if (!supportedLanguages?.length) {
    return [];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const lang of supportedLanguages) {
    const key = lang.trim().toUpperCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export function monacoLanguageId(lang: string): string {
  switch (lang.toUpperCase()) {
    case 'CPP':
      return 'cpp';
    case 'PYTHON':
      return 'python';
    case 'JAVASCRIPT':
      return 'javascript';
    case 'JAVA':
      return 'java';
    case 'GO':
      return 'go';
    case 'RUST':
      return 'rust';
    default:
      return 'plaintext';
  }
}

export function submissionFileExtension(lang: string): string {
  switch (lang.toUpperCase()) {
    case 'PYTHON':
      return 'py';
    case 'JAVASCRIPT':
      return 'js';
    case 'TYPESCRIPT':
      return 'ts';
    case 'JAVA':
      return 'java';
    case 'GO':
      return 'go';
    case 'RUST':
      return 'rs';
    case 'CPP':
      return 'cpp';
    default:
      return 'txt';
  }
}
