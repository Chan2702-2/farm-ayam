import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured } from '@/lib/google-sheets/client';
import { appendPopulasiRows, appendLogRow, PopulasiSheetRow } from '@/lib/google-sheets/sheets-service';

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
    const rows: PopulasiSheetRow[] = Array.isArray(body.rows)
      ? body.rows
      : body.row
      ? [body.row]
      : [];

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data baris populasi kosong.' },
        { status: 400 }
      );
    }

    await appendPopulasiRows(rows);

    if (rows[0]?.userName) {
      try {
        await appendLogRow({
          timestamp: new Date().toLocaleString('id-ID'),
          userName: rows[0].userName,
          userRole: 'PENGAWAS',
          branchName: rows[0].branchName,
          actionType: 'MORTALITAS',
          title: `Catat ${rows[0].tipe} (${rows.reduce((acc, r) => acc + r.jumlah, 0)} ekor)`,
          description: `Kandang: ${rows.map((r) => r.cageName).join(', ')}`,
        });
      } catch (logErr) {
        console.warn('Failed to append audit log to sheet:', logErr);
      }
    }

    return NextResponse.json({
      success: true,
      count: rows.length,
      message: `Berhasil menambahkan ${rows.length} baris ke tab "Mortalitas & Populasi" di Google Sheets!`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error syncing populasi to Google Sheets:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Gagal menyimpan data populasi ke Google Sheets.',
      },
      { status: 500 }
    );
  }
}
