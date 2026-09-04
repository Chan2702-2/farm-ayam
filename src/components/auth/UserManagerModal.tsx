'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  CheckCircle2,
  Shield,
  Building2,
  RefreshCw,
  X,
  Lock,
  Mail,
  User
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  AuthUser,
  getAuthUsers,
  addAuthUser,
  deleteAuthUser,
  getCurrentUser
} from '@/lib/data/auth-users';
import { getFarmBranches, FarmBranch } from '@/lib/data/farm-data';

interface UserManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export function UserManagerModal({ isOpen, onClose, onSuccessToast }: UserManagerModalProps) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [branches, setBranches] = useState<FarmBranch[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // New User Form State
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'PENGAWAS'>('PENGAWAS');
  const [newBranchId, setNewBranchId] = useState('all');
  const [newEmail, setNewEmail] = useState('');

  const loadData = () => {
    setUsers(getAuthUsers());
    const brs = getFarmBranches();
    setBranches(brs);
    if (brs.length > 0 && newBranchId === 'all' && newRole === 'PENGAWAS') {
      setNewBranchId(brs[0].id);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setIsAdding(false);
    }
  }, [isOpen]);

  const syncUsersToSheets = async (updatedList: AuthUser[]) => {
    setSyncing(true);
    try {
      const curUser = getCurrentUser();
      const payload = updatedList.map((u) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        role: u.role,
        title: u.title || (u.role === 'ADMIN' ? 'Manager Pusat' : `Pengawas ${u.branchName}`),
        branchId: u.branchId,
        branchName: u.branchName,
        email: u.email,
        status: 'Aktif',
      }));

      await fetch('/api/sheets/sync-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: payload,
          userName: curUser?.name || 'Admin',
        }),
      });
    } catch (err) {
      console.warn('Sync users to Google Sheets failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      alert('Silakan lengkapi Nama, Username, dan Kata Sandi.');
      return;
    }

    const cleanUsername = newUsername.trim().toLowerCase().replace(/\s+/g, '_');
    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      alert(`Username "${cleanUsername}" sudah digunakan. Gunakan username lain.`);
      return;
    }

    let branchObj = branches.find((b) => b.id === newBranchId);
    let targetBranchName = 'Semua Cabang Peternakan';
    let targetBranchId = 'all';

    if (newRole === 'PENGAWAS') {
      if (branches.length === 0) {
        alert('Belum ada cabang terdaftar. Buat cabang terlebih dahulu di menu Kandang.');
        return;
      }
      branchObj = branches.find((b) => b.id === newBranchId) || branches[0];
      targetBranchName = branchObj.name;
      targetBranchId = branchObj.id;
    }

    const created = addAuthUser({
      name: newName.trim(),
      username: cleanUsername,
      passwordHash: newPassword.trim(),
      email: newEmail.trim() || `${cleanUsername}@yukifarm.com`,
      role: newRole,
      title: newRole === 'ADMIN' ? 'Manager Peternakan' : `Pengawas Lapangan ${targetBranchName}`,
      branchId: targetBranchId,
      branchName: targetBranchName,
    });

    const updated = getAuthUsers();
    setUsers(updated);
    setIsAdding(false);

    // Reset Form
    setNewName('');
    setNewUsername('');
    setNewPassword('');
    setNewEmail('');

    // Sync to Google Sheets
    await syncUsersToSheets(updated);

    if (onSuccessToast) {
      onSuccessToast(`Akun "${created.name}" berhasil dibuat & disinkronkan ke Spreadsheet!`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const curUser = getCurrentUser();
    if (curUser?.id === id) {
      alert('Anda tidak dapat menghapus akun yang sedang Anda gunakan saat ini.');
      return;
    }

    if (confirm(`Yakin ingin menghapus akun pengguna "${name}"?`)) {
      const ok = deleteAuthUser(id);
      if (ok) {
        const updated = getAuthUsers();
        setUsers(updated);
        await syncUsersToSheets(updated);
        if (onSuccessToast) {
          onSuccessToast(`Akun "${name}" berhasil dihapus & diperbarui di Spreadsheet.`);
        }
      }
    }
  };

  const handleManualSync = async () => {
    await syncUsersToSheets(users);
    if (onSuccessToast) {
      onSuccessToast('Daftar pengguna berhasil disinkronkan ke Google Sheets tab "Master Pengguna"!');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kelola Akun Pengguna"
      subtitle="Manajemen akun pengawas cabang & hak akses sistem"
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {/* Header Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              Total Pengguna: <strong>{users.length} Akun</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleManualSync}
              disabled={syncing}
              title="Sinkronkan Pengguna ke Google Sheets"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-[#0284c7]' : ''}`} />
              <span className="hidden sm:inline">Sync Sheets</span>
            </button>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isAdding ? 'Batal' : '+ Tambah Pengguna'}</span>
            </button>
          </div>
        </div>

        {/* Add User Form Drawer */}
        {isAdding && (
          <form
            onSubmit={handleCreateUser}
            className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between pb-1 border-b border-amber-200/60">
              <span className="font-jakarta font-bold text-xs text-amber-900 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-amber-700" />
                <span>Pendaftaran Akun Baru</span>
              </span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-amber-800 hover:text-amber-950 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="pengawas_budi"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Kata Sandi (Password) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="admin123"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Role / Hak Akses
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                >
                  <option value="PENGAWAS">PENGAWAS (Cabang Khusus)</option>
                  <option value="ADMIN">ADMIN (Semua Cabang)</option>
                </select>
              </div>
            </div>

            {newRole === 'PENGAWAS' && (
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Wilayah Cabang Penugasan *
                </label>
                <select
                  value={newBranchId}
                  onChange={(e) => setNewBranchId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Email (Opsional)
              </label>
              <input
                type="email"
                placeholder="nama@yukifarm.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-1 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={syncing}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                Simpan & Sync ke Sheets
              </button>
            </div>
          </form>
        )}

        {/* User List Cards */}
        <div className="space-y-2 max-h-[55vh] overflow-y-auto no-scrollbar">
          {users.map((u) => (
            <div
              key={u.id}
              className="p-3 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between gap-2.5 hover:border-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs ${
                    u.role === 'ADMIN' ? 'bg-[#0284c7]' : 'bg-amber-600'
                  }`}
                >
                  {u.avatarInitial || 'US'}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <strong className="font-jakarta text-xs text-slate-900 truncate">
                      {u.name}
                    </strong>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md uppercase shrink-0 ${
                        u.role === 'ADMIN'
                          ? 'bg-[#e0f2fe] text-[#0369a1]'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 truncate">
                    username: <code className="font-mono text-slate-800 font-semibold">{u.username}</code> &bull; sandi: <span className="font-mono text-slate-400">{u.passwordHash}</span>
                  </p>

                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    📍 {u.branchName || 'Semua Cabang'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {users.length > 1 && (
                  <button
                    onClick={() => handleDelete(u.id, u.name)}
                    title="Hapus Akun Pengguna"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors active:scale-90"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Tab Spreadsheet: <strong>Master Pengguna</strong></span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Auto-Sync Aktif
          </span>
        </div>
      </div>
    </Modal>
  );
}
