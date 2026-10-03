import { Users, Sparkles, Clock } from 'lucide-react'
import Timer from '../shared/Timer'
import { isWarning } from '../../utils/timeUtils'

const statusStyles = {
  available: {
    card:   'bg-green-950/60  border-green-800  hover:border-green-500',
    num:    'text-green-300',
    sub:    'text-green-700',
  },
  occupied: {
    card:   'bg-red-950/60    border-red-800    hover:border-red-500',
    num:    'text-red-300',
    sub:    'text-red-700',
  },
  cleaning: {
    card:   'bg-yellow-950/40 border-yellow-800 hover:border-yellow-500',
    num:    'text-yellow-300',
    sub:    'text-yellow-700',
  },
}

export default function TableCard({ table, token, isSelected, onClick }) {
  const s       = statusStyles[table.status] ?? statusStyles.available
  const warning = table.status === 'occupied' && table.slotEnd && isWarning(table.slotEnd)

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col gap-1.5 p-3 rounded-xl border-2 text-left w-full
        transition-all duration-150 cursor-pointer select-none
        ${s.card}
        ${warning    ? '!border-orange-500 hover:!border-orange-400' : ''}
        ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-gray-950' : ''}
      `}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className={`text-base font-bold leading-none ${s.num}`}>
          T{table.number}
        </span>
        <div className={`flex items-center gap-0.5 text-xs ${s.sub}`}>
          <Users className="w-3 h-3" />
          <span>{table.capacity}</span>
        </div>
      </div>

      {/* Available */}
      {table.status === 'available' && (
        <span className="text-xs text-green-600 font-medium">Available</span>
      )}

      {/* Occupied */}
      {table.status === 'occupied' && (
        <>
          <p className="text-xs text-gray-300 font-medium truncate leading-tight">
            {token ? `#${token.tokenNumber} ${token.customerName}` : '—'}
          </p>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-0.5 text-xs ${s.sub}`}>
              <Users className="w-3 h-3" />
              <span>{token?.partySize ?? '—'}</span>
            </div>
            {table.slotEnd && (
              <div className={`flex items-center gap-0.5 ${warning ? 'text-orange-400' : 'text-gray-500'}`}>
                <Clock className="w-3 h-3" />
                <Timer slotEnd={table.slotEnd} className="text-xs" />
              </div>
            )}
          </div>
        </>
      )}

      {/* Cleaning */}
      {table.status === 'cleaning' && (
        <div className="flex items-center gap-1 text-xs text-yellow-600 font-medium">
          <Sparkles className="w-3 h-3" />
          <span>Cleaning</span>
        </div>
      )}
    </button>
  )
}
