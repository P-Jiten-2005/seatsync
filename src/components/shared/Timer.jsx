import { useState, useEffect } from 'react'
import { getRemainingMs, formatCountdown, isWarning, isOverdue } from '../../utils/timeUtils'

export default function Timer({ slotEnd, className = '' }) {
  const [ms, setMs] = useState(() => getRemainingMs(slotEnd))

  useEffect(() => {
    setMs(getRemainingMs(slotEnd))
    const id = setInterval(() => setMs(getRemainingMs(slotEnd)), 1000)
    return () => clearInterval(id)
  }, [slotEnd])

  const overdue = isOverdue(slotEnd)
  const warning = !overdue && isWarning(slotEnd)

  return (
    <span
      className={`font-mono font-semibold ${
        overdue ? 'text-red-400 animate-pulse' :
        warning ? 'text-orange-400' :
                  'text-gray-300'
      } ${className}`}
    >
      {overdue ? 'Overdue' : formatCountdown(ms)}
    </span>
  )
}
