import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UtensilsCrossed, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { restaurants } from '../data/restaurants'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [restaurantId, setRestaurantId] = useState('')
  const [role, setRole]                 = useState('waiter')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!restaurantId) {
      setError('Please select a restaurant.')
      return
    }
    if (!password) {
      setError('Please enter a password.')
      return
    }

    setLoading(true)
    const result = login(restaurantId, role, password)
    setLoading(false)

    if (!result.success) {
      setError('Invalid credentials. Check your password and try again.')
      return
    }

    navigate(result.role === 'manager' ? '/manager' : '/staff')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 rounded-2xl p-3 mb-4">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SeatSync</h1>
          <p className="text-gray-400 text-sm mt-1">Smart Restaurant Table Management</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5"
        >

          {/* Restaurant */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">Restaurant</label>
            <select
              value={restaurantId}
              onChange={e => { setRestaurantId(e.target.value); setError('') }}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="" disabled>Select a restaurant…</option>
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            {restaurantId && (
              <p className="text-xs text-gray-500">
                {restaurants.find(r => r.id === restaurantId)?.location}
              </p>
            )}
          </div>

          {/* Role toggle */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {['waiter', 'manager'].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRole(r); setError('') }}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    role === r
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword
                  ? <EyeOff className="w-4 h-4" />
                  : <Eye className="w-4 h-4" />
                }
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-900/40 border border-red-800 text-red-300 rounded-lg px-3 py-2.5 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Demo hint */}
        <div className="mt-4 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium mb-2">Demo credentials</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p><span className="text-gray-500">Manager:</span> manager1</p>
            <p><span className="text-gray-500">Waiter 1:</span> waiter1</p>
            <p><span className="text-gray-500">Waiter 2:</span> waiter2</p>
          </div>
        </div>

      </div>
    </div>
  )
}
