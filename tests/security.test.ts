import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, checkPasswordStrength } from '@/server/auth/password';
import { createRateLimiter } from '@/server/security/rate-limit';
import { sniffMime, validateUpload, UPLOAD_LIMITS } from '@/server/security/upload';
import { TestPaymentProvider, signTestPayload, TEST_SIGNATURE_HEADER } from '@/server/payments/test-provider';
import { WebhookVerificationError } from '@/server/payments/types';

describe('passwords', () => {
  it('hashes with a random salt and verifies', async () => {
    const h1 = await hashPassword('Correct-Horse-9');
    const h2 = await hashPassword('Correct-Horse-9');
    expect(h1 === h2).toBe(false);
    expect(h1.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('Correct-Horse-9', h1)).toBe(true);
    expect(await verifyPassword('wrong-password', h1)).toBe(false);
  });
  it('rejects malformed stored hashes instead of throwing', async () => {
    expect(await verifyPassword('x', 'plaintext')).toBe(false);
    expect(await verifyPassword('x', 'bcrypt$1$2$3$4$5')).toBe(false);
  });
  it('flags weak passwords', () => {
    expect(checkPasswordStrength('short1A!')).toContain('too_short');
    expect(checkPasswordStrength('alllowercaseletters')).toContain('needs_variety');
    expect(checkPasswordStrength('Str0ng-Passphrase!')).toEqual([]);
  });
});

describe('rate limiter', () => {
  it('blocks after the limit and recovers after the window', () => {
    const rl = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect(rl.check('ip', 0).ok).toBe(true);
    expect(rl.check('ip', 1).ok).toBe(true);
    expect(rl.check('ip', 2).ok).toBe(true);
    const blocked = rl.check('ip', 3);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(rl.check('other', 3).ok).toBe(true); // keys are independent
    expect(rl.check('ip', 1001).ok).toBe(true);
  });
});

describe('upload validation', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const html = new TextEncoder().encode('<script>alert(1)</script>');
  it('accepts a real JPEG and detects types by magic bytes', () => {
    expect(sniffMime(jpeg)).toBe('image/jpeg');
    expect(sniffMime(png)).toBe('image/png');
    expect(validateUpload({ declaredMime: 'image/jpeg', size: 1000, head: jpeg })).toEqual({ ok: true, kind: 'image', mime: 'image/jpeg' });
  });
  it('rejects a disguised file (declared image, content is HTML)', () => {
    expect(validateUpload({ declaredMime: 'image/png', size: 100, head: html })).toEqual({ ok: false, reason: 'content_mismatch' });
  });
  it('rejects SVG, executables and empty files', () => {
    expect(validateUpload({ declaredMime: 'image/svg+xml', size: 100, head: html })).toEqual({ ok: false, reason: 'unsupported_type' });
    expect(validateUpload({ declaredMime: 'application/x-msdownload', size: 100, head: jpeg })).toEqual({ ok: false, reason: 'unsupported_type' });
    expect(validateUpload({ declaredMime: 'image/jpeg', size: 0, head: jpeg })).toEqual({ ok: false, reason: 'empty' });
  });
  it('enforces size limits', () => {
    expect(validateUpload({ declaredMime: 'image/jpeg', size: UPLOAD_LIMITS.imageBytes + 1, head: jpeg })).toEqual({ ok: false, reason: 'too_large' });
  });
});

describe('payment webhook verification (test provider)', () => {
  const secret = 'unit-test-secret-unit-test-secret-1234';
  const provider = new TestPaymentProvider(secret, 'http://localhost:3000');
  const body = JSON.stringify({ id: 'evt_1', type: 'payment.succeeded', paymentId: 'pay_1', providerPaymentId: 'test_pay_1', amountMinor: 29900, currency: 'UAH' });
  const headers = (sig: string) => new Headers({ [TEST_SIGNATURE_HEADER]: sig });

  it('accepts a correctly signed payload', () => {
    const evt = provider.verifyAndParseWebhook(body, headers(signTestPayload(secret, body)));
    expect(evt.eventId).toBe('evt_1');
    expect(evt.type).toBe('payment.succeeded');
    expect(evt.amountMinor).toBe(29900);
  });
  it('rejects a missing, wrong or tampered signature', () => {
    expect(() => provider.verifyAndParseWebhook(body, new Headers())).toThrow(WebhookVerificationError);
    expect(() => provider.verifyAndParseWebhook(body, headers('deadbeef'))).toThrow(WebhookVerificationError);
    const tampered = body.replace('29900', '1');
    expect(() => provider.verifyAndParseWebhook(tampered, headers(signTestPayload(secret, body)))).toThrow(WebhookVerificationError);
  });
  it('rejects a signed but malformed payload', () => {
    const bad = JSON.stringify({ hello: 'world' });
    expect(() => provider.verifyAndParseWebhook(bad, headers(signTestPayload(secret, bad)))).toThrow(WebhookVerificationError);
  });
});
