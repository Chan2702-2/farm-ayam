'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  X
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { FarmCageData, saveFarmCages, getFarmCages, setActiveBranchId } from '@/lib/data/farm-data';

interface LphImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (importedCount: number) => void;
}

export function LphImportModal({
  isOpen,
  onClose,
  onSuccess,
}: LphImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<{
    dateTitle: string;
    branchName: string;
    branchId: string;
    totalCages: number;
    totalProduksi: number;
    totalPopulasi: number;
    avgAct: number;
    cages: FarmCageData[];
  } | null>(null);

  const handleReset = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    setParsedResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setErrorMessage('Format file harus berupa spreadsheet Excel (.xlsx atau .xls)');
        setSelectedFile(null);
        return;
      }
      setErrorMessage(null);
      setSelectedFile(file);
      setParsedResult(null);
    }
  };

  const handleAnalyzeFile = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/import/lph', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal memproses file spreadsheet');
      }

      setParsedResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat membaca file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyData = () => {
    if (!parsedResult || !parsedResult.cages) return;

    try {
      // Merge with existing farm data
      const existingAll = getFarmCages('all');
      const importedIds = new Set(parsedResult.cages.map((c) => c.fullName));

      // Keep cages from other branches or names not overwritten
      const remaining = existingAll.filter(
        (c) => c.branchId !== parsedResult.branchId && !importedIds.has(c.fullName)
      );

      const updated = [...parsedResult.cages, ...remaining];
      saveFarmCages(updated);

      // Set active branch to detected branch
      setActiveBranchId(parsedResult.branchId);

      if (onSuccess) {
        onSuccess(parsedResult.cages.length);
      }

      handleReset();
      onClose();
    } catch (err: any) {
      setErrorMessage('Gagal menyimpan data ke sistem: ' + err.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="Import Laporan Excel (LPH)"
      subtitle="Sinkronisasi data 19 unit kandang langsung dari file master"
    >
      <div className="space-y-3.5">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div className="min-w-0 flex-1">
              <strong className="block font-bold">Gagal Memproses Excel</strong>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {!parsedResult ? (
          // STEP 1: FILE PICKER & DROPZONE
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-[0.99] ${
                selectedFile
                  ? 'border-[#0284c7] bg-sky-50/50'
                  : 'border-slate-200 hover:border-sky-300 bg-slate-50/60'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-[#0284c7] flex items-center justify-center mb-2 shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h4 className="font-jakarta font-bold text-sm text-slate-800">
                {selectedFile ? selectedFile.name : 'Pilih File Excel LPH'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB • Siap diproses`
                  : 'Ketuk untuk browse file (.xlsx / .xls)'}
              </p>
            </div>

            {selectedFile && (
              <button
                onClick={handleAnalyzeFile}
                disabled={isUploading}
                className="w-full h-12 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-sky-600/25 disabled:opacity-60 transition-all"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menganalisis Kolom & Formula Excel...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Upload & Ekstrak Data Kandang</span>
                  </>
                )}
              </button>
            )}

            {/* Template Reference helper */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Butuh contoh format master?</span>
              </div>
              <a
                href="/api/export/lph?date=2026-09-03"
                download="Template_LPH_Master.xlsx"
                className="text-xs font-bold text-[#0284c7] hover:underline"
              >
                Unduh Template
              </a>
            </div>
          </div>
        ) : (
          // STEP 2: PREVIEW PARSED RESULT
          <div className="space-y-3">
            {/* Header info */}
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-jakarta font-bold text-emerald-950 text-xs sm:text-sm">
                  Format LPH Terverifikasi
                </h4>
                <p className="text-[11px] text-emerald-700 truncate">
                  {parsedResult.dateTitle} &bull; {parsedResult.branchName}
                </p>
              </div>
            </div>

            {/* Metrics Quick Strip */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Kandang</span>
                <strong className="text-slate-800 text-sm font-extrabold font-jakarta">
                  {parsedResult.totalCages}
                </strong>
                <span className="text-[10px] text-slate-500 block">Unit</span>
              </div>

              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Total Telur</span>
                <strong className="text-[#0284c7] text-sm font-extrabold font-jakarta">
                  {parsedResult.totalProduksi.toLocaleString('id-ID')}
                </strong>
                <span className="text-[10px] text-slate-500 block">Butir</span>
              </div>

              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Hen-Day</span>
                <strong className="text-emerald-700 text-sm font-extrabold font-jakarta">
                  {parsedResult.avgAct}%
                </strong>
                <span className="text-[10px] text-slate-500 block">ACT%</span>
              </div>
            </div>

            {/* Scrollable list of parsed cages */}
            <div className="space-y-1.5 max-h-[38vh] overflow-y-auto no-scrollbar pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                Preview Data Unit Kandang
              </span>
              {parsedResult.cages.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-2 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <strong className="block text-slate-800 truncate text-[11px]">
                      {c.fullName}
                    </strong>
                    <span className="text-[10px] text-slate-400">
                      Pop: {c.populasiHidup.toLocaleString('id-ID')} &bull; Pagi: {c.pagiIkat * 30} &bull; Sore: {c.soreIkat * 30}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <strong className="text-[#0369a1] text-[11px] block">
                      {c.totalProduksi.toLocaleString('id-ID')} btr
                    </strong>
                    <span className="text-[10px] font-bold text-emerald-700">
                      {c.actPercent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="pt-1 flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Ganti File
              </button>
              <button
                onClick={handleApplyData}
                className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/25 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan ke Sistem</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
