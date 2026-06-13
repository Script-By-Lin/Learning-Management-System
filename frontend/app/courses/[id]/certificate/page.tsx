'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import courseService from '@/services/courseService';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { formatDateString } from '@/utils/date';

interface CertificateData {
  id: string;
  certificateCode: string;
  issuedAt: string;
  course: {
    title: string;
    category: string;
  };
}

export default function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading: authLoading } = useAuth();
  const resolvedParams = React.use(params);
  const courseId = resolvedParams.id;

  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCertificate() {
      try {
        setLoading(true);
        const res = await courseService.getCertificate(courseId);
        if (res.success && res.data) {
          setCert(res.data);
        } else {
          setError(res.error || 'You have not completed this course or earned a certificate yet.');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred loading credentials.');
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      loadCertificate();
    }
  }, [courseId, user]);

  const handlePrint = () => {
    window.print();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center text-slate-500 font-semibold">
          <div className="text-center space-y-3">
            <div className="animate-spin text-3xl text-teal-600">⏳</div>
            <p className="text-xs">Verifying course completion status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center shadow-lg space-y-4">
            <span className="text-4xl block">🔒</span>
            <h2 className="text-lg font-extrabold text-[#0f112e]">Certificate Locked</h2>
            <p className="text-slate-500 text-xs leading-relaxed">
              {error || 'You must complete 100% of the lessons in this course to earn a graduation credential.'}
            </p>
            <div className="pt-2 flex gap-4 justify-center">
              <Link
                href={`/courses/${courseId}`}
                className="px-4 py-2 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-lg transition"
              >
                Go to Course
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans print:bg-white print:p-0">
      {/* Hide navbar on print */}
      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full flex flex-col items-center justify-center print:py-0 print:px-0">
        {/* Actions bar */}
        <div className="w-full max-w-4xl mb-6 flex justify-between items-center print:hidden">
          <Link
            href="/dashboard"
            className="text-xs font-bold text-slate-500 hover:text-teal-600 flex items-center gap-1.5 transition"
          >
            ← Back to Dashboard
          </Link>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/10 flex items-center gap-2 cursor-pointer transition"
          >
            🖨️ Print Certificate
          </button>
        </div>

        {/* Certificate Border Frame */}
        <div className="w-full max-w-4xl aspect-[1.414/1] bg-white border-[16px] border-double border-amber-800 rounded-sm p-8 sm:p-14 shadow-2xl relative flex flex-col justify-between items-center text-center overflow-hidden border-box print:shadow-none print:border-[10px] print:my-auto">
          
          {/* Certificate Corner Ribbons */}
          <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-amber-600 -translate-x-4 -translate-y-4 rounded-tl-sm pointer-events-none" />
          <div className="absolute top-0 right-0 w-24 h-24 border-t-4 border-r-4 border-amber-600 translate-x-4 -translate-y-4 rounded-tr-sm pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 border-b-4 border-l-4 border-amber-600 -translate-x-4 translate-y-4 rounded-bl-sm pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-amber-600 translate-x-4 translate-y-4 rounded-br-sm pointer-events-none" />

          {/* Heading */}
          <div className="space-y-3">
            <span className="text-amber-800 text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.25em] block">
              Aegis Academy of Computing
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif text-slate-900 italic font-bold">
              Certificate of Completion
            </h1>
            <div className="w-32 h-0.5 bg-amber-600 mx-auto mt-2 opacity-40" />
          </div>

          {/* Body */}
          <div className="space-y-4 my-4 sm:my-6">
            <p className="text-slate-500 font-serif text-xs italic">
              This credential certifies that
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-800 border-b-2 border-slate-100 pb-1.5 px-6 inline-block font-sans">
              {user?.fullName}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
              has successfully completed all coursework, assignments, and quizzes required to graduate from the intensive course program:
            </p>
            <h3 className="text-base sm:text-xl font-bold text-amber-900 tracking-tight">
              "{cert.course.title}"
            </h3>
          </div>

          {/* Footer Seals & Signatures */}
          <div className="w-full grid grid-cols-3 items-end pt-4 gap-4 sm:gap-8">
            {/* Signature 1 */}
            <div className="flex flex-col items-center space-y-1">
              <span className="font-serif italic text-sm text-slate-700">Yan Myo Aung</span>
              <div className="w-full h-px bg-slate-300" />
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Lead ERP Architect
              </span>
            </div>

            {/* Gold Seal Emblem */}
            <div className="flex flex-col items-center justify-center relative">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-4 border-amber-400 bg-amber-500 flex items-center justify-center shadow-lg relative z-10 select-none">
                <div className="h-[85%] w-[85%] rounded-full border border-dashed border-white/60 flex flex-col items-center justify-center text-white">
                  <span className="text-[8px] font-black uppercase tracking-widest leading-none">AEGIS</span>
                  <span className="text-lg leading-none mt-1">★</span>
                  <span className="text-[7px] font-bold mt-1 uppercase tracking-widest leading-none">ACADEMY</span>
                </div>
                {/* Decorative ribbons */}
                <div className="absolute -bottom-2 -left-1 w-5 h-8 bg-amber-600 rotate-[25deg] origin-top -z-10 clip-ribbon" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%)' }} />
                <div className="absolute -bottom-2 -right-1 w-5 h-8 bg-amber-600 -rotate-[25deg] origin-top -z-10 clip-ribbon" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%)' }} />
              </div>
            </div>

            {/* Signature 2 */}
            <div className="flex flex-col items-center space-y-1">
              <span className="font-serif italic text-sm text-slate-700">Dr. Jane Smith</span>
              <div className="w-full h-px bg-slate-300" />
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Dean of Computer Science
              </span>
            </div>
          </div>

          {/* Credentials details */}
          <div className="w-full mt-6 flex flex-wrap justify-between items-center text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 pt-3">
            <span>Date issued: {formatDateString(cert.issuedAt)}</span>
            <span>Credential ID: {cert.certificateCode}</span>
          </div>

        </div>
      </main>

      {/* Global CSS overrides for clean print output */}
      <style jsx global>{`
        @media print {
          body, html, main {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            height: 100%;
          }
          main {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  );
}
