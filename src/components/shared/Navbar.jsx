import { useNavigate, Link, useLocation } from 'react-router-dom'
import { UtensilsCrossed, LogOut, LayoutDashboard, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { currentUser, currentRestaurant, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const onManager = location.pathname === '/manager'

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <div className="bg-indigo-600 rounded-lg p-1.5 shrink-0">
          <UtensilsCrossed className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate leading-tight">
            {currentRestaurant?.name}
          </p>
          <p className="text-xs text-gray-500 truncate leading-tight">
            {currentRestaurant?.location}
          </p>
        </div>
      </div>

      <div className="flex-1" />

      {/* Staff / Manager switcher */}
      {currentUser?.role === 'manager' && (
        onManager ? (
          <Link
            to="/staff"
            className="hidden sm:flex items-center gap-1.5 text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Users className="w-4 h-4" />
            Staff View
          </Link>
        ) : (
          <Link
            to="/manager"
            className="hidden sm:flex items-center gap-1.5 text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Manager View
          </Link>
        )
      )}

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-white leading-tight">{currentUser?.name}</p>
          <p className="text-xs text-gray-500 capitalize leading-tight">{currentUser?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Sign out</span>
        </button>
      </div>
    </nav>
  )
}
