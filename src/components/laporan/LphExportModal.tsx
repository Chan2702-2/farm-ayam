'use client';

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, CheckCircle, Layers, Building2, Calendar } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  getFarmBranches,
  getFarmCages,
  getFeedDistribution,
  getAllDailyEggProductions,
  FarmBranch,
} from '@/lib/data/farm-data';
import { getCurrentUser } from '@/lib/data/auth-users';

interface LphExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchName?: string;
  branchId?: string;
  totalCages?: number;
  totalProduksi?: number;
  initialDate?: string;
}

export function LphExportModal({
  isOpen,
  onClose,
  branchName,
  branchId = 'all',
  totalCages,
  totalProduksi,
  initialDate,
}: LphExportModalProps) {
  const [selectedDate, setSelectedDate] = useState(
    () => initialDate || new Date().toISOString().split('T')[0]
  );
  const [branches, setBranches] = useState<FarmBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(branchId || 'all');
  const [exportScope, setExportScope] = useState<'all' | 'single'>(
    branchId && branchId !== 'all' ? 'single' : 'all'
  );
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const brs = getFarmBranches();
      setBranches(brs);
      const user = getCurrentUser();
      if (user && user.role === 'PENGAWAS') {
        setSelectedBranch(user.branchId);
        setExportScope('single');
      } else if (branchId && branchId !== 'all') {
        setSelectedBranch(branchId);
        setExportScope('single');
      } else {
        setSelectedBranch('all');
        setExportScope('all');
      }
    }
  }, [isOpen, branchId]);

  const effectiveBranchId = exportScope === 'all' ? 'all' : selectedBranch;
  const currentBranchObj = branches.find((b) => b.id === selectedBranch);

  const cleanBranchLabel =
    exportScope === 'all'
      ? 'KESELURUHAN'
      : (currentBranchObj?.shortName || currentBranchObj?.name || 'CABANG')
          .toUpperCase()
          .replace(/\s+/g, '_');

  const fileName = `REKAP_LPH_${cleanBranchLabel}_${selectedDate}.xlsx`;

  const handleDownload = async () => {
    try {
      setExporting(true);

      const allCages = getFarmCages('all');
      const allBranches = getFarmBranches();
      const allFeed = getFeedDistribution('all');
      const allDailyProd = getAllDailyEggProductions();
      const user = getCurrentUser();

      const payload = {
        date: selectedDate,
        branch: effectiveBranchId,
        cages: allCages,
        branches: allBranches,
        feedItems: allFeed,
        dailyProductions: allDailyProd,
        supervisorName: user?.name || 'Pengawas',
      };

      const res = await fetch('/api/export/lph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Fallback to GET
        const getRes = await fetch(`/api/export/lph?date=${selectedDate}&branch=${effectiveBranchId}`);
        if (!getRes.ok) throw new Error('Gagal mendownload file Excel LPH');
        const blob = await getRes.blob();
        triggerBlobDownload(blob, fileName);
      } else {
        const blob = await res.blob();
        triggerBlobDownload(blob, fileName);
      }

      onClose();
    } catch (e: any) {
      alert('Gagal mengunduh file Excel: ' + (e?.message || 'Error'));
    } finally {
      setExporting(false);
    }
  };

  const triggerBlobDownload = (blob: Blob, name: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Rekap LPH (Excel)"
      subtitle="Format Resmi Template Percabang & Keseluruhan"
    >
      <div className="space-y-3.5">
        {/* Banner Template Notice */}
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-jakarta font-bold text-emerald-950 text-xs sm:text-sm flex items-center gap-1.5">
              <span>Master Rekap LPH Yuki Farm</span>
              <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-extrabold px-1.5 py-0.2 rounded-md">
                Excel Asli
              </span>
            </h4>
            <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
              Sesuai format resmi: formula perhitungan produksi, ACT%, umur, pakan, mortalitas, dan blok pengawas.
            </p>
          </div>
        </div>

        {/* Export Scope Selector (Keseluruhan vs Per Cabang) */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
            Pilih Cakupan Rekap
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setExportScope('all')}
              className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                exportScope === 'all'
                  ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                  : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                  exportScope === 'all'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-400 bg-white'
                }`}
              >
                {exportScope === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div className="min-w-0">
                <strong className="text-xs font-bold text-slate-900 block truncate">
                  Semua Cabang
                </strong>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  Multi-sheet: Sheet Keseluruhan + Sheet tiap cabang
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setExportScope('single');
                if (selectedBranch === 'all' && branches.length > 0) {
                  setSelectedBranch(branches[0].id);
                }
              }}
              className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                exportScope === 'single'
                  ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                  : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                  exportScope === 'single'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-400 bg-white'
                }`}
              >
                {exportScope === 'single' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div className="min-w-0">
                <strong className="text-xs font-bold text-slate-900 block truncate">
                  Per Cabang
                </strong>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  1 Sheet khusus untuk cabang yang dipilih
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Dropdown Cabang jika Per Cabang dipilih */}
        {exportScope === 'single' && (
          <div className="animate-in fade-in duration-200">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Pilih Cabang Farm
            </label>
            <div className="relative">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full h-11 px-3.5 pr-8 rounded-xl border border-slate-200 bg-white font-medium text-xs sm:text-sm text-slate-800 outline-none focus:border-emerald-600 appearance-none"
              >
                {branches.length > 0 ? (
                  branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="branch-1">Cabang 3 Alur (3 ALUR)</option>
                    <option value="branch-2">Cabang Balai Rupih (B RUPI)</option>
                    <option value="branch-3">Cabang Rosam (ROSAM)</option>
                  </>
                )}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}

        {/* Date Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
            Pilih Tanggal Laporan
          </label>
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-xs sm:text-sm text-slate-800 outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
          <div className="flex justify-between items-center">
            <span>Cakupan Sheet:</span>
            <strong className="text-slate-800">
              {exportScope === 'all' ? 'Keseluruhan + Semua Tab Cabang' : currentBranchObj?.name || 'Per Cabang'}
            </strong>
          </div>
          <div className="flex justify-between items-center">
            <span>Formula Excel:</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Formula Dinamis Aktif
            </span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
            <span>Nama File (.xlsx):</span>
            <span className="font-mono text-[11px] font-semibold text-slate-800 truncate max-w-[210px]" title={fileName}>
              {fileName}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-1 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={exporting}
            className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-70 active:scale-98 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Membuat File...' : 'Unduh Rekap LPH'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
