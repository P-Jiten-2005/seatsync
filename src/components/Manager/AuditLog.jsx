import { ShieldCheck } from 'lucide-react'
import { users } from '../../data/users'
import { formatTime } from '../../utils/timeUtils'

const G      = '#1B4332'
const BG     = '#F8F7F4'
const BORDER = '#E5E1DA'

const ACTION_META = {
  TABLE_ALLOCATED:        { label: 'Table Allocated',   bg: '#ECFDF5', color: '#065F46' },
  STATUS_CHANGED:         { label: 'Status Changed',    bg: '#EFF6FF', color: '#1E40AF' },
  AUTO_CLEANING:          { label: 'Auto-Cleaning',     bg: '#FFFBEB', color: '#92400E' },
  TIMER_OVERRIDDEN:       { label: 'Timer Overridden',  bg: '#F5F3FF', color: '#5B21B6' },
  TABLE_SETTINGS_CHANGED: { label: 'Settings Changed',  bg: '#F3F4F6', color: '#374151' },
}

const STATUS_PILL = {
  available: { bg: '#ECFDF5', color: '#065F46', label: 'Available' },
  occupied:  { bg: '#FEF2F2', color: '#991B1B', label: 'Occupied'  },
  cleaning:  { bg: '#FFFBEB', color: '#92400E', label: 'Cleaning'  },
}

function actorName(userId) {
  if (!userId || userId === 'system') return 'System'
  return users.find(u => u.id === userId)?.name ?? userId
}

function actorRole(userId) {
  if (!userId || userId === 'system') return null
  return users.find(u => u.id === userId)?.role ?? null
}

function StatusChip({ status }) {
  const p = STATUS_PILL[status]
  if (!p) return <span style={{ color: '#9CA3AF' }}>{status}</span>
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: p.bg, color: p.color }}>
      {p.label}
    </span>
  )
}

export default function AuditLog({ entries, tables }) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  )

  const th = 'text-left text-[10px] font-bold tracking-widest uppercase px-4 py-3'
  const td = 'px-4 py-3 text-sm'

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center"
        style={{ background: BG, fontFamily: "'Inter', sans-serif" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: '#F3F4F6' }}>
          <ShieldCheck className="w-6 h-6" style={{ color: '#D1D5DB' }} />
        </div>
        <p className="text-base font-semibold" style={{ color: '#374151' }}>Audit log is empty</p>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
          All staff actions will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6" style={{ background: BG, fontFamily: "'Inter', sans-serif" }}>
      <div className="mb-5">
        <h2 className="text-2xl font-bold"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: G }}>
          Audit Log
        </h2>
        <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
          {sorted.length} entr{sorted.length !== 1 ? 'ies' : 'y'} · most recent first
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: BORDER }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ background: '#fff' }}>
            <thead style={{ background: BG, borderBottom: `1px solid ${BORDER}` }}>
              <tr>
                {['Time', 'Action', 'Table', 'Change', 'Actor'].map(h => (
                  <th key={h} className={th} style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry, i) => {
                const table = tables.find(t => t.id === entry.tableId)
                const meta  = ACTION_META[entry.action] ?? { label: entry.action, bg: '#F3F4F6', color: '#374151' }
                const name  = actorName(entry.userId)
                const role  = actorRole(entry.userId)

                return (
                  <tr key={entry.id}
                    style={{ borderTop: i > 0 ? `1px solid ${BORDER}` : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = BG}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <td className={td}>
                      <span className="font-mono text-xs" style={{ color: '#9CA3AF' }}>
                        {formatTime(entry.timestamp)}
                      </span>
                    </td>
                    <td className={td}>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </td>
                    <td className={td}>
                      <span className="font-bold" style={{ color: G }}>
                        {table ? `T${table.number}` : '—'}
                      </span>
                    </td>
                    <td className={td}>
                      {entry.fromStatus && entry.toStatus && entry.fromStatus !== entry.toStatus ? (
                        <span className="flex items-center gap-1.5">
                          <StatusChip status={entry.fromStatus} />
                          <span style={{ color: '#D1D5DB', fontSize: 10 }}>→</span>
                          <StatusChip status={entry.toStatus} />
                        </span>
                      ) : (
                        <span style={{ color: '#D1D5DB' }}>—</span>
                      )}
                    </td>
                    <td className={td}>
                      <p className="text-xs font-medium" style={{ color: '#374151' }}>{name}</p>
                      {role && (
                        <p className="text-xs capitalize mt-0.5" style={{ color: '#9CA3AF' }}>{role}</p>
                      )}
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
