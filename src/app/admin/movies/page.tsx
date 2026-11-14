"use client";

import { useEffect, useState } from "react";
import { Film, Plus, Edit2, Trash2, Star, Clock, AlertCircle, RefreshCw, X, Check } from "lucide-react";

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [posterUrl, setPosterUrl] = useState("https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop");
  const [bannerUrl, setBannerUrl] = useState("https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop");
  const [duration, setDuration] = useState("135");
  const [releaseDate, setReleaseDate] = useState("2026-06-15");
  const [rating, setRating] = useState("8.5");
  const [language, setLanguage] = useState("English");
  const [format, setFormat] = useState("IMAX 3D, Dolby Atmos");
  const [director, setDirector] = useState("Christopher Nolan");
  const [cast, setCast] = useState("Cillian Murphy, Emily Blunt");
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["Sci-Fi", "Action"]);
  const [isFeatured, setIsFeatured] = useState(false);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/movies");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load movies");
      setMovies(data.movies || []);
      setGenres(data.genres || []);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await fetch("/api/admin/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          posterUrl,
          bannerUrl,
          duration: parseInt(duration),
          releaseDate,
          rating: parseFloat(rating),
          language,
          format,
          director,
          cast,
          genres: selectedGenres,
          isFeatured,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create movie");

      setShowAddModal(false);
      fetchMovies();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (movieId: string) => {
    if (!confirm("Are you sure you want to deactivate this movie?")) return;
    try {
      const res = await fetch(`/api/admin/movies/${movieId}`, { method: "DELETE" });
      if (res.ok) fetchMovies();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Movie Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Create, update, and manage catalogue movies and screening formats.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-purple-600/30 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Movie</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Movies Table */}
      <div className="bg-[#0D121F] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Movie</th>
                <th className="py-3 px-4">Genres</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Shows</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {movies.map((m) => (
                <tr key={m.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={m.posterUrl}
                        alt={m.title}
                        className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                      />
                      <div>
                        <p className="font-bold text-white text-sm">{m.title}</p>
                        <p className="text-[10px] text-slate-400">{m.language} • Dir. {m.director}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] text-purple-300 font-medium">
                      {m.genreNames?.join(", ") || "-"}
                    </span>
                  </td>
                  <td className="py-3 px-4">{m.duration} mins</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1 font-bold text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{m.rating.toFixed(1)}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {m.format}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-white">{m.showsCount || 0}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.isActive
                          ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {m.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeactivate(m.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Deactivate Movie"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Movie Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-6 max-w-2xl w-full my-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">Add New Movie to Catalogue</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMovie} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Movie Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Oppenheimer"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Language</label>
                  <input
                    type="text"
                    required
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Plot summary..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Poster Image URL</label>
                  <input
                    type="url"
                    required
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Banner Image URL</label>
                  <input
                    type="url"
                    required
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rating (0-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Release Date</label>
                  <input
                    type="date"
                    required
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Director</label>
                  <input
                    type="text"
                    required
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Screening Formats</label>
                  <input
                    type="text"
                    required
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cast Members</label>
                <input
                  type="text"
                  required
                  value={cast}
                  onChange={(e) => setCast(e.target.value)}
                  placeholder="Comma-separated actors"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700"
                />
                <label htmlFor="featured" className="text-slate-300 font-semibold cursor-pointer">
                  Mark as Featured Carousel Movie on Homepage
                </label>
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
                  <span>Save Movie</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
