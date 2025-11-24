import './App.css'
import { useState } from 'react'
import DashboardPage from './pages/Dashboard'
import LoginPage, { type AuthenticatedUser } from './pages/Login'

function App() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLoginSuccess = (profile: AuthenticatedUser) => {
    setUser(profile)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  if (isLoggedIn) {
    return <DashboardPage user={user} onLogout={handleLogout} />
  }

  return <LoginPage onSuccess={handleLoginSuccess} />
}

export default App
