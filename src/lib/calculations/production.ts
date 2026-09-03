import { Produksi, Populasi, Berat, MasterStandard, ChickenAge, ProductionStatus } from '@/types'

// ============================================================
// PRODUCTION CALCULATION
// Total Produksi = (Pagi x 30) + (Sore x 30) + Butir + Retak + Putih + Kotor_Putih + K + R + L
// ============================================================

export function calculateTotalProduction(input: {
  produksi_pagi: number
  produksi_sore: number
  butir: number
  retak: number
  putih: number
  kotor_putih: number
  k: number
  r: number
  l: number
}): number {
  return (
    input.produksi_pagi * 30 +
    input.produksi_sore * 30 +
    input.butir +
    input.retak +
    input.putih +
    input.kotor_putih +
    input.k +
    input.r +
    input.l
  )
}

// ============================================================
// ACT% = Total Produksi / Ayam Hidup x 100
// ============================================================

export function calculateActPercent(totalProduksi: number, ayamHidup: number): number {
  if (ayamHidup <= 0) return 0
  return (totalProduksi / ayamHidup) * 100
}

// ============================================================
// SELISIH = ACT% - Standard%
// ============================================================

export function calculateProductionDifference(actPercent: number, standardPercent: number): number {
  return actPercent - standardPercent
}

// ============================================================
// PRODUCTION STATUS
// ============================================================

export function getProductionStatus(actPercent: number, standardPercent: number, tolerance: number = 0): ProductionStatus {
  const diff = actPercent - standardPercent
  if (diff > tolerance) return 'ABOVE'
  if (diff < -tolerance) return 'BELOW'
  return 'NORMAL'
}

// ============================================================
// POPULATION CALCULATION
// Ayam Hidup = Populasi Awal + Masuk - Mati - Afkir - Pindah Keluar
// ============================================================

export function calculateLivePopulation(input: {
  populasi_awal: number
  masuk: number
  mati: number
  afkir: number
  pindah_keluar: number
}): number {
  return (
    input.populasi_awal +
    input.masuk -
    input.mati -
    input.afkir -
    input.pindah_keluar
  )
}

// ============================================================
// WEIGHT CALCULATION
// Average Weight = Total Weight (kg) x 1000 / Jumlah Ayam
// ============================================================

export function calculateAverageWeight(beratTotalKg: number, jumlahAyam: number): number {
  if (jumlahAyam <= 0) return 0
  return (beratTotalKg * 1000) / jumlahAyam
}

export function calculateWeightDifference(beratRataRataGram: number, standardBeratGram: number): number {
  return beratRataRataGram - standardBeratGram
}

// ============================================================
// CHICKEN AGE CALCULATION
// Umur = Tanggal Laporan - Tanggal Masuk
// ============================================================

export function calculateChickenAge(tanggalMasuk: string, tanggalLaporan?: string): ChickenAge {
  const masuk = new Date(tanggalMasuk)
  const laporan = tanggalLaporan ? new Date(tanggalLaporan) : new Date()

  const diffMs = laporan.getTime() - masuk.getTime()
  const hari = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const minggu = Math.floor(hari / 7)
  const bulan = Math.floor(hari / 30)

  return { hari, minggu, bulan }
}

// ============================================================
// GET PRODUCTION STANDARD BASED ON JENIS & UMUR
// ============================================================

export function getProductionStandard(
  standards: MasterStandard[],
  jenisAyam: string,
  umurMinggu: number
): MasterStandard | null {
  return (
    standards.find(
      (s) => s.jenis_ayam === jenisAyam && s.umur_minggu === umurMinggu
    ) ?? null
  )
}
