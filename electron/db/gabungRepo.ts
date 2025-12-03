import {
  apiFetch,
  isResponseOk,
  pickData,
  type Gabung,
  type PersonType,
} from './index.js'

export async function fetchTopRows(tableName: string, top = 10) {
  const safe = tableName.replace(/[^\w.]/g, '')
  const params = new URLSearchParams({ limit: String(top) })
  const { body } = await apiFetch(`/gabung/table-preview/${safe}?${params.toString()}`)
  if (!isResponseOk(body)) throw new Error(body.message || 'Gagal mengambil preview data')
  const data = pickData(body) as any
  return data?.rows ?? data ?? []
}

export async function fetchExhibitorsBySegment(
  segment: string,
  limit = 200,
  person: PersonType = 'exhibitor',
) {
  const params = new URLSearchParams({ limit: String(limit), person })
  const { body } = await apiFetch<{ items: Gabung[]; segment: string; limit: number; person?: PersonType }>(
    `/gabung/segment/${encodeURIComponent(segment)}?${params.toString()}`,
  )

  if (!isResponseOk(body)) {
    throw new Error(body.message || 'Gagal mengambil data gabung')
  }

  const data: any = pickData(body) ?? {}
  return (data.items ?? data.rows ?? data ?? []) as Gabung[]
}

export async function findCompanyByName(company: string) {
  const trimmed = company.trim()
  const encoded = encodeURIComponent(trimmed)
  const { body } = await apiFetch(`/gabung/company/${encoded}`)
  if (!isResponseOk(body)) throw new Error(body.message || 'Gagal mencari perusahaan')
  const data: any = pickData(body) ?? {}
  return data.items ?? data.rows ?? data ?? []
}

export async function saveAddData(payload: Record<string, unknown>) {
  const { body } = await apiFetch('/gabung', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!isResponseOk(body)) throw new Error(body.message || 'Gagal menyimpan data')
  return pickData(body) ?? body
}

export async function updateAddData(id: number | string, payload: Record<string, unknown>) {
  const safeId = encodeURIComponent(String(id))
  const { body } = await apiFetch(`/gabung/${safeId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  if (!isResponseOk(body)) throw new Error(body.message || 'Gagal memperbarui data')
  return pickData(body) ?? body
}

export async function deleteAddData(ids: Array<string | number>) {
  const uniqueIds = Array.from(new Set(ids.map((id) => String(id).trim()).filter(Boolean)))
  const results: Array<{ id: string; success: boolean; message?: string }> = []

  for (const id of uniqueIds) {
    const safeId = encodeURIComponent(id)
    const { body } = await apiFetch(`/gabung/${safeId}`, { method: 'DELETE' })
    const ok = isResponseOk(body)
    results.push({ id, success: ok, message: body.message })
    if (!ok) {
      throw new Error(body.message || `Gagal menghapus data ${id}`)
    }
  }

  return results
}

export async function reportLabelVisitor(filter: unknown) {
  const { body } = await apiFetch('/report/labelvisitor', {
    method: 'POST',
    body: JSON.stringify(filter),
  })

  if (!body.success) throw new Error(body.message)
  return body.data
}

export async function reportLabelGover(filter: unknown) {
  const { body } = await apiFetch('/report/labelgover', {
    method: 'POST',
    body: JSON.stringify(filter),
  })

  if (!body.success) throw new Error(body.message)
  return body.data
}

export async function reportBusinessVisitor(filter: unknown) {
  const { body } = await apiFetch('/report/businessvisitor', {
    method: 'POST',
    body: JSON.stringify(filter),
  })

  if (!body.success) throw new Error(body.message)
  return body.data
}
