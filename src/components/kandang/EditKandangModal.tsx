'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { FarmCageData, FarmBranch, updateFarmCage, deleteFarmCage, getFarmCages } from '@/lib/data/farm-data';
import { AuthUser } from '@/lib/data/auth-users';
import { markDataDirty, performAutoSync } from '@/lib/sync/auto-sync';

interface EditKandangModalProps {
  isOpen: boolean;
  onClose: () => void;
  cage: FarmCageData | null;
  branches: FarmBranch[];
  currentUser?: AuthUser | null;
  onSaved?: (updatedCage: FarmCageData) => void;
  onDeleted?: (deletedCageId: string) => void;
}

export function EditKandangModal({
  isOpen,
  onClose,
  cage,
  branches,
  currentUser,
  onSaved,
  onDeleted,
}: EditKandangModalProps) {
  const [branchId, setBranchId] = useState('');
  const [nama, setNama] = useState('');
  const [tipe, setTipe] = useState<'KAWAT' | 'KAYU'>('KAWAT');
  const [operator, setOperator] = useState('');
  const [phone, setPhone] = useState('');
  const [kapasitas, setKapasitas] = useState('4000');
  const [populasiAwal, setPopulasiAwal] = useState('4000');
  const [populasiHidup, setPopulasiHidup] = useState('4000');
  const [tanggalMasuk, setTanggalMasuk] = useState(() => new Date().toISOString().split('T')[0]);
  const [umurMasukMgg, setUmurMasukMgg] = useState('18');
  const [umurMgg, setUmurMgg] = useState('18');
  const [jenis, setJenis] = useState('LAYER LOHMANN');
  const [isSaving, setIsSaving] = useState(false);

  const getElapsedWeeks = (dateStr: string) => {
    if (!dateStr) return 0;
    try {
      const entry = new Date(dateStr + 'T00:00:00');
      const now = new Date();
      const diffTime = now.getTime() - entry.getTime();
      if (diffTime <= 0) return 0;
      return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    if (cage) {
      setBranchId(cage.branchId || branches[0]?.id || '');
      const rawTipe = cage.tipe === 'KAYU' ? 'KAYU' : 'KAWAT';
      setTipe(rawTipe);

      // Extract penomoran murni (misal "KAWAT - 01" atau "1. KAWAT - 01" -> "01")
      let rawNomor = (cage.name || '').replace(/^\d+\.\s*/, '').trim();
      const prefixRegex = new RegExp(`^${rawTipe}\\s*-\\s*`, 'i');
      if (prefixRegex.test(rawNomor)) {
        rawNomor = rawNomor.replace(prefixRegex, '').trim();
      }
      setNama(rawNomor);

      setOperator(cage.operator || '');
      setPhone(cage.phone || '');
      setKapasitas(String(cage.kapasitas || 4000));
      setPopulasiAwal(String(cage.populasiAwal || cage.kapasitas || 4000));
      setPopulasiHidup(String(cage.populasiHidup ?? cage.kapasitas ?? 4000));
      
      const tgl = cage.tanggalMasuk || new Date().toISOString().split('T')[0];
      setTanggalMasuk(tgl);
      
      const elapsed = getElapsedWeeks(tgl);
      const curUmur = cage.umurMgg || 18;
      setUmurMgg(String(curUmur));
      setUmurMasukMgg(String(Math.max(0, curUmur - elapsed)));
      setJenis(cage.jenis || 'LAYER LOHMANN');
    }
  }, [cage, branches]);

  const handleTanggalMasukChange = (dateVal: string) => {
    setTanggalMasuk(dateVal);
    const elapsed = getElapsedWeeks(dateVal);
    const baseAge = Number(umurMasukMgg) || 18;
    setUmurMgg(String(baseAge + elapsed));
  };

  const handleUmurMasukChange = (val: string) => {
    setUmurMasukMgg(val);
    const elapsed = getElapsedWeeks(tanggalMasuk);
    const baseAge = Number(val) || 0;
    setUmurMgg(String(baseAge + elapsed));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cage) return;

    if (!nama.trim() || !operator.trim()) {
      alert('Silakan lengkapi penomoran kandang dan nama operator.');
      return;
    }

    setIsSaving(true);
    try {
      const branchObj = branches.find((b) => b.id === branchId) || branches[0];
      const kap = Number(kapasitas) || 4000;
      const popAwal = Number(populasiAwal) || kap;
      const popHidup = Number(populasiHidup) >= 0 ? Number(populasiHidup) : popAwal;
      const curUmurMgg = Number(umurMgg) || 18;

      // Output: Tipe Kandang - Penomoran (e.g. KAWAT - 01)
      const rawNomor = nama.trim().replace(new RegExp(`^${tipe}\\s*-\\s*`, 'i'), '');
      const formattedCageName = `${tipe} - ${rawNomor}`;

      const updatedCage: FarmCageData = {
        ...cage,
        branchId: branchObj.id,
        branchName: branchObj.name,
        name: formattedCageName,
        fullName: `${formattedCageName} (${operator.trim().toUpperCase()})`,
        operator: operator.trim().toUpperCase(),
        phone: phone.trim() || undefined,
        kapasitas: kap,
        populasiAwal: popAwal,
        populasiHidup: popHidup,
        tipe,
        jenis: jenis.trim() || 'LAYER LOHMANN',
        tanggalMasuk: tanggalMasuk || cage.tanggalMasuk,
        umurMgg: curUmurMgg,
        umurBln: Math.round(curUmurMgg / 4.3),
      };

      updateFarmCage(updatedCage);
      markDataDirty();
      performAutoSync();

      // Sinkronkan ke tab Google Sheets 'Master Kandang'
      const allCages = getFarmCages('all');
      fetch('/api/sheets/sync-kandang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'sync',
          cages: allCages.map((c) => ({
            id: c.id,
            branchId: c.branchId,
            branchName: c.branchName,
            name: c.name,
            operator: c.operator,
            phone: c.phone,
            jenis: c.jenis,
            tipe: c.tipe,
            kapasitas: c.kapasitas,
            populasiAwal: c.populasiAwal,
            populasiHidup: c.populasiHidup,
            umurMgg: c.umurMgg,
            tanggalMasuk: c.tanggalMasuk,
            status: 'Aktif',
          })),
          userName: currentUser?.name || 'Admin',
        }),
      }).catch((err) => console.warn('Sync updated cage to sheets failed:', err));

      onSaved?.(updatedCage);
      onClose();
    } catch (err) {
      console.error('Error saving cage edit:', err);
      alert('Gagal menyimpan perubahan unit kandang.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!cage) return;
    if (
      !confirm(
        `Yakin ingin menghapus unit kandang "${cage.name}"? Seluruh data riwayat di kandang ini akan dihapus.`
      )
    ) {
      return;
    }

    try {
      deleteFarmCage(cage.id);
      markDataDirty();
      performAutoSync();

      const remainingCages = getFarmCages('all');
      fetch('/api/sheets/sync-kandang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'sync',
          cages: remainingCages.map((c) => ({
            id: c.id,
            branchId: c.branchId,
            branchName: c.branchName,
            name: c.name,
            operator: c.operator,
            phone: c.phone,
            jenis: c.jenis,
            tipe: c.tipe,
            kapasitas: c.kapasitas,
            populasiAwal: c.populasiAwal,
            populasiHidup: c.populasiHidup,
            umurMgg: c.umurMgg,
            tanggalMasuk: c.tanggalMasuk,
            status: 'Aktif',
          })),
          userName: currentUser?.name || 'Admin',
        }),
      }).catch((err) => console.warn('Sync deleted cage to sheets failed:', err));

      onDeleted?.(cage.id);
      onClose();
    } catch (err) {
      console.error('Error deleting cage:', err);
      alert('Gagal menghapus unit kandang.');
    }
  };

  if (!cage) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Unit Kandang"
      subtitle={`Perbarui data unit ${cage.name} (${cage.branchName})`}
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="space-y-3.5 pt-1">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Cabang Peternakan <span className="text-red-500">*</span>
          </label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
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
              value={tipe}
              onChange={(e) => setTipe(e.target.value as 'KAWAT' | 'KAYU')}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
            >
              <option value="KAWAT">KAWAT (Closed)</option>
              <option value="KAYU">KAYU (Open)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Penomoran <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Penomoran"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
            />
          </div>
        </div>

        {/* Live Preview Output Nama Kandang: Tipe Kandang - Penomoran */}
        {nama.trim() && (
          <div className="px-3 py-2 rounded-xl bg-sky-50/80 border border-sky-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Output Nama Kandang:</span>
            <span className="font-bold text-[#0284c7] font-mono text-xs">
              {tipe} - {nama.trim().replace(new RegExp(`^${tipe}\\s*-\\s*`, 'i'), '')}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nama Operator Bertugas <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Nama Petugas"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              No HP / WhatsApp Petugas
            </label>
            <input
              type="tel"
              placeholder="No HP / WhatsApp Petugas"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Kapasitas Kandang (Ekor) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="10"
              placeholder="Kapasitas Kandang"
              value={kapasitas}
              onChange={(e) => setKapasitas(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Daya tampung maksimal</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Kapasitas Awal (Ekor) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="Kapasitas Awal"
              value={populasiAwal}
              onChange={(e) => setPopulasiAwal(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Jumlah ayam saat masuk</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Populasi Hidup Saat Ini (Ekor) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            required
            min="0"
            value={populasiHidup}
            onChange={(e) => setPopulasiHidup(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Sesuaikan jika ada penyesuaian populasi aktif di kandang
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tanggal Masuk Ayam <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={tanggalMasuk}
              onChange={(e) => handleTanggalMasukChange(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Jenis Ayam
            </label>
            <input
              type="text"
              placeholder="Jenis Ayam"
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Umur Saat Masuk (Mgg)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={umurMasukMgg}
              onChange={(e) => handleUmurMasukChange(e.target.value)}
              placeholder="Umur Saat Masuk"
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#0284c7]"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Standar pullet: 18 mgg</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
              <span>Umur Saat Ini (Mgg)</span>
              <span className="text-[10px] text-sky-600 font-bold bg-sky-50 px-1.5 py-0.2 rounded-md">Otomatis</span>
            </label>
            <input
              type="number"
              required
              min="1"
              max="150"
              placeholder="Umur Saat Ini"
              value={umurMgg}
              onChange={(e) => setUmurMgg(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-sky-300 bg-sky-50/50 text-sm font-bold text-[#0369a1] outline-none focus:bg-white focus:border-[#0284c7]"
            />
            <span className="text-[10px] text-sky-700 font-medium mt-0.5 block truncate">
              {getElapsedWeeks(tanggalMasuk) > 0
                ? `+${getElapsedWeeks(tanggalMasuk)} mgg sejak masuk`
                : 'Sesuai tgl masuk'}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="h-11 px-3.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
            title="Hapus Unit Kandang Ini"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus</span>
          </button>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-11 px-5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs shadow-md shadow-sky-600/25 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
