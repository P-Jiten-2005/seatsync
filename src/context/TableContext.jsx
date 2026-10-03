import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { tables as baseTables } from '../data/tables'
import { seedTableOverrides, seedTokens, seedSessions, seedAuditLog } from '../data/seed'

const TableContext = createContext(null)

export function TableProvider({ children }) {
  const [tables, setTables]     = useState(() =>
    baseTables.map(t => seedTableOverrides[t.id] ? { ...t, ...seedTableOverrides[t.id] } : t)
  )
  const [tokens, setTokens]     = useState(seedTokens)
  const [sessions, setSessions] = useState(seedSessions)
  const [auditLog, setAuditLog] = useState(seedAuditLog)

  // Ref so the timer interval can read current table state without a stale closure
  const tablesRef = useRef(tables)
  useEffect(() => { tablesRef.current = tables }, [tables])

  // --- Timer loop: auto-transition occupied tables past slotEnd to "cleaning" ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const toTransition = tablesRef.current.filter(
        t => t.status === 'occupied' && t.slotEnd && new Date(t.slotEnd) <= now
      )
      if (toTransition.length === 0) return

      toTransition.forEach(t => toast(`Table T${t.number} moved to cleaning (time up)`))

      const ids = toTransition.map(t => t.id)
      setTables(prev =>
        prev.map(t =>
          ids.includes(t.id)
            ? { ...t, status: 'cleaning', cleaningStartTime: now }
            : t
        )
      )
      setAuditLog(prev => [
        ...prev,
        ...toTransition.map(t => ({
          id: `al-auto-${Date.now()}-${t.id}`,
          action: 'AUTO_CLEANING',
          tableId: t.id,
          userId: 'system',
          timestamp: now,
          fromStatus: 'occupied',
          toStatus: 'cleaning',
        })),
      ])
    }, 30_000)

    return () => clearInterval(interval)
  }, [])

  // --- Token number: zero-padded, scoped per restaurant, resets at midnight ---
  function getNextTokenNumber(restaurantId) {
    const today = new Date().toISOString().slice(0, 10)
    const count = tokens.filter(
      t =>
        t.restaurantId === restaurantId &&
        new Date(t.createdAt).toISOString().slice(0, 10) === today
    ).length
    return String(count + 1).padStart(3, '0')
  }

  // --- Public actions ---

  function addToken(restaurantId, customerName, phone, partySize) {
    const now = new Date()
    const token = {
      id: `tok-${Date.now()}`,
      tokenNumber: getNextTokenNumber(restaurantId),
      customerName,
      phone,
      partySize,
      restaurantId,
      status: 'waiting',
      createdAt: now,
      tableId: null,
    }
    setTokens(prev => [...prev, token])
    return token
  }

  function allocateTable(tableId, tokenId, userId) {
    const now = new Date()
    const slotEnd = new Date(now.getTime() + 90 * 60 * 1000)
    const token = tokens.find(t => t.id === tokenId)

    setTables(prev =>
      prev.map(t =>
        t.id === tableId
          ? { ...t, status: 'occupied', currentToken: tokenId, checkInTime: now, slotEnd, cleaningStartTime: null }
          : t
      )
    )
    setTokens(prev =>
      prev.map(t => (t.id === tokenId ? { ...t, status: 'seated', tableId } : t))
    )
    setSessions(prev => [
      ...prev,
      {
        id: `ses-${Date.now()}`,
        tableId,
        tokenId,
        checkInTime: now,
        checkOutTime: null,
        partySize: token?.partySize ?? null,
        waiterId: userId,
      },
    ])
    setAuditLog(prev => [
      ...prev,
      {
        id: `al-${Date.now()}`,
        action: 'TABLE_ALLOCATED',
        tableId,
        userId,
        timestamp: now,
        fromStatus: 'available',
        toStatus: 'occupied',
      },
    ])
  }

  function markCleaning(tableId, userId) {
    const now = new Date()
    const table = tablesRef.current.find(t => t.id === tableId)
    setTables(prev =>
      prev.map(t =>
        t.id === tableId ? { ...t, status: 'cleaning', cleaningStartTime: now } : t
      )
    )
    setAuditLog(prev => [
      ...prev,
      {
        id: `al-${Date.now()}`,
        action: 'STATUS_CHANGED',
        tableId,
        userId,
        timestamp: now,
        fromStatus: table?.status ?? 'occupied',
        toStatus: 'cleaning',
      },
    ])
  }

  function markAvailable(tableId, userId) {
    const now = new Date()
    const table = tablesRef.current.find(t => t.id === tableId)
    const tokenId = table?.currentToken

    setTables(prev =>
      prev.map(t =>
        t.id === tableId
          ? { ...t, status: 'available', currentToken: null, checkInTime: null, slotEnd: null, cleaningStartTime: null }
          : t
      )
    )
    if (tokenId) {
      setTokens(prev =>
        prev.map(t => (t.id === tokenId ? { ...t, status: 'done' } : t))
      )
      setSessions(prev =>
        prev.map(s =>
          s.tableId === tableId && !s.checkOutTime ? { ...s, checkOutTime: now } : s
        )
      )
    }
    setAuditLog(prev => [
      ...prev,
      {
        id: `al-${Date.now()}`,
        action: 'STATUS_CHANGED',
        tableId,
        userId,
        timestamp: now,
        fromStatus: 'cleaning',
        toStatus: 'available',
      },
    ])
  }

  function overrideSlotEnd(tableId, newSlotEnd, userId) {
    const table = tablesRef.current.find(t => t.id === tableId)
    setTables(prev =>
      prev.map(t => (t.id === tableId ? { ...t, slotEnd: newSlotEnd } : t))
    )
    setAuditLog(prev => [
      ...prev,
      {
        id: `al-${Date.now()}`,
        action: 'TIMER_OVERRIDDEN',
        tableId,
        userId,
        timestamp: new Date(),
        fromStatus: table?.status,
        toStatus: table?.status,
      },
    ])
  }

  function updateTableCapacity(tableId, newCapacity, userId) {
    setTables(prev =>
      prev.map(t => (t.id === tableId ? { ...t, capacity: newCapacity } : t))
    )
    setAuditLog(prev => [
      ...prev,
      {
        id: `al-${Date.now()}`,
        action: 'TABLE_SETTINGS_CHANGED',
        tableId,
        userId,
        timestamp: new Date(),
        fromStatus: null,
        toStatus: null,
      },
    ])
  }

  // --- Selectors ---

  const getTablesByRestaurant = useCallback(
    restaurantId => tables.filter(t => t.restaurantId === restaurantId),
    [tables]
  )

  const getTokensByRestaurant = useCallback(
    restaurantId => tokens.filter(t => t.restaurantId === restaurantId),
    [tokens]
  )

  const getWaitingTokens = useCallback(
    restaurantId =>
      tokens
        .filter(t => t.restaurantId === restaurantId && t.status === 'waiting')
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [tokens]
  )

  const getSessionsByRestaurant = useCallback(
    restaurantId => sessions.filter(s => {
      const table = tablesRef.current.find(t => t.id === s.tableId)
      return table?.restaurantId === restaurantId
    }),
    [sessions]
  )

  const getAuditLogByRestaurant = useCallback(
    restaurantId => auditLog.filter(entry => {
      const table = tablesRef.current.find(t => t.id === entry.tableId)
      return table?.restaurantId === restaurantId || entry.tableId?.startsWith(restaurantId)
    }),
    [auditLog]
  )

  return (
    <TableContext.Provider
      value={{
        tables,
        tokens,
        sessions,
        auditLog,
        addToken,
        allocateTable,
        markCleaning,
        markAvailable,
        overrideSlotEnd,
        updateTableCapacity,
        getTablesByRestaurant,
        getTokensByRestaurant,
        getWaitingTokens,
        getSessionsByRestaurant,
        getAuditLogByRestaurant,
      }}
    >
      {children}
    </TableContext.Provider>
  )
}

export function useTableContext() {
  return useContext(TableContext)
}
