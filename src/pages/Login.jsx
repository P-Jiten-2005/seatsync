import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, UtensilsCrossed } from 'lucide-react'
import { useAuth } from '../context/AuthContext'


export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email)    { setError('Please enter your email.'); return }
    if (!password) { setError('Please enter a password.'); return }

    setLoading(true)
    const result = await login(email, password)
    setLoading(false)

    if (!result.success) {
      setError('Invalid credentials. Check your email and password.')
      return
    }
    navigate(result.role === 'manager' ? '/manager' : '/staff')
  }

const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: '#F8F7F4', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Branding ── */}
      <div className="text-center mb-5">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md"
          style={{ background: '#1B4332' }}>
          <UtensilsCrossed className="w-6 h-6 text-white" />
        </div>
        <p className="text-[10px] tracking-[0.25em] font-semibold mb-1"
          style={{ color: '#1B4332' }}>
          HOSPITALITY OPERATING SYSTEM
        </p>
        <h1 className="text-4xl font-bold leading-tight mb-1"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1B4332' }}>
          SeatSync
        </h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          The modern floor management platform
        </p>
      </div>

      {/* ── Status bar ── */}
      <div className="w-full max-w-[480px] rounded-xl px-4 py-2.5 flex items-center justify-between mb-3 border"
        style={{ background: '#fff', borderColor: '#E5E1DA' }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span className="text-xs font-medium" style={{ color: '#374151' }}>All Systems Online</span>
        </div>
        <span className="text-xs" style={{ color: '#9CA3AF' }}>Service since {now}</span>
      </div>

      {/* ── Card ── */}
      <div className="w-full max-w-[480px] rounded-2xl overflow-hidden border shadow-sm"
        style={{ background: '#fff', borderColor: '#E5E1DA' }}>

        {/* Card header */}
        <div className="px-8 pt-7 pb-5 border-b" style={{ borderColor: '#F0EDE8' }}>
          <h2 className="text-2xl font-bold leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1B4332' }}>
            Shift Sign-In
          </h2>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            Access your restaurant floor dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pt-6 pb-7 space-y-5">

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold tracking-widest uppercase"
              style={{ color: '#374151' }}>
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: '#9CA3AF' }} />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="your@email.com"
                autoComplete="email"
                className="w-full rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none transition"
                style={{
                  border: '1px solid #E5E1DA',
                  background: '#FAFAF8',
                  color: '#111827',
                }}
                onFocus={e => { e.target.style.borderColor = '#1B4332'; e.target.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.08)' }}
                onBlur={e  => { e.target.style.borderColor = '#E5E1DA'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold tracking-widest uppercase"
              style={{ color: '#374151' }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: '#9CA3AF' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none transition"
                style={{
                  border: '1px solid #E5E1DA',
                  background: '#FAFAF8',
                  color: '#111827',
                }}
                onFocus={e => { e.target.style.borderColor = '#1B4332'; e.target.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.08)' }}
                onBlur={e  => { e.target.style.borderColor = '#E5E1DA'; e.target.style.boxShadow = 'none' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: '#9CA3AF' }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: '#1B4332', color: '#fff' }}
            onMouseEnter={e => { if (!loading) e.target.style.background = '#152F24' }}
            onMouseLeave={e => { e.target.style.background = '#1B4332' }}
          >
            {loading ? 'Signing in…' : <><span>Sign In to Shift</span><ArrowRight className="w-4 h-4" /></>}
          </button>

        </form>
      </div>

      {/* ── Footer ── */}
      <div className="w-full max-w-[480px] mt-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#9CA3AF' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          Floor Cloud: Online · 60 Tables
        </div>
        <div className="flex gap-2">
          {['Auth', 'Realtime', 'DB'].map(label => (
            <span key={label}
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
