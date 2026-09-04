'use client';

import {
  getFarmBranches,
  saveFarmBranches,
  getFarmCages,
  saveFarmCages,
  getFeedDistribution,
  saveFeedDistribution,
  getActiveBranchId,
  setActiveBranchId,
} from '@/lib/data/farm-data';
import { getAuthUsers, getCurrentUser } from '@/lib/data/auth-users';

const NEED_SYNC_KEY = 'yuki_needs_sync';
const LAST_SYNC_KEY = 'yuki_last_sync_time';
const QUEUE_KEY = 'yuki_pending_queue';

export interface PendingSyncAction {
  id: string;
  type: 'produksi' | 'pakan' | 'populasi' | 'master';
  url: string;
  payload: any;
  timestamp: number;
}

export type SyncState = 'idle' | 'syncing' | 'synced' | 'offline' | 'error' | 'pending';

let isSyncInProgress = false;

/**
 * Mendapatkan antrean sinkronisasi tunda
 */
export function getPendingQueue(): PendingSyncAction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Menyimpan antrean ke local storage
 */
export function savePendingQueue(queue: PendingSyncAction[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Menambahkan aksi ke antrean sinkronisasi (saat offline atau gagal kirim)
 */
export function enqueuePendingSync(action: Omit<PendingSyncAction, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  const queue = getPendingQueue();
  const newItem: PendingSyncAction = {
    ...action,
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };
  queue.push(newItem);
  savePendingQueue(queue);
  markDataDirty();
}

/**
 * Tandai bahwa ada data baru yang dibuat atau diubah (produksi, pakan, populasi, cabang, kandang).
 */
export function markDataDirty(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(NEED_SYNC_KEY, '1');
    localStorage.setItem('yuki_last_dirty_time', Date.now().toString());
    window.dispatchEvent(new Event('syncStateChange'));
  }
}

/**
 * Periksa apakah ada data yang belum tersinkronisasi
 */
export function isSyncNeeded(): boolean {
  if (typeof window === 'undefined') return false;
  if (localStorage.getItem(NEED_SYNC_KEY) === '1') return true;
  return getPendingQueue().length > 0;
}

/**
 * Dapatkan waktu sinkronisasi terakhir
 */
export function getLastSyncTime(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(LAST_SYNC_KEY);
  if (!raw) return null;
  try {
    const d = new Date(parseInt(raw, 10));
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d);
  } catch {
    return null;
  }
}

/**
 * Tarik data terbaru dari Google Sheets ke memori browser / laptop.
 * Menjamin saat login di laptop, seluruh cabang dan kandang yang di-input di HP langsung tampil!
 */
let lastPullTime = 0;
const PULL_COOLDOWN_MS = 15000; // Cooldown 15 detik untuk menghemat kuota Google Sheets API

export async function pullDataFromSheets(force: boolean = false): Promise<{
  success: boolean;
  branchesCount?: number;
  cagesCount?: number;
  message?: string;
}> {
  if (typeof window === 'undefined') {
    return { success: false, message: 'ssr' };
  }

  if (!navigator.onLine) {
    return { success: false, message: 'offline' };
  }

  const now = Date.now();
  if (!force && now - lastPullTime < PULL_COOLDOWN_MS) {
    return { success: true, message: 'throttled' };
  }
  lastPullTime = now;

  try {
    console.log('[AutoSync] Menarik data terbaru dari Google Sheets ke perangkat ini...');
    const res = await fetch('/api/sheets/pull', { cache: 'no-store' });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal mengambil data dari Google Sheets');
    }

    const { branches = [], cages = [], feedItems = [] } = data;
    let updated = false;

    // 1. Simpan Cabang dari Google Sheets jika ada
    if (Array.isArray(branches) && branches.length > 0) {
      saveFarmBranches(branches);
      const active = getActiveBranchId();
      // Hanya ganti activeBranch jika activeBranch tidak valid
      if (active && active !== 'all' && !branches.some((b: any) => b.id === active)) {
        setActiveBranchId('all');
      }
      updated = true;
    }

    // 2. Simpan Kandang dari Google Sheets jika ada
    if (Array.isArray(cages)) {
      saveFarmCages(cages);
      updated = true;
    }

    // 3. Simpan Distribusi Pakan jika ada
    if (Array.isArray(feedItems) && feedItems.length > 0) {
      saveFeedDistribution(feedItems);
      updated = true;
    }

    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

    if (updated) {
      window.dispatchEvent(new Event('branchChange'));
      window.dispatchEvent(new Event('feedChange'));
    }

    window.dispatchEvent(new CustomEvent('syncStateChange', { detail: { state: 'synced' } }));
    console.log(
      `[AutoSync] Sukses memuat ${branches.length} cabang & ${cages.length} kandang dari Google Sheets.`
    );

    return {
      success: true,
      branchesCount: branches.length,
      cagesCount: cages.length,
    };
  } catch (err: any) {
    console.warn('[AutoSync] Gagal menarik data dari Google Sheets:', err.message);
    return { success: false, message: err.message };
  }
}

/**
 * Melakukan sinkronisasi otomatis ke Google Sheets (Dua Arah / Bidirectional).
 * - Jika offline: data tetap tersimpan aman di HP, tandai status offline.
 * - Jika online:
 *   1. Jika laptop/perangkat belum punya cabang/kandang, otomatis tarik dari spreadsheet!
 *   2. Flush antrean tunda lokal (jika ada data yang diinput saat offline).
 *   3. Update Master ke Spreadsheet jika ada cabang lokal.
 *   4. Tarik update terbaru agar perangkat selalu sinkron dengan perangkat lain.
 */
export async function performAutoSync(force: boolean = false): Promise<{ success: boolean; reason?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, reason: 'ssr' };
  }

  // Jika sedang sinkronisasi, hindari pemanggilan ganda
  if (isSyncInProgress) {
    return { success: false, reason: 'already_running' };
  }

  // Jika OFFLINE: simpan status offline dan tunda pengiriman
  if (!navigator.onLine) {
    markDataDirty();
    window.dispatchEvent(new CustomEvent('syncStateChange', { detail: { state: 'offline' } }));
    console.log('[AutoSync] Perangkat sedang Offline. Data tersimpan aman di HP.');
    return { success: false, reason: 'offline' };
  }

  const localBranches = getFarmBranches();
  const localCages = getFarmCages('all');

  // KASUS LAPTOP / PERANGKAT BARU:
  // Jika cabang/kandang masih 0 di perangkat ini, langsung tarik data dari Google Sheets!
  if (localBranches.length === 0 || localCages.length === 0) {
    isSyncInProgress = true;
    window.dispatchEvent(new CustomEvent('syncStateChange', { detail: { state: 'syncing' } }));
    try {
      const pullRes = await pullDataFromSheets();
      return { success: pullRes.success };
    } finally {
      isSyncInProgress = false;
    }
  }

  // Jika tidak dipaksa dan tidak ada data yang perlu dikirim:
  // Tarik data terbaru dari spreadsheet di background agar selalu sinkron dengan perangkat lain
  if (!force && !isSyncNeeded()) {
    pullDataFromSheets();
    return { success: true, reason: 'no_changes' };
  }

  isSyncInProgress = true;
  window.dispatchEvent(new CustomEvent('syncStateChange', { detail: { state: 'syncing' } }));

  try {
    const queue = getPendingQueue();
    const remainingQueue: PendingSyncAction[] = [];

    // 1. Flush antrean yang tertunda jika ada
    for (const item of queue) {
      try {
        const res = await fetch(item.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch (itemErr) {
        console.warn(`[AutoSync] Gagal flush item ${item.type}:`, itemErr);
        remainingQueue.push(item);
      }
    }

    savePendingQueue(remainingQueue);

    // 2. Tarik data terbaru dari Google Sheets untuk memastikan sinkronisasi dengan perangkat lain
    await pullDataFromSheets();

    // Jika semua antrean berhasil diproses
    if (remainingQueue.length === 0) {
      localStorage.removeItem(NEED_SYNC_KEY);
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      window.dispatchEvent(new CustomEvent('syncStateChange', { detail: { state: 'synced' } }));
      console.log('[AutoSync] Sukses sinkronisasi otomatis dua arah.');
      return { success: true };
    } else {
      markDataDirty();
      window.dispatchEvent(new CustomEvent('syncStateChange', { detail: { state: 'pending' } }));
      return { success: false, reason: 'partial_queue_remaining' };
    }
  } catch (err: any) {
    console.warn('[AutoSync] Gagal sinkronisasi ke Google Sheets:', err.message);
    markDataDirty();
    window.dispatchEvent(new CustomEvent('syncStateChange', { detail: { state: 'error' } }));
    return { success: false, reason: err.message };
  } finally {
    isSyncInProgress = false;
  }
}

/**
 * Inisialisasi pendengar jaringan online/offline dan tab resume
 */
export function initAutoSyncListeners(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => {
    console.log('[AutoSync] Perangkat kembali Online. Memulai sinkronisasi otomatis...');
    performAutoSync(true);
  };

  const handleOffline = () => {
    window.dispatchEvent(new CustomEvent('syncStateChange', { detail: { state: 'offline' } }));
  };

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      // Saat tab atau browser dibuka kembali
      if (navigator.onLine) {
        performAutoSync();
      }
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}
