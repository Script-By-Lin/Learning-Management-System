import { watchRepository, WatchSession } from '../../repositories/WatchRepository';
import { supabase } from '../../core/config/supabase';

export interface WatchAnalytics {
  totalWatchMinutes: number;
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  perCourse: {
    courseId: string;
    courseTitle: string;
    totalMinutes: number;
    lessonsWatched: number;
  }[];
  recentSessions: {
    lessonId: string;
    lessonTitle: string;
    courseId: string;
    courseTitle: string;
    watchedSeconds: number;
    totalSeconds: number;
    lastPosition: number;
    updatedAt: string;
  }[];
  weeklyMinutes: number[];
}

export interface CourseWatchStats {
  courseId: string;
  lessons: {
    lessonId: string;
    lessonTitle: string;
    watchedSeconds: number;
    totalSeconds: number;
    percentage: number;
  }[];
  overallWatchPercentage: number;
  totalWatchMinutes: number;
}

export interface StudentWatchDetail {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  watchedMinutes: number;
  completionPercent: number;
}

export interface InstructorAnalytics {
  totalStudentsEnrolled: number;
  totalWatchMinutesByStudents: number;
  coursesCreated: number;
  perCourse: {
    courseId: string;
    courseTitle: string;
    enrolledCount: number;
    totalWatchMinutes: number;
    avgCompletionPercent: number;
  }[];
  studentWatchDetails?: StudentWatchDetail[];
}

export class WatchService {
  /**
   * Update watch progress for a student on a lesson
   */
  async updateWatchProgress(
    userId: string,
    lessonId: string,
    courseId: string,
    watchedSeconds: number,
    totalSeconds: number,
    lastPosition: number
  ): Promise<WatchSession> {
    if (!lessonId || !courseId) {
      throw new Error('lessonId and courseId are required.');
    }
    if (watchedSeconds < 0) watchedSeconds = 0;
    if (totalSeconds < 0) totalSeconds = 0;
    if (lastPosition < 0) lastPosition = 0;

    return watchRepository.upsertWatchSession(
      userId,
      lessonId,
      courseId,
      watchedSeconds,
      totalSeconds,
      lastPosition
    );
  }

  /**
   * Get comprehensive watch analytics for a student
   */
  async getStudentAnalytics(userId: string): Promise<WatchAnalytics> {
    // Get all sessions (ordered by updatedAt desc)
    const sessions = await watchRepository.findByUserId(userId);
    const totalWatchSeconds = sessions.reduce((sum, s) => sum + s.watchedSeconds, 0);
    const totalWatchMinutes = Math.round(totalWatchSeconds / 60);

    // Calculate active days from sessions locally (avoiding duplicate database query)
    const uniqueDays = new Set<string>();
    sessions.forEach((s) => {
      const day = new Date(s.updatedAt).toISOString().split('T')[0];
      uniqueDays.add(day);
    });
    const activeDays = Array.from(uniqueDays).sort().reverse();
    const { currentStreak, longestStreak } = this.calculateStreak(activeDays);

    // Per-course aggregation
    const courseMap = new Map<string, { totalSeconds: number; lessonIds: Set<string> }>();
    sessions.forEach((s) => {
      const entry = courseMap.get(s.courseId) || { totalSeconds: 0, lessonIds: new Set() };
      entry.totalSeconds += s.watchedSeconds;
      entry.lessonIds.add(s.lessonId);
      courseMap.set(s.courseId, entry);
    });

    // Fetch course titles
    const courseIds = Array.from(courseMap.keys());
    let courseTitles: Record<string, string> = {};
    if (courseIds.length > 0) {
      const { data: courses } = await supabase
        .from('Course')
        .select('id, title')
        .in('id', courseIds);
      if (courses) {
        courses.forEach((c) => {
          courseTitles[c.id] = c.title;
        });
      }
    }

    const perCourse = Array.from(courseMap.entries()).map(([courseId, data]) => ({
      courseId,
      courseTitle: courseTitles[courseId] || 'Unknown Course',
      totalMinutes: Math.round(data.totalSeconds / 60),
      lessonsWatched: data.lessonIds.size,
    }));

    // Recent sessions locally (sessions is already sorted by updatedAt desc, avoiding duplicate database query)
    const recentRaw = sessions.slice(0, 10);
    const lessonIds = recentRaw.map((s) => s.lessonId);
    let lessonTitles: Record<string, string> = {};
    if (lessonIds.length > 0) {
      const { data: lessons } = await supabase
        .from('Lesson')
        .select('id, title')
        .in('id', lessonIds);
      if (lessons) {
        lessons.forEach((l) => {
          lessonTitles[l.id] = l.title;
        });
      }
    }

    const recentSessions = recentRaw.map((s) => ({
      lessonId: s.lessonId,
      lessonTitle: lessonTitles[s.lessonId] || 'Unknown Lesson',
      courseId: s.courseId,
      courseTitle: courseTitles[s.courseId] || 'Unknown Course',
      watchedSeconds: s.watchedSeconds,
      totalSeconds: s.totalSeconds,
      lastPosition: s.lastPosition,
      updatedAt: s.updatedAt,
    }));

    // Weekly minutes (Mon-Sun for current week)
    const weeklyMinutes = this.calculateWeeklyMinutes(sessions);

    return {
      totalWatchMinutes,
      totalSessions: sessions.length,
      currentStreak,
      longestStreak,
      perCourse,
      recentSessions,
      weeklyMinutes,
    };
  }

  /**
   * Get per-lesson watch data for a specific course
   */
  async getCourseWatchStats(userId: string, courseId: string): Promise<CourseWatchStats> {
    const sessions = await watchRepository.findByUserAndCourse(userId, courseId);

    // Get lesson titles
    const lessonIds = sessions.map((s) => s.lessonId);
    let lessonTitles: Record<string, string> = {};
    if (lessonIds.length > 0) {
      const { data: lessons } = await supabase
        .from('Lesson')
        .select('id, title')
        .in('id', lessonIds);
      if (lessons) {
        lessons.forEach((l) => {
          lessonTitles[l.id] = l.title;
        });
      }
    }

    const lessons = sessions.map((s) => ({
      lessonId: s.lessonId,
      lessonTitle: lessonTitles[s.lessonId] || 'Unknown Lesson',
      watchedSeconds: s.watchedSeconds,
      totalSeconds: s.totalSeconds,
      lastPosition: s.lastPosition,
      percentage: s.totalSeconds > 0 ? Math.round((s.watchedSeconds / s.totalSeconds) * 100) : 0,
    }));

    const totalWatchSeconds = sessions.reduce((sum, s) => sum + s.watchedSeconds, 0);
    const totalPossibleSeconds = sessions.reduce((sum, s) => sum + s.totalSeconds, 0);
    const overallWatchPercentage = totalPossibleSeconds > 0
      ? Math.round((totalWatchSeconds / totalPossibleSeconds) * 100)
      : 0;

    return {
      courseId,
      lessons,
      overallWatchPercentage,
      totalWatchMinutes: Math.round(totalWatchSeconds / 60),
    };
  }

  /**
   * Get instructor analytics — aggregate student engagement across their courses
   */
  async getInstructorAnalytics(instructorId: string): Promise<InstructorAnalytics> {
    // Get instructor's courses
    const { data: courses, error: courseErr } = await supabase
      .from('Course')
      .select('id, title')
      .eq('instructorId', instructorId);

    if (courseErr) throw new Error(`Database error: ${courseErr.message}`);
    if (!courses || courses.length === 0) {
      return {
        totalStudentsEnrolled: 0,
        totalWatchMinutesByStudents: 0,
        coursesCreated: 0,
        perCourse: [],
        studentWatchDetails: [],
      };
    }

    const courseIds = courses.map((c) => c.id);

    // Get enrollments for these courses
    const { data: enrollments } = await supabase
      .from('Enrollment')
      .select('id, courseId, userId')
      .in('courseId', courseIds);

    const totalStudentsEnrolled = enrollments ? new Set(enrollments.map((e) => e.userId)).size : 0;

    // Get watch sessions for these courses
    const allSessions = await watchRepository.findByCourseIds(courseIds);
    const totalWatchSeconds = allSessions.reduce((sum, s) => sum + s.watchedSeconds, 0);

    // Fetch user details for all enrolled students
    const studentIds = enrollments ? Array.from(new Set(enrollments.map((e) => e.userId))) : [];
    let studentsMap = new Map<string, { fullName: string; email: string }>();
    if (studentIds.length > 0) {
      const { data: users } = await supabase
        .from('User')
        .select('id, fullName, email')
        .in('id', studentIds);
      if (users) {
        users.forEach((u) => {
          studentsMap.set(u.id, { fullName: u.fullName, email: u.email });
        });
      }
    }

    // Build studentWatchDetails
    const studentWatchDetails: StudentWatchDetail[] = [];
    if (enrollments) {
      enrollments.forEach((e) => {
        const studentInfo = studentsMap.get(e.userId) || { fullName: 'Unknown Student', email: '' };
        const courseInfo = courses.find((c) => c.id === e.courseId);
        if (courseInfo) {
          const studentSessions = allSessions.filter((s) => s.userId === e.userId && s.courseId === e.courseId);
          const watchedSeconds = studentSessions.reduce((sum, s) => sum + s.watchedSeconds, 0);
          const watchedMinutes = Math.round(watchedSeconds / 60);

          let completionPercent = 0;
          if (studentSessions.length > 0) {
            const completionSum = studentSessions.reduce((sum, s) => {
              return sum + (s.totalSeconds > 0 ? (s.watchedSeconds / s.totalSeconds) * 100 : 0);
            }, 0);
            completionPercent = Math.min(Math.round(completionSum / studentSessions.length), 100);
          }

          studentWatchDetails.push({
            studentId: e.userId,
            studentName: studentInfo.fullName,
            studentEmail: studentInfo.email,
            courseId: e.courseId,
            courseTitle: courseInfo.title,
            watchedMinutes,
            completionPercent,
          });
        }
      });
    }

    // Per-course breakdown
    const perCourse = courses.map((course) => {
      const courseEnrollments = enrollments?.filter((e) => e.courseId === course.id) || [];
      const courseSessions = allSessions.filter((s) => s.courseId === course.id);
      const courseWatchSeconds = courseSessions.reduce((sum, s) => sum + s.watchedSeconds, 0);

      // Calculate average completion
      const uniqueStudents = new Set(courseSessions.map((s) => s.userId));
      let avgCompletion = 0;
      if (uniqueStudents.size > 0) {
        const completionSum = courseSessions.reduce((sum, s) => {
          return sum + (s.totalSeconds > 0 ? (s.watchedSeconds / s.totalSeconds) * 100 : 0);
        }, 0);
        avgCompletion = Math.round(completionSum / courseSessions.length);
      }

      return {
        courseId: course.id,
        courseTitle: course.title,
        enrolledCount: courseEnrollments.length,
        totalWatchMinutes: Math.round(courseWatchSeconds / 60),
        avgCompletionPercent: avgCompletion,
      };
    });

    return {
      totalStudentsEnrolled,
      totalWatchMinutesByStudents: Math.round(totalWatchSeconds / 60),
      coursesCreated: courses.length,
      perCourse,
      studentWatchDetails,
    };
  }

  /**
   * Calculate current and longest streak from sorted active day strings
   */
  private calculateStreak(activeDays: string[]): { currentStreak: number; longestStreak: number } {
    if (activeDays.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    // activeDays is sorted in reverse (most recent first)
    const sorted = [...activeDays].sort();

    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;

      if (diff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Current streak: start from most recent and count backwards
    if (activeDays[0] === today || activeDays[0] === yesterday) {
      currentStreak = 1;
      for (let i = 0; i < activeDays.length - 1; i++) {
        const curr = new Date(activeDays[i]);
        const next = new Date(activeDays[i + 1]);
        const diff = (curr.getTime() - next.getTime()) / 86400000;
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return { currentStreak, longestStreak };
  }

  /**
   * Calculate watch minutes per day for the current week (Mon-Sun)
   */
  private calculateWeeklyMinutes(sessions: WatchSession[]): number[] {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const weeklyMinutes = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun

    sessions.forEach((s) => {
      const sessionDate = new Date(s.updatedAt);
      if (sessionDate >= monday) {
        const dayIndex = (sessionDate.getDay() + 6) % 7; // Mon=0, Sun=6
        weeklyMinutes[dayIndex] += Math.round(s.watchedSeconds / 60);
      }
    });

    return weeklyMinutes;
  }
}

export const watchService = new WatchService();
export default watchService;
