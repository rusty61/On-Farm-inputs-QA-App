'use client';

import { FormEvent, useState } from 'react';
import { Owner } from '@/lib/types';
import { SectionCard } from './SectionCard';
import { formatDate } from '@/lib/utils';

interface OwnerManagerProps {
  owners: Owner[];
  selectedOwnerId: string | null;
  onSelect(ownerId: string): void;
  onCreate(name: string): Promise<void>;
  loading?: boolean;
}

export function OwnerManager({ owners, selectedOwnerId, onSelect, onCreate, loading }: OwnerManagerProps) {
  const [ownerName, setOwnerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ownerName.trim()) {
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      await onCreate(ownerName.trim());
      setOwnerName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create owner');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionCard
      title="Owners"
      description="Grower organisations anchor Supabase row-level security boundaries."
      action={<span className="text-xs text-slate-300">{owners.length} owners</span>}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-surface-200/60 p-4">
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-300">
          Owner name
          <input
            type="text"
            value={ownerName}
            onChange={(event) => setOwnerName(event.target.value)}
            placeholder="Riverbend Orchard Pty Ltd"
            className="mt-1"
          />
        </label>
        <button
          type="submit"
          disabled={submitting || loading}
          className="rounded-md bg-gradient-to-r from-brand to-accent px-3 py-2 text-sm font-semibold text-white shadow transition hover:from-brand-light hover:to-accent-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Add owner'}
        </button>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </form>

      <ul className="flex flex-col gap-2">
        {owners.map((owner) => (
          <li key={owner.id}>
            <button
              type="button"
              onClick={() => onSelect(owner.id)}
              className={`flex w-full flex-col rounded-xl border px-4 py-3 text-left transition ${
                selectedOwnerId === owner.id
                  ? 'border-accent/60 bg-surface-200/80 text-white shadow'
                  : 'border-white/10 bg-surface-100/60 text-slate-200 hover:border-accent/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{owner.name}</span>
                {owner.isLocalOnly ? (
                  <span className="text-xs uppercase text-amber-400">Offline</span>
                ) : (
                  <span className="text-xs text-slate-400">{formatDate(owner.createdAt)}</span>
                )}
              </div>
            </button>
          </li>
        ))}
        {owners.length === 0 ? (
          <li className="rounded-xl border border-dashed border-white/10 bg-surface-100/40 p-4 text-xs text-slate-400">
            No owners yet. Create one to unlock farms, paddocks, mixes, and applications.
          </li>
        ) : null}
      </ul>
    </SectionCard>
  );
}
