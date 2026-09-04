import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured } from '@/lib/google-sheets/client';
import {
  syncMasterCabang,
  appendCabangRow,
  appendLogRow,
  BranchSheetRow,
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
    const { branches, branch, mode = 'sync', userName = 'Admin' } = body;

    if (mode === 'append' && branch) {
      await appendCabangRow(branch, userName);
      await appendLogRow({
        timestamp: new Date().toLocaleString('id-ID'),
        userName,
        userRole: 'ADMIN',
        branchName: branch.name || 'Cabang Baru',
        actionType: 'CREATE_BRANCH',
        title: `Cabang Baru: ${branch.name}`,
        description: `Mendaftarkan cabang ${branch.name} (${branch.code}) di lokasi ${branch.location || '-'}.`,
      });

      return NextResponse.json({
        success: true,
        message: `Cabang "${branch.name}" berhasil dicatat ke tab Master Cabang Spreadsheet!`,
      });
    }

    const branchList: BranchSheetRow[] = Array.isArray(branches) ? branches : [];
    await syncMasterCabang(branchList, userName);

    await appendLogRow({
      timestamp: new Date().toLocaleString('id-ID'),
      userName,
      userRole: 'ADMIN',
      branchName: 'Semua Cabang',
      actionType: 'SYNC_BRANCH',
      title: 'Sinkronisasi Master Cabang',
      description: `Memperbarui ${branchList.length} cabang peternakan di tab Master Cabang Spreadsheet.`,
    });

    return NextResponse.json({
      success: true,
      count: branchList.length,
      message: `Sukses menyinkronkan ${branchList.length} cabang ke tab Master Cabang Google Sheets!`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in sync-cabang route:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Gagal sinkronisasi data cabang ke Google Sheets.',
      },
      { status: 500 }
    );
  }
}
