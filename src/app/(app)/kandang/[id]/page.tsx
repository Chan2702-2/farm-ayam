'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Egg,
  HeartCrack,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { getCageById, getFarmCages, FarmCageData } from '@/lib/data/farm-data';
import { pullDataFromSheets } from '@/lib/sync/auto-sync';

export default function KandangDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cageId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [cage, setCage] = useState<FarmCageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cageId) return;

    const findCage = () => {
      const allCages = getFarmCages('all');
      return allCages.find((c) => c.id === cageId) || getCageById(cageId) || null;
    };

    const currentCage = findCage();
    if (currentCage) {
      setCage(currentCage);
      setLoading(false);
    } else {
      // Jika di perangkat ini (misal laptop) kandang belum dimuat, tarik dari Google Sheets
      if (typeof window !== 'undefined' && navigator.onLine) {
        pullDataFromSheets()
          .then(() => {
            const freshCage = findCage();
            setCage(freshCage);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }

    const handleDataChange = () => {
      const updated = findCage();
      if (updated) setCage(updated);
    };

    window.addEventListener('branchChange', handleDataChange);
    return () => window.removeEventListener('branchChange', handleDataChange);
  }, [cageId]);

  if (loading) {
    return (
      <div className="pt-24 pb-28 px-4 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <RefreshCw className="w-8 h-8 text-[#0284c7] animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-700">Memuat data kandang...</p>
        <p className="text-xs text-slate-400 mt-1">Sinkronisasi dengan Google Spreadsheet</p>
      </div>
    );
  }

  if (!cage) {
    return (
      <div className="pt-24 pb-28 px-4 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="font-jakarta font-bold text-lg text-slate-900 mb-1">
          Kandang Tidak Ditemukan
        </h2>
        <p className="text-xs text-slate-500 max-w-xs mb-4">
          Data unit kandang ini belum tersedia di perangkat Anda atau telah dihapus.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLoading(true);
              pullDataFromSheets().finally(() => setLoading(false));
            }}
            className="px-4 py-2 rounded-xl bg-sky-50 text-[#0284c7] font-bold text-xs hover:bg-sky-100 transition-colors"
          >
            Sinkronkan Ulang
          </button>
          <Link
            href="/kandang"
            className="px-4 py-2 rounded-xl bg-[#0284c7] text-white font-bold text-xs hover:bg-[#0369a1] transition-colors"
          >
            Kembali ke Kandang
          </Link>
        </div>
      </div>
    );
  }

  const occupancy = cage.kapasitas > 0 ? ((cage.populasiHidup / cage.kapasitas) * 100).toFixed(1) : '0';
  const isBelow = cage.actPercent < cage.standardPercent && cage.totalProduksi > 0;
  const pagiButir = (cage.pagiIkat || 0) * 30;
  const soreButir = (cage.soreIkat || 0) * 30;
  const totalTelur = cage.totalProduksi || (pagiButir + soreButir);
  const pagiRatio = totalTelur > 0 ? Math.round((pagiButir / totalTelur) * 100) : 95;
  const soreRatio = 100 - pagiRatio;

  return (
    <div className="pt-16 sm:pt-20 pb-28 px-3.5 sm:px-4 space-y-3.5 sm:space-y-4">
      {/* Context bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/kandang"
            className="w-9 h-9 -ml-1 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Detail Unit Kandang &bull; {cage.branchName}
            </span>
            <h1 className="font-jakarta font-bold text-lg text-slate-900 leading-tight">
              {cage.fullName || cage.name}
            </h1>
          </div>
        </div>

        <div>
          {isBelow ? (
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              Below Standard
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-sky-100 text-[#0284c7] text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Optimal
            </span>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-white flex items-center justify-center font-bold text-base shadow-sm">
              {cage.name.startsWith('1.') ? 'K1' : cage.name.substring(0, 3).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-jakarta font-bold text-base text-slate-900">
                  {cage.name}
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold text-[10px]">
                  {cage.jenis || 'LAYER'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Kapasitas {cage.kapasitas?.toLocaleString('id-ID') || 0} &bull; Masuk: {cage.tanggalMasuk || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Operator Callout */}
        <div className="flex items-center justify-between p-3 bg-sky-50/70 rounded-xl border border-sky-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#0284c7] text-white font-bold text-xs flex items-center justify-center shrink-0">
              {(cage.operator || 'OP').substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Operator Bertugas
              </span>
              <p className="text-xs font-bold text-slate-800 truncate">
                {cage.operator || '-'}
              </p>
            </div>
          </div>
          <a
            href="tel:08123456789"
            className="w-8 h-8 rounded-full bg-white text-[#0284c7] shadow-xs flex items-center justify-center hover:bg-sky-100 transition-colors"
            title="Hubungi Operator"
          >
            <Phone className="w-4 h-4" />
          </a>
        </div>

        {/* 3-col vitals grid */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Populasi</span>
            <div className="font-bold text-slate-800 text-sm mt-0.5">
              {(cage.populasiHidup || 0).toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-sky-600 font-semibold">{occupancy}% Okupansi</span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Umur Unggas</span>
            <div className="font-bold text-slate-800 text-sm mt-0.5">
              {cage.umurMgg || 0} <span className="text-[10px] font-normal text-slate-500">Mgg</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">{cage.umurBln || 0} Bulan</span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Rata-rata BB</span>
            <div className="font-bold text-slate-800 text-sm mt-0.5">
              {cage.beratAktual || 0} <span className="text-[10px] font-normal text-slate-500">gr</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Std {cage.beratStandard || 1858} g</span>
          </div>
        </div>
      </div>

      {/* Production Highlight Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0284c7] flex items-center justify-center">
              <Egg className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-jakarta font-bold text-sm text-slate-900">
                Produksi Telur Hari Ini
              </h3>
              <p className="text-[11px] text-slate-400">Pagi & Sore Terkoleksi</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            isBelow ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-[#0284c7]'
          }`}>
            ACT {(cage.actPercent || 0).toFixed(2)}%
          </span>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="font-jakarta font-extrabold text-2xl text-[#0369a1]">
              {(totalTelur || 0).toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-semibold text-slate-500 ml-1">butir telur</span>
          </div>
          <div className="text-right text-xs">
            <span className="text-slate-400">Standar Target:</span>
            <strong className="text-slate-800 ml-1">{cage.standardPercent || 95.5}%</strong>
          </div>
        </div>

        {/* Morning vs Afternoon Bar */}
        <div className="p-3 bg-sky-50/60 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between font-semibold">
            <span className="text-sky-900">
              Pagi: {pagiButir.toLocaleString('id-ID')} btr ({pagiRatio}%)
            </span>
            <span className="text-sky-700">
              Sore: {soreButir.toLocaleString('id-ID')} btr ({soreRatio}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full flex overflow-hidden">
            <div className="bg-[#0284c7] h-full" style={{ width: `${pagiRatio}%` }} />
            <div className="bg-sky-300 h-full" style={{ width: `${soreRatio}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Retak: {cage.retak || 0} btr &bull; Kotor: {cage.kotorPutih || 0} btr</span>
            <span className="text-[#0284c7] font-semibold">Grade A: 98.4%</span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons for Cage */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2.5">
        <h3 className="font-jakarta font-bold text-xs text-slate-400 uppercase tracking-wider">
          Aksi Cepat Unit Ini
        </h3>
        <div className="flex items-center gap-2.5">
          <Link
            href={`/populasi/kematian?cage=${cage.id}`}
            className="flex-1 h-12 rounded-xl bg-red-50 hover:bg-red-100 active:scale-95 text-red-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <HeartCrack className="w-4 h-4" />
            <span>Catat Kematian</span>
          </Link>

          <Link
            href={`/produksi/input?cage=${cage.id}`}
            className="flex-1 h-12 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-sky-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Input Produksi</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
