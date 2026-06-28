import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { supplierId, dateOrdered, dateExpected, lineItems } = data

    // Generate PO Number
    const count = await prisma.purchaseOrder.count()
    const poNumber = `PO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        dateOrdered: new Date(dateOrdered),
        dateExpected: dateExpected ? new Date(dateExpected) : null,
        status: "SENT",
        createdBy: "admin_gudang",
        lineItems: {
          create: lineItems.map((item: { itemName: string; unit: string; qty: number | string; price: number | string }) => ({
            itemName: item.itemName,
            unit: item.unit,
            qtyOrdered: Number(item.qty),
            priceOrdered: Number(item.price),
          }))
        }
      }
    })

    return NextResponse.json(po)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to create PO" }, { status: 500 })
  }
}
