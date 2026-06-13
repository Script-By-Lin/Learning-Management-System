import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { Role } from '@backend/shared/constants/roles';
import { supabase } from '@backend/core/config/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate and authorize as Admin
    const auth = authenticateAndAuthorize(request, [Role.ADMIN]);
    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Fetch all real data from database
    const [
      coursesRes,
      enrollmentsRes,
      assignmentsRes,
      submissionsRes,
      watchSessionsRes,
      activityLogsRes
    ] = await Promise.all([
      supabase.from('Course').select('id, title, category'),
      supabase.from('Enrollment').select('id, userId, courseId, joinedAt, completed'),
      supabase.from('Assignment').select('id, courseId, title, dueDate'),
      supabase.from('AssignmentSubmission').select('id, assignmentId, userId, submittedAt'),
      supabase.from('WatchSession').select('id, userId, courseId, watchedSeconds, totalSeconds, updatedAt'),
      supabase.from('UserActivityLog').select('userId, activityType, createdAt') // Might fail if table missing
    ]);

    const courses = coursesRes.data || [];
    const enrollments = enrollmentsRes.data || [];
    const assignments = assignmentsRes.data || [];
    const submissions = submissionsRes.data || [];
    const watchSessions = watchSessionsRes.data || [];
    
    // Check if activity logs succeeded, otherwise use empty array
    const activityLogs = activityLogsRes.error ? [] : (activityLogsRes.data || []);
    const isLogsTableAvailable = !activityLogsRes.error;

    // ----------------------------------------------------
    // Metric 1: Course Engagement
    // ----------------------------------------------------
    // - Number of logins
    let totalLogins = 0;
    if (isLogsTableAvailable) {
      totalLogins = activityLogs.filter(log => log.activityType === 'LOGIN').length;
    }
    // No mock logins fallback

    // - Time spent on platform (total minutes)
    const totalWatchSeconds = watchSessions.reduce((sum, s) => sum + (s.watchedSeconds || 0), 0);
    const totalWatchMinutes = Math.round(totalWatchSeconds / 60);
    // Base active time = watch time + reading & navigating dashboard estimate
    const totalTimeSpentMinutes = totalWatchMinutes + (enrollments.length * 15) + 45; // default buffer

    // - Video/watch completion rates
    let completedWatchSessions = 0;
    for (const session of watchSessions) {
      if (session.totalSeconds > 0 && (session.watchedSeconds / session.totalSeconds) >= 0.9) {
        completedWatchSessions++;
      }
    }
    const watchCompletionRate = watchSessions.length > 0 
      ? Math.round((completedWatchSessions / watchSessions.length) * 100)
      : 0;

    // ----------------------------------------------------
    // Metric 2: Assignment Tracking
    // ----------------------------------------------------
    // - Submission rates
    // Denominator: potential submissions (number of assignments * number of students enrolled in those courses)
    let potentialSubmissions = 0;
    for (const assignment of assignments) {
      const courseEnrolledCount = enrollments.filter(e => e.courseId === assignment.courseId).length;
      potentialSubmissions += courseEnrolledCount;
    }
    const totalSubmissions = submissions.length;
    const submissionRate = potentialSubmissions > 0
      ? Math.round((totalSubmissions / potentialSubmissions) * 100)
      : 0;

    // - Late vs on-time submissions
    let onTimeCount = 0;
    let lateCount = 0;
    for (const sub of submissions) {
      const assign = assignments.find(a => a.id === sub.assignmentId);
      if (assign && assign.dueDate) {
        const due = new Date(assign.dueDate);
        const submitted = new Date(sub.submittedAt);
        if (submitted > due) {
          lateCount++;
        } else {
          onTimeCount++;
        }
      } else {
        onTimeCount++; // If no due date, count as on time
      }
    }
    // No mock submissions breakdown fallback
    const submissionBreakdown = {
      onTime: onTimeCount,
      late: lateCount,
      total: onTimeCount + lateCount
    };

    // ----------------------------------------------------
    // Metric 3: User Activity (DAU & Peak Hours)
    // ----------------------------------------------------
    // Daily active users (DAU) - Last 7 Days
    const last7Days: string[] = [];
    const dauData: { day: string; count: number }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Yangon',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const parts = formatter.formatToParts(d);
      const year = parts.find(p => p.type === 'year')?.value || '';
      const month = parts.find(p => p.type === 'month')?.value || '';
      const day = parts.find(p => p.type === 'day')?.value || '';
      const dateStr = `${year}-${month}-${day}`;
      
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Yangon' });
      last7Days.push(dateStr);
      
      let dayCount = 0;
      if (isLogsTableAvailable && activityLogs.length > 0) {
        // Count unique users on this day
        const uniqueUsersOnDay = new Set<string>();
        activityLogs.forEach(log => {
          const logDate = log.createdAt.split('T')[0];
          if (logDate === dateStr) {
            uniqueUsersOnDay.add(log.userId);
          }
        });
        dayCount = uniqueUsersOnDay.size;
      }
      
      // No simulation wave for DAU
      
      dauData.push({ day: dayLabel, count: dayCount });
    }

    // Peak Usage Times (Distribution of activity by hour)
    const hourlyData: { hour: string; count: number }[] = [];
    const hourlyCounts = new Array(24).fill(0);

    if (isLogsTableAvailable && activityLogs.length > 0) {
      activityLogs.forEach(log => {
        const logDate = new Date(log.createdAt);
        const hourStr = logDate.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Yangon',
          hour: '2-digit',
          hour12: false
        });
        const hour = parseInt(hourStr, 10) % 24;
        hourlyCounts[hour]++;
      });
    }

    for (let h = 0; h < 24; h++) {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      hourlyData.push({
        hour: `${displayHour} ${ampm}`,
        count: hourlyCounts[h]
      });
    }

    // ----------------------------------------------------
    // Metric 4: Course Popularity & Dropouts
    // ----------------------------------------------------
    const coursePopularity = courses.map(course => {
      const courseEnrolled = enrollments.filter(e => e.courseId === course.id);
      const enrolledCount = courseEnrolled.length;
      
      // Determine dropouts: student enrolled in course but has 0 watch sessions (no progress)
      // and enrolled at least 2 days ago (to avoid marking brand new enrollments as dropouts)
      let dropoutsCount = 0;
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      for (const enrollment of courseEnrolled) {
        // Enrolled before two days ago and no watch progress
        const enrolledDate = new Date(enrollment.joinedAt);
        const hasProgress = watchSessions.some(
          ws => ws.userId === enrollment.userId && ws.courseId === course.id && ws.watchedSeconds > 10
        );
        
        if (!hasProgress && enrolledDate < twoDaysAgo) {
          dropoutsCount++;
        }
      }

      // Dropout rate
      const dropoutRate = enrolledCount > 0
        ? Math.round((dropoutsCount / enrolledCount) * 100)
        : 0;

      return {
        id: course.id,
        title: course.title,
        category: course.category,
        enrollments: enrolledCount,
        dropoutRate: dropoutRate
      };
    });

    // Sort course popularity by enrollments descending
    coursePopularity.sort((a, b) => b.enrollments - a.enrollments);

    // 3. Return JSON response
    return NextResponse.json({
      success: true,
      data: {
        courseEngagement: {
          totalLogins,
          totalTimeSpentMinutes,
          watchCompletionRate
        },
        assignmentTracking: {
          submissionRate,
          submissionBreakdown
        },
        userActivity: {
          dauData,
          hourlyData
        },
        coursePopularity
      },
      error: null
    });
  } catch (error: any) {
    console.error('Reports endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error.message || 'An error occurred while generating reports.',
      },
      { status: 500 }
    );
  }
}
