import { Users, Clock } from 'lucide-react'
import { users } from '../../data/users'
import { formatTime, formatDuration } from '../../utils/timeUtils'

const G      = '#1B4332'
const BG     = '#F8F7F4'
const BORDER = '#E5E1DA'

function waiterName(userId) {
  if (userId === 'system') return 'System'
  return users.find(u => u.id === userId)?.name ?? userId
}

const STATUS_PILL = {
  active: { bg: '#ECFDF5', color: '#065F46', label: 'Active'    },
  done:   { bg: '#F3F4F6', color: '#374151', label: 'Completed' },
}

export default function SessionHistory({ sessions, tables, tokens }) {
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.checkInTime) - new Date(a.checkInTime)
  )

  const th = 'text-left text-[10px] font-bold tracking-widest uppercase px-4 py-3'
  const td = 'px-4 py-3 text-sm'

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center"
        style={{ background: BG, fontFamily: "'Inter', sans-serif" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: '#F3F4F6' }}>
          <Clock className="w-6 h-6" style={{ color: '#D1D5DB' }} />
        </div>
        <p className="text-base font-semibold" style={{ color: '#374151' }}>No sessions yet</p>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
          Sessions appear here once customers are seated.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6" style={{ background: BG, fontFamily: "'Inter', sans-serif" }}>
      <div className="mb-5">
        <h2 className="text-2xl font-bold"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: G }}>
          Sessions
        </h2>
        <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
          {sorted.length} session{sorted.length !== 1 ? 's' : ''} · most recent first
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: BORDER }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ background: '#fff' }}>
            <thead style={{ background: BG, borderBottom: `1px solid ${BORDER}` }}>
              <tr>
                {['Table', 'Customer', 'Party', 'Check-in', 'Check-out', 'Duration', 'Status', 'Waiter'].map(h => (
                  <th key={h} className={th} style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((session, i) => {
                const table    = tables.find(t => t.id === session.tableId)
                const token    = tokens.find(t => t.id === session.tokenId)
                const isActive = !session.checkOutTime
                const duration = session.checkOutTime
                  ? formatDuration(session.checkInTime, session.checkOutTime)
                  : formatDuration(session.checkInTime)
                const pill = isActive ? STATUS_PILL.active : STATUS_PILL.done

                return (
                  <tr key={session.id}
                    style={{ borderTop: i > 0 ? `1px solid ${BORDER}` : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = BG}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <td className={td}>
                      <span className="font-bold" style={{ color: G }}>T{table?.number ?? '?'}</span>
                    </td>
                    <td className={td}>
                      <p className="font-medium" style={{ color: '#111827' }}>
                        {token?.customerName ?? '—'}
                      </p>
                      {token && (
                        <p className="font-mono text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                          #{String(token.tokenNumber).padStart(3, '0')}
                        </p>
                      )}
                    </td>
                    <td className={td}>
                      <span className="flex items-center gap-1 text-xs" style={{ color: '#374151' }}>
                        <Users className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
                        {session.partySize ?? '—'}
                      </span>
                    </td>
                    <td className={td}>
                      <span className="text-xs" style={{ color: '#6B7280' }}>
                        {formatTime(session.checkInTime)}
                      </span>
                    </td>
                    <td className={td}>
                      {session.checkOutTime
                        ? <span className="text-xs" style={{ color: '#6B7280' }}>{formatTime(session.checkOutTime)}</span>
                        : <span className="text-xs font-semibold" style={{ color: '#065F46' }}>Active</span>
                      }
                    </td>
                    <td className={td}>
                      <span className="font-mono text-xs"
                        style={{ color: isActive ? '#92400E' : '#374151' }}>
                        {duration}{isActive ? ' +' : ''}
                      </span>
                    </td>
                    <td className={td}>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: pill.bg, color: pill.color }}>
                        {pill.label}
                      </span>
                    </td>
                    <td className={td}>
                      <span className="text-xs" style={{ color: '#6B7280' }}>
                        {waiterName(session.waiterId)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
