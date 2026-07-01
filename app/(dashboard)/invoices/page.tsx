import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/ui/PageHeader"
import { InvoicesTable } from "@/components/invoices/InvoicesTable"
import { ReceiptText } from "lucide-react"

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || (session.user.role !== "finance" && session.user.role !== "owner")) {
    redirect("/dashboard")
  }

  const [invoices, allPOs] = await Promise.all([
    prisma.invoice.findMany({
      include: {
        po: {
          include: { supplier: true }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.purchaseOrder.findMany({
      where: { status: { in: ["READY_TO_PAY", "RECEIVED"] } },
      include: { supplier: true, lineItems: true },
      orderBy: { updatedAt: "desc" }
    }),
  ])

  const serializedInvoices = invoices.map(inv => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    amount: Number(inv.amount),
    dateReceived: inv.dateReceived,
    createdAt: inv.createdAt,
    po: {
      id: inv.po.id,
      poNumber: inv.po.poNumber,
      status: inv.po.status,
      supplier: { name: inv.po.supplier.name }
    }
  }))

  const unpaidPOs = allPOs
    .filter(po => po.status !== "PAID")
    .map(po => {
      const subtotal = po.lineItems.reduce((acc, li) => {
        const qty = Number(li.qtyReceived || 0)
        const price = Number(li.priceInvoice || li.priceOrdered || 0)
        return acc + qty * price
      }, 0)
      const amount = subtotal + Number(po.taxAmount || 0)
      return {
        id: po.id,
        poNumber: po.poNumber,
        status: po.status,
        suggestedAmount: amount,
        supplier: { name: po.supplier.name }
      }
    })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Invoice"
        description="Kelola invoice dari supplier dan lacak pembayaran."
        icon={<ReceiptText className="w-8 h-8" />}
        color="blue"
      />

      <InvoicesTable
        initialInvoices={serializedInvoices}
        unpaidPOs={unpaidPOs}
      />
    </div>
  )
}
