'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, CheckCircle2, AlertTriangle, X, Building2 } from 'lucide-react';
import {
  getFarmCages,
  saveFarmCages,
  getFarmBranches,
  getActiveBranchId,
  setActiveBranchId,
  FarmCageData,
  FarmBranch
} from '@/lib/data/farm-data';
import { KandangCard } from '@/components/kandang/KandangCard';
import { getCurrentUser, filterCagesForUser, AuthUser } from '@/lib/data/auth-users';
import { Modal } from '@/components/ui/Modal';

export default function KandangPage() {
  const [branches, setBranches] = useState<FarmBranch[]>([]);
  const [activeBranch, setActiveBranch] = useState<string>('all');
  const [cages, setCages] = useState<FarmCageData[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'attention' | 'below' | 'excellent' | 'normal'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Add Cage Form State
  const [newBranchId, setNewBranchId] = useState('branch-1');
  const [newNama, setNewNama] = useState('');
  const [newTipe, setNewTipe] = useState<'KAWAT' | 'KAYU'>('KAWAT');
  const [newOperator, setNewOperator] = useState('');
  const [newKapasitas, setNewKapasitas] = useState('4104');
  const [newUmurMgg, setNewUmurMgg] = useState('31');
  const [newJenis, setNewJenis] = useState('LAYER LOHMANN');

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const loadData = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    const brs = getFarmBranches();
    setBranches(brs);
    const active = user && user.role === 'PENGAWAS' ? user.branchId : getActiveBranchId();
    setActiveBranch(active);
    const branchCages = getFarmCages(active);
    setCages(filterCagesForUser(branchCages, user));
  };

  useEffect(() => {
    loadData();

    const handleBranchChange = () => loadData();
    const handleAuthChange = () => loadData();

    window.addEventListener('branchChange', handleBranchChange);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('branchChange', handleBranchChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const handleSelectBranch = (id: string) => {
    setActiveBranch(id);
    setActiveBranchId(id);
    setCages(getFarmCages(id));
  };

  const handleAddKandang = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama || !newOperator) {
      alert('Silakan lengkapi nama kandang dan nama operator.');
      return;
    }

    const branchObj = branches.find((b) => b.id === newBranchId) || branches[0];
    const nextIndex = cages.length + 1;
    const kap = Number(newKapasitas) || 4000;
    const newCage: FarmCageData = {
      id: `cage-${Date.now()}`,
      index: nextIndex,
      branchId: newBranchId,
      branchName: branchObj.name,
      fullName: `${nextIndex}. ${newNama} (${newOperator.toUpperCase()})`,
      name: `${nextIndex}. ${newNama}`,
      operator: newOperator.toUpperCase(),
      kapasitas: kap,
      populasiAwal: kap,
      populasiHidup: kap,
      mati: 0,
      afkir: 0,
      mutasiKeluar: 0,
      mutasiMasuk: 0,
      tanggalMasuk: new Date().toISOString().split('T')[0],
      umurMgg: Number(newUmurMgg) || 30,
      umurBln: Math.round((Number(newUmurMgg) || 30) / 4.3),
      jenis: newJenis,
      beratAktual: 1850,
      beratStandard: 1858,
      pagiIkat: 100,
      soreIkat: 20,
      butir: 0,
      retak: 0,
      putih: 0,
      kotorPutih: 0,
      k: 0,
      r: 0,
      l: 0,
      totalProduksi: (100 * 30) + (20 * 30),
      actPercent: Number((((100 * 30 + 20 * 30) / kap) * 100).toFixed(2)),
      standardPercent: 95.5,
      obat: null,
    };

    const allCagesFromStorage = getFarmCages('all');
    const updated = [newCage, ...allCagesFromStorage];
    saveFarmCages(updated);
    setCages(getFarmCages(activeBranch));

    setShowAddModal(false);
    setNewNama('');
    setNewOperator('');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3500);
  };

  const filteredCages = cages.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.operator.toLowerCase().includes(search.toLowerCase()) ||
      c.branchName.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'attention') return c.mati >= 2 || (c.actPercent > 0 && c.actPercent < 90);
    if (statusFilter === 'below') return c.actPercent < c.standardPercent && c.totalProduksi > 0;
    if (statusFilter === 'excellent') return c.actPercent >= c.standardPercent && c.totalProduksi > 0;
    if (statusFilter === 'normal') return c.actPercent >= 90 && c.actPercent < c.standardPercent;
    return true;
  });

  const totalAyam = cages.reduce((acc, c) => acc + c.populasiHidup, 0);

  return (
    <div className="pt-16 sm:pt-20 pb-28 px-3.5 sm:px-4 space-y-3.5 sm:space-y-4">
      {/* Top Header info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-jakarta font-bold text-xl text-slate-900">
            Daftar Kandang
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {cages.length} Kandang Terdaftar &bull; {totalAyam.toLocaleString('id-ID')} Total Ekor
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-sm shadow-sky-600/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </div>

      {/* Multi-Branch Filter Tabs - ONLY FOR ADMIN */}
      {currentUser && currentUser.role === 'PENGAWAS' ? (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
          <span className="font-bold text-amber-900">📍 {currentUser.branchName}</span>
          <span className="text-[11px] text-amber-700 font-semibold">{cages.length} Unit Kandang</span>
        </div>
      ) : (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => handleSelectBranch('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              activeBranch === 'all'
                ? 'bg-[#0369a1] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Semua Cabang (5)
          </button>
          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => handleSelectBranch(b.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                activeBranch === b.id
                  ? 'bg-[#0284c7] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {b.shortName} ({b.totalCages})
            </button>
          ))}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kandang, cabang, atau operator..."
          className="w-full h-11 pl-10 pr-9 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 shadow-xs focus:outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#e0f2fe] transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Status Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            statusFilter === 'all' ? 'bg-[#0284c7] text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Semua Status ({cages.length})
        </button>
        <button
          onClick={() => setStatusFilter('attention')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            statusFilter === 'attention' ? 'bg-red-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Perlu Perhatian
        </button>
        <button
          onClick={() => setStatusFilter('below')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            statusFilter === 'below' ? 'bg-amber-500 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Below Std
        </button>
        <button
          onClick={() => setStatusFilter('excellent')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            statusFilter === 'excellent' ? 'bg-sky-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Excellent
        </button>
      </div>

      {/* Cage List */}
      <div className="space-y-3">
        {filteredCages.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm font-semibold text-slate-700">Tidak ada kandang ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba ganti cabang atau sesuaikan filter pencarian</p>
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); handleSelectBranch('all'); }}
              className="mt-3 px-4 py-2 bg-sky-50 text-sky-700 rounded-xl text-xs font-bold"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          filteredCages.map((cage) => (
            <KandangCard key={cage.id} cage={cage} />
          ))
        )}
      </div>

      {/* Modern Floating Action Button (FAB) */}
      <div className="fixed right-4 bottom-20 z-30">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs shadow-lg shadow-sky-600/35 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Kandang</span>
        </button>
      </div>

      {/* Modal Tambah Kandang */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tambah Unit Kandang Baru"
        subtitle="Registrasikan unit kandang baru ke cabang yang dipilih"
      >
        <form onSubmit={handleAddKandang} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Pilih Cabang Peternakan
            </label>
            <select
              value={newBranchId}
              onChange={(e) => setNewBranchId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.location})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tipe Kandang
              </label>
              <select
                value={newTipe}
                onChange={(e) => setNewTipe(e.target.value as 'KAWAT' | 'KAYU')}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
              >
                <option value="KAWAT">KAWAT (Closed)</option>
                <option value="KAYU">KAYU (Open)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nama / Penomoran
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: KAWAT-07"
                value={newNama}
                onChange={(e) => setNewNama(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nama Operator Bertugas
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: YUDI PRAKOSO"
              value={newOperator}
              onChange={(e) => setNewOperator(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Kapasitas (Ekor)
              </label>
              <input
                type="number"
                required
                min="100"
                value={newKapasitas}
                onChange={(e) => setNewKapasitas(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Umur Ayam (Minggu)
              </label>
              <input
                type="number"
                required
                min="1"
                max="120"
                value={newUmurMgg}
                onChange={(e) => setNewUmurMgg(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 h-12 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm shadow-md shadow-sky-600/25"
            >
              Simpan Kandang
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast Notification */}
      <div
        className={`fixed bottom-24 left-4 right-4 z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 transition-all duration-300 ${
          showSuccessToast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-sm">Kandang Baru Berhasil Ditambahkan!</p>
          <p className="text-xs text-slate-300">Tersimpan di cabang peternakan yang dipilih.</p>
        </div>
      </div>
    </div>
  );
}
