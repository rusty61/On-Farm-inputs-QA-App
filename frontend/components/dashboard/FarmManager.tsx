'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Farm, Owner } from '@/lib/types';
import { SectionCard } from './SectionCard';
import { formatDate } from '@/lib/utils';

interface FarmManagerProps {
  owners: Owner[];
  farms: Farm[];
  selectedOwnerId: string | null;
  selectedFarmId: string | null;
  onSelectOwner(ownerId: string): void;
  onSelectFarm(farmId: string): void;
  onCreateFarm(ownerId: string, payload: { name: string; notes?: string }): Promise<void>;
}

export function FarmManager({
  owners,
  farms,
  selectedOwnerId,
  selectedFarmId,
  onSelectOwner,
  onSelectFarm,
  onCreateFarm
}: FarmManagerProps) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredFarms = useMemo(
    () => farms.filter((farm) => !selectedOwnerId || farm.ownerId === selectedOwnerId),
    [farms, selectedOwnerId]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedOwnerId) {
      setError('Select an owner first.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onCreateFarm(selectedOwnerId, { name: name.trim(), notes: notes.trim() || undefined });
      setName('');
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create farm');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionCard
      title="Farms"
      description="Manage farm records per owner, including notes on boundaries or spray instructions."
      action={
        <select
          value={selectedOwnerId ?? ''}
          onChange={(event) => onSelectOwner(event.target.value)}
          className="w-44 text-xs"
        >
          <option value="">All owners</option>
          {owners.map((owner) => (
            <option value={owner.id} key={owner.id}>
              {owner.name}
            </option>
          ))}
        </select>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-surface-200/60 p-4">
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-300">
          Farm name
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="North Block"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-300">
          Notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Boundary fences, spray buffers, etc."
            rows={2}
          />
        </label>
        <button
          type="submit"
          disabled={!selectedOwnerId || submitting}
          className="rounded-md bg-gradient-to-r from-brand to-accent px-3 py-2 text-sm font-semibold text-white shadow transition hover:from-brand-light hover:to-accent-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Add farm'}
        </button>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </form>

      <ul className="flex flex-col gap-2">
        {filteredFarms.map((farm) => (
          <li key={farm.id}>
            <button
              type="button"
              onClick={() => onSelectFarm(farm.id)}
              className={`flex w-full flex-col rounded-xl border px-4 py-3 text-left transition ${
                selectedFarmId === farm.id
                  ? 'border-accent/60 bg-surface-200/80 text-white shadow'
                  : 'border-white/10 bg-surface-100/60 text-slate-200 hover:border-accent/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{farm.name}</span>
                <span className="text-xs text-slate-400">{formatDate(farm.createdAt)}</span>
              </div>
              {farm.notes ? <p className="mt-2 text-xs text-slate-300">{farm.notes}</p> : null}
            </button>
          </li>
        ))}
        {filteredFarms.length === 0 ? (
          <li className="rounded-xl border border-dashed border-white/10 bg-surface-100/40 p-4 text-xs text-slate-400">
            {selectedOwnerId ? 'No farms for this owner yet.' : 'Filter by owner to view farms or create a new one.'}
          </li>
        ) : null}
      </ul>
    </SectionCard>
  );
}
