import { randomBytes } from 'crypto';

export function generateClassCode(): string {
    return randomBytes(3).toString('hex').toUpperCase();
}