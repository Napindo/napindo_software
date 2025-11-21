import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'

type LoginStatus = 'idle' | 'loading' | 'success' | 'error'

type LoginForm = {
  username: string
  password: string
  division: string
}

const REMEMBER_KEY = 'napindo-login'

const NapindoMark = () => (
  <svg className="napindo-icon" viewBox="0 0 160 150" role="presentation" aria-hidden="true">
    <defs>
      <linearGradient id="napindoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e63946" />
        <stop offset="100%" stopColor="#9f0f0f" />
      </linearGradient>
    </defs>
    <path
      d="M10 20c0-6.6 5.4-12 12-12h16c4.4 0 8.3 2.4 10.4 6.3L80 90 51 142.5c-2.2 3.8-6.1 6.1-10.5 6.1H22c-6.6 0-12-5.4-12-12V20Z"
      fill="url(#napindoGradient)"
    />
    <path
      d="M60 20c0-6.6 5.4-12 12-12h16c4.4 0 8.3 2.4 10.4 6.3L130 90l-29 52.5c-2.2 3.8-6.1 6.1-10.5 6.1H72c-6.6 0-12-5.4-12-12V20Z"
      fill="url(#napindoGradient)"
    />
    <path
      d="M110 20c0-6.6 5.4-12 12-12h16c6.6 0 12 5.4 12 12v116.5c0 10.8-12.9 15.8-20.2 8.1l-19.3-19.6c-2.4-2.5-3.8-5.9-3.8-9.4V20Z"
      fill="url(#napindoGradient)"
    />
  </svg>
)

function LoginPage() {
  const [form, setForm] = useState<LoginForm>({ username: '', password: '', division: '' })
  const [remember, setRemember] = useState(true)
  const [status, setStatus] = useState<LoginStatus>('idle')
  const [message, setMessage] = useState('')
  const [welcomeName, setWelcomeName] = useState('')
  const [showShell, setShowShell] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(REMEMBER_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<LoginForm>
        setForm((prev) => ({
          ...prev,
          username: parsed.username ?? '',
          division: parsed.division ?? '',
        }))
        setRemember(true)
      } catch {
        //
      }
    }
    const timer = setTimeout(() => setShowShell(true), 80)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (remember) {
      localStorage.setItem(
        REMEMBER_KEY,
        JSON.stringify({ username: form.username, division: form.division } satisfies Partial<LoginForm>),
      )
    } else {
      localStorage.removeItem(REMEMBER_KEY)
    }
  }, [remember, form.username, form.division])

  const isReady = useMemo(() => form.username.trim() !== '' && form.password.trim() !== '', [form])

  const handleChange = (field: keyof LoginForm) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isReady) {
      setStatus('error')
      setMessage('Lengkapi username dan password terlebih dahulu.')
      return
    }

    setStatus('loading')
    setMessage('Mengecek kredensial...')

    try {
      const response = await window.database.login({
        username: form.username.trim(),
        password: form.password,
        division: form.division.trim() || null,
      })

      if (response.success && response.user) {
        setStatus('success')
        setWelcomeName(response.user.name ?? response.user.username)
        setMessage('Login berhasil, sedang mengarahkan Anda...')
      } else {
        setStatus('error')
        const errorText = !response.success
          ? response.message
          : 'Login gagal. Periksa kembali data Anda.'
        setMessage(errorText ?? 'Login gagal. Periksa kembali data Anda.')
      }
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Login gagal. Coba lagi.')
    }
  }

  return (
    <div className={`page ${showShell ? 'visible' : ''}`}>
      <div className="login-card">
        <div className="brand-side">
          <div className="brand-mark">
            <NapindoMark />
            <div className="brand-text">
              <span className="tagline">Showing The Way !</span>
              <h1>Napindo</h1>
            </div>
          </div>
        </div>

        <div className="form-side">
          <header className="form-header">
            <h2>Masuk ke Sistem</h2>
            <p>Ketikkan kredensial SQL Server Anda untuk melanjutkan.</p>
          </header>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Username</span>
              <input
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={handleChange('username')}
                autoComplete="username"
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange('password')}
                autoComplete="current-password"
              />
            </label>
            <label className="field">
              <span>Division</span>
              <input
                type="text"
                placeholder="Division"
                value={form.division}
                onChange={handleChange('division')}
              />
            </label>

            <div className="form-footer">
              <label className={`switch ${remember ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span className="slider" aria-hidden />
                <span className="switch-label">Remember me</span>
              </label>

              <div className={`status-dot ${status}`} aria-hidden />
            </div>

            {status !== 'idle' && (
              <p className={`feedback ${status}`}>
                {status === 'success' ? `Welcome, ${welcomeName}! ` : null}
                {message}
              </p>
            )}

            <button type="submit" className="submit" disabled={status === 'loading' || !isReady}>
              {status === 'loading' ? 'Memproses...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
