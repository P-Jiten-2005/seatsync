import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { UtensilsCrossed, Users, Clock, MonitorPlay } from 'lucide-react'
import { useTableContext } from '../context/TableContext'
import { restaurants } from '../data/restaurants'
import { formatDuration } from '../utils/timeUtils'

const MAX_SERVING = 6   // "Now Serving" cards visible at once
const MAX_WAITING = 12  // waiting rows before truncating

// ─── Live clock ──────────────────────────────────────────────────────────────

function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="font-mono text-3xl font-bold text-white tabular-nums">
      {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

// ─── Restaurant picker overlay ────────────────────────────────────────────────

function RestaurantPicker({ onSelect }) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8">
      <div className="bg-indigo-600 rounded-2xl p-4 mb-6">
        <MonitorPlay className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">SeatSync Display</h1>
      <p className="text-gray-400 mb-10 text-center">
        Select the restaurant for this display screen.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        {restaurants.map(r => (
          <button
            key={r.id}
            onClick={() => onSelect(r.id)}
            className="bg-gray-900 border border-gray-700 hover:border-indigo-500 hover:bg-gray-800 text-left rounded-2xl p-5 transition-all group"
          >
            <p className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
              {r.name}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{r.location}</p>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-600 mt-8">
        Tip: bookmark <code className="text-gray-500">/display?r=r1</code> to skip this screen.
      </p>
    </div>
  )
}

// ─── "Now Serving" card ───────────────────────────────────────────────────────

function ServingCard({ token, tableNumber }) {
  return (
    <div className="flex flex-col items-center bg-green-950/50 border-2 border-green-700 rounded-2xl px-8 py-6 min-w-[140px]">
      <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-1">Table {tableNumber}</p>
      <p className="text-6xl font-black text-green-400 font-mono leading-none">
        #{token.tokenNumber}
      </p>
      <p className="text-sm text-green-700 mt-2 truncate max-w-[130px]">{token.customerName}</p>
    </div>
  )
}

// ─── Waiting row ──────────────────────────────────────────────────────────────

function WaitingRow({ token, position }) {
  return (
    <div className="flex items-center gap-6 py-5 border-b border-gray-800/60 last:border-0">
      {/* Position */}
      <span className="text-2xl font-bold text-gray-700 w-10 text-right shrink-0">
        {position}
      </span>

      {/* Token number */}
      <span className="font-mono text-4xl font-black text-white w-28 shrink-0">
        #{token.tokenNumber}
      </span>

      {/* Name */}
      <span className="text-2xl font-semibold text-gray-200 flex-1 truncate">
        {token.customerName}
      </span>

      {/* Party size */}
      <div className="hidden sm:flex items-center gap-2 text-gray-500 shrink-0">
        <Users className="w-5 h-5" />
        <span className="text-xl font-medium">{token.partySize}</span>
      </div>

      {/* Wait time */}
      <div className="hidden md:flex items-center gap-2 text-gray-600 shrink-0 w-24 justify-end">
        <Clock className="w-4 h-4" />
        <span className="text-lg">{formatDuration(token.createdAt)}</span>
      </div>
    </div>
  )
}

// ─── Main display page ────────────────────────────────────────────────────────

export default function Display() {
  const [params, setParams] = useSearchParams()
  const restaurantId = params.get('r')

  const { getWaitingTokens, getTokensByRestaurant, getTablesByRestaurant } = useTableContext()

  function handleSelectRestaurant(id) {
    setParams({ r: id })
  }

  if (!restaurantId || !restaurants.find(r => r.id === restaurantId)) {
    return <RestaurantPicker onSelect={handleSelectRestaurant} />
  }

  const restaurant    = restaurants.find(r => r.id === restaurantId)
  const waitingTokens = getWaitingTokens(restaurantId)
  const allTokens     = getTokensByRestaurant(restaurantId)
  const tables        = getTablesByRestaurant(restaurantId)

  // Seated tokens: status "seated", sorted by table checkInTime descending (most recent first)
  const seatedTokens = allTokens
    .filter(t => t.status === 'seated')
    .map(t => {
      const table = tables.find(tb => tb.id === t.tableId)
      return { token: t, table, checkInTime: table?.checkInTime ?? t.createdAt }
    })
    .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))
    .slice(0, MAX_SERVING)

  const visibleWaiting  = waitingTokens.slice(0, MAX_WAITING)
  const hiddenCount     = Math.max(0, waitingTokens.length - MAX_WAITING)

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* ── Header ── */}
      <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex items-center gap-4 shrink-0">
        <div className="bg-indigo-600 rounded-xl p-2 shrink-0">
          <UtensilsCrossed className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider leading-none mb-0.5">SeatSync</p>
          <p className="text-lg font-bold text-white leading-tight truncate">{restaurant.name}</p>
        </div>
        <div className="flex-1" />
        <LiveClock />
      </header>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col p-8 gap-10 overflow-y-auto">

        {/* NOW SERVING */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-sm font-bold text-green-500 uppercase tracking-widest">
              Now Serving
            </span>
            {seatedTokens.length > 0 && (
              <span className="bg-green-900/50 border border-green-800 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">
                {seatedTokens.length}
              </span>
            )}
          </div>

          {seatedTokens.length === 0 ? (
            <div className="flex items-center gap-3 text-gray-700 py-4">
              <div className="w-3 h-3 rounded-full bg-gray-800" />
              <p className="text-xl font-medium">No tables currently being served</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {seatedTokens.map(({ token, table }) => (
                <ServingCard
                  key={token.id}
                  token={token}
                  tableNumber={table?.number ?? '?'}
                />
              ))}
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="border-t border-gray-800" />

        {/* WAITING */}
        <section className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              Waiting
            </span>
            {waitingTokens.length > 0 && (
              <span className="bg-gray-800 border border-gray-700 text-gray-300 text-xs font-bold px-2 py-0.5 rounded-full">
                {waitingTokens.length}
              </span>
            )}
          </div>

          {waitingTokens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-3xl font-bold text-gray-700 mb-2">No customers waiting</p>
              <p className="text-xl text-gray-600">Walk-ins welcome!</p>
            </div>
          ) : (
            <>
              <div>
                {visibleWaiting.map((token, i) => (
                  <WaitingRow key={token.id} token={token} position={i + 1} />
                ))}
              </div>
              {hiddenCount > 0 && (
                <p className="text-center text-gray-600 text-lg mt-4">
                  + {hiddenCount} more in queue
                </p>
              )}
            </>
          )}
        </section>

      </div>

      {/* ── Footer ── */}
      <footer className="px-8 py-3 border-t border-gray-800 shrink-0">
        <p className="text-xs text-gray-700 text-center">
          Please listen for your token number to be called · {restaurant.name} · {restaurant.location}
        </p>
      </footer>
    </div>
  )
}
