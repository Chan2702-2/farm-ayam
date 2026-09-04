import { getGoogleSheetsClient, getGoogleSheetId } from './client';

export interface ProduksiSheetRow {
  tanggal: string;
  branchId: string;
  branchName: string;
  cageId: string;
  cageName: string;
  pagiIkat: number;
  pagiButir: number;
  soreIkat: number;
  soreButir: number;
  butir: number;
  retak: number;
  putih: number;
  kotorPutih: number;
  k: number;
  r: number;
  l: number;
  totalProduksi: number;
  populasiHidup: number;
  actPercent: number;
  standardPercent: number;
  userName: string;
}

export interface PakanSheetRow {
  tanggal: string;
  branchId: string;
  branchName: string;
  cageId: string;
  cageName: string;
  populasi: number;
  jenisPakan: string;
  jumlahPakanKg: number;
  kirimKg: number;
  kirimSak: number;
  konsumsiGrPerEkor: number;
  userName: string;
}

export interface PopulasiSheetRow {
  tanggal: string;
  branchId: string;
  branchName: string;
  cageId: string;
  cageName: string;
  tipe: 'KEMATIAN' | 'AFKIR' | 'MUTASI';
  jumlah: number;
  populasiAkhir: number;
  catatan: string;
  userName: string;
}

export interface LogSheetRow {
  timestamp: string;
  userName: string;
  userRole: string;
  branchName: string;
  actionType: string;
  title: string;
  description: string;
}

const PRODUKSI_HEADERS = [
  'Timestamp',
  'Tanggal',
  'ID Cabang',
  'Nama Cabang',
  'ID Kandang',
  'Nama Kandang',
  'Pagi Ikat',
  'Pagi Butir',
  'Sore Ikat',
  'Sore Butir',
  'Butir Ecer',
  'Retak',
  'Putih',
  'Kotor Putih',
  'K',
  'R',
  'L',
  'Total Produksi (Butir)',
  'Populasi Hidup',
  'Hen-Day ACT (%)',
  'Standard (%)',
  'Petugas Pengawas'
];

const PAKAN_HEADERS = [
  'Timestamp',
  'Tanggal',
  'ID Cabang',
  'Nama Cabang',
  'ID Kandang',
  'Nama Kandang',
  'Populasi',
  'Jenis Pakan',
  'Jumlah Pakan (Kg)',
  'Kirim (Kg)',
  'Kirim (Sak)',
  'Konsumsi (gr/ekor)',
  'Petugas Pengawas'
];

const POPULASI_HEADERS = [
  'Timestamp',
  'Tanggal',
  'ID Cabang',
  'Nama Cabang',
  'ID Kandang',
  'Nama Kandang',
  'Tipe Perubahan',
  'Jumlah (Ekor)',
  'Populasi Akhir',
  'Catatan / Penyebab',
  'Petugas Pengawas'
];

const LOG_HEADERS = [
  'Timestamp',
  'Waktu Lokal',
  'Petugas',
  'Role',
  'Cabang',
  'Tipe Aksi',
  'Judul',
  'Keterangan'
];

export async function checkGoogleSheetsConnection() {
  const sheets = getGoogleSheetsClient();
  const spreadsheetId = getGoogleSheetId();

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  const title = response.data.properties?.title || 'Untitled Spreadsheet';
  const sheetsList = (response.data.sheets || []).map(
    (s) => s.properties?.title || 'Unknown'
  );

  return {
    success: true,
    spreadsheetId,
    title,
    sheets: sheetsList,
  };
}

export async function ensureSheetExists(sheetTitle: string, headers: string[]) {
  const sheets = getGoogleSheetsClient();
  const spreadsheetId = getGoogleSheetId();

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheets = (meta.data.sheets || []).map((s) => s.properties?.title);

  // Jika sheet belum ada, buat tab baru
  if (!existingSheets.includes(sheetTitle)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetTitle,
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
            },
          },
        ],
      },
    });

    // Tulis header row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetTitle}'!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [headers],
      },
    });
  } else {
    // Cek apakah header sudah ada di row 1
    const checkRow = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetTitle}'!A1:Z1`,
    });

    if (!checkRow.data.values || checkRow.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetTitle}'!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      });
    }
  }
}

export async function appendProduksiRows(rows: ProduksiSheetRow[]) {
  if (rows.length === 0) return;
  const sheetTitle = 'Produksi Telur';
  await ensureSheetExists(sheetTitle, PRODUKSI_HEADERS);

  const sheets = getGoogleSheetsClient();
  const spreadsheetId = getGoogleSheetId();
  const nowStr = new Date().toISOString();

  const values = rows.map((r) => [
    nowStr,
    r.tanggal,
    r.branchId,
    r.branchName,
    r.cageId,
    r.cageName,
    r.pagiIkat,
    r.pagiButir,
    r.soreIkat,
    r.soreButir,
    r.butir,
    r.retak,
    r.putih,
    r.kotorPutih,
    r.k,
    r.r,
    r.l,
    r.totalProduksi,
    r.populasiHidup,
    r.actPercent,
    r.standardPercent,
    r.userName,
  ]);

  return sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${sheetTitle}'!A:V`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values,
    },
  });
}

export async function appendPakanRows(rows: PakanSheetRow[]) {
  if (rows.length === 0) return;
  const sheetTitle = 'Distribusi Pakan';
  await ensureSheetExists(sheetTitle, PAKAN_HEADERS);

  const sheets = getGoogleSheetsClient();
  const spreadsheetId = getGoogleSheetId();
  const nowStr = new Date().toISOString();

  const values = rows.map((r) => [
    nowStr,
    r.tanggal,
    r.branchId,
    r.branchName,
    r.cageId,
    r.cageName,
    r.populasi,
    r.jenisPakan,
    r.jumlahPakanKg,
    r.kirimKg,
    r.kirimSak,
    r.konsumsiGrPerEkor,
    r.userName,
  ]);

  return sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${sheetTitle}'!A:M`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values,
    },
  });
}

export async function appendPopulasiRows(rows: PopulasiSheetRow[]) {
  if (rows.length === 0) return;
  const sheetTitle = 'Mortalitas & Populasi';
  await ensureSheetExists(sheetTitle, POPULASI_HEADERS);

  const sheets = getGoogleSheetsClient();
  const spreadsheetId = getGoogleSheetId();
  const nowStr = new Date().toISOString();

  const values = rows.map((r) => [
    nowStr,
    r.tanggal,
    r.branchId,
    r.branchName,
    r.cageId,
    r.cageName,
    r.tipe,
    r.jumlah,
    r.populasiAkhir,
    r.catatan,
    r.userName,
  ]);

  return sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${sheetTitle}'!A:K`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values,
    },
  });
}

export async function appendLogRow(log: LogSheetRow) {
  const sheetTitle = 'Log Aktivitas';
  await ensureSheetExists(sheetTitle, LOG_HEADERS);

  const sheets = getGoogleSheetsClient();
  const spreadsheetId = getGoogleSheetId();

  return sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${sheetTitle}'!A:H`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [
        [
          new Date().toISOString(),
          log.timestamp,
          log.userName,
          log.userRole,
          log.branchName,
          log.actionType,
          log.title,
          log.description,
        ],
      ],
    },
  });
}

export async function readSheetValues(sheetTitle: string, range?: string) {
  const sheets = getGoogleSheetsClient();
  const spreadsheetId = getGoogleSheetId();

  const fullRange = range ? `'${sheetTitle}'!${range}` : `'${sheetTitle}'!A:Z`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: fullRange,
  });

  return response.data.values || [];
}
