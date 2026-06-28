# DESIGN.md — PO Reconciliation Dashboard
**Segmen 01 · Perdagangan, Distribusi & Grosir**

---

## 1. Design Principles

**Kepercayaan dulu, estetika kedua.** User target (admin gudang, staf keuangan) bukan pengguna tech-savvy — mereka butuh antarmuka yang langsung bisa dibaca tanpa training. Setiap discrepancy harus terlihat dalam hitungan detik.

1. **Clarity over cleverness** — angka dan status harus terbaca dari jarak 1 meter
2. **Alert yang tidak bisa diabaikan** — discrepancy tidak boleh tenggelam di antara elemen lain
3. **Minimal klik untuk tugas utama** — input penerimaan barang ≤ 3 klik dari halaman mana pun

---

## 2. Color System

```
Background utama:    #F8F9FA  (abu sangat muda — mengurangi eye strain shift panjang)
Surface card:        #FFFFFF
Border/divider:      #E2E8F0

Primary action:      #1E40AF  (biru solid — tombol utama, link aktif)
Primary hover:       #1D3A9F

Status: OK/Clean:    #16A34A  (hijau) — PO beres
Status: Partial:     #D97706  (amber) — masih ada yang belum diterima
Status: Discrepancy: #DC2626  (merah solid) + background #FEF2F2 — harus eye-catching
Status: Paid:        #6B7280  (abu) — sudah selesai, tidak perlu perhatian

Text primary:        #111827
Text secondary:      #6B7280
Text on primary:     #FFFFFF
```

**Aturan warna:**
- Merah `#DC2626` HANYA untuk discrepancy dan error — tidak untuk elemen dekoratif
- Amber untuk kondisi "perlu perhatian tapi bukan krisis"
- Hijau untuk konfirmasi positif

---

## 3. Typography

```
Font:        Inter (Google Fonts) — clean, angka mudah dibaca
Fallback:    system-ui, -apple-system, sans-serif

Heading 1:   24px / 700 / line-height 1.3
Heading 2:   18px / 600 / line-height 1.4
Body:        14px / 400 / line-height 1.6
Label:       12px / 500 / uppercase / letter-spacing 0.05em
Angka besar: 32px / 700 (untuk summary cards)
Monospace:   'JetBrains Mono' untuk nomor PO, kode referensi
```

---

## 4. Layout & Grid

```
Max content width: 1280px (centered)
Sidebar nav:       240px (fixed left)
Content area:      flex 1

Padding:
  Page:    32px 40px
  Card:    24px
  Table:   12px 16px (cell)

Border radius:
  Card:    8px
  Badge:   4px
  Button:  6px
  Input:   6px
```

---

## 5. Component Specs

### 5.1 Status Badge
```
Discrepancy:  bg #FEF2F2, text #DC2626, border 1px #FCA5A5
              + ikon ⚠ di kiri
Partial:      bg #FFFBEB, text #D97706, border 1px #FCD34D
Received:     bg #F0FDF4, text #16A34A, border 1px #86EFAC
Paid:         bg #F9FAFB, text #6B7280, border 1px #E5E7EB

Semua badge: font-size 12px, font-weight 600, padding 2px 8px, border-radius 4px
```

### 5.2 Discrepancy Alert Modal
```
Overlay: rgba(0,0,0,0.5) blur(2px)
Modal:
  width: 480px
  border-top: 4px solid #DC2626
  border-radius: 8px
  padding: 32px

Header: ikon ⚠️ merah 32px + teks "Ada Selisih Sebelum Pembayaran"
Body: tabel selisih per item (item | qty PO | qty aktual | selisih | nilai Rp)
Footer: 3 tombol aksi (Terima Selisih | Minta Credit Note | Tunda Pembayaran)

Tombol "Tunda Pembayaran": style destructive, harus konfirmasi lagi
```

### 5.3 Data Table PO List
```
Header row:    bg #F1F5F9, font-weight 600, text #374151
Data row:      bg #FFFFFF, hover bg #F8FAFC
Border:        bottom 1px #F1F5F9 per row
Row highlight discrepancy: bg #FEF2F2 — entire row

Columns (urutan): No. PO | Supplier | Tgl PO | Tgl Terima | Total PO | Total Aktual | Selisih | Status | Aksi
Sticky header: ya, saat scroll
Sortable: Tgl PO (default desc), Status, Selisih Nilai
```

### 5.4 Summary Cards (atas dashboard)
```
4 cards horizontal:
1. Total PO Bulan Ini (biru)
2. Sudah Diterima (hijau)
3. Discrepancy (merah + angka menonjol)
4. Menunggu Pembayaran (amber)

Setiap card:
  width: flex 1
  padding: 24px
  border-radius: 8px
  border: 1px solid warna sesuai status
  Angka besar: 32px bold
  Label: 12px uppercase abu
```

### 5.5 Input Form PO
```
Layout: 2 kolom untuk metadata (supplier, tgl, nomor)
Line items: full-width table input
  - Setiap baris: nama item | qty | satuan | harga satuan | total (auto-calc)
  - Tombol "+ Tambah Item" di bawah tabel
  - Tombol "×" di kanan setiap baris untuk hapus

Validation inline: border merah + pesan error di bawah field
Auto-calculate: total per baris dan grand total update real-time
```

---

## 6. Navigation Structure

```
Sidebar:
  [Logo Pytagotech / nama klien]
  ─────────────────────
  📋 Dashboard
  📦 Purchase Order
      └ Daftar PO
      └ Buat PO Baru
  🚚 Penerimaan Barang
  ⚠️  Discrepancy          ← badge merah jika ada
  📊 Laporan
  ─────────────────────
  ⚙️  Pengaturan
  👤 [nama user]
```

---

## 7. Responsive Behavior

```
Desktop (≥1024px): Sidebar tetap, tabel full columns
Tablet (768–1023px): Sidebar collapse jadi icon-only, tabel scroll horizontal
Mobile (<768px): Tidak dioptimasi untuk MVP — tampilkan pesan "Gunakan desktop/tablet"
```

---

## 8. Empty States

```
Tabel PO kosong:
  Ikon: 📋 (abu)
  Heading: "Belum ada Purchase Order"
  Sub: "Mulai dengan membuat PO pertama ke supplier"
  CTA: [Buat PO Baru]

Tidak ada discrepancy:
  Ikon: ✅ (hijau)
  Heading: "Semua PO bersih"
  Sub: "Tidak ada selisih yang perlu ditangani saat ini"
```

---

## 9. Micro-interactions

- Input Goods Receipt: setelah save, ada toast "Penerimaan tersimpan" → 500ms kemudian kalau ada discrepancy, modal alert muncul (jangan terlalu cepat, beri jeda supaya user sadar ini adalah dua event berbeda)
- Export laporan: tombol berubah jadi loading spinner, lalu "Mengunduh..." sebelum file trigger
- Status badge hover: tooltip dengan deskripsi lengkap status
- Row discrepancy: subtle pulse animation (1x saja saat pertama load, tidak terus-terusan)
