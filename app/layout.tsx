import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";

const outfit = Outfit({ subsets: ["latin"] });

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
    <html lang="id" suppressHydrationWarning>
      <body className={`${outfit.className} bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
