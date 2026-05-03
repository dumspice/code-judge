/**
 * URL Core API công khai cho trình duyệt (prefix `NEXT_PUBLIC_` của Next.js).
 *
 * Dùng trong Client Components; không chứa secret.
 */
export function getPublicCoreUrl(): string {
  return process.env.NEXT_PUBLIC_CORE_URL ?? 'http://localhost:3000';
}
