'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Farm, Paddock } from '@/lib/types';
import { SectionCard } from './SectionCard';
import { formatDate } from '@/lib/utils';
import { getCurrentPosition } from '@/lib/geolocation';

interface PaddockManagerProps {
  paddocks: Paddock[];
  farms: Farm[];
  selectedOwnerId: string | null;
  selectedFarmId: string | null;
  onSelectFarm(farmId: string): void;
  onCreatePaddock(payload: { ownerId: string; farmId: string; name: string; areaHectares?: number }): Promise<void>;
  onCaptureGps(paddockId: string, payload: { latitude: number; longitude: number; accuracy?: number }): Promise<void>;
}

export function PaddockManager({
  paddocks,
  farms,
  selectedOwnerId,
  selectedFarmId,
  onSelectFarm,
  onCreatePaddock,
  onCaptureGps
}: PaddockManagerProps) {
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  const filteredPaddocks = useMemo(
    () =>
      paddocks.filter((paddock) => {
        if (selectedFarmId) {
          return paddock.farmId === selectedFarmId;
        }
        if (selectedOwnerId) {
          return paddock.ownerId === selectedOwnerId;
        }
        return true;
      }),
    [paddocks, selectedFarmId, selectedOwnerId]
  );

  const ownerFarms = useMemo(
    () => farms.filter((farm) => !selectedOwnerId || farm.ownerId === selectedOwnerId),
    [farms, selectedOwnerId]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedOwnerId || !selectedFarmId) {
      setError('Select owner and farm first.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onCreatePaddock({
        ownerId: selectedOwnerId,
        farmId: selectedFarmId,
        name: name.trim(),
        areaHectares: area ? Number.parseFloat(area) : undefined
      });
      setName('');
      setArea('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create paddock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGpsCapture = async (paddockId: string) => {
    setGpsStatus('Capturing GPS…');
    try {
      const result = await getCurrentPosition();
      await onCaptureGps(paddockId, {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy
      });
      setGpsStatus('GPS captured successfully.');
      setTimeout(() => setGpsStatus(null), 4000);
    } catch (err) {
      setGpsStatus(err instanceof Error ? err.message : 'Unable to capture GPS.');
    }
  };

  return (
    <SectionCard
      title="Paddocks"
      description="Capture GPS telemetry per paddock to support QA geofencing."
      action={
        <select
          value={selectedFarmId ?? ''}
          onChange={(event) => onSelectFarm(event.target.value)}
          className="w-44 text-xs"
        >
          <option value="">All farms</option>
          {ownerFarms.map((farm) => (
            <option value={farm.id} key={farm.id}>
              {farm.name}
            </option>
          ))}
        </select>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
            Paddock name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Block 7 East"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
            Area (ha)
            <input
              type="number"
              min="0"
              step="0.1"
              value={area}
              onChange={(event) => setArea(event.target.value)}
              placeholder="12.5"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={!selectedOwnerId || !selectedFarmId || submitting}
          className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Add paddock'}
        </button>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
        {gpsStatus ? <p className="text-xs text-emerald-400">{gpsStatus}</p> : null}
      </form>

      <ul className="flex flex-col gap-2">
        {filteredPaddocks.map((paddock) => (
          <li key={paddock.id}>
            <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{paddock.name}</p>
                  {paddock.areaHectares ? (
                    <p className="text-xs text-slate-400">Area: {paddock.areaHectares.toFixed(1)} ha</p>
                  ) : null}
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{formatDate(paddock.gpsCapturedAt ?? paddock.createdAt ?? new Date().toISOString())}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                {paddock.gpsPoint ? (
                  <p className="rounded-md bg-slate-900 px-3 py-1 text-slate-200">
                    Lat {paddock.gpsPoint.latitude.toFixed(5)}, Lng {paddock.gpsPoint.longitude.toFixed(5)}
                    {paddock.gpsAccuracyM ? ` (±${paddock.gpsAccuracyM.toFixed(1)} m)` : ''}
                  </p>
                ) : (
                  <p className="text-slate-400">GPS not captured yet.</p>
                )}
                <button
                  type="button"
                  onClick={() => handleGpsCapture(paddock.id)}
                  className="rounded-md border border-brand px-3 py-1 text-xs font-semibold text-brand transition hover:bg-brand/10"
                >
                  Capture GPS
                </button>
              </div>
            </div>
          </li>
        ))}
        {filteredPaddocks.length === 0 ? (
          <li className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-4 text-xs text-slate-400">
            {selectedFarmId
              ? 'No paddocks captured for this farm yet.'
              : 'Filter by farm to manage paddock GPS telemetry.'}
          </li>
        ) : null}
      </ul>
    </SectionCard>
  );
}
