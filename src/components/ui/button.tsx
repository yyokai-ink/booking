import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg' | 'icon';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-brand-fg hover:bg-brand/90 shadow-card',
  secondary: 'bg-surface text-fg border border-border hover:bg-muted',
  ghost: 'text-fg hover:bg-muted',
  danger: 'bg-danger text-white hover:bg-danger/90',
};
const sizes: Record<ButtonSize, string> = {
  md: 'min-h-touch px-4 text-sm',
  lg: 'min-h-[3.25rem] px-6 text-base',
  icon: 'min-h-touch min-w-touch px-0',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(
    'inline-flex select-none items-center justify-center gap-2 rounded-md font-semibold transition-colors',
    'disabled:pointer-events-none disabled:opacity-50',
    variants[variant], sizes[size], className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant; size?: ButtonSize; loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, loading, disabled, className, children, type = 'button', ...props }, ref,
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClasses(variant, size, className)} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
