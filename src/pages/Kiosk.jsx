import { useState } from 'react'
import { UtensilsCrossed } from 'lucide-react'
import { useTableContext } from '../context/TableContext'
import CheckInForm   from '../components/Kiosk/CheckInForm'
import TokenDisplay  from '../components/Kiosk/TokenDisplay'

export default function Kiosk() {
  const { addToken, getWaitingTokens } = useTableContext()
  const [issuedToken, setIssuedToken] = useState(null)

  function handleCheckIn({ restaurantId, customerName, phone, partySize }) {
    const token = addToken(restaurantId, customerName, phone, partySize)
    setIssuedToken(token)
  }

  function handleCheckInAnother() {
    setIssuedToken(null)
  }

  // Waiting count = how many groups are ahead (excludes the just-issued token)
  const waitingAhead = issuedToken
    ? getWaitingTokens(issuedToken.restaurantId).filter(
        t => t.id !== issuedToken.id && new Date(t.createdAt) < new Date(issuedToken.createdAt)
      ).length
    : 0

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* Header bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-3 shrink-0">
        <div className="bg-indigo-600 rounded-lg p-1.5">
          <UtensilsCrossed className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">SeatSync</p>
          <p className="text-xs text-gray-500 leading-tight">Customer Check-In</p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center p-6 pt-8">
        <div className="w-full max-w-md">
          {issuedToken ? (
            <TokenDisplay
              token={issuedToken}
              waitingCount={waitingAhead}
              onCheckInAnother={handleCheckInAnother}
            />
          ) : (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-white">Welcome!</h1>
                <p className="text-gray-400 text-sm mt-1">
                  Join the waitlist to be seated at your table.
                </p>
              </div>
              <CheckInForm onSubmit={handleCheckIn} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
