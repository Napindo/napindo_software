import { apiFetch, isResponseOk, pickData } from "./index.js"

export async function fetchAuditLogs(limit = 200) {
  const params = new URLSearchParams({ limit: String(limit) })
  const { body } = await apiFetch(`/audit/logs?${params.toString()}`)
  if (!isResponseOk(body)) {
    throw new Error(body.message || "Gagal memuat audit log")
  }

  return (pickData(body) as any[]) ?? []
}

export async function createAuditLog(payload: {
  username?: string | null
  action: string
  page?: string | null
  summary?: string | null
  data?: unknown
}) {
  const { body } = await apiFetch("/audit/logs", {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
  })
  if (!isResponseOk(body)) {
    throw new Error(body.message || "Gagal menyimpan audit log")
  }
  return pickData(body) ?? body
}
