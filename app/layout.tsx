import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import Providers from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PO Reconciliation Dashboard",
  description: "Detect discrepancies between POs and actual goods received.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen bg-[#F8F9FA]">
            <Sidebar />
            <div className="ml-60 flex flex-1 flex-col">
              <TopBar />
              <main className="flex-1 p-8">
                <div className="mx-auto max-w-[1280px]">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
