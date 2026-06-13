'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loading, error, settings } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    if (!email || !password) {
      setFormError('Please fill in all fields.');
      return;
    }

    const success = await login({ email, password });
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
            Hello!
          </h1>
          <p className="text-teal-100 text-base mt-3 leading-relaxed max-w-[280px]">
            Welcome back to your personalized learning journey.
          </p>
        </div>

        {/* Plant illustration */}
        <div className="flex justify-center py-6 relative z-10">
          <svg viewBox="0 0 200 220" className="w-48 h-48 drop-shadow-lg" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="100" cy="200" rx="50" ry="12" fill="white" fillOpacity="0.15" />
            <path d="M75 160 L65 200 L135 200 L125 160 Z" fill="white" fillOpacity="0.85" />
            <rect x="82" y="152" width="36" height="12" rx="4" fill="white" fillOpacity="0.95" />
            <path d="M100 152 Q98 120 95 90" stroke="#065f46" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M100 152 Q102 130 108 105" stroke="#065f46" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <ellipse cx="80" cy="80" rx="22" ry="40" fill="#0d9488" transform="rotate(-15 80 80)" fillOpacity="0.9" />
            <ellipse cx="118" cy="85" rx="18" ry="35" fill="#10b981" transform="rotate(20 118 85)" fillOpacity="0.85" />
            <ellipse cx="95" cy="60" rx="14" ry="30" fill="#14b8a6" transform="rotate(5 95 60)" fillOpacity="0.8" />
            <path d="M112 100 Q140 70 130 40 Q125 20 145 10" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="148" cy="8" rx="10" ry="18" fill="#10b981" transform="rotate(30 148 8)" fillOpacity="0.7" />
          </svg>
        </div>

        <div className="text-white/40 text-[10px] font-medium relative z-10">
          {settings?.footerInfo || '© 2026 Aegis Academy. All rights reserved.'}
        </div>
      </div>

      {/* ===== RIGHT: Login Form (full height) ===== */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
        {/* Mobile brand header */}
        <div className="lg:hidden mb-8 text-center">
          <Link href="/" className="inline-flex items-center">
            <span className="text-lg font-bold text-slate-800 tracking-wide">
              {settings?.lmsName || 'Aegis Academy'}
            </span>
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-slate-800">Login</h2>
            <p className="text-xs text-slate-400 mt-1.5">Sign in to continue your learning journey</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {(error || formError) && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-xs text-center font-semibold flex items-center justify-center gap-2">
                <span>⚠️</span>
                {formError || error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm">✉️</span>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <button type="button" className="text-[10px] font-bold text-teal-500 hover:text-teal-600 transition cursor-pointer">
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm">🔒</span>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition"
                  placeholder="••••••••"
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

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing In...
                </span>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Social login */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[10px] text-slate-300 font-semibold uppercase tracking-wider">Or login with</span>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-lg hover:bg-slate-100 hover:border-slate-300 hover:scale-105 transition-all cursor-pointer shadow-sm" title="Facebook">
              📘
            </button>
            <button className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-lg hover:bg-slate-100 hover:border-slate-300 hover:scale-105 transition-all cursor-pointer shadow-sm" title="Google">
              🔍
            </button>
            <button className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-lg hover:bg-slate-100 hover:border-slate-300 hover:scale-105 transition-all cursor-pointer shadow-sm" title="Apple">
              🍎
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-bold text-teal-500 hover:text-teal-600 transition underline underline-offset-2">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
