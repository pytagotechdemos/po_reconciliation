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
      <div className="flex min-h-screen bg-slate-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] overflow-hidden">
        <div className="fixed inset-0 z-[-1] h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>
        <Sidebar />
        <div className="md:ml-60 flex flex-1 flex-col relative z-0 w-full transition-all duration-300 ease-in-out">
          <TopBar />
          <main className="flex-1 p-4 md:p-8 w-full max-w-full overflow-x-hidden">
            <div className="mx-auto max-w-[1280px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
