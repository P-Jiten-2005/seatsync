import TableCard from './TableCard'

const LEGEND = [
  { color: '#A7F3D0', label: 'Available' },
  { color: '#FCA5A5', label: 'Occupied'  },
  { color: '#FDE68A', label: 'Sanitizing'},
  { color: '#F97316', label: 'Warning'   },
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
          <p className="text-[10px] font-bold tracking-widest uppercase"
            style={{ color: '#9CA3AF' }}>Floor Map</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
            {available} available · {occupied} occupied · {cleaning} sanitizing
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          {LEGEND.map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1 text-xs"
              style={{ color: '#9CA3AF' }}>
              <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0"
                style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {tables.map(table => (
          <TableCard
            key={table.id}
            table={table}
            token={getToken(table)}
            isSelected={table.id === selectedTableId}
            onClick={() => onSelectTable(table.id)}
          />
        ))}
      </div>
    </div>
  )
}
