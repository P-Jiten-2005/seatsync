import { Users, Clock, ArrowRight } from 'lucide-react'
import { users } from '../../data/users'
import { formatTime, formatDuration } from '../../utils/timeUtils'
import StatusBadge from '../shared/StatusBadge'

function waiterName(userId) {
  if (userId === 'system') return 'System'
  return users.find(u => u.id === userId)?.name ?? userId
}

export default function SessionHistory({ sessions, tables, tokens }) {
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.checkInTime) - new Date(a.checkInTime)
  )

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Clock className="w-10 h-10 text-gray-700 mb-3" />
        <p className="text-gray-500 font-medium">No sessions yet</p>
        <p className="text-gray-600 text-sm mt-1">Sessions appear here once customers are seated.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <th className="text-left px-4 py-3">Table</th>
            <th className="text-left px-4 py-3">Customer</th>
            <th className="text-left px-4 py-3">Party</th>
            <th className="text-left px-4 py-3">Check-in</th>
            <th className="text-left px-4 py-3">Check-out</th>
            <th className="text-left px-4 py-3">Duration</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-left px-4 py-3">Waiter</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(session => {
            const table = tables.find(t => t.id === session.tableId)
            const token = tokens.find(t => t.id === session.tokenId)
            const isActive = !session.checkOutTime
            const duration = session.checkOutTime
              ? formatDuration(session.checkInTime, session.checkOutTime)
              : formatDuration(session.checkInTime)

            return (
              <tr
                key={session.id}
                className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors"
              >
                <td className="px-4 py-3 font-bold text-white">
                  T{table?.number ?? '?'}
                </td>
                <td className="px-4 py-3">
                  <p className="text-white font-medium">{token?.customerName ?? '—'}</p>
                  {token && (
                    <p className="text-gray-500 text-xs font-mono">#{token.tokenNumber}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-gray-300">
                    <Users className="w-3.5 h-3.5 text-gray-500" />
                    {session.partySize ?? '—'}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {formatTime(session.checkInTime)}
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {session.checkOutTime ? formatTime(session.checkOutTime) : (
                    <span className="text-green-500 text-xs font-medium">Active</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-300 font-mono text-xs">
                  {isActive ? (
                    <span className="text-yellow-500">{duration} +</span>
                  ) : duration}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={isActive ? 'occupied' : 'done'} />
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {waiterName(session.waiterId)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
