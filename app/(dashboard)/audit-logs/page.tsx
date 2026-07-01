import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { History } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { AuditLogsTable } from "@/components/audit-logs/AuditLogsTable"

const PAGE_SIZE = 20

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams?: { q?: string; page?: string; action?: string; entity?: string; from?: string; to?: string }
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || (session.user.role !== "owner" && session.user.role !== "finance")) {
    redirect("/dashboard");
  }

  const query = searchParams?.q || ""
  const currentPage = Number(searchParams?.page) || 1
  const actionFilter = searchParams?.action || ""
  const entityFilter = searchParams?.entity || ""
  const dateFrom = searchParams?.from || ""
  const dateTo = searchParams?.to || ""

  const where: Record<string, unknown> = {};

  if (query) {
    where.OR = [
      { user: { name: { contains: query, mode: "insensitive" as const } } },
      { action: { contains: query, mode: "insensitive" as const } },
      { entityType: { contains: query, mode: "insensitive" as const } },
      { details: { contains: query, mode: "insensitive" as const } },
    ];
  }

  if (actionFilter) {
    where.action = actionFilter;
  }

  if (entityFilter) {
    where.entityType = entityFilter;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo + "T23:59:59");
  }

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail"
        description="Riwayat aktivitas dan perubahan yang terjadi di dalam sistem."
        icon={<History className="w-8 h-8" />}
        color="amber"
        actions={
          <div className="bg-rose-50 text-rose-700 px-4 py-2 rounded-lg flex items-center gap-2 border border-rose-100">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-medium text-sm">Strict Monitoring Active</span>
          </div>
        }
      />

      <AuditLogsTable
        initialLogs={logs}
        totalCount={totalCount}
        initialSearch={query}
        initialAction={actionFilter}
        initialEntity={entityFilter}
        initialFrom={dateFrom}
        initialTo={dateTo}
      />
    </div>
  );
}
