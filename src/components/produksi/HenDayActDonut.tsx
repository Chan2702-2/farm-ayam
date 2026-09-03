'use client';

import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface HenDayActDonutProps {
  actPercent: number;
  standardPercent: number;
  totalProduksi: number;
  populasiHidup: number;
}

export function HenDayActDonut({
  actPercent,
  standardPercent,
  totalProduksi,
  populasiHidup,
}: HenDayActDonutProps) {
  const diff = Number((actPercent - standardPercent).toFixed(2));
  const isAbove = diff >= 0;
  const isCritical = actPercent < 88 && actPercent > 0;

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-100 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-jakarta font-bold text-sm text-slate-900">
          Kalkulasi Hen-Day (ACT%)
        </h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
          isAbove ? 'bg-emerald-50 text-emerald-700' : isCritical ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {isAbove ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
          {isAbove ? 'Memenuhi Standar' : 'Di Bawah Standar'}
        </span>
      </div>

      <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Hasil Hen-Day Aktual
          </span>
          <div className="font-jakarta font-extrabold text-2xl sm:text-3xl text-[#0284c7] mt-0.5">
            {actPercent > 0 ? `${actPercent.toFixed(2)}%` : '0%'}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Target Standar Strain: {standardPercent}%
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Deviasi Standar
          </span>
          <div className={`font-jakarta font-extrabold text-xl sm:text-2xl mt-0.5 ${
            isAbove ? 'text-emerald-700' : 'text-amber-700'
          }`}>
            {diff > 0 ? `+${diff}%` : `${diff}%`}
          </div>
          <span className="text-[10px] text-slate-500">
            {totalProduksi.toLocaleString('id-ID')} / {populasiHidup.toLocaleString('id-ID')} ekor
          </span>
        </div>
      </div>
    </div>
  );
}
