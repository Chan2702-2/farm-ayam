'use client';

import React from 'react';
import Link from 'next/link';
import { Egg } from 'lucide-react';
import { FarmCageData } from '@/lib/data/farm-data';

interface ProduksiCageItemProps {
  cage: FarmCageData;
}

export function ProduksiCageItem({ cage }: ProduksiCageItemProps) {
  const hasData = cage.totalProduksi > 0;
  const isBelow = cage.actPercent < cage.standardPercent && hasData;

  return (
    <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-100 flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-jakarta font-bold text-sm text-slate-900 truncate">
              {cage.name}
            </h4>
            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase">
              {cage.operator}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Populasi: {cage.populasiHidup.toLocaleString('id-ID')} ekor • {cage.jenis}
          </span>
        </div>

        <Link
          href={`/produksi/input?cage=${cage.id}`}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
            hasData
              ? 'bg-sky-50 hover:bg-sky-100 text-[#0284c7]'
              : 'bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-xs'
          }`}
        >
          {hasData ? 'Edit Panen' : '+ Input'}
        </Link>
      </div>

      {/* Production stats strip */}
      <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded-xl text-xs">
        <div>
          <span className="text-slate-400 block text-[9px] uppercase font-bold">Pagi (30)</span>
          <strong className="text-slate-800 text-xs">
            {cage.pagiIkat * 30} <span className="text-[10px] font-normal text-slate-500">btr</span>
          </strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[9px] uppercase font-bold">Sore (30)</span>
          <strong className="text-slate-800 text-xs">
            {cage.soreIkat * 30} <span className="text-[10px] font-normal text-slate-500">btr</span>
          </strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[9px] uppercase font-bold">Total & ACT</span>
          <div className="flex items-center gap-1">
            <strong className="text-[#0284c7] text-xs">{cage.totalProduksi.toLocaleString('id-ID')}</strong>
            <span className={`text-[10px] font-bold ${isBelow ? 'text-amber-700' : 'text-emerald-700'}`}>
              ({cage.actPercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
