'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  Wheat,
  Egg,
  Plus
} from 'lucide-react';
import {
  getFarmCages,
  calculateCageSummary,
  getFarmBranches,
  getActiveBranchId,
  setActiveBranchId,
  getFeedDistribution,
  calculateFeedSummary,
  FarmCageData,
  FarmBranch,
  FeedDistributionItem
} from '@/lib/data/farm-data';
import {
  LphTable,
  FeedDistributionTable,
  LaporanKpiStrip,
  LphExportModal,
  LphImportModal,
  LaporanFilterBar
} from '@/components/laporan';

export default function LaporanPage() {
  const [reportType, setReportType] = useState<'lph' | 'pakan'>('lph');
  const [branches, setBranches] = useState<FarmBranch[]>([]);
  const [activeBranch, setActiveBranch] = useState<string>('all');
  const [cages, setCages] = useState<FarmCageData[]>([]);
  const [feedItems, setFeedItems] = useState<FeedDistributionItem[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-09-03');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportingPakan, setExportingPakan] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    const brs = getFarmBranches();
    setBranches(brs);
    const active = getActiveBranchId();
    setActiveBranch(active);
    setCages(getFarmCages(active));
    setFeedItems(getFeedDistribution(active));
  };

  useEffect(() => {
    loadData();

    const handleBranchChange = () => loadData();
    const handleFeedChange = () => loadData();

    window.addEventListener('branchChange', handleBranchChange);
    window.addEventListener('feedChange', handleFeedChange);

    return () => {
      window.removeEventListener('branchChange', handleBranchChange);
      window.removeEventListener('feedChange', handleFeedChange);
    };
  }, []);

  const handleSelectBranch = (id: string) => {
    setActiveBranch(id);
    setActiveBranchId(id);
    setCages(getFarmCages(id));
    setFeedItems(getFeedDistribution(id));
  };

  const handleImportSuccess = (importedCount: number) => {
    loadData();
    setToastMessage(`Berhasil mengimpor ${importedCount} unit kandang dari Excel!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const summary = calculateCageSummary(cages);
  const feedSummary = calculateFeedSummary(feedItems);
  const currentBranchObj = branches.find((b) => b.id === activeBranch);

  const handleExportPakanDirect = async () => {
    try {
      setExportingPakan(true);
      let branchQuery = '3-alur';
      if (activeBranch === 'branch-2') branchQuery = 'b-rupi';
      else if (activeBranch === 'branch-3') branchQuery = 'rosam';

      const res = await fetch(`/api/export/pakan?branch=${branchQuery}&date=${selectedDate}`);
      if (!res.ok) throw new Error('Gagal export excel pakan');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PEMBAGIAN_PAKAN_${currentBranchObj?.shortName || 'FARM'}_${selectedDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setToastMessage('File Excel Pembagian Pakan berhasil diunduh!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e: any) {
      alert('Export Gagal: ' + e.message);
    } finally {
      setExportingPakan(false);
    }
  };

  return (
    <div className="pt-16 sm:pt-20 pb-28 px-3.5 sm:px-4 space-y-3.5 sm:space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Rekapitulasi Operasional Farm
          </span>
          <h1 className="font-jakarta font-bold text-xl text-slate-900">
            Pusat Laporan & Audit
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

          {reportType === 'lph' ? (
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
              title="Export File Excel LPH"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export LPH</span>
            </button>
          ) : (
            <button
              onClick={handleExportPakanDirect}
              disabled={exportingPakan}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs active:scale-95 disabled:opacity-50 transition-all"
              title="Export File Excel Pembagian Pakan"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{exportingPakan ? 'Exporting...' : 'Export Pakan'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Report Module Switcher (LPH vs Pembagian Pakan) */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
        <button
          type="button"
          onClick={() => setReportType('lph')}
          className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            reportType === 'lph'
              ? 'bg-white text-[#0369a1] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Egg className="w-4 h-4 text-[#0284c7]" />
          <span>Laporan Telur (LPH)</span>
        </button>

        <button
          type="button"
          onClick={() => setReportType('pakan')}
          className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            reportType === 'pakan'
              ? 'bg-white text-amber-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wheat className="w-4 h-4 text-amber-600" />
          <span>Pembagian Pakan</span>
        </button>
      </div>

      {/* Filter Bar (3 Authentic Branches: 3 Alur, Balai Rupih, Rosam) */}
      <LaporanFilterBar
        branches={branches}
        activeBranch={activeBranch}
        onSelectBranch={handleSelectBranch}
        selectedDate={selectedDate}
        onOpenExport={() => {
          if (reportType === 'lph') setShowExportModal(true);
          else handleExportPakanDirect();
        }}
        currentBranchName={currentBranchObj?.name}
      />

      {/* KPI Cards based on Selected Report Type */}
      {reportType === 'lph' ? (
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
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">
              Total Pakan
            </span>
            <strong className="font-jakarta font-extrabold text-lg text-amber-700 block mt-0.5">
              {feedSummary.totalKg.toLocaleString('id-ID', { minimumFractionDigits: 1 })} KG
            </strong>
            <span className="text-[10px] text-slate-500">Kebutuhan harian</span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">
              Alokasi Pengiriman
            </span>
            <strong className="font-jakarta font-extrabold text-lg text-emerald-700 block mt-0.5">
              {feedSummary.totalSak} SAK
            </strong>
            <span className="text-[10px] text-slate-500">{feedSummary.totalKirimKg.toLocaleString('id-ID', { minimumFractionDigits: 1 })} kg</span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">
              Konsumsi Rata-rata
            </span>
            <strong className="font-jakarta font-extrabold text-lg text-slate-800 block mt-0.5">
              {feedSummary.avgKonsumsi} g
            </strong>
            <span className="text-[10px] text-slate-500">Per ekor / hari</span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">
              Populasi Terlayani
            </span>
            <strong className="font-jakarta font-extrabold text-lg text-[#0284c7] block mt-0.5">
              {feedSummary.totalPop.toLocaleString('id-ID')}
            </strong>
            <span className="text-[10px] text-slate-500">{feedItems.length} unit kandang</span>
          </div>
        </div>
      )}

      {/* Table Preview Card */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-jakarta font-bold text-sm text-slate-900">
              {reportType === 'lph'
                ? `Preview Laporan Harian (${cages.length} Kandang)`
                : `Preview Pembagian Pakan (${feedItems.length} Kandang)`}
            </h3>
            <p className="text-[11px] text-slate-400">
              {currentBranchObj ? currentBranchObj.name : 'Konsolidasi Seluruh Cabang Farm'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {reportType === 'pakan' && (
              <Link
                href="/pakan/input"
                className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Input</span>
              </Link>
            )}

            <button
              onClick={() => {
                if (reportType === 'lph') setShowExportModal(true);
                else handleExportPakanDirect();
              }}
              className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.XLSX</span>
            </button>
          </div>
        </div>

        {/* Dynamic Table Preview */}
        {reportType === 'lph' ? (
          <LphTable
            cages={cages}
            summary={summary}
          />
        ) : (
          <FeedDistributionTable
            items={feedItems}
            summary={feedSummary}
          />
        )}
      </div>

      {/* Modular Export Modal for LPH */}
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
          <p className="font-bold text-xs sm:text-sm">Operasi Berhasil!</p>
          <p className="text-[11px] text-slate-300">{toastMessage}</p>
        </div>
      </div>
    </div>
  );
}
