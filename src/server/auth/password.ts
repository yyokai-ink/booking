import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';

// scrypt (built into Node, memory-hard). Format: scrypt$N$r$p$salt$hash (base64url). Params are stored per hash,
// so they can be raised later and old hashes still verify.
const N = 16384, R = 8, P = 1, KEYLEN = 64;

function derive(password: string, salt: Buffer, n: number, r: number, p: number, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(password.normalize('NFKC'), salt, keylen, { N: n, r, p, maxmem: 128 * n * r * 2 }, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P, KEYLEN);
  return ['scrypt', N, R, P, salt.toString('base64url'), key.toString('base64url')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'scrypt' || !n || !r || !p || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64url');
  const actual = await derive(password, Buffer.from(saltB64, 'base64url'), Number(n), Number(r), Number(p), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export type PasswordIssue = 'too_short' | 'too_long' | 'too_common' | 'needs_variety';
const COMMON = new Set(['password123', '1234567890', 'qwertyuiop', 'password1234', '12345678910']);

export function checkPasswordStrength(password: string): PasswordIssue[] {
  const issues: PasswordIssue[] = [];
  if (password.length < 10) issues.push('too_short');
  if (password.length > 128) issues.push('too_long');
  if (COMMON.has(password.toLowerCase())) issues.push('too_common');
  const classes = [/[a-zа-яіїєґ]/, /[A-ZА-ЯІЇЄҐ]/, /\d/, /[^\w\s]/].filter((re) => re.test(password)).length;
  if (classes < 3) issues.push('needs_variety');
  return issues;
}
