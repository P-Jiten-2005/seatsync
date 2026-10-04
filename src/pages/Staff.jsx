import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  UtensilsCrossed, LayoutGrid, Users, Clock, LogOut,
  CheckCircle2, Sparkles, AlertTriangle, X, ChevronRight,
  Timer as TimerIcon, ListOrdered,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTableContext } from '../context/TableContext'
import { useTableActions } from '../hooks/useTableActions'
import { useQueue } from '../hooks/useQueue'
import { suggestTable } from '../utils/allocation'
import {
  formatTime, formatDuration,
  getRemainingMs, formatCountdown, isWarning, isOverdue,
} from '../utils/timeUtils'

// ─── Live clock ──────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  )
  useEffect(() => {
    const id = setInterval(() =>
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    , 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="font-mono text-sm" style={{ color: '#374151' }}>{time}</span>
}

// ─── Theme tokens ────────────────────────────────────────────────────────────
const G = '#1B4332'   // forest green
const BG = '#F8F7F4'  // off-white
const BORDER = '#E5E1DA'

// ─── Countdown (light-theme) ─────────────────────────────────────────────────
function Countdown({ slotEnd }) {
  const [ms, setMs] = useState(() => getRemainingMs(slotEnd))
  useEffect(() => {
    setMs(getRemainingMs(slotEnd))
    const id = setInterval(() => setMs(getRemainingMs(slotEnd)), 1000)
    return () => clearInterval(id)
  }, [slotEnd])
  const over = isOverdue(slotEnd)
  const warn = !over && isWarning(slotEnd)
  return (
    <span className={`font-mono text-sm font-semibold ${
      over ? 'text-red-600 animate-pulse' : warn ? 'text-amber-600' : 'text-emerald-700'
    }`}>
      {over ? 'Overdue' : formatCountdown(ms)}
    </span>
  )
}

// ─── Status pill (light-theme) ───────────────────────────────────────────────
const STATUS_PILL = {
  available: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', label: 'Available' },
  occupied:  { bg: '#FFF1F2', text: '#9F1239', border: '#FECDD3', label: 'Occupied'  },
  cleaning:  { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', label: 'Sanitizing'},
}
function StatusPill({ status }) {
  const s = STATUS_PILL[status] ?? { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB', label: status }
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}>
      {s.label}
    </span>
  )
}

// ─── Cleaning elapsed (guards stale/null data) ───────────────────────────────
function cleaningElapsed(cleaningStartTime) {
  if (!cleaningStartTime) return 'Pending'
  const ms = Date.now() - new Date(cleaningStartTime).getTime()
  if (ms < 0 || ms > 2 * 60 * 60 * 1000) return 'Pending'
  return formatDuration(cleaningStartTime)
}

// ─── Table card (compact) ────────────────────────────────────────────────────
function TableCard({ table, token, selected, onClick }) {
  const isOccupied = table.status === 'occupied'
  const isCleaning = table.status === 'cleaning'

  const cardBorder = selected ? G : isOccupied ? '#FECDD3' : isCleaning ? '#FDE68A' : '#E5E1DA'
  const cardBg     = isOccupied ? '#FFF8F8' : isCleaning ? '#FFFDF0' : '#fff'

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl px-3 py-2.5 transition-all border-2 focus:outline-none"
      style={{
        background:  cardBg,
        borderColor: cardBorder,
        boxShadow:   selected ? '0 0 0 3px rgba(27,67,50,0.12)' : '0 1px 2px rgba(0,0,0,0.05)',
      }}
    >
      {/* Row 1: number + badge + inline info */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold shrink-0 w-9" style={{ color: G }}>
          T{String(table.number).padStart(2, '0')}
        </span>
        <StatusPill status={table.status} />
        {!isOccupied && (
          <span className="text-[11px] flex-1" style={{ color: '#6B7280' }}>
            {table.status === 'available' ? 'Ready to Seat' : cleaningElapsed(table.cleaningStartTime)}
          </span>
        )}
        {isOccupied && table.slotEnd && <Countdown slotEnd={table.slotEnd} />}
      </div>

      {/* Row 2 (occupied): guest name + party size */}
      {isOccupied && token && (
        <div className="flex items-center gap-2 mt-1.5 pl-11">
          <span className="text-xs font-semibold truncate" style={{ color: '#111827' }}>
            {token.customerName}
          </span>
          <span className="text-[11px] shrink-0" style={{ color: '#6B7280' }}>
            · {token.partySize}p
          </span>
        </div>
      )}

      {/* Capacity sub-line */}
      <p className="text-[10px] mt-1 pl-11" style={{ color: '#9CA3AF' }}>
        {table.capacity} Seats
      </p>
    </button>
  )
}

// ─── Detail panel ────────────────────────────────────────────────────────────
function TableDetailPanel({ table, token, waitingTokens, selectedToken, actions, onClose }) {
  const [allocTokenId, setAllocTokenId] = useState(
    selectedToken?.id ?? (waitingTokens[0]?.id || '')
  )
  const chosenToken    = waitingTokens.find(t => t.id === allocTokenId)
  const capacityWarn   = chosenToken && chosenToken.partySize > table.capacity

  function handleAllocate() {
    if (!allocTokenId) { toast.error('Select a token first.'); return }
    if (capacityWarn)  { toast.error('Party size exceeds table capacity.'); return }
    actions.allocate(table.id, allocTokenId)
    toast.success(`Table T${table.number} seated — token #${chosenToken.tokenNumber}`)
    onClose()
  }
  function handleCleaning() {
    actions.clean(table.id)
    toast.success(`Table T${table.number} marked for cleaning`)
    onClose()
  }
  function handleAvailable() {
    actions.available(table.id)
    toast.success(`Table T${table.number} is now available`)
    onClose()
  }

  return (
    <div className="mt-5 rounded-2xl p-5 border relative"
      style={{ background: '#fff', borderColor: BORDER }}>
      <button onClick={onClose}
        className="absolute top-4 right-4 transition-colors"
        style={{ color: '#9CA3AF' }}
        onMouseEnter={e => e.currentTarget.style.color = '#374151'}
        onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}>
        <X className="w-4 h-4" />
      </button>

      {/* Table header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-sm"
          style={{ background: G }}>
          T{String(table.number).padStart(2, '0')}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold" style={{ color: '#111827' }}>Table {table.number}</span>
            <StatusPill status={table.status} />
          </div>
          <span className="text-xs flex items-center gap-1" style={{ color: '#6B7280' }}>
            <Users className="w-3 h-3" /> Capacity {table.capacity}
          </span>
        </div>
      </div>

      {/* ── Available ── */}
      {table.status === 'available' && (
        <div className="space-y-4">
          {waitingTokens.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: '#9CA3AF' }}>
              No customers in queue — nothing to allocate.
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: '#374151' }}>
                  Assign Token
                </label>
                <select
                  value={allocTokenId}
                  onChange={e => setAllocTokenId(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition"
                  style={{ border: `1px solid ${BORDER}`, background: BG, color: '#111827' }}
                >
                  <option value="">Select a token…</option>
                  {waitingTokens.map(t => (
                    <option key={t.id} value={t.id}>
                      #{t.tokenNumber} · {t.customerName} · {t.partySize} guests
                    </option>
                  ))}
                </select>
                {chosenToken && (
                  <p className="text-xs" style={{ color: '#6B7280' }}>
                    Waiting since {formatTime(chosenToken.createdAt)} ({formatDuration(chosenToken.createdAt)})
                  </p>
                )}
                {capacityWarn && (
                  <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
                    style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}>
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Party of {chosenToken.partySize} exceeds this table's capacity of {table.capacity}.
                  </div>
                )}
              </div>
              <button onClick={handleAllocate}
                disabled={!allocTokenId || capacityWarn}
                className="w-full flex items-center justify-center gap-2 font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40"
                style={{ background: G, color: '#fff' }}>
                <CheckCircle2 className="w-4 h-4" /> Seat Guest
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Occupied ── */}
      {table.status === 'occupied' && (
        <div className="space-y-4">
          {token && (
            <div className="rounded-xl p-4 space-y-2"
              style={{ background: BG, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold" style={{ color: '#111827' }}>{token.customerName}</span>
                <span className="font-mono text-sm" style={{ color: G }}>#{token.tokenNumber}</span>
              </div>
              <div className="flex items-center gap-4 text-xs" style={{ color: '#6B7280' }}>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {token.partySize} guests</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> In at {formatTime(table.checkInTime)}</span>
              </div>
              {table.slotEnd && (
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: BORDER }}>
                  <span className="text-xs" style={{ color: '#6B7280' }}>Time remaining</span>
                  <Countdown slotEnd={table.slotEnd} />
                </div>
              )}
            </div>
          )}
          <button onClick={handleCleaning}
            className="w-full flex items-center justify-center gap-2 font-semibold py-2.5 rounded-lg text-sm transition-colors"
            style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}>
            <Sparkles className="w-4 h-4" /> Needs Cleaning
          </button>
        </div>
      )}

      {/* ── Cleaning ── */}
      {table.status === 'cleaning' && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Sanitizing in progress
            {cleaningElapsed(table.cleaningStartTime) !== 'Pending'
              ? ` for ${cleaningElapsed(table.cleaningStartTime)}.`
              : ' — start time pending.'}
          </p>
          <button onClick={handleAvailable}
            className="w-full flex items-center justify-center gap-2 font-semibold py-2.5 rounded-lg text-sm transition-colors"
            style={{ background: G, color: '#fff' }}>
            <CheckCircle2 className="w-4 h-4" /> Set as Available
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Staff page ───────────────────────────────────────────────────────────────
const NAV = [
  { icon: LayoutGrid,  label: 'Live Floor Plan',      active: true  },
  { icon: ListOrdered, label: 'Waitlist & Walk-ins',   active: false },
  { icon: TimerIcon,   label: 'Pacing & Timeline',     active: false },
]

export default function Staff() {
  const navigate = useNavigate()
  const { currentUser, currentRestaurant, logout } = useAuth()
  const { getTablesByRestaurant, getTokensByRestaurant, getAuditLogByRestaurant } = useTableContext()
  const actions       = useTableActions()
  const waitingTokens = useQueue()

  const tables   = getTablesByRestaurant(currentRestaurant?.id)
  const tokens   = getTokensByRestaurant(currentRestaurant?.id)
  const auditLog = getAuditLogByRestaurant(currentRestaurant?.id)

  const [selectedTableId, setSelectedTableId] = useState(null)
  const [selectedToken,   setSelectedToken]   = useState(null)

  const selectedTable      = tables.find(t => t.id === selectedTableId) ?? null
  const selectedTableToken = selectedTable?.currentToken
    ? tokens.find(t => t.id === selectedTable.currentToken)
    : null

  function handleSelectTable(tableId) {
    setSelectedTableId(prev => prev === tableId ? null : tableId)
  }

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

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  // Stats
  const occupied      = tables.filter(t => t.status === 'occupied').length
  const available     = tables.filter(t => t.status === 'available').length
  const cleaning      = tables.filter(t => t.status === 'cleaning').length
  const occupancyPct  = tables.length ? Math.round((occupied / tables.length) * 100) : 0

  const stats = [
    { label: 'Occupied Floor',  value: `${occupancyPct}%`,  sub: `${occupied} of ${tables.length} tables`, accent: '#1B4332' },
    { label: 'Ready to Seat',   value: available,            sub: 'tables available',                       accent: '#2D6A4F' },
    { label: 'In Turnover',     value: cleaning,             sub: 'tables cleaning',                        accent: '#F59E0B' },
    { label: 'Live Waitlist',   value: waitingTokens.length, sub: 'parties waiting',                        accent: '#344E6E' },
  ]

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Left sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-[220px] flex flex-col shrink-0 border-r"
        style={{ background: '#fff', borderColor: BORDER }}>

        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: G }}>
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight" style={{ color: G }}>SeatSync</p>
              <p className="text-[9px] tracking-widest font-semibold" style={{ color: '#9CA3AF' }}>FLOOR SUITE</p>
            </div>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background: BG }}>
            <p className="text-xs font-semibold truncate" style={{ color: '#111827' }}>
              {currentRestaurant?.name ?? '—'}
            </p>
            <p className="text-[11px]" style={{ color: '#9CA3AF' }}>Main Dining Room</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ icon: Icon, label, active }) => (
            <div key={label}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{
                background: active ? '#ECFDF5' : 'transparent',
                color:      active ? G         : '#9CA3AF',
              }}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
              {active && <ChevronRight className="w-3 h-3 ml-auto" style={{ color: G }} />}
            </div>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-3 pb-5 pt-3 border-t" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: G }}>
              {currentUser?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: '#111827' }}>
                {currentUser?.name ?? '—'}
              </p>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize"
                style={{ background: '#ECFDF5', color: G }}>
                {currentUser?.role}
              </span>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ color: '#9CA3AF' }}
            onMouseEnter={e => { e.currentTarget.style.background = BG; e.currentTarget.style.color = '#374151' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}>
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top navbar */}
        <div className="px-6 h-14 border-b flex items-center justify-between shrink-0"
          style={{ background: '#fff', borderColor: BORDER }}>
          <div>
            <p className="text-base font-bold leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: G }}>
              {currentRestaurant?.name ?? '—'}
            </p>
            <p className="text-[11px]" style={{ color: '#9CA3AF' }}>Main Dining Room</p>
          </div>
          <div className="flex items-center gap-4">
            <LiveClock />
            {currentUser?.role === 'manager' && (
              <Link to="/manager"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: '#ECFDF5', color: G, border: `1px solid #A7F3D0` }}>
                Manager View
              </Link>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="px-6 py-3 border-b flex items-center gap-3 shrink-0"
          style={{ background: '#fff', borderColor: BORDER }}>
          {stats.map(({ label, value, sub, accent }) => (
            <div key={label}
              className="flex-1 rounded-xl px-4 py-2.5 border"
              style={{ background: BG, borderColor: BORDER, borderLeft: `3px solid ${accent}` }}>
              <p className="text-lg font-bold leading-none mb-0.5" style={{ color: accent }}>{value}</p>
              <p className="text-[11px] font-medium" style={{ color: '#374151' }}>{label}</p>
              <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Table grid + detail */}
        <div className="flex-1 overflow-y-auto p-6 pb-4">
          <div className="grid grid-cols-4 gap-3">
            {tables.map(table => {
              const tok = table.currentToken ? tokens.find(t => t.id === table.currentToken) : null
              return (
                <TableCard
                  key={table.id}
                  table={table}
                  token={tok}
                  selected={table.id === selectedTableId}
                  onClick={() => handleSelectTable(table.id)}
                />
              )
            })}
          </div>

          {selectedTable && (
            <TableDetailPanel
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

        {/* Recent activity strip */}
        {auditLog.length > 0 && (() => {
          const ACTION_LABEL = {
            TABLE_ALLOCATED:      'Seated',
            STATUS_CHANGED:       'Status changed',
            AUTO_CLEANING:        'Auto-clean',
            TIMER_OVERRIDDEN:     'Timer override',
            TABLE_SETTINGS_CHANGED: 'Settings updated',
          }
          const recent = [...auditLog]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5)
          return (
            <div className="shrink-0 border-t px-6 py-3" style={{ borderColor: BORDER, background: '#fff' }}>
              <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: '#9CA3AF' }}>
                Recent Activity
              </p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {recent.map(entry => (
                  <div key={entry.id}
                    className="shrink-0 rounded-lg px-3 py-2 border"
                    style={{ background: BG, borderColor: BORDER, minWidth: '140px' }}>
                    <p className="text-xs font-semibold" style={{ color: '#111827' }}>
                      {ACTION_LABEL[entry.action] ?? entry.action}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#6B7280' }}>
                      T{entry.tableId?.split('-t')[1]?.padStart(2, '0') ?? '—'}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>
                      {formatTime(entry.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </main>

      {/* ── Right panel ──────────────────────────────────────────────────── */}
      <aside className="w-[300px] flex flex-col shrink-0 border-l"
        style={{ background: '#fff', borderColor: BORDER }}>

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: G }}>
              Waitlist Queue
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: '#ECFDF5', color: G }}>
              {waitingTokens.length} {waitingTokens.length === 1 ? 'party' : 'parties'}
            </span>
          </div>
        </div>

        {/* Queue list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {waitingTokens.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Users className="w-8 h-8 mb-2" style={{ color: '#D1D5DB' }} />
              <p className="text-sm font-medium" style={{ color: '#9CA3AF' }}>Queue is empty</p>
              <p className="text-xs mt-1" style={{ color: '#D1D5DB' }}>No parties waiting</p>
            </div>
          ) : (
            waitingTokens.map(token => {
              const isSelected = selectedToken?.id === token.id
              return (
                <div key={token.id}
                  className="rounded-xl p-3.5 border transition-all"
                  style={{
                    background:  isSelected ? '#ECFDF5' : BG,
                    borderColor: isSelected ? '#A7F3D0' : BORDER,
                  }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold font-mono" style={{ color: G }}>
                          #{token.tokenNumber}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: '#111827' }}>
                          {token.customerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]" style={{ color: '#6B7280' }}>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />{token.partySize} guests
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />{formatDuration(token.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectToken(token)}
                    className="w-full py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    style={{
                      background: isSelected ? '#152F24' : G,
                      color:      '#fff',
                      border:     'none',
                    }}>
                    {isSelected ? 'Table Selected ✓' : 'Assign to Table'}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </aside>
    </div>
  )
}
