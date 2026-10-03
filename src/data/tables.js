// 12 tables per restaurant: 4× capacity-2, 4× capacity-4, 4× capacity-6
// Capacities are laid out as: tables 1-4 = 2 seats, 5-8 = 4 seats, 9-12 = 6 seats
// status: "available" | "occupied" | "cleaning"
// All fields except id/restaurantId/number/capacity are runtime state (managed by TableContext)

function makeTables(restaurantId) {
  const capacities = [2, 2, 2, 2, 4, 4, 4, 4, 6, 6, 6, 6]
  return capacities.map((capacity, i) => ({
    id: `${restaurantId}-t${i + 1}`,
    restaurantId,
    number: i + 1,
    capacity,
    status: 'available',
    currentToken: null,
    checkInTime: null,
    slotEnd: null,
    cleaningStartTime: null,
  }))
}

export const tables = [
  ...makeTables('r1'),
  ...makeTables('r2'),
  ...makeTables('r3'),
  ...makeTables('r4'),
  ...makeTables('r5'),
]
