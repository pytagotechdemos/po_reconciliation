# AGENT.md — PO Reconciliation Dashboard
**Segmen 01 · Perdagangan, Distribusi & Grosir**

---

## 1. Stack & Environment

```
Framework:   Next.js 14 (App Router)
Database:    PostgreSQL (via Supabase atau Railway)
ORM:         Prisma
Auth:        NextAuth.js (credentials provider)
Styling:     Tailwind CSS v3
State:       Zustand (client) + React Query (server state)
Export:      jsPDF + autoTable, Papa Parse (CSV)
Email alert: Resend
Deployment:  Vercel (frontend) + Supabase (DB)
```

---

## 2. Folder Structure

```
/app
  /dashboard          → halaman utama
  /purchase-orders
    /page.tsx         → daftar PO
    /new/page.tsx     → form buat PO
    /[id]/page.tsx    → detail PO
    /[id]/receive     → input Goods Receipt
  /discrepancy        → halaman khusus alert discrepancy
  /reports            → laporan rekonsiliasi
  /settings
  /api
    /po               → CRUD purchase order
    /goods-receipt    → input penerimaan
    /reconcile        → engine deteksi selisih
    /reports          → generate laporan
    /alerts           → kirim notifikasi

/components
  /ui                 → primitives: Button, Badge, Modal, Input, Table
  /po                 → POForm, POTable, POStatusBadge
  /receipt            → GoodsReceiptForm, ReceiptLineItem
  /discrepancy        → DiscrepancyModal, DiscrepancyAlert
  /reports            → ReportTable, ExportButton
  /layout             → Sidebar, TopBar, SummaryCards

/lib
  /prisma.ts          → Prisma client singleton
  /reconcile.ts       → reconciliation logic (pure functions)
  /export.ts          → PDF & CSV export
  /email.ts           → Resend email helper

/prisma
  /schema.prisma      → data model
```

---

## 3. Data Model (Prisma Schema)

```prisma
model Supplier {
  id           String   @id @default(cuid())
  name         String
  contact      String?
  paymentTerms String?
  orders       PurchaseOrder[]
  createdAt    DateTime @default(now())
}

model PurchaseOrder {
  id             String        @id @default(cuid())
  poNumber       String        @unique
  supplierId     String
  supplier       Supplier      @relation(fields: [supplierId], references: [id])
  dateOrdered    DateTime
  dateExpected   DateTime?
  dateReceived   DateTime?
  status         POStatus      @default(DRAFT)
  notes          String?
  lineItems      POLineItem[]
  goodsReceipts  GoodsReceipt[]
  alerts         Alert[]
  createdBy      String
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}

enum POStatus {
  DRAFT
  SENT
  PARTIAL
  RECEIVED
  DISCREPANCY
  PAID
}

model POLineItem {
  id              String        @id @default(cuid())
  poId            String
  po              PurchaseOrder @relation(fields: [poId], references: [id])
  itemName        String
  unit            String
  qtyOrdered      Decimal
  qtyReceived     Decimal?
  priceOrdered    Decimal
  priceInvoice    Decimal?
  condition       ItemCondition?
  createdAt       DateTime      @default(now())
}

enum ItemCondition {
  OK
  DAMAGED
  SHORT
}

model GoodsReceipt {
  id                 String        @id @default(cuid())
  poId               String
  po                 PurchaseOrder @relation(fields: [poId], references: [id])
  receiptDate        DateTime
  receivedBy         String
  deliveryNoteNumber String?
  photoUrl           String?
  createdAt          DateTime      @default(now())
}

model Alert {
  id              String        @id @default(cuid())
  poId            String
  po              PurchaseOrder @relation(fields: [poId], references: [id])
  type            AlertType
  itemName        String
  valueDiff       Decimal
  acknowledgedBy  String?
  acknowledgedAt  DateTime?
  resolution      String?       // ACCEPTED | CREDIT_NOTE | HOLD
  createdAt       DateTime      @default(now())
}

enum AlertType {
  QTY_DISCREPANCY
  PRICE_DISCREPANCY
}
```

---

## 4. Reconciliation Engine (`/lib/reconcile.ts`)

```typescript
// Pure function — tidak ada side effects, mudah di-test
export interface LineItemDiff {
  itemName: string;
  qtyOrdered: number;
  qtyReceived: number;
  qtyDiff: number;
  priceOrdered: number;
  priceInvoice: number;
  priceDiff: number;
  valueDiff: number; // dalam Rupiah
  hasDiscrepancy: boolean;
}

export function reconcileLineItems(
  lineItems: POLineItem[],
  goodsReceipt: GoodsReceipt
): LineItemDiff[] {
  return lineItems.map((item) => {
    const qtyReceived = item.qtyReceived ?? 0;
    const priceInvoice = item.priceInvoice ?? item.priceOrdered;
    const qtyDiff = item.qtyOrdered - qtyReceived;
    const priceDiff = priceInvoice - item.priceOrdered;
    const valueDiff = (qtyDiff * item.priceOrdered) + (priceDiff * qtyReceived);
    
    return {
      itemName: item.itemName,
      qtyOrdered: Number(item.qtyOrdered),
      qtyReceived,
      qtyDiff,
      priceOrdered: Number(item.priceOrdered),
      priceInvoice,
      priceDiff,
      valueDiff,
      hasDiscrepancy: Math.abs(qtyDiff) > 0 || Math.abs(priceDiff) > 0,
    };
  });
}

export function hasAnyDiscrepancy(diffs: LineItemDiff[]): boolean {
  return diffs.some((d) => d.hasDiscrepancy);
}

export function totalValueDiff(diffs: LineItemDiff[]): number {
  return diffs.reduce((sum, d) => sum + d.valueDiff, 0);
}
```

---

## 5. API Routes

### POST `/api/goods-receipt`
```typescript
// Setelah save Goods Receipt, trigger reconciliation
1. Simpan GoodsReceipt ke DB
2. Update POLineItem.qtyReceived & priceInvoice
3. Jalankan reconcileLineItems()
4. Jika hasAnyDiscrepancy:
   a. Update PO.status = DISCREPANCY
   b. Buat Alert records per discrepancy item
   c. Kirim email notifikasi ke role keuangan
5. Jika tidak ada discrepancy:
   a. Cek apakah semua qty sudah terpenuhi
   b. Update status RECEIVED atau PARTIAL
6. Return: { po, diffs, hasDiscrepancy }
```

### GET `/api/reports/reconciliation`
```
Query params:
  dateFrom, dateTo (required)
  supplierId (optional)
  status (optional)
  
Response: array PO dengan summary discrepancy
Header: includes total nilai selisih aggregate
```

---

## 6. Auth & Role System

```typescript
// 3 roles untuk MVP
enum Role {
  ADMIN_GUDANG    // CRUD PO, input Goods Receipt
  KEUANGAN        // View PO, acknowledge discrepancy, mark paid
  OWNER           // Full read access, view reports, export
}

// Middleware: setiap API route cek session + role
// Route protection via Next.js middleware.ts
```

---

## 7. Development Sequence

```
Sprint 1 (hari 1-5):
  [ ] Setup project: Next.js + Prisma + Supabase + NextAuth
  [ ] Prisma schema + migrate
  [ ] Seed data: 3 supplier, 10 PO, beberapa dengan discrepancy
  [ ] Basic layout: sidebar, topbar, routing

Sprint 2 (hari 6-10):
  [ ] PO CRUD (list, create, detail)
  [ ] Goods Receipt form
  [ ] Reconciliation engine (dengan unit tests)
  [ ] Alert creation & in-app notification badge

Sprint 3 (hari 11-15):
  [ ] Discrepancy modal (dengan 3 resolve actions)
  [ ] Summary cards dashboard
  [ ] Laporan rekonsiliasi (tabel + filter)
  [ ] Export CSV

Sprint 4 (hari 16-18):
  [ ] Export PDF laporan
  [ ] Email notification via Resend
  [ ] Polish UI, demo data realistis (nama supplier Jawa Timur, produk FMCG)
  [ ] Demo script walkthrough test
```

---

## 8. Seed Data untuk Demo

```typescript
// Buat data yang realistis untuk konteks Surabaya/Sidoarjo
const demoSuppliers = [
  { name: "PT Indofood Distribusi Jatim", paymentTerms: "NET 30" },
  { name: "CV Bangunan Maju Bersama", paymentTerms: "NET 14" },
  { name: "UD Oleh-Oleh Sidoarjo Asli", paymentTerms: "COD" },
];

// Skenario demo:
// PO 1: Clean (tidak ada selisih) — untuk kontras
// PO 2: Qty discrepancy — 50 karton dipesan, 48 datang
// PO 3: Price discrepancy — harga invoice berbeda dari PO
// PO 4: Double discrepancy — qty + harga keduanya berbeda
```

---

## 9. Testing Checklist (Pre-Demo)

```
[ ] Buat PO baru end-to-end berhasil
[ ] Input Goods Receipt dengan selisih → discrepancy alert muncul
[ ] Modal discrepancy muncul saat keuangan buka PO bermasalah
[ ] Resolve discrepancy (semua 3 opsi) berfungsi
[ ] Export CSV terbuka benar di Excel
[ ] Export PDF memiliki header dan data benar
[ ] Email notifikasi terkirim (test ke email internal)
[ ] Role: admin gudang tidak bisa akses halaman laporan keuangan
[ ] Summary cards angkanya akurat
[ ] Demo data sudah dimuat dan realistis
```

---

## 10. Environment Variables

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@pytagotech.com

NEXT_PUBLIC_APP_NAME="PO Reconciliation Dashboard"
NEXT_PUBLIC_COMPANY_NAME=  # diisi nama klien saat demo
```
