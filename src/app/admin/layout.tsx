import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Film,
  Building,
  Calendar,
  Ticket,
  BarChart3,
  History,
  QrCode,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // Test 7: Customers cannot access administrator portals!
  if (!user || user.role !== "ADMIN") {
    redirect("/auth/login?returnUrl=/admin");
  }

  return (
    <div className="min-h-screen bg-[#07090E] flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-[#090D16] border-r border-slate-800 flex-shrink-0 flex flex-col justify-between p-4 md:p-6 space-y-6">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-black tracking-wider text-white">
                ADMIN<span className="text-purple-400">PORTAL</span>
              </span>
              <p className="text-[10px] text-purple-300 font-semibold">Cinema Ops Console</p>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-purple-400" />
              <span>Overview & KPIs</span>
            </Link>

            <Link
              href="/admin/movies"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <Film className="w-4 h-4 text-purple-400" />
              <span>Movie Management</span>
            </Link>

            <Link
              href="/admin/theatres"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <Building className="w-4 h-4 text-purple-400" />
              <span>Theatres & Screens</span>
            </Link>

            <Link
              href="/admin/shows"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Show Schedules</span>
            </Link>

            <Link
              href="/admin/bookings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <Ticket className="w-4 h-4 text-purple-400" />
              <span>All Bookings & Refunds</span>
            </Link>

            <Link
              href="/admin/reports"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span>Occupancy & Sales</span>
            </Link>

            <Link
              href="/admin/audit"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <History className="w-4 h-4 text-purple-400" />
              <span>System Audit Trail</span>
            </Link>

            <Link
              href="/admin/validate"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <QrCode className="w-4 h-4 text-purple-400" />
              <span>QR Ticket Scanner</span>
            </Link>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-3 text-xs">
          <div className="px-3 py-2 bg-slate-900 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Active Operator</p>
            <p className="font-bold text-white truncate">{user.name}</p>
            <p className="text-[10px] text-purple-400 capitalize">{user.role}</p>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Site</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
