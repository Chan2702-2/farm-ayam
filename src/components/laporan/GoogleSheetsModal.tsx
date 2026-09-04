'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  UploadCloud,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { FarmCageData, FeedDistributionItem, getFarmBranches } from '@/lib/data/farm-data';
import { getCurrentUser, getAuthUsers } from '@/lib/data/auth-users';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cages: FarmCageData[];
  feedItems: FeedDistributionItem[];
  selectedDate: string;
  onSuccessToast?: (msg: string) => void;
}

interface StatusResult {
  configured: boolean;
  connected: boolean;
  title?: string;
  spreadsheetId?: string;
  sheets?: string[];
  message: string;
}

export function GoogleSheetsModal({
  isOpen,
  onClose,
  cages,
  feedItems,
  selectedDate,
  onSuccessToast,
}: GoogleSheetsModalProps) {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<StatusResult | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoadingStatus(true);
    setSyncError(null);
    try {
      const res = await fetch('/api/sheets/status');
      const data = await res.json();
      setStatus(data);
    } catch (e: any) {
      setStatus({
        configured: false,
        connected: false,
        message: e.message || 'Gagal menghubungi endpoint status.',
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      setSyncResult(null);
      setSyncError(null);
    }
  }, [isOpen]);

  const handlePushAll = async () => {
    if (!status?.connected) return;
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);

    try {
      const user = getCurrentUser();
      const branches = getFarmBranches();
      const users = getAuthUsers();

      const res = await fetch('/api/sheets/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branches,
          cages,
          users,
          feedItems,
          tanggal: selectedDate,
          userName: user?.name || 'Pengguna Yuki Farm',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal sinkronisasi ke Google Sheets.');
      }

      setSyncResult(
        `Sukses kirim ${data.cabangCount || 0} cabang, ${data.kandangCount || 0} kandang, ${data.usersCount || 0} user, ${data.produksiCount || 0} produksi & ${data.pakanCount || 0} pakan ke Spreadsheet!`
      );
      if (onSuccessToast) {
        onSuccessToast('Seluruh data berhasil disinkronisasi ke Google Sheets!');
      }
      checkStatus();
    } catch (e: any) {
      setSyncError(e.message || 'Terjadi kesalahan saat sinkronisasi.');
    } finally {
      setSyncing(false);
    }
  };

  const handlePushMaster = async () => {
    if (!status?.connected) return;
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);

    try {
      const user = getCurrentUser();
      const branches = getFarmBranches();
      const users = getAuthUsers();

      const res = await fetch('/api/sheets/sync-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branches,
          cages,
          users,
          userName: user?.name || 'Pengguna Yuki Farm',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal sinkronisasi master data ke Google Sheets.');
      }

      setSyncResult(
        `Sukses sinkronisasi Master Data: ${data.result?.branchesSynced || 0} cabang, ${data.result?.cagesSynced || 0} kandang, dan ${data.result?.usersSynced || 0} akun pengguna!`
      );
      if (onSuccessToast) {
        onSuccessToast('Master Data (Cabang, Kandang, Pengguna) berhasil disinkronisasi!');
      }
      checkStatus();
    } catch (e: any) {
      setSyncError(e.message || 'Terjadi kesalahan saat sinkronisasi master data.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Integrasi Google Spreadsheet"
      subtitle="Sinkronisasi data produksi & pakan Yuki Farm ke Google Drive"
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {/* Connection Status Card */}
        <div
          className={`p-3.5 rounded-xl border ${
            status?.connected
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
              : status?.configured
              ? 'bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300'
              : 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-300'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  status?.connected
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">
                  {status?.connected
                    ? 'Terhubung ke Google Drive'
                    : status?.configured
                    ? 'Koneksi Bermasalah'
                    : 'Belum Terkonfigurasi'}
                </h4>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {loadingStatus
                    ? 'Memeriksa kredensial...'
                    : status?.title || status?.message}
                </p>
              </div>
            </div>

            <button
              onClick={checkStatus}
              disabled={loadingStatus}
              title="Periksa Ulang"
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          {status?.connected && status.spreadsheetId && (
            <div className="mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-[11px]">
              <span className="truncate text-slate-500 dark:text-slate-400">
                File: <strong className="text-emerald-800 dark:text-emerald-300">{status.title || 'db-farm'}</strong>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ID: {status.spreadsheetId.slice(0, 12)}...
              </span>
            </div>
          )}
        </div>

        {/* Existing Sheets / Tabs Info */}
        {status?.connected && status.sheets && (
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 mb-2">
              <Layers className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Tab di Spreadsheet
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {status.sheets.map((sheetName) => (
                <span
                  key={sheetName}
                  className="px-2 py-0.5 text-[10px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300"
                >
                  {sheetName}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Setup Helper if NOT configured */}
        {!status?.connected && !loadingStatus && (
          <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl text-sky-950 dark:bg-sky-950/30 dark:border-sky-800 dark:text-sky-300 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-sky-800 dark:text-sky-300">
              <HelpCircle className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Cara Konfigurasi (Vercel / Local)</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              Tambahkan variabel berikut di dashboard <b>Vercel Settings → Environment Variables</b> (atau di <code>.env.local</code>):
            </p>
            <div className="bg-white/80 dark:bg-slate-900/90 rounded-lg p-2 font-mono text-[10px] space-y-1 select-all border border-sky-100 dark:border-slate-800">
              <div>GOOGLE_CLIENT_EMAIL=...</div>
              <div>GOOGLE_PRIVATE_KEY=...</div>
              <div>GOOGLE_SHEET_ID=...</div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
              *Pastikan file Google Sheet Anda telah di-share ke <b>GOOGLE_CLIENT_EMAIL</b> sebagai Editor.
            </p>
          </div>
        )}

        {/* Sync Success / Error Notification */}
        {syncResult && (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncResult}</span>
          </div>
        )}

        {syncError && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{syncError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={handlePushAll}
            disabled={!status?.connected || syncing}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menyinkronkan ke Spreadsheet...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Kirim Semua Data Harian & Master ke Sheets</span>
              </>
            )}
          </button>

          <button
            onClick={handlePushMaster}
            disabled={!status?.connected || syncing}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sinkronkan Master Data (Cabang, Kandang, Pengguna)</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}
