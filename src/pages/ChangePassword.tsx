import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import type { AuthenticatedUser } from './Login'

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

const divisionOptions = ['IT Support', 'Marketing', 'Operations', 'Finance', 'Event']
const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-100/80 px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition'

const ChangePasswordPage = ({ currentUser }: ChangePasswordProps) => {
  const [form, setForm] = useState<ChangePasswordForm>({
    username: currentUser?.username ?? '',
    division: currentUser?.division ?? '',
    currentPassword: '',
    newPassword: '',
    showPassword: false,
  })
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

    setMessage('Password siap diubah. Integrasi API dapat ditambahkan di sini.')
  }

  const passwordType = form.showPassword ? 'text' : 'password'

  return (
    <section className="max-w-4xl space-y-8 pt-2">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-900">Change Password</h1>
        <p className="text-sm text-slate-500">Perbarui password akun dengan aman.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-5 max-w-xl">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800" htmlFor="cp-username">
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
            <label className="text-sm font-semibold text-slate-800" htmlFor="cp-division">
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800" htmlFor="cp-current">
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
            <label className="text-sm font-semibold text-slate-800" htmlFor="cp-new">
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

        <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 select-none">
          <input
            type="checkbox"
            checked={form.showPassword}
            onChange={handleChange('showPassword')}
            className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-200"
          />
          Show Password
        </label>

        {(message || error) && (
          <div className="text-sm font-semibold">
            {error ? <p className="text-rose-600">{error}</p> : null}
            {message ? <p className="text-emerald-600">{message}</p> : null}
          </div>
        )}

        <button
          type="submit"
          className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-slate-600 text-white font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!isReady}
        >
          Submit
        </button>
      </form>
    </section>
  )
}

export default ChangePasswordPage
