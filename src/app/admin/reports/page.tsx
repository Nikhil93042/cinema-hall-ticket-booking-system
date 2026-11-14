"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Users, Calendar, AlertCircle, RefreshCw, Film, Building } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function AdminReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/reports");
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load reports");
      setData(json);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-sm font-semibold">Generating occupancy & financial reports...</p>
        </div>
      </div>
    );
  }

  const { summary, movieOccupancy, theatreOccupancy } = data || {};

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Occupancy & Financial Reports
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Periodic sales breakdown, theatre utilization percentages, and refund audit summaries.
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Reports</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Periodic Sales Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-4 space-y-1">
          <p className="text-[11px] font-bold uppercase text-slate-400">Daily Sales (24h)</p>
          <p className="text-2xl font-black text-white">₹{summary?.dailySales?.toLocaleString() || 0}</p>
          <p className="text-[10px] text-purple-400 font-medium">Last 24 hours</p>
        </div>
        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-4 space-y-1">
          <p className="text-[11px] font-bold uppercase text-slate-400">Weekly Sales (7d)</p>
          <p className="text-2xl font-black text-white">₹{summary?.weeklySales?.toLocaleString() || 0}</p>
          <p className="text-[10px] text-purple-400 font-medium">Last 7 days</p>
        </div>
        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-4 space-y-1">
          <p className="text-[11px] font-bold uppercase text-slate-400">Monthly Sales (30d)</p>
          <p className="text-2xl font-black text-purple-300">₹{summary?.monthlySales?.toLocaleString() || 0}</p>
          <p className="text-[10px] text-emerald-400 font-medium">Gross volume</p>
        </div>
        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-4 space-y-1">
          <p className="text-[11px] font-bold uppercase text-slate-400">Cancellation Rate</p>
          <p className="text-2xl font-black text-rose-400">{summary?.cancellationRate || 0}%</p>
          <p className="text-[10px] text-slate-500">Refunds: ₹{summary?.totalRefundedAmount || 0}</p>
        </div>
      </div>

      {/* Chart: Theatre-wise Occupancy */}
      <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-400" />
              <span>Theatre Venue Occupancy Comparison</span>
            </h2>
            <p className="text-xs text-slate-400">Auditorium seat utilization rate (%) by cinema hall</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={theatreOccupancy}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickFormatter={(val) => val.split(" ")[0]} />
              <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `${val}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#090D16", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }}
                formatter={(val: any) => [`${val}%`, "Occupancy Rate"]}
              />
              <Bar dataKey="occupancy" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Movie-wise Occupancy Table */}
      <div className="bg-[#0D121F] border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-3 p-6">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Film className="w-4 h-4 text-purple-400" />
            <span>Movie-wise Occupancy & Box Office Performance</span>
          </h2>
          <p className="text-xs text-slate-400">Detailed seat capacity versus actual ticket sales</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Movie Title</th>
                <th className="py-3 px-4">Shows Scheduled</th>
                <th className="py-3 px-4">Total Seat Capacity</th>
                <th className="py-3 px-4">Booked Tickets</th>
                <th className="py-3 px-4">Occupancy</th>
                <th className="py-3 px-4 text-right">Gross Box Office</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {movieOccupancy?.map((m: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{m.title}</td>
                  <td className="py-3 px-4">{m.shows}</td>
                  <td className="py-3 px-4">{m.capacity}</td>
                  <td className="py-3 px-4 font-semibold text-purple-300">{m.booked}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-500 h-full rounded-full"
                          style={{ width: `${m.occupancy}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-200">{m.occupancy}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-400">
                    ₹{m.revenue?.toLocaleString()}
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
