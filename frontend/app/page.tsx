'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import courseService from '@/services/courseService';

import Navbar from '@/components/Navbar';

function getCategoryIcon(title: string) {
  switch (title) {
    case 'Network Engineering ( NE )':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8.24 14.24a5 5 0 017.52 0M5.24 11.24a9 9 0 0113.52 0M2.24 8.24a13 13 0 0119.52 0" />
        </svg>
      );
    case 'Linux System Administration':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      );
    case 'Python Programming':
      return (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M11.9 2c-2.3 0-4.5.2-4.5 1.7v1.8h4.6V6h-6.7c-2 0-3.3 1.3-3.3 3.3v4c0 2 1.3 3.2 3.3 3.2h1.6v-2.3c0-1.8 1.4-3.2 3.2-3.2h4.5c1.8 0 3.2-1.4 3.2-3.2V6.2C17.8 3.8 15.6 2 11.9 2zm-3.3 2.1c.5 0 .8.4.8.8s-.3.8-.8.8a.8.8 0 1 1 0-1.6zm6.8 6.7c-1.8 0-3.2 1.4-3.2 3.2v2.2c0 2.4 2.2 4.2 5.9 4.2 2.3 0 4.5-.2 4.5-1.7v-1.8h-4.6v-.5h6.7c2 0 3.3-1.3 3.3-3.3v-4c0-2-1.3-3.2-3.3-3.2H17v2.3c0 1.8-1.4 3.2-3.2 3.2h-1.6zm3.3 7.1c.5 0 .8.4.8.8s-.3.8-.8.8a.8.8 0 1 1 0-1.6z" />
        </svg>
      );
    case 'Cloud Computing':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      );
    case 'Cisco and Paloalto':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    case 'MySQL Database Administration':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      );
    case 'Git and Github':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7a3 3 0 100-6 3 3 0 000 6zM8 7v7a4 4 0 004 4h4a3 3 0 100-6H12a2 2 0 01-2-2V7z" />
        </svg>
      );
    case 'C++ Programming':
      return <span className="text-[11px] font-black tracking-tighter">C++</span>;
    case 'Front-End Web Development':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    case 'Level 3 Diploma in Computing ( L3DC )':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'A+':
      return <span className="text-[11px] font-black tracking-tighter">A+</span>;
    case 'Odoo Development':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return <span>💡</span>;
  }
}

const categoryStyles = [
  { bg: 'bg-teal-50 text-teal-600', iconBg: 'bg-teal-50 text-teal-600' },
  { bg: 'bg-emerald-50 text-emerald-600', iconBg: 'bg-emerald-50 text-emerald-600' },
  { bg: 'bg-blue-50 text-blue-600', iconBg: 'bg-blue-50 text-blue-600' },
  { bg: 'bg-rose-50 text-rose-600', iconBg: 'bg-rose-50 text-rose-600' },
  { bg: 'bg-purple-50 text-purple-600', iconBg: 'bg-purple-50 text-purple-600' },
  { bg: 'bg-amber-50 text-amber-600', iconBg: 'bg-amber-50 text-amber-600' },
  { bg: 'bg-indigo-50 text-indigo-600', iconBg: 'bg-indigo-50 text-indigo-600' },
  { bg: 'bg-pink-50 text-pink-600', iconBg: 'bg-pink-50 text-pink-600' },
];

const courseAccents = [
  {
    bottomBg: 'bg-[#e2f9e6]',
    priceColor: 'text-[#15803d]',
    svgColor: 'text-[#e2f9e6]',
  },
  {
    bottomBg: 'bg-[#fff5d6]',
    priceColor: 'text-[#b45309]',
    svgColor: 'text-[#fff5d6]',
  },
  {
    bottomBg: 'bg-[#ffe4f2]',
    priceColor: 'text-[#be185d]',
    svgColor: 'text-[#ffe4f2]',
  },
  {
    bottomBg: 'bg-[#e0f2fe]',
    priceColor: 'text-[#0369a1]',
    svgColor: 'text-[#e0f2fe]',
  },
  {
    bottomBg: 'bg-[#f5f3ff]',
    priceColor: 'text-[#6d28d9]',
    svgColor: 'text-[#f5f3ff]',
  },
];

function renderCourseLogo(title: string, categoryName: string) {
  const normCat = categoryName ? categoryName.toLowerCase() : '';
  const normTitle = title ? title.toLowerCase() : '';

  if (normCat.includes('odoo')) {
    return (
      <span className="text-[#5c3c92] font-black text-3xl tracking-tighter select-none font-sans">odoo</span>
    );
  }
  if (normTitle === 'a+') {
    return (
      <div className="flex flex-col items-center justify-center border-2 border-red-500 rounded px-3 py-1 font-sans">
        <span className="text-red-600 font-extrabold text-2xl tracking-tight leading-none">A+</span>
        <span className="text-red-500 font-bold text-[6px] tracking-widest uppercase border-t border-red-500/30 pt-0.5 mt-0.5 leading-none">Certified IT Technician</span>
      </div>
    );
  }
  if (normCat.includes('linux')) {
    return (
      <div className="flex flex-col items-center gap-1 font-sans">
        <svg viewBox="0 0 100 100" className="w-10 h-10 fill-current text-slate-800">
          <path d="M50,10 C40,10 32,18 32,30 C32,36 34,42 38,46 C35,49 30,55 30,64 C30,76 38,84 50,84 C62,84 70,76 70,64 C70,55 65,49 62,46 C66,42 68,36 68,30 C68,18 60,10 50,10 Z" />
          <circle cx="43" cy="28" r="3" className="text-white fill-current" />
          <circle cx="57" cy="28" r="3" className="text-white fill-current" />
          <path d="M47,36 Q50,42 53,36 Z" className="text-amber-500 fill-current" />
        </svg>
        <span className="font-extrabold text-[10px] tracking-widest uppercase text-slate-800 mt-1">Linux</span>
      </div>
    );
  }
  if (normTitle.includes('computer science') || normCat.includes('computing')) {
    return (
      <div className="flex flex-col items-center font-sans">
        <div className="relative flex items-center justify-center py-2 px-4">
          <div className="absolute w-16 h-8 border-[3px] border-blue-600 rounded-full rotate-[-15deg] opacity-80" />
          <span className="text-blue-700 font-black text-xl italic tracking-tighter relative z-10">NCC</span>
        </div>
        <span className="text-slate-500 text-[7px] tracking-widest uppercase font-extrabold mt-1">education</span>
      </div>
    );
  }
  if (normCat.includes('web development') || normCat.includes('front-end')) {
    return (
      <div className="relative flex items-center justify-center w-16 h-16 font-sans">
        <svg viewBox="0 0 100 100" className="absolute w-full h-full text-teal-600 fill-current opacity-20">
          <polygon points="50,5 95,28 95,72 50,95 5,72 5,28" />
        </svg>
        <span className="relative z-10 text-teal-700 font-black text-2xl tracking-tighter font-mono">{`</>`}</span>
      </div>
    );
  }
  if (normTitle.includes('c++')) {
    return (
      <div className="h-16 w-16 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-xl shadow-md border-2 border-white font-sans">
        C++
      </div>
    );
  }
  if (normCat.includes('git') || normCat.includes('github')) {
    return (
      <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xl font-sans">
        <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
        </svg>
        <span className="text-xl font-bold tracking-tight text-slate-800">GitHub</span>
      </div>
    );
  }
  if (normCat.includes('network') || normTitle.includes('network')) {
    return (
      <div className="flex flex-col items-center justify-center font-sans">
        <span className="text-red-600 font-black text-3xl tracking-tight leading-none">NE</span>
        <span className="text-[6px] block text-slate-500 tracking-widest font-semibold uppercase mt-0.5">Network Engineering</span>
      </div>
    );
  }
  if (normCat.includes('python')) {
    return (
      <div className="flex items-center gap-1.5 font-sans">
        <svg className="w-8 h-8 fill-current text-blue-600" viewBox="0 0 24 24">
          <path d="M11.9 2c-2.3 0-4.5.2-4.5 1.7v1.8h4.6V6h-6.7c-2 0-3.3 1.3-3.3 3.3v4c0 2 1.3 3.2 3.3 3.2h1.6v-2.3c0-1.8 1.4-3.2 3.2-3.2h4.5c1.8 0 3.2-1.4 3.2-3.2V6.2C17.8 3.8 15.6 2 11.9 2zm-3.3 2.1c.5 0 .8.4.8.8s-.3.8-.8.8a.8.8 0 1 1 0-1.6zm6.8 6.7c-1.8 0-3.2 1.4-3.2 3.2v2.2c0 2.4 2.2 4.2 5.9 4.2 2.3 0 4.5-.2 4.5-1.7v-1.8h-4.6v-.5h6.7c2 0 3.3-1.3 3.3-3.3v-4c0-2-1.3-3.2-3.3-3.2H17v2.3c0 1.8-1.4 3.2-3.2 3.2h-1.6zm3.3 7.1c.5 0 .8.4.8.8s-.3.8-.8.8a.8.8 0 1 1 0-1.6z" />
        </svg>
        <span className="text-slate-800 font-extrabold text-sm tracking-tight">Python</span>
      </div>
    );
  }

  const initials = title ? title.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'LMS';
  return (
    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-black flex items-center justify-center text-lg shadow-sm border border-white/20 select-none">
      {initials}
    </div>
  );
}

export default function Home() {
  const { user, loading: authLoading, settings } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [dbCourses, setDbCourses] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [publicStats, setPublicStats] = useState({
    coursesCount: 0,
    studentsCount: 0,
    instructorsCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingData(true);
        const [coursesRes, categoriesRes, statsRes] = await Promise.all([
          courseService.getCourses(),
          courseService.getCategories(),
          fetch('/api/public-stats').then((r) => r.json()).catch(() => null),
        ]);
        if (coursesRes.success && coursesRes.data) {
          setDbCourses(coursesRes.data);
        }
        if (categoriesRes.success && categoriesRes.data) {
          setDbCategories(categoriesRes.data);
        }
        if (statsRes && statsRes.success && statsRes.data) {
          setPublicStats(statsRes.data);
        }
      } catch (err) {
        console.error('Failed to load home page data', err);
      } finally {
        setLoadingData(false);
        setLoadingStats(false);
      }
    }
    loadData();
  }, []);

  const getCourseCountForCategory = (categoryName: string) => {
    return dbCourses.filter(
      (course) => course.category?.toLowerCase() === categoryName.toLowerCase()
    ).length;
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans">
      <Navbar />

      {/* 3. Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex flex-col md:flex-row items-center justify-between gap-12">
        {/* Left Column (Content) */}
        <div className="flex-1 space-y-8 text-center md:text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#0d9488]/20 bg-[#0d9488]/5 text-[#0d9488] text-xs font-bold uppercase tracking-widest">
            🚀 The Best LMS Platform
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#0f112e] leading-tight tracking-tight">
            {settings?.bannerTitle || (
              <>
                Start learning <br />
                from best{' '}
                <span className="relative inline-block text-teal-600">
                  platform
                  <span className="absolute bottom-1 left-0 w-full h-2 bg-teal-200/60 rounded-full -z-10" />
                </span>
              </>
            )}
          </h1>

          {/* Subheading */}
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-xl">
            {settings?.bannerSubtitle || 'Study any topic, anytime. Explore thousands of courses for the lowest price ever!'}
          </p>

          {/* Search bar */}
          <div className="max-w-md mx-auto md:mx-0 flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-[#0d9488]/30 focus-within:border-[#0d9488] transition duration-200">
            <input
              type="text"
              placeholder="What do you want to learn"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none"
            />
            <button
              onClick={() => searchQuery && (window.location.href = `/courses?search=${searchQuery}`)}
              className="px-5 py-2.5 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-lg transition duration-200 flex items-center gap-1 cursor-pointer"
            >
              🔍 Search
            </button>
          </div>

          {/* Statistics */}
          <div className="pt-6 flex flex-wrap justify-center md:justify-start gap-10 border-t border-slate-100">
            <div className="space-y-1">
              <span className="text-3xl font-extrabold text-[#0f112e] block">
                {loadingStats ? '...' : `${publicStats.studentsCount || 33}+`}
              </span>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Happy students
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-3xl font-extrabold text-[#0f112e] block">
                {loadingStats ? '...' : `${publicStats.instructorsCount || 15}+`}
              </span>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Experienced instructors
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (Hero Graphic illustration) */}
        <div className="flex-1 w-full max-w-md md:max-w-none flex justify-center items-center">
          <div className="relative w-full aspect-square max-w-[420px] flex items-center justify-center">
            {/* Soft Glowing Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 to-indigo-500/10 blur-3xl rounded-full w-[85%] h-[85%] left-0 top-[15%] -z-10" />
            <div className="absolute inset-0 bg-gradient-to-bl from-teal-500/10 to-indigo-500/10 blur-3xl rounded-full w-[85%] h-[85%] right-0 bottom-[15%] -z-10" />

            {/* Generated Student Image */}
            <div className="relative w-full h-full flex items-end justify-center">
              <img
                src={settings?.bannerUrl || "/hero_student.png"}
                alt="LMS Banner Graphic"
                className="object-contain drop-shadow-2xl z-10 hover:scale-[1.02] transition duration-300 max-h-[380px] w-auto"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Popular Categories Section */}
      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-[#0f112e] tracking-tight">Popular categories</h2>
            <div className="w-12 h-1 bg-teal-500 mx-auto mt-2 rounded"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {dbCategories.length === 0 ? (
              <div className="col-span-full py-12 px-6 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <div className="h-16 w-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm select-none">
                  📚
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">No Categories Yet</h3>
                <p className="text-slate-400 text-xs max-w-md mx-auto mb-4">
                  We're setting up the curriculum. Instructors or Administrators will add learning categories soon!
                </p>
                {user && (user.role === 'ADMIN' || user.role === 'INSTRUCTOR') && (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-xl shadow-md transition duration-200"
                  >
                    Go to Dashboard
                  </Link>
                )}
              </div>
            ) : (
              dbCategories.map((cat, idx) => {
                const style = categoryStyles[idx % categoryStyles.length];
                const count = getCourseCountForCategory(cat.name);
                return (
                  <Link
                    key={cat.id || idx}
                    href={`/courses?category=${encodeURIComponent(cat.name)}`}
                    className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition duration-300 group cursor-pointer text-left block"
                  >
                    <div className={`h-11 w-11 rounded-full flex items-center justify-center ${style.bg} group-hover:scale-105 transition duration-200 flex-shrink-0`}>
                      {getCategoryIcon(cat.name)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[#0f112e] text-xs sm:text-sm line-clamp-1">{cat.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">{count} {count === 1 ? 'Course' : 'Courses'}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Featured Courses Grid Section */}
      <section className="bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-[#0f112e] tracking-tight">Our Programs</h2>
            <div className="w-12 h-1 bg-teal-500 mx-auto mt-2 rounded"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {dbCourses.length === 0 ? (
              <div className="col-span-full py-16 px-6 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white shadow-sm">
                <div className="h-16 w-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm select-none">
                  🎓
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No Programs Available</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                  Our curriculum is currently being prepared. Check back shortly for our new programs and certificates!
                </p>
                {user && (user.role === 'ADMIN' || user.role === 'INSTRUCTOR') && (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition duration-200"
                  >
                    ➕ Create a Course
                  </Link>
                )}
              </div>
            ) : (
              dbCourses.map((course, idx) => {
                const accent = courseAccents[idx % courseAccents.length];
                const formattedPrice = course.price === 0 ? 'Free' : `${course.price.toLocaleString()} MMK`;
                return (
                  <Link
                    key={course.id || idx}
                    href={`/courses/${course.id}`}
                    className="bg-white rounded-[2rem] border border-slate-100/80 overflow-hidden shadow-sm hover:shadow-xl hover:translate-y-[-6px] transition duration-300 flex flex-col justify-between aspect-[3/4] w-full max-w-[270px] mx-auto relative group text-left cursor-pointer"
                  >
                    {/* Top Half */}
                    <div className="h-[52%] relative overflow-hidden bg-white">
                      {course.thumbnailUrl ? (
                        <>
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Price Overlay */}
                          <span className={`absolute top-4 left-4 z-10 text-xs font-black px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-sm ${accent.priceColor}`}>
                            {formattedPrice}
                          </span>
                        </>
                      ) : (
                        <div className="h-full flex flex-col justify-between p-6">
                          {/* Price */}
                          <span className={`text-sm font-extrabold ${accent.priceColor}`}>
                            {formattedPrice}
                          </span>

                          {/* Centered Logo */}
                          <div className="flex-grow flex items-center justify-center py-2">
                            {renderCourseLogo(course.title, course.category)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Half with SVG Wave */}
                    <div className={`${accent.bottomBg} h-[48%] p-6 pt-5 pb-6 text-slate-800 relative flex flex-col justify-between`}>
                      {/* SVG Wave */}
                      <div className="absolute left-0 right-0 -top-[23px] h-[24px] z-0 overflow-hidden pointer-events-none">
                        <svg viewBox="0 0 100 24" className={`w-full h-full ${accent.svgColor} fill-current`} preserveAspectRatio="none">
                          <path d="M0,24 L0,16 C10,16 12,20 20,20 L60,20 C72,20 74,2 84,2 C94,2 96,16 100,16 L100,24 Z" />
                        </svg>
                      </div>

                      {/* Avatar Overlay (curved overlay) */}
                      <div className="absolute right-6 top-0 -translate-y-[65%] z-10">
                        <div className="h-10 w-10 rounded-full border-3 border-white bg-slate-200 overflow-hidden shadow-sm flex items-center justify-center text-xs font-bold text-slate-500 relative">
                          <svg className="w-full h-full bg-slate-300 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M12 2a5 5 0 100 10 5 5 0 000-10zM5 20a7 7 0 0114 0H5z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>

                      {/* Title and Difficulty */}
                      <div className="relative z-10 flex flex-col justify-between h-full pt-1">
                        <h3 className="font-extrabold text-[#0f112e] text-xs sm:text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                          {course.title}
                        </h3>
                        <div className={`flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider mt-2 ${accent.priceColor}`}>
                          <span className="text-xs">✦</span>
                          <span>{course.level || 'Beginner'}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* 4. Why Learn Online Section */}
      <section className="bg-white border-t border-b border-slate-100 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-[#0f112e]">Why learn online?</h2>
            <p className="text-slate-500 text-sm">
              Discover the unique features that make our platform the preferred choice for students worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition">
              <div className="h-10 w-10 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center text-lg">
                🕒
              </div>
              <h3 className="font-bold text-slate-800 text-base">Learn at Your Own Pace</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Watch pre-recorded video lessons, pause whenever you need, and review modules at any time of day.
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-lg">
                🌍
              </div>
              <h3 className="font-bold text-slate-800 text-base">Study Anywhere</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Connect from any desktop or mobile device. As long as you have internet, your campus is right with you.
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition">
              <div className="h-10 w-10 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center text-lg">
                💡
              </div>
              <h3 className="font-bold text-slate-800 text-base">Interactive Syllabus</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Check off completed lessons, take multiple choice quizzes, and interact directly with instructors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="border-t border-slate-100 bg-[#0f112e] text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>{settings?.footerInfo || `© ${new Date().getFullYear()} Nexora Academy. All rights reserved.`}</p>
          <div className="flex gap-6">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
