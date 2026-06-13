'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const router = useRouter();
  const { user, register, loading, error, settings } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'INSTRUCTOR'>('STUDENT');
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName || !email || !password) {
      setFormError('Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    const success = await register({ fullName, email, password, role });
    if (success) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* ===== LEFT: Teal Decorative Panel (desktop) ===== */}
      <div className="hidden lg:flex lg:w-1/2 bg-teal-600 relative overflow-hidden flex-col justify-between p-10">
        {/* Decorative shapes */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 500 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="400" cy="80" rx="180" ry="200" fill="white" />
          <ellipse cx="80" cy="500" rx="200" ry="160" fill="white" />
          <path d="M250 50 Q350 200 250 350 Q150 200 250 50Z" fill="white" fillOpacity="0.15" />
          <circle cx="420" cy="480" r="90" fill="white" fillOpacity="0.08" />
        </svg>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center mb-10">
            <span className="text-xl font-bold text-white tracking-wide">
              {settings?.lmsName || 'Aegis Academy'}
            </span>
          </Link>

          <h1 className="text-4xl font-extrabold text-white leading-tight mt-6">
            Join Us!
          </h1>
          <p className="text-teal-100 text-base mt-3 leading-relaxed max-w-[280px]">
            Start your personalized learning journey with thousands of courses.
          </p>
        </div>

        {/* Graduation illustration */}
        <div className="flex justify-center py-6 relative z-10">
          <svg viewBox="0 0 200 200" className="w-44 h-44 drop-shadow-lg" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="50" y="130" width="100" height="16" rx="3" fill="white" fillOpacity="0.85" />
            <rect x="55" y="112" width="90" height="16" rx="3" fill="white" fillOpacity="0.7" />
            <rect x="60" y="94" width="80" height="16" rx="3" fill="white" fillOpacity="0.6" />
            <polygon points="100,50 140,70 100,90 60,70" fill="white" fillOpacity="0.9" />
            <polygon points="100,50 100,55 140,75 140,70" fill="white" fillOpacity="0.6" />
            <line x1="100" y1="55" x2="100" y2="82" stroke="white" strokeWidth="2" strokeOpacity="0.8" />
            <circle cx="100" cy="84" r="3" fill="white" fillOpacity="0.8" />
            <line x1="140" y1="70" x2="145" y2="90" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="145" cy="92" r="3" fill="#fbbf24" />
            <circle cx="45" cy="55" r="2" fill="white" fillOpacity="0.5" />
            <circle cx="155" cy="45" r="1.5" fill="white" fillOpacity="0.4" />
            <circle cx="35" cy="90" r="1" fill="white" fillOpacity="0.3" />
            <circle cx="170" cy="100" r="2" fill="white" fillOpacity="0.35" />
          </svg>
        </div>

        <div className="text-white/40 text-[10px] font-medium relative z-10">
          {settings?.footerInfo || '© 2026 Aegis Academy. All rights reserved.'}
        </div>
      </div>

      {/* ===== RIGHT: Register Form (full height) ===== */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
        {/* Mobile brand header */}
        <div className="lg:hidden mb-6 text-center">
          <Link href="/" className="inline-flex items-center">
            <span className="text-lg font-bold text-slate-800 tracking-wide">
              {settings?.lmsName || 'Aegis Academy'}
            </span>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto space-y-6 text-left">
          <div className="mb-5 lg:mb-6">
            <Link href="/login" className="text-slate-400 hover:text-teal-500 text-xs font-semibold transition flex items-center gap-1 mb-4">
              ← Go to login
            </Link>
            <h2 className="text-2xl font-extrabold text-slate-800">Register Account</h2>
            <p className="text-xs text-slate-400 mt-1.5">Create your student account to get started</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {(error || formError) && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-xs text-center font-semibold flex items-center justify-center gap-2">
                <span>⚠️</span>
                {formError || error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label htmlFor="reg-name" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm">👤</span>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm">✉️</span>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm">🔒</span>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition"
                  placeholder="Min 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition cursor-pointer text-sm"
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Register button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Student Account...
                </span>
              ) : (
                'Register Account'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-teal-500 hover:text-teal-600 transition underline underline-offset-2">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
