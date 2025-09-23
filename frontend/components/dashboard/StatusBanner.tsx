'use client';

interface StatusBannerProps {
  message: string | null;
  tone?: 'success' | 'error' | 'info';
}

export function StatusBanner({ message, tone = 'info' }: StatusBannerProps) {
  if (!message) {
    return null;
  }

  const toneClasses = {
    success: 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200',
    error: 'border-red-400/60 bg-red-500/10 text-red-200',
    info: 'border-brand/60 bg-brand/20 text-brand-light'
  } as const;

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm shadow ${toneClasses[tone]}`}>
      {message}
    </div>
  );
}
