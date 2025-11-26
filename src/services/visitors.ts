export type VisitorSegment =
  | 'defence'
  | 'aerospace'
  | 'marine'
  | 'water'
  | 'waste'
  | 'iismex'
  | 'renergy'
  | 'security'
  | 'firex'
  | 'livestock'
  | 'agrotech'
  | 'vet'
  | 'fisheries'
  | 'feed'
  | 'dairy'
  | 'horticulture'

type DatabaseResponse<T = unknown> =
  | { success: true; rows?: T[]; message?: string }
  | { success: false; message: string }

export type VisitorRow = {
  id: string | number
  company: string
  pic: string
  position: string
  type: string
  email: string
  phone: string
  city: string
  updatedAt: string
  raw: Record<string, unknown>
}

const title = (value: unknown) => (value === null || value === undefined ? '' : String(value))

const isFlagSet = (row: Record<string, unknown>, key: string) => {
  const value = row[key.toLowerCase()]
  if (value === undefined || value === null) return false
  const normalized = String(value).trim().toLowerCase()
  return normalized === 'x' || normalized === '1' || normalized === 'true' || normalized === 'yes'
}

const pickValue = (row: Record<string, unknown>, candidates: string[], fallback = '') => {
  const lowerKeys = Object.keys(row).reduce<Record<string, unknown>>((acc, key) => {
    acc[key.toLowerCase()] = row[key]
    return acc
  }, {})

  for (const candidate of candidates) {
    const lower = candidate.toLowerCase()
    if (lower in lowerKeys) {
      return title(lowerKeys[lower])
    }
  }

  return fallback
}

const normalizeRows = (rows: Record<string, unknown>[]): VisitorRow[] =>
  rows.map((row, index) => {
    const lowerKeys = Object.keys(row).reduce<Record<string, unknown>>((acc, key) => {
      acc[key.toLowerCase()] = row[key]
      return acc
    }, {})

    const id =
      lowerKeys['id'] ??
      lowerKeys['idx'] ??
      lowerKeys['rowid'] ??
      lowerKeys['no'] ??
      lowerKeys['no.'] ??
      `${index + 1}-${Date.now()}`

    return {
      id,
      company: pickValue(row, ['company', 'company_name', 'perusahaan', 'nama_perusahaan', 'nama']),
      pic: pickValue(row, ['pic', 'contact', 'cp', 'person_in_charge']),
      position: pickValue(row, ['position', 'jabatan', 'title']),
      type:
        (() => {
          const parts: string[] = []
          const visitorFlag =
            isFlagSet(lowerKeys, 'vis') ||
            isFlagSet(lowerKeys, 'visdefence') ||
            isFlagSet(lowerKeys, 'viswater') ||
            isFlagSet(lowerKeys, 'vislives') ||
            isFlagSet(lowerKeys, 'visagritech') ||
            isFlagSet(lowerKeys, 'visindovet') ||
            isFlagSet(lowerKeys, 'visfish') ||
            isFlagSet(lowerKeys, 'vissecure') ||
            isFlagSet(lowerKeys, 'visfire') ||
            isFlagSet(lowerKeys, 'visdairy') ||
            isFlagSet(lowerKeys, 'visfeed') ||
            isFlagSet(lowerKeys, 'vismarine') ||
            isFlagSet(lowerKeys, 'visaero') ||
            isFlagSet(lowerKeys, 'viswaste') ||
            isFlagSet(lowerKeys, 'visenergy') ||
            isFlagSet(lowerKeys, 'vissmart') ||
            isFlagSet(lowerKeys, 'vishorti')
          const goverFlag = isFlagSet(lowerKeys, 'gover')
          const vipFlag = visitorFlag && isFlagSet(lowerKeys, 'vid')
          if (visitorFlag) parts.push('Visitor')
          if (goverFlag) parts.push('Gover')
          if (vipFlag) parts.push('VIP Visitor')
          return parts.join(', ')
        })() || pickValue(row, ['type', 'kategori', 'category']),
      email: pickValue(row, ['email', 'e-mail']),
      phone: pickValue(row, ['phone', 'telp', 'telpon', 'no_hp', 'mobile']),
      city: pickValue(row, ['city', 'kota', 'state', 'country']),
      updatedAt: pickValue(
        row,
        ['last_update', 'lastupdate', 'updated_at', 'tanggalupdate', 'tanggal_update', 'updateat'],
      ),
      raw: row,
    }
  })

const invokeFetch = async (segment: VisitorSegment, limit: number) => {
  if (window.database?.fetchExhibitors) {
    // Reuse existing endpoint; filter by VIS flags on client
    return window.database.fetchExhibitors<Record<string, unknown>>(segment, limit)
  }

  if (window.ipcRenderer?.invoke) {
    return window.ipcRenderer.invoke('db:fetchExhibitors', segment, limit) as Promise<DatabaseResponse<Record<string, unknown>>>
  }

  throw new Error('API database tidak tersedia di renderer.')
}

export async function getVisitorsBySegment(segment: VisitorSegment, limit = 200): Promise<VisitorRow[]> {
  let response: DatabaseResponse<Record<string, unknown>>
  try {
    response = await invokeFetch(segment, limit)
  } catch (primaryError) {
    try {
      response = await invokeFetch('defence', limit)
    } catch (fallbackError) {
      throw primaryError instanceof Error ? primaryError : fallbackError instanceof Error ? fallbackError : new Error('Gagal memuat data visitor')
    }
  }

  if (!response.success) {
    if (segment !== 'defence') {
      const fallback = await invokeFetch('defence', limit)
      if (!fallback.success) {
        throw new Error(response.message || fallback.message || 'Gagal memuat data visitor')
      }
      response = fallback
    } else {
      throw new Error(response.message || 'Gagal memuat data visitor')
    }
  }

  const rows = response.rows ?? []
  return normalizeRows(rows)
}
