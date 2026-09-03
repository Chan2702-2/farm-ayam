// User Accounts & Role-Based Access Control for Yuki Farm
// Supports Admin & Cage-Specific Supervisors (Pengawas per Kandang)

import { FarmCageData, FeedDistributionItem } from './farm-data';

export type UserRole = 'ADMIN' | 'PENGAWAS';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string; // Plain demo passwords for farm operators
  name: string;
  role: UserRole;
  title: string;
  branchId: string;
  branchName: string;
  assignedCages: string[]; // List of cage names or ['all'] for admin
  avatarInitial: string;
}

export const initialUsers: AuthUser[] = [
  // 1. HEADQUARTERS ADMIN / OWNER
  {
    id: 'user-admin',
    username: 'admin',
    email: 'admin@yukifarm.com',
    passwordHash: 'admin123',
    name: 'Admin Pusat Farm',
    role: 'ADMIN',
    title: 'Manager & Super Admin',
    branchId: 'all',
    branchName: 'Semua Cabang Peternakan',
    assignedCages: ['all'],
    avatarInitial: 'AP',
  },

  // 2. PENGAWAS CABANG 3 ALUR
  {
    id: 'user-indra',
    username: 'indra',
    email: 'indra@yukifarm.com',
    passwordHash: '123456',
    name: 'Indra Yuhadi',
    role: 'PENGAWAS',
    title: 'Pengawas Kandang 1 Kawat',
    branchId: 'branch-1',
    branchName: 'Cabang 3 Alur (Pusat)',
    assignedCages: ['1. KAWAT (INDRA YUHADI)'],
    avatarInitial: 'IY',
  },
  {
    id: 'user-sandi',
    username: 'sandi',
    email: 'sandi@yukifarm.com',
    passwordHash: '123456',
    name: 'Sandi Prayuga',
    role: 'PENGAWAS',
    title: 'Pengawas Kandang 2 Kawat',
    branchId: 'branch-1',
    branchName: 'Cabang 3 Alur (Pusat)',
    assignedCages: ['2. KAWAT (SANDI PRAYUGA)'],
    avatarInitial: 'SP',
  },
  {
    id: 'user-iyal',
    username: 'iyal',
    email: 'iyal@yukifarm.com',
    passwordHash: '123456',
    name: 'Iyal',
    role: 'PENGAWAS',
    title: 'Pengawas Kandang 3 Kawat & 16 Kayu',
    branchId: 'branch-1',
    branchName: 'Cabang 3 Alur (Pusat)',
    assignedCages: ['3. KAWAT (IYAL)', '16. KAYU (IYAL) NOVOGEN'],
    avatarInitial: 'IY',
  },
  {
    id: 'user-saridin',
    username: 'saridin',
    email: 'saridin@yukifarm.com',
    passwordHash: '123456',
    name: 'Saridin Harahap',
    role: 'PENGAWAS',
    title: 'Pengawas Kandang 4 Kawat',
    branchId: 'branch-1',
    branchName: 'Cabang 3 Alur (Pusat)',
    assignedCages: ['4. KAWAT (SARIDIN HARAHAP)'],
    avatarInitial: 'SH',
  },
  {
    id: 'user-afrizal',
    username: 'afrizal',
    email: 'afrizal@yukifarm.com',
    passwordHash: '123456',
    name: 'Afrizal',
    role: 'PENGAWAS',
    title: 'Pengawas Blok Novogen (Kd 12-15)',
    branchId: 'branch-1',
    branchName: 'Cabang 3 Alur (Pusat)',
    assignedCages: [
      '12. KAYU (AFRIZAL) NOVOGEN',
      '13. KAYU (AFRIZAL) NOVOGEN',
      '14. KAYU (AFRIZAL)  NOVOGEN',
      '15. KAYU (AFRIZAL) NOVOGEN'
    ],
    avatarInitial: 'AF',
  },

  // 3. PENGAWAS BALAI RUPIH
  {
    id: 'user-aprizal-brupi',
    username: 'aprizal',
    email: 'aprizal@yukifarm.com',
    passwordHash: '123456',
    name: 'Aprizal',
    role: 'PENGAWAS',
    title: 'Pengawas Blok A Balai Rupih',
    branchId: 'branch-2',
    branchName: 'Cabang Balai Rupih',
    assignedCages: ['LOS A1 SIAF', 'A2 SIAF', 'A3 SIAF', 'A4 SIAF'],
    avatarInitial: 'AP',
  },
  {
    id: 'user-taufik',
    username: 'taufik',
    email: 'taufik@yukifarm.com',
    passwordHash: '123456',
    name: 'Taufik',
    role: 'PENGAWAS',
    title: 'Pengawas Blok B&C Balai Rupih',
    branchId: 'branch-2',
    branchName: 'Cabang Balai Rupih',
    assignedCages: ['B3 TAUFIK', 'B4 TAUFIK', 'B5 TAUFIK', 'C5 TAUFIK'],
    avatarInitial: 'TF',
  },

  // 4. PENGAWAS ROSAM
  {
    id: 'user-riski',
    username: 'riski',
    email: 'riski@yukifarm.com',
    passwordHash: '123456',
    name: 'Riski',
    role: 'PENGAWAS',
    title: 'Pengawas Unit Riski (Rosam)',
    branchId: 'branch-3',
    branchName: 'Cabang Rosam',
    assignedCages: [
      '1KY/RISKI (NOVOGEN)',
      '2/RISKI (NOVOGEN)',
      '3/RISKI (NOVOGEN)',
      '11/RISKI (NOVOGEN)'
    ],
    avatarInitial: 'RK',
  },
  {
    id: 'user-ujang',
    username: 'ujang',
    email: 'ujang@yukifarm.com',
    passwordHash: '123456',
    name: 'Ujang',
    role: 'PENGAWAS',
    title: 'Pengawas Unit Ujang (Rosam)',
    branchId: 'branch-3',
    branchName: 'Cabang Rosam',
    assignedCages: [
      '4/UJANG (NOVOGEN)',
      '9/UJANG (NOVOGEN)',
      '10/UJANG (NOVOGEN)'
    ],
    avatarInitial: 'UJ',
  }
];

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('yuki_auth_user');
  if (!raw) {
    // Default to admin if not set
    return initialUsers[0];
  }
  try {
    return JSON.parse(raw);
  } catch {
    return initialUsers[0];
  }
}

export function setCurrentUser(user: AuthUser): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('yuki_auth_user', JSON.stringify(user));
    if (user.branchId && user.branchId !== 'all') {
      localStorage.setItem('yuki_active_branch', user.branchId);
    }
    window.dispatchEvent(new Event('authChange'));
    window.dispatchEvent(new Event('branchChange'));
  }
}

export function logoutUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('yuki_auth_user');
    window.dispatchEvent(new Event('authChange'));
  }
}

// Security & Filtering Methods
export function filterCagesForUser(
  cages: FarmCageData[],
  user: AuthUser | null
): FarmCageData[] {
  if (!user || user.role === 'ADMIN' || user.assignedCages.includes('all')) {
    return cages;
  }

  const assignedLower = user.assignedCages.map((a) => a.toLowerCase().trim());
  const userNameLower = user.name.toLowerCase().trim();

  return cages.filter((c) => {
    const fullLower = c.fullName.toLowerCase();
    const opLower = c.operator.toLowerCase();
    const nameLower = c.name.toLowerCase();

    // Check cage list match or operator name match
    return (
      assignedLower.some(
        (target) =>
          fullLower.includes(target) ||
          target.includes(fullLower) ||
          target.includes(nameLower)
      ) || opLower.includes(userNameLower)
    );
  });
}

export function filterFeedForUser(
  items: FeedDistributionItem[],
  user: AuthUser | null
): FeedDistributionItem[] {
  if (!user || user.role === 'ADMIN' || user.assignedCages.includes('all')) {
    return items;
  }

  const assignedLower = user.assignedCages.map((a) => a.toLowerCase().trim());
  const userNameLower = user.name.toLowerCase().trim();

  return items.filter((item) => {
    const kLower = item.kandang.toLowerCase();
    return (
      assignedLower.some(
        (target) => kLower.includes(target) || target.includes(kLower)
      ) || kLower.includes(userNameLower)
    );
  });
}
