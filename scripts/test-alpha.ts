import { prisma } from "../lib/prisma";
import assert from "assert";

async function main() {
  try {
    // 1. Get the first Supplier
    const supplier = await prisma.supplier.findFirst();
    if (!supplier) {
      throw new Error("No supplier found in the database. Please seed the database first.");
    }

    // 2. Create a new PO
    const payload = {
      supplierId: supplier.id,
      dateOrdered: new Date().toISOString(),
      dateExpected: new Date(Date.now() + 86400000 * 2).toISOString(),
      lineItems: [
        {
          itemName: "Test Item",
          unit: "PCS",
          qty: 10,
          price: 5.5,
        }
      ]
    };

    const response = await fetch("http://localhost:3001/api/po", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create PO. Status: ${response.status}, Body: ${errorText}`);
    }

    const data = await response.json();
    const poId = data.id;

    if (!poId) {
        throw new Error("No PO ID returned from the API.");
    }

    // 3. Fetch the created PO from DB and assert status
    // Assuming the model name is purchaseOrder
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId }
    });

    if (!po) {
      throw new Error(`PO with ID ${poId} not found in the database.`);
    }

    assert.strictEqual(po.status, "SENT", `Expected PO status to be 'SENT', got '${po.status}'`);

    // 4. Console log success
    console.log("TEST ALPHA PASSED");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
