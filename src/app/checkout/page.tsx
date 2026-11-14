"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  Smartphone,
  Building,
  Lock,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Ticket,
  ShieldCheck,
} from "lucide-react";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const holdToken = searchParams.get("holdToken");
  const showId = searchParams.get("showId");

  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "UPI" | "NET_BANKING">("CARD");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Generate a unique idempotency key for this checkout attempt
  const idempotencyKey = useMemo(() => {
    return `idemp-${holdToken}-${typeof window !== "undefined" ? window.crypto.randomUUID() : "client"}`;
  }, [holdToken]);

  useEffect(() => {
    if (!holdToken || !showId) {
      router.push("/");
      return;
    }

    const loadDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/shows/${showId}/seats`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load show details");

        const heldSeats = data.seats.filter((s: any) => s.heldByCurrentUser);
        setBookingData({
          show: data.show,
          heldSeats,
        });
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load checkout details");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [holdToken, showId, router]);

  const handlePayment = async (status: "SUCCESS" | "FAILED" | "CANCELLED") => {
    if (!holdToken) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holdToken,
          paymentMethod,
          idempotencyKey,
          simulatePaymentStatus: status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Transaction failed");
      }

      if (status === "SUCCESS") {
        router.push(`/tickets/${data.booking.bookingReference}`);
      } else if (status === "CANCELLED") {
        router.push(showId ? `/shows/${showId}/seats` : "/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Payment simulation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-sm font-semibold">Preparing secure checkout gateway...</p>
        </div>
      </div>
    );
  }

  const show = bookingData?.show;
  const heldSeats = bookingData?.heldSeats || [];
  const subtotal = heldSeats.reduce((sum: number, s: any) => sum + s.price, 0);
  const convenienceFee = Math.round(subtotal * 0.08);
  const tax = Math.round((subtotal + convenienceFee) * 0.05);
  const totalAmount = subtotal + convenienceFee + tax;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <Lock className="w-6 h-6 text-purple-400" />
          <span>Checkout & Simulated Payment</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review your reservation and complete the payment using our simulated gateway.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-4 flex items-center gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Method & Simulator Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Choose Payment Method
            </h2>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("CARD")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === "CARD"
                    ? "bg-purple-950/60 border-purple-500 text-white shadow-md shadow-purple-900/30"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <CreditCard className="w-5 h-5 mb-2 text-purple-400" />
                <span>Credit / Debit Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === "UPI"
                    ? "bg-purple-950/60 border-purple-500 text-white shadow-md shadow-purple-900/30"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-5 h-5 mb-2 text-purple-400" />
                <span>Instant UPI</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("NET_BANKING")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === "NET_BANKING"
                    ? "bg-purple-950/60 border-purple-500 text-white shadow-md shadow-purple-900/30"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Building className="w-5 h-5 mb-2 text-purple-400" />
                <span>Net Banking</span>
              </button>
            </div>

            <div className="pt-2 space-y-3">
              {paymentMethod === "CARD" && (
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 font-medium">Card Number (Simulated)</label>
                    <input
                      type="text"
                      disabled
                      value="4532 •••• •••• 8892 (Demo Sandbox Card)"
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-300 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-medium">Expiry</label>
                      <input
                        type="text"
                        disabled
                        value="12/28"
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-medium">CVV</label>
                      <input
                        type="text"
                        disabled
                        value="•••"
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-300 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "UPI" && (
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <label className="text-slate-400 font-medium">Virtual Payment Address (VPA)</label>
                  <input
                    type="text"
                    disabled
                    value="demo.user@okhdfcbank"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-300 font-mono"
                  />
                  <p className="text-[11px] text-slate-500">Instant UPI authorization simulator active.</p>
                </div>
              )}

              {paymentMethod === "NET_BANKING" && (
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <label className="text-slate-400 font-medium">Select Preferred Bank</label>
                  <select
                    disabled
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-300"
                  >
                    <option>HDFC Bank NetBanking (Sandbox)</option>
                    <option>State Bank of India</option>
                    <option>ICICI Bank</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#0D121F] border border-purple-900/40 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Simulated Payment Gateway</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-900/50 border border-purple-500/40 text-purple-300">
                    TEST SANDBOX
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Test realistic payment success, bank decline, or cancellation workflows as required by assignment.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => handlePayment("SUCCESS")}
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Simulate Successful Payment (Pay ₹{totalAmount})</span>
              </button>

              <button
                type="button"
                onClick={() => handlePayment("FAILED")}
                disabled={submitting}
                className="w-full bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/50 text-rose-200 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Simulate Bank Decline / Transaction Failure</span>
              </button>

              <button
                type="button"
                onClick={() => handlePayment("CANCELLED")}
                disabled={submitting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white py-2 px-4 rounded-xl text-xs transition-colors"
              >
                Cancel Transaction & Release Reserved Seats
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Booking Summary */}
        <div className="space-y-6">
          <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Ticket className="w-4 h-4 text-purple-400" />
              <span>Ticket Summary</span>
            </h2>

            <div className="space-y-1 pb-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">{show?.movie?.title}</h3>
              <p className="text-xs text-slate-400">
                {show?.screen?.theatre?.name} • {show?.screen?.name}
              </p>
              <p className="text-xs text-purple-400 font-medium">
                {show?.startTime &&
                  new Date(show.startTime).toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </p>
            </div>

            <div className="space-y-2 pb-4 border-b border-slate-800">
              <div className="text-xs font-semibold text-slate-400">
                Seats ({heldSeats.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {heldSeats.map((s: any) => (
                  <span
                    key={s.id}
                    className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    Row {s.row}-{s.number}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Base Ticket Price</span>
                <span className="text-slate-200 font-medium">₹{subtotal}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Convenience Fee (8%)</span>
                <span className="text-slate-200 font-medium">₹{convenienceFee}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>GST & Service Tax (5%)</span>
                <span className="text-slate-200 font-medium">₹{tax}</span>
              </div>
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-sm font-bold text-white">
                <span>Final Payable Amount</span>
                <span className="text-lg text-purple-400 font-black">₹{totalAmount}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Idempotency-protected transaction to prevent duplicate billing.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <Suspense fallback={<div className="text-slate-400 text-center py-20 text-xs">Loading checkout...</div>}>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}
