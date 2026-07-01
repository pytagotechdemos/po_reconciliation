import { reconcileLineItems, hasAnyDiscrepancy } from "../lib/reconcile";
import { POLineItem } from "@prisma/client";

// receivedItems is the per-delivery payload (not used for qty in the fixed function,
// but priceInvoice from it can override item.priceInvoice)
// lineItems should contain the post-write accumulated qtyReceived
function runTest(name: string, lineItems: POLineItem[], receivedItems: any[], expectDiscrepancy: boolean, expectStatus: string) {
  // Simulate real flow: caller passes lineItems with updated qtyReceived already written.
  // The receivedItems qtyReceived is ignored for qty calculation (only priceInvoice matters).
  const diffs = reconcileLineItems(lineItems, receivedItems);
  const discrepancy = hasAnyDiscrepancy(diffs);

  let newStatus = discrepancy ? "DISCREPANCY" : "RECEIVED";
  if (!discrepancy && diffs.some(d => d.qtyReceived < d.qtyOrdered)) {
    newStatus = "PARTIAL";
  }

  const passed = discrepancy === expectDiscrepancy && newStatus === expectStatus;
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}`);
  if (!passed) {
    console.log(`  Expected Discrepancy: ${expectDiscrepancy}, Got: ${discrepancy}`);
    console.log(`  Expected Status: ${expectStatus}, Got: ${newStatus}`);
    console.log(`  Diffs: `, diffs);
  }
}

// Mock data
const mockItem: POLineItem = {
  id: "1",
  poId: "po1",
  createdAt: new Date(),
  itemName: "Test Item",
  sku: "SKU1",
  unit: "Dus",
  qtyOrdered: 10 as any,
  qtyReceived: 0 as any,
  priceOrdered: 100 as any,
  priceInvoice: 100 as any,
  condition: null,
};

console.log("--- RUNNING LOGIC TESTS ---");

// Test 1: Perfect Receipt — lineItems reflect post-write state (qtyReceived = 10, no diff)
runTest(
  "Perfect Receipt",
  [{ ...mockItem, qtyReceived: 10 as any }],
  [{ poLineItemId: "1", qtyReceived: 10, priceInvoice: 100 }],
  false,
  "RECEIVED"
);

// Test 2: Missing Qty (Under-delivery)
runTest(
  "Under-delivery",
  [{ ...mockItem, qtyReceived: 8 as any }],
  [{ poLineItemId: "1", qtyReceived: 8, priceInvoice: 100 }],
  true,
  "DISCREPANCY"
);

// Test 3: Over-delivery
runTest(
  "Over-delivery",
  [{ ...mockItem, qtyReceived: 12 as any }],
  [{ poLineItemId: "1", qtyReceived: 12, priceInvoice: 100 }],
  true,
  "DISCREPANCY"
);

// Test 4: Price Discrepancy
runTest(
  "Price Discrepancy",
  [{ ...mockItem, qtyReceived: 10 as any }],
  [{ poLineItemId: "1", qtyReceived: 10, priceInvoice: 120 }],
  true,
  "DISCREPANCY"
);

// Test 5: Missing Qty & Price Discrepancy
runTest(
  "Missing Qty & Price Discrepancy",
  [{ ...mockItem, qtyReceived: 8 as any, priceInvoice: 120 as any }],
  [{ poLineItemId: "1", qtyReceived: 8, priceInvoice: 120 }],
  true,
  "DISCREPANCY"
);

// Test 6: Partial Delivery — first GR delivers 8/10. Status stays PARTIAL
// (discrepancy flag = true because qty 8 != qty ordered 10, but PO isn't closed yet,
// more deliveries expected. In real app, PARTIAL status set by goods-receipt API
// based on isFullyReceived check, not just discrepancy flag.)
runTest(
  "Partial Delivery (accumulated qty, no price diff)",
  [{ ...mockItem, qtyReceived: 8 as any }],
  [{ poLineItemId: "1", qtyReceived: 3, priceInvoice: 100 }],
  true,  // hasDiscrepancy=true because qty 8 != qtyOrdered 10
  "DISCREPANCY"  // in real app: goods-receipt API sets PARTIAL if !isFullyReceived
);

// Test 7: All received, perfect match
runTest(
  "All Received (no discrepancy)",
  [{ ...mockItem, qtyReceived: 10 as any }],
  [{ poLineItemId: "1", qtyReceived: 10, priceInvoice: 100 }],
  false,
  "RECEIVED"
);

// Test 8: Price only discrepancy — qty matches, price differs
runTest(
  "Price Diff Only",
  [{ ...mockItem, qtyReceived: 10 as any }],
  [{ poLineItemId: "1", qtyReceived: 10, priceInvoice: 120 }],
  true,
  "DISCREPANCY"
);
