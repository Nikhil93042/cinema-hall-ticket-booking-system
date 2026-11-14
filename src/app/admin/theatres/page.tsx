"use client";

import { useEffect, useState } from "react";
import { Building, Plus, AlertCircle, RefreshCw, X, MapPin } from "lucide-react";

export default function AdminTheatresPage() {
  const [theatres, setTheatres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [city, setCity] = useState("Mumbai");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [facilities, setFacilities] = useState("IMAX Laser, Dolby Atmos 7.1, Recliners, Food Court");

  const fetchTheatres = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/theatres");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load theatres");
      setTheatres(data.theatres || []);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, []);

  const handleCreateTheatre = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await fetch("/api/admin/theatres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city, address, phone, facilities }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create theatre");

      setShowAddModal(false);
      setName("");
      setAddress("");
      fetchTheatres();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Theatres & Screens</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure cinema venues, screen auditoriums, and interactive seat capacities.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-purple-600/30 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Theatre</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {theatres.map((t) => (
          <div
            key={t.id}
            className="bg-[#0D121F] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-400 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded">
                  {t.city}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {t.screens?.length || 0} Screens
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-white">{t.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.address}</p>
                {t.phone && <p className="text-xs text-slate-500 mt-0.5">{t.phone}</p>}
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <p className="text-[11px] text-slate-400 font-semibold mb-2">Auditorium Screens:</p>
                <div className="space-y-1.5">
                  {t.screens?.map((sc: any) => (
                    <div
                      key={sc.id}
                      className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-lg text-xs"
                    >
                      <span className="font-semibold text-slate-300">{sc.name}</span>
                      <span className="text-[11px] text-purple-300 font-mono">
                        {sc.totalSeats || 48} seats ({sc.format})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span className="font-medium text-slate-300">Amenities: </span>
              <span className="line-clamp-1">{t.facilities}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Theatre Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">Add Cinema Theatre</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTheatre} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Theatre Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cinepolis Mega Mall"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Address</label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Facilities & Amenities</label>
                <input
                  type="text"
                  value={facilities}
                  onChange={(e) => setFacilities(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Theatre</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
