"use client";

import { useEffect, useState } from "react";
import { Calendar, Plus, AlertCircle, RefreshCw, X, Clock, MapPin } from "lucide-react";

export default function AdminShowsPage() {
  const [shows, setShows] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [theatres, setTheatres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [selectedScreenId, setSelectedScreenId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [silverPrice, setSilverPrice] = useState("200");
  const [goldPrice, setGoldPrice] = useState("350");
  const [premiumPrice, setPremiumPrice] = useState("500");

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [showsRes, moviesRes, theatresRes] = await Promise.all([
        fetch("/api/admin/shows"),
        fetch("/api/admin/movies"),
        fetch("/api/admin/theatres"),
      ]);

      const [showsData, moviesData, theatresData] = await Promise.all([
        showsRes.json(),
        moviesRes.json(),
        theatresRes.json(),
      ]);

      setShows(showsData.shows || []);
      setMovies(moviesData.movies || []);
      setTheatres(theatresData.theatres || []);

      if (moviesData.movies?.length > 0) setSelectedMovieId(moviesData.movies[0].id);
      if (theatresData.theatres?.length > 0 && theatresData.theatres[0].screens?.length > 0) {
        setSelectedScreenId(theatresData.theatres[0].screens[0].id);
      }

      // Default tomorrow 18:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);
      setStartTime(tomorrow.toISOString().slice(0, 16));
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to load schedule data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScheduleShow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch("/api/admin/shows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: selectedMovieId,
          screenId: selectedScreenId,
          startTime: new Date(startTime).toISOString(),
          silverPrice: parseFloat(silverPrice),
          goldPrice: parseFloat(goldPrice),
          premiumPrice: parseFloat(premiumPrice),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to schedule showtime");
      }

      setSuccessMsg("Show scheduled successfully!");
      setShowAddModal(false);
      loadData();
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
          <h1 className="text-2xl font-black text-white tracking-tight">Showtime Scheduling</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Schedule screenings across auditoriums with overlap collision prevention.
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            setErrorMsg(null);
          }}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-purple-600/30 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Show</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Shows Table */}
      <div className="bg-[#0D121F] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Movie</th>
                <th className="py-3 px-4">Theatre & Screen</th>
                <th className="py-3 px-4">Showtime</th>
                <th className="py-3 px-4">Pricing (S / G / P)</th>
                <th className="py-3 px-4">Booked / Total</th>
                <th className="py-3 px-4">Occupancy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {shows.map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-white text-sm">{s.movie.title}</p>
                    <p className="text-[10px] text-slate-400">{s.movie.language} • {s.movie.duration}m</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-200">{s.screen.theatre.name}</p>
                    <p className="text-[10px] text-purple-400">{s.screen.name} ({s.screen.format})</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-white">
                      {new Date(s.startTime).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-[10px] text-purple-300">
                      {new Date(s.startTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                    ₹{s.silverPrice} / ₹{s.goldPrice} / ₹{s.premiumPrice}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-white">{s.bookedSeats}</span>
                    <span className="text-slate-500"> / {s.totalSeats}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-500 h-full rounded-full"
                          style={{ width: `${s.occupancy}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-300">{s.occupancy}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">Schedule Movie Showtime</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleShow} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Movie</label>
                <select
                  value={selectedMovieId}
                  onChange={(e) => setSelectedMovieId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.duration} mins) - {m.format}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Cinema Auditorium Screen</label>
                <select
                  value={selectedScreenId}
                  onChange={(e) => setSelectedScreenId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  {theatres.map((t) => (
                    <optgroup key={t.id} label={`${t.name} (${t.city})`}>
                      {t.screens?.map((sc: any) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name} - {sc.format} ({sc.totalSeats || 48} seats)
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Show Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Silver Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={silverPrice}
                    onChange={(e) => setSilverPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Gold Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={goldPrice}
                    onChange={(e) => setGoldPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">VIP Recliner (₹)</label>
                  <input
                    type="number"
                    required
                    value={premiumPrice}
                    onChange={(e) => setPremiumPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-950/20 border border-purple-800/30 rounded-xl text-[11px] text-slate-300">
                <p className="font-semibold text-purple-300">Automatic Overlap Conflict Guard</p>
                <p className="text-slate-400 mt-0.5">
                  The system will automatically calculate end time and prevent overlapping shows on this auditorium screen.
                </p>
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
                  <span>Confirm Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
