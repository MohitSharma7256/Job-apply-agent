"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuthToken } from '@/lib/apiClient';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    clearAuthToken();
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="rounded-3xl bg-white/5 border border-white/10 p-8 shadow-2xl shadow-slate-950/30 text-center">
        <p className="text-white text-xl font-bold">Signing you out...</p>
      </div>
    </div>
  );
}
