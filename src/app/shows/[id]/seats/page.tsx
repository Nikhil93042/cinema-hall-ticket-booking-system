"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Clock, ShieldCheck, Ticket, AlertCircle, Sparkles, Check, RefreshCw } from "lucide-react";

interface SeatItem {
  id: string;
  row: string;
  number: number;
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  price: number;
  status: "AVAILABLE" | "HELD" | "BOOKED";
  heldByCurrentUser?: boolean;
}

export default function SeatSelectionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const showId = params.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showData, setShowData] = useState<any>(null);
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeHoldToken, setActiveHoldToken] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Fetch show details and live seats
  const fetchSeats = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/shows/${showId}/seats`, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load seats");
      }

      setShowData(data.show);
      setSeats(data.seats);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load seat layout");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeats();
    // Auto-refresh seat availability every 15 seconds to sync with other users
    const interval = setInterval(fetchSeats, 15000);
    return () => clearInterval(interval);
  }, [showId]);

  // Hold expiry countdown timer
  useEffect(() => {
    if (!holdExpiresAt) {
      setTimeLeft(null);
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = holdExpiresAt.getTime() - now;
      if (distance <= 0) {
        setTimeLeft(0);
        clearInterval(timer);
        setActiveHoldToken(null);
        setHoldExpiresAt(null);
        setErrorMsg("Your temporary seat reservation has expired. Please select seats again.");
        fetchSeats();
      } else {
        setTimeLeft(Math.floor(distance / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [holdExpiresAt]);

  const toggleSeatSelection = (seat: SeatItem) => {
    if (seat.status === "BOOKED" || (seat.status === "HELD" && !seat.heldByCurrentUser)) {
      return;
    }

    setErrorMsg(null);
    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
    } else {
      if (selectedSeatIds.length >= 8) {
        setErrorMsg("You can select a maximum of 8 seats per booking transaction.");
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seat.id]);
    }
  };

  // Group seats by category and row
  const premiumSeats = seats.filter((s) => s.categoryCode === "PREMIUM");
  const goldSeats = seats.filter((s) => s.categoryCode === "GOLD");
  const silverSeats = seats.filter((s) => s.categoryCode === "SILVER");

  const groupSeatsByRow = (seatList: SeatItem[]) => {
    const rowsMap = new Map<string, SeatItem[]>();
    for (const seat of seatList) {
      if (!rowsMap.has(seat.row)) {
        rowsMap.set(seat.row, []);
      }
      rowsMap.get(seat.row)!.push(seat);
    }
    return Array.from(rowsMap.entries());
  };

  // Calculate pricing for selected seats
  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
  const subtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = Math.round(subtotal * 0.08);
  const tax = Math.round((subtotal + convenienceFee) * 0.05);
  const totalAmount = subtotal + convenienceFee + tax;

  // Handle Hold creation and proceed to checkout
  const handleProceedToHold = async () => {
    if (selectedSeatIds.length === 0) {
      setErrorMsg("Please select at least one seat.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await fetch(`/api/shows/${showId}/hold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatIds: selectedSeatIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          // Redirect to login with return URL
          router.push(`/auth/login?returnUrl=/shows/${showId}/seats`);
          return;
        }
        throw new Error(data.message || "Failed to reserve seats");
      }

      setActiveHoldToken(data.holdToken);
      setHoldExpiresAt(new Date(data.expiresAt));

      // Redirect to checkout with holdToken
      router.push(`/checkout?holdToken=${data.holdToken}&showId=${showId}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Seat hold failed. Another customer may have just reserved this seat.");
      fetchSeats(); // Refresh immediately
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (loading && !showData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-sm font-semibold">Loading real-time cinema seating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Top Header */}
      <div className="bg-[#090D16] border-b border-slate-800 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={showData ? `/movies/${showData.movieId}` : "/"}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>{showData?.movie?.title}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-900/60 border border-purple-500/30 text-purple-300">
                  {showData?.screen?.format}
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {showData?.screen?.theatre?.name} • {showData?.screen?.name} •{" "}
                {showData?.startTime &&
                  new Date(showData.startTime).toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {timeLeft !== null && (
              <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                <span>Locked for {formatTimer(timeLeft)}</span>
              </div>
            )}
            <button
              onClick={fetchSeats}
              title="Refresh seat availability"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Seat Map Layout (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Error Banner */}
          {errorMsg && (
            <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-3.5 flex items-center gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Seat Status Legend */}
          <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-around gap-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md border border-slate-600 bg-slate-900/60" />
              <span className="text-slate-300">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-purple-600 border border-purple-400 shadow-md shadow-purple-600/50" />
              <span className="text-purple-300 font-semibold">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-amber-600/30 border border-amber-500/50 flex items-center justify-center text-[10px] text-amber-300">
                🔒
              </div>
              <span className="text-amber-400">Temporarily Held</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-500 flex items-center justify-center text-[10px]">
                ✕
              </div>
              <span className="text-slate-500">Booked</span>
            </div>
          </div>

          {/* Cinema Screen Visual Indicator */}
          <div className="space-y-2 py-4">
            <div className="relative w-full max-w-lg mx-auto h-8 flex items-center justify-center">
              <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-t-full shadow-lg shadow-purple-500/50" />
              <div className="w-full h-12 cinema-screen-glow rounded-b-[100px] opacity-30 pointer-events-none" />
              <span className="relative z-10 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                All Eyes This Way • Cinema Screen
              </span>
            </div>
          </div>

          {/* Seating Tiers */}
          <div className="space-y-8 bg-[#0D121F] border border-slate-800/80 rounded-2xl p-6 sm:p-8">
            {/* VIP Premium Recliner Tier */}
            {premiumSeats.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-pink-400 tracking-wider">
                      Premium Recliners
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">VIP Luxury</span>
                  </div>
                  <span className="text-xs font-bold text-slate-200">
                    ₹{showData?.premiumPrice || 500}
                  </span>
                </div>

                <div className="space-y-3 py-2">
                  {groupSeatsByRow(premiumSeats).map(([rowLabel, rowSeatList]) => (
                    <div key={rowLabel} className="flex items-center justify-center gap-2">
                      <span className="w-6 text-xs font-bold text-slate-500 text-center">{rowLabel}</span>
                      <div className="flex flex-wrap items-center justify-center gap-2.5">
                        {rowSeatList.map((seat) => {
                          const isSelected = selectedSeatIds.includes(seat.id);
                          const isBooked = seat.status === "BOOKED";
                          const isHeld = seat.status === "HELD" && !seat.heldByCurrentUser;

                          return (
                            <button
                              key={seat.id}
                              onClick={() => toggleSeatSelection(seat)}
                              disabled={isBooked || isHeld}
                              title={`Row ${seat.row} Seat ${seat.number} • ₹${seat.price}`}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                                isSelected
                                  ? "bg-purple-600 text-white border-2 border-purple-300 shadow-lg shadow-purple-600/50 scale-110"
                                  : isBooked
                                  ? "bg-slate-800 text-slate-600 border border-slate-700/50 cursor-not-allowed line-through"
                                  : isHeld
                                  ? "bg-amber-950/40 text-amber-400 border border-amber-500/50 cursor-not-allowed animate-pulse"
                                  : "bg-slate-900 border-2 border-pink-500/50 text-slate-200 hover:border-pink-400 hover:bg-pink-950/30 hover:scale-105"
                              }`}
                            >
                              {isHeld ? "🔒" : isBooked ? "✕" : seat.number}
                            </button>
                          );
                        })}
                      </div>
                      <span className="w-6 text-xs font-bold text-slate-500 text-center">{rowLabel}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gold Tier */}
            {goldSeats.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                      Gold Executive
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Prime View</span>
                  </div>
                  <span className="text-xs font-bold text-slate-200">
                    ₹{showData?.goldPrice || 350}
                  </span>
                </div>

                <div className="space-y-3 py-2">
                  {groupSeatsByRow(goldSeats).map(([rowLabel, rowSeatList]) => (
                    <div key={rowLabel} className="flex items-center justify-center gap-2">
                      <span className="w-6 text-xs font-bold text-slate-500 text-center">{rowLabel}</span>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {rowSeatList.map((seat) => {
                          const isSelected = selectedSeatIds.includes(seat.id);
                          const isBooked = seat.status === "BOOKED";
                          const isHeld = seat.status === "HELD" && !seat.heldByCurrentUser;

                          return (
                            <button
                              key={seat.id}
                              onClick={() => toggleSeatSelection(seat)}
                              disabled={isBooked || isHeld}
                              title={`Row ${seat.row} Seat ${seat.number} • ₹${seat.price}`}
                              className={`w-7 h-7 rounded-md text-xs font-semibold transition-all flex items-center justify-center ${
                                isSelected
                                  ? "bg-purple-600 text-white border-2 border-purple-300 shadow-md shadow-purple-600/50 scale-110"
                                  : isBooked
                                  ? "bg-slate-800 text-slate-600 border border-slate-700/50 cursor-not-allowed line-through"
                                  : isHeld
                                  ? "bg-amber-950/40 text-amber-400 border border-amber-500/50 cursor-not-allowed"
                                  : "bg-slate-900 border border-amber-500/40 text-slate-200 hover:border-amber-400 hover:bg-amber-950/20 hover:scale-105"
                              }`}
                            >
                              {isHeld ? "🔒" : isBooked ? "✕" : seat.number}
                            </button>
                          );
                        })}
                      </div>
                      <span className="w-6 text-xs font-bold text-slate-500 text-center">{rowLabel}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Silver Tier */}
            {silverSeats.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                      Silver Standard
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-200">
                    ₹{showData?.silverPrice || 200}
                  </span>
                </div>

                <div className="space-y-3 py-2">
                  {groupSeatsByRow(silverSeats).map(([rowLabel, rowSeatList]) => (
                    <div key={rowLabel} className="flex items-center justify-center gap-2">
                      <span className="w-6 text-xs font-bold text-slate-500 text-center">{rowLabel}</span>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {rowSeatList.map((seat) => {
                          const isSelected = selectedSeatIds.includes(seat.id);
                          const isBooked = seat.status === "BOOKED";
                          const isHeld = seat.status === "HELD" && !seat.heldByCurrentUser;

                          return (
                            <button
                              key={seat.id}
                              onClick={() => toggleSeatSelection(seat)}
                              disabled={isBooked || isHeld}
                              title={`Row ${seat.row} Seat ${seat.number} • ₹${seat.price}`}
                              className={`w-7 h-7 rounded-md text-xs font-semibold transition-all flex items-center justify-center ${
                                isSelected
                                  ? "bg-purple-600 text-white border-2 border-purple-300 shadow-md shadow-purple-600/50 scale-110"
                                  : isBooked
                                  ? "bg-slate-800 text-slate-600 border border-slate-700/50 cursor-not-allowed line-through"
                                  : isHeld
                                  ? "bg-amber-950/40 text-amber-400 border border-amber-500/50 cursor-not-allowed"
                                  : "bg-slate-900 border border-slate-700 text-slate-300 hover:border-purple-400 hover:bg-slate-800 hover:scale-105"
                              }`}
                            >
                              {isHeld ? "🔒" : isBooked ? "✕" : seat.number}
                            </button>
                          );
                        })}
                      </div>
                      <span className="w-6 text-xs font-bold text-slate-500 text-center">{rowLabel}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary & Hold Lock Card */}
        <div className="space-y-6">
          <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-6 space-y-6 sticky top-36 shadow-xl">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Ticket className="w-4 h-4 text-purple-400" />
                <span>Booking Summary</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Seats will be held for 5 minutes during checkout to ensure no double bookings.
              </p>
            </div>

            {/* Selected Seats List */}
            <div className="space-y-3 pb-4 border-b border-slate-800">
              <div className="text-xs font-semibold text-slate-400">
                Selected Seats ({selectedSeats.length})
              </div>
              {selectedSeats.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No seats selected yet. Click any available seat on the map.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((s) => (
                    <span
                      key={s.id}
                      className="px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5"
                    >
                      <span>Row {s.row}-{s.number}</span>
                      <span className="text-[10px] text-purple-400 font-normal">({s.categoryName})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Tickets Subtotal</span>
                <span className="text-slate-200 font-semibold">₹{subtotal}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Convenience Fee (8%)</span>
                <span className="text-slate-200 font-semibold">₹{convenienceFee}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Taxes & GST (5%)</span>
                <span className="text-slate-200 font-semibold">₹{tax}</span>
              </div>
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-sm font-bold text-white">
                <span>Total Amount</span>
                <span className="text-lg text-purple-400 font-black">₹{totalAmount}</span>
              </div>
            </div>

            {/* Concurrency Lock Info */}
            <div className="bg-purple-950/20 border border-purple-800/30 rounded-xl p-3 text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ACID Concurrency Guarantee</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                When you proceed, our database locks these seats in a transaction so other users cannot purchase them.
              </p>
            </div>

            {/* Proceed Button */}
            <button
              onClick={handleProceedToHold}
              disabled={selectedSeatIds.length === 0 || submitting}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Locking Seats in DB...</span>
                </>
              ) : (
                <>
                  <span>Hold & Proceed to Payment</span>
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
