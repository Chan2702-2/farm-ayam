'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  HeartCrack,
  Save,
  CheckCircle2,
  ChevronDown,
  Warehouse,
  AlertTriangle,
  Camera,
  X,
  Check,
  Calendar
} from 'lucide-react';
import { getFarmCages, saveFarmCages, getCageById, FarmCageData } from '@/lib/data/farm-data';
import { Modal } from '@/components/ui/Modal';
import { getCurrentUser } from '@/lib/data/auth-users';
import { addActivityLog } from '@/lib/data/activity-log';
import { markDataDirty, performAutoSync, isSyncNeeded, enqueuePendingSync } from '@/lib/sync/auto-sync';

export default function CatatKematianPage() {
  const router = useRouter();

  const [cages, setCages] = useState<FarmCageData[]>([]);
  const [selectedCage, setSelectedCage] = useState<FarmCageData | null>(null);
  const [showCageModal, setShowCageModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Dynamic Date
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split('T')[0]);

  const [mati, setMati] = useState(0);
  const [penyebab, setPenyebab] = useState('Penyebab Normal / Alami');
  const [catatan, setCatatan] = useState('');
  const [afkir, setAfkir] = useState(0);
  const [mutasi, setMutasi] = useState(0);

  useEffect(() => {
    const list = getFarmCages();
    setCages(list);
    let cageId = 'cage-1';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paramCage = params.get('cage');
      if (paramCage) cageId = paramCage;
    }
    const initial = getCageById(cageId) || list[0];
    if (initial) {
      setSelectedCage(initial);
      setMati(initial.mati || 2);
      setAfkir(initial.afkir || 0);
      setMutasi(initial.mutasiKeluar || 0);
    }

    return () => {
      // Skema: saat keluar dari menu input & jika online, lakukan sinkron otomatis
      if (typeof window !== 'undefined' && navigator.onLine && isSyncNeeded()) {
        performAutoSync();
      }
    };
  }, []);

  const initialPop = selectedCage?.populasiAwal || 4104;
  const currentPop = selectedCage?.populasiHidup || 4065;
  const sisaAyam = Math.max(0, currentPop - mati - afkir - mutasi);
  const mortalityRate = initialPop > 0 ? (mati / initialPop) * 100 : 0;
  const isAman = mortalityRate <= 0.05;

  const handleSave = () => {
    if (!selectedCage) return;

    const updated = cages.map((c) => {
      if (c.id === selectedCage.id) {
        return {
          ...c,
          mati,
          afkir,
          mutasiKeluar: mutasi,
          populasiHidup: sisaAyam,
        };
      }
      return c;
    });

    setCages(updated);
    saveFarmCages(updated);

    const user = getCurrentUser();
    addActivityLog({
      userName: user?.name || 'Pengawas Lapangan',
      userRole: user?.role || 'PENGAWAS',
      branchId: selectedCage.branchId,
      branchName: selectedCage.branchName,
      actionType: 'MORTALITAS',
      title: `Catat Kematian ${selectedCage.name} (${tanggal})`,
      description: `Mencatat ${mati} ekor mati (${penyebab}). Sisa populasi: ${sisaAyam.toLocaleString('id-ID')} ekor.`,
    });

    const popRow = {
      tanggal: tanggal || new Date().toISOString().split('T')[0],
      branchId: selectedCage.branchId,
      branchName: selectedCage.branchName,
      cageId: selectedCage.id,
      cageName: selectedCage.name,
      tipe: 'KEMATIAN' as const,
      jumlah: mati,
      populasiAkhir: sisaAyam,
      catatan: `${penyebab} - ${catatan}`,
      userName: user?.name || 'Pengawas Lapangan',
    };

    // Tandai data telah berubah
    markDataDirty();

    if (!navigator.onLine) {
      enqueuePendingSync({
        type: 'populasi',
        url: '/api/sheets/sync-populasi',
        payload: { row: popRow },
      });
      console.log('[Offline] Data kematian disimpan di antrean HP.');
    } else {
      // Otomatis sinkronisasi ke Google Sheets di background
      fetch('/api/sheets/sync-populasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row: popRow }),
      })
        .then(() => performAutoSync())
        .catch((err) => {
          console.warn('Background sync kematian gagal, diantrekan:', err);
          enqueuePendingSync({
            type: 'populasi',
            url: '/api/sheets/sync-populasi',
            payload: { row: popRow },
          });
        });
    }

    setShowConfirmModal(false);
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
      router.push('/kandang');
    }, 1800);
  };

  return (
    <div className="pt-16 sm:pt-20 pb-28 px-3.5 sm:px-4 space-y-3.5 sm:space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Pencatatan Mortalitas
          </span>
          <h1 className="font-jakarta font-bold text-lg sm:text-xl text-slate-900">
            Catat Kematian & Afkir
          </h1>
        </div>

        {/* Dynamic Date Picker Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="bg-transparent text-xs font-bold text-red-700 focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      <div
        onClick={() => setShowCageModal(true)}
        className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-red-200"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <Warehouse className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Kandang Aktif
            </span>
            <p className="font-jakarta font-bold text-slate-900 text-sm truncate">
              {selectedCage?.fullName}
            </p>
          </div>
        </div>
        <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-4 rounded-full bg-red-600" />
            <h2 className="font-jakarta font-bold text-sm text-slate-900">
              Jumlah Kematian (Ekor)
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold">
            Wajib Diisi
          </span>
        </div>

        <div className="flex items-center justify-between max-w-xs mx-auto py-2">
          <button
            type="button"
            onClick={() => setMati(Math.max(0, mati - 1))}
            className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-700 font-bold text-xl flex items-center justify-center transition-transform"
          >
            -
          </button>
          <div className="text-center">
            <input
              type="number"
              min="0"
              value={mati}
              onChange={(e) => setMati(Number(e.target.value) || 0)}
              className="w-24 text-center font-jakarta font-extrabold text-4xl text-red-600 bg-transparent outline-none p-0"
            />
            <span className="text-xs text-slate-400 font-medium block">Ekor Mati</span>
          </div>
          <button
            type="button"
            onClick={() => setMati(mati + 1)}
            className="w-12 h-12 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-90 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-red-600/25 transition-transform"
          >
            +
          </button>
        </div>

        <div className="flex justify-center gap-2 pt-1">
          {[1, 2, 5, 10].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setMati(mati + num)}
              className="px-3.5 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs active:scale-95"
            >
              +{num} Ekor
            </button>
          ))}
        </div>

        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Penyebab Kematian Dominan
          </label>
          <select
            value={penyebab}
            onChange={(e) => setPenyebab(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none"
          >
            <option value="Heat Stress / Suhu Tinggi">Heat Stress / Suhu Tinggi</option>
            <option value="Gejala Sakit / Bakteri">Gejala Sakit / Bakteri</option>
            <option value="Trauma / Terjepit Tier">Trauma / Terjepit Tier Kandang</option>
            <option value="Prolapse / Kanibalisme">Prolapse / Kanibalisme</option>
            <option value="Penyebab Lainnya">Penyebab Lainnya</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <h3 className="font-jakarta font-bold text-sm text-slate-900">
          Kalkulasi Sisa Unggas Hidup
        </h3>
        <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Populasi Awal:</span>
            <strong>{currentPop.toLocaleString('id-ID')} ekor</strong>
          </div>
          <div className="flex justify-between text-red-600">
            <span>Kematian:</span>
            <strong>-{mati} ekor</strong>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
            <span className="font-bold text-slate-900">Sisa Hidup:</span>
            <strong className="font-bold text-[#0284c7]">{sisaAyam.toLocaleString('id-ID')} ekor</strong>
          </div>
        </div>

        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Mortalitas Rate:</span>
            <strong className={`font-bold ${isAman ? 'text-emerald-700' : 'text-red-600'}`}>
              {mortalityRate.toFixed(3)}% &bull; {isAman ? 'Aman (<0.05%)' : 'Waspada'}
            </strong>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isAman ? 'bg-emerald-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, Math.max(5, (mortalityRate / 0.1) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          Catatan Petugas Lapangan
        </label>
        <textarea
          rows={2}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none"
          placeholder="Catatan kondisi kandang..."
        />
      </div>

      <button
        type="button"
        onClick={() => setShowConfirmModal(true)}
        className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-jakarta font-bold text-sm shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 transition-all"
      >
        <Save className="w-5 h-5" />
        <span>Simpan Data Mortalitas</span>
      </button>

      <Modal
        isOpen={showCageModal}
        onClose={() => setShowCageModal(false)}
        title="Pilih Kandang"
        subtitle="Pilih unit kandang untuk dicatat mortalitasnya"
      >
        <div className="space-y-2 max-h-96">
          {cages.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCage(c);
                setMati(c.mati || 0);
                setShowCageModal(false);
              }}
              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between ${
                selectedCage?.id === c.id ? 'bg-red-50 border-red-400' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <strong className="block text-sm">{c.name}</strong>
                <span className="text-xs text-slate-500">Op: {c.operator} &bull; {c.populasiHidup} ekor</span>
              </div>
              {selectedCage?.id === c.id && <Check className="w-5 h-5 text-red-600" />}
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Konfirmasi Pencatatan Kematian"
        subtitle="Data akan tercatat permanen di log biosecurity Yuki Farm"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Unit Kandang:</span>
              <strong className="text-slate-800">{selectedCage?.fullName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kematian:</span>
              <strong className="text-red-600">{mati} Ekor</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Penyebab:</span>
              <strong className="text-slate-800">{penyebab}</strong>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
              <span className="font-bold text-slate-800">Sisa Populasi:</span>
              <strong className="font-bold text-[#0284c7]">{sisaAyam.toLocaleString('id-ID')} Ekor</strong>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md"
            >
              Ya, Simpan
            </button>
          </div>
        </div>
      </Modal>

      <div
        className={`fixed bottom-24 left-4 right-4 z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 transition-all duration-300 ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-sm">Data Kematian Berhasil Dicatat!</p>
          <p className="text-xs text-slate-300">Populasi ayam telah diupdate secara real-time.</p>
        </div>
      </div>
    </div>
  );
}
