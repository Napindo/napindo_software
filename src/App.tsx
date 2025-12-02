import './App.css'
import { useState } from 'react'
import DashboardPage from './pages/Dashboard'
import LoginPage, { type AuthenticatedUser } from './pages/Login'

export default function App() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)

  const handleLoginSuccess = (profile: AuthenticatedUser) => {
    setUser(profile)
  }

  const handleLogout = () => {
    localStorage.removeItem('napindo-login')
    setUser(null)
  }

  if (!user) {
    return <LoginPage onSuccess={handleLoginSuccess} />
  }

  return <DashboardPage user={user} onLogout={handleLogout} />
}
