'use client';

import React, { useState, useEffect } from 'react';
import {
  Egg,
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  Unlock,
  Pencil,
  Plus,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  FarmCageData,
  DailyEggProductionRecord,
  getDailyEggProduction,
  saveDailyEggProduction,
  saveFarmCages,
  getFarmCages,
  formatIndonesianDate
} from '@/lib/data/farm-data';
import { AuthUser } from '@/lib/data/auth-users';
import { addActivityLog } from '@/lib/data/activity-log';
import { markDataDirty, performAutoSync, enqueuePendingSync } from '@/lib/sync/auto-sync';
import { Modal } from '@/components/ui/Modal';

interface DetailProduksiTelurCardProps {
  cage: FarmCageData;
  currentUser: AuthUser | null;
  onUpdateCage: (updated: FarmCageData) => void;
}

export function DetailProduksiTelurCard({
  cage,
  currentUser,
  onUpdateCage,
}: DetailProduksiTelurCardProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [record, setRecord] = useState<DailyEggProductionRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Edit Modal
  const [formPagiIkat, setFormPagiIkat] = useState<number>(0);
  const [formPagiButir, setFormPagiButir] = useState<number>(0);
  const [formSoreIkat, setFormSoreIkat] = useState<number>(0);
  const [formSoreButir, setFormSoreButir] = useState<number>(0);
  const [formRetak, setFormRetak] = useState<number>(0);
  const [formPutih, setFormPutih] = useState<number>(0);
  const [formKotorPutih, setFormKotorPutih] = useState<number>(0);
  const [formK, setFormK] = useState<number>(0);
  const [formR, setFormR] = useState<number>(0);
  const [formL, setFormL] = useState<number>(0);

  const loadRecord = () => {
    const r = getDailyEggProduction(cage.id, selectedDate);
    setRecord(r);
  };

  useEffect(() => {
    loadRecord();

    const handleProdChange = (e: any) => {
      if (!e.detail?.record || (e.detail.record.cageId === cage.id && e.detail.record.tanggal === selectedDate)) {
        loadRecord();
      }
    };

    window.addEventListener('eggProductionChange', handleProdChange);
    return () => {
      window.removeEventListener('eggProductionChange', handleProdChange);
    };
  }, [cage.id, selectedDate]);

  const openEditModal = () => {
    if (record) {
      setFormPagiIkat(record.pagiIkat || 0);
      setFormPagiButir(record.pagiButir || 0);
      setFormSoreIkat(record.soreIkat || 0);
      setFormSoreButir(record.soreButir || 0);
      setFormRetak(record.retak || 0);
      setFormPutih(record.putih || 0);
      setFormKotorPutih(record.kotorPutih || 0);
      setFormK(record.k || 0);
      setFormR(record.r || 0);
      setFormL(record.l || 0);
    } else {
      setFormPagiIkat(0);
      setFormPagiButir(0);
      setFormSoreIkat(0);
      setFormSoreButir(0);
      setFormRetak(0);
      setFormPutih(0);
      setFormKotorPutih(0);
      setFormK(0);
      setFormR(0);
      setFormL(0);
    }
    setIsEditModalOpen(true);
  };

  // Real-time calculations inside modal
  const calcPagiTotal = (formPagiIkat * 30) + formPagiButir;
  const calcSoreTotal = (formSoreIkat * 30) + formSoreButir;
  const calcDefectTotal = formRetak + formPutih + formKotorPutih + formK + formR + formL;
  const calcTotalProduksi = calcPagiTotal + calcSoreTotal + calcDefectTotal;
  const populasi = cage.populasiHidup || cage.kapasitas || 4000;
  const calcActPercent = populasi > 0 ? Number(((calcTotalProduksi / populasi) * 100).toFixed(2)) : 0;

  // Handle Save Edit Form
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();

    const newRecord: DailyEggProductionRecord = {
      id: `prod-${cage.id}-${selectedDate}`,
      tanggal: selectedDate,
      cageId: cage.id,
      cageName: cage.name,
      branchId: cage.branchId,
      branchName: cage.branchName,
      pagiIkat: formPagiIkat,
      pagiButir: formPagiButir,
      soreIkat: formSoreIkat,
      soreButir: formSoreButir,
      butir: formPagiButir + formSoreButir,
      retak: formRetak,
      putih: formPutih,
      kotorPutih: formKotorPutih,
      k: formK,
      r: formR,
      l: formL,
      totalProduksi: calcTotalProduksi,
      populasiHidup: populasi,
      actPercent: calcActPercent,
      standardPercent: cage.standardPercent || 95.5,
      approvalStatus: record?.approvalStatus || 'PENDING',
      approvedBy: record?.approvedBy,
      approvedAt: record?.approvedAt,
      petugas: currentUser?.name || cage.operator || 'Pengawas',
      updatedAt: new Date().toISOString(),
    };

    saveDailyEggProduction(newRecord);
    setRecord(newRecord);
    setIsEditModalOpen(false);

    // Update current cage state if date is active production date or today
    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    if (isToday || cage.tanggalProduksi === selectedDate) {
      const updatedCage: FarmCageData = {
        ...cage,
        pagiIkat: formPagiIkat,
        pagiButir: formPagiButir,
        soreIkat: formSoreIkat,
        soreButir: formSoreButir,
        butir: formPagiButir + formSoreButir,
        retak: formRetak,
        putih: formPutih,
        kotorPutih: formKotorPutih,
        k: formK,
        r: formR,
        l: formL,
        totalProduksi: calcTotalProduksi,
        actPercent: calcActPercent,
        tanggalProduksi: selectedDate,
      };
      onUpdateCage(updatedCage);

      const all = getFarmCages('all').map((c) => (c.id === cage.id ? updatedCage : c));
      saveFarmCages(all);
    }

    // Activity Log
    addActivityLog({
      userName: currentUser?.name || 'Petugas',
      userRole: currentUser?.role || 'PENGAWAS',
      branchId: cage.branchId,
      branchName: cage.branchName,
      actionType: 'PRODUKSI',
      title: `Update Produksi ${cage.name} (${selectedDate})`,
      description: `Pagi ${calcPagiTotal} btr, Sore ${calcSoreTotal} btr. Total: ${calcTotalProduksi} btr (ACT: ${calcActPercent}%).`,
    });

    // Cloud Sync to Google Sheets
    markDataDirty();
    const sheetRow = {
      tanggal: selectedDate,
      branchId: cage.branchId,
      branchName: cage.branchName,
      cageId: cage.id,
      cageName: cage.name,
      pagiIkat: formPagiIkat,
      pagiButir: calcPagiTotal,
      soreIkat: formSoreIkat,
      soreButir: calcSoreTotal,
      butir: formPagiButir + formSoreButir,
      retak: formRetak,
      putih: formPutih,
      kotorPutih: formKotorPutih,
      k: formK,
      r: formR,
      l: formL,
      totalProduksi: calcTotalProduksi,
      populasiHidup: populasi,
      actPercent: calcActPercent,
      standardPercent: cage.standardPercent || 95.5,
      userName: currentUser?.name || 'Petugas',
      statusApproval: newRecord.approvalStatus,
      approvedBy: newRecord.approvedBy || '-',
    };

    if (!navigator.onLine) {
      enqueuePendingSync({
        type: 'produksi',
        url: '/api/sheets/sync-produksi',
        payload: { row: sheetRow },
      });
    } else {
      fetch('/api/sheets/sync-produksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row: sheetRow }),
      })
        .then(() => performAutoSync())
        .catch((err) => {
          console.warn('Sync sheets failed, enqueued:', err);
          enqueuePendingSync({
            type: 'produksi',
            url: '/api/sheets/sync-produksi',
            payload: { row: sheetRow },
          });
        });
    }

    setToastMessage(`Produksi Telur ${formatIndonesianDate(selectedDate)} berhasil disimpan!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle Admin Approval
  const handleToggleApprove = (newStatus: 'APPROVED' | 'PENDING') => {
    if (!record) {
      alert('Belum ada data produksi yang diinput untuk tanggal ini.');
      return;
    }

    const updatedRecord: DailyEggProductionRecord = {
      ...record,
      approvalStatus: newStatus,
      approvedBy: newStatus === 'APPROVED' ? (currentUser?.name || 'Admin') : undefined,
      approvedAt: newStatus === 'APPROVED' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };

    saveDailyEggProduction(updatedRecord);
    setRecord(updatedRecord);

    addActivityLog({
      userName: currentUser?.name || 'Admin',
      userRole: currentUser?.role || 'ADMIN',
      branchId: cage.branchId,
      branchName: cage.branchName,
      actionType: 'PRODUKSI',
      title: `${newStatus === 'APPROVED' ? 'Approve' : 'Batal Approve'} Produksi ${cage.name}`,
      description: `${newStatus === 'APPROVED' ? 'Menyetujui dan mengunci' : 'Membuka kunci'} data produksi tanggal ${selectedDate} (${record.totalProduksi} butir).`,
    });

    markDataDirty();
    const sheetRow = {
      tanggal: selectedDate,
      branchId: cage.branchId,
      branchName: cage.branchName,
      cageId: cage.id,
      cageName: cage.name,
      pagiIkat: record.pagiIkat,
      pagiButir: (record.pagiIkat * 30) + record.pagiButir,
      soreIkat: record.soreIkat,
      soreButir: (record.soreIkat * 30) + record.soreButir,
      butir: record.butir,
      retak: record.retak,
      putih: record.putih,
      kotorPutih: record.kotorPutih,
      k: record.k,
      r: record.r,
      l: record.l,
      totalProduksi: record.totalProduksi,
      populasiHidup: record.populasiHidup,
      actPercent: record.actPercent,
      standardPercent: record.standardPercent,
      userName: currentUser?.name || 'Admin',
      statusApproval: newStatus,
      approvedBy: newStatus === 'APPROVED' ? (currentUser?.name || 'Admin') : '-',
    };

    fetch('/api/sheets/sync-produksi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ row: sheetRow }),
    })
      .then(() => performAutoSync())
      .catch((err) => console.warn('Sync approval failed:', err));

    if (newStatus === 'APPROVED') {
      setToastMessage(`Produksi Telur ${formatIndonesianDate(selectedDate)} Disetujui (Approved) & Terkunci!`);
    } else {
      setToastMessage(`Approval dibatalkan. Data sekarang dapat diedit kembali.`);
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isAdmin = currentUser?.role === 'ADMIN';
  const isApproved = record?.approvalStatus === 'APPROVED';

  // Display metrics
  const displayTotalPagi = record ? (record.pagiIkat * 30) + record.pagiButir : 0;
  const displayTotalSore = record ? (record.soreIkat * 30) + record.soreButir : 0;
  const displayTotalProduksi = record ? record.totalProduksi : 0;
  const displayPagiRatio = displayTotalProduksi > 0 ? Math.round((displayTotalPagi / displayTotalProduksi) * 100) : 50;
  const displaySoreRatio = 100 - displayPagiRatio;
  const displayAct = record ? record.actPercent : 0;
  const isBelow = displayAct < (cage.standardPercent || 95.5) && displayTotalProduksi > 0;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3.5">
      {/* Top Header Card */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0284c7] flex items-center justify-center shrink-0">
            <Egg className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-jakarta font-bold text-sm sm:text-base text-slate-900 truncate">
              Produksi Telur {formatIndonesianDate(selectedDate)}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Koleksi Harian Unit {cage.name}
            </p>
          </div>
        </div>

        {/* Date Filter in Top Right */}
        <div className="relative flex items-center shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-[#0284c7] shrink-0 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              title="Filter Tanggal Produksi"
            />
          </div>
        </div>
      </div>

      {/* Status Bar & Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isApproved ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Close</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Pending</span>
            </span>
          )}

          {isApproved && record?.approvedBy && (
            <span className="text-[10px] text-slate-400 font-medium">
              oleh {record.approvedBy}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Admin Approve Button */}
          {isAdmin && (
            isApproved ? (
              <button
                type="button"
                onClick={() => handleToggleApprove('PENDING')}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-all"
                title="Batalkan approval agar bisa diedit kembali"
              >
                <Unlock className="w-3 h-3 text-slate-400" />
                <span>Buka Kunci</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleToggleApprove('APPROVED')}
                disabled={!record}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Setujui data produksi dan kunci dari perubahan"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
            )
          )}

          {/* Edit Button: Locked if Approved */}
          {isApproved ? (
            <button
              type="button"
              disabled
              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center gap-1 cursor-not-allowed border border-slate-200/60"
              title="Data telah disetujui Admin dan terkunci dari perubahan."
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Terkunci</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={openEditModal}
              className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 active:scale-95 text-[#0284c7] text-xs font-bold flex items-center gap-1 transition-all border border-sky-200/60"
              title="Edit Data Produksi Telur"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{record ? 'Edit' : 'Input'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Production Details / Content */}
      {record ? (
        <div className="space-y-3 pt-1">
          {/* Big number & ACT % */}
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-jakarta font-extrabold text-2xl text-[#0369a1]">
                {displayTotalProduksi.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-semibold text-slate-500 ml-1.5">butir telur</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                isBelow ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-[#0284c7]'
              }`}>
                ACT {displayAct.toFixed(2)}%
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Std: {cage.standardPercent || 95.5}%
              </span>
            </div>
          </div>

          {/* Morning vs Afternoon Visual Bar */}
          <div className="p-3 bg-sky-50/60 rounded-xl space-y-2 text-xs border border-sky-100/60">
            <div className="flex justify-between font-semibold">
              <span className="text-sky-900">
                Pagi: {displayTotalPagi.toLocaleString('id-ID')} btr ({record.pagiIkat} ikat + {record.pagiButir} btr)
              </span>
              <span className="text-sky-700">
                Sore: {displayTotalSore.toLocaleString('id-ID')} btr ({record.soreIkat} ikat + {record.soreButir} btr)
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full flex overflow-hidden">
              <div className="bg-[#0284c7] h-full transition-all" style={{ width: `${displayPagiRatio}%` }} />
              <div className="bg-sky-300 h-full transition-all" style={{ width: `${displaySoreRatio}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Grade A: {displayTotalProduksi > 0 ? (100 - ((record.retak + record.putih + record.kotorPutih) / displayTotalProduksi * 100)).toFixed(1) : 100}%</span>
              <span>Petugas: <strong className="text-slate-700">{record.petugas || cage.operator}</strong></span>
            </div>
          </div>

          {/* Defect / Reject Breakdown */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-400 block">Retak</span>
              <strong className="text-slate-800">{record.retak || 0}</strong>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-400 block">Putih</span>
              <strong className="text-slate-800">{record.putih || 0}</strong>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-400 block">Kotor</span>
              <strong className="text-slate-800">{record.kotorPutih || 0}</strong>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-400 block">Kecil (K)</span>
              <strong className="text-slate-800">{record.k || 0}</strong>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-400 block">Remuk (R)</span>
              <strong className="text-slate-800">{record.r || 0}</strong>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-400 block">Lainnya (L)</span>
              <strong className="text-slate-800">{record.l || 0}</strong>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State for Selected Date */
        <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2.5">
          <div className="w-9 h-9 mx-auto rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-700">
            Belum ada data produksi pada {formatIndonesianDate(selectedDate)}
          </p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Input catatan panen pagi & sore untuk kandang ini pada tanggal tersebut.
          </p>
          <button
            type="button"
            onClick={openEditModal}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Input Produksi Tanggal Ini</span>
          </button>
        </div>
      )}

      {/* Edit / Input Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Produksi Telur (${formatIndonesianDate(selectedDate)})`}
        subtitle={`Unit ${cage.name} &bull; Populasi: ${populasi.toLocaleString('id-ID')} ekor`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 pt-1">
          {/* Panen Pagi */}
          <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl space-y-2">
            <span className="text-xs font-bold text-sky-900 block">
              Panen Pagi (1 Ikat = 30 Butir)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Pagi (Ikat)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formPagiIkat === 0 ? '' : formPagiIkat}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^0+(?=\d)/, '');
                    setFormPagiIkat(Math.max(0, parseInt(clean, 10) || 0));
                  }}
                  placeholder="0"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 outline-none focus:border-[#0284c7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Pagi Lepas (Butir)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formPagiButir === 0 ? '' : formPagiButir}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^0+(?=\d)/, '');
                    setFormPagiButir(Math.max(0, parseInt(clean, 10) || 0));
                  }}
                  placeholder="0"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 outline-none focus:border-[#0284c7]"
                />
              </div>
            </div>
            <p className="text-[10px] text-sky-700 font-semibold text-right">
              Subtotal Pagi: {calcPagiTotal.toLocaleString('id-ID')} butir
            </p>
          </div>

          {/* Panen Sore */}
          <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl space-y-2">
            <span className="text-xs font-bold text-amber-900 block">
              Panen Sore (1 Ikat = 30 Butir)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sore (Ikat)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formSoreIkat === 0 ? '' : formSoreIkat}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^0+(?=\d)/, '');
                    setFormSoreIkat(Math.max(0, parseInt(clean, 10) || 0));
                  }}
                  placeholder="0"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 outline-none focus:border-[#0284c7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sore Lepas (Butir)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formSoreButir === 0 ? '' : formSoreButir}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^0+(?=\d)/, '');
                    setFormSoreButir(Math.max(0, parseInt(clean, 10) || 0));
                  }}
                  placeholder="0"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 outline-none focus:border-[#0284c7]"
                />
              </div>
            </div>
            <p className="text-[10px] text-amber-700 font-semibold text-right">
              Subtotal Sore: {calcSoreTotal.toLocaleString('id-ID')} butir
            </p>
          </div>

          {/* Sortir / Defect */}
          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-2">
            <span className="text-xs font-bold text-slate-700 block">
              Telur Rusak / Sortir (Butir)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Retak</label>
                <input
                  type="number"
                  min="0"
                  value={formRetak === 0 ? '' : formRetak}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^0+(?=\d)/, '');
                    setFormRetak(Math.max(0, parseInt(clean, 10) || 0));
                  }}
                  placeholder="0"
                  className="w-full h-9 px-2 text-center rounded-lg border border-slate-200 bg-white text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Putih</label>
                <input
                  type="number"
                  min="0"
                  value={formPutih === 0 ? '' : formPutih}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^0+(?=\d)/, '');
                    setFormPutih(Math.max(0, parseInt(clean, 10) || 0));
                  }}
                  placeholder="0"
                  className="w-full h-9 px-2 text-center rounded-lg border border-slate-200 bg-white text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Kotor Putih</label>
                <input
                  type="number"
                  min="0"
                  value={formKotorPutih === 0 ? '' : formKotorPutih}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^0+(?=\d)/, '');
                    setFormKotorPutih(Math.max(0, parseInt(clean, 10) || 0));
                  }}
                  placeholder="0"
                  className="w-full h-9 px-2 text-center rounded-lg border border-slate-200 bg-white text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Kecil (K)</label>
                <input
                  type="number"
                  min="0"
                  value={formK === 0 ? '' : formK}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^0+(?=\d)/, '');
                    setFormK(Math.max(0, parseInt(clean, 10) || 0));
                  }}
                  placeholder="0"
                  className="w-full h-9 px-2 text-center rounded-lg border border-slate-200 bg-white text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Remuk (R)</label>
                <input
                  type="number"
                  min="0"
                  value={formR === 0 ? '' : formR}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^0+(?=\d)/, '');
                    setFormR(Math.max(0, parseInt(clean, 10) || 0));
                  }}
                  placeholder="0"
                  className="w-full h-9 px-2 text-center rounded-lg border border-slate-200 bg-white text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Lainnya (L)</label>
                <input
                  type="number"
                  min="0"
                  value={formL === 0 ? '' : formL}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^0+(?=\d)/, '');
                    setFormL(Math.max(0, parseInt(clean, 10) || 0));
                  }}
                  placeholder="0"
                  className="w-full h-9 px-2 text-center rounded-lg border border-slate-200 bg-white text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Real-time Summary Box */}
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Total Panen</span>
              <strong className="text-base text-amber-400 font-jakarta font-extrabold">
                {calcTotalProduksi.toLocaleString('id-ID')} Butir
              </strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Hen-Day ACT</span>
              <strong className="text-base text-emerald-400 font-jakarta font-extrabold">
                {calcActPercent}%
              </strong>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs shadow-xs transition-all"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast Notification */}
      <div
        className={`fixed bottom-24 left-4 right-4 z-50 bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex items-center gap-3 transition-all duration-300 ${
          toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <p className="font-bold text-xs sm:text-sm">Berhasil!</p>
          <p className="text-[11px] text-slate-300">{toastMessage}</p>
        </div>
      </div>
    </div>
  );
}
