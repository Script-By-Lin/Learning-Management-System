'use client';

import React, { useEffect, useState } from 'react';
import { UserProfile } from './AuthProvider';
import courseService from '@/services/courseService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessagesPanel } from './MessagesPanel';
import { useAuth } from '@/hooks/useAuth';
import { formatDateString } from '@/utils/date';
import authService from '@/services/authService';

interface StudentDashboardProps {
  user: UserProfile;
}

interface EnrolledCourse {
  id: string;
  userId: string;
  courseId: string;
  joinedAt: string;
  completed: boolean;
  course: {
    id: string;
    title: string;
    description: string;
    category: string;
    thumbnailUrl: string | null;
    instructorId: string;
  };
}

type StudentTab = 'dashboard' | 'courses' | 'history' | 'certificates' | 'quizzes' | 'messages' | 'profile';

export function StudentDashboard({ user }: StudentDashboardProps) {
  const router = useRouter();
  const { logout, refreshProfile, settings } = useAuth();
  const [activeTab, setActiveTab] = useState<StudentTab>('dashboard');
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);

  // Enrollment data
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progresses, setProgresses] = useState<Record<string, number>>({});
  const [certificates, setCertificates] = useState<any[]>([]);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [categoriesList, setCategoriesList] = useState<string[]>(['All']);

  // Watch analytics
  const [watchAnalytics, setWatchAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Profile editing states
  const [fullNameInput, setFullNameInput] = useState(user.fullName);
  const [bioInput, setBioInput] = useState(user.bio || '');
  const [avatarUrlInput, setAvatarUrlInput] = useState(user.avatarUrl || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync profile details when user profile refreshes
  useEffect(() => {
    setFullNameInput(user.fullName);
    setBioInput(user.bio || '');
    setAvatarUrlInput(user.avatarUrl || '');
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullNameInput.trim()) {
      alert('Full name is required.');
      return;
    }
    try {
      setSavingProfile(true);

      let finalAvatarUrl = avatarUrlInput;
      if (avatarFile) {
        const uploadRes = await authService.uploadAvatar(avatarFile);
        if (uploadRes.success && uploadRes.data?.avatarUrl) {
          finalAvatarUrl = uploadRes.data.avatarUrl;
          setAvatarUrlInput(finalAvatarUrl);
        } else {
          alert(uploadRes.error || 'Failed to upload profile picture.');
          return;
        }
      }

      const res = await authService.updateProfile({
        fullName: fullNameInput,
        bio: bioInput || null,
        avatarUrl: finalAvatarUrl || null,
      });

      if (res.success) {
        alert('Profile updated successfully!');
        setAvatarFile(null);
        if (refreshProfile) {
          await refreshProfile();
        }
      } else {
        alert(res.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    loadWatchAnalytics();
  }, [activeTab]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const res = await courseService.getEnrolledCourses();
      if (res.success && res.data) {
        const enrolls = res.data;
        setEnrollments(enrolls);

        const progressMap: Record<string, number> = {};
        await Promise.all(
          enrolls.map(async (e: EnrolledCourse) => {
            try {
              const progRes = await courseService.getCourseProgress(e.courseId);
              if (progRes.success && progRes.data) {
                progressMap[e.courseId] = progRes.data.percentage;
              }
            } catch (err) {
              console.error(`Error fetching progress for course ${e.courseId}`, err);
            }
          })
        );
        setProgresses(progressMap);
      } else {
        setError(res.error || 'Failed to load enrolled courses.');
      }

      const certRes = await courseService.getUserCertificates();
      if (certRes.success && certRes.data) {
        setCertificates(certRes.data);
      }

      const catRes = await courseService.getCategories();
      if (catRes.success && catRes.data) {
        setCategoriesList(['All', ...catRes.data.map((c: any) => c.name)]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  async function loadWatchAnalytics() {
    try {
      setLoadingAnalytics(true);
      const res = await courseService.getWatchAnalytics();
      if (res.success && res.data) {
        setWatchAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to load watch analytics', err);
    } finally {
      setLoadingAnalytics(false);
    }
  }

  const activeProgresses = Object.values(progresses);
  const averageProgress =
    activeProgresses.length > 0
      ? Math.round(activeProgresses.reduce((sum, p) => sum + p, 0) / activeProgresses.length)
      : 0;

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  // Sidebar navigation items
  const sidebarItems: { id: StudentTab; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'courses', label: 'My Courses', icon: '📚', badge: enrollments.length },
    { id: 'history', label: 'Watch History', icon: '🎬' },
    { id: 'certificates', label: 'Certificates', icon: '🏆', badge: certificates.length },
    { id: 'quizzes', label: 'Quizzes & Grades', icon: '✍️' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  // SVG Weekly Watch Chart
  const renderWeeklyChart = () => {
    const weeklyData = watchAnalytics?.weeklyMinutes || [0, 0, 0, 0, 0, 0, 0];
    const maxVal = Math.max(...weeklyData, 1);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const chartWidth = 500;
    const chartHeight = 180;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerW = chartWidth - padding.left - padding.right;
    const innerH = chartHeight - padding.top - padding.bottom;

    const points = weeklyData.map((val: number, i: number) => {
      const x = padding.left + (i / 6) * innerW;
      const y = padding.top + innerH - (val / maxVal) * innerH;
      return { x, y, val };
    });

    const linePath = points.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + innerH} L ${points[0].x} ${padding.top + innerH} Z`;

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
        <defs>
          <linearGradient id="studentAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding.left}
            y1={padding.top + innerH * (1 - ratio)}
            x2={chartWidth - padding.right}
            y2={padding.top + innerH * (1 - ratio)}
            stroke="#e2e8f0"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
        ))}
        {/* Area fill */}
        <path d={areaPath} fill="url(#studentAreaGradient)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {points.map((p: any, i: number) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#0d9488" stroke="white" strokeWidth="2" />
            <text x={p.x} y={padding.top + innerH + 18} textAnchor="middle" className="text-[9px] fill-slate-400 font-semibold">
              {days[i]}
            </text>
            {p.val > 0 && (
              <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-[8px] fill-teal-600 font-bold">
                {p.val}m
              </text>
            )}
          </g>
        ))}
        {/* Y-axis label */}
        <text x={8} y={padding.top + innerH / 2} textAnchor="middle" className="text-[8px] fill-slate-400 font-medium" transform={`rotate(-90, 8, ${padding.top + innerH / 2})`}>
          Minutes
        </text>
      </svg>
    );
  };

  // ========== TAB RENDERS ==========
  const renderDashboardTab = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Mobile-only Quick Access Shortcuts Grid */}
      <div className="md:hidden bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">Quick Actions</h4>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setActiveTab('history')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-100 hover:border-teal-100 transition duration-200 cursor-pointer"
          >
            <span className="text-xl">🎬</span>
            <span className="text-[9px] font-bold text-slate-600 mt-1">History</span>
          </button>
          
          <button
            onClick={() => setActiveTab('quizzes')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-100 hover:border-teal-100 transition duration-200 cursor-pointer"
          >
            <span className="text-xl">✍️</span>
            <span className="text-[9px] font-bold text-slate-600 mt-1">Quizzes</span>
          </button>

          <button
            onClick={() => setActiveTab('certificates')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-100 hover:border-teal-100 transition duration-200 cursor-pointer"
          >
            <span className="text-xl">🏆</span>
            <span className="text-[9px] font-bold text-slate-600 mt-1">Awards</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Watch Time', value: loadingAnalytics ? '...' : `${watchAnalytics?.totalWatchMinutes || 0} min`, icon: '⏱️', color: 'bg-teal-500' },
          { label: 'Enrolled Courses', value: loading ? '...' : enrollments.length, icon: '📚', color: 'bg-teal-600' },
          { label: 'Completed', value: loading ? '...' : enrollments.filter((e) => progresses[e.courseId] === 100).length, icon: '✅', color: 'bg-emerald-500' },
          { label: 'Learning Streak', value: loadingAnalytics ? '...' : `${watchAnalytics?.currentStreak || 0} days`, icon: '🔥', color: 'bg-amber-500' },
        ].map((card, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
              <span className={`h-8 w-8 rounded-lg ${card.color} flex items-center justify-center text-sm shadow-md group-hover:scale-110 transition-transform`}>
                {card.icon}
              </span>
            </div>
            <span className="text-2xl font-extrabold text-slate-800 block">{card.value}</span>
          </div>
        ))}
      </div>

      {/* Weekly Watch Chart */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Watch Minutes This Week</h3>
        {renderWeeklyChart()}
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Recent Activity</h3>
        {loadingAnalytics ? (
          <div className="py-8 text-center text-slate-400 text-xs animate-pulse">Loading activity...</div>
        ) : !watchAnalytics?.recentSessions?.length ? (
          <div className="py-8 text-center text-slate-400 text-xs space-y-2">
            <span className="text-2xl block">🎬</span>
            <p>No watch sessions yet. Start learning to see your activity!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 space-y-0">
            {watchAnalytics.recentSessions.slice(0, 5).map((session: any, i: number) => (
              <div key={i} className="py-3 flex items-center gap-4 first:pt-0 last:pb-0">
                <div className="h-9 w-9 rounded-lg bg-teal-50 flex items-center justify-center text-sm flex-shrink-0">🎥</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{session.lessonTitle}</p>
                  <p className="text-[10px] text-slate-400">{session.courseTitle}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-teal-600">{Math.round(session.watchedSeconds / 60)} min</p>
                  <p className="text-[9px] text-slate-400">{formatDateString(session.updatedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderCoursesTab = () => {
    const filteredEnrollments = enrollments.filter((enrollment) => {
      const course = enrollment.course;
      if (!course) return false;
      const matchesSearch =
        course.title.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(courseSearchQuery.toLowerCase());
      const matchesCategory =
        selectedCategoryFilter === 'All' || course.category === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });

    return (
      <div className="space-y-6 animate-fade-in text-left">
        {/* Responsive Filters & Info Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 font-sans tracking-tight">My Enrolled Courses</h2>
            <Link href="/courses" className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline transition mt-0.5 block">
              Explore Catalog →
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 min-w-[140px] md:w-48 md:flex-none">
              <input
                type="text"
                placeholder="Search enrolled courses..."
                value={courseSearchQuery}
                onChange={(e) => setCourseSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-teal-500 transition duration-200"
              />
              <span className="absolute left-2.5 top-2.5 text-slate-400 text-[10px]">🔍</span>
            </div>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="flex-1 min-w-[120px] md:w-auto px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-teal-500 cursor-pointer"
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="bg-white border border-slate-100 rounded-2xl p-6 h-28 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-6 text-xs text-center">⚠️ {error}</div>
        ) : enrollments.length === 0 ? (
          /* Premium Designed Empty State Card */
          <div className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/60 rounded-3xl p-8 text-center shadow-lg space-y-6 max-w-sm mx-auto my-6 animate-scale-in">
            <div className="absolute -right-10 -top-10 w-28 h-28 bg-teal-400/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-28 h-28 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

            <div className="mx-auto w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-3xl shadow-inner animate-bounce">
              📚
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-800 text-sm font-sans tracking-tight">Your Classroom Awaits</h3>
              <p className="text-slate-400 text-[10px] font-medium leading-relaxed max-w-xs mx-auto">
                You are not enrolled in any courses yet. Browse our professional catalog and start learning today.
              </p>
            </div>
            <Link
              href="/courses"
              className="inline-block w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-md active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 cursor-pointer shadow-teal-500/10 text-center"
            >
              Browse Catalog
            </Link>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <span className="text-4xl block">🔍</span>
            <p className="text-slate-400 text-xs">No enrolled courses match your filter criteria.</p>
          </div>
        ) : (
          /* Premium Course Cards Optimized for Mobile & Desktop */
          <div className="grid grid-cols-1 gap-4">
            {filteredEnrollments.map((enrollment) => {
              const course = enrollment.course;
              if (!course) return null;
              const progress = progresses[course.id] ?? 0;
              const courseWatch = watchAnalytics?.perCourse?.find((c: any) => c.courseId === course.id);

              return (
                <div
                  key={enrollment.id}
                  className="bg-white border border-slate-200/60 hover:border-teal-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center shadow-sm hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex flex-row gap-4 items-start w-full sm:flex-1 min-w-0">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="h-16 w-16 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-sm border border-slate-100"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-3xl group-hover:scale-105 transition-transform duration-200 flex-shrink-0 shadow-sm">
                        🎓
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-2 text-left">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded bg-teal-50 text-teal-600 border border-teal-100 font-extrabold text-[9px] uppercase tracking-wider">
                          {course.category}
                        </span>
                        <h3 className="font-extrabold text-slate-800 text-sm sm:text-base mt-1 leading-snug group-hover:text-teal-700 transition duration-200 truncate">
                          {course.title}
                        </h3>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400 font-medium pt-0.5">
                          <span>Enrolled {formatDateString(enrollment.joinedAt)}</span>
                          {courseWatch && <span>• ⏱️ {courseWatch.totalMinutes} min watched</span>}
                          {courseWatch && <span>• 🎬 {courseWatch.lessonsWatched} lessons</span>}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1 w-full max-w-xs pt-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                          <span>Syllabus Progress</span>
                          <span className="text-teal-600 font-extrabold">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t border-slate-100 sm:border-none">
                    <Link
                      href={`/courses/${course.id}`}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-[11px] font-extrabold cursor-pointer transition shadow-md active:scale-95 text-center whitespace-nowrap"
                    >
                      Enter Classroom
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderHistoryTab = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-extrabold text-slate-800">Watch History</h2>

      {loadingAnalytics ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-slate-100 rounded-2xl p-6 h-20 animate-pulse" />
          ))}
        </div>
      ) : !watchAnalytics?.recentSessions?.length ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <span className="text-4xl block">🎬</span>
          <p className="text-slate-400 text-xs">No watch sessions recorded yet.</p>
          <p className="text-slate-300 text-[10px]">Your video viewing activity will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {watchAnalytics.recentSessions.map((session: any, i: number) => {
            const watchedMin = Math.floor(session.watchedSeconds / 60);
            const watchedSec = session.watchedSeconds % 60;
            const totalMin = Math.floor(session.totalSeconds / 60);
            const totalSec = session.totalSeconds % 60;
            const pct = session.totalSeconds > 0 ? Math.round((session.watchedSeconds / session.totalSeconds) * 100) : 0;

            return (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 shadow-sm hover:shadow-md transition group">
                <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-teal-50 transition">
                  🎥
                </div>

                <div className="flex-1 min-w-0 space-y-2 text-left">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 truncate">{session.lessonTitle}</h4>
                    <p className="text-[10px] text-slate-400">{session.courseTitle}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden max-w-[200px]">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {watchedMin}:{String(watchedSec).padStart(2, '0')} / {totalMin}:{String(totalSec).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[10px] text-slate-400">{formatDateString(session.updatedAt)}</span>
                  <Link
                    href={`/learn/${session.courseId}/${session.lessonId}`}
                    className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-bold rounded-lg border border-teal-100 transition"
                  >
                    Resume ▶
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderCertificatesTab = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-extrabold text-slate-800">Certificates & Awards</h2>

      {certificates.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="h-16 w-16 rounded-full bg-teal-50 border border-teal-100 text-teal-500 flex items-center justify-center text-3xl mx-auto">🏆</div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-700 text-sm">No certificates earned yet</h3>
            <p className="text-slate-400 text-xs leading-relaxed px-4">
              Complete 100% of a course syllabus program to unlock your graduation credential.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {certificates.map((cert) => (
            <div key={cert.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl flex-shrink-0">🏆</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-extrabold text-slate-700 truncate">{cert.course?.title || 'Graduation Certificate'}</h4>
                  <p className="text-[9px] text-teal-600 font-bold mt-0.5">Code: {cert.certificateCode}</p>
                </div>
              </div>
              <Link
                href={`/courses/${cert.courseId}/certificate`}
                className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold rounded-lg text-center transition block"
              >
                View Credential
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderQuizzesTab = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-extrabold text-slate-800">Quizzes & Grades</h2>

      <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center space-y-4 shadow-sm">
        <span className="text-4xl block">✍️</span>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-700 text-sm">Assessment Center</h3>
          <p className="text-slate-400 text-xs leading-relaxed px-4">
            Access quizzes and assignments from your enrolled course pages. Results will appear here.
          </p>
        </div>
        {enrollments.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {enrollments.slice(0, 3).map((e) => (
              <Link
                key={e.id}
                href={`/courses/${e.courseId}`}
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-bold rounded-lg border border-teal-100 transition"
              >
                {e.course?.title?.substring(0, 25) || 'Course'}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-extrabold text-slate-800">Profile</h2>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="h-16 w-16 rounded-2xl object-cover shadow-lg" />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-teal-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-base font-extrabold text-slate-800">{user.fullName}</h3>
            <p className="text-xs text-slate-400">{user.email}</p>
            <span className="text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full mt-1 inline-block">
              🎓 Student Account
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-slate-700">{enrollments.length}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Courses</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-slate-700">{certificates.length}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Certificates</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-slate-700">{averageProgress}%</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Avg Progress</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-slate-700">{watchAnalytics?.totalWatchMinutes || 0}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Minutes Watched</p>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="border-t border-slate-100 pt-6 space-y-4 text-left">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Edit Profile Details</h3>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
              <input
                type="text"
                value={fullNameInput}
                onChange={(e) => setFullNameInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-teal-500 text-slate-700"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Bio / Biography</label>
              <textarea
                rows={3}
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                placeholder="Share your background, interests, or professional goals..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-teal-500 text-slate-700 resize-y"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Profile Picture (Avatar)</label>
              <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-teal-500/50 transition duration-200 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {avatarFile ? (
                  <div className="space-y-1">
                    <span className="text-lg">📄</span>
                    <p className="text-xs font-bold text-slate-700 truncate max-w-xs">{avatarFile.name}</p>
                    <p className="text-[9px] text-slate-400">{(avatarFile.size / 1024).toFixed(1)} KB - Click to replace</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="text-lg">📸</span>
                    <p className="text-xs font-bold text-slate-500">Upload New Profile Picture</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              {savingProfile ? 'Saving Changes...' : 'Save Profile Details'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  // Tab content renderer
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboardTab();
      case 'courses': return renderCoursesTab();
      case 'history': return renderHistoryTab();
      case 'certificates': return renderCertificatesTab();
      case 'quizzes': return renderQuizzesTab();
      case 'messages':
        return <MessagesPanel user={user} />;
      case 'profile': return renderProfileTab();
      default: return renderDashboardTab();
    }
  };

  // Core mobile navigation items
  const mobileNavItems: { id: StudentTab | 'more'; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Home', icon: '📊' },
    { id: 'courses', label: 'Courses', icon: '📚' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'more', label: 'More', icon: '☰' },
  ];

  const moreMenuLinks: { id: StudentTab; label: string; icon: string }[] = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'history', label: 'History', icon: '🎬' },
    { id: 'certificates', label: 'Certificates', icon: '🏆' },
    { id: 'quizzes', label: 'Quizzes', icon: '✍️' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* ===== LEFT SIDEBAR ===== */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-100 flex-col justify-between min-h-screen sticky top-0 shadow-sm flex-shrink-0">
        <div>
          {/* Brand Header */}
          <div className="px-5 py-5 border-b border-slate-100">
            <div className="flex items-center">
              <span className="font-bold tracking-wide text-slate-800 text-sm">
                {settings?.lmsName || 'Aegis Academy'}
              </span>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="px-5 py-4 border-b border-slate-50">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-10 w-10 rounded-xl object-cover shadow-md" />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate">{user.fullName}</p>
                <p className="text-[10px] text-teal-600 font-semibold">🎓 Student</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-4 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-teal-50 text-teal-700 border border-teal-100 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                    activeTab === item.id ? 'bg-teal-200 text-teal-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full py-2 text-xs font-bold text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-lg transition cursor-pointer border border-slate-100 hover:border-red-100"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ===== MAIN WORKSPACE ===== */}
      <main className="flex-1 min-h-screen pb-24 md:pb-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-slate-800 capitalize">
              {activeTab === 'dashboard' ? 'Overview' : sidebarItems.find((s) => s.id === activeTab)?.label}
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5">Welcome back, {user.fullName.split(' ')[0]} 👋</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-semibold select-none bg-teal-50 border-teal-100 text-teal-700">
              <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              Student Session
            </div>
            <span className="hidden sm:block h-4 w-px bg-slate-200" />
            <a href="/" className="text-teal-650 hover:underline">View Portal</a>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-8">
          {renderContent()}
        </div>

        {/* Floating Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50 bg-white/80 backdrop-blur-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl border border-white/20 flex justify-around items-center py-2 px-3">
          {mobileNavItems.map((item) => {
            const isActive = item.id === 'more' ? showMobileMoreMenu : (activeTab === item.id && !showMobileMoreMenu);
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'more') {
                    setShowMobileMoreMenu(!showMobileMoreMenu);
                  } else {
                    setActiveTab(item.id);
                    setShowMobileMoreMenu(false);
                  }
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive ? 'text-teal-600 scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-[9px] mt-0.5 whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile Navigation Bottom Drawer */}
        {showMobileMoreMenu && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-slate-950/40 backdrop-blur-xs">
            {/* Clickable backdrop */}
            <div className="absolute inset-0 -z-10" onClick={() => setShowMobileMoreMenu(false)} />
            
            {/* Bottom Drawer */}
            <div className="bg-white rounded-t-3xl border-t border-slate-200 p-6 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl animate-slide-up">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">More Options</h3>
                <button onClick={() => setShowMobileMoreMenu(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">✕</button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {moreMenuLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => {
                      setActiveTab(link.id);
                      setShowMobileMoreMenu(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      activeTab === link.id
                        ? 'bg-teal-50 text-teal-700 border-teal-100 shadow-sm'
                        : 'bg-slate-50 border-slate-100 hover:bg-slate-100/50 text-slate-600'
                    }`}
                  >
                    <span className="text-base">{link.icon}</span>
                    <span className="whitespace-nowrap">{link.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Sign Out option */}
              <button
                onClick={() => {
                  setShowMobileMoreMenu(false);
                  handleLogout();
                }}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default StudentDashboard;
