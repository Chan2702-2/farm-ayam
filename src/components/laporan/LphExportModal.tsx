'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface LphExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchName?: string;
  totalCages: number;
  totalProduksi: number;
  initialDate?: string;
}

export function LphExportModal({
  isOpen,
  onClose,
  branchName = 'Cabang 3 Alur',
  totalCages,
  totalProduksi,
  initialDate,
}: LphExportModalProps) {
  const [selectedDate, setSelectedDate] = useState(
    () => initialDate || new Date().toISOString().split('T')[0]
  );
  const [exporting, setExporting] = useState(false);

  const handleDownload = async () => {
    try {
      setExporting(true);
      const res = await fetch(`/api/export/lph?date=${selectedDate}`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LPH_Yuki_Farm_${selectedDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      onClose();
    } catch (e) {
      alert('Gagal mengunduh file Excel: ' + (e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Laporan Excel (LPH)"
      subtitle="Format Resmi Spreadsheet Yuki Farm"
    >
      <div className="space-y-3.5">
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-jakarta font-bold text-emerald-950 text-xs sm:text-sm">
              Master Template LPH 3 Alur
            </h4>
            <p className="text-[11px] text-emerald-700">
              Formula kalkulasi total, rasio ACT%, dan susunan kolom 100% identik.
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
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-xs sm:text-sm text-slate-800 outline-none focus:border-[#0284c7] focus:bg-white"
          />
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl space-y-1 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Cabang:</span>
            <strong className="text-slate-800">{branchName}</strong>
          </div>
          <div className="flex justify-between">
            <span>Jumlah Kandang:</span>
            <strong className="text-slate-800">{totalCages} Kandang</strong>
          </div>
          <div className="flex justify-between">
            <span>Total Produksi:</span>
            <strong className="text-slate-800">{totalProduksi.toLocaleString('id-ID')} Butir</strong>
          </div>
          <div className="flex justify-between">
            <span>File Name:</span>
            <span className="font-mono text-[10px] text-slate-700">LPH_Yuki_Farm_{selectedDate}.xlsx</span>
          </div>
        </div>

        <div className="pt-1 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
          >
            Batal
          </button>
          <button
            onClick={handleDownload}
            disabled={exporting}
            className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-70"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Mengunduh...' : 'Unduh Excel'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
