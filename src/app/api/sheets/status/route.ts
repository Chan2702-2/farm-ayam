import { NextResponse } from 'next/server';
import { isGoogleSheetsConfigured } from '@/lib/google-sheets/client';
import { checkGoogleSheetsConnection } from '@/lib/google-sheets/sheets-service';

export async function GET() {
  try {
    if (!isGoogleSheetsConfigured()) {
      return NextResponse.json({
        configured: false,
        connected: false,
        message: 'Kredensial Google Sheets belum lengkap di Environment Variables (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID).',
      });
    }

    const result = await checkGoogleSheetsConnection();

    return NextResponse.json({
      configured: true,
      connected: true,
      spreadsheetId: result.spreadsheetId,
      title: result.title,
      sheets: result.sheets,
      message: 'Berhasil terhubung ke Google Spreadsheet!',
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error connecting to Google Sheets:', err);
    return NextResponse.json(
      {
        configured: isGoogleSheetsConfigured(),
        connected: false,
        message: err.message || 'Gagal terhubung ke Google Spreadsheet.',
      },
      { status: 500 }
    );
  }
}
