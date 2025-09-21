'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { LogOut, Menu, Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/components/providers/SupabaseProvider';

const navLinks = [
  { href: '/', label: 'Overview' },
  { href: '/dashboard', label: 'Control Center' }
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, signOut, loading } = useSupabase();

  const handleLogout = useCallback(async () => {
    await signOut();
    router.push('/');
  }, [router, signOut]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Sprout className="h-6 w-6 text-brand" aria-hidden />
          <div>
            <p className="text-sm uppercase tracking-widest text-slate-400">Infield Spray Record</p>
            <p className="text-lg font-semibold text-white">QA Operator Console</p>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-2 transition-colors',
                pathname === link.href
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {session ? (
            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              {loading ? 'Signing out…' : 'Sign out'}
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-slate-950 shadow hover:bg-brand-light"
            >
              Sign in
            </Link>
          )}
          <button className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-800 text-slate-400 md:hidden">
            <Menu className="h-5 w-5" aria-hidden />
            <span className="sr-only">Open navigation</span>
          </button>
        </div>
      </div>
    </header>
  );
}
