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
    instructor?: {
      fullName: string;
    };
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
      {/* Google Fonts import */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Montserrat:wght@400;500;600;700&display=swap');
      `}</style>

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
        <div className="w-full max-w-4xl aspect-[1.414/1] bg-white border-[16px] border-[#0b1329] rounded-sm p-8 shadow-2xl relative flex flex-col justify-between items-center overflow-hidden border-box print:shadow-none print:border-[12px] print:my-auto" style={{ background: 'radial-gradient(circle, #fdfdfb 0%, #f7f3eb 100%)' }}>
          
          {/* Inner Golden Borders */}
          <div className="absolute inset-[16px] border-[3px] border-[#bf953f] pointer-events-none z-10" />
          <div className="absolute inset-[22px] border border-[#bf953f]/30 pointer-events-none z-10" />

          {/* Corner Ornaments */}
          {/* Top Left */}
          <div className="absolute top-[28px] left-[28px] w-12 h-12 border-t-2 border-l-2 border-[#b38728] pointer-events-none z-20" />
          <div className="absolute top-[34px] left-[34px] w-9 h-9 border-t border-l border-[#bf953f]/50 pointer-events-none z-20" />
          
          {/* Top Right */}
          <div className="absolute top-[28px] right-[28px] w-12 h-12 border-t-2 border-r-2 border-[#b38728] pointer-events-none z-20" />
          <div className="absolute top-[34px] right-[34px] w-9 h-9 border-t border-r border-[#bf953f]/50 pointer-events-none z-20" />
          
          {/* Bottom Left */}
          <div className="absolute bottom-[28px] left-[28px] w-12 h-12 border-b-2 border-l-2 border-[#b38728] pointer-events-none z-20" />
          <div className="absolute bottom-[34px] left-[34px] w-9 h-9 border-b border-l border-[#bf953f]/50 pointer-events-none z-20" />
          
          {/* Bottom Right */}
          <div className="absolute bottom-[28px] right-[28px] w-12 h-12 border-b-2 border-r-2 border-[#b38728] pointer-events-none z-20" />
          <div className="absolute bottom-[34px] right-[34px] w-9 h-9 border-b border-r border-[#bf953f]/50 pointer-events-none z-20" />

          {/* Certificate Content Overlay */}
          <div className="w-full h-full relative z-10 flex flex-col justify-between p-4 sm:p-6 text-center">
            
            {/* Header Crest & School Name */}
            <div className="flex flex-col items-center space-y-2 pt-2">
              <div className="text-[#b38728] drop-shadow-sm">
                <svg className="w-14 h-14" viewBox="0 0 64 64" fill="currentColor">
                  <path d="M12 28c0-8.8 3.6-16.8 9.4-22.6l-2.8-2.8C12 9.4 8 18.2 8 28c0 9.8 4 18.6 10.6 25.4l2.8-2.8C15.6 44.8 12 36.8 12 28zM52 28c0 8.8-3.6 16.8-9.4 22.6l2.8 2.8C52 46.6 56 37.8 56 28c0-9.8-4-18.6-10.6-25.4l-2.8 2.8C48.4 11.2 52 19.2 52 28z" opacity="0.85"/>
                  <path d="M32 16L16 24l16 8 13-6.5V36h3V25.5L50 24 32 16z" />
                  <path d="M44 28.3L32 34.3 20 28.3v7.4c0 2.2 5.4 4 12 4s12-1.8 12-4v-7.4z" />
                </svg>
              </div>
              <span className="text-[#b38728] text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] font-sans">
                Nexora Academy of Computing
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[0.15em] text-[#0b1329] font-serif uppercase mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                Certificate of Completion
              </h1>
            </div>

            {/* Recipient Presentation */}
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] font-sans">
                  This credential is proudly presented to
                </span>
              </div>

              {/* Calligraphy Student Name */}
              <div className="w-full max-w-xl mx-auto border-b border-[#bf953f]/30 pb-1.5 flex items-center justify-center">
                <h2 className="text-4xl sm:text-5xl text-[#0b1329] font-normal" style={{ fontFamily: "'Great Vibes', cursive" }}>
                  {user?.fullName}
                </h2>
              </div>

              <div className="max-w-xl mx-auto space-y-2">
                <p className="text-slate-500 text-[10px] sm:text-xs leading-relaxed italic font-serif max-w-md mx-auto">
                  for honorable achievement in successfully completing all curriculum requirements, lessons, assignments, and examination programs for the intensive specialization course:
                </p>
                <h3 className="text-lg sm:text-2xl font-extrabold text-[#0b1329] tracking-tight font-serif italic mt-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {cert.course.title}
                </h3>
              </div>
            </div>

            {/* Footer Row (Seals, Signatures, Credentials) */}
            <div className="w-full grid grid-cols-3 items-end gap-4 px-6 pt-4">
              
              {/* Left Column: Signature 1 (Instructor) */}
              <div className="flex flex-col items-center space-y-1 text-center">
                <span className="font-serif italic text-xs sm:text-sm text-slate-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {cert.course.instructor?.fullName || 'Dr. Jane Smith'}
                </span>
                <div className="w-full border-t border-slate-300 my-0.5" />
                <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                  {cert.course.category ? `${cert.course.category} Instructor` : 'Course Instructor'}
                </span>
              </div>

              {/* Center Column: Official gold foil seal */}
              <div className="flex flex-col items-center justify-center relative select-none">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-4 border-amber-300 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg relative z-20">
                  <div className="h-[90%] w-[90%] rounded-full border border-dashed border-white/60 flex flex-col items-center justify-center text-white">
                    <span className="text-[6px] font-black uppercase tracking-wider leading-none">NEXORA</span>
                    <span className="text-xs leading-none my-0.5">★</span>
                    <span className="text-[5px] font-bold uppercase tracking-wider leading-none">ACADEMY</span>
                  </div>
                  {/* Ribbons */}
                  <div className="absolute -bottom-4 -left-1 w-5 h-9 bg-amber-700 rotate-[12deg] origin-top -z-10" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%)' }} />
                  <div className="absolute -bottom-4 -right-1 w-5 h-9 bg-amber-700 -rotate-[12deg] origin-top -z-10" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%)' }} />
                </div>
              </div>

              {/* Right Column: Signature 2 (Director) */}
              <div className="flex flex-col items-center space-y-1 text-center">
                <span className="font-serif italic text-xs sm:text-sm text-slate-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {(cert.course.instructor?.fullName || 'Mr. Lin Lin Aung') === 'Mr. Lin Lin Aung' ? 'Nexora Academic Team' : 'Mr. Lin Lin Aung'}
                </span>
                <div className="w-full border-t border-slate-300 my-0.5" />
                <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                  {(cert.course.instructor?.fullName || 'Mr. Lin Lin Aung') === 'Mr. Lin Lin Aung' ? 'Nexora Academic Team' : 'Director of Nexora Institute'}
                </span>
              </div>

            </div>

            {/* Metadata Line */}
            <div className="flex justify-between items-center text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-200/50 w-full mt-2 font-sans px-4">
              <span>Date Issued: {formatDateString(cert.issuedAt)}</span>
              <span>Credential ID: {cert.certificateCode}</span>
            </div>

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
