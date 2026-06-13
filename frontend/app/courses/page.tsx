'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import courseService from '@/services/courseService';
import Link from 'next/link';
import { formatDateString } from '@/utils/date';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnailUrl: string | null;
  instructorId: string;
  createdAt: string;
}

function CourseCatalogContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams ? (searchParams.get('search') || '') : '';

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  
  const initialCategory = searchParams ? (searchParams.get('category') || 'All') : 'All';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  // Sync category state when URL query parameter changes
  useEffect(() => {
    if (searchParams) {
      const cat = searchParams.get('category') || 'All';
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [coursesRes, categoriesRes] = await Promise.all([
          courseService.getCourses(),
          courseService.getCategories(),
        ]);
        if (coursesRes.success && coursesRes.data) {
          setCourses(coursesRes.data);
        } else {
          setError(coursesRes.error || 'Failed to load courses.');
        }
        if (categoriesRes.success && categoriesRes.data) {
          const catNames = categoriesRes.data.map((c: any) => c.name);
          setCategories(['All', ...catNames]);
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Header Banner */}
      <div className="bg-teal-800 text-white py-12 px-4 text-center sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-4xl mx-auto space-y-4">
          
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Expand Your Knowledge & Skills
          </h1>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            Find the perfect program for you. Browse our curated selection of top courses taught by industry veterans.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8">
        {/* Search & Categories Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          {/* Categories list */}
          <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Filters:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0d9488] text-white shadow-md shadow-teal-600/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search field */}
          <div className="w-full md:w-80 flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-[#0d9488]/30 focus-within:border-[#0d9488] transition duration-200">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none"
            />
            <span className="px-2 text-slate-400 text-xs">🔍</span>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm animate-pulse">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-6 w-3/4 bg-slate-200 rounded" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded" />
                  <div className="h-3 bg-slate-200 rounded w-5/6" />
                </div>
                <div className="h-10 bg-slate-200 rounded-xl w-full pt-4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center text-sm font-semibold max-w-md mx-auto">
            ⚠️ {error}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl shadow-sm max-w-lg mx-auto space-y-4">
            <span className="text-4xl block">🔍</span>
            <h3 className="text-lg font-bold text-slate-800">No courses found</h3>
            <p className="text-slate-500 text-xs max-w-xs mx-auto">
              We couldn't find any courses matching "{searchQuery}" under category "{selectedCategory}". Try adjusting your filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-lg transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:translate-y-[-2px] transition duration-300"
              >
                <div className="space-y-4">
                  {/* Thumbnail Image */}
                  <div className="w-full aspect-video bg-gradient-to-br from-teal-50 to-emerald-50 border border-slate-100 rounded-xl overflow-hidden relative flex items-center justify-center">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 select-none">
                        <span className="text-3xl">🎓</span>
                        <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest">{course.category}</span>
                      </div>
                    )}
                  </div>

                  {/* Category badge */}
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-teal-50 text-teal-600 border border-teal-100">
                      {course.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-extrabold text-[#0f112e] text-base leading-snug">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
                    {course.description}
                  </p>
                </div>

                {/* Footer action */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400">
                    Created {formatDateString(course.createdAt)}
                  </div>
                  <Link
                    href={`/courses/${course.id}`}
                    className="px-4 py-2 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-lg shadow-sm transition duration-200"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CourseCatalogPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center bg-slate-50 py-20 text-slate-500 font-semibold">
            Loading Catalog...
          </div>
        }
      >
        <CourseCatalogContent />
      </Suspense>
    </div>
  );
}
