import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let discrepancyCount = 0
  try {
    discrepancyCount = await prisma.alert.count({
      where: { resolution: null }
    })
  } catch {
    // DB temporarily unavailable — sidebar shows 0, recoverable
  }

  return (
    <SidebarProvider discrepancyCount={discrepancyCount}>
      <div className="flex min-h-screen bg-slate-50 overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col w-full transition-all duration-300 lg:pl-64">
          <TopBar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
            <div className="mx-auto max-w-[1400px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
