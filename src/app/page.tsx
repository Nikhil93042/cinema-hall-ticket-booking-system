import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Star, Clock, Ticket, Sparkles, MapPin, Search, Calendar, ChevronRight, Film } from "lucide-react";
import Image from "next/image";

interface PageProps {
  searchParams?: {
    search?: string;
    genre?: string;
    city?: string;
  };
}

export default async function HomePage({ searchParams }: PageProps) {
  const search = searchParams?.search || "";
  const genreSlug = searchParams?.genre || "";
  const city = searchParams?.city || "Mumbai";

  // Fetch featured movies for hero banner
  const featuredMovies = await prisma.movie.findMany({
    where: { isFeatured: true, isActive: true },
    include: { genres: { include: { genre: true } } },
    take: 3,
  });

  const heroMovie = featuredMovies[0] || (await prisma.movie.findFirst({ where: { isActive: true } }));

  // Query conditions for "Now Showing"
  const whereCondition: any = { isActive: true };
  if (search) {
    whereCondition.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { cast: { contains: search } },
      { director: { contains: search } },
    ];
  }
  if (genreSlug) {
    whereCondition.genres = {
      some: {
        genre: { slug: genreSlug.toLowerCase() },
      },
    };
  }

  const [allMovies, allGenres, theatres] = await Promise.all([
    prisma.movie.findMany({
      where: whereCondition,
      include: {
        genres: { include: { genre: true } },
        shows: {
          where: { startTime: { gte: new Date() } },
          select: { id: true, startTime: true },
        },
      },
      orderBy: [{ rating: "desc" }],
    }),
    prisma.genre.findMany({ orderBy: { name: "asc" } }),
    prisma.theatre.findMany({
      where: { isActive: true },
      include: { screens: true },
      take: 3,
    }),
  ]);

  const nowShowing = allMovies.slice(0, 8);
  const comingSoon = allMovies.slice(8);
  const trendingMovies = [...allMovies].sort((a, b) => b.rating - a.rating).slice(0, 4);

  return (
    <div className="min-h-screen pb-16">
      {/* Hero Banner Section */}
      {heroMovie && (
        <section className="relative w-full h-[520px] lg:h-[600px] overflow-hidden bg-slate-950">
          {/* Background backdrop with gradient overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 scale-105 transform duration-700 hover:scale-100"
            style={{ backgroundImage: `url(${heroMovie.bannerUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-[#07090E]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07090E] via-[#07090E]/70 to-transparent" />

          <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Featured Experience • Now in IMAX 3D</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                {heroMovie.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
                <div className="flex items-center gap-1 text-amber-400 font-bold bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-500/30">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{heroMovie.rating.toFixed(1)}/10</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{heroMovie.duration} mins</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-semibold">
                  {heroMovie.format}
                </span>
                <span className="text-slate-400">{heroMovie.language}</span>
              </div>

              <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed max-w-xl">
                {heroMovie.description}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  href={`/movies/${heroMovie.id}`}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-purple-600/30 hover:scale-[1.02] transition-all"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Book Tickets Now</span>
                </Link>
                <Link
                  href={`/movies/${heroMovie.id}`}
                  className="inline-flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 px-5 py-3 rounded-xl font-semibold text-sm backdrop-blur-md transition-all"
                >
                  View Details & Shows
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10 space-y-12">
        {/* Genre Filters & Quick Search Bar */}
        <div className="bg-[#0D121F]/90 backdrop-blur-md border border-slate-800/80 p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full md:w-auto">
            <Link
              href="/"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                !genreSlug
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              All Genres
            </Link>
            {allGenres.map((g) => (
              <Link
                key={g.id}
                href={`/?genre=${g.slug}`}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  genreSlug === g.slug
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {g.name}
              </Link>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing <span className="text-purple-400 font-bold">{allMovies.length}</span> movies available
          </div>
        </div>

        {/* Section 1: Now Showing */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Now Showing</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Explore latest releases with instant seat reservation and Dolby Atmos sound
              </p>
            </div>
            <span className="text-xs text-purple-400 font-semibold cursor-pointer hover:underline">
              {nowShowing.length} Shows Today
            </span>
          </div>

          {nowShowing.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Film className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-base font-semibold text-slate-300">No movies found matching your filter</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting the genre or search keywords.</p>
              <Link href="/" className="inline-block mt-4 text-xs font-semibold text-purple-400 hover:underline">
                Clear Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {nowShowing.map((movie) => (
                <div
                  key={movie.id}
                  className="group bg-[#0D121F] border border-slate-800/80 hover:border-purple-500/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-purple-900/20 flex flex-col"
                >
                  {/* Poster Image */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D121F] via-transparent to-transparent opacity-80" />

                    {/* Format Badge */}
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-700/60 px-2 py-0.5 rounded text-[10px] font-bold text-purple-300">
                      {movie.format.split(",")[0]}
                    </div>

                    {/* Rating badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-bold text-amber-400 border border-amber-500/30">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{movie.rating.toFixed(1)}</span>
                    </div>

                    <div className="absolute bottom-2 left-3 right-3 text-left">
                      <p className="text-[11px] font-semibold text-purple-300 truncate">
                        {movie.genres.map((g) => g.genre.name).join(" • ")}
                      </p>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-purple-400 transition-colors line-clamp-1">
                        {movie.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span>{movie.duration}m</span>
                        <span>•</span>
                        <span>{movie.language}</span>
                      </div>
                    </div>

                    <Link
                      href={`/movies/${movie.id}`}
                      className="w-full text-center bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 text-purple-300 hover:text-white py-2 rounded-xl text-xs font-semibold transition-all shadow-sm"
                    >
                      Book Tickets
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Trending Movies */}
        {trendingMovies.length > 0 && (
          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Trending & Top Rated</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Most booked movies with stellar audience ratings
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {trendingMovies.map((movie, idx) => (
                <Link
                  key={movie.id}
                  href={`/movies/${movie.id}`}
                  className="flex items-center gap-3 bg-[#0D121F] border border-slate-800 hover:border-purple-500/40 p-3 rounded-2xl group transition-all"
                >
                  <span className="text-2xl font-black text-slate-600 group-hover:text-purple-500 pl-2">
                    #{idx + 1}
                  </span>
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-14 h-20 object-cover rounded-xl flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white group-hover:text-purple-400 truncate">
                      {movie.title}
                    </h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{movie.rating.toFixed(1)}/10</span>
                    </p>
                    <span className="text-[10px] text-purple-300 font-medium">
                      {movie.format.split(",")[0]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Theatres & Cinema Hall Discovery */}
        <section className="bg-gradient-to-r from-purple-950/30 via-slate-900/50 to-indigo-950/30 border border-purple-900/30 rounded-3xl p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest">
                <MapPin className="w-3.5 h-3.5" />
                <span>Premium Cinema Halls</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mt-1">
                Experience Cinema in Ultimate Luxury
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Featuring IMAX Laser, Dolby Atmos 7.1, 4DX motion seats, and gourmet in-seat dining.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {theatres.map((theatre) => (
              <div
                key={theatre.id}
                className="bg-[#090D16] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-purple-400 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded">
                      {theatre.city}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {theatre.screens.length} Screens
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-2">{theatre.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {theatre.address}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-900">
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    <span className="text-slate-300 font-medium">Facilities:</span> {theatre.facilities}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
