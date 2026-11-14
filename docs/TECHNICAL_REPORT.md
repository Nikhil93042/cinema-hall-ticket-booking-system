# CINELUXE — Comprehensive Technical Report
**Candidate Assessment Deliverable for ALGIONS AI LABS PRIVATE LIMITED**

---

## 1. Executive Summary

The **CINELUXE Cinema Hall Ticket Booking System** is an enterprise-grade full-stack web application engineered to solve the complex concurrency, data integrity, and user experience challenges inherent in high-volume movie ticketing platforms.

Unlike basic prototypes that rely on client-side state or optimistic assumptions, CINELUXE implements:
1. **Pessimistic-guaranteed concurrency control** via relational database transactions and unique constraints.
2. **Automatic expiration management** for temporary seat holds.
3. **Idempotency guards** against duplicate booking requests.
4. **Digital admission integrity** with non-repeatable QR validation.
5. **Real-time administrative analytics** powered by Recharts and relational aggregation queries.

---

## 2. Concurrency Architecture & Double-Booking Prevention

### The Race Condition Problem
In cinema ticketing platforms during peak release windows (e.g., opening weekend IMAX tickets), thousands of customers simultaneously attempt to book the exact same high-demand seats. If handled purely in memory or with simple `UPDATE` queries without locks, two customers could purchase the same seat, leading to physical venue disputes and reputational damage.

### The CINELUXE Multi-Tier Solution
CINELUXE utilizes a 3-tier safety barrier:

```
[Layer 1: Real-time Hold Acquisition]
  └─ Prisma $transaction checks both confirmed bookings and active holds.
  └─ Writes to `SeatHold` table with `@@unique([showId, seatId])`.
  └─ Sets `expiresAt = NOW() + 5 minutes`.

[Layer 2: Query-time & Background Expiry Purge]
  └─ Before any availability check or hold operation, expired holds (`expiresAt < NOW()`) are purged.
  └─ No orphaned locks can permanently block seats.

[Layer 3: Relational Database Unique Constraint Enforcement]
  └─ `BookingSeat` model defines: `@@unique([showId, seatId])`.
  └─ Even in extreme split-second network races during checkout confirmation, the database engine enforces atomic exclusion. Only one transaction succeeds; the other transaction rolls back cleanly with a concurrency conflict error.
```

---

## 3. Idempotency & Simulated Payment Processing

Network volatility and impatient users frequently cause double clicks on "Pay Now" buttons.

### Idempotency Mechanism
1. Upon checkout initiation, an `idempotencyKey` is generated (`idemp-${holdToken}-${UUID}`).
2. `confirmBooking()` queries for an existing booking matching the key before executing payment logic.
3. If found, the existing booking is returned immediately with `{ isIdempotentReplay: true }`, completely preventing duplicate billing or multiple ticket records.

### Payment Simulation Modes
To permit testing without commercial payment credentials:
- **`SUCCESS`**: Simulates successful bank clearance, creates `Payment` (`status: "SUCCESS"`), and generates the `Ticket` pass.
- **`FAILED`**: Simulates bank decline, records an audit entry, preserves the hold for user retry.
- **`CANCELLED`**: Simulates user aborting at gateway, immediately releases seat holds back into the available pool.

---

## 4. Digital Admission Pass & QR Security

1. **Token Generation**: Each confirmed booking generates a unique ticket reference (`TKT-YYYY-XXXXX`) and an encrypted JSON payload.
2. **QR Code Rendering**: Generated server-side using `qrcode` with contrast-optimized data URIs.
3. **Single-Use Admission Guard**:
   - The `Ticket` table stores `isValidated: Boolean`, `validatedAt: DateTime`, and `validatedBy: String`.
   - Gate ushers scan or input ticket tokens at `/admin/validate`.
   - Upon first validation, the record updates and an audit entry is created.
   - Any second validation attempt returns `409 Conflict` with the exact historical check-in timestamp and operator ID.

---

## 5. Security & RBAC Implementation

1. **Authentication**: Edge-compatible JSON Web Tokens signed with HMAC-SHA256 using `jose`, stored in `httpOnly`, `sameSite: "lax"` secure cookies.
2. **Password Security**: Passwords hashed with `bcryptjs` using 10 salt rounds. Plaintext passwords are never logged or stored.
3. **Role-Based Access Control**:
   - Customer routes enforce user authentication.
   - Administrative APIs (`/api/admin/*`) and pages (`/admin/*`) strictly enforce `requireAdmin()`.
   - Unauthorized attempts return `403 Forbidden` and redirect to login.

---

## 6. Automated Testing Verification (Vitest)

The test suite in `tests/acceptance.test.ts` validates all 8 mandatory acceptance criteria:
- **Test 1**: Complete checkout and booking flow.
- **Test 2**: Concurrency conflict rejection between two competing users.
- **Test 3**: Automatic release of expired seat holds.
- **Test 4**: Immutability of booked seats.
- **Test 5**: Single-use ticket QR validation and rejection of duplicates.
- **Test 6**: Accuracy of financial reports after bookings and cancellations.
- **Test 7**: Customer exclusion from administrative functions.
- **Test 8**: Prevention of duplicate bookings via idempotency.

All 8 tests pass with 100% success rate.
