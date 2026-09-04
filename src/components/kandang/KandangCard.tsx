'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Egg, User, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { FarmCageData } from '@/lib/data/farm-data';

interface KandangCardProps {
  cage: FarmCageData;
}

export function KandangCard({ cage }: KandangCardProps) {
  const isBelow = cage.actPercent < cage.standardPercent && cage.totalProduksi > 0;
  const isExcellent = cage.actPercent >= cage.standardPercent && cage.totalProduksi > 0;
  const isCritical = cage.mati >= 5 || (cage.actPercent > 0 && cage.actPercent < 88);

  const statusBadge = () => {
    if (cage.populasiHidup === 0) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold text-[10px]">
          Kosong
        </span>
      );
    }
    if (isCritical) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px] flex items-center gap-1 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
          Perhatian
        </span>
      );
    }
    if (isBelow) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-[10px]">
          Below Std
        </span>
      );
    }
    if (isExcellent) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-sky-100 text-[#0284c7] font-bold text-[10px] flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-[#0284c7] shrink-0" />
          Optimal
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
        Normal
      </span>
    );
  };

  const occupancy = cage.kapasitas > 0 ? ((cage.populasiHidup / cage.kapasitas) * 100).toFixed(1) : '0';

  return (
    <Link
      href={`/kandang/${cage.id}`}
      className="block bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-sm border border-slate-100 transition-all active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#e0f2fe] text-[#0369a1] font-bold flex items-center justify-center text-xs sm:text-sm shrink-0">
            {cage.name.startsWith('1.') ? 'K1' : cage.name.substring(0, 3).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-jakarta font-bold text-slate-900 text-xs sm:text-sm truncate">
                {cage.name}
              </h4>
              {cage.branchName && (
                <span className="px-1.5 py-0.2 rounded bg-sky-50 text-[#0369a1] text-[9px] font-bold truncate">
                  {cage.branchName.replace('Cabang ', '')}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{cage.operator}</span>
              {cage.phone && (
                <span className="text-[10px] text-slate-400 font-normal truncate">
                  &bull; {cage.phone}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {statusBadge()}
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* 2-col vitals */}
      <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50/90 rounded-xl mb-2.5 text-xs">
        <div>
          <span className="text-slate-400 block text-[9px] sm:text-[10px] font-medium uppercase">
            Populasi & Okupansi
          </span>
          <div className="font-bold text-slate-800 text-xs sm:text-sm mt-0.5 leading-tight">
            {cage.populasiHidup.toLocaleString('id-ID')}{' '}
            <span className="text-[10px] font-normal text-slate-400">/ {cage.kapasitas.toLocaleString('id-ID')}</span>
          </div>
          <span className="text-[10px] text-sky-600 font-semibold">{occupancy}% Terisi</span>
        </div>

        <div className="pl-2 border-l border-slate-200">
          <span className="text-slate-400 block text-[9px] sm:text-[10px] font-medium uppercase">
            Umur & Bobot
          </span>
          <div className="font-bold text-slate-800 text-xs sm:text-sm mt-0.5 leading-tight">
            {cage.umurMgg} <span className="text-[10px] font-normal text-slate-500">Mgg ({cage.umurBln} Bln)</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">BB: {cage.beratAktual} g</span>
        </div>
      </div>

      {/* Production & ACT bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-slate-600 flex items-center gap-1 text-[11px] sm:text-xs">
            <Egg className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
            Produksi: <strong className="text-slate-900">{cage.totalProduksi.toLocaleString('id-ID')} btr</strong>
          </span>
          <span className={`font-bold text-[11px] sm:text-xs ${isBelow ? 'text-amber-600' : 'text-[#0284c7]'}`}>
            ACT {cage.actPercent.toFixed(2)}%
          </span>
        </div>

        <div className="relative w-full h-1.5 sm:h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isBelow ? 'bg-amber-500' : isCritical ? 'bg-red-500' : 'bg-[#0284c7]'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, cage.actPercent))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400">
          <span>Pagi: {cage.pagiIkat * 30} btr</span>
          <span>Sore: {cage.soreIkat * 30} btr</span>
          <span>Mati: {cage.mati} ekr</span>
        </div>
      </div>
    </Link>
  );
}
