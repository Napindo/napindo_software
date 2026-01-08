import { useEffect, useRef } from 'react'
import './App.css'
import DashboardPage from './pages/Dashboard'
import LoginPage, { type AuthenticatedUser } from './pages/Login'
import { logoutPengguna } from './services/pengguna'
import { useAppStore } from './store/appStore'
import GlobalStatusBar from './components/GlobalStatusBar'

export default function App() {
  const { user, setUser, clearUser, setActivePage, setGlobalMessage } = useAppStore()
  const idleTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!user?.username) return

    const handleClose = () => {
      logoutPengguna({ username: user.username }).catch(() => {})
    }

    window.addEventListener('beforeunload', handleClose)
    return () => window.removeEventListener('beforeunload', handleClose)
  }, [user?.username])

  const persistRememberOnLogout = () => {
    const key = 'napindo-login'
    const raw = localStorage.getItem(key)
    if (!raw) {
      localStorage.removeItem(key)
      return
    }

    try {
      const parsed = JSON.parse(raw) as {
        remember?: boolean
        username?: string
        password?: string
        division?: string
      }
      if (parsed?.remember) {
        localStorage.setItem(
          key,
          JSON.stringify({
            remember: true,
            username: user?.username ?? parsed.username ?? '',
            password: parsed.password ?? '',
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

  useEffect(() => {
    if (!user?.username) return
    const idleTimeoutMs = 30 * 60 * 1000

    const clearIdleTimer = () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
    }

    const startIdleTimer = () => {
      clearIdleTimer()
      idleTimerRef.current = window.setTimeout(() => {
        handleLogout().catch(() => {})
      }, idleTimeoutMs)
    }

    const handleActivity = () => {
      startIdleTimer()
    }

    startIdleTimer()
    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'focus',
    ]
    events.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }))

    return () => {
      clearIdleTimer()
      events.forEach((eventName) => window.removeEventListener(eventName, handleActivity))
    }
  }, [user?.username, handleLogout])

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
