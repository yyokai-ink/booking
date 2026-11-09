export type PaymentProviderCode = 'TEST' | 'STRIPE' | 'LIQPAY' | 'WAYFORPAY';

export interface CheckoutInput {
  paymentId: string; // our Payment.id — travels through the provider and comes back in the webhook
  amountMinor: number;
  currency: string;
  description: string;
  locale: string;
}
export interface CheckoutSession { redirectUrl: string; providerPaymentId: string }

export type WebhookEventType = 'payment.succeeded' | 'payment.failed' | 'payment.refunded';
export interface ParsedWebhookEvent {
  eventId: string; // used for idempotency (WebhookEvent unique [provider, eventId])
  type: WebhookEventType;
  paymentId: string;
  providerPaymentId: string;
  amountMinor: number;
  currency: string;
}

export class WebhookVerificationError extends Error {
  constructor(message = 'Invalid webhook signature') { super(message); this.name = 'WebhookVerificationError'; }
}
export class ProviderNotConfiguredError extends Error {
  constructor(public readonly provider: PaymentProviderCode) {
    super(`Payment provider ${provider} is not implemented/configured yet`);
    this.name = 'ProviderNotConfiguredError';
  }
}

export interface PaymentProvider {
  readonly code: PaymentProviderCode;
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;
  /** MUST verify the signature over the RAW body before trusting anything in it. Throws WebhookVerificationError. */
  verifyAndParseWebhook(rawBody: string, headers: Headers): ParsedWebhookEvent;
}
