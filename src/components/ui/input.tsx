import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string; error?: string; hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hint, className, id, ...props }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  const descId = error || hint ? `${inputId}-desc` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-sm font-medium">{label}</label>
      <input
        ref={ref} id={inputId} aria-invalid={error ? true : undefined} aria-describedby={descId}
        className={cn(
          'min-h-touch w-full rounded-md border bg-surface px-3 text-fg placeholder:text-fg-muted/70',
          error ? 'border-danger' : 'border-border hover:border-fg-muted', className,
        )}
        {...props}
      />
      {(error || hint) && <p id={descId} className={cn('text-sm', error ? 'text-danger' : 'text-fg-muted')}>{error ?? hint}</p>}
    </div>
  );
});
