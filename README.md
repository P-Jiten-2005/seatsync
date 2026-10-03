# SeatSync

A smart restaurant table management system built with React. Handles customer queue check-ins, real-time floor map tracking, automated table slot timers, and a manager analytics dashboard — all in-browser with no backend required.

## Screenshots

| Login | Staff Dashboard | Kiosk |
|---|---|---|
| Restaurant + role selector | Color-coded floor map with live timers | Customer self check-in |

| Display Board | Manager Dashboard | Analytics |
|---|---|---|
| TV queue screen | Full floor + 4 management tabs | Session history & stats |

## Features

- **Floor Map** — 12 color-coded tables per restaurant (green / red / yellow / orange warning)
- **Live Countdown Timers** — each booking is a rolling 1.5 hr slot; tables auto-move to "cleaning" when time expires
- **Customer Queue** — kiosk check-in issues zero-padded tokens (`#001`); queue resets at midnight per restaurant
- **TV Display** — public screen at `/display?r=r1` shows "Now Serving" and the full waiting queue
- **Role-Based Access** — waiters manage the floor; managers get session history, audit log, analytics, and timer overrides
- **Audit Log** — every action (allocation, status change, auto-clean, timer override) is logged with actor and timestamp
- **Demo Seed Data** — loads with a realistic mid-service state so the app feels live immediately

## Tech Stack

| | |
|---|---|
| **Framework** | React 18 + Vite 5 |
| **Routing** | React Router v6 |
| **Styling** | Tailwind CSS v3 |
| **Icons** | lucide-react |
| **Toasts** | react-hot-toast |
| **State** | React Context (no Redux) |
| **Backend** | None — all in-memory |

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and log in with any restaurant + the credentials below.

**Kamat** (restaurant 1) loads with pre-populated seed data — occupied tables, a cleaning queue, and 3 customers waiting.

## Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Login — restaurant picker, role toggle, password |
| `/kiosk` | Public | Customer self check-in; issues a queue token |
| `/display?r=r1` | Public | TV queue board — "Now Serving" + waiting list |
| `/staff` | Waiter / Manager | Floor map, queue panel, table actions |
| `/manager` | Manager only | Floor + Sessions + Audit Log + Analytics + Table Settings |

## Table Status Flow

```
available → occupied → cleaning → available
```

- **available → occupied** — waiter allocates a queued token to the table
- **occupied → cleaning** — automatic when the 1.5 hr slot expires (30 s polling loop), or manual
- **cleaning → available** — waiter marks the table cleaned

Color coding: green (available) · red (occupied) · yellow (cleaning) · orange border (< 15 min left)

## Project Structure

```
src/
  data/           restaurants, tables, users, seed data
  context/        AuthContext, TableContext (timer loop lives here)
  pages/          Login, Kiosk, Display, Staff, Manager
  components/
    FloorMap/     FloorMap, TableCard
    Queue/        QueuePanel, TokenCard
    Kiosk/        CheckInForm, TokenDisplay
    Manager/      SessionHistory, AuditLog, Analytics, TableEditor
    shared/       Navbar, StatusBadge, Timer
  hooks/          useTableActions, useQueue
  utils/          allocation (best-fit), timeUtils (countdown, formatting)
```

## Data Models

**Table** — `id · restaurantId · number · capacity · status · currentToken · checkInTime · slotEnd · cleaningStartTime`

**Token** — `id · tokenNumber · customerName · phone · partySize · restaurantId · status · createdAt · tableId`

**Session** — `id · tableId · tokenId · checkInTime · checkOutTime · partySize · waiterId`

**AuditLog** — `id · action · tableId · userId · timestamp · fromStatus · toStatus`

## Notes

- No backend — all state is React Context, seeded from `src/data/`. Refreshing the page resets to the demo state.
- Timer loop runs client-side every 30 seconds inside `TableContext`.
- Token numbers are zero-padded integers scoped per restaurant, resetting at midnight.
- The `reserved` status (blue in the color legend) is display-only — tokens assigned to a table show blue on the kiosk/display before the customer is seated.
