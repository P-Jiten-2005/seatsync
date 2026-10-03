import { TrendingUp, Users, Clock, LayoutGrid, CheckCircle2, ListOrdered } from 'lucide-react'
import { formatDuration } from '../../utils/timeUtils'

function isToday(date) {
  const d = new Date(date)
  const t = new Date()
  return d.getFullYear() === t.getFullYear() &&
         d.getMonth()    === t.getMonth()    &&
         d.getDate()     === t.getDate()
}

function StatCard({ icon: Icon, label, value, sub, accent = 'indigo' }) {
  const accents = {
    indigo: 'border-indigo-900  bg-indigo-950/30  text-indigo-400',
    green:  'border-green-900   bg-green-950/30   text-green-400',
    yellow: 'border-yellow-900  bg-yellow-950/30  text-yellow-400',
    red:    'border-red-900     bg-red-950/30     text-red-400',
    purple: 'border-purple-900  bg-purple-950/30  text-purple-400',
    blue:   'border-blue-900    bg-blue-950/30    text-blue-400',
  }
  return (
    <div className={`border rounded-2xl p-5 ${accents[accent]}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 opacity-70" />
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
      </div>
      <p className="text-4xl font-black text-white leading-none">{value}</p>
      {sub && <p className="text-xs opacity-50 mt-2">{sub}</p>}
    </div>
  )
}

export default function Analytics({ tables, tokens, sessions }) {
  const today = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })

  // Current state
  const totalTables   = tables.length
  const occupied      = tables.filter(t => t.status === 'occupied').length
  const cleaning      = tables.filter(t => t.status === 'cleaning').length
  const available     = tables.filter(t => t.status === 'available').length
  const occupancyPct  = totalTables > 0 ? Math.round(occupied / totalTables * 100) : 0

  // Waiting queue
  const waiting = tokens.filter(t => t.status === 'waiting').length

  // Today's sessions
  const todaySessions   = sessions.filter(s => isToday(s.checkInTime))
  const completedToday  = todaySessions.filter(s => s.checkOutTime)
  const totalCoversToday = todaySessions.reduce((sum, s) => sum + (s.partySize ?? 0), 0)

  // Avg duration (completed sessions today)
  let avgDurationLabel = '—'
  if (completedToday.length > 0) {
    const avgMs = completedToday.reduce(
      (sum, s) => sum + (new Date(s.checkOutTime) - new Date(s.checkInTime)), 0
    ) / completedToday.length
    avgDurationLabel = formatDuration(new Date(Date.now() - avgMs))
  }

  // Tokens served today (done or seated, created today)
  const servedToday = tokens.filter(
    t => isToday(t.createdAt) && (t.status === 'seated' || t.status === 'done')
  ).length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-base font-bold text-white">Analytics</h2>
        <p className="text-sm text-gray-500">{today}</p>
      </div>

      {/* Live stats */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Live Floor</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={LayoutGrid}
            label="Occupancy"
            value={`${occupancyPct}%`}
            sub={`${occupied} of ${totalTables} tables`}
            accent="red"
          />
          <StatCard
            icon={CheckCircle2}
            label="Available"
            value={available}
            sub={`${cleaning} cleaning`}
            accent="green"
          />
          <StatCard
            icon={ListOrdered}
            label="Queue"
            value={waiting}
            sub="customers waiting"
            accent="blue"
          />
          <StatCard
            icon={TrendingUp}
            label="Served Today"
            value={servedToday}
            sub="tokens seated"
            accent="indigo"
          />
        </div>
      </div>

      {/* Today's performance */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Today's Performance</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            icon={Users}
            label="Total Sessions"
            value={todaySessions.length}
            sub={`${completedToday.length} completed`}
            accent="purple"
          />
          <StatCard
            icon={Users}
            label="Total Covers"
            value={totalCoversToday}
            sub="guests seated today"
            accent="indigo"
          />
          <StatCard
            icon={Clock}
            label="Avg Duration"
            value={avgDurationLabel}
            sub={completedToday.length > 0 ? `over ${completedToday.length} sessions` : 'no data yet'}
            accent="yellow"
          />
        </div>
      </div>

      {/* Table breakdown */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Table Breakdown</p>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Table</th>
                <th className="text-left px-4 py-3">Capacity</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Sessions Today</th>
              </tr>
            </thead>
            <tbody>
              {tables.map(table => {
                const tableSessions = sessions.filter(
                  s => s.tableId === table.id && isToday(s.checkInTime)
                ).length
                const statusColor = {
                  available: 'text-green-400',
                  occupied:  'text-red-400',
                  cleaning:  'text-yellow-400',
                }[table.status]

                return (
                  <tr key={table.id} className="border-b border-gray-800/50 last:border-0">
                    <td className="px-4 py-2.5 font-bold text-white">T{table.number}</td>
                    <td className="px-4 py-2.5 text-gray-400">{table.capacity} seats</td>
                    <td className={`px-4 py-2.5 capitalize text-xs font-medium ${statusColor}`}>
                      {table.status}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-right">{tableSessions}</td>
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
