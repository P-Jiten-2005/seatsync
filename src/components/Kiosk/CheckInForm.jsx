import { useState } from 'react'
import { User, Phone, Users, ChevronDown } from 'lucide-react'
import { useTableContext } from '../../context/TableContext'

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8]

export default function CheckInForm({ onSubmit }) {
  const { restaurants } = useTableContext()
  const [restaurantId, setRestaurantId] = useState('')
  const [name,         setName]         = useState('')
  const [phone,        setPhone]        = useState('')
  const [partySize,    setPartySize]    = useState(null)
  const [error,        setError]        = useState('')

  function validate() {
    if (!restaurantId) return 'Please select a restaurant.'
    if (!name.trim())  return 'Please enter your name.'
    if (!partySize)    return 'Please select your party size.'
    return null
  }

  function handleSubmit(e) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    onSubmit({ restaurantId, customerName: name.trim(), phone: phone.trim(), partySize })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Restaurant */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Restaurant</label>
        <div className="relative">
          <select
            value={restaurantId}
            onChange={e => { setRestaurantId(e.target.value); setError('') }}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="" disabled>Select a restaurant…</option>
            {restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Your Name</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            placeholder="First and last name"
            autoComplete="name"
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-11 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
          />
        </div>
      </div>

      {/* Phone (optional) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Phone <span className="text-gray-600 font-normal">(optional)</span>
        </label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="For table-ready notifications"
            autoComplete="tel"
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-11 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
          />
        </div>
      </div>

      {/* Party size */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          <Users className="inline w-4 h-4 mr-1 mb-0.5" />
          Party Size
        </label>
        <div className="grid grid-cols-4 gap-2">
          {PARTY_SIZES.map(n => (
            <button
              key={n}
              type="button"
              onClick={() => { setPartySize(n); setError('') }}
              className={`py-3 rounded-xl text-base font-semibold transition-colors ${
                partySize === n
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold py-4 rounded-xl text-lg transition-colors"
      >
        Join Queue
      </button>
    </form>
  )
}
