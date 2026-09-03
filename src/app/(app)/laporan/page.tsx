'use client';

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, UploadCloud, CheckCircle2 } from 'lucide-react';
import {
  getFarmCages,
  calculateCageSummary,
  getFarmBranches,
  getActiveBranchId,
  setActiveBranchId,
  FarmCageData,
  FarmBranch
} from '@/lib/data/farm-data';
import {
  LphTable,
  LaporanKpiStrip,
  LphExportModal,
  LphImportModal,
  LaporanFilterBar
} from '@/components/laporan';

export default function LaporanPage() {
  const [branches, setBranches] = useState<FarmBranch[]>([]);
  const [activeBranch, setActiveBranch] = useState<string>('all');
  const [cages, setCages] = useState<FarmCageData[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-09-03');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    const brs = getFarmBranches();
    setBranches(brs);
    const active = getActiveBranchId();
    setActiveBranch(active);
    setCages(getFarmCages(active));
  };

  useEffect(() => {
    loadData();

    const handleBranchChange = () => {
      loadData();
    };
    window.addEventListener('branchChange', handleBranchChange);
    return () => window.removeEventListener('branchChange', handleBranchChange);
  }, []);

  const handleSelectBranch = (id: string) => {
    setActiveBranch(id);
    setActiveBranchId(id);
    setCages(getFarmCages(id));
  };

  const handleImportSuccess = (importedCount: number) => {
    loadData();
    setToastMessage(`Berhasil mengimpor ${importedCount} unit kandang dari Excel!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const summary = calculateCageSummary(cages);
  const currentBranchObj = branches.find((b) => b.id === activeBranch);

  return (
    <div className="pt-16 sm:pt-20 pb-28 px-3.5 sm:px-4 space-y-3.5 sm:space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Rekapitulasi Produksi Multi-Site
          </span>
          <h1 className="font-jakarta font-bold text-xl text-slate-900">
            Laporan Harian (LPH)
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0284c7] text-xs font-bold border border-sky-200/80 active:scale-95 transition-all"
            title="Import File Excel LPH"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Import</span>
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
            title="Export File Excel LPH"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Modular Filter Bar (Branch Tabs & Date Ribbon) */}
      <LaporanFilterBar
        branches={branches}
        activeBranch={activeBranch}
        onSelectBranch={handleSelectBranch}
        selectedDate={selectedDate}
        onOpenExport={() => setShowExportModal(true)}
        currentBranchName={currentBranchObj?.name}
      />

      {/* Modular Summary KPI Strip */}
      <LaporanKpiStrip
        totalProduksi={summary.totalProduksi}
        totalPagiButir={summary.totalPagiButir}
        totalSoreButir={summary.totalSoreButir}
        avgAct={summary.avgAct}
        totalAyam={summary.totalAyam}
        totalMati={summary.totalMati}
        totalAfkir={summary.totalAfkir}
        avgWeight={summary.avgWeight}
      />

      {/* LPH Table Card Preview */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-jakarta font-bold text-sm text-slate-900">
              Preview Tabel LPH ({cages.length} Kandang)
            </h3>
            <p className="text-[11px] text-slate-400">
              {currentBranchObj ? currentBranchObj.name : 'Konsolidasi 5 Cabang Peternakan'}
            </p>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.XLSX</span>
          </button>
        </div>

        {/* Modular LPH Table with Sticky Left Column */}
        <LphTable
          cages={cages}
          summary={summary}
        />
      </div>

      {/* Modular Export Modal */}
      <LphExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        branchName={currentBranchObj?.name || 'Semua Cabang'}
        totalCages={cages.length}
        totalProduksi={summary.totalProduksi}
        initialDate={selectedDate}
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
          <p className="font-bold text-xs sm:text-sm">Sinkronisasi Berhasil!</p>
          <p className="text-[11px] text-slate-300">{toastMessage}</p>
        </div>
      </div>
    </div>
  );
}
