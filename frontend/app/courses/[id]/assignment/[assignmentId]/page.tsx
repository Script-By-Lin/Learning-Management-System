'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import courseService from '@/services/courseService';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDateString } from '@/utils/date';

interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string | null;
}

interface Submission {
  id: string;
  submissionText: string | null;
  fileUrl: string | null;
  grade: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
}

export default function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const resolvedParams = React.use(params);
  const courseId = resolvedParams.id;
  const assignmentId = resolvedParams.assignmentId;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Submit states
  const [submissionText, setSubmissionText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch course assignments to find matching ID
      const assRes = await courseService.getAssignments(courseId);
      if (assRes.success && assRes.data) {
        const found = assRes.data.find((a: Assignment) => a.id === assignmentId);
        if (found) {
          setAssignment(found);
        } else {
          setError('Assignment not found.');
          setLoading(false);
          return;
        }
      } else {
        setError(assRes.error || 'Failed to load assignment details.');
        setLoading(false);
        return;
      }

      // Check student submission status
      if (user && user.role === 'STUDENT') {
        const subRes = await courseService.checkAssignmentSubmission(assignmentId);
        if (subRes.success) {
          setSubmission(subRes.data);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?redirect=/courses/${courseId}/assignment/${assignmentId}`);
      return;
    }

    loadData();
  }, [courseId, assignmentId, user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionText && !fileUrl) {
      alert('Please fill in submission text or add a file link.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await courseService.submitAssignment(assignmentId, {
        submissionText: submissionText || null,
        fileUrl: fileUrl || null,
      });

      if (res.success) {
        alert('Assignment submitted successfully!');
        loadData();
      } else {
        alert(res.error || 'Failed to submit assignment.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-20 text-slate-500 font-semibold">
          <div className="text-center space-y-4">
            <div className="inline-block animate-spin text-[#0d9488] text-3xl">⏳</div>
            <p className="text-xs">Loading assignment desk...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center max-w-md space-y-4">
            <span className="text-3xl">⚠️</span>
            <p className="font-semibold text-sm">{error || 'Assignment not found.'}</p>
            <Link
              href={`/courses/${courseId}`}
              className="inline-block text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Back to Course Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href={`/courses/${courseId}`}
            className="text-xs text-[#0d9488] hover:underline font-bold"
          >
            ← Back to Syllabus details
          </Link>
        </div>

        {/* Assignment metadata details */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-amber-50 text-amber-600 border border-amber-100 inline-block">
                Course Task
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f112e] mt-2">
                {assignment.title}
              </h1>
            </div>

            {assignment.dueDate && (
              <div className="text-right text-xs">
                <span className="text-slate-400 font-semibold block uppercase tracking-wider">
                  Due Date
                </span>
                <span className="font-bold text-[#0f112e] mt-1 block">
                  {formatDateString(assignment.dueDate)}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-sm text-[#0f112e]">Task Instructions</h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {assignment.description}
            </p>
          </div>
        </div>

        {/* Student submission state rendering */}
        {user && user.role === 'STUDENT' ? (
          <div className="space-y-6">
            <h2 className="text-lg font-extrabold text-[#0f112e]">Your Submission</h2>

            {submission ? (
              /* Already submitted - show details and grading status */
              <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-100 pb-4">
                  <div className="text-xs">
                    <span className="text-slate-400 block font-semibold uppercase tracking-wider">
                      Submitted On
                    </span>
                    <span className="font-bold text-[#0f112e] mt-1 block">
                      {formatDateString(submission.submittedAt)}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider text-right mb-1">
                      Grading Status
                    </span>
                    {submission.gradedAt ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full font-bold text-xs">
                        Grade: {submission.grade}/100
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full font-bold text-xs">
                        Pending Evaluation
                      </span>
                    )}
                  </div>
                </div>

                {/* Submitted text */}
                {submission.submissionText && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Your Answer</span>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                      {submission.submissionText}
                    </div>
                  </div>
                )}

                {/* File links */}
                {submission.fileUrl && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Uploaded File Link</span>
                    <a
                      href={submission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#0d9488] hover:underline block"
                    >
                      🔗 {submission.fileUrl}
                    </a>
                  </div>
                )}

                {/* Feedback notes */}
                {submission.feedback && (
                  <div className="border-t border-slate-100 pt-6 space-y-2 bg-[#0d9488]/5 border border-[#0d9488]/10 rounded-xl p-4">
                    <span className="text-[10px] font-bold text-[#0d9488] uppercase block">
                      Instructor Feedback
                    </span>
                    <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line italic">
                      "{submission.feedback}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Create Submission form */
              <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Submission Notes / Text
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Write your assignment submission details here..."
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-[#0d9488] resize-y"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Document / PDF File URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://docs.google.com/document/... or shared folder link"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-[#0d9488]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-[#0d9488] hover:bg-[#0f766e] disabled:bg-slate-350 text-white text-xs font-bold rounded-xl shadow-md transition duration-200 cursor-pointer"
                  >
                    {submitting ? 'Sending submission...' : 'Send Assignment Submission'}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-semibold text-center mt-6">
            ℹ️ You are viewing this assignment as {user?.role === 'ADMIN' ? 'an Administrator' : 'an Instructor'}. Submissions are disabled.
          </div>
        )}
      </main>
    </div>
  );
}
