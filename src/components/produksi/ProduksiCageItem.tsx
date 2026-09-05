'use client';

import React from 'react';
import Link from 'next/link';
import { Egg, CheckCircle2, Clock, Eye } from 'lucide-react';
import { FarmCageData, DailyEggProductionRecord } from '@/lib/data/farm-data';

interface ProduksiCageItemProps {
  cage: FarmCageData;
  date?: string;
  productionRecord?: DailyEggProductionRecord | null;
}

export function ProduksiCageItem({ cage, date, productionRecord }: ProduksiCageItemProps) {
  const targetDate = date || new Date().toISOString().split('T')[0];

  // If productionRecord is provided, use it; otherwise fallback to cage current fields
  const hasRecord = !!productionRecord;
  const isApproved = productionRecord?.approvalStatus === 'APPROVED';
  const hasData = hasRecord ? productionRecord.totalProduksi > 0 : cage.totalProduksi > 0;

  const pagiTotal = hasRecord
    ? (productionRecord.pagiIkat * 30) + (productionRecord.pagiButir || 0)
    : (cage.pagiIkat * 30) + (cage.pagiButir || 0);

  const soreTotal = hasRecord
    ? (productionRecord.soreIkat * 30) + (productionRecord.soreButir || 0)
    : (cage.soreIkat * 30) + (cage.soreButir || 0);

  const totalProduksi = hasRecord ? productionRecord.totalProduksi : cage.totalProduksi;
  const actPercent = hasRecord ? productionRecord.actPercent : cage.actPercent;
  const standardPercent = hasRecord ? productionRecord.standardPercent : cage.standardPercent;
  const isBelow = actPercent < standardPercent && hasData;

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

            {/* Approval Status Badge */}
            {isApproved ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Close (Approved)
              </span>
            ) : hasData ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                <Clock className="w-3 h-3 text-amber-600" />
                Pending (Belum Approve)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-medium">
                Belum Diinput
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Populasi: {cage.populasiHidup.toLocaleString('id-ID')} ekor • {cage.jenis}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isApproved ? (
            <Link
              href={`/kandang/${cage.id}`}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Detail</span>
            </Link>
          ) : (
            <Link
              href={`/produksi/input?cage=${cage.id}&date=${targetDate}`}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
                hasData
                  ? 'bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200'
                  : 'bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-xs'
              }`}
            >
              {hasData ? 'Edit Panen' : '+ Input'}
            </Link>
          )}
        </div>
      </div>

      {/* Production stats strip */}
      <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded-xl text-xs">
        <div>
          <span className="text-slate-400 block text-[9px] uppercase font-bold">Pagi</span>
          <strong className="text-slate-800 text-xs">
            {pagiTotal.toLocaleString('id-ID')} <span className="text-[10px] font-normal text-slate-500">btr</span>
          </strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[9px] uppercase font-bold">Sore</span>
          <strong className="text-slate-800 text-xs">
            {soreTotal.toLocaleString('id-ID')} <span className="text-[10px] font-normal text-slate-500">btr</span>
          </strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[9px] uppercase font-bold">Total & ACT</span>
          <div className="flex items-center gap-1">
            <strong className="text-[#0284c7] text-xs">{totalProduksi.toLocaleString('id-ID')}</strong>
            <span className={`text-[10px] font-bold ${isBelow ? 'text-amber-700' : 'text-emerald-700'}`}>
              ({actPercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
