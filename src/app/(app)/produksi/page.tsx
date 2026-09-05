'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import {
  getFarmCages,
  calculateCageSummary,
  getFarmBranches,
  getActiveBranchId,
  setActiveBranchId,
  getDailyEggProduction,
  formatIndonesianDate,
  DailyEggProductionRecord,
  FarmCageData,
  FarmBranch
} from '@/lib/data/farm-data';
import { ProduksiSummaryCard, ProduksiCageItem } from '@/components/produksi';
import { LphExportModal, LphImportModal } from '@/components/laporan';
import { getCurrentUser, filterCagesForUser, AuthUser } from '@/lib/data/auth-users';

export default function ProduksiOverviewPage() {
  const [branches, setBranches] = useState<FarmBranch[]>([]);
  const [activeBranch, setActiveBranch] = useState<string>('all');
  const [cages, setCages] = useState<FarmCageData[]>([]);
  const [search, setSearch] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Date Filter State (default: today)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Approval Status Filter: 'all' | 'pending' | 'close'
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'close'>('all');

  // Trigger re-render when egg production changes
  const [prodVersion, setProdVersion] = useState(0);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const loadData = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    const brs = getFarmBranches();
    setBranches(brs);
    const active = user && user.role === 'PENGAWAS' ? user.branchId : getActiveBranchId();
    setActiveBranch(active);
    const branchCages = getFarmCages(active);
    setCages(filterCagesForUser(branchCages, user));
  };

  useEffect(() => {
    loadData();

    const handleBranchChange = () => loadData();
    const handleAuthChange = () => loadData();
    const handleEggProdChange = () => setProdVersion((v) => v + 1);

    window.addEventListener('branchChange', handleBranchChange);
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('eggProductionChange', handleEggProdChange);

    return () => {
      window.removeEventListener('branchChange', handleBranchChange);
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('eggProductionChange', handleEggProdChange);
    };
  }, []);

  const handleSelectBranch = (id: string) => {
    setActiveBranch(id);
    setActiveBranchId(id);
    const user = getCurrentUser();
    const branchCages = getFarmCages(id);
    setCages(filterCagesForUser(branchCages, user));
  };

  const handleImportSuccess = (importedCount: number) => {
    loadData();
    setProdVersion((v) => v + 1);
    setToastMessage(`Berhasil memperbarui ${importedCount} unit kandang dari Excel!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleShiftDate = (deltaDays: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + deltaDays);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const currentBranchObj = branches.find((b) => b.id === activeBranch);

  // Map each cage to its production record on selectedDate
  const cageListWithProd = useMemo(() => {
    return cages.map((cage) => {
      const record = getDailyEggProduction(cage.id, selectedDate);
      const isApproved = record?.approvalStatus === 'APPROVED';
      const hasData = (record && record.totalProduksi > 0) || false;
      const status: 'PENDING' | 'APPROVED' = isApproved ? 'APPROVED' : 'PENDING';

      return {
        cage,
        record,
        hasData,
        status,
        pagiTotal: record ? (record.pagiIkat * 30 + (record.pagiButir || 0)) : (cage.pagiIkat * 30 + (cage.pagiButir || 0)),
        soreTotal: record ? (record.soreIkat * 30 + (record.soreButir || 0)) : (cage.soreIkat * 30 + (cage.soreButir || 0)),
        totalProduksi: record ? record.totalProduksi : cage.totalProduksi,
        actPercent: record ? record.actPercent : cage.actPercent,
      };
    });
  }, [cages, selectedDate, prodVersion]);

  // Calculate summary metrics on selectedDate
  const dateSummary = useMemo(() => {
    let totalProduksi = 0;
    let pagiButir = 0;
    let soreButir = 0;
    let actSum = 0;
    let actCount = 0;

    cageListWithProd.forEach((item) => {
      totalProduksi += item.totalProduksi;
      pagiButir += item.pagiTotal;
      soreButir += item.soreTotal;
      if (item.hasData) {
        actSum += item.actPercent;
        actCount++;
      }
    });

    const avgAct = actCount > 0 ? Number((actSum / actCount).toFixed(1)) : 0;
    return {
      totalProduksi,
      totalPagiButir: pagiButir,
      totalSoreButir: soreButir,
      avgAct,
      avgStd: 95.5,
    };
  }, [cageListWithProd]);

  // Counts for status filter pills
  const totalCount = cageListWithProd.length;
  const pendingCount = cageListWithProd.filter((item) => item.status === 'PENDING').length;
  const closeCount = cageListWithProd.filter((item) => item.status === 'APPROVED').length;

  // Filtered cages based on search & status filter
  const filteredItems = useMemo(() => {
    return cageListWithProd.filter((item) => {
      const c = item.cage;
      const matchesSearch =
        c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.operator.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'pending') {
        return item.status === 'PENDING';
      }
      if (statusFilter === 'close') {
        return item.status === 'APPROVED';
      }
      return true;
    });
  }, [cageListWithProd, search, statusFilter]);

  return (
    <div className="pt-16 sm:pt-20 pb-28 px-3.5 sm:px-4 space-y-3.5 sm:space-y-4">
      {/* Top Header with Date Filter */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-jakarta font-bold text-xl text-slate-900">
              Produksi Telur
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-[#0284c7] border border-sky-100">
              {formatIndonesianDate(selectedDate)}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Koleksi Harian &bull; {currentBranchObj?.name || 'Semua Cabang'}
          </p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => handleShiftDate(-1)}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-all"
            title="Hari Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 transition-colors">
            <Calendar className="w-3.5 h-3.5 text-sky-600 mr-2 shrink-0 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs sm:text-sm font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => handleShiftDate(1)}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-all"
            title="Hari Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {selectedDate !== todayStr && (
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0284c7] text-xs font-bold transition-all shrink-0"
            >
              Hari Ini
            </button>
          )}
        </div>
      </div>

      {/* Multi-Branch Tabs - ONLY FOR ADMIN */}
      {currentUser && currentUser.role === 'PENGAWAS' ? (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
          <span className="font-bold text-amber-900">📍 {currentUser.branchName}</span>
          <span className="text-[11px] text-amber-700 font-semibold">{cages.length} Kandang Aktif</span>
        </div>
      ) : (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0 pb-0.5">
          <button
            onClick={() => handleSelectBranch('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              activeBranch === 'all'
                ? 'bg-[#0369a1] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Semua Cabang ({branches.reduce((acc, b) => acc + (b.totalCages || 0), 0)})
          </button>
          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => handleSelectBranch(b.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                activeBranch === b.id
                  ? 'bg-[#0284c7] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {b.shortName} ({b.totalCages})
            </button>
          ))}
        </div>
      )}

      {/* Modular Produksi Summary Banner */}
      <ProduksiSummaryCard
        totalProduksi={dateSummary.totalProduksi}
        pagiButir={dateSummary.totalPagiButir}
        soreButir={dateSummary.totalSoreButir}
        avgAct={dateSummary.avgAct}
        targetAct={dateSummary.avgStd}
      />

      {/* Approval Status Filter Tabs (Pending: Belom di approve | Close: Sudah di approve) */}
      <div className="p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 flex items-center gap-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            statusFilter === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Semua</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
            statusFilter === 'all' ? 'bg-slate-100 text-slate-700' : 'bg-slate-200 text-slate-600'
          }`}>
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/25'
              : 'text-amber-800 hover:bg-amber-50/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending (Belum Approve)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
            statusFilter === 'pending' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-900'
          }`}>
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('close')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            statusFilter === 'close'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/25'
              : 'text-emerald-800 hover:bg-emerald-50/60'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Close (Sudah Approve)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
            statusFilter === 'close' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-900'
          }`}>
            {closeCount}
          </span>
        </button>
      </div>

      {/* Search & Action Buttons */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari unit kandang atau operator..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 shadow-xs focus:outline-none focus:border-[#0284c7]"
          />
        </div>

        <button
          onClick={() => setShowImportModal(true)}
          className="h-11 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0284c7] font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
          title="Import Excel LPH"
        >
          <UploadCloud className="w-4 h-4" />
          <span className="hidden sm:inline">Import</span>
        </button>

        <button
          onClick={() => setShowExportModal(true)}
          className="h-11 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
          title="Export Excel LPH"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* Modular Cage List for Production */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm font-semibold text-slate-700">Tidak ada kandang ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">
              {statusFilter !== 'all'
                ? `Tidak ada kandang dengan status "${statusFilter === 'close' ? 'Close (Sudah Approve)' : 'Pending (Belum Approve)'}" pada tanggal ini.`
                : 'Coba ganti cabang atau kata kunci pencarian.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <ProduksiCageItem
              key={item.cage.id}
              cage={item.cage}
              date={selectedDate}
              productionRecord={item.record}
            />
          ))
        )}
      </div>

      {/* Modular Export Modal */}
      <LphExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        branchName={currentBranchObj?.name || 'Semua Cabang'}
        totalCages={cages.length}
        totalProduksi={dateSummary.totalProduksi}
      />

      {/* Modular Import Modal */}
      <LphImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />

      {/* Toast Notification */}
      <div
        className={`fixed bottom-24 left-4 right-4 z-50 bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex items-center gap-3 transition-all duration-300 ${
          toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <p className="font-bold text-xs sm:text-sm">Produksi Berhasil Diperbarui!</p>
          <p className="text-[11px] text-slate-300">{toastMessage}</p>
        </div>
      </div>
    </div>
  );
}
