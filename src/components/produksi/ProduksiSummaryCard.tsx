'use client';

import React from 'react';
import { Sun, Sunset } from 'lucide-react';

interface ProduksiSummaryCardProps {
  totalProduksi: number;
  pagiButir: number;
  soreButir: number;
  avgAct: number;
  targetAct?: number;
}

export function ProduksiSummaryCard({
  totalProduksi,
  pagiButir,
  soreButir,
  avgAct,
  targetAct = 95.5,
}: ProduksiSummaryCardProps) {
  const pagiPercent = totalProduksi > 0 ? Math.round((pagiButir / totalProduksi) * 100) : 80;
  const sorePercent = 100 - pagiPercent;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Panen Hari Ini
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-jakarta font-extrabold text-2xl sm:text-3xl text-[#0369a1]">
              {totalProduksi.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-semibold text-slate-500">butir telur</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Hen-Day (ACT%)
          </span>
          <div className="font-jakarta font-extrabold text-2xl text-emerald-700 mt-0.5">
            {avgAct}%
          </div>
          <span className="text-[10px] text-slate-400">Target {targetAct}%</span>
        </div>
      </div>

      {/* Split Pagi & Sore */}
      <div className="p-3 bg-sky-50/70 rounded-xl space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-sky-900 flex items-center gap-1">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            Pagi: {pagiButir.toLocaleString('id-ID')} ({pagiPercent}%)
          </span>
          <span className="text-sky-700 flex items-center gap-1">
            <Sunset className="w-3.5 h-3.5 text-sky-600" />
            Sore: {soreButir.toLocaleString('id-ID')} ({sorePercent}%)
          </span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full flex overflow-hidden">
          <div className="bg-[#0284c7] h-full" style={{ width: `${pagiPercent}%` }} />
          <div className="bg-sky-300 h-full" style={{ width: `${sorePercent}%` }} />
        </div>
      </div>
    </div>
  );
}
