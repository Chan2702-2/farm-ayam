'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Cloud } from 'lucide-react';
import { isSyncNeeded, performAutoSync, getLastSyncTime } from '@/lib/sync/auto-sync';

export function SyncStatusBadge() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const updateStatus = () => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      setHasPending(isSyncNeeded());
      setLastSync(getLastSyncTime());
    }
  };

  useEffect(() => {
    updateStatus();

    const handleSyncState = (e: any) => {
      const state = e.detail?.state;
      if (state === 'syncing') {
        setIsSyncing(true);
      } else {
        setIsSyncing(false);
        updateStatus();
      }
    };

    const handleNetworkChange = () => {
      updateStatus();
    };

    window.addEventListener('syncStateChange', handleSyncState);
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    return () => {
      window.removeEventListener('syncStateChange', handleSyncState);
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, []);

  const handleClick = () => {
    if (isOnline) {
      performAutoSync(true);
    } else {
      alert('Perangkat Anda sedang Offline.\nSemua data yang Anda input tetap aman tersimpan di HP dan akan otomatis dikirim saat terhubung internet kembali.');
    }
  };

  if (!isOnline) {
    return (
      <button
        onClick={handleClick}
        title="Perangkat Offline - Data tersimpan lokal di HP"
        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold shadow-2xs hover:bg-amber-100 transition-colors"
      >
        <WifiOff className="w-3 h-3 text-amber-600 shrink-0" />
        <span className="truncate max-w-[75px] sm:max-w-none">Offline (Aman)</span>
      </button>
    );
  }

  if (isSyncing) {
    return (
      <div
        title="Sedang menyinkronkan data ke Google Spreadsheet di background"
        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold shadow-2xs animate-pulse"
      >
        <RefreshCw className="w-3 h-3 text-sky-600 animate-spin shrink-0" />
        <span className="truncate max-w-[75px] sm:max-w-none">Sinkron...</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      title={hasPending ? 'Ada perubahan data belum tersinkron (Ketuk untuk kirim)' : `Tersinkron otomatis${lastSync ? ` (${lastSync})` : ''}`}
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold shadow-2xs transition-colors ${
        hasPending
          ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
      }`}
    >
      {hasPending ? (
        <>
          <Cloud className="w-3 h-3 text-amber-600 shrink-0" />
          <span className="truncate max-w-[75px] sm:max-w-none">Perlu Sync</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="truncate max-w-[75px] sm:max-w-none">Auto-Sync</span>
        </>
      )}
    </button>
  );
}
