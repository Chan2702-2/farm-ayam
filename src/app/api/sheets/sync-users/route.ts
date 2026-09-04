import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured } from '@/lib/google-sheets/client';
import {
  syncMasterUsers,
  appendUserRow,
  appendLogRow,
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
    const { users, user, mode = 'sync', userName = 'Admin' } = body;

    if (mode === 'append' && user) {
      await appendUserRow(user, userName);
      await appendLogRow({
        timestamp: new Date().toLocaleString('id-ID'),
        userName,
        userRole: 'ADMIN',
        branchName: user.branchName || 'Semua Cabang',
        actionType: 'CREATE_USER',
        title: `Pengguna Baru: ${user.name}`,
        description: `Mendaftarkan akun ${user.username} (${user.role}) untuk wilayah ${user.branchName || 'Semua Cabang'}.`,
      });

      return NextResponse.json({
        success: true,
        message: `Pengguna "${user.name}" berhasil dicatat ke tab Master Pengguna Spreadsheet!`,
      });
    }

    const userList: UserSheetRow[] = Array.isArray(users) ? users : [];
    await syncMasterUsers(userList, userName);

    await appendLogRow({
      timestamp: new Date().toLocaleString('id-ID'),
      userName,
      userRole: 'ADMIN',
      branchName: 'Semua Cabang',
      actionType: 'SYNC_USERS',
      title: 'Sinkronisasi Master Pengguna',
      description: `Memperbarui ${userList.length} akun pengguna di tab Master Pengguna Spreadsheet.`,
    });

    return NextResponse.json({
      success: true,
      count: userList.length,
      message: `Sukses menyinkronkan ${userList.length} pengguna ke tab Master Pengguna Google Sheets!`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in sync-users route:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Gagal sinkronisasi data pengguna ke Google Sheets.',
      },
      { status: 500 }
    );
  }
}
