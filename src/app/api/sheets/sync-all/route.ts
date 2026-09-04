import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured } from '@/lib/google-sheets/client';
import {
  appendProduksiRows,
  appendPakanRows,
  appendLogRow,
  syncMasterCabang,
  syncMasterKandang,
  syncMasterUsers,
  ProduksiSheetRow,
  PakanSheetRow,
  BranchSheetRow,
  CageSheetRow,
  UserSheetRow,
} from '@/lib/google-sheets/sheets-service';

export async function POST(req: NextRequest) {
  try {
    if (!isGoogleSheetsConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Google Sheets belum dikonfigurasi di Environment Variable server.',
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      branches = [],
      cages = [],
      users = [],
      feedItems = [],
      tanggal = new Date().toISOString().split('T')[0],
      userName = 'Admin',
    } = body;

    let produksiCount = 0;
    let pakanCount = 0;
    let cabangCount = 0;
    let kandangCount = 0;
    let usersCount = 0;

    // 1. Sync Master Cabang jika ada
    if (Array.isArray(branches) && branches.length > 0) {
      await syncMasterCabang(branches as BranchSheetRow[], userName);
      cabangCount = branches.length;
    }

    // 2. Sync Master Kandang jika ada
    if (Array.isArray(cages) && cages.length > 0) {
      const cageMasterRows: CageSheetRow[] = cages.map((c: any) => ({
        id: c.id,
        branchId: c.branchId || 'branch-1',
        branchName: c.branchName || 'Cabang',
        name: c.name,
        operator: c.operator || '-',
        jenis: c.jenis || 'LAYER LOHMANN',
        tipe: c.tipe || 'KAWAT',
        kapasitas: c.kapasitas || 0,
        populasiAwal: c.populasiAwal || 0,
        populasiHidup: c.populasiHidup || 0,
        umurMgg: c.umurMgg || 0,
        tanggalMasuk: c.tanggalMasuk || '-',
        status: 'Aktif',
        updatedBy: userName,
      }));
      await syncMasterKandang(cageMasterRows, userName);
      kandangCount = cageMasterRows.length;
    }

    // 3. Sync Master Pengguna jika ada
    if (Array.isArray(users) && users.length > 0) {
      await syncMasterUsers(users as UserSheetRow[], userName);
      usersCount = users.length;
    }

    // 4. Append log transaksi Produksi Telur Harian
    if (Array.isArray(cages) && cages.length > 0) {
      const prodRows: ProduksiSheetRow[] = cages.map((c: any) => ({
        tanggal,
        branchId: c.branchId || 'branch-1',
        branchName: c.branchName || 'Cabang',
        cageId: c.id,
        cageName: c.name,
        pagiIkat: c.pagiIkat || 0,
        pagiButir: (c.pagiIkat || 0) * 30,
        soreIkat: c.soreIkat || 0,
        soreButir: (c.soreIkat || 0) * 30,
        butir: c.butir || 0,
        retak: c.retak || 0,
        putih: c.putih || 0,
        kotorPutih: c.kotorPutih || 0,
        k: c.k || 0,
        r: c.r || 0,
        l: c.l || 0,
        totalProduksi: c.totalProduksi || 0,
        populasiHidup: c.populasiHidup || 0,
        actPercent: c.actPercent || 0,
        standardPercent: c.standardPercent || 95.5,
        userName,
      }));

      await appendProduksiRows(prodRows);
      produksiCount = prodRows.length;
    }

    // 5. Append log transaksi Distribusi Pakan Harian
    if (Array.isArray(feedItems) && feedItems.length > 0) {
      const pakanRows: PakanSheetRow[] = feedItems.map((f: any) => ({
        tanggal: f.tanggal || tanggal,
        branchId: f.branchId || 'branch-1',
        branchName: f.branchName || 'Cabang',
        cageId: f.cageId,
        cageName: f.cageName,
        populasi: f.populasi || 0,
        jenisPakan: f.jenisPakan || 'Konsentrat Layer',
        jumlahPakanKg: f.jumlahPakanKg || 0,
        kirimKg: f.kirimKg || 0,
        kirimSak: f.kirimSak || 0,
        konsumsiGrPerEkor: f.konsumsiGrPerEkor || 0,
        userName,
      }));

      await appendPakanRows(pakanRows);
      pakanCount = pakanRows.length;
    }

    await appendLogRow({
      timestamp: new Date().toLocaleString('id-ID'),
      userName,
      userRole: 'ADMIN',
      branchName: 'Semua Cabang',
      actionType: 'SYNC_ALL',
      title: 'Sinkronisasi Lengkap ke Google Sheets',
      description: `Ekspor ${cabangCount} cabang, ${kandangCount} kandang, ${usersCount} user, ${produksiCount} log produksi & ${pakanCount} log pakan.`,
    });

    return NextResponse.json({
      success: true,
      cabangCount,
      kandangCount,
      usersCount,
      produksiCount,
      pakanCount,
      message: `Sukses sinkronisasi ke Spreadsheet: ${cabangCount} cabang, ${kandangCount} kandang, ${usersCount} user, ${produksiCount} produksi, dan ${pakanCount} pakan!`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error executing full sync to Google Sheets:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Gagal sinkronisasi data ke Google Sheets.',
      },
      { status: 500 }
    );
  }
}
