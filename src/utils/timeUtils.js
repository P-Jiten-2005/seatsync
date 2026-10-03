export function getRemainingMs(slotEnd) {
  return Math.max(0, new Date(slotEnd) - Date.now())
}

export function formatCountdown(ms) {
  if (ms <= 0) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours   = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function isWarning(slotEnd) {
  return getRemainingMs(slotEnd) < 15 * 60 * 1000
}

export function isOverdue(slotEnd) {
  return getRemainingMs(slotEnd) === 0
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatDuration(from, to = new Date()) {
  const ms = Math.max(0, new Date(to) - new Date(from))
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins  = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}
