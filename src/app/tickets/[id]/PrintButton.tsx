"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all hover:scale-105"
    >
      <Printer className="w-4 h-4 text-purple-400" />
      <span>Print / Download Ticket</span>
    </button>
  );
}
