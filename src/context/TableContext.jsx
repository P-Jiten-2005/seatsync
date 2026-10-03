import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const TableContext = createContext(null)

// --- Row mappers (snake_case DB → camelCase frontend) ---

function mapTable(row) {
  return {
    id:                row.id,
    restaurantId:      row.restaurant_id,
    number:            row.number,
    capacity:          row.capacity,
    status:            row.status,
    currentToken:      row.current_token ?? null,
    checkInTime:       row.check_in_time ? new Date(row.check_in_time) : null,
    slotEnd:           row.slot_end ? new Date(row.slot_end) : null,
    cleaningStartTime: row.cleaning_start_time ? new Date(row.cleaning_start_time) : null,
  }
}

function mapToken(row) {
  return {
    id:           row.id,
    tokenNumber:  row.token_number,
    customerName: row.customer_name,
    phone:        row.phone,
    partySize:    row.party_size,
    restaurantId: row.restaurant_id,
    status:       row.status,
    createdAt:    new Date(row.created_at),
    tableId:      row.table_id ?? null,
  }
}

function mapSession(row) {
  return {
    id:           row.id,
    tableId:      row.table_id,
    tokenId:      row.token_id,
    checkInTime:  new Date(row.check_in_time),
    checkOutTime: row.check_out_time ? new Date(row.check_out_time) : null,
    partySize:    row.party_size ?? null,
    waiterId:     row.waiter_id ?? null,
  }
}

function mapAuditLog(row) {
  return {
    id:         row.id,
    action:     row.action,
    tableId:    row.table_id,
    userId:     row.user_id ?? 'system',
    timestamp:  new Date(row.timestamp),
    fromStatus: row.from_status ?? null,
    toStatus:   row.to_status ?? null,
  }
}

export function TableProvider({ children }) {
  const { currentRestaurant } = useAuth()

  const [restaurants, setRestaurants] = useState([])
  const [tables, setTables]     = useState([])
  const [tokens, setTokens]     = useState([])
  const [sessions, setSessions] = useState([])
  const [auditLog, setAuditLog] = useState([])

  // Fetch the full restaurant list once so public pages (kiosk) get real Supabase UUIDs
  useEffect(() => {
    supabase.from('restaurants').select('id, name, location')
      .then(({ data }) => { if (data) setRestaurants(data) })
  }, [])

  // Ref mirrors tables state so the timer interval avoids stale closures
  const tablesRef = useRef(tables)
  useEffect(() => { tablesRef.current = tables }, [tables])

  // --- Load data from Supabase when the logged-in restaurant changes ---
  useEffect(() => {
    if (!currentRestaurant?.id) {
      setTables([])
      setTokens([])
      setSessions([])
      setAuditLog([])
      return
    }

    const rid = currentRestaurant.id

    async function load() {
      const [tablesRes, tokensRes] = await Promise.all([
        supabase.from('tables').select('*').eq('restaurant_id', rid),
        supabase.from('tokens').select('*').eq('restaurant_id', rid),
      ])

      const loadedTables = (tablesRes.data ?? []).map(mapTable)
      const tableIds     = loadedTables.map(t => t.id)

      const [sessionsRes, auditRes] = await Promise.all([
        tableIds.length
          ? supabase.from('sessions').select('*').in('table_id', tableIds)
          : Promise.resolve({ data: [] }),
        tableIds.length
          ? supabase.from('audit_log').select('*').in('table_id', tableIds)
          : Promise.resolve({ data: [] }),
      ])

      setTables(loadedTables)
      setTokens((tokensRes.data ?? []).map(mapToken))
      setSessions((sessionsRes.data ?? []).map(mapSession))
      setAuditLog((auditRes.data ?? []).map(mapAuditLog))
    }

    load()
  }, [currentRestaurant?.id])

  // --- Real-time subscriptions for cross-tab sync ---
  useEffect(() => {
    if (!currentRestaurant?.id) return

    const rid = currentRestaurant.id

    const tokensSub = supabase
      .channel(`tokens-${rid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tokens' },
        payload => {
          console.log('[realtime] tokens INSERT', payload)
          if (payload.new.restaurant_id !== rid) return
          setTokens(prev => {
            if (prev.some(t => t.id === payload.new.id)) return prev
            return [...prev, mapToken(payload.new)]
          })
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tokens' },
        payload => {
          console.log('[realtime] tokens UPDATE', payload)
          if (payload.new.restaurant_id !== rid) return
          setTokens(prev => prev.map(t => t.id === payload.new.id ? mapToken(payload.new) : t))
        }
      )
      .subscribe(status => console.log('[realtime] tokens channel:', status))

    const tablesSub = supabase
      .channel(`tables-${rid}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tables' },
        payload => {
          console.log('[realtime] tables UPDATE', payload)
          if (payload.new.restaurant_id !== rid) return
          setTables(prev => prev.map(t => t.id === payload.new.id ? mapTable(payload.new) : t))
        }
      )
      .subscribe(status => console.log('[realtime] tables channel:', status))

    return () => {
      supabase.removeChannel(tokensSub)
      supabase.removeChannel(tablesSub)
    }
  }, [currentRestaurant?.id])

  // --- Timer loop: auto-transition expired occupied tables to "cleaning" ---
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

      const auditEntries = toTransition.map(t => ({
        id:          crypto.randomUUID(),
        action:      'AUTO_CLEANING',
        tableId:     t.id,
        userId:      'system',
        timestamp:   now,
        fromStatus:  'occupied',
        toStatus:    'cleaning',
      }))
      setAuditLog(prev => [...prev, ...auditEntries])

      // Background DB writes — .eq('status','occupied') prevents double-transition
      supabase
        .from('tables')
        .update({ status: 'cleaning', cleaning_start_time: now.toISOString() })
        .in('id', ids)
        .eq('status', 'occupied')
        .then(({ error }) => { if (error) console.error('auto-clean update:', error) })

      supabase
        .from('audit_log')
        .insert(auditEntries.map(e => ({
          id:          e.id,
          action:      e.action,
          table_id:    e.tableId,
          user_id:     null,
          timestamp:   e.timestamp.toISOString(),
          from_status: e.fromStatus,
          to_status:   e.toStatus,
        })))
        .then(({ error }) => { if (error) console.error('auto-clean audit:', error) })
    }, 30_000)

    return () => clearInterval(interval)
  }, [])

  // --- Token number helper ---
  function getNextTokenNumber(restaurantId) {
    const today = new Date().toISOString().slice(0, 10)
    const count = tokens.filter(
      t =>
        t.restaurantId === restaurantId &&
        new Date(t.createdAt).toISOString().slice(0, 10) === today
    ).length
    return String(count + 1).padStart(3, '0')
  }

  // --- Public mutations (optimistic: update state immediately, write DB in background) ---

  function addToken(restaurantId, customerName, phone, partySize) {
    const now = new Date()
    const token = {
      id:           crypto.randomUUID(),
      tokenNumber:  getNextTokenNumber(restaurantId),
      customerName,
      phone,
      partySize,
      restaurantId,
      status:       'waiting',
      createdAt:    now,
      tableId:      null,
    }
    setTokens(prev => [...prev, token])

    const insertPayload = {
      id:            token.id,
      token_number:  token.tokenNumber,
      customer_name: token.customerName,
      phone:         token.phone,
      party_size:    token.partySize,
      restaurant_id: token.restaurantId,
      status:        token.status,
      created_at:    now.toISOString(),
      table_id:      null,
    }
    console.log('[addToken] inserting:', insertPayload)
    supabase
      .from('tokens')
      .insert(insertPayload)
      .select()
      .single()
      .then(({ data, error }) => { console.log('[addToken] response:', data, error) })

    return token
  }

  function allocateTable(tableId, tokenId, userId) {
    const now    = new Date()
    const slotEnd = new Date(now.getTime() + 90 * 60 * 1000)
    const token  = tokens.find(t => t.id === tokenId)

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
    const session = {
      id:           crypto.randomUUID(),
      tableId,
      tokenId,
      checkInTime:  now,
      checkOutTime: null,
      partySize:    token?.partySize ?? null,
      waiterId:     userId,
    }
    setSessions(prev => [...prev, session])
    const auditEntry = {
      id:         crypto.randomUUID(),
      action:     'TABLE_ALLOCATED',
      tableId,
      userId,
      timestamp:  now,
      fromStatus: 'available',
      toStatus:   'occupied',
    }
    setAuditLog(prev => [...prev, auditEntry])

    supabase.from('tables').update({
      status:             'occupied',
      current_token:      tokenId,
      check_in_time:      now.toISOString(),
      slot_end:           slotEnd.toISOString(),
      cleaning_start_time: null,
    }).eq('id', tableId)
      .then(({ error }) => { if (error) console.error('allocateTable update:', error) })

    supabase.from('tokens').update({ status: 'seated', table_id: tableId })
      .eq('id', tokenId)
      .then(({ error }) => { if (error) console.error('allocateTable token:', error) })

    supabase.from('sessions').insert({
      id:            session.id,
      table_id:      session.tableId,
      token_id:      session.tokenId,
      check_in_time: session.checkInTime.toISOString(),
      check_out_time: null,
      party_size:    session.partySize,
      waiter_id:     session.waiterId,
    }).then(({ error }) => { if (error) console.error('allocateTable session:', error) })

    supabase.from('audit_log').insert({
      id:          auditEntry.id,
      action:      auditEntry.action,
      table_id:    auditEntry.tableId,
      user_id:     auditEntry.userId,
      timestamp:   auditEntry.timestamp.toISOString(),
      from_status: auditEntry.fromStatus,
      to_status:   auditEntry.toStatus,
    }).then(({ error }) => { if (error) console.error('allocateTable audit:', error) })
  }

  function markCleaning(tableId, userId) {
    const now   = new Date()
    const table = tablesRef.current.find(t => t.id === tableId)
    setTables(prev =>
      prev.map(t =>
        t.id === tableId ? { ...t, status: 'cleaning', cleaningStartTime: now } : t
      )
    )
    const auditEntry = {
      id:         crypto.randomUUID(),
      action:     'STATUS_CHANGED',
      tableId,
      userId,
      timestamp:  now,
      fromStatus: table?.status ?? 'occupied',
      toStatus:   'cleaning',
    }
    setAuditLog(prev => [...prev, auditEntry])

    supabase.from('tables').update({ status: 'cleaning', cleaning_start_time: now.toISOString() })
      .eq('id', tableId)
      .then(({ error }) => { if (error) console.error('markCleaning update:', error) })

    supabase.from('audit_log').insert({
      id:          auditEntry.id,
      action:      auditEntry.action,
      table_id:    auditEntry.tableId,
      user_id:     auditEntry.userId,
      timestamp:   auditEntry.timestamp.toISOString(),
      from_status: auditEntry.fromStatus,
      to_status:   auditEntry.toStatus,
    }).then(({ error }) => { if (error) console.error('markCleaning audit:', error) })
  }

  function markAvailable(tableId, userId) {
    const now     = new Date()
    const table   = tablesRef.current.find(t => t.id === tableId)
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
    const auditEntry = {
      id:         crypto.randomUUID(),
      action:     'STATUS_CHANGED',
      tableId,
      userId,
      timestamp:  now,
      fromStatus: 'cleaning',
      toStatus:   'available',
    }
    setAuditLog(prev => [...prev, auditEntry])

    supabase.from('tables').update({
      status:              'available',
      current_token:       null,
      check_in_time:       null,
      slot_end:            null,
      cleaning_start_time: null,
    }).eq('id', tableId)
      .then(({ error }) => { if (error) console.error('markAvailable update:', error) })

    if (tokenId) {
      supabase.from('tokens').update({ status: 'done' })
        .eq('id', tokenId)
        .then(({ error }) => { if (error) console.error('markAvailable token:', error) })

      supabase.from('sessions').update({ check_out_time: now.toISOString() })
        .eq('table_id', tableId)
        .is('check_out_time', null)
        .then(({ error }) => { if (error) console.error('markAvailable session:', error) })
    }

    supabase.from('audit_log').insert({
      id:          auditEntry.id,
      action:      auditEntry.action,
      table_id:    auditEntry.tableId,
      user_id:     auditEntry.userId,
      timestamp:   auditEntry.timestamp.toISOString(),
      from_status: auditEntry.fromStatus,
      to_status:   auditEntry.toStatus,
    }).then(({ error }) => { if (error) console.error('markAvailable audit:', error) })
  }

  function overrideSlotEnd(tableId, newSlotEnd, userId) {
    const table = tablesRef.current.find(t => t.id === tableId)
    setTables(prev =>
      prev.map(t => (t.id === tableId ? { ...t, slotEnd: newSlotEnd } : t))
    )
    const auditEntry = {
      id:         crypto.randomUUID(),
      action:     'TIMER_OVERRIDDEN',
      tableId,
      userId,
      timestamp:  new Date(),
      fromStatus: table?.status,
      toStatus:   table?.status,
    }
    setAuditLog(prev => [...prev, auditEntry])

    supabase.from('tables').update({ slot_end: new Date(newSlotEnd).toISOString() })
      .eq('id', tableId)
      .then(({ error }) => { if (error) console.error('overrideSlotEnd update:', error) })

    supabase.from('audit_log').insert({
      id:          auditEntry.id,
      action:      auditEntry.action,
      table_id:    auditEntry.tableId,
      user_id:     auditEntry.userId,
      timestamp:   auditEntry.timestamp.toISOString(),
      from_status: auditEntry.fromStatus,
      to_status:   auditEntry.toStatus,
    }).then(({ error }) => { if (error) console.error('overrideSlotEnd audit:', error) })
  }

  function updateTableCapacity(tableId, newCapacity, userId) {
    setTables(prev =>
      prev.map(t => (t.id === tableId ? { ...t, capacity: newCapacity } : t))
    )
    const auditEntry = {
      id:         crypto.randomUUID(),
      action:     'TABLE_SETTINGS_CHANGED',
      tableId,
      userId,
      timestamp:  new Date(),
      fromStatus: null,
      toStatus:   null,
    }
    setAuditLog(prev => [...prev, auditEntry])

    supabase.from('tables').update({ capacity: newCapacity })
      .eq('id', tableId)
      .then(({ error }) => { if (error) console.error('updateTableCapacity update:', error) })

    supabase.from('audit_log').insert({
      id:          auditEntry.id,
      action:      auditEntry.action,
      table_id:    auditEntry.tableId,
      user_id:     auditEntry.userId,
      timestamp:   auditEntry.timestamp.toISOString(),
      from_status: auditEntry.fromStatus,
      to_status:   auditEntry.toStatus,
    }).then(({ error }) => { if (error) console.error('updateTableCapacity audit:', error) })
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
    restaurantId => {
      const tableIds = tablesRef.current
        .filter(t => t.restaurantId === restaurantId)
        .map(t => t.id)
      return sessions.filter(s => tableIds.includes(s.tableId))
    },
    [sessions]
  )

  const getAuditLogByRestaurant = useCallback(
    restaurantId => {
      const tableIds = tablesRef.current
        .filter(t => t.restaurantId === restaurantId)
        .map(t => t.id)
      return auditLog.filter(
        e => tableIds.includes(e.tableId) || e.tableId?.startsWith(restaurantId)
      )
    },
    [auditLog]
  )

  return (
    <TableContext.Provider
      value={{
        restaurants,
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
