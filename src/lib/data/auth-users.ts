// User Accounts & Branch-Level Access Control for Yuki Farm
// Strict Isolation PER CABANG with 1-Hour Inactivity Auto-Logout

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

const USERS_STORAGE_KEY = 'yuki_auth_users_list_v2';

export function getAuthUsers(): AuthUser[] {
  if (typeof window === 'undefined') return initialUsers;
  const raw = localStorage.getItem(USERS_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
    return initialUsers;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialUsers;
  } catch {
    return initialUsers;
  }
}

export function saveAuthUsers(users: AuthUser[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    window.dispatchEvent(new Event('usersChange'));
  }
}

export function addAuthUser(user: Omit<AuthUser, 'id' | 'avatarInitial'>): AuthUser {
  const users = getAuthUsers();
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'US';

  const newUser: AuthUser = {
    ...user,
    id: `user-${Date.now()}`,
    avatarInitial: initials,
  };
  users.push(newUser);
  saveAuthUsers(users);
  return newUser;
}

export function deleteAuthUser(id: string): boolean {
  const users = getAuthUsers();
  if (users.length <= 1) return false;
  const filtered = users.filter((u) => u.id !== id);
  saveAuthUsers(filtered);
  return true;
}

// Inactivity timeout: 1 Hour (60 minutes * 60 seconds * 1000 ms = 3,600,000 ms)
export const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;

export function recordUserActivity(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('yuki_last_activity', Date.now().toString());
  }
}

export function checkSessionExpired(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = localStorage.getItem('yuki_auth_user');
  if (!raw) return true;

  const lastActivity = localStorage.getItem('yuki_last_activity');
  if (lastActivity) {
    const elapsed = Date.now() - parseInt(lastActivity, 10);
    if (elapsed > INACTIVITY_TIMEOUT_MS) {
      return true;
    }
  }
  return false;
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem('yuki_auth_user');
  if (!raw) {
    return null; // Must return null so unauthenticated visitors are forced to login!
  }

  // Check if session has timed out due to 1 hour inactivity
  const lastActivity = localStorage.getItem('yuki_last_activity');
  if (lastActivity) {
    const elapsed = Date.now() - parseInt(lastActivity, 10);
    if (elapsed > INACTIVITY_TIMEOUT_MS) {
      logoutUser(true);
      return null;
    }
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AuthUser): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('yuki_auth_user', JSON.stringify(user));
    localStorage.setItem('yuki_last_activity', Date.now().toString());
    sessionStorage.removeItem('yuki_session_expired');

    if (user.branchId && user.branchId !== 'all') {
      localStorage.setItem('yuki_active_branch', user.branchId);
    } else {
      localStorage.setItem('yuki_active_branch', 'all');
    }

    window.dispatchEvent(new Event('authChange'));
    window.dispatchEvent(new Event('branchChange'));
  }
}

export function logoutUser(isExpired: boolean = false): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('yuki_auth_user');
    localStorage.removeItem('yuki_last_activity');
    localStorage.setItem('yuki_active_branch', 'all');

    if (isExpired) {
      sessionStorage.setItem('yuki_session_expired', '1');
    } else {
      sessionStorage.removeItem('yuki_session_expired');
    }

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
