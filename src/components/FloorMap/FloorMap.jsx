import TableCard from './TableCard'

const LEGEND = [
  { color: 'bg-green-600',  label: 'Available' },
  { color: 'bg-red-600',    label: 'Occupied'  },
  { color: 'bg-yellow-600', label: 'Cleaning'  },
  { color: 'bg-orange-500', label: 'Warning'   },
]

export default function FloorMap({ tables, tokens, selectedTableId, onSelectTable }) {
  function getToken(table) {
    if (!table.currentToken) return null
    return tokens.find(t => t.id === table.currentToken) ?? null
  }

  const available = tables.filter(t => t.status === 'available').length
  const occupied  = tables.filter(t => t.status === 'occupied').length
  const cleaning  = tables.filter(t => t.status === 'cleaning').length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Floor Map</h2>
          <p className="text-xs text-gray-600 mt-0.5">
            {available} available · {occupied} occupied · {cleaning} cleaning
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          {LEGEND.map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1 text-xs text-gray-500">
              <span className={`w-2 h-2 rounded-full ${color} inline-block`} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Grid: 3 cols on mobile, 4 on sm+ */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {tables.map(table => (
          <TableCard
            key={table.id}
            table={table}
            token={getToken(table)}
            isSelected={table.id === selectedTableId}
            onClick={() => onSelectTable(table.id === selectedTableId ? null : table.id)}
          />
        ))}
      </div>
    </div>
  )
}
