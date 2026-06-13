'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { StudentDashboard } from '@/components/StudentDashboard';
import { InstructorDashboard } from '@/components/InstructorDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-10 w-10 text-teal-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-slate-400 text-sm font-medium">Restoring secure session...</span>
        </div>
      </div>
    );
  }

  // All roles now use full-page sidebar layout — bypass default wrapper
  if (user.role === 'ADMIN') {
    return <AdminDashboard user={user} />;
  }

  if (user.role === 'INSTRUCTOR') {
    return <InstructorDashboard user={user} />;
  }

  if (user.role === 'STUDENT') {
    return <StudentDashboard user={user} />;
  }

  // Fallback
  return <StudentDashboard user={user} />;
}
