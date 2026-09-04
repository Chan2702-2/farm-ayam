'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Warehouse,
  ChevronDown,
  CheckCircle2,
  Save,
  AlertCircle
} from 'lucide-react';
import {
  getFarmCages,
  saveFarmCages,
  FarmCageData
} from '@/lib/data/farm-data';
import { Modal } from '@/components/ui/Modal';
import { getCurrentUser, filterCagesForUser } from '@/lib/data/auth-users';
import { addActivityLog } from '@/lib/data/activity-log';
import { EggStepper, EggDefectInput, HenDayActDonut } from '@/components/produksi';
import { markDataDirty, performAutoSync, isSyncNeeded, enqueuePendingSync } from '@/lib/sync/auto-sync';

export default function InputProduksiPage() {
  const router = useRouter();
  const [cages, setCages] = useState<FarmCageData[]>([]);
  const [selectedCageId, setSelectedCageId] = useState<string>('cage-1');
  const [showCageModal, setShowCageModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Form State
  const [pagiIkat, setPagiIkat] = useState<number>(0);
  const [soreIkat, setSoreIkat] = useState<number>(0);
  const [butir, setButir] = useState<number>(0);
  const [retak, setRetak] = useState<number>(0);
  const [putih, setPutih] = useState<number>(0);
  const [kotorPutih, setKotorPutih] = useState<number>(0);
  const [k, setK] = useState<number>(0);
  const [r, setR] = useState<number>(0);
  const [l, setL] = useState<number>(0);

  useEffect(() => {
    const user = getCurrentUser();
    const allList = getFarmCages('all');
    const userList = filterCagesForUser(allList, user);
    setCages(userList);

    let defaultId = userList[0]?.id || 'cage-1';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cageParam = params.get('cage');
      if (cageParam && userList.some((c) => c.id === cageParam)) {
        defaultId = cageParam;
      }
    }
    setSelectedCageId(defaultId);

    return () => {
      // Skema: saat keluar dari menu input & jika online, lakukan sinkron otomatis
      if (typeof window !== 'undefined' && navigator.onLine && isSyncNeeded()) {
        performAutoSync();
      }
    };
  }, []);

  const selectedCage = cages.find((c) => c.id === selectedCageId) || cages[0];

  useEffect(() => {
    if (selectedCage) {
      setPagiIkat(selectedCage.pagiIkat || 0);
      setSoreIkat(selectedCage.soreIkat || 0);
      setButir(selectedCage.butir || 0);
      setRetak(selectedCage.retak || 0);
      setPutih(selectedCage.putih || 0);
      setKotorPutih(selectedCage.kotorPutih || 0);
      setK(selectedCage.k || 0);
      setR(selectedCage.r || 0);
      setL(selectedCage.l || 0);
    }
  }, [selectedCageId]);

  // Calculations
  const totalPagi = pagiIkat * 30;
  const totalSore = soreIkat * 30;
  const totalProduksi = totalPagi + totalSore + butir + retak + putih + kotorPutih + k + r + l;
  const populasi = selectedCage?.populasiHidup || 4000;
  const actPercent = populasi > 0 ? Number(((totalProduksi / populasi) * 100).toFixed(2)) : 0;
  const standardPercent = selectedCage?.standardPercent || 95.5;

  const handleDefectChange = (field: string, value: number) => {
    if (field === 'retak') setRetak(value);
    else if (field === 'putih') setPutih(value);
    else if (field === 'kotorPutih') setKotorPutih(value);
    else if (field === 'k') setK(value);
    else if (field === 'r') setR(value);
    else if (field === 'l') setL(value);
  };

  const handleSave = () => {
    const updatedCages = cages.map((c) => {
      if (c.id === selectedCageId) {
        return {
          ...c,
          pagiIkat,
          soreIkat,
          butir,
          retak,
          putih,
          kotorPutih,
          k,
          r,
          l,
          totalProduksi,
          actPercent,
        };
      }
      return c;
    });

    setCages(updatedCages);
    saveFarmCages(updatedCages);

    const user = getCurrentUser();
    addActivityLog({
      userName: user?.name || 'Pengawas Lapangan',
      userRole: user?.role || 'PENGAWAS',
      branchId: selectedCage?.branchId || 'branch-1',
      branchName: selectedCage?.branchName || 'Cabang',
      actionType: 'PRODUKSI',
      title: `Input Panen ${selectedCage?.name || 'Kandang'}`,
      description: `Mencatat panen Pagi ${pagiIkat * 30} butir & Sore ${soreIkat * 30} butir. Total: ${totalProduksi.toLocaleString('id-ID')} butir (Hen-Day ACT: ${actPercent}%).`,
    });

    const prodRow = {
      tanggal: new Date().toISOString().split('T')[0],
      branchId: selectedCage?.branchId || 'branch-1',
      branchName: selectedCage?.branchName || 'Cabang',
      cageId: selectedCage?.id || selectedCageId,
      cageName: selectedCage?.name || 'Kandang',
      pagiIkat,
      pagiButir: pagiIkat * 30,
      soreIkat,
      soreButir: soreIkat * 30,
      butir,
      retak,
      putih,
      kotorPutih,
      k,
      r,
      l,
      totalProduksi,
      populasiHidup: populasi,
      actPercent,
      standardPercent,
      userName: user?.name || 'Pengawas Lapangan',
    };

    // Tandai data telah berubah secara lokal
    markDataDirty();

    // Jika offline: antrekan secara lokal di HP tanpa memblokir
    if (!navigator.onLine) {
      enqueuePendingSync({
        type: 'produksi',
        url: '/api/sheets/sync-produksi',
        payload: { row: prodRow },
      });
      console.log('[Offline] Data produksi disimpan di antrean HP.');
    } else {
      // Jika online: kirim data dan sinkron otomatis di background
      fetch('/api/sheets/sync-produksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row: prodRow }),
      })
        .then(() => {
          performAutoSync();
        })
        .catch((err) => {
          console.warn('Background sync ke Google Sheets gagal, diantrekan:', err);
          enqueuePendingSync({
            type: 'produksi',
            url: '/api/sheets/sync-produksi',
            payload: { row: prodRow },
          });
        });
    }

    setShowConfirmModal(false);
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
      router.push('/produksi');
    }, 1800);
  };

  return (
    <div className="pt-16 sm:pt-20 pb-28 px-3.5 sm:px-4 space-y-3.5 sm:space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Pencatatan Lapangan
          </span>
          <h1 className="font-jakarta font-bold text-xl text-slate-900">
            Input Produksi Harian
          </h1>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-[#e0f2fe] text-[#0369a1] text-xs font-semibold">
          3 Sep 2026
        </div>
      </div>

      {/* Cage Selector Card */}
      <div
        onClick={() => setShowCageModal(true)}
        className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-100 flex items-center justify-between cursor-pointer hover:border-sky-300 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#0284c7] flex items-center justify-center shrink-0">
            <Warehouse className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Unit Kandang (Ketuk untuk ganti)
            </span>
            <p className="font-jakarta font-bold text-slate-900 text-sm truncate">
              {selectedCage?.fullName || 'Pilih Kandang'}
            </p>
          </div>
        </div>
        <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
      </div>

      {/* Context Pill Banner */}
      <div className="bg-sky-50/80 border border-sky-100 rounded-2xl p-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Ayam Hidup:</span>
          <strong className="font-bold text-[#0369a1]">{populasi.toLocaleString('id-ID')} ekor</strong>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <span>Umur: <strong className="text-slate-800">{selectedCage?.umurMgg || 31} mg</strong></span>
          <span>•</span>
          <span>Target: <strong className="text-[#0284c7]">{standardPercent}%</strong></span>
        </div>
      </div>

      {/* Modular Stepper Pagi & Sore */}
      <EggStepper
        session="pagi"
        valueIkat={pagiIkat}
        onChange={setPagiIkat}
      />

      <EggStepper
        session="sore"
        valueIkat={soreIkat}
        onChange={setSoreIkat}
      />

      {/* Subtotal Produksi Ribbon */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#0369a1] to-[#0284c7] text-white flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-sky-200 block">
            Subtotal Produksi Koleksi
          </span>
          <strong className="font-jakarta font-extrabold text-2xl">
            {(totalPagi + totalSore).toLocaleString('id-ID')} Butir
          </strong>
        </div>
        <div className="text-right text-xs text-sky-100">
          <span>{pagiIkat + soreIkat} Ikat</span>
          <span className="block text-[10px] text-sky-200">Pagi {pagiIkat} &bull; Sore {soreIkat}</span>
        </div>
      </div>

      {/* Modular Egg Defect Input */}
      <EggDefectInput
        retak={retak}
        putih={putih}
        kotorPutih={kotorPutih}
        k={k}
        r={r}
        l={l}
        onChange={handleDefectChange}
      />

      {/* Modular Hen-Day Donut / Gauge */}
      <HenDayActDonut
        actPercent={actPercent}
        standardPercent={standardPercent}
        totalProduksi={totalProduksi}
        populasiHidup={populasi}
      />

      {/* Save Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          className="w-full h-13 rounded-2xl bg-[#0284c7] hover:bg-[#0369a1] active:scale-95 text-white font-bold text-sm shadow-md shadow-sky-600/30 flex items-center justify-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Data Produksi</span>
        </button>
      </div>

      {/* Modal Pilih Kandang */}
      <Modal
        isOpen={showCageModal}
        onClose={() => setShowCageModal(false)}
        title="Pilih Unit Kandang"
        subtitle="Pilih kandang untuk pencatatan produksi telur"
      >
        <div className="space-y-2 max-h-[60vh]">
          {cages.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCageId(c.id);
                setShowCageModal(false);
              }}
              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                selectedCageId === c.id
                  ? 'bg-sky-50 border-[#0284c7] text-[#0369a1]'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div>
                <strong className="block text-sm">{c.fullName}</strong>
                <span className="text-xs text-slate-500">
                  {c.branchName ? `${c.branchName} • ` : ''}Populasi: {c.populasiHidup.toLocaleString('id-ID')} ekor • {c.jenis}
                </span>
              </div>
              {selectedCageId === c.id && <CheckCircle2 className="w-5 h-5 text-[#0284c7]" />}
            </button>
          ))}
        </div>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Konfirmasi Simpan Produksi"
        subtitle="Pastikan data fisik telur sudah akurat"
      >
        <div className="space-y-3.5">
          <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Unit Kandang:</span>
              <strong className="text-slate-800">{selectedCage?.name}</strong>
            </div>
            <div className="flex justify-between">
              <span>Operator:</span>
              <span className="text-slate-800 font-semibold">{selectedCage?.operator}</span>
            </div>
            <div className="flex justify-between">
              <span>Panen Pagi:</span>
              <strong className="text-slate-800">{totalPagi.toLocaleString('id-ID')} Butir ({pagiIkat} Ikat)</strong>
            </div>
            <div className="flex justify-between">
              <span>Panen Sore:</span>
              <strong className="text-slate-800">{totalSore.toLocaleString('id-ID')} Butir ({soreIkat} Ikat)</strong>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5">
              <span>Total Produksi:</span>
              <strong className="text-[#0369a1] text-sm">{totalProduksi.toLocaleString('id-ID')} Butir</strong>
            </div>
            <div className="flex justify-between">
              <span>Hen-Day (ACT%):</span>
              <strong className="text-emerald-700 font-bold">{actPercent}%</strong>
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
              onClick={handleSave}
              className="flex-1 h-11 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs shadow-sm"
            >
              Ya, Simpan
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
          <p className="font-bold text-xs sm:text-sm">Produksi Berhasil Disimpan!</p>
          <p className="text-[11px] text-slate-300">Data kandang telah diperbarui di sistem.</p>
        </div>
      </div>
    </div>
  );
}
