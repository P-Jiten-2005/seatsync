import { Settings2 } from 'lucide-react'

const G      = '#1B4332'
const BG     = '#F8F7F4'
const BORDER = '#E5E1DA'

const CAPACITIES = [2, 4, 6]

const STATUS_PILL = {
  available: { bg: '#ECFDF5', color: '#065F46', label: 'Available' },
  occupied:  { bg: '#FEF2F2', color: '#991B1B', label: 'Occupied'  },
  cleaning:  { bg: '#FFFBEB', color: '#92400E', label: 'Sanitizing'},
}

export default function TableEditor({ tables, onUpdateCapacity }) {
  return (
    <div className="p-6 space-y-6" style={{ background: BG, fontFamily: "'Inter', sans-serif" }}>

      <div>
        <h2 className="text-2xl font-bold"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: G }}>
          Table Settings
        </h2>
        <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
          Adjust table capacities. Changes apply immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tables.map(table => {
          const p       = STATUS_PILL[table.status] ?? STATUS_PILL.available
          const locked  = table.status === 'occupied'
          return (
            <div key={table.id}
              className="rounded-xl p-4 space-y-3 border"
              style={{ background: '#fff', borderColor: BORDER, borderLeft: `3px solid ${p.bg === '#ECFDF5' ? '#A7F3D0' : p.bg === '#FEF2F2' ? '#FCA5A5' : '#FDE68A'}` }}>

              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold" style={{ color: '#111827' }}>
                    Table {table.number}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: p.bg, color: p.color }}>
                    {p.label}
                  </span>
                </div>
                <Settings2 className="w-4 h-4" style={{ color: '#D1D5DB' }} />
              </div>

              {/* Capacity selector */}
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase mb-2"
                  style={{ color: '#9CA3AF' }}>Capacity</p>
                <div className="flex gap-2">
                  {CAPACITIES.map(cap => (
                    <button key={cap}
                      onClick={() => onUpdateCapacity(table.id, cap)}
                      disabled={locked}
                      className="flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background:  table.capacity === cap ? G       : '#fff',
                        border:      `1px solid ${table.capacity === cap ? G : BORDER}`,
                        color:       table.capacity === cap ? '#fff'  : '#374151',
                      }}
                      onMouseEnter={e => {
                        if (!locked && table.capacity !== cap) {
                          e.currentTarget.style.borderColor = G
                          e.currentTarget.style.color = G
                        }
                      }}
                      onMouseLeave={e => {
                        if (table.capacity !== cap) {
                          e.currentTarget.style.borderColor = BORDER
                          e.currentTarget.style.color = '#374151'
                        }
                      }}>
                      {cap}
                    </button>
                  ))}
                </div>
                {locked && (
                  <p className="text-xs mt-1.5" style={{ color: '#9CA3AF' }}>
                    Cannot edit while occupied.
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
