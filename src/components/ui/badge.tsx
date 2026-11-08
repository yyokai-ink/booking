import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const tones = {
  neutral: 'bg-muted text-fg', brand: 'bg-brand-soft text-brand', success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning', danger: 'bg-danger/10 text-danger',
} as const;

export function Badge({ tone = 'neutral', className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)} {...props} />;
}
