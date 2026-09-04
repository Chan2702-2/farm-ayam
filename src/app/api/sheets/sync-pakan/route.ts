import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured } from '@/lib/google-sheets/client';
import { appendPakanRows, appendLogRow, PakanSheetRow } from '@/lib/google-sheets/sheets-service';

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
    const rows: PakanSheetRow[] = Array.isArray(body.rows)
      ? body.rows
      : body.row
      ? [body.row]
      : [];

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data baris pakan kosong.' },
        { status: 400 }
      );
    }

    await appendPakanRows(rows);

    if (rows[0]?.userName) {
      try {
        await appendLogRow({
          timestamp: new Date().toLocaleString('id-ID'),
          userName: rows[0].userName,
          userRole: 'PENGAWAS',
          branchName: rows[0].branchName,
          actionType: 'PAKAN',
          title: `Distribusi Pakan (${rows.length} kandang)`,
          description: `Total ${rows.reduce((acc, r) => acc + r.jumlahPakanKg, 0)} kg pakan`,
        });
      } catch (logErr) {
        console.warn('Failed to append audit log to sheet:', logErr);
      }
    }

    return NextResponse.json({
      success: true,
      count: rows.length,
      message: `Berhasil menambahkan ${rows.length} baris ke tab "Distribusi Pakan" di Google Sheets!`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error syncing pakan to Google Sheets:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Gagal menyimpan data pakan ke Google Sheets.',
      },
      { status: 500 }
    );
  }
}
