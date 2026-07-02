import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { Badge } from "@/components/ui/Badge"

export const dynamic = "force-dynamic"

export default async function GoodsReceiptsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session?.user?.role !== "warehouse" && session?.user?.role !== "owner" && session?.user?.role !== "finance") {
    redirect("/dashboard")
  }

  const receipts = await prisma.goodsReceipt.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      po: {
        select: { poNumber: true, supplier: { select: { name: true } } }
      }
    }
  })

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Goods Receipts Log</h1>
        <p className="text-slate-500 mt-1">Riwayat penerimaan barang dari seluruh Purchase Order</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Tgl Terima</th>
                <th className="px-6 py-4">No. PO</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Penerima</th>
                <th className="px-6 py-4">No. Surat Jalan</th>
                <th className="px-6 py-4">Foto</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Belum ada riwayat penerimaan barang.
                  </td>
                </tr>
              ) : (
                receipts.map((gr) => (
                  <tr key={gr.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                      {format(new Date(gr.receiptDate), "dd MMM yyyy HH:mm")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                      {gr.po.poNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {gr.po.supplier.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary" className="font-normal">{gr.receivedBy}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {gr.deliveryNoteNumber || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {gr.photoUrl ? (
                        <a href={gr.photoUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs font-medium inline-flex items-center">
                          Lihat Foto
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {/* Only Warehouse can void receipts (or owner/finance depending on policy, let's keep it simple for now) */}
                      <VoidReceiptButton receiptId={gr.id} role={session?.user?.role || ""} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Inline client component for the Void button
import { VoidReceiptButton } from "./VoidReceiptButton"
