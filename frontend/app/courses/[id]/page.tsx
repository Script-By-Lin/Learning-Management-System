'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import courseService from '@/services/courseService';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDateString } from '@/utils/date';
import ConfirmModal from '@/components/ConfirmModal';

interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  type: string;
  order: number;
  duration?: number | null;
}

interface ModuleWithLessons {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnailUrl: string | null;
  instructorId: string;
  price: number;
  level: string;
  createdAt: string;
  updatedAt?: string | null;
  faq?: string | null;
  instructorName?: string | null;
  instructorBio?: string | null;
  instructorAvatarUrl?: string | null;
  outcomes?: string | null;
  requirements?: string | null;
}

interface SyllabusData {
  course: Course;
  modules: ModuleWithLessons[];
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const resolvedParams = React.use(params);
  const courseId = resolvedParams.id;

  const [data, setData] = useState<SyllabusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // Offline Payment State
  const [paymentRecord, setPaymentRecord] = useState<any>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [submittingReceipt, setSubmittingReceipt] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Tab State
  const [activeTabDetail, setActiveTabDetail] = useState<'overview' | 'syllabus' | 'instructor' | 'reviews' | 'quizzes' | 'assignments'>('overview');
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  // Toggle active accordion modules
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Custom Confirmation Modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'danger' | 'warning' | 'info';
    confirmOnly?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmOnly: false,
    onConfirm: () => {}
  });

  const showConfirm = (config: Omit<typeof confirmConfig, 'isOpen'>) => {
    setConfirmConfig({
      ...config,
      isOpen: true
    });
  };

  const closeConfirm = () => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  };

  const showAlert = (title: string, message: string, type: 'info' | 'warning' | 'danger' = 'info') => {
    setConfirmConfig({
      title,
      message,
      type,
      confirmLabel: 'OK',
      confirmOnly: true,
      isOpen: true,
      onConfirm: () => closeConfirm(),
    });
  };

  useEffect(() => {
    async function loadSyllabus() {
      try {
        setLoading(true);
        const res = await courseService.getCourseSyllabus(courseId);
        if (res.success && res.data) {
          setData(res.data);
          // Auto expand the first module
          if (res.data.modules.length > 0) {
            setExpandedModules({ [res.data.modules[0].id]: true });
          }
        } else {
          setError(res.error || 'Failed to load syllabus.');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }
    loadSyllabus();
  }, [courseId]);

  useEffect(() => {
    async function checkEnrollment() {
      if (!user) return;
      try {
        setCheckingEnrollment(true);
        if (user.role === 'STUDENT') {
          const res = await courseService.checkEnrollment(courseId);
          if (res.success && res.data) {
            setEnrolled(res.data.enrolled);

            // Fetch payment status if not enrolled
            if (!res.data.enrolled) {
              setLoadingPayment(true);
              const payRes = await courseService.getOfflinePaymentStatus(courseId);
              if (payRes.success && payRes.data?.payment) {
                setPaymentRecord(payRes.data.payment);
              }
              setLoadingPayment(false);
            }
          }
        } else {
          // instructors/admins bypass and have full view access
          setEnrolled(true);
        }
      } catch (err) {
        console.error('Failed to check enrollment status', err);
      } finally {
        setCheckingEnrollment(false);
      }
    }
    checkEnrollment();
  }, [courseId, user]);

  useEffect(() => {
    async function loadAssessments() {
      try {
        const quizRes = await courseService.getQuizzes(courseId);
        if (quizRes.success) {
          setQuizzes(quizRes.data || []);
        }

        const assRes = await courseService.getAssignments(courseId);
        if (assRes.success) {
          setAssignments(assRes.data || []);
        }
      } catch (e) {
        console.error('Failed to load quizzes/assignments', e);
      }
    }
    loadAssessments();
  }, [courseId]);

  const handleEnroll = async () => {
    if (!user) {
      router.push(`/login?redirect=/courses/${courseId}`);
      return;
    }

    if (user.role !== 'STUDENT') {
      showAlert('Enrollment Restricted', 'Only students can enroll in courses.', 'warning');
      return;
    }

    try {
      setEnrolling(true);
      const res = await courseService.enroll(courseId);
      if (res.success) {
        setEnrolled(true);
      } else {
        showAlert('Enrollment Failed', res.error || 'Failed to enroll in the course.', 'danger');
      }
    } catch (err: any) {
      showAlert('Enrollment Error', err.message || 'Error occurred during enrollment.', 'danger');
    } finally {
      setEnrolling(false);
    }
  };

  const handleEnrollClick = () => {
    if (!user) {
      router.push(`/login?redirect=/courses/${courseId}`);
      return;
    }

    if (user.role !== 'STUDENT') {
      showAlert('Enrollment Restricted', 'Only students can enroll in courses.', 'warning');
      return;
    }

    if (course.price > 0) {
      setShowUploadModal(true);
    } else {
      handleEnroll(); // Free course, enroll directly!
    }
  };

  const handleUploadReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) {
      showAlert('Receipt Required', 'Please select a receipt image to upload.', 'warning');
      return;
    }

    try {
      setSubmittingReceipt(true);
      const res = await courseService.submitOfflinePayment(courseId, String(course.price), receiptFile);
      if (res.success) {
        showAlert('Receipt Submitted', 'Payment receipt submitted successfully! Enrollment is pending administrator approval.', 'info');
        setShowUploadModal(false);
        setReceiptFile(null);
        if (res.data?.payment) {
          setPaymentRecord(res.data.payment);
        }
      } else {
        showAlert('Submission Failed', res.error || 'Failed to submit payment receipt.', 'danger');
      }
    } catch (err: any) {
      showAlert('Upload Error', err.message || 'Error uploading receipt.', 'danger');
    } finally {
      setSubmittingReceipt(false);
    }
  };

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col animate-pulse">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-20 text-slate-500 font-semibold">
          <div className="text-center space-y-4">
            <div className="inline-block animate-spin text-[#0d9488] text-3xl">⏳</div>
            <p className="text-xs">Loading course syllabus...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center max-w-md space-y-4">
            <span className="text-3xl">⚠️</span>
            <p className="font-semibold">{error || 'Course not found.'}</p>
            <Link href="/courses" className="inline-block text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
              Return to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { course, modules } = data;
  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);

  // Find the first lesson ID if enrolled
  let firstLessonLink = '';
  if (modules.length > 0 && modules[0].lessons.length > 0) {
    firstLessonLink = `/learn/${course.id}/${modules[0].lessons[0].id}`;
  }

  // Generic learning outcomes fallback list if none are supplied by the instructor
  const defaultOutcomes = [
    "Understand core concepts and advanced methods in this domain.",
    "Apply industry best practices in real-world scenarios.",
    "Build fully-functional projects to demonstrate practical mastery.",
    "Gain certified credentials to advance your professional career."
  ];

  const totalMinutes = modules.reduce(
    (acc, m) => acc + m.lessons.reduce((lAcc, l) => lAcc + (l.duration || 0), 0),
    0
  );
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Breadcrumbs */}
        <div className="mb-6 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <Link href="/" className="hover:text-teal-600 transition">Home</Link>
          <span>/</span>
          <Link href="/courses" className="hover:text-teal-600 transition">Courses</Link>
          <span>/</span>
          <span className="text-slate-500">Details</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Course Main details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-6">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f112e] leading-tight tracking-tight">
                {course.title}
              </h1>

              {/* Creator details and rating line */}
              <div className="flex flex-wrap items-center gap-y-4 gap-x-6 text-xs text-slate-500 border-b border-slate-200/60 pb-6">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full overflow-hidden bg-slate-200 relative flex-shrink-0 flex items-center justify-center">
                    {course.instructorAvatarUrl ? (
                      <img
                        src={course.instructorAvatarUrl}
                        alt={course.instructorName || 'Instructor'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-full h-full bg-slate-300 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M12 2a5 5 0 100 10 5 5 0 000-10zM5 20a7 7 0 0114 0H5z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="font-semibold text-slate-700">Created by <strong className="text-slate-900 font-bold">{course.instructorName || 'Unknown Instructor'}</strong></span>
                </div>

                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span className="text-slate-400 font-medium ml-1">(0 Reviews)</span>
                </div>

                <div className="flex items-center gap-1">
                  <span>🕒</span>
                  <span>{totalHours} Hours</span>
                </div>

                <div className="flex items-center gap-1">
                  <span>👤</span>
                  <span>0 Enrolled</span>
                </div>

                <div className="flex items-center gap-1">
                  <span>🌐</span>
                  <span>English</span>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                  <span>📅</span>
                  <span>
                    Last updated {formatDateString(course.updatedAt || course.createdAt, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Tab Toggles */}
            <div className="flex flex-wrap border-b border-slate-200/80 gap-1 sm:gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )},
                { id: 'syllabus', label: 'Curriculum', icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                )},
                { id: 'instructor', label: 'Instructor', icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )},
                { id: 'reviews', label: 'Reviews', icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )},
                { id: 'quizzes', label: `MCQ Quizzes (${quizzes.length})`, icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )},
                { id: 'assignments', label: `Assignments (${assignments.length})`, icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabDetail(tab.id as any)}
                  className={`flex items-center gap-2 py-3 px-4 sm:px-5 text-xs font-bold border-b-2 transition cursor-pointer leading-none ${
                    activeTabDetail === tab.id
                      ? 'border-[#0d9488] text-[#0d9488]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            {activeTabDetail === 'overview' && (
              <div className="bg-white border border-slate-200/60 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8 text-left">
                {/* Course description */}
                <div className="space-y-4">
                  <h2 className="text-lg font-extrabold text-[#0f112e]">Course description</h2>
                  <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-line">
                    {course.description}
                  </p>
                </div>

                {/* What will I learn */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h2 className="text-lg font-extrabold text-[#0f112e]">What will i learn?</h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                    {(course.outcomes
                      ? course.outcomes
                          .split('\n')
                          .map((line) => line.trim())
                          .filter((line) => line.length > 0)
                          .map((line) => line.replace(/^[\s\-*•✦]+/, '').trim())
                          .filter((line) => line.length > 0)
                      : defaultOutcomes
                    ).map((point, i) => (
                      <li key={i} className="flex gap-2.5 items-start">
                        <span className="text-[#0d9488] text-sm leading-none mt-0.5">✦</span>
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Requirements */}
                {course.requirements && (
                  <div className="space-y-4 pt-6 border-t border-slate-100">
                    <h2 className="text-lg font-extrabold text-[#0f112e]">Requirements</h2>
                    <ul className="list-disc pl-5 text-xs font-semibold text-slate-600 space-y-2">
                      {course.requirements
                        .split('\n')
                        .map((line) => line.trim())
                        .filter((line) => line.length > 0)
                        .map((line) => line.replace(/^[\s\-*•✦]+/, '').trim())
                        .filter((line) => line.length > 0)
                        .map((req, i) => (
                          <li key={i} className="leading-relaxed">
                            {req}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* FAQ Section */}
                {course.faq && (
                  <div className="space-y-4 pt-6 border-t border-slate-100">
                    <h2 className="text-lg font-extrabold text-[#0f112e]">Frequently Asked Questions</h2>
                    <div className="space-y-3">
                      {(() => {
                        let faqItems: { question: string; answer: string }[] = [];
                        try {
                          faqItems = JSON.parse(course.faq);
                          if (!Array.isArray(faqItems)) {
                            faqItems = [];
                          }
                        } catch (e) {
                          if (course.faq.trim()) {
                            faqItems = [{ question: 'General FAQ', answer: course.faq }];
                          }
                        }

                        if (faqItems.length === 0) return <p className="text-slate-400 text-xs italic">No FAQs available for this course.</p>;

                        return faqItems.map((item, idx) => (
                          <div key={idx} className="border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                            <h3 className="text-xs font-extrabold text-slate-700">Q: {item.question}</h3>
                            <p className="text-xs font-medium text-slate-500 mt-1.5 leading-relaxed whitespace-pre-line">A: {item.answer}</p>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTabDetail === 'syllabus' && (
              <div className="space-y-6 text-left">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-extrabold text-[#0f112e]">Course Syllabus</h2>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                    {modules.length} Modules • {totalLessons} Lessons
                  </span>
                </div>

                {modules.length === 0 ? (
                  <div className="bg-white border border-slate-200/60 rounded-2xl p-8 text-center text-slate-400 text-xs shadow-sm">
                    📭 No modules have been added to this course syllabus yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {modules.map((mod, index) => {
                      const isExpanded = !!expandedModules[mod.id];
                      return (
                        <div
                          key={mod.id}
                          className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm"
                        >
                          <button
                            onClick={() => toggleModule(mod.id)}
                            className="w-full text-left p-5 flex items-center justify-between hover:bg-slate-50/50 transition cursor-pointer"
                          >
                            <div className="flex items-center gap-4">
                              <span className="h-7 w-7 flex items-center justify-center rounded-lg bg-teal-50 text-teal-600 font-bold text-xs">
                                {index + 1}
                              </span>
                              <div>
                                <h3 className="font-extrabold text-sm text-[#0f112e]">{mod.title}</h3>
                                <p className="text-[10px] text-slate-400">{mod.lessons.length} lessons</p>
                              </div>
                            </div>
                            <span className="text-slate-400 text-xs transition duration-200">
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="border-t border-slate-50 bg-slate-50/30 divide-y divide-slate-100">
                              {mod.lessons.length === 0 ? (
                                <div className="p-4 text-center text-slate-400 text-xs italic">
                                  No lessons inside this module yet.
                                </div>
                              ) : (
                                mod.lessons.map((lesson) => (
                                  <div
                                    key={lesson.id}
                                    className="p-4 px-6 flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-slate-400 text-sm">
                                        {lesson.type === 'VIDEO' ? '🎥' : '📄'}
                                      </span>
                                      <span className="text-xs font-semibold text-slate-700">
                                        {lesson.title} {lesson.duration ? `(${lesson.duration}m)` : ''}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {enrolled && firstLessonLink ? (
                                        <Link
                                          href={`/learn/${course.id}/${lesson.id}`}
                                          className="text-[10px] font-bold text-[#0d9488] hover:underline"
                                        >
                                          Study →
                                        </Link>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                                          Locked
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTabDetail === 'instructor' && (
              <div className="bg-white border border-slate-200/60 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-left">
                <h2 className="text-lg font-extrabold text-[#0f112e]">Course Instructor</h2>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-slate-200 relative flex-shrink-0 border-2 border-white shadow-md mx-auto sm:mx-0 flex items-center justify-center">
                    {course.instructorAvatarUrl ? (
                      <img
                        src={course.instructorAvatarUrl}
                        alt={course.instructorName || 'Instructor'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-full h-full bg-slate-300 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M12 2a5 5 0 100 10 5 5 0 000-10zM5 20a7 7 0 0114 0H5z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <h3 className="font-extrabold text-base text-[#0f112e]">{course.instructorName || 'Unknown Instructor'}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expert LMS Instructor</p>
                    <p className="text-slate-500 text-xs leading-relaxed whitespace-pre-line">
                      {course.instructorBio || 'No biography details provided by the instructor yet.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTabDetail === 'reviews' && (
              <div className="bg-white border border-slate-200/60 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-left">
                <h2 className="text-lg font-extrabold text-[#0f112e]">Student Reviews</h2>
                <div className="py-10 text-center space-y-2 max-w-sm mx-auto">
                  <span className="text-3xl block">⭐</span>
                  <h3 className="font-extrabold text-sm text-[#0f112e]">No reviews yet</h3>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Be the first student to review this course program and share your learning feedback with others!
                  </p>
                </div>
              </div>
            )}

            {activeTabDetail === 'quizzes' && (
              <div className="space-y-6 text-left">
                <h2 className="text-lg font-extrabold text-[#0f112e]">Course Quizzes</h2>
                {quizzes.length === 0 ? (
                  <div className="bg-white border border-slate-200/60 rounded-2xl p-8 text-center text-slate-400 text-xs shadow-sm">
                    📭 No quizzes have been defined for this course yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {quizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center justify-between shadow-sm"
                      >
                        <div>
                          <h3 className="font-extrabold text-sm text-[#0f112e]">{quiz.title}</h3>
                          <p className="text-[10px] text-slate-400 mt-1">{quiz.description || 'No description.'}</p>
                        </div>
                        <div>
                          {enrolled ? (
                            <Link
                              href={`/courses/${courseId}/quiz/${quiz.id}`}
                              className="px-4 py-2 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-lg shadow-sm transition block text-center"
                            >
                              Take Quiz →
                            </Link>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider bg-slate-100 px-2 py-1.5 rounded">
                              Locked
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTabDetail === 'assignments' && (
              <div className="space-y-6 text-left">
                <h2 className="text-lg font-extrabold text-[#0f112e]">Course Assignments</h2>
                {assignments.length === 0 ? (
                  <div className="bg-white border border-slate-200/60 rounded-2xl p-8 text-center text-slate-400 text-xs shadow-sm">
                    📭 No assignments have been posted for this course yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center justify-between shadow-sm"
                      >
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-sm text-[#0f112e]">{assignment.title}</h3>
                          {assignment.dueDate && (
                            <p className="text-[10px] font-semibold text-slate-400">
                              Due Date: {formatDateString(assignment.dueDate)}
                            </p>
                          )}
                        </div>
                        <div>
                          {enrolled ? (
                            <Link
                              href={`/courses/${courseId}/assignment/${assignment.id}`}
                              className="px-4 py-2 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-lg shadow-sm transition block text-center"
                            >
                              Open Task →
                            </Link>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider bg-slate-100 px-2 py-1.5 rounded">
                              Locked
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Spec Sidebar Panel */}
          <div className="lg:col-span-1 lg:sticky lg:top-24">
            <div className="bg-white border border-slate-200/60 rounded-[1.5rem] overflow-hidden shadow-md space-y-6 pb-6">
              {/* Media Thumbnail with play button overlay */}
              <div className="w-full aspect-video bg-white flex items-center justify-center relative border-b border-slate-100 group cursor-pointer overflow-hidden">
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  /* Center logo (gradient placeholder with course initials) */
                  <div className="h-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-black text-3xl select-none w-full aspect-video">
                    {course.title ? course.title.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'LMS'}
                  </div>
                )}

                {/* Dark overlay & Play button */}
                <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center transition opacity group-hover:bg-slate-950/30">
                  <div className="h-12 w-12 rounded-full bg-white/95 shadow-md flex items-center justify-center text-slate-800 hover:scale-110 transition duration-200">
                    <svg className="w-5 h-5 fill-current text-slate-700 ml-0.5" viewBox="0 0 24 24">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Price and Specifications Container */}
              <div className="px-6 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900 leading-none">
                    {course.price > 0 ? `${course.price.toLocaleString()} MMK` : 'Free'}
                  </span>
                  {/* Mock action icon */}
                  <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center text-xs text-slate-500 cursor-pointer hover:bg-slate-100 transition">
                    🔄
                  </div>
                </div>

                {/* Spec List */}
                <div className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  <div className="py-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-500">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span>Lectures</span>
                    </div>
                    <span className="text-slate-900">{totalLessons}</span>
                  </div>

                  <div className="py-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-500">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                      </svg>
                      <span>Skill level</span>
                    </div>
                    <span className="text-slate-900">{course.level || 'Beginner'}</span>
                  </div>

                  <div className="py-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-500">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Expiry period</span>
                    </div>
                    <span className="text-slate-900">Lifetime</span>
                  </div>
                </div>

                {/* Primary Actions */}
                <div className="space-y-3 pt-2">
                  {checkingEnrollment || loadingPayment ? (
                    <div className="w-full h-11 bg-slate-100 animate-pulse rounded-xl" />
                  ) : user && user.role !== 'STUDENT' ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500 font-bold leading-relaxed">
                      Logged in as <strong className="text-teal-600 font-extrabold">{user.role}</strong>. Enrollments are restricted to Students.
                    </div>
                  ) : enrolled ? (
                    firstLessonLink ? (
                      <Link
                        href={firstLessonLink}
                        className="w-full py-3 px-4 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/10 text-center flex items-center justify-center gap-2 transition duration-200"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                        <span>Resume Learning</span>
                      </Link>
                    ) : (
                      <div className="w-full py-3 px-4 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl text-center">
                        ✓ Enrolled (No lessons yet)
                      </div>
                    )
                  ) : paymentRecord && paymentRecord.status === 'PENDING' ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center text-xs text-amber-700 font-bold leading-relaxed space-y-1.5">
                      <div className="flex items-center justify-center gap-1.5 text-amber-800">
                        <span>🕒</span> Payment Pending Review
                      </div>
                      <div className="text-[10px] text-amber-600 font-semibold normal-case">
                        Our administrators are verifying your transaction receipt. Once approved, your classroom access will unlock automatically.
                      </div>
                    </div>
                  ) : paymentRecord && paymentRecord.status === 'REJECTED' ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center text-xs text-rose-700 font-bold leading-relaxed space-y-3">
                      <div className="flex items-center justify-center gap-1.5 text-rose-800">
                        <span>❌</span> Payment Receipt Rejected
                      </div>
                      <div className="text-[10px] text-rose-600 font-semibold normal-case">
                        Your payment receipt was rejected. Please double-check your transaction details and submit a valid receipt.
                      </div>
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition duration-200 cursor-pointer"
                      >
                        Re-upload Payment Receipt
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={handleEnrollClick}
                        disabled={enrolling}
                        className="w-full py-3 px-4 bg-white border border-[#0d9488] hover:bg-teal-50/40 text-[#0d9488] text-xs font-bold rounded-xl text-center block transition duration-200 cursor-pointer"
                      >
                        + Add to cart
                      </button>

                      <button
                        onClick={handleEnrollClick}
                        disabled={enrolling}
                        className="w-full py-3 px-4 bg-[#0d9488] hover:bg-[#0f766e] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/10 text-center flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
                      >
                        <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{enrolling ? 'Enrolling...' : user ? 'Buy now' : 'Join to Enroll'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Offline Payment Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-left relative">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-extrabold text-[#0f112e] font-sans">Offline Manual Payment</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Please transfer the course fee to complete your enrollment.</p>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* Bank Accounts */}
            <div className="bg-[#f8fafc] rounded-2xl p-4 border border-slate-100 text-xs text-slate-600 space-y-3">
              <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Official Bank Accounts</div>
              <div className="space-y-2 font-medium">
                <div className="flex justify-between items-center">
                  <span>📱 KBZPay</span>
                  <strong className="text-slate-800">09-123456789</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>🏦 KBZ Bank</span>
                  <strong className="text-slate-800">123-456-7890123456</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>🏦 CB Bank</span>
                  <strong className="text-slate-800">001-2345-67890123</strong>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-200/50">
                Account Holder: <strong className="text-slate-700">{course.instructorName || 'Yan Myo Aung'}</strong>
              </div>
            </div>

            {/* Submit Form */}
            <form onSubmit={handleUploadReceiptSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Amount (MMK)</label>
                <input 
                  type="text" 
                  disabled 
                  value={course.price > 0 ? `${course.price.toLocaleString()} MMK` : 'Free'}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1 font-sans">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Receipt (Image)</label>
                <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-[#0d9488]/50 transition duration-200 flex flex-col items-center justify-center text-center cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    required
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {receiptFile ? (
                    <div className="space-y-1">
                      <span className="text-xl">📄</span>
                      <p className="text-xs font-bold text-slate-800 truncate max-w-xs">{receiptFile.name}</p>
                      <p className="text-[9px] text-slate-400">{(receiptFile.size / 1024).toFixed(1)} KB - Click to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-xl">📸</span>
                      <p className="text-xs font-bold text-slate-500">Upload Receipt Screenshot</p>
                      <p className="text-[9px] text-slate-400">Supports PNG, JPG, JPEG</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingReceipt}
                className="w-full py-3 bg-[#0d9488] hover:bg-[#0f766e] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/10 text-center transition duration-200 cursor-pointer"
              >
                {submittingReceipt ? 'Uploading...' : 'Submit Payment'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        cancelLabel={confirmConfig.cancelLabel}
        type={confirmConfig.type}
        confirmOnly={confirmConfig.confirmOnly}
        onConfirm={confirmConfig.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}
