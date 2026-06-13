'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  content: string | null;
  videoUrl: string | null;
  type: string;
  order: number;
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
}

interface SyllabusData {
  course: Course;
  modules: ModuleWithLessons[];
}

function getYoutubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    let videoId = '';
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      videoId = urlObj.searchParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      const parts = url.split('youtu.be/');
      if (parts.length > 1) {
        videoId = parts[1].split(/[?#]/)[0];
      }
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  } catch (e) {
    return url;
  }
}

export default function LearnPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const resolvedParams = React.use(params);
  const { courseId, lessonId } = resolvedParams;

  const [syllabus, setSyllabus] = useState<SyllabusData | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Accordion active module tracker
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Progress tracking
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [updatingProgress, setUpdatingProgress] = useState(false);

  // Watch time tracking
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [totalVideoSeconds, setTotalVideoSeconds] = useState(0);
  const watchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pageEntryTimeRef = useRef<number>(Date.now());
  const watchedSecondsRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const [initialPosition, setInitialPosition] = useState(0);
  const initialPositionRef = useRef(0);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ytPlayerRef = useRef<any>(null);

  // Sync states to refs
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    initialPositionRef.current = initialPosition;
  }, [initialPosition]);

  // Classroom tabs state
  const [activeTab, setActiveTab] = useState<'notes' | 'forum' | 'announcements'>('notes');

  // Discussions forum
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Announcements
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    const currentUser = user;
    if (!currentUser) {
      router.push(`/login?redirect=/learn/${courseId}/${lessonId}`);
      return;
    }

    async function verifyAndLoad() {
      try {
        setLoading(true);
        
        // Reset watch stats for the new lesson
        setWatchedSeconds(0);
        watchedSecondsRef.current = 0;
        setInitialPosition(0);

        const userRole = currentUser?.role;

        // 1. Verify Enrollment for students
        if (userRole === 'STUDENT') {
          const enrollRes = await courseService.checkEnrollment(courseId);
          if (!enrollRes.success || !enrollRes.data?.enrolled) {
            setError('Access Denied. You must be enrolled in this course to study.');
            setLoading(false);
            return;
          }
          setIsEnrolled(true);
        } else if (userRole === 'INSTRUCTOR' || userRole === 'ADMIN') {
          // Instructors and Admins bypass enrollment checks
          setIsEnrolled(true);
        } else {
          setError('Access Denied. Invalid user session.');
          setLoading(false);
          return;
        }

        // 2. Fetch Syllabus
        const syllabusRes = await courseService.getCourseSyllabus(courseId);
        if (syllabusRes.success && syllabusRes.data) {
          setSyllabus(syllabusRes.data);

          // Find current lesson
          let foundLesson: Lesson | null = null;
          const initialExpanded: Record<string, boolean> = {};

          for (const mod of syllabusRes.data.modules) {
            const lesson = mod.lessons.find((l: Lesson) => l.id === lessonId);
            if (lesson) {
              foundLesson = lesson;
              initialExpanded[mod.id] = true; // Expand current module
            }
          }

          setCurrentLesson(foundLesson);
          setExpandedModules(initialExpanded);
        } else {
          setError(syllabusRes.error || 'Failed to fetch course syllabus.');
        }

        // 3. Fetch Course progress
        const progRes = await courseService.getCourseProgress(courseId);
        if (progRes.success && progRes.data) {
          setCompletedLessonIds(progRes.data.completedLessonIds || []);
          setProgressPercentage(progRes.data.percentage || 0);
        }

        // 4. Fetch Watch stats for resume position and accumulated seconds
        if (userRole === 'STUDENT') {
          const watchRes = await courseService.getCourseWatchStats(courseId);
          if (watchRes.success && watchRes.data?.lessons) {
            const lessonStats = watchRes.data.lessons.find((l: any) => l.lessonId === lessonId);
            if (lessonStats) {
              const prevSeconds = lessonStats.watchedSeconds || 0;
              const prevPos = lessonStats.lastPosition || 0;
              setWatchedSeconds(prevSeconds);
              watchedSecondsRef.current = prevSeconds;
              setInitialPosition(prevPos);
            }
          }
        }

      } catch (err: any) {
        setError(err.message || 'An error occurred.');
      } finally {
        setLoading(false);
      }
    }

    verifyAndLoad();
  }, [courseId, lessonId, user, authLoading, router]);

  // Watch time tracking — increment every second and save every 30 seconds
  const saveWatchProgress = useCallback(async () => {
    if (!user || user.role !== 'STUDENT' || !courseId || !lessonId) return;
    const currentWatched = watchedSecondsRef.current;
    if (currentWatched <= 0) return;
    try {
      let currentPos = currentWatched; // default fallback for text
      if (currentLesson?.type === 'VIDEO') {
        if (currentLesson.videoUrl?.includes('youtube.com') || currentLesson.videoUrl?.includes('youtu.be')) {
          if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
            currentPos = Math.round(ytPlayerRef.current.getCurrentTime());
          }
        } else {
          if (videoRef.current) {
            currentPos = Math.round(videoRef.current.currentTime);
          }
        }
      }

      await courseService.updateWatchProgress(
        lessonId,
        courseId,
        currentWatched,
        totalVideoSeconds || currentWatched,
        currentPos
      );
    } catch (err) {
      console.error('Failed to save watch progress', err);
    }
  }, [user, courseId, lessonId, totalVideoSeconds, currentLesson]);

  useEffect(() => {
    if (!isEnrolled || !user || user.role !== 'STUDENT' || !currentLesson) return;

    pageEntryTimeRef.current = Date.now();
    const isVideo = currentLesson.type === 'VIDEO';

    // Increment every second
    watchTimerRef.current = setInterval(() => {
      // If it is a video lesson, strictly count only when it's playing.
      // If it is a reading lesson, count continuously when they are studying on the page.
      if (!isVideo || isPlayingRef.current) {
        watchedSecondsRef.current += 1;
        setWatchedSeconds(watchedSecondsRef.current);

        // Auto-save every 30 seconds
        if (watchedSecondsRef.current % 30 === 0) {
          saveWatchProgress();
        }
      }
    }, 1000);

    // Cleanup and save on unmount
    return () => {
      if (watchTimerRef.current) {
        clearInterval(watchTimerRef.current);
      }
      saveWatchProgress();
    };
  }, [isEnrolled, lessonId, user, currentLesson, saveWatchProgress]);

  // YouTube API initialization and state change tracking
  useEffect(() => {
    if (!currentLesson || !currentLesson.videoUrl) {
      setIsPlaying(false);
      return;
    }

    const isYoutube = currentLesson.videoUrl.includes('youtube.com') || currentLesson.videoUrl.includes('youtu.be');
    if (!isYoutube) {
      setIsPlaying(false);
      return;
    }

    // Load YouTube API script if not loaded
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    let player: any;

    // Check periodically if YT is loaded and ready
    const initInterval = setInterval(() => {
      if ((window as any).YT && (window as any).YT.Player) {
        clearInterval(initInterval);
        try {
          player = new (window as any).YT.Player('yt-player', {
            events: {
              onReady: () => {
                ytPlayerRef.current = player;
                // Seek to initialPosition if greater than 0
                if (initialPositionRef.current > 0) {
                  player.seekTo(initialPositionRef.current, true);
                }
              },
              onStateChange: (event: any) => {
                // event.data === 1 is YT.PlayerState.PLAYING
                if (event.data === 1) {
                  setIsPlaying(true);
                  if (typeof player.getDuration === 'function') {
                    setTotalVideoSeconds(Math.round(player.getDuration()));
                  }
                } else {
                  setIsPlaying(false);
                }
              }
            }
          });
        } catch (e) {
          console.error('Failed to init YT player', e);
        }
      }
    }, 500);

    return () => {
      clearInterval(initInterval);
      if (player && typeof player.destroy === 'function') {
        player.destroy();
      }
      ytPlayerRef.current = null;
      setIsPlaying(false);
    };
  }, [currentLesson]);

  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const videoEl = e.currentTarget;
    setTotalVideoSeconds(Math.round(videoEl.duration));
    if (initialPositionRef.current > 0) {
      videoEl.currentTime = initialPositionRef.current;
    }
  };

  // Load discussions or announcements when tabs switch
  useEffect(() => {
    if (activeTab === 'forum') {
      loadDiscussions();
    } else if (activeTab === 'announcements') {
      loadAnnouncements();
    }
  }, [activeTab, courseId]);

  async function loadDiscussions() {
    try {
      setLoadingDiscussions(true);
      const res = await courseService.getDiscussions(courseId);
      if (res.success && res.data) {
        setDiscussions(res.data);
      }
    } catch (err) {
      console.error('Failed to load discussions', err);
    } finally {
      setLoadingDiscussions(false);
    }
  }

  async function loadAnnouncements() {
    try {
      setLoadingAnnouncements(true);
      const res = await courseService.getAnnouncements(courseId);
      if (res.success && res.data) {
        setAnnouncements(res.data);
      }
    } catch (err) {
      console.error('Failed to load announcements', err);
    } finally {
      setLoadingAnnouncements(false);
    }
  }

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      setPostingComment(true);
      const res = await courseService.postDiscussion(courseId, { content: newComment });
      if (res.success) {
        setNewComment('');
        loadDiscussions();
      }
    } catch (err) {
      console.error('Failed to publish comment', err);
    } finally {
      setPostingComment(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!user || user.role !== 'STUDENT') return;
    try {
      setUpdatingProgress(true);
      const isCompleted = completedLessonIds.includes(lessonId);
      const newCompleted = !isCompleted;
      const res = await courseService.toggleLessonProgress(lessonId, newCompleted);
      if (res.success) {
        // Refresh progress stats
        const progRes = await courseService.getCourseProgress(courseId);
        if (progRes.success && progRes.data) {
          setCompletedLessonIds(progRes.data.completedLessonIds || []);
          setProgressPercentage(progRes.data.percentage || 0);
        }
      }
    } catch (err) {
      console.error('Failed to update progress status', err);
    } finally {
      setUpdatingProgress(false);
    }
  };

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-20 text-slate-500 font-semibold">
          <div className="text-center space-y-4">
            <div className="inline-block animate-spin text-[#0d9488] text-3xl">⏳</div>
            <p className="text-xs">Preparing your classroom...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !syllabus || !currentLesson) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center max-w-md space-y-4">
            <span className="text-3xl">⚠️</span>
            <p className="font-semibold text-sm leading-relaxed">{error || 'Lesson not found.'}</p>
            <Link
              href={`/courses/${courseId}`}
              className="inline-block text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Back to Syllabus
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const embedUrl = getYoutubeEmbedUrl(currentLesson.videoUrl);

  // Find next lesson to allow quick navigation
  let nextLessonLink = '';
  let allLessons: { id: string; moduleId: string }[] = [];
  syllabus.modules.forEach((mod) => {
    mod.lessons.forEach((l) => {
      allLessons.push({ id: l.id, moduleId: mod.id });
    });
  });

  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
  if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
    const nextLesson = allLessons[currentIndex + 1];
    nextLessonLink = `/learn/${courseId}/${nextLesson.id}`;
  }

  const isCurrentCompleted = completedLessonIds.includes(currentLesson.id);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full py-8 px-4 sm:px-6 lg:px-8 gap-8 items-stretch">
        {/* Left/Main Column: Video Player & Description tabs */}
        <div className="flex-1 space-y-6">
          {/* Main Video Frame */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg aspect-video relative flex items-center justify-center">
            {currentLesson.videoUrl ? (
              currentLesson.videoUrl.includes('youtube.com') || currentLesson.videoUrl.includes('youtu.be') ? (
                <iframe
                  id="yt-player"
                  src={`${embedUrl}${embedUrl && embedUrl.includes('?') ? '&' : '?'}enablejsapi=1`}
                  title={currentLesson.title}
                  className="absolute inset-0 w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  id="direct-video-player"
                  ref={videoRef}
                  src={currentLesson.videoUrl}
                  controls
                  className="absolute inset-0 w-full h-full bg-black object-contain"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  onLoadedMetadata={handleVideoLoadedMetadata}
                />
              )
            ) : (
              <div className="text-center space-y-2 text-slate-400">
                <span className="text-4xl block">📝</span>
                <p className="text-xs font-semibold">Reading Assignment</p>
              </div>
            )}
          </div>

          {/* Lesson Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-teal-50 text-teal-600 border border-teal-100">
                {currentLesson.type}
              </span>
              <h1 className="font-extrabold text-sm sm:text-base text-[#0f112e] truncate max-w-xs sm:max-w-md">
                {currentLesson.title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Watch time badge */}
              {user?.role === 'STUDENT' && watchedSeconds > 0 && (
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-teal-50 text-teal-600 border border-teal-100 flex items-center gap-1">
                  ⏱️ {Math.floor(watchedSeconds / 60)}:{String(watchedSeconds % 60).padStart(2, '0')}
                </span>
              )}

              {user?.role === 'STUDENT' && (
                <button
                  onClick={handleToggleComplete}
                  disabled={updatingProgress}
                  className={`px-4 py-2 text-xs font-bold rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                    isCurrentCompleted
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isCurrentCompleted ? '✓ Completed' : 'Mark as Completed'}
                </button>
              )}

              {nextLessonLink && (
                <Link
                  href={nextLessonLink}
                  className="px-4 py-2 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-lg shadow-sm transition"
                >
                  Next Lesson →
                </Link>
              )}
            </div>
          </div>

          {/* Tabs bar */}
          <div className="flex border-b border-slate-200/60">
            {[
              { id: 'notes', label: 'Lesson Notes' },
              { id: 'forum', label: `Course Forum (${discussions.length})` },
              { id: 'announcements', label: `Announcements (${announcements.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-5 text-xs font-bold border-b-2 transition cursor-pointer leading-none ${
                  activeTab === tab.id
                    ? 'border-[#0d9488] text-[#0d9488]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          {activeTab === 'notes' && (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-left">
              <h3 className="font-extrabold text-sm text-[#0f112e]">Study Notes</h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {currentLesson.content || 'No description provided for this lesson.'}
              </p>
            </div>
          )}

          {activeTab === 'forum' && (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-left">
              <h3 className="font-extrabold text-sm text-[#0f112e]">Course Discussion Board</h3>

              {/* Publish Comment Form */}
              <form onSubmit={handlePostComment} className="space-y-3 pt-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share a comment, tip, or question with your classmates..."
                  rows={3}
                  className="w-full text-xs text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#0d9488]/25 focus:border-[#0d9488] transition"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={postingComment || !newComment.trim()}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition cursor-pointer"
                  >
                    {postingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </form>

              {/* Comments list */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                {loadingDiscussions ? (
                  <div className="py-8 text-center text-slate-400 text-xs animate-pulse">
                    Loading forum discussions...
                  </div>
                ) : discussions.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    💬 No comments published yet. Be the first to start the discussion!
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 space-y-4">
                    {discussions.map((post) => (
                      <div key={post.id} className="pt-4 first:pt-0 flex gap-3.5 items-start">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 uppercase flex-shrink-0">
                          {post.user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-slate-800">{post.user?.fullName}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded leading-none">
                              {post.user?.role}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatDateString(post.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {post.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-left">
              <h3 className="font-extrabold text-sm text-[#0f112e]">Instructor Announcements</h3>

              <div className="space-y-4 pt-2">
                {loadingAnnouncements ? (
                  <div className="py-8 text-center text-slate-400 text-xs animate-pulse">
                    Loading announcements...
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    📢 No announcements have been published for this course yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((ann) => (
                      <div
                        key={ann.id}
                        className="bg-teal-50/40 border border-teal-100/60 rounded-xl p-5 space-y-2"
                      >
                        <div className="flex justify-between items-baseline gap-2">
                          <h4 className="font-extrabold text-xs sm:text-sm text-teal-900">
                            {ann.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase leading-none">
                            {formatDateString(ann.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {ann.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Classroom Navigation Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 space-y-4 lg:sticky lg:top-24 text-left">
            <div className="pb-3 border-b border-slate-100 space-y-2">
              <div>
                <h2 className="font-extrabold text-[#0f112e] text-sm line-clamp-1">
                  Course Lessons
                </h2>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5 truncate">
                  {syllabus.course.title}
                </span>
              </div>

              {/* Progress percentage bar inside sidebar */}
              {user?.role === 'STUDENT' && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                    <span>Your Completion</span>
                    <span className="text-teal-600">{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0d9488] rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {syllabus.modules.map((mod, index) => {
                const isExpanded = !!expandedModules[mod.id];
                return (
                  <div key={mod.id} className="border border-slate-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="w-full text-left p-3 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="font-bold text-xs text-[#0f112e] line-clamp-1">
                        {index + 1}. {mod.title}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="divide-y divide-slate-50 bg-white">
                        {mod.lessons.map((l) => {
                          const isActive = l.id === lessonId;
                          const isCompleted = completedLessonIds.includes(l.id);
                          return (
                            <Link
                              key={l.id}
                              href={`/learn/${courseId}/${l.id}`}
                              className={`p-3 px-4 flex items-center gap-2.5 hover:bg-slate-50/50 transition text-left w-full block ${
                                isActive ? 'bg-teal-50/40 border-l-2 border-[#0d9488]' : ''
                              }`}
                            >
                              <span className="text-xs">
                                {isCompleted ? (
                                  <span className="text-emerald-500 font-bold">✓</span>
                                ) : l.type === 'VIDEO' ? (
                                  '🎥'
                                ) : (
                                  '📄'
                                )}
                              </span>
                              <span
                                className={`text-xs font-semibold line-clamp-2 ${
                                  isActive ? 'text-[#0d9488]' : 'text-slate-600'
                                }`}
                              >
                                {l.title}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Back button */}
            <div className="pt-2">
              <Link
                href={`/courses/${courseId}`}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg text-center block transition"
              >
                ← Exit Classroom
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
