import Link from "next/link";
import { Film, ShieldCheck, CreditCard, Sparkles, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#05070B] border-t border-slate-900 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white">
                <Film className="w-4 h-4" />
              </div>
              <span className="text-lg font-black tracking-wider text-white">
                CINE<span className="text-purple-500">LUXE</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Commercial-grade Cinema Hall Ticket Booking System with real-time seat locks, QR ticket generation, and analytics.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-purple-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ALGIONS AI LABS Full-Stack Assessment</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-purple-400 transition-colors">Now Showing</Link></li>
              <li><Link href="/?category=trending" className="hover:text-purple-400 transition-colors">Trending Movies</Link></li>
              <li><Link href="/dashboard" className="hover:text-purple-400 transition-colors">My Bookings</Link></li>
              <li><Link href="/admin" className="hover:text-purple-400 transition-colors">Admin Dashboard</Link></li>
            </ul>
          </div>

          {/* Theatres & Experience */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Cinema Experiences</h4>
            <ul className="space-y-2">
              <li><span className="hover:text-slate-300">IMAX 3D Laser Audio</span></li>
              <li><span className="hover:text-slate-300">4DX Dynamic Motion</span></li>
              <li><span className="hover:text-slate-300">Dolby Atmos 7.1 Surround</span></li>
              <li><span className="hover:text-slate-300">VIP Luxury Recliners</span></li>
            </ul>
          </div>

          {/* Security & Verification */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold mb-3 text-sm">Reliability & Security</h4>
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ACID-Compliant Seat Locking</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span>Idempotent Simulated Payments</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Zero-double-booking guarantee enforced by relational database transactions and unique constraints.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} CINELUXE Entertainment Systems. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with Next.js, Prisma, PostgreSQL & Tailwind for <span className="text-purple-400 font-medium">ALGIONS AI LABS</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
