import { Users, Sparkles, Clock } from 'lucide-react'
import Timer from '../shared/Timer'
import { isWarning } from '../../utils/timeUtils'

const G      = '#1B4332'
const BORDER = '#E5E1DA'

const STATUS = {
  available: {
    borderLeft: '3px solid #A7F3D0',
    badge: { bg: '#ECFDF5', color: '#065F46', label: 'Available' },
  },
  occupied: {
    borderLeft: '3px solid #FCA5A5',
    badge: { bg: '#FEF2F2', color: '#991B1B', label: 'Occupied' },
  },
  cleaning: {
    borderLeft: '3px solid #FDE68A',
    badge: { bg: '#FFFBEB', color: '#92400E', label: 'Sanitizing' },
  },
}

const WARNING_BORDER = '3px solid #F97316'

export default function TableCard({ table, token, isSelected, onClick }) {
  const s       = STATUS[table.status] ?? STATUS.available
  const warning = table.status === 'occupied' && table.slotEnd && isWarning(table.slotEnd)
  const leftBorder = warning ? WARNING_BORDER : s.borderLeft

  if (isSelected) {
    return (
      <button onClick={onClick}
        className="relative flex flex-col gap-1.5 p-3 rounded-xl text-left w-full transition-all duration-150 cursor-pointer select-none focus:outline-none"
        style={{ background: G, border: `2px solid ${G}`, borderLeft: leftBorder }}>
        <div className="flex items-center justify-between">
          <span className="text-base font-bold leading-none text-white">T{table.number}</span>
          <div className="flex items-center gap-0.5 text-xs text-white/60">
            <Users className="w-3 h-3" />
            <span>{table.capacity}</span>
          </div>
        </div>

        {table.status === 'available' && (
          <span className="text-xs text-white/80 font-medium">Available</span>
        )}

        {table.status === 'occupied' && (
          <>
            <p className="text-xs text-white font-medium truncate leading-tight">
              {token ? `#${token.tokenNumber} ${token.customerName}` : '—'}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5 text-xs text-white/60">
                <Users className="w-3 h-3" />
                <span>{token?.partySize ?? '—'}</span>
              </div>
              {table.slotEnd && (
                <div className="flex items-center gap-0.5 text-white/80">
                  <Clock className="w-3 h-3" />
                  <Timer slotEnd={table.slotEnd} className="text-xs" />
                </div>
              )}
            </div>
          </>
        )}

        {table.status === 'cleaning' && (
          <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
            <Sparkles className="w-3 h-3" />
            <span>Sanitizing</span>
          </div>
        )}
      </button>
    )
  }

  return (
    <button onClick={onClick}
      className="relative flex flex-col gap-1.5 p-3 rounded-xl text-left w-full transition-all duration-150 cursor-pointer select-none focus:outline-none"
      style={{
        background:  '#fff',
        border:      `1px solid ${BORDER}`,
        borderLeft:  leftBorder,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = warning ? '#F97316' : '#A7F3D0' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER }}>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-base font-bold leading-none" style={{ color: '#111827' }}>
          T{table.number}
        </span>
        <div className="flex items-center gap-0.5 text-xs" style={{ color: '#9CA3AF' }}>
          <Users className="w-3 h-3" />
          <span>{table.capacity}</span>
        </div>
      </div>

      {/* Available */}
      {table.status === 'available' && (
        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: s.badge.bg, color: s.badge.color }}>
          {s.badge.label}
        </span>
      )}

      {/* Occupied */}
      {table.status === 'occupied' && (
        <>
          <p className="text-xs font-medium truncate leading-tight" style={{ color: '#374151' }}>
            {token ? token.customerName : '—'}
          </p>
          <div className="flex items-center justify-between">
            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: s.badge.bg, color: s.badge.color }}>
              {s.badge.label}
            </span>
            {table.slotEnd && (
              <div className="flex items-center gap-0.5"
                style={{ color: warning ? '#F97316' : '#9CA3AF' }}>
                <Clock className="w-3 h-3" />
                <Timer slotEnd={table.slotEnd} className="text-xs" />
              </div>
            )}
          </div>
        </>
      )}

      {/* Cleaning */}
      {table.status === 'cleaning' && (
        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: s.badge.bg, color: s.badge.color }}>
          <span className="flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            {s.badge.label}
          </span>
        </span>
      )}
    </button>
  )
}
