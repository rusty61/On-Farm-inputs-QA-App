'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/components/providers/SupabaseProvider';

export default function LoginPage() {
  const { signIn, signUp, loading } = useSupabase();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      if (mode === 'sign-in') {
        await signIn(email, password);
        router.push('/dashboard');
        router.refresh();
      } else {
        await signUp(email, password);
        setMessage('Check your email to confirm the new account. After confirmation you can sign in.');
        setMode('sign-in');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate.');
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl border border-white/10 bg-surface-100/70 p-8 shadow-xl backdrop-blur">
      <h1 className="text-2xl font-semibold text-white">Supabase access</h1>
      <p className="text-sm text-slate-300">
        Use your Supabase Auth credentials to access the owner-scoped spray record console. Accounts require confirmation before the QA workflow becomes available.
      </p>
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
        <button
          type="button"
          className={`rounded-full px-3 py-1 transition ${
            mode === 'sign-in'
              ? 'bg-gradient-to-r from-brand to-accent text-white shadow'
              : 'bg-surface-200/70 text-slate-300'
          }`}
          onClick={() => setMode('sign-in')}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1 transition ${
            mode === 'sign-up'
              ? 'bg-gradient-to-r from-brand to-accent text-white shadow'
              : 'bg-surface-200/70 text-slate-300'
          }`}
          onClick={() => setMode('sign-up')}
        >
          Register
        </button>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="grower@example.com"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-gradient-to-r from-brand to-accent px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-brand-light hover:to-accent-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Processing…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </button>
      </form>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <p className="text-sm text-amber-300">
        Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in
        <code className="mx-1 rounded bg-surface-200/70 px-1 py-0.5 text-slate-100">.env.local</code> to authenticate against Supabase. Without
        credentials the console falls back to offline sessions.
      </p>
      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
      <p className="text-xs text-slate-400">
        Need backend credentials? See the{' '}
        <Link href="/" className="underline">
          installation guide
        </Link>{' '}
        for Supabase setup instructions.
      </p>
    </div>
  );
}
