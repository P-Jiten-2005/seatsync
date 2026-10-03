import { useState } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle2, Sparkles, AlertTriangle, X, Users, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTableContext } from '../context/TableContext'
import { useTableActions } from '../hooks/useTableActions'
import { useQueue } from '../hooks/useQueue'
import { suggestTable } from '../utils/allocation'
import { formatTime, formatDuration } from '../utils/timeUtils'
import Navbar from '../components/shared/Navbar'
import StatusBadge from '../components/shared/StatusBadge'
import Timer from '../components/shared/Timer'
import FloorMap from '../components/FloorMap/FloorMap'
import QueuePanel from '../components/Queue/QueuePanel'

// ─── Table detail / action panel ────────────────────────────────────────────

function TableDetailPanel({ table, token, waitingTokens, selectedToken, actions, onClose }) {
  const [allocTokenId, setAllocTokenId] = useState(
    selectedToken?.id ?? (waitingTokens[0]?.id || '')
  )

  const chosenToken = waitingTokens.find(t => t.id === allocTokenId)
  const capacityWarning = chosenToken && chosenToken.partySize > table.capacity

  function handleAllocate() {
    if (!allocTokenId) { toast.error('Select a token first.'); return }
    if (capacityWarning) { toast.error('Party size exceeds table capacity.'); return }
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
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 relative">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Table header */}
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

      {/* ── AVAILABLE: allocate ── */}
      {table.status === 'available' && (
        <div className="space-y-4">
          {waitingTokens.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No customers in queue — nothing to allocate.
            </p>
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
                    Waiting since {formatTime(chosenToken.createdAt)} ({formatDuration(chosenToken.createdAt)})
                  </p>
                )}
                {capacityWarning && (
                  <div className="flex items-center gap-2 text-orange-400 text-xs bg-orange-950/40 border border-orange-800 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Party of {chosenToken.partySize} exceeds this table's capacity of {table.capacity}.
                  </div>
                )}
              </div>
              <button
                onClick={handleAllocate}
                disabled={!allocTokenId || capacityWarning}
                className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Seat Customer
              </button>
            </>
          )}
        </div>
      )}

      {/* ── OCCUPIED: info + mark cleaning ── */}
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
                  <Clock className="w-3 h-3" />
                  In at {formatTime(table.checkInTime)}
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
          <button
            onClick={handleCleaning}
            className="w-full flex items-center justify-center gap-2 bg-yellow-700 hover:bg-yellow-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Mark for Cleaning
          </button>
        </div>
      )}

      {/* ── CLEANING: mark available ── */}
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
            <CheckCircle2 className="w-4 h-4" />
            Mark as Available
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Staff page ──────────────────────────────────────────────────────────────

export default function Staff() {
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

  function handleSelectTable(tableId) {
    setSelectedTableId(tableId)
    // When clicking an available table while a queue token is selected,
    // pre-fill the allocation dropdown with that token.
    // (The detail panel reads selectedToken on mount via its local state.)
  }

  function handleSelectToken(token) {
    setSelectedToken(token)
    // If the token was already selected, deselect; otherwise also
    // auto-jump to a suggested available table.
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
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">
      <Navbar />

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* ── Floor map + action panel ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          <FloorMap
            tables={tables}
            tokens={tokens}
            selectedTableId={selectedTableId}
            onSelectTable={handleSelectTable}
          />

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

        {/* ── Queue panel — sidebar on md+, panel below on mobile ── */}
        <div className="md:w-72 border-t md:border-t-0 md:border-l border-gray-800 flex flex-col overflow-hidden shrink-0">
          <QueuePanel
            tokens={waitingTokens}
            selectedToken={selectedToken}
            onSelectToken={handleSelectToken}
          />
        </div>
      </div>
    </div>
  )
}
