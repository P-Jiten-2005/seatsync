// Best-fit: smallest available table whose capacity >= partySize
export function suggestTable(tables, partySize) {
  const candidates = tables.filter(
    t => t.status === 'available' && t.capacity >= partySize
  )
  if (candidates.length === 0) return null
  return candidates.sort((a, b) => a.capacity - b.capacity)[0]
}
