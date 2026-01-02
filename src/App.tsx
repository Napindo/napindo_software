import './App.css'
import DashboardPage from './pages/Dashboard'
import LoginPage, { type AuthenticatedUser } from './pages/Login'
import { logoutPengguna } from './services/pengguna'
import { useAppStore } from './store/appStore'
import GlobalStatusBar from './components/GlobalStatusBar'

export default function App() {
  const { user, setUser, clearUser, setActivePage, setGlobalMessage } = useAppStore()

  const persistRememberOnLogout = () => {
    const key = 'napindo-login'
    const raw = localStorage.getItem(key)
    if (!raw) {
      localStorage.removeItem(key)
      return
    }

    try {
      const parsed = JSON.parse(raw) as { remember?: boolean; username?: string; division?: string }
      if (parsed?.remember) {
        localStorage.setItem(
          key,
          JSON.stringify({
            remember: true,
            username: user?.username ?? parsed.username ?? '',
            division: user?.division ?? parsed.division ?? '',
          }),
        )
      } else {
        localStorage.removeItem(key)
      }
    } catch {
      localStorage.removeItem(key)
    }
  }

  const handleLoginSuccess = (profile: AuthenticatedUser) => {
    setUser(profile)
    setGlobalMessage({ type: 'success', text: 'Login berhasil' })
  }

  const handleLogout = async () => {
    if (user?.username) {
      try {
        await logoutPengguna({ username: user.username })
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Gagal mengubah status logout.'
        setGlobalMessage({ type: 'error', text: msg })
      }
    }
    persistRememberOnLogout()
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
