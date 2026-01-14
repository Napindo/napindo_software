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
  limit = 0,
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

export async function fetchExhibitorCountByExpo() {
  const { body } = await apiFetch('/gabung/exhibitor-count')
  if (!isResponseOk(body)) {
    throw new Error(body.message || 'Gagal mengambil jumlah exhibitor per pameran')
  }

  return pickData(body) as { indoDefence?: number; indoWater?: number; indoLivestock?: number }
}

export async function fetchExpoChartData() {
  const { body } = await apiFetch('/gabung/expo-chart')
  if (!isResponseOk(body)) {
    throw new Error(body.message || 'Gagal mengambil data grafik pameran')
  }

  return pickData(body) as {
    indoDefence?: Record<number, number>
    indoWater?: Record<number, number>
    indoLivestock?: Record<number, number>
  }
}

export async function listGabungRecords(params?: { page?: number; pageSize?: number; q?: string }) {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 200
  const search = params?.q?.trim()
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (search) {
    query.set('q', search)
  }

  const { body } = await apiFetch(`/gabung?${query.toString()}`)
  if (!isResponseOk(body)) {
    throw new Error(body.message || 'Gagal memuat data gabung')
  }
  return pickData(body) ?? body
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

export async function importGabungExcel(payload: {
  fileBase64: string
  fileName?: string
  sheetName?: string
  headerRow?: number
  chunkSize?: number
  maxRows?: number
}) {
  const { body } = await apiFetch('/gabung/import/excel', {
    method: 'POST',
    body: JSON.stringify(payload),
    timeoutMs: 7000,
  })
  if (!isResponseOk(body)) throw new Error(body.message || 'Gagal mengimpor data Excel')
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

export async function reportPerusahaan(filter: unknown) {
  const { body } = await apiFetch('/report/perusahaan', {
    method: 'POST',
    body: JSON.stringify(filter),
  })

  if (!isResponseOk(body)) throw new Error(body.message || 'Gagal memuat report perusahaan')
  return pickData(body) ?? body.data
}

export async function reportGovernment(filter: unknown) {
  const { body } = await apiFetch('/report/government', {
    method: 'POST',
    body: JSON.stringify(filter),
  })

  if (!isResponseOk(body)) throw new Error(body.message || 'Gagal memuat report government')
  return pickData(body) ?? body.data
}

export async function reportJumlahPerusahaan(filter: unknown) {
  const { body } = await apiFetch('/report/jumlah/perusahaan', {
    method: 'POST',
    body: JSON.stringify(filter),
  })

  if (!isResponseOk(body)) throw new Error(body.message || 'Gagal memuat report jumlah perusahaan')
  return pickData(body) ?? body.data
}

export async function reportJumlahGovernment(filter: unknown) {
  const { body } = await apiFetch('/report/jumlah/government', {
    method: 'POST',
    body: JSON.stringify(filter),
  })

  if (!isResponseOk(body)) throw new Error(body.message || 'Gagal memuat report jumlah government')
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

export async function renderPersonalDatabasePdf(payload: Record<string, unknown>) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}/gabung/personal-pdf`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload || {}),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Gagal mengunduh PDF')
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const contentDisposition = response.headers.get('content-disposition') || ''
  const match = /filename="?([^"]+)"?/i.exec(contentDisposition)
  const filename = match?.[1] || 'database-personal.pdf'
  return {
    contentType: response.headers.get('content-type') || 'application/pdf',
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

export async function renderReportPerusahaanPdf(filter: unknown) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}/report/perusahaan/print`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filter),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Gagal mencetak report perusahaan')
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    contentType: response.headers.get('content-type') || 'application/pdf',
    filename: 'report-perusahaan.pdf',
    buffer,
    base64: buffer.toString('base64'),
  }
}

export async function renderReportGovernmentPdf(filter: unknown) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}/report/government/print`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filter),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Gagal mencetak report government')
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    contentType: response.headers.get('content-type') || 'application/pdf',
    filename: 'report-government.pdf',
    buffer,
    base64: buffer.toString('base64'),
  }
}

export async function renderReportJumlahPerusahaanPdf(filter: unknown) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}/report/jumlah/perusahaan/print`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filter),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Gagal mencetak report jumlah perusahaan')
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    contentType: response.headers.get('content-type') || 'application/pdf',
    filename: 'report-jumlah-perusahaan.pdf',
    buffer,
    base64: buffer.toString('base64'),
  }
}

export async function renderReportJumlahGovernmentPdf(filter: unknown) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}/report/jumlah/government/print`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filter),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Gagal mencetak report jumlah government')
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    contentType: response.headers.get('content-type') || 'application/pdf',
    filename: 'report-jumlah-government.pdf',
    buffer,
    base64: buffer.toString('base64'),
  }
}

export async function renderReportJumlahPerusahaanExcel(filter: unknown) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}/report/jumlah/perusahaan/export/excel`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filter || {}),
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Gagal mengunduh Excel report jumlah perusahaan')
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    contentType: response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: 'report-jumlah-perusahaan.xlsx',
    buffer,
    base64: buffer.toString('base64'),
  }
}

export async function renderReportJumlahGovernmentExcel(filter: unknown) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}/report/jumlah/government/export/excel`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filter || {}),
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Gagal mengunduh Excel report jumlah government')
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    contentType: response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: 'report-jumlah-government.xlsx',
    buffer,
    base64: buffer.toString('base64'),
  }
}

export async function renderReportPerusahaanExcel(filter: unknown) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}/report/perusahaan/export/excel`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filter || {}),
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Gagal mengunduh Excel report perusahaan')
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    contentType: response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: 'report-perusahaan.xlsx',
    buffer,
    base64: buffer.toString('base64'),
  }
}

export async function renderReportGovernmentExcel(filter: unknown) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}/report/government/export/excel`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filter || {}),
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Gagal mengunduh Excel report government')
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    contentType: response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: 'report-government.xlsx',
    buffer,
    base64: buffer.toString('base64'),
  }
}

export async function renderReportPerusahaanWord(filter: unknown) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}/report/perusahaan/export/word`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filter || {}),
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Gagal mengunduh Word report perusahaan')
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    contentType: response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    filename: 'report-perusahaan.docx',
    buffer,
    base64: buffer.toString('base64'),
  }
}

export async function renderReportGovernmentWord(filter: unknown) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}/report/government/export/word`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filter || {}),
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Gagal mengunduh Word report government')
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    contentType: response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    filename: 'report-government.docx',
    buffer,
    base64: buffer.toString('base64'),
  }
}

export async function renderReportJumlahPerusahaanWord(filter: unknown) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}/report/jumlah/perusahaan/export/word`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filter || {}),
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Gagal mengunduh Word report jumlah perusahaan')
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    contentType: response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    filename: 'report-jumlah-perusahaan.docx',
    buffer,
    base64: buffer.toString('base64'),
  }
}

export async function renderReportJumlahGovernmentWord(filter: unknown) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}/report/jumlah/government/export/word`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filter || {}),
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Gagal mengunduh Word report jumlah government')
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    contentType: response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    filename: 'report-jumlah-government.docx',
    buffer,
    base64: buffer.toString('base64'),
  }
}
