import { prisma } from "../lib/prisma";

async function main() {
  try {
    let supplier = await prisma.supplier.findFirst();
    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: { name: "Test Supplier" }
      });
    }

    // 2. Create PO
    const poPayload = {
      supplierId: supplier.id,
      dateOrdered: new Date().toISOString(),
      dateExpected: new Date().toISOString(),
      lineItems: [
        {
          itemName: "Test Item Beta",
          unit: "PCS",
          qty: 10,
          price: 100
        }
      ]
    };

    const poRes = await fetch("http://localhost:3001/api/po", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(poPayload)
    });

    if (!poRes.ok) {
      throw new Error("Failed to create PO: " + await poRes.text());
    }
    const poData = await poRes.json();
    console.log("Created PO:", poData.poNumber);

    // Fetch PO with line items from DB
    const dbPo = await prisma.purchaseOrder.findUnique({
      where: { id: poData.id },
      include: { lineItems: true }
    });

    if (!dbPo || dbPo.lineItems.length === 0) {
      throw new Error("PO or LineItems not found in DB");
    }

    // 3. Create GR with discrepancy
    const grPayload = {
      poId: dbPo.id,
      receiptDate: new Date().toISOString(),
      receivedBy: "Test Beta",
      deliveryNoteNumber: "DN-TEST-BETA",
      items: [
        {
          poLineItemId: dbPo.lineItems[0].id,
          qtyReceived: 8, // Discrepancy! Ordered 10
          priceInvoice: 100,
          condition: "OK"
        }
      ]
    };

    const grRes = await fetch("http://localhost:3001/api/goods-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(grPayload)
    });

    if (!grRes.ok) {
      throw new Error("Failed to create GR: " + await grRes.text());
    }

    // 4. Assert PO status and Alerts
    const updatedPo = await prisma.purchaseOrder.findUnique({
      where: { id: poData.id },
      include: { alerts: true }
    });

    if (updatedPo?.status !== "DISCREPANCY") {
      throw new Error(`Expected PO status DISCREPANCY, got ${updatedPo?.status}`);
    }

    if (!updatedPo.alerts || updatedPo.alerts.length === 0) {
      throw new Error("Expected Alerts to be created, found none.");
    }

    console.log("TEST BETA PASSED");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
