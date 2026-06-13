'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import courseService from '@/services/courseService';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
}

interface Quiz {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
}

interface SubmissionResult {
  score: number;
  passed: boolean;
  answers: number[];
}

export default function QuizPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const resolvedParams = React.use(params);
  const courseId = resolvedParams.id;
  const quizId = resolvedParams.quizId;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz taking states
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?redirect=/courses/${courseId}/quiz/${quizId}`);
      return;
    }

    async function loadQuiz() {
      try {
        setLoading(true);
        const res = await courseService.getQuizDetails(quizId);
        if (res.success && res.data) {
          setQuiz(res.data.quiz);
          setQuestions(res.data.questions || []);
        } else {
          setError(res.error || 'Failed to load quiz questions.');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred.');
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [courseId, quizId, user, authLoading, router]);

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (submissionResult) return; // quiz already taken
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIdx]: optionIdx,
    }));
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || submissionResult) return;

    // Verify all questions are answered
    if (Object.keys(selectedAnswers).length < questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      // Construct answers array matching question index order
      const answersArray = questions.map((_, idx) => selectedAnswers[idx]);
      const res = await courseService.submitQuiz(quizId, answersArray);
      if (res.success && res.data) {
        setSubmissionResult(res.data);
      } else {
        alert(res.error || 'Failed to submit quiz.');
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
            <p className="text-xs">Preparing your examination paper...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center max-w-md space-y-4">
            <span className="text-3xl">⚠️</span>
            <p className="font-semibold text-sm">{error || 'Quiz not found.'}</p>
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

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        {/* Header Back Link */}
        <div className="mb-6">
          <Link
            href={`/courses/${courseId}`}
            className="text-xs text-[#0d9488] hover:underline font-bold"
          >
            ← Back to Syllabus details
          </Link>
        </div>

        {submissionResult ? (
          /* Quiz Results Render Panel */
          <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-md text-center space-y-6 animate-fade-in">
            <div className="space-y-2">
              <span className="text-5xl block">{submissionResult.passed ? '🎉' : '✍️'}</span>
              <h2 className="text-2xl font-extrabold text-[#0f112e]">Quiz Submission Results</h2>
              <p className="text-xs text-slate-400">Quiz: {quiz.title}</p>
            </div>

            <div className="py-6 border-y border-slate-100 flex justify-around items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Auto-graded Score
                </span>
                <span
                  className={`text-4xl font-extrabold block mt-1 ${
                    submissionResult.passed ? 'text-emerald-500' : 'text-amber-500'
                  }`}
                >
                  {submissionResult.score.toFixed(1)}%
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Evaluation
                </span>
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-bold block mt-2 ${
                    submissionResult.passed
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}
                >
                  {submissionResult.passed ? 'PASSED' : 'TRY AGAIN (Needs 60%)'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={`/courses/${courseId}`}
                className="inline-block px-6 py-2.5 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                Return to Course syllabus
              </Link>
            </div>
          </div>
        ) : (
          /* Quiz Questions Form */
          <form onSubmit={handleSubmitQuiz} className="space-y-8">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-teal-50 text-teal-600 border border-teal-100 inline-block">
                MCQ Assessment
              </span>
              <h2 className="text-xl font-extrabold text-[#0f112e]">{quiz.title}</h2>
              {quiz.description && (
                <p className="text-xs text-slate-500 leading-relaxed">{quiz.description}</p>
              )}
            </div>

            {questions.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-400 text-xs italic">
                No questions defined for this quiz yet.
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((q, qIdx) => (
                  <div key={q.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-sm text-[#0f112e] leading-snug">
                      Question {qIdx + 1}: {q.questionText}
                    </h3>

                    <div className="grid grid-cols-1 gap-2.5">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = selectedAnswers[qIdx] === oIdx;
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => user?.role === 'STUDENT' && handleSelectOption(qIdx, oIdx)}
                            className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold transition duration-200 flex items-center justify-between ${
                              isSelected
                                ? 'bg-teal-50 border-[#0d9488] text-[#0d9488] shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            } ${user?.role !== 'STUDENT' ? 'opacity-85 cursor-default hover:bg-slate-50' : 'cursor-pointer'}`}
                          >
                            <span>{opt}</span>
                            <span
                              className={`h-4 w-4 rounded-full border flex items-center justify-center text-[10px] ${
                                isSelected
                                  ? 'border-[#0d9488] bg-[#0d9488] text-white'
                                  : 'border-slate-350'
                              }`}
                            >
                              {isSelected && '✓'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {user?.role === 'STUDENT' ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-[#0d9488] hover:bg-[#0f766e] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-md transition duration-200 cursor-pointer"
                  >
                    {submitting ? 'Submitting answers...' : 'Submit Evaluation Paper'}
                  </button>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-semibold text-center">
                    ℹ️ You are viewing this quiz as {user?.role === 'ADMIN' ? 'an Administrator' : 'an Instructor'}. Option selection and submissions are disabled.
                  </div>
                )}
              </div>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
