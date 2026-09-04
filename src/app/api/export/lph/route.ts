import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { initialFarmCages } from '@/lib/data/farm-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const branchParam = (searchParams.get('branch') || '3-alur').toLowerCase();

    // Format Indonesian Date string e.g. KAMIS, 3 SEPTEMBER 2026
    const dateObj = new Date(dateParam + 'T00:00:00');
    const dayNames = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const monthNames = [
      'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
      'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
    ];
    const dayStr = dayNames[dateObj.getDay()];
    const dateNum = dateObj.getDate();
    const monthStr = monthNames[dateObj.getMonth()];
    const yearNum = dateObj.getFullYear();

    // Select authentic file based on branch
    let templateFile = 'LPH 3 ALUR 3-9-26.xlsx';
    let branchLabel = '3 ALUR';

    if (branchParam.includes('rupi') || branchParam === 'branch-2') {
      templateFile = 'LPH B RUPI 3-9-26.xlsx';
      branchLabel = 'BALAI RUPIH';
    } else if (branchParam.includes('rosam') || branchParam === 'branch-3') {
      templateFile = 'LPH ROSAM 3-9-26.xlsx';
      branchLabel = 'ROSAM';
    }

    const templatePath = path.join(process.cwd(), 'docs', templateFile);

    let hasTemplate = false;
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ templatePath)) {
        hasTemplate = true;
      }
    } catch {
      hasTemplate = false;
    }

    const workbook = new ExcelJS.Workbook();
    const dateTitle = `${dayStr}, ${dateNum} ${monthStr} ${yearNum} (${branchLabel})`;

    if (hasTemplate) {
      await workbook.xlsx.readFile(templatePath);
      const worksheet = workbook.worksheets[0];

      // Update Title Date
      const cellA3 = worksheet.getCell('A3');
      if (cellA3.value) {
        cellA3.value = `HARI/TANGGAL : ${dateTitle}`;
      }

      // Update sheet name
      const sheetDateName = `${dateNum}-${dateObj.getMonth() + 1}`;
      worksheet.name = sheetDateName;
    } else {
      // Programmatic fallback matching authentic template structure
      const worksheet = workbook.addWorksheet('LPH');
      worksheet.addRow(['LAPORAN HARIAN PRODUKSI TELUR']);
      worksheet.addRow(['YUKI FARM']);
      worksheet.addRow([`HARI/TANGGAL : ${dateTitle}`]);
      worksheet.addRow([
        'KANDANG', 'Kapasitas', 'JUMLAH AYAM', '', '', '', 'UMUR', '', '', 'Jenis',
        'Ttl/Kd(kg)', 'Ekor/Gr', 'Stdr/Gr', 'Mgg', 'Stdr/Gr', 'Pagi', 'Sore', 'Butir',
        'Retak', 'Putih', 'Kotor', 'K', 'R', 'L', 'TOTAL', 'Ket', 'ACT%', 'STDR', 'OBAT/VAKSIN'
      ]);
      worksheet.addRow([
        '', '', 'Hidup', 'Mati', 'AFKIR', 'Pindah', 'MASUK', 'Mgg', 'Bln', '',
        '', '', '', '', '', 'Pagi', 'Sore', 'Butir', 'Retak', 'Putih', 'Kotor', 'K', 'R', 'L', 'TOTAL', '', 'ACT%', 'STDR', 'OBAT'
      ]);

      initialFarmCages.forEach((c) => {
        worksheet.addRow([
          c.fullName,
          c.kapasitas,
          c.populasiHidup,
          c.mati || '',
          c.afkir || '',
          c.mutasiKeluar || '',
          c.tanggalMasuk,
          c.umurMgg,
          c.umurBln,
          c.jenis,
          '',
          '',
          '',
          c.beratAktual,
          c.beratStandard,
          c.pagiIkat,
          c.soreIkat,
          c.butir,
          c.retak || '',
          c.putih || '',
          c.kotorPutih || '',
          c.k || '',
          c.r || '',
          c.l || '',
          c.totalProduksi,
          '',
          c.actPercent,
          c.standardPercent,
          c.obat || ''
        ]);
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="LPH_${branchLabel.replace(/\s+/g, '_')}_${dateParam}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Export Excel Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengexport file excel: ' + error.message },
      { status: 500 }
    );
  }
}
