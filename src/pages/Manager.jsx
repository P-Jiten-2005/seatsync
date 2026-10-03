import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  LayoutGrid, History, ShieldCheck, BarChart2, Settings2,
  X, Users, Clock, CheckCircle2, Sparkles, AlertTriangle, TimerReset,
} from 'lucide-react'
import { useAuth }         from '../context/AuthContext'
import { useTableContext } from '../context/TableContext'
import { useTableActions } from '../hooks/useTableActions'
import { useQueue }        from '../hooks/useQueue'
import { suggestTable }    from '../utils/allocation'
import { formatTime, formatDuration, isWarning } from '../utils/timeUtils'
import Navbar         from '../components/shared/Navbar'
import StatusBadge    from '../components/shared/StatusBadge'
import Timer          from '../components/shared/Timer'
import FloorMap       from '../components/FloorMap/FloorMap'
import QueuePanel     from '../components/Queue/QueuePanel'
import SessionHistory from '../components/Manager/SessionHistory'
import AuditLog       from '../components/Manager/AuditLog'
import Analytics      from '../components/Manager/Analytics'
import TableEditor    from '../components/Manager/TableEditor'

// ─── Tab bar ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'floor',     label: 'Floor',      Icon: LayoutGrid  },
  { id: 'sessions',  label: 'Sessions',   Icon: History     },
  { id: 'audit',     label: 'Audit Log',  Icon: ShieldCheck },
  { id: 'analytics', label: 'Analytics',  Icon: BarChart2   },
  { id: 'tables',    label: 'Tables',     Icon: Settings2   },
]

// ─── Manager table detail panel (with timer override) ────────────────────────

function ManagerTableDetailPanel({ table, token, waitingTokens, selectedToken, actions, onClose }) {
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

  function extendTimer(extraMs) {
    const base    = table.slotEnd ? new Date(table.slotEnd) : new Date()
    const newEnd  = new Date(Math.max(Date.now(), base.getTime()) + extraMs)
    actions.override(table.id, newEnd)
    toast.success(`Timer extended for Table T${table.number}`)
  }

  function resetTimer() {
    if (!table.checkInTime) return
    const newEnd = new Date(new Date(table.checkInTime).getTime() + 90 * 60_000)
    actions.override(table.id, newEnd)
    toast.success(`Timer reset to 1h 30m from check-in`)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="bg-gray-800 rounded-xl p-3">
          <span className="text-xl font-bold text-white">T{table.number}</span>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-white">Table {table.number}</h3>
            <StatusBadge status={table.status} />
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <Users className="w-3.5 h-3.5" />
            <span>Capacity {table.capacity}</span>
          </div>
        </div>
      </div>

      {/* Available */}
      {table.status === 'available' && (
        <div className="space-y-4">
          {waitingTokens.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No customers in queue.</p>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Assign token
                </label>
                <select
                  value={allocTokenId}
                  onChange={e => setAllocTokenId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a token…</option>
                  {waitingTokens.map(t => (
                    <option key={t.id} value={t.id}>
                      #{t.tokenNumber} · {t.customerName} · {t.partySize} guests
                    </option>
                  ))}
                </select>
                {chosenToken && (
                  <p className="text-xs text-gray-500">
                    Waiting {formatDuration(chosenToken.createdAt)} since {formatTime(chosenToken.createdAt)}
                  </p>
                )}
                {capacityWarn && (
                  <div className="flex items-center gap-2 text-orange-400 text-xs bg-orange-950/40 border border-orange-800 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Party of {chosenToken.partySize} exceeds capacity {table.capacity}.
                  </div>
                )}
              </div>
              <button
                onClick={handleAllocate}
                disabled={!allocTokenId || capacityWarn}
                className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
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
            <div className="bg-gray-800/60 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{token.customerName}</span>
                <span className="font-mono text-sm text-indigo-400">#{token.tokenNumber}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {token.partySize} guests
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> In at {formatTime(table.checkInTime)}
                </span>
              </div>
              {table.slotEnd && (
                <div className="flex items-center justify-between pt-1 border-t border-gray-700">
                  <span className="text-xs text-gray-500">Time remaining</span>
                  <Timer slotEnd={table.slotEnd} className="text-sm" />
                </div>
              )}
            </div>
          )}

          {/* Manager-only: timer override */}
          <div className="bg-indigo-950/30 border border-indigo-900 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <TimerReset className="w-4 h-4 text-indigo-400" />
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Timer Override
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '+15m', ms: 15 * 60_000 },
                { label: '+30m', ms: 30 * 60_000 },
                { label: '+1h',  ms: 60 * 60_000 },
              ].map(({ label, ms }) => (
                <button
                  key={label}
                  onClick={() => extendTimer(ms)}
                  className="bg-gray-800 hover:bg-indigo-800 text-gray-300 hover:text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={resetTimer}
              className="w-full text-xs text-indigo-500 hover:text-indigo-300 transition-colors py-1"
            >
              Reset to original 1h 30m slot
            </button>
          </div>

          <button
            onClick={handleCleaning}
            className="w-full flex items-center justify-center gap-2 bg-yellow-700 hover:bg-yellow-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" /> Mark for Cleaning
          </button>
        </div>
      )}

      {/* Cleaning */}
      {table.status === 'cleaning' && (
        <div className="space-y-4">
          {table.cleaningStartTime && (
            <p className="text-sm text-gray-400">
              Cleaning in progress for {formatDuration(table.cleaningStartTime)}.
            </p>
          )}
          <button
            onClick={handleAvailable}
            className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
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

  const selectedTable = tables.find(t => t.id === selectedTableId) ?? null
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
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
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
      <div className="md:w-72 border-t md:border-t-0 md:border-l border-gray-800 flex flex-col overflow-hidden shrink-0">
        <QueuePanel
          tokens={waitingTokens}
          selectedToken={selectedToken}
          onSelectToken={handleSelectToken}
        />
      </div>
    </div>
  )
}

// ─── Manager page ─────────────────────────────────────────────────────────────

export default function Manager() {
  const { currentRestaurant, currentUser } = useAuth()
  const {
    getTablesByRestaurant,
    getTokensByRestaurant,
    getSessionsByRestaurant,
    getAuditLogByRestaurant,
    updateTableCapacity,
  } = useTableContext()

  const [activeTab, setActiveTab] = useState('floor')

  const restaurantId = currentRestaurant?.id
  const tables  = getTablesByRestaurant(restaurantId)
  const tokens  = getTokensByRestaurant(restaurantId)
  const sessions = getSessionsByRestaurant(restaurantId)
  const auditEntries = getAuditLogByRestaurant(restaurantId)

  function handleUpdateCapacity(tableId, cap) {
    updateTableCapacity(tableId, cap, currentUser?.id)
    toast.success(`Table capacity updated to ${cap}`)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">
      <Navbar />

      {/* Tab bar */}
      <div className="bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex overflow-x-auto">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'floor' && <FloorTab />}

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

        {activeTab === 'tables' && (
          <div className="flex-1 overflow-y-auto">
            <TableEditor tables={tables} onUpdateCapacity={handleUpdateCapacity} />
          </div>
        )}
      </div>
    </div>
  )
}
