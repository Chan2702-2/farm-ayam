'use client';

import { getFarmBranches, getFarmCages, getFeedDistribution } from '@/lib/data/farm-data';
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
 * Melakukan sinkronisasi otomatis ke Google Sheets.
 * Skema:
 * - Jika offline: data tetap tersimpan aman di HP, tandai status offline.
 * - Jika online:
 *   1. Flush semua antrean tunda (produksi, pakan, mortalitas/populasi).
 *   2. Jalankan syncMaster untuk tab Master Cabang, Master Kandang, Master Pengguna.
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

  // Jika tidak dipaksa dan tidak ada data yang perlu disinkronkan, lewati
  if (!force && !isSyncNeeded()) {
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

    // 2. Sinkronkan Master Data ke Google Sheets (Cabang, Kandang dengan populasi & umur terbaru, User)
    const branches = getFarmBranches();
    const cages = getFarmCages('all');
    const users = getAuthUsers();
    const user = getCurrentUser();

    const masterRes = await fetch('/api/sheets/sync-master', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branches,
        cages,
        users,
        userName: user?.name || 'AutoSync Sistem',
      }),
    });

    if (!masterRes.ok) {
      const errData = await masterRes.json().catch(() => ({}));
      throw new Error(errData.message || 'Gagal sinkronisasi master data ke Spreadsheet');
    }

    // Jika semua antrean berhasil diproses
    if (remainingQueue.length === 0) {
      localStorage.removeItem(NEED_SYNC_KEY);
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      window.dispatchEvent(new CustomEvent('syncStateChange', { detail: { state: 'synced' } }));
      console.log('[AutoSync] Sukses sinkronisasi otomatis ke Google Spreadsheet.');
      return { success: true };
    } else {
      markDataDirty();
      window.dispatchEvent(new CustomEvent('syncStateChange', { detail: { state: 'pending' } }));
      return { success: false, reason: 'partial_queue_remaining' };
    }
  } catch (err: any) {
    console.warn('[AutoSync] Gagal mengirim data ke Google Sheets:', err.message);
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
    console.log('[AutoSync] Perangkat kembali Online. Memulai sinkronisasi data tunda...');
    performAutoSync(true);
  };

  const handleOffline = () => {
    window.dispatchEvent(new CustomEvent('syncStateChange', { detail: { state: 'offline' } }));
  };

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      // Saat pengguna membuka kembali browser atau ponsel
      if (isSyncNeeded() && navigator.onLine) {
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
