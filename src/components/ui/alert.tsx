import type { HTMLAttributes } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

const tones = {
  info: { cls: 'border-info/30 bg-info/5 text-info', Icon: Info },
  success: { cls: 'border-success/30 bg-success/5 text-success', Icon: CheckCircle2 },
  error: { cls: 'border-danger/30 bg-danger/5 text-danger', Icon: AlertCircle },
} as const;

export function Alert({ tone = 'info', className, children, ...props }: HTMLAttributes<HTMLDivElement> & { tone?: keyof typeof tones }) {
  const { cls, Icon } = tones[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-3 rounded-md border p-3 text-sm', cls, className)} {...props}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
