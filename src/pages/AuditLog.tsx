import { useEffect, useMemo, useState } from 'react'
import { fetchAuditLogs, type AuditLogRow } from '../services/audit'
import { listPengguna, type PenggunaRow } from '../services/pengguna'

const formatTime = (value?: string | null) => {
  if (!value) return '-'
  const raw = String(value).trim()
  if (!raw) return '-'
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  const isUtc = raw.endsWith('Z')
  const adjusted = isUtc ? new Date(parsed.getTime() + parsed.getTimezoneOffset() * 60000) : parsed
  return adjusted.toLocaleString('id-ID')
}

const AuditLogPage = () => {
  const [logs, setLogs] = useState<AuditLogRow[]>([])
  const [users, setUsers] = useState<PenggunaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [logRows, userRows] = await Promise.all([fetchAuditLogs(300), listPengguna({ pageSize: 200 })])
        if (!active) return
        setLogs(logRows)
        setUsers(userRows)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Gagal memuat audit log.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const onlineUsers = useMemo(
    () => users.filter((user) => String(user.status ?? '').toUpperCase() === 'ON'),
    [users],
  )

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">User Management</p>
        <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm font-semibold">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Online</p>
              <h2 className="text-lg font-bold text-slate-900">User Login</h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">{onlineUsers.length} aktif</span>
          </div>
          <div className="mt-3 space-y-2 max-h-64 overflow-auto pr-1">
            {onlineUsers.length === 0 && !loading ? (
              <p className="text-sm text-slate-500">Tidak ada user online.</p>
            ) : null}
            {onlineUsers.map((user) => (
              <div
                key={`${user.username ?? 'user'}-${user.division ?? 'division'}`}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{user.username ?? '-'}</p>
                  <p className="text-xs text-slate-500">{user.division ?? '-'}</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  ON
                </span>
              </div>
            ))}
            {loading ? <p className="text-sm text-slate-500">Memuat user...</p> : null}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Aktivitas</p>
              <h2 className="text-lg font-bold text-slate-900">Audit Log</h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">{logs.length} log</span>
          </div>
          <div className="mt-3 overflow-auto max-h-[420px] pr-1">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2">Waktu</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Aksi</th>
                  <th className="px-3 py-2">Halaman</th>
                  <th className="px-3 py-2">Ringkas</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-slate-600">{formatTime(log.createdAt)}</td>
                    <td className="px-3 py-2 font-semibold text-slate-800">{log.username ?? '-'}</td>
                    <td className="px-3 py-2 capitalize text-slate-700">{log.action}</td>
                    <td className="px-3 py-2 text-slate-600">{log.page ?? '-'}</td>
                    <td className="px-3 py-2 text-slate-600">{log.summary ?? '-'}</td>
                  </tr>
                ))}
                {logs.length === 0 && !loading ? (
                  <tr>
                    <td className="px-3 py-4 text-slate-500" colSpan={5}>
                      Belum ada audit log.
                    </td>
                  </tr>
                ) : null}
                {loading ? (
                  <tr>
                    <td className="px-3 py-4 text-slate-500" colSpan={5}>
                      Memuat audit log...
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AuditLogPage
