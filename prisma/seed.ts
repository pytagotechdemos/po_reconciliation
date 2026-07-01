import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.user.createMany({
    data: [
      { username: 'owner', name: 'Directeur Utama', password: passwordHash, role: 'owner' },
      { username: 'finance', name: 'Tim Keuangan', password: passwordHash, role: 'finance' },
      { username: 'warehouse', name: 'Kepala Gudang', password: passwordHash, role: 'warehouse' },
      { username: 'procurement', name: 'Tim Pengadaan', password: passwordHash, role: 'procurement' },
      // System user for audit logs from background processes / migrations
      { username: 'system', name: 'System', password: passwordHash, role: 'owner' },
    ]
  });

  // 2. Create Master Items (Campuran FMCG, Oleh-Oleh, Bahan Bangunan)
  const indomie = await prisma.item.create({
    data: { sku: 'FMCG-001', name: 'Indomie Goreng Karton', unit: 'Karton', category: 'FMCG', buyPrice: 105000, sellPrice: 120000 }
  });
  const bimoli = await prisma.item.create({
    data: { sku: 'FMCG-002', name: 'Minyak Goreng Bimoli 2L', unit: 'Dus', category: 'FMCG', buyPrice: 180000, sellPrice: 200000 }
  });
  const semen = await prisma.item.create({
    data: { sku: 'BLD-001', name: 'Semen Gresik 40kg', unit: 'Sak', category: 'Material', buyPrice: 55000, sellPrice: 65000 }
  });
  const kerupuk = await prisma.item.create({
    data: { sku: 'SOUV-001', name: 'Kerupuk Udang Ny. Siok', unit: 'Pack', category: 'Souvenir', buyPrice: 25000, sellPrice: 40000 }
  });

  // 3. Create Suppliers
  const supplier1 = await prisma.supplier.create({
    data: { name: 'PT Distributor Sembako Jatim', paymentTerms: 'NET 30', performanceScore: 4 },
  });
  const supplier2 = await prisma.supplier.create({
    data: { name: 'CV Bangunan Kokoh Sidoarjo', paymentTerms: 'NET 14', performanceScore: 5 },
  });
  const supplier3 = await prisma.supplier.create({
    data: { name: 'Pabrik Oleh-Oleh Sidoarjo', paymentTerms: 'COD', performanceScore: 3 },
  });

  // 4. Create PO 1: Clean (FMCG)
  await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-202606-0001',
      supplierId: supplier1.id,
      dateOrdered: new Date('2026-06-01T00:00:00Z'),
      dateExpected: new Date('2026-06-05T00:00:00Z'),
      createdBy: 'Tim Pengadaan',
      status: 'SENT',
      taxRate: 11,
      taxAmount: 2145000,
      lineItems: {
        create: [
          { sku: indomie.sku, itemName: indomie.name, unit: indomie.unit, qtyOrdered: 100, priceOrdered: indomie.buyPrice },
          { sku: bimoli.sku, itemName: bimoli.name, unit: bimoli.unit, qtyOrdered: 50, priceOrdered: bimoli.buyPrice },
        ],
      },
    },
  });

  // 5. Create PO 2: WAITING_APPROVAL (Material, High Value)
  await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-202606-0002',
      supplierId: supplier2.id,
      dateOrdered: new Date('2026-06-10T00:00:00Z'),
      dateExpected: new Date('2026-06-12T00:00:00Z'),
      createdBy: 'Tim Pengadaan',
      status: 'WAITING_APPROVAL',
      taxRate: 11,
      taxAmount: 1512500,
      lineItems: {
        create: [
          { sku: semen.sku, itemName: semen.name, unit: semen.unit, qtyOrdered: 250, priceOrdered: semen.buyPrice },
        ],
      },
    },
  });

  // 6. Create PO 3: SENT (Oleh-oleh - Short Expiry Simulation)
  await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-202606-0003',
      supplierId: supplier3.id,
      dateOrdered: new Date('2026-06-15T00:00:00Z'),
      dateExpected: new Date('2026-06-16T00:00:00Z'),
      createdBy: 'Tim Pengadaan',
      status: 'SENT',
      taxRate: 11,
      taxAmount: 550000,
      lineItems: {
        create: [
          { sku: kerupuk.sku, itemName: kerupuk.name, unit: kerupuk.unit, qtyOrdered: 200, priceOrdered: kerupuk.buyPrice },
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
