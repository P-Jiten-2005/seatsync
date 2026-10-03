import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { TableProvider } from './context/TableContext'
import Login   from './pages/Login'
import Kiosk   from './pages/Kiosk'
import Display from './pages/Display'
import Staff   from './pages/Staff'
import Manager from './pages/Manager'

function RequireAuth({ children, role }) {
  const { currentUser, authLoading } = useAuth()
  if (authLoading) return <div className="min-h-screen bg-gray-950" />
  if (!currentUser) return <Navigate to="/" replace />
  if (role === 'manager' && currentUser.role !== 'manager') {
    return <Navigate to="/staff" replace />
  }
  return children
}

function AppRoutes() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/"        element={<Login />} />
        <Route path="/kiosk"   element={<Kiosk />} />
        <Route path="/display" element={<Display />} />
        <Route path="/staff"   element={<RequireAuth><Staff /></RequireAuth>} />
        <Route path="/manager" element={<RequireAuth role="manager"><Manager /></RequireAuth>} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TableProvider>
          <AppRoutes />
        </TableProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
