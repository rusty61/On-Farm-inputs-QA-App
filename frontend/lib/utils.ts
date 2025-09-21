export function cn(...inputs: Array<string | undefined | null | false>) {
  return inputs.filter(Boolean).join(' ');
}

export function formatDate(date: string | number | Date) {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}
