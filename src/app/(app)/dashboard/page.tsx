'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Egg,
  HeartCrack,
  Scale,
  Plus,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  ChevronRight,
  Archive,
  ArrowLeftRight,
  Syringe,
  Layers,
  Wheat,
  Check,
  CheckCircle2
} from 'lucide-react';
import {
  getFarmCages,
  calculateCageSummary,
  getFarmBranches,
  getActiveBranchId,
  setActiveBranchId,
  FarmCageData,
  FarmBranch
} from '@/lib/data/farm-data';
import { KandangCard } from '@/components/kandang/KandangCard';
import { getCurrentUser, filterCagesForUser, AuthUser } from '@/lib/data/auth-users';
import { Modal } from '@/components/ui/Modal';

export default function DashboardPage() {
  const [branches, setBranches] = useState<FarmBranch[]>([]);
  const [activeBranchId, setActiveBranchIdState] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [cages, setCages] = useState<FarmCageData[]>([]);
  const [filter, setFilter] = useState<'all' | 'attention' | 'below' | 'excellent'>('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026-09-03');
  const [todayDateFormatted, setTodayDateFormatted] = useState('');

  useEffect(() => {
    setTodayDateFormatted(
      new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date())
    );
  }, []);

  const loadData = () => {
    const user = getCurrentUser();
    setCurrentUser(user);

    const brs = getFarmBranches();
    setBranches(brs);

    const active = user && user.role === 'PENGAWAS' ? user.branchId : getActiveBranchId();
    setActiveBranchIdState(active);

    const branchCages = getFarmCages(active);
    const userCages = filterCagesForUser(branchCages, user);
    setCages(userCages);
  };

  useEffect(() => {
    loadData();

    const handleBranchChange = () => loadData();
    const handleAuthChange = () => loadData();

    window.addEventListener('branchChange', handleBranchChange);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('branchChange', handleBranchChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const handleSwitchBranch = (id: string) => {
    setActiveBranchIdState(id);
    setActiveBranchId(id);
    setCages(getFarmCages(id));
    setShowBranchModal(false);
  };

  const summary = calculateCageSummary(cages);
  const currentBranch = branches.find((b) => b.id === activeBranchId);

  const filteredCages = cages.filter((c) => {
    if (filter === 'attention') return c.mati >= 2 || (c.actPercent > 0 && c.actPercent < 90);
    if (filter === 'below') return c.actPercent < c.standardPercent && c.totalProduksi > 0;
    if (filter === 'excellent') return c.actPercent >= c.standardPercent && c.totalProduksi > 0;
    return true;
  });

  const handleDownloadExcel = async () => {
    try {
      setExporting(true);
      const url = `/api/export/lph?date=${selectedDate}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `LPH_Yuki_Farm_${selectedDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setShowExportModal(false);
    } catch (e) {
      alert('Gagal mengunduh file Excel: ' + (e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="pt-16 sm:pt-20 pb-28 px-3.5 sm:px-4 space-y-3.5 sm:space-y-4">
      {/* Top Banner Context */}
      <div className="flex items-center justify-between pt-1">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
            <span className="truncate">{todayDateFormatted || 'Memuat tanggal...'}</span>
          </div>
          <h1 className="font-jakarta font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight leading-tight truncate mt-0.5">
            {currentUser?.role === 'PENGAWAS'
              ? currentUser.branchName
              : activeBranchId === 'all'
              ? branches.length > 0
                ? `Dashboard ${branches.length} Cabang`
                : 'Dashboard Peternakan'
              : currentBranch?.name || 'Cabang Peternakan'}
          </h1>
        </div>

        {currentUser?.role === 'PENGAWAS' ? (
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold shrink-0">
            <Building2 className="w-3 h-3 text-amber-600" />
            <span>{currentUser.branchName}</span>
          </div>
        ) : (
          <button
            onClick={() => setShowBranchModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#e0f2fe] text-[#0369a1] text-[11px] font-bold shadow-xs active:scale-95 transition-all shrink-0"
          >
            <Building2 className="w-3 h-3 text-[#0284c7]" />
            <span>
              {activeBranchId === 'all'
                ? branches.length > 0
                  ? `${branches.length} Cabang`
                  : 'Semua Cabang'
                : currentBranch?.shortName || 'Cabang'}
            </span>
          </button>
        )}
      </div>

      {/* Pengawas Isolated Access Banner */}
      {currentUser && currentUser.role === 'PENGAWAS' && (
        <div className="p-3 bg-gradient-to-r from-amber-50 to-amber-100/70 border border-amber-200 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {currentUser.avatarInitial}
            </div>
            <div className="min-w-0">
              <strong className="text-xs text-amber-950 font-bold block truncate">
                Halo, {currentUser.name}!
              </strong>
              <span className="text-[10px] text-amber-800 font-medium block truncate">
                {currentUser.title} &bull; Data Terisolasi
              </span>
            </div>
          </div>
          <span className="text-[10px] font-extrabold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full shrink-0">
            {cages.length} Kandang
          </span>
        </div>
      )}

      {/* Multi-Branch Quick Horizontal Scroll Tabs - ONLY FOR ADMIN */}
      {(!currentUser || currentUser.role === 'ADMIN') && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0 py-0.5">
          <button
            onClick={() => handleSwitchBranch('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              activeBranchId === 'all'
                ? 'bg-[#0369a1] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Semua Cabang
          </button>
          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => handleSwitchBranch(b.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                activeBranchId === b.id
                  ? 'bg-[#0284c7] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {b.shortName} ({b.totalCages})
            </button>
          ))}
        </div>
      )}

      {/* Top 2x2 KPI Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Total Ayam */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Ayam
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#e0f2fe] text-[#0369a1] flex items-center justify-center">
              <Egg className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="font-jakarta font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight leading-none">
              {summary.totalAyam.toLocaleString('id-ID')}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-[#0284c7] font-semibold truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0" />
              <span>{summary.occupancyRate}% Terisi</span>
            </div>
          </div>
        </div>

        {/* Total Produksi */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Produksi Telur
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center">
              <Egg className="w-3.5 h-3.5 text-[#0284c7]" />
            </div>
          </div>
          <div>
            <div className="font-jakarta font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight leading-none">
              {summary.totalProduksi.toLocaleString('id-ID')}
              <span className="text-[11px] font-normal text-slate-400 ml-1">btr</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-1 truncate">
              {summary.activeCagesCount} Kandang Panen
            </div>
          </div>
        </div>

        {/* ACT % */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Hen-Day (ACT)
            </span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="font-jakarta font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight leading-none">
              {summary.avgAct}%
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px]">
              <span className="text-slate-400">Std {summary.avgStd}%</span>
              <span className={`font-bold ${summary.selisih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.selisih >= 0 ? '+' : ''}{summary.selisih}%
              </span>
            </div>
          </div>
        </div>

        {/* Kematian */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Mortalitas
            </span>
            <div className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <HeartCrack className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="font-jakarta font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight leading-none">
              {summary.totalMati}
              <span className="text-[11px] font-normal text-slate-400 ml-1">ekor</span>
            </div>
            <div className="mt-1">
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold">
                0.012% Aman
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS SECTION */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-jakarta font-bold text-xs text-slate-800 uppercase tracking-wider">
            Aksi Cepat Lapangan
          </h2>
          <button
            onClick={() => setShowExportModal(true)}
            className="text-[11px] font-bold text-[#0284c7] flex items-center gap-1 hover:underline"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export LPH
          </button>
        </div>

        {/* 5 Core Touch Cards */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          <Link
            href="/produksi/input"
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-white border border-slate-100 shadow-xs hover:border-sky-200 active:scale-95 transition-all text-center"
          >
            <div className="w-8 h-8 rounded-xl bg-[#0284c7] text-white flex items-center justify-center shadow-xs">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 mt-1.5 tracking-tight">Input Telur</span>
          </Link>

          <Link
            href="/pakan"
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-white border border-slate-100 shadow-xs hover:border-amber-200 active:scale-95 transition-all text-center"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Wheat className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 mt-1.5 tracking-tight">Pakan</span>
          </Link>

          <Link
            href="/populasi/kematian"
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-white border border-slate-100 shadow-xs hover:border-red-200 active:scale-95 transition-all text-center"
          >
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <HeartCrack className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 mt-1.5 tracking-tight">Mortalitas</span>
          </Link>

          <Link
            href="/berat"
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-white border border-slate-100 shadow-xs hover:border-sky-200 active:scale-95 transition-all text-center"
          >
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 mt-1.5 tracking-tight">Timbang</span>
          </Link>

          <Link
            href="/perlakuan"
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-white border border-slate-100 shadow-xs hover:border-emerald-200 active:scale-95 transition-all text-center"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Syringe className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 mt-1.5 tracking-tight">Vaksin</span>
          </Link>
        </div>

        {/* 3 Secondary actions */}
        <div className="grid grid-cols-3 gap-2">
          <Link
            href="/populasi/afkir"
            className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-slate-100 shadow-xs text-[10px] sm:text-[11px] font-semibold text-slate-700 active:scale-95 transition-all"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Archive className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">Catat Afkir</span>
          </Link>

          <Link
            href="/populasi/mutasi"
            className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-slate-100 shadow-xs text-[10px] sm:text-[11px] font-semibold text-slate-700 active:scale-95 transition-all"
          >
            <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">Mutasi Ayam</span>
          </Link>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 border border-emerald-100 shadow-xs text-[10px] sm:text-[11px] font-semibold text-emerald-800 active:scale-95 transition-all text-left"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Download className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">Export Excel</span>
          </button>
        </div>
      </div>

      {/* IF 'ALL' IS SELECTED: SHOW BRANCHES PERFORMANCE CARDS */}
      {activeBranchId === 'all' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4.5 rounded-full bg-[#0284c7] shrink-0" />
              <h2 className="font-jakarta font-bold text-sm text-slate-900">
                Performa {branches.length > 0 ? `${branches.length} Cabang Peternakan` : 'Cabang Peternakan'}
              </h2>
            </div>
            {branches.length > 0 && (
              <span className="text-[10px] text-slate-400 font-medium">Ketuk untuk buka</span>
            )}
          </div>

          {branches.length === 0 ? (
            <div className="p-5 text-center bg-white rounded-2xl border border-dashed border-sky-200 shadow-xs space-y-2">
              <div className="w-9 h-9 mx-auto rounded-xl bg-sky-50 text-[#0284c7] flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700">Belum ada cabang peternakan</p>
              <p className="text-[11px] text-slate-400">Tambahkan cabang baru di menu Kandang untuk melihat performa di sini.</p>
              <Link
                href="/kandang"
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-[#0284c7] rounded-xl text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Cabang</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {branches.map((b) => (
                <div
                  key={b.id}
                  onClick={() => handleSwitchBranch(b.id)}
                  className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs hover:border-sky-300 active:scale-[0.99] cursor-pointer transition-all flex flex-col gap-2"
                >
                  {/* Top Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold tracking-wide bg-sky-50 text-[#0284c7] shrink-0">
                        {b.code}
                      </span>
                      <h4 className="font-jakarta font-bold text-sm text-slate-900 truncate">
                        {b.name}
                      </h4>
                      {b.code === '3-ALUR' && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold shrink-0">
                          Pusat
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 shrink-0">
                      <span className="text-[11px] text-[#0284c7] font-bold">Buka</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Sub-info Row */}
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="truncate">{b.location}</span>
                    <span className="text-slate-700 font-semibold shrink-0 ml-2">{b.totalCages} Kandang</span>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
                    <span className="text-slate-600">
                      Pop: <strong className="text-slate-800">{b.populasi.toLocaleString('id-ID')}</strong> ekr
                    </span>
                    <span className="text-slate-600">
                      Prod: <strong className="text-[#0369a1]">{b.produksi.toLocaleString('id-ID')}</strong> btr
                    </span>
                    <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                      b.act >= 95 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      ACT {b.act}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CAGES LIST */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4.5 rounded-full bg-[#0284c7] shrink-0" />
              <h2 className="font-jakarta font-bold text-sm text-slate-900">
                Monitoring Kandang ({cages.length} Unit)
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 font-medium ml-3.5 mt-0.5">
              {activeBranchId === 'all' ? 'Seluruh Cabang' : currentBranch?.name}
            </p>
          </div>
          <Link
            href="/kandang"
            className="text-[11px] font-bold text-[#0284c7] flex items-center gap-1 hover:underline"
          >
            <span>Semua</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0 pb-0.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 ${
              filter === 'all' ? 'bg-[#0284c7] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({cages.length})
          </button>
          <button
            onClick={() => setFilter('attention')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 ${
              filter === 'attention' ? 'bg-red-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Perhatian
          </button>
          <button
            onClick={() => setFilter('below')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 ${
              filter === 'below' ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Below Std
          </button>
          <button
            onClick={() => setFilter('excellent')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 ${
              filter === 'excellent' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Excellent
          </button>
        </div>

        {/* Cards */}
        <div className="space-y-2.5">
          {filteredCages.slice(0, 6).map((cage) => (
            <KandangCard key={cage.id} cage={cage} />
          ))}
        </div>

        {filteredCages.length > 6 && (
          <Link
            href="/kandang"
            className="w-full h-11 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0369a1] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Lihat Semua {filteredCages.length} Kandang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Branch Selection Modal */}
      <Modal
        isOpen={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        title="Pilih Cabang Peternakan"
        subtitle="Filter data operasional per cabang lokasi"
      >
        <div className="space-y-2.5">
          <button
            onClick={() => handleSwitchBranch('all')}
            className={`w-full p-3.5 rounded-2xl border transition-all text-left flex flex-col gap-2 ${
              activeBranchId === 'all'
                ? 'bg-[#0369a1] text-white border-[#0369a1] shadow-md shadow-sky-900/15'
                : 'bg-white border-slate-200/80 hover:bg-slate-50/90'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  activeBranchId === 'all' ? 'bg-white/20 text-white' : 'bg-sky-100 text-[#0284c7]'
                }`}>
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`font-jakarta font-bold text-sm ${activeBranchId === 'all' ? 'text-white' : 'text-slate-900'}`}>
                    Semua Cabang (Konsolidasi)
                  </h4>
                  <span className={`text-[10px] ${activeBranchId === 'all' ? 'text-sky-100' : 'text-slate-400'}`}>
                    {branches.length} Cabang &bull; {cages.length} Unit Kandang
                  </span>
                </div>
              </div>

              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                activeBranchId === 'all' ? 'border-white bg-white' : 'border-slate-300 bg-white'
              }`}>
                {activeBranchId === 'all' && <Check className="w-3 h-3 text-[#0369a1] stroke-[3]" />}
              </div>
            </div>

            <div className={`flex items-center justify-between pt-1.5 border-t ${
              activeBranchId === 'all' ? 'border-sky-700/50 text-sky-100' : 'border-slate-100 text-slate-600'
            } text-xs`}>
              <span>Populasi: <strong className={activeBranchId === 'all' ? 'text-white' : 'text-slate-800'}>{summary.totalAyam.toLocaleString('id-ID')}</strong> ekor</span>
              <span>Prod: <strong className={activeBranchId === 'all' ? 'text-white' : 'text-[#0284c7]'}>{summary.totalProduksi.toLocaleString('id-ID')}</strong> btr</span>
              <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                activeBranchId === 'all' ? 'bg-white/20 text-white' : 'bg-sky-50 text-[#0284c7]'
              }`}>
                Avg {summary.avgAct}%
              </span>
            </div>
          </button>

          {branches.map((b) => {
            const isSelected = activeBranchId === b.id;
            return (
              <button
                key={b.id}
                onClick={() => handleSwitchBranch(b.id)}
                className={`w-full p-3.5 rounded-2xl border transition-all text-left flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-sky-50/90 border-[#0284c7] shadow-xs'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50/90'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold tracking-wide shrink-0 ${
                      isSelected ? 'bg-[#0284c7] text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {b.code}
                    </span>
                    <h4 className="font-jakarta font-bold text-sm text-slate-900 truncate">
                      {b.name}
                    </h4>
                    {b.code === '3-ALUR' && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold shrink-0">
                        Pusat
                      </span>
                    )}
                  </div>

                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-[#0284c7] bg-[#0284c7]' : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="truncate">{b.location}</span>
                  <span className="text-slate-700 font-semibold shrink-0 ml-2">{b.totalCages} Kandang</span>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100/80 text-xs">
                  <span className="text-slate-600">
                    Pop: <strong className="text-slate-800">{b.populasi.toLocaleString('id-ID')}</strong> ekr
                  </span>
                  <span className="text-slate-600">
                    Prod: <strong className="text-[#0369a1]">{b.produksi.toLocaleString('id-ID')}</strong> btr
                  </span>
                  <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                    b.act >= 95 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    ACT {b.act}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Laporan Harian (LPH)"
        subtitle="Format Excel Resmi Yuki Farm (3 Alur)"
      >
        <div className="space-y-3.5">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-jakarta font-bold text-emerald-950 text-xs sm:text-sm">
                LPH 3 ALUR Template
              </h4>
              <p className="text-[11px] text-emerald-700">
                Formula total dan format identik dengan master Excel.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Pilih Tanggal Laporan
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-xs sm:text-sm text-slate-800 outline-none"
            />
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Cabang:</span>
              <strong className="text-slate-800">{currentBranch?.name || 'Semua Cabang'}</strong>
            </div>
            <div className="flex justify-between">
              <span>File:</span>
              <span className="font-mono text-[10px] text-slate-700">LPH_Yuki_Farm_{selectedDate}.xlsx</span>
            </div>
          </div>

          <div className="pt-1 flex gap-2">
            <button
              onClick={() => setShowExportModal(false)}
              className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
            >
              Batal
            </button>
            <button
              onClick={handleDownloadExcel}
              disabled={exporting}
              className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-70"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? 'Mengunduh...' : 'Unduh Excel'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
