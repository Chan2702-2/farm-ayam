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
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <table className="w-full text-left border-separate border-spacing-0 text-xs whitespace-nowrap min-w-[850px]">
        <thead>
          {/* Header Row 1 */}
          <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
            <th
              rowSpan={2}
              className="sticky left-0 top-0 z-20 bg-slate-100 py-2.5 px-3.5 font-extrabold text-slate-800 border-b border-r border-slate-200 min-w-[170px] max-w-[200px] shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)]"
            >
              Unit Kandang
            </th>
            <th rowSpan={2} className="py-2.5 px-2.5 text-center border-b border-r border-slate-200">
              Jenis Pakan
            </th>
            <th rowSpan={2} className="py-2.5 px-2 text-center border-b border-r border-slate-200">
              Umur
            </th>
            <th rowSpan={2} className="py-2.5 px-2.5 text-center border-b border-r border-slate-200 bg-sky-50 text-[#0369a1]">
              Jumlah Ayam
            </th>
            <th rowSpan={2} className="py-2.5 px-2 text-center border-b border-r border-slate-200">
              Konsumsi (Gr)
            </th>
            <th rowSpan={2} className="py-2.5 px-2.5 text-center border-b border-r border-slate-200 bg-amber-50 text-amber-800">
              Kebutuhan (KG)
            </th>
            <th rowSpan={2} className="py-2.5 px-2 text-center border-b border-r border-slate-200">
              Sisa Kemarin (KG)
            </th>
            <th colSpan={3} className="py-1.5 px-2 text-center border-b border-slate-200 bg-emerald-50 text-emerald-800 font-bold">
              Yang Harus Dikirim
            </th>
          </tr>

          {/* Header Row 2 */}
          <tr className="bg-slate-50 text-slate-600 text-[11px] font-semibold">
            <th className="py-2 px-2.5 text-center border-b border-r border-slate-200 bg-emerald-50/50 text-emerald-900 font-bold">
              Kirim (KG)
            </th>
            <th className="py-2 px-2 text-center border-b border-r border-slate-200 bg-emerald-50/50 text-emerald-800 font-bold">
              Sak (50kg)
            </th>
            <th className="py-2 px-2 text-center border-b border-slate-200 bg-emerald-50/50 text-slate-600">
              Penambahan (KG)
            </th>
          </tr>
        </thead>

        <tbody className="text-slate-700">
          {items.map((item, idx) => (
            <tr key={item.id || idx} className="hover:bg-amber-50/20 transition-colors">
              {/* Sticky Left Column - Solid white, no bleed-through */}
              <td className="sticky left-0 z-10 bg-white py-2.5 px-3.5 font-bold text-slate-900 border-b border-r border-slate-100 min-w-[170px] max-w-[200px] shadow-[3px_0_6px_-2px_rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                  <span className="truncate max-w-[180px] font-jakarta">{item.kandang}</span>
                </div>
              </td>

              <td className="py-2.5 px-2.5 text-center border-b border-r border-slate-100">
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold">
                  {item.jenisPakan}
                </span>
              </td>

              <td className="py-2.5 px-2 text-center text-slate-500 border-b border-r border-slate-100">
                {item.umur} mg
              </td>

              <td className="py-2.5 px-2.5 text-center font-extrabold text-slate-800 border-b border-r border-slate-100 font-mono">
                {item.populasi.toLocaleString('id-ID')}
              </td>

              <td className="py-2.5 px-2 text-center text-slate-600 border-b border-r border-slate-100 font-mono">
                {item.konsumsiGr}g
              </td>

              <td className="py-2.5 px-2.5 text-center font-bold text-slate-900 border-b border-r border-slate-100 bg-amber-50/30 font-mono">
                {item.jumlahPakanKg.toLocaleString('id-ID')}
              </td>

              <td className="py-2.5 px-2 text-center text-slate-400 border-b border-r border-slate-100 font-mono">
                {item.sisaKg > 0 ? item.sisaKg.toLocaleString('id-ID') : '-'}
              </td>

              <td className="py-2.5 px-2.5 text-center font-extrabold text-emerald-800 border-b border-r border-slate-100 bg-emerald-50/30 font-mono">
                {item.kirimKg.toLocaleString('id-ID')}
              </td>

              <td className="py-2.5 px-2 text-center font-bold text-emerald-700 border-b border-r border-slate-100 bg-emerald-50/30 font-mono">
                {item.kirimSak} Sak
              </td>

              <td className="py-2.5 px-2 text-center text-slate-500 border-b border-slate-100 font-mono">
                {item.penambahanKg > 0 ? `${item.penambahanKg} kg` : '-'}
              </td>
            </tr>
          ))}
        </tbody>

        {/* Footer Row */}
        <tfoot>
          <tr className="bg-slate-900 text-white font-extrabold text-xs">
            <td className="sticky left-0 z-20 bg-slate-900 py-3 px-3.5 border-r border-slate-800 min-w-[170px] max-w-[200px] shadow-[3px_0_6px_-2px_rgba(0,0,0,0.25)]">
              TOTAL ALOKASI ({summary.totalCages} KANDANG)
            </td>
            <td colSpan={2} className="py-3 px-2 text-center border-r border-slate-800 text-slate-400 text-[11px]">
              Multi-Strain Feed
            </td>
            <td className="py-3 px-2.5 text-center border-r border-slate-800 font-mono text-amber-300">
              {summary.totalPop.toLocaleString('id-ID')}
            </td>
            <td className="py-3 px-2 text-center border-r border-slate-800 font-mono text-slate-300">
              {summary.avgKonsumsi.toFixed(1)}g
            </td>
            <td className="py-3 px-2.5 text-center border-r border-slate-800 font-mono text-amber-300">
              {summary.totalKg.toLocaleString('id-ID')} KG
            </td>
            <td className="py-3 px-2 text-center border-r border-slate-800 text-slate-400">
              -
            </td>
            <td className="py-3 px-2.5 text-center border-r border-slate-800 font-mono text-emerald-400 text-sm">
              {summary.totalKirimKg.toLocaleString('id-ID')} KG
            </td>
            <td className="py-3 px-2 text-center border-r border-slate-800 font-mono text-emerald-400 text-sm">
              {summary.totalSak} Sak
            </td>
            <td className="py-3 px-2 text-center text-slate-400">
              -
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
