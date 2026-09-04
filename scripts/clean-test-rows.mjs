import { google } from 'googleapis';
import fs from 'fs';

const dotenv = fs.readFileSync('.env.local', 'utf8');
const env = {};
dotenv.split('\n').forEach((l) => {
  const m = l.match(/^([^=]+)=(.*)$/);
  if (m) {
    let v = m[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[m[1].trim()] = v.replace(/\\n/g, '\n');
  }
});

const auth = new google.auth.JWT({
  email: env.GOOGLE_CLIENT_EMAIL,
  key: env.GOOGLE_PRIVATE_KEY,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = env.GOOGLE_SHEET_ID;

async function clean() {
  console.log('Membersihkan data test di Google Sheets...');

  // 1. Bersihkan Master Cabang A2:I
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'Master Cabang'!A2:I1000`,
  });
  console.log('✓ Master Cabang dibersihkan.');

  // 2. Bersihkan Master Kandang A2:O
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'Master Kandang'!A2:O2000`,
  });
  console.log('✓ Master Kandang dibersihkan.');

  // 3. Bersihkan Distribusi Pakan A2:M
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'Distribusi Pakan'!A2:M2000`,
  });
  console.log('✓ Distribusi Pakan dibersihkan.');

  // 4. Bersihkan Produksi Telur A2:V
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'Produksi Telur'!A2:V2000`,
  });
  console.log('✓ Produksi Telur dibersihkan.');

  // 5. Update Master Pengguna A2:K dengan akun resmi mulia@farm.com
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'Master Pengguna'!A2:K1000`,
  });

  const nowStr = new Date().toLocaleString('id-ID');
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'Master Pengguna'!A2`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [
          nowStr,
          'user-mulia',
          'mulia@farm.com',
          'Mulia (Super Admin)',
          'ADMIN',
          'Manager Utama Seluruh Cabang',
          'all',
          'Semua Cabang Peternakan',
          'mulia@farm.com',
          'Aktif',
          'Owner',
        ],
      ],
    },
  });
  console.log('✓ Master Pengguna diperbarui dengan akun mulia@farm.com.');

  // Log clean activity
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'Log Aktivitas'!A:H`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [
        [
          new Date().toISOString(),
          nowStr,
          'Mulia',
          'ADMIN',
          'Semua Cabang',
          'CLEANUP',
          'Pembersihan Data Test Awal',
          'Seluruh tab master & transaksi direset ke nol untuk mulai dari awal.',
        ],
      ],
    },
  });

  console.log('=== SEMUA TAB BERHASIL DIBERSIHKAN DARI DATA TEST ===');
}

clean().catch(console.error);
