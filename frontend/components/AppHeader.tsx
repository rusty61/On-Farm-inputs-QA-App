'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { LogOut, Menu, Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/components/providers/SupabaseProvider';

const navLinks = [
  { href: '/', label: 'Overview' },
  { href: '/dashboard', label: 'Control Center' },
  { href: '/spray-prototype', label: 'Spray Prototype' }
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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Sprout className="h-6 w-6 text-accent" aria-hidden />
          <div>
            <p className="text-sm uppercase tracking-widest text-slate-300">Infield Spray Record</p>
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
                  ? 'bg-surface-200/70 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-surface-100/60 hover:text-white'
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
              className="flex items-center gap-2 rounded-md border border-white/10 bg-surface-100/70 px-3 py-2 text-sm text-slate-200 transition hover:border-accent/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              {loading ? 'Signing out…' : 'Sign out'}
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-gradient-to-r from-brand to-accent px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-brand-light hover:to-accent-light"
            >
              Sign in
            </Link>
          )}
          <button className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-slate-300 transition hover:border-accent/60 hover:text-white md:hidden">
            <Menu className="h-5 w-5" aria-hidden />
            <span className="sr-only">Open navigation</span>
          </button>
        </div>
      </div>
    </header>
  );
}
