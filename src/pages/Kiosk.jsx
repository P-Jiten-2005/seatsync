import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { UtensilsCrossed, ChevronDown, CheckCircle2, Users, Clock, ArrowRight, ArrowLeft } from 'lucide-react'
import { useTableContext } from '../context/TableContext'
import { formatTime, formatDuration } from '../utils/timeUtils'

// ─── Theme ───────────────────────────────────────────────────────────────────
const G      = '#1B4332'
const BG     = '#F8F7F4'
const BORDER = '#E5E1DA'

// ─── Live clock ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [t, setT] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  )
  useEffect(() => {
    const id = setInterval(() =>
      setT(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    , 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="font-mono text-sm font-medium" style={{ color: '#374151' }}>{t}</span>
}

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = ['Party Size', 'Contact Info', 'Queue Ticket']
function StepBar({ step }) {
  return (
    <div className="flex items-center gap-0 border-b" style={{ borderColor: BORDER }}>
      {STEPS.map((label, i) => {
        const n       = i + 1
        const active  = step === n
        const done    = step > n
        return (
          <div key={label}
            className="flex-1 flex items-center gap-2 px-5 py-3 text-xs font-semibold"
            style={{
              borderBottom: active ? `2px solid ${G}` : '2px solid transparent',
              color:        active ? G : done ? '#6B7280' : '#9CA3AF',
              background:   active ? '#ECFDF5' : 'transparent',
            }}>
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{
                background: active ? G : done ? '#D1FAE5' : '#F3F4F6',
                color:      active ? '#fff' : done ? G : '#9CA3AF',
              }}>
              {done ? '✓' : `0${n}`}
            </span>
            {label}
          </div>
        )
      })}
    </div>
  )
}

// ─── QR placeholder ───────────────────────────────────────────────────────────
function QRPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl p-5 border"
      style={{ background: BG, borderColor: BORDER }}>
      <div className="w-28 h-28 rounded-lg border-2 flex items-center justify-center mb-3"
        style={{ borderColor: BORDER, background: '#fff' }}>
        {/* simplified QR-like grid */}
        <div className="grid grid-cols-7 gap-px opacity-60">
          {Array.from({ length: 49 }, (_, i) => {
            const corners = [0,1,2,7,8,14,15,16,6,13,28,35,42,43,44,32,33,34,40,41,47,48]
            const dark = corners.includes(i) || Math.random() > 0.6
            return (
              <div key={i} className="w-2.5 h-2.5 rounded-[1px]"
                style={{ background: dark ? '#374151' : 'transparent' }} />
            )
          })}
        </div>
      </div>
      <p className="text-xs font-semibold text-center" style={{ color: '#374151' }}>
        Live Mobile Tracker
      </p>
      <p className="text-[10px] text-center mt-0.5" style={{ color: '#9CA3AF' }}>
        Scan to track from your phone
      </p>
    </div>
  )
}

// ─── Kiosk page ───────────────────────────────────────────────────────────────
const PARTY_SIZES  = [1, 2, 3, 4, 5, 6, 7, 8]
const PREFERENCES  = ['Standard Dining', 'High Top / Bar', 'Outdoor', 'Booth Preferred']

export default function Kiosk() {
  const { addToken, getWaitingTokens, restaurants } = useTableContext()

  const [restaurantId, setRestaurantId] = useState('')
  const [step,         setStep]         = useState(1)
  const [partySize,    setPartySize]    = useState(null)
  const [preference,   setPreference]   = useState('')
  const [name,         setName]         = useState('')
  const [phone,        setPhone]        = useState('')
  const [issuedToken,  setIssuedToken]  = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const selectedRestaurant = restaurants.find(r => r.id === restaurantId)
  const waitingTokens      = getWaitingTokens(restaurantId)

  const waitingAhead = issuedToken
    ? waitingTokens.filter(t => t.id !== issuedToken.id && new Date(t.createdAt) < new Date(issuedToken.createdAt)).length
    : waitingTokens.length

  const avgWaitMins = waitingTokens.length === 0 ? 5 : waitingTokens.length * 15

  function goStep2() {
    if (!restaurantId) { setError('Please select a restaurant above.'); return }
    if (!partySize)    { setError('Please select your party size.'); return }
    setError('')
    setStep(2)
  }

  function goStep3() {
    if (!name.trim()) { setError('Please enter your name.'); return }
    setError('')
    setLoading(true)
    const token = addToken(restaurantId, name.trim(), phone.trim(), partySize)
    setIssuedToken(token)
    setLoading(false)
    setStep(3)
  }

  function reset() {
    setStep(1)
    setPartySize(null)
    setPreference('')
    setName('')
    setPhone('')
    setIssuedToken(null)
    setError('')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <header className="h-14 flex items-center justify-between px-6 border-b shrink-0"
        style={{ background: '#fff', borderColor: BORDER }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: G }}>
            <UtensilsCrossed className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: G }}>SeatSync</p>
            <p className="text-[9px] tracking-widest font-semibold" style={{ color: '#9CA3AF' }}>GUEST CHECK-IN</p>
          </div>
        </div>

        {/* Restaurant selector (center) */}
        <div className="relative">
          <select
            value={restaurantId}
            onChange={e => { setRestaurantId(e.target.value); setError('') }}
            className="appearance-none pl-4 pr-8 py-1.5 rounded-lg text-sm font-semibold focus:outline-none border"
            style={{
              background: BG, borderColor: BORDER, color: restaurantId ? '#111827' : '#9CA3AF',
              fontFamily: restaurantId ? "'Playfair Display', Georgia, serif" : "'Inter', sans-serif",
            }}>
            <option value="" disabled>Select restaurant…</option>
            {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            style={{ color: '#9CA3AF' }} />
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <LiveClock />
          <Link to="/"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border"
            style={{ color: G, borderColor: '#A7F3D0', background: '#ECFDF5' }}>
            Staff Login →
          </Link>
        </div>
      </header>

      {/* ── Step bar ─────────────────────────────────────────────────────── */}
      <StepBar step={step} />

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — main content */}
        <div className="flex-1 overflow-y-auto px-10 py-8" style={{ minWidth: 0 }}>

          {/* ── Step 1: Party size ── */}
          {step === 1 && (
            <div className="max-w-xl">
              <h1 className="text-3xl font-bold mb-2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: G }}>
                How many guests will be dining today?
              </h1>
              <p className="text-sm mb-7" style={{ color: '#6B7280' }}>
                Select your total party count
              </p>

              {/* Party size grid */}
              <div className="grid grid-cols-3 gap-3 mb-7">
                {PARTY_SIZES.map(n => (
                  <button key={n} type="button"
                    onClick={() => { setPartySize(n); setError('') }}
                    className="py-5 rounded-2xl text-2xl font-bold focus:outline-none"
                    style={{
                      background:  partySize === n ? G      : '#fff',
                      border:      partySize === n ? 'none' : `2px solid ${BORDER}`,
                      color:       partySize === n ? '#fff' : '#111827',
                      boxShadow:   partySize === n ? '0 4px 14px rgba(27,67,50,0.25)' : 'none',
                      transition:  'background 200ms, color 200ms, box-shadow 200ms, border 200ms',
                    }}>
                    {n}
                  </button>
                ))}
                <button type="button"
                  onClick={() => { setPartySize(9); setError('') }}
                  className="py-5 rounded-2xl text-base font-bold focus:outline-none"
                  style={{
                    background: partySize === 9 ? G      : '#fff',
                    border:     partySize === 9 ? 'none' : `2px solid ${BORDER}`,
                    color:      partySize === 9 ? '#fff' : '#111827',
                    boxShadow:  partySize === 9 ? '0 4px 14px rgba(27,67,50,0.25)' : 'none',
                    transition: 'background 200ms, color 200ms, box-shadow 200ms, border 200ms',
                  }}>
                  9+ <span className="text-xs font-normal block">Large Party</span>
                </button>
              </div>

              {/* Seating preference */}
              <div className="mb-7">
                <p className="text-xs font-semibold tracking-widest uppercase mb-3"
                  style={{ color: '#374151' }}>Seating Preference</p>
                <div className="grid grid-cols-2 gap-2">
                  {PREFERENCES.map(pref => (
                    <button key={pref} type="button"
                      onClick={() => setPreference(p => p === pref ? '' : pref)}
                      className="py-2.5 px-4 rounded-xl text-xs font-semibold text-left focus:outline-none"
                      style={{
                        background:  preference === pref ? '#D8F3DC' : '#fff',
                        border:      `1px solid ${preference === pref ? G : BORDER}`,
                        color:       preference === pref ? G         : '#374151',
                        transition:  'background 200ms, border-color 200ms, color 200ms',
                      }}>
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

              <button onClick={goStep2}
                className="flex items-center gap-2 font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors"
                style={{ background: G, color: '#fff' }}>
                Continue to Contact Info <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step 2: Contact info ── */}
          {step === 2 && (
            <div className="max-w-md">
              <h1 className="text-3xl font-bold mb-2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: G }}>
                Tell us your name
              </h1>
              <p className="text-sm mb-7" style={{ color: '#6B7280' }}>
                Party of {partySize} · {preference || 'Standard Dining'}
              </p>

              {/* Name */}
              <div className="mb-5">
                <label className="block text-[11px] font-semibold tracking-widest uppercase mb-1.5"
                  style={{ color: '#374151' }}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setError('') }}
                  placeholder="First and last name"
                  autoComplete="name"
                  className="w-full rounded-xl px-4 py-3 text-sm border focus:outline-none"
                  style={{ borderColor: BORDER, background: '#fff', color: '#111827' }}
                  onFocus={e  => { e.target.style.borderColor = G; e.target.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.08)' }}
                  onBlur={e   => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {/* Phone */}
              <div className="mb-7">
                <label className="block text-[11px] font-semibold tracking-widest uppercase mb-1.5"
                  style={{ color: '#374151' }}>
                  Phone <span className="normal-case font-normal" style={{ color: '#9CA3AF' }}>— For SMS updates (optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  autoComplete="tel"
                  className="w-full rounded-xl px-4 py-3 text-sm border focus:outline-none"
                  style={{ borderColor: BORDER, background: '#fff', color: '#111827' }}
                  onFocus={e  => { e.target.style.borderColor = G; e.target.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.08)' }}
                  onBlur={e   => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

              <div className="flex items-center gap-4">
                <button onClick={() => setStep(1)} type="button"
                  className="flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: '#6B7280' }}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={goStep3} disabled={loading}
                  className="flex items-center gap-2 font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors disabled:opacity-50"
                  style={{ background: G, color: '#fff' }}>
                  {loading ? 'Joining…' : <>Join Queue <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirmation ── */}
          {step === 3 && issuedToken && (
            <div className="max-w-md">
              {/* Success icon */}
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{ background: '#ECFDF5' }}>
                <CheckCircle2 className="w-8 h-8" style={{ color: G }} />
              </div>

              <h1 className="text-3xl font-bold mb-1"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: G }}>
                You're in the queue!
              </h1>
              <p className="text-sm mb-8" style={{ color: '#6B7280' }}>
                {selectedRestaurant?.name} · Party of {issuedToken.partySize}
              </p>

              {/* Token number */}
              <div className="rounded-2xl p-8 text-center mb-6 border-2"
                style={{ background: '#fff', borderColor: G }}>
                <p className="text-[11px] font-semibold tracking-widest uppercase mb-2"
                  style={{ color: '#9CA3AF' }}>Your Token</p>
                <p className="text-7xl font-black font-mono leading-none"
                  style={{ color: G }}>
                  #{issuedToken.tokenNumber}
                </p>
                <p className="text-base font-semibold mt-3" style={{ color: '#111827' }}>
                  {issuedToken.customerName}
                </p>
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                  Joined at {formatTime(issuedToken.createdAt)}
                </p>
              </div>

              {/* Position */}
              <div className="rounded-xl px-5 py-4 mb-6 border"
                style={{ background: BG, borderColor: BORDER }}>
                {waitingAhead === 0
                  ? <p className="text-sm font-semibold" style={{ color: G }}>You're next in line!</p>
                  : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#111827' }}>
                          {waitingAhead} {waitingAhead === 1 ? 'group' : 'groups'} ahead of you
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                          Est. wait ~{Math.max(5, waitingAhead * 15)} min
                        </p>
                      </div>
                      <Clock className="w-5 h-5" style={{ color: '#9CA3AF' }} />
                    </div>
                  )
                }
              </div>

              {/* Next steps */}
              <div className="rounded-xl px-5 py-4 mb-6 border"
                style={{ background: '#ECFDF5', borderColor: '#A7F3D0' }}>
                <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: G }}>
                  What's next
                </p>
                <ul className="space-y-1 text-xs" style={{ color: '#374151' }}>
                  <li>• Keep your token number handy</li>
                  <li>• A staff member will call your number when your table is ready</li>
                  <li>• Stay near the restaurant entrance</li>
                </ul>
              </div>

              <button onClick={reset} type="button"
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: '#6B7280' }}>
                <ArrowLeft className="w-4 h-4" />
                Check in another group
              </button>
            </div>
          )}
        </div>

        {/* ── Right panel ─────────────────────────────────────────────────── */}
        <aside className="w-[320px] shrink-0 flex flex-col border-l overflow-y-auto"
          style={{ background: '#fff', borderColor: BORDER }}>
          <div className="p-6 space-y-5">

            {/* Header */}
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase mb-0.5"
                style={{ color: '#9CA3AF' }}>Live Floor Status</p>
              <p className="text-lg font-bold"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: G }}>
                {selectedRestaurant?.name ?? 'Select a restaurant'}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4 border" style={{ background: BG, borderColor: BORDER }}>
                <p className="text-2xl font-bold" style={{ color: G }}>{waitingTokens.length}</p>
                <p className="text-xs mt-0.5" style={{ color: '#374151' }}>Groups Ahead</p>
              </div>
              <div className="rounded-xl p-4 border" style={{ background: BG, borderColor: BORDER }}>
                <p className="text-2xl font-bold" style={{ color: G }}>~{avgWaitMins}m</p>
                <p className="text-xs mt-0.5" style={{ color: '#374151' }}>Avg Wait</p>
              </div>
            </div>

            {/* Note */}
            <div className="rounded-xl px-4 py-3 border text-xs"
              style={{ background: '#ECFDF5', borderColor: '#A7F3D0', color: '#374151' }}>
              Step away freely — we'll update this display when your table is ready.
            </div>

            {/* QR placeholder */}
            <QRPlaceholder />

            {/* Queue preview */}
            {waitingTokens.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase mb-2"
                  style={{ color: '#9CA3AF' }}>Current Queue</p>
                <div className="space-y-2">
                  {waitingTokens.slice(0, 4).map((t, i) => (
                    <div key={t.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 border"
                      style={{ background: BG, borderColor: BORDER }}>
                      <span className="text-xs font-bold font-mono" style={{ color: G }}>
                        #{t.tokenNumber}
                      </span>
                      <span className="text-xs flex-1 truncate" style={{ color: '#374151' }}>
                        {t.customerName}
                      </span>
                      <span className="text-[10px] shrink-0 flex items-center gap-1"
                        style={{ color: '#9CA3AF' }}>
                        <Users className="w-3 h-3" />{t.partySize}
                      </span>
                    </div>
                  ))}
                  {waitingTokens.length > 4 && (
                    <p className="text-[11px] text-center" style={{ color: '#9CA3AF' }}>
                      +{waitingTokens.length - 4} more in queue
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Call host */}
            <button
              className="w-full py-3 rounded-xl text-sm font-semibold border-2 transition-colors"
              style={{ borderColor: G, color: G, background: 'transparent' }}>
              Need Assistance? Call Host
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
