# CINELUXE REST API Specification

Comprehensive documentation of all public and administrative API routes for the Cinema Hall Ticket Booking System.

---

## 1. Authentication & Session

### `POST /api/auth/register`
Creates a new customer account.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password@123",
    "phone": "+91 9876543210"
  }
  ```
- **Responses**:
  - `201 Created`: Returns user object and sets `cinema_token` HTTP-only cookie.
  - `400 Bad Request`: Validation failure.
  - `409 Conflict`: Email already exists.

### `POST /api/auth/login`
Authenticates user and issues signed JWT session.
- **Request Body**:
  ```json
  {
    "email": "customer@cinemahall.com",
    "password": "Customer@123"
  }
  ```
- **Responses**:
  - `200 OK`: Sets session cookie and returns user role.
  - `401 Unauthorized`: Invalid credentials.

### `POST /api/auth/logout`
Clears the `cinema_token` session cookie.

### `GET /api/auth/me`
Retrieves currently logged in user profile.

---

## 2. Movies & Showtimes

### `GET /api/movies`
Returns active movies with optional search and filters.
- **Query Parameters**:
  - `search` (string): Text query across title, synopsis, director, or cast.
  - `genre` (string): Filter by genre slug (e.g. `action`, `sci-fi`).
  - `language` (string): Filter by language.
  - `format` (string): Filter by format (e.g. `IMAX 3D`).
- **Response**: Array of movies with upcoming show counts.

### `GET /api/movies/[id]`
Returns movie details and shows grouped by theatre.
- **Query Parameters**:
  - `date` (string, `YYYY-MM-DD`): Filter shows on a specific date.
  - `city` (string): Filter by theatre city.

### `GET /api/shows/[id]/seats`
Returns real-time seating availability for the show. Expired holds are automatically purged before generating response.
- **Response Payload**:
  ```json
  {
    "success": true,
    "show": { ... },
    "seats": [
      {
        "id": "cuid-seat-1",
        "row": "A",
        "number": 1,
        "categoryId": "cuid-cat-silver",
        "categoryName": "Silver",
        "categoryCode": "SILVER",
        "price": 200,
        "status": "AVAILABLE"
      }
    ],
    "summary": { "total": 48, "available": 42, "held": 2, "booked": 4 }
  }
  ```

---

## 3. Concurrency Seat Locking & Checkout

### `POST /api/shows/[id]/hold`
Locks selected seats for 5 minutes.
- **Headers**: Requires authentication cookie.
- **Request Body**:
  ```json
  {
    "seatIds": ["seat-cuid-1", "seat-cuid-2"]
  }
  ```
- **Responses**:
  - `200 OK`: Returns `holdToken`, `expiresAt`, and reserved `seatIds`.
  - `409 Conflict`: Seat is already held by another user or booked.

### `POST /api/shows/[id]/release-hold`
Manually releases a hold.
- **Request Body**: `{ "holdToken": "HOLD-XXXXX" }`

### `POST /api/checkout/confirm`
Completes booking confirmation and generates QR ticket pass.
- **Request Body**:
  ```json
  {
    "holdToken": "HOLD-ABCD1234",
    "paymentMethod": "CARD",
    "idempotencyKey": "idemp-unique-token",
    "simulatePaymentStatus": "SUCCESS"
  }
  ```
- **Responses**:
  - `200 OK`: Confirmed booking with Ticket, Payment, and QR Data URL.
  - `402 Payment Required`: Simulated payment decline.
  - `409 Conflict`: Concurrency race condition detected.
  - `410 Gone`: Seat hold expired before checkout.

---

## 4. Bookings & Cancellations

### `GET /api/bookings/[id]`
Retrieves full booking details, seats, and QR boarding pass.

### `POST /api/bookings/[id]/cancel`
Cancels booking and triggers automated refund if >= 2 hours before showtime.
- **Request Body**:
  ```json
  {
    "reason": "Customer travel emergency"
  }
  ```

### `POST /api/tickets/validate`
Validates QR ticket token for admission.
- **Enforces single-use admission**:
  - 1st validation: `200 OK` (Ticket marked as validated).
  - 2nd validation: `409 Conflict` (`TICKET_ALREADY_VALIDATED`).

---

## 5. Protected Administrative Routes (`role: "ADMIN"`)

- `GET /api/admin/analytics`: Box office KPI metrics, revenue charts, and popular movies.
- `GET /api/admin/movies` & `POST /api/admin/movies`: Catalogue movie management.
- `GET /api/admin/theatres` & `POST /api/admin/theatres`: Venue and screen management.
- `GET /api/admin/shows` & `POST /api/admin/shows`: Showtime scheduling with schedule collision prevention.
- `GET /api/admin/bookings`: Transaction records and refund summaries.
- `GET /api/admin/reports`: Periodic sales and auditorium occupancy percentages.
- `GET /api/admin/audit`: Immutable system audit trail.
