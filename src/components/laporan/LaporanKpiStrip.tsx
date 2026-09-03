'use client';

import React from 'react';

interface LaporanKpiStripProps {
  totalProduksi: number;
  totalPagiButir: number;
  totalSoreButir: number;
  avgAct: number;
  totalAyam: number;
  totalMati: number;
  totalAfkir: number;
  avgWeight: number;
}

export function LaporanKpiStrip({
  totalProduksi,
  totalPagiButir,
  totalSoreButir,
  avgAct,
  totalAyam,
  totalMati,
  totalAfkir,
  avgWeight,
}: LaporanKpiStripProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Total Produksi
        </span>
        <strong className="font-jakarta font-extrabold text-xl text-[#0369a1] block mt-0.5">
          {totalProduksi.toLocaleString('id-ID')}
        </strong>
        <span className="text-[10px] text-slate-500 font-medium">
          Pagi {totalPagiButir.toLocaleString('id-ID')} • Sore {totalSoreButir.toLocaleString('id-ID')}
        </span>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Hen-Day (ACT%)
        </span>
        <strong className="font-jakarta font-extrabold text-xl text-emerald-700 block mt-0.5">
          {avgAct}%
        </strong>
        <span className="text-[10px] text-slate-500 font-medium">
          Target Standar 95.5%
        </span>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Populasi Aktif
        </span>
        <strong className="font-jakarta font-extrabold text-xl text-slate-800 block mt-0.5">
          {totalAyam.toLocaleString('id-ID')}
        </strong>
        <span className="text-[10px] text-slate-500 font-medium">
          Mati {totalMati} • Afkir {totalAfkir}
        </span>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Rata-rata Bobot
        </span>
        <strong className="font-jakarta font-extrabold text-xl text-slate-800 block mt-0.5">
          {avgWeight.toLocaleString('id-ID')} g
        </strong>
        <span className="text-[10px] text-emerald-700 font-semibold">
          Stabil Normal
        </span>
      </div>
    </div>
  );
}
