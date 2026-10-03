import { useAuth } from '../context/AuthContext'
import { useTableContext } from '../context/TableContext'

export function useQueue() {
  const { currentRestaurant } = useAuth()
  const { getWaitingTokens } = useTableContext()
  return getWaitingTokens(currentRestaurant?.id)
}
