'use client';
// Modern Responsive Modal & Bottom Sheet Component
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  showClose = true,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200"
      />

      {/* Modal / Bottom Sheet Container */}
      <div
        className={`relative w-full ${maxWidthClass} bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden z-10 transition-all duration-200 transform max-h-[85vh] flex flex-col pb-safe`}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-5 pt-2 sm:pt-3.5 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <h3 className="font-jakarta font-bold text-base sm:text-lg text-[#131b2e] leading-snug truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium truncate">
                {subtitle}
              </p>
            )}
          </div>
          {showClose && (
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-500 flex items-center justify-center transition-all shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-4 overflow-y-auto no-scrollbar flex-1 overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
