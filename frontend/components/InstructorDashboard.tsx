'use client';

import React, { useEffect, useState } from 'react';
import { UserProfile } from './AuthProvider';
import courseService from '@/services/courseService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessagesPanel } from './MessagesPanel';
import { useAuth } from '@/hooks/useAuth';
import authService from '@/services/authService';

interface InstructorDashboardProps {
  user: UserProfile;
}

interface CourseTaught {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnailUrl: string | null;
  instructorId: string;
  createdAt: string;
  modulesCount?: number;
  lessonsCount?: number;
  enrolledCount?: number;
}

type InstructorTab = 'dashboard' | 'courses' | 'analytics' | 'assessments' | 'announcements' | 'messages' | 'profile';

export function InstructorDashboard({ user }: InstructorDashboardProps) {
  const router = useRouter();
  const { logout, refreshProfile, settings } = useAuth();
  const [activeTab, setActiveTab] = useState<InstructorTab>('dashboard');
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);
  const [activeDetailItem, setActiveDetailItem] = useState<{
    type: 'perCourse' | 'studentProgress';
    data: any;
  } | null>(null);

  // Course data
  const [courses, setCourses] = useState<CourseTaught[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Create course modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Advanced course creation inputs
  const [categories, setCategories] = useState<any[]>([]);
  const [courseCategoryId, setCourseCategoryId] = useState('');
  const [courseLevel, setCourseLevel] = useState('Beginner');
  const [courseStatus, setCourseStatus] = useState('ACTIVE');
  const [courseFaqList, setCourseFaqList] = useState<{ question: string; answer: string }[]>([{ question: '', answer: '' }]);
  const [courseRequirements, setCourseRequirements] = useState('');
  const [courseOutcomes, setCourseOutcomes] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // Instructor analytics
  const [instructorAnalytics, setInstructorAnalytics] = useState<any>(null);
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

  // Announcements
  const [selectedCourseForAnnouncement, setSelectedCourseForAnnouncement] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  const loadCategories = async () => {
    try {
      const res = await courseService.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
        if (res.data.length > 0) {
          setCourseCategoryId(res.data[0].id);
          setCourseCategory(res.data[0].name);
        }
      }
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  useEffect(() => {
    loadCourses();
    loadInstructorAnalytics();
    loadCategories();
  }, [activeTab]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await courseService.getTeachingCourses();
      if (res.success && res.data) {
        const coursesData: CourseTaught[] = res.data;
        const coursesWithCounts = await Promise.all(
          coursesData.map(async (c) => {
            try {
              const syl = await courseService.getCourseSyllabus(c.id);
              if (syl.success && syl.data) {
                const modules = syl.data.modules || [];
                const lessonsCount = modules.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0);
                return { ...c, modulesCount: modules.length, lessonsCount, enrolledCount: 0 };
              }
            } catch (e) {
              console.error(e);
            }
            return { ...c, modulesCount: 0, lessonsCount: 0, enrolledCount: 0 };
          })
        );
        setCourses(coursesWithCounts);
      } else {
        setError(res.error || 'Failed to load teaching courses.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const loadInstructorAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const res = await courseService.getInstructorAnalytics();
      if (res.success && res.data) {
        setInstructorAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to load instructor analytics', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle || !courseCategory || !courseDescription) {
      alert('Please fill out all fields.');
      return;
    }
    try {
      setCreating(true);

      let uploadedThumbnailUrl: string | null = null;
      if (thumbnailFile) {
        const uploadRes = await courseService.uploadThumbnail(thumbnailFile);
        if (uploadRes.success && uploadRes.data?.thumbnailUrl) {
          uploadedThumbnailUrl = uploadRes.data.thumbnailUrl;
        } else {
          alert(uploadRes.error || 'Failed to upload course thumbnail.');
          return;
        }
      }

      const res = await courseService.createCourse({
        title: courseTitle,
        category: courseCategory,
        description: courseDescription,
        thumbnailUrl: uploadedThumbnailUrl,
        categoryId: courseCategoryId || null,
        level: courseLevel,
        status: courseStatus,
        faq: courseFaqList.filter(f => f.question.trim() || f.answer.trim()).length > 0
          ? JSON.stringify(courseFaqList.filter(f => f.question.trim() || f.answer.trim()))
          : null,
        requirements: courseRequirements || null,
        outcomes: courseOutcomes || null,
      });
      if (res.success) {
        setCourseTitle('');
        setCourseDescription('');
        setCourseFaqList([{ question: '', answer: '' }]);
        setCourseRequirements('');
        setCourseOutcomes('');
        setThumbnailFile(null);
        setShowCreateModal(false);
        loadCourses();
        loadInstructorAnalytics();
      } else {
        alert(res.error || 'Failed to create course.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course and all its modules/lessons? This action cannot be undone.')) return;
    try {
      const res = await courseService.deleteCourse(courseId);
      if (res.success) {
        loadCourses();
        loadInstructorAnalytics();
      } else {
        alert(res.error || 'Failed to delete course.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForAnnouncement || !announcementTitle || !announcementContent) {
      alert('Please fill out all fields.');
      return;
    }
    try {
      setPostingAnnouncement(true);
      const res = await courseService.postAnnouncement(selectedCourseForAnnouncement, {
        title: announcementTitle,
        content: announcementContent,
      });
      if (res.success) {
        setAnnouncementTitle('');
        setAnnouncementContent('');
        alert('Announcement published successfully!');
      } else {
        alert(res.error || 'Failed to publish announcement.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
    } finally {
      setPostingAnnouncement(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  // Sidebar items
  const sidebarItems: { id: InstructorTab; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'courses', label: 'My Courses', icon: '📚', badge: courses.length },
    { id: 'analytics', label: 'Student Analytics', icon: '👥' },
    { id: 'assessments', label: 'Assessments', icon: '✍️' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  // SVG Engagement Chart
  const renderEngagementChart = () => {
    const perCourse = instructorAnalytics?.perCourse || [];
    if (perCourse.length === 0) {
      return (
        <div className="py-12 text-center text-slate-400 text-xs">
          <span className="text-3xl block mb-2">📈</span>
          No student engagement data yet.
        </div>
      );
    }

    const maxVal = Math.max(...perCourse.map((c: any) => c.totalWatchMinutes), 1);
    const barWidth = 40;
    const gap = 20;
    const chartWidth = Math.max(400, perCourse.length * (barWidth + gap) + 60);
    const chartHeight = 200;
    const padding = { top: 20, right: 20, bottom: 60, left: 40 };
    const innerH = chartHeight - padding.top - padding.bottom;

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
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
        {/* Bars */}
        {perCourse.map((course: any, i: number) => {
          const barH = (course.totalWatchMinutes / maxVal) * innerH;
          const x = padding.left + i * (barWidth + gap) + gap / 2;
          const y = padding.top + innerH - barH;

          return (
            <g key={i}>
              <defs>
                <linearGradient id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
              </defs>
              <rect x={x} y={y} width={barWidth} height={barH} rx="6" fill={`url(#barGrad${i})`} className="opacity-80 hover:opacity-100 transition-opacity" />
              <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className="text-[8px] fill-teal-600 font-bold">
                {course.totalWatchMinutes}m
              </text>
              <text x={x + barWidth / 2} y={padding.top + innerH + 14} textAnchor="middle" className="text-[7px] fill-slate-400 font-semibold">
                {course.courseTitle?.substring(0, 12)}
              </text>
              <text x={x + barWidth / 2} y={padding.top + innerH + 26} textAnchor="middle" className="text-[7px] fill-slate-300 font-medium">
                {course.enrolledCount} students
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // ========== TAB RENDERS ==========

  const renderDashboardTab = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Courses Created', value: loadingAnalytics ? '...' : instructorAnalytics?.coursesCreated || 0, icon: '📚', color: 'bg-teal-500' },
          { label: 'Total Students', value: loadingAnalytics ? '...' : instructorAnalytics?.totalStudentsEnrolled || 0, icon: '👥', color: 'bg-teal-600' },
          { label: 'Watch Minutes', value: loadingAnalytics ? '...' : `${instructorAnalytics?.totalWatchMinutesByStudents || 0}`, icon: '⏱️', color: 'bg-emerald-500' },
          { label: 'Platform Status', value: 'Active', icon: '🟢', color: 'bg-amber-500' },
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

      {/* Student Engagement Chart */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Student Engagement By Course</h3>
        {renderEngagementChart()}
      </div>
    </div>
  );

  const renderCoursesTab = () => {
    const filteredCourses = courses.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(courseSearchQuery.toLowerCase());
      const matchesCategory =
        selectedCategoryFilter === 'All' || c.category === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });

    return (
      <div className="space-y-6 animate-fade-in text-left">
        {/* Responsive Filter & Search Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 font-sans tracking-tight">My Managed Courses</h2>
            <p className="text-slate-400 text-[10px] font-semibold mt-0.5">
              Filter, search, and edit your active course syllabus.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 min-w-[140px] md:w-48 md:flex-none">
              <input
                type="text"
                placeholder="Search courses..."
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
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                if (!user.isApproved) {
                  alert('Your instructor account is pending admin approval. You cannot create courses.');
                  return;
                }
                setShowCreateModal(true);
              }}
              disabled={!user.isApproved}
              className={`w-full md:w-auto px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition duration-200 flex-shrink-0 flex items-center justify-center gap-1.5 ${
                user.isApproved 
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 cursor-pointer active:scale-95' 
                  : 'bg-slate-300 cursor-not-allowed shadow-none'
              }`}
            >
              <span>+</span> New Course
            </button>
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
        ) : courses.length === 0 ? (
          /* Premium Designed Empty State Card */
          <div className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/60 rounded-3xl p-8 text-center shadow-lg space-y-6 max-w-sm mx-auto my-6 animate-scale-in">
            <div className="absolute -right-10 -top-10 w-28 h-28 bg-teal-400/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-28 h-28 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

            <div className="mx-auto w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-3xl shadow-inner animate-bounce">
              📚
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-800 text-sm font-sans tracking-tight">Start Your Teaching Journey</h3>
              <p className="text-slate-400 text-[10px] font-medium leading-relaxed max-w-xs mx-auto">
                Publish structure lessons, quizzes, stream high quality video lectures and engage with students.
              </p>
            </div>
            <button
              onClick={() => {
                if (!user.isApproved) {
                  alert('Your instructor account is pending admin approval. You cannot create courses.');
                  return;
                }
                setShowCreateModal(true);
              }}
              disabled={!user.isApproved}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-md active:scale-95 ${
                user.isApproved 
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 cursor-pointer shadow-teal-500/10' 
                  : 'bg-slate-300 cursor-not-allowed shadow-none'
              }`}
            >
              Create First Course
            </button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <span className="text-4xl block">🔍</span>
            <p className="text-slate-400 text-xs">No courses match your filter criteria.</p>
          </div>
        ) : (
          /* Premium Course Cards Optimized for Mobile & Desktop */
          <div className="grid grid-cols-1 gap-4">
            {filteredCourses.map((course) => {
              const courseAnalytics = instructorAnalytics?.perCourse?.find((c: any) => c.courseId === course.id);
              return (
                <div
                  key={course.id}
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

                    <div className="flex-1 min-w-0 space-y-1 text-left">
                      <span className="inline-block px-2 py-0.5 rounded bg-teal-50 text-teal-600 border border-teal-100 font-extrabold text-[9px] uppercase tracking-wider">
                        {course.category}
                      </span>
                      <h3 className="font-extrabold text-slate-800 text-sm sm:text-base mt-1 leading-snug group-hover:text-teal-700 transition duration-200 truncate">
                        {course.title}
                      </h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400 font-medium pt-1">
                        <span className="flex items-center gap-1">📑 {course.modulesCount || 0} Modules</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">🎬 {course.lessonsCount || 0} Lessons</span>
                        {courseAnalytics && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">👥 {courseAnalytics.enrolledCount} Students</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t border-slate-100 sm:border-none">
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 text-[11px] font-bold cursor-pointer transition active:scale-95"
                    >
                      Delete
                    </button>
                    <Link
                      href={`/courses/${course.id}/edit`}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-[11px] font-extrabold cursor-pointer transition shadow-md active:scale-95 text-center whitespace-nowrap"
                    >
                      Manage Syllabus
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

  const renderAnalyticsTab = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-extrabold text-slate-800">Student Analytics</h2>

      {loadingAnalytics ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-slate-100 rounded-2xl p-6 h-24 animate-pulse" />
          ))}
        </div>
      ) : !instructorAnalytics?.perCourse?.length ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <span className="text-4xl block">📊</span>
          <p className="text-slate-400 text-xs">No student analytics available. Create courses and get enrollments to see engagement data.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm text-center">
              <p className="text-3xl font-extrabold text-teal-600">{instructorAnalytics.totalStudentsEnrolled}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Total Students</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm text-center">
              <p className="text-3xl font-extrabold text-emerald-600">{instructorAnalytics.totalWatchMinutesByStudents}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Total Watch Minutes</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm text-center">
              <p className="text-3xl font-extrabold text-cyan-600">{instructorAnalytics.coursesCreated}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Courses Created</p>
            </div>
          </div>

          {/* Per-course breakdown */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Per-Course Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="text-left px-6 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Course</th>
                    <th className="text-center px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Students</th>
                    <th className="text-center px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Watch (min)</th>
                    <th className="text-center px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Avg Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {instructorAnalytics.perCourse.map((course: any, i: number) => (
                    <tr 
                      key={i} 
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                          setActiveDetailItem({ type: 'perCourse', data: course });
                        }
                      }}
                      className="hover:bg-slate-50/50 transition cursor-pointer md:cursor-default"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-700">{course.courseTitle}</td>
                      <td className="px-4 py-4 text-center font-bold text-slate-600">{course.enrolledCount}</td>
                      <td className="px-4 py-4 text-center font-bold text-teal-600">{course.totalWatchMinutes}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                               className="h-full bg-teal-500 rounded-full"
                               style={{ width: `${Math.min(course.avgCompletionPercent, 100)}%` }}
                            />
                          </div>
                          <span className="text-slate-500 font-bold">{course.avgCompletionPercent}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Student-specific engagement breakdown */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Enrolled Students Progress</h3>
              <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-bold">Live Watch Activity</span>
            </div>
            {instructorAnalytics.studentWatchDetails && instructorAnalytics.studentWatchDetails.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="text-left px-6 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Student Name</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Course</th>
                      <th className="text-center px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Watched Time</th>
                      <th className="text-center px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {instructorAnalytics.studentWatchDetails.map((detail: any, i: number) => (
                      <tr 
                        key={i} 
                        onClick={() => {
                          if (typeof window !== 'undefined' && window.innerWidth < 768) {
                            setActiveDetailItem({ type: 'studentProgress', data: detail });
                          }
                        }}
                        className="hover:bg-slate-50/50 transition cursor-pointer md:cursor-default"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-700">{detail.studentName}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{detail.studentEmail}</div>
                        </td>
                        <td className="px-4 py-4 text-slate-600 font-semibold">{detail.courseTitle}</td>
                        <td className="px-4 py-4 text-center font-bold text-teal-600">
                          {detail.watchedMinutes >= 60 
                            ? `${Math.floor(detail.watchedMinutes / 60)}h ${detail.watchedMinutes % 60}m` 
                            : `${detail.watchedMinutes} min`}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-500 rounded-full"
                                style={{ width: `${detail.completionPercent}%` }}
                              />
                            </div>
                            <span className="text-slate-500 font-bold">{detail.completionPercent}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                No active watch details yet for enrolled students.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderAssessmentsTab = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-extrabold text-slate-800">Assessments & Grading</h2>

      <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center space-y-4 shadow-sm">
        <span className="text-4xl block">✍️</span>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-700 text-sm">Grade student submissions</h3>
          <p className="text-slate-400 text-xs leading-relaxed px-4">
            Access assignment submissions and quiz results from each course page. Navigate to a course and manage assessments.
          </p>
        </div>
        {courses.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {courses.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                href={`/courses/${c.id}`}
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-bold rounded-lg border border-teal-100 transition"
              >
                {c.title?.substring(0, 25)}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderAnnouncementsTab = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-extrabold text-slate-800">Post Announcement</h2>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
        <form onSubmit={handlePostAnnouncement} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Select Course</label>
            <select
              value={selectedCourseForAnnouncement}
              onChange={(e) => setSelectedCourseForAnnouncement(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-slate-700"
              required
            >
              <option value="">Choose a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Title</label>
            <input
              type="text"
              placeholder="Announcement title"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-slate-700"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Content</label>
            <textarea
              rows={5}
              placeholder="Write your announcement message..."
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-slate-700 resize-y"
              required
            />
          </div>

          <button
            type="submit"
            disabled={postingAnnouncement}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
          >
            {postingAnnouncement ? 'Publishing...' : '📢 Publish Announcement'}
          </button>
        </form>
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
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full mt-1 inline-block">
              👨‍🏫 Instructor Account
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-slate-700">{courses.length}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Courses</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-slate-700">{instructorAnalytics?.totalStudentsEnrolled || 0}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Students</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-slate-700">{instructorAnalytics?.totalWatchMinutesByStudents || 0}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Watch Min</p>
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
                placeholder="Share your expertise, achievements, and teaching style..."
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
      case 'analytics': return renderAnalyticsTab();
      case 'assessments': return renderAssessmentsTab();
      case 'announcements': return renderAnnouncementsTab();
      case 'messages':
        return <MessagesPanel user={user} />;
      case 'profile': return renderProfileTab();
      default: return renderDashboardTab();
    }
  };

  // Core mobile navigation items
  const mobileNavItems: { id: InstructorTab | 'more'; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Home', icon: '📊' },
    { id: 'courses', label: 'Courses', icon: '📚' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'more', label: 'More', icon: '☰' },
  ];

  const moreMenuLinks: { id: InstructorTab; label: string; icon: string }[] = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'analytics', label: 'Analytics', icon: '👥' },
    { id: 'assessments', label: 'Assessments', icon: '✍️' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* ===== LEFT SIDEBAR ===== */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-100 flex flex-col justify-between min-h-screen sticky top-0 shadow-sm flex-shrink-0">
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
                <p className="text-[10px] text-emerald-600 font-semibold">👨‍🏫 Instructor</p>
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
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-semibold select-none bg-emerald-50 border-emerald-100 text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Instructor Session
            </div>
            <span className="hidden sm:block h-4 w-px bg-slate-200" />
            <a href="/" className="text-teal-600 hover:underline">View Portal</a>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-8">
          {!user.isApproved && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="text-xs font-bold text-amber-800">Account Approval Pending</p>
                  <p className="text-[10px] text-amber-600 mt-0.5">
                    Your instructor profile is pending approval by Aegis Academy administrators. You cannot publish or create new courses until your account is approved.
                  </p>
                </div>
              </div>
            </div>
          )}
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

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base text-slate-800">Create New Course Program</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Course Title</label>
                <input
                  type="text"
                  placeholder="e.g. Introduction to Next.js"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-slate-700"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                <select
                  value={courseCategoryId}
                  onChange={(e) => {
                    setCourseCategoryId(e.target.value);
                    const selected = categories.find((cat) => cat.id === e.target.value);
                    if (selected) {
                      setCourseCategory(selected.name);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-slate-700"
                  required
                >
                  <option value="">Select Category (created by Admin)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Level</label>
                  <select
                    value={courseLevel}
                    onChange={(e) => setCourseLevel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-teal-500 text-slate-700"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Visibility</label>
                  <select
                    value={courseStatus}
                    onChange={(e) => setCourseStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-teal-500 text-slate-700"
                  >
                    <option value="ACTIVE">Active (Public)</option>
                    <option value="PRIVATE">Private</option>
                    <option value="UPCOMING">Upcoming</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Course Thumbnail</label>
                <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-teal-500/50 transition duration-200 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {thumbnailFile ? (
                    <div className="space-y-1">
                      <span className="text-lg">📄</span>
                      <p className="text-xs font-bold text-slate-700 truncate max-w-xs">{thumbnailFile.name}</p>
                      <p className="text-[9px] text-slate-400">{(thumbnailFile.size / 1024).toFixed(1)} KB - Click to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-lg">📸</span>
                      <p className="text-xs font-bold text-slate-500">Upload Thumbnail Image</p>
                      <p className="text-[9px] text-slate-400">PNG, JPG, JPEG, WEBP</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe what students will learn in this course..."
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-slate-700 resize-y"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Requirements to Attend</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Basic knowledge of JavaScript, laptop and internet connection..."
                  value={courseRequirements}
                  onChange={(e) => setCourseRequirements(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-teal-500 text-slate-700 resize-y"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Learning Outcomes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Build single-page React apps, deploy next-gen layouts..."
                  value={courseOutcomes}
                  onChange={(e) => setCourseOutcomes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-teal-500 text-slate-700 resize-y"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Course FAQ</label>
                  <button
                    type="button"
                    onClick={() => setCourseFaqList([...courseFaqList, { question: '', answer: '' }])}
                    className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-[#0d9488] text-[10px] font-bold rounded-lg border border-teal-100 transition cursor-pointer"
                  >
                    + Add QA Pair
                  </button>
                </div>
                <div className="space-y-3">
                  {courseFaqList.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2.5 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Pair #{idx + 1}</span>
                        {courseFaqList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setCourseFaqList(courseFaqList.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 text-[9px] font-bold transition cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="Question"
                          value={item.question}
                          onChange={(e) => {
                            const updated = [...courseFaqList];
                            updated[idx].question = e.target.value;
                            setCourseFaqList(updated);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-teal-500 text-slate-700 font-semibold"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <textarea
                          rows={2}
                          placeholder="Answer"
                          value={item.answer}
                          onChange={(e) => {
                            const updated = [...courseFaqList];
                            updated[idx].answer = e.target.value;
                            setCourseFaqList(updated);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-teal-500 text-slate-700 resize-y"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {creating ? 'Creating Course...' : 'Create Course'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE CLICK DETAILS MODAL OVERLAY */}
      {activeDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 text-slate-700 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-wider text-xs">
                Detail View: {activeDetailItem.type === 'perCourse' ? 'Course Engagement' : 'Student Progress'}
              </h3>
              <button
                onClick={() => setActiveDetailItem(null)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {activeDetailItem.type === 'perCourse' && (() => {
                const course = activeDetailItem.data;
                return (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Course Title</span>
                      <span className="col-span-2 text-slate-800 font-semibold">{course.courseTitle}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Enrolled Students</span>
                      <span className="col-span-2 text-slate-800 font-bold text-teal-600">{course.enrolledCount}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Total Watch Time</span>
                      <span className="col-span-2 text-slate-800 font-bold text-emerald-600">{course.totalWatchMinutes} minutes</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 pb-2">
                      <span className="font-bold text-slate-400">Avg Completion</span>
                      <span className="col-span-2">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full"
                              style={{ width: `${Math.min(course.avgCompletionPercent, 100)}%` }}
                            />
                          </div>
                          <span className="text-slate-700 font-bold">{course.avgCompletionPercent}%</span>
                        </div>
                      </span>
                    </div>
                  </div>
                );
              })()}

              {activeDetailItem.type === 'studentProgress' && (() => {
                const detail = activeDetailItem.data;
                return (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Student Name</span>
                      <span className="col-span-2 text-slate-800 font-semibold">{detail.studentName}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Student Email</span>
                      <span className="col-span-2 text-slate-805 font-mono break-all">{detail.studentEmail}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Course Title</span>
                      <span className="col-span-2 text-slate-800 font-semibold">{detail.courseTitle}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Watched Time</span>
                      <span className="col-span-2 text-slate-800 font-bold text-teal-600">
                        {detail.watchedMinutes >= 60 
                          ? `${Math.floor(detail.watchedMinutes / 60)}h ${detail.watchedMinutes % 60}m` 
                          : `${detail.watchedMinutes} minutes`}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 pb-2">
                      <span className="font-bold text-slate-400">Overall Progress</span>
                      <span className="col-span-2">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full"
                              style={{ width: `${detail.completionPercent}%` }}
                            />
                          </div>
                          <span className="text-slate-700 font-bold">{detail.completionPercent}%</span>
                        </div>
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstructorDashboard;
