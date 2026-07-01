import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SuppliersTable } from "@/components/supplier/SuppliersTable";

export default async function SuppliersPage() {
  const session = await getServerSession(authOptions);

  const role = session?.user?.role
  if (!session || (role !== "procurement" && role !== "owner")) {
    redirect("/dashboard");
  }

  const suppliers = await prisma.supplier.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data Supplier"
        description="Daftar lengkap mitra pemasok untuk perusahaan."
        icon={<Building2 className="w-8 h-8" />}
        color="violet"
      />

      <SuppliersTable suppliers={suppliers} />
    </div>
  );
}
