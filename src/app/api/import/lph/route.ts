import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { FarmCageData } from '@/lib/data/farm-data';

export const dynamic = 'force-dynamic';

function getCellString(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (Array.isArray(val.richText)) {
      return val.richText.map((t: any) => t.text || '').join('').trim();
    }
    if ('text' in val) return String(val.text).trim();
    if ('result' in val) return String(val.result || '').trim();
  }
  return String(val).trim();
}

function getCellNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val !== null) {
    if ('result' in val) {
      const res = (val as any).result;
      if (typeof res === 'number') return res;
      return Number(res) || 0;
    }
  }
  if (typeof val === 'string') {
    const clean = val.replace(/[^0-9.-]/g, '');
    return Number(clean) || 0;
  }
  return 0;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'File Excel tidak ditemukan dalam permintaan.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json(
        { success: false, message: 'Lembar kerja (worksheet) Excel tidak ditemukan.' },
        { status: 400 }
      );
    }

    // Extract Title & Date info from Row 1-3
    const titleA3 = getCellString(worksheet.getCell('A3').value);

    // Detect branch from title e.g. "HARI/TANGGAL : KAMIS, 3 SEPTEMBER 2026 (3 ALUR)"
    let branchName = 'Cabang 3 Alur (Pusat)';
    let branchId = 'branch-1';

    if (titleA3.includes('SUKAMAJU')) {
      branchName = 'Cabang Sukamaju';
      branchId = 'branch-2';
    } else if (titleA3.includes('HARAPAN')) {
      branchName = 'Cabang Harapan Makmur';
      branchId = 'branch-3';
    } else if (titleA3.includes('SUMBER')) {
      branchName = 'Cabang Sumber Rejeki';
      branchId = 'branch-4';
    } else if (titleA3.includes('BARISAN')) {
      branchName = 'Cabang Bukit Barisan';
      branchId = 'branch-5';
    }

    const parsedCages: FarmCageData[] = [];
    let rowIdx = 6; // Data starts at Row 6 in LPH format

    while (rowIdx <= 60) {
      const cellA = worksheet.getCell(`A${rowIdx}`).value;
      const cageRawName = getCellString(cellA);

      if (!cageRawName) {
        rowIdx++;
        continue;
      }

      // Stop if reached totals row e.g. "TOTAL" or "TOTAL KESELURUHAN"
      if (cageRawName.toUpperCase().startsWith('TOTAL') || cageRawName.toUpperCase().startsWith('TOTAL MAKANAN')) {
        break;
      }

      // Check if valid cage line
      if (!cageRawName.includes('.') && !cageRawName.includes('(') && !cageRawName.toUpperCase().includes('KAWAT') && !cageRawName.toUpperCase().includes('KAYU')) {
        rowIdx++;
        continue;
      }

      // Parse operator name from inside parenthesis
      let opName = 'OPERATOR';
      const opMatch = cageRawName.match(/\((.*?)\)/);
      if (opMatch && opMatch[1]) {
        opName = opMatch[1].trim().toUpperCase();
      }

      const getNum = (col: string) => getCellNumber(worksheet.getCell(`${col}${rowIdx}`).value);
      const getStr = (col: string) => getCellString(worksheet.getCell(`${col}${rowIdx}`).value);

      const kapasitas = getNum('B');
      const populasiHidup = getNum('C');
      const mati = getNum('D');
      const afkir = getNum('E');
      const mutasiKeluar = getNum('F');
      const tanggalMasuk = getStr('G') || '2026-01-29';
      const umurMgg = getNum('H') || 30;
      const umurBln = getNum('I') || Math.round(umurMgg / 4.3);
      const jenis = getStr('J') || 'LAYER';
      const beratAktual = getNum('N') || 1850;
      const beratStandard = getNum('O') || 1858;
      const pagiIkat = getNum('P');
      const soreIkat = getNum('Q');
      const butir = getNum('R');
      const retak = getNum('S');
      const putih = getNum('T');
      const kotorPutih = getNum('U');
      const k = getNum('V');
      const r = getNum('W');
      const l = getNum('X');
      
      let totalProduksi = getNum('Y');
      if (totalProduksi === 0 && (pagiIkat > 0 || soreIkat > 0)) {
        totalProduksi = (pagiIkat * 30) + (soreIkat * 30) + butir + retak + putih + kotorPutih + k + r + l;
      }

      let actPercent = getNum('AA');
      if (actPercent === 0 && populasiHidup > 0 && totalProduksi > 0) {
        actPercent = Number(((totalProduksi / populasiHidup) * 100).toFixed(2));
      }

      const standardPercent = getNum('AB') || 95.5;
      const obat = getStr('AC') || null;

      const cageIndex = parsedCages.length + 1;
      const cleanName = cageRawName.split('(')[0].trim() || `${cageIndex}. KANDANG`;

      parsedCages.push({
        id: `imported-${branchId}-c${cageIndex}`,
        index: cageIndex,
        branchId,
        branchName,
        fullName: cageRawName,
        name: cleanName,
        operator: opName,
        kapasitas: kapasitas || 4000,
        populasiAwal: kapasitas || 4000,
        populasiHidup,
        mati,
        afkir,
        mutasiKeluar,
        mutasiMasuk: 0,
        tanggalMasuk,
        umurMgg,
        umurBln,
        jenis,
        beratAktual,
        beratStandard,
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
        actPercent: Number(actPercent.toFixed(2)),
        standardPercent,
        obat: obat && obat.length > 1 ? obat : null,
      });

      rowIdx++;
    }

    if (parsedCages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Format file tidak sesuai standar LPH. Tidak ditemukan data unit kandang pada baris 6 ke atas.'
        },
        { status: 422 }
      );
    }

    const totalProduksiSum = parsedCages.reduce((acc, c) => acc + c.totalProduksi, 0);
    const totalAyamSum = parsedCages.reduce((acc, c) => acc + c.populasiHidup, 0);
    const avgActCalc = totalAyamSum > 0 ? Number(((totalProduksiSum / totalAyamSum) * 100).toFixed(2)) : 0;

    return NextResponse.json({
      success: true,
      message: `Berhasil mengekstrak seluruh ${parsedCages.length} unit kandang dari file Excel.`,
      dateTitle: titleA3.replace('HARI/TANGGAL :', '').trim(),
      branchId,
      branchName,
      totalCages: parsedCages.length,
      totalProduksi: totalProduksiSum,
      totalPopulasi: totalAyamSum,
      avgAct: avgActCalc,
      cages: parsedCages,
    });
  } catch (error: any) {
    console.error('Import LPH Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memproses file Excel: ' + (error.message || 'Format tidak valid') },
      { status: 500 }
    );
  }
}
