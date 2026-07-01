"use client";

import { useSession, signOut } from "next-auth/react";
import { Shield, Bell, Settings, User, LogOut } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader 
        title="Pengaturan" 
        description="Konfigurasi sistem dan manajemen preferensi akun."
        icon={<Settings className="w-8 h-8" />}
        color="amber"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          <button className="flex w-full items-center gap-3 rounded-lg bg-violet-50 px-3 py-2.5 text-sm font-medium text-violet-600">
            <User className="h-4 w-4" />
            Profil Pengguna
          </button>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Bell className="h-4 w-4" />
            Notifikasi
          </button>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Shield className="h-4 w-4" />
            Keamanan
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Profile Section */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="font-semibold text-slate-900">Informasi Akun</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 pb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-sm">
                  {session?.user?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 text-lg">{session?.user?.name || "Guest"}</h3>
                  <p className="text-sm text-slate-500 capitalize">Role: {session?.user?.role || "guest"}</p>
                </div>
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input 
                  type="email" 
                  disabled
                  value={session?.user?.email || `${session?.user?.role || "user"}@perusahaan.local`}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>


          <div className="flex items-center justify-end pt-4">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Keluar (Sign Out)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
