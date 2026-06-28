import { prisma } from "../lib/prisma";

async function runTest() {
  try {
    let supplier = await prisma.supplier.findFirst();
    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: { name: "Test Supplier Gamma" }
      });
    }

    const poPayload = {
      supplierId: supplier.id,
      dateOrdered: new Date().toISOString(),
      dateExpected: new Date().toISOString(),
      lineItems: [
        { itemName: "Gamma Widget", unit: "pcs", qty: 100, price: 50 }
      ]
    };

    const poRes = await fetch("http://localhost:3001/api/po", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(poPayload)
    });
    
    if (!poRes.ok) {
      const errorText = await poRes.text();
      throw new Error(`Failed to create PO: ${poRes.status} - ${errorText}`);
    }
    const po = await poRes.json();
    console.log("PO Created:", po.id);

    const createdPo = await prisma.purchaseOrder.findUnique({
      where: { id: po.id },
      include: { lineItems: true }
    });

    if (!createdPo || !createdPo.lineItems[0]) throw new Error("PO Line Item not found");

    const receiptPayload = {
      poId: po.id,
      receiptDate: new Date().toISOString(),
      receivedBy: "Gamma Tester",
      deliveryNoteNumber: "DN-GAMMA-001",
      items: [
        {
          poLineItemId: createdPo.lineItems[0].id,
          qtyReceived: 90,
          priceInvoice: 50,
          condition: "OK"
        }
      ]
    };

    const grRes = await fetch("http://localhost:3001/api/goods-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(receiptPayload)
    });
    
    if (!grRes.ok) {
      const errorText = await grRes.text();
      throw new Error(`Failed to create Goods Receipt: ${grRes.status} - ${errorText}`);
    }
    const gr = await grRes.json();
    console.log("Goods Receipt Created:", gr);

    const resolveRes = await fetch("http://localhost:3001/api/resolve-discrepancy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poId: po.id })
    });
    
    if (!resolveRes.ok) {
      const errorText = await resolveRes.text();
      throw new Error(`Failed to resolve discrepancy: ${resolveRes.status} - ${errorText}`);
    }
    const resolve = await resolveRes.json();
    console.log("Discrepancy Resolved:", resolve);

    const finalPo = await prisma.purchaseOrder.findUnique({
      where: { id: po.id },
      include: { alerts: true }
    });

    if (finalPo?.status === "PAID" && finalPo?.alerts[0]?.resolution === "ACCEPTED") {
      console.log("TEST GAMMA PASSED");
    } else {
      console.log("TEST GAMMA FAILED. Final PO state:", JSON.stringify(finalPo, null, 2));
    }
  } catch (err) {
    console.error("TEST GAMMA FAILED with error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
