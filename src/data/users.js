// 3 users per restaurant: 1 manager + 2 waiters
// Passwords are hardcoded plaintext (demo only — no real auth)
export const users = [
  // The Golden Fork (r1)
  { id: 'u1',  name: 'Alice Morgan',  role: 'manager', restaurantId: 'r1', password: 'manager1' },
  { id: 'u2',  name: 'Ben Carter',    role: 'waiter',  restaurantId: 'r1', password: 'waiter1'  },
  { id: 'u3',  name: 'Carla Diaz',    role: 'waiter',  restaurantId: 'r1', password: 'waiter2'  },

  // Casa Mia (r2)
  { id: 'u4',  name: 'David Lin',     role: 'manager', restaurantId: 'r2', password: 'manager1' },
  { id: 'u5',  name: 'Eva Russo',     role: 'waiter',  restaurantId: 'r2', password: 'waiter1'  },
  { id: 'u6',  name: 'Felix Torres',  role: 'waiter',  restaurantId: 'r2', password: 'waiter2'  },

  // Sakura Garden (r3)
  { id: 'u7',  name: 'Grace Kim',     role: 'manager', restaurantId: 'r3', password: 'manager1' },
  { id: 'u8',  name: 'Hiro Tanaka',   role: 'waiter',  restaurantId: 'r3', password: 'waiter1'  },
  { id: 'u9',  name: 'Isla Park',     role: 'waiter',  restaurantId: 'r3', password: 'waiter2'  },

  // The Rustic Barrel (r4)
  { id: 'u10', name: 'Jack Brennan',  role: 'manager', restaurantId: 'r4', password: 'manager1' },
  { id: 'u11', name: 'Kara Novak',    role: 'waiter',  restaurantId: 'r4', password: 'waiter1'  },
  { id: 'u12', name: 'Leo Ferreira',  role: 'waiter',  restaurantId: 'r4', password: 'waiter2'  },

  // Blue Horizon (r5)
  { id: 'u13', name: 'Mia Okafor',    role: 'manager', restaurantId: 'r5', password: 'manager1' },
  { id: 'u14', name: 'Nate Singh',    role: 'waiter',  restaurantId: 'r5', password: 'waiter1'  },
  { id: 'u15', name: 'Olivia Chen',   role: 'waiter',  restaurantId: 'r5', password: 'waiter2'  },
]
