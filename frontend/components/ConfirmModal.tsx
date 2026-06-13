import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
  confirmOnly?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'warning',
  confirmOnly = false,
  onConfirm,
  onCancel = () => {},
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-4 select-none animate-pulse text-xl">
            🚨
          </div>
        );
      case 'info':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600 mb-4 select-none text-xl">
            ℹ️
          </div>
        );
      default:
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 mb-4 select-none text-xl">
            ⚠️
          </div>
        );
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500';
      case 'info':
        return 'bg-[#0d9488] hover:bg-[#0f766e] text-white focus:ring-teal-500';
      default:
        return 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onCancel}
      />

      {/* Modal Content */}
      <div className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 border border-slate-100 z-10 max-w-sm w-full animate-[scaleIn_0.2s_ease-out]">
        <style jsx>{`
          @keyframes scaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
        
        <div>
          {getIcon()}
          <div className="mt-3 text-center sm:mt-5">
            <h3 className="text-base font-extrabold leading-6 text-slate-800 font-sans tracking-tight">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          {!confirmOnly && (
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 transition duration-150 cursor-pointer"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            className={`w-full inline-flex justify-center rounded-xl px-4 py-2.5 text-xs font-bold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 cursor-pointer ${getConfirmButtonClass()}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
