/** Comment duy nhất được phép trong vùng logic (solve / main thuật toán). */
export function logicPlaceholderComment(locale: 'vi' | 'en', language: string): string {
  const text = locale === 'vi' ? 'Viết logic tại đây' : 'Write some logic here';
  const lang = language.trim().toUpperCase();
  if (lang === 'PYTHON') {
    return `# ${text}`;
  }
  return `// ${text}`;
}

/**
 * Xóa comment gợi ý lời giải từ output AI; chỉ giữ scaffold code + một placeholder trong solve.
 */
export function sanitizeTemplateComments(
  code: string,
  locale: 'vi' | 'en',
  language: string,
): string {
  let result = code.replace(/\r\n/g, '\n');
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');

  const lines = result.split('\n');
  const kept: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      kept.push('');
      continue;
    }
    if (/^\s*#/.test(line)) {
      continue;
    }
    if (/^\s*\/\//.test(line)) {
      continue;
    }
    const withoutTrailing = line.replace(/\s+\/\/.*$/, '');
    if (withoutTrailing.trim()) {
      kept.push(withoutTrailing);
    }
  }

  result = kept.join('\n');
  return injectSolvePlaceholderComment(result, locale, language);
}

function injectSolvePlaceholderComment(
  code: string,
  locale: 'vi' | 'en',
  language: string,
): string {
  const placeholder = logicPlaceholderComment(locale, language);
  const indent = language.trim().toUpperCase() === 'PYTHON' ? '    ' : '    ';

  const patterns: Array<{ re: RegExp; insert: (m: RegExpMatchArray) => string }> = [
    {
      re: /(def\s+solve\s*\([^)]*\)\s*(?:->\s*[^:]+)?\s*:)\s*\n/i,
      insert: (m) => `${m[1]}\n${indent}${placeholder}\n`,
    },
    {
      re: /(function\s+solve\s*\([^)]*\)\s*\{)\s*\n/i,
      insert: (m) => `${m[1]}\n${indent}${placeholder}\n`,
    },
    {
      re: /((?:int|long|void|auto)\s+solve\s*\([^)]*\)\s*\{)\s*\n/i,
      insert: (m) => `${m[1]}\n${indent}${placeholder}\n`,
    },
    {
      re: /(static\s+\w+\s+solve\s*\([^)]*\)\s*(?:throws\s+\w+(?:\s*,\s*\w+)*)?\s*\{)\s*\n/i,
      insert: (m) => `${m[1]}\n${indent}${placeholder}\n`,
    },
    {
      re: /(func\s+solve\s*\([^)]*\)\s*\w*\s*\{)\s*\n/i,
      insert: (m) => `${m[1]}\n${indent}${placeholder}\n`,
    },
    {
      re: /(fn\s+solve\s*\([^)]*\)\s*(?:->\s*[^{]+)?\s*\{)\s*\n/i,
      insert: (m) => `${m[1]}\n${indent}${placeholder}\n`,
    },
  ];

  for (const { re, insert } of patterns) {
    const match = code.match(re);
    if (match) {
      return code.replace(re, insert(match));
    }
  }

  return code;
}
