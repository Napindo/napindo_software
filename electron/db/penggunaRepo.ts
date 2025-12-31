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

export async function createUser(payload: { username: string; password: string; division?: string | null; status?: string | null }) {
  const { body } = await apiFetch('/pengguna', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!isResponseOk(body)) {
    throw new Error(body.message || 'Gagal membuat user')
  }

  return pickData(body)
}

export async function changePassword(payload: {
  username: string
  currentPassword: string
  newPassword: string
  division?: string | null
}) {
  const loginPayload = {
    username: payload.username,
    password: payload.currentPassword,
    division: payload.division ?? null,
  }
  const loginResult = await apiFetch('/pengguna/login', {
    method: 'POST',
    body: JSON.stringify(loginPayload),
  })

  if (!isResponseOk(loginResult.body)) {
    if (loginResult.status === 401) {
      throw new Error('Password saat ini salah.')
    }
    throw new Error(loginResult.body.message || 'Gagal memverifikasi password.')
  }

  const { body } = await apiFetch(`/pengguna/${encodeURIComponent(payload.username)}`, {
    method: 'PUT',
    body: JSON.stringify({
      password: payload.newPassword,
      division: payload.division ?? null,
    }),
  })

  if (!isResponseOk(body)) {
    throw new Error(body.message || 'Gagal memperbarui password.')
  }

  return pickData(body)
}

export async function logoutUser(payload: { username: string }) {
  const { body } = await apiFetch(`/pengguna/${encodeURIComponent(payload.username)}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'OFF' }),
  })

  if (!isResponseOk(body)) {
    throw new Error(body.message || 'Gagal logout user')
  }

  return pickData(body)
}
