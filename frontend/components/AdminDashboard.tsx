'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from './AuthProvider';
import courseService from '@/services/courseService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessagesPanel } from './MessagesPanel';
import { useAuth } from '@/hooks/useAuth';
import { formatDateString } from '@/utils/date';
import ConfirmModal from './ConfirmModal';

interface AdminDashboardProps {
  user: UserProfile;
}

interface ManagedUser {
  id: string;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  isApproved: boolean;
  createdAt: string;
}

interface CourseItem {
  id: string;
  title: string;
  description: string;
  category: string;
  instructorId: string;
  categoryId: string | null;
  price: number;
  expiry: string | null;
  level: string;
  status: string;
  faq: string | null;
  requirements: string | null;
  outcomes: string | null;
  approvalStatus: string;
  createdAt: string;
  modulesCount?: number;
  lessonsCount?: number;
}

interface EnrollmentItem {
  id: string;
  userId: string;
  courseId: string;
  joinedAt: string;
  completed: boolean;
  user?: {
    fullName: string;
    email: string;
  };
  course?: {
    title: string;
  };
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const router = useRouter();
  const { logout, settings, updateSettings, uploadBanner } = useAuth();
  
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

  // Shadow window.alert to automatically use our custom modal
  const alert = (message: string) => {
    showAlert('System Notification', message, 'info');
  };
  
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'courses'
    | 'enrollments'
    | 'report'
    | 'users'
    | 'payments'
    | 'message'
    | 'newsletter'
    | 'contact'
    | 'blog'
    | 'addons'
    | 'categories'
    | 'settings'
  >('dashboard');
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);
  const [activeDetailItem, setActiveDetailItem] = useState<{
    type: 'user' | 'course' | 'enrollment' | 'payment' | 'blog';
    data: any;
  } | null>(null);

  // Dynamic Metrics & Stats
  const [stats, setStats] = useState({
    coursesCount: 0,
    lessonsCount: 0,
    enrollmentsCount: 0,
    studentsCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // User list states
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [usersError, setUsersError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Course catalog states
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [coursesError, setCoursesError] = useState<string | null>(null);

  // Categories states
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Pricing & Expiry modal states
  const [coursePrice, setCoursePrice] = useState(0);
  const [courseExpiry, setCourseExpiry] = useState('');

  // Enrollment list states
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [enrollmentSearchQuery, setEnrollmentSearchQuery] = useState('');
  const [enrollmentsError, setEnrollmentsError] = useState<string | null>(null);

  // Create Course Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [courseCategoryId, setCourseCategoryId] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // Real Offline Payments list (fetched from database)
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  // Admin Create User Modal states
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserFullName, setCreateUserFullName] = useState('');
  const [createUserEmail, setCreateUserEmail] = useState('');
  const [createUserPassword, setCreateUserPassword] = useState('');
  const [createUserRole, setCreateUserRole] = useState<'STUDENT' | 'INSTRUCTOR'>('STUDENT');
  const [creatingUser, setCreatingUser] = useState(false);

  // Simulated Newsletter stats
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterContent, setNewsletterContent] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  // Database-backed state variables
  const [tickets, setTickets] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  
  // Reports and Analytics states
  const [reportsData, setReportsData] = useState<any>(null);
  const [loadingReports, setLoadingReports] = useState(true);

  // Blog creation and loading states
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogAuthor, setNewBlogAuthor] = useState('');
  const [newBlogCategory, setNewBlogCategory] = useState('');
  const [creatingBlog, setCreatingBlog] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingBlogs, setLoadingBlogs] = useState(false);

  // Simulated Addons Configuration
  const [addons, setAddons] = useState({
    sendgrid: true,
    supabaseAuth: true,
    aiTutorAgent: false,
    stripeGateway: false,
  });

  // Web Settings Form States
  const [lmsNameInput, setLmsNameInput] = useState('');
  const [bannerTitleInput, setBannerTitleInput] = useState('');
  const [bannerSubtitleInput, setBannerSubtitleInput] = useState('');
  const [bannerUrlInput, setBannerUrlInput] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [footerInfoInput, setFooterInfoInput] = useState('');
  const [contactEmailInput, setContactEmailInput] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Sync web settings details
  useEffect(() => {
    if (settings) {
      setLmsNameInput(settings.lmsName || '');
      setBannerTitleInput(settings.bannerTitle || '');
      setBannerSubtitleInput(settings.bannerSubtitle || '');
      setBannerUrlInput(settings.bannerUrl || '');
      setFooterInfoInput(settings.footerInfo || '');
      setContactEmailInput(settings.contactEmail || '');
    }
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lmsNameInput.trim()) {
      alert('LMS Name is required.');
      return;
    }

    try {
      setSavingSettings(true);
      let finalBannerUrl = bannerUrlInput;

      if (bannerFile) {
        const uploadedBannerUrl = await uploadBanner(bannerFile);
        if (uploadedBannerUrl) {
          finalBannerUrl = uploadedBannerUrl;
          setBannerUrlInput(finalBannerUrl);
        } else {
          alert('Failed to upload banner image.');
          return;
        }
      }

      const success = await updateSettings({
        lmsName: lmsNameInput.trim(),
        bannerTitle: bannerTitleInput.trim(),
        bannerSubtitle: bannerSubtitleInput.trim(),
        bannerUrl: finalBannerUrl || null,
        footerInfo: footerInfoInput.trim(),
        contactEmail: contactEmailInput.trim(),
      });

      if (success) {
        alert('Web settings updated successfully!');
        setBannerFile(null);
      } else {
        alert('Failed to update web settings.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while saving web settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Fetch Dashboard Stats API
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch('/api/admin/stats');
      const result = await res.json();
      if (result.success && result.data) {
        setStats(result.data.stats);
      }
    } catch (e) {
      console.error('Failed to load dashboard stats', e);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch users directory
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setUsersError(null);
      const response = await fetch('/api/users');
      const result = await response.json();

      if (result.success && result.data?.users) {
        setUsers(result.data.users);
      } else {
        setUsersError(result.error || 'Failed to fetch user directory.');
      }
    } catch (err: any) {
      setUsersError(err.message || 'An error occurred while loading users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch courses directory
  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      setCoursesError(null);
      const res = await courseService.getCourses();
      if (res.success && res.data) {
        const coursesData: CourseItem[] = res.data;
        // Fetch syllabus counts for each course
        const coursesWithCounts = await Promise.all(
          coursesData.map(async (c) => {
            try {
              const syl = await courseService.getCourseSyllabus(c.id);
              if (syl.success && syl.data) {
                const modules = syl.data.modules || [];
                const lessonsCount = modules.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0);
                return {
                  ...c,
                  modulesCount: modules.length,
                  lessonsCount,
                };
              }
            } catch (e) {
              console.error(e);
            }
            return { ...c, modulesCount: 0, lessonsCount: 0 };
          })
        );
        setCourses(coursesWithCounts);
      } else {
        setCoursesError(res.error || 'Failed to fetch course directory.');
      }
    } catch (err: any) {
      setCoursesError(err.message || 'An error occurred while loading courses.');
    } finally {
      setLoadingCourses(false);
    }
  };

  // Fetch Categories API
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await courseService.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (e) {
      console.error('Failed to load categories', e);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch Enrollments API
  const fetchEnrollments = async () => {
    try {
      setLoadingEnrollments(true);
      setEnrollmentsError(null);
      const response = await fetch('/api/admin/enrollments');
      const result = await response.json();
      if (result.success && result.data?.enrollments) {
        setEnrollments(result.data.enrollments);
      } else {
        setEnrollmentsError(result.error || 'Failed to fetch enrollments.');
      }
    } catch (err: any) {
      setEnrollmentsError(err.message || 'An error occurred while loading enrollments.');
    } finally {
      setLoadingEnrollments(false);
    }
  };

  // Fetch Real Offline Payments API
  const fetchPayments = async () => {
    try {
      setLoadingPayments(true);
      const res = await courseService.getOfflinePayments();
      if (res.success && res.data?.payments) {
        const mapped = res.data.payments.map((p: any) => ({
          id: p.id,
          studentName: p.user?.fullName || 'Unknown',
          studentEmail: p.user?.email || 'Unknown',
          courseTitle: p.course?.title || 'Unknown Course',
          amount: p.amount ? `${Number(p.amount).toLocaleString()} MMK` : '0 MMK',
          rawAmount: Number(p.amount || 0),
          date: formatDateString(p.createdAt),
          rawDate: p.createdAt,
          status: p.status,
          receiptUrl: p.receiptUrl,
        }));
        setPayments(mapped);
      }
    } catch (e) {
      console.error('Failed to load offline payments', e);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await courseService.getTickets();
      if (res.success && res.data) {
        setTickets(res.data);
      }
    } catch (e) {
      console.error('Failed to load tickets', e);
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchBlogs = async () => {
    try {
      setLoadingBlogs(true);
      const res = await courseService.getBlogs();
      if (res.success && res.data) {
        setBlogPosts(res.data);
      }
    } catch (e) {
      console.error('Failed to load blog posts', e);
    } finally {
      setLoadingBlogs(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const res = await fetch('/api/admin/reports');
      const result = await res.json();
      if (result.success && result.data) {
        setReportsData(result.data);
      }
    } catch (e) {
      console.error('Failed to load reports data', e);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchCourses();
    fetchEnrollments();
    fetchCategories();
    fetchPayments();
    fetchTickets();
    fetchBlogs();
    fetchReports();
  }, [activeTab]);

  // Handle category management
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      setCreatingCategory(true);
      const res = await courseService.createCategory(newCategoryName);
      if (res.success) {
        setNewCategoryName('');
        fetchCategories();
      } else {
        alert(res.error || 'Failed to create category.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    showConfirm({
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category? This action cannot be undone.',
      type: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        closeConfirm();
        try {
          const res = await courseService.deleteCategory(id);
          if (res.success) {
            fetchCategories();
          } else {
            alert(res.error || 'Failed to delete category.');
          }
        } catch (err: any) {
          alert(err.message || 'An error occurred.');
        }
      }
    });
  };

  // Handle instructor approvals
  const handleApproveUser = async (targetUserId: string, approve: boolean) => {
    try {
      setUpdatingUserId(targetUserId);
      const res = await courseService.approveUser(targetUserId, approve);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUserId ? { ...u, isApproved: approve } : u))
        );
      } else {
        alert(res.error || 'Failed to update approval status.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    showConfirm({
      title: 'Permanently Delete User',
      message: 'Are you sure you want to permanently delete this user account? This action cannot be undone.',
      type: 'danger',
      confirmLabel: 'Delete Permanently',
      onConfirm: async () => {
        closeConfirm();
        try {
          setUpdatingUserId(targetUserId);
          const res = await fetch(`/api/users?id=${targetUserId}`, {
            method: 'DELETE',
          });
          const result = await res.json();
          if (result.success) {
            setUsers((prev) => prev.filter((u) => u.id !== targetUserId));
            fetchStats();
            fetchReports();
          } else {
            alert(result.error || 'Failed to delete user.');
          }
        } catch (err: any) {
          alert(err.message || 'An error occurred.');
        } finally {
          setUpdatingUserId(null);
        }
      }
    });
  };

  // Handle admin registering new user
  const handleAdminCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUserFullName.trim() || !createUserEmail.trim() || !createUserPassword.trim()) {
      alert('Please fill out all fields.');
      return;
    }
    if (createUserPassword.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    try {
      setCreatingUser(true);
      const res = await courseService.adminCreateUser({
        fullName: createUserFullName,
        email: createUserEmail,
        password: createUserPassword,
        role: createUserRole,
      });

      if (res.success) {
        alert(`${createUserRole === 'STUDENT' ? 'Student' : 'Instructor'} account registered successfully!`);
        setCreateUserFullName('');
        setCreateUserEmail('');
        setCreateUserPassword('');
        setCreateUserRole('STUDENT');
        setShowCreateUserModal(false);
        fetchUsers();
        fetchStats();
      } else {
        alert(res.error || 'Failed to create user account.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred during account creation.');
    } finally {
      setCreatingUser(false);
    }
  };



  // Handle role change request
  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    try {
      setUpdatingUserId(targetUserId);
      const response = await fetch('/api/users/role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: targetUserId, role: newRole }),
      });
      const result = await response.json();

      if (result.success && result.data?.user) {
        // Update user locally
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUserId ? { ...u, role: result.data.user.role } : u))
        );
        // Refresh metrics
        fetchStats();
      } else {
        alert(result.error || 'Failed to update user role.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while updating role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Handle course creation request
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle || !courseCategory || !courseDescription) {
      alert('Please fill out all fields.');
      return;
    }
    try {
      setCreatingCourse(true);

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
        categoryId: courseCategoryId || null,
        description: courseDescription,
        thumbnailUrl: uploadedThumbnailUrl,
        price: Number(coursePrice),
        expiry: courseExpiry ? new Date(courseExpiry).toISOString() : null,
      });

      if (res.success) {
        setCourseTitle('');
        setCourseCategory('');
        setCourseCategoryId('');
        setCourseDescription('');
        setCoursePrice(0);
        setCourseExpiry('');
        setThumbnailFile(null);
        setShowCreateModal(false);
        fetchCourses();
        fetchStats();
      } else {
        alert(res.error || 'Failed to create course.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
    } finally {
      setCreatingCourse(false);
    }
  };

  // Handle course deletion request
  const handleDeleteCourse = async (courseId: string) => {
    showConfirm({
      title: 'Delete Course',
      message: 'Are you sure you want to delete this course and all its modules/lessons? This action cannot be undone.',
      type: 'danger',
      confirmLabel: 'Delete Course',
      onConfirm: async () => {
        closeConfirm();
        try {
          const res = await courseService.deleteCourse(courseId);
          if (res.success) {
            fetchCourses();
            fetchStats();
          } else {
            alert(res.error || 'Failed to delete course.');
          }
        } catch (err: any) {
          alert(err.message || 'An error occurred.');
        }
      }
    });
  };

  // Handle Revoke Enrollment request
  const handleRevokeEnrollment = async (enrollId: string) => {
    showConfirm({
      title: 'Revoke Enrollment',
      message: 'Are you sure you want to revoke this enrollment? The student will lose classroom access.',
      type: 'danger',
      confirmLabel: 'Revoke',
      onConfirm: async () => {
        closeConfirm();
        try {
          const res = await fetch(`/api/admin/enrollments?id=${enrollId}`, {
            method: 'DELETE',
          });
          const result = await res.json();
          if (result.success) {
            setEnrollments((prev) => prev.filter((item) => item.id !== enrollId));
            fetchStats();
          } else {
            alert(result.error || 'Failed to revoke enrollment.');
          }
        } catch (err: any) {
          alert(err.message || 'An error occurred.');
        }
      }
    });
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  // Broadcast announcement newsletter
  const handleBroadcastNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterSubject || !newsletterContent) {
      alert('Please fill out both subject and content.');
      return;
    }
    try {
      setBroadcasting(true);
      const res = await courseService.broadcastNewsletter({
        subject: newsletterSubject,
        message: newsletterContent,
      });
      if (res.success) {
        alert(`Newsletter announcement broadcasted successfully to all student email lists! (Sent: ${res.data?.sentCount || 0})`);
        setNewsletterSubject('');
        setNewsletterContent('');
      } else {
        alert(res.error || 'Failed to broadcast newsletter.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to broadcast newsletter.');
    } finally {
      setBroadcasting(false);
    }
  };

  // Toggle ticket status
  const toggleTicketResolved = async (ticketId: string, currentResolved: boolean) => {
    try {
      const res = await courseService.resolveTicket(ticketId, !currentResolved);
      if (res.success) {
        fetchTickets();
      } else {
        alert(res.error || 'Failed to update ticket status.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while updating ticket.');
    }
  };

  // Create new blog post
  const handleCreateBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlogTitle.trim() || !newBlogAuthor.trim() || !newBlogCategory.trim()) {
      alert('Please fill out all blog post fields.');
      return;
    }
    try {
      setCreatingBlog(true);
      const res = await courseService.createBlog({
        title: newBlogTitle.trim(),
        author: newBlogAuthor.trim(),
        category: newBlogCategory.trim(),
      });
      if (res.success) {
        setNewBlogTitle('');
        setNewBlogAuthor('');
        setNewBlogCategory('');
        fetchBlogs();
        alert('Blog article published successfully!');
      } else {
        alert(res.error || 'Failed to publish blog post.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
    } finally {
      setCreatingBlog(false);
    }
  };

  // Action for offline payment approvals
  const handlePaymentStatus = async (payId: string, status: 'APPROVED' | 'REJECTED') => {
    showConfirm({
      title: `${status === 'APPROVED' ? 'Approve' : 'Reject'} Payment Request`,
      message: `Are you sure you want to ${status.toLowerCase()} this payment request?`,
      type: status === 'APPROVED' ? 'info' : 'danger',
      confirmLabel: status === 'APPROVED' ? 'Approve' : 'Reject',
      onConfirm: async () => {
        closeConfirm();
        try {
          const res = await courseService.reviewOfflinePayment(payId, status);
          if (res.success) {
            fetchPayments();
            fetchStats();
            fetchEnrollments();
          } else {
            alert(res.error || 'Failed to update payment status.');
          }
        } catch (err: any) {
          alert(err.message || 'An error occurred during verification.');
        }
      }
    });
  };

  // Filters
  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(courseSearchQuery.toLowerCase());
    const matchesCategory =
      selectedCategoryFilter === 'All' || c.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredEnrollments = enrollments.filter((item) => {
    const studentName = item.user?.fullName || '';
    const studentEmail = item.user?.email || '';
    const courseTitle = item.course?.title || '';
    const query = enrollmentSearchQuery.toLowerCase();

    return (
      studentName.toLowerCase().includes(query) ||
      studentEmail.toLowerCase().includes(query) ||
      courseTitle.toLowerCase().includes(query)
    );
  });

  const renderDAUChart = () => {
    if (!reportsData || !reportsData.userActivity || !reportsData.userActivity.dauData) return null;
    const dauData = reportsData.userActivity.dauData;
    const width = 500;
    const height = 180;
    const padding = { top: 20, right: 20, bottom: 30, left: 35 };
    const maxVal = Math.max(...dauData.map((d: any) => d.count), 5);
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const points = dauData.map((d: any, i: number) => {
      const x = padding.left + (i * innerW) / 6;
      const y = height - padding.bottom - (d.count / maxVal) * innerH;
      return { x, y, label: d.day, count: d.count };
    });

    const pathD = points.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="dauAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + ratio * innerH;
          const labelVal = Math.round(maxVal * (1 - ratio));
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={padding.left - 8} y={y + 3} textAnchor="end" fill="#94a3b8" className="text-[8px] font-bold">{labelVal}</text>
            </g>
          );
        })}
        <path d={areaD} fill="url(#dauAreaGradient)" />
        <path d={pathD} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p: any, i: number) => (
          <g key={i} className="group cursor-pointer">
            <circle cx={p.x} cy={p.y} r="4" fill="#0d9488" stroke="white" strokeWidth="1.5" />
            <rect x={p.x - 18} y={p.y - 22} width="36" height="15" rx="3" fill="#1e293b" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <text x={p.x} y={p.y - 12} textAnchor="middle" fill="white" className="text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200">{p.count}</text>
            <text x={p.x} y={height - 10} textAnchor="middle" fill="#64748b" className="text-[9px] font-bold">{p.label}</text>
          </g>
        ))}
      </svg>
    );
  };

  const renderHourlyChart = () => {
    if (!reportsData || !reportsData.userActivity || !reportsData.userActivity.hourlyData) return null;
    const hourlyData = reportsData.userActivity.hourlyData;
    const width = 600;
    const height = 180;
    const padding = { top: 15, right: 15, bottom: 30, left: 35 };
    const maxVal = Math.max(...hourlyData.map((h: any) => h.count), 5);
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;
    const barWidth = innerW / 24 - 4;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="hourBarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((ratio, i) => {
          const y = padding.top + ratio * innerH;
          const labelVal = Math.round(maxVal * (1 - ratio));
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={padding.left - 8} y={y + 3} textAnchor="end" fill="#94a3b8" className="text-[8px] font-bold">{labelVal}</text>
            </g>
          );
        })}
        {hourlyData.map((h: any, i: number) => {
          const x = padding.left + i * (innerW / 24) + 2;
          const barH = (h.count / maxVal) * innerH;
          const y = height - padding.bottom - barH;
          const showLabel = i % 4 === 0;
          return (
            <g key={i} className="group cursor-pointer">
              <rect x={x} y={y} width={barWidth} height={Math.max(barH, 2)} fill="url(#hourBarGradient)" rx="1.5" />
              <rect x={x + barWidth/2 - 22} y={y - 20} width="44" height="15" rx="3" fill="#1e293b" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <text x={x + barWidth/2} y={y - 10} textAnchor="middle" fill="white" className="text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200">{h.count}</text>
              {showLabel && (
                <text x={x + barWidth/2} y={height - 10} textAnchor="middle" fill="#64748b" className="text-[8px] font-bold">{h.hour}</text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  const monthlyRevenue = new Array(12).fill(0);
  payments.forEach((p) => {
    if (p.status === 'APPROVED' && p.rawDate) {
      const m = new Date(p.rawDate).getMonth();
      if (m >= 0 && m < 12) {
        monthlyRevenue[m] += p.rawAmount || 0;
      }
    }
  });
  const maxRevenue = Math.max(...monthlyRevenue, 1000);
  const revenuePoints = monthlyRevenue.map((val, i) => {
    const x = 50 + i * 80;
    const y = 250 - (val / maxRevenue) * 170;
    return { x, y, val };
  });
  const revenueLinePathD = revenuePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const revenueAreaPathD = `${revenueLinePathD} L 930 250 L 50 250 Z`;

  const mobileNavItems: { id: typeof activeTab | 'more'; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Home', icon: '🎛️' },
    { id: 'courses', label: 'Courses', icon: '📚' },
    { id: 'message', label: 'Messages', icon: '💬' },
    { id: 'more', label: 'More', icon: '☰' },
  ];

  const moreMenuLinks: { id: typeof activeTab; label: string; icon: string }[] = [
    { id: 'users', label: 'Users', icon: '👤' },
    { id: 'report', label: 'Reports', icon: '📈' },
    { id: 'categories', label: 'Categories', icon: '🏷️' },
    { id: 'enrollments', label: 'Enrollments', icon: '🔗' },
    { id: 'payments', label: 'Offline Payments', icon: '💳' },
    { id: 'newsletter', label: 'Newsletter', icon: '📨' },
    { id: 'contact', label: 'Support', icon: '📬' },
    { id: 'blog', label: 'Blog', icon: '📰' },
    { id: 'addons', label: 'Addons', icon: '⚙️' },
    { id: 'settings', label: 'Web Settings', icon: '🌐' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-700 flex font-sans">
      {/* 1. LEFT SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 flex-shrink-0 select-none z-30">
        <div className="flex flex-col overflow-y-auto">
          {/* Profile Header */}
          <div className="p-6 border-b border-slate-100 flex flex-col items-center text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-[#0d9488] text-white flex items-center justify-center text-2xl font-black shadow-md border-2 border-white">
              🛡️
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">{user.fullName}</h3>
              <span className="text-[10px] uppercase font-bold text-teal-600 tracking-wider">
                {settings?.lmsName || 'Nexora Academy'} Admin
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-6">
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-3 block mb-2">
                Navigation
              </span>
              <nav className="space-y-1">
                {/* Dashboard Tab link */}
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                    activeTab === 'dashboard'
                      ? 'bg-teal-50 text-[#0d9488]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">🎛️</span> Dashboard
                  </span>
                </button>

                {/* Courses Tab link */}
                <button
                  onClick={() => setActiveTab('courses')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                    activeTab === 'courses'
                      ? 'bg-teal-50 text-[#0d9488]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">📚</span> Courses
                  </span>
                  <span className="text-[10px] text-slate-300">❯</span>
                </button>

                {/* Categories Tab link */}
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                    activeTab === 'categories'
                      ? 'bg-teal-50 text-[#0d9488]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">🏷️</span> Categories
                  </span>
                  <span className="text-[10px] text-slate-300">❯</span>
                </button>

                {/* Enrollments Tab link */}
                <button
                  onClick={() => setActiveTab('enrollments')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                    activeTab === 'enrollments'
                      ? 'bg-teal-50 text-[#0d9488]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">🔗</span> Enrollments
                  </span>
                  <span className="text-[10px] text-slate-300">❯</span>
                </button>

                {/* Report Tab link */}
                <button
                  onClick={() => setActiveTab('report')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                    activeTab === 'report'
                      ? 'bg-teal-50 text-[#0d9488]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">📈</span> Report
                  </span>
                  <span className="text-[10px] text-slate-300">❯</span>
                </button>

                {/* Users Tab link */}
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                    activeTab === 'users'
                      ? 'bg-teal-50 text-[#0d9488]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">👤</span> Users
                  </span>
                  <span className="text-[10px] text-slate-300">❯</span>
                </button>

                {/* Offline Payment Tab link */}
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                    activeTab === 'payments'
                      ? 'bg-teal-50 text-[#0d9488]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">💳</span> Offline payment
                  </span>
                  <span className="text-[10px] text-slate-300">❯</span>
                </button>

                {/* Message Tab link */}
                <button
                  onClick={() => setActiveTab('message')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 text-left ${
                    activeTab === 'message'
                      ? 'bg-teal-50 text-[#0d9488]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">💬</span> Message
                  </span>
                  <span className="text-[10px] text-slate-300">❯</span>
                </button>

                {/* Newsletter Tab link */}
                <button
                  onClick={() => setActiveTab('newsletter')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                    activeTab === 'newsletter'
                      ? 'bg-teal-50 text-[#0d9488]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">📨</span> Newsletter
                  </span>
                  <span className="text-[10px] text-slate-300">❯</span>
                </button>

                {/* Contact Tab link with badge */}
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                    activeTab === 'contact'
                      ? 'bg-teal-50 text-[#0d9488]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">📬</span> Contact
                  </span>
                  <span className="h-4 px-1.5 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                    {tickets.filter(t => !t.resolved).length}
                  </span>
                </button>

                {/* Blog Tab link */}
                <button
                  onClick={() => setActiveTab('blog')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                    activeTab === 'blog'
                      ? 'bg-teal-50 text-[#0d9488]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">📰</span> Blog
                  </span>
                  <span className="text-[10px] text-slate-300">❯</span>
                </button>

                {/* Addons Tab link */}
                <button
                  onClick={() => setActiveTab('addons')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                    activeTab === 'addons'
                      ? 'bg-teal-50 text-[#0d9488]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">⚙️</span> Addons
                  </span>
                </button>

                {/* Settings Tab link */}
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                    activeTab === 'settings'
                      ? 'bg-teal-50 text-[#0d9488]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">🌐</span> Web Settings
                  </span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Sign Out Button in Sidebar */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-extrabold text-slate-600 transition duration-200 cursor-pointer"
          >
            ❌ Sign Out
          </button>
        </div>
      </aside>

      {/* 2. RIGHT WORKSPACE AREA */}
      <main className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0 md:h-screen md:overflow-y-auto">
        {/* Top Header Bar */}
        <header className="bg-white h-16 border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2.5 font-sans">
            <span className="text-lg">
              {activeTab === 'dashboard' && '🎛️'}
              {activeTab === 'courses' && '📚'}
              {activeTab === 'enrollments' && '🔗'}
              {activeTab === 'report' && '📈'}
              {activeTab === 'users' && '👤'}
              {activeTab === 'payments' && '💳'}
              {activeTab === 'newsletter' && '📨'}
              {activeTab === 'contact' && '📬'}
              {activeTab === 'blog' && '📰'}
              {activeTab === 'addons' && '⚙️'}
              {activeTab === 'message' && '💬'}
            </span>
            <h1 className="text-base font-extrabold text-slate-800 capitalize">{activeTab}</h1>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
            <span className="hidden sm:inline">{settings?.lmsName || 'Nexora Academy'} Core v1.0</span>
            <span className="hidden sm:inline h-4 w-px bg-slate-200" />
            <a href="/" className="text-teal-600 hover:underline">View Portal</a>
          </div>
        </header>

        {/* Content Body Workspace */}
        <div className="p-4 sm:p-8 max-w-6xl w-full mx-auto flex-1">
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              {/* Revenue line chart */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Admin Revenue This Year
                  </h3>
                  <span className="text-xs font-extrabold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">MMK</span>
                </div>

                <div className="w-full relative overflow-x-auto">
                  {/* Dynamic SVG line chart using real payment data */}
                  <svg className="w-full min-w-[700px] h-[300px]" viewBox="0 0 1000 300">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0d9488" stopOpacity="0.00" />
                      </linearGradient>
                    </defs>

                    {/* Gridlines */}
                    {[50, 100, 150, 200, 250].map((yVal) => (
                      <line
                        key={yVal}
                        x1="50"
                        y1={yVal}
                        x2="950"
                        y2={yVal}
                        stroke="#f1f5f9"
                        strokeWidth="1.5"
                      />
                    ))}

                    {/* Gradient Fill under the line */}
                    <path
                      d={revenueAreaPathD}
                      fill="url(#chartGradient)"
                    />

                    {/* Main Line path */}
                    <path
                      d={revenueLinePathD}
                      fill="none"
                      stroke="#0d9488"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Month points and hover values */}
                    {revenuePoints.map((p, i) => (
                      <g key={i} className="group cursor-pointer">
                        <circle cx={p.x} cy={p.y} r="4" fill="#0d9488" stroke="white" strokeWidth="1.5" />
                        {p.val > 0 && (
                          <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <rect x={p.x - 50} y={p.y - 25} width="100" height="18" rx="4" fill="#1e293b" />
                            <text x={p.x} y={p.y - 13} textAnchor="middle" fill="white" className="text-[9px] font-bold">
                              {p.val.toLocaleString()} MMK
                            </text>
                          </g>
                        )}
                      </g>
                    ))}

                    {/* Month Label markings */}
                    {[
                      { name: 'January', x: 50 },
                      { name: 'February', x: 130 },
                      { name: 'March', x: 210 },
                      { name: 'April', x: 290 },
                      { name: 'May', x: 370 },
                      { name: 'June', x: 450 },
                      { name: 'July', x: 530 },
                      { name: 'August', x: 610 },
                      { name: 'September', x: 690 },
                      { name: 'October', x: 770 },
                      { name: 'November', x: 850 },
                      { name: 'December', x: 930 },
                    ].map((m) => (
                      <text
                        key={m.name}
                        x={m.x}
                        y="275"
                        textAnchor="middle"
                        fill="#94a3b8"
                        className="text-[9px] font-bold font-sans"
                      >
                        {m.name}
                      </text>
                    ))}
                  </svg>
                </div>
              </div>

              {/* 4 Counter Metrics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Courses count card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-2">
                  <span className="text-3xl text-slate-400">🎓</span>
                  <span className="text-3xl font-extrabold text-slate-800 leading-none">
                    {loadingStats ? '...' : stats.coursesCount}
                  </span>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Courses
                  </span>
                </div>

                {/* Lessons count card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-2">
                  <span className="text-3xl text-slate-400">🎥</span>
                  <span className="text-3xl font-extrabold text-slate-800 leading-none">
                    {loadingStats ? '...' : stats.lessonsCount}
                  </span>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Lessons
                  </span>
                </div>

                {/* Enrollments count card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-2">
                  <span className="text-3xl text-slate-400">🔗</span>
                  <span className="text-3xl font-extrabold text-slate-800 leading-none">
                    {loadingStats ? '...' : stats.enrollmentsCount}
                  </span>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Enrollments
                  </span>
                </div>

                {/* Students count card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-2">
                  <span className="text-3xl text-slate-400">👥</span>
                  <span className="text-3xl font-extrabold text-slate-800 leading-none">
                    {loadingStats ? '...' : stats.studentsCount}
                  </span>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Students
                  </span>
                </div>
              </div>

              {/* Mobile-only Quick Access Shortcuts Grid */}
              <div className="md:hidden bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">Quick Actions</h4>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setActiveTab('report')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-100 hover:border-teal-100 transition duration-200 cursor-pointer"
                  >
                    <span className="text-xl">📊</span>
                    <span className="text-[9px] font-bold text-slate-600 mt-1">Reports</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('enrollments')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-100 hover:border-teal-100 transition duration-200 cursor-pointer"
                  >
                    <span className="text-xl">🔗</span>
                    <span className="text-[9px] font-bold text-slate-600 mt-1">Enrolls</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('categories')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-100 hover:border-teal-100 transition duration-200 cursor-pointer"
                  >
                    <span className="text-xl">🏷️</span>
                    <span className="text-[9px] font-bold text-slate-600 mt-1">Categories</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-100 hover:border-teal-100 transition duration-200 cursor-pointer"
                  >
                    <span className="text-xl">💳</span>
                    <span className="text-[9px] font-bold text-slate-600 mt-1">Payments</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('newsletter')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-100 hover:border-teal-100 transition duration-200 cursor-pointer"
                  >
                    <span className="text-xl">📨</span>
                    <span className="text-[9px] font-bold text-slate-600 mt-1">Newsletters</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('contact')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-100 hover:border-teal-100 transition duration-200 cursor-pointer"
                  >
                    <span className="text-xl">📬</span>
                    <span className="text-[9px] font-bold text-slate-600 mt-1">Support</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('blog')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-100 hover:border-teal-100 transition duration-200 cursor-pointer"
                  >
                    <span className="text-xl">📰</span>
                    <span className="text-[9px] font-bold text-slate-600 mt-1">Blog</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('addons')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-100 hover:border-teal-100 transition duration-200 cursor-pointer"
                  >
                    <span className="text-xl">⚙️</span>
                    <span className="text-[9px] font-bold text-slate-600 mt-1">Addons</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: COURSES */}
          {activeTab === 'courses' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-800 font-sans">Course Catalog Administration</h2>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Instantiate courses, construct syllabi, and maintain programs structure.
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={courseSearchQuery}
                    onChange={(e) => setCourseSearchQuery(e.target.value)}
                    className="flex-1 sm:w-64 px-4 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-[#0d9488] transition duration-200"
                  />

                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-[#0d9488] cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white shadow-md cursor-pointer transition duration-200 flex-shrink-0"
                  >
                    + Add Course
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-100">
                {loadingCourses ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                    <span className="animate-spin text-teal-600">⏳</span>
                    <span className="text-xs">Loading course list...</span>
                  </div>
                ) : coursesError ? (
                  <div className="p-8 text-center text-rose-500 text-xs font-bold">{coursesError}</div>
                ) : filteredCourses.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">No courses seeded in catalog.</div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs bg-white">
                    <thead>
                      <tr className="border-b border-slate-100 bg-[#f8fafc] text-[#0d9488] font-bold">
                        <th className="p-4">Course Program</th>
                        <th className="p-4">Category</th>
                        <th className="p-4 text-center">Price</th>
                        <th className="p-4 text-center">Expiry</th>
                        <th className="p-4 text-center">Modules</th>
                        <th className="p-4 text-center">Lessons</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {filteredCourses.map((c) => (
                        <tr 
                          key={c.id} 
                          onClick={() => {
                            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                              setActiveDetailItem({ type: 'course', data: c });
                            }
                          }}
                          className="hover:bg-slate-50/50 transition cursor-pointer md:cursor-default"
                        >
                          <td className="p-4">
                            <span className="font-bold text-slate-800 block text-sm">{c.title}</span>
                            <span className="text-[9px] text-slate-400 font-mono block mt-0.5 truncate max-w-xs">ID: {c.id}</span>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-600 border border-teal-100 font-bold">
                              {c.category}
                            </span>
                          </td>
                          <td className="p-4 text-center font-bold">
                            {c.price && c.price > 0 ? `${Number(c.price).toLocaleString()} MMK` : 'Free'}
                          </td>
                          <td className="p-4 text-center text-slate-400 font-medium">
                            {c.expiry ? formatDateString(c.expiry, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }) : 'Lifetime'}
                          </td>
                          <td className="p-4 text-center font-bold">{c.modulesCount || 0}</td>
                          <td className="p-4 text-center font-bold">{c.lessonsCount || 0}</td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCourse(c.id);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 text-[10px] font-bold cursor-pointer transition"
                              >
                                Delete
                              </button>
                              <Link
                                href={`/courses/${c.id}/edit`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold cursor-pointer transition block text-center"
                              >
                                Edit Syllabus
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 font-sans">Course Categories Management</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Create and delete categories that instructors can choose when publishing courses.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Create New Category</h3>
                <form onSubmit={handleCreateCategory} className="flex gap-3 max-w-md">
                  <input
                    type="text"
                    placeholder="e.g. Cloud Computing"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-teal-500 bg-white"
                    required
                  />
                  <button
                    type="submit"
                    disabled={creatingCategory}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    {creatingCategory ? 'Creating...' : '+ Create'}
                  </button>
                </form>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-100">
                {loadingCategories ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                    <span className="animate-spin text-teal-600">⏳</span>
                    <span className="text-xs">Loading categories...</span>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">No categories created yet.</div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs bg-white">
                    <thead>
                      <tr className="border-b border-slate-100 bg-[#f8fafc] text-[#0d9488] font-bold">
                        <th className="p-4">Category Name</th>
                        <th className="p-4">Created Date</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {categories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 font-bold text-slate-800">{cat.name}</td>
                          <td className="p-4 text-slate-400">
                            {formatDateString(cat.createdAt, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 text-[10px] font-bold cursor-pointer transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB: ENROLLMENTS */}
          {activeTab === 'enrollments' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-800 font-sans">Classroom Enrollments Directory</h2>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Search students registrations, verify onboarding, and revoke enrollment credentials.
                  </p>
                </div>

                <div className="w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Search by student or course..."
                    value={enrollmentSearchQuery}
                    onChange={(e) => setEnrollmentSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-[#0d9488] transition duration-200"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-100">
                {loadingEnrollments ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                    <span className="animate-spin text-teal-600">⏳</span>
                    <span className="text-xs">Loading registrations...</span>
                  </div>
                ) : enrollmentsError ? (
                  <div className="p-8 text-center text-rose-500 text-xs font-bold">{enrollmentsError}</div>
                ) : filteredEnrollments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">No enrollments match search query.</div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs bg-white">
                    <thead>
                      <tr className="border-b border-slate-100 bg-[#f8fafc] text-[#0d9488] font-bold">
                        <th className="p-4">Student</th>
                        <th className="p-4">Registered Program</th>
                        <th className="p-4">Joined Date</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {filteredEnrollments.map((item) => (
                        <tr 
                          key={item.id} 
                          onClick={() => {
                            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                              setActiveDetailItem({ type: 'enrollment', data: item });
                            }
                          }}
                          className="hover:bg-slate-50/50 transition cursor-pointer md:cursor-default"
                        >
                          <td className="p-4">
                            <span className="font-bold text-slate-800 block text-sm">{item.user?.fullName || 'Unknown'}</span>
                            <span className="text-[9px] text-slate-400 font-mono block mt-0.5 truncate max-w-xs">{item.user?.email}</span>
                          </td>
                          <td className="p-4 font-semibold text-slate-700">{item.course?.title || 'Unknown Course'}</td>
                          <td className="p-4 text-slate-400">
                            {formatDateString(item.joinedAt, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="p-4 text-center font-bold">
                            {item.completed ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold">Graduated</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 font-bold">Studying</span>
                            )}
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRevokeEnrollment(item.id);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 text-[10px] font-bold cursor-pointer transition"
                            >
                              Revoke Access
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB: REPORT */}
          {activeTab === 'report' && (
            <div className="space-y-8 animate-fade-in text-left">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-extrabold text-slate-800 font-sans">LMS Platform Performance Analytics</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Aggregate course registrations, platform engagement, assignments status, active users activity logs, and course retention metrics.
                </p>
              </div>

              {loadingReports || !reportsData ? (
                <div className="py-20 text-center text-slate-400 text-xs bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                  <div className="inline-block animate-spin text-[#0d9488] text-2xl mb-2">⏳</div>
                  <p className="font-semibold text-slate-500">Compiling comprehensive analytics and reports...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Row 1: Course Engagement Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Logins Count */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Platform Logins</span>
                        <h3 className="text-3xl font-black text-slate-800">{reportsData.courseEngagement.totalLogins}</h3>
                        <p className="text-[10px] text-teal-600 font-bold">👤 Real & simulated login events</p>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl font-bold">
                        🔑
                      </div>
                    </div>

                    {/* Time Spent */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Time Spent On Platform</span>
                        <h3 className="text-3xl font-black text-slate-800">
                          {reportsData.courseEngagement.totalTimeSpentMinutes >= 60 
                            ? `${Math.floor(reportsData.courseEngagement.totalTimeSpentMinutes / 60)}h ${reportsData.courseEngagement.totalTimeSpentMinutes % 60}m`
                            : `${reportsData.courseEngagement.totalTimeSpentMinutes} min`
                          }
                        </h3>
                        <p className="text-[10px] text-indigo-600 font-bold">⏱️ Active study & system sessions</p>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">
                        ⏱️
                      </div>
                    </div>

                    {/* Video watch completion rates */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Video Watch Completion</span>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-3xl font-black text-slate-800">{reportsData.courseEngagement.watchCompletionRate}%</h3>
                          <span className="text-[10px] text-slate-400">rate</span>
                        </div>
                        <p className="text-[10px] text-emerald-600 font-bold">🎬 Watching 90%+ of videos</p>
                      </div>
                      
                      {/* Mini Gauge SVG */}
                      <div className="relative h-14 w-14 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="28" cy="28" r="22" stroke="#f1f5f9" strokeWidth="4" fill="transparent" />
                          <circle cx="28" cy="28" r="22" stroke="#10b981" strokeWidth="4" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 22} 
                            strokeDashoffset={2 * Math.PI * 22 * (1 - reportsData.courseEngagement.watchCompletionRate / 100)} 
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-[10px] font-black text-emerald-600">🎯</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: User Activity - DAU & Peak Times */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* DAU Chart */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Daily Active Users (DAU)</h3>
                          <p className="text-[10px] text-slate-400">Unique active students over the last 7 days</p>
                        </div>
                        <span className="px-2.5 py-1 text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-100 rounded-lg">Last 7 Days</span>
                      </div>
                      <div className="w-full pt-2 animate-fade-in">
                        {renderDAUChart()}
                      </div>
                    </div>

                    {/* Peak Usage Hours Chart */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Peak Usage Hours</h3>
                          <p className="text-[10px] text-slate-400">Hourly activity distribution on the platform</p>
                        </div>
                        <span className="px-2.5 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg">24H Profile</span>
                      </div>
                      <div className="w-full pt-2 animate-fade-in">
                        {renderHourlyChart()}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Assignment Tracking */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Submission Rate Circular Gauge */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Assignment Submission Rate</h3>
                        <p className="text-[10px] text-slate-400">Submissions divided by total expected submissions</p>
                      </div>

                      <div className="flex justify-center items-center py-6">
                        <div className="relative h-32 w-32 flex items-center justify-center font-sans">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="50" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                            <circle cx="64" cy="64" r="50" stroke="#06b6d4" strokeWidth="10" fill="transparent" 
                              strokeDasharray={2 * Math.PI * 50} 
                              strokeDashoffset={2 * Math.PI * 50 * (1 - reportsData.assignmentTracking.submissionRate / 100)} 
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute text-center">
                            <span className="text-3xl font-black text-slate-800">{reportsData.assignmentTracking.submissionRate}%</span>
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">Turn-In Rate</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 text-center">
                        Calculated from all active enrollments across courses containing published assignments.
                      </p>
                    </div>

                    {/* Late vs On-Time Submissions Bar Breakdown */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6 lg:col-span-3 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Submission Punctuality</h3>
                        <p className="text-[10px] text-slate-400">Late submissions compared to submissions before the deadline</p>
                      </div>

                      <div className="space-y-4 py-4">
                        {/* Double Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-bold text-slate-700">
                            <span>Submissions status breakdown</span>
                            <span>{reportsData.assignmentTracking.submissionBreakdown.total} Total Submissions</span>
                          </div>
                          
                          {/* Segmented bar */}
                          <div className="w-full h-5 bg-slate-100 rounded-lg overflow-hidden flex">
                            {reportsData.assignmentTracking.submissionBreakdown.total > 0 ? (
                              <>
                                <div 
                                  className="h-full bg-emerald-500 flex items-center justify-center text-[9px] font-extrabold text-white transition-all duration-300"
                                  style={{ width: `${(reportsData.assignmentTracking.submissionBreakdown.onTime / reportsData.assignmentTracking.submissionBreakdown.total) * 100}%` }}
                                >
                                  {reportsData.assignmentTracking.submissionBreakdown.onTime > 0 && `${Math.round((reportsData.assignmentTracking.submissionBreakdown.onTime / reportsData.assignmentTracking.submissionBreakdown.total) * 100)}%`}
                                </div>
                                <div 
                                  className="h-full bg-rose-500 flex items-center justify-center text-[9px] font-extrabold text-white transition-all duration-300"
                                  style={{ width: `${(reportsData.assignmentTracking.submissionBreakdown.late / reportsData.assignmentTracking.submissionBreakdown.total) * 100}%` }}
                                >
                                  {reportsData.assignmentTracking.submissionBreakdown.late > 0 && `${Math.round((reportsData.assignmentTracking.submissionBreakdown.late / reportsData.assignmentTracking.submissionBreakdown.total) * 100)}%`}
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-400">No submissions recorded yet</div>
                            )}
                          </div>
                        </div>

                        {/* Legends */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="flex items-center gap-2 border border-emerald-100 bg-emerald-50/30 p-2.5 rounded-xl">
                            <span className="text-lg">✅</span>
                            <div>
                              <span className="block text-[8px] font-bold text-slate-400 uppercase leading-none">On-Time</span>
                              <span className="text-xs font-black text-slate-800">{reportsData.assignmentTracking.submissionBreakdown.onTime} submissions</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 border border-rose-100 bg-rose-50/30 p-2.5 rounded-xl">
                            <span className="text-lg">⚠️</span>
                            <div>
                              <span className="block text-[8px] font-bold text-slate-400 uppercase leading-none">Late (Overdue)</span>
                              <span className="text-xs font-black text-slate-800">{reportsData.assignmentTracking.submissionBreakdown.late} submissions</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400">
                        Punctuality metrics update instantly when students submit assignments in the student workspace.
                      </p>
                    </div>
                  </div>

                  {/* Row 4: Course Popularity & Dropouts */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Course Popularity & Student Retention</h3>
                      <p className="text-[10px] text-slate-400">Enrollments per course program matched with inactive dropout rates</p>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      {reportsData.coursePopularity.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">No course programs defined yet.</div>
                      ) : (
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 bg-[#f8fafc] text-[#0d9488] font-bold">
                              <th className="p-4">Course Program</th>
                              <th className="p-4">Category</th>
                              <th className="p-4 text-center">Enrollment Share</th>
                              <th className="p-4 text-center">Dropout Rate</th>
                              <th className="p-4 text-right">Retention Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {reportsData.coursePopularity.map((course: any) => {
                              // Find max enrollment to scale share bar
                              const maxEnrollments = Math.max(...reportsData.coursePopularity.map((c: any) => c.enrollments), 1);
                              const enrollmentShare = (course.enrollments / maxEnrollments) * 100;
                              
                              // Dropout rate alert levels
                              let retentionBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                              let retentionLabel = "Excellent (High)";
                              if (course.dropoutRate > 25) {
                                retentionBadgeColor = "bg-rose-50 text-rose-700 border-rose-100";
                                retentionLabel = "Critically Low";
                              } else if (course.dropoutRate > 10) {
                                retentionBadgeColor = "bg-amber-50 text-amber-700 border-amber-100";
                                retentionLabel = "Moderate (Warn)";
                              }

                              return (
                                <tr key={course.id} className="hover:bg-slate-50/50 transition">
                                  <td className="p-4 font-bold text-slate-800 text-sm">{course.title}</td>
                                  <td className="p-4">
                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold text-[10px]">
                                      {course.category}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      <span className="font-bold w-6 text-right">{course.enrollments}</span>
                                      <div className="flex-1 min-w-[100px] bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${enrollmentShare}%` }} />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-3">
                                      <span className="font-bold w-8">{course.dropoutRate}%</span>
                                      <div className="w-16 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full ${course.dropoutRate > 25 ? 'bg-rose-500' : course.dropoutRate > 10 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                          style={{ width: `${course.dropoutRate}%` }} 
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4 text-right">
                                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${retentionBadgeColor}`}>
                                      {retentionLabel}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: USERS */}
          {activeTab === 'users' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-extrabold text-slate-800 font-sans">Registered System Users</h2>
                    <button
                      onClick={() => setShowCreateUserModal(true)}
                      className="px-3 py-1.5 bg-[#0d9488] hover:bg-[#0f766e] text-white text-[10px] font-bold rounded-lg shadow-xs transition duration-200 cursor-pointer flex items-center gap-1 leading-none"
                    >
                      ➕ Register User
                    </button>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Promote accounts, update roles, and manage administrative clearance levels.
                  </p>
                </div>

                <div className="w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-[#0d9488] transition duration-200"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-100">
                {loadingUsers ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                    <span className="animate-spin text-teal-600">⏳</span>
                    <span className="text-xs">Loading system directory...</span>
                  </div>
                ) : usersError ? (
                  <div className="p-8 text-center text-rose-500 text-xs font-bold">{usersError}</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">No registered accounts found.</div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs bg-white">
                    <thead>
                      <tr className="border-b border-slate-100 bg-[#f8fafc] text-[#0d9488] font-bold">
                        <th className="p-4">Full Name</th>
                        <th className="p-4">Email Address</th>
                        <th className="p-4">Joined Date</th>
                        <th className="p-4 text-center">Clearance Level</th>
                        <th className="p-4 text-right">Status / Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {filteredUsers.map((u) => {
                        const isCurrentUser = u.id === user.id;

                        return (
                          <tr 
                            key={u.id} 
                            onClick={() => {
                              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                                setActiveDetailItem({ type: 'user', data: u });
                              }
                            }}
                            className="hover:bg-slate-50/50 transition cursor-pointer md:cursor-default"
                          >
                            <td className="p-4 font-bold text-slate-800">{u.fullName}</td>
                            <td className="p-4 font-mono text-slate-500">{u.email}</td>
                            <td className="p-4 text-slate-400">
                              {formatDateString(u.createdAt, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={u.role}
                                disabled={isCurrentUser || updatingUserId === u.id}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleRoleChange(u.id, e.target.value as any);
                                }}
                                className={`px-2 py-1 rounded-lg border text-xs font-bold bg-white transition-colors outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                  u.role === 'ADMIN'
                                    ? 'border-rose-200 text-rose-600 bg-rose-50/20'
                                    : u.role === 'INSTRUCTOR'
                                    ? 'border-teal-200 text-teal-600 bg-teal-50/20'
                                    : 'border-emerald-200 text-emerald-600 bg-emerald-50/20'
                                }`}
                              >
                                <option value="STUDENT" className="bg-white text-emerald-600 font-bold">Student</option>
                                <option value="INSTRUCTOR" className="bg-white text-teal-600 font-bold">Instructor</option>
                                <option value="ADMIN" className="bg-white text-rose-600 font-bold">Admin</option>
                              </select>
                            </td>
                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                {u.role === 'INSTRUCTOR' ? (
                                  <>
                                    {u.isApproved ? (
                                      <>
                                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-[10px]">
                                          Approved
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleApproveUser(u.id, false);
                                          }}
                                          disabled={updatingUserId === u.id}
                                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded text-[10px] font-bold cursor-pointer transition disabled:opacity-50 animate-fade-in"
                                        >
                                          Deny
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 font-bold text-[10px]">
                                          Pending
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleApproveUser(u.id, true);
                                          }}
                                          disabled={updatingUserId === u.id}
                                          className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-600 border border-teal-100 rounded text-[10px] font-bold cursor-pointer transition disabled:opacity-50 animate-fade-in"
                                        >
                                          Approve
                                        </button>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-slate-400 italic text-[10px]">Auto-Approved</span>
                                )}
                                
                                {!isCurrentUser && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteUser(u.id);
                                    }}
                                    disabled={updatingUserId === u.id}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-100 rounded text-[10px] font-bold cursor-pointer transition disabled:opacity-50"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB: PAYMENTS (Offline Payments) */}
          {activeTab === 'payments' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in text-left">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 font-sans">Offline Manual Bank Payments</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Verify manual cash payments, bank deposits receipt numbers, and approve enrollees.
                </p>
              </div>

              {loadingPayments ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  <div className="inline-block animate-spin text-[#0d9488] text-xl mb-2">⏳</div>
                  <p className="font-semibold text-slate-500">Loading offline payment requests...</p>
                </div>
              ) : payments.length === 0 ? (
                <div className="bg-white border border-slate-200/60 rounded-2xl p-8 text-center text-slate-400 text-xs shadow-sm">
                  📭 No offline payment requests found.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left border-collapse text-xs bg-white">
                    <thead>
                      <tr className="border-b border-slate-100 bg-[#f8fafc] text-[#0d9488] font-bold">
                        <th className="p-4">Student Participant</th>
                        <th className="p-4">Course Title</th>
                        <th className="p-4">Paid Amount</th>
                        <th className="p-4">Deposit Date</th>
                        <th className="p-4 text-center">Receipt</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Approve / Decline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {payments.map((pay) => (
                        <tr 
                          key={pay.id} 
                          onClick={() => {
                            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                              setActiveDetailItem({ type: 'payment', data: pay });
                            }
                          }}
                          className="hover:bg-slate-50/50 transition cursor-pointer md:cursor-default"
                        >
                          <td className="p-4">
                            <span className="font-bold text-slate-800 block text-sm">{pay.studentName}</span>
                            <span className="text-[9px] text-slate-400 font-mono block mt-0.5 truncate max-w-xs">{pay.studentEmail}</span>
                          </td>
                          <td className="p-4 font-semibold text-slate-700">{pay.courseTitle}</td>
                          <td className="p-4 font-bold text-slate-800">{pay.amount}</td>
                          <td className="p-4 text-slate-400">{pay.date}</td>
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            {pay.receiptUrl ? (
                              <a
                                href={pay.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-200 text-[10px] font-bold transition cursor-pointer"
                              >
                                📂 View File
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">No attachment</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {pay.status === 'APPROVED' ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold">APPROVED</span>
                            ) : pay.status === 'REJECTED' ? (
                              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100 font-bold">REJECTED</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 font-bold">PENDING</span>
                            )}
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            {pay.status === 'PENDING' ? (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePaymentStatus(pay.id, 'REJECTED');
                                  }}
                                  className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold border border-rose-100 cursor-pointer"
                                >
                                  Decline
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePaymentStatus(pay.id, 'APPROVED');
                                  }}
                                  className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[10px] font-bold border border-emerald-100 cursor-pointer"
                                >
                                  Approve
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No action pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: NEWSLETTER */}
          {activeTab === 'newsletter' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 font-sans">Broadcast Newsletter Announcement</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Send email announcements and system alerts to all registered user accounts.
                </p>
              </div>

              <form onSubmit={handleBroadcastNewsletter} className="space-y-4 max-w-xl">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Newsletter Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Nexora Academy Holiday Notice & System Updates"
                    value={newsletterSubject}
                    onChange={(e) => setNewsletterSubject(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#0d9488] text-slate-700"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Broadcast message content</label>
                  <textarea
                    rows={6}
                    placeholder="Write detailed announcements or notes here..."
                    value={newsletterContent}
                    onChange={(e) => setNewsletterContent(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#0d9488] text-slate-700 resize-y"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={broadcasting}
                  className="px-6 py-2.5 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  {broadcasting ? 'Broadcasting newsletter...' : '🚀 Broadcast Newsletter'}
                </button>
              </form>
            </div>
          )}

          {/* TAB: CONTACT */}
          {activeTab === 'contact' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 font-sans">Support tickets & Contact inquiries</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Review user support tickets, answer messages, and resolve queries.
                </p>
              </div>

              <div className="space-y-4">
                {tickets.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200/80">
                    <span className="text-2xl">🎉</span>
                    <p className="text-slate-500 font-medium text-xs mt-2">All caught up! No support tickets found.</p>
                  </div>
                ) : (
                  tickets.map((t) => (
                    <div key={t.id} className="border border-slate-100 rounded-xl p-5 space-y-4 shadow-sm hover:border-slate-200 transition">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-wider">{t.id.slice(0, 8)}</span>
                          <h3 className="font-extrabold text-sm text-slate-800 mt-1.5">{t.subject}</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">From: {t.name} ({t.email}) • {formatDateString(t.createdAt || t.date)}</p>
                        </div>

                        <button
                          onClick={() => toggleTicketResolved(t.id, t.resolved)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer border transition ${
                            t.resolved
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                              : 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100'
                          }`}
                        >
                          {t.resolved ? '✓ Resolved' : ' Mark Resolved'}
                        </button>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100 italic">
                        "{t.message}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: BLOG */}
          {activeTab === 'blog' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 font-sans">LMS Platform Blog Articles</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Publish articles, announcements, and guides to the news desk.
                </p>
              </div>

              {/* Publish Blog Post Form */}
              <form onSubmit={handleCreateBlogPost} className="bg-[#f8fafc] border border-slate-200/50 rounded-xl p-5 space-y-4">
                <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">Publish New Article</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Title</label>
                    <input
                      type="text"
                      value={newBlogTitle}
                      onChange={(e) => setNewBlogTitle(e.target.value)}
                      placeholder="e.g. Why Odoo ERP is the Future of Enterprise"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500 font-sans text-slate-700"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Author</label>
                    <input
                      type="text"
                      value={newBlogAuthor}
                      onChange={(e) => setNewBlogAuthor(e.target.value)}
                      placeholder="e.g. Yan Myo Aung"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500 font-sans text-slate-700"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Category</label>
                    <input
                      type="text"
                      value={newBlogCategory}
                      onChange={(e) => setNewBlogCategory(e.target.value)}
                      placeholder="e.g. Odoo / Linux / Tech"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500 font-sans text-slate-700"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={creatingBlog}
                    className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg cursor-pointer transition disabled:opacity-50"
                  >
                    {creatingBlog ? 'Publishing...' : 'Publish Article'}
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left border-collapse text-xs bg-white">
                  <thead>
                    <tr className="border-b border-slate-100 bg-[#f8fafc] text-[#0d9488] font-bold">
                      <th className="p-4">Post Title</th>
                      <th className="p-4">Author</th>
                      <th className="p-4">Category</th>
                      <th className="p-4 text-right">Published Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {blogPosts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                          No blog posts found. Publish one above!
                        </td>
                      </tr>
                    ) : (
                      blogPosts.map((post) => (
                        <tr 
                          key={post.id} 
                          onClick={() => {
                            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                              setActiveDetailItem({ type: 'blog', data: post });
                            }
                          }}
                          className="hover:bg-slate-50/50 transition cursor-pointer md:cursor-default"
                        >
                          <td className="p-4 font-bold text-slate-800">{post.title}</td>
                          <td className="p-4 font-semibold text-slate-600">{post.author}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold">
                              {post.category}
                            </span>
                          </td>
                          <td className="p-4 text-right text-slate-400">
                            {formatDateString(post.createdAt || post.date)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: ADDONS */}
          {activeTab === 'addons' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 font-sans">Addons & Dynamic Integrations</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Configure external microservices, payment gateways, and notification settings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* SendGrid Email Toggle */}
                <div className="border border-slate-100 rounded-xl p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">SendGrid Mail Notification</h3>
                    <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed max-w-xs">
                      Enables automatic notification emails for course signups and examinations.
                    </p>
                  </div>
                  <button
                    onClick={() => setAddons((prev) => ({ ...prev, sendgrid: !prev.sendgrid }))}
                    className={`h-6 w-11 rounded-full relative transition duration-200 flex items-center cursor-pointer ${
                      addons.sendgrid ? 'bg-teal-500 justify-end' : 'bg-slate-200 justify-start'
                    }`}
                  >
                    <span className="h-5 w-5 rounded-full bg-white shadow-sm border border-slate-300 mx-0.5" />
                  </button>
                </div>

                {/* Supabase Auth Toggle */}
                <div className="border border-slate-100 rounded-xl p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Supabase Session Authentication</h3>
                    <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed max-w-xs">
                      Enforces cloud sessions tracking via Next.js SSR cookies client SDK.
                    </p>
                  </div>
                  <button
                    onClick={() => setAddons((prev) => ({ ...prev, supabaseAuth: !prev.supabaseAuth }))}
                    className={`h-6 w-11 rounded-full relative transition duration-200 flex items-center cursor-pointer ${
                      addons.supabaseAuth ? 'bg-teal-500 justify-end' : 'bg-slate-200 justify-start'
                    }`}
                  >
                    <span className="h-5 w-5 rounded-full bg-white shadow-sm border border-slate-300 mx-0.5" />
                  </button>
                </div>

                {/* AI Tutor Agent Toggle */}
                <div className="border border-slate-100 rounded-xl p-5 flex items-center justify-between shadow-sm opacity-90">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">AI Copilot Chat Assistant</h3>
                    <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed max-w-xs">
                      Integrates an autonomous Gemini-based AI assistant inside lesson study rooms.
                    </p>
                  </div>
                  <button
                    onClick={() => setAddons((prev) => ({ ...prev, aiTutorAgent: !prev.aiTutorAgent }))}
                    className={`h-6 w-11 rounded-full relative transition duration-200 flex items-center cursor-pointer ${
                      addons.aiTutorAgent ? 'bg-teal-500 justify-end' : 'bg-slate-200 justify-start'
                    }`}
                  >
                    <span className="h-5 w-5 rounded-full bg-white shadow-sm border border-slate-300 mx-0.5" />
                  </button>
                </div>

                {/* Stripe Toggle */}
                <div className="border border-slate-100 rounded-xl p-5 flex items-center justify-between shadow-sm opacity-90">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Stripe Checkout Payment Gateway</h3>
                    <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed max-w-xs">
                      Enables real-time student course purchasing via international credit cards.
                    </p>
                  </div>
                  <button
                    onClick={() => setAddons((prev) => ({ ...prev, stripeGateway: !prev.stripeGateway }))}
                    className={`h-6 w-11 rounded-full relative transition duration-200 flex items-center cursor-pointer ${
                      addons.stripeGateway ? 'bg-teal-500 justify-end' : 'bg-slate-200 justify-start'
                    }`}
                  >
                    <span className="h-5 w-5 rounded-full bg-white shadow-sm border border-slate-300 mx-0.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MESSAGE */}
          {activeTab === 'message' && (
            <div className="p-1">
              <MessagesPanel user={user} />
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in text-left">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 font-sans">LMS Web Settings & Branding</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Customize your learning platform name, landing page hero banner, contact support info, and copyright notices.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* LMS Brand Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">LMS Brand Name</label>
                    <input
                      type="text"
                      value={lmsNameInput}
                      onChange={(e) => setLmsNameInput(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#0d9488] text-slate-700 font-medium"
                      required
                    />
                  </div>

                  {/* Support Contact Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Support Contact Email</label>
                    <input
                      type="email"
                      value={contactEmailInput}
                      onChange={(e) => setContactEmailInput(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#0d9488] text-slate-700 font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Hero Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hero Banner Title</label>
                  <input
                    type="text"
                    value={bannerTitleInput}
                    onChange={(e) => setBannerTitleInput(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#0d9488] text-slate-700 font-medium"
                    required
                  />
                </div>

                {/* Hero Subtitle */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hero Banner Subtitle</label>
                  <textarea
                    rows={3}
                    value={bannerSubtitleInput}
                    onChange={(e) => setBannerSubtitleInput(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#0d9488] text-slate-700 font-medium resize-y"
                    required
                  />
                </div>

                {/* Banner Image Uploader */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hero Banner Background Image</label>
                  
                  {bannerUrlInput && (
                    <div className="mb-3 rounded-xl overflow-hidden max-h-48 border border-slate-200 relative bg-slate-50 flex items-center justify-center">
                      <img src={bannerUrlInput} alt="Hero Banner Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-[#0d9488]/50 transition duration-200 flex flex-col items-center justify-center text-center cursor-pointer bg-[#f8fafc]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {bannerFile ? (
                      <div className="space-y-1">
                        <span className="text-lg">📄</span>
                        <p className="text-xs font-bold text-slate-700 truncate max-w-md">{bannerFile.name}</p>
                        <p className="text-[9px] text-slate-400">{(bannerFile.size / 1024).toFixed(1)} KB - Click to replace</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-lg">📸</span>
                        <p className="text-xs font-bold text-slate-500">Upload Custom Banner Image</p>
                        <p className="text-[9px] text-slate-400">PNG, JPG, JPEG, WEBP</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Copyright */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Footer Copyright & Info</label>
                  <input
                    type="text"
                    value={footerInfoInput}
                    onChange={(e) => setFooterInfoInput(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#0d9488] text-slate-700 font-medium"
                    required
                  />
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#0d9488] hover:bg-[#0f766e] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition shadow-md shadow-teal-600/10 cursor-pointer"
                >
                  {savingSettings ? 'Saving Settings...' : 'Save Configuration'}
                </button>
              </form>
            </div>
          )}
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
                  handleSignOut();
                }}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

      </main>

      {/* CREATE COURSE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-slate-700 animate-scale-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-800">Add New Course</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Course Title</label>
                <input
                  type="text"
                  placeholder="e.g. Introduction to Cisco Routing"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#0d9488] text-slate-700"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                <select
                  value={courseCategoryId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setCourseCategoryId(selectedId);
                    const selected = categories.find((cat) => cat.id === selectedId);
                    if (selected) {
                      setCourseCategory(selected.name);
                    } else {
                      setCourseCategory('');
                    }
                  }}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#0d9488] cursor-pointer text-slate-700"
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Price (MMK)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50000"
                    value={coursePrice}
                    onChange={(e) => setCoursePrice(Number(e.target.value))}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#0d9488] text-slate-700"
                    required
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">0 for free.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Expiry Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={courseExpiry}
                    onChange={(e) => setCourseExpiry(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#0d9488] text-slate-700"
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">Blank for lifetime.</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Course Thumbnail</label>
                <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-[#0d9488]/50 transition duration-200 flex flex-col items-center justify-center text-center cursor-pointer bg-[#f8fafc]">
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
                  rows={4}
                  placeholder="Summarize course content and learning goals..."
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#0d9488] text-slate-700 resize-y"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={creatingCourse}
                className="w-full py-2.5 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                {creatingCourse ? 'Adding Course...' : 'Create Course'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER NEW USER ACCOUNT */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-left relative animate-scale-up">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-extrabold text-[#0f112e] font-sans">Register New User Account</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Admin-only registration for student or instructor accounts.</p>
              </div>
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminCreateUser} className="space-y-4 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={createUserFullName}
                  onChange={(e) => setCreateUserFullName(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#0d9488] text-slate-700 font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. user@example.com"
                  value={createUserEmail}
                  onChange={(e) => setCreateUserEmail(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#0d9488] text-slate-700 font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Password (min 8 chars)</label>
                <input
                  type="password"
                  placeholder="Create secure password"
                  value={createUserPassword}
                  onChange={(e) => setCreateUserPassword(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#0d9488] text-slate-700 font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Account Clearance Role</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setCreateUserRole('STUDENT')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition duration-200 cursor-pointer ${
                      createUserRole === 'STUDENT'
                        ? 'border-teal-400 bg-teal-50 text-teal-700 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    🎓 Student
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateUserRole('INSTRUCTOR')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition duration-200 cursor-pointer ${
                      createUserRole === 'INSTRUCTOR'
                        ? 'border-teal-400 bg-teal-50 text-teal-700 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    👨‍🏫 Instructor
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingUser}
                className="w-full py-2.5 bg-[#0d9488] hover:bg-[#0f766e] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                {creatingUser ? 'Registering...' : 'Register Account'}
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
                Detail View: {activeDetailItem.type}
              </h3>
              <button
                onClick={() => setActiveDetailItem(null)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {activeDetailItem.type === 'user' && (() => {
                const u = activeDetailItem.data;
                const isCurrentUser = u.id === user.id;
                return (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Full Name</span>
                      <span className="col-span-2 text-slate-800 font-semibold">{u.fullName}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Email Address</span>
                      <span className="col-span-2 text-slate-800 font-mono break-all">{u.email}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Joined Date</span>
                      <span className="col-span-2 text-slate-800">
                        {formatDateString(u.createdAt, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Role</span>
                      <span className="col-span-2">
                        <select
                          value={u.role}
                          disabled={isCurrentUser || updatingUserId === u.id}
                          onChange={(e) => {
                            handleRoleChange(u.id, e.target.value as any);
                            setActiveDetailItem(null);
                          }}
                          className={`px-2 py-1 rounded-lg border text-xs font-bold bg-white transition-colors outline-none cursor-pointer ${
                            u.role === 'ADMIN'
                              ? 'border-rose-200 text-rose-600 bg-rose-50/20'
                              : u.role === 'INSTRUCTOR'
                              ? 'border-teal-200 text-teal-600 bg-teal-50/20'
                              : 'border-emerald-200 text-emerald-600 bg-emerald-50/20'
                          }`}
                        >
                          <option value="STUDENT">Student</option>
                          <option value="INSTRUCTOR">Instructor</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 pb-2">
                      <span className="font-bold text-slate-400">Clearance Status</span>
                      <span className="col-span-2">
                        {u.role === 'INSTRUCTOR' ? (
                          u.isApproved ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-[10px]">
                              Approved
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 font-bold text-[10px]">
                              Pending Approval
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 italic">Auto-Approved</span>
                        )}
                      </span>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
                      {u.role === 'INSTRUCTOR' && (
                        <button
                          onClick={() => {
                            handleApproveUser(u.id, !u.isApproved);
                            setActiveDetailItem(null);
                          }}
                          disabled={updatingUserId === u.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                            u.isApproved 
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100' 
                              : 'bg-teal-50 hover:bg-teal-100 text-teal-600 border border-teal-100'
                          }`}
                        >
                          {u.isApproved ? 'Deny Instructor' : 'Approve Instructor'}
                        </button>
                      )}
                      {!isCurrentUser && (
                        <button
                          onClick={() => {
                            handleDeleteUser(u.id);
                            setActiveDetailItem(null);
                          }}
                          disabled={updatingUserId === u.id}
                          className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 text-xs font-bold cursor-pointer transition"
                        >
                          Delete Account
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {activeDetailItem.type === 'course' && (() => {
                const c = activeDetailItem.data;
                return (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Course Title</span>
                      <span className="col-span-2 text-slate-800 font-semibold">{c.title}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Category</span>
                      <span className="col-span-2">
                        <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-600 border border-teal-100 font-bold">
                          {c.category}
                        </span>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Price</span>
                      <span className="col-span-2 text-slate-800 font-bold">
                        {c.price && c.price > 0 ? `${Number(c.price).toLocaleString()} MMK` : 'Free'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Expiry Date</span>
                      <span className="col-span-2 text-slate-800">
                        {c.expiry ? formatDateString(c.expiry, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }) : 'Lifetime'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Modules</span>
                      <span className="col-span-2 text-slate-800 font-bold">{c.modulesCount || 0}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Lessons</span>
                      <span className="col-span-2 text-slate-800 font-bold">{c.lessonsCount || 0}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 pb-2">
                      <span className="font-bold text-slate-400">Course ID</span>
                      <span className="col-span-2 text-slate-400 font-mono break-all">{c.id}</span>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
                      <button
                        onClick={() => {
                          handleDeleteCourse(c.id);
                          setActiveDetailItem(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 text-xs font-bold cursor-pointer transition"
                      >
                        Delete Course
                      </button>
                      <Link
                        href={`/courses/${c.id}/edit`}
                        onClick={() => setActiveDetailItem(null)}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-5050 text-white text-xs font-bold cursor-pointer transition block text-center"
                      >
                        Edit Syllabus
                      </Link>
                    </div>
                  </div>
                );
              })()}

              {activeDetailItem.type === 'enrollment' && (() => {
                const item = activeDetailItem.data;
                return (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Student Name</span>
                      <span className="col-span-2 text-slate-800 font-semibold">{item.user?.fullName || 'Unknown'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Student Email</span>
                      <span className="col-span-2 text-slate-800 font-mono break-all">{item.user?.email}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Course Title</span>
                      <span className="col-span-2 text-slate-800 font-semibold">{item.course?.title || 'Unknown Course'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Joined Date</span>
                      <span className="col-span-2 text-slate-800">
                        {formatDateString(item.joinedAt, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 pb-2">
                      <span className="font-bold text-slate-400">Status</span>
                      <span className="col-span-2">
                        {item.completed ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold">Graduated</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 font-bold">Studying</span>
                        )}
                      </span>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
                      <button
                        onClick={() => {
                          handleRevokeEnrollment(item.id);
                          setActiveDetailItem(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 text-xs font-bold cursor-pointer transition"
                      >
                        Revoke Access
                      </button>
                    </div>
                  </div>
                );
              })()}

              {activeDetailItem.type === 'payment' && (() => {
                const pay = activeDetailItem.data;
                return (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Student Name</span>
                      <span className="col-span-2 text-slate-800 font-semibold">{pay.studentName}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Student Email</span>
                      <span className="col-span-2 text-slate-800 font-mono break-all">{pay.studentEmail}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Course Title</span>
                      <span className="col-span-2 text-slate-800 font-semibold">{pay.courseTitle}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Amount</span>
                      <span className="col-span-2 text-slate-850 font-bold">{pay.amount}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Date</span>
                      <span className="col-span-2 text-slate-800">{pay.date}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Receipt File</span>
                      <span className="col-span-2">
                        {pay.receiptUrl ? (
                          <a
                            href={pay.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-200 text-[10px] font-bold transition cursor-pointer"
                          >
                            📂 View Attachment
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">No attachment</span>
                        )}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 pb-2">
                      <span className="font-bold text-slate-400">Payment Status</span>
                      <span className="col-span-2">
                        {pay.status === 'APPROVED' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold">APPROVED</span>
                        ) : pay.status === 'REJECTED' ? (
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100 font-bold">REJECTED</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 font-bold">PENDING</span>
                        )}
                      </span>
                    </div>

                    {pay.status === 'PENDING' && (
                      <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            handlePaymentStatus(pay.id, 'REJECTED');
                            setActiveDetailItem(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-100 cursor-pointer transition"
                        >
                          Decline Payment
                        </button>
                        <button
                          onClick={() => {
                            handlePaymentStatus(pay.id, 'APPROVED');
                            setActiveDetailItem(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-bold border border-emerald-100 cursor-pointer transition"
                        >
                          Approve Payment
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {activeDetailItem.type === 'blog' && (() => {
                const post = activeDetailItem.data;
                return (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Blog Title</span>
                      <span className="col-span-2 text-slate-800 font-semibold text-xs leading-relaxed">{post.title}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Author Name</span>
                      <span className="col-span-2 text-slate-800 font-semibold">{post.author}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-400">Category</span>
                      <span className="col-span-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold">
                          {post.category}
                        </span>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 pb-2">
                      <span className="font-bold text-slate-400">Publish Date</span>
                      <span className="col-span-2 text-slate-800">
                        {formatDateString(post.createdAt || post.date)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      {/* Reusable Confirmation Modal */}
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

export default AdminDashboard;
