# SeatSync — Project Plan

## Overview

SeatSync is a Smart Restaurant Table Management System built as a React SPA.
No backend. All state is in-memory React Context, seeded from mock data files.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Bundler | Vite 5 |
| UI | React 18 + JSX |
| Styling | Tailwind CSS v3 + PostCSS |
| Routing | React Router v6 |
| Toasts | react-hot-toast |
| Icons | lucide-react |
| State | React Context (AuthContext + TableContext) |
| Time | Native Date + custom utils (no date-fns) |

---

## Routes

| Path | Page | Auth |
|---|---|---|
| `/` | Login | Public |
| `/kiosk` | Customer check-in | Public |
| `/display` | TV queue board | Public |
| `/staff` | Waiter dashboard | Requires `waiter` or `manager` role |
| `/manager` | Manager dashboard | Requires `manager` role |

---

## Data Models

### Restaurant
```js
{ id, name, location }
```

### Table
```js
{
  id,
  restaurantId,
  number,        // 1–12
  capacity,      // 2 | 4 | 6
  status,        // "available" | "occupied" | "cleaning"
  currentToken,  // tokenId or null
  checkInTime,   // Date or null
  slotEnd,       // Date or null (checkInTime + 90 min)
  cleaningStartTime // Date or null
}
```

### Token
```js
{
  id,
  tokenNumber,   // zero-padded integer, e.g. "001"
  customerName,
  phone,
  partySize,
  restaurantId,
  status,        // "waiting" | "seated" | "done" | "expired"
  createdAt,     // Date
  tableId        // null until allocated
}
```

### User
```js
{ id, name, role, restaurantId, password }
```
Roles: `"waiter"` | `"manager"`

### Session
```js
{
  id,
  tableId,
  tokenId,
  checkInTime,
  checkOutTime,  // null while active
  partySize,
  waiterId       // userId of the person who allocated/closed
}
```

### AuditLog
```js
{
  id,
  action,        // e.g. "TABLE_ALLOCATED", "STATUS_CHANGED", "TIMER_OVERRIDDEN"
  tableId,
  userId,        // waiter or manager
  timestamp,     // Date
  fromStatus,
  toStatus
}
```

---

## Mock Data

- **5 restaurants**, each with:
  - 12 tables: 4× capacity-2, 4× capacity-4, 4× capacity-6
  - 3 users: 1 manager + 2 waiters
  - Hardcoded passwords

---

## Table Status Flow

```
available ──► occupied ──► cleaning ──► available
```

- `available → occupied`: waiter allocates a queued token to the table (customer checks in)
- `occupied → cleaning`: automatic when `slotEnd` passes (timer loop in TableContext), or waiter/manager triggers it manually
- `cleaning → available`: waiter marks table as cleaned

**Timer**: TableContext runs a `setInterval` every 30 seconds. Any occupied table past its `slotEnd` is auto-transitioned to `cleaning`.

**Reserved (display only)**: A token that has been assigned a table but not yet seated shows blue on the kiosk/display. This is not a formal table status.

---

## Color System

| Status | Color |
|---|---|
| Available | Green |
| Occupied | Red |
| Cleaning | Yellow |
| Reserved (display only) | Blue |
| Timer warning (< 15 min remaining) | Orange border on occupied table |

---

## Folder Structure

```
src/
  data/
    restaurants.js      ← 5 restaurant objects
    tables.js           ← 60 table objects (12 per restaurant)
    users.js            ← 15 user objects (3 per restaurant)
  context/
    AuthContext.jsx     ← login, logout, current user + restaurant
    TableContext.jsx    ← tables, tokens, sessions, audit log, timer loop
  pages/
    Login.jsx
    Kiosk.jsx
    Display.jsx
    Staff.jsx
    Manager.jsx
  components/
    FloorMap/
      FloorMap.jsx      ← 12-table grid
      TableCard.jsx     ← single table tile with status color + timer
    Queue/
      QueuePanel.jsx    ← waiting tokens list
      TokenCard.jsx     ← single queue entry
    Kiosk/
      CheckInForm.jsx   ← name, phone, party size form
      TokenDisplay.jsx  ← confirmation screen with token number
    Manager/
      SessionHistory.jsx
      AuditLog.jsx
      Analytics.jsx
      TableEditor.jsx   ← capacity / timer override
    shared/
      Navbar.jsx
      StatusBadge.jsx
      Timer.jsx         ← countdown display
  hooks/
    useTableActions.js  ← allocate, clean, override timer
    useQueue.js         ← waiting token list for current restaurant
  utils/
    allocation.js       ← best-fit table suggestion logic
    timeUtils.js        ← slot calculations, countdown formatting
  App.jsx               ← router + route guards
  main.jsx
```

---

## Build Phases

| Phase | Status | Produces |
|---|---|---|
| **1** | ✅ Done | Vite scaffold, Tailwind, Router, mock data files |
| **2** | ✅ Done | AuthContext, TableContext, App.jsx routing skeleton |
| **3** | ✅ Done | Login.jsx |
| **4** | ✅ Done | Staff.jsx — floor map + queue panel (first working screen) |
| **5** | ✅ Done | Kiosk.jsx |
| **6** | ✅ Done | Display.jsx |
| **7** | ✅ Done | Manager.jsx |
| **8** | ✅ Done | Polish: toasts, demo seed data, responsive tweaks |

---

## Design Decisions

- **Token numbers** are zero-padded integers scoped per restaurant, resetting at midnight (`001`, `002`, …).
- **AuditLog userId** covers both waiters and managers (the label "waiterId" in the spec is treated as the actor's userId).
- **Reserved** is a display-only concept — no formal table status, avoiding flow breakage.
- **Tailwind v3** used for stability; upgrade to v4 is possible but not planned.
- **No external date library** — all time logic lives in `src/utils/timeUtils.js`.
