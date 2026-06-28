import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Suppliers
  const indofood = await prisma.supplier.create({
    data: { name: 'PT Indofood Distribusi Jatim', paymentTerms: 'NET 30' },
  });
  const bangunan = await prisma.supplier.create({
    data: { name: 'CV Bangunan Maju Bersama', paymentTerms: 'NET 14' },
  });
  const oleholeh = await prisma.supplier.create({
    data: { name: 'UD Oleh-Oleh Sidoarjo Asli', paymentTerms: 'COD' },
  });

  // 2. Create PO 1: Clean (tidak ada selisih)
  await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-202606-0001',
      supplierId: indofood.id,
      dateOrdered: new Date('2026-06-01T00:00:00Z'),
      dateExpected: new Date('2026-06-05T00:00:00Z'),
      createdBy: 'admin_gudang',
      status: 'SENT',
      lineItems: {
        create: [
          { itemName: 'Indomie Goreng Karton', unit: 'Karton', qtyOrdered: 100, priceOrdered: 105000 },
          { itemName: 'Minyak Goreng Bimoli 2L', unit: 'Dus', qtyOrdered: 50, priceOrdered: 180000 },
        ],
      },
    },
  });

  // 3. Create PO 2: Qty discrepancy
  await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-202606-0002',
      supplierId: bangunan.id,
      dateOrdered: new Date('2026-06-10T00:00:00Z'),
      dateExpected: new Date('2026-06-12T00:00:00Z'),
      createdBy: 'admin_gudang',
      status: 'SENT',
      lineItems: {
        create: [
          { itemName: 'Semen Gresik 40kg', unit: 'Sak', qtyOrdered: 50, priceOrdered: 55000 },
          { itemName: 'Cat Dulux Pentalite', unit: 'Pail', qtyOrdered: 10, priceOrdered: 1200000 },
        ],
      },
    },
  });

  // 4. Create PO 3: Price discrepancy
  await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-202606-0003',
      supplierId: oleholeh.id,
      dateOrdered: new Date('2026-06-15T00:00:00Z'),
      dateExpected: new Date('2026-06-16T00:00:00Z'),
      createdBy: 'admin_gudang',
      status: 'SENT',
      lineItems: {
        create: [
          { itemName: 'Kerupuk Udang Ny. Siok', unit: 'Pack', qtyOrdered: 200, priceOrdered: 25000 },
        ],
      },
    },
  });

  // 5. Create PO 4: Double discrepancy
  await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-202606-0004',
      supplierId: indofood.id,
      dateOrdered: new Date('2026-06-20T00:00:00Z'),
      createdBy: 'admin_gudang',
      status: 'SENT',
      lineItems: {
        create: [
          { itemName: 'Kecap Bango Refill 520ml', unit: 'Dus', qtyOrdered: 30, priceOrdered: 250000 },
        ],
      },
    },
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
