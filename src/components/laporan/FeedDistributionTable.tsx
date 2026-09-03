'use client';

import React from 'react';
import { FeedDistributionItem } from '@/lib/data/farm-data';

interface FeedDistributionTableProps {
  items: FeedDistributionItem[];
  summary: {
    totalKg: number;
    totalKirimKg: number;
    totalSak: number;
    totalPop: number;
    avgKonsumsi: number;
    totalCages: number;
  };
}

export function FeedDistributionTable({ items, summary }: FeedDistributionTableProps) {
  return (
    <div className="overflow-x-auto no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0 border border-slate-100 rounded-2xl">
      <table className="w-full text-left border-collapse text-xs whitespace-nowrap min-w-[850px]">
        <thead>
          {/* Header Row 1 */}
          <tr className="bg-slate-100/80 text-slate-600 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
            <th rowSpan={2} className="py-2.5 px-3.5 font-extrabold sticky left-0 bg-slate-100 z-20 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.08)] border-r border-slate-200">
              Unit Kandang
            </th>
            <th rowSpan={2} className="py-2.5 px-2.5 text-center border-r border-slate-200">
              Jenis Pakan
            </th>
            <th rowSpan={2} className="py-2.5 px-2 text-center border-r border-slate-200">
              Umur
            </th>
            <th rowSpan={2} className="py-2.5 px-2.5 text-center border-r border-slate-200 bg-sky-50/60 text-[#0369a1]">
              Jumlah Ayam
            </th>
            <th rowSpan={2} className="py-2.5 px-2 text-center border-r border-slate-200">
              Konsumsi (Gr)
            </th>
            <th rowSpan={2} className="py-2.5 px-2.5 text-center border-r border-slate-200 bg-amber-50/60 text-amber-800">
              Kebutuhan (KG)
            </th>
            <th rowSpan={2} className="py-2.5 px-2 text-center border-r border-slate-200">
              Sisa (KG)
            </th>
            <th colSpan={3} className="py-1.5 px-2 text-center bg-emerald-50/80 text-emerald-800">
              Yang Harus Dikirim
            </th>
          </tr>

          {/* Header Row 2 */}
          <tr className="bg-slate-50 text-slate-500 text-[11px] font-semibold border-b border-slate-200">
            <th className="py-2 px-2.5 text-center border-r border-slate-100 bg-emerald-50/30 text-emerald-900 font-bold">
              Kirim (KG)
            </th>
            <th className="py-2 px-2 text-center border-r border-slate-100 bg-emerald-50/30 text-emerald-800 font-bold">
              Sak (50kg)
            </th>
            <th className="py-2 px-2 text-center bg-emerald-50/30 text-slate-600">
              Sisa (KG)
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 text-slate-700">
          {items.map((item, idx) => {
            return (
              <tr key={item.id || idx} className="hover:bg-amber-50/20 transition-colors">
                {/* Sticky Left Column */}
                <td className="py-2.5 px-3.5 font-bold text-slate-900 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.06)] border-r border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="truncate max-w-[210px] font-jakarta">{item.kandang}</span>
                  </div>
                </td>

                <td className="py-2.5 px-2.5 text-center border-r border-slate-100">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    item.jenisPakan.includes('SPESIAL')
                      ? 'bg-purple-50 text-purple-700'
                      : item.jenisPakan.includes('NOVOGEN')
                      ? 'bg-sky-50 text-sky-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {item.jenisPakan}
                  </span>
                </td>

                <td className="py-2.5 px-2 text-center text-slate-500 border-r border-slate-100 font-mono">
                  {item.umur} mg
                </td>

                <td className="py-2.5 px-2.5 text-center font-extrabold text-slate-800 border-r border-slate-100 font-mono bg-sky-50/20">
                  {item.populasi.toLocaleString('id-ID')}
                </td>

                <td className="py-2.5 px-2 text-center font-semibold text-slate-600 border-r border-slate-100 font-mono">
                  {item.konsumsiGr}g
                </td>

                <td className="py-2.5 px-2.5 text-center font-bold text-amber-800 border-r border-slate-100 font-mono bg-amber-50/20">
                  {item.jumlahPakanKg.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </td>

                <td className="py-2.5 px-2 text-center text-slate-400 border-r border-slate-100 font-mono">
                  {item.sisaKg > 0 ? item.sisaKg : '-'}
                </td>

                <td className="py-2.5 px-2.5 text-center font-extrabold text-emerald-700 border-r border-slate-100 font-mono bg-emerald-50/20">
                  {item.kirimKg.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </td>

                <td className="py-2.5 px-2 text-center font-extrabold text-emerald-800 border-r border-slate-100 font-mono">
                  <span className="px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-800">
                    {item.kirimSak} Sak
                  </span>
                </td>

                <td className="py-2.5 px-2 text-center text-slate-500 font-mono">
                  {item.penambahanKg > 0 ? `${item.penambahanKg.toFixed(1)} kg` : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr className="bg-gradient-to-r from-amber-700 to-amber-600 text-white font-bold text-xs shadow-inner">
            <td className="py-3 px-3.5 sticky left-0 bg-amber-700 z-20 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.2)] border-r border-amber-600">
              TOTAL KEBUTUHAN ({items.length} KANDANG)
            </td>
            <td className="py-3 px-2.5 text-center text-amber-200">-</td>
            <td className="py-3 px-2 text-center text-amber-200">-</td>
            <td className="py-3 px-2.5 text-center font-mono font-extrabold text-white">
              {summary.totalPop.toLocaleString('id-ID')}
            </td>
            <td className="py-3 px-2 text-center text-amber-100 font-mono">
              {summary.avgKonsumsi}g (avg)
            </td>
            <td className="py-3 px-2.5 text-center font-mono font-extrabold text-white">
              {summary.totalKg.toLocaleString('id-ID', { minimumFractionDigits: 1 })} KG
            </td>
            <td className="py-3 px-2 text-center text-amber-200">-</td>
            <td className="py-3 px-2.5 text-center font-mono font-extrabold text-yellow-200">
              {summary.totalKirimKg.toLocaleString('id-ID', { minimumFractionDigits: 1 })} KG
            </td>
            <td className="py-3 px-2 text-center font-mono font-extrabold text-white">
              <span className="px-2 py-0.5 rounded bg-white/20">
                {summary.totalSak} SAK
              </span>
            </td>
            <td className="py-3 px-2 text-center text-amber-200">-</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
