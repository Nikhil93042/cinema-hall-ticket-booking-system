import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding for Cinema Hall Ticket Booking System...");

  // 1. Clean existing data
  await prisma.auditLog.deleteMany({});
  await prisma.refund.deleteMany({});
  await prisma.cancellation.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.bookingSeat.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.seatHold.deleteMany({});
  await prisma.seat.deleteMany({});
  await prisma.seatCategory.deleteMany({});
  await prisma.show.deleteMany({});
  await prisma.screen.deleteMany({});
  await prisma.theatre.deleteMany({});
  await prisma.movieGenre.deleteMany({});
  await prisma.genre.deleteMany({});
  await prisma.movie.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Cleaned existing tables.");

  // 2. Create Users
  const passwordHashAdmin = await bcrypt.hash("Admin@123", 10);
  const passwordHashCustomer = await bcrypt.hash("Customer@123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Cinema Administrator",
      email: "admin@cinemahall.com",
      passwordHash: passwordHashAdmin,
      role: "ADMIN",
      phone: "+91 9876543210",
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: "Rahul Sharma",
      email: "customer@cinemahall.com",
      passwordHash: passwordHashCustomer,
      role: "CUSTOMER",
      phone: "+91 9812345678",
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: "Priya Patel",
      email: "priya.patel@example.com",
      passwordHash: passwordHashCustomer,
      role: "CUSTOMER",
      phone: "+91 9823456789",
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      name: "Ananya Roy",
      email: "ananya.roy@example.com",
      passwordHash: passwordHashCustomer,
      role: "CUSTOMER",
      phone: "+91 9834567890",
    },
  });

  console.log("Seeded Users: Admin and 3 Customers.");

  // 3. Create Seat Categories
  const silverCategory = await prisma.seatCategory.create({
    data: {
      name: "Silver",
      code: "SILVER",
      description: "Standard cinema seating with comfortable high-back cushion seats",
      basePrice: 200,
    },
  });

  const goldCategory = await prisma.seatCategory.create({
    data: {
      name: "Gold",
      code: "GOLD",
      description: "Enhanced viewing zone with wider armrests and superior legroom",
      basePrice: 350,
    },
  });

  const premiumCategory = await prisma.seatCategory.create({
    data: {
      name: "Premium",
      code: "PREMIUM",
      description: "VIP motorized recliners with in-seat dining service and best viewing angles",
      basePrice: 500,
    },
  });

  console.log("Seeded Seat Categories: Silver, Gold, Premium.");

  // 4. Create Theatres & Screens
  const theatreData = [
    {
      name: "PVR Luxe Mega Cinema",
      city: "Mumbai",
      address: "Phoenix Marketcity, Kurla West, LBS Marg, Mumbai 400070",
      phone: "+91 22 4000 8000",
      facilities: "IMAX Laser, Dolby Atmos 7.1, Gourmet Kitchen, Valet Parking, Wheelchair Access",
      screens: [
        { name: "Audi 1 - IMAX Laser", format: "IMAX 3D" },
        { name: "Audi 2 - Dolby Atmos", format: "Dolby Atmos 2D" },
        { name: "Audi 3 - VIP Recliner", format: "4DX" },
      ],
    },
    {
      name: "INOX Cinepolis Grand",
      city: "Bengaluru",
      address: "Orion Mall, Brigade Gateway, Rajajinagar, Bengaluru 560055",
      phone: "+91 80 6728 5000",
      facilities: "4DX Motion Chairs, Dolby Atmos, Starbucks Cafe, Ample Basement Parking",
      screens: [
        { name: "Screen 1 - 4DX Dynamic", format: "4DX" },
        { name: "Screen 2 - Atmos Prime", format: "Dolby Atmos 2D" },
      ],
    },
    {
      name: "Miraj Premiere Star City",
      city: "New Delhi",
      address: "Connaught Place, Middle Circle, Block E, New Delhi 110001",
      phone: "+91 11 2341 9000",
      facilities: "4K Laser Projection, Plush Recliners, Live Food Counters, Metro Connected",
      screens: [
        { name: "Audi 1 - Laser 4K", format: "2D" },
        { name: "Audi 2 - Royal Recliner", format: "Dolby Atmos 2D" },
      ],
    },
  ];

  const screensList: any[] = [];

  for (const t of theatreData) {
    const createdTheatre = await prisma.theatre.create({
      data: {
        name: t.name,
        city: t.city,
        address: t.address,
        phone: t.phone,
        facilities: t.facilities,
      },
    });

    for (const sc of t.screens) {
      const createdScreen = await prisma.screen.create({
        data: {
          theatreId: createdTheatre.id,
          name: sc.name,
          format: sc.format,
          totalSeats: 48, // 3 rows silver (24) + 2 rows gold (16) + 1 row premium (8) = 48
        },
      });
      screensList.push(createdScreen);

      // Generate seats for each screen:
      // Rows A, B: Silver (10 seats each)
      // Rows C, D: Gold (10 seats each)
      // Rows E: Premium (8 seats)
      const seatRows = [
        { row: "A", categoryId: silverCategory.id, count: 10 },
        { row: "B", categoryId: silverCategory.id, count: 10 },
        { row: "C", categoryId: goldCategory.id, count: 10 },
        { row: "D", categoryId: goldCategory.id, count: 10 },
        { row: "E", categoryId: premiumCategory.id, count: 8 },
      ];

      for (const r of seatRows) {
        for (let num = 1; num <= r.count; num++) {
          await prisma.seat.create({
            data: {
              screenId: createdScreen.id,
              categoryId: r.categoryId,
              row: r.row,
              number: num,
              isActive: true,
            },
          });
        }
      }
    }
  }

  console.log(`Seeded 3 Theatres, ${screensList.length} Screens, and configured interactive seat maps.`);

  // 5. Create Genres
  const genres = [
    { name: "Action", slug: "action" },
    { name: "Sci-Fi", slug: "sci-fi" },
    { name: "Thriller", slug: "thriller" },
    { name: "Drama", slug: "drama" },
    { name: "Adventure", slug: "adventure" },
    { name: "Comedy", slug: "comedy" },
    { name: "Horror", slug: "horror" },
    { name: "Animation", slug: "animation" },
  ];

  const genreMap = new Map<string, string>();
  for (const g of genres) {
    const created = await prisma.genre.create({ data: g });
    genreMap.set(g.slug, created.id);
  }

  // 6. Create At Least 10 Realistic Movies
  const movieData = [
    {
      title: "Interstellar: Beyond Time",
      slug: "interstellar-beyond-time",
      description: "When Earth becomes uninhabitable, a team of explorers undertakes the most important mission in human history: traveling beyond this galaxy to discover whether mankind has a future among the stars.",
      posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop",
      duration: 169,
      releaseDate: new Date("2026-03-15"),
      rating: 8.9,
      language: "English",
      format: "IMAX 3D, Dolby Atmos",
      director: "Christopher Nolan",
      cast: "Matthew McConaughey, Anne Hathaway, Jessica Chastain, Michael Caine",
      isFeatured: true,
      genres: ["sci-fi", "adventure", "drama"],
    },
    {
      title: "Dune: Imperial Prophecy",
      slug: "dune-imperial-prophecy",
      description: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between love and the fate of the known universe.",
      posterUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1600&auto=format&fit=crop",
      duration: 166,
      releaseDate: new Date("2026-04-01"),
      rating: 8.8,
      language: "English",
      format: "IMAX 3D, 4DX",
      director: "Denis Villeneuve",
      cast: "Timothée Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem",
      isFeatured: true,
      genres: ["sci-fi", "adventure", "action"],
    },
    {
      title: "Cyberpunk 2099: Neon Syndicate",
      slug: "cyberpunk-2099-neon-syndicate",
      description: "In a rain-drenched megacity dominated by ruthless mega-corporations and cybernetic assassins, a rogue hacker and an ex-enforcer team up to expose an omnipotent neural AI weapon.",
      posterUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1600&auto=format&fit=crop",
      duration: 142,
      releaseDate: new Date("2026-05-10"),
      rating: 8.4,
      language: "English",
      format: "4DX, 2D",
      director: "Alex Garland",
      cast: "Keanu Reeves, Oscar Isaac, Ana de Armas",
      isFeatured: true,
      genres: ["action", "sci-fi", "thriller"],
    },
    {
      title: "Shadows of the Forgotten Realm",
      slug: "shadows-of-the-forgotten-realm",
      description: "An ancient dark sorcerer awakens after a millennium beneath the frost ruins. Four mismatched champions must traverse uncharted dragon territory to light the forge of eternal flame.",
      posterUrl: "https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=800&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop",
      duration: 155,
      releaseDate: new Date("2026-06-20"),
      rating: 8.1,
      language: "English",
      format: "IMAX 3D",
      director: "Guillermo del Toro",
      cast: "Benedict Cumberbatch, Cate Blanchett, Tom Hiddleston",
      isFeatured: false,
      genres: ["adventure", "action", "drama"],
    },
    {
      title: "The Silent Heist",
      slug: "the-silent-heist",
      description: "A crew of elite masterminds infiltrate the world's most guarded subterranean quantum vault in Zurich during the annual World Economic Gala without firing a single bullet.",
      posterUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1600&auto=format&fit=crop",
      duration: 130,
      releaseDate: new Date("2026-02-14"),
      rating: 7.9,
      language: "English",
      format: "Dolby Atmos 2D",
      director: "Steven Soderbergh",
      cast: "George Clooney, Sandra Bullock, Ryan Gosling",
      isFeatured: false,
      genres: ["thriller", "action", "drama"],
    },
    {
      title: "Quantum Paradox",
      slug: "quantum-paradox",
      description: "When an experimental particle collider tears open localized parallel timelines, a physicist discovers that in every other reality, his alternate self is systematically hunting him down.",
      posterUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop",
      duration: 138,
      releaseDate: new Date("2026-07-04"),
      rating: 8.5,
      language: "English",
      format: "IMAX 3D, 2D",
      director: "David Fincher",
      cast: "Cillian Murphy, Florence Pugh, Mark Ruffalo",
      isFeatured: false,
      genres: ["sci-fi", "thriller", "drama"],
    },
    {
      title: "Echoes of Eternity",
      slug: "echoes-of-eternity",
      description: "A sweeping romantic drama chronicling two soulmates across three distinct eras: renaissance Florence, wartime London, and a futuristic Martian biosphere.",
      posterUrl: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=800&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop",
      duration: 148,
      releaseDate: new Date("2026-01-20"),
      rating: 8.2,
      language: "English",
      format: "Dolby Atmos 2D",
      director: "Greta Gerwig",
      cast: "Saoirse Ronan, Paul Mescal, Andrew Scott",
      isFeatured: false,
      genres: ["drama"],
    },
    {
      title: "Velocity Rush: Tokyo Driftline",
      slug: "velocity-rush-tokyo-driftline",
      description: "High-octane underground street racing collides with international high-tech smuggling beneath the neon skylines of Shinjuku and the winding mountain passes of Mount Haruna.",
      posterUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1600&auto=format&fit=crop",
      duration: 125,
      releaseDate: new Date("2026-08-18"),
      rating: 7.7,
      language: "Japanese / English",
      format: "4DX, Dolby Atmos 2D",
      director: "Justin Lin",
      cast: "Sung Kang, Hiroyuki Sanada, Michelle Rodriguez",
      isFeatured: false,
      genres: ["action", "thriller"],
    },
    {
      title: "The Midnight Manor",
      slug: "the-midnight-manor",
      description: "An eccentric mystery novelist summons his estranged family to his Victorian estate on a storm-lashed coastal cliff, promising his fortune to whoever survives until daybreak.",
      posterUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=1600&auto=format&fit=crop",
      duration: 118,
      releaseDate: new Date("2026-10-31"),
      rating: 7.8,
      language: "English",
      format: "2D",
      director: "Mike Flanagan",
      cast: "Carla Gugino, Rahul Kohli, Henry Thomas",
      isFeatured: false,
      genres: ["horror", "thriller", "drama"],
    },
    {
      title: "Cosmic Odyssey: Starfall",
      slug: "cosmic-odyssey-starfall",
      description: "An animated visual spectacle following a curious young star navigator and her robotic companion as they embark on a quest to reignite the fading constellations.",
      posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop",
      duration: 104,
      releaseDate: new Date("2026-09-05"),
      rating: 8.6,
      language: "English",
      format: "3D, 2D",
      director: "Peter Sohn",
      cast: "Awkwafina, Chris Evans, Kumail Nanjiani",
      isFeatured: true,
      genres: ["animation", "adventure", "comedy"],
    },
    {
      title: "The Laughing Detective",
      slug: "the-laughing-detective",
      description: "A bumbling yet surprisingly intuitive private eye takes on a high-profile case involving a kidnapped royal corgi, accidentally unraveling a national conspiracy.",
      posterUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1600&auto=format&fit=crop",
      duration: 112,
      releaseDate: new Date("2026-04-20"),
      rating: 7.5,
      language: "English",
      format: "2D",
      director: "Taika Waititi",
      cast: "Sam Rockwell, Bill Hader, Maya Rudolph",
      isFeatured: false,
      genres: ["comedy", "drama"],
    },
  ];

  const createdMovies: any[] = [];
  for (const m of movieData) {
    const movie = await prisma.movie.create({
      data: {
        title: m.title,
        slug: m.slug,
        description: m.description,
        posterUrl: m.posterUrl,
        bannerUrl: m.bannerUrl,
        duration: m.duration,
        releaseDate: m.releaseDate,
        rating: m.rating,
        language: m.language,
        format: m.format,
        director: m.director,
        cast: m.cast,
        isFeatured: m.isFeatured,
        isActive: true,
      },
    });
    createdMovies.push(movie);

    for (const gSlug of m.genres) {
      const gId = genreMap.get(gSlug);
      if (gId) {
        await prisma.movieGenre.create({
          data: {
            movieId: movie.id,
            genreId: gId,
          },
        });
      }
    }
  }

  console.log(`Seeded ${createdMovies.length} Movies with full metadata & genres.`);

  // 7. Create Showtimes (Today, Tomorrow, Day After Tomorrow)
  const now = new Date();
  const showTimesSlots = [
    { hour: 10, minute: 30 },
    { hour: 14, minute: 15 },
    { hour: 18, minute: 0 },
    { hour: 21, minute: 45 },
  ];

  const createdShows: any[] = [];

  // Schedule shows over next 3 days across screens
  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    for (let sIdx = 0; sIdx < screensList.length; sIdx++) {
      const screen = screensList[sIdx];
      // Pick movie rotating
      const movie = createdMovies[(dayOffset + sIdx) % createdMovies.length];

      for (const slot of showTimesSlots) {
        const startTime = new Date(now);
        startTime.setDate(now.getDate() + dayOffset);
        startTime.setHours(slot.hour, slot.minute, 0, 0);

        const endTime = new Date(startTime.getTime() + movie.duration * 60 * 1000 + 20 * 60 * 1000); // duration + 20 min cleanup

        const show = await prisma.show.create({
          data: {
            movieId: movie.id,
            screenId: screen.id,
            startTime,
            endTime,
            silverPrice: 200,
            goldPrice: 350,
            premiumPrice: 500,
          },
        });
        createdShows.push(show);
      }
    }
  }

  console.log(`Seeded ${createdShows.length} Shows across all screens and schedules.`);

  // 8. Seed Sample Bookings, Payments, and Tickets to populate realistic metrics
  const firstShow = createdShows[0];
  const firstScreenSeats = await prisma.seat.findMany({
    where: { screenId: firstShow.screenId },
    take: 6,
  });

  if (firstScreenSeats.length >= 4) {
    // Booking 1: Confirmed booking for customer1
    const booking1 = await prisma.booking.create({
      data: {
        bookingReference: "CINE-2026-X9A7K2",
        userId: customer1.id,
        showId: firstShow.id,
        totalAmount: 770, // 2 seats @ 350 + 50 convenience + 20 tax
        convenienceFee: 50,
        taxAmount: 20,
        status: "CONFIRMED",
        idempotencyKey: "idemp-seed-1111",
      },
    });

    await prisma.bookingSeat.create({
      data: {
        bookingId: booking1.id,
        seatId: firstScreenSeats[0].id,
        showId: firstShow.id,
        price: 350,
      },
    });

    await prisma.bookingSeat.create({
      data: {
        bookingId: booking1.id,
        seatId: firstScreenSeats[1].id,
        showId: firstShow.id,
        price: 350,
      },
    });

    await prisma.payment.create({
      data: {
        bookingId: booking1.id,
        amount: 770,
        paymentMethod: "CARD",
        status: "SUCCESS",
        transactionReference: "TXN-SEED-987654321",
      },
    });

    await prisma.ticket.create({
      data: {
        bookingId: booking1.id,
        ticketCode: "TKT-2026-00124",
        qrCodeData: JSON.stringify({
          bookingRef: "CINE-2026-X9A7K2",
          ticketCode: "TKT-2026-00124",
          showId: firstShow.id,
          seats: ["Row C-1", "Row C-2"],
          timestamp: new Date().toISOString(),
        }),
        isValidated: false,
      },
    });

    // Booking 2: Another confirmed booking for customer2
    const booking2 = await prisma.booking.create({
      data: {
        bookingReference: "CINE-2026-B4T8M9",
        userId: customer2.id,
        showId: firstShow.id,
        totalAmount: 1080, // 2 seats @ 500 + 60 fee + 20 tax
        convenienceFee: 60,
        taxAmount: 20,
        status: "CONFIRMED",
        idempotencyKey: "idemp-seed-2222",
      },
    });

    await prisma.bookingSeat.create({
      data: {
        bookingId: booking2.id,
        seatId: firstScreenSeats[2].id,
        showId: firstShow.id,
        price: 500,
      },
    });

    await prisma.payment.create({
      data: {
        bookingId: booking2.id,
        amount: 1080,
        paymentMethod: "UPI",
        status: "SUCCESS",
        transactionReference: "TXN-SEED-123456789",
      },
    });

    await prisma.ticket.create({
      data: {
        bookingId: booking2.id,
        ticketCode: "TKT-2026-00125",
        qrCodeData: JSON.stringify({
          bookingRef: "CINE-2026-B4T8M9",
          ticketCode: "TKT-2026-00125",
          showId: firstShow.id,
          seats: ["Row E-1"],
          timestamp: new Date().toISOString(),
        }),
        isValidated: true,
        validatedAt: new Date(),
        validatedBy: "Gate Usher A",
      },
    });

    // Booking 3: Cancelled booking with refund for customer3
    const booking3 = await prisma.booking.create({
      data: {
        bookingReference: "CINE-2026-CAN991",
        userId: customer3.id,
        showId: firstShow.id,
        totalAmount: 440,
        convenienceFee: 30,
        taxAmount: 10,
        status: "CANCELLED",
        idempotencyKey: "idemp-seed-3333",
      },
    });

    await prisma.payment.create({
      data: {
        bookingId: booking3.id,
        amount: 440,
        paymentMethod: "CARD",
        status: "REFUNDED",
        transactionReference: "TXN-SEED-555666777",
      },
    });

    const cancellation = await prisma.cancellation.create({
      data: {
        bookingId: booking3.id,
        reason: "Customer schedule conflict",
        refundAmount: 396, // 90% refund
        cancellationFee: 44,
        status: "PROCESSED",
      },
    });

    await prisma.refund.create({
      data: {
        cancellationId: cancellation.id,
        amount: 396,
        status: "COMPLETED",
        transactionReference: "REF-SEED-888999000",
      },
    });

    console.log("Seeded sample confirmed, validated, and cancelled bookings with payments and tickets.");
  }

  // 9. Create Audit Log entries
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: "DATABASE_INITIALIZED",
        entityType: "System",
        entityId: "init",
        details: JSON.stringify({ event: "Database successfully seeded with cinema records" }),
      },
      {
        userId: admin.id,
        action: "SCHEDULE_PUBLISHED",
        entityType: "Show",
        entityId: firstShow.id,
        details: JSON.stringify({ showCount: createdShows.length }),
      },
    ],
  });

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
