import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function SectionCard({ title, description, action, className, children }: SectionCardProps) {
  return (
    <section
      className={cn(
        'flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg transition hover:border-slate-700',
        className
      )}
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-300">{description}</p> : null}
        </div>
        {action ? <div className="flex items-center gap-2 text-sm text-slate-300">{action}</div> : null}
      </header>
      <div className="flex flex-1 flex-col gap-4 text-sm text-slate-200">{children}</div>
    </section>
  );
}
