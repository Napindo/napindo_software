import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import type { AuthenticatedUser } from './Login'
import { changePenggunaPassword } from '../services/pengguna'
import { createAuditLog } from '../services/audit'
import { useAppStore } from '../store/appStore'

type ChangePasswordForm = {
  username: string
  division: string
  currentPassword: string
  newPassword: string
  showPassword: boolean
}

type ChangePasswordProps = {
  currentUser?: AuthenticatedUser | null
}

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-slate-100/80 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition'

async function invokeUserHints() {
  const w = window as any
  if (w.database?.userHints) return w.database.userHints()
  if (w.ipcRenderer?.invoke) return w.ipcRenderer.invoke('db:userHints')
  throw new Error('Fungsi userHints tidak tersedia, restart aplikasi atau rebuild preload.')
}

const ChangePasswordPage = ({ currentUser }: ChangePasswordProps) => {
  const { user, setGlobalMessage } = useAppStore()
  const resolvedUser = currentUser ?? user
  const [form, setForm] = useState<ChangePasswordForm>({
    username: resolvedUser?.username ?? '',
    division: resolvedUser?.division ?? '',
    currentPassword: '',
    newPassword: '',
    showPassword: false,
  })
  const [divisionOptions, setDivisionOptions] = useState<string[]>([])
  const [divisionError, setDivisionError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isReady = useMemo(
    () =>
      form.username.trim() !== '' &&
      form.division.trim() !== '' &&
      form.currentPassword.trim() !== '' &&
      form.newPassword.trim() !== '',
    [form.username, form.division, form.currentPassword, form.newPassword],
  )

  const handleChange =
    (field: keyof ChangePasswordForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = field === 'showPassword' ? (event.target as HTMLInputElement).checked : event.target.value
      setForm((prev) => ({ ...prev, [field]: value } as ChangePasswordForm))
    }

  useEffect(() => {
    let active = true
    const loadDivisions = async () => {
      setDivisionError(null)
      try {
        const response = await invokeUserHints()
        if (!active) return
        if (response?.success && response.hints) {
          setDivisionOptions(response.hints.divisions?.filter(Boolean) ?? [])
          return
        }
        setDivisionOptions([])
        setDivisionError(response?.message ?? 'Gagal memuat daftar division.')
      } catch (err) {
        if (!active) return
        setDivisionOptions([])
        setDivisionError(err instanceof Error ? err.message : 'Gagal memuat daftar division.')
      }
    }
    loadDivisions()
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    setError(null)

    if (!isReady) {
      setError('Lengkapi semua field sebelum submit.')
      return
    }
    if (form.currentPassword === form.newPassword) {
      setError('Password baru harus berbeda dari password saat ini.')
      return
    }

    setSaving(true)
    changePenggunaPassword({
      username: form.username.trim(),
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
      division: form.division.trim() || null,
    })
      .then(() => {
        setMessage('Password berhasil diubah.')
        setGlobalMessage({ type: 'success', text: 'Password berhasil diubah.' })
        createAuditLog({
          username: user?.username ?? null,
          action: 'change-password',
          page: 'Change Password',
          summary: 'Change password',
          data: {
            username: form.username.trim(),
            division: form.division.trim() || null,
          },
        }).catch(() => {})
        setForm((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          showPassword: false,
        }))
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Gagal memperbarui password.'
        setError(msg)
        setGlobalMessage({ type: 'error', text: msg })
      })
      .finally(() => setSaving(false))
  }

  const passwordType = form.showPassword ? 'text' : 'password'

  return (
    <section className="max-w-4xl space-y-6 pt-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Change Password</h1>
        <p className="text-xs text-slate-500">Perbarui password akun dengan aman.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 max-w-xl">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-800" htmlFor="cp-username">
              Username
            </label>
            <input
              id="cp-username"
              type="text"
              placeholder="Sandi"
              value={form.username}
              onChange={handleChange('username')}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-800" htmlFor="cp-division">
              Division
            </label>
            <div className="relative">
              <select
                id="cp-division"
                value={form.division}
                onChange={handleChange('division')}
                className={`${inputClass} appearance-none pr-10`}
              >
                <option value="">Pilih Division</option>
                {divisionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="m7 10 5 5 5-5" />
                </svg>
              </span>
            </div>
            {divisionError ? <p className="text-xs font-semibold text-rose-600">{divisionError}</p> : null}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-800" htmlFor="cp-current">
              Current Password
            </label>
            <input
              id="cp-current"
              type={passwordType}
              placeholder="Current Password"
              value={form.currentPassword}
              onChange={handleChange('currentPassword')}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-800" htmlFor="cp-new">
              New Password
            </label>
            <input
              id="cp-new"
              type={passwordType}
              placeholder="New Password"
              value={form.newPassword}
              onChange={handleChange('newPassword')}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col items-start gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={form.showPassword}
              onChange={handleChange('showPassword')}
              className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-200"
            />
            Show Password
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-gradient-to-r from-rose-500 to-slate-600 text-sm font-semibold text-white shadow-md hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!isReady || saving}
          >
            {saving ? 'Saving...' : 'Submit'}
          </button>
        </div>

        {(message || error) && (
          <div className="text-sm font-semibold">
            {error ? <p className="text-rose-600">{error}</p> : null}
            {message ? <p className="text-emerald-600">{message}</p> : null}
          </div>
        )}
      </form>
    </section>
  )
}

export default ChangePasswordPage
