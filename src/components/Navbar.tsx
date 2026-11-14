"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Film, User as UserIcon, Shield, LogOut, Ticket, Search, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [city, setCity] = useState("Mumbai");
  const [searchQuery, setSearchQuery] = useState("");

  const checkUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user);
    } catch (e) {
      setUser(null);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#090D16]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-200 to-purple-400 bg-clip-text text-transparent">
              CINE<span className="text-purple-500">LUXE</span>
            </span>
            <span className="hidden sm:block text-[9px] uppercase tracking-widest text-slate-400 -mt-1 font-semibold">
              Cinema Booking
            </span>
          </div>
        </Link>

        {/* Search bar & City Selector */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-lg mx-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search movies, genres, cast..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-full py-1.5 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </form>

          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="Mumbai" className="bg-slate-900">Mumbai</option>
              <option value="Bengaluru" className="bg-slate-900">Bengaluru</option>
              <option value="New Delhi" className="bg-slate-900">New Delhi</option>
            </select>
          </div>
        </div>

        {/* Right Nav & User Actions */}
        <div className="flex items-center gap-3">
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 bg-purple-950/60 border border-purple-500/50 text-purple-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-900/60 transition-all shadow-sm shadow-purple-900/20"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Portal</span>
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-slate-300 hover:text-white text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                <Ticket className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">My Bookings</span>
              </Link>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-200 truncate max-w-[100px]">{user.name}</p>
                  <p className="text-[10px] text-purple-400 font-medium capitalize">{user.role.toLowerCase()}</p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="text-xs font-semibold text-slate-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-md shadow-purple-600/30 transition-all hover:scale-[1.02]"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
