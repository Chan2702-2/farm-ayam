import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured } from '@/lib/google-sheets/client';
import { appendPerlakuanRows, appendLogRow, PerlakuanSheetRow } from '@/lib/google-sheets/sheets-service';

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
    const rows: PerlakuanSheetRow[] = Array.isArray(body.rows)
      ? body.rows
      : body.row
      ? [body.row]
      : [];

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data baris medikasi / vaksin kosong.' },
        { status: 400 }
      );
    }

    await appendPerlakuanRows(rows);

    if (rows[0]?.userName) {
      try {
        await appendLogRow({
          timestamp: new Date().toLocaleString('id-ID'),
          userName: rows[0].userName,
          userRole: 'PENGAWAS',
          branchName: rows[0].branchName,
          actionType: 'MEDIKASI_VAKSIN',
          title: `Catat ${rows[0].kategori} (${rows.length} kandang)`,
          description: `Produk: ${rows[0].namaObat} - Kandang: ${rows.map((r) => r.cageName).join(', ')}`,
        });
      } catch (logErr) {
        console.warn('Failed to append audit log to sheet:', logErr);
      }
    }

    return NextResponse.json({
      success: true,
      count: rows.length,
      message: `Berhasil menambahkan ${rows.length} baris ke tab "Medikasi & Vaksin" di Google Sheets!`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error syncing perlakuan to Google Sheets:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Gagal menyimpan data medikasi / vaksin ke Google Sheets.',
      },
      { status: 500 }
    );
  }
}
