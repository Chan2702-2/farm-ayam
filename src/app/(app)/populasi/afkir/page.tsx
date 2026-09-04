'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Save, CheckCircle2, ChevronDown, Check } from 'lucide-react';
import { getFarmCages, saveFarmCages, FarmCageData } from '@/lib/data/farm-data';
import { Modal } from '@/components/ui/Modal';
import { getCurrentUser } from '@/lib/data/auth-users';
import { addActivityLog } from '@/lib/data/activity-log';
import { markDataDirty, performAutoSync, isSyncNeeded, enqueuePendingSync } from '@/lib/sync/auto-sync';

export default function PopulasiAfkirPage() {
  const router = useRouter();
  const [cages, setCages] = useState<FarmCageData[]>([]);
  const [selectedCage, setSelectedCage] = useState<FarmCageData | null>(null);
  const [showCageModal, setShowCageModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [jumlahAfkir, setJumlahAfkir] = useState(0);
  const [alasan, setAlasan] = useState('Kerdil / Stunting');
  const [beratRata, setBeratRata] = useState('');
  const [tujuan, setTujuan] = useState('Dijual ke Pengepul');
  const [catatan, setCatatan] = useState('');

  useEffect(() => {
    const list = getFarmCages();
    setCages(list);
    if (list.length > 0) setSelectedCage(list[0]);

    return () => {
      // Skema: saat keluar dari menu input & jika online, lakukan sinkron otomatis
      if (typeof window !== 'undefined' && navigator.onLine && isSyncNeeded()) {
        performAutoSync();
      }
    };
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCage) return;

    const populasiAkhir = Math.max(0, selectedCage.populasiHidup - jumlahAfkir);

    const updated = cages.map((c) => {
      if (c.id === selectedCage.id) {
        return {
          ...c,
          afkir: (c.afkir || 0) + jumlahAfkir,
          populasiHidup: populasiAkhir,
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
      title: `Catat Afkir ${selectedCage.name}`,
      description: `Mencatat culling/afkir ${jumlahAfkir} ekor (${alasan}). Sisa populasi: ${populasiAkhir.toLocaleString('id-ID')} ekor.`,
    });

    const popRow = {
      tanggal: new Date().toISOString().split('T')[0],
      branchId: selectedCage.branchId,
      branchName: selectedCage.branchName,
      cageId: selectedCage.id,
      cageName: selectedCage.name,
      tipe: 'AFKIR' as const,
      jumlah: jumlahAfkir,
      populasiAkhir,
      catatan: `${alasan} - ${tujuan} (Berat: ${beratRata || '-'}) ${catatan}`.trim(),
      userName: user?.name || 'Pengawas Lapangan',
    };

    // Tandai data telah berubah secara lokal
    markDataDirty();

    if (!navigator.onLine) {
      enqueuePendingSync({
        type: 'populasi',
        url: '/api/sheets/sync-populasi',
        payload: { row: popRow },
      });
      console.log('[Offline] Data afkir disimpan di antrean HP.');
    } else {
      fetch('/api/sheets/sync-populasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row: popRow }),
      })
        .then(() => performAutoSync())
        .catch((err) => {
          console.warn('Background sync afkir gagal, diantrekan:', err);
          enqueuePendingSync({
            type: 'populasi',
            url: '/api/sheets/sync-populasi',
            payload: { row: popRow },
          });
        });
    }

    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
      router.push('/kandang');
    }, 1800);
  };

  return (
    <div className="pt-16 sm:pt-20 pb-28 px-3.5 sm:px-4 space-y-3.5 sm:space-y-4">
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Manajemen Populasi
        </span>
        <h1 className="font-jakarta font-bold text-xl text-slate-900">
          Catat Pengafkiran (Culling)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Pemisahan unggas non-produktif / rusak dari populasi aktif
        </p>
      </div>

      <div
        onClick={() => setShowCageModal(true)}
        className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-amber-300"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Unit Kandang
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
            Jumlah Ayam Di-afkir (Ekor)
          </label>
          <input
            type="number"
            required
            min="1"
            value={jumlahAfkir}
            onChange={(e) => setJumlahAfkir(Number(e.target.value) || 0)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-base font-bold text-slate-900 outline-none focus:bg-white focus:border-[#0284c7]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Alasan Pengafkiran
          </label>
          <select
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none"
          >
            <option value="Kerdil / Stunting">Kerdil / Stunting</option>
            <option value="Sakit Menahun">Sakit Menahun / Kurus</option>
            <option value="Prolapse / Kanibalisme">Prolapse / Kanibalisme</option>
            <option value="Molting Dini / Bulu Rontok">Molting Dini / Bulu Rontok</option>
            <option value="Produksi Drop Drastis">Produksi Drop Drastis</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Rata-rata Bobot (kg)
            </label>
            <input
              type="number"
              step="0.05"
              value={beratRata}
              onChange={(e) => setBeratRata(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tujuan Penanganan
            </label>
            <select
              value={tujuan}
              onChange={(e) => setTujuan(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none"
            >
              <option value="Dijual ke Pengepul">Dijual Pengepul</option>
              <option value="Dimusnahkan (Insinerator)">Dimusnahkan</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Catatan Tambahan
          </label>
          <textarea
            rows={2}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none"
            placeholder="Catatan penimbangan afkir..."
          />
        </div>

        <button
          type="submit"
          className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-amber-600/25 flex items-center justify-center gap-2 transition-all mt-2"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Data Afkir</span>
        </button>
      </form>

      <Modal
        isOpen={showCageModal}
        onClose={() => setShowCageModal(false)}
        title="Pilih Kandang"
        subtitle="Pilih unit kandang untuk dicatat afkirnya"
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
                selectedCage?.id === c.id ? 'bg-amber-50 border-amber-400' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <strong className="block text-sm">{c.name}</strong>
                <span className="text-xs text-slate-500">Op: {c.operator} &bull; {c.populasiHidup} ekor</span>
              </div>
              {selectedCage?.id === c.id && <Check className="w-5 h-5 text-amber-600" />}
            </button>
          ))}
        </div>
      </Modal>

      <div
        className={`fixed bottom-24 left-4 right-4 z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 transition-all duration-300 ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-sm">Data Afkir Berhasil Dicatat!</p>
          <p className="text-xs text-slate-300">Populasi aktif dikurangi {jumlahAfkir} ekor.</p>
        </div>
      </div>
    </div>
  );
}
