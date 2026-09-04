'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  Check,
  ShieldCheck,
  Layers,
  LogOut,
  User,
  Warehouse,
  Lock,
  History,
  Trash2,
  Users,
  RefreshCw
} from 'lucide-react';
import {
  getFarmBranches,
  getFarmCages,
  getFeedDistribution,
  getActiveBranchId,
  setActiveBranchId,
  clearAllFarmData,
  FarmBranch
} from '@/lib/data/farm-data';
import { SyncStatusBadge } from '@/components/common/SyncStatusBadge';
import { performAutoSync, pullDataFromSheets } from '@/lib/sync/auto-sync';
import {
  getCurrentUser,
  getAuthUsers,
  logoutUser,
  AuthUser
} from '@/lib/data/auth-users';
import { Modal } from '@/components/ui/Modal';
import { UserManagerModal } from '@/components/auth/UserManagerModal';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}

export function AppHeader({
  title,
  showBack,
  onBack,
}: AppHeaderProps) {
  const router = useRouter();
  const [branches, setBranches] = useState<FarmBranch[]>([]);
  const [activeBranch, setActiveBranch] = useState<string>('all');
  const [currentUser, setCurrentUserState] = useState<AuthUser | null>(null);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isSyncingData, setIsSyncingData] = useState(false);

  useEffect(() => {
    setBranches(getFarmBranches());
    setActiveBranch(getActiveBranchId());
    setCurrentUserState(getCurrentUser());

    const handleBranchChange = () => {
      setActiveBranch(getActiveBranchId());
    };
    const handleAuthChange = () => {
      setCurrentUserState(getCurrentUser());
    };

    window.addEventListener('branchChange', handleBranchChange);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('branchChange', handleBranchChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const handleSelectBranch = (id: string) => {
    // If pengawas, verify if they can switch
    if (currentUser && currentUser.role === 'PENGAWAS') {
      if (id !== 'all' && id !== currentUser.branchId) {
        alert(`Akses Dibatasi: Anda hanya memiliki izin akses untuk ${currentUser.branchName}`);
        return;
      }
    }

    setActiveBranch(id);
    setActiveBranchId(id);
    setShowBranchModal(false);
  };

  const handleLogout = () => {
    logoutUser();
    setShowProfileModal(false);
    router.push('/login');
  };

  const handleSyncData = async () => {
    setIsSyncingData(true);
    try {
      await performAutoSync(true);
      const pullRes = await pullDataFromSheets();
      if (pullRes.success) {
        alert(`Sinkronisasi Berhasil!\nData terbaru berhasil dimuat dari Google Spreadsheet (${pullRes.branchesCount || 0} cabang, ${pullRes.cagesCount || 0} kandang).`);
      } else {
        alert('Sinkronisasi selesai.');
      }
    } catch (e: any) {
      alert('Gagal menghubungi server sinkronisasi: ' + e.message);
    } finally {
      setIsSyncingData(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const isPengawas = currentUser?.role === 'PENGAWAS';
  const currentBranchObj = branches.find((b) => b.id === activeBranch);
  const branchLabel = isPengawas
    ? (currentUser?.branchName?.replace('Cabang ', '').replace(' (Pusat)', '') || 'Cabang Anda')
    : activeBranch === 'all'
    ? 'Semua Cabang'
    : (currentBranchObj?.shortName || 'Cabang');

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-[0_1px_8px_rgba(0,0,0,0.03)] pt-safe">
        <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto h-full px-3 sm:px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 pr-2">
            {showBack ? (
              <button
                onClick={handleBack}
                aria-label="Kembali"
                className="w-8 h-8 -ml-1 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-90 transition-all shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : null}

            <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white border border-slate-100 shadow-2xs shrink-0 p-0.5">
                <img src="/icons/logoyf.png" alt="Yuki Farm" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1 leading-none">
                  <span className="font-jakarta font-extrabold text-sm tracking-tight text-[#0369a1]">
                    YUKI<span className="text-[#0284c7] ml-0.5">FARM</span>
                  </span>
                  <span className="hidden xs:inline-flex px-1.5 py-0.2 rounded-full bg-[#e0f2fe] text-[#0369a1] text-[9px] font-bold uppercase shrink-0">
                    {isPengawas ? 'Pengawas' : 'Manager'}
                  </span>
                </div>
                {title ? (
                  <span className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                    {title}
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-400 font-medium truncate mt-0.5">
                    {isPengawas ? currentUser?.title : 'Mobile ERP &bull; Biosecure OK'}
                  </span>
                )}
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Real-time Auto-Sync Status & Offline Badge */}
            <SyncStatusBadge />

            {/* Branch Badge / Selector */}
            {isPengawas ? (
              <div
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 shrink-0"
                title={`Cabang Penugasan: ${currentUser?.branchName}`}
              >
                <Warehouse className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="max-w-[85px] sm:max-w-[140px] truncate">{branchLabel}</span>
              </div>
            ) : (
              <button
                onClick={() => setShowBranchModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-[#0369a1] border border-sky-200/80 hover:bg-sky-100 active:scale-95 transition-all shrink-0"
                title="Pilih Cabang Peternakan"
              >
                <Building2 className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                <span className="max-w-[85px] sm:max-w-[140px] truncate">{branchLabel}</span>
                <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
              </button>
            )}

            {/* Log Aktivitas Button */}
            <Link
              href="/log"
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-all shrink-0"
              title="Log Aktivitas & Riwayat Audit"
            >
              <History className="w-4 h-4 text-slate-600" />
            </Link>

            {/* Profile Avatar */}
            <button
              onClick={() => setShowProfileModal(true)}
              aria-label="Profile Operator"
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-bold text-[11px] sm:text-xs flex items-center justify-center hover:ring-2 active:scale-95 transition-all shrink-0 ${
                isPengawas
                  ? 'bg-amber-100 text-amber-900 hover:ring-amber-400'
                  : 'bg-[#e0f2fe] text-[#0369a1] hover:ring-[#0284c7]'
              }`}
            >
              {currentUser?.avatarInitial || 'AP'}
            </button>
          </div>
        </div>
      </header>

      {/* Multi-Branch Selector Modal */}
      <Modal
        isOpen={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        title={isPengawas ? 'Hak Akses Unit Kandang' : 'Pilih Cabang Peternakan'}
        subtitle={
          isPengawas
            ? `Akun Anda terdaftar khusus untuk ${currentUser?.branchName}`
            : 'Filter data operasional per cabang lokasi'
        }
      >
        <div className="space-y-2.5">
          {isPengawas ? (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Akses Per-Cabang Terkunci</strong>
                  <span>
                    Anda login sebagai <strong>{currentUser?.name}</strong> ({currentUser?.title}). Data yang ditampilkan terkunci khusus untuk seluruh unit kandang di {currentUser?.branchName}.
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <strong className="text-slate-800 block font-bold">{currentUser?.branchName}</strong>
                    <span className="text-[11px] text-slate-500">Semua unit kandang di cabang ini</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Aktif
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Option: Semua Cabang (Konsolidasi) */}
              <button
                onClick={() => handleSelectBranch('all')}
                className={`w-full p-3.5 rounded-2xl border transition-all text-left flex flex-col gap-2 ${
                  activeBranch === 'all'
                    ? 'bg-[#0369a1] text-white border-[#0369a1] shadow-md shadow-sky-900/15'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50/90'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      activeBranch === 'all' ? 'bg-white/20 text-white' : 'bg-sky-100 text-[#0284c7]'
                    }`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className={`font-jakarta font-bold text-sm ${activeBranch === 'all' ? 'text-white' : 'text-slate-900'}`}>
                        Semua Cabang (Konsolidasi)
                      </h4>
                      <p className={`text-xs ${activeBranch === 'all' ? 'text-sky-100' : 'text-slate-500'}`}>
                        {branches.length > 0 ? `Pusat Monitoring ${branches.length} Lokasi Farm` : 'Belum Ada Cabang'}
                      </p>
                    </div>
                  </div>
                  {activeBranch === 'all' && <Check className="w-5 h-5 text-white shrink-0" />}
                </div>
              </button>

              {/* 5 Cabang Cards */}
              {branches.map((b) => {
                const isSelected = activeBranch === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => handleSelectBranch(b.id)}
                    className={`w-full p-3 rounded-2xl border transition-all text-left flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-md shadow-sky-600/20'
                        : 'bg-white border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {b.code}
                        </span>
                        <h4 className={`font-jakarta font-bold text-xs sm:text-sm truncate ${
                          isSelected ? 'text-white' : 'text-slate-900'
                        }`}>
                          {b.name}
                        </h4>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </Modal>

      {/* User Profile Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Profil Pengguna"
        subtitle="Informasi akun & wewenang operasional"
      >
        <div className="space-y-3.5">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0284c7]/10 to-[#0369a1]/15 border border-sky-100 flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shadow-sm shrink-0 ${
              isPengawas ? 'bg-amber-600 text-white' : 'bg-[#0284c7] text-white'
            }`}>
              {currentUser?.avatarInitial || 'AP'}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-jakarta font-bold text-slate-900 text-sm leading-tight truncate">
                {currentUser?.name || 'Admin Pusat'}
              </h4>
              <p className="text-xs text-sky-700 font-medium truncate">
                {currentUser?.title || 'Manager Utama Peternakan'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  isPengawas ? 'bg-amber-100 text-amber-800' : 'bg-[#e0f2fe] text-[#0369a1]'
                }`}>
                  {currentUser?.role || 'ADMIN'}
                </span>
                <span className="text-[10px] text-slate-500 truncate">
                  {currentUser?.branchName}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Wilayah Cabang Penugasan
              </span>
              <strong className="text-slate-800 block text-xs">
                {currentUser?.branchName}
              </strong>
            </div>

            <Link
              href="/log"
              onClick={() => setShowProfileModal(false)}
              className="w-full p-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0284c7] font-bold text-xs flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" />
                <span>Lihat Riwayat & Log Aktivitas</span>
              </div>
              <span>&rarr;</span>
            </Link>

            {currentUser?.role === 'ADMIN' && (
              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false);
                  setShowUserModal(true);
                }}
                className="w-full p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-700" />
                  <span>Kelola Akun Pengguna / User (Admin)</span>
                </div>
                <span>&rarr;</span>
              </button>
            )}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handleSyncData}
              disabled={isSyncingData}
              className="w-full h-11 rounded-xl bg-sky-50 hover:bg-sky-100 active:scale-95 text-[#0284c7] font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingData ? 'animate-spin' : ''}`} />
              <span>{isSyncingData ? 'Menyinkronkan Data...' : 'Sinkronisasi Data'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full h-11 rounded-xl bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* User Manager Modal for Admin */}
      <UserManagerModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
      />
    </>
  );
}
