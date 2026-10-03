import { Users, Clock } from 'lucide-react'
import { formatDuration, formatTime } from '../../utils/timeUtils'

export default function TokenCard({ token, isSelected, onSelect }) {
  const waitTime = formatDuration(token.createdAt)

  return (
    <button
      onClick={() => onSelect(token.id === isSelected?.id ? null : token)}
      className={`
        w-full text-left px-4 py-3 border-b border-gray-800 transition-colors
        ${isSelected?.id === token.id
          ? 'bg-indigo-950/60 border-l-2 border-l-indigo-500'
          : 'hover:bg-gray-800/50'
        }
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-indigo-400 font-mono">
              #{token.tokenNumber}
            </span>
            <span className="text-sm font-medium text-white truncate">
              {token.customerName}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {token.partySize}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(token.createdAt)}
            </span>
          </div>
        </div>
        <span className="text-xs text-gray-500 shrink-0 mt-0.5">
          {waitTime}
        </span>
      </div>
    </button>
  )
}
