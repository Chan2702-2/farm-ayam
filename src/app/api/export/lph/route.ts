import { NextRequest, NextResponse } from 'next/server';
import { buildRekapLphWorkbook, formatIndonesianFullDate } from '@/lib/export/lph-excel-generator';
import { isGoogleSheetsConfigured } from '@/lib/google-sheets/client';
import { readSheetValues } from '@/lib/google-sheets/sheets-service';
import { FarmBranch, FarmCageData, FeedDistributionItem, DailyEggProductionRecord } from '@/lib/data/farm-data';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      date = new Date().toISOString().split('T')[0],
      branch = 'all',
      cages = [],
      branches = [],
      feedItems = [],
      dailyProductions = [],
      supervisorName = 'Pengawas',
    } = body;

    const workbook = await buildRekapLphWorkbook({
      date,
      branchId: branch,
      branches,
      cages,
      feedItems,
      dailyProductions,
      supervisorName,
    });

    const buffer = await workbook.xlsx.writeBuffer();

    let branchLabel = 'KESELURUHAN';
    if (branch && branch !== 'all' && branch !== 'keseluruhan') {
      const matchBranch = branches.find((b: FarmBranch) => b.id === branch);
      branchLabel = (matchBranch?.shortName || matchBranch?.name || branch).replace(/\s+/g, '_').toUpperCase();
    }

    const filename = `REKAP_LPH_${branchLabel}_${date}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/export/lph:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengekspor file Excel Rekap LPH: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const branchParam = (searchParams.get('branch') || 'all').toLowerCase();

    let branches: FarmBranch[] = [];
    let cages: FarmCageData[] = [];
    let feedItems: FeedDistributionItem[] = [];
    let dailyProductions: DailyEggProductionRecord[] = [];

    // If Google Sheets is configured, pull live data directly
    if (isGoogleSheetsConfigured()) {
      try {
        // 1. Pull branches
        const cabangRaw = await readSheetValues('Master Cabang', 'A2:I1000');
        branches = (cabangRaw || [])
          .filter((r) => {
            const name = (r[3] || r[2] || r[1] || '').trim();
            const status = (r[7] || '').toUpperCase().trim();
            return name.length > 0 && status !== 'DIHAPUS';
          })
          .map((r, i) => {
            const name = (r[3] || r[2] || r[1] || `Cabang ${i + 1}`).trim();
            const id = (r[1] || '').trim() || `branch-${i + 1}`;
            const code = (r[2] || `${i + 1}`).trim();
            return {
              id,
              code,
              name,
              shortName: name,
              location: (r[4] || 'Lokasi Peternakan').trim(),
              totalCages: Number(r[5]) || 0,
              kapasitas: 0,
              populasi: Number(r[6]) || 0,
              produksi: 0,
              act: 0,
              status: 'OPTIMAL' as const,
            };
          });

        // 2. Pull cages
        const kandangRaw = await readSheetValues('Master Kandang', 'A2:P2000');
        cages = (kandangRaw || [])
          .filter((r) => r[1] && r[4])
          .map((r, i) => {
            const id = r[1];
            const bId = r[2] || branches[0]?.id || 'branch-1';
            const bName = r[3] || branches[0]?.name || 'Cabang';
            const name = r[4];
            const operator = r[5] || '-';
            const kapasitas = Number(r[9]) || Number(r[8]) || 4000;
            const populasiHidup = Number(r[11]) || Number(r[10]) || kapasitas;
            const umurMgg = Number(r[12]) || Number(r[11]) || 30;
            const tanggalMasuk = r[13] || r[12] || '2025-08-21';

            return {
              id,
              index: i + 1,
              branchId: bId,
              branchName: bName,
              fullName: `${name} (${operator})`,
              name,
              operator,
              kapasitas,
              populasiAwal: kapasitas,
              populasiHidup,
              mati: 0,
              afkir: 0,
              mutasiKeluar: 0,
              mutasiMasuk: 0,
              tanggalMasuk,
              umurMgg,
              umurBln: Math.floor(umurMgg / 4.3),
              jenis: 'SPESIAL 1',
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
              actPercent: 0,
              standardPercent: 95.5,
              obat: '-',
            };
          });

        // 3. Pull daily productions
        const prodRaw = await readSheetValues('Produksi Telur', 'A2:X5000');
        if (Array.isArray(prodRaw)) {
          prodRaw.forEach((r) => {
            const tgl = (r[1] || '').trim();
            const cId = (r[4] || '').trim();
            if (!tgl || !cId) return;

            const pagiIkat = Number(r[6]) || 0;
            const soreIkat = Number(r[8]) || 0;
            const butir = Number(r[10]) || 0;
            const retak = Number(r[11]) || 0;
            const putih = Number(r[12]) || 0;
            const kotorPutih = Number(r[13]) || 0;
            const k = Number(r[14]) || 0;
            const r_defect = Number(r[15]) || 0;
            const l = Number(r[16]) || 0;
            const totalProduksi = Number(r[17]) || 0;
            const populasiHidup = Number(r[18]) || 4000;
            const actPercent = Number(r[19]) || 0;
            const standardPercent = Number(r[20]) || 95.5;

            dailyProductions.push({
              id: `prod-${cId}-${tgl}`,
              tanggal: tgl,
              cageId: cId,
              cageName: (r[5] || '').trim(),
              branchId: (r[2] || '').trim(),
              branchName: (r[3] || '').trim(),
              pagiIkat,
              pagiButir: 0,
              soreIkat,
              soreButir: 0,
              butir,
              retak,
              putih,
              kotorPutih,
              k,
              r: r_defect,
              l,
              totalProduksi,
              populasiHidup,
              actPercent,
              standardPercent,
              approvalStatus: 'APPROVED',
            });
          });
        }
      } catch (sheetsErr) {
        console.warn('Gagal membaca Google Sheets di GET export lph:', sheetsErr);
      }
    }

    // Default branches if empty
    if (branches.length === 0) {
      branches = [
        { id: 'branch-1', code: '3 ALUR', name: 'Cabang 3 Alur', shortName: '3 Alur', location: 'Lokasi 1', totalCages: 0, kapasitas: 0, populasi: 0, produksi: 0, act: 0, status: 'OPTIMAL' },
        { id: 'branch-2', code: 'B RUPI', name: 'Cabang Balai Rupih', shortName: 'Balai Rupih', location: 'Lokasi 2', totalCages: 0, kapasitas: 0, populasi: 0, produksi: 0, act: 0, status: 'OPTIMAL' },
        { id: 'branch-3', code: 'ROSAM', name: 'Cabang Rosam', shortName: 'Rosam', location: 'Lokasi 3', totalCages: 0, kapasitas: 0, populasi: 0, produksi: 0, act: 0, status: 'OPTIMAL' },
      ];
    }

    const effectiveBranchId = branchParam === 'all' || branchParam === 'keseluruhan' ? 'all' : branchParam;

    const workbook = await buildRekapLphWorkbook({
      date: dateParam,
      branchId: effectiveBranchId,
      branches,
      cages,
      feedItems,
      dailyProductions,
    });

    const buffer = await workbook.xlsx.writeBuffer();

    let branchLabel = 'KESELURUHAN';
    if (effectiveBranchId !== 'all') {
      const matchBranch = branches.find((b) => b.id === effectiveBranchId || b.shortName.toLowerCase().includes(effectiveBranchId));
      branchLabel = (matchBranch?.shortName || matchBranch?.name || effectiveBranchId).replace(/\s+/g, '_').toUpperCase();
    }

    const filename = `REKAP_LPH_${branchLabel}_${dateParam}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Export Excel Error (GET):', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengexport file excel: ' + error.message },
      { status: 500 }
    );
  }
}
