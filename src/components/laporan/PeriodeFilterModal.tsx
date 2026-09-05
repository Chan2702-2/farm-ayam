'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Building2, Lock, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { FarmBranch } from '@/lib/data/farm-data';
import { AuthUser } from '@/lib/data/auth-users';

interface PeriodeFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  activeBranch: string;
  branches: FarmBranch[];
  currentUser: AuthUser | null;
  onApply: (date: string, branchId: string) => void;
}

export function PeriodeFilterModal({
  isOpen,
  onClose,
  selectedDate,
  activeBranch,
  branches,
  currentUser,
  onApply,
}: PeriodeFilterModalProps) {
  const [tempDate, setTempDate] = useState(selectedDate);
  const [tempBranch, setTempBranch] = useState(activeBranch);

  const isPengawas = currentUser?.role === 'PENGAWAS';
  const isBranchLocked = isPengawas;

  useEffect(() => {
    if (isOpen) {
      setTempDate(selectedDate);
      if (isPengawas && currentUser?.branchId) {
        setTempBranch(currentUser.branchId);
      } else {
        setTempBranch(activeBranch);
      }
    }
  }, [isOpen, selectedDate, activeBranch, isPengawas, currentUser]);

  const handleQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setTempDate(d.toISOString().split('T')[0]);
  };

  const handleSave = () => {
    const branchToUse = isBranchLocked && currentUser?.branchId ? currentUser.branchId : tempBranch;
    onApply(tempDate, branchToUse);
    onClose();
  };

  const activeBranchName =
    tempBranch === 'all'
      ? 'Semua Cabang (Konsolidasi)'
      : branches.find((b) => b.id === tempBranch)?.name || 'Cabang Farm';

  const formattedDate = (() => {
    try {
      const d = tempDate ? new Date(tempDate + 'T00:00:00') : new Date();
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    } catch {
      return tempDate;
    }
  })();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Atur Periode & Cabang"
      subtitle="Pilih Tanggal Audit & Unit Peternakan"
    >
      <div className="space-y-4">
        {/* Date Filter */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600 uppercase">
            Tanggal Laporan
          </label>
          <div className="relative">
            <input
              type="date"
              value={tempDate}
              onChange={(e) => setTempDate(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white font-medium text-xs sm:text-sm text-slate-800 outline-none focus:border-[#0284c7] transition-all"
            />
          </div>

          <div className="flex gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => handleQuickDate(0)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate(1)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Kemarin
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate(2)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              2 Hari Lalu
            </button>
          </div>
        </div>

        {/* Branch Filter */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600 uppercase">
            Pilih Cabang Peternakan
          </label>

          {isBranchLocked ? (
            /* Locked branch view for Pengawas */
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <strong className="text-xs text-amber-950 font-bold block truncate">
                    {currentUser?.branchName || 'Cabang Binaan Anda'}
                  </strong>
                  <span className="text-[10px] text-amber-700 block truncate">
                    Hanya diperbolehkan mengakses cabang binaan Anda
                  </span>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-extrabold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full shrink-0">
                <Lock className="w-3 h-3" />
                Terkunci
              </span>
            </div>
          ) : (
            /* Open branch selection for Admin / Owner */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTempBranch('all')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  tempBranch === 'all'
                    ? 'border-[#0284c7] bg-sky-50/60 ring-1 ring-[#0284c7]'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    tempBranch === 'all'
                      ? 'border-[#0284c7] bg-[#0284c7] text-white'
                      : 'border-slate-400 bg-white'
                  }`}
                >
                  {tempBranch === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="min-w-0">
                  <strong className="text-xs font-bold text-slate-900 block truncate">
                    Semua Cabang
                  </strong>
                  <span className="text-[10px] text-slate-500 block truncate">Konsolidasi Global</span>
                </div>
              </button>

              {branches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setTempBranch(b.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    tempBranch === b.id
                      ? 'border-[#0284c7] bg-sky-50/60 ring-1 ring-[#0284c7]'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      tempBranch === b.id
                        ? 'border-[#0284c7] bg-[#0284c7] text-white'
                        : 'border-slate-400 bg-white'
                    }`}
                  >
                    {tempBranch === b.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="min-w-0">
                    <strong className="text-xs font-bold text-slate-900 block truncate">
                      {b.shortName || b.name}
                    </strong>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {b.code} &bull; {b.totalCages} Kandang
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Summary Card */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
          <div className="flex justify-between items-center">
            <span>Periode Dipilih:</span>
            <strong className="text-slate-800 text-right">{formattedDate}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span>Cabang Dipilih:</span>
            <strong className="text-slate-800 text-right">{activeBranchName}</strong>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-1 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 h-11 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Terapkan Filter</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
