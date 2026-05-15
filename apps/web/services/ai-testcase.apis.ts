/**
 * Core API `/ai-testcase` — verify draft test cases against a golden solution.
 */

import { apiFetch } from './api-client';

export type VerifyGoldenVerdict =
  | 'OK'
  | 'WRONG_ANSWER'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT'
  | 'PYTHON_NOT_FOUND';

export interface VerifyTestcasesWithGoldenResult {
  language: string;
  goldenSource: 'inline' | 'database';
  goldenSolutionId?: string;
  summary: { total: number; passed: number; failed: number };
  results: Array<{
    index: number;
    passed: boolean;
    expectedOutput: string;
    actualOutput?: string;
    stderr?: string;
    verdict: VerifyGoldenVerdict;
  }>;
}

export interface VerifyTestcasesWithGoldenBody {
  problemId?: string;
  goldenSolutionId?: string;
  goldenSourceCode?: string;
  testCases?: Array<{ input: string; expectedOutput: string }>;
  usePersistedTestCases?: boolean;
  language?: string;
  timeLimitMsPerCase?: number;
}

export const aiTestcaseApi = {
  async verifyTestcasesWithGolden(
    body: VerifyTestcasesWithGoldenBody,
    options?: RequestInit,
  ): Promise<VerifyTestcasesWithGoldenResult> {
    return apiFetch('/ai-testcase/verify-testcases-with-golden', {
      ...options,
      method: 'POST',
      body,
    });
  },
};
