"use client";

import { useState } from "react";
import { QrCode, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Ticket, ShieldCheck, Film } from "lucide-react";

export default function AdminValidateTicketPage() {
  const [ticketInput, setTicketInput] = useState("");
  const [usherName, setUsherName] = useState("Chief Gate Usher");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketInput.trim()) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setResult(null);

      const res = await fetch("/api/tickets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketCode: ticketInput.trim(),
          usherName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to validate ticket");
      }

      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <QrCode className="w-6 h-6 text-purple-400" />
          <span>Ticket QR Scanner & Entry Validator</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Cinema admission gateway terminal. Enforces single-use admission security (Test 5 requirement).
        </p>
      </div>

      {/* Terminal Form */}
      <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <form onSubmit={handleValidate} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Ticket Code or Booking Reference (or paste QR JSON payload)
            </label>
            <input
              type="text"
              required
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              placeholder="e.g. TKT-2026-00124 or CINE-2026-X9A7K2"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Validating Staff / Usher Name
            </label>
            <input
              type="text"
              value={usherName}
              onChange={(e) => setUsherName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !ticketInput.trim()}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Scan & Validate Ticket Admission</span>
          </button>
        </form>

        {/* Quick Test Demo Values */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2">
          <p className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
            Quick Test Buttons (Test 5 Acceptance Criteria):
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTicketInput("TKT-2026-00124")}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-purple-500 rounded-lg text-[11px] text-slate-300 font-mono transition-colors"
            >
              TKT-2026-00124 (Unused Ticket)
            </button>
            <button
              type="button"
              onClick={() => setTicketInput("TKT-2026-00125")}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-amber-500 rounded-lg text-[11px] text-amber-300 font-mono transition-colors"
            >
              TKT-2026-00125 (Already Validated)
            </button>
            <button
              type="button"
              onClick={() => setTicketInput("CINE-2026-CAN991")}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-rose-500 rounded-lg text-[11px] text-rose-300 font-mono transition-colors"
            >
              CINE-2026-CAN991 (Cancelled)
            </button>
          </div>
        </div>

        {/* Validation Result Cards */}
        {result && (
          <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-300">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold text-white">{result.message}</h3>
                <p className="text-[11px] text-emerald-300 font-mono">
                  Validated at {new Date(result.ticket.validatedAt).toLocaleTimeString()} by {result.ticket.validatedBy}
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1 text-slate-300">
              <p>
                <span className="text-slate-400">Movie:</span>{" "}
                <span className="font-bold text-white">{result.booking?.show?.movie?.title}</span>
              </p>
              <p>
                <span className="text-slate-400">Auditorium:</span>{" "}
                {result.booking?.show?.screen?.theatre?.name} • {result.booking?.show?.screen?.name}
              </p>
              <p>
                <span className="text-slate-400">Customer:</span> {result.booking?.user?.name}
              </p>
              <p>
                <span className="text-slate-400">Seats:</span>{" "}
                <span className="font-bold text-purple-300">
                  {result.booking?.seats?.map((s: any) => `${s.seat.row}${s.seat.number}`).join(", ")}
                </span>
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/50 space-y-2">
            <div className="flex items-center gap-2.5 text-rose-300">
              <XCircle className="w-6 h-6 text-rose-400 flex-shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white">Admission Denied</h3>
                <p className="text-xs text-rose-200 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
