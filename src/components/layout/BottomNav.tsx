'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Warehouse, Egg, FileSpreadsheet } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-100 pb-safe shadow-[0_-3px_12px_rgba(0,0,0,0.04)]">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto flex items-center justify-around h-14 sm:h-16 px-3 relative">
        {/* Home */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center min-w-[52px] py-1 transition-all active:scale-95 ${
            isActive('/dashboard') ? 'text-[#0284c7] font-bold' : 'text-slate-500 hover:text-[#0284c7]'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
          <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
        </Link>

        {/* Kandang */}
        <Link
          href="/kandang"
          className={`flex flex-col items-center justify-center min-w-[52px] py-1 transition-all active:scale-95 ${
            isActive('/kandang') ? 'text-[#0284c7] font-bold' : 'text-slate-500 hover:text-[#0284c7]'
          }`}
        >
          <Warehouse className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
          <span className="text-[10px] mt-0.5 tracking-tight">Kandang</span>
        </Link>

        {/* Produksi - Floating Center FAB */}
        <div className="relative -top-3 flex flex-col items-center justify-center">
          <Link
            href="/produksi/input"
            className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg shadow-sky-600/30 active:scale-90 transition-transform ${
              isActive('/produksi') ? 'bg-[#0369a1]' : 'bg-[#0284c7]'
            } text-white`}
            aria-label="Input Produksi"
          >
            <Egg className="w-6 h-6" />
          </Link>
          <span className={`text-[10px] mt-0.5 font-bold ${
            isActive('/produksi') ? 'text-[#0284c7]' : 'text-slate-600'
          }`}>
            Input
          </span>
        </div>

        {/* Produksi Overview */}
        <Link
          href="/produksi"
          className={`flex flex-col items-center justify-center min-w-[52px] py-1 transition-all active:scale-95 ${
            pathname === '/produksi' ? 'text-[#0284c7] font-bold' : 'text-slate-500 hover:text-[#0284c7]'
          }`}
        >
          <Egg className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
          <span className="text-[10px] mt-0.5 tracking-tight">Produksi</span>
        </Link>

        {/* Laporan */}
        <Link
          href="/laporan"
          className={`flex flex-col items-center justify-center min-w-[52px] py-1 transition-all active:scale-95 ${
            isActive('/laporan') ? 'text-[#0284c7] font-bold' : 'text-slate-500 hover:text-[#0284c7]'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
          <span className="text-[10px] mt-0.5 tracking-tight">Laporan</span>
        </Link>
      </div>
    </nav>
  );
}
