# PRD — PO Reconciliation Dashboard
**Segmen:** 01 · Perdagangan, Distribusi & Grosir  
**Target:** Distributor FMCG, Agen Material Bangunan, Pusat Oleh-Oleh  
**Status:** MVP Demo · Pytagotech 2026

---

## 1. Problem Statement

Bisnis distribusi B2B beroperasi sebagai perantara: data mengalir dari supplier (PO keluar) dan buyer (order masuk) secara simultan. Selisih antara PO yang dikirim dan barang yang datang — baik dari sisi qty maupun harga — sering baru ketahuan saat tutup buku, setelah invoice sudah dibayar. Dampaknya: kerugian yang tidak bisa direcovery, relasi dengan supplier yang rusak, dan cash flow yang bocor diam-diam.

**Root cause:** Tidak ada sistem reconciliation PO vs. penerimaan aktual yang berjalan real-time.

---

## 2. Goals & Success Metrics

| Goal | Metric |
|------|--------|
| Discrepancy terdeteksi sebelum pembayaran | 100% PO yang memiliki selisih qty/harga terflag sebelum invoice diproses |
| Waktu rekonsiliasi lebih cepat | Dari rata-rata >2 hari menjadi <30 menit per periode |
| Error manusia berkurang | Jumlah invoice dispute dengan supplier turun >80% dalam 3 bulan pertama |
| Visibilitas laporan | Admin bisa export laporan PO vs aktual kapanpun tanpa minta ke tim lain |

---

## 3. User Personas

### 3A. Admin Gudang / Staf Penerimaan
- Tugasnya: catat barang masuk sesuai PO, verifikasi fisik barang
- Pain: harus cocokkan dokumen fisik manual, rawan salah tulis
- Need: input penerimaan cepat, langsung terhubung ke PO asal

### 3B. Staf Keuangan / Accounting
- Tugasnya: proses pembayaran invoice supplier
- Pain: tidak tahu apakah barang sudah diterima sesuai PO sebelum bayar
- Need: notifikasi discrepancy otomatis sebelum approval pembayaran

### 3C. Owner / Kepala Operasional
- Tugasnya: monitor kesehatan operasional bisnis
- Pain: laporan rekonsiliasi harus dikerjakan manual, selalu terlambat
- Need: dashboard real-time, laporan bisa di-export sendiri

---

## 4. Scope MVP

### 4.1 In Scope
- Input & management Purchase Order ke supplier
- Input realisasi penerimaan barang (Goods Receipt)
- Auto-detection selisih qty & harga PO vs aktual
- Alert pre-payment ke staf keuangan
- Laporan rekonsiliasi per periode (export CSV/PDF)
- Status tracking per PO: Draft → Sent → Partially Received → Fully Received → Discrepancy

### 4.2 Out of Scope (fase berikutnya)
- Integrasi langsung ke sistem supplier (EDI/API)
- Akuntansi & jurnal otomatis
- Manajemen stok penuh (inventory)
- Mobile app native

---

## 5. Feature Specification

### F-01 · Input Purchase Order
**Trigger:** Admin buat PO baru untuk supplier  
**Fields:**
- Supplier name (dropdown dari master)
- Nomor PO (auto-generate: `PO-YYYYMM-XXXX`)
- Tanggal PO & estimasi tanggal tiba
- Line items: nama item, qty, satuan, harga satuan, diskon, total
- Catatan/notes
- Status awal: `Draft`

**Rules:**
- PO tidak bisa dikirim tanpa minimal 1 line item
- Harga satuan tidak boleh 0
- Auto-save draft setiap 30 detik

---

### F-02 · Konfirmasi Penerimaan Barang (Goods Receipt)
**Trigger:** Barang tiba, admin gudang catat aktual yang diterima  
**Fields:**
- Pilih PO asal (search by nomor PO / supplier)
- Tanggal penerimaan aktual
- Per line item: qty yang diterima aktual, kondisi barang (OK / Rusak / Kurang)
- Foto bukti penerimaan (opsional, upload)
- Nomor surat jalan

**Rules:**
- Sistem otomatis bandingkan qty aktual vs qty PO
- Jika ada selisih >0 di qty atau harga → status PO berubah ke `Discrepancy`
- Partial receipt diperbolehkan: bisa input penerimaan bertahap per kiriman

---

### F-03 · Auto-Detection & Alert Discrepancy
**Trigger:** Setelah input Goods Receipt tersimpan  
**Logic:**
```
Untuk setiap line item:
  if (qty_aktual != qty_PO) → flag SELISIH QTY
  if (harga_invoice != harga_PO) → flag SELISIH HARGA
  
if ada flag → status = DISCREPANCY
             → kirim notifikasi ke staf keuangan
             → block approval pembayaran sampai discrepancy di-review
```

**Alert format:**
- In-app notification dengan badge merah
- Email notifikasi ke staf keuangan (opsional, toggle di settings)
- Detail discrepancy: item mana, selisih berapa, total nilai selisih dalam Rupiah

---

### F-04 · Pre-Payment Alert
**Trigger:** Staf keuangan buka PO untuk proses pembayaran  
**Behavior:**
- Jika PO dalam status `Discrepancy` → muncul modal warning yang harus di-acknowledge sebelum bisa lanjut
- Warning menampilkan: daftar item selisih, nilai selisih total, opsi untuk resolve atau hold
- Resolve options: Mark as Accepted (terima kondisi selisih), Request Credit Note, Hold Pembayaran

---

### F-05 · Laporan Rekonsiliasi
**Trigger:** Admin/owner buka halaman Laporan  
**Filters:**
- Range tanggal
- Supplier
- Status PO (semua / discrepancy only / resolved)
- Segmen produk

**Output:**
- Tabel: No. PO, Supplier, Total PO, Total Aktual, Selisih Nilai, Status
- Summary card: Total PO periode, Total nilai selisih, % discrepancy rate
- Export: CSV, PDF (dengan header logo perusahaan)

---

## 6. User Flow Utama

```
[Admin buat PO] 
  → Input supplier + line items 
  → Save & Send PO
  → [Status: Sent]

[Barang tiba]
  → Admin input Goods Receipt dari PO asal
  → Sistem compare qty & harga
  → [Tidak ada selisih] → Status: Fully Received → Keuangan bisa proses payment
  → [Ada selisih] → Status: Discrepancy → Alert ke Keuangan

[Keuangan proses payment]
  → Buka PO
  → Jika Discrepancy → Modal warning → Pilih: Accept / Credit Note / Hold
  → Jika clean → Approve payment → Status: Paid
```

---

## 7. Data Model (Simplified)

```
PurchaseOrder
  id, po_number, supplier_id, created_by
  date_po, date_expected, date_received
  status: draft|sent|partial|received|discrepancy|paid
  notes

POLineItem
  id, po_id, item_name, unit
  qty_ordered, qty_received
  price_po, price_invoice
  condition: ok|damaged|short
  
GoodsReceipt
  id, po_id, receipt_date, received_by
  delivery_note_number, photo_url

Supplier
  id, name, contact, payment_terms

Alert
  id, po_id, type: qty_discrepancy|price_discrepancy
  value_diff, acknowledged_by, acknowledged_at
```

---

## 8. Non-Functional Requirements

| Aspek | Requirement |
|-------|-------------|
| Performance | Load halaman dashboard < 2 detik |
| Data | Backup harian, retensi 2 tahun |
| Akses | Role-based: Admin Gudang, Keuangan, Owner |
| Keamanan | Login dengan password, session timeout 8 jam |
| Responsif | Minimal bisa diakses di tablet (1024px) |

---

## 9. Demo Script (untuk Sales)

1. **Opening hook:** "Berapa kali dalam sebulan kalian baru sadar ada selisih barang setelah sudah bayar ke supplier?"
2. Buat PO demo dengan 3 item untuk supplier fiktif
3. Input Goods Receipt — satu item qty kurang, satu item harga berbeda
4. Tunjukkan alert discrepancy muncul otomatis
5. Buka halaman Keuangan — tunjukkan modal warning pre-payment
6. Export laporan rekonsiliasi periode bulan ini
7. **Close:** "Ini bukan soal teknologi — ini soal uang yang selama ini bocor tanpa kalian sadar."

---

## 10. Timeline Estimasi

| Fase | Durasi | Output |
|------|--------|--------|
| Setup & DB schema | 3 hari | Schema final, environment siap |
| Core CRUD PO & GR | 5 hari | Input PO & Goods Receipt berfungsi |
| Reconciliation engine | 3 hari | Auto-detection & alert logic |
| Dashboard & laporan | 4 hari | Dashboard owner, export CSV/PDF |
| Testing & demo polish | 3 hari | Demo-ready, dummy data loaded |
| **Total** | **~18 hari kerja** | |
