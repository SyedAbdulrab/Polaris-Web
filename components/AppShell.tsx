'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

import { CurrencySwitcher } from '@/components/CurrencySwitcher';
import { api } from '@/lib/api';
import { authStore, StoredUser } from '@/lib/auth';
import { cn } from '@/lib/cn';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const NAV: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12 12 4l9 8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/money',
    label: 'Money',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/habits',
    label: 'Habits',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12 11 14l4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 7h14M5 12h2M5 17h14" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/journal',
    label: 'Journal',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h11a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4Z" />
        <path d="M4 16h11a4 4 0 0 1 4 4" />
        <path d="M9 8h6M9 12h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/goals',
    label: 'Goals',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/grafana',
    label: 'Grafana',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12h4l3 8 4-16 3 8h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </svg>
    ),
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!authStore.isAuthenticated()) {
      router.replace('/login');
      return;
    }
    setUser(authStore.getUser());
  }, [router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function logout() {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // best effort
    }
    authStore.clear();
    router.replace('/login');
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 shrink-0 border-r border-border bg-surface px-4 py-5 transition-transform md:static md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-2 px-2">
          <span className="text-2xl leading-none text-star-500">★</span>
          <span className="text-base font-semibold tracking-tight">Polaris</span>
        </Link>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('nav-link', active && 'active')}
              >
                <span className={cn(active ? 'text-star-400' : 'text-mute')}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-4 bottom-5 space-y-3">
          <div className="rounded-lg border border-border bg-elevated p-3">
            <div className="text-2xs text-mute">Signed in as</div>
            <div className="mt-0.5 truncate text-sm font-medium">
              {user?.name ?? user?.email ?? '…'}
            </div>
            {user?.name && <div className="truncate text-2xs text-mute">{user.email}</div>}
          </div>
          <button onClick={logout} className="btn-ghost btn-sm w-full justify-start">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Log out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-canvas/80 px-5 py-3 backdrop-blur md:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="btn-ghost btn-sm md:hidden"
            aria-label="Toggle menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex-1" />
          <CurrencySwitcher />
        </header>

        <main className="px-5 py-6 md:px-8 md:py-8 max-w-7xl">{children}</main>
      </div>
    </div>
  );
}
