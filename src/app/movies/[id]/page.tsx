import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, Clock, Calendar, MapPin, Film, Sparkles, ChevronLeft, ShieldCheck, Ticket } from "lucide-react";

interface MoviePageProps {
  params: { id: string };
  searchParams?: { date?: string };
}

export default async function MovieDetailsPage({ params, searchParams }: MoviePageProps) {
  const { id } = params;
  const selectedDateStr = searchParams?.date || "";

  const movie = await prisma.movie.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      isActive: true,
    },
    include: {
      genres: { include: { genre: true } },
    },
  });

  if (!movie) {
    notFound();
  }

  // Generate date tabs: Today, Tomorrow, +2 days, +3 days
  const now = new Date();
  const dateOptions = [0, 1, 2, 3].map((offset) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const dateKey = d.toISOString().split("T")[0]; // YYYY-MM-DD
    const dayLabel = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" });
    const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { dateKey, dayLabel, formatted };
  });

  const activeDateKey = selectedDateStr || dateOptions[0].dateKey;

  // Determine start & end time for the active date
  const filterDate = new Date(activeDateKey);
  const startOfDay = new Date(filterDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(filterDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch shows on this date
  const shows = await prisma.show.findMany({
    where: {
      movieId: movie.id,
      isActive: true,
      startTime: {
        gte: new Date(), // future shows
        lte: endOfDay,
      },
    },
    include: {
      screen: {
        include: {
          theatre: true,
        },
      },
      _count: {
        select: {
          bookingSeats: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  // Group shows by Theatre
  const theatreMap = new Map<string, any>();
  for (const show of shows) {
    const theatre = show.screen.theatre;
    if (!theatreMap.has(theatre.id)) {
      theatreMap.set(theatre.id, {
        theatreId: theatre.id,
        name: theatre.name,
        city: theatre.city,
        address: theatre.address,
        facilities: theatre.facilities,
        shows: [],
      });
    }

    const totalSeats = show.screen.totalSeats || 48;
    const booked = show._count.bookingSeats;
    const remaining = Math.max(0, totalSeats - booked);

    let status = "AVAILABLE";
    let statusColor = "text-emerald-400 border-emerald-500/40 bg-emerald-950/20";
    if (remaining <= 5) {
      status = "ALMOST FULL";
      statusColor = "text-rose-400 border-rose-500/40 bg-rose-950/20";
    } else if (remaining <= 15) {
      status = "FILLING FAST";
      statusColor = "text-amber-400 border-amber-500/40 bg-amber-950/20";
    }

    theatreMap.get(theatre.id).shows.push({
      id: show.id,
      startTime: show.startTime,
      screenName: show.screen.name,
      screenFormat: show.screen.format,
      silverPrice: show.silverPrice,
      goldPrice: show.goldPrice,
      premiumPrice: show.premiumPrice,
      remaining,
      status,
      statusColor,
    });
  }

  const theatres = Array.from(theatreMap.values());

  return (
    <div className="min-h-screen pb-20">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Movies</span>
        </Link>
      </div>

      {/* Hero Banner with Movie Meta */}
      <section className="relative w-full bg-slate-950 overflow-hidden border-b border-slate-800">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${movie.bannerUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-[#07090E]/80 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Poster Card */}
            <div className="w-48 sm:w-60 flex-shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-900 mx-auto md:mx-0">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Movie Info */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold">
                  {movie.format}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-medium">
                  {movie.language}
                </span>
                {movie.isFeatured && (
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Featured</span>
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {movie.title}
              </h1>

              {/* Rating & Duration */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
                <div className="flex items-center gap-1 text-amber-400 bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-500/30">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="text-sm font-bold">{movie.rating.toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">/ 10</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{movie.duration} Minutes</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Released {new Date(movie.releaseDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                </div>
              </div>

              {/* Genre Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {movie.genres.map((g) => (
                  <span
                    key={g.id}
                    className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300"
                  >
                    {g.genre.name}
                  </span>
                ))}
              </div>

              {/* Description */}
              <p className="text-sm text-slate-300 leading-relaxed max-w-3xl pt-2">
                {movie.description}
              </p>

              {/* Cast & Director */}
              <div className="pt-2 text-xs space-y-1 text-slate-400">
                <p>
                  <span className="text-slate-200 font-semibold">Director:</span> {movie.director}
                </p>
                <p>
                  <span className="text-slate-200 font-semibold">Cast:</span> {movie.cast}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Showtime Selection Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Date Selector Tabs */}
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
            Select Show Date
          </h2>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {dateOptions.map((opt) => {
              const isSelected = opt.dateKey === activeDateKey;
              return (
                <Link
                  key={opt.dateKey}
                  href={`/movies/${movie.id}?date=${opt.dateKey}`}
                  className={`flex flex-col items-center min-w-[100px] px-4 py-2.5 rounded-2xl border text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/30 scale-105"
                      : "bg-[#0D121F] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider">{opt.dayLabel}</span>
                  <span className="text-sm font-black mt-0.5">{opt.formatted}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Theatres & Showtimes List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Available Theatres & Showtimes</span>
            </h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Available
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Filling Fast
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400" /> Almost Full
              </span>
            </div>
          </div>

          {theatres.length === 0 ? (
            <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-slate-300">No scheduled shows found for this date</p>
              <p className="text-xs text-slate-500 mt-1">Please select another date above or check back shortly.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {theatres.map((theatre) => (
                <div
                  key={theatre.theatreId}
                  className="bg-[#0D121F] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-white">{theatre.name}</h3>
                        <span className="text-[10px] font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded">
                          {theatre.city}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{theatre.address}</p>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="text-slate-300 font-medium">Amenities:</span>
                      <span className="line-clamp-1">{theatre.facilities}</span>
                    </div>
                  </div>

                  {/* Showtimes Grid */}
                  <div className="pt-4 flex flex-wrap gap-3">
                    {theatre.shows.map((show: any) => {
                      const timeStr = new Date(show.startTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <Link
                          key={show.id}
                          href={`/shows/${show.id}/seats`}
                          className="group relative flex flex-col items-center justify-center bg-slate-900 border border-slate-700/80 hover:border-purple-500 hover:bg-purple-950/20 px-4 py-2.5 rounded-xl transition-all hover:scale-105"
                        >
                          <span className="text-sm font-bold text-white group-hover:text-purple-300">
                            {timeStr}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {show.screenFormat}
                          </span>

                          {/* Status Pill */}
                          <span className={`text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded border ${show.statusColor}`}>
                            {show.status}
                          </span>

                          {/* Pricing Tooltip on Hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-950 text-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded shadow border border-slate-700 pointer-events-none whitespace-nowrap z-20">
                            Silver ₹{show.silverPrice} • Gold ₹{show.goldPrice} • VIP ₹{show.premiumPrice}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
