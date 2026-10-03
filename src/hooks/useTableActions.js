import { useAuth } from '../context/AuthContext'
import { useTableContext } from '../context/TableContext'

export function useTableActions() {
  const { currentUser } = useAuth()
  const { allocateTable, markCleaning, markAvailable, overrideSlotEnd } = useTableContext()
  const uid = currentUser?.id

  return {
    allocate:  (tableId, tokenId)    => allocateTable(tableId, tokenId, uid),
    clean:     (tableId)             => markCleaning(tableId, uid),
    available: (tableId)             => markAvailable(tableId, uid),
    override:  (tableId, newSlotEnd) => overrideSlotEnd(tableId, newSlotEnd, uid),
  }
}
