'use client';

import { FormEvent, useState } from 'react';
import { SectionCard } from './SectionCard';
import { WeatherSnapshot } from '@/lib/types';

interface WeatherSnapshotPanelProps {
  selectedApplicationId: string | null;
  weather: WeatherSnapshot | null;
  onFetchWeather(stationId: string): Promise<void>;
}

export function WeatherSnapshotPanel({ selectedApplicationId, weather, onFetchWeather }: WeatherSnapshotPanelProps) {
  const [stationId, setStationId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedApplicationId) {
      setError('Select an application first.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onFetchWeather(stationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch weather');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionCard
      title="Weather snapshot"
      description="Call the FastAPI weather endpoint (Blynk webhook) to enrich the current application."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-surface-200/60 p-4">
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-300">
          Blynk station ID
          <input
            type="text"
            value={stationId}
            onChange={(event) => setStationId(event.target.value)}
            placeholder="station-uuid"
          />
        </label>
        <button
          type="submit"
          disabled={!selectedApplicationId || submitting}
          className="rounded-md bg-gradient-to-r from-brand to-accent px-3 py-2 text-sm font-semibold text-white shadow transition hover:from-brand-light hover:to-accent-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Requesting…' : 'Fetch weather'}
        </button>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </form>

      {weather ? (
        <div className="rounded-xl border border-accent/60 bg-surface-100/60 p-4 text-sm text-slate-100">
          <h3 className="text-sm font-semibold text-accent-light">Latest snapshot</h3>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="uppercase tracking-wide text-slate-400">Wind speed</dt>
              <dd className="text-slate-100">{weather.windSpeedMs ?? '—'} m/s</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide text-slate-400">Wind direction</dt>
              <dd className="text-slate-100">{weather.windDirectionDeg ?? '—'}°</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide text-slate-400">Temperature</dt>
              <dd className="text-slate-100">{weather.temperatureC ?? '—'} °C</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide text-slate-400">Humidity</dt>
              <dd className="text-slate-100">{weather.humidityPct ?? '—'} %</dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-white/10 bg-surface-100/40 p-4 text-xs text-slate-400">
          Weather telemetry appears here once requested for the selected application.
        </p>
      )}
    </SectionCard>
  );
}
