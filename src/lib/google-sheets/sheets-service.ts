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
  statusApproval?: string;
  approvedBy?: string;
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
  sisaKg?: number;
  konsumsiGrPerEkor: number;
  statusCeklis?: string;
  catatan?: string;
  userName: string;
}

export interface BeratSheetRow {
  tanggal: string;
  branchId: string;
  branchName: string;
  cageId: string;
  cageName: string;
  umurMgg: number;
  sampelEkor: number;
  totalBeratKg: number;
  avgGram: number;
  stdGram: number;
  selisih: number;
  keseragaman?: number;
  catatan?: string;
  userName: string;
}

export interface PerlakuanSheetRow {
  tanggal: string;
  branchId: string;
  branchName: string;
  cageId: string;
  cageName: string;
  kategori: 'OBAT' | 'VITAMIN' | 'VAKSIN';
  namaObat: string;
  dosis: string;
  aplikasi: string;
  waktu: string;
  catatan?: string;
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

export interface BranchSheetRow {
  id: string;
  code: string;
  name: string;
  location?: string;
  totalCages?: number;
  totalPopulasi?: number;
  status?: string;
  updatedBy?: string;
}

export interface CageSheetRow {
  id: string;
  branchId: string;
  branchName: string;
  name: string;
  operator?: string;
  phone?: string;
  jenis?: string;
  tipe?: string;
  kapasitas?: number;
  populasiAwal?: number;
  populasiHidup?: number;
  umurMgg?: number;
  tanggalMasuk?: string;
  status?: string;
  updatedBy?: string;
}

export interface UserSheetRow {
  id: string;
  username: string;
  name: string;
  role: string;
  title?: string;
  branchId: string;
  branchName: string;
  email?: string;
  status?: string;
  updatedBy?: string;
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
  'Petugas Pengawas',
  'Status Approval',
  'Disetujui Oleh'
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
  'Pakan Masuk (Kg)',
  'Pakan Masuk (Sak)',
  'Pakan Sisa (Kg)',
  'Konsumsi (gr/ekor)',
  'Status Ceklis',
  'Catatan',
  'Petugas Pengawas'
];

export const BERAT_HEADERS = [
  'Timestamp',
  'Tanggal',
  'ID Cabang',
  'Nama Cabang',
  'ID Kandang',
  'Nama Kandang',
  'Umur (Minggu)',
  'Jumlah Sampel (Ekor)',
  'Total Berat (Kg)',
  'Rata-rata Bobot (Gram)',
  'Standar Bobot (Gram)',
  'Deviasi (Gram)',
  'Keseragaman (%)',
  'Catatan',
  'Petugas Pengawas'
];

export const PERLAKUAN_HEADERS = [
  'Timestamp',
  'Tanggal',
  'ID Cabang',
  'Nama Cabang',
  'ID Kandang',
  'Nama Kandang',
  'Kategori',
  'Nama Obat / Vaksin',
  'Dosis',
  'Metode Aplikasi',
  'Waktu Pemberian',
  'Catatan',
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

export const CABANG_HEADERS = [
  'Timestamp Update',
  'ID Cabang',
  'Kode Cabang',
  'Nama Cabang',
  'Lokasi / Alamat',
  'Total Kandang',
  'Total Populasi (Ekor)',
  'Status',
  'Petugas / Admin'
];

export const KANDANG_HEADERS = [
  'Timestamp Update',
  'ID Kandang',
  'ID Cabang',
  'Nama Cabang',
  'Nama Unit Kandang',
  'Operator / PJ',
  'No HP Petugas',
  'Jenis Ayam',
  'Konstruksi / Tipe',
  'Kapasitas (Ekor)',
  'Populasi Awal',
  'Populasi Hidup',
  'Umur (Minggu)',
  'Tanggal Masuk',
  'Status',
  'Petugas / Admin'
];

export const USER_HEADERS = [
  'Timestamp Update',
  'ID User',
  'Username',
  'Nama Lengkap',
  'Role / Hak Akses',
  'Jabatan',
  'ID Cabang',
  'Nama Cabang Penugasan',
  'Email',
  'Status Akun',
  'Petugas / Admin'
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
    r.statusApproval || 'Belum Disetujui',
    r.approvedBy || '-',
  ]);

  return sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${sheetTitle}'!A:X`,
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
    r.sisaKg ?? 0,
    r.konsumsiGrPerEkor,
    r.statusCeklis || 'Terverifikasi',
    r.catatan || '-',
    r.userName,
  ]);

  return sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${sheetTitle}'!A:P`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values,
    },
  });
}

export async function appendBeratRows(rows: BeratSheetRow[]) {
  if (rows.length === 0) return;
  const sheetTitle = 'Penimbangan Bobot';
  await ensureSheetExists(sheetTitle, BERAT_HEADERS);

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
    r.umurMgg,
    r.sampelEkor,
    r.totalBeratKg,
    r.avgGram,
    r.stdGram,
    r.selisih,
    r.keseragaman ?? 0,
    r.catatan || '-',
    r.userName,
  ]);

  return sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${sheetTitle}'!A:O`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values,
    },
  });
}

export async function appendPerlakuanRows(rows: PerlakuanSheetRow[]) {
  if (rows.length === 0) return;
  const sheetTitle = 'Medikasi & Vaksin';
  await ensureSheetExists(sheetTitle, PERLAKUAN_HEADERS);

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
    r.kategori,
    r.namaObat,
    r.dosis,
    r.aplikasi,
    r.waktu,
    r.catatan || '-',
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

/**
 * MASTER CABANG: Sinkronisasi seluruh cabang peternakan ke tab 'Master Cabang'
 */
export async function syncMasterCabang(rows: BranchSheetRow[], userName: string = 'Admin') {
  const sheetTitle = 'Master Cabang';
  await ensureSheetExists(sheetTitle, CABANG_HEADERS);

  const sheets = getGoogleSheetsClient();
  const spreadsheetId = getGoogleSheetId();
  const nowStr = new Date().toLocaleString('id-ID');

  // Bersihkan data baris sebelumnya (A2:I)
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'${sheetTitle}'!A2:I1000`,
  });

  if (rows.length === 0) return;

  const values = rows.map((b) => [
    nowStr,
    b.id,
    b.code,
    b.name,
    b.location || '-',
    b.totalCages ?? 0,
    b.totalPopulasi ?? 0,
    b.status || 'Aktif',
    b.updatedBy || userName,
  ]);

  return sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetTitle}'!A2`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values,
    },
  });
}

export async function appendCabangRow(branch: BranchSheetRow, userName: string = 'Admin') {
  const sheetTitle = 'Master Cabang';
  await ensureSheetExists(sheetTitle, CABANG_HEADERS);

  const sheets = getGoogleSheetsClient();
  const spreadsheetId = getGoogleSheetId();
  const nowStr = new Date().toLocaleString('id-ID');

  return sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${sheetTitle}'!A:I`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [
        [
          nowStr,
          branch.id,
          branch.code,
          branch.name,
          branch.location || '-',
          branch.totalCages ?? 0,
          branch.totalPopulasi ?? 0,
          branch.status || 'Aktif',
          branch.updatedBy || userName,
        ],
      ],
    },
  });
}

/**
 * MASTER KANDANG: Sinkronisasi seluruh data unit kandang ke tab 'Master Kandang'
 */
export async function syncMasterKandang(rows: CageSheetRow[], userName: string = 'Admin') {
  const sheetTitle = 'Master Kandang';
  await ensureSheetExists(sheetTitle, KANDANG_HEADERS);

  const sheets = getGoogleSheetsClient();
  const spreadsheetId = getGoogleSheetId();
  const nowStr = new Date().toLocaleString('id-ID');

  // Bersihkan data baris sebelumnya (A2:P)
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'${sheetTitle}'!A2:P2000`,
  });

  if (rows.length === 0) return;

  const values = rows.map((c) => [
    nowStr,
    c.id,
    c.branchId,
    c.branchName,
    c.name,
    c.operator || '-',
    c.phone || '-',
    c.jenis || 'LAYER LOHMANN',
    c.tipe || 'KAWAT',
    c.kapasitas ?? 0,
    c.populasiAwal ?? 0,
    c.populasiHidup ?? 0,
    c.umurMgg ?? 0,
    c.tanggalMasuk || '-',
    c.status || 'Aktif',
    c.updatedBy || userName,
  ]);

  return sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetTitle}'!A2`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values,
    },
  });
}

export async function appendKandangRow(cage: CageSheetRow, userName: string = 'Admin') {
  const sheetTitle = 'Master Kandang';
  await ensureSheetExists(sheetTitle, KANDANG_HEADERS);

  const sheets = getGoogleSheetsClient();
  const spreadsheetId = getGoogleSheetId();
  const nowStr = new Date().toLocaleString('id-ID');

  return sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${sheetTitle}'!A:P`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [
        [
          nowStr,
          cage.id,
          cage.branchId,
          cage.branchName,
          cage.name,
          cage.operator || '-',
          cage.phone || '-',
          cage.jenis || 'LAYER LOHMANN',
          cage.tipe || 'KAWAT',
          cage.kapasitas ?? 0,
          cage.populasiAwal ?? 0,
          cage.populasiHidup ?? 0,
          cage.umurMgg ?? 0,
          cage.tanggalMasuk || '-',
          cage.status || 'Aktif',
          cage.updatedBy || userName,
        ],
      ],
    },
  });
}

/**
 * MASTER PENGGUNA: Sinkronisasi seluruh data user / operator / pengawas ke tab 'Master Pengguna'
 */
export async function syncMasterUsers(rows: UserSheetRow[], userName: string = 'Admin') {
  const sheetTitle = 'Master Pengguna';
  await ensureSheetExists(sheetTitle, USER_HEADERS);

  const sheets = getGoogleSheetsClient();
  const spreadsheetId = getGoogleSheetId();
  const nowStr = new Date().toLocaleString('id-ID');

  // Bersihkan data baris sebelumnya (A2:K)
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'${sheetTitle}'!A2:K1000`,
  });

  if (rows.length === 0) return;

  const values = rows.map((u) => [
    nowStr,
    u.id,
    u.username,
    u.name,
    u.role,
    u.title || '-',
    u.branchId || 'all',
    u.branchName || 'Semua Cabang',
    u.email || '-',
    u.status || 'Aktif',
    u.updatedBy || userName,
  ]);

  return sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetTitle}'!A2`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values,
    },
  });
}

export async function appendUserRow(user: UserSheetRow, updatedBy: string = 'Admin') {
  const sheetTitle = 'Master Pengguna';
  await ensureSheetExists(sheetTitle, USER_HEADERS);

  const sheets = getGoogleSheetsClient();
  const spreadsheetId = getGoogleSheetId();
  const nowStr = new Date().toLocaleString('id-ID');

  return sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${sheetTitle}'!A:K`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [
        [
          nowStr,
          user.id,
          user.username,
          user.name,
          user.role,
          user.title || '-',
          user.branchId || 'all',
          user.branchName || 'Semua Cabang',
          user.email || '-',
          user.status || 'Aktif',
          user.updatedBy || updatedBy,
        ],
      ],
    },
  });
}

/**
 * Sinkronisasi seluruh Master Data (Cabang, Kandang, Pengguna) sekaligus
 */
export async function syncAllMasterData(params: {
  branches?: BranchSheetRow[];
  cages?: CageSheetRow[];
  users?: UserSheetRow[];
  userName?: string;
}) {
  const { branches = [], cages = [], users = [], userName = 'Admin' } = params;
  const results = {
    branchesSynced: 0,
    cagesSynced: 0,
    usersSynced: 0,
  };

  if (branches.length > 0) {
    await syncMasterCabang(branches, userName);
    results.branchesSynced = branches.length;
  }
  if (cages.length > 0) {
    await syncMasterKandang(cages, userName);
    results.cagesSynced = cages.length;
  }
  if (users.length > 0) {
    await syncMasterUsers(users, userName);
    results.usersSynced = users.length;
  }

  return results;
}
