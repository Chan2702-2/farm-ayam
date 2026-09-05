import ExcelJS from 'exceljs';
import { FarmBranch, FarmCageData, FeedDistributionItem, DailyEggProductionRecord } from '@/lib/data/farm-data';

export interface RekapLphExportOptions {
  date: string; // YYYY-MM-DD
  branchId: string; // 'all' or branch-1, branch-2, etc.
  branches: FarmBranch[];
  cages: FarmCageData[];
  feedItems?: FeedDistributionItem[];
  dailyProductions?: DailyEggProductionRecord[];
  supervisorName?: string;
}

interface ProcessedCageRow {
  index: number;
  fullName: string;
  kapasitas: number;
  populasiHidup: number;
  mati: number;
  afkir: number;
  mutasiKeluar: number;
  tanggalMasuk: string;
  umurMgg: number;
  umurBln: number;
  jenisPakan: string;
  jumlahPakanKg: number;
  konsumsiGr: number;
  stdrGr: number;
  beratAktual: number;
  beratStandard: number;
  pagiIkat: number;
  soreIkat: number;
  butir: number;
  retak: number;
  putih: number;
  kotorPutih: number;
  k: number;
  r: number;
  l: number;
  totalProduksi: number;
  selisihKemaren: number;
  actPercent: number;
  standardPercent: number;
  obat: string;
  branchName: string;
  branchId: string;
}

// Format Indonesian Date string e.g. Selasa, 1 September 2026
export function formatIndonesianFullDate(dateStr: string): string {
  if (!dateStr) return '';
  const dateObj = new Date(dateStr + 'T00:00:00');
  if (isNaN(dateObj.getTime())) return dateStr;
  
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const dayName = dayNames[dateObj.getDay()];
  const day = dateObj.getDate();
  const monthName = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  
  return `${dayName}, ${day} ${monthName} ${year}`;
}

export function getPreviousDateStr(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
};

/**
 * Builds the complete Rekap LPH workbook conforming strictly to
 * 'Contoh rekap LPH percabang-keseluruhan.xlsx'.
 */
export async function buildRekapLphWorkbook(options: RekapLphExportOptions): Promise<ExcelJS.Workbook> {
  const {
    date,
    branchId,
    branches,
    cages,
    feedItems = [],
    dailyProductions = [],
    supervisorName = 'Pengawas',
  } = options;

  const yesterdayDate = getPreviousDateStr(date);

  // Map each cage to its effective values on `date` and calculate difference vs yesterday
  const processedCages: ProcessedCageRow[] = cages.map((c, idx) => {
    // 1. Egg production for `date`
    const prodToday = dailyProductions.find((p) => p.cageId === c.id && p.tanggal === date);
    const pagiIkat = prodToday ? prodToday.pagiIkat : (c.pagiIkat || 0);
    const soreIkat = prodToday ? prodToday.soreIkat : (c.soreIkat || 0);
    const butir = prodToday ? prodToday.butir : (c.butir || 0);
    const retak = prodToday ? prodToday.retak : (c.retak || 0);
    const putih = prodToday ? prodToday.putih : (c.putih || 0);
    const kotorPutih = prodToday ? prodToday.kotorPutih : (c.kotorPutih || 0);
    const k = prodToday ? prodToday.k : (c.k || 0);
    const r = prodToday ? prodToday.r : (c.r || 0);
    const l = prodToday ? prodToday.l : (c.l || 0);

    const totalProduksi =
      prodToday?.totalProduksi ??
      pagiIkat * 30 + soreIkat * 30 + butir + retak + putih + kotorPutih + k + r + l;

    // 2. Production yesterday
    const prodYesterday = dailyProductions.find((p) => p.cageId === c.id && p.tanggal === yesterdayDate);
    const yesterdayTotal = prodYesterday?.totalProduksi ?? 0;
    const selisihKemaren = yesterdayTotal > 0 ? totalProduksi - yesterdayTotal : 0;

    // 3. Population
    const populasiHidup = prodToday?.populasiHidup || c.populasiHidup || c.kapasitas || 4000;
    const actPercent =
      prodToday?.actPercent ??
      (populasiHidup > 0 ? Number(((totalProduksi / populasiHidup) * 100).toFixed(2)) : 0);

    // 4. Feed
    const feed = feedItems.find(
      (f) =>
        (f.cageId === c.id || f.kandang === c.name || f.kandang === c.fullName) &&
        (!f.tanggal || f.tanggal === date)
    );
    const jenisPakan = feed?.jenisPakan || c.jenis || 'SPESIAL 1';
    const konsumsiGr = feed?.konsumsiGrPerEkor || feed?.konsumsiGr || 115;
    const jumlahPakanKg =
      feed?.jumlahPakanKg || Number(((populasiHidup * konsumsiGr) / 1000).toFixed(1));

    // 5. Age
    let umurMgg = c.umurMgg || 30;
    let umurBln = c.umurBln || Math.floor(umurMgg / 4.3);
    if (c.tanggalMasuk && date) {
      const masukTime = new Date(c.tanggalMasuk + 'T00:00:00').getTime();
      const targetTime = new Date(date + 'T00:00:00').getTime();
      if (!isNaN(masukTime) && !isNaN(targetTime) && targetTime >= masukTime) {
        const diffDays = Math.round((targetTime - masukTime) / (1000 * 60 * 60 * 24));
        umurMgg = Math.floor(diffDays / 7);
        umurBln = Math.floor(umurMgg / 4.3);
      }
    }

    const cageLabel = c.fullName || `${c.index || idx + 1}. ${c.tipe || 'KAWAT'} (${c.operator || '-'})`;

    return {
      index: c.index || idx + 1,
      fullName: cageLabel,
      kapasitas: c.kapasitas || 4000,
      populasiHidup,
      mati: c.mati || 0,
      afkir: c.afkir || 0,
      mutasiKeluar: c.mutasiKeluar || 0,
      tanggalMasuk: c.tanggalMasuk || '2025-08-21',
      umurMgg,
      umurBln,
      jenisPakan,
      jumlahPakanKg,
      konsumsiGr,
      stdrGr: 115,
      beratAktual: c.beratAktual || 1850,
      beratStandard: c.beratStandard || 1900,
      pagiIkat,
      soreIkat,
      butir,
      retak,
      putih,
      kotorPutih,
      k,
      r,
      l,
      totalProduksi,
      selisihKemaren,
      actPercent,
      standardPercent: c.standardPercent || 95.5,
      obat: c.obat || '-',
      branchName: c.branchName || 'Cabang Farm',
      branchId: c.branchId || 'branch-1',
    };
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Yuki Farm System';
  workbook.lastModifiedBy = supervisorName;
  workbook.created = new Date();
  workbook.modified = new Date();

  const isExportAll = !branchId || branchId === 'all' || branchId === 'keseluruhan';

  if (isExportAll) {
    // 1. Generate Master Global Sheet: 'KESELURUHAN'
    const globalSheet = workbook.addWorksheet('KESELURUHAN');
    populateRekapLphWorksheet(globalSheet, {
      branchTitle: 'SEMUA CABANG / KESELURUHAN',
      dateStr: date,
      cages: processedCages,
      supervisorName,
    });

    // 2. Generate Individual Branch Sheets for each registered branch
    const effectiveBranches = branches.length > 0 ? branches : [
      { id: 'branch-1', code: '3 ALUR', name: 'Cabang 3 Alur', shortName: '3 Alur' } as FarmBranch,
      { id: 'branch-2', code: 'B RUPI', name: 'Cabang Balai Rupih', shortName: 'Balai Rupih' } as FarmBranch,
      { id: 'branch-3', code: 'ROSAM', name: 'Cabang Rosam', shortName: 'Rosam' } as FarmBranch,
    ];

    for (const br of effectiveBranches) {
      const branchCages = processedCages.filter(
        (c) =>
          c.branchId === br.id ||
          c.branchName.toLowerCase().includes(br.shortName.toLowerCase()) ||
          c.branchName.toLowerCase().includes(br.name.toLowerCase())
      );

      // Sanitize sheet name (max 31 chars, no invalid symbols: \ / ? * [ ] : )
      const rawSheetName = (br.shortName || br.name || 'Cabang').replace(/[\\/?*[\]:]/g, '');
      const sheetName = rawSheetName.slice(0, 30).toUpperCase();

      // Avoid duplicate sheet names
      if (!workbook.getWorksheet(sheetName)) {
        const branchSheet = workbook.addWorksheet(sheetName);
        populateRekapLphWorksheet(branchSheet, {
          branchTitle: br.name || br.shortName,
          dateStr: date,
          cages: branchCages,
          supervisorName,
        });
      }
    }
  } else {
    // Single Branch Export
    const currentBranch = branches.find((b) => b.id === branchId);
    const branchTitle = currentBranch ? currentBranch.name : 'Cabang Farm';
    const rawSheetName = (currentBranch?.shortName || currentBranch?.name || 'Rekap LPH').replace(/[\\/?*[\]:]/g, '');
    const sheetName = rawSheetName.slice(0, 30).toUpperCase();

    const branchCages = processedCages.filter(
      (c) =>
        c.branchId === branchId ||
        (currentBranch && c.branchName.toLowerCase().includes(currentBranch.shortName.toLowerCase()))
    );

    const sheet = workbook.addWorksheet(sheetName);
    populateRekapLphWorksheet(sheet, {
      branchTitle,
      dateStr: date,
      cages: branchCages.length > 0 ? branchCages : processedCages,
      supervisorName,
    });
  }

  return workbook;
}

interface WorksheetPopulateOptions {
  branchTitle: string;
  dateStr: string;
  cages: ProcessedCageRow[];
  supervisorName: string;
}

/**
 * Builds and styles an authentic single worksheet identical to
 * 'Contoh rekap LPH percabang-keseluruhan.xlsx'.
 */
function populateRekapLphWorksheet(
  ws: ExcelJS.Worksheet,
  { branchTitle, dateStr, cages, supervisorName }: WorksheetPopulateOptions
) {
  ws.views = [{ showGridLines: true }];

  // Column Widths from template:
  const colWidths: Record<number, number> = {
    1: 3.7, // Margin Col A
    2: 29,  // B - Kandang
    3: 8,   // C - Qty
    4: 11,  // D - Hidup
    5: 11,  // E - Mati
    6: 11,  // F - Afkir
    7: 11,  // G - Pindah
    8: 12,  // H - Masuk
    9: 8,   // I - Mgg
    10: 8,  // J - Bln
    11: 11, // K - Jenis
    12: 10, // L - Ttl/Kd(kg)
    13: 9,  // M - Ekor/Gr
    14: 11, // N - Stdr/Ekor(Gr)
    15: 9,  // O - Berat Mgg
    16: 9,  // P - Stdr/Gr
    17: 8,  // Q - Pagi
    18: 8,  // R - Sore
    19: 8,  // S - Butir
    20: 8,  // T - Retak
    21: 8,  // U - Putih
    22: 8,  // V - Kotor/Putih
    23: 8,  // W - K
    24: 8,  // X - R
    25: 8,  // Y - L
    26: 14, // Z - Total
    27: 10, // AA - Ket
    28: 10, // AB - ACT%
    29: 10, // AC - STDR
    30: 16, // AD - Obat / Vaksin
    31: 3.7 // AE - Right Margin
  };

  for (let c = 1; c <= 31; c++) {
    if (colWidths[c]) {
      ws.getColumn(c).width = colWidths[c];
    }
  }

  // Row 1: Title (Merged B1:AE1)
  ws.mergeCells('B1:AE1');
  const b1 = ws.getCell('B1');
  b1.value = 'Laporan Harian Produksi Telor';
  b1.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF0F172A' } };
  b1.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  // Row 2: Subtitle (Merged B2:AE2)
  ws.mergeCells('B2:AE2');
  const b2 = ws.getCell('B2');
  b2.value = 'Yuki Farm';
  b2.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  b2.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 24;

  // Row 3: Kandang / Cabang
  const b3 = ws.getCell('B3');
  b3.value = 'Kandang';
  b3.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E293B' } };
  b3.alignment = { vertical: 'middle' };

  ws.mergeCells('C3:E3');
  const c3 = ws.getCell('C3');
  c3.value = branchTitle;
  c3.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF0369A1' } };
  c3.alignment = { vertical: 'middle' };
  ws.getRow(3).height = 22;

  // Row 4: Tanggal
  const b4 = ws.getCell('B4');
  b4.value = 'Tanggal';
  b4.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E293B' } };
  b4.alignment = { vertical: 'middle' };

  ws.mergeCells('C4:F4');
  const c4 = ws.getCell('C4');
  c4.value = dateStr;
  c4.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF047857' } };
  c4.alignment = { vertical: 'middle' };
  ws.getRow(4).height = 22;

  // Table Headers (Rows 5 and 6)
  ws.getRow(5).height = 26;
  ws.getRow(6).height = 26;

  // Merges for 2-tier headers
  ws.mergeCells('B5:B6');
  ws.getCell('B5').value = 'Kandang';

  ws.mergeCells('C5:C6');
  ws.getCell('C5').value = 'Qty';

  ws.mergeCells('D5:G5');
  ws.getCell('D5').value = 'Jumlah Ayam';

  ws.mergeCells('H5:J5');
  ws.getCell('H5').value = 'Umur';

  ws.mergeCells('K5:N5');
  ws.getCell('K5').value = 'Pakan';

  ws.mergeCells('O5:P5');
  ws.getCell('O5').value = 'Berat badan';

  ws.mergeCells('Q5:AC5');
  ws.getCell('Q5').value = 'Produksi Telor';

  ws.mergeCells('AD5:AD6');
  ws.getCell('AD5').value = 'Perlakuan\nObat / Vaksin';

  // Row 6 Subheaders
  const subheaders: { col: number; val: string }[] = [
    { col: 4, val: 'Hidup' },
    { col: 5, val: 'Mati' },
    { col: 6, val: 'Afkir' },
    { col: 7, val: 'Pindah' },
    { col: 8, val: 'Masuk' },
    { col: 9, val: 'Mgg' },
    { col: 10, val: 'Bln' },
    { col: 11, val: 'Jenis' },
    { col: 12, val: 'Ttl/Kd(kg)' },
    { col: 13, val: 'Ekor/Gr' },
    { col: 14, val: 'Stdr/Ekor(Gr)' },
    { col: 15, val: 'Mgg' },
    { col: 16, val: 'Stdr/Gr' },
    { col: 17, val: 'Pagi' },
    { col: 18, val: 'Sore' },
    { col: 19, val: 'Butir' },
    { col: 20, val: 'Retak' },
    { col: 21, val: 'putih' },
    { col: 22, val: 'Kotor/ Putih' },
    { col: 23, val: 'K' },
    { col: 24, val: 'R' },
    { col: 25, val: 'L' },
    { col: 26, val: 'Total' },
    { col: 27, val: 'Ket' },
    { col: 28, val: 'ACT%' },
    { col: 29, val: 'STDR' },
  ];

  subheaders.forEach((sh) => {
    ws.getRow(6).getCell(sh.col).value = sh.val;
  });

  // Apply header styling
  for (let r = 5; r <= 6; r++) {
    for (let c = 2; c <= 30; c++) {
      const cell = ws.getRow(r).getCell(c);
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = thinBorder;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' },
      };
    }
  }

  // Populate Cage Rows
  let curRow = 7;
  const firstDataRow = curRow;

  // Fallback if 0 cages exist: provide 1 blank row so Excel formulas won't break
  const dataCages = cages.length > 0 ? cages : [{
    index: 1,
    fullName: '1. Kandang Sample',
    kapasitas: 4000,
    populasiHidup: 4000,
    mati: 0,
    afkir: 0,
    mutasiKeluar: 0,
    tanggalMasuk: dateStr,
    umurMgg: 30,
    umurBln: 7,
    jenisPakan: 'SPESIAL 1',
    jumlahPakanKg: 460,
    konsumsiGr: 115,
    stdrGr: 115,
    beratAktual: 1850,
    beratStandard: 1900,
    pagiIkat: 0,
    soreIkat: 0,
    butir: 0,
    retak: 0,
    putih: 0,
    kotorPutih: 0,
    k: 0,
    r: 0,
    l: 0,
    totalProduksi: 0,
    selisihKemaren: 0,
    actPercent: 0,
    standardPercent: 95.5,
    obat: '-',
    branchName: branchTitle,
    branchId: 'branch-1',
  }];

  dataCages.forEach((cage) => {
    ws.getRow(curRow).height = 22;
    const r = curRow;

    ws.getCell(`B${r}`).value = cage.fullName;
    ws.getCell(`C${r}`).value = cage.kapasitas;
    ws.getCell(`D${r}`).value = cage.populasiHidup;
    ws.getCell(`E${r}`).value = cage.mati || 0;
    ws.getCell(`F${r}`).value = cage.afkir || 0;
    ws.getCell(`G${r}`).value = cage.mutasiKeluar || 0;
    ws.getCell(`H${r}`).value = cage.tanggalMasuk;
    ws.getCell(`I${r}`).value = cage.umurMgg;
    ws.getCell(`J${r}`).value = cage.umurBln;
    ws.getCell(`K${r}`).value = cage.jenisPakan;
    ws.getCell(`L${r}`).value = cage.jumlahPakanKg;
    ws.getCell(`M${r}`).value = cage.konsumsiGr;
    ws.getCell(`N${r}`).value = cage.stdrGr;
    ws.getCell(`O${r}`).value = cage.beratAktual;
    ws.getCell(`P${r}`).value = cage.beratStandard;
    ws.getCell(`Q${r}`).value = cage.pagiIkat;
    ws.getCell(`R${r}`).value = cage.soreIkat;
    ws.getCell(`S${r}`).value = cage.butir;
    ws.getCell(`T${r}`).value = cage.retak;
    ws.getCell(`U${r}`).value = cage.putih;
    ws.getCell(`V${r}`).value = cage.kotorPutih;
    ws.getCell(`W${r}`).value = cage.k;
    ws.getCell(`X${r}`).value = cage.r;
    ws.getCell(`Y${r}`).value = cage.l;

    // Excel Formula for Total Produksi: (Pagi x 30) + (Sore x 30) + Butir + defects
    ws.getCell(`Z${r}`).value = {
      formula: `+Q${r}*30+R${r}*30+S${r}+T${r}+U${r}+V${r}+W${r}+X${r}+Y${r}`,
      result: cage.totalProduksi,
    };

    // Ket / Selisih Kemaren
    ws.getCell(`AA${r}`).value = cage.selisihKemaren;

    // ACT% Formula: (Total Produksi / Hidup) * 100
    ws.getCell(`AB${r}`).value = {
      formula: `IF(D${r}>0,ROUND((Z${r}/D${r})*100,2),0)`,
      result: cage.actPercent,
    };

    ws.getCell(`AC${r}`).value = cage.standardPercent;
    ws.getCell(`AD${r}`).value = cage.obat;

    // Cell Formatting
    for (let c = 2; c <= 30; c++) {
      const cell = ws.getRow(r).getCell(c);
      cell.font = { name: 'Arial', size: 10 };
      cell.border = thinBorder;

      if (c === 2) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (c === 8 || c === 9 || c === 10 || c === 11 || c === 30) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }

      // Number formatting
      if (c === 3 || c === 4 || c === 5 || c === 6 || c === 7) {
        cell.numFmt = '#,##0';
      } else if (c === 12) {
        cell.numFmt = '#,##0.0';
      } else if (c === 13 || c === 14 || c === 15 || c === 16) {
        cell.numFmt = '#,##0';
      } else if (c >= 17 && c <= 25) {
        cell.numFmt = '#,##0';
      } else if (c === 26) {
        cell.font = { name: 'Arial', size: 10, bold: true };
        cell.numFmt = '#,##0';
      } else if (c === 27) {
        cell.numFmt = '+#,##0;-#,##0;0';
      } else if (c === 28) {
        cell.font = {
          name: 'Arial',
          size: 10,
          bold: true,
          color: { argb: cage.actPercent >= 90 ? 'FF059669' : cage.actPercent >= 75 ? 'FFD97706' : 'FFDC2626' },
        };
        cell.numFmt = '0.00"%"';
      } else if (c === 29) {
        cell.numFmt = '0.00"%"';
      }
    }

    curRow++;
  });

  const lastDataRow = curRow - 1;

  // Blank separator row
  ws.getRow(curRow).height = 16;
  curRow++;

  // Summary Section (Starting at curRow)
  const sumStart = curRow;

  // Precalculated summary totals for accurate immediate display
  const totalPakan = dataCages.reduce((acc, c) => acc + c.jumlahPakanKg, 0);
  const totalKapasitas = dataCages.reduce((acc, c) => acc + c.kapasitas, 0);
  const totalHidup = dataCages.reduce((acc, c) => acc + c.populasiHidup, 0);
  const totalProduksiAll = dataCages.reduce((acc, c) => acc + c.totalProduksi, 0);
  const totalMatiAll = dataCages.reduce((acc, c) => acc + c.mati, 0);
  const totalAfkirAll = dataCages.reduce((acc, c) => acc + c.afkir, 0);
  const persenGlobal = totalHidup > 0 ? Number(((totalProduksiAll / totalHidup) * 100).toFixed(2)) : 0;

  // Age classifications: Induk (> 15 bln), Gadis (5 - 15 bln), Anak (< 5 bln)
  const ayamInduk = dataCages.filter((c) => c.umurBln > 15);
  const ayamGadis = dataCages.filter((c) => c.umurBln >= 5 && c.umurBln <= 15);
  const ayamAnak = dataCages.filter((c) => c.umurBln < 5);

  const popInduk = ayamInduk.reduce((acc, c) => acc + c.populasiHidup, 0);
  const popGadis = ayamGadis.reduce((acc, c) => acc + c.populasiHidup, 0);
  const popAnak = ayamAnak.reduce((acc, c) => acc + c.populasiHidup, 0);

  const prodInduk = ayamInduk.reduce((acc, c) => acc + c.totalProduksi, 0);
  const prodGadis = ayamGadis.reduce((acc, c) => acc + c.totalProduksi, 0);
  const prodAnak = ayamAnak.reduce((acc, c) => acc + c.totalProduksi, 0);

  const diffInduk = ayamInduk.reduce((acc, c) => acc + c.selisihKemaren, 0);
  const diffGadis = ayamGadis.reduce((acc, c) => acc + c.selisihKemaren, 0);
  const diffAnak = ayamAnak.reduce((acc, c) => acc + c.selisihKemaren, 0);
  const diffGlobal = dataCages.reduce((acc, c) => acc + c.selisihKemaren, 0);

  const ayamBertelur50 = dataCages.filter((c) => c.actPercent > 50);
  const popBertelur50 = ayamBertelur50.reduce((acc, c) => acc + c.populasiHidup, 0);
  const prodBertelur50 = ayamBertelur50.reduce((acc, c) => acc + c.totalProduksi, 0);
  const persenBertelur50 = popBertelur50 > 0 ? Number(((prodBertelur50 / popBertelur50) * 100).toFixed(2)) : 0;

  // Feed breakdown
  const pakanSpesial1 = dataCages.filter((c) => c.jenisPakan.toUpperCase().includes('SPESIAL 1')).reduce((acc, c) => acc + c.jumlahPakanKg, 0);
  const pakanSpesial2 = dataCages.filter((c) => c.jenisPakan.toUpperCase().includes('SPESIAL 2')).reduce((acc, c) => acc + c.jumlahPakanKg, 0);
  const pakanGrower = dataCages.filter((c) => c.jenisPakan.toUpperCase().includes('GROWER')).reduce((acc, c) => acc + c.jumlahPakanKg, 0);
  const pakanInduk = dataCages.filter((c) => c.jenisPakan.toUpperCase().includes('INDUK')).reduce((acc, c) => acc + c.jumlahPakanKg, 0);

  const leftSummaryRows = [
    { label: 'Total Makanan ', formula: `SUM(L${firstDataRow}:L${lastDataRow})`, result: totalPakan, numFmt: '#,##0.0' },
    { label: 'Total Ayam Full', formula: `SUM(C${firstDataRow}:C${lastDataRow})`, result: totalKapasitas, numFmt: '#,##0' },
    { label: 'Total Ayam', formula: `SUM(D${firstDataRow}:D${lastDataRow})`, result: totalHidup, numFmt: '#,##0' },
    { label: 'Persen Global (Ayam Keseluruhan)', formula: `IF(F${sumStart+2}>0,ROUND((F${sumStart+15}/F${sumStart+2})*100,2),0)`, result: persenGlobal, numFmt: '0.00"%"' },
    { label: 'Persen Global (Ayam Produksi > 50%)', formula: `IF(M${sumStart+4}>0,ROUND((F${sumStart+15}/M${sumStart+4})*100,2),0)`, result: persenBertelur50, numFmt: '0.00"%"' },
    { blank: true },
    { label: 'Total Makanan', formula: `SUM(L${firstDataRow}:L${lastDataRow})`, result: totalPakan, numFmt: '#,##0.0' },
    { label: 'Spesial 1', formula: `SUMIF(K${firstDataRow}:K${lastDataRow},"*SPESIAL 1*",L${firstDataRow}:L${lastDataRow})`, result: pakanSpesial1, numFmt: '#,##0.0' },
    { label: 'Spesial 2', formula: `SUMIF(K${firstDataRow}:K${lastDataRow},"*SPESIAL 2*",L${firstDataRow}:L${lastDataRow})`, result: pakanSpesial2, numFmt: '#,##0.0' },
    { label: 'Grower', formula: `SUMIF(K${firstDataRow}:K${lastDataRow},"*GROWER*",L${firstDataRow}:L${lastDataRow})`, result: pakanGrower, numFmt: '#,##0.0' },
    { label: 'Induk', formula: `SUMIF(K${firstDataRow}:K${lastDataRow},"*INDUK*",L${firstDataRow}:L${lastDataRow})`, result: pakanInduk, numFmt: '#,##0.0' },
    { blank: true },
    { label: 'Telur Ayam Induk', formula: `SUMIF(J${firstDataRow}:J${lastDataRow},">15",Z${firstDataRow}:Z${lastDataRow})`, result: prodInduk, numFmt: '#,##0', hasDiff: true, diffVal: diffInduk },
    { label: 'Telur Ayam Anak', formula: `SUMIF(J${firstDataRow}:J${lastDataRow},"<5",Z${firstDataRow}:Z${lastDataRow})`, result: prodAnak, numFmt: '#,##0', hasDiff: true, diffVal: diffAnak },
    { label: 'Telur Ayam Gadis', formula: `SUMIF(J${firstDataRow}:J${lastDataRow},">=5",Z${firstDataRow}:Z${lastDataRow})-SUMIF(J${firstDataRow}:J${lastDataRow},">15",Z${firstDataRow}:Z${lastDataRow})`, result: prodGadis, numFmt: '#,##0', hasDiff: true, diffVal: diffGadis },
    { label: 'Produksi Total (Global)', formula: `SUM(Z${firstDataRow}:Z${lastDataRow})`, result: totalProduksiAll, numFmt: '#,##0', hasDiff: true, diffVal: diffGlobal },
    { label: 'Total Ayam Mati', formula: `SUM(E${firstDataRow}:E${lastDataRow})`, result: totalMatiAll, numFmt: '#,##0' },
    { label: 'Ayam ND', formula: '0', result: 0, numFmt: '#,##0' },
    { label: 'Ayam Afkir', formula: `SUM(F${firstDataRow}:F${lastDataRow})`, result: totalAfkirAll, numFmt: '#,##0' },
  ];

  leftSummaryRows.forEach((item, idx) => {
    const r = sumStart + idx;
    ws.getRow(r).height = 22;
    if (item.blank || !item.formula) return;

    ws.mergeCells(`B${r}:D${r}`);
    const bCell = ws.getCell(`B${r}`);
    bCell.value = item.label;
    bCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } };
    bCell.alignment = { vertical: 'middle' };

    const eCell = ws.getCell(`E${r}`);
    eCell.value = ':';
    eCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } };
    eCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const fCell = ws.getCell(`F${r}`);
    fCell.value = { formula: item.formula, result: item.result };
    fCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    fCell.alignment = { horizontal: 'right', vertical: 'middle' };
    if (item.numFmt) fCell.numFmt = item.numFmt;

    if (item.hasDiff) {
      const gCell = ws.getCell(`G${r}`);
      const isUp = (item.diffVal ?? 0) >= 0;
      gCell.value = isUp ? 'NAIK' : 'TURUN';
      gCell.font = {
        name: 'Arial',
        size: 10,
        bold: true,
        color: { argb: isUp ? 'FF059669' : 'FFDC2626' },
      };
      gCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const hCell = ws.getCell(`H${r}`);
      hCell.value = Math.abs(item.diffVal ?? 0);
      hCell.font = { name: 'Arial', size: 10, bold: true };
      hCell.alignment = { horizontal: 'right', vertical: 'middle' };
      hCell.numFmt = '#,##0';

      const iCell = ws.getCell(`I${r}`);
      iCell.value = 'Dari Kemaren';
      iCell.font = { name: 'Arial', size: 10, color: { argb: 'FF64748B' } };
      iCell.alignment = { horizontal: 'left', vertical: 'middle' };
    }
  });

  // Middle Column (Ayam by Age Classifications)
  const middleItems = [
    {
      label: 'Jumlah Ayam Induk (Umur > 15 Bulan)',
      formula: `SUMIF(J${firstDataRow}:J${lastDataRow},">15",D${firstDataRow}:D${lastDataRow})`,
      result: popInduk,
    },
    {
      label: 'Jumlah Ayam Gadis (Umur 5 - 15 Bulan)',
      formula: `SUMIF(J${firstDataRow}:J${lastDataRow},">=5",D${firstDataRow}:D${lastDataRow})-SUMIF(J${firstDataRow}:J${lastDataRow},">15",D${firstDataRow}:D${lastDataRow})`,
      result: popGadis,
    },
    {
      label: 'Jumlah Ayam Anak (Umur < 15 Bulan)',
      formula: `SUMIF(J${firstDataRow}:J${lastDataRow},"<5",D${firstDataRow}:D${lastDataRow})`,
      result: popAnak,
    },
    {
      label: 'Jumlah Keseluruhan ',
      formula: `M${sumStart}+M${sumStart+1}+M${sumStart+2}`,
      result: popInduk + popGadis + popAnak,
    },
    {
      label: 'Jumlah Ayam Bertelur >50%',
      formula: `SUMIF(AB${firstDataRow}:AB${lastDataRow},">50",D${firstDataRow}:D${lastDataRow})`,
      result: popBertelur50,
    },
  ];

  middleItems.forEach((item, idx) => {
    const r = sumStart + idx;
    ws.mergeCells(`H${r}:K${r}`);
    const hCell = ws.getCell(`H${r}`);
    hCell.value = item.label;
    hCell.font = { name: 'Arial', size: 11, color: { argb: 'FF1E293B' } };
    hCell.alignment = { vertical: 'middle' };

    const lCell = ws.getCell(`L${r}`);
    lCell.value = ':';
    lCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } };
    lCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const mCell = ws.getCell(`M${r}`);
    mCell.value = { formula: item.formula, result: item.result };
    mCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    mCell.alignment = { horizontal: 'right', vertical: 'middle' };
    mCell.numFmt = '#,##0';
  });

  // Right Column (Pengawas & Date Block)
  const rPengawas = sumStart + 12;
  ws.mergeCells(`V${rPengawas}:AD${rPengawas}`);
  const pengawasHeader = ws.getCell(`V${rPengawas}`);
  pengawasHeader.value = 'Pengawas';
  pengawasHeader.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF0F172A' } };
  pengawasHeader.alignment = { horizontal: 'center', vertical: 'middle' };

  // Signature area (blank space)
  ws.mergeCells(`V${rPengawas + 1}:AD${rPengawas + 5}`);

  // Date cell under signature
  const rDate = rPengawas + 6;
  ws.mergeCells(`V${rDate}:AA${rDate}`);
  const dateCell = ws.getCell(`V${rDate}`);
  dateCell.value = { formula: 'C4', result: dateStr };
  dateCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells(`AB${rDate}:AD${rDate}`);
  const supCell = ws.getCell(`AB${rDate}`);
  supCell.value = `( ${supervisorName} )`;
  supCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  supCell.alignment = { horizontal: 'center', vertical: 'middle' };
}
