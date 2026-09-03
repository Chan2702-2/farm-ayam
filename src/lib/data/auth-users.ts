// User Accounts & Branch-Level Access Control for Yuki Farm
// Strict Isolation PER CABANG:
// - Cabang 3 Alur -> Pengawas A
// - Cabang Balai Rupih -> Pengawas B
// - Cabang Rosam -> Pengawas C
// - Super Admin -> Admin Pusat

import { FarmCageData, FeedDistributionItem } from './farm-data';

export type UserRole = 'ADMIN' | 'PENGAWAS';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  title: string;
  branchId: string;
  branchName: string;
  avatarInitial: string;
}

export const initialUsers: AuthUser[] = [
  // 1. SUPER ADMIN / MANAGER
  {
    id: 'user-admin',
    username: 'admin',
    email: 'admin@yukifarm.com',
    passwordHash: 'admin123',
    name: 'Admin Pusat',
    role: 'ADMIN',
    title: 'Manager Seluruh Cabang',
    branchId: 'all',
    branchName: 'Semua Cabang Peternakan',
    avatarInitial: 'AP',
  },

  // 2. PENGAWAS A - CABANG 3 ALUR
  {
    id: 'user-pengawas-a',
    username: 'pengawas_a',
    email: 'pengawas.a@yukifarm.com',
    passwordHash: '123',
    name: 'Pengawas A',
    role: 'PENGAWAS',
    title: 'Pengawas Lapangan Cabang 3 Alur',
    branchId: 'branch-1',
    branchName: 'Cabang 3 Alur (Pusat)',
    avatarInitial: 'PA',
  },

  // 3. PENGAWAS B - CABANG BALAI RUPIH
  {
    id: 'user-pengawas-b',
    username: 'pengawas_b',
    email: 'pengawas.b@yukifarm.com',
    passwordHash: '123',
    name: 'Pengawas B',
    role: 'PENGAWAS',
    title: 'Pengawas Lapangan Cabang Balai Rupih',
    branchId: 'branch-2',
    branchName: 'Cabang Balai Rupih',
    avatarInitial: 'PB',
  },

  // 4. PENGAWAS C - CABANG ROSAM
  {
    id: 'user-pengawas-c',
    username: 'pengawas_c',
    email: 'pengawas.c@yukifarm.com',
    passwordHash: '123',
    name: 'Pengawas C',
    role: 'PENGAWAS',
    title: 'Pengawas Lapangan Cabang Rosam',
    branchId: 'branch-3',
    branchName: 'Cabang Rosam',
    avatarInitial: 'PC',
  },
];

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('yuki_auth_user');
  if (!raw) {
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
    localStorage.setItem('yuki_active_branch', 'all');
    window.dispatchEvent(new Event('authChange'));
    window.dispatchEvent(new Event('branchChange'));
  }
}

// STRICT PER-CABANG FILTERING
export function filterCagesForUser(
  cages: FarmCageData[],
  user: AuthUser | null
): FarmCageData[] {
  if (!user || user.role === 'ADMIN' || user.branchId === 'all') {
    return cages;
  }
  return cages.filter((c) => c.branchId === user.branchId);
}

export function filterFeedForUser(
  items: FeedDistributionItem[],
  user: AuthUser | null
): FeedDistributionItem[] {
  if (!user || user.role === 'ADMIN' || user.branchId === 'all') {
    return items;
  }
  return items.filter((item) => item.branchId === user.branchId);
}
