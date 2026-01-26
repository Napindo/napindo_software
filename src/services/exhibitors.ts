export type ExhibitorSegment =
  | "defence"
  | "aerospace"
  | "marine"
  | "water"
  | "waste"
  | "iismex" // smart city / IISMEX
  | "renergy" // renewable energy
  | "security"
  | "firex"
  | "livestock"
  | "agrotech"
  | "vet"
  | "fisheries"
  | "feed"
  | "dairy"
  | "horticulture"

import { buildApiUrl, isApiOk, pickApiData } from '../utils/api'
import { getDatabaseBridge, getIpcRenderer } from '../utils/bridge'

export type DatabaseResponse<T = unknown> =
  | { success: true; rows?: T[]; data?: T; message?: string }
  | { success: false; message: string }

export interface ExhibitorRow {
  id: number | string
  company: string
  pic: string
  position: string
  address: string
  city: string
  phone: string
  email: string
  type?: string
  updatedAt?: string
  raw: Record<string, any>
}

/**
 * Mapping dari segment di UI → segment code di backend (/api/gabung/:segment).
 */
const SEGMENT_TO_BACKEND: Record<ExhibitorSegment, string> = {
  defence: "defence",
  aerospace: "aerospace",
  marine: "marine",

  water: "water",
  waste: "waste",
  iismex: "smart", // IISMEX = smart city
  renergy: "energy",
  security: "security",
  firex: "fire",

  livestock: "livestock",
  agrotech: "agrotech",
  vet: "vet",
  fisheries: "fisheries",
  feed: "feed",
  dairy: "dairy",
  horticulture: "horticulture",
}

async function invokeFetchExhibitorCountByExpo(): Promise<DatabaseResponse> {
  const db = getDatabaseBridge()
  if (db && typeof db.fetchExhibitorCountByExpo === 'function') {
    return db.fetchExhibitorCountByExpo() as Promise<DatabaseResponse>
  }

  const ipc = getIpcRenderer()
  if (ipc && typeof ipc.invoke === 'function') {
    return ipc.invoke('db:fetchExhibitorCountByExpo') as Promise<DatabaseResponse>
  }

  const res = await fetch(buildApiUrl('/gabung/exhibitor-count'))
  const body = await res.json()
  if (!isApiOk(body)) {
    throw new Error(body?.message ?? 'Gagal mengambil jumlah exhibitor per pameran')
  }
  const data = pickApiData(body)
  return { success: true, data }
}

async function invokeFetchExpoChartData(): Promise<DatabaseResponse> {
  const db = getDatabaseBridge()
  if (db && typeof db.fetchExpoChartData === 'function') {
    return db.fetchExpoChartData() as Promise<DatabaseResponse>
  }

  const ipc = getIpcRenderer()
  if (ipc && typeof ipc.invoke === 'function') {
    return ipc.invoke('db:fetchExpoChartData') as Promise<DatabaseResponse>
  }

  const res = await fetch(buildApiUrl('/gabung/expo-chart'))
  const body = await res.json()
  if (!isApiOk(body)) {
    throw new Error(body?.message ?? 'Gagal mengambil data grafik pameran')
  }
  const data = pickApiData(body)
  return { success: true, data }
}

/**
 * Ambil value dari beberapa candidate key (misal: ["COMPANY", "company"]).
 */
function pickValue(row: Record<string, any>, keys: string[]): string {
  for (const key of keys) {
    if (key in row && row[key] != null && String(row[key]).trim() !== "") {
      return String(row[key]).trim()
    }
  }
  return ""
}

/**
 * Normalisasi baris mentah dari GABUNG jadi bentuk ExhibitorRow.
 */
function normalizeExhibitorRow(row: Record<string, any>, segment?: ExhibitorSegment): ExhibitorRow {
  const lower: Record<string, any> = {}
  for (const [k, v] of Object.entries(row)) {
    lower[k.toLowerCase()] = v
  }

  const id =
    (row as any).NOURUT ??
    (row as any).nourut ??
    lower["nourut"] ??
    lower["id"] ??
    lower["pk"] ??
    String(Math.random())

  const company = pickValue(row, ["COMPANY", "company", "nama_perusahaan"])
  const pic = pickValue(row, ["NAME", "name", "contactperson"])
  const position = pickValue(row, ["POSITION", "position", "jabatan"])
  const address = pickValue(row, ["ADDRESS1", "address1", "alamat"])
  const city = pickValue(row, ["CITY", "city", "kota"])
  const phone = pickValue(row, ["PHONE", "phone", "telepon"])
  const email = pickValue(row, ["EMAIL", "email"])
  const updatedAt = pickValue(row, ["lastupdate", "tgl_jam_edit", "tgljamedit"])

  const isFlagX = (key: string) => {
    const val = lower[key.toLowerCase()]
    if (val === undefined || val === null) return false
    const text = String(val).trim().toLowerCase()
    return text === "x" || text === "1" || text === "yes" || text === "true"
  }

  const visitorFlags = [
    "visdefence",
    "visaero",
    "vismarine",
    "viswater",
    "viswaste",
    "visenergy",
    "vissmart",
    "vissecure",
    "visfire",
    "vislives",
    "visagritech",
    "visindovet",
    "visfish",
    "visfeed",
    "visdairy",
    "vishorti",
  ]

  const exhibitorFlags = [
    "exhdefence",
    "exhaero",
    "exhmarine",
    "exhwater",
    "exhwaste",
    "exhenergy",
    "exhsmart",
    "exhsecure",
    "exhfire",
    "exhlives",
    "exhagritech",
    "exhindovet",
    "exhfish",
    "exhfeed",
    "exhdairy",
    "exhhorti",
  ]

  const vipVisitorFlags = ["vid", "vipaero", "vipmarine", "viw", "viwaste", "vipiismex", "vipidre", "vis", "vifire", "vil", "vipagri", "vipindovet", "vifish", "vifeed", "vidairy", "vihorti"]
  const types: string[] = []

  const hasVisitor = visitorFlags.some(isFlagX)
  const hasExhibitor = exhibitorFlags.some(isFlagX)
  const hasGover = isFlagX("gover")
  const hasVip = vipVisitorFlags.some(isFlagX)

  if (hasVisitor) types.push("Visitor")
  if (hasExhibitor) types.push("Exhibitor")
  if (hasGover) types.push("Gover")
  if (hasVip) {
    const vipBySegment: Partial<Record<ExhibitorSegment, string>> = {
      defence: "vid",
      aerospace: "vipaero",
      marine: "vipmarine",
      water: "viw",
      waste: "viwaste",
      iismex: "vipiismex",
      renergy: "vpidre",
      security: "vis",
      firex: "vifire",
      livestock: "vil",
      agrotech: "vipagri",
      vet: "vipindovet",
      fisheries: "vifish",
      feed: "vifeed",
      dairy: "vidairy",
      horticulture: "vihorti",
    }
    const vipKey = segment ? vipBySegment[segment] : undefined
    const vipHit = vipKey ? isFlagX(vipKey) : hasVip

    if (vipHit) {
      if (hasExhibitor) types.push("VIP Exhibitor")
      else if (hasVisitor) types.push("VIP Visitor")
    }
  }

  const type = types.join(", ")

  return {
    id,
    company,
    pic,
    position,
    address,
    city,
    phone,
    email,
    type,
    updatedAt,
    raw: row,
  }
}

/**
 * Panggil bridge untuk ambil data exhibitor per segment.
 */
async function invokeFetchExhibitors(
  segment: ExhibitorSegment,
  limit = 0,
  person: "exhibitor" | "visitor" = "exhibitor",
): Promise<DatabaseResponse<Record<string, any>>> {
  const backendSegment = SEGMENT_TO_BACKEND[segment] ?? segment
  const db = getDatabaseBridge()

  if (db && typeof db.fetchExhibitors === "function") {
    return db.fetchExhibitors(
      backendSegment,
      limit,
      person,
    ) as Promise<DatabaseResponse<Record<string, any>>>
  }

  const ipc = getIpcRenderer()
  if (ipc && typeof ipc.invoke === "function") {
    return ipc.invoke(
      "db:fetchExhibitors",
      backendSegment,
      limit,
      person,
    ) as Promise<DatabaseResponse<Record<string, any>>>
  }

  const search = new URLSearchParams({
    limit: String(limit),
    person,
  })
  const res = await fetch(buildApiUrl(`/gabung/segment/${encodeURIComponent(backendSegment)}?${search.toString()}`))
  const body = await res.json()
  if (!isApiOk(body)) {
    return { success: false, message: body?.message ?? 'Gagal mengambil data exhibitor' }
  }
  const data = pickApiData(body)
  const items = (data?.items ?? data?.rows ?? data ?? [])
  return { success: true, rows: items }
}

/**
 * Ambil dan normalisasi data exhibitor untuk satu segment.
 */
export async function fetchExhibitors(
  segment: ExhibitorSegment,
  limit = 0,
  person: "exhibitor" | "visitor" = "exhibitor",
): Promise<ExhibitorRow[]> {
  const response = await invokeFetchExhibitors(segment, limit, person)

  if (!response || response.success === false) {
    throw new Error(response?.message ?? "Gagal mengambil data exhibitor")
  }

  const rows = (response.rows ?? []) as Record<string, any>[]

  return rows.map((row) => normalizeExhibitorRow(row, segment))
}

/**
 * Wrapper dengan nama lama yang dicari oleh Exhibitor.tsx
 * import { getExhibitorsBySegment } from "../services/exhibitors";
 */
export async function getExhibitorsBySegment(
  segment: ExhibitorSegment,
  limit = 0,
  person: "exhibitor" | "visitor" = "exhibitor",
): Promise<ExhibitorRow[]> {
  return fetchExhibitors(segment, limit, person)
}

/**
 * (opsional) alias nama pendek
 */
export async function getExhibitors(
  segment: ExhibitorSegment,
  limit = 0,
): Promise<ExhibitorRow[]> {
  return fetchExhibitors(segment, limit)
}

export async function fetchExhibitorCountByExpo(): Promise<{
  indoDefence?: number
  indoWater?: number
  indoLivestock?: number
}> {
  const response = await invokeFetchExhibitorCountByExpo()
  if (!response || response.success === false) {
    throw new Error(response?.message ?? 'Gagal mengambil jumlah exhibitor per pameran')
  }

  return (response.data ?? {}) as {
    indoDefence?: number
    indoWater?: number
    indoLivestock?: number
  }
}

export async function fetchExpoChartData(): Promise<{
  indoDefence?: Record<number, number>
  indoWater?: Record<number, number>
  indoLivestock?: Record<number, number>
}> {
  const response = await invokeFetchExpoChartData()
  if (!response || response.success === false) {
    throw new Error(response?.message ?? 'Gagal mengambil data grafik pameran')
  }

  return (response.data ?? {}) as {
    indoDefence?: Record<number, number>
    indoWater?: Record<number, number>
    indoLivestock?: Record<number, number>
  }
}

export default {
  fetchExhibitors,
  getExhibitorsBySegment,
  getExhibitors,
  fetchExhibitorCountByExpo,
  fetchExpoChartData,
}
