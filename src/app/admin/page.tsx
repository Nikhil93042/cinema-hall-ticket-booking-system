"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Film,
  Building,
  Calendar,
  Ticket,
  TrendingUp,
  Users,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/analytics");
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load admin analytics");
      setData(json);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-sm font-semibold">Aggregating real-time cinema metrics...</p>
        </div>
      </div>
    );
  }

  const { stats, salesTrend, popularMovies, recentBookings } = data || {};

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Dashboard Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time box office performance, occupancy tracking, and ticket admissions.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold self-start transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-4 flex items-center gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Revenue */}
        <div className="bg-[#0D121F] border border-purple-900/40 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Sales</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-purple-300">
            ₹{stats?.totalRevenue?.toLocaleString() || 0}
          </p>
          <p className="text-[10px] text-emerald-400 font-semibold">Net Confirmed</p>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Occupancy</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {stats?.occupancyRate || 0}%
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Across all auditoriums</p>
        </div>

        {/* Total Bookings */}
        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Bookings</span>
            <Ticket className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {stats?.totalBookings || 0}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Orders processed</p>
        </div>

        {/* Total Movies */}
        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Movies</span>
            <Film className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {stats?.totalMovies || 0}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">In catalogue</p>
        </div>

        {/* Total Theatres */}
        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Theatres</span>
            <Building className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {stats?.totalTheatres || 0}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Cinema venues</p>
        </div>

        {/* Total Shows */}
        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Scheduled Shows</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {stats?.totalShows || 0}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Show slots</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Area Chart */}
        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Sales Revenue Trend
              </h2>
              <p className="text-xs text-slate-400">Daily gross revenue over the last 7 days</p>
            </div>
            <span className="text-xs font-bold text-purple-400">₹ INR</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#090D16", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }}
                  formatter={(val: any) => [`₹${val}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#A855F7" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Movies Bar Chart */}
        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Top Performing Movies
              </h2>
              <p className="text-xs text-slate-400">Revenue contribution by top title</p>
            </div>
            <span className="text-xs font-bold text-purple-400">Top 5</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularMovies} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis type="number" stroke="#64748B" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                <YAxis dataKey="title" type="category" stroke="#64748B" fontSize={10} width={100} tickFormatter={(val) => val.length > 14 ? val.slice(0, 14) + "..." : val} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#090D16", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }}
                  formatter={(val: any) => [`₹${val}`, "Box Office"]}
                />
                <Bar dataKey="revenue" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-[#0D121F] border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Customer Transactions
            </h2>
            <p className="text-xs text-slate-400">Live feed of confirmed cinema reservations</p>
          </div>
          <Link
            href="/admin/bookings"
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            <span>View All Bookings</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Movie & Screen</th>
                <th className="py-3 px-4">Showtime</th>
                <th className="py-3 px-4">Seats</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentBookings?.map((b: any) => (
                <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-purple-400">
                    {b.bookingReference}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-white">{b.user.name}</p>
                    <p className="text-[10px] text-slate-500">{b.user.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-200">{b.show.movie.title}</p>
                    <p className="text-[10px] text-slate-400">{b.show.screen.theatre.name}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {new Date(b.show.startTime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-4 font-bold text-white">{b.seats.length}</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">₹{b.totalAmount}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === "CONFIRMED"
                          ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-950/60 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
