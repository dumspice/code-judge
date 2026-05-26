/** Ngôn ngữ mặc định khi problem không khai báo supportedLanguages. */
export const DEFAULT_SUPPORTED_LANGUAGES = [
  'PYTHON',
  'JAVASCRIPT',
  'CPP',
  'JAVA',
  'GO',
  'RUST',
] as const;

export type DefaultSupportedLanguage = (typeof DEFAULT_SUPPORTED_LANGUAGES)[number];

type TestCaseInput = { input: string };

/**
 * Suy ra số lượng giá trị đầu vào từ test case đầu tiên có input khác rỗng.
 * 0 = không đọc stdin (vd. Hello World in ra cố định).
 */
export function inferInputArityFromTestCases(testCases?: TestCaseInput[]): number {
  if (!testCases?.length) {
    return 1;
  }

  for (const tc of testCases) {
    const raw = tc.input ?? '';
    if (!raw.trim()) {
      return 0;
    }
    const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length > 0) {
      return lines.length;
    }
    const tokens = raw.trim().split(/\s+/).filter(Boolean);
    if (tokens.length > 0) {
      return tokens.length;
    }
  }

  return 1;
}

function paramNames(arity: number): string[] {
  if (arity <= 0) return [];
  if (arity === 1) return ['n'];
  if (arity === 2) return ['a', 'b'];
  if (arity === 3) return ['a', 'b', 'c'];
  return Array.from({ length: arity }, (_, i) => `arg${i + 1}`);
}

export function buildDefaultTemplateForLanguage(language: string, inputArity: number): string {
  const lang = language.trim().toUpperCase();
  const params = paramNames(inputArity);
  const arity = params.length;

  if (lang === 'PYTHON') {
    if (arity === 0) {
      return [
        'def solve():',
        '    # Viết logic tại đây',
        '    pass',
        '',
        'def main():',
        '    result = solve()',
        '    if result is not None:',
        '        print(result)',
        '',
        'if __name__ == "__main__":',
        '    main()',
      ].join('\n');
    }
    const sig = params.map((p) => `${p}: int`).join(', ');
    const parseArgs = params.map((p, i) => `    ${p} = int(tokens[${i}])`).join('\n');
    const callArgs = params.join(', ');
    return [
      'import sys',
      '',
      `def solve(${sig}):`,
      '    # Viết logic tại đây',
      '    pass',
      '',
      'def main():',
      '    tokens = sys.stdin.read().split()',
      parseArgs,
      `    result = solve(${callArgs})`,
      '    if result is not None:',
      '        print(result)',
      '',
      'if __name__ == "__main__":',
      '    main()',
    ].join('\n');
  }

  if (lang === 'CPP') {
    if (arity === 0) {
      return [
        '#include <iostream>',
        'using namespace std;',
        '',
        'void solve() {',
        '    // Viết logic tại đây',
        '}',
        '',
        'int main() {',
        '    solve();',
        '    return 0;',
        '}',
      ].join('\n');
    }
    const sig = params.map((p) => `int ${p}`).join(', ');
    const decls = params.map((p) => `    int ${p};`).join('\n');
    const cinStmt = `    cin >> ${params.join(' >> ')};`;
    const callArgs = params.join(', ');
    return [
      '#include <iostream>',
      'using namespace std;',
      '',
      `int solve(${sig}) {`,
      '    // Viết logic tại đây',
      '    return 0;',
      '}',
      '',
      'int main() {',
      '    ios_base::sync_with_stdio(false);',
      '    cin.tie(nullptr);',
      decls,
      cinStmt,
      `    cout << solve(${callArgs}) << '\\n';`,
      '    return 0;',
      '}',
    ].join('\n');
  }

  if (lang === 'JAVASCRIPT') {
    if (arity === 0) {
      return [
        'function solve() {',
        '    // Viết logic tại đây',
        '}',
        '',
        'function main() {',
        '    const result = solve();',
        '    if (result !== undefined) {',
        '        console.log(result);',
        '    }',
        '}',
        '',
        'main();',
      ].join('\n');
    }
    const parseBlock = params
      .map((p, i) => `    const ${p} = parseInt(input[${i}], 10);`)
      .join('\n');
    const callArgs = params.join(', ');
    return [
      'const fs = require("fs");',
      '',
      `function solve(${params.join(', ')}) {`,
      '    // Viết logic tại đây',
      '}',
      '',
      'function main() {',
      '    const raw = fs.readFileSync(0, "utf8").trim();',
      '    const input = raw.length ? raw.split(/\\s+/) : [];',
      parseBlock,
      `    const result = solve(${callArgs});`,
      '    if (result !== undefined) {',
      '        console.log(result);',
      '    }',
      '}',
      '',
      'main();',
    ].join('\n');
  }

  if (lang === 'JAVA') {
    if (arity === 0) {
      return [
        'import java.io.*;',
        '',
        'public class Main {',
        '    static void solve() throws IOException {',
        '        // Viết logic tại đây',
        '    }',
        '',
        '    public static void main(String[] args) throws IOException {',
        '        solve();',
        '    }',
        '}',
      ].join('\n');
    }
    const readLines = params
      .map((p) => `        int ${p} = Integer.parseInt(br.readLine().trim());`)
      .join('\n');
    const sig = params.map((p) => `int ${p}`).join(', ');
    const callArgs = params.join(', ');
    return [
      'import java.io.*;',
      '',
      'public class Main {',
      `    static int solve(${sig}) throws IOException {`,
      '        // Viết logic tại đây',
      '        return 0;',
      '    }',
      '',
      '    public static void main(String[] args) throws IOException {',
      '        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
      readLines,
      `        System.out.println(solve(${callArgs}));`,
      '    }',
      '}',
    ].join('\n');
  }

  if (lang === 'GO') {
    if (arity === 0) {
      return [
        'package main',
        '',
        'import "fmt"',
        '',
        'func solve() {',
        '\t// Viết logic tại đây',
        '}',
        '',
        'func main() {',
        '\tsolve()',
        '}',
      ].join('\n');
    }
    const sig = params.map((p) => `${p} int`).join(', ');
    const scanVars = params.join(', ');
    const scanRefs = params.map((p) => `&${p}`).join(', ');
    const callArgs = params.join(', ');
    return [
      'package main',
      '',
      'import "fmt"',
      '',
      `func solve(${sig}) int {`,
      '\t// Viết logic tại đây',
      '\treturn 0',
      '}',
      '',
      'func main() {',
      `\tvar ${scanVars}`,
      `\tfmt.Scan(${scanRefs})`,
      `\tfmt.Println(solve(${callArgs}))`,
      '}',
    ].join('\n');
  }

  if (lang === 'RUST') {
    if (arity === 0) {
      return [
        'use std::io::{self, Write};',
        '',
        'fn solve() {',
        '    // Viết logic tại đây',
        '}',
        '',
        'fn main() {',
        '    solve();',
        '}',
      ].join('\n');
    }
    const readLines = params
      .map((p) => {
        return [
          `    let mut ${p}_line = String::new();`,
          `    io::stdin().read_line(&mut ${p}_line).unwrap();`,
          `    let ${p}: i32 = ${p}_line.trim().parse().unwrap();`,
        ].join('\n');
      })
      .join('\n');
    const sig = params.map((p) => `${p}: i32`).join(', ');
    const callArgs = params.join(', ');
    return [
      'use std::io::{self, Write};',
      '',
      `fn solve(${sig}) -> i32 {`,
      '    // Viết logic tại đây',
      '    0',
      '}',
      '',
      'fn main() {',
      readLines,
      `    println!("{}", solve(${callArgs}));`,
      '}',
    ].join('\n');
  }

  return [
    `// Starter template (${lang})`,
    '// Viết logic tại đây',
    'int main() {',
    '    return 0;',
    '}',
  ].join('\n');
}

function normalizeSupportedLanguages(supportedLanguages?: string[] | null): string[] {
  if (!supportedLanguages?.length) {
    return [...DEFAULT_SUPPORTED_LANGUAGES];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const lang of supportedLanguages) {
    const key = lang.trim().toUpperCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out.length > 0 ? out : [...DEFAULT_SUPPORTED_LANGUAGES];
}

function parseTemplateCodeRecord(
  templateCode: unknown,
): Record<string, string> {
  if (!templateCode || typeof templateCode !== 'object' || Array.isArray(templateCode)) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(templateCode as Record<string, unknown>)) {
    if (typeof value === 'string') {
      out[key.trim().toUpperCase()] = value;
    }
  }
  return out;
}

/**
 * Gộp templateCode từ DB/DTO với mẫu mặc định cho từng ngôn ngữ còn thiếu hoặc rỗng.
 */
export function resolveTemplateCode(
  supportedLanguages: string[] | null | undefined,
  templateCode: unknown,
  testCases?: TestCaseInput[],
): Record<string, string> {
  const langs = normalizeSupportedLanguages(supportedLanguages);
  const existing = parseTemplateCodeRecord(templateCode);
  const arity = inferInputArityFromTestCases(testCases);
  const resolved: Record<string, string> = {};

  for (const lang of langs) {
    const current = existing[lang];
    if (typeof current === 'string' && current.trim()) {
      resolved[lang] = current;
    } else {
      resolved[lang] = buildDefaultTemplateForLanguage(lang, arity);
    }
  }

  return resolved;
}

/** Áp dụng template mặc định lên object problem trả về API (Prisma Json → Record). */
export function withResolvedTemplateCode<
  T extends {
    supportedLanguages: unknown;
    templateCode: unknown;
    testCases?: TestCaseInput[];
  },
>(problem: T): T & { templateCode: Record<string, string> } {
  const supported = Array.isArray(problem.supportedLanguages)
    ? (problem.supportedLanguages as string[])
    : undefined;

  return {
    ...problem,
    templateCode: resolveTemplateCode(
      supported,
      problem.templateCode,
      problem.testCases,
    ),
  };
}
