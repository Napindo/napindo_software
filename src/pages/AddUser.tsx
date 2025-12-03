import { useMemo, useState, type FormEvent, type ChangeEvent } from 'react'
import type { AuthenticatedUser } from './Login'
import { useAppStore } from '../store/appStore'

type AddUserForm = {
  username: string
  password: string
  confirmPassword: string
  division: string
  showPassword: boolean
}

type AddUserPageProps = {
  currentUser?: AuthenticatedUser | null
}

const divisionOptions = ['IT Support', 'Marketing', 'Operations', 'Finance', 'Event']
const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-100/80 px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition'

const AddUserPage = (_props: AddUserPageProps) => {
  const { user, setGlobalMessage } = useAppStore()
  const [form, setForm] = useState<AddUserForm>({
    username: user?.username ?? '',
    password: '',
    confirmPassword: '',
    division: user?.division ?? '',
    showPassword: false,
  })
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const passwordsMismatch = useMemo(
    () => !!form.password && !!form.confirmPassword && form.password !== form.confirmPassword,
    [form.password, form.confirmPassword],
  )
  const isReady = useMemo(
    () => form.username.trim() !== '' && form.password !== '' && form.confirmPassword !== '' && form.division !== '',
    [form.username, form.password, form.confirmPassword, form.division],
  )

  const handleChange =
    (field: keyof AddUserForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = field === 'showPassword' ? (event.target as HTMLInputElement).checked : event.target.value
      setForm((prev) => ({ ...prev, [field]: value } as AddUserForm))
    }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    setError(null)

    if (!isReady) {
      setError('Lengkapi semua field sebelum submit.')
      return
    }
    if (passwordsMismatch) {
      setError('Password dan konfirmasi harus sama.')
      return
    }

    setMessage('Data user siap disimpan. Integrasi API dapat ditambahkan di sini.')
    setGlobalMessage({ type: 'success', text: 'User tersimpan (placeholder, sambungkan ke API).' })
  }

  const passwordType = form.showPassword ? 'text' : 'password'

  return (
    <section className="max-w-4xl space-y-8 pt-2">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-900">Add User</h1>
        <p className="text-sm text-slate-500">Tambahkan akun baru dan atur divisi pengguna.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-5 max-w-xl">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="Input Username"
              value={form.username}
              onChange={handleChange('username')}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type={passwordType}
              placeholder="Input Password"
              value={form.password}
              onChange={handleChange('password')}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800" htmlFor="confirmPassword">
              Password Again
            </label>
            <input
              id="confirmPassword"
              type={passwordType}
              placeholder="Input Password Again"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              className={`${inputClass} ${passwordsMismatch ? 'border-rose-300 ring-rose-100' : ''}`}
            />
            {passwordsMismatch ? (
              <p className="text-xs font-semibold text-rose-600">Password belum sama.</p>
            ) : null}
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

        <div className="max-w-sm space-y-2">
          <label className="text-sm font-semibold text-slate-800" htmlFor="division">
            Division
          </label>
          <div className="relative">
            <select
              id="division"
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

export default AddUserPage
