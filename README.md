# Medbook — Patient Booking System

A full-stack appointment booking flow built with Next.js 14, featuring a patient-facing booking wizard and a physician admin dashboard.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No environment variables or database setup required — everything runs in memory out of the box.

---

## What's Here

### Patient Flow (`/patient`)
A 4-step booking wizard:
1. **Choose a physician** — Browse doctors by name, specialty, and bio
2. **Pick a time** — Date tabs + time grid showing availability per physician
3. **Enter details** — Name, email, phone, and reason for visit (with inline validation)
4. **Confirmation** — Summary card with appointment ID and pending status

### Admin Dashboard (`/admin`)
- Live list of all appointments with status badges (pending / confirmed / cancelled)
- Filter by status with live counts
- One-click confirm or cancel directly from the list
- Slide-out detail drawer with full patient info and action buttons
- Refresh button to pull latest data

### API Routes
| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/physicians` | List all physicians |
| `GET` | `/api/physicians/:id` | Available slots grouped by date |
| `GET` | `/api/appointments` | All appointments (newest first) |
| `POST` | `/api/appointments` | Create a new appointment |
| `PATCH` | `/api/appointments/:id` | Update appointment status |

---

## Technical Decisions

**Next.js App Router (fullstack)**
Single repo for client and server. API routes live alongside pages, which keeps the project simple to run and review without a separate backend process.

**In-memory store with `globalThis`**
Appointments and slot availability are stored in a module-level object pinned to `globalThis`. This survives Next.js hot reloads in development while keeping setup frictionless — no Docker, no migrations. A comment in `lib/store.ts` marks exactly where you'd swap in a real database.

**Slot generation at startup**
Available slots are generated programmatically for the next 14 days based on each physician's `availableDays` schedule. This avoids the overhead of seeding a database while producing realistic, dynamic data.

**Slot locking on book**
When a patient books a slot, it's immediately marked `booked: true` in the store. If a cancel comes in via the admin dashboard, the slot is freed for rebooking. This prevents double-booking without needing transactions.

**No authentication**
The spec explicitly excludes auth. In production, the admin dashboard would be protected (e.g. NextAuth with role-based access), and patients would optionally sign in to see their booking history.

---

## What I'd Add With More Time

- **Persistence** — SQLite via Prisma would be a 30-minute lift and give real durability across restarts
- **Email notifications** — Transactional email (Resend or Postmark) when a booking is created or confirmed
- **Auth** — NextAuth for physician login; optional patient accounts to see booking history
- **Optimistic UI** — Status updates on the admin dashboard feel instant with optimistic state before the API responds
- **Calendar view** — A week-grid view on the admin side for at-a-glance scheduling
- **Search & sort** — Patient name search and date-range filtering on the dashboard
- **Timezone handling** — Store UTC, display in the physician's local timezone
- **Tests** — API route unit tests with Jest; Playwright E2E for the booking flow
