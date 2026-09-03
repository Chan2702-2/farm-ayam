'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wheat,
  ChevronDown,
  CheckCircle2,
  Save,
  Warehouse,
  Scale,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import {
  getFarmCages,
  getFeedDistribution,
  saveFeedDistribution,
  FeedDistributionItem,
  FarmCageData
} from '@/lib/data/farm-data';
import { Modal } from '@/components/ui/Modal';

export default function InputPakanPage() {
  const router = useRouter();
  const [cages, setCages] = useState<FarmCageData[]>([]);
  const [selectedCageId, setSelectedCageId] = useState<string>('cage-1');
  const [showCageModal, setShowCageModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Form State
  const [jenisPakan, setJenisPakan] = useState<string>('LAYER');
  const [umurMgg, setUmurMgg] = useState<number>(31);
  const [populasi, setPopulasi] = useState<number>(4065);
  const [konsumsiGr, setKonsumsiGr] = useState<number>(123);
  const [sisaKg, setSisaKg] = useState<number>(0);

  useEffect(() => {
    const list = getFarmCages('all');
    setCages(list);

    let cageId = list[0]?.id || 'cage-1';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qCage = params.get('cage');
      if (qCage) cageId = qCage;
    }
    setSelectedCageId(cageId);
  }, []);

  const selectedCage = cages.find((c) => c.id === selectedCageId) || cages[0];

  useEffect(() => {
    if (selectedCage) {
      setPopulasi(selectedCage.populasiHidup || 4000);
      setUmurMgg(selectedCage.umurMgg || 31);
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
    }
  }, [selectedCageId]);

  // Live Auto-Calculations
  const jumlahPakanKg = Number(((populasi * konsumsiGr) / 1000).toFixed(2));
  const kirimKg = Math.max(0, Number((jumlahPakanKg - sisaKg).toFixed(2)));
  const kirimSak = Math.floor(kirimKg / 50);
  const penambahanKg = Number((kirimKg % 50).toFixed(1));

  const handleSave = () => {
    if (!selectedCage) return;

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
      tanggal: '2026-09-03',
    };

    // Update or insert
    const updated = [newItem, ...existingFeed.filter((f) => f.kandang !== selectedCage.fullName)];
    saveFeedDistribution(updated);

    setShowConfirmModal(false);
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
      router.push('/pakan');
    }, 1800);
  };

  return (
    <div className="pt-16 sm:pt-20 pb-28 px-3.5 sm:px-4 space-y-3.5 sm:space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
            Alokasi Pakan Lapangan
          </span>
          <h1 className="font-jakarta font-bold text-xl text-slate-900">
            Input Pembagian Pakan
          </h1>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
          3 Sep 2026
        </div>
      </div>

      {/* Cage Selector Card */}
      <div
        onClick={() => setShowCageModal(true)}
        className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-100 flex items-center justify-between cursor-pointer hover:border-amber-300 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Warehouse className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Unit Kandang (Ketuk untuk ganti)
            </span>
            <p className="font-jakarta font-bold text-slate-900 text-sm truncate">
              {selectedCage?.fullName || 'Pilih Unit Kandang'}
            </p>
          </div>
        </div>
        <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
      </div>

      {/* Form Card */}
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
              value={umurMgg}
              onChange={(e) => setUmurMgg(Number(e.target.value) || 0)}
              className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Jumlah Ayam (Ekor)
            </label>
            <input
              type="number"
              value={populasi}
              onChange={(e) => setPopulasi(Number(e.target.value) || 0)}
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
              value={konsumsiGr}
              onChange={(e) => setKonsumsiGr(Number(e.target.value) || 0)}
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
            value={sisaKg}
            onChange={(e) => setSisaKg(Number(e.target.value) || 0)}
            placeholder="0"
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
        className="w-full h-13 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-amber-700/25 flex items-center justify-center gap-2 transition-all"
      >
        <Save className="w-4 h-4" />
        <span>Simpan Alokasi Pakan</span>
      </button>

      {/* Modal Pilih Kandang */}
      <Modal
        isOpen={showCageModal}
        onClose={() => setShowCageModal(false)}
        title="Pilih Unit Kandang"
        subtitle="Pilih unit untuk kalkulasi pembagian pakan harian"
      >
        <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar">
          {cages.map((c) => (
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
                <strong className="block text-sm">{c.fullName}</strong>
                <span className="text-xs text-slate-500">
                  {c.branchName} • Populasi: {c.populasiHidup.toLocaleString('id-ID')} ekor • {c.jenis}
                </span>
              </div>
              {selectedCageId === c.id && <CheckCircle2 className="w-5 h-5 text-amber-600" />}
            </button>
          ))}
        </div>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Konfirmasi Pembagian Pakan"
        subtitle="Pastikan estimasi kebutuhan pakan sudah tepat"
      >
        <div className="space-y-3.5">
          <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Unit Kandang:</span>
              <strong className="text-slate-800">{selectedCage?.name}</strong>
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
              onClick={handleSave}
              className="flex-1 h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm"
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
          <p className="font-bold text-xs sm:text-sm">Alokasi Pakan Disimpan!</p>
          <p className="text-[11px] text-slate-300">Data pakan berhasil dicatat ke sistem.</p>
        </div>
      </div>
    </div>
  );
}
