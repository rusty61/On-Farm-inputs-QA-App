'use client';

import { type FormEventHandler, type ReactNode, useMemo, useState } from 'react';
import {
  ClipboardList,
  Gauge,
  LogIn,
  LogOut,
  Save,
  ThermometerSun,
  Wind,
  Zap
} from 'lucide-react';

const PALETTES = {
  agrinet: {
    name: 'AgriNet',
    primary: '#0525a8',
    accent: '#00b300',
    secondary: '#4a80b5',
    neutral: '#e2e8f0',
    glowFrom: 'from-[#0525a8]/40',
    glowTo: 'to-[#00b300]/40',
    pillText: 'text-[#00b300]'
  }
} as const;

type PaletteKey = keyof typeof PALETTES;
type PaletteDefinition = (typeof PALETTES)[PaletteKey];

const FARMS = ['My Farm Pty Ltd', 'North Block', 'South Block'];
const PADDOCKS = ['A1', 'A2', 'B1', 'North 40', 'South 20'];
const CROPS = ['Wheat', 'Barley', 'Canola', 'Pasture'];
const CHEMICALS = ['Glyphosate 540', '2,4-D Amine', 'Trifluralin', 'MCPA', 'Atrazine'];
const NOZZLES = ['TTI-11002', 'TTI-11003', 'AIXR-11002', 'XR-110015', 'AirMix-11003'];

interface SprayRecord {
  id: string;
  date: string;
  farm: string;
  paddock: string;
  crop: string;
  chemical: string;
  rateLHa: number;
  waterLHa: number;
  windKmh: number;
  tempC: number;
  nozzle: string;
  operator: string;
  notes: string;
}

type TabKey = 'dashboard' | 'new' | 'records' | 'settings';

type RecordFormState = Omit<SprayRecord, 'id'>;

type DailyDatum = { d: string; c: number };

type RecordSummary = {
  averageRate: number;
  averageWater: number;
  averageWind: number;
  latest: SprayRecord | null;
  topOperator: { name: string; count: number } | null;
};

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 9);
const todayISO = () => new Date().toISOString().slice(0, 10);
const numberOrZero = (value: string) => (Number.isFinite(Number(value)) ? Number(value) : 0);

export default function SprayPrototypePage() {
  const [paletteKey, setPaletteKey] = useState<PaletteKey>('agrinet');
  const theme = PALETTES[paletteKey];
  const [isAuthed, setAuthed] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [records, setRecords] = useState<SprayRecord[]>([
    {
      id: uid(),
      date: todayISO(),
      farm: 'My Farm Pty Ltd',
      paddock: 'A1',
      crop: 'Wheat',
      chemical: 'Glyphosate 540',
      rateLHa: 1.5,
      waterLHa: 70,
      windKmh: 9,
      tempC: 18,
      nozzle: 'TTI-11002',
      operator: 'Russ McM',
      notes: 'Pre-sowing cleanup pass with low drift nozzle.'
    }
  ]);

  const todayCount = useMemo(
    () => records.filter((record) => record.date === todayISO()).length,
    [records]
  );

  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((record) => {
      map.set(record.date, (map.get(record.date) || 0) + 1);
    });
    const days: DailyDatum[] = [];
    for (let i = 13; i >= 0; i -= 1) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().slice(0, 10);
      days.push({ d: key.slice(5), c: map.get(key) || 0 });
    }
    return days;
  }, [records]);

  const summary = useMemo<RecordSummary>(() => {
    if (!records.length) {
      return {
        averageRate: 0,
        averageWater: 0,
        averageWind: 0,
        latest: null,
        topOperator: null
      };
    }

    const totals = records.reduce(
      (acc, record) => {
        acc.rate += record.rateLHa;
        acc.water += record.waterLHa;
        acc.wind += record.windKmh;
        acc.operators.set(record.operator, (acc.operators.get(record.operator) || 0) + 1);
        return acc;
      },
      { rate: 0, water: 0, wind: 0, operators: new Map<string, number>() }
    );

    let topOperator: RecordSummary['topOperator'] = null;
    totals.operators.forEach((count, name) => {
      if (!topOperator || count > topOperator.count) {
        topOperator = { name, count };
      }
    });

    return {
      averageRate: totals.rate / records.length,
      averageWater: totals.water / records.length,
      averageWind: totals.wind / records.length,
      latest: records[0] ?? null,
      topOperator
    };
  }, [records]);

  const handleCreateRecord = (record: RecordFormState) => {
    setRecords((prev) => [{ id: uid(), ...record }, ...prev]);
    setActiveTab('records');
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-900 bg-slate-950 text-slate-100 shadow-2xl">
      <GradientBackdrop theme={theme} />
      <div className="relative z-10 flex flex-col">
        <TopBar
          theme={theme}
          isAuthed={isAuthed}
          onSignIn={() => setAuthed(true)}
          onSignOut={() => setAuthed(false)}
        />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-10 pt-6">
          <Hero daily={dailyData} total={records.length} today={todayCount} theme={theme} />
          <TabBar activeTab={activeTab} onChange={setActiveTab} theme={theme} />
          {activeTab === 'dashboard' && <Dashboard records={records} summary={summary} theme={theme} />}
          {activeTab === 'new' && <NewRecordForm theme={theme} onSubmit={handleCreateRecord} />}
          {activeTab === 'records' && <RecordsTable data={records} theme={theme} />}
          {activeTab === 'settings' && (
            <SettingsPanel
              theme={theme}
              paletteKey={paletteKey}
              onPaletteChange={setPaletteKey}
              isAuthed={isAuthed}
              onToggleAuth={(value) => setAuthed(value)}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function GradientBackdrop({ theme }: { theme: PaletteDefinition }) {
  return (
    <>
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl"
        style={{ background: `${theme.primary}33` }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ background: `${theme.accent}44` }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: `${theme.secondary}22` }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:24px_24px]" />
    </>
  );
}

function TopBar({
  theme,
  isAuthed,
  onSignIn,
  onSignOut
}: {
  theme: PaletteDefinition;
  isAuthed: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="border-b border-white/10 bg-slate-950/70">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <img src="/trans logo-1.png" alt="AgriNet Solutions" className="h-10 w-auto" />
          <div className="text-lg font-semibold text-white">AgriNet Spray Record</div>
        </div>
        <div>
          {isAuthed ? (
            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition"
              style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})` }}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition"
              style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})` }}
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Hero({
  daily,
  total,
  today,
  theme
}: {
  daily: DailyDatum[];
  total: number;
  today: number;
  theme: PaletteDefinition;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <GlowCard theme={theme}>
        <Metric
          icon={<ClipboardList className="h-5 w-5" aria-hidden />}
          label="Total Records"
          value={String(total)}
        />
      </GlowCard>
      <GlowCard theme={theme}>
        <Metric icon={<Zap className="h-5 w-5" aria-hidden />} label="Captured Today" value={String(today)} />
      </GlowCard>
      <GlowCard theme={theme}>
        <div className="flex h-24 flex-col justify-between">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
            <span>14-day activity</span>
            <span className="text-slate-300">{daily.slice(-1)[0]?.c ?? 0} today</span>
          </div>
          <ActivitySparkline data={daily} color={theme.accent} />
        </div>
      </GlowCard>
    </section>
  );
}

function GlowCard({ children, theme }: { children: ReactNode; theme: PaletteDefinition }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-r ${theme.glowFrom} ${theme.glowTo} p-[1px]`}>
      <div className="h-full rounded-2xl bg-slate-900/80 p-4 text-slate-100">{children}</div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-md bg-slate-800/70 p-2 text-[#00b300]">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-sm text-slate-400">{label}</div>
      </div>
    </div>
  );
}

function ActivitySparkline({ data, color }: { data: DailyDatum[]; color: string }) {
  if (data.length === 0) {
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        <rect x={0} y={0} width={100} height={100} fill="transparent" />
      </svg>
    );
  }

  const maxValue = Math.max(...data.map((point) => point.c), 1);
  const polylinePoints = data
    .map((point, index) => {
      const x = data.length > 1 ? (index / (data.length - 1)) * 100 : 0;
      const y = 100 - (point.c / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  const areaPoints = `${polylinePoints} 100,100 0,100`;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
      <polygon points={areaPoints} fill={`${color}33`} stroke="none" />
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TabBar({ activeTab, onChange, theme }: { activeTab: TabKey; onChange: (tab: TabKey) => void; theme: PaletteDefinition }) {
  const tabs: { value: TabKey; label: string }[] = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'new', label: 'New Record' },
    { value: 'records', label: 'Records' },
    { value: 'settings', label: 'Settings' }
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/70 p-1 text-sm">
      <div className="grid grid-cols-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              className={`rounded-lg px-4 py-2 font-semibold transition ${
                isActive ? 'text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              style={
                isActive
                  ? { background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})` }
                  : undefined
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Dashboard({
  records,
  summary,
  theme
}: {
  records: SprayRecord[];
  summary: RecordSummary;
  theme: PaletteDefinition;
}) {
  const hasRecords = records.length > 0;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <GlowCard theme={theme}>
        <div className="flex h-full flex-col justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-400">Average mix</p>
            <h3 className="mt-1 text-2xl font-semibold text-white">{summary.averageRate.toFixed(1)} L/ha</h3>
            <p className="text-sm text-slate-400">
              Water: <span className="font-semibold text-white">{summary.averageWater.toFixed(0)} L/ha</span>
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-900/70 p-3 text-sm">
            <Gauge className="h-5 w-5 text-[#00b300]" aria-hidden />
            <span>Stable averages across {records.length} application{records.length === 1 ? '' : 's'}.</span>
          </div>
        </div>
      </GlowCard>
      <GlowCard theme={theme}>
        <div className="flex h-full flex-col gap-3">
          <p className="text-sm uppercase tracking-wide text-slate-400">Latest field note</p>
          {hasRecords && summary.latest ? (
            <>
              <h3 className="text-lg font-semibold text-white">{summary.latest.operator}</h3>
              <div className="text-sm text-slate-300">
                {summary.latest.date} — {summary.latest.farm} / {summary.latest.paddock}
              </div>
              <p className="mt-2 rounded-lg bg-slate-900/70 p-3 text-sm leading-relaxed text-slate-300">
                {summary.latest.notes || 'No additional notes recorded for this spray event.'}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-400">Add a record to see a running activity feed.</p>
          )}
        </div>
      </GlowCard>
      <GlowCard theme={theme}>
        <div className="flex h-full flex-col gap-4">
          <p className="text-sm uppercase tracking-wide text-slate-400">Crew leaderboard</p>
          {summary.topOperator ? (
            <div className="rounded-lg bg-slate-900/70 p-4">
              <p className="text-base font-semibold text-white">{summary.topOperator.name}</p>
              <p className="text-sm text-slate-400">
                {summary.topOperator.count} record{summary.topOperator.count === 1 ? '' : 's'} captured this fortnight.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No operators recorded yet.</p>
          )}
          <div className="rounded-lg bg-slate-900/60 p-4 text-sm text-slate-300">
            <p className="flex items-center gap-2">
              <ThermometerSun className="h-5 w-5 text-[#00b300]" aria-hidden />
              Average wind {summary.averageWind.toFixed(1)} km/h
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Wind readings help validate QA spray windows and droplet control.
            </p>
          </div>
        </div>
      </GlowCard>
    </div>
  );
}

function LabeledInput({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <label htmlFor={id} className="grid gap-2 text-sm text-slate-200">
      <span>{label}</span>
      {children}
    </label>
  );
}

function NewRecordForm({
  onSubmit,
  theme
}: {
  onSubmit: (record: RecordFormState) => void;
  theme: PaletteDefinition;
}) {
  const [form, setForm] = useState<RecordFormState>({
    date: todayISO(),
    farm: FARMS[0],
    paddock: PADDOCKS[0],
    crop: CROPS[0],
    chemical: CHEMICALS[0],
    rateLHa: 1,
    waterLHa: 60,
    windKmh: 0,
    tempC: 18,
    nozzle: NOZZLES[0],
    operator: '',
    notes: ''
  });

  const inputClassName =
    'w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-white/30 focus:outline-none focus:ring-0';

  const update = <K extends keyof RecordFormState>(key: K, value: RecordFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSave = form.operator.trim().length > 0 && form.waterLHa > 0 && form.rateLHa >= 0;

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (!canSave) return;
    onSubmit(form);
    setForm((prev) => ({ ...prev, notes: '' }));
  };

  return (
    <GlowCard theme={theme}>
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <LabeledInput id="date" label="Date">
            <input
              id="date"
              type="date"
              value={form.date}
              onChange={(event) => update('date', event.target.value)}
              className={inputClassName}
            />
          </LabeledInput>
          <LabeledInput id="operator" label="Operator">
            <input
              id="operator"
              value={form.operator}
              onChange={(event) => update('operator', event.target.value)}
              placeholder="Your name"
              className={inputClassName}
            />
          </LabeledInput>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <LabeledInput id="farm" label="Farm">
            <select
              id="farm"
              value={form.farm}
              onChange={(event) => update('farm', event.target.value)}
              className={inputClassName}
            >
              {FARMS.map((farm) => (
                <option key={farm} value={farm}>
                  {farm}
                </option>
              ))}
            </select>
          </LabeledInput>
          <LabeledInput id="paddock" label="Paddock">
            <select
              id="paddock"
              value={form.paddock}
              onChange={(event) => update('paddock', event.target.value)}
              className={inputClassName}
            >
              {PADDOCKS.map((paddock) => (
                <option key={paddock} value={paddock}>
                  {paddock}
                </option>
              ))}
            </select>
          </LabeledInput>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <LabeledInput id="crop" label="Crop">
            <select
              id="crop"
              value={form.crop}
              onChange={(event) => update('crop', event.target.value)}
              className={inputClassName}
            >
              {CROPS.map((crop) => (
                <option key={crop} value={crop}>
                  {crop}
                </option>
              ))}
            </select>
          </LabeledInput>
          <LabeledInput id="chemical" label="Chemical">
            <select
              id="chemical"
              value={form.chemical}
              onChange={(event) => update('chemical', event.target.value)}
              className={inputClassName}
            >
              {CHEMICALS.map((chemical) => (
                <option key={chemical} value={chemical}>
                  {chemical}
                </option>
              ))}
            </select>
          </LabeledInput>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <LabeledInput id="rateLHa" label="Product Rate (L/ha)">
            <input
              id="rateLHa"
              type="number"
              step="0.1"
              value={form.rateLHa}
              onChange={(event) => update('rateLHa', numberOrZero(event.target.value))}
              className={inputClassName}
            />
          </LabeledInput>
          <LabeledInput id="waterLHa" label="Water Rate (L/ha)">
            <input
              id="waterLHa"
              type="number"
              step="1"
              value={form.waterLHa}
              onChange={(event) => update('waterLHa', numberOrZero(event.target.value))}
              className={inputClassName}
            />
          </LabeledInput>
          <LabeledInput id="nozzle" label="Nozzle">
            <select
              id="nozzle"
              value={form.nozzle}
              onChange={(event) => update('nozzle', event.target.value)}
              className={inputClassName}
            >
              {NOZZLES.map((nozzle) => (
                <option key={nozzle} value={nozzle}>
                  {nozzle}
                </option>
              ))}
            </select>
          </LabeledInput>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <LabeledInput id="windKmh" label="Wind (km/h)">
            <input
              id="windKmh"
              type="number"
              step="0.5"
              value={form.windKmh}
              onChange={(event) => update('windKmh', numberOrZero(event.target.value))}
              className={inputClassName}
            />
          </LabeledInput>
          <LabeledInput id="tempC" label="Temperature (°C)">
            <input
              id="tempC"
              type="number"
              step="0.5"
              value={form.tempC}
              onChange={(event) => update('tempC', numberOrZero(event.target.value))}
              className={inputClassName}
            />
          </LabeledInput>
        </div>

        <LabeledInput id="notes" label="Notes">
          <textarea
            id="notes"
            value={form.notes}
            onChange={(event) => update('notes', event.target.value)}
            placeholder="Weather, mix adjustments, or QA reminders"
            className={`${inputClassName} min-h-[120px] resize-y`}
          />
        </LabeledInput>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <p className="text-xs text-slate-400">Operator name is required to save a record.</p>
          <button
            type="submit"
            disabled={!canSave}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
              canSave ? 'text-white hover:brightness-110' : 'cursor-not-allowed opacity-50'
            }`}
            style={
              canSave
                ? { background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})` }
                : undefined
            }
          >
            <Save className="h-4 w-4" aria-hidden />
            Save record
          </button>
        </div>
      </form>
    </GlowCard>
  );
}

function RecordsTable({ data, theme }: { data: SprayRecord[]; theme: PaletteDefinition }) {
  const [farmFilter, setFarmFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return data.filter((record) => {
      const matchesFarm = farmFilter === 'all' || record.farm === farmFilter;
      const matchesQuery =
        search.trim().length === 0 ||
        record.operator.toLowerCase().includes(search.toLowerCase()) ||
        record.paddock.toLowerCase().includes(search.toLowerCase()) ||
        record.chemical.toLowerCase().includes(search.toLowerCase());
      return matchesFarm && matchesQuery;
    });
  }, [data, farmFilter, search]);

  return (
    <GlowCard theme={theme}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Captured records</h3>
            <p className="text-sm text-slate-400">Track product rates, weather windows, and operator sign-off.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={farmFilter}
              onChange={(event) => setFarmFilter(event.target.value)}
              className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
            >
              <option value="all">All farms</option>
              {FARMS.map((farm) => (
                <option key={farm} value={farm}>
                  {farm}
                </option>
              ))}
            </select>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search paddock, operator, or product"
              className="w-64 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Farm & paddock</th>
                <th className="px-3 py-2">Crop</th>
                <th className="px-3 py-2">Mix</th>
                <th className="px-3 py-2">Rates</th>
                <th className="px-3 py-2">Conditions</th>
                <th className="px-3 py-2">Operator</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id} className="rounded-xl bg-slate-900/60 text-slate-200">
                  <td className="rounded-l-xl px-3 py-3 align-top font-medium text-white">{record.date}</td>
                  <td className="px-3 py-3 align-top">
                    <div className="font-semibold text-white">{record.farm}</div>
                    <div className="text-xs text-slate-400">Paddock {record.paddock}</div>
                  </td>
                  <td className="px-3 py-3 align-top text-xs text-slate-300">{record.crop}</td>
                  <td className="px-3 py-3 align-top text-xs text-slate-300">
                    <div className="font-medium text-white">{record.chemical}</div>
                    <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300">
                      <span>Nozzle</span>
                      <span className={`font-semibold ${theme.pillText}`}>{record.nozzle}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top text-xs text-slate-300">
                    <div>{record.rateLHa.toFixed(1)} L/ha product</div>
                    <div>{record.waterLHa.toFixed(0)} L/ha water</div>
                  </td>
                  <td className="px-3 py-3 align-top text-xs text-slate-300">
                    <div className="flex items-center gap-1">
                      <Wind className="h-3 w-3" aria-hidden />
                      {record.windKmh.toFixed(1)} km/h
                    </div>
                    <div className="flex items-center gap-1">
                      <ThermometerSun className="h-3 w-3" aria-hidden />
                      {record.tempC.toFixed(1)} °C
                    </div>
                  </td>
                  <td className="rounded-r-xl px-3 py-3 align-top text-xs text-slate-300">
                    <div className="font-semibold text-white">{record.operator}</div>
                    <div className="text-xs text-slate-400">{record.notes || 'No notes'}</div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-slate-400">
                    No records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </GlowCard>
  );
}

function SettingsPanel({
  theme,
  paletteKey,
  onPaletteChange,
  isAuthed,
  onToggleAuth
}: {
  theme: PaletteDefinition;
  paletteKey: PaletteKey;
  onPaletteChange: (key: PaletteKey) => void;
  isAuthed: boolean;
  onToggleAuth: (value: boolean) => void;
}) {
  return (
    <GlowCard theme={theme}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Theme palette</h3>
            <p className="text-sm text-slate-400">Preview the neon dark mode aesthetic used for the AgriNet prototype.</p>
          </div>
          <div className="grid gap-3">
            {(Object.entries(PALETTES) as [PaletteKey, PaletteDefinition][]).map(([key, palette]) => {
              const isActive = key === paletteKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onPaletteChange(key)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                    isActive
                      ? 'border-white/40 bg-slate-900/70 text-white'
                      : 'border-white/10 bg-slate-900/40 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold">{palette.name}</p>
                    <p className="text-xs text-slate-400">Primary {palette.primary} · Accent {palette.accent}</p>
                  </div>
                  <span className="flex h-10 w-10 overflow-hidden rounded-full">
                    <span className="h-full w-1/2" style={{ background: palette.primary }} />
                    <span className="h-full w-1/2" style={{ background: palette.accent }} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Prototype behaviours</h3>
            <p className="text-sm text-slate-400">
              Toggle quick mock states for Supabase authentication and offline sync.
            </p>
          </div>
          <div className="space-y-3">
            <ToggleRow
              label="Mocked Supabase session"
              description="Switch between signed-in and signed-out states."
              value={isAuthed}
              onChange={onToggleAuth}
            />
            <ToggleRow
              label="Offline cache"
              description="Assume last known records are available locally."
              value={true}
            />
            <ToggleRow
              label="Weather snapshots"
              description="Pretend a Blynk station responded within the spray window."
              value={false}
            />
          </div>
        </div>
      </div>
    </GlowCard>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange
}: {
  label: string;
  description: string;
  value?: boolean;
  onChange?: (value: boolean) => void;
}) {
  const isInteractive = typeof onChange === 'function';
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-slate-900/50 p-4">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      {isInteractive ? (
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`relative h-6 w-12 rounded-full border border-white/10 transition ${
            value ? 'bg-[#00b300]/80' : 'bg-slate-800'
          }`}
        >
          <span
            className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 transform rounded-full bg-white transition ${
              value ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      ) : (
        <div className="relative h-6 w-12 rounded-full border border-dashed border-white/20 bg-slate-800/60">
          <span className="absolute inset-y-1 left-1 w-4 rounded-full bg-white/30" />
        </div>
      )}
    </div>
  );
}
