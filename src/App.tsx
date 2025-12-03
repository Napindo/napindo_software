import './App.css'
import DashboardPage from './pages/Dashboard'
import LoginPage, { type AuthenticatedUser } from './pages/Login'
import { useAppStore } from './store/appStore'
import GlobalStatusBar from './components/GlobalStatusBar'

export default function App() {
  const { user, setUser, clearUser, setActivePage, setGlobalMessage } = useAppStore()

  const handleLoginSuccess = (profile: AuthenticatedUser) => {
    setUser(profile)
    setGlobalMessage({ type: 'success', text: 'Login berhasil' })
  }

  const handleLogout = () => {
    localStorage.removeItem('napindo-login')
    clearUser()
    setActivePage('dashboard')
    setGlobalMessage({ type: 'info', text: 'Anda telah logout' })
  }

  if (!user) {
    return (
      <>
        <GlobalStatusBar />
        <LoginPage onSuccess={handleLoginSuccess} />
      </>
    )
  }

  return (
    <>
      <GlobalStatusBar />
      <DashboardPage user={user} onLogout={handleLogout} />
    </>
  )
}
