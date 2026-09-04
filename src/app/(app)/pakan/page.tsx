'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wheat,
  Plus,
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  Calendar,
  Building2
} from 'lucide-react';
import {
  getFeedDistribution,
  calculateFeedSummary,
  getFarmBranches,
  getActiveBranchId,
  setActiveBranchId,
  FeedDistributionItem,
  FarmBranch
} from '@/lib/data/farm-data';
import { FeedDistributionTable } from '@/components/laporan';
import { getCurrentUser, filterFeedForUser, AuthUser } from '@/lib/data/auth-users';

export default function PakanOverviewPage() {
  const [branches, setBranches] = useState<FarmBranch[]>([]);
  const [activeBranch, setActiveBranch] = useState<string>('all');
  const [feedItems, setFeedItems] = useState<FeedDistributionItem[]>([]);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026-09-03');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const loadData = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    setBranches(getFarmBranches());
    const active = user && user.role === 'PENGAWAS' ? user.branchId : getActiveBranchId();
    setActiveBranch(active);
    const branchFeed = getFeedDistribution(active);
    setFeedItems(filterFeedForUser(branchFeed, user));
  };

  useEffect(() => {
    loadData();

    const handleFeedChange = () => loadData();
    const handleBranchChange = () => loadData();
    const handleAuthChange = () => loadData();

    window.addEventListener('feedChange', handleFeedChange);
    window.addEventListener('branchChange', handleBranchChange);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('feedChange', handleFeedChange);
      window.removeEventListener('branchChange', handleBranchChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const handleSelectBranch = (id: string) => {
    setActiveBranch(id);
    setActiveBranchId(id);
    setFeedItems(getFeedDistribution(id));
  };

  const summary = calculateFeedSummary(feedItems);
  const currentBranchObj = branches.find((b) => b.id === activeBranch);

  const filteredItems = feedItems.filter(
    (item) =>
      item.kandang.toLowerCase().includes(search.toLowerCase()) ||
      item.jenisPakan.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      let branchQuery = '3-alur';
      if (activeBranch === 'branch-2') branchQuery = 'b-rupi';
      else if (activeBranch === 'branch-3') branchQuery = 'rosam';

      const res = await fetch(`/api/export/pakan?branch=${branchQuery}&date=${selectedDate}`);
      if (!res.ok) throw new Error('Gagal mengekspor data pakan');

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
      setExporting(false);
    }
  };

  return (
    <div className="pt-16 sm:pt-20 pb-28 px-3.5 sm:px-4 space-y-3.5 sm:space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
            Manajemen Nutrisi & Logistik Pakan
          </span>
          <h1 className="font-jakarta font-bold text-xl text-slate-900">
            Pembagian Pakan
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 disabled:opacity-50 transition-all"
            title="Download Spreadsheet Pakan"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{exporting ? 'Exporting...' : 'Export'}</span>
          </button>

          <Link
            href="/pakan/input"
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Input Pakan</span>
          </Link>
        </div>
      </div>

      {/* Multi-Branch Filter Tabs - ONLY FOR ADMIN */}
      {currentUser && currentUser.role === 'PENGAWAS' ? (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
          <span className="font-bold text-amber-900">📍 {currentUser.branchName}</span>
          <span className="text-[11px] text-amber-700 font-semibold">{feedItems.length} Unit Alokasi</span>
        </div>
      ) : (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0 pb-0.5">
          <button
            onClick={() => handleSelectBranch('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              activeBranch === 'all'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Semua Cabang (52 Kandang)
          </button>
          {branches.slice(0, 3).map((b) => (
            <button
              key={b.id}
              onClick={() => handleSelectBranch(b.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                activeBranch === b.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {b.shortName} ({b.totalCages})
            </button>
          ))}
        </div>
      )}

      {/* KPI Feed Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">
            Total Kebutuhan
          </span>
          <strong className="font-jakarta font-extrabold text-lg text-amber-700 block mt-0.5">
            {summary.totalKg.toLocaleString('id-ID', { minimumFractionDigits: 1 })} KG
          </strong>
          <span className="text-[10px] text-slate-500">Estimasi harian</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">
            Alokasi Pengiriman
          </span>
          <strong className="font-jakarta font-extrabold text-lg text-emerald-700 block mt-0.5">
            {summary.totalSak} SAK
          </strong>
          <span className="text-[10px] text-slate-500">{summary.totalKirimKg.toLocaleString('id-ID', { minimumFractionDigits: 1 })} kg bersih</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">
            Konsumsi / Ekor
          </span>
          <strong className="font-jakarta font-extrabold text-lg text-slate-800 block mt-0.5">
            {summary.avgKonsumsi} g
          </strong>
          <span className="text-[10px] text-slate-500">Target 123-125g</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">
            Populasi Terlayani
          </span>
          <strong className="font-jakarta font-extrabold text-lg text-[#0284c7] block mt-0.5">
            {summary.totalPop.toLocaleString('id-ID')}
          </strong>
          <span className="text-[10px] text-slate-500">{summary.totalCages} unit kandang</span>
        </div>
      </div>

      {/* Search & Actions Ribbon */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kandang atau jenis pakan..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 shadow-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Feed Distribution Table Card */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-jakarta font-bold text-sm text-slate-900">
              Tabel Alokasi Pakan ({filteredItems.length} Kandang)
            </h3>
            <p className="text-[11px] text-slate-400">
              {currentBranchObj ? currentBranchObj.name : 'Konsolidasi Seluruh Cabang Peternakan'}
            </p>
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.XLSX</span>
          </button>
        </div>

        {/* Modular Feed Distribution Table */}
        <FeedDistributionTable
          items={filteredItems}
          summary={summary}
        />
      </div>

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
          <p className="font-bold text-xs sm:text-sm">Berhasil!</p>
          <p className="text-[11px] text-slate-300">{toastMessage}</p>
        </div>
      </div>
    </div>
  );
}
