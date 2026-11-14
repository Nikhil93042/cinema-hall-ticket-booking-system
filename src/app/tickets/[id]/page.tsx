import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Ticket, Film, Calendar, Clock, MapPin, Printer, CheckCircle2, ShieldAlert, ArrowLeft } from "lucide-react";
import PrintButton from "./PrintButton";
import QuickValidateButton from "./QuickValidateButton";

export const dynamic = "force-dynamic";

interface TicketPageProps {
  params: { id: string };
}

export default async function TicketPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const booking = await prisma.booking.findFirst({
    where: {
      OR: [{ id }, { bookingReference: id }],
    },
    include: {
      user: true,
      show: {
        include: {
          movie: true,
          screen: {
            include: {
              theatre: true,
            },
          },
        },
      },
      seats: {
        include: {
          seat: {
            include: {
              category: true,
            },
          },
        },
      },
      payment: true,
      ticket: true,
    },
  });

  if (!booking || !booking.ticket) {
    notFound();
  }

  const { ticket, show, seats, payment } = booking;
  const movie = show.movie;
  const screen = show.screen;
  const theatre = screen.theatre;

  const showDate = new Date(show.startTime).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const showTime = new Date(show.startTime).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Bookings</span>
        </Link>

        <div className="flex items-center gap-3">
          <PrintButton />
        </div>
      </div>

      {/* Luxury Boarding Pass Ticket Container */}
      <div className="ticket-print-container bg-[#0D121F] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Ticket Header Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 px-6 py-4 flex flex-wrap items-center justify-between border-b border-purple-800/40 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-black tracking-wider text-white">
                CINE<span className="text-purple-400">LUXE</span> CINEMAS
              </span>
              <p className="text-[10px] text-purple-200 uppercase tracking-widest font-semibold">
                Official Electronic Admission Pass
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-purple-200 bg-purple-950/60 px-2.5 py-1 rounded border border-purple-400/30">
              REF: {booking.bookingReference}
            </span>
            {ticket.isValidated ? (
              <span className="text-xs font-bold text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded border border-amber-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ENTRY VALIDATED</span>
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>VALID FOR ADMISSION</span>
              </span>
            )}
          </div>
        </div>

        {/* Main Ticket Body */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left 2 Cols: Movie & Showtime Details */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                Movie Presentation
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                {movie.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-300">
                <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-500/40 text-purple-300 font-bold">
                  {screen.format}
                </span>
                <span>•</span>
                <span>{movie.language}</span>
                <span>•</span>
                <span>{movie.duration} mins</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-800/80">
              <div>
                <p className="text-slate-400 font-medium">Cinema Hall</p>
                <p className="text-white font-bold text-sm mt-0.5">{theatre.name}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">{theatre.city} • {theatre.address}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Screen & Auditorium</p>
                <p className="text-white font-bold text-sm mt-0.5">{screen.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-800/80">
              <div>
                <p className="text-slate-400 font-medium">Date</p>
                <p className="text-white font-bold text-sm mt-0.5">{showDate}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Showtime</p>
                <p className="text-purple-400 font-black text-base mt-0.5">{showTime}</p>
              </div>
            </div>

            {/* Reserved Seats Chips */}
            <div className="pt-4 border-t border-slate-800/80">
              <p className="text-slate-400 text-xs font-medium mb-2">Confirmed Reserved Seats ({seats.length})</p>
              <div className="flex flex-wrap gap-2">
                {seats.map((bs) => (
                  <span
                    key={bs.id}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/50 text-white font-black text-sm"
                  >
                    Row {bs.seat.row} - Seat {bs.seat.number} ({bs.seat.category.name})
                  </span>
                ))}
              </div>
            </div>

            {/* Customer & Payment Info */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <div>
                <span>Ticket Holder: </span>
                <span className="text-slate-200 font-semibold">{booking.user.name}</span>
              </div>
              <div>
                <span>Amount Paid: </span>
                <span className="text-white font-bold">₹{booking.totalAmount}</span> ({payment?.paymentMethod || "CARD"})
              </div>
            </div>
          </div>

          {/* Right Col: High-Res QR Code & Gate Validation Token */}
          <div className="md:border-l md:border-slate-800 md:pl-8 flex flex-col items-center justify-between text-center space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                Gate Entry Scanner
              </span>
              <p className="text-xs text-slate-400">Present this QR code at cinema hall gate</p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-3 rounded-2xl shadow-xl border-4 border-purple-600/30">
              <img
                src={ticket.qrCodeData}
                alt="Ticket QR Code"
                className="w-44 h-44 object-contain"
              />
            </div>

            <div className="space-y-1 font-mono">
              <p className="text-[11px] text-slate-400">TICKET TOKEN</p>
              <p className="text-sm font-bold text-white tracking-widest">{ticket.ticketCode}</p>
            </div>

            {/* Test 5 Entry Scanner Quick Action for Evaluator/Usher */}
            <div className="w-full pt-2 no-print">
              <QuickValidateButton
                ticketCode={ticket.ticketCode}
                isValidated={ticket.isValidated}
                validatedAt={ticket.validatedAt}
                validatedBy={ticket.validatedBy}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
