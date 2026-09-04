import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured } from '@/lib/google-sheets/client';
import {
  appendProduksiRows,
  appendPakanRows,
  appendLogRow,
  ProduksiSheetRow,
  PakanSheetRow,
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
    const { cages = [], feedItems = [], tanggal = new Date().toISOString().split('T')[0], userName = 'Admin' } = body;

    let produksiCount = 0;
    let pakanCount = 0;

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
      description: `Ekspor ${produksiCount} baris produksi & ${pakanCount} baris pakan ke Spreadsheet.`,
    });

    return NextResponse.json({
      success: true,
      produksiCount,
      pakanCount,
      message: `Sukses sinkronisasi ${produksiCount} baris Produksi dan ${pakanCount} baris Pakan ke Google Sheets!`,
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
