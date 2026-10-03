import { createContext, useContext, useState } from 'react'
import { users } from '../data/users'
import { restaurants } from '../data/restaurants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [currentRestaurant, setCurrentRestaurant] = useState(null)

  function login(restaurantId, role, password) {
    const user = users.find(
      u => u.restaurantId === restaurantId && u.role === role && u.password === password
    )
    if (!user) return { success: false, error: 'Invalid credentials' }
    const restaurant = restaurants.find(r => r.id === restaurantId)
    setCurrentUser(user)
    setCurrentRestaurant(restaurant)
    return { success: true, role: user.role }
  }

  function logout() {
    setCurrentUser(null)
    setCurrentRestaurant(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, currentRestaurant, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
