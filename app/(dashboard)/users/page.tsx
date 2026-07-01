import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Users } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { UsersTable } from "@/components/users/UsersTable"

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== "owner") {
    redirect("/dashboard")
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen User"
        description="Kelola akun, role, dan akses pengguna dalam sistem."
        icon={<Users className="w-8 h-8" />}
        color="violet"
      />
      <UsersTable initialUsers={users} />
    </div>
  )
}
