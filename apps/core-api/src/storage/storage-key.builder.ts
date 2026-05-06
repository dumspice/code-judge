import { randomUUID } from 'crypto';

function sanitizeSegment(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, '-');
}

export function buildAvatarObjectKey(userId: string, extension = 'bin'): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `avatars/${sanitizeSegment(userId)}/${year}/${month}/${randomUUID()}.${sanitizeSegment(extension)}`;
}

export function buildSubmissionSourceObjectKey(
  submissionId: string,
  fileName = 'source.txt',
): string {
  return `submissions/${sanitizeSegment(submissionId)}/source/${sanitizeSegment(fileName)}`;
}

export function buildSubmissionArtifactObjectKey(
  submissionId: string,
  artifactName: string,
): string {
  return `submissions/${sanitizeSegment(submissionId)}/artifacts/${sanitizeSegment(artifactName)}`;
}

export function buildGoldenSolutionObjectKey(
  problemId: string,
  goldenSolutionId: string,
  fileName: string,
): string {
  return `golden-solutions/${sanitizeSegment(problemId)}/${sanitizeSegment(goldenSolutionId)}/${sanitizeSegment(fileName)}`;
}

export function buildAiInputObjectKey(jobId: string, fileName: string): string {
  return `ai-jobs/${sanitizeSegment(jobId)}/input/${sanitizeSegment(fileName)}`;
}

export function buildAiGeneratedTestcaseObjectKeys(jobId: string, index: number) {
  return {
    input: `ai-jobs/${sanitizeSegment(jobId)}/generated-testcases/${index}/input.txt`,
    expected: `ai-jobs/${sanitizeSegment(jobId)}/generated-testcases/${index}/expected.txt`,
  };
}

export function buildExportObjectKey(contestId: string, exportId: string, extension: string): string {
  return `exports/${sanitizeSegment(contestId)}/${sanitizeSegment(exportId)}.${sanitizeSegment(extension)}`;
}
