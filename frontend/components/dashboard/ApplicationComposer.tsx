'use client';

import { ChangeEvent, FormEvent } from 'react';
import {
  ApplicationDraft,
  ApplicationSummary,
  Farm,
  Mix,
  Owner,
  Paddock
} from '@/lib/types';
import { SectionCard } from './SectionCard';
import { formatDate } from '@/lib/utils';

interface ApplicationComposerProps {
  draft: ApplicationDraft;
  owners: Owner[];
  farms: Farm[];
  paddocks: Paddock[];
  mixes: Mix[];
  applications: ApplicationSummary[];
  selectedApplicationId: string | null;
  onDraftChange(draft: ApplicationDraft): void;
  onCreate(draft: ApplicationDraft): Promise<void>;
  onSelectApplication(applicationId: string): void;
  onFinalize(applicationId: string): Promise<void>;
  loading?: boolean;
}

export function ApplicationComposer({
  draft,
  owners,
  farms,
  paddocks,
  mixes,
  applications,
  selectedApplicationId,
  onDraftChange,
  onCreate,
  onSelectApplication,
  onFinalize,
  loading
}: ApplicationComposerProps) {
  const ownerFarms = farms.filter((farm) => !draft.ownerId || farm.ownerId === draft.ownerId);
  const ownerPaddocks = paddocks.filter((paddock) => !draft.ownerId || paddock.ownerId === draft.ownerId);
  const ownerMixes = mixes.filter((mix) => !draft.ownerId || mix.ownerId === draft.ownerId);

  const handleDraftChange = (changes: Partial<ApplicationDraft>) => {
    onDraftChange({ ...draft, ...changes });
  };

  const handleOwnerChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const ownerId = event.target.value || null;
    handleDraftChange({
      ownerId,
      farmId: null,
      paddockIds: [],
      mixId: null
    });
  };

  const handleFarmChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const farmId = event.target.value || null;
    const farmPaddockIds = ownerPaddocks.filter((p) => p.farmId === farmId).map((p) => p.id);
    const filteredSelection = draft.paddockIds.filter((id) => farmPaddockIds.includes(id));
    handleDraftChange({ farmId, paddockIds: filteredSelection });
  };

  const handleMixChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const mixId = event.target.value || null;
    handleDraftChange({ mixId });
  };

  const togglePaddockSelection = (paddockId: string) => {
    const current = new Set(draft.paddockIds);
    if (current.has(paddockId)) {
      current.delete(paddockId);
    } else {
      current.add(paddockId);
    }
    handleDraftChange({ paddockIds: Array.from(current) });
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onCreate(draft);
  };

  return (
    <SectionCard
      title="Spray applications"
      description="Draft spray applications by selecting mix, paddocks, telemetry, and operator details."
    >
      <form onSubmit={handleCreate} className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
            Owner
            <select value={draft.ownerId ?? ''} onChange={handleOwnerChange} required className="mt-1">
              <option value="">Select owner</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
            Farm
            <select value={draft.farmId ?? ''} onChange={handleFarmChange} className="mt-1">
              <option value="">All farms</option>
              {ownerFarms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-2 text-xs uppercase tracking-wide text-slate-400">
          Mix
          <select value={draft.mixId ?? ''} onChange={handleMixChange} required className="mt-1">
            <option value="">Select mix</option>
            {ownerMixes.map((mix) => (
              <option key={mix.id} value={mix.id}>
                {mix.name}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-4">
          <h3 className="text-sm font-semibold text-white">Paddocks</h3>
          <p className="mt-1 text-xs text-slate-400">
            Capture at least one paddock. GPS telemetry recorded earlier will attach automatically.
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {ownerPaddocks.map((paddock) => (
              <label
                key={paddock.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                  draft.paddockIds.includes(paddock.id)
                    ? 'border-brand bg-brand/10 text-white'
                    : 'border-slate-800 bg-slate-950/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={draft.paddockIds.includes(paddock.id)}
                  onChange={() => togglePaddockSelection(paddock.id)}
                  className="h-4 w-4 accent-brand"
                />
                <span>{paddock.name}</span>
              </label>
            ))}
            {ownerPaddocks.length === 0 ? (
              <p className="text-xs text-slate-500">Capture paddocks for this owner to start planning applications.</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
            Operator name
            <input
              type="text"
              value={draft.operatorName}
              onChange={(event) => handleDraftChange({ operatorName: event.target.value })}
              placeholder="Jess Chambers"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
            Water source
            <input
              type="text"
              value={draft.waterSource ?? ''}
              onChange={(event) => handleDraftChange({ waterSource: event.target.value })}
              placeholder="Dam 3 — filtered"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
            Started at
            <input
              type="datetime-local"
              value={draft.startedAt.slice(0, 16)}
              onChange={(event) => handleDraftChange({ startedAt: new Date(event.target.value).toISOString() })}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
            Finished at
            <input
              type="datetime-local"
              value={draft.finishedAt ? draft.finishedAt.slice(0, 16) : ''}
              onChange={(event) =>
                handleDraftChange({ finishedAt: event.target.value ? new Date(event.target.value).toISOString() : undefined })
              }
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
          Notes
          <textarea
            value={draft.notes ?? ''}
            onChange={(event) => handleDraftChange({ notes: event.target.value })}
            placeholder="Buffer zone observed on northern boundary."
            rows={3}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Submitting…' : 'Create application'}
        </button>
      </form>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <h3 className="text-sm font-semibold text-white">Recent applications</h3>
        <p className="mt-1 text-xs text-slate-400">
          Select an application to trigger weather fetch, finalisation, or authoritative PDF exports.
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {applications.map((application) => (
            <li key={application.id}>
              <button
                type="button"
                onClick={() => onSelectApplication(application.id)}
                className={`flex w-full flex-col rounded-xl border px-4 py-3 text-left transition hover:border-brand ${
                  selectedApplicationId === application.id
                    ? 'border-brand bg-brand/10 text-white'
                    : 'border-slate-800 bg-slate-950/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Application #{application.id.slice(0, 8)}</span>
                  <span className="text-xs text-slate-400">{formatDate(application.startedAt)}</span>
                </div>
                <p className="mt-2 text-xs text-slate-300">
                  {application.paddockIds.length} paddock{application.paddockIds.length === 1 ? '' : 's'} · Mix {application.mixId.slice(0, 6)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {application.finalized ? 'Finalized and locked' : 'Draft — weather updates available'}
                </p>
              </button>
            </li>
          ))}
          {applications.length === 0 ? (
            <li className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-4 text-xs text-slate-400">
              Applications will appear here once drafted.
            </li>
          ) : null}
        </ul>
        {selectedApplicationId ? (
          <button
            type="button"
            onClick={() => onFinalize(selectedApplicationId)}
            className="mt-4 inline-flex items-center rounded-md border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/10"
          >
            Finalise application
          </button>
        ) : null}
      </div>
    </SectionCard>
  );
}
