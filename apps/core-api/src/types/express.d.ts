import type { RequestUser } from '../common/interfaces/request-user.interface';

/** Cho TypeScript biết `req.user` sau Passport JWT là `RequestUser`. */
declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends RequestUser {}
  }
}

export {};
