// src/services/gabungSegments.ts

/**
 * Segment yang dipakai di aplikasi.
 *
 * - Untuk endpoint lama /gabung/:segment kita baru pakai:
 *   "defence" | "aerospace" | "marine"
 * - Sisanya (water, waste, dll) disiapkan untuk Report / Print Label berikutnya.
 */
export type SegmentCode =
  | "defence"
  | "aerospace"
  | "marine"
  | "water"
  | "waste"
  | "smart"
  | "energy"
  | "security"
  | "fire"
  | "livestock"
  | "agrotech"
  | "fisheries"
  | "vet"
  | "feed"
  | "dairy"
  | "horticulture";

/**
 * Jenis orang di sistem: visitor / exhibitor.
 * Untuk endpoint lama /gabung/:segment kita pakai "exhibitor".
 */
export type PersonType = "visitor" | "exhibitor";

/**
 * Flag kolom di tabel GABUNG (lihat schema.prisma, field vis/exh*).
 * Nama-nama di sini HARUS sama dengan field Prisma:
 *  - viswater, vislives, visdefence, ...
 *  - exhwater, exhlives, exhdefence, ...
 */
type FlagPair = {
  visitor: keyof any;   // kita tidak perlu type Prisma di sini, nanti di-cast ke any
  exhibitor: keyof any;
};

/**
 * Mapping segment → pasangan flag pengunjung & exhibitor.
 * Diambil dari schema.prisma GABUNG.
 */
export const SEGMENT_FLAGS: Record<SegmentCode, FlagPair> = {
  // INDO DEFENCE
  defence:    { visitor: "visdefence", exhibitor: "exhdefence" },
  aerospace:  { visitor: "visaero",    exhibitor: "exhaero" },
  marine:     { visitor: "vismarine",  exhibitor: "exhmarine" },

  // INDO WATER
  water:      { visitor: "viswater",   exhibitor: "exhwater" },
  waste:      { visitor: "viswaste",   exhibitor: "exhwaste" },
  smart:      { visitor: "vissmart",   exhibitor: "exhsmart" },
  energy:     { visitor: "visenergy",  exhibitor: "exhenergy" },
  security:   { visitor: "vissecure",  exhibitor: "exhsecure" },
  fire:       { visitor: "visfire",    exhibitor: "exhfire" },

  // INDO LIVESTOCK
  livestock:    { visitor: "vislives",    exhibitor: "exhlives" },
  agrotech:     { visitor: "visagritech", exhibitor: "exhagritech" },
  fisheries:    { visitor: "visfish",     exhibitor: "exhfish" },
  vet:          { visitor: "visindovet",  exhibitor: "exhindovet" },
  feed:         { visitor: "visfeed",     exhibitor: "exhfeed" },
  dairy:        { visitor: "visdairy",    exhibitor: "exhdairy" },
  horticulture: { visitor: "vishorti",    exhibitor: "exhhorti" },
};

/**
 * Bangun filter Prisma untuk 1 segment & 1 tipe orang.
 *
 * Contoh hasil:
 *  { exhdefence: { not: null } }
 *
 * Dipakai di controller (listGabungBySegment) dan nanti di report.
 */
export function buildSegmentWhere(
  segment: SegmentCode,
  person: PersonType
): Record<string, any> {
  const pair = SEGMENT_FLAGS[segment];
  if (!pair) return {};

  const columnName = pair[person] as string;
  if (!columnName) return {};

  // Prisma WhereInput dengan key dinamis → cast ke any
  return {
    [columnName]: { not: null },
  } as any;
}
