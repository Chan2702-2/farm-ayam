'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { FarmBranch } from '@/lib/data/farm-data';

interface LaporanFilterBarProps {
  branches: FarmBranch[];
  activeBranch: string;
  onSelectBranch: (id: string) => void;
  selectedDate: string;
  onOpenExport: () => void;
  currentBranchName?: string;
}

export function LaporanFilterBar({
  branches,
  activeBranch,
  onSelectBranch,
  selectedDate,
  onOpenExport,
  currentBranchName,
}: LaporanFilterBarProps) {
  return (
    <div className="space-y-2">
      {/* Branch Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0 pb-0.5">
        <button
          onClick={() => onSelectBranch('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
            activeBranch === 'all'
              ? 'bg-[#0369a1] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Semua Cabang (5)
        </button>
        {branches.map((b) => (
          <button
            key={b.id}
            onClick={() => onSelectBranch(b.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              activeBranch === b.id
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {b.shortName} ({b.totalCages})
          </button>
        ))}
      </div>

      {/* Date Ribbon */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Calendar className="w-4 h-4 text-[#0284c7]" />
          <span>Kamis, 3 September 2026 • {currentBranchName || 'Semua Cabang'}</span>
        </div>
        <button
          onClick={onOpenExport}
          className="text-xs font-bold text-[#0284c7] hover:underline"
        >
          Ganti Periode
        </button>
      </div>
    </div>
  );
}
