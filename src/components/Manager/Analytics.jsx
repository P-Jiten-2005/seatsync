import { TrendingUp, Users, Clock, LayoutGrid, CheckCircle2, ListOrdered } from 'lucide-react'
import { formatDuration } from '../../utils/timeUtils'

const G      = '#1B4332'
const BG     = '#F8F7F4'
const BORDER = '#E5E1DA'

function isToday(date) {
  const d = new Date(date), t = new Date()
  return d.getFullYear() === t.getFullYear() &&
         d.getMonth()    === t.getMonth()    &&
         d.getDate()     === t.getDate()
}

const ACCENT_MAP = {
  green:  { bg: '#ECFDF5', color: '#065F46', bar: '#A7F3D0' },
  red:    { bg: '#FEF2F2', color: '#991B1B', bar: '#FCA5A5' },
  amber:  { bg: '#FFFBEB', color: '#92400E', bar: '#FDE68A' },
  blue:   { bg: '#EFF6FF', color: '#1E40AF', bar: '#BFDBFE' },
  purple: { bg: '#F5F3FF', color: '#5B21B6', bar: '#DDD6FE' },
  forest: { bg: '#ECFDF5', color: G,         bar: '#A7F3D0' },
}

function StatCard({ icon: Icon, label, value, sub, accent = 'forest' }) {
  const a = ACCENT_MAP[accent] ?? ACCENT_MAP.forest
  return (
    <div className="rounded-2xl p-5 border"
      style={{ background: '#fff', borderColor: BORDER, borderLeft: `3px solid ${a.bar}` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: a.bg }}>
          <Icon className="w-3.5 h-3.5" style={{ color: a.color }} />
        </div>
        <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#9CA3AF' }}>
          {label}
        </p>
      </div>
      <p className="text-4xl font-black leading-none" style={{ color: '#111827' }}>{value}</p>
      {sub && <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>{sub}</p>}
    </div>
  )
}

const STATUS_PILL = {
  available: { bg: '#ECFDF5', color: '#065F46', label: 'Available' },
  occupied:  { bg: '#FEF2F2', color: '#991B1B', label: 'Occupied'  },
  cleaning:  { bg: '#FFFBEB', color: '#92400E', label: 'Sanitizing'},
}

export default function Analytics({ tables, tokens, sessions }) {
  const today = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })

  const totalTables  = tables.length
  const occupied     = tables.filter(t => t.status === 'occupied').length
  const cleaning     = tables.filter(t => t.status === 'cleaning').length
  const available    = tables.filter(t => t.status === 'available').length
  const occupancyPct = totalTables > 0 ? Math.round(occupied / totalTables * 100) : 0
  const waiting      = tokens.filter(t => t.status === 'waiting').length

  const todaySessions    = sessions.filter(s => isToday(s.checkInTime))
  const completedToday   = todaySessions.filter(s => s.checkOutTime)
  const totalCoversToday = todaySessions.reduce((sum, s) => sum + (s.partySize ?? 0), 0)
  const servedToday      = tokens.filter(
    t => isToday(t.createdAt) && (t.status === 'seated' || t.status === 'done')
  ).length

  let avgDurationLabel = '—'
  if (completedToday.length > 0) {
    const avgMs = completedToday.reduce(
      (sum, s) => sum + (new Date(s.checkOutTime) - new Date(s.checkInTime)), 0
    ) / completedToday.length
    avgDurationLabel = formatDuration(new Date(Date.now() - avgMs))
  }

  const sectionLabel = 'text-[10px] font-bold tracking-widest uppercase mb-3'
  const th           = 'text-left text-[10px] font-bold tracking-widest uppercase px-4 py-3'
  const td           = 'px-4 py-2.5 text-sm'

  return (
    <div className="p-6 space-y-6" style={{ background: BG, fontFamily: "'Inter', sans-serif" }}>

      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: G }}>
          Analytics
        </h2>
        <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>{today}</p>
      </div>

      {/* Live floor stats */}
      <div>
        <p className={sectionLabel} style={{ color: '#9CA3AF' }}>Live Floor</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={LayoutGrid}  label="Occupancy"    value={`${occupancyPct}%`} sub={`${occupied} of ${totalTables} tables`} accent="red"    />
          <StatCard icon={CheckCircle2} label="Available"   value={available}           sub={`${cleaning} sanitizing`}              accent="green"  />
          <StatCard icon={ListOrdered} label="Queue"        value={waiting}             sub="customers waiting"                     accent="blue"   />
          <StatCard icon={TrendingUp}  label="Served Today" value={servedToday}         sub="tokens seated"                         accent="forest" />
        </div>
      </div>

      {/* Today's performance */}
      <div>
        <p className={sectionLabel} style={{ color: '#9CA3AF' }}>Today's Performance</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard icon={Users} label="Total Sessions" value={todaySessions.length}  sub={`${completedToday.length} completed`}                             accent="purple" />
          <StatCard icon={Users} label="Total Covers"   value={totalCoversToday}       sub="guests seated today"                                              accent="forest" />
          <StatCard icon={Clock} label="Avg Duration"   value={avgDurationLabel}       sub={completedToday.length > 0 ? `over ${completedToday.length} sessions` : 'no data yet'} accent="amber"  />
        </div>
      </div>

      {/* Table breakdown */}
      <div>
        <p className={sectionLabel} style={{ color: '#9CA3AF' }}>Table Breakdown</p>
        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: BORDER }}>
          <table className="w-full" style={{ background: '#fff' }}>
            <thead style={{ background: BG, borderBottom: `1px solid ${BORDER}` }}>
              <tr>
                {['Table', 'Capacity', 'Status', 'Sessions Today'].map((h, i) => (
                  <th key={h} className={th}
                    style={{ color: '#9CA3AF', textAlign: i === 3 ? 'right' : 'left' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tables.map((table, i) => {
                const tableSessions = sessions.filter(
                  s => s.tableId === table.id && isToday(s.checkInTime)
                ).length
                const p = STATUS_PILL[table.status] ?? STATUS_PILL.available
                return (
                  <tr key={table.id}
                    style={{ borderTop: i > 0 ? `1px solid ${BORDER}` : 'none' }}>
                    <td className={td}>
                      <span className="font-bold" style={{ color: G }}>T{table.number}</span>
                    </td>
                    <td className={td} style={{ color: '#6B7280' }}>{table.capacity} seats</td>
                    <td className={td}>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: p.bg, color: p.color }}>
                        {p.label}
                      </span>
                    </td>
                    <td className={td} style={{ color: '#374151', textAlign: 'right', fontWeight: 500 }}>
                      {tableSessions}
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
