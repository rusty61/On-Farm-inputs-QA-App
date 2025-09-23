'use client';

import { FormEvent, useState } from 'react';
import { Mix, MixItem } from '@/lib/types';
import { SectionCard } from './SectionCard';
import { formatDate } from '@/lib/utils';

interface MixBuilderProps {
  mixes: Mix[];
  selectedOwnerId: string | null;
  selectedMixId: string | null;
  onSelectMix(mixId: string): void;
  onCreateMix(ownerId: string, payload: { name: string; totalWaterL: number; items: Array<Omit<MixItem, 'id'>> }): Promise<void>;
}

interface DraftItem {
  chemical: string;
  rateLPerHa: string;
  notes?: string;
}

export function MixBuilder({ mixes, selectedOwnerId, selectedMixId, onSelectMix, onCreateMix }: MixBuilderProps) {
  const [name, setName] = useState('');
  const [water, setWater] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [itemDraft, setItemDraft] = useState<DraftItem>({ chemical: '', rateLPerHa: '', notes: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addDraftItem = () => {
    if (!itemDraft.chemical || !itemDraft.rateLPerHa) {
      return;
    }
    setItems((prev) => [...prev, itemDraft]);
    setItemDraft({ chemical: '', rateLPerHa: '', notes: '' });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedOwnerId) {
      setError('Select an owner first.');
      return;
    }
    if (!items.length) {
      setError('Add at least one chemical.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onCreateMix(selectedOwnerId, {
        name: name.trim(),
        totalWaterL: water ? Number.parseFloat(water) : 0,
        items: items.map((item) => ({
          chemical: item.chemical.trim(),
          rateLPerHa: Number.parseFloat(item.rateLPerHa),
          notes: item.notes?.trim() || undefined
        }))
      });
      setName('');
      setWater('');
      setItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save mix');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionCard
      title="Tank mixes"
      description="Define reusable chemical mixes with total water volume per application."
      action={<span className="text-xs text-slate-300">{mixes.length} mixes</span>}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-white/10 bg-surface-200/60 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-300">
            Mix name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Fungicide + Trace elements"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-300">
            Water (L)
            <input
              type="number"
              min="0"
              step="10"
              value={water}
              onChange={(event) => setWater(event.target.value)}
              placeholder="800"
            />
          </label>
        </div>

        <div className="rounded-xl border border-dashed border-white/10 bg-surface-100/50 p-4">
          <h3 className="text-sm font-semibold text-white">Mix items</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-[2fr,1fr]">
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-300">
              Chemical
              <input
                type="text"
                value={itemDraft.chemical}
                onChange={(event) => setItemDraft((prev) => ({ ...prev, chemical: event.target.value }))}
                placeholder="Glyphosate"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-300">
              Rate (L/ha)
              <input
                type="number"
                min="0"
                step="0.1"
                value={itemDraft.rateLPerHa}
                onChange={(event) => setItemDraft((prev) => ({ ...prev, rateLPerHa: event.target.value }))}
                placeholder="1.2"
              />
            </label>
          </div>
          <label className="mt-3 flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-300">
            Notes
            <input
              type="text"
              value={itemDraft.notes ?? ''}
              onChange={(event) => setItemDraft((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Apply with low-drift nozzles"
            />
          </label>
          <button
            type="button"
            onClick={addDraftItem}
            className="mt-3 inline-flex w-fit items-center rounded-md border border-accent/60 px-3 py-1 text-xs font-semibold text-accent transition hover:bg-accent/10"
          >
            Add chemical
          </button>
          {items.length ? (
            <ul className="mt-4 flex flex-col gap-2 text-xs">
              {items.map((item, index) => (
                <li key={`${item.chemical}-${index}`} className="flex items-center justify-between rounded-lg bg-surface-100/60 px-3 py-2">
                  <div>
                    <p className="font-semibold text-slate-100">{item.chemical}</p>
                    <p className="text-slate-400">{item.rateLPerHa} L/ha</p>
                    {item.notes ? <p className="text-slate-500">{item.notes}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-slate-400">Add chemicals to build the mix components.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!selectedOwnerId || submitting}
          className="rounded-md bg-gradient-to-r from-brand to-accent px-3 py-2 text-sm font-semibold text-white shadow transition hover:from-brand-light hover:to-accent-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save mix'}
        </button>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </form>

      <ul className="flex flex-col gap-2">
        {mixes.map((mix) => (
          <li key={mix.id}>
            <button
              type="button"
              onClick={() => onSelectMix(mix.id)}
              className={`flex w-full flex-col rounded-xl border px-4 py-3 text-left transition ${
                selectedMixId === mix.id
                  ? 'border-accent/60 bg-surface-200/80 text-white shadow'
                  : 'border-white/10 bg-surface-100/60 text-slate-200 hover:border-accent/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{mix.name}</span>
                <span className="text-xs text-slate-400">{formatDate(mix.createdAt)}</span>
              </div>
              <p className="mt-2 text-xs text-slate-300">
                Water {mix.totalWaterL} L — {mix.items.length} component{mix.items.length === 1 ? '' : 's'}
              </p>
            </button>
          </li>
        ))}
        {mixes.length === 0 ? (
          <li className="rounded-xl border border-dashed border-white/10 bg-surface-100/40 p-4 text-xs text-slate-400">
            Create a mix to unlock application drafting.
          </li>
        ) : null}
      </ul>
    </SectionCard>
  );
}
