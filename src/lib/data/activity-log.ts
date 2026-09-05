// Activity Log / Audit Trail System for Yuki Farm
// Records user actions per branch: Pengawas A (3 Alur), Pengawas B (B. Rupi), Admin

export type LogActionType =
  | 'PRODUKSI'
  | 'PAKAN'
  | 'MORTALITAS'
  | 'MUTASI'
  | 'TIMBANG_BERAT'
  | 'MEDIKASI_VAKSIN'
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

export const initialActivityLogs: ActivityLogItem[] = [];

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
  else if (entry.actionType === 'MUTASI') badgeColor = 'purple';
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
