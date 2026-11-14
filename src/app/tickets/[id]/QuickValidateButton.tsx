"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  ticketCode: string;
  isValidated: boolean;
  validatedAt?: Date | null;
  validatedBy?: string | null;
}

export default function QuickValidateButton({
  ticketCode,
  isValidated: initialValidated,
  validatedAt: initialValAt,
  validatedBy: initialValBy,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isValidated, setIsValidated] = useState(initialValidated);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleValidate = async () => {
    try {
      setLoading(true);
      setMessage(null);
      setIsError(false);

      const res = await fetch("/api/tickets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketCode, usherName: "Gate Usher (Demo Scanner)" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsError(true);
        setMessage(data.message || "Ticket validation failed.");
      } else {
        setIsValidated(true);
        setMessage("Ticket successfully validated! Entry authorized.");
        router.refresh();
      }
    } catch (e: any) {
      setIsError(true);
      setMessage(e.message || "Failed to validate ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 text-left">
      {message && (
        <div
          className={`p-2.5 rounded-xl text-[11px] leading-tight border ${
            isError
              ? "bg-rose-950/60 border-rose-500/50 text-rose-300"
              : "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
          }`}
        >
          {message}
        </div>
      )}

      {isValidated ? (
        <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-[11px] text-center">
          <p className="font-bold flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Already Checked-in</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Duplicate scan attempt will be rejected by gate control.
          </p>
          <button
            onClick={handleValidate}
            disabled={loading}
            className="mt-2 text-[10px] font-semibold text-rose-400 hover:underline"
          >
            Test Duplicate Scan (Expected 409 Conflict)
          </button>
        </div>
      ) : (
        <button
          onClick={handleValidate}
          disabled={loading}
          className="w-full bg-purple-600/30 hover:bg-purple-600 border border-purple-500/50 text-purple-200 hover:text-white py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
          )}
          <span>Simulate Gate Entry Scan</span>
        </button>
      )}
    </div>
  );
}
