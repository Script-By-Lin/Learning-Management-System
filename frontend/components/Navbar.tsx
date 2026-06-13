'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import courseService from '@/services/courseService';

export default function Navbar() {
  const { user, loading, logout, settings } = useAuth();
  const [categories, setCategories] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await courseService.getCourses();
        if (res.success && res.data) {
          const unique = Array.from(new Set(res.data.map((c: any) => c.category))) as string[];
          setCategories(unique);
        }
      } catch (e) {
        console.error('Failed to load categories in navbar', e);
      }
    }
    fetchCategories();
  }, []);

  return (
    <div className="w-full flex flex-col font-sans">
      {/* Main Navbar (White Background) */}
      <header className="bg-white border-b border-slate-100 py-4 px-4 sm:px-6 lg:px-8 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <span className="font-extrabold text-lg tracking-tight text-[#0f112e] whitespace-nowrap">
                {settings?.lmsName || 'Aegis Academy'}
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <div 
                className="relative group py-2"
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                <Link 
                  href="/courses" 
                  className="text-slate-600 hover:text-slate-900 font-semibold text-sm flex items-center gap-1 transition whitespace-nowrap"
                >
                  Explore Courses
                  <span className="text-[9px] text-slate-400 group-hover:rotate-180 transition-transform duration-200">▼</span>
                </Link>
                
                {/* Categories Dropdown Panel */}
                <div 
                  className={`absolute left-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-3 px-2 z-50 transition-all duration-200 ${
                    isDropdownOpen 
                      ? 'opacity-100 translate-y-0 pointer-events-auto' 
                      : 'opacity-0 translate-y-2 pointer-events-none'
                  }`}
                >
                  <Link 
                    href="/courses"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-3 py-2 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-[#0d9488] rounded-xl transition whitespace-nowrap"
                  >
                    All Categories
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/courses?category=${encodeURIComponent(cat)}`}
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-teal-50 hover:text-[#0d9488] rounded-xl transition whitespace-nowrap"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>

          {/* Actions - Desktop */}
          <div className="hidden md:flex items-center gap-6">
            {/* Shopping Cart */}
            <div className="relative cursor-pointer text-slate-600 hover:text-slate-900">
              <span className="text-xl">🛒</span>
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-[#0d9488] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                0
              </span>
            </div>

            {/* User Session Buttons */}
            {loading ? (
              <div className="h-9 w-24 bg-slate-100 animate-pulse rounded-lg" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/messages"
                  className="text-xs font-bold text-slate-600 hover:text-[#0d9488] transition mr-2 whitespace-nowrap"
                >
                  Messages
                </Link>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#0d9488] hover:bg-[#0f766e] shadow-md shadow-teal-600/10 transition duration-200 whitespace-nowrap"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="text-xs font-bold text-slate-600 hover:text-[#0d9488] transition cursor-pointer whitespace-nowrap"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="text-xs font-bold text-slate-700 hover:text-[#0d9488] transition whitespace-nowrap"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-[#0d9488] hover:bg-[#0f766e] shadow-md shadow-teal-600/10 transition duration-200 whitespace-nowrap"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>

          {/* Actions - Mobile */}
          <div className="flex md:hidden items-center gap-4">
            {/* Shopping Cart */}
            <div className="relative cursor-pointer text-slate-600 hover:text-slate-900 mr-1">
              <span className="text-lg">🛒</span>
              <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-[#0d9488] text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                0
              </span>
            </div>

            {/* Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 focus:outline-none cursor-pointer transition"
              aria-label="Toggle menu"
            >
              <span className="text-xl block w-6 h-6 flex items-center justify-center font-bold">
                {isMobileMenuOpen ? '✕' : '☰'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 shadow-lg px-6 py-4 space-y-4 animate-slide-down z-30 w-full">
          <div className="flex flex-col gap-3 font-semibold">
            <Link
              href="/courses"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-slate-700 hover:text-[#0d9488] text-xs py-2.5 px-3 hover:bg-teal-50/30 rounded-xl transition whitespace-nowrap"
            >
              Explore All Courses
            </Link>

            {categories.length > 0 && (
              <div className="px-3 py-1.5 space-y-2 border-l border-slate-100 ml-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Categories</span>
                {categories.slice(0, 5).map((cat) => (
                  <Link
                    key={cat}
                    href={`/courses?category=${encodeURIComponent(cat)}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-xs text-slate-600 hover:text-[#0d9488] transition whitespace-nowrap"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            )}

            <hr className="border-slate-100/60" />

            {loading ? (
              <div className="h-9 bg-slate-50 animate-pulse rounded-xl" />
            ) : user ? (
              <div className="flex flex-col gap-2">
                <Link
                  href="/messages"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-slate-700 hover:text-[#0d9488] text-xs py-2.5 px-3 hover:bg-teal-50/30 rounded-xl transition whitespace-nowrap"
                >
                  💬 Messages
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0d9488] hover:bg-[#0f766e] text-center transition whitespace-nowrap block"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="text-left text-slate-500 hover:text-[#0d9488] text-xs py-2.5 px-3 hover:bg-teal-50/30 rounded-xl transition whitespace-nowrap cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-slate-700 hover:text-[#0d9488] text-xs py-2.5 px-3 hover:bg-teal-50/30 rounded-xl transition whitespace-nowrap"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0d9488] hover:bg-[#0f766e] text-center transition whitespace-nowrap block"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
