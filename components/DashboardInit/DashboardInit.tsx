'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export default function DashboardInit({ userId }: { userId: string }) {
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

  return null;
}
