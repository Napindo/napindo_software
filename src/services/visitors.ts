import type { ExhibitorSegment } from "./exhibitors"
import { fetchExhibitors } from "./exhibitors"

export type VisitorSegment = ExhibitorSegment

export interface VisitorRow {
  id: number | string
  company: string
  pic: string
  position: string
  address: string
  city: string
  phone: string
  email: string
  type: string
  updatedAt?: string
  raw: Record<string, any>
}

/**
 * Deteksi tipe visitor berdasarkan flag kolom di GABUNG, termasuk VIP per segment.
 */
function detectVisitorType(raw: Record<string, any>, segment?: ExhibitorSegment): string {
  const lowerKeys = Object.keys(raw).map((k) => k.toLowerCase())

  const hasGoverFlag =
    lowerKeys.some((k) => k.includes("gover")) ||
    lowerKeys.some((k) => k.includes("government"))

  const isFlagX = (key: string) => {
    const val = (raw as any)[key] ?? (raw as any)[key.toUpperCase()]
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

  const hasVisitor = visitorFlags.some(isFlagX)
  const vipVisitorFlags = [
    "vid",
    "vipaero",
    "vipmarine",
    "viw",
    "viwaste",
    "vifire",
    "vifish",
    "vifeed",
    "vidairy",
    "vihorti",
  ]
  const vipBySegment: Partial<Record<ExhibitorSegment, string>> = {
    defence: "vid",
    aerospace: "vipaero",
    marine: "vipmarine",
    water: "viw",
    waste: "viwaste",
    security: "vis",
    firex: "vifire",
    fisheries: "vifish",
    feed: "vifeed",
    dairy: "vidairy",
    horticulture: "vihorti",
  }
  const vipHit = segment ? isFlagX(vipBySegment[segment] ?? "") : vipVisitorFlags.some(isFlagX)

  if (hasGoverFlag) return "Government Visitor"
  if (vipHit && hasVisitor) return "VIP Visitor"
  if (hasVisitor) return "Business Visitor"
  return "Business Visitor"
}

/**
 * Konversi ExhibitorRow menjadi VisitorRow dengan tipe terdeteksi.
 */
function mapExhibitorToVisitor(ex: {
  id: number | string
  company: string
  pic: string
  position: string
  address: string
  city: string
  phone: string
  email: string
  raw: Record<string, any>
  type?: string
  updatedAt?: string
  segment?: ExhibitorSegment
}): VisitorRow {
  const type = ex.type || detectVisitorType(ex.raw, ex.segment)

  return {
    id: ex.id,
    company: ex.company,
    pic: ex.pic,
    position: ex.position,
    address: ex.address,
    city: ex.city,
    phone: ex.phone,
    email: ex.email,
    type,
    updatedAt: ex.updatedAt,
    raw: ex.raw,
  }
}

/**
 * Ambil data visitor berdasarkan segment (defence, water, dsb)
 * dengan memanfaatkan service exhibitor yang sudah ada.
 */
export async function fetchVisitors(
  segment: ExhibitorSegment,
  limit = 200,
): Promise<VisitorRow[]> {
  const exhibitors = await fetchExhibitors(segment, limit, "visitor")
  return exhibitors.map((row) => mapExhibitorToVisitor({ ...row, segment }))
}

export async function getVisitorsBySegment(
  segment: ExhibitorSegment,
  limit = 200,
): Promise<VisitorRow[]> {
  return fetchVisitors(segment, limit)
}

export default {
  fetchVisitors,
  getVisitorsBySegment,
}
