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
  LogOut
} from 'lucide-react';
import {
  getFarmBranches,
  getActiveBranchId,
  setActiveBranchId,
  FarmBranch
} from '@/lib/data/farm-data';
import { Modal } from '@/components/ui/Modal';

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
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    setBranches(getFarmBranches());
    setActiveBranch(getActiveBranchId());

    const handleBranchChange = () => {
      setActiveBranch(getActiveBranchId());
    };
    window.addEventListener('branchChange', handleBranchChange);
    return () => window.removeEventListener('branchChange', handleBranchChange);
  }, []);

  const handleSelectBranch = (id: string) => {
    setActiveBranch(id);
    setActiveBranchId(id);
    setShowBranchModal(false);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const currentBranchObj = branches.find((b) => b.id === activeBranch);
  const branchLabel = activeBranch === 'all' ? 'Semua Cabang' : (currentBranchObj?.shortName || 'Cabang');

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
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0284c7] to-[#0369a1] flex items-center justify-center text-white shadow-xs font-bold text-[10px] tracking-wider shrink-0">
                YF
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1 leading-none">
                  <span className="font-jakarta font-extrabold text-sm tracking-tight text-[#0369a1]">
                    YUKI<span className="text-[#0284c7] ml-0.5">FARM</span>
                  </span>
                  <span className="hidden xs:inline-flex px-1.5 py-0.2 rounded-full bg-[#e0f2fe] text-[#0369a1] text-[9px] font-bold uppercase shrink-0">
                    5 Unit
                  </span>
                </div>
                {title ? (
                  <span className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                    {title}
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-400 font-medium truncate mt-0.5">
                    Mobile ERP &bull; Biosecure OK
                  </span>
                )}
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Multi-Branch Selector Button */}
            <button
              onClick={() => setShowBranchModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0369a1] text-xs font-bold border border-sky-200/80 active:scale-95 transition-all"
              title="Pilih Cabang Peternakan"
            >
              <Building2 className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
              <span className="max-w-[85px] sm:max-w-[140px] truncate">{branchLabel}</span>
              <ChevronDown className="w-3 h-3 text-[#0284c7] opacity-70 shrink-0" />
            </button>

            {/* Profile Avatar */}
            <button
              onClick={() => setShowProfileModal(true)}
              aria-label="Profile Operator"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#e0f2fe] text-[#0369a1] font-bold text-[11px] sm:text-xs flex items-center justify-center hover:ring-2 hover:ring-[#0284c7] active:scale-95 transition-all shrink-0"
            >
              OP
            </button>
          </div>
        </div>
      </header>

      {/* Multi-Branch Selector Modal */}
      <Modal
        isOpen={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        title="Pilih Cabang Peternakan"
        subtitle="Filter data operasional per cabang lokasi"
      >
        <div className="space-y-2.5">
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
                  <span className={`text-[10px] ${activeBranch === 'all' ? 'text-sky-100' : 'text-slate-400'}`}>
                    5 Cabang &bull; 70 Unit Kandang
                  </span>
                </div>
              </div>

              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                activeBranch === 'all' ? 'border-white bg-white' : 'border-slate-300 bg-white'
              }`}>
                {activeBranch === 'all' && <Check className="w-3 h-3 text-[#0369a1] stroke-[3]" />}
              </div>
            </div>

            <div className={`flex items-center justify-between pt-1.5 border-t ${
              activeBranch === 'all' ? 'border-sky-700/50 text-sky-100' : 'border-slate-100 text-slate-600'
            } text-xs`}>
              <span>Populasi: <strong className={activeBranch === 'all' ? 'text-white' : 'text-slate-800'}>177.475</strong> ekor</span>
              <span>Prod: <strong className={activeBranch === 'all' ? 'text-white' : 'text-[#0284c7]'}>170.084</strong> btr</span>
              <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                activeBranch === 'all' ? 'bg-white/20 text-white' : 'bg-sky-50 text-[#0284c7]'
              }`}>
                Avg 92.8%
              </span>
            </div>
          </button>

          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pt-1">
            Daftar 5 Unit Cabang
          </div>

          {/* 5 Branches Cards */}
          {branches.map((b) => {
            const isSelected = activeBranch === b.id;
            return (
              <button
                key={b.id}
                onClick={() => handleSelectBranch(b.id)}
                className={`w-full p-3.5 rounded-2xl border transition-all text-left flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-sky-50/90 border-[#0284c7] shadow-xs'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50/90'
                }`}
              >
                {/* Top Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold tracking-wide shrink-0 ${
                      isSelected ? 'bg-[#0284c7] text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {b.code}
                    </span>
                    <h4 className="font-jakarta font-bold text-sm text-slate-900 truncate">
                      {b.name}
                    </h4>
                    {b.code === '3-ALUR' && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold shrink-0">
                        Pusat
                      </span>
                    )}
                  </div>

                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-[#0284c7] bg-[#0284c7]' : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </div>
                </div>

                {/* Sub-info Row: Location & Cages */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="truncate">{b.location}</span>
                  <span className="text-slate-700 font-semibold shrink-0 ml-2">{b.totalCages} Kandang</span>
                </div>

                {/* Bottom Row: Metrics Strip */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100/80 text-xs">
                  <span className="text-slate-600">
                    Pop: <strong className="text-slate-800">{b.populasi.toLocaleString('id-ID')}</strong> ekr
                  </span>
                  <span className="text-slate-600">
                    Prod: <strong className="text-[#0369a1]">{b.produksi.toLocaleString('id-ID')}</strong> btr
                  </span>
                  <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                    b.act >= 95 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    ACT {b.act}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Profile & Shift Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Admin Operasional Enterprise"
        subtitle="Yuki Farm Multi-Branch Core v2.5"
      >
        <div className="space-y-3.5">
          <div className="flex items-center gap-3 p-3 bg-sky-50/80 rounded-2xl border border-sky-100">
            <div className="w-11 h-11 rounded-full bg-[#0284c7] text-white font-bold flex items-center justify-center text-sm">
              HQ
            </div>
            <div className="min-w-0">
              <h4 className="font-jakarta font-bold text-slate-900 text-sm leading-tight">
                Headquarters Admin
              </h4>
              <p className="text-xs text-sky-700 font-medium">Monitoring 5 Cabang Terintegrasi</p>
              <span className="inline-flex items-center gap-1 text-[10px] text-green-700 bg-green-100/80 px-2 py-0.5 rounded-full font-semibold mt-1">
                <ShieldCheck className="w-3 h-3" /> Biosecurity Level A
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block">Total Unit Cabang</span>
              <span className="font-bold text-slate-800">5 Peternakan</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block">Total Populasi</span>
              <span className="font-bold text-slate-800">177.475 Ekor</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setShowProfileModal(false)}
              className="w-full h-11 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar / Ganti Akun</span>
            </Link>
          </div>
        </div>
      </Modal>
    </>
  );
}
