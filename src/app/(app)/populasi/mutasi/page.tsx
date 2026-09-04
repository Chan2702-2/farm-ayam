'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftRight, Save, CheckCircle2 } from 'lucide-react';
import { getFarmCages, saveFarmCages, FarmCageData } from '@/lib/data/farm-data';

export default function PopulasiMutasiPage() {
  const router = useRouter();
  const [cages, setCages] = useState<FarmCageData[]>([]);
  const [kandangAsal, setKandangAsal] = useState<FarmCageData | null>(null);
  const [kandangTujuan, setKandangTujuan] = useState<FarmCageData | null>(null);
  const [jumlah, setJumlah] = useState(0);
  const [tipeMutasi, setTipeMutasi] = useState<'PINDAH_KANDANG' | 'MASUK_PULLET'>('PINDAH_KANDANG');
  const [catatan, setCatatan] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const list = getFarmCages();
    setCages(list);
    if (list.length > 1) {
      setKandangAsal(list[0]);
      setKandangTujuan(list[1]);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kandangAsal) return;

    const updated = cages.map((c) => {
      if (c.id === kandangAsal.id) {
        return {
          ...c,
          populasiHidup: Math.max(0, c.populasiHidup - jumlah),
          mutasiKeluar: (c.mutasiKeluar || 0) + jumlah,
        };
      }
      if (tipeMutasi === 'PINDAH_KANDANG' && kandangTujuan && c.id === kandangTujuan.id) {
        return {
          ...c,
          populasiHidup: c.populasiHidup + jumlah,
          mutasiMasuk: (c.mutasiMasuk || 0) + jumlah,
        };
      }
      return c;
    });

    setCages(updated);
    saveFarmCages(updated);
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
          Relokasi & Mutasi
        </span>
        <h1 className="font-jakarta font-bold text-xl text-slate-900">
          Mutasi Populasi Ayam
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Perpindahan unggas antar unit kandang atau penerimaan pullet baru
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Jenis Mutasi
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipeMutasi('PINDAH_KANDANG')}
              className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                tipeMutasi === 'PINDAH_KANDANG'
                  ? 'bg-sky-50 border-[#0284c7] text-[#0369a1]'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              Pindah Antar Kandang
            </button>
            <button
              type="button"
              onClick={() => setTipeMutasi('MASUK_PULLET')}
              className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                tipeMutasi === 'MASUK_PULLET'
                  ? 'bg-sky-50 border-[#0284c7] text-[#0369a1]'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              Masuk Ayam Baru
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            {tipeMutasi === 'PINDAH_KANDANG' ? 'Kandang Asal (Keluar)' : 'Kandang Penerima'}
          </label>
          <select
            value={kandangAsal?.id || ''}
            onChange={(e) => setKandangAsal(cages.find((c) => c.id === e.target.value) || null)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none"
          >
            {cages.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} ({c.populasiHidup} ekor)
              </option>
            ))}
          </select>
        </div>

        {tipeMutasi === 'PINDAH_KANDANG' && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Kandang Tujuan (Masuk)
            </label>
            <select
              value={kandangTujuan?.id || ''}
              onChange={(e) => setKandangTujuan(cages.find((c) => c.id === e.target.value) || null)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none"
            >
              {cages
                .filter((c) => c.id !== kandangAsal?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.populasiHidup} ekor)
                  </option>
                ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Jumlah Ayam (Ekor)
          </label>
          <input
            type="number"
            required
            min="1"
            value={jumlah}
            onChange={(e) => setJumlah(Number(e.target.value) || 0)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-base font-bold text-slate-900 outline-none focus:bg-white focus:border-[#0284c7]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Catatan / Alasan Mutasi
          </label>
          <textarea
            rows={2}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
            placeholder="Misal: Penyesuaian kepadatan kandang..."
          />
        </div>

        <button
          type="submit"
          className="w-full h-12 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-sky-600/25 flex items-center justify-center gap-2 transition-all mt-2"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Mutasi Populasi</span>
        </button>
      </form>

      <div
        className={`fixed bottom-24 left-4 right-4 z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 transition-all duration-300 ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-sm">Mutasi Berhasil Disimpan!</p>
          <p className="text-xs text-slate-300">Data perpindahan populasi telah diperbarui.</p>
        </div>
      </div>
    </div>
  );
}
