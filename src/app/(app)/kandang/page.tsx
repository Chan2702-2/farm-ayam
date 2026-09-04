'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Building2,
  Warehouse,
  CheckCircle2,
  X,
  Trash2,
  Layers
} from 'lucide-react';
import {
  getFarmCages,
  saveFarmCages,
  getFarmBranches,
  addFarmBranch,
  deleteFarmBranch,
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
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Branch Form State
  const [branchCode, setBranchCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchLocation, setBranchLocation] = useState('');

  // Add Cage Form State
  const [newBranchId, setNewBranchId] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newTipe, setNewTipe] = useState<'KAWAT' | 'KAYU'>('KAWAT');
  const [newOperator, setNewOperator] = useState('');
  const [newKapasitas, setNewKapasitas] = useState('4000');
  const [newUmurMgg, setNewUmurMgg] = useState('30');
  const [newJenis, setNewJenis] = useState('LAYER LOHMANN');

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const loadData = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    const brs = getFarmBranches();
    setBranches(brs);

    if (brs.length > 0 && !newBranchId) {
      setNewBranchId(brs[0].id);
    }

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

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim() || !branchCode.trim()) {
      alert('Silakan lengkapi nama cabang dan kode cabang.');
      return;
    }

    const created = addFarmBranch({
      code: branchCode,
      name: branchName,
      location: branchLocation,
    });

    setBranchCode('');
    setBranchName('');
    setBranchLocation('');
    setShowAddBranchModal(false);
    setNewBranchId(created.id);
    setToastMessage(`Cabang "${created.name}" berhasil dibuat!`);
    setTimeout(() => setToastMessage(null), 3000);
    loadData();
  };

  const handleAddKandang = (e: React.FormEvent) => {
    e.preventDefault();
    if (branches.length === 0) {
      alert('Belum ada cabang terdaftar. Silakan buat cabang terlebih dahulu.');
      setShowAddModal(false);
      setShowAddBranchModal(true);
      return;
    }

    if (!newNama || !newOperator) {
      alert('Silakan lengkapi nama kandang dan nama operator.');
      return;
    }

    const targetBranchId = newBranchId || branches[0].id;
    const branchObj = branches.find((b) => b.id === targetBranchId) || branches[0];
    const allCages = getFarmCages('all');
    const branchCages = allCages.filter((c) => c.branchId === branchObj.id);
    const nextIndex = branchCages.length + 1;
    const kap = Number(newKapasitas) || 4000;

    const newCage: FarmCageData = {
      id: `cage-${Date.now()}`,
      index: nextIndex,
      branchId: branchObj.id,
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
      beratAktual: 0,
      beratStandard: 1858,
      pagiIkat: 0,
      soreIkat: 0,
      butir: 0,
      retak: 0,
      putih: 0,
      kotorPutih: 0,
      k: 0,
      r: 0,
      l: 0,
      totalProduksi: 0,
      actPercent: 0,
      standardPercent: 95.5,
      obat: null,
    };

    const updated = [newCage, ...allCages];
    saveFarmCages(updated);
    setCages(getFarmCages(activeBranch));

    setShowAddModal(false);
    setNewNama('');
    setNewOperator('');
    setToastMessage(`Kandang "${newCage.name}" berhasil ditambahkan!`);
    setTimeout(() => setToastMessage(null), 3000);
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

  const totalAyam = cages.reduce((acc, c) => acc + (c.populasiHidup || 0), 0);

  return (
    <div className="pt-16 sm:pt-20 pb-28 px-3.5 sm:px-4 space-y-3.5 sm:space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-jakarta font-bold text-xl text-slate-900">
            Daftar Kandang
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {cages.length} Kandang Terdaftar &bull; {totalAyam.toLocaleString('id-ID')} Total Ekor
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowAddBranchModal(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95"
            title="Tambah Cabang Peternakan"
          >
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="hidden xs:inline">+ Cabang</span>
            <span className="xs:hidden">+ Cabang</span>
          </button>

          <button
            onClick={() => {
              if (branches.length === 0) {
                setShowAddBranchModal(true);
              } else {
                setShowAddModal(true);
              }
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-sm shadow-sky-600/25 active:scale-95 transition-all"
            title="Tambah Unit Kandang"
          >
            <Plus className="w-4 h-4" />
            <span>+ Kandang</span>
          </button>
        </div>
      </div>

      {/* Multi-Branch Filter Tabs */}
      {branches.length === 0 ? (
        /* Empty Branch State */
        <div className="p-6 text-center bg-white rounded-2xl border border-dashed border-sky-200 shadow-xs space-y-2.5">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-jakarta font-bold text-sm text-slate-800">
              Belum Ada Cabang Peternakan
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">
              Data dimulai dari awal. Silakan buat cabang pertama Anda untuk mendaftarkan kandang.
            </p>
          </div>
          <button
            onClick={() => setShowAddBranchModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Cabang Sekarang</span>
          </button>
        </div>
      ) : currentUser && currentUser.role === 'PENGAWAS' ? (
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
            Semua Cabang ({branches.length})
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
              {b.shortName} ({b.totalCages || 0})
            </button>
          ))}
        </div>
      )}

      {/* Search Bar & Filter (only shown if branches exist) */}
      {branches.length > 0 && (
        <>
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

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-[#0284c7] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Semua ({cages.length})
            </button>
            <button
              onClick={() => setStatusFilter('attention')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'attention'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Perlu Perhatian
            </button>
            <button
              onClick={() => setStatusFilter('below')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'below'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Below Std
            </button>
            <button
              onClick={() => setStatusFilter('excellent')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'excellent'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Excellent
            </button>
          </div>
        </>
      )}

      {/* Cage List */}
      <div className="space-y-3">
        {branches.length > 0 && filteredCages.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
            <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <Warehouse className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Belum ada kandang di cabang ini</p>
            <p className="text-xs text-slate-400">Silakan tambahkan kandang pertama untuk mulai beroperasi.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 px-4 py-2 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kandang</span>
            </button>
          </div>
        ) : (
          filteredCages.map((cage) => (
            <KandangCard key={cage.id} cage={cage} />
          ))
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      {branches.length > 0 && (
        <div className="fixed right-4 bottom-20 z-30 flex flex-col gap-2 items-end">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs shadow-lg shadow-sky-600/35 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Kandang</span>
          </button>
        </div>
      )}

      {/* Modal Tambah Cabang */}
      <Modal
        isOpen={showAddBranchModal}
        onClose={() => setShowAddBranchModal(false)}
        title="Tambah Cabang Peternakan"
        subtitle="Daftarkan cabang lokasi peternakan baru"
        maxWidth="md"
      >
        <form onSubmit={handleAddBranch} className="space-y-3.5 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nama Cabang <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Cabang 3 Alur (Pusat)"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Kode Cabang <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 3-ALUR"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7] uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Lokasi / Blok
              </label>
              <input
                type="text"
                placeholder="Contoh: Sukamaju Blok A"
                value={branchLocation}
                onChange={(e) => setBranchLocation(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
              />
            </div>
          </div>

          {branches.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Cabang Terdaftar ({branches.length})
              </span>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {branches.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{b.name}</span>
                      <span className="text-slate-400 ml-1.5 text-[10px]">({b.code})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Yakin ingin menghapus cabang "${b.name}" beserta semua kandangnya?`)) {
                          deleteFarmBranch(b.id);
                          loadData();
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Hapus Cabang"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setShowAddBranchModal(false)}
              className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 h-12 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm shadow-md shadow-sky-600/25"
            >
              Simpan Cabang
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah Kandang */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tambah Unit Kandang Baru"
        subtitle="Registrasikan unit kandang baru ke cabang yang dipilih"
        maxWidth="md"
      >
        <form onSubmit={handleAddKandang} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Pilih Cabang Peternakan <span className="text-red-500">*</span>
            </label>
            <select
              value={newBranchId}
              onChange={(e) => setNewBranchId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.location || b.code})
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
                Nama / Penomoran <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: KAWAT-01"
                value={newNama}
                onChange={(e) => setNewNama(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nama Operator Bertugas <span className="text-red-500">*</span>
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
                min="10"
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
                max="150"
                value={newUmurMgg}
                onChange={(e) => setNewUmurMgg(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Jenis Ayam
            </label>
            <input
              type="text"
              placeholder="Contoh: LAYER LOHMANN"
              value={newJenis}
              onChange={(e) => setNewJenis(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
            />
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
          toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-sm">Operasi Berhasil!</p>
          <p className="text-xs text-slate-300">{toastMessage}</p>
        </div>
      </div>
    </div>
  );
}
