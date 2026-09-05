import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured } from '@/lib/google-sheets/client';
import { readSheetValues } from '@/lib/google-sheets/sheets-service';
import { FarmBranch, FarmCageData, FeedDistributionItem } from '@/lib/data/farm-data';
import { AuthUser } from '@/lib/data/auth-users';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (!isGoogleSheetsConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Google Sheets belum dikonfigurasi di server.',
        },
        { status: 400 }
      );
    }

    // 1. Ambil data Master Cabang
    const cabangRaw = await readSheetValues('Master Cabang', 'A2:I1000');
    const branches: FarmBranch[] = (cabangRaw || [])
      .filter((r) => {
        const name = (r[3] || r[2] || r[1] || '').trim();
        const status = (r[7] || '').toUpperCase().trim();
        return name.length > 0 && status !== 'DIHAPUS';
      })
      .map((r, i) => {
        const name = (r[3] || r[2] || r[1] || `Cabang ${i + 1}`).trim();
        const id = (r[1] || '').trim() || `branch-${i + 1}`;
        const code = (r[2] || `${i + 1}`).trim();
        const location = (r[4] || 'Lokasi Peternakan').trim();
        const totalCages = Number(r[5]) || 0;
        const populasi = Number(r[6]) || 0;
        const status = (r[7] as any) || 'OPTIMAL';
        return {
          id,
          code,
          name,
          shortName: name,
          location,
          totalCages,
          kapasitas: 0,
          populasi,
          produksi: 0,
          act: 0,
          status,
        };
      });

    // 2. Ambil data Master Kandang
    const kandangRawAll = await readSheetValues('Master Kandang', 'A1:P2000');
    let cageRows: string[][] = [];
    let hasPhoneColumn = false;

    if (Array.isArray(kandangRawAll) && kandangRawAll.length > 0) {
      const headerRow = (kandangRawAll[0] || []).map((h) => String(h || '').trim().toLowerCase());
      const isHeader = headerRow.some((h) => h.includes('kandang') || h.includes('timestamp'));
      if (isHeader) {
        hasPhoneColumn = headerRow.some(
          (h) => h.includes('hp') || h.includes('phone') || h.includes('wa') || h.includes('telepon')
        );
        cageRows = kandangRawAll.slice(1);
      } else {
        cageRows = kandangRawAll;
      }
    }

    const cages: FarmCageData[] = cageRows
      .filter((r) => r[1] && r[4]) // Memiliki ID dan Nama Kandang
      .map((r, i) => {
        const id = r[1];
        const branchId = r[2] || branches[0]?.id || 'branch-1';
        const branchName = r[3] || branches[0]?.name || 'Cabang';
        const name = r[4];
        const operator = r[5] || '-';

        let phone: string | undefined = undefined;
        let jenis = 'LAYER';
        let tipe = 'KAWAT';
        let kapasitas = 4000;
        let populasiAwal = 4000;
        let populasiHidup = 4000;
        let umurMgg = 30;
        let tanggalMasuk = new Date().toISOString().split('T')[0];

        const val6 = (r[6] || '').trim();
        const looksLikePhone =
          val6.startsWith('08') ||
          val6.startsWith('+') ||
          (val6.length >= 7 && /^[0-9+-\s()]+$/.test(val6));

        if (hasPhoneColumn || looksLikePhone) {
          phone = val6 && val6 !== '-' ? val6 : undefined;
          jenis = r[7] || 'LAYER';
          tipe = r[8] || 'KAWAT';
          kapasitas = Number(r[9]) || 4000;
          populasiAwal = Number(r[10]) || kapasitas;
          populasiHidup = Number(r[11]) || kapasitas;
          umurMgg = Number(r[12]) || 30;
          tanggalMasuk = r[13] || new Date().toISOString().split('T')[0];
        } else {
          jenis = r[6] || 'LAYER';
          tipe = r[7] || 'KAWAT';
          kapasitas = Number(r[8]) || 4000;
          populasiAwal = Number(r[9]) || kapasitas;
          populasiHidup = Number(r[10]) || kapasitas;
          umurMgg = Number(r[11]) || 30;
          tanggalMasuk = r[12] || new Date().toISOString().split('T')[0];
        }

        return {
          id,
          index: i + 1,
          branchId,
          branchName,
          fullName: `${name} (${operator})`,
          name,
          operator,
          phone,
          kapasitas,
          populasiAwal,
          populasiHidup,
          mati: 0,
          afkir: 0,
          mutasiKeluar: 0,
          mutasiMasuk: 0,
          tanggalMasuk,
          umurMgg,
          umurBln: Math.round(umurMgg / 4.3),
          jenis,
          beratAktual: 0,
          beratStandard: 1858,
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
          tipe,
          obat: null,
        };
      });

    // 3. Ambil data Produksi Telur terbaru untuk memperbarui angka panen kandang & histori harian
    const dailyEggProductions: any[] = [];
    try {
      const prodRaw = await readSheetValues('Produksi Telur', 'A2:X5000');
      if (Array.isArray(prodRaw) && prodRaw.length > 0) {
        for (const r of prodRaw) {
          const tanggal = (r[1] || '').trim();
          const cageId = (r[4] || '').trim();
          if (!tanggal || !cageId) continue;

          const pagiIkat = Number(r[6]) || 0;
          const sheetPagiButir = Number(r[7]) || 0;
          const pagiButir = Math.max(0, sheetPagiButir - (pagiIkat * 30));

          const soreIkat = Number(r[8]) || 0;
          const sheetSoreButir = Number(r[9]) || 0;
          const soreButir = Math.max(0, sheetSoreButir - (soreIkat * 30));

          const butir = Number(r[10]) || (pagiButir + soreButir);
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
          const petugas = (r[21] || '').trim() || 'Petugas';
          const rawStatus = (r[22] || '').trim().toUpperCase();
          const approvalStatus = rawStatus === 'APPROVED' ? 'APPROVED' : 'PENDING';
          const approvedBy = (r[23] || '').trim() || undefined;

          dailyEggProductions.push({
            id: `prod-${cageId}-${tanggal}`,
            tanggal,
            cageId,
            cageName: (r[5] || '').trim() || 'Kandang',
            branchId: (r[2] || '').trim() || 'branch-1',
            branchName: (r[3] || '').trim() || 'Cabang',
            pagiIkat,
            pagiButir,
            soreIkat,
            soreButir,
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
            approvalStatus,
            approvedBy,
            petugas,
            updatedAt: r[0] || new Date().toISOString(),
          });
        }

        // Balik urutan agar baris terbaru diproses lebih dulu untuk status aktif cage
        const reversed = [...prodRaw].reverse();
        const seenCages = new Set<string>();

        for (const r of reversed) {
          const cageId = r[4];
          const cageName = r[5];
          const matchCage = cages.find((c) => c.id === cageId || c.name === cageName);

          if (matchCage && !seenCages.has(matchCage.id)) {
            seenCages.add(matchCage.id);
            matchCage.tanggalProduksi = r[1] || '';
            matchCage.pagiIkat = Number(r[6]) || 0;
            const sheetPagiButir = Number(r[7]) || 0;
            matchCage.pagiButir = Math.max(0, sheetPagiButir - (matchCage.pagiIkat * 30));
            matchCage.soreIkat = Number(r[8]) || 0;
            const sheetSoreButir = Number(r[9]) || 0;
            matchCage.soreButir = Math.max(0, sheetSoreButir - (matchCage.soreIkat * 30));
            matchCage.butir = Number(r[10]) || 0;
            matchCage.retak = Number(r[11]) || 0;
            matchCage.putih = Number(r[12]) || 0;
            matchCage.kotorPutih = Number(r[13]) || 0;
            matchCage.k = Number(r[14]) || 0;
            matchCage.r = Number(r[15]) || 0;
            matchCage.l = Number(r[16]) || 0;
            matchCage.totalProduksi = Number(r[17]) || 0;
            matchCage.actPercent = Number(r[19]) || 0;
          }
        }
      }
    } catch (prodErr) {
      console.warn('Gagal membaca data produksi telur:', prodErr);
    }

    // 4. Ambil data Mortalitas & Populasi terbaru
    try {
      const popRaw = await readSheetValues('Mortalitas & Populasi', 'A2:K3000');
      if (Array.isArray(popRaw) && popRaw.length > 0) {
        const reversedPop = [...popRaw].reverse();
        const seenPopCages = new Set<string>();

        for (const r of reversedPop) {
          const cageId = r[4];
          const cageName = r[5];
          const matchCage = cages.find((c) => c.id === cageId || c.name === cageName);

          if (matchCage && !seenPopCages.has(matchCage.id)) {
            seenPopCages.add(matchCage.id);
            const popAkhir = Number(r[8]);
            if (popAkhir > 0) {
              matchCage.populasiHidup = popAkhir;
            }
          }
        }

        // Akumulasi total mati dan afkir dari seluruh baris
        for (const r of popRaw) {
          const cageId = r[4];
          const cageName = r[5];
          const matchCage = cages.find((c) => c.id === cageId || c.name === cageName);
          if (matchCage) {
            const tipe = r[6];
            const jml = Number(r[7]) || 0;
            if (tipe === 'KEMATIAN') matchCage.mati += jml;
            else if (tipe === 'AFKIR') matchCage.afkir += jml;
          }
        }
      }
    } catch (popErr) {
      console.warn('Gagal membaca data mortalitas:', popErr);
    }

    // 5. Ambil data Penimbangan Bobot terbaru
    try {
      const beratRaw = await readSheetValues('Penimbangan Bobot', 'A2:O2000');
      if (Array.isArray(beratRaw) && beratRaw.length > 0) {
        const reversedBerat = [...beratRaw].reverse();
        const seenBeratCages = new Set<string>();

        for (const r of reversedBerat) {
          const cageId = r[4];
          const cageName = r[5];
          const matchCage = cages.find((c) => c.id === cageId || c.name === cageName);

          if (matchCage && !seenBeratCages.has(matchCage.id)) {
            seenBeratCages.add(matchCage.id);
            const avgGram = Number(r[9]) || 0;
            if (avgGram > 0) {
              matchCage.beratAktual = avgGram;
            }
          }
        }
      }
    } catch (beratErr) {
      console.warn('Gagal membaca data penimbangan bobot:', beratErr);
    }

    // 6. Ambil data Medikasi & Vaksin terbaru
    try {
      const medikasiRaw = await readSheetValues('Medikasi & Vaksin', 'A2:M2000');
      if (Array.isArray(medikasiRaw) && medikasiRaw.length > 0) {
        const reversedMed = [...medikasiRaw].reverse();
        const seenMedCages = new Set<string>();

        for (const r of reversedMed) {
          const cageId = r[4];
          const cageName = r[5];
          const matchCage = cages.find((c) => c.id === cageId || c.name === cageName);

          if (matchCage && !seenMedCages.has(matchCage.id)) {
            seenMedCages.add(matchCage.id);
            if (r[7]) {
              matchCage.obat = r[7];
            }
          }
        }
      }
    } catch (medErr) {
      console.warn('Gagal membaca data medikasi/vaksin:', medErr);
    }

    // 7. Ambil data Distribusi Pakan & Ceklis Pakan
    const feedItems: FeedDistributionItem[] = [];
    try {
      const pakanRaw = await readSheetValues('Distribusi Pakan', 'A2:P2000');
      if (Array.isArray(pakanRaw)) {
        for (const r of pakanRaw) {
          if (!r[1] || !r[5]) continue;
          feedItems.push({
            id: `feed-${r[4] || 'cage'}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            tanggal: r[1],
            branchId: r[2] || 'branch-1',
            branchName: r[3] || 'Cabang',
            cageId: r[4],
            cageName: r[5],
            kandang: r[5],
            populasi: Number(r[6]) || 0,
            jenisPakan: r[7] || 'LAYER',
            jumlahPakanKg: Number(r[8]) || 0,
            kirimKg: Number(r[9]) || 0,
            kirimSak: Number(r[10]) || 0,
            sisaKg: Number(r[11]) || 0,
            konsumsiGr: Number(r[12]) || 0,
            konsumsiGrPerEkor: Number(r[12]) || 0,
            penambahanKg: 0,
            ceklisStatus: (r[13] as any) || 'SUDAH',
            catatan: r[14] || '',
            umur: 30,
          });
        }
      }
    } catch (pakanErr) {
      console.warn('Gagal membaca distribusi pakan:', pakanErr);
    }

    // 5. Ambil data Master Pengguna
    const users: AuthUser[] = [];
    try {
      const userRaw = await readSheetValues('Master Pengguna', 'A2:K1000');
      if (Array.isArray(userRaw)) {
        for (const r of userRaw) {
          if (!r[1] || !r[2]) continue;
          users.push({
            id: r[1],
            username: r[2],
            passwordHash: '123',
            name: r[3] || r[2],
            role: (r[4] as any) || 'PENGAWAS',
            title: r[5] || 'Operator',
            branchId: r[6] || 'all',
            branchName: r[7] || 'Semua Cabang',
            email: r[8] || `${r[2]}@farm.com`,
            avatarInitial: (r[3] || r[2]).slice(0, 2).toUpperCase(),
          });
        }
      }
    } catch (userErr) {
      console.warn('Gagal membaca master pengguna:', userErr);
    }

    return NextResponse.json({
      success: true,
      branches,
      cages,
      feedItems,
      users,
      dailyEggProductions,
      counts: {
        branches: branches.length,
        cages: cages.length,
        feedItems: feedItems.length,
        users: users.length,
        dailyEggProductions: dailyEggProductions.length,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error pulling data from Google Sheets:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Gagal mengambil data dari Google Sheets.',
      },
      { status: 500 }
    );
  }
}
