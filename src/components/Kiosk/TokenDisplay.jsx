import { CheckCircle2, Users, Clock, ArrowLeft } from 'lucide-react'
import { formatTime } from '../../utils/timeUtils'
import { restaurants } from '../../data/restaurants'

export default function TokenDisplay({ token, waitingCount, onCheckInAnother }) {
  const restaurant = restaurants.find(r => r.id === token.restaurantId)

  return (
    <div className="flex flex-col items-center text-center space-y-6">

      {/* Success icon */}
      <div className="bg-green-900/40 rounded-full p-5">
        <CheckCircle2 className="w-12 h-12 text-green-400" />
      </div>

      {/* Headline */}
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">You're in the queue!</p>
        <h2 className="text-2xl font-bold text-white">{restaurant?.name}</h2>
      </div>

      {/* Token number — the big display element */}
      <div className="bg-gray-800 border-2 border-indigo-600 rounded-2xl px-12 py-8 w-full">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
          Your Token
        </p>
        <p className="text-7xl font-black text-indigo-400 font-mono leading-none tracking-tight">
          #{token.tokenNumber}
        </p>
        <p className="text-lg font-semibold text-white mt-3">{token.customerName}</p>
      </div>

      {/* Details row */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-400 w-full">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span>{token.partySize} {token.partySize === 1 ? 'guest' : 'guests'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span>Joined at {formatTime(token.createdAt)}</span>
        </div>
      </div>

      {/* Queue position */}
      {waitingCount > 0 && (
        <div className="bg-gray-800/60 rounded-xl px-6 py-3 w-full">
          <p className="text-sm text-gray-400">
            {waitingCount === 1
              ? 'You are next in line'
              : `${waitingCount} ${waitingCount === 1 ? 'group' : 'groups'} ahead of you`}
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-indigo-950/40 border border-indigo-900 rounded-xl px-5 py-4 w-full text-left space-y-2">
        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">What's next</p>
        <ul className="space-y-1 text-sm text-gray-300">
          <li>• Keep this token number handy</li>
          <li>• A staff member will call your number when your table is ready</li>
          <li>• Please stay near the restaurant entrance</li>
        </ul>
      </div>

      {/* Check in another */}
      <button
        onClick={onCheckInAnother}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Check in another group
      </button>
    </div>
  )
}
