'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Egg,
  Wheat,
  FileSpreadsheet,
  HeartCrack,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  User,
  RefreshCw
} from 'lucide-react';
import {
  getActivityLogs,
  ActivityLogItem,
  LogActionType
} from '@/lib/data/activity-log';
import { getCurrentUser, AuthUser } from '@/lib/data/auth-users';

export default function ActivityLogPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const loadData = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    const branchScope = user?.role === 'PENGAWAS' ? user.branchId : 'all';
    const list = getActivityLogs(branchScope, user?.role);
    setLogs(list);
  };

  useEffect(() => {
    loadData();

    const handleLogChange = () => loadData();
    const handleAuthChange = () => loadData();

    window.addEventListener('logChange', handleLogChange);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('logChange', handleLogChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const filteredLogs = logs.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.userName.toLowerCase().includes(search.toLowerCase()) ||
      item.branchName.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (filterType === 'all') return true;
    if (filterType === 'PRODUKSI') return item.actionType === 'PRODUKSI';
    if (filterType === 'PAKAN') return item.actionType === 'PAKAN';
    if (filterType === 'EXCEL') return item.actionType.includes('EXCEL');
    if (filterType === 'MORTALITAS') return item.actionType === 'MORTALITAS';
    return true;
  });

  const getActionIcon = (type: LogActionType) => {
    switch (type) {
      case 'PRODUKSI':
        return <Egg className="w-4 h-4 text-[#0284c7]" />;
      case 'PAKAN':
        return <Wheat className="w-4 h-4 text-amber-600" />;
      case 'MORTALITAS':
        return <HeartCrack className="w-4 h-4 text-red-600" />;
      case 'IMPORT_EXCEL':
      case 'EXPORT_EXCEL':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="pt-16 sm:pt-20 pb-28 px-3.5 sm:px-4 space-y-3.5 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Audit Trail & Riwayat Sistem
          </span>
          <h1 className="font-jakarta font-bold text-xl text-slate-900">
            Log Aktivitas Operasional
          </h1>
        </div>

        <button
          onClick={loadData}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#0284c7] hover:border-sky-200 shadow-xs active:scale-95 transition-all"
          title="Refresh Log"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Scope Banner based on User Role */}
      <div className="p-3 bg-gradient-to-r from-sky-50 to-white border border-sky-100 rounded-2xl flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#0284c7] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {currentUser?.avatarInitial || 'AP'}
          </div>
          <div className="min-w-0">
            <strong className="text-xs text-slate-900 font-bold block truncate">
              {currentUser?.name} ({currentUser?.title})
            </strong>
            <span className="text-[10px] text-slate-500 block truncate">
              {currentUser?.role === 'PENGAWAS'
                ? `Ruang Lingkup: Terisolasi untuk ${currentUser.branchName}`
                : 'Ruang Lingkup: Super Admin (Seluruh Cabang Peternakan)'}
            </span>
          </div>
        </div>

        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 shrink-0 border border-emerald-200">
          Audit Verified
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0 pb-0.5">
        {[
          { key: 'all', label: `Semua (${logs.length})` },
          { key: 'PRODUKSI', label: 'Produksi Telur' },
          { key: 'PAKAN', label: 'Distribusi Pakan' },
          { key: 'EXCEL', label: 'Import / Export Excel' },
          { key: 'MORTALITAS', label: 'Mortalitas' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              filterType === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-400 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari aktivitas, operator, atau keterangan..."
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 shadow-xs focus:outline-none focus:border-[#0284c7]"
        />
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-2.5">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada riwayat aktivitas</p>
            <p className="text-xs text-slate-400 mt-0.5">Belum ada tindakan tercatat untuk filter ini</p>
          </div>
        ) : (
          filteredLogs.map((item) => (
            <div
              key={item.id}
              className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs hover:border-sky-200 transition-all space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    item.badgeColor === 'amber'
                      ? 'bg-amber-100/70'
                      : item.badgeColor === 'red'
                      ? 'bg-red-100/70'
                      : item.badgeColor === 'emerald'
                      ? 'bg-emerald-100/70'
                      : 'bg-sky-100/70'
                  }`}>
                    {getActionIcon(item.actionType)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-jakarta font-bold text-xs sm:text-sm text-slate-900 leading-tight truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {item.timeFormatted}
                    </span>
                  </div>
                </div>

                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                  {item.actionType.replace('_', ' ')}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pl-9">
                {item.description}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-50 pl-9">
                <div className="flex items-center gap-1 font-semibold text-slate-600">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>{item.userName} ({item.userRole})</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span className="truncate max-w-[150px]">{item.branchName}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
