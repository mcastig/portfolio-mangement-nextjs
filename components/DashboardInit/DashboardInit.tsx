'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

export default function DashboardInit({ userId }: { userId: string }) {
  const router = useRouter();
  const setUser = useStore((s) => s.setUser);
  const user = useStore((s) => s.user);

  useEffect(() => {
    if (user?.id === userId) return;
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.id) setUser(data);
      })
      .catch(() => {});
  }, [userId, user?.id, setUser]);

  // When the browser restores this page from bfcache (back/forward navigation),
  // no HTTP request is made so middleware and Cache-Control headers don't run.
  // Re-validate the session immediately and redirect if it's gone.
  useEffect(() => {
    async function handlePageShow(e: PageTransitionEvent) {
      if (!e.persisted) return;
      const res = await fetch('/api/user/profile');
      if (res.status === 401) {
        router.replace('/signin');
      }
    }
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [router]);

  return null;
}
