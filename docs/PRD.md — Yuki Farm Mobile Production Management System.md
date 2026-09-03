# PRD.md — Yuki Farm Mobile Production Management System

**Project:** Yuki Farm  
**Product:** Yuki Farm Mobile Production Management System  
**Version:** 1.0  
**Date:** 4 September 2026  
**Status:** Initial Product Requirements Document

---

# 1. Product Overview

Yuki Farm Mobile Production Management System adalah aplikasi web mobile/PWA untuk membantu operasional peternakan ayam dalam melakukan pencatatan, monitoring, perhitungan, dan pelaporan produksi telur secara harian.

Aplikasi ini menggantikan proses pencatatan manual menggunakan Excel dengan sistem yang:

- Mobile-first
- Mudah digunakan oleh petugas kandang
- Terstruktur
- Meminimalkan input manual
- Menghitung indikator produksi secara otomatis
- Mendukung penggunaan melalui smartphone
- Mendukung kondisi internet tidak stabil
- Memiliki histori data
- Memiliki role dan hak akses
- Menghasilkan laporan produksi

Sistem akan menggunakan **Google Sheets sebagai datastore pada fase awal**, dengan arsitektur yang memungkinkan migrasi ke database seperti PostgreSQL di masa depan.

---

# 2. Problem Statement

Saat ini data operasional Yuki Farm dicatat menggunakan spreadsheet Excel.

Format Excel memiliki banyak perhitungan manual dan formula yang saling bergantung, antara lain:

- Jumlah ayam hidup
- Ayam mati
- Ayam afkir
- Mutasi ayam
- Produksi telur
- Telur retak
- Telur putih
- Telur kotor
- Berat ayam
- Persentase produksi
- Standard produksi
- Selisih actual terhadap standard
- Obat/vaksin
- Rekap produksi harian

Masalah utama:

1. Input data membutuhkan waktu.
2. Risiko kesalahan input tinggi.
3. Formula sulit dipelihara.
4. Data historis sulit ditelusuri.
5. Excel kurang nyaman digunakan melalui smartphone.
6. Data operasional dan tampilan laporan tercampur.
7. Perhitungan antar hari memiliki dependency yang sulit dikelola.
8. Tidak terdapat audit trail yang jelas.
9. Belum terdapat sistem role dan permission.
10. Sulit membuat dashboard operasional secara real-time.

---

# 3. Product Goals

## 3.1 Primary Goals

Sistem harus mampu:

- Mengelola data kandang.
- Mengelola populasi ayam.
- Mencatat produksi telur harian.
- Mencatat kematian ayam.
- Mencatat ayam afkir.
- Mencatat mutasi ayam.
- Mencatat berat ayam.
- Mencatat obat/vaksin/perlakuan.
- Menghitung indikator produksi secara otomatis.
- Menampilkan dashboard produksi.
- Menampilkan histori data.
- Membuat laporan.
- Menyediakan role-based access.
- Menyimpan audit log.
- Tetap nyaman digunakan pada smartphone.

## 3.2 Secondary Goals

Sistem diharapkan:

- Bisa digunakan sebagai PWA.
- Bisa di-install pada smartphone.
- Tetap dapat melakukan input ketika koneksi internet tidak stabil.
- Memiliki mekanisme sinkronisasi data.
- Mudah dikembangkan ke modul tambahan.
- Mudah dipindahkan dari Google Sheets ke PostgreSQL.

---

# 4. Non-Goals

Pada versi pertama sistem tidak fokus pada:

- Accounting/finance.
- Payroll.
- Inventory gudang lengkap.
- Purchasing.
- Sales management.
- CRM.
- Marketplace.
- IoT sensor integration.
- Automatic camera-based egg counting.
- AI prediction.

Fitur tersebut dapat dipertimbangkan pada fase berikutnya.

---

# 5. Target Users

## 5.1 Admin

Tanggung jawab:

- Mengelola master data.
- Mengelola user.
- Mengelola kandang.
- Mengelola obat.
- Mengelola standard produksi.
- Melihat seluruh laporan.
- Mengelola konfigurasi sistem.

## 5.2 Supervisor

Tanggung jawab:

- Monitoring operasional.
- Review data petugas.
- Monitoring produksi.
- Monitoring kematian.
- Monitoring populasi.
- Melihat laporan.

## 5.3 Petugas Kandang

Tanggung jawab:

- Input produksi harian.
- Input kematian.
- Input afkir.
- Input mutasi.
- Input berat.
- Input perlakuan/obat.

Petugas hanya dapat mengakses data yang diperlukan untuk pekerjaan operasional.

---

# 6. Platform

## 6.1 Primary Platform

Mobile Web / PWA.

Target utama:

- Android smartphone
- Browser mobile
- Chrome Android

## 6.2 Secondary Platform

Desktop/tablet tetap didukung untuk:

- Admin
- Supervisor
- Reporting
- Data management

Desktop bukan prioritas utama untuk operasional petugas.

---

# 7. Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- PWA

## Backend

Next.js API Route Handlers / Server-side API.

## Datastore — Phase 1

Google Sheets API.

## Future Database

PostgreSQL.

## Hosting

Vercel.

## Authentication

Application authentication dengan role-based access.

---

# 8. High-Level Architecture

```text
                    ┌─────────────────────┐
                    │     Smartphone      │
                    │      PWA/Web        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Next.js        │
                    │     Frontend        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   API / Server      │
                    │     Layer           │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
    ┌─────────────────────┐          ┌─────────────────────┐
    │ Google Sheets API    │          │ Calculation Engine  │
    │ Phase 1 Datastore    │          │ Business Logic      │
    └─────────────────────┘          └─────────────────────┘
```

Frontend **tidak boleh mengakses Google Sheets secara langsung**.

Semua akses data harus melalui server/API.

---

# 9. Core Modules

## 9.1 Dashboard

Dashboard memberikan gambaran kondisi farm pada tanggal tertentu.

### Metrics

- Total ayam hidup
- Total ayam mati
- Total ayam afkir
- Total produksi telur
- Produksi %
- Standard %
- Selisih produksi
- Total berat ayam
- Average body weight
- Jumlah kandang aktif
- Kandang dengan performa rendah
- Kandang dengan mortality tinggi

### Dashboard Cards

Contoh:

```text
TOTAL AYAM
87,420

PRODUKSI HARI INI
82,315 butir

ACT%
94.15%

STANDARD
95.50%

SELISIH
-1.35%
```

### Alerts

Dashboard harus memberikan peringatan untuk:

- Produksi di bawah standard.
- Kematian tinggi.
- Populasi tidak normal.
- Data produksi belum diinput.
- Data kandang belum lengkap.
- Sinkronisasi gagal.

---

# 10. Kandang Management

Module untuk mengelola master kandang.

## Fields

```text
id
kode_kandang
nama_kandang
lokasi
kapasitas
petugas
jenis_ayam
tanggal_masuk
status
created_at
updated_at
```

## Status

- ACTIVE
- INACTIVE
- MAINTENANCE

## Cage List

Menampilkan:

- Kode kandang
- Nama kandang
- Jenis ayam
- Populasi
- Kapasitas
- Produksi hari ini
- ACT%
- Status

---

# 11. Population Management

Population management digunakan untuk mengetahui kondisi populasi ayam.

## Data

```text
tanggal
kandang_id
populasi_awal
ayam_hidup
mati
afkir
pindah_keluar
masuk
keterangan
```

## Business Rule

Jumlah ayam hidup:

```text
Ayam Hidup =
Populasi Awal
+ Ayam Masuk
- Ayam Mati
- Ayam Afkir
- Ayam Pindah Keluar
```

Sistem harus menghitung nilai tersebut secara otomatis.

User tidak perlu menghitung secara manual.

---

# 12. Mortality Management

Petugas dapat mencatat ayam mati.

## Fields

```text
tanggal
kandang_id
jumlah
penyebab
keterangan
created_by
created_at
```

## Mortality Causes

Contoh:

- Disease
- Accident
- Unknown
- Other

Master penyebab dapat dikembangkan kemudian.

## Validation

Jumlah kematian tidak boleh menyebabkan:

```text
Ayam Hidup < 0
```

Sistem harus menampilkan warning jika input mortality melebihi populasi tersedia.

---

# 13. Culling / Afkir Management

Petugas dapat mencatat ayam afkir.

## Fields

```text
tanggal
kandang_id
jumlah
alasan
keterangan
created_by
created_at
```

## Business Rule

Afkir akan mengurangi populasi ayam hidup.

---

# 14. Mutation Management

Digunakan untuk mencatat perpindahan ayam antar kandang.

## Fields

```text
tanggal
kandang_asal
kandang_tujuan
jumlah
jenis_mutasi
keterangan
created_by
created_at
```

## Mutation Types

- TRANSFER_IN
- TRANSFER_OUT

Sistem harus memastikan jumlah ayam pada kandang asal mencukupi sebelum transfer dilakukan.

---

# 15. Daily Egg Production

Ini merupakan salah satu modul utama sistem.

Petugas melakukan input produksi telur setiap hari.

## Production Fields

```text
tanggal
kandang_id

produksi_pagi
produksi_sore

butir
retak
putih
kotor_putih

k
r
l

total_produksi

act_percent
standard_percent
selisih_act

created_by
created_at
updated_at
```

---

# 16. Production Calculation

Mengikuti logika pada laporan Excel existing.

## Total Production

Formula awal:

```text
Total Produksi =
(Pagi × 30)
+ (Sore × 30)
+ Butir
+ Retak
+ Putih
+ Kotor/Putih
+ K
+ R
+ L
```

Formula ini harus dibuat sebagai centralized business logic.

Jangan menulis formula langsung di banyak component.

Contoh:

```text
lib/calculations/production.ts
```

---

# 17. ACT Percentage

ACT% dihitung berdasarkan jumlah produksi dan ayam hidup.

```text
ACT% =
Total Produksi / Ayam Hidup × 100
```

Contoh:

```text
Total Produksi = 82,315
Ayam Hidup = 87,420

ACT% =
82,315 / 87,420 × 100

ACT% = 94.16%
```

Sistem harus melakukan perhitungan otomatis.

---

# 18. Production Standard

Standard produksi tidak boleh hardcoded pada frontend.

Standard harus berasal dari master data.

Contoh:

```text
jenis_ayam
umur_minggu
standard_percent
standard_weight
```

Contoh:

```text
LAYER | 30 | 95.00
LAYER | 31 | 95.50
LAYER | 32 | 95.70
```

---

# 19. Production Difference

Selisih actual terhadap standard:

```text
Selisih =
ACT%
- Standard%
```

Contoh:

```text
ACT%      = 94.16%
Standard  = 95.50%

Selisih   = -1.34%
```

Interpretasi:

```text
> 0  = Above Standard
= 0  = On Standard
< 0  = Below Standard
```

---

# 20. Production Status

Production status:

### ABOVE

Jika:

```text
ACT% > Standard%
```

### NORMAL

Jika ACT% berada dalam tolerance tertentu.

### BELOW

Jika:

```text
ACT% < Standard%
```

Tolerance harus configurable.

---

# 21. Chicken Age

Umur ayam dihitung berdasarkan:

```text
Tanggal Laporan
-
Tanggal Masuk
```

Sistem otomatis menghitung:

- Umur hari
- Umur minggu
- Umur bulan

User tidak perlu menginput umur setiap hari.

Contoh:

```text
Tanggal masuk:
29 Januari 2026

Tanggal laporan:
3 September 2026

Umur:
±31 minggu
±7 bulan
```

---

# 22. Weight Management

Module untuk pencatatan berat ayam.

## Fields

```text
tanggal
kandang_id
berat_total_kg
jumlah_ayam
berat_rata_rata_gram
standard_berat_gram
selisih_berat
created_by
created_at
```

## Average Weight

```text
Average Weight =
Total Weight × 1000
/
Jumlah Ayam
```

Contoh:

```text
Total weight = 1910 kg
Jumlah ayam = 4104

Average =
1910 × 1000 / 4104

≈ 465.4 gram
```

Jika metode penimbangan berbeda digunakan di lapangan, formula dapat dikonfigurasi kemudian.

---

# 23. Treatment / Medicine Management

Module untuk mencatat obat, vaksin, dan perlakuan ayam.

## Fields

```text
tanggal
kandang_id
jenis
nama_obat
dosis
satuan
keterangan
created_by
created_at
```

## Treatment Types

- OBAT
- VAKSIN
- VITAMIN
- SUPPLEMENT
- OTHER

---

# 24. Master Medicine

Admin dapat mengelola daftar obat.

## Fields

```text
id
kode_obat
nama_obat
jenis
satuan
status
created_at
updated_at
```

Contoh:

```text
OTRALEC
Vitamin
ml
ACTIVE
```

---

# 25. Daily Report

Sistem harus menyediakan laporan harian.

## Daily Report Contents

```text
Tanggal

Total Kandang
Total Ayam
Total Mati
Total Afkir
Total Mutasi

Total Produksi
ACT%
Standard%
Selisih%

Total Berat
Average Weight

Kandang terbaik
Kandang di bawah standard

Obat/Vaksin
```

---

# 26. Cage Performance

User dapat melihat performa setiap kandang.

## Metrics

- Population
- Mortality
- Culling
- Production
- ACT%
- Standard%
- Difference
- Average Weight

Contoh:

```text
Kandang 01

Ayam Hidup       4,102
Produksi         3,920
ACT%             95.56%
Standard         95.50%
Difference       +0.06%

Status:
ABOVE STANDARD
```

---

# 27. Production History

User dapat melihat histori produksi.

Filter:

- Tanggal
- Range tanggal
- Kandang
- Jenis ayam
- Status produksi

Tampilan mobile menggunakan card/list.

Contoh:

```text
03 Sep 2026
Kandang 01

Produksi
3,920

ACT%
95.56%

Standard
95.50%

+0.06%
```

---

# 28. Reports

Module laporan menyediakan:

- Daily report
- Production report
- Population report
- Mortality report
- Culling report
- Mutation report
- Weight report
- Treatment report

Filter berdasarkan:

```text
Tanggal
Range tanggal
Kandang
Jenis ayam
```

Export:

- PDF
- Excel

Export dapat dilakukan server-side.

---

# 29. User Management

Admin dapat mengelola user.

## User Fields

```text
id
name
email
role
status
created_at
updated_at
```

## Roles

```text
ADMIN
SUPERVISOR
PETUGAS
```

---

# 30. Authentication

Login menggunakan:

```text
Email
Password
```

Setelah login user mendapatkan session/token.

Role menentukan akses module.

---

# 31. Authorization

## ADMIN

Full access.

## SUPERVISOR

```text
Dashboard
Kandang
Produksi
Populasi
Berat
Perlakuan
Laporan
```

Tidak dapat mengubah konfigurasi sistem tertentu.

## PETUGAS

```text
Dashboard
Produksi
Populasi
Kematian
Afkir
Mutasi
Berat
Perlakuan
```

---

# 32. Audit Log

Setiap perubahan data penting harus tercatat.

## Audit Fields

```text
id
user_id
action
table_name
record_id
old_value
new_value
created_at
```

Actions:

```text
CREATE
UPDATE
DELETE
LOGIN
LOGOUT
```

Audit log tidak boleh diubah oleh user biasa.

---

# 33. Offline Support

Karena area kandang mungkin memiliki koneksi internet yang tidak stabil, aplikasi harus memiliki kemampuan PWA/offline.

Minimal requirement:

- App shell tetap dapat dibuka.
- Form input dapat digunakan ketika koneksi sementara terputus.
- Data input disimpan sementara di device.
- Data akan masuk queue.
- Ketika koneksi tersedia, data disinkronkan ke server.
- User mendapatkan status sinkronisasi.

Contoh status:

```text
✓ Tersimpan
⟳ Menunggu sinkronisasi
⚠ Gagal sinkronisasi
```

Teknologi yang dapat digunakan:

```text
IndexedDB
```

---

# 34. Sync Strategy

Setiap transaksi offline memiliki:

```text
local_id
created_at
sync_status
retry_count
```

Status:

```text
PENDING
SYNCING
SYNCED
FAILED
```

Server harus mencegah duplicate transaction ketika request dikirim ulang.

Gunakan idempotency key atau unique transaction ID.

---

# 35. Mobile UX Requirements

Aplikasi harus didesain mobile-first.

Target viewport utama:

```text
390 × 844
```

UI harus:

- Touch-friendly.
- Button mudah ditekan.
- Form tidak terlalu panjang.
- Input angka menggunakan numeric keyboard.
- Menghindari tabel besar pada mobile.
- Menggunakan card/list.
- Menampilkan informasi penting terlebih dahulu.
- Memiliki bottom navigation.
- Memiliki quick action.

---

# 36. Bottom Navigation

Navigation utama:

```text
Home
Kandang
Produksi
Laporan
```

Module tambahan dapat berada pada menu:

```text
More
```

---

# 37. Quick Actions

Dashboard menyediakan:

```text
+ Input Produksi
+ Kematian
+ Afkir
+ Mutasi
+ Berat
+ Perlakuan
```

Quick action harus dapat dilakukan dengan maksimal beberapa tap.

---

# 38. UI Design System

## Primary Color

Deep Farm Green.

## Semantic Colors

Green:

```text
Normal / Above Standard / Success
```

Orange:

```text
Warning
```

Red:

```text
Critical / Below Standard / Error
```

Blue:

```text
Information
```

## Typography

Gunakan font modern dan mudah dibaca pada smartphone.

Prioritas:

- readability
- hierarchy
- numeric visibility

Angka KPI harus lebih besar daripada label.

---

# 39. Validation Rules

## Population

Tidak boleh:

```text
jumlah mati > ayam hidup
```

Tidak boleh:

```text
jumlah afkir > ayam hidup
```

Tidak boleh:

```text
mutasi keluar > ayam hidup
```

## Production

Nilai produksi tidak boleh negatif.

## Weight

Berat harus:

```text
> 0
```

## Required Fields

Minimal:

```text
tanggal
kandang
jumlah/data utama
created_by
```

---

# 40. Data Model

## KANDANG

```text
id
kode_kandang
nama_kandang
lokasi
kapasitas
petugas
jenis_ayam
tanggal_masuk
status
created_at
updated_at
```

## POPULASI

```text
id
tanggal
kandang_id
populasi_awal
ayam_hidup
mati
afkir
pindah_keluar
masuk
keterangan
created_by
created_at
```

## PRODUKSI

```text
id
tanggal
kandang_id
produksi_pagi
produksi_sore
butir
retak
putih
kotor_putih
k
r
l
total_produksi
act_percent
standard_percent
selisih_act
created_by
created_at
updated_at
```

## KEMATIAN

```text
id
tanggal
kandang_id
jumlah
penyebab
keterangan
created_by
created_at
```

## MUTASI

```text
id
tanggal
kandang_asal
kandang_tujuan
jumlah
jenis_mutasi
keterangan
created_by
created_at
```

## BERAT

```text
id
tanggal
kandang_id
berat_total_kg
jumlah_ayam
berat_rata_rata_gram
standard_berat_gram
selisih_berat
created_by
created_at
```

## PERLAKUAN

```text
id
tanggal
kandang_id
jenis
nama_obat
dosis
satuan
keterangan
created_by
created_at
```

## MASTER_OBAT

```text
id
kode_obat
nama_obat
jenis
satuan
status
```

## MASTER_STANDARD

```text
id
jenis_ayam
umur_minggu
standard_percent
standard_weight
tolerance
```

## USERS

```text
id
name
email
role
status
created_at
updated_at
```

## DAILY_SUMMARY

```text
id
tanggal
total_kandang
total_ayam
total_mati
total_afkir
total_mutasi
total_produksi
act_percent
standard_percent
selisih_act
total_weight
average_weight
created_at
updated_at
```

## AUDIT_LOG

```text
id
user_id
action
table_name
record_id
old_value
new_value
created_at
```

---

# 41. Google Sheets Structure

Phase 1 menggunakan Google Spreadsheet dengan sheet:

```text
01_KANDANG
02_POPULASI
03_PRODUKSI
04_KEMATIAN
05_MUTASI
06_BERAT
07_PERLAKUAN
08_MASTER_OBAT
09_MASTER_JENIS
10_MASTER_STANDARD
11_USERS
12_DAILY_SUMMARY
13_AUDIT_LOG
```

Google Sheets digunakan sebagai storage, bukan sebagai UI utama.

Format spreadsheet harus berupa structured data.

Jangan meniru layout laporan Excel sebagai struktur database.

---

# 42. Existing Excel Migration

Data existing Yuki Farm berasal dari laporan Excel harian.

Sistem harus mempertimbangkan migrasi data existing.

Data penting yang perlu dipetakan:

```text
Kandang
Kapasitas
Ayam hidup
Mati
Afkir
Pindah
Masuk
Umur
Jenis ayam
Berat
Produksi
Telur retak
Telur putih
Telur kotor
K
R
L
ACT%
Standard
Obat/Vaksin
```

Formula Excel harus dikonversi menjadi business logic aplikasi.

Jangan bergantung pada formula Excel sebagai sumber perhitungan utama aplikasi.

---

# 43. Daily Workflow

Workflow petugas:

```text
Login
   ↓
Dashboard
   ↓
Pilih Kandang
   ↓
Input Produksi
   ↓
Input Populasi/Mortality
   ↓
Input Afkir/Mutasi jika ada
   ↓
Input Berat jika jadwal pengukuran
   ↓
Input Perlakuan jika ada
   ↓
Review
   ↓
Submit
   ↓
Sync
```

---

# 44. Supervisor Workflow

```text
Login
   ↓
Dashboard
   ↓
Review Production
   ↓
Review Population
   ↓
Review Mortality
   ↓
Review Alerts
   ↓
Open Cage Detail
   ↓
Review History
   ↓
Generate Report
```

---

# 45. Admin Workflow

```text
Login
   ↓
Dashboard
   ↓
Master Data
   ↓
Manage Cage
Manage Users
Manage Medicine
Manage Standards
   ↓
Reports
   ↓
Audit Log
```

---

# 46. Dashboard KPI

Dashboard minimal menampilkan:

```text
Total Ayam
Total Produksi
ACT%
Standard%
Selisih
Mortality
Afkir
Average Weight
```

Dashboard juga menampilkan trend:

- Production trend
- ACT% trend
- Mortality trend
- Population trend

Range:

```text
7 hari
30 hari
Custom
```

---

# 47. Alerts

System alert examples:

```text
⚠ Kandang 03 berada 2.1% di bawah standard.

⚠ Mortality Kandang 07 meningkat hari ini.

⚠ Produksi Kandang 12 belum diinput.

✓ Produksi global hari ini berada di atas standard.
```

Alert harus berdasarkan business rules.

---

# 48. Performance Requirements

Target:

- Initial page load cepat pada koneksi mobile.
- API response normal < 2 detik.
- Form submission memberikan feedback langsung.
- Dashboard tidak melakukan query data besar secara berulang.
- Gunakan `DAILY_SUMMARY` untuk aggregation yang sering digunakan.
- Hindari mengambil seluruh spreadsheet jika hanya membutuhkan sebagian data.

---

# 49. Security Requirements

Google credentials tidak boleh berada di frontend.

Environment variables:

```text
GOOGLE_PROJECT_ID=
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEET_ID=
```

Jangan menggunakan:

```text
NEXT_PUBLIC_GOOGLE_PRIVATE_KEY
```

Private credentials hanya boleh digunakan server-side.

---

# 50. Error Handling

Semua error harus memiliki pesan yang mudah dipahami user.

Contoh:

```text
Gagal menyimpan data.

Periksa koneksi internet dan coba lagi.
```

Untuk offline:

```text
Tidak ada koneksi.

Data akan disimpan sementara dan disinkronkan
ketika koneksi tersedia.
```

Untuk validation:

```text
Jumlah ayam mati melebihi populasi tersedia.
```

---

# 51. Empty States

Jika belum ada data:

```text
Belum ada data produksi hari ini.

[ + Input Produksi ]
```

Jangan menampilkan halaman kosong.

---

# 52. Loading States

Gunakan:

- Skeleton
- Spinner pada button
- Disabled state
- Optimistic UI jika aman

Contoh:

```text
Menyimpan...
```

Setelah berhasil:

```text
✓ Data berhasil disimpan
```

---

# 53. Notification

Notification digunakan untuk:

- Successful save
- Validation error
- Sync status
- Important farm alerts
- Production warning

---

# 54. Reporting Requirements

Report harus mendukung:

```text
Daily
Weekly
Monthly
Custom Range
```

Grouping:

```text
Per Kandang
Per Jenis Ayam
Global
```

---

# 55. Export Requirements

Export PDF dan Excel harus menghasilkan data yang rapi.

PDF:

```text
YUKI FARM
LAPORAN PRODUKSI TELUR

Tanggal:
03 September 2026

Summary

Detail Kandang
```

Excel:

Data harus dalam bentuk structured table, bukan screenshot laporan.

---

# 56. Repository Architecture

Karena Google Sheets hanya digunakan sebagai Phase 1 datastore, akses data harus melalui repository abstraction.

Contoh:

```text
lib/
└── repositories/
    ├── kandang.repository.ts
    ├── produksi.repository.ts
    ├── populasi.repository.ts
    ├── kematian.repository.ts
    ├── mutasi.repository.ts
    ├── berat.repository.ts
    └── perlakuan.repository.ts
```

Implementasi pertama:

```text
GoogleSheetsRepository
```

Future:

```text
PostgresRepository
```

Frontend tidak boleh mengetahui apakah data berasal dari Google Sheets atau PostgreSQL.

---

# 57. Calculation Architecture

Semua calculation harus centralized.

```text
lib/
└── calculations/
    ├── production.ts
    ├── population.ts
    ├── weight.ts
    ├── age.ts
    └── standard.ts
```

Contoh:

```text
calculateLivePopulation()
calculateTotalProduction()
calculateActPercent()
calculateProductionDifference()
calculateAverageWeight()
calculateChickenAge()
getProductionStandard()
```

---

# 58. API Requirements

Contoh endpoint:

```text
GET    /api/kandang
POST   /api/kandang
PUT    /api/kandang/:id
DELETE /api/kandang/:id

GET    /api/produksi
POST   /api/produksi
PUT    /api/produksi/:id

GET    /api/populasi
POST   /api/populasi

GET    /api/kematian
POST   /api/kematian

GET    /api/mutasi
POST   /api/mutasi

GET    /api/berat
POST   /api/berat

GET    /api/perlakuan
POST   /api/perlakuan

GET    /api/laporan
```

---

# 59. Project Structure

Recommended:

```text
yuki-farm/
│
├── app/
│   ├── (auth)/
│   │   └── login/
│   │
│   ├── (dashboard)/
│   │   ├── page.tsx
│   │   ├── kandang/
│   │   ├── produksi/
│   │   ├── populasi/
│   │   ├── berat/
│   │   ├── perlakuan/
│   │   └── laporan/
│   │
│   └── api/
│       ├── kandang/
│       ├── produksi/
│       ├── populasi/
│       ├── kematian/
│       ├── mutasi/
│       ├── berat/
│       ├── perlakuan/
│       └── laporan/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── dashboard/
│   ├── kandang/
│   ├── produksi/
│   └── laporan/
│
├── lib/
│   ├── google-sheets/
│   ├── repositories/
│   ├── calculations/
│   ├── validation/
│   └── utils/
│
├── types/
│
├── public/
│   ├── icons/
│   └── manifest.json
│
├── .env.local
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

# 60. MVP Scope

MVP harus fokus pada operasional inti.

## Phase 1 — Foundation

- Project setup
- Authentication
- User roles
- Google Sheets integration
- Basic layout
- PWA setup

## Phase 2 — Master Data

- Kandang
- Jenis ayam
- Standard produksi
- Obat
- User

## Phase 3 — Daily Operations

- Produksi
- Populasi
- Kematian
- Afkir
- Mutasi
- Berat
- Perlakuan

## Phase 4 — Dashboard

- KPI
- Production summary
- Cage performance
- Alerts

## Phase 5 — Reports

- Daily report
- Production history
- PDF export
- Excel export

## Phase 6 — Offline

- IndexedDB
- Offline queue
- Sync engine
- Conflict handling

---

# 61. Future Development

Setelah MVP stabil, sistem dapat dikembangkan menjadi Farm Management System.

Potential modules:

```text
Feed Management
Inventory
Purchasing
Sales
Finance
Payroll
Employee Management
Supplier Management
Egg Inventory
Egg Grading
Warehouse
IoT
Sensor Monitoring
Temperature Monitoring
Automatic Egg Counting
Production Forecasting
AI Analytics
```

---

# 62. Future Database Migration

Google Sheets digunakan untuk mempercepat MVP.

Jika volume transaksi meningkat, sistem dapat dipindahkan ke PostgreSQL.

Target architecture:

```text
Mobile App
     ↓
Next.js API
     ↓
Repository Layer
     ↓
PostgreSQL
```

Frontend tidak perlu dirombak karena business logic dan repository sudah dipisahkan.

---

# 63. Success Metrics

MVP dianggap berhasil jika:

### Operational

- Petugas dapat melakukan input produksi dari smartphone.
- Input harian dapat selesai dengan cepat.
- Tidak membutuhkan Excel untuk operasional harian.
- Data produksi tersimpan secara terstruktur.

### Accuracy

- Perhitungan ACT% otomatis.
- Perhitungan population otomatis.
- Perhitungan average weight otomatis.
- Tidak ada perhitungan manual yang diperlukan user.

### Usability

- Petugas baru dapat memahami aplikasi tanpa training panjang.
- Input dapat dilakukan dalam beberapa langkah.
- UI tetap nyaman pada layar smartphone.

### Reliability

- Data tidak hilang ketika koneksi terputus.
- Offline queue dapat melakukan retry.
- Duplicate submission dapat dicegah.

---

# 64. Acceptance Criteria — MVP

## Login

- [ ] User dapat login.
- [ ] Role berhasil dikenali.
- [ ] User tanpa permission tidak dapat mengakses module tertentu.

## Kandang

- [ ] Admin dapat membuat kandang.
- [ ] User dapat melihat daftar kandang.
- [ ] Detail kandang dapat dibuka.
- [ ] Populasi kandang dapat ditampilkan.

## Produksi

- [ ] Petugas dapat input produksi.
- [ ] Total produksi dihitung otomatis.
- [ ] ACT% dihitung otomatis.
- [ ] Standard diambil dari master.
- [ ] Selisih ACT dihitung otomatis.

## Populasi

- [ ] Mortality dapat diinput.
- [ ] Afkir dapat diinput.
- [ ] Mutasi dapat diinput.
- [ ] Populasi dihitung otomatis.

## Berat

- [ ] Berat dapat diinput.
- [ ] Average weight dihitung otomatis.
- [ ] Standard weight dapat ditampilkan.

## Perlakuan

- [ ] Obat/vaksin dapat dicatat.
- [ ] History dapat dilihat.

## Dashboard

- [ ] KPI tampil.
- [ ] Summary production tampil.
- [ ] Cage performance tampil.
- [ ] Alert tampil.

## Reporting

- [ ] User dapat memilih tanggal.
- [ ] User dapat melihat laporan.
- [ ] User dapat export laporan.

## Offline

- [ ] Form dapat menyimpan transaksi ketika offline.
- [ ] Queue transaksi dapat dilihat.
- [ ] Data otomatis sync ketika online.

---

# 65. Important Business Principles

### Principle 1 — Excel is Source of Business Understanding, Not Application Architecture

Excel existing digunakan sebagai referensi terhadap proses bisnis.

Struktur database aplikasi tidak boleh mengikuti layout Excel secara mentah.

### Principle 2 — Calculation Must Be Centralized

Semua formula penting harus berada di calculation layer.

### Principle 3 — Minimize Manual Input

Data yang dapat dihitung oleh sistem harus dihitung otomatis.

### Principle 4 — Mobile First

Operasional kandang menggunakan smartphone sebagai device utama.

### Principle 5 — Offline Ready

Internet tidak boleh menjadi single point of failure untuk input data.

### Principle 6 — Audit Everything Important

Perubahan data operasional penting harus dapat dilacak.

### Principle 7 — Future Proof

Architecture harus memungkinkan Google Sheets diganti PostgreSQL tanpa rewrite frontend.

---

# 66. Initial Product Navigation

```text
LOGIN

HOME
├── Dashboard
├── Quick Actions
└── Alerts

KANDANG
├── Daftar Kandang
└── Detail Kandang

PRODUKSI
├── Input Produksi
└── Histori Produksi

POPULASI
├── Populasi
├── Kematian
├── Afkir
└── Mutasi

BERAT
└── Input Berat

PERLAKUAN
└── Obat / Vaksin

LAPORAN
├── Harian
├── Produksi
├── Populasi
├── Mortality
├── Berat
└── Perlakuan

ADMIN
├── Users
├── Kandang
├── Obat
├── Jenis Ayam
└── Standard Produksi

PROFILE
└── Logout
```

---

# 67. Product Vision

Yuki Farm tidak hanya menjadi aplikasi pengganti Excel.

Target jangka panjang adalah menjadikannya sebagai:

> **Centralized Farm Operations Platform**

yang memungkinkan seluruh aktivitas peternakan dipantau dari smartphone secara real-time.

Data operasional harus berubah dari:

```text
Excel
↓
Input manual
↓
Formula
↓
Laporan
```

menjadi:

```text
Petugas
↓
Mobile App
↓
Structured Data
↓
Automatic Calculation
↓
Dashboard
↓
Reports
↓
Decision Making
```

---

# 68. Final Product Direction

Prioritas pembangunan:

```text
1. Data benar
2. Calculation benar
3. Input mudah
4. Mobile UX bagus
5. Dashboard jelas
6. Reporting
7. Offline
8. Scalability
```

Jangan mengejar terlalu banyak fitur di awal.

MVP harus fokus pada:

```text
KANDANG
+
POPULASI
+
PRODUKSI
+
KEMATIAN
+
AFKIR
+
MUTASI
+
BERAT
+
PERLAKUAN
+
DASHBOARD
+
LAPORAN
```

Setelah workflow tersebut stabil dan divalidasi dengan operasional Yuki Farm, barulah modul tambahan dikembangkan.