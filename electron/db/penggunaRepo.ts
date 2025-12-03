import { apiFetch, isResponseOk, pickData, uniqueClean } from './index.js'

export async function loginUser(payload: { username: string; password: string; division?: string | null }) {
  const { body, status } = await apiFetch('/pengguna/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!isResponseOk(body)) {
    if (status === 401) return null
    throw new Error(body.message || 'Login gagal')
  }

  return pickData(body)
}

export async function fetchUserHints() {
  const { body } = await apiFetch<Array<{ username?: string; division?: string | null }>>('/pengguna')
  if (!isResponseOk(body)) {
    throw new Error(body.message || 'Gagal memuat data pengguna')
  }

  const users = (pickData(body) as Array<{ username?: string; division?: string | null }> | undefined) ?? []
  const usernames = uniqueClean(users.map((user) => user?.username))
  const divisions = uniqueClean(users.map((user) => user?.division))

  return { usernames, divisions }
}
