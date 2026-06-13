'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import courseService from '@/services/courseService';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDateString } from '@/utils/date';

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
  faq?: string | null;
  instructorName?: string | null;
  instructorBio?: string | null;
  instructorAvatarUrl?: string | null;
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
      alert('Only students can enroll in courses.');
      return;
    }

    try {
      setEnrolling(true);
      const res = await courseService.enroll(courseId);
      if (res.success) {
        setEnrolled(true);
      } else {
        alert(res.error || 'Failed to enroll in the course.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred during enrollment.');
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
      alert('Only students can enroll in courses.');
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
      alert('Please select a receipt image to upload.');
      return;
    }

    try {
      setSubmittingReceipt(true);
      const res = await courseService.submitOfflinePayment(courseId, String(course.price), receiptFile);
      if (res.success) {
        alert('Payment receipt submitted successfully! Enrollment is pending administrator approval.');
        setShowUploadModal(false);
        setReceiptFile(null);
        if (res.data?.payment) {
          setPaymentRecord(res.data.payment);
        }
      } else {
        alert(res.error || 'Failed to submit payment receipt.');
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading receipt.');
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

  // Dynamic values helper based on course title
  const getCourseSpecs = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('odoo')) {
      return {
        price: '400000K',
        logo: <span className="text-[#5c3c92] font-black text-3xl tracking-tighter select-none font-sans">odoo</span>,
        lectures: 18,
        level: 'Beginner',
        instructor: 'Yan Myo Aung',
        bio: 'Yan Myo Aung is a senior ERP architect specializing in Odoo development and PostgreSQL integration with over 8 years of enterprise training experience.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
        whatWillILearn: [
          'Understand Odoo framework architecture and database models',
          'Create custom modules, views, actions, and menus',
          'Extend existing Odoo applications with inheritance',
          'Write secure APIs and controllers for Odoo integrations'
        ]
      };
    }
    if (t.includes('a+')) {
      return {
        price: '100000K',
        logo: (
          <div className="flex flex-col items-center justify-center border-2 border-red-500 rounded px-3 py-1 font-sans">
            <span className="text-red-600 font-extrabold text-2xl tracking-tight leading-none">A+</span>
            <span className="text-red-500 font-bold text-[6px] tracking-widest uppercase border-t border-red-500/30 pt-0.5 mt-0.5 leading-none">Certified IT Technician</span>
          </div>
        ),
        lectures: 25,
        level: 'Beginner',
        instructor: 'Yan Myo Aung',
        bio: 'Yan Myo Aung is a certified system administrator and hardware engineer with a passion for troubleshooting, operating systems, and teaching IT concepts.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
        whatWillILearn: [
          'Understand core computer components (CPU, RAM, storage, motherboard, etc.)',
          'Master system configurations and hardware diagnostic tools',
          'Understand network setup, IP addressing, and troubleshooting',
          'Configure secure system architectures and firewalls'
        ]
      };
    }
    if (t.includes('linux')) {
      return {
        price: '100000K',
        logo: (
          <div className="flex flex-col items-center gap-1 font-sans">
            <svg viewBox="0 0 100 100" className="w-10 h-10 fill-current text-slate-800">
              <path d="M50,10 C40,10 32,18 32,30 C32,36 34,42 38,46 C35,49 30,55 30,64 C30,76 38,84 50,84 C62,84 70,76 70,64 C70,55 65,49 62,46 C66,42 68,36 68,30 C68,18 60,10 50,10 Z" />
              <circle cx="43" cy="28" r="3" className="text-white fill-current" />
              <circle cx="57" cy="28" r="3" className="text-white fill-current" />
              <path d="M47,36 Q50,42 53,36 Z" className="text-amber-500 fill-current" />
            </svg>
            <span className="font-extrabold text-[10px] tracking-widest uppercase text-slate-800 mt-1">Linux</span>
          </div>
        ),
        lectures: 20,
        level: 'Beginner',
        instructor: 'Yan Myo Aung',
        bio: 'Yan Myo Aung is a certified Linux Systems Engineer (LFCS) teaching bash scripting, server hardening, and administration routines.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
        whatWillILearn: [
          'Master the Linux command line and system directory structure',
          'Configure secure user permissions, groups, and SSH keys',
          'Monitor system resource usage and manage systemd services',
          'Automate routine operations using custom shell scripts'
        ]
      };
    }
    if (t.includes('computer science')) {
      return {
        price: '500000K',
        logo: (
          <div className="flex flex-col items-center font-sans">
            <div className="relative flex items-center justify-center py-2 px-4">
              <div className="absolute w-16 h-8 border-[3px] border-blue-600 rounded-full rotate-[-15deg] opacity-80" />
              <span className="text-blue-700 font-black text-xl italic tracking-tighter relative z-10">NCC</span>
            </div>
            <span className="text-slate-500 text-[7px] tracking-widest uppercase font-extrabold mt-1">education</span>
          </div>
        ),
        lectures: 30,
        level: 'Beginner',
        instructor: 'Dr. Jane Smith',
        bio: 'Dr. Jane Smith is a computer science professor with over 15 years of academic and software engineering experience, publishing research on deep learning architectures.',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80',
        whatWillILearn: [
          'Understand algorithmic complexity and space-time Big O tradeoffs',
          'Implement standard data structures: lists, stacks, trees, and hash tables',
          'Learn foundational programming paradigms and compilers',
          'Explore relational databases, concurrency, and web protocols'
        ]
      };
    }
    if (t.includes('front-end') || t.includes('web')) {
      return {
        price: '80000K',
        logo: (
          <div className="relative flex items-center justify-center w-16 h-16 font-sans">
            <svg viewBox="0 0 100 100" className="absolute w-full h-full text-amber-500 fill-current">
              <polygon points="50,5 95,28 95,72 50,95 5,72 5,28" />
            </svg>
            <span className="relative z-10 text-white font-black text-2xl tracking-tighter font-mono">{`</>`}</span>
          </div>
        ),
        lectures: 22,
        level: 'Beginner',
        instructor: 'Dr. Jane Smith',
        bio: 'Dr. Jane Smith is a full-stack researcher specialized in modern user experience design, React components, and static rendering frameworks.',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80',
        whatWillILearn: [
          'Build responsive, high-fidelity layouts using HTML5, CSS3, and Flexbox',
          'Write interactive, modern JavaScript using ES6+ standards',
          'Fetch APIs asynchronously and manage local client state',
          'Create accessible user experiences following web best practices'
        ]
      };
    }
    if (t.includes('c++')) {
      return {
        price: '80000K',
        logo: (
          <div className="h-16 w-16 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-xl shadow-md border-2 border-white font-sans">
            C++
          </div>
        ),
        lectures: 28,
        level: 'Beginner',
        instructor: 'Dr. Jane Smith',
        bio: 'Dr. Jane Smith has taught systems programming for a decade, specializing in native applications, memory management, and pointers optimization.',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80',
        whatWillILearn: [
          'Learn C++ variables, functions, loops, and control flow structures',
          'Build object-oriented software with classes and polymorphism',
          'Understand pointers, memory allocation, and garbage collection concepts',
          'Use the Standard Template Library (STL) to organize data structures'
        ]
      };
    }
    if (t.includes('git') || t.includes('github')) {
      return {
        price: '100000K',
        logo: (
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xl font-sans">
            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            <span className="text-xl font-bold tracking-tight text-slate-800">GitHub</span>
          </div>
        ),
        lectures: 15,
        level: 'Beginner',
        instructor: 'Dr. Jane Smith',
        bio: 'Dr. Jane Smith teaches collaborative coding tools, branching strategy pipelines, and source integrity best practices.',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80',
        whatWillILearn: [
          'Perform standard branch operations, merges, and resolve conflicts',
          'Collaborate using remote repositories, forks, and pull requests',
          'Automate code quality testing using GitHub Actions CI/CD',
          'Learn best practices for commit history and version tags'
        ]
      };
    }
    if (t.includes('network') || t.includes('ne')) {
      return {
        price: '120000K',
        logo: (
          <div className="flex flex-col items-center justify-center font-sans">
            <span className="text-red-600 font-black text-3xl tracking-tight leading-none">NE</span>
            <span className="text-[6px] block text-slate-500 tracking-widest font-semibold uppercase mt-0.5">Network Engineering</span>
          </div>
        ),
        lectures: 24,
        level: 'Beginner',
        instructor: 'Yan Myo Aung',
        bio: 'Yan Myo Aung is a Cisco certified network engineer teaching IP subnetting, OSI layers routing, and security protocols.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
        whatWillILearn: [
          'Understand the OSI reference model layers and TCP/IP protocols',
          'Perform subnetting calculations and design stable IP addresses',
          'Configure VLANs, routing tables, and access control lists (ACLs)',
          'Deploy secure firewalls and packet filter mechanisms'
        ]
      };
    }

    return {
      price: '150000K',
      logo: <span className="text-teal-600 font-black text-3xl tracking-tight">LMS</span>,
      lectures: 12,
      level: 'Beginner',
      instructor: 'Dr. Jane Smith',
      bio: 'Dr. Jane Smith is an experienced professor in computer science and system architecture.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80',
      whatWillILearn: [
        'Master key industry concepts and standards in this domain',
        'Build fully-functional projects using modern tech tools',
        'Develop real-world problem-solving skills under professional guidance',
        'Prepare yourself for standard certifications and interviews'
      ]
    };
  };

  const specs = getCourseSpecs(course.title);

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
                  <div className="h-6 w-6 rounded-full overflow-hidden bg-slate-200 relative flex-shrink-0">
                    <img
                      src={course.instructorAvatarUrl || specs.avatar}
                      alt={course.instructorName || specs.instructor}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-semibold text-slate-700">Created by <strong className="text-slate-900 font-bold">{course.instructorName || specs.instructor}</strong></span>
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
                  <span>Last updated Sun, 10-May-2026</span>
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
                    {specs.whatWillILearn.map((point, i) => (
                      <li key={i} className="flex gap-2.5 items-start">
                        <span className="text-[#0d9488] text-sm leading-none mt-0.5">✦</span>
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

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
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-slate-200 relative flex-shrink-0 border-2 border-white shadow-md mx-auto sm:mx-0">
                    <img
                      src={course.instructorAvatarUrl || specs.avatar}
                      alt={course.instructorName || specs.instructor}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <h3 className="font-extrabold text-base text-[#0f112e]">{course.instructorName || specs.instructor}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expert LMS Instructor</p>
                    <p className="text-slate-500 text-xs leading-relaxed whitespace-pre-line">
                      {course.instructorBio || specs.bio}
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
                  /* Center logo */
                  <div className="transform group-hover:scale-105 transition duration-300">
                    {specs.logo}
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
                    {specs.price}
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
                    <span className="text-slate-900">{specs.lectures}</span>
                  </div>

                  <div className="py-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-500">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                      </svg>
                      <span>Skill level</span>
                    </div>
                    <span className="text-slate-900">{specs.level}</span>
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
                  value={course.price > 0 ? `${course.price.toLocaleString()} MMK` : `${specs.price}`}
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
    </div>
  );
}
