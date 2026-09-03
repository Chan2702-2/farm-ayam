'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, FileSpreadsheet, UploadCloud, CheckCircle2 } from 'lucide-react';
import {
  getFarmCages,
  calculateCageSummary,
  getFarmBranches,
  getActiveBranchId,
  setActiveBranchId,
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

    window.addEventListener('branchChange', handleBranchChange);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('branchChange', handleBranchChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const handleSelectBranch = (id: string) => {
    setActiveBranch(id);
    setActiveBranchId(id);
    setCages(getFarmCages(id));
  };

  const handleImportSuccess = (importedCount: number) => {
    loadData();
    setToastMessage(`Berhasil memperbarui ${importedCount} unit kandang dari Excel!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const summary = calculateCageSummary(cages);
  const currentBranchObj = branches.find((b) => b.id === activeBranch);

  const filteredCages = cages.filter(
    (c) =>
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.operator.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pt-16 sm:pt-20 pb-28 px-3.5 sm:px-4 space-y-3.5 sm:space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-jakarta font-bold text-xl text-slate-900">
            Produksi Telur
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Koleksi Harian &bull; {currentBranchObj?.name || 'Semua Cabang'}
          </p>
        </div>

        <Link
          href="/produksi/input"
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-sm shadow-sky-600/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Input Telur</span>
        </Link>
      </div>

      {/* Multi-Branch Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0 pb-0.5">
        <button
          onClick={() => handleSelectBranch('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
            activeBranch === 'all'
              ? 'bg-[#0369a1] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Semua Cabang (5)
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

      {/* Modular Produksi Summary Banner */}
      <ProduksiSummaryCard
        totalProduksi={summary.totalProduksi}
        pagiButir={summary.totalPagiButir}
        soreButir={summary.totalSoreButir}
        avgAct={summary.avgAct}
        targetAct={summary.avgStd}
      />

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
        {filteredCages.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm font-semibold text-slate-700">Tidak ada kandang ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba ganti cabang atau kata kunci pencarian</p>
          </div>
        ) : (
          filteredCages.map((cage) => (
            <ProduksiCageItem key={cage.id} cage={cage} />
          ))
        )}
      </div>

      {/* Modular Export Modal */}
      <LphExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        branchName={currentBranchObj?.name || 'Semua Cabang'}
        totalCages={cages.length}
        totalProduksi={summary.totalProduksi}
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
