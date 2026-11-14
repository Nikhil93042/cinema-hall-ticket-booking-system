"use client";

import { useEffect, useState } from "react";
import { History, Shield, RefreshCw, AlertCircle, Clock, User } from "lucide-react";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/audit");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load audit logs");
      setLogs(data.logs || []);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes("CANCEL")) return "bg-rose-950/60 text-rose-300 border-rose-500/30";
    if (action.includes("VALIDATED")) return "bg-emerald-950/60 text-emerald-300 border-emerald-500/30";
    if (action.includes("SCHEDULE")) return "bg-indigo-950/60 text-indigo-300 border-indigo-500/30";
    if (action.includes("BOOKING")) return "bg-purple-950/60 text-purple-300 border-purple-500/30";
    return "bg-slate-900 text-slate-300 border-slate-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">System Audit Trail</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of business actions, screening schedules, cancellations, and ticket validations.
          </p>
        </div>
        <button
          onClick={fetchAuditLogs}
          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-[#0D121F] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Operator / User</th>
                <th className="py-3 px-4">Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-300">{log.entityType}</td>
                  <td className="py-3 px-4">
                    {log.user ? (
                      <div>
                        <p className="font-semibold text-white">{log.user.name}</p>
                        <p className="text-[10px] text-purple-400">{log.user.role}</p>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">System / Gate Usher</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400 max-w-md truncate">
                    {log.details || "-"}
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
