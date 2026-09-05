'use client';

import React from 'react';
import { FarmCageData } from '@/lib/data/farm-data';

interface LphTableProps {
  cages: FarmCageData[];
  summary: {
    totalAyam: number;
    totalKapasitas: number;
    totalMati: number;
    totalAfkir: number;
    totalPagiButir: number;
    totalSoreButir: number;
    totalRetak: number;
    totalKotor: number;
    totalProduksi: number;
    avgAct: number;
    avgStd: number;
    selisih: number;
  };
}

export function LphTable({ cages, summary }: LphTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <table className="w-full text-left border-separate border-spacing-0 text-xs whitespace-nowrap min-w-[980px]">
        <thead>
          {/* Header Row 1 - Category Grouping */}
          <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
            <th
              rowSpan={2}
              className="sticky left-0 top-0 z-20 bg-slate-100 py-2.5 px-3.5 font-extrabold text-slate-800 border-b border-r border-slate-200 min-w-[175px] max-w-[200px] shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)]"
            >
              Unit Kandang & Operator
            </th>
            <th colSpan={4} className="py-1.5 px-2 text-center border-b border-r border-slate-200 bg-sky-50 text-[#0369a1]">
              Populasi Ayam
            </th>
            <th colSpan={2} className="py-1.5 px-2 text-center border-b border-r border-slate-200 bg-slate-100 text-slate-700">
              Spesifikasi
            </th>
            <th colSpan={5} className="py-1.5 px-2 text-center border-b border-r border-slate-200 bg-emerald-50 text-emerald-800">
              Koleksi & Grading Telur
            </th>
            <th colSpan={3} className="py-1.5 px-2 text-center border-b border-r border-slate-200 bg-sky-50 text-[#0284c7]">
              Efisiensi (Hen-Day)
            </th>
            <th rowSpan={2} className="py-2.5 px-3 text-center border-b border-slate-200">
              Obat / Vaksin
            </th>
          </tr>

          {/* Header Row 2 - Detailed Sub-columns */}
          <tr className="bg-slate-50 text-slate-600 text-[11px] font-semibold">
            <th className="py-2 px-2 text-center border-b border-r border-slate-200">Kapasitas</th>
            <th className="py-2 px-2 text-center border-b border-r border-slate-200">Hidup</th>
            <th className="py-2 px-2 text-center border-b border-r border-slate-200 text-red-600">Mati</th>
            <th className="py-2 px-2 text-center border-b border-r border-slate-200 text-amber-600">Afkir</th>

            <th className="py-2 px-2 text-center border-b border-r border-slate-200">Umur</th>
            <th className="py-2 px-2 text-center border-b border-r border-slate-200">Jenis</th>

            <th className="py-2 px-2 text-center border-b border-r border-slate-200">Pagi (Ikat)</th>
            <th className="py-2 px-2 text-center border-b border-r border-slate-200">Sore (Ikat)</th>
            <th className="py-2 px-2 text-center border-b border-r border-slate-200">Cacat/Kotor</th>
            <th className="py-2 px-2 text-center border-b border-r border-slate-200">Butir</th>
            <th className="py-2 px-2.5 text-center font-bold border-b border-r border-slate-200 text-slate-900 bg-emerald-50/50">
              Total Panen
            </th>

            <th className="py-2 px-2 text-center border-b border-r border-slate-200 font-bold text-slate-800">ACT%</th>
            <th className="py-2 px-2 text-center border-b border-r border-slate-200">STDR%</th>
            <th className="py-2 px-2 text-center border-b border-r border-slate-200">Deviasi</th>
          </tr>
        </thead>

        <tbody className="text-slate-700">
          {cages.map((c, idx) => {
            const deviasi = Number((c.actPercent - c.standardPercent).toFixed(2));
            const isGood = deviasi >= 0;
            const cacatTotal = (c.retak || 0) + (c.putih || 0) + (c.kotorPutih || 0) + (c.k || 0) + (c.r || 0) + (c.l || 0);

            return (
              <tr key={c.id || idx} className="hover:bg-sky-50/30 transition-colors">
                {/* Sticky Left Column - Solid white, no bleed-through */}
                <td className="sticky left-0 z-10 bg-white py-2.5 px-3.5 font-bold text-slate-900 border-b border-r border-slate-100 min-w-[175px] max-w-[200px] shadow-[3px_0_6px_-2px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0" />
                    <span className="truncate max-w-[185px] font-jakarta">{c.fullName}</span>
                  </div>
                </td>

                <td className="py-2.5 px-2 text-center text-slate-400 border-b border-r border-slate-100 font-mono">
                  {c.kapasitas.toLocaleString('id-ID')}
                </td>
                <td className="py-2.5 px-2 text-center font-extrabold text-slate-800 border-b border-r border-slate-100 font-mono">
                  {c.populasiHidup.toLocaleString('id-ID')}
                </td>
                <td className="py-2.5 px-2 text-center font-semibold text-red-600 border-b border-r border-slate-100">
                  {c.mati > 0 ? c.mati : '-'}
                </td>
                <td className="py-2.5 px-2 text-center text-amber-600 border-b border-r border-slate-200">
                  {c.afkir > 0 ? c.afkir : '-'}
                </td>

                <td className="py-2.5 px-2 text-center text-slate-600 border-b border-r border-slate-100">
                  {c.umurMgg} mg
                </td>
                <td className="py-2.5 px-2 text-center border-b border-r border-slate-200">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                    {c.jenis || 'LAYER'}
                  </span>
                </td>

                <td className="py-2.5 px-2 text-center text-slate-600 border-b border-r border-slate-100">
                  {c.pagiIkat}
                </td>
                <td className="py-2.5 px-2 text-center text-slate-600 border-b border-r border-slate-100">
                  {c.soreIkat}
                </td>
                <td className="py-2.5 px-2 text-center text-slate-400 border-b border-r border-slate-100">
                  {cacatTotal > 0 ? cacatTotal : '-'}
                </td>
                <td className="py-2.5 px-2 text-center text-slate-600 border-b border-r border-slate-100 font-mono">
                  {c.butir || 0}
                </td>
                <td className="py-2.5 px-2.5 text-center font-black text-slate-900 border-b border-r border-slate-200 bg-emerald-50/20 font-mono">
                  {c.totalProduksi.toLocaleString('id-ID')}
                </td>

                <td className="py-2.5 px-2 text-center font-bold text-slate-900 border-b border-r border-slate-100">
                  {c.actPercent.toFixed(2)}%
                </td>
                <td className="py-2.5 px-2 text-center text-slate-400 border-b border-r border-slate-100">
                  {c.standardPercent.toFixed(2)}%
                </td>
                <td className="py-2.5 px-2 text-center font-bold border-b border-r border-slate-200">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    isGood ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                  }`}>
                    {isGood ? `+${deviasi}%` : `${deviasi}%`}
                  </span>
                </td>

                <td className="py-2.5 px-3 text-center text-slate-500 text-[11px] border-b border-slate-100">
                  {c.obat ? (
                    <span className="px-2 py-0.5 rounded bg-sky-50 text-[#0284c7] font-semibold">
                      {c.obat}
                    </span>
                  ) : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>

        {/* Total Footer Row */}
        <tfoot>
          <tr className="bg-[#0369a1] text-white font-extrabold text-xs">
            <td className="sticky left-0 z-20 bg-[#0369a1] py-3 px-3.5 border-r border-sky-600 min-w-[175px] max-w-[200px] shadow-[3px_0_6px_-2px_rgba(0,0,0,0.25)] font-jakarta">
              Total
            </td>
            <td className="py-3 px-2 text-center border-r border-sky-600 font-mono">
              {summary.totalKapasitas.toLocaleString('id-ID')}
            </td>
            <td className="py-3 px-2 text-center border-r border-sky-600 font-mono">
              {summary.totalAyam.toLocaleString('id-ID')}
            </td>
            <td className="py-3 px-2 text-center border-r border-sky-600 font-mono text-amber-200">
              {summary.totalMati}
            </td>
            <td className="py-3 px-2 text-center border-r border-sky-600 font-mono text-amber-200">
              {summary.totalAfkir}
            </td>

            <td colSpan={2} className="py-3 px-2 text-center border-r border-sky-600 text-sky-200 text-[11px]">
              Summary Site
            </td>

            <td className="py-3 px-2 text-center border-r border-sky-600 font-mono">
              {summary.totalPagiButir.toLocaleString('id-ID')}
            </td>
            <td className="py-3 px-2 text-center border-r border-sky-600 font-mono">
              {summary.totalSoreButir.toLocaleString('id-ID')}
            </td>
            <td className="py-3 px-2 text-center border-r border-sky-600 font-mono text-sky-200">
              {(summary.totalRetak + summary.totalKotor).toLocaleString('id-ID')}
            </td>
            <td className="py-3 px-2 text-center border-r border-sky-600 font-mono">
              -
            </td>
            <td className="py-3 px-2.5 text-center border-r border-sky-600 font-mono text-amber-200 text-sm">
              {summary.totalProduksi.toLocaleString('id-ID')}
            </td>

            <td className="py-3 px-2 text-center border-r border-sky-600 font-mono">
              {summary.avgAct.toFixed(2)}%
            </td>
            <td className="py-3 px-2 text-center border-r border-sky-600 font-mono text-sky-200">
              {summary.avgStd.toFixed(2)}%
            </td>
            <td className="py-3 px-2 text-center border-r border-sky-600 font-mono">
              {summary.selisih >= 0 ? `+${summary.selisih.toFixed(2)}%` : `${summary.selisih.toFixed(2)}%`}
            </td>
            <td className="py-3 px-3 text-center text-sky-200 text-[10px]">
              All Good
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
