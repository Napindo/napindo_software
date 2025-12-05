import { Prisma } from "@prisma/client"

export type LabelFilterPayload = Record<string, unknown>

type BuildResult = {
  where: Prisma.Sql
  selectionFormula: string
}

type FlagDef = { key: string; field: string; op?: "=" | "<>"; crystalOp?: "=" | "<>" }
type ValueDef = { toggle: string; valueKey: string; field: string; op?: "=" | "<>" }

const eqXFlags: FlagDef[] = [
  // Visitor
  { key: "cvisdefence", field: "VISDEFENCE" },
  { key: "cvisaerospace", field: "VISAERO", crystalOp: "<>" }, // mengikuti perilaku VB lama
  { key: "cvismarine", field: "VISMARINE" },
  { key: "cviswater", field: "VISWATER" },
  { key: "cviswaste", field: "VISWASTE" },
  { key: "cvissmart", field: "VISSMART" },
  { key: "cvisrenergy", field: "VISENERGY" },
  { key: "cvissecurity", field: "VISSECURE" },
  { key: "cvisfirex", field: "VISFIRE" },
  { key: "cvislivestock", field: "VISLIVES" },
  { key: "cvisagrotech", field: "VISAGRITECH" },
  { key: "cvisfisheries", field: "VISFISH" },
  { key: "cvisvet", field: "VISINDOVET" },
  { key: "cvisfeed", field: "VISFEED" },
  { key: "cvisdairy", field: "VISDAIRY" },
  { key: "cvishorticulture", field: "VISHORTI" },
  // Exhibitor
  { key: "cexhdefence", field: "EXHDEFENCE" },
  { key: "cexhaerospace", field: "EXHAERO" },
  { key: "cexhmarine", field: "EXHMARINE" },
  { key: "cexhwater", field: "EXHWATER" },
  { key: "cexhwaste", field: "EXHWASTE" },
  { key: "cexhsmart", field: "EXHSMART" },
  { key: "cexhrenergy", field: "EXHENERGY" },
  { key: "cexhsecurity", field: "EXHSECURE" },
  { key: "cexhfirex", field: "EXHFIRE" },
  { key: "cexhlivestock", field: "EXHLIVES" },
  { key: "cexhagrotech", field: "EXHAGRITECH" },
  { key: "cexhfisheries", field: "EXHFISH" },
  { key: "cexhvet", field: "EXHINDOVET" },
  { key: "cexhfeed", field: "EXHFEED" },
  { key: "cexhdairy", field: "EXHDAIRY" },
  { key: "cexhhorticulture", field: "EXHHORTI" },
  // Programs & misc
  { key: "cdemo1", field: "DEMO1" },
  { key: "cdemo2", field: "DEMO2" },
  { key: "cdemo3", field: "DEMO3" },
  { key: "cseminar1", field: "SEMINAR1" },
  { key: "cseminar2", field: "SEMINAR2" },
  { key: "cseminar3", field: "SEMINAR3" },
  { key: "cseminar4", field: "SEMINAR4" },
  { key: "ctpp1", field: "TPP1" },
  { key: "ctpp2", field: "TPP2" },
  { key: "ctpp3", field: "TPP3" },
  { key: "ctpp4", field: "TPP4" },
  { key: "cwelcome", field: "WELCOMING" },
  { key: "cofflunch", field: "OFFLUNCH" },
  { key: "ccall", field: "COURTESYCALL" },
  { key: "cvisit", field: "VISITCALL" },
  { key: "csociety", field: "SOCIETY" },
  // VIP
  { key: "cvvip", field: "VVIP" },
  { key: "cvipdefence", field: "VID" },
  { key: "cvipaerospace", field: "VIPAERO" },
  { key: "cvipmarine", field: "VIPMARINE" },
  { key: "cvipwater", field: "VIW" },
  { key: "cvipwaste", field: "VIWASTE" },
  { key: "cvipsmart", field: "VIPIISMEX" },
  { key: "cviprenergy", field: "VIPIDRE" },
  { key: "cvipsecurity", field: "VIS" },
  { key: "cvipfirex", field: "VIFIRE" },
  { key: "cviplivestock", field: "VIL" },
  { key: "cvipagrotech", field: "VIPAGRI" },
  { key: "cvipfisheries", field: "VIFISH" },
  { key: "cvipvet", field: "VIPINDOVET" },
  { key: "cvipfeed", field: "VIFEED" },
  { key: "cvipdairy", field: "VIDAIRY" },
  { key: "cviphorticulture", field: "VIHORTI" },
  // Opening ceremony (OC)
  { key: "cocdefence", field: "OCD" },
  { key: "cocaerospace", field: "OCAERO" },
  { key: "cocmarine", field: "OCMARINE" },
  { key: "cocwaterjkt", field: "OCWJKT" },
  { key: "cocwatersby", field: "OCWSBY" },
  { key: "cocwaste", field: "OCWASTE" },
  { key: "cocsmart", field: "OCSMART" },
  { key: "cocrenergy", field: "OCENERGY" },
  { key: "cocsecurity", field: "OCS" },
  { key: "cocfirex", field: "OCFIRE" },
  { key: "coclivestockjkt", field: "OCLJKT" },
  { key: "coclivestocksby", field: "OCLSBY" },
  { key: "cocagrotech", field: "OCAGRI" },
  { key: "cocfisheries", field: "OCFISH" },
  { key: "cocvet", field: "OCINDOVET" },
  { key: "cocfeed", field: "OCFEED" },
  { key: "cocdairy", field: "OCDAIRY" },
  { key: "cochorticulture", field: "OCHORTI" },
  // Poster
  { key: "cpstrdefence", field: "PTRD" },
  { key: "cpstraerospace", field: "PTRAERO" },
  { key: "cpstrmarine", field: "PTRMARINE" },
  { key: "cpstrwater", field: "PTRW" },
  { key: "cpstrsecurity", field: "PTRS" },
  { key: "cpstrlivestock", field: "PTRL" },
  // Greeting card
  { key: "ckalender", field: "KALENDER" },
  { key: "clebaran", field: "LEBARAN" },
  { key: "cparcel", field: "PARCEL" },
  { key: "ctahunbaru", field: "TAHUNBARU" },
]

const neXFlags: FlagDef[] = [
  // Non visitor
  { key: "cnonvisdefence", field: "VISDEFENCE", op: "<>" },
  { key: "cnonvisaerospace", field: "VISAERO", op: "<>" },
  { key: "cnonvismarine", field: "VISMARINE", op: "<>" },
  { key: "cnonviswater", field: "VISWATER", op: "<>" },
  { key: "cnonviswaste", field: "VISWASTE", op: "<>" },
  { key: "cnonvissmart", field: "VISSMART", op: "<>" },
  { key: "cnonvisrenergy", field: "VISENERGY", op: "<>" },
  { key: "cnonvissecurity", field: "VISSECURE", op: "<>" },
  { key: "cnonvisfirex", field: "VISFIRE", op: "<>" },
  { key: "cnonvislivestock", field: "VISLIVES", op: "<>" },
  { key: "cnonvisagrotech", field: "VISAGRITECH", op: "<>" },
  { key: "cnonvisfisheries", field: "VISFISH", op: "<>" },
  { key: "cnonvisvet", field: "VISINDOVET", op: "<>" },
  { key: "cnonvisfeed", field: "VISFEED", op: "<>" },
  { key: "cnonvisdairy", field: "VISDAIRY", op: "<>" },
  { key: "cnonvishorticulture", field: "VISHORTI", op: "<>" },
  // Non exhibitor
  { key: "cnonexhdefence", field: "EXHDEFENCE", op: "<>" },
  { key: "cnonexhaerospace", field: "EXHAERO", op: "<>" },
  { key: "cnonexhmarine", field: "EXHMARINE", op: "<>" },
  { key: "cnonexhwater", field: "EXHWATER", op: "<>" },
  { key: "cnonexhwaste", field: "EXHWASTE", op: "<>" },
  { key: "cnonexhsmart", field: "EXHSMART", op: "<>" },
  { key: "cnonexhrenergy", field: "EXHENERGY", op: "<>" },
  { key: "cnonexhsecurity", field: "EXHSECURE", op: "<>" },
  { key: "cnonexhfirex", field: "EXHFIRE", op: "<>" },
  { key: "cnonexhlivestock", field: "EXHLIVES", op: "<>" },
  { key: "cnonexhagrotech", field: "EXHAGRITECH", op: "<>" },
  { key: "cnonexhfisheries", field: "EXHFISH", op: "<>" },
  { key: "cnonexhvet", field: "EXHINDOVET", op: "<>" },
  { key: "cnonexhfeed", field: "EXHFEED", op: "<>" },
  { key: "cnonexhdairy", field: "EXHDAIRY", op: "<>" },
  { key: "cnonexhhorticulture", field: "EXHHORTI", op: "<>" },
  // Programs & misc
  { key: "cnondemo1", field: "DEMO1", op: "<>" },
  { key: "cnondemo2", field: "DEMO2", op: "<>" },
  { key: "cnondemo3", field: "DEMO3", op: "<>" },
  { key: "cnonseminar1", field: "SEMINAR1", op: "<>" },
  { key: "cnonseminar2", field: "SEMINAR2", op: "<>" },
  { key: "cnonseminar3", field: "SEMINAR3", op: "<>" },
  { key: "cnonseminar4", field: "SEMINAR4", op: "<>" },
  { key: "cnontpp1", field: "TPP1", op: "<>" },
  { key: "cnontpp2", field: "TPP2", op: "<>" },
  { key: "cnontpp3", field: "TPP3", op: "<>" },
  { key: "cnontpp4", field: "TPP4", op: "<>" },
  { key: "cnonwelcome", field: "WELCOMING", op: "<>" },
  { key: "cnonlunch", field: "OFFLUNCH", op: "<>" },
  { key: "cnoncall", field: "COURTESYCALL", op: "<>" },
  { key: "cnonvisit", field: "VISITCALL", op: "<>" },
  { key: "cnonsociety", field: "SOCIETY", op: "<>" },
  // Non VIP
  { key: "cnonvvip", field: "VVIP", op: "<>" },
  { key: "cnonvipdefence", field: "VID", op: "<>" },
  { key: "cnonvipaerospace", field: "VIPAERO", op: "<>" },
  { key: "cnonvipmarine", field: "VIPMARINE", op: "<>" },
  { key: "cnonvipwater", field: "VIW", op: "<>" },
  { key: "cnonvipwaste", field: "VIWASTE", op: "<>" },
  { key: "cnonvipsmart", field: "VIPIISMEX", op: "<>" },
  { key: "cnonviprenergy", field: "VIPIDRE", op: "<>" },
  { key: "cnonvipsecurity", field: "VIS", op: "<>" },
  { key: "cnonvipfirex", field: "VIFIRE", op: "<>" },
  { key: "cnonviplivestock", field: "VIL", op: "<>" },
  { key: "cnonvipagrotech", field: "VIPAGRI", op: "<>" },
  { key: "cnonvipfisheries", field: "VIFISH", op: "<>" },
  { key: "cnonvipvet", field: "VIPINDOVET", op: "<>" },
  { key: "cnonvipfeed", field: "VIFEED", op: "<>" },
  { key: "cnonvipdairy", field: "VIDAIRY", op: "<>" },
  { key: "cnonviphorticulture", field: "VIHORTI", op: "<>" },
  // Non OC
  { key: "cnonocdefence", field: "OCD", op: "<>" },
  { key: "cnonocaerospace", field: "OCAERO", op: "<>" },
  { key: "cnonocmarine", field: "OCMARINE", op: "<>" },
  { key: "cnonocwaterjkt", field: "OCWJKT", op: "<>" },
  { key: "cnonocwatersby", field: "OCWSBY", op: "<>" },
  { key: "cnonocwaste", field: "OCWASTE", op: "<>" },
  { key: "cnonocsmart", field: "OCSMART", op: "<>" },
  { key: "cnonocrenergy", field: "OCENERGY", op: "<>" },
  { key: "cnonocsecurity", field: "OCS", op: "<>" },
  { key: "cnonocfirex", field: "OCFIRE", op: "<>" },
  { key: "cnonoclivestockjkt", field: "OCLJKT", op: "<>" },
  { key: "cnonoclivestocksby", field: "OCLSBY", op: "<>" },
  { key: "cnonocagrotech", field: "OCAGRI", op: "<>" },
  { key: "cnonocfisheries", field: "OCFISH", op: "<>" },
  { key: "cnonocvet", field: "OCINDOVET", op: "<>" },
  { key: "cnonocfeed", field: "OCFEED", op: "<>" },
  { key: "cnonocdairy", field: "OCDAIRY", op: "<>" },
  { key: "cnonochorticulture", field: "OCHORTI", op: "<>" },
  // Greeting card (non)
  { key: "cnonkalender", field: "KALENDER", op: "<>" },
  { key: "cnonlebaran", field: "LEBARAN", op: "<>" },
  { key: "cnonparcel", field: "PARCEL", op: "<>" },
  { key: "cnontahunbaru", field: "TAHUNBARU", op: "<>" },
]

const valueEquals: ValueDef[] = [
  { toggle: "ckcode1", valueKey: "cmbcode1", field: "CODE1" },
  { toggle: "ckcode2", valueKey: "cmbcode2", field: "CODE2" },
  { toggle: "ckcode3", valueKey: "cmbcode3", field: "CODE3" },
  { toggle: "cksource", valueKey: "cmbsource", field: "CODE4" },
  { toggle: "ckforum", valueKey: "cmbforum", field: "FORUM" },
  { toggle: "ckexhthn", valueKey: "cmbexhthn", field: "EXHTHN" },
  { toggle: "ckprov", valueKey: "cmbprov", field: "PROPINCE" },
  { toggle: "ckupdate", valueKey: "cmbupdate", field: "SOURCE" },
]

const valueNotEquals: ValueDef[] = [
  { toggle: "cknonsource", valueKey: "cmbnonsource", field: "CODE4", op: "<>" },
]

const TRIM = (val: unknown) => (val == null ? "" : String(val).trim())

export function buildLabelQuery(filter: LabelFilterPayload): BuildResult {
  const conditions: Prisma.Sql[] = []
  const crystals: string[] = []

  const addCond = (field: string, op: "=" | "<>", value: string, crystalOp?: "=" | "<>") => {
    const safeField = Prisma.raw(`"${field}"`)
    const sqlOp = Prisma.raw(op)
    conditions.push(Prisma.sql`${safeField} ${sqlOp} ${value}`)

    const esc = value.replace(/'/g, "''")
    crystals.push(`{vnongover.${field}} ${crystalOp ?? op} '${esc}'`)
  }

  const addLike = (field: string, value: string) => {
    const safeField = Prisma.raw(`"${field}"`)
    conditions.push(Prisma.sql`${safeField} LIKE ${value}`)
    const esc = value.replace(/%/g, "").replace(/'/g, "''").replace(/\*/g, "")
    crystals.push(`{vnongover.${field}} LIKE '*${esc.replace(/^%|%$/g, "")}*'`)
  }

  const isOn = (key: string) => Boolean(filter?.[key])

  // = 'X'
  eqXFlags.forEach(({ key, field, crystalOp }) => {
    if (isOn(key)) addCond(field, "=", "X", crystalOp)
  })

  // <> 'X'
  neXFlags.forEach(({ key, field }) => {
    if (isOn(key)) addCond(field, "<>", "X")
  })

  // Non email / HP kosong
  if (isOn("cnonemail")) addCond("EMAIL", "=", " ")
  if (isOn("cnonhp")) addCond("HANDPHONE", "=", " ")

  // Non overseas
  if (isOn("cnonoverseas")) {
    ;["Asia", "Eropa", "USA", "Africa"].forEach((val) => addCond("PROPINCE", "<>", val))
  }

  // Non error / resign / tdk / blm
  if (isOn("cnonerror")) addCond("CODE2", "<>", "ERROR")
  if (isOn("cnonresign")) addCond("CODE2", "<>", "RESIGN")
  if (isOn("cnontdkwater")) addCond("CODE3", "<>", "TDK")
  if (isOn("cnonblmlivestock")) addCond("CODE3", "<>", "BLM")

  // Tidak kirim
  if (isOn("ctdkkrmidd")) addCond("TDKKRMIDD", "<>", "X")
  if (isOn("ctdkkrmidwjkt")) addCond("TDKKRMIDWJKT", "<>", "X")
  if (isOn("ctdkkrmidwsby")) addCond("TDKKRMIDWSBY", "<>", "X")
  if (isOn("ctdkkrmidljkt")) addCond("TDKKRMIDLJKT", "<>", "X")
  if (isOn("ctdkkrmidlsby")) addCond("TDKKRMIDLSBY", "<>", "X")

  // Value equals
  valueEquals.forEach(({ toggle, valueKey, field }) => {
    if (!isOn(toggle)) return
    const value = TRIM(filter?.[valueKey])
    if (value) addCond(field, "=", value)
  })

  // Value not equals
  valueNotEquals.forEach(({ toggle, valueKey, field }) => {
    if (!isOn(toggle)) return
    const value = TRIM(filter?.[valueKey])
    if (value) addCond(field, "<>", value)
  })

  // Business like / non business
  if (isOn("cbusiness")) {
    const value = TRIM(filter?.["tbusiness"])
    if (value) addLike("BUSINESS", `%${value}%`)
  }
  if (isOn("cnonbusiness")) {
    const value = TRIM(filter?.["tnonbusiness"])
    if (value) addCond("BUSINESS", "<>", value)
  }

  const separator = " AND "
  const where =
    conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, separator)}`
      : Prisma.empty

  const selectionFormula = crystals.join(" AND ")

  return { where, selectionFormula }
}
