import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, role, restaurant_id')
    .eq('id', userId)
    .single()
  console.log(data, error)

  if (!data) return null

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, location')
    .eq('id', data.restaurant_id)
    .single()

  return {
    user: { id: data.id, name: data.name, role: data.role, restaurantId: data.restaurant_id },
    restaurant: restaurant ?? null,
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser]           = useState(null)
  const [currentRestaurant, setCurrentRestaurant] = useState(null)
  const [authLoading, setAuthLoading]             = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          if (profile) {
            setCurrentUser(profile.user)
            setCurrentRestaurant(profile.restaurant)
          }
        } else {
          setCurrentUser(null)
          setCurrentRestaurant(null)
        }
        setAuthLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function login(email, password) {
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !authData?.user) return { success: false, error: 'Invalid credentials' }

    const profile = await fetchProfile(authData.user.id)
    if (profile) {
      setCurrentUser(profile.user)
      setCurrentRestaurant(profile.restaurant)
    }
    return { success: true, role: profile?.user?.role ?? null }
  }

  async function logout() {
    await supabase.auth.signOut()
    setCurrentUser(null)
    setCurrentRestaurant(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, currentRestaurant, authLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
