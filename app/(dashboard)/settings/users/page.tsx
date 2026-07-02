import { PageHeader } from "@/components/ui/PageHeader";
import { UsersTable } from "@/components/settings/UsersTable";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Users } from "lucide-react";

export const metadata = {
  title: "Manajemen Pengguna | PO Reconciliation",
};

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "owner") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize createdAt date to string
  const serializedUsers = users.map(user => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader 
        title="Manajemen Pengguna" 
        description="Kelola akun pengguna dan hak akses sistem."
        icon={<Users className="w-8 h-8" />}
        color="amber"
      />
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <UsersTable initialUsers={serializedUsers} />
      </div>
    </div>
  );
}
