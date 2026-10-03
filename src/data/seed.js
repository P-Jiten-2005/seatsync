// Demo seed data for restaurant r1 (The Golden Fork)
// Gives a realistic mid-service state on first load.
// All times are relative to Date.now() so the app feels live.

const now = Date.now()
const min = 60_000

// ─── Table overrides (r1 only) ────────────────────────────────────────────────
// Merged on top of base tables in TableContext initial state.
export const seedTableOverrides = {
  'r1-t3':  { status: 'occupied',  currentToken: 'sd-t4', checkInTime: new Date(now - 80*min), slotEnd: new Date(now + 10*min), cleaningStartTime: null },
  'r1-t4':  { status: 'cleaning',  cleaningStartTime: new Date(now - 8*min) },
  'r1-t5':  { status: 'occupied',  currentToken: 'sd-t5', checkInTime: new Date(now - 45*min), slotEnd: new Date(now + 45*min), cleaningStartTime: null },
  'r1-t7':  { status: 'occupied',  currentToken: 'sd-t6', checkInTime: new Date(now - 60*min), slotEnd: new Date(now + 30*min), cleaningStartTime: null },
  'r1-t9':  { status: 'occupied',  currentToken: 'sd-t7', checkInTime: new Date(now - 30*min), slotEnd: new Date(now + 60*min), cleaningStartTime: null },
  'r1-t10': { status: 'cleaning',  cleaningStartTime: new Date(now - 5*min)  },
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
export const seedTokens = [
  // Done — from completed sessions earlier today
  { id: 'sd-t1',  tokenNumber: '001', customerName: 'Claire Fontaine',  phone: '', partySize: 2, restaurantId: 'r1', status: 'done',    createdAt: new Date(now - 152*min), tableId: 'r1-t1' },
  { id: 'sd-t2',  tokenNumber: '002', customerName: 'The Garcia Party', phone: '', partySize: 4, restaurantId: 'r1', status: 'done',    createdAt: new Date(now - 137*min), tableId: 'r1-t6' },
  { id: 'sd-t3',  tokenNumber: '003', customerName: 'James Okafor',     phone: '', partySize: 2, restaurantId: 'r1', status: 'done',    createdAt: new Date(now - 122*min), tableId: 'r1-t2' },
  // Seated — currently at tables
  { id: 'sd-t4',  tokenNumber: '004', customerName: 'Sophie Anderson',  phone: '', partySize: 2, restaurantId: 'r1', status: 'seated',  createdAt: new Date(now -  83*min), tableId: 'r1-t3' },
  { id: 'sd-t5',  tokenNumber: '005', customerName: 'Marcus Chen',      phone: '', partySize: 3, restaurantId: 'r1', status: 'seated',  createdAt: new Date(now -  48*min), tableId: 'r1-t5' },
  { id: 'sd-t6',  tokenNumber: '006', customerName: 'Johnson & Party',  phone: '', partySize: 4, restaurantId: 'r1', status: 'seated',  createdAt: new Date(now -  63*min), tableId: 'r1-t7' },
  { id: 'sd-t7',  tokenNumber: '007', customerName: 'Rivera Family',    phone: '', partySize: 5, restaurantId: 'r1', status: 'seated',  createdAt: new Date(now -  33*min), tableId: 'r1-t9' },
  // Waiting — in queue
  { id: 'sd-t8',  tokenNumber: '008', customerName: "Patrick O'Brien",  phone: '', partySize: 2, restaurantId: 'r1', status: 'waiting', createdAt: new Date(now -  15*min), tableId: null },
  { id: 'sd-t9',  tokenNumber: '009', customerName: 'Yuki Tanaka',      phone: '', partySize: 4, restaurantId: 'r1', status: 'waiting', createdAt: new Date(now -   8*min), tableId: null },
  { id: 'sd-t10', tokenNumber: '010', customerName: 'The Patel Party',  phone: '', partySize: 6, restaurantId: 'r1', status: 'waiting', createdAt: new Date(now -   3*min), tableId: null },
]

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const seedSessions = [
  // Completed
  { id: 'sd-s1', tableId: 'r1-t1', tokenId: 'sd-t1', checkInTime: new Date(now - 150*min), checkOutTime: new Date(now -  20*min), partySize: 2, waiterId: 'u2' },
  { id: 'sd-s2', tableId: 'r1-t6', tokenId: 'sd-t2', checkInTime: new Date(now - 135*min), checkOutTime: new Date(now -  45*min), partySize: 4, waiterId: 'u3' },
  { id: 'sd-s3', tableId: 'r1-t2', tokenId: 'sd-t3', checkInTime: new Date(now - 120*min), checkOutTime: new Date(now -  30*min), partySize: 2, waiterId: 'u2' },
  // Active
  { id: 'sd-s4', tableId: 'r1-t3', tokenId: 'sd-t4', checkInTime: new Date(now -  80*min), checkOutTime: null, partySize: 2, waiterId: 'u3' },
  { id: 'sd-s5', tableId: 'r1-t5', tokenId: 'sd-t5', checkInTime: new Date(now -  45*min), checkOutTime: null, partySize: 3, waiterId: 'u2' },
  { id: 'sd-s6', tableId: 'r1-t7', tokenId: 'sd-t6', checkInTime: new Date(now -  60*min), checkOutTime: null, partySize: 4, waiterId: 'u3' },
  { id: 'sd-s7', tableId: 'r1-t9', tokenId: 'sd-t7', checkInTime: new Date(now -  30*min), checkOutTime: null, partySize: 5, waiterId: 'u2' },
]

// ─── Audit log ────────────────────────────────────────────────────────────────
export const seedAuditLog = [
  // Early sessions
  { id: 'sd-al-01',  action: 'TABLE_ALLOCATED',  tableId: 'r1-t1', userId: 'u2', timestamp: new Date(now - 150*min), fromStatus: 'available', toStatus: 'occupied'  },
  { id: 'sd-al-02',  action: 'TABLE_ALLOCATED',  tableId: 'r1-t6', userId: 'u3', timestamp: new Date(now - 135*min), fromStatus: 'available', toStatus: 'occupied'  },
  { id: 'sd-al-03',  action: 'TABLE_ALLOCATED',  tableId: 'r1-t2', userId: 'u2', timestamp: new Date(now - 120*min), fromStatus: 'available', toStatus: 'occupied'  },
  // Completions for early sessions
  { id: 'sd-al-04',  action: 'STATUS_CHANGED',   tableId: 'r1-t1', userId: 'u3', timestamp: new Date(now -  22*min), fromStatus: 'occupied',  toStatus: 'cleaning'  },
  { id: 'sd-al-05',  action: 'STATUS_CHANGED',   tableId: 'r1-t1', userId: 'u2', timestamp: new Date(now -  18*min), fromStatus: 'cleaning',  toStatus: 'available' },
  { id: 'sd-al-06',  action: 'STATUS_CHANGED',   tableId: 'r1-t6', userId: 'u2', timestamp: new Date(now -  47*min), fromStatus: 'occupied',  toStatus: 'cleaning'  },
  { id: 'sd-al-07',  action: 'STATUS_CHANGED',   tableId: 'r1-t6', userId: 'u3', timestamp: new Date(now -  43*min), fromStatus: 'cleaning',  toStatus: 'available' },
  { id: 'sd-al-08',  action: 'STATUS_CHANGED',   tableId: 'r1-t2', userId: 'u3', timestamp: new Date(now -  32*min), fromStatus: 'occupied',  toStatus: 'cleaning'  },
  { id: 'sd-al-09',  action: 'STATUS_CHANGED',   tableId: 'r1-t2', userId: 'u2', timestamp: new Date(now -  28*min), fromStatus: 'cleaning',  toStatus: 'available' },
  // Active sessions allocated
  { id: 'sd-al-10',  action: 'TABLE_ALLOCATED',  tableId: 'r1-t3', userId: 'u3', timestamp: new Date(now -  80*min), fromStatus: 'available', toStatus: 'occupied'  },
  { id: 'sd-al-11',  action: 'TABLE_ALLOCATED',  tableId: 'r1-t7', userId: 'u2', timestamp: new Date(now -  60*min), fromStatus: 'available', toStatus: 'occupied'  },
  { id: 'sd-al-12',  action: 'TABLE_ALLOCATED',  tableId: 'r1-t5', userId: 'u3', timestamp: new Date(now -  45*min), fromStatus: 'available', toStatus: 'occupied'  },
  { id: 'sd-al-13',  action: 'TABLE_ALLOCATED',  tableId: 'r1-t9', userId: 'u2', timestamp: new Date(now -  30*min), fromStatus: 'available', toStatus: 'occupied'  },
  // T4 auto-cleaned (its previous session ended via timer)
  { id: 'sd-al-14',  action: 'AUTO_CLEANING',    tableId: 'r1-t4', userId: 'system', timestamp: new Date(now - 8*min), fromStatus: 'occupied',  toStatus: 'cleaning'  },
  // T10 manually marked for cleaning
  { id: 'sd-al-15',  action: 'STATUS_CHANGED',   tableId: 'r1-t10', userId: 'u3', timestamp: new Date(now - 5*min), fromStatus: 'occupied',  toStatus: 'cleaning'  },
]
