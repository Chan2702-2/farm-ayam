// Dynamic Multi-Farm / Multi-Branch Store for Yuki Farm
// Clean architecture without hardcoded dummy data

export interface FarmBranch {
  id: string;
  code: string;
  name: string;
  shortName: string;
  location: string;
  totalCages: number;
  kapasitas: number;
  populasi: number;
  produksi: number;
  act: number;
  status: 'OPTIMAL' | 'BELOW_STD' | 'CRITICAL';
}

export interface FarmCageData {
  id: string;
  index: number;
  branchId: string;
  branchName: string;
  fullName: string;
  name: string;
  operator: string;
  kapasitas: number;
  populasiAwal: number;
  populasiHidup: number;
  mati: number;
  afkir: number;
  mutasiKeluar: number;
  mutasiMasuk: number;
  tanggalMasuk: string;
  umurMgg: number;
  umurBln: number;
  jenis: string;
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
  actPercent: number;
  standardPercent: number;
  tipe?: 'KAWAT' | 'KAYU' | string;
  obat?: string | null;
}

export interface FeedDistributionItem {
  id: string;
  branchId: string;
  branchName: string;
  kandang: string;
  cageId?: string;
  cageName?: string;
  populasi: number;
  jenisPakan: string;
  umur: number;
  konsumsiGr: number;
  konsumsiGrPerEkor?: number;
  jumlahPakanKg: number;
  sisaKg: number;
  kirimKg: number;
  kirimSak: number;
  penambahanKg: number;
  tanggal: string;
}

// Mulai dari KOSONG (0 data dummy)
export const initialFarmBranches: FarmBranch[] = [];
export const initialFarmCages: FarmCageData[] = [];
export const initialFeedDistribution: FeedDistributionItem[] = [];

// Storage version identifier: Bumps old cached dummy data in user browsers
const DATA_VERSION = 'v2_clean_scratch_v2';

export function checkAndMigrateStorage(): void {
  if (typeof window !== 'undefined') {
    const version = localStorage.getItem('yuki_data_version');
    if (version !== DATA_VERSION) {
      localStorage.removeItem('yuki_farm_cages');
      localStorage.removeItem('yuki_farm_branches');
      localStorage.removeItem('yuki_feed_distribution');
      localStorage.removeItem('yuki_activity_logs');
      localStorage.removeItem('yuki_active_branch');
      localStorage.setItem('yuki_data_version', DATA_VERSION);
    }
  }
}

export function clearAllFarmData(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('yuki_farm_cages');
    localStorage.removeItem('yuki_farm_branches');
    localStorage.removeItem('yuki_feed_distribution');
    localStorage.removeItem('yuki_activity_logs');
    localStorage.removeItem('yuki_active_branch');
    localStorage.setItem('yuki_data_version', DATA_VERSION);
    window.dispatchEvent(new Event('branchChange'));
    window.dispatchEvent(new Event('feedChange'));
  }
}

// Branch Store Methods
export function getFarmBranches(): FarmBranch[] {
  checkAndMigrateStorage();
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('yuki_farm_branches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Error parsing farm branches', e);
      }
    }
  }
  return initialFarmBranches;
}

export function saveFarmBranches(branches: FarmBranch[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('yuki_farm_branches', JSON.stringify(branches));
    window.dispatchEvent(new Event('branchChange'));
  }
}

export function addFarmBranch(branchData: {
  code: string;
  name: string;
  shortName?: string;
  location?: string;
}): FarmBranch {
  const current = getFarmBranches();
  const id = `branch-${Date.now()}`;
  const newBranch: FarmBranch = {
    id,
    code: branchData.code.toUpperCase().trim(),
    name: branchData.name.trim(),
    shortName: branchData.shortName?.trim() || branchData.name.trim(),
    location: branchData.location?.trim() || 'Lokasi Peternakan',
    totalCages: 0,
    kapasitas: 0,
    populasi: 0,
    produksi: 0,
    act: 0,
    status: 'OPTIMAL',
  };

  const updated = [...current, newBranch];
  saveFarmBranches(updated);

  // Jika ini cabang pertama, otomatis jadikan cabang aktif
  if (current.length === 0) {
    setActiveBranchId(id);
  }

  return newBranch;
}

export function deleteFarmBranch(branchId: string): void {
  const current = getFarmBranches();
  const updatedBranches = current.filter((b) => b.id !== branchId);
  saveFarmBranches(updatedBranches);

  // Hapus juga kandang milik cabang tersebut
  const allCages = getFarmCages('all');
  const updatedCages = allCages.filter((c) => c.branchId !== branchId);
  saveFarmCages(updatedCages);

  if (getActiveBranchId() === branchId) {
    setActiveBranchId(updatedBranches[0]?.id || 'all');
  }
}

export function getActiveBranchId(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('yuki_active_branch') || 'all';
  }
  return 'all';
}

export function setActiveBranchId(branchId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('yuki_active_branch', branchId);
    window.dispatchEvent(new Event('branchChange'));
  }
}

// Cage Store Methods
export function getFarmCages(branchId?: string): FarmCageData[] {
  checkAndMigrateStorage();
  let list = initialFarmCages;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('yuki_farm_cages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) list = parsed;
      } catch (e) {
        console.error('Error parsing saved cages', e);
      }
    }
  }

  const active = branchId ?? getActiveBranchId();
  if (!active || active === 'all') {
    return list;
  }
  return list.filter((c) => c.branchId === active);
}

export function saveFarmCages(cages: FarmCageData[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('yuki_farm_cages', JSON.stringify(cages));
    
    // Update summary counts in branches
    const branches = getFarmBranches();
    const updatedBranches = branches.map((b) => {
      const branchCages = cages.filter((c) => c.branchId === b.id);
      const totalPop = branchCages.reduce((acc, c) => acc + c.populasiHidup, 0);
      const totalProd = branchCages.reduce((acc, c) => acc + c.totalProduksi, 0);
      const totalKap = branchCages.reduce((acc, c) => acc + c.kapasitas, 0);
      const act = totalPop > 0 ? Number(((totalProd / totalPop) * 100).toFixed(2)) : 0;

      return {
        ...b,
        totalCages: branchCages.length,
        kapasitas: totalKap,
        populasi: totalPop,
        produksi: totalProd,
        act,
        status: act >= 90 ? ('OPTIMAL' as const) : act >= 75 ? ('BELOW_STD' as const) : ('CRITICAL' as const),
      };
    });

    if (branches.length > 0) {
      localStorage.setItem('yuki_farm_branches', JSON.stringify(updatedBranches));
    }

    window.dispatchEvent(new Event('branchChange'));
  }
}

export function addFarmCage(cage: FarmCageData): void {
  const current = getFarmCages('all');
  const updated = [...current, cage];
  saveFarmCages(updated);
}

export function deleteFarmCage(cageId: string): void {
  const current = getFarmCages('all');
  const updated = current.filter((c) => c.id !== cageId);
  saveFarmCages(updated);
}

export function getCageById(id: string): FarmCageData | undefined {
  const cages = getFarmCages('all');
  const normalized = id.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cages.find((c) => {
    const cId = c.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cName = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cFull = c.fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cId === normalized || cName === normalized || cFull.includes(normalized);
  });
}

// Feed Data Methods
export function getFeedDistribution(branchId?: string): FeedDistributionItem[] {
  let list = initialFeedDistribution;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('yuki_feed_distribution');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) list = parsed;
      } catch (e) {
        console.error('Error parsing saved feed items', e);
      }
    }
  }

  const active = branchId ?? getActiveBranchId();
  if (!active || active === 'all') {
    return list;
  }
  return list.filter((f) => f.branchId === active);
}

export function saveFeedDistribution(items: FeedDistributionItem[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('yuki_feed_distribution', JSON.stringify(items));
    window.dispatchEvent(new Event('feedChange'));
  }
}

// Calculations
export function calculateFeedSummary(items: FeedDistributionItem[]) {
  const totalKg = items.reduce((acc, i) => acc + (i.jumlahPakanKg || 0), 0);
  const totalKirimKg = items.reduce((acc, i) => acc + (i.kirimKg || 0), 0);
  const totalSak = items.reduce((acc, i) => acc + (i.kirimSak || 0), 0);
  const totalPop = items.reduce((acc, i) => acc + (i.populasi || 0), 0);
  const avgKonsumsi = totalPop > 0 ? Number(((totalKg * 1000) / totalPop).toFixed(1)) : 0;

  return {
    totalKg: Number(totalKg.toFixed(1)),
    totalKirimKg: Number(totalKirimKg.toFixed(1)),
    totalSak,
    totalPop,
    avgKonsumsi,
    totalCages: items.length,
  };
}

export function calculateCageSummary(cages: FarmCageData[]) {
  const activeCages = cages.filter((c) => c.populasiHidup > 0);
  const totalAyam = cages.reduce((acc, c) => acc + (c.populasiHidup || 0), 0);
  const totalKapasitas = cages.reduce((acc, c) => acc + (c.kapasitas || 0), 0);
  const totalProduksi = cages.reduce((acc, c) => acc + (c.totalProduksi || 0), 0);
  const totalMati = cages.reduce((acc, c) => acc + (c.mati || 0), 0);
  const totalAfkir = cages.reduce((acc, c) => acc + (c.afkir || 0), 0);
  const totalPagiButir = cages.reduce((acc, c) => acc + ((c.pagiIkat || 0) * 30), 0);
  const totalSoreButir = cages.reduce((acc, c) => acc + ((c.soreIkat || 0) * 30), 0);
  const totalRetak = cages.reduce((acc, c) => acc + (c.retak || 0), 0);
  const totalKotor = cages.reduce((acc, c) => acc + (c.kotorPutih || 0), 0);
  const totalKRL = cages.reduce((acc, c) => acc + ((c.k || 0) + (c.r || 0) + (c.l || 0)), 0);

  const avgAct = totalAyam > 0 ? Number(((totalProduksi / totalAyam) * 100).toFixed(2)) : 0;
  const avgStd = 95.5;
  const selisih = Number((avgAct - avgStd).toFixed(2));

  const cagesWithWeight = cages.filter((c) => c.beratAktual > 0 && c.populasiHidup > 0);
  const avgWeight = cagesWithWeight.length > 0
    ? Math.round(cagesWithWeight.reduce((acc, c) => acc + c.beratAktual, 0) / cagesWithWeight.length)
    : 0;

  return {
    totalCages: cages.length,
    activeCagesCount: activeCages.length,
    totalAyam,
    totalKapasitas,
    occupancyRate: totalKapasitas > 0 ? Number(((totalAyam / totalKapasitas) * 100).toFixed(1)) : 0,
    totalProduksi,
    totalPagiButir,
    totalSoreButir,
    totalRetak,
    totalKotor,
    totalKRL,
    totalMati,
    totalAfkir,
    avgAct,
    avgStd,
    selisih,
    avgWeight,
  };
}
