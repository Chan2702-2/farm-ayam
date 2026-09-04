import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured } from '@/lib/google-sheets/client';
import {
  syncMasterKandang,
  appendKandangRow,
  appendLogRow,
  CageSheetRow,
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
    const { cages, cage, mode = 'sync', userName = 'Admin' } = body;

    if (mode === 'append' && cage) {
      await appendKandangRow(cage, userName);
      await appendLogRow({
        timestamp: new Date().toLocaleString('id-ID'),
        userName,
        userRole: 'ADMIN',
        branchName: cage.branchName || 'Cabang',
        actionType: 'CREATE_CAGE',
        title: `Kandang Baru: ${cage.name}`,
        description: `Mendaftarkan ${cage.name} (${cage.branchName}) - Operator: ${cage.operator || '-'}, Kapasitas: ${cage.kapasitas || 0} ekor.`,
      });

      return NextResponse.json({
        success: true,
        message: `Kandang "${cage.name}" berhasil dicatat ke tab Master Kandang Spreadsheet!`,
      });
    }

    const cageList: CageSheetRow[] = Array.isArray(cages) ? cages : [];
    await syncMasterKandang(cageList, userName);

    await appendLogRow({
      timestamp: new Date().toLocaleString('id-ID'),
      userName,
      userRole: 'ADMIN',
      branchName: 'Semua Cabang',
      actionType: 'SYNC_CAGE',
      title: 'Sinkronisasi Master Kandang',
      description: `Memperbarui ${cageList.length} unit kandang di tab Master Kandang Spreadsheet.`,
    });

    return NextResponse.json({
      success: true,
      count: cageList.length,
      message: `Sukses menyinkronkan ${cageList.length} kandang ke tab Master Kandang Google Sheets!`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in sync-kandang route:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Gagal sinkronisasi data kandang ke Google Sheets.',
      },
      { status: 500 }
    );
  }
}
