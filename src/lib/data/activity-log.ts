// Activity Log / Audit Trail System for Yuki Farm
// Records user actions per branch: Pengawas A (3 Alur), Pengawas B (B. Rupi), Admin

export type LogActionType =
  | 'PRODUKSI'
  | 'PAKAN'
  | 'MORTALITAS'
  | 'IMPORT_EXCEL'
  | 'EXPORT_EXCEL'
  | 'LOGIN';

export interface ActivityLogItem {
  id: string;
  timestamp: string; // ISO String
  timeFormatted: string; // e.g. "03 Sep, 07:45 WIB"
  userId: string;
  userName: string;
  userRole: string;
  branchId: string;
  branchName: string;
  actionType: LogActionType;
  title: string;
  description: string;
  badgeColor?: string;
}

export const initialActivityLogs: ActivityLogItem[] = [
  {
    id: 'log-1',
    timestamp: '2026-09-03T08:15:00.000Z',
    timeFormatted: '03 Sep 2026, 08:15 WIB',
    userId: 'user-pengawas-a',
    userName: 'Pengawas A',
    userRole: 'PENGAWAS',
    branchId: 'branch-1',
    branchName: 'Cabang 3 Alur (Pusat)',
    actionType: 'PRODUKSI',
    title: 'Input Panen Telur Pagi',
    description: 'Mencatat panen pagi 110 ikat (3.300 butir) untuk Kandang 1. Kawat.',
    badgeColor: 'sky',
  },
  {
    id: 'log-2',
    timestamp: '2026-09-03T08:30:00.000Z',
    timeFormatted: '03 Sep 2026, 08:30 WIB',
    userId: 'user-pengawas-a',
    userName: 'Pengawas A',
    userRole: 'PENGAWAS',
    branchId: 'branch-1',
    branchName: 'Cabang 3 Alur (Pusat)',
    actionType: 'PAKAN',
    title: 'Distribusi Pakan Harian',
    description: 'Mengalokasikan 10 sak (500 kg) pakan Layer untuk Kandang 1. Kawat (4.065 ekor).',
    badgeColor: 'amber',
  },
  {
    id: 'log-3',
    timestamp: '2026-09-03T08:45:00.000Z',
    timeFormatted: '03 Sep 2026, 08:45 WIB',
    userId: 'user-pengawas-b',
    userName: 'Pengawas B',
    userRole: 'PENGAWAS',
    branchId: 'branch-2',
    branchName: 'Cabang Balai Rupih',
    actionType: 'PAKAN',
    title: 'Kalkulasi Pakan Spesial Blok A',
    description: 'Mencatat kebutuhan pakan 77.4 kg (1 sak + 27.4 kg) untuk LOS A1 (619 ekor).',
    badgeColor: 'amber',
  },
  {
    id: 'log-4',
    timestamp: '2026-09-03T09:10:00.000Z',
    timeFormatted: '03 Sep 2026, 09:10 WIB',
    userId: 'user-pengawas-b',
    userName: 'Pengawas B',
    userRole: 'PENGAWAS',
    branchId: 'branch-2',
    branchName: 'Cabang Balai Rupih',
    actionType: 'PRODUKSI',
    title: 'Pencatatan Telur Blok B',
    description: 'Mencatat panen pagi 38 ikat (1.140 butir) untuk LOS B1 (1.593 ekor).',
    badgeColor: 'sky',
  },
  {
    id: 'log-5',
    timestamp: '2026-09-03T09:30:00.000Z',
    timeFormatted: '03 Sep 2026, 09:30 WIB',
    userId: 'user-pengawas-a',
    userName: 'Pengawas A',
    userRole: 'PENGAWAS',
    branchId: 'branch-1',
    branchName: 'Cabang 3 Alur (Pusat)',
    actionType: 'IMPORT_EXCEL',
    title: 'Sinkronisasi File Master LPH',
    description: 'Berhasil mengimpor 19 kandang dari spreadsheet LPH 3 ALUR 3-9-26.xlsx.',
    badgeColor: 'emerald',
  },
  {
    id: 'log-6',
    timestamp: '2026-09-03T10:00:00.000Z',
    timeFormatted: '03 Sep 2026, 10:00 WIB',
    userId: 'user-admin',
    userName: 'Admin Pusat',
    userRole: 'ADMIN',
    branchId: 'all',
    branchName: 'Konsolidasi Seluruh Cabang',
    actionType: 'EXPORT_EXCEL',
    title: 'Export Rekapitulasi LPH Global',
    description: 'Mengunduh file spreadsheet gabungan LPH 5 Cabang Peternakan.',
    badgeColor: 'emerald',
  },
];

export function getActivityLogs(branchId?: string, userRole?: string): ActivityLogItem[] {
  let list = initialActivityLogs;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('yuki_activity_logs');
    if (saved) {
      try {
        list = JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing activity logs', e);
      }
    }
  }

  // If user is pengawas of a specific branch, only show logs for that branch
  if (userRole === 'PENGAWAS' && branchId && branchId !== 'all') {
    return list.filter((item) => item.branchId === branchId);
  }

  // If admin filtered by branch
  if (branchId && branchId !== 'all') {
    return list.filter((item) => item.branchId === branchId || item.branchId === 'all');
  }

  return list;
}

export function addActivityLog(entry: {
  userName: string;
  userRole: string;
  branchId: string;
  branchName: string;
  actionType: LogActionType;
  title: string;
  description: string;
}): void {
  if (typeof window === 'undefined') return;

  const current = getActivityLogs('all');
  const now = new Date();
  const timeFormatted = `${now.getDate()} Sep ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

  let badgeColor = 'sky';
  if (entry.actionType === 'PAKAN') badgeColor = 'amber';
  else if (entry.actionType === 'MORTALITAS') badgeColor = 'red';
  else if (entry.actionType.includes('EXCEL')) badgeColor = 'emerald';

  const newItem: ActivityLogItem = {
    id: `log-${Date.now()}`,
    timestamp: now.toISOString(),
    timeFormatted,
    userId: `user-${entry.userName.toLowerCase().replace(/\s+/g, '-')}`,
    userName: entry.userName,
    userRole: entry.userRole,
    branchId: entry.branchId,
    branchName: entry.branchName,
    actionType: entry.actionType,
    title: entry.title,
    description: entry.description,
    badgeColor,
  };

  const updated = [newItem, ...current];
  localStorage.setItem('yuki_activity_logs', JSON.stringify(updated));
  window.dispatchEvent(new Event('logChange'));
}
