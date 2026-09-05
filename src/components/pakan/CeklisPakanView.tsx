'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Edit3,
  Calendar,
  Package,
  Scale,
  Wheat,
  Search,
  CheckCheck,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { FeedDistributionItem, saveFeedDistribution } from '@/lib/data/farm-data';
import { getCurrentUser } from '@/lib/data/auth-users';
import { addActivityLog } from '@/lib/data/activity-log';
import { markDataDirty, performAutoSync, enqueuePendingSync } from '@/lib/sync/auto-sync';
import { Modal } from '@/components/ui/Modal';

interface CeklisPakanViewProps {
  items: FeedDistributionItem[];
  allItems: FeedDistributionItem[];
  onUpdate: () => void;
  activeBranchName: string;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function CeklisPakanView({
  items,
  allItems,
  onUpdate,
  activeBranchName,
  selectedDate,
  onDateChange,
}: CeklisPakanViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUDAH' | 'BELUM'>('ALL');
  const [editItem, setEditItem] = useState<FeedDistributionItem | null>(null);

  // Edit form state
  const [formMasukSak, setFormMasukSak] = useState<number>(0);
  const [formMasukKg, setFormMasukKg] = useState<number>(0);
  const [formSisaKg, setFormSisaKg] = useState<number>(0);
  const [formCatatan, setFormCatatan] = useState<string>('');
  const [formSudahCeklis, setFormSudahCeklis] = useState<boolean>(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Total summary calculations
  const totalMasukSak = items.reduce((acc, i) => acc + (i.kirimSak || 0), 0);
  const totalMasukKg = items.reduce((acc, i) => acc + (i.kirimKg || 0), 0);
  const totalSisaKg = items.reduce((acc, i) => acc + (i.sisaKg || 0), 0);
  const totalKonsumsiKg = items.reduce((acc, i) => acc + (i.jumlahPakanKg || 0), 0);
  const sudahDicekCount = items.filter((i) => i.ceklisStatus === 'SUDAH').length;

  const filteredItems = items.filter((i) => {
    const matchSearch =
      i.kandang.toLowerCase().includes(search.toLowerCase()) ||
      i.jenisPakan.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (statusFilter === 'SUDAH') return i.ceklisStatus === 'SUDAH';
    if (statusFilter === 'BELUM') return i.ceklisStatus !== 'SUDAH';
    return true;
  });

  const openEdit = (item: FeedDistributionItem) => {
    setEditItem(item);
    setFormMasukSak(item.kirimSak || 0);
    setFormMasukKg(item.kirimKg || (item.kirimSak || 0) * 50);
    setFormSisaKg(item.sisaKg || 0);
    setFormCatatan(item.catatan || '');
    setFormSudahCeklis(item.ceklisStatus === 'SUDAH');
  };

  const handleSakChange = (sak: number) => {
    setFormMasukSak(sak);
    setFormMasukKg(sak * 50);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    const newStatus = formSudahCeklis ? 'SUDAH' : 'BELUM';
    const updated = allItems.map((it) => {
      if (it.id === editItem.id) {
        return {
          ...it,
          kirimSak: formMasukSak,
          kirimKg: formMasukKg,
          sisaKg: formSisaKg,
          catatan: formCatatan,
          ceklisStatus: newStatus,
        };
      }
      return it;
    });

    saveFeedDistribution(updated);
    onUpdate();

    const user = getCurrentUser();
    addActivityLog({
      userName: user?.name || 'Pengawas Lapangan',
      userRole: user?.role || 'PENGAWAS',
      branchId: editItem.branchId,
      branchName: editItem.branchName,
      actionType: 'PAKAN',
      title: `Ceklis Pakan ${editItem.kandang} (${selectedDate})`,
      description: `Pakan Masuk: ${formMasukSak} sak (${formMasukKg} kg), Sisa: ${formSisaKg} kg. Status: ${newStatus === 'SUDAH' ? 'Terverifikasi' : 'Belum Dicek'}.`,
    });

    const pakanRow = {
      tanggal: selectedDate,
      branchId: editItem.branchId,
      branchName: editItem.branchName,
      cageId: editItem.cageId || editItem.id,
      cageName: editItem.kandang,
      populasi: editItem.populasi,
      jenisPakan: editItem.jenisPakan,
      jumlahPakanKg: editItem.jumlahPakanKg,
      kirimKg: formMasukKg,
      kirimSak: formMasukSak,
      sisaKg: formSisaKg,
      konsumsiGrPerEkor: editItem.konsumsiGr || 120,
      statusCeklis: newStatus === 'SUDAH' ? 'Terverifikasi' : 'Belum Dicek',
      catatan: formCatatan || `Masuk: ${formMasukSak} sak, Sisa: ${formSisaKg} kg`,
      userName: user?.name || 'Pengawas Lapangan',
    };

    markDataDirty();

    if (!navigator.onLine) {
      enqueuePendingSync({
        type: 'pakan',
        url: '/api/sheets/sync-pakan',
        payload: { row: pakanRow },
      });
    } else {
      fetch('/api/sheets/sync-pakan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row: pakanRow }),
      })
        .then(() => performAutoSync())
        .catch(() => {
          enqueuePendingSync({
            type: 'pakan',
            url: '/api/sheets/sync-pakan',
            payload: { row: pakanRow },
          });
        });
    }

    setEditItem(null);
    setToastMsg(`Ceklis pakan ${editItem.kandang} berhasil disimpan!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleToggleQuickStatus = (item: FeedDistributionItem) => {
    const nextStatus = item.ceklisStatus === 'SUDAH' ? 'BELUM' : 'SUDAH';
    const updated = allItems.map((it) => {
      if (it.id === item.id) {
        return {
          ...it,
          ceklisStatus: nextStatus,
        };
      }
      return it;
    });

    saveFeedDistribution(updated);
    onUpdate();

    const user = getCurrentUser();
    const pakanRow = {
      tanggal: selectedDate,
      branchId: item.branchId,
      branchName: item.branchName,
      cageId: item.cageId || item.id,
      cageName: item.kandang,
      populasi: item.populasi,
      jenisPakan: item.jenisPakan,
      jumlahPakanKg: item.jumlahPakanKg,
      kirimKg: item.kirimKg,
      kirimSak: item.kirimSak,
      sisaKg: item.sisaKg || 0,
      konsumsiGrPerEkor: item.konsumsiGr || 120,
      statusCeklis: nextStatus === 'SUDAH' ? 'Terverifikasi' : 'Belum Dicek',
      catatan: item.catatan || '-',
      userName: user?.name || 'Pengawas Lapangan',
    };

    markDataDirty();

    if (navigator.onLine) {
      fetch('/api/sheets/sync-pakan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row: pakanRow }),
      })
        .then(() => performAutoSync())
        .catch(() => {
          enqueuePendingSync({
            type: 'pakan',
            url: '/api/sheets/sync-pakan',
            payload: { row: pakanRow },
          });
        });
    } else {
      enqueuePendingSync({
        type: 'pakan',
        url: '/api/sheets/sync-pakan',
        payload: { row: pakanRow },
      });
    }

    setToastMsg(`${item.kandang}: Status ceklis diubah ke ${nextStatus === 'SUDAH' ? 'Sudah Dicek' : 'Belum Dicek'}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleCheckAll = () => {
    if (items.length === 0) return;
    const updated = allItems.map((it) => {
      const match = items.find((cur) => cur.id === it.id);
      if (match) {
        return { ...it, ceklisStatus: 'SUDAH' as const };
      }
      return it;
    });

    saveFeedDistribution(updated);
    onUpdate();

    const user = getCurrentUser();
    const rows = items.map((it) => ({
      tanggal: selectedDate,
      branchId: it.branchId,
      branchName: it.branchName,
      cageId: it.cageId || it.id,
      cageName: it.kandang,
      populasi: it.populasi,
      jenisPakan: it.jenisPakan,
      jumlahPakanKg: it.jumlahPakanKg,
      kirimKg: it.kirimKg,
      kirimSak: it.kirimSak,
      sisaKg: it.sisaKg || 0,
      konsumsiGrPerEkor: it.konsumsiGr || 120,
      statusCeklis: 'Terverifikasi',
      catatan: 'Verifikasi massal ceklis pakan',
      userName: user?.name || 'Pengawas Lapangan',
    }));

    markDataDirty();

    if (navigator.onLine) {
      fetch('/api/sheets/sync-pakan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
        .then(() => performAutoSync())
        .catch(() => {
          enqueuePendingSync({
            type: 'pakan',
            url: '/api/sheets/sync-pakan',
            payload: { rows },
          });
        });
    } else {
      enqueuePendingSync({
        type: 'pakan',
        url: '/api/sheets/sync-pakan',
        payload: { rows },
      });
    }

    setToastMsg(`Semua ${items.length} unit kandang berhasil ditandai selesai diceklis!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  return (
    <div className="space-y-3.5">
      {/* Ceklis Header Toolbar */}
      <div className="bg-amber-500/10 border border-amber-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-amber-700" />
            <h2 className="font-jakarta font-bold text-sm text-amber-950">
              Ceklis Penerimaan & Sisa Pakan
            </h2>
          </div>
          <p className="text-xs text-amber-800/80 mt-0.5">
            Verifikasi fisik pakan yang masuk (sak/kg) dan stok sisa di kandang
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Dynamic Date Picker */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-200 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-amber-950 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleCheckAll}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-all shrink-0"
            title="Tandai semua kandang sudah dicek"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Ceklis Semua</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 uppercase">
            <Package className="w-3 h-3" />
            <span>Pakan Masuk</span>
          </div>
          <strong className="font-jakarta font-extrabold text-lg text-slate-900 block mt-0.5">
            {totalMasukSak} <span className="text-xs font-bold text-emerald-700">Sak</span>
          </strong>
          <span className="text-[10px] text-slate-500">
            {totalMasukKg.toLocaleString('id-ID')} KG kirim
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 uppercase">
            <Scale className="w-3 h-3" />
            <span>Pakan Sisa</span>
          </div>
          <strong className="font-jakarta font-extrabold text-lg text-amber-800 block mt-0.5">
            {totalSisaKg.toLocaleString('id-ID')} <span className="text-xs font-bold text-amber-700">KG</span>
          </strong>
          <span className="text-[10px] text-slate-500">
            ± {(totalSisaKg / 50).toFixed(1)} Sak sisa
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center gap-1 text-[10px] font-bold text-sky-700 uppercase">
            <Wheat className="w-3 h-3" />
            <span>Terpakai / Makan</span>
          </div>
          <strong className="font-jakarta font-extrabold text-lg text-slate-900 block mt-0.5">
            {totalKonsumsiKg.toLocaleString('id-ID')} <span className="text-xs font-bold text-[#0284c7]">KG</span>
          </strong>
          <span className="text-[10px] text-slate-500">
            Kebutuhan harian
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 uppercase">
            <CheckCircle2 className="w-3 h-3" />
            <span>Progress Ceklis</span>
          </div>
          <strong className="font-jakarta font-extrabold text-lg text-indigo-900 block mt-0.5">
            {sudahDicekCount} / {items.length}
          </strong>
          <span className="text-[10px] text-slate-500">
            {items.length > 0 ? `${Math.round((sudahDicekCount / items.length) * 100)}% terverifikasi` : '0%'}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Semua ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('SUDAH')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'SUDAH'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sudah Dicek ({sudahDicekCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('BELUM')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'BELUM'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Belum ({items.length - sudahDicekCount})
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kandang..."
            className="w-full h-9 pl-8 pr-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 shadow-2xs"
          />
        </div>
      </div>

      {/* Cage Checklist Cards */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm font-semibold text-slate-600">Tidak ada data pakan pada filter ini</p>
            <p className="text-xs text-slate-400 mt-0.5">Silakan pilih cabang atau ubah kata kunci pencarian</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSudah = item.ceklisStatus === 'SUDAH';
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-3.5 border transition-all shadow-xs ${
                  isSudah
                    ? 'border-emerald-200/90 bg-emerald-50/10'
                    : 'border-slate-100 hover:border-amber-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <strong className="font-jakarta font-bold text-sm text-slate-900">
                        {item.kandang}
                      </strong>
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold">
                        {item.jenisPakan}
                      </span>
                      {item.branchName && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          • {item.branchName}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Populasi: {item.populasi.toLocaleString('id-ID')} ekor • Umur: {item.umur || 30} mgg
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleQuickStatus(item)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 ${
                        isSudah
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title={isSudah ? 'Klik untuk batal ceklis' : 'Klik untuk tandai sudah dicek'}
                    >
                      {isSudah ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sudah Dicek</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Belum Dicek</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 active:scale-95 transition-all"
                      title="Edit rincian pakan masuk dan sisa"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3-Column Key Numbers */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs">
                  <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100/80">
                    <span className="text-[9px] font-bold text-emerald-800 uppercase block leading-tight">
                      📥 Pakan Masuk
                    </span>
                    <strong className="text-emerald-950 font-jakarta font-bold text-sm block mt-0.5">
                      {item.kirimSak || 0} <span className="text-[10px] font-normal">Sak</span>
                    </strong>
                    <span className="text-[10px] text-emerald-700/80 block">
                      ({(item.kirimKg || 0).toLocaleString('id-ID')} kg)
                    </span>
                  </div>

                  <div className="bg-amber-50/60 p-2 rounded-xl border border-amber-100/80">
                    <span className="text-[9px] font-bold text-amber-800 uppercase block leading-tight">
                      ⚖️ Pakan Sisa
                    </span>
                    <strong className="text-amber-950 font-jakarta font-bold text-sm block mt-0.5">
                      {(item.sisaKg || 0).toLocaleString('id-ID')} <span className="text-[10px] font-normal">KG</span>
                    </strong>
                    <span className="text-[10px] text-amber-700/80 block">
                      sisa di kandang
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block leading-tight">
                      🥣 Kebutuhan
                    </span>
                    <strong className="text-slate-800 font-jakarta font-bold text-sm block mt-0.5">
                      {(item.jumlahPakanKg || 0).toLocaleString('id-ID')} <span className="text-[10px] font-normal">KG</span>
                    </strong>
                    <span className="text-[10px] text-slate-500 block">
                      @{item.konsumsiGr || 120}g/ekor
                    </span>
                  </div>
                </div>

                {item.catatan && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1 mt-2 border border-slate-100">
                    <strong className="font-semibold text-slate-700">Catatan:</strong> {item.catatan}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Edit Ceklis Pakan */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title={`Ceklis Pakan: ${editItem?.kandang || 'Kandang'}`}
        subtitle="Perbarui jumlah pakan yang masuk dan sisa di kandang"
      >
        {editItem && (
          <form onSubmit={handleSaveEdit} className="space-y-3.5">
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-xs text-amber-950 space-y-1">
              <div className="flex justify-between">
                <span>Unit Kandang:</span>
                <strong>{editItem.kandang}</strong>
              </div>
              <div className="flex justify-between">
                <span>Populasi:</span>
                <span>{editItem.populasi.toLocaleString('id-ID')} ekor • {editItem.jenisPakan}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimasi Kebutuhan Makan:</span>
                <strong className="text-amber-800">{editItem.jumlahPakanKg.toLocaleString('id-ID')} KG</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pakan Masuk (Sak @ 50kg)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formMasukSak === 0 ? '' : formMasukSak}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/^0+(?=\d)/, '');
                      handleSakChange(Math.max(0, parseInt(clean, 10) || 0));
                    }}
                    className="w-full h-11 px-3 text-center font-bold text-sm bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pakan Masuk (KG)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={formMasukKg === 0 ? '' : formMasukKg}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^0+(?=\d)/, '');
                    setFormMasukKg(Math.max(0, parseFloat(clean) || 0));
                  }}
                  className="w-full h-11 px-3 text-center font-bold text-sm bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pakan Sisa di Kandang (KG)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={formSisaKg === 0 ? '' : formSisaKg}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^0+(?=\d)/, '');
                    setFormSisaKg(Math.max(0, parseFloat(clean) || 0));
                  }}
                  className="w-full h-11 px-3.5 font-bold text-sm bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-amber-500"
                />
                <span className="absolute right-3.5 top-3 text-xs text-slate-400 font-semibold">
                  KG
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Stok sisa di silo / tong pakan kandang
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Kondisi Pakan
              </label>
              <input
                type="text"
                value={formCatatan}
                onChange={(e) => setFormCatatan(e.target.value)}
                placeholder="Kondisi pakan kering, karung utuh..."
                className="w-full h-11 px-3.5 text-xs bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-amber-500"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer" onClick={() => setFormSudahCeklis(!formSudahCeklis)}>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formSudahCeklis}
                  onChange={(e) => setFormSudahCeklis(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Tandai Selesai Diceklis
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Verifikasi
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                Simpan & Ceklis
              </button>
            </div>
          </form>
        )}
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
          <p className="font-bold text-xs sm:text-sm">Ceklis Pakan Diperbarui!</p>
          <p className="text-[11px] text-slate-300">{toastMsg}</p>
        </div>
      </div>
    </div>
  );
}
