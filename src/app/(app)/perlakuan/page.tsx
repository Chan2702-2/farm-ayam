'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Syringe, Save, CheckCircle2, ChevronDown, Check, Pill, Sparkles, Calendar } from 'lucide-react';
import { getFarmCages, saveFarmCages, FarmCageData } from '@/lib/data/farm-data';
import { Modal } from '@/components/ui/Modal';
import { getCurrentUser } from '@/lib/data/auth-users';
import { addActivityLog } from '@/lib/data/activity-log';
import { markDataDirty, performAutoSync, isSyncNeeded, enqueuePendingSync } from '@/lib/sync/auto-sync';

export default function PerlakuanPage() {
  const router = useRouter();
  const [cages, setCages] = useState<FarmCageData[]>([]);
  const [selectedCage, setSelectedCage] = useState<FarmCageData | null>(null);
  const [showCageModal, setShowCageModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Dynamic Date
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split('T')[0]);

  const [kategori, setKategori] = useState<'OBAT' | 'VITAMIN' | 'VAKSIN'>('OBAT');
  const [namaObat, setNamaObat] = useState('OTRALEC');
  const [dosis, setDosis] = useState('');
  const [aplikasi, setAplikasi] = useState('Air Minum');
  const [waktu, setWaktu] = useState('Pagi (07:00)');
  const [petugas, setPetugas] = useState('');

  useEffect(() => {
    const list = getFarmCages();
    setCages(list);
    if (list.length > 0) setSelectedCage(list[0]);

    const user = getCurrentUser();
    if (user?.name) setPetugas(user.name);

    return () => {
      if (typeof window !== 'undefined' && navigator.onLine && isSyncNeeded()) {
        performAutoSync();
      }
    };
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCage) return;

    const updated = cages.map((c) => {
      if (c.id === selectedCage.id) {
        return {
          ...c,
          obat: namaObat,
        };
      }
      return c;
    });

    setCages(updated);
    saveFarmCages(updated);

    const user = getCurrentUser();
    const operatorName = petugas || user?.name || 'Pengawas Lapangan';

    addActivityLog({
      userName: operatorName,
      userRole: user?.role || 'PENGAWAS',
      branchId: selectedCage.branchId || 'branch-1',
      branchName: selectedCage.branchName || 'Cabang',
      actionType: 'MEDIKASI_VAKSIN',
      title: `Catat ${kategori} ${selectedCage.name} (${tanggal})`,
      description: `Pemberian ${namaObat} (${dosis}, ${aplikasi}, ${waktu}). Pelaksana: ${operatorName}.`,
    });

    const perlakuanRow = {
      tanggal: tanggal || new Date().toISOString().split('T')[0],
      branchId: selectedCage.branchId || 'branch-1',
      branchName: selectedCage.branchName || 'Cabang',
      cageId: selectedCage.id,
      cageName: selectedCage.name,
      kategori,
      namaObat,
      dosis,
      aplikasi,
      waktu,
      catatan: `Aplikasi: ${aplikasi}, Waktu: ${waktu}`,
      userName: operatorName,
    };

    markDataDirty();

    if (!navigator.onLine) {
      enqueuePendingSync({
        type: 'perlakuan',
        url: '/api/sheets/sync-perlakuan',
        payload: { row: perlakuanRow },
      });
      console.log('[Offline] Data medikasi disimpan di antrean HP.');
    } else {
      fetch('/api/sheets/sync-perlakuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row: perlakuanRow }),
      })
        .then(() => performAutoSync())
        .catch((err) => {
          console.warn('Background sync perlakuan gagal, diantrekan:', err);
          enqueuePendingSync({
            type: 'perlakuan',
            url: '/api/sheets/sync-perlakuan',
            payload: { row: perlakuanRow },
          });
        });
    }

    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
      router.push('/dashboard');
    }, 1800);
  };

  return (
    <div className="pt-16 sm:pt-20 pb-28 px-3.5 sm:px-4 space-y-3.5 sm:space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Medikasi & Biosecurity
          </span>
          <h1 className="font-jakarta font-bold text-lg sm:text-xl text-slate-900">
            Catat Perlakuan / Obat
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Pemberian obat terapeutik, vitamin, atau vaksinasi kandang
          </p>
        </div>

        {/* Dynamic Date Picker Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 shadow-2xs shrink-0">
          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="bg-transparent text-xs font-bold text-emerald-800 focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Cage Selector */}
      <div
        onClick={() => setShowCageModal(true)}
        className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-emerald-300"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Syringe className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Unit Kandang Penerima
            </span>
            <p className="font-jakarta font-bold text-slate-900 text-sm truncate">
              {selectedCage?.fullName}
            </p>
          </div>
        </div>
        <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Kategori Perlakuan
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['OBAT', 'VITAMIN', 'VAKSIN'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKategori(k)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  kategori === k
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Nama Obat / Produk
          </label>
          <select
            value={namaObat}
            onChange={(e) => setNamaObat(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 outline-none"
          >
            <option value="OTRALEC">OTRALEC (Antibiotik / Antistress)</option>
            <option value="VITA STRESS">VITA STRESS (Multivitamin)</option>
            <option value="AMOXYCILLIN">AMOXYCILLIN 20%</option>
            <option value="ENROFLOXACIN">ENROFLOXACIN 10%</option>
            <option value="EGG STIMULANT">EGG STIMULANT</option>
            <option value="ND CLONE 30">ND CLONE 30 (Vaksin Tetelo)</option>
            <option value="GUMBORO B">GUMBORO B (Vaksin IBD)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Dosis Pemberian
            </label>
            <input
              type="text"
              required
              value={dosis}
              onChange={(e) => setDosis(e.target.value)}
              placeholder="0.5 ml / L"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Metode Aplikasi
            </label>
            <select
              value={aplikasi}
              onChange={(e) => setAplikasi(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none"
            >
              <option value="Air Minum Utama">Air Minum Utama</option>
              <option value="Campur Pakan">Campur Pakan</option>
              <option value="Spray / Semprot">Spray / Semprot</option>
              <option value="Tetes Mata / Mulut">Tetes Mata</option>
              <option value="Suntik (Injeksi)">Injeksi</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Jadwal Pemberian
            </label>
            <select
              value={waktu}
              onChange={(e) => setWaktu(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none"
            >
              <option value="Pagi (07:00)">Pagi (07:00 WIB)</option>
              <option value="Siang (12:00)">Siang (12:00 WIB)</option>
              <option value="Sore (16:00)">Sore (16:00 WIB)</option>
              <option value="24 Jam (Terus Menerus)">24 Jam</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Petugas Pelaksana
            </label>
            <input
              type="text"
              value={petugas}
              onChange={(e) => setPetugas(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all mt-2"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Log Perlakuan</span>
        </button>
      </form>

      {/* Cage Modal */}
      <Modal
        isOpen={showCageModal}
        onClose={() => setShowCageModal(false)}
        title="Pilih Kandang"
        subtitle="Pilih unit kandang untuk dicatat perlakuannya"
      >
        <div className="space-y-2 max-h-96">
          {cages.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCage(c);
                setShowCageModal(false);
              }}
              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between ${
                selectedCage?.id === c.id ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <strong className="block text-sm">{c.name}</strong>
                <span className="text-xs text-slate-500">Obat aktif: {c.obat || 'Tidak ada'}</span>
              </div>
              {selectedCage?.id === c.id && <Check className="w-5 h-5 text-emerald-600" />}
            </button>
          ))}
        </div>
      </Modal>

      {/* Toast */}
      <div
        className={`fixed bottom-24 left-4 right-4 z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 transition-all duration-300 ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-sm">Perlakuan Berhasil Dicatat!</p>
          <p className="text-xs text-slate-300">{namaObat} telah tercatat di log kandang.</p>
        </div>
      </div>
    </div>
  );
}
