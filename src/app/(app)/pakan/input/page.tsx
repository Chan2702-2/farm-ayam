'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wheat,
  ChevronDown,
  CheckCircle2,
  Save,
  Warehouse,
  Building2,
  Scale,
  PackageCheck,
  AlertCircle,
  Calendar,
  Layers,
  TableProperties,
  ArrowRight,
  Plus
} from 'lucide-react';
import {
  getFarmCages,
  getFarmBranches,
  getFeedDistribution,
  saveFeedDistribution,
  FeedDistributionItem,
  FarmCageData,
  FarmBranch
} from '@/lib/data/farm-data';
import { Modal } from '@/components/ui/Modal';
import { getCurrentUser, filterCagesForUser, AuthUser } from '@/lib/data/auth-users';
import { addActivityLog } from '@/lib/data/activity-log';
import { markDataDirty, performAutoSync, isSyncNeeded, enqueuePendingSync } from '@/lib/sync/auto-sync';

interface BatchRowState {
  cageId: string;
  cageName: string;
  fullName: string;
  operator: string;
  populasi: number;
  umurMgg: number;
  jenisPakan: string;
  konsumsiGr: number;
  sisaKg: number;
}

export default function InputPakanPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [branches, setBranches] = useState<FarmBranch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [cages, setCages] = useState<FarmCageData[]>([]);
  const [selectedCageId, setSelectedCageId] = useState<string>('');
  
  // View mode: 'single' (per kandang) or 'table' (tabel per cabang)
  const [viewMode, setViewMode] = useState<'single' | 'table'>('single');

  // Modals & Notices
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showCageModal, setShowCageModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Data pakan berhasil disimpan!');
  const [isSaving, setIsSaving] = useState(false);

  // Date State (default to today: YYYY-MM-DD)
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split('T')[0]);

  // Form State for Single Mode
  const [jenisPakan, setJenisPakan] = useState<string>('LAYER');
  const [umurMgg, setUmurMgg] = useState<number>(30);
  const [populasi, setPopulasi] = useState<number>(4000);
  const [konsumsiGr, setKonsumsiGr] = useState<number>(123);
  const [sisaKg, setSisaKg] = useState<number>(0);

  // Batch Table State
  const [batchRows, setBatchRows] = useState<Record<string, BatchRowState>>({});

  // Initial Load
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

    const brs = getFarmBranches();
    setBranches(brs);

    const allList = getFarmCages('all');
    const userList = filterCagesForUser(allList, user);
    setCages(userList);

    // Initial branch selection
    let initialBranch = brs[0]?.id || '';
    if (user && user.role === 'PENGAWAS' && user.branchId && user.branchId !== 'all') {
      initialBranch = user.branchId;
    } else if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qBranch = params.get('branch');
      if (qBranch && brs.some((b) => b.id === qBranch)) {
        initialBranch = qBranch;
      }
    }
    setSelectedBranchId(initialBranch);

    // Initial cage selection
    const branchCages = initialBranch ? userList.filter((c) => c.branchId === initialBranch) : userList;
    let initialCage = branchCages[0]?.id || userList[0]?.id || '';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qCage = params.get('cage');
      if (qCage && userList.some((c) => c.id === qCage)) {
        initialCage = qCage;
        const matchingCage = userList.find((c) => c.id === qCage);
        if (matchingCage) {
          initialBranch = matchingCage.branchId;
          setSelectedBranchId(matchingCage.branchId);
        }
      }
    }
    setSelectedCageId(initialCage);

    return () => {
      // Skema: saat keluar dari menu input & jika online, lakukan sinkron otomatis
      if (typeof window !== 'undefined' && navigator.onLine && isSyncNeeded()) {
        performAutoSync();
      }
    };
  }, []);

  // Filter cages for currently selected branch
  const branchCages = useMemo(() => {
    if (!selectedBranchId || selectedBranchId === 'all') {
      return cages;
    }
    return cages.filter((c) => c.branchId === selectedBranchId);
  }, [cages, selectedBranchId]);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];
  const selectedCage = branchCages.find((c) => c.id === selectedCageId) || branchCages[0];

  // Sync form inputs when selected cage changes
  useEffect(() => {
    if (selectedCage) {
      setPopulasi(selectedCage.populasiHidup || selectedCage.kapasitas || 4000);
      setUmurMgg(selectedCage.umurMgg || 30);
      if (selectedCage.jenis?.toUpperCase().includes('SPESIAL')) {
        setJenisPakan('SPESIAL');
        setKonsumsiGr(125);
      } else if (selectedCage.jenis?.toUpperCase().includes('NOVOGEN')) {
        setJenisPakan('NOVOGEN');
        setKonsumsiGr(123);
      } else {
        setJenisPakan('LAYER');
        setKonsumsiGr(123);
      }
      setSisaKg(0);
    }
  }, [selectedCageId, selectedCage]);

  // Initialize or update Batch Rows for the active branch cages
  useEffect(() => {
    if (branchCages.length > 0) {
      const initialMap: Record<string, BatchRowState> = {};
      branchCages.forEach((c) => {
        initialMap[c.id] = {
          cageId: c.id,
          cageName: c.name,
          fullName: c.fullName,
          operator: c.operator || '-',
          populasi: c.populasiHidup || c.kapasitas || 4000,
          umurMgg: c.umurMgg || 30,
          jenisPakan: c.jenis?.toUpperCase().includes('SPESIAL') ? 'SPESIAL' : 'LAYER',
          konsumsiGr: 123,
          sisaKg: 0,
        };
      });
      setBatchRows(initialMap);
    }
  }, [branchCages]);

  // Live Auto-Calculations for Single Mode
  const jumlahPakanKg = Number(((populasi * konsumsiGr) / 1000).toFixed(2));
  const kirimKg = Math.max(0, Number((jumlahPakanKg - sisaKg).toFixed(2)));
  const kirimSak = Math.floor(kirimKg / 50);
  const penambahanKg = Number((kirimKg % 50).toFixed(1));

  // Batch Calculations
  const batchSummary = useMemo(() => {
    let totalPop = 0;
    let totalKg = 0;
    let totalSak = 0;
    let count = 0;

    Object.values(batchRows).forEach((row) => {
      totalPop += row.populasi;
      const kg = Number(((row.populasi * row.konsumsiGr) / 1000).toFixed(2));
      const kirim = Math.max(0, kg - (row.sisaKg || 0));
      totalKg += kirim;
      totalSak += Math.floor(kirim / 50);
      count++;
    });

    return { totalPop, totalKg: Number(totalKg.toFixed(1)), totalSak, count };
  }, [batchRows]);

  const handleBranchSelect = (bId: string) => {
    setSelectedBranchId(bId);
    setShowBranchModal(false);
    const newBranchCages = cages.filter((c) => c.branchId === bId);
    if (newBranchCages.length > 0) {
      setSelectedCageId(newBranchCages[0].id);
    }
  };

  const handleSaveSingle = async () => {
    if (!selectedCage) return;
    setIsSaving(true);

    try {
      const existingFeed = getFeedDistribution('all');
      const newItem: FeedDistributionItem = {
        id: `feed-${selectedCage.id}-${Date.now()}`,
        branchId: selectedCage.branchId,
        branchName: selectedCage.branchName,
        kandang: selectedCage.fullName,
        jenisPakan,
        umur: umurMgg,
        populasi,
        konsumsiGr,
        jumlahPakanKg,
        sisaKg,
        kirimKg,
        kirimSak,
        penambahanKg,
        tanggal,
      };

      // Update local storage
      const updated = [newItem, ...existingFeed.filter((f) => f.kandang !== selectedCage.fullName)];
      saveFeedDistribution(updated);

      // Add activity log
      addActivityLog({
        userName: currentUser?.name || 'Pengawas Lapangan',
        userRole: currentUser?.role || 'PENGAWAS',
        branchId: selectedCage.branchId,
        branchName: selectedCage.branchName,
        actionType: 'PAKAN',
        title: `Alokasi Pakan ${selectedCage.name}`,
        description: `Alokasi ${kirimSak} sak (${kirimKg} kg) pakan ${jenisPakan} untuk ${populasi.toLocaleString('id-ID')} ekor ayam di ${selectedCage.branchName}.`,
      });

      const pakanRow = {
        tanggal,
        branchId: selectedCage.branchId,
        branchName: selectedCage.branchName,
        cageId: selectedCage.id,
        cageName: selectedCage.name,
        populasi,
        jenisPakan,
        jumlahPakanKg,
        kirimKg,
        kirimSak,
        sisaKg: sisaKg || 0,
        konsumsiGrPerEkor: konsumsiGr,
        statusCeklis: 'Terverifikasi',
        catatan: `Sisa: ${sisaKg || 0} kg, Masuk: ${kirimSak} sak`,
        userName: currentUser?.name || 'Pengawas Lapangan',
      };

      // Tandai data telah berubah secara lokal
      markDataDirty();

      if (!navigator.onLine) {
        enqueuePendingSync({
          type: 'pakan',
          url: '/api/sheets/sync-pakan',
          payload: { row: pakanRow },
        });
        console.log('[Offline] Data alokasi pakan disimpan di antrean HP.');
      } else {
        // Background sync to Google Sheets "Distribusi Pakan"
        fetch('/api/sheets/sync-pakan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ row: pakanRow }),
        })
          .then(() => performAutoSync())
          .catch((err) => {
            console.warn('Background sync pakan ke Google Sheets gagal, diantrekan:', err);
            enqueuePendingSync({
              type: 'pakan',
              url: '/api/sheets/sync-pakan',
              payload: { row: pakanRow },
            });
          });
      }

      setShowConfirmModal(false);
      setToastMessage(`Alokasi Pakan ${selectedCage.name} (${selectedCage.branchName}) berhasil disimpan!`);
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
        router.push('/pakan');
      }, 1500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBatch = async () => {
    const rowsToSave = Object.values(batchRows);
    if (rowsToSave.length === 0) return;
    setIsSaving(true);

    try {
      const existingFeed = getFeedDistribution('all');
      const branchName = selectedBranch?.name || 'Cabang';
      const branchId = selectedBranch?.id || selectedBranchId;

      const newItems: FeedDistributionItem[] = rowsToSave.map((r) => {
        const kg = Number(((r.populasi * r.konsumsiGr) / 1000).toFixed(2));
        const kirim = Math.max(0, Number((kg - (r.sisaKg || 0)).toFixed(2)));
        const sak = Math.floor(kirim / 50);
        const sisa = Number((kirim % 50).toFixed(1));

        return {
          id: `feed-${r.cageId}-${Date.now()}`,
          branchId,
          branchName,
          kandang: r.fullName,
          jenisPakan: r.jenisPakan,
          umur: r.umurMgg,
          populasi: r.populasi,
          konsumsiGr: r.konsumsiGr,
          jumlahPakanKg: kg,
          sisaKg: r.sisaKg,
          kirimKg: kirim,
          kirimSak: sak,
          penambahanKg: sisa,
          tanggal,
        };
      });

      const cageFullNames = new Set(newItems.map((item) => item.kandang));
      const filteredExisting = existingFeed.filter((f) => !cageFullNames.has(f.kandang));
      saveFeedDistribution([...newItems, ...filteredExisting]);

      addActivityLog({
        userName: currentUser?.name || 'Pengawas Lapangan',
        userRole: currentUser?.role || 'PENGAWAS',
        branchId,
        branchName,
        actionType: 'PAKAN',
        title: `Alokasi Pakan Seluruh Kandang (${branchName})`,
        description: `Menyimpan pakan untuk ${newItems.length} unit kandang (${batchSummary.totalSak} sak / ${batchSummary.totalKg} kg).`,
      });

      const batchPayload = {
        rows: newItems.map((item) => ({
          tanggal,
          branchId: item.branchId,
          branchName: item.branchName,
          cageId: item.id,
          cageName: item.kandang,
          populasi: item.populasi,
          jenisPakan: item.jenisPakan,
          jumlahPakanKg: item.jumlahPakanKg,
          kirimKg: item.kirimKg,
          kirimSak: item.kirimSak,
          sisaKg: item.sisaKg || 0,
          konsumsiGrPerEkor: item.konsumsiGr,
          statusCeklis: 'Terverifikasi',
          catatan: `Sisa: ${item.sisaKg || 0} kg, Masuk: ${item.kirimSak || 0} sak`,
          userName: currentUser?.name || 'Pengawas Lapangan',
        })),
      };

      // Tandai data telah berubah secara lokal
      markDataDirty();

      if (!navigator.onLine) {
        enqueuePendingSync({
          type: 'pakan',
          url: '/api/sheets/sync-pakan',
          payload: batchPayload,
        });
        console.log('[Offline] Data batch pakan disimpan di antrean HP.');
      } else {
        // Background sync batch rows to Google Sheets "Distribusi Pakan"
        fetch('/api/sheets/sync-pakan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batchPayload),
        })
          .then(() => performAutoSync())
          .catch((err) => {
            console.warn('Background batch sync pakan gagal, diantrekan:', err);
            enqueuePendingSync({
              type: 'pakan',
              url: '/api/sheets/sync-pakan',
              payload: batchPayload,
            });
          });
      }

      setToastMessage(`Sukses mencatat ${newItems.length} kandang di ${branchName} ke Spreadsheet!`);
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
        router.push('/pakan');
      }, 1500);
    } finally {
      setIsSaving(false);
    }
  };

  const isPengawas = currentUser?.role === 'PENGAWAS';

  // Format Date for Display
  const formattedDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(tanggal));
    } catch {
      return tanggal;
    }
  }, [tanggal]);

  // EMPTY STATE: If no branches exist
  if (branches.length === 0) {
    return (
      <div className="pt-20 pb-28 px-4 max-w-md mx-auto space-y-4">
        <div className="p-6 text-center bg-white rounded-3xl border border-dashed border-amber-200 shadow-sm space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="font-jakarta font-bold text-base text-slate-900">Belum Ada Cabang Terdaftar</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sistem memerlukan minimal satu cabang peternakan untuk mencatat pembagian pakan.
          </p>
          <Link
            href="/kandang"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Cabang di Menu Kandang</span>
          </Link>
        </div>
      </div>
    );
  }

  // EMPTY STATE: If no cages exist in selected branch
  if (branchCages.length === 0) {
    return (
      <div className="pt-20 pb-28 px-4 max-w-md mx-auto space-y-4">
        <div className="p-6 text-center bg-white rounded-3xl border border-dashed border-amber-200 shadow-sm space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Warehouse className="w-6 h-6" />
          </div>
          <h2 className="font-jakarta font-bold text-base text-slate-900">Belum Ada Kandang Terdaftar</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Cabang <strong>{selectedBranch?.name || 'ini'}</strong> belum memiliki unit kandang. Silakan buat kandang terlebih dahulu.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/kandang"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kandang Baru</span>
            </Link>
            {!isPengawas && branches.length > 1 && (
              <button
                onClick={() => setShowBranchModal(true)}
                className="text-xs font-bold text-amber-800 hover:underline py-1"
              >
                Pilih Cabang Lain
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 sm:pt-20 pb-28 px-3.5 sm:px-4 space-y-3.5 sm:space-y-4 max-w-2xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
            Alokasi Pakan Lapangan
          </span>
          <h1 className="font-jakarta font-bold text-lg sm:text-xl text-slate-900">
            Input Pembagian Pakan
          </h1>
        </div>

        {/* Dynamic Date Picker Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-200 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="bg-transparent text-xs font-bold text-amber-900 focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Mode Switcher Tabs: Single vs Table Batch */}
      <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setViewMode('single')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            viewMode === 'single'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Warehouse className="w-3.5 h-3.5 text-amber-600" />
          <span>Formulir Kandang</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('table')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            viewMode === 'table'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TableProperties className="w-3.5 h-3.5 text-amber-600" />
          <span>Tabel Input Cabang ({branchCages.length})</span>
        </button>
      </div>

      {/* STEP 1: Branch Selector Card */}
      <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Cabang Peternakan
              </span>
              <p className="font-jakarta font-bold text-slate-900 text-xs sm:text-sm truncate">
                {selectedBranch?.name || 'Pilih Cabang'}
              </p>
            </div>
          </div>

          {!isPengawas && branches.length > 1 && (
            <button
              onClick={() => setShowBranchModal(true)}
              className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 text-[11px] font-bold transition-colors flex items-center gap-1"
            >
              <span>Ganti Cabang</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: SINGLE CAGE FORM */}
      {viewMode === 'single' && (
        <div className="space-y-3.5">
          {/* STEP 2: Cage Selector Card */}
          <div
            onClick={() => setShowCageModal(true)}
            className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-100 flex items-center justify-between cursor-pointer hover:border-amber-300 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-extrabold text-sm">
                {selectedCage?.index || 1}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Unit Kandang Terpilih (Ketuk untuk ganti)
                </span>
                <p className="font-jakarta font-bold text-slate-900 text-sm truncate">
                  {selectedCage?.name || 'Pilih Kandang'} &bull; <span className="text-amber-700">PJ: {selectedCage?.operator || '-'}</span>
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {selectedCage?.jenis || 'Layer'} &bull; Pop: {selectedCage?.populasiHidup?.toLocaleString('id-ID')} ekor
                </p>
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
          </div>

          {/* Single Cage Form Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-4">
            {/* Jenis Pakan */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Jenis Pakan
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['LAYER', 'SPESIAL', 'NOVOGEN'].map((j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setJenisPakan(j)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      jenisPakan === j
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>

            {/* Umur & Populasi Strip */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Umur Ayam (Minggu)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={umurMgg === 0 ? '' : umurMgg}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^0+(?=\d)/, '');
                    setUmurMgg(Math.max(0, parseInt(clean, 10) || 0));
                  }}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Jumlah Ayam (Ekor)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={populasi === 0 ? '' : populasi}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^0+(?=\d)/, '');
                    setPopulasi(Math.max(0, parseInt(clean, 10) || 0));
                  }}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Standar Konsumsi per Ekor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Standar Konsumsi (Gram / Ekor / Hari)
                </label>
                <span className="text-xs font-bold text-amber-700 font-mono">
                  {konsumsiGr} Gram
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setKonsumsiGr((prev) => Math.max(80, prev - 1))}
                  className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-sm text-slate-700 active:scale-95 transition-all shrink-0"
                >
                  -1
                </button>
                <input
                  type="number"
                  placeholder="0"
                  value={konsumsiGr === 0 ? '' : konsumsiGr}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^0+(?=\d)/, '');
                    setKonsumsiGr(Math.max(0, parseInt(clean, 10) || 0));
                  }}
                  className="flex-1 h-11 text-center font-mono font-bold text-base bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setKonsumsiGr((prev) => prev + 1)}
                  className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-sm text-slate-700 active:scale-95 transition-all shrink-0"
                >
                  +1
                </button>
              </div>

              {/* Preset Buttons */}
              <div className="flex gap-1.5 mt-2">
                {[120, 122, 123, 125, 128].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setKonsumsiGr(g)}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      konsumsiGr === g
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {g}g
                  </button>
                ))}
              </div>
            </div>

            {/* Sisa Pakan Kemarin */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Sisa Pakan Kemarin di Kandang (KG)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="0"
                value={sisaKg === 0 ? '' : sisaKg}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const clean = e.target.value.replace(/^0+(?=\d)/, '');
                  setSisaKg(Math.max(0, parseFloat(clean) || 0));
                }}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Auto-Calculation Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-xs space-y-2">
            <span className="text-[10px] uppercase font-bold text-amber-200 block">
              Kalkulasi Kebutuhan & Pengiriman Pakan
            </span>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-amber-600/60">
              <div>
                <span className="text-[11px] text-amber-200 block">Kebutuhan Pakan (KG)</span>
                <strong className="font-jakarta font-extrabold text-xl">
                  {jumlahPakanKg.toLocaleString('id-ID')} KG
                </strong>
              </div>

              <div>
                <span className="text-[11px] text-amber-200 block">Yang Harus Dikirim</span>
                <strong className="font-jakarta font-extrabold text-xl text-yellow-300">
                  {kirimSak} SAK {penambahanKg > 0 ? `+ ${penambahanKg} kg` : ''}
                </strong>
              </div>
            </div>

            <p className="text-[11px] text-amber-100/90 pt-1">
              Formula: ({populasi.toLocaleString('id-ID')} ekor &times; {konsumsiGr}g) - {sisaKg}kg sisa = <strong>{kirimKg} KG</strong>
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={isSaving}
            className="w-full h-13 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-amber-700/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Alokasi Pakan'}</span>
          </button>
        </div>
      )}

      {/* VIEW MODE 2: BATCH TABLE FOR ALL CAGES IN BRANCH */}
      {viewMode === 'table' && (
        <div className="space-y-3.5">
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-jakarta font-bold text-sm text-slate-900">
                  Tabel Alokasi Pakan: {selectedBranch?.name}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {formattedDate} &bull; {branchCages.length} Unit Kandang
                </p>
              </div>
            </div>

            {/* Scrollable Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase tracking-wider">
                    <th className="p-2.5 border-b border-r border-slate-200">Kandang</th>
                    <th className="p-2.5 border-b border-r border-slate-200 text-center">Populasi</th>
                    <th className="p-2.5 border-b border-r border-slate-200 text-center">Konsumsi (gr)</th>
                    <th className="p-2.5 border-b border-r border-slate-200 text-center">Pakan (Kg)</th>
                    <th className="p-2.5 border-b border-slate-200 text-center">Kirim Sak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {branchCages.map((c) => {
                    const row = batchRows[c.id] || {
                      populasi: c.populasiHidup || 4000,
                      konsumsiGr: 123,
                      sisaKg: 0,
                    };
                    const kg = Number(((row.populasi * row.konsumsiGr) / 1000).toFixed(1));
                    const sak = Math.floor(kg / 50);
                    const sisa = (kg % 50).toFixed(1);

                    return (
                      <tr key={c.id} className="hover:bg-amber-50/20">
                        <td className="p-2.5 border-r border-slate-100">
                          <strong className="block text-slate-900">{c.name}</strong>
                          <span className="text-[10px] text-slate-400">PJ: {c.operator || '-'}</span>
                        </td>
                        <td className="p-2.5 border-r border-slate-100 text-center font-mono font-bold text-slate-800">
                          <input
                            type="number"
                            placeholder="0"
                            value={row.populasi === 0 ? '' : row.populasi}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/^0+(?=\d)/, '');
                              const val = Math.max(0, parseInt(clean, 10) || 0);
                              setBatchRows((prev) => ({
                                ...prev,
                                [c.id]: { ...prev[c.id], populasi: val },
                              }));
                            }}
                            className="w-20 h-7 text-center font-bold bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </td>
                        <td className="p-2.5 border-r border-slate-100 text-center">
                          <input
                            type="number"
                            placeholder="0"
                            value={row.konsumsiGr === 0 ? '' : row.konsumsiGr}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/^0+(?=\d)/, '');
                              const val = Math.max(0, parseInt(clean, 10) || 0);
                              setBatchRows((prev) => ({
                                ...prev,
                                [c.id]: { ...prev[c.id], konsumsiGr: val },
                              }));
                            }}
                            className="w-16 h-7 text-center font-bold bg-slate-50 border border-slate-200 rounded-lg text-amber-800"
                          />
                        </td>
                        <td className="p-2.5 border-r border-slate-100 text-center font-mono font-bold text-amber-700">
                          {kg} kg
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-emerald-700">
                          {sak} Sak {Number(sisa) > 0 ? `+${sisa}kg` : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Row Banner */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-amber-800 font-bold uppercase block">
                  Total Alokasi Cabang Ini
                </span>
                <strong className="text-amber-900 text-sm font-jakarta">
                  {batchSummary.totalKg.toLocaleString('id-ID')} KG ({batchSummary.totalSak} SAK)
                </strong>
              </div>
              <div className="text-right text-[11px] text-amber-800">
                <span>Pop: <strong>{batchSummary.totalPop.toLocaleString('id-ID')}</strong> ekor</span>
              </div>
            </div>

            {/* Save All Button */}
            <button
              type="button"
              onClick={handleSaveBatch}
              disabled={isSaving}
              className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-amber-700/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : `Simpan Seluruh Kandang (${branchCages.length}) ke Spreadsheet`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Pilih Cabang */}
      <Modal
        isOpen={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        title="Pilih Cabang Peternakan"
        subtitle="Pilih lokasi farm untuk input pembagian pakan"
      >
        <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar">
          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => handleBranchSelect(b.id)}
              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                selectedBranchId === b.id
                  ? 'bg-amber-50 border-amber-600 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="min-w-0">
                  <strong className="block text-sm truncate">{b.name}</strong>
                  <span className="text-xs text-slate-500 truncate block">
                    {b.location || 'Lokasi Farm'} &bull; {b.totalCages || 0} Kandang
                  </span>
                </div>
              </div>
              {selectedBranchId === b.id && <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />}
            </button>
          ))}
        </div>
      </Modal>

      {/* Modal Pilih Kandang */}
      <Modal
        isOpen={showCageModal}
        onClose={() => setShowCageModal(false)}
        title="Pilih Unit Kandang"
        subtitle={`Daftar unit kandang di ${selectedBranch?.name || 'Cabang Terpilih'}`}
      >
        <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar">
          {branchCages.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCageId(c.id);
                setShowCageModal(false);
              }}
              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                selectedCageId === c.id
                  ? 'bg-amber-50 border-amber-600 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div>
                <strong className="block text-sm font-jakarta">{c.name}</strong>
                <span className="text-xs text-slate-500">
                  Operator: <strong>{c.operator || '-'}</strong> &bull; Populasi: {c.populasiHidup?.toLocaleString('id-ID')} ekor &bull; {c.jenis}
                </span>
              </div>
              {selectedCageId === c.id && <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />}
            </button>
          ))}
        </div>
      </Modal>

      {/* Confirm Modal for Single Mode */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Konfirmasi Pembagian Pakan"
        subtitle="Pastikan estimasi kebutuhan pakan sudah tepat"
      >
        <div className="space-y-3.5">
          <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Cabang:</span>
              <strong className="text-slate-800">{selectedCage?.branchName}</strong>
            </div>
            <div className="flex justify-between">
              <span>Unit Kandang:</span>
              <strong className="text-slate-800">{selectedCage?.name}</strong>
            </div>
            <div className="flex justify-between">
              <span>Operator PJ:</span>
              <span className="text-slate-800 font-semibold">{selectedCage?.operator}</span>
            </div>
            <div className="flex justify-between">
              <span>Jenis Pakan:</span>
              <span className="text-slate-800 font-semibold">{jenisPakan}</span>
            </div>
            <div className="flex justify-between">
              <span>Populasi & Konsumsi:</span>
              <span className="text-slate-800">{populasi.toLocaleString('id-ID')} ekor ({konsumsiGr}g/hari)</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5">
              <span>Total Kebutuhan:</span>
              <strong className="text-slate-800">{jumlahPakanKg} KG</strong>
            </div>
            <div className="flex justify-between">
              <span>Yang Dikirim:</span>
              <strong className="text-amber-700 text-sm">{kirimSak} SAK ({kirimKg} KG)</strong>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
            >
              Cek Lagi
            </button>
            <button
              onClick={handleSaveSingle}
              disabled={isSaving}
              className="flex-1 h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Ya, Simpan & Sync'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      <div
        className={`fixed bottom-24 left-4 right-4 z-50 bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex items-center gap-3 transition-all duration-300 ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <p className="font-bold text-xs sm:text-sm">Alokasi Pakan Disimpan!</p>
          <p className="text-[11px] text-slate-300">{toastMessage}</p>
        </div>
      </div>
    </div>
  );
}
