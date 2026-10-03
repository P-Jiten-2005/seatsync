import { ShieldCheck } from 'lucide-react'
import { users } from '../../data/users'
import { formatTime } from '../../utils/timeUtils'

const ACTION_LABELS = {
  TABLE_ALLOCATED:       { label: 'Table Allocated',      color: 'text-green-400'  },
  STATUS_CHANGED:        { label: 'Status Changed',       color: 'text-blue-400'   },
  AUTO_CLEANING:         { label: 'Auto-Cleaning',        color: 'text-yellow-400' },
  TIMER_OVERRIDDEN:      { label: 'Timer Overridden',     color: 'text-orange-400' },
  TABLE_SETTINGS_CHANGED:{ label: 'Settings Changed',     color: 'text-purple-400' },
}

const STATUS_COLORS = {
  available: 'text-green-400',
  occupied:  'text-red-400',
  cleaning:  'text-yellow-400',
}

function actorName(userId) {
  if (!userId || userId === 'system') return 'System'
  return users.find(u => u.id === userId)?.name ?? userId
}

function actorRole(userId) {
  if (!userId || userId === 'system') return null
  return users.find(u => u.id === userId)?.role ?? null
}

export default function AuditLog({ entries, tables }) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  )

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldCheck className="w-10 h-10 text-gray-700 mb-3" />
        <p className="text-gray-500 font-medium">Audit log is empty</p>
        <p className="text-gray-600 text-sm mt-1">All staff actions will appear here.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <th className="text-left px-4 py-3">Time</th>
            <th className="text-left px-4 py-3">Action</th>
            <th className="text-left px-4 py-3">Table</th>
            <th className="text-left px-4 py-3">Change</th>
            <th className="text-left px-4 py-3">Actor</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(entry => {
            const table     = tables.find(t => t.id === entry.tableId)
            const meta      = ACTION_LABELS[entry.action] ?? { label: entry.action, color: 'text-gray-400' }
            const name      = actorName(entry.userId)
            const role      = actorRole(entry.userId)

            return (
              <tr
                key={entry.id}
                className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors"
              >
                <td className="px-4 py-3 text-gray-500 text-xs font-mono whitespace-nowrap">
                  {formatTime(entry.timestamp)}
                </td>
                <td className={`px-4 py-3 font-medium ${meta.color}`}>
                  {meta.label}
                </td>
                <td className="px-4 py-3 text-white font-bold">
                  {table ? `T${table.number}` : '—'}
                </td>
                <td className="px-4 py-3">
                  {entry.fromStatus && entry.toStatus && entry.fromStatus !== entry.toStatus ? (
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className={STATUS_COLORS[entry.fromStatus] ?? 'text-gray-400'}>
                        {entry.fromStatus}
                      </span>
                      <span className="text-gray-600">→</span>
                      <span className={STATUS_COLORS[entry.toStatus] ?? 'text-gray-400'}>
                        {entry.toStatus}
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-600 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-300 text-xs">{name}</p>
                  {role && (
                    <p className="text-gray-600 text-xs capitalize">{role}</p>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
