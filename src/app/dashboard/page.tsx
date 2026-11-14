"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [cancelModalBooking, setCancelModalBooking] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState("Change of plans");
  const [cancelling, setCancelling] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Check user
      const userRes = await fetch("/api/auth/me");
      const userData = await userRes.json();
      if (!userData.user) {
        router.push("/auth/login?returnUrl=/dashboard");
        return;
      }
      setUser(userData.user);

      // Fetch bookings
      const bookRes = await fetch("/api/user/bookings");
      const bookData = await bookRes.json();
      if (bookRes.ok) {
        setUpcoming(bookData.upcoming || []);
        setPast(bookData.past || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;

    try {
      setCancelling(true);
      setActionMsg(null);

      const res = await fetch(`/api/bookings/${cancelModalBooking.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionMsg({ text: data.message || "Failed to cancel booking", isError: true });
      } else {
        setActionMsg({
          text: `Booking cancelled successfully! Simulated refund of ₹${data.refund.amount} processed.`,
          isError: false,
        });
        setCancelModalBooking(null);
        fetchDashboardData(); // Refresh list
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || "Failed to cancel booking", isError: true });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-sm font-semibold">Loading your customer dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* User Profile Header */}
      <div className="bg-[#0D121F] border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-purple-600/30">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">{user?.name}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-purple-300">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
            {user?.phone && <p className="text-xs text-slate-500">{user.phone}</p>}
          </div>
        </div>

        <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-slate-800 pt-4 sm:pt-0 sm:pl-8 text-xs">
          <div>
            <p className="text-slate-400 font-medium">Upcoming Shows</p>
            <p className="text-2xl font-black text-purple-400 mt-0.5">{upcoming.length}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Total Bookings</p>
            <p className="text-2xl font-black text-white mt-0.5">{upcoming.length + past.length}</p>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 border ${
            actionMsg.isError
              ? "bg-rose-950/40 border-rose-500/50 text-rose-300"
              : "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
          }`}
        >
          {actionMsg.isError ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "upcoming"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Upcoming Bookings ({upcoming.length})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "past"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Previous & Cancelled ({past.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "upcoming" ? (
          upcoming.length === 0 ? (
            <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Ticket className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-base font-semibold text-slate-300">No upcoming movie bookings</p>
              <p className="text-xs text-slate-500 mt-1">Ready for movie night? Check out what is now showing.</p>
              <Link
                href="/"
                className="inline-block mt-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition-colors"
              >
                Browse Now Showing Movies
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancelClick={() => setCancelModalBooking(booking)}
                />
              ))}
            </div>
          )
        ) : past.length === 0 ? (
          <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <Clock className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-base font-semibold text-slate-300">No past bookings found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {past.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancelClick={() => setCancelModalBooking(booking)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Cancel Booking</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to cancel booking{" "}
              <span className="font-mono font-bold text-purple-400">
                {cancelModalBooking.bookingReference}
              </span>{" "}
              for{" "}
              <span className="font-bold text-white">
                {cancelModalBooking.show.movie.title}
              </span>
              ?
            </p>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Total Paid:</span>
                <span className="text-white font-semibold">₹{cancelModalBooking.totalAmount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cancellation Fee (10%):</span>
                <span className="text-rose-400 font-semibold">
                  -₹{Math.round(cancelModalBooking.totalAmount * 0.1)}
                </span>
              </div>
              <div className="flex justify-between text-slate-300 font-bold pt-1 border-t border-slate-800">
                <span>Estimated Refund (90%):</span>
                <span className="text-emerald-400">
                  ₹{cancelModalBooking.totalAmount - Math.round(cancelModalBooking.totalAmount * 0.1)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Reason for Cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="Change of plans">Change of plans</option>
                <option value="Booked by mistake">Booked by mistake</option>
                <option value="Work / schedule conflict">Work / schedule conflict</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/30 flex items-center gap-1.5"
              >
                {cancelling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm Cancellation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking, onCancelClick }: { booking: any; onCancelClick: () => void }) {
  const { show, seats, ticket, cancellation, payment } = booking;
  const isCancelled = booking.status === "CANCELLED";

  const showDate = new Date(show.startTime).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const showTime = new Date(show.startTime).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-[#0D121F] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 sm:p-6 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-start gap-4 flex-1">
        <img
          src={show.movie.posterUrl}
          alt={show.movie.title}
          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
        />

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
              {booking.bookingReference}
            </span>
            {isCancelled ? (
              <span className="text-[10px] font-bold text-rose-300 bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 rounded">
                CANCELLED & REFUNDED
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
                CONFIRMED
              </span>
            )}
            {ticket?.isValidated && (
              <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
                ENTRY CHECKED-IN
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-white truncate">{show.movie.title}</h3>
          <p className="text-xs text-slate-400">
            {show.screen.theatre.name} • {show.screen.name}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>{showDate}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>{showTime}</span>
            </span>
            <span>•</span>
            <span className="font-bold text-white">₹{booking.totalAmount}</span>
          </div>

          {/* Reserved Seats */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {seats.map((bs: any) => (
              <span
                key={bs.id}
                className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-300 font-medium"
              >
                Row {bs.seat.row}-{bs.seat.number}
              </span>
            ))}
          </div>

          {/* Refund Details if cancelled */}
          {cancellation && (
            <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800 mt-2">
              <span className="text-emerald-400 font-semibold">Simulated Refund: </span>
              <span>₹{cancellation.refundAmount} (Fee: ₹{cancellation.cancellationFee}) • </span>
              <span className="text-slate-300 font-mono">{cancellation.refund?.transactionReference}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
        {!isCancelled && ticket && (
          <Link
            href={`/tickets/${booking.bookingReference}`}
            className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-900/30"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>View Ticket & QR</span>
          </Link>
        )}

        {!isCancelled && (
          <button
            onClick={onCancelClick}
            className="text-xs text-rose-400 hover:text-rose-300 hover:underline px-2 py-1"
          >
            Cancel Booking
          </button>
        )}
      </div>
    </div>
  );
}
