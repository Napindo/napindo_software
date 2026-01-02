import { apiFetch, isResponseOk, pickData } from "./index.js"

export async function fetchAuditLogs(limit = 200) {
  const params = new URLSearchParams({ limit: String(limit) })
  const { body } = await apiFetch(`/audit/logs?${params.toString()}`)
  if (!isResponseOk(body)) {
    throw new Error(body.message || "Gagal memuat audit log")
  }

  return (pickData(body) as any[]) ?? []
}
