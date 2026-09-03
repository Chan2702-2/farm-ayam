'use client';

import React from 'react';
import { FarmCageData } from '@/lib/data/farm-data';

interface LphTableProps {
  cages: FarmCageData[];
  summary: {
    totalKapasitas: number;
    totalAyam: number;
    totalMati: number;
    totalPagiButir: number;
    totalSoreButir: number;
    totalProduksi: number;
    avgAct: number;
    avgStd: number;
  };
}

export function LphTable({ cages, summary }: LphTableProps) {
  return (
    <div className="overflow-x-auto no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
      <table className="w-full text-left border-collapse text-xs whitespace-nowrap min-w-[750px]">
        <thead>
          <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <th className="py-2.5 px-3 font-bold sticky left-0 bg-slate-50 z-20 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
              Kandang
            </th>
            <th className="py-2.5 px-2 font-bold text-center">Kapasitas</th>
            <th className="py-2.5 px-2 font-bold text-center">Hidup</th>
            <th className="py-2.5 px-2 font-bold text-center">Mati</th>
            <th className="py-2.5 px-2 font-bold text-center">Pagi (30)</th>
            <th className="py-2.5 px-2 font-bold text-center">Sore (30)</th>
            <th className="py-2.5 px-2 font-bold text-center">Total Butir</th>
            <th className="py-2.5 px-2 font-bold text-center">ACT%</th>
            <th className="py-2.5 px-2 font-bold text-center">STDR</th>
            <th className="py-2.5 px-2 font-bold text-center">Obat / Vaksin</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {cages.map((c) => {
            const isBelow = c.actPercent < c.standardPercent && c.totalProduksi > 0;
            return (
              <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-slate-800 sticky left-0 bg-white z-10 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  {c.fullName}
                </td>
                <td className="py-2.5 px-2 text-center text-slate-500">
                  {c.kapasitas.toLocaleString('id-ID')}
                </td>
                <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                  {c.populasiHidup.toLocaleString('id-ID')}
                </td>
                <td className="py-2.5 px-2 text-center text-red-600 font-semibold">
                  {c.mati || '-'}
                </td>
                <td className="py-2.5 px-2 text-center text-slate-600">
                  {c.pagiIkat}
                </td>
                <td className="py-2.5 px-2 text-center text-slate-600">
                  {c.soreIkat}
                </td>
                <td className="py-2.5 px-2 text-center font-bold text-[#0369a1]">
                  {c.totalProduksi.toLocaleString('id-ID')}
                </td>
                <td className={`py-2.5 px-2 text-center font-bold ${
                  isBelow ? 'text-amber-600' : 'text-[#0284c7]'
                }`}>
                  {c.actPercent > 0 ? `${c.actPercent.toFixed(2)}%` : '-'}
                </td>
                <td className="py-2.5 px-2 text-center text-slate-500 font-medium">
                  {c.standardPercent}%
                </td>
                <td className="py-2.5 px-2 text-center text-slate-600 font-medium">
                  {c.obat ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      {c.obat}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-[#0369a1] text-white font-bold text-xs">
            <td className="py-3 px-3 sticky left-0 bg-[#0369a1] z-10 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.15)]">
              TOTAL KESELURUHAN
            </td>
            <td className="py-3 px-2 text-center">{summary.totalKapasitas.toLocaleString('id-ID')}</td>
            <td className="py-3 px-2 text-center">{summary.totalAyam.toLocaleString('id-ID')}</td>
            <td className="py-3 px-2 text-center">{summary.totalMati}</td>
            <td className="py-3 px-2 text-center">{(summary.totalPagiButir / 30).toFixed(0)}</td>
            <td className="py-3 px-2 text-center">{(summary.totalSoreButir / 30).toFixed(0)}</td>
            <td className="py-3 px-2 text-center">{summary.totalProduksi.toLocaleString('id-ID')}</td>
            <td className="py-3 px-2 text-center">{summary.avgAct}%</td>
            <td className="py-3 px-2 text-center">{summary.avgStd}%</td>
            <td className="py-3 px-2 text-center">-</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
