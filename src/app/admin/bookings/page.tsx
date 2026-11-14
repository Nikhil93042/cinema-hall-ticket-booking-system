"use client";

import { useEffect, useState } from "react";
import { Ticket, Search, Filter, RefreshCw, AlertCircle, ArrowUpRight, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      let url = `/api/admin/bookings?search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load bookings");
      setBookings(data.bookings || []);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Booking Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit customer reservations, payment gateway references, cancellations, and refunds.
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#0D121F] border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by reference, customer name, email, or movie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            onClick={fetchBookings}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-purple-600/30 whitespace-nowrap"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-[#0D121F] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Movie & Showtime</th>
                <th className="py-3 px-4">Seats</th>
                <th className="py-3 px-4">Payment & Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Ticket Token</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-purple-400">
                    {b.bookingReference}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-white">{b.user.name}</p>
                    <p className="text-[10px] text-slate-400">{b.user.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-200">{b.show.movie.title}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(b.show.startTime).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[140px]">
                      {b.seats.map((s: any) => (
                        <span
                          key={s.id}
                          className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px]"
                        >
                          {s.seat.row}{s.seat.number}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-emerald-400">₹{b.totalAmount}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {b.payment?.paymentMethod || "CARD"} ({b.payment?.status || "SUCCESS"})
                    </p>
                  </td>
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
                    {b.cancellation && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Refund: ₹{b.cancellation.refundAmount}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {b.ticket?.ticketCode || "-"}
                    {b.ticket?.isValidated && (
                      <span className="block text-[9px] text-amber-400 font-bold">Scanned</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {b.ticket && (
                      <Link
                        href={`/tickets/${b.bookingReference}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 hover:underline"
                      >
                        <span>Ticket</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    )}
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
