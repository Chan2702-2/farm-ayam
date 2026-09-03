// ============================================================
// ENUMS
// ============================================================

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'PETUGAS'
export type UserStatus = 'ACTIVE' | 'INACTIVE'
export type KandangStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
export type MutasiType = 'TRANSFER_IN' | 'TRANSFER_OUT'
export type TreatmentType = 'OBAT' | 'VAKSIN' | 'VITAMIN' | 'SUPPLEMENT' | 'OTHER'
export type ObatStatus = 'ACTIVE' | 'INACTIVE'
export type ProductionStatus = 'ABOVE' | 'NORMAL' | 'BELOW'
export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED'
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT'
export type MortalityCause = 'DISEASE' | 'ACCIDENT' | 'UNKNOWN' | 'OTHER'

// ============================================================
// USER
// ============================================================

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  created_at: string
  updated_at: string
}

// ============================================================
// KANDANG
// ============================================================

export interface Kandang {
  id: string
  kode_kandang: string
  nama_kandang: string
  lokasi: string
  kapasitas: number
  petugas: string
  jenis_ayam: string
  tanggal_masuk: string
  status: KandangStatus
  created_at: string
  updated_at: string
}

// ============================================================
// POPULASI
// ============================================================

export interface Populasi {
  id: string
  tanggal: string
  kandang_id: string
  populasi_awal: number
  ayam_hidup: number
  mati: number
  afkir: number
  pindah_keluar: number
  masuk: number
  keterangan: string
  created_by: string
  created_at: string
}

// ============================================================
// PRODUKSI
// ============================================================

export interface Produksi {
  id: string
  tanggal: string
  kandang_id: string
  produksi_pagi: number
  produksi_sore: number
  butir: number
  retak: number
  putih: number
  kotor_putih: number
  k: number
  r: number
  l: number
  total_produksi: number
  act_percent: number
  standard_percent: number
  selisih_act: number
  created_by: string
  created_at: string
  updated_at: string
}

// ============================================================
// KEMATIAN
// ============================================================

export interface Kematian {
  id: string
  tanggal: string
  kandang_id: string
  jumlah: number
  penyebab: MortalityCause
  keterangan: string
  created_by: string
  created_at: string
}

// ============================================================
// MUTASI
// ============================================================

export interface Mutasi {
  id: string
  tanggal: string
  kandang_asal: string
  kandang_tujuan: string
  jumlah: number
  jenis_mutasi: MutasiType
  keterangan: string
  created_by: string
  created_at: string
}

// ============================================================
// BERAT
// ============================================================

export interface Berat {
  id: string
  tanggal: string
  kandang_id: string
  berat_total_kg: number
  jumlah_ayam: number
  berat_rata_rata_gram: number
  standard_berat_gram: number
  selisih_berat: number
  created_by: string
  created_at: string
}

// ============================================================
// PERLAKUAN
// ============================================================

export interface Perlakuan {
  id: string
  tanggal: string
  kandang_id: string
  jenis: TreatmentType
  nama_obat: string
  dosis: number
  satuan: string
  keterangan: string
  created_by: string
  created_at: string
}

// ============================================================
// MASTER OBAT
// ============================================================

export interface MasterObat {
  id: string
  kode_obat: string
  nama_obat: string
  jenis: TreatmentType
  satuan: string
  status: ObatStatus
}

// ============================================================
// MASTER STANDARD PRODUKSI
// ============================================================

export interface MasterStandard {
  id: string
  jenis_ayam: string
  umur_minggu: number
  standard_percent: number
  standard_weight: number
  tolerance: number
}

// ============================================================
// DAILY SUMMARY
// ============================================================

export interface DailySummary {
  id: string
  tanggal: string
  total_kandang: number
  total_ayam: number
  total_mati: number
  total_afkir: number
  total_mutasi: number
  total_produksi: number
  act_percent: number
  standard_percent: number
  selisih_act: number
  total_weight: number
  average_weight: number
  created_at: string
  updated_at: string
}

// ============================================================
// AUDIT LOG
// ============================================================

export interface AuditLog {
  id: string
  user_id: string
  action: AuditAction
  table_name: string
  record_id: string
  old_value: string | null
  new_value: string | null
  created_at: string
}

// ============================================================
// CALCULATED / VIEW TYPES
// ============================================================

export interface KandangWithStats extends Kandang {
  ayam_hidup: number
  produksi_hari_ini: number
  act_percent: number
  standard_percent: number
  selisih: number
  production_status: ProductionStatus
  umur_hari: number
  umur_minggu: number
  umur_bulan: number
}

export interface ChickenAge {
  hari: number
  minggu: number
  bulan: number
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  code?: string
}

// ============================================================
// AUTH TYPES
// ============================================================

export interface Session {
  user: User
  token: string
  expires_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}
