import { getEnv } from '../env';
import { TestPaymentProvider } from './test-provider';
import { ProviderNotConfiguredError, type PaymentProvider, type PaymentProviderCode } from './types';

/**
 * Add a provider = implement `PaymentProvider` + register it here + add its env vars.
 * STRIPE / LIQPAY / WAYFORPAY are explicit integration points: they throw until implemented in Stage 4.
 */
export function getPaymentProvider(code: PaymentProviderCode): PaymentProvider {
  const env = getEnv();
  const enabled = env.PAYMENT_PROVIDERS.split(',').map((s) => s.trim().toUpperCase());
  if (!enabled.includes(code)) throw new ProviderNotConfiguredError(code);

  switch (code) {
    case 'TEST': {
      if (env.NODE_ENV === 'production' && env.ALLOW_TEST_PAYMENTS !== 'true') throw new ProviderNotConfiguredError(code);
      return new TestPaymentProvider(env.AUTH_SECRET, env.APP_URL);
    }
    case 'STRIPE':
    case 'LIQPAY':
    case 'WAYFORPAY':
      throw new ProviderNotConfiguredError(code); // TODO(Stage 4): real implementation
  }
}
