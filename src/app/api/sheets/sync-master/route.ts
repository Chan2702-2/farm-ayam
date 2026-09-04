import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured } from '@/lib/google-sheets/client';
import {
  syncAllMasterData,
  appendLogRow,
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
      userName = 'Admin',
    } = body;

    const result = await syncAllMasterData({
      branches: branches as BranchSheetRow[],
      cages: cages as CageSheetRow[],
      users: users as UserSheetRow[],
      userName,
    });

    await appendLogRow({
      timestamp: new Date().toLocaleString('id-ID'),
      userName,
      userRole: 'ADMIN',
      branchName: 'Semua Cabang',
      actionType: 'SYNC_MASTER',
      title: 'Sinkronisasi Seluruh Master Data',
      description: `Sinkronisasi ${result.branchesSynced} cabang, ${result.cagesSynced} kandang, dan ${result.usersSynced} pengguna ke Google Sheets.`,
    });

    return NextResponse.json({
      success: true,
      result,
      message: `Sukses sinkronisasi master data: ${result.branchesSynced} cabang, ${result.cagesSynced} kandang, ${result.usersSynced} akun pengguna!`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in sync-master route:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Gagal sinkronisasi master data ke Google Sheets.',
      },
      { status: 500 }
    );
  }
}
