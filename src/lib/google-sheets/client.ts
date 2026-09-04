import { google, sheets_v4 } from 'googleapis';

export function isGoogleSheetsConfigured(): boolean {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  return Boolean(clientEmail && privateKey && sheetId);
}

export function getGoogleSheetId(): string {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error('GOOGLE_SHEET_ID belum dikonfigurasi di Environment Variable (.env.local / Vercel).');
  }
  return sheetId;
}

export function getGoogleSheetsClient(): sheets_v4.Sheets {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Kredensial Google Sheets (GOOGLE_CLIENT_EMAIL atau GOOGLE_PRIVATE_KEY) belum dikonfigurasi di Environment Variable.'
    );
  }

  // Bersihkan newline jika tersimpan sebagai string literal "\\n" di env Vercel / .env
  privateKey = privateKey.replace(/\\n/g, '\n');

  // Bersihkan tanda kutip ganda pembungkus jika ada
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}
