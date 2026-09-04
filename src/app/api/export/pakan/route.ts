import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

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

    // Determine target template based on branch
    let templateFile = 'PEMBAGIAN PAKAN 3 ALUR 3-9-26.xlsx';
    let branchLabel = '3 ALUR';

    if (branchParam.includes('rupi') || branchParam === 'branch-2') {
      templateFile = 'PEMBAGIAN PAKAN B RUPI  3-9-26.xlsx';
      branchLabel = 'BALAI RUPIH';
    } else if (branchParam.includes('rosam') || branchParam === 'branch-3') {
      templateFile = 'PEMBAGIAN PAKAN ROSAM 3-9-26.xlsx';
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

    if (hasTemplate) {
      await workbook.xlsx.readFile(templatePath);
      const worksheet = workbook.worksheets[0];

      // Update date in Row 3 if applicable
      const dateTitle = `${dayStr}, ${dateNum} ${monthStr} ${yearNum} (${branchLabel})`;
      const cellA3 = worksheet.getCell('A3');
      if (cellA3.value && String(cellA3.value).includes('TANGGAL')) {
        cellA3.value = `TANGGAL : ${dateTitle}`;
      } else {
        const cellB3 = worksheet.getCell('B3');
        if (cellB3.value) {
          cellB3.value = dateTitle;
        }
      }

      // Update sheet name
      worksheet.name = `${dateNum}-${dateObj.getMonth() + 1}`;
    } else {
      const worksheet = workbook.addWorksheet('PEMBAGIAN PAKAN');
      worksheet.addRow([`PEMBAGIAN PAKAN KANDANG ${branchLabel}`]);
      worksheet.addRow([]);
      worksheet.addRow([`TANGGAL : ${dayStr}, ${dateNum} ${monthStr} ${yearNum} (${branchLabel})`]);
      worksheet.addRow([
        'KANDANG', 'Jenis Pakan', 'UMUR', 'Jumlah ayam', 'Konsumsi (GR)',
        'Jumlah pakan (KG)', 'Sisa (KG)', 'Yang harus di Kirim (KG)', 'Sak (50kg)', 'Penambahan (kg)'
      ]);
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="PEMBAGIAN_PAKAN_${branchLabel.replace(/\s+/g, '_')}_${dateParam}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Export Pakan Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengexport file pakan: ' + error.message },
      { status: 500 }
    );
  }
}
