# CINELUXE — Cinema Hall Ticket Booking System

A commercial-grade, full-stack cinema ticket reservation and hall management web application built for the **ALGIONS AI LABS PRIVATE LIMITED** Full-Stack Web Development assessment.

---

## 🌟 Executive Overview & Key Highlights

CINELUXE provides an end-to-end, ACID-compliant cinema ticketing platform modeled after enterprise cinema applications (such as BookMyShow and PVR Cinemas). It prevents race conditions during high-demand seat booking through database-backed temporary seat locking and atomic transaction confirmation.

### 🛡️ Core Highlights
- **ACID-Compliant Concurrency Control**: Prevents double-booking at the database level using Prisma transactions and unique compound constraints (`@@unique([showId, seatId])`).
- **Configurable Temporary Seat Holds**: Holds seats for 5 minutes during checkout with automatic background and query-time expiration release.
- **Idempotency Protection**: Enforces idempotent payment requests so network retries cannot double-charge customers or duplicate bookings.
- **High-Density QR Admission Validation**: Tickets feature high-contrast QR codes and unique verification tokens with single-use entry enforcement (subsequent validation attempts return HTTP 409 Conflict).
- **Admin Command Center & Analytics**: Real-time sales metrics, Recharts visual analytics, schedule conflict collision detection, and an immutable audit trail.
- **Modern Dark Cinema Theme**: Black, deep navy (`#07090E`), and purple/violet neon accents with responsive mobile, tablet, and desktop layouts.

---

## 🚀 Live Access & Demo Credentials

The application runs locally on **`http://localhost:3000`**.

### 🔑 Test Accounts (1-Click Fill Available on Login Page)
| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@cinemahall.com` | `Admin@123` | Full Admin Console, Analytics, Scheduling, Theatres, Ticket Scanner, Audit Logs |
| **Customer 1** | `customer@cinemahall.com` | `Customer@123` | Browsing, Real-time Seat Hold, Checkout, Ticket Viewing, Cancellations |
| **Customer 2** | `priya.patel@example.com` | `Customer@123` | Browsing, Concurrency Testing, Order History |

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | **Next.js 14** (App Router, Server & Client Components, Server Actions) |
| **UI & Styling** | **React 18**, **Tailwind CSS**, **Lucide Icons** |
| **Visual Analytics** | **Recharts** (Sales trends, theatre occupancy comparisons) |
| **Database & ORM** | **Prisma ORM 6.4.0**, **PostgreSQL** / **SQLite** (zero-friction portable local setup) |
| **Authentication** | **JOSE** (Edge-ready signed JWT in HTTP-Only cookies), **bcryptjs** (10 salt rounds) |
| **Validation** | **Zod** schema validation for all API inputs and booking payloads |
| **Admission Passes** | **QRCode** generation with high-density boarding pass styling |
| **Testing Suite** | **Vitest 5.1.0** (Automated unit, integration, and concurrency conflict tests) |

---

## 🏗️ Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Customer & Admin Frontend (Next.js 14 App Router)"]
        A[Home & Movie Catalog] --> B[Movie Details & Date Picker]
        B --> C[Interactive Seat Selection Map]
        C --> D[Checkout & Simulated Payment Gateway]
        D --> E[Boarding Pass Ticket with QR]
        F[Customer Dashboard & Cancellations]
        G[Admin Console & Ticket Scanner]
    end

    subgraph Middleware["Auth & Security Layer"]
        H[JOSE JWT Auth Cookie]
        I[Role-Based Access Control - RBAC]
        J[Zod Input Validation]
    end

    subgraph Services["Core Business Logic Services"]
        K[Seat Locking Service - Temporary Holds & Auto-Purge]
        L[Booking Service - Idempotency & Transactions]
        M[Ticket Validator - Single-Use Admission Enforcement]
        N[Analytics & Financial Engine]
    end

    subgraph Database["Relational Database (Prisma ORM)"]
        O[(User)]
        P[(Movie & Genre)]
        Q[(Theatre & Screen)]
        R[(Seat & SeatCategory)]
        S[(Show & SeatHold)]
        T[(Booking & BookingSeat)]
        U[(Payment & Ticket)]
        V[(Cancellation & Refund)]
        W[(AuditLog)]
    end

    Client --> Middleware
    Middleware --> Services
    Services --> Database
```

---

## 📊 Database Schema & Entity Relationship (ER) Diagram

```mermaid
erDiagram
    User ||--o{ Booking : places
    User ||--o{ SeatHold : holds
    User ||--o{ AuditLog : performs
    Movie ||--o{ MovieGenre : categorizes
    Genre ||--o{ MovieGenre : belongs
    Movie ||--o{ Show : screens
    Theatre ||--o{ Screen : contains
    Screen ||--o{ Seat : houses
    Screen ||--o{ Show : hosts
    SeatCategory ||--o{ Seat : tiers
    Show ||--o{ SeatHold : reserves
    Show ||--o{ Booking : schedules
    Show ||--o{ BookingSeat : locks
    Seat ||--o{ SeatHold : reserved_as
    Seat ||--o{ BookingSeat : booked_as
    Booking ||--o{ BookingSeat : contains
    Booking ||--|| Payment : settles
    Booking ||--|| Ticket : generates
    Booking ||--o| Cancellation : cancels
    Cancellation ||--|| Refund : triggers
```

### Key Relational Constraints & ACID Guarantees
- **`BookingSeat` Unique Constraint**: `@@unique([showId, seatId])` enforces at the relational engine level that a physical seat can never have two active confirmed bookings for the same show.
- **`SeatHold` Unique Constraint**: `@@unique([showId, seatId])` ensures that only one customer can hold a seat at any given moment.
- **Idempotency Key**: `Booking.idempotencyKey` prevents double charges or duplicate booking records upon rapid multiple clicks or network retries.

---

## 🧪 Critical Acceptance Tests & Verification

CINELUXE includes automated test suites covering all 8 mandatory acceptance criteria:

```bash
npm test
```

### Automated Test Matrix
| Test Case | Description | Verification Method | Status |
| :--- | :--- | :--- | :--- |
| **Test 1** | Customer selects seat, holds it, and books it | `createSeatHold` + `confirmBooking` produces ticket & removes hold | **PASSED** |
| **Test 2** | Two customers cannot confirm the same seat | Concurrency conflict triggers `SEAT_ALREADY_HELD` & DB rollback | **PASSED** |
| **Test 3** | Expired seat holds release automatically | Artificially expired hold is purged; seat status reverts to `AVAILABLE` | **PASSED** |
| **Test 4** | Confirmed bookings remain unavailable | `getShowSeatAvailability` reports `BOOKED`; hold attempt is rejected | **PASSED** |
| **Test 5** | Ticket QR can only be validated once | 1st validation succeeds; 2nd duplicate attempt throws `TICKET_ALREADY_VALIDATED` | **PASSED** |
| **Test 6** | Reports reflect bookings and cancellations | Booking is cancelled, seats freed in `BookingSeat`, refund logged | **PASSED** |
| **Test 7** | Customers cannot access Admin APIs | Non-admin token triggers `FORBIDDEN_ADMIN_ONLY` error | **PASSED** |
| **Test 8** | Duplicate requests prevent duplicate bookings | Duplicate calls with identical `idempotencyKey` return original booking | **PASSED** |

---

## 💻 Local Installation & Setup Guide

### 1. Prerequisites
- **Node.js** v18+ or v20+ or v24+
- **npm** v9+

### 2. Clone and Install Dependencies
```bash
git clone <repository-url>
cd "Cinema Hall Ticket Booking System"
npm install --legacy-peer-deps
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` configuration (Zero-friction local setup):
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="algions-cinema-secret-token-key-2026-production-ready"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 4. Database Setup & Realistic Seeding
Run database generation and seed script:
```bash
npx prisma db push
npm run seed
```
This automatically seeds:
- 1 Administrator account and 3 Customer accounts
- 3 Luxury Cinema Theatres (PVR Luxe, INOX Cinepolis, Miraj Premiere)
- 7 Screens with full seat layouts across 3 tiers (Silver, Gold, VIP Recliner)
- 11 Realistic Movies with genres, posters, and cast information
- 84 Scheduled Showtimes across the next 3 days
- Sample confirmed, scanned, and cancelled bookings with payment records

### 5. Launch the Application
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 6. Run the Test Suite
```bash
npm test
```

---

## 🚢 Production Deployment to PostgreSQL

The codebase is written with full Prisma PostgreSQL compatibility:
1. In `prisma/schema.prisma`, update `datasource db`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   *(Or use the pre-configured `prisma/schema.postgresql.prisma`)*
2. Provide your PostgreSQL connection string in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/cinemadb?sslmode=require"
   ```
3. Run migrations and seed:
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```

---

## 📋 API Specification Summary

### Authentication Endpoints
- `POST /api/auth/register` — Registers customer with hashed password.
- `POST /api/auth/login` — Authenticates credentials, issues secure HTTP-only JWT cookie.
- `POST /api/auth/logout` — Invalidates user session cookie.
- `GET /api/auth/me` — Retrieves current session payload.

### Catalog & Seating Endpoints
- `GET /api/movies` — Lists movies with search, genre, and format filters.
- `GET /api/movies/[id]` — Retrieves movie details and available showtimes by theatre.
- `GET /api/shows/[id]/seats` — Returns real-time seat status (`AVAILABLE`, `HELD`, `BOOKED`).
- `POST /api/shows/[id]/hold` — Acquires atomic temporary hold on seats (5 min expiry).
- `POST /api/shows/[id]/release-hold` — Manually releases a hold.

### Booking & Validation Endpoints
- `POST /api/checkout/confirm` — Confirms booking, simulates payment, generates QR ticket.
- `GET /api/bookings/[id]` — Retrieves booking boarding pass and ticket QR.
- `POST /api/bookings/[id]/cancel` — Cancels booking (up to 2h before showtime), calculates refund.
- `POST /api/tickets/validate` — Validates ticket QR for gate entry (single-use constraint).

### Protected Admin Endpoints (`role: "ADMIN"`)
- `GET /api/admin/analytics` — KPI cards, 7-day revenue trend, top 5 movies.
- `GET /api/admin/movies` & `POST /api/admin/movies` — Movie CRUD operations.
- `GET /api/admin/theatres` & `POST /api/admin/theatres` — Venue and auditorium configuration.
- `GET /api/admin/shows` & `POST /api/admin/shows` — Showtime scheduling with collision avoidance.
- `GET /api/admin/bookings` — Filterable transaction ledger.
- `GET /api/admin/reports` — Periodic sales, movie-wise & theatre-wise occupancy.
- `GET /api/admin/audit` — Immutable system audit trail.

---

## 🎯 Assumptions & Known Boundaries
1. **Payment Simulation**: To enable friction-free assessment without real bank credentials or paid third-party gateway keys, payments are simulated with explicit Success, Decline, and Cancellation scenarios.
2. **Cancellation Policy**: Cancellations and automated simulated refunds are permitted up to 2 hours prior to the scheduled showtime.
3. **Auditorium Capacity**: Default screens are configured with 48 seats (Silver, Gold, VIP Recliners) to ensure fast visual rendering and accessible seat maps on both desktop and mobile.

---

**Developed for ALGIONS AI LABS PRIVATE LIMITED Full-Stack Web Development Assessment.**
