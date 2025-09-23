import Link from 'next/link';
import { Sprout, ThermometerSun, Waypoints } from 'lucide-react';

const featureList = [
  {
    title: 'Owner-scoped governance',
    description:
      'Supabase Auth and row-level security guarantee that growers, farms, and paddocks stay isolated per owner context.',
    icon: Sprout
  },
  {
    title: 'GPS + weather telemetry',
    description:
      'Capture per-paddock GPS coordinates alongside on-demand Blynk weather snapshots to satisfy QA audit trails.',
    icon: Waypoints
  },
  {
    title: 'Audit-grade records',
    description:
      'FastAPI renders the authoritative PDF with QR watermarking while the PWA offers offline provisional exports via jsPDF.',
    icon: ThermometerSun
  }
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col gap-12">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-brand/30 via-surface-200/90 to-surface p-10 text-center shadow-xl">
        <h1 className="text-4xl font-semibold text-white md:text-5xl">
          Infield Spray Record — Mobile QA Console
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-slate-200">
          Capture tank mixes, paddock telemetry, and audit-ready spray applications from any device. The progressive web app syncs
          with Supabase and FastAPI to keep compliance data authoritative while providing offline resilience in the field.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 md:flex-row">
          <Link
            href="/dashboard"
            className="rounded-full bg-gradient-to-r from-brand to-accent px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg transition hover:from-brand-light hover:to-accent-light"
          >
            Launch Control Center
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-200 transition hover:border-accent/60 hover:text-accent-light"
          >
            Sign in to Supabase
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {featureList.map((feature) => (
          <article
            key={feature.title}
            className="rounded-2xl border border-white/10 bg-surface-100/70 p-6 text-left shadow-lg backdrop-blur"
          >
            <feature.icon className="h-10 w-10 text-accent" aria-hidden />
            <h2 className="mt-4 text-xl font-semibold text-white">{feature.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-dashed border-accent/40 bg-surface-100/60 p-8 backdrop-blur">
        <h2 className="text-2xl font-semibold text-white">Deployment ready</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          The frontend ships as a Next.js 14 progressive web app styled with Tailwind CSS. Configure Supabase project keys in
          <code className="mx-2 rounded bg-surface-200/70 px-2 py-1 text-slate-100">.env.local</code> and point the API base URL at the FastAPI service
          deployed on Render. With Vercel for hosting and Supabase migrations applied, the QA team can run end-to-end verification
          against live services.
        </p>
      </section>
    </div>
  );
}
