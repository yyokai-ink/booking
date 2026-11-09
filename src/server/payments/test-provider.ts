import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { WebhookVerificationError, type CheckoutInput, type CheckoutSession, type ParsedWebhookEvent, type PaymentProvider } from './types';

export const TEST_SIGNATURE_HEADER = 'x-lumera-test-signature';

const bodySchema = z.object({
  id: z.string().min(1),
  type: z.enum(['payment.succeeded', 'payment.failed', 'payment.refunded']),
  paymentId: z.string().min(1),
  providerPaymentId: z.string().min(1),
  amountMinor: z.number().int().positive(),
  currency: z.string().length(3),
});

export function signTestPayload(secret: string, rawBody: string): string {
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

/**
 * Development/test provider. It is NOT a fake "real" payment: the UI must label it as a test payment,
 * and it is refused in production unless ALLOW_TEST_PAYMENTS=true. Webhook verification is real HMAC,
 * so the production webhook code path is exercised in development.
 */
export class TestPaymentProvider implements PaymentProvider {
  readonly code = 'TEST' as const;
  constructor(private readonly secret: string, private readonly appUrl: string) {}

  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    return {
      providerPaymentId: `test_${input.paymentId}`,
      redirectUrl: `${this.appUrl}/${input.locale}/pay/test/${input.paymentId}`, // page arrives in Stage 4
    };
  }

  verifyAndParseWebhook(rawBody: string, headers: Headers): ParsedWebhookEvent {
    const given = headers.get(TEST_SIGNATURE_HEADER) ?? '';
    const expected = signTestPayload(this.secret, rawBody);
    const a = Buffer.from(given, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new WebhookVerificationError();
    let json: unknown;
    try { json = JSON.parse(rawBody); } catch { throw new WebhookVerificationError('Malformed webhook body'); }
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) throw new WebhookVerificationError('Unexpected webhook payload');
    const { id, ...rest } = parsed.data;
    return { eventId: id, ...rest };
  }
}
