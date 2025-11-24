export type ExhibitorSegment = 'defence' | 'aerospace' | 'marine'

export type ExhibitorRow = {
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

const normalizeRows = (rows: Record<string, unknown>[]): ExhibitorRow[] =>
  rows.map((row, index) => {
    const lowerKeys = Object.keys(row).reduce<Record<string, unknown>>((acc, key) => {
      acc[key.toLowerCase()] = row[key]
      return acc
    }, {})

    const id =
      lowerKeys.id ??
      lowerKeys.idx ??
      lowerKeys.rowid ??
      lowerKeys.no ??
      lowerKeys['no.'] ??
      `${index + 1}-${Date.now()}`

    return {
      id,
      company: pickValue(row, ['company', 'company_name', 'perusahaan', 'nama_perusahaan', 'nama']), // fallback names
      pic: pickValue(row, ['pic', 'contact', 'cp', 'person_in_charge']),
      position: pickValue(row, ['position', 'jabatan', 'title']),
      type: pickValue(row, ['type', 'kategori', 'category']),
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

export async function getExhibitorsBySegment(segment: ExhibitorSegment, limit = 200): Promise<ExhibitorRow[]> {
  const api = window.database?.fetchExhibitors
  if (!api) {
    throw new Error('API database tidak tersedia di renderer.')
  }

  const response = await api<Record<string, unknown>>(segment, limit)

  if (!response.success) {
    throw new Error(response.message || 'Gagal memuat data exhibitor')
  }

  const rows = response.rows ?? []
  return normalizeRows(rows)
}
