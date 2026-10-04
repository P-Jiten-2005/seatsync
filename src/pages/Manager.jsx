import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  LayoutGrid, History, ShieldCheck, BarChart2, Settings2,
  X, Users, Clock, CheckCircle2, Sparkles, AlertTriangle, TimerReset,
  UtensilsCrossed, LogOut, ListOrdered, Phone,
} from 'lucide-react'
import { useAuth }         from '../context/AuthContext'
import { useTableContext } from '../context/TableContext'
import { useTableActions } from '../hooks/useTableActions'
import { useQueue }        from '../hooks/useQueue'
import { suggestTable }    from '../utils/allocation'
import { formatTime, formatDuration, isWarning } from '../utils/timeUtils'
import StatusBadge    from '../components/shared/StatusBadge'
import Timer          from '../components/shared/Timer'
import FloorMap       from '../components/FloorMap/FloorMap'
import QueuePanel     from '../components/Queue/QueuePanel'
import SessionHistory from '../components/Manager/SessionHistory'
import AuditLog       from '../components/Manager/AuditLog'
import Analytics      from '../components/Manager/Analytics'
import TableEditor    from '../components/Manager/TableEditor'

// ─── Theme ───────────────────────────────────────────────────────────────────
const G      = '#1B4332'
const BG     = '#F8F7F4'
const BORDER = '#E5E1DA'

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'floor',     label: 'Floor',     Icon: LayoutGrid  },
  { id: 'queue',     label: 'Queue',     Icon: ListOrdered },
  { id: 'sessions',  label: 'Sessions',  Icon: History     },
  { id: 'audit',     label: 'Audit Log', Icon: ShieldCheck },
  { id: 'analytics', label: 'Analytics', Icon: BarChart2   },
  { id: 'settings',  label: 'Settings',  Icon: Settings2   },
]

// ─── Live clock ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [t, setT] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  )
  useEffect(() => {
    const id = setInterval(() =>
      setT(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    , 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="font-mono text-sm font-semibold tabular-nums" style={{ color: '#374151' }}>{t}</span>
}

// ─── Status badge (warm theme) ────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    available: { bg: '#ECFDF5', color: '#065F46', label: 'Available' },
    occupied:  { bg: '#FEF2F2', color: '#991B1B', label: 'Occupied'  },
    cleaning:  { bg: '#FFFBEB', color: '#92400E', label: 'Cleaning'  },
    waiting:   { bg: '#EFF6FF', color: '#1E40AF', label: 'Waiting'   },
    seated:    { bg: '#FEF2F2', color: '#991B1B', label: 'Seated'    },
    done:      { bg: '#F3F4F6', color: '#374151', label: 'Done'      },
  }
  const s = map[status] ?? { bg: '#F3F4F6', color: '#374151', label: status }
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

// ─── Manager table detail panel ───────────────────────────────────────────────
function ManagerTableDetailPanel({ table, token, waitingTokens, selectedToken, actions, onClose }) {
  const [allocTokenId, setAllocTokenId] = useState(
    selectedToken?.id ?? (waitingTokens[0]?.id || '')
  )
  const chosenToken  = waitingTokens.find(t => t.id === allocTokenId)
  const capacityWarn = chosenToken && chosenToken.partySize > table.capacity

  function handleAllocate() {
    if (!allocTokenId) { toast.error('Select a token first.'); return }
    if (capacityWarn)  { toast.error('Party size exceeds table capacity.'); return }
    actions.allocate(table.id, allocTokenId)
    toast.success(`Table ${table.number} seated — token #${chosenToken.tokenNumber}`)
    onClose()
  }
  function handleCleaning() {
    actions.clean(table.id)
    toast.success(`Table ${table.number} marked for cleaning`)
    onClose()
  }
  function handleAvailable() {
    actions.available(table.id)
    toast.success(`Table ${table.number} is now available`)
    onClose()
  }
  function extendTimer(extraMs) {
    const base   = table.slotEnd ? new Date(table.slotEnd) : new Date()
    const newEnd = new Date(Math.max(Date.now(), base.getTime()) + extraMs)
    actions.override(table.id, newEnd)
    toast.success(`Timer extended for Table ${table.number}`)
  }
  function resetTimer() {
    if (!table.checkInTime) return
    const newEnd = new Date(new Date(table.checkInTime).getTime() + 90 * 60_000)
    actions.override(table.id, newEnd)
    toast.success('Timer reset to 1h 30m from check-in')
  }

  const labelStyle = { color: '#9CA3AF', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }

  return (
    <div className="rounded-2xl p-5 border relative"
      style={{ background: '#fff', borderColor: BORDER }}>
      <button onClick={onClose}
        className="absolute top-4 right-4 transition-colors"
        style={{ color: '#9CA3AF' }}
        onMouseEnter={e => e.currentTarget.style.color = '#374151'}
        onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}>
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: BG, border: `2px solid ${BORDER}` }}>
          <span className="text-lg font-black" style={{ color: G }}>{table.number}</span>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold" style={{ color: '#111827' }}>Table {table.number}</h3>
            <StatusPill status={table.status} />
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: '#9CA3AF' }}>
            <Users className="w-3 h-3" />
            <span>Capacity {table.capacity}</span>
          </div>
        </div>
      </div>

      {/* Available */}
      {table.status === 'available' && (
        <div className="space-y-4">
          {waitingTokens.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: '#9CA3AF' }}>No customers in queue.</p>
          ) : (
            <>
              <div className="space-y-1.5">
                <p style={labelStyle}>Assign token</p>
                <select value={allocTokenId} onChange={e => setAllocTokenId(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none border"
                  style={{ background: BG, borderColor: BORDER, color: '#111827' }}>
                  <option value="">Select a token…</option>
                  {waitingTokens.map(t => (
                    <option key={t.id} value={t.id}>
                      #{t.tokenNumber} · {t.customerName} · {t.partySize} guests
                    </option>
                  ))}
                </select>
                {chosenToken && (
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    Waiting {formatDuration(chosenToken.createdAt)} since {formatTime(chosenToken.createdAt)}
                  </p>
                )}
                {capacityWarn && (
                  <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
                    style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#92400E' }}>
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Party of {chosenToken.partySize} exceeds capacity {table.capacity}.
                  </div>
                )}
              </div>
              <button onClick={handleAllocate} disabled={!allocTokenId || capacityWarn}
                className="w-full flex items-center justify-center gap-2 font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: G, color: '#fff' }}>
                <CheckCircle2 className="w-4 h-4" /> Seat Customer
              </button>
            </>
          )}
        </div>
      )}

      {/* Occupied */}
      {table.status === 'occupied' && (
        <div className="space-y-4">
          {token && (
            <div className="rounded-xl p-4 space-y-2 border"
              style={{ background: BG, borderColor: BORDER }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: '#111827' }}>{token.customerName}</span>
                <span className="font-mono text-sm font-bold" style={{ color: G }}>#{token.tokenNumber}</span>
              </div>
              <div className="flex items-center gap-4 text-xs" style={{ color: '#9CA3AF' }}>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {token.partySize} guests
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> In at {formatTime(table.checkInTime)}
                </span>
              </div>
              {table.slotEnd && (
                <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: BORDER }}>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>Time remaining</span>
                  <Timer slotEnd={table.slotEnd} className="text-sm" />
                </div>
              )}
            </div>
          )}

          {/* Timer override */}
          <div className="rounded-xl p-4 space-y-3 border"
            style={{ background: '#ECFDF5', borderColor: '#A7F3D0' }}>
            <div className="flex items-center gap-2">
              <TimerReset className="w-4 h-4" style={{ color: G }} />
              <p style={{ ...labelStyle, color: G }}>Timer Override</p>
            </div>
            <div className="flex gap-2">
              {[
                { label: '+15m', ms: 15 * 60_000 },
                { label: '+30m', ms: 30 * 60_000 },
                { label: '+1h',  ms: 60 * 60_000 },
              ].map(({ label, ms }) => (
                <button key={label} onClick={() => extendTimer(ms)}
                  className="flex-1 text-sm font-semibold py-2 rounded-lg border-2 transition-colors focus:outline-none"
                  style={{ borderColor: G, color: G, background: '#fff' }}
                  onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = G }}>
                  {label}
                </button>
              ))}
              <button onClick={handleCleaning}
                className="flex-1 text-sm font-semibold py-2 rounded-lg border-2 transition-colors focus:outline-none"
                style={{ borderColor: '#F59E0B', color: '#92400E', background: '#fff' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FFFBEB' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}>
                Release Early
              </button>
            </div>
            <button onClick={resetTimer}
              className="w-full text-xs py-1 transition-colors"
              style={{ color: '#9CA3AF' }}
              onMouseEnter={e => e.currentTarget.style.color = G}
              onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}>
              Reset to original 1h 30m slot
            </button>
          </div>

          <button onClick={handleCleaning}
            className="w-full flex items-center justify-center gap-2 font-semibold py-2.5 rounded-lg text-sm transition-colors"
            style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}>
            <Sparkles className="w-4 h-4" /> Mark for Cleaning
          </button>
        </div>
      )}

      {/* Cleaning */}
      {table.status === 'cleaning' && (
        <div className="space-y-4">
          {table.cleaningStartTime && (
            <p className="text-sm" style={{ color: '#6B7280' }}>
              Cleaning in progress for {formatDuration(table.cleaningStartTime)}.
            </p>
          )}
          <button onClick={handleAvailable}
            className="w-full flex items-center justify-center gap-2 font-semibold py-2.5 rounded-lg text-sm"
            style={{ background: G, color: '#fff' }}>
            <CheckCircle2 className="w-4 h-4" /> Mark as Available
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Floor tab ────────────────────────────────────────────────────────────────
function FloorTab() {
  const { currentRestaurant } = useAuth()
  const { getTablesByRestaurant, getTokensByRestaurant } = useTableContext()
  const actions       = useTableActions()
  const waitingTokens = useQueue()

  const tables = getTablesByRestaurant(currentRestaurant?.id)
  const tokens = getTokensByRestaurant(currentRestaurant?.id)

  const [selectedTableId, setSelectedTableId] = useState(null)
  const [selectedToken,   setSelectedToken]   = useState(null)

  const selectedTable      = tables.find(t => t.id === selectedTableId) ?? null
  const selectedTableToken = selectedTable?.currentToken
    ? tokens.find(t => t.id === selectedTable.currentToken)
    : null

  function handleSelectToken(token) {
    setSelectedToken(token)
    if (token && token.id !== selectedToken?.id) {
      const suggested = suggestTable(tables, token.partySize)
      if (suggested) setSelectedTableId(suggested.id)
    }
  }

  function handleClosePanel() {
    setSelectedTableId(null)
    setSelectedToken(null)
  }

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <FloorMap
          tables={tables}
          tokens={tokens}
          selectedTableId={selectedTableId}
          onSelectTable={id => setSelectedTableId(id === selectedTableId ? null : id)}
        />
        {selectedTable && (
          <ManagerTableDetailPanel
            key={selectedTableId}
            table={selectedTable}
            token={selectedTableToken}
            waitingTokens={waitingTokens}
            selectedToken={selectedToken}
            actions={actions}
            onClose={handleClosePanel}
          />
        )}
      </div>
      <div className="md:w-72 border-t md:border-t-0 md:border-l flex flex-col overflow-hidden shrink-0"
        style={{ borderColor: BORDER }}>
        <QueuePanel
          tokens={waitingTokens}
          selectedToken={selectedToken}
          onSelectToken={handleSelectToken}
        />
      </div>
    </div>
  )
}

// ─── Queue tab ────────────────────────────────────────────────────────────────
const STATUS_FILTERS = ['All', 'Waiting', 'Seated', 'Done']

function QueueTab({ tokens, tables }) {
  const [filter, setFilter] = useState('All')

  const filtered = tokens.filter(t => {
    if (filter === 'All')     return true
    if (filter === 'Waiting') return t.status === 'waiting'
    if (filter === 'Seated')  return t.status === 'seated'
    if (filter === 'Done')    return t.status === 'done'
    return true
  })

  const th = 'text-left text-[10px] font-bold tracking-widest uppercase py-3 px-4'
  const td = 'py-3 px-4 text-sm'

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Filter pills */}
      <div className="flex gap-2 mb-5">
        {STATUS_FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors focus:outline-none"
            style={{
              background:  filter === f ? G       : '#fff',
              borderColor: filter === f ? G       : BORDER,
              color:       filter === f ? '#fff'  : '#374151',
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: BORDER }}>
        <table className="w-full" style={{ background: '#fff' }}>
          <thead style={{ background: BG, borderBottom: `1px solid ${BORDER}` }}>
            <tr>
              {['Token', 'Name', 'Phone', 'Party', 'Status', 'Wait', 'Table'].map(h => (
                <th key={h} className={th} style={{ color: '#9CA3AF' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-sm" style={{ color: '#9CA3AF' }}>
                  No tokens match this filter.
                </td>
              </tr>
            ) : filtered.map((t, i) => {
              const table = tables.find(tb => tb.currentToken === t.id || tb.id === t.tableId)
              return (
                <tr key={t.id}
                  style={{ borderTop: i > 0 ? `1px solid ${BORDER}` : 'none' }}>
                  <td className={td}>
                    <span className="font-mono font-bold" style={{ color: G }}>
                      #{String(t.tokenNumber).padStart(3, '0')}
                    </span>
                  </td>
                  <td className={td} style={{ color: '#111827', fontWeight: 500 }}>
                    {t.customerName}
                  </td>
                  <td className={td}>
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#9CA3AF' }}>
                      <Phone className="w-3 h-3" />
                      {t.phone || '—'}
                    </span>
                  </td>
                  <td className={td}>
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#374151' }}>
                      <Users className="w-3 h-3" />
                      {t.partySize}
                    </span>
                  </td>
                  <td className={td}><StatusPill status={t.status} /></td>
                  <td className={td}>
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>
                      {formatDuration(t.createdAt)}
                    </span>
                  </td>
                  <td className={td}>
                    <span className="text-xs font-medium" style={{ color: table ? G : '#9CA3AF' }}>
                      {table ? `Table ${table.number}` : '—'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Manager page ─────────────────────────────────────────────────────────────
export default function Manager() {
  const navigate = useNavigate()
  const { currentRestaurant, currentUser, logout } = useAuth()
  const {
    getTablesByRestaurant,
    getTokensByRestaurant,
    getSessionsByRestaurant,
    getAuditLogByRestaurant,
    updateTableCapacity,
  } = useTableContext()

  const [activeTab, setActiveTab] = useState('floor')

  const restaurantId = currentRestaurant?.id
  const tables       = getTablesByRestaurant(restaurantId)
  const tokens       = getTokensByRestaurant(restaurantId)
  const sessions     = getSessionsByRestaurant(restaurantId)
  const auditEntries = getAuditLogByRestaurant(restaurantId)

  function handleUpdateCapacity(tableId, cap) {
    updateTableCapacity(tableId, cap, currentUser?.id)
    toast.success(`Table capacity updated to ${cap}`)
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden"
      style={{ background: BG, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Navbar ── */}
      <header className="shrink-0 flex items-center px-6 py-3 border-b"
        style={{ background: '#fff', borderColor: BORDER }}>

        {/* Left */}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: G }}>
            <UtensilsCrossed className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="text-[9px] font-bold tracking-widest uppercase leading-tight"
              style={{ color: '#9CA3AF' }}>SeatSync · Floor Suite</p>
            <p className="text-base font-bold leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: G }}>
              {currentRestaurant?.name ?? 'Manager'}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <LiveClock />
          <Link to="/staff"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border"
            style={{ color: G, borderColor: '#A7F3D0', background: '#ECFDF5' }}>
            Staff View
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
            style={{ color: '#6B7280', borderColor: BORDER, background: '#fff' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = '#6B7280' }}>
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* ── Tab bar ── */}
      <div className="shrink-0 flex items-center gap-1.5 px-6 py-2.5 border-b overflow-x-auto"
        style={{ background: '#fff', borderColor: BORDER }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors focus:outline-none"
            style={{
              background:  activeTab === id ? G       : 'transparent',
              color:       activeTab === id ? '#fff'  : '#6B7280',
              border:      activeTab === id ? 'none'  : `1px solid transparent`,
            }}
            onMouseEnter={e => { if (activeTab !== id) e.currentTarget.style.background = BG }}
            onMouseLeave={e => { if (activeTab !== id) e.currentTarget.style.background = 'transparent' }}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {activeTab === 'floor' && <FloorTab />}

        {activeTab === 'queue' && (
          <QueueTab tokens={tokens} tables={tables} />
        )}

        {activeTab === 'sessions' && (
          <div className="flex-1 overflow-y-auto">
            <SessionHistory sessions={sessions} tables={tables} tokens={tokens} />
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="flex-1 overflow-y-auto">
            <AuditLog entries={auditEntries} tables={tables} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="flex-1 overflow-y-auto">
            <Analytics tables={tables} tokens={tokens} sessions={sessions} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto">
            <TableEditor tables={tables} onUpdateCapacity={handleUpdateCapacity} />
          </div>
        )}

      </div>
    </div>
  )
}
