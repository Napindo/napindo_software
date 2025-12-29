import {
  apiFetch,
  isResponseOk,
  pickData,
  API_BASE_URL,
  API_PREFIX,
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

  if (!isResponseOk(body)) throw new Error(body.message || 'Gagal memuat label visitor')
  return pickData(body) ?? body.data
}

export async function reportLabelGover(filter: unknown) {
  const { body } = await apiFetch('/report/labelgover', {
    method: 'POST',
    body: JSON.stringify(filter),
  })

  if (!isResponseOk(body)) throw new Error(body.message || 'Gagal memuat label gover')
  return pickData(body) ?? body.data
}

export async function reportBusinessVisitor(filter: unknown) {
  const { body } = await apiFetch('/report/businessvisitor', {
    method: 'POST',
    body: JSON.stringify(filter),
  })

  if (!isResponseOk(body)) throw new Error(body.message || 'Gagal memuat business visitor')
  return pickData(body) ?? body.data
}

export async function reportLabelOptions() {
  const { body } = await apiFetch('/report/label/options')
  if (!isResponseOk(body)) throw new Error(body.message || 'Gagal memuat opsi label')
  return pickData(body) ?? body.data
}

export async function renderLabelVisitorPdf(filter: unknown) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}/report/labelvisitor/print`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filter),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Gagal mencetak label perusahaan')
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    contentType: response.headers.get('content-type') || 'application/pdf',
    filename: 'print-label-perusahaan.pdf',
    buffer,
    base64: buffer.toString('base64'),
  }
}

export async function renderLabelGoverPdf(filter: unknown) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}/report/labelgover/print`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filter),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Gagal mencetak label government')
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    contentType: response.headers.get('content-type') || 'application/pdf',
    filename: 'print-label-government.pdf',
    buffer,
    base64: buffer.toString('base64'),
  }
}

async function renderBinary(url: string, filename: string) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Gagal mengunduh ${filename}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    contentType: response.headers.get('content-type') || 'application/octet-stream',
    filename,
    buffer,
    base64: buffer.toString('base64'),
  }
}

export async function renderLabelVisitorExcel(filter: unknown) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}/report/labelvisitor/export/excel`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filter || {}),
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Gagal mengunduh Excel')
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    contentType: response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: 'print-label-perusahaan.xlsx',
    buffer,
    base64: buffer.toString('base64'),
  }
}

export async function renderLabelGoverExcel(filter: unknown) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}/report/labelgover/export/excel`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filter || {}),
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Gagal mengunduh Excel government')
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    contentType: response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: 'print-label-government.xlsx',
    buffer,
    base64: buffer.toString('base64'),
  }
}

export async function renderLabelVisitorWord(filter: unknown) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}/report/labelvisitor/export/word`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filter || {}),
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Gagal mengunduh Word')
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    contentType: response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    filename: 'print-label-perusahaan.docx',
    buffer,
    base64: buffer.toString('base64'),
  }
}

export async function renderLabelGoverWord(filter: unknown) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}/report/labelgover/export/word`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filter || {}),
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Gagal mengunduh Word government')
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    contentType: response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    filename: 'print-label-government.docx',
    buffer,
    base64: buffer.toString('base64'),
  }
}
