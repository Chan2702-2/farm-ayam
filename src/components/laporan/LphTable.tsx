'use client';

import React from 'react';
import { FarmCageData } from '@/lib/data/farm-data';

interface LphTableProps {
  cages: FarmCageData[];
  summary: {
    totalKapasitas: number;
    totalAyam: number;
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
    <div className="overflow-x-auto no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0 border border-slate-100 rounded-2xl">
      <table className="w-full text-left border-collapse text-xs whitespace-nowrap min-w-[980px]">
        <thead>
          {/* Header Row 1 - Category Grouping */}
          <tr className="bg-slate-100/80 text-slate-600 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
            <th rowSpan={2} className="py-2.5 px-3.5 font-extrabold sticky left-0 bg-slate-100 z-20 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.08)] border-r border-slate-200">
              Unit Kandang & Operator
            </th>
            <th colSpan={4} className="py-1.5 px-2 text-center border-r border-slate-200 bg-sky-50/70 text-[#0369a1]">
              Populasi Ayam
            </th>
            <th colSpan={2} className="py-1.5 px-2 text-center border-r border-slate-200 bg-slate-100/90 text-slate-700">
              Spesifikasi
            </th>
            <th colSpan={5} className="py-1.5 px-2 text-center border-r border-slate-200 bg-emerald-50/70 text-emerald-800">
              Koleksi & Grading Telur
            </th>
            <th colSpan={3} className="py-1.5 px-2 text-center border-r border-slate-200 bg-sky-50/70 text-[#0284c7]">
              Efisiensi (Hen-Day)
            </th>
            <th rowSpan={2} className="py-2.5 px-3 text-center">
              Obat / Vaksin
            </th>
          </tr>

          {/* Header Row 2 - Detailed Sub-columns */}
          <tr className="bg-slate-50 text-slate-500 text-[11px] font-semibold border-b border-slate-200">
            <th className="py-2 px-2 text-center border-r border-slate-100">Kapasitas</th>
            <th className="py-2 px-2 text-center border-r border-slate-100">Hidup</th>
            <th className="py-2 px-2 text-center border-r border-slate-100 text-red-600">Mati</th>
            <th className="py-2 px-2 text-center border-r border-slate-200 text-amber-600">Afkir</th>

            <th className="py-2 px-2 text-center border-r border-slate-100">Umur</th>
            <th className="py-2 px-2 text-center border-r border-slate-200">Jenis</th>

            <th className="py-2 px-2 text-center border-r border-slate-100">Pagi (Ikat)</th>
            <th className="py-2 px-2 text-center border-r border-slate-100">Sore (Ikat)</th>
            <th className="py-2 px-2 text-center border-r border-slate-100">Cacat/Kotor</th>
            <th className="py-2 px-2 text-center border-r border-slate-100">Butir</th>
            <th className="py-2 px-2.5 text-center font-bold border-r border-slate-200 text-slate-900 bg-emerald-50/40">
              Total Panen
            </th>

            <th className="py-2 px-2 text-center border-r border-slate-100 font-bold text-slate-800">ACT%</th>
            <th className="py-2 px-2 text-center border-r border-slate-100">STDR%</th>
            <th className="py-2 px-2 text-center border-r border-slate-200">Deviasi</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 text-slate-700">
          {cages.map((c, idx) => {
            const deviasi = Number((c.actPercent - c.standardPercent).toFixed(2));
            const isGood = deviasi >= 0;
            const cacatTotal = (c.retak || 0) + (c.putih || 0) + (c.kotorPutih || 0) + (c.k || 0) + (c.r || 0) + (c.l || 0);

            return (
              <tr key={c.id || idx} className="hover:bg-sky-50/30 transition-colors">
                {/* Sticky Left Column */}
                <td className="py-2.5 px-3.5 font-bold text-slate-900 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.06)] border-r border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0" />
                    <span className="truncate max-w-[210px] font-jakarta">{c.fullName}</span>
                  </div>
                </td>

                <td className="py-2.5 px-2 text-center text-slate-400 border-r border-slate-100 font-mono">
                  {c.kapasitas.toLocaleString('id-ID')}
                </td>
                <td className="py-2.5 px-2 text-center font-extrabold text-slate-800 border-r border-slate-100 font-mono">
                  {c.populasiHidup.toLocaleString('id-ID')}
                </td>
                <td className="py-2.5 px-2 text-center font-semibold text-red-600 border-r border-slate-100">
                  {c.mati > 0 ? c.mati : '-'}
                </td>
                <td className="py-2.5 px-2 text-center text-amber-600 border-r border-slate-200">
                  {c.afkir > 0 ? c.afkir : '-'}
                </td>

                <td className="py-2.5 px-2 text-center text-slate-600 border-r border-slate-100">
                  {c.umurMgg} mg
                </td>
                <td className="py-2.5 px-2 text-center border-r border-slate-200">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                    {c.jenis || 'LAYER'}
                  </span>
                </td>

                <td className="py-2.5 px-2 text-center text-slate-600 border-r border-slate-100">
                  {c.pagiIkat}
                </td>
                <td className="py-2.5 px-2 text-center text-slate-600 border-r border-slate-100">
                  {c.soreIkat}
                </td>
                <td className="py-2.5 px-2 text-center text-slate-400 border-r border-slate-100">
                  {cacatTotal > 0 ? cacatTotal : '-'}
                </td>
                <td className="py-2.5 px-2 text-center text-slate-500 border-r border-slate-100">
                  {c.butir > 0 ? c.butir : '-'}
                </td>
                <td className="py-2.5 px-2.5 text-center font-extrabold text-[#0369a1] bg-sky-50/20 border-r border-slate-200 font-mono">
                  {c.totalProduksi.toLocaleString('id-ID')}
                </td>

                <td className={`py-2.5 px-2 text-center font-extrabold border-r border-slate-100 font-mono ${
                  c.actPercent > 0 ? (isGood ? 'text-emerald-600' : 'text-amber-600') : 'text-slate-300'
                }`}>
                  {c.actPercent > 0 ? `${c.actPercent.toFixed(2)}%` : '-'}
                </td>
                <td className="py-2.5 px-2 text-center text-slate-400 border-r border-slate-100 font-mono">
                  {c.standardPercent}%
                </td>
                <td className="py-2.5 px-2 text-center border-r border-slate-200">
                  {c.actPercent > 0 ? (
                    <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isGood ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                    }`}>
                      {deviasi >= 0 ? `+${deviasi}%` : `${deviasi}%`}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>

                <td className="py-2.5 px-2 text-center">
                  {c.obat ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                      {c.obat}
                    </span>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr className="bg-gradient-to-r from-[#0369a1] to-[#0284c7] text-white font-bold text-xs shadow-inner">
            <td className="py-3 px-3.5 sticky left-0 bg-[#0369a1] z-20 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.2)] border-r border-sky-600">
              TOTAL KESELURUHAN ({cages.length} KANDANG)
            </td>
            <td className="py-3 px-2 text-center font-mono">{summary.totalKapasitas.toLocaleString('id-ID')}</td>
            <td className="py-3 px-2 text-center font-mono font-extrabold text-white">{summary.totalAyam.toLocaleString('id-ID')}</td>
            <td className="py-3 px-2 text-center text-red-200">{summary.totalMati}</td>
            <td className="py-3 px-2 text-center text-amber-200">{summary.totalAfkir}</td>
            <td className="py-3 px-2 text-center text-sky-200">-</td>
            <td className="py-3 px-2 text-center text-sky-200">-</td>
            <td className="py-3 px-2 text-center">{(summary.totalPagiButir / 30).toFixed(0)}</td>
            <td className="py-3 px-2 text-center">{(summary.totalSoreButir / 30).toFixed(0)}</td>
            <td className="py-3 px-2 text-center">{summary.totalRetak + summary.totalKotor}</td>
            <td className="py-3 px-2 text-center">-</td>
            <td className="py-3 px-2.5 text-center font-extrabold font-mono text-yellow-300">
              {summary.totalProduksi.toLocaleString('id-ID')}
            </td>
            <td className="py-3 px-2 text-center font-extrabold text-white">{summary.avgAct}%</td>
            <td className="py-3 px-2 text-center text-sky-200">{summary.avgStd}%</td>
            <td className="py-3 px-2 text-center">
              <span className="px-1.5 py-0.5 rounded bg-white/20 text-white text-[10px]">
                {summary.selisih >= 0 ? `+${summary.selisih}%` : `${summary.selisih}%`}
              </span>
            </td>
            <td className="py-3 px-2 text-center text-sky-200">-</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
