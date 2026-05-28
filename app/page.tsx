'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { authStore } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(authStore.isAuthenticated() ? '/dashboard' : '/login');
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-slate-400 text-sm">Loading…</div>
    </main>
  );
}
