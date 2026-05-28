import { ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface CardProps {
  title?: ReactNode;
  hint?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Card({ title, hint, actions, children, className, bodyClassName }: CardProps) {
  return (
    <div className={cn('card', className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <div className="card-title">{title}</div>}
            {hint && <div className="mt-1 text-2xs text-mute">{hint}</div>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(title || actions ? 'mt-4' : '', bodyClassName)}>{children}</div>
    </div>
  );
}
