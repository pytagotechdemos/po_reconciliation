import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ItemsTable } from "@/components/items/ItemsTable";

export default async function ItemsPage() {
  const session = await getServerSession(authOptions);

  const role = session?.user?.role
  if (!session || (role !== "procurement" && role !== "owner")) {
    redirect("/dashboard");
  }

  const items = await prisma.item.findMany({
    orderBy: { createdAt: "desc" }
  });

  const serializedItems = items.map(item => ({
    ...item,
    buyPrice: item.buyPrice.toString(),
    sellPrice: item.sellPrice ? item.sellPrice.toString() : null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data Barang"
        description="Kelola daftar barang, SKU, dan harga standar."
        icon={<Package className="w-8 h-8" />}
        color="emerald"
      />

      <ItemsTable items={serializedItems} />
    </div>
  );
}
