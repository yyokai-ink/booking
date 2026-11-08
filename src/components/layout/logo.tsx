import { cn } from '@/lib/cn';

/** Temporary original mark — replace public/icons/* and this component when the real brand is ready. */
export function Logo({ className, withText = true, name = 'Lumera' }: { className?: string; withText?: boolean; name?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-extrabold tracking-tight', className)}>
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <rect width="32" height="32" rx="9" className="fill-brand" />
        <path d="M16 6c1.2 5 3.8 7.6 8.8 8.8-5 1.2-7.6 3.8-8.8 8.8-1.2-5-3.8-7.6-8.8-8.8C12.2 13.6 14.8 11 16 6Z" className="fill-accent" />
      </svg>
      {withText && <span className="text-lg">{name}</span>}
    </span>
  );
}
