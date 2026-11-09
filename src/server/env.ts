import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  APP_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  PAYMENT_PROVIDERS: z.string().default('test'),
  ALLOW_TEST_PAYMENTS: z.enum(['true', 'false']).default('false'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  LIQPAY_PUBLIC_KEY: z.string().optional(),
  LIQPAY_PRIVATE_KEY: z.string().optional(),
  WAYFORPAY_MERCHANT_ACCOUNT: z.string().optional(),
  WAYFORPAY_MERCHANT_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof schema>;
let cached: Env | undefined;

/** Lazy + cached so `next build` does not need runtime secrets. Throws a readable error when misconfigured. */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}
