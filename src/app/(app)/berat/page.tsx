'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, Save, CheckCircle2, ChevronDown, Check, TrendingUp } from 'lucide-react';
import { getFarmCages, saveFarmCages, FarmCageData } from '@/lib/data/farm-data';
import { Modal } from '@/components/ui/Modal';

export default function BeratPage() {
  const router = useRouter();
  const [cages, setCages] = useState<FarmCageData[]>([]);
  const [selectedCage, setSelectedCage] = useState<FarmCageData | null>(null);
  const [showCageModal, setShowCageModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [sampelEkor, setSampelEkor] = useState(0);
  const [totalBeratKg, setTotalBeratKg] = useState('');
  const [keseragaman, setKeseragaman] = useState('');
  const [catatan, setCatatan] = useState('');

  useEffect(() => {
    const list = getFarmCages();
    setCages(list);
    if (list.length > 0) setSelectedCage(list[0]);
  }, []);

  const totalKgNum = parseFloat(totalBeratKg) || 0;
  const avgGram = sampelEkor > 0 ? Math.round((totalKgNum * 1000) / sampelEkor) : 0;
  const stdGram = selectedCage?.beratStandard || 1858;
  const selisih = avgGram - stdGram;
  const isNormal = Math.abs(selisih) <= 30;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCage) return;

    const updated = cages.map((c) => {
      if (c.id === selectedCage.id) {
        return {
          ...c,
          beratAktual: avgGram,
        };
      }
      return c;
    });

    setCages(updated);
    saveFarmCages(updated);
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
      router.push('/dashboard');
    }, 1800);
  };

  return (
    <div className="pt-16 sm:pt-20 pb-28 px-3.5 sm:px-4 space-y-3.5 sm:space-y-4">
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Monitoring Pertumbuhan
        </span>
        <h1 className="font-jakarta font-bold text-xl text-slate-900">
          Penimbangan Bobot (ABW)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Sampling berat badan mingguan dan evaluasi keseragaman unggas
        </p>
      </div>

      {/* Cage Selector */}
      <div
        onClick={() => setShowCageModal(true)}
        className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-sky-300"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-sky-100 text-[#0284c7] flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Jumlah Sampel (Ekor)
            </label>
            <input
              type="number"
              required
              min="10"
              value={sampelEkor}
              onChange={(e) => setSampelEkor(Number(e.target.value) || 0)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Total Berat Timbangan (kg)
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={totalBeratKg}
              onChange={(e) => setTotalBeratKg(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 outline-none"
            />
          </div>
        </div>

        {/* Live Calculation Display */}
        <div className="p-3.5 bg-sky-50 rounded-2xl border border-sky-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-900 font-semibold">
              Rata-rata Bobot Badan (ABW):
            </span>
            <strong className="font-jakarta font-extrabold text-2xl text-[#0369a1]">
              {avgGram} <span className="text-xs font-normal text-slate-500">gram / ekor</span>
            </strong>
          </div>

          <div className="flex justify-between items-center text-xs pt-1 border-t border-sky-200/60">
            <span className="text-slate-500">Target Standar Umur {selectedCage?.umurMgg || 31} Mgg:</span>
            <strong className="text-slate-800">{stdGram} gr</strong>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Deviasi / Selisih:</span>
            <span className={`font-bold ${isNormal ? 'text-emerald-700' : 'text-amber-700'}`}>
              {selisih >= 0 ? '+' : ''}{selisih} gr ({isNormal ? 'Normal & Sesuai' : 'Perlu Evaluasi Pakan'})
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Estimasi Keseragaman (Uniformity %)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="50"
              max="100"
              value={keseragaman}
              onChange={(e) => setKeseragaman(e.target.value)}
              className="w-24 h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 outline-none text-center"
            />
            <span className="text-xs text-slate-500 font-medium">
              {Number(keseragaman) >= 85 ? 'Sangat Baik (&gt;85%)' : 'Kurang Seragam'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Catatan Penimbangan
          </label>
          <textarea
            rows={2}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none"
            placeholder="Kondisi tembolok saat penimbangan, dll..."
          />
        </div>

        <button
          type="submit"
          className="w-full h-12 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-sky-600/25 flex items-center justify-center gap-2 transition-all mt-2"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Data Bobot</span>
        </button>
      </form>

      {/* Cage Modal */}
      <Modal
        isOpen={showCageModal}
        onClose={() => setShowCageModal(false)}
        title="Pilih Kandang"
        subtitle="Pilih unit kandang untuk dicatat bobotnya"
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
                selectedCage?.id === c.id ? 'bg-sky-50 border-[#0284c7]' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <strong className="block text-sm">{c.name}</strong>
                <span className="text-xs text-slate-500">BB Terakhir: {c.beratAktual} gr &bull; Std: {c.beratStandard} gr</span>
              </div>
              {selectedCage?.id === c.id && <Check className="w-5 h-5 text-[#0284c7]" />}
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
          <p className="font-bold text-sm">Data Bobot Badan Tersimpan!</p>
          <p className="text-xs text-slate-300">Rata-rata {avgGram} gr/ekor telah tercatat.</p>
        </div>
      </div>
    </div>
  );
}
