import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { UtensilsCrossed, Users, MonitorPlay } from 'lucide-react'
import { useTableContext } from '../context/TableContext'

const MAX_SERVING = 4
const MAX_WAITING = 12

const G      = '#1B4332'
const BG     = '#F8F7F4'
const BORDER = '#E5E1DA'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function serviceLabel() {
  const h = new Date().getHours()
  if (h < 11) return 'BREAKFAST SERVICE'
  if (h < 15) return 'LUNCH SERVICE'
  if (h < 18) return 'AFTERNOON SERVICE'
  return 'DINNER SERVICE'
}

// ─── Live clock ───────────────────────────────────────────────────────────────

function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="text-right">
      <p className="font-mono font-black tabular-nums leading-none"
        style={{ fontSize: 52, color: G }}>
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
      <p className="text-base font-medium mt-0.5" style={{ color: '#9CA3AF' }}>
        {now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
    </div>
  )
}

// ─── Restaurant picker overlay ────────────────────────────────────────────────

function RestaurantPicker({ restaurants, onSelect }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10"
      style={{ background: BG, fontFamily: "'Inter', sans-serif" }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-md"
        style={{ background: G }}>
        <MonitorPlay className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-4xl font-bold mb-2"
        style={{ fontFamily: "'Playfair Display', Georgia, serif", color: G }}>
        SeatSync Display
      </h1>
      <p className="text-lg mb-10" style={{ color: '#6B7280' }}>
        Select the restaurant for this display screen
      </p>
      {restaurants.length === 0 ? (
        <p className="text-base" style={{ color: '#9CA3AF' }}>Loading restaurants…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
          {restaurants.map(r => (
            <button key={r.id} onClick={() => onSelect(r.id)}
              className="text-left rounded-2xl p-6 border-2 transition-all focus:outline-none"
              style={{ background: '#fff', borderColor: BORDER }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = G; e.currentTarget.style.background = '#ECFDF5' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = '#fff' }}>
              <p className="text-xl font-bold"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: G }}>
                {r.name}
              </p>
              {r.location && (
                <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>{r.location}</p>
              )}
            </button>
          ))}
        </div>
      )}
      <p className="text-sm mt-10" style={{ color: '#9CA3AF' }}>
        Tip: bookmark <code style={{ color: '#6B7280' }}>/display?r=&lt;id&gt;</code> to skip this screen.
      </p>
    </div>
  )
}

// ─── "Now Serving" card ───────────────────────────────────────────────────────

function ServingCard({ token, tableNumber }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center rounded-3xl px-8 py-6 border-2"
      style={{
        background:  '#fff',
        borderColor: G,
        boxShadow:   '0 0 32px rgba(27,67,50,0.12)',
        animation:   'fadeInUp 400ms ease both',
      }}>
      <p className="text-xl font-semibold tracking-widest uppercase mb-3"
        style={{ color: '#9CA3AF' }}>
        Table {tableNumber}
      </p>
      <p className="font-black font-mono leading-none"
        style={{ fontSize: 96, color: G }}>
        #{String(token.tokenNumber).padStart(3, '0')}
      </p>
      <p className="text-2xl font-semibold mt-4 text-center"
        style={{ color: '#374151' }}>
        {token.customerName}
      </p>
      <div className="flex items-center gap-2 mt-2" style={{ color: '#9CA3AF' }}>
        <Users className="w-5 h-5" />
        <span className="text-xl font-medium">{token.partySize}</span>
      </div>
    </div>
  )
}

// ─── Waiting pill ─────────────────────────────────────────────────────────────

function WaitingPill({ token, position }) {
  return (
    <div className="flex flex-col items-center rounded-2xl px-6 py-4 border shrink-0"
      style={{ background: '#fff', borderColor: BORDER, minWidth: 120 }}>
      <p className="text-sm font-bold mb-1" style={{ color: '#9CA3AF' }}>#{position}</p>
      <p className="font-black font-mono leading-none"
        style={{ fontSize: 36, color: '#374151' }}>
        {String(token.tokenNumber).padStart(3, '0')}
      </p>
      <div className="flex items-center gap-1 mt-2" style={{ color: '#9CA3AF' }}>
        <Users className="w-4 h-4" />
        <span className="text-base font-medium">{token.partySize}</span>
      </div>
    </div>
  )
}

// ─── Main display page ────────────────────────────────────────────────────────

export default function Display() {
  const [params, setParams]       = useSearchParams()
  const restaurantId              = params.get('r')
  const { restaurants, getWaitingTokens, getTokensByRestaurant, getTablesByRestaurant } = useTableContext()

  function handleSelectRestaurant(id) { setParams({ r: id }) }

  const restaurant = restaurants.find(r => r.id === restaurantId)

  if (!restaurantId || (restaurants.length > 0 && !restaurant)) {
    return <RestaurantPicker restaurants={restaurants} onSelect={handleSelectRestaurant} />
  }

  // Still loading restaurants — show a holding screen
  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <p className="text-xl font-medium" style={{ color: '#9CA3AF', fontFamily: "'Inter', sans-serif" }}>
          Loading…
        </p>
      </div>
    )
  }

  const waitingTokens = getWaitingTokens(restaurantId)
  const allTokens     = getTokensByRestaurant(restaurantId)
  const tables        = getTablesByRestaurant(restaurantId)

  const seatedTokens = allTokens
    .filter(t => t.status === 'seated')
    .map(t => {
      const table = tables.find(tb => tb.id === t.tableId)
      return { token: t, table, checkInTime: table?.checkInTime ?? t.createdAt }
    })
    .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))
    .slice(0, MAX_SERVING)

  const visibleWaiting = waitingTokens.slice(0, MAX_WAITING)
  const hiddenCount    = Math.max(0, waitingTokens.length - MAX_WAITING)

  return (
    <div className="h-screen flex flex-col overflow-hidden select-none"
      style={{ background: BG, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Keyframe ── */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Top bar ── */}
      <header className="shrink-0 flex items-center px-10 py-5 border-b"
        style={{ background: '#fff', borderColor: BORDER }}>

        {/* Left: logo + name */}
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: G }}>
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: '#9CA3AF' }}>SeatSync</p>
            <p className="text-3xl font-bold leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: G }}>
              {restaurant.name}
            </p>
          </div>
        </div>

        {/* Center: service indicator */}
        <div className="flex items-center gap-3 flex-1 justify-center">
          <span className="w-3 h-3 rounded-full animate-pulse shrink-0"
            style={{ background: '#22C55E' }} />
          <span className="text-xl font-bold tracking-widest"
            style={{ color: G }}>
            {serviceLabel()} · LIVE
          </span>
        </div>

        {/* Right: clock */}
        <div className="flex-1 flex justify-end">
          <LiveClock />
        </div>
      </header>

      {/* ── Now Serving (60%) ── */}
      <section className="flex flex-col px-10 py-6 border-b overflow-hidden"
        style={{ flex: '3', borderColor: BORDER }}>

        <div className="flex items-center gap-4 mb-5 shrink-0">
          <p className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: G }}>
            Now Serving
          </p>
          {seatedTokens.length > 0 && (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: '#ECFDF5', color: G, border: `1px solid #A7F3D0` }}>
              {seatedTokens.length}
            </span>
          )}
        </div>

        {seatedTokens.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: BORDER }}>
              <UtensilsCrossed className="w-7 h-7" style={{ color: '#D1D5DB' }} />
            </div>
            <p className="text-3xl font-semibold" style={{ color: '#D1D5DB' }}>
              No tables currently being served
            </p>
          </div>
        ) : (
          <div className="flex-1 flex gap-5 min-h-0">
            {seatedTokens.map(({ token, table }) => (
              <ServingCard key={token.id} token={token} tableNumber={table?.number ?? '?'} />
            ))}
          </div>
        )}
      </section>

      {/* ── Waiting Queue (40%) ── */}
      <section className="flex flex-col px-10 py-6 overflow-hidden"
        style={{ flex: '2' }}>

        <div className="flex items-center gap-4 mb-5 shrink-0">
          <p className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: '#9CA3AF' }}>
            Waiting Queue
          </p>
          {waitingTokens.length > 0 && (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: BG, color: '#6B7280', border: `1px solid ${BORDER}` }}>
              {waitingTokens.length}
            </span>
          )}
        </div>

        {waitingTokens.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-2xl font-semibold" style={{ color: '#D1D5DB' }}>
              No parties currently waiting
            </p>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-4 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none' }}>
            {visibleWaiting.map((token, i) => (
              <WaitingPill key={token.id} token={token} position={i + 1} />
            ))}
            {hiddenCount > 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl px-6 py-4 shrink-0"
                style={{ background: BG, border: `1px dashed ${BORDER}`, minWidth: 100 }}>
                <p className="text-2xl font-bold" style={{ color: '#9CA3AF' }}>+{hiddenCount}</p>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>more</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer className="shrink-0 px-10 py-3 border-t text-center"
        style={{ borderColor: BORDER, background: '#fff' }}>
        <p className="text-base font-medium" style={{ color: '#9CA3AF' }}>
          Please listen for your token number to be called &nbsp;·&nbsp; {restaurant.name}
        </p>
      </footer>
    </div>
  )
}
