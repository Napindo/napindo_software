import type { Request, Response } from "express"
import { Prisma } from "@prisma/client"
import prisma from "../prisma"
import { buildLabelQuery } from "../services/labelReport"
import { ok, fail } from "../utils/apiResponse"
import { code2Options, businessOptions, provinceOptions } from "../constants/labelOptions"
import { renderLabelPerusahaanPdf } from "../services/labelRender"
import { buildLabelDocx, buildLabelExcel } from "../services/labelExport"

type ReportTarget = "vnongover" | "vgabung" | "gabung"

function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max)
}

async function runLabelReport(
  target: ReportTarget,
  req: Request,
  res: Response,
  baseConditions: Prisma.Sql[] = [],
) {
  try {
    const payload = req.body ?? {}
    const { where, selectionFormula } = buildLabelQuery(payload, baseConditions)

    const limit = clamp(Number(payload.limit) || 500, 1, 2000)
    const offset = Math.max(Number(payload.offset) || 0, 0)

    const tableSql = target === "gabung" ? Prisma.raw(`"GABUNG"`) : Prisma.raw(`"${target}"`)

    const items = await prisma.$queryRaw<any[]>(
      Prisma.sql`SELECT * FROM ${tableSql} ${where} ORDER BY "COMPANY" LIMIT ${limit} OFFSET ${offset}`,
    )

    const countRows = await prisma.$queryRaw<{ count: bigint }[]>(
      Prisma.sql`SELECT COUNT(*)::bigint as count FROM ${tableSql} ${where}`,
    )

    const total = countRows?.[0]?.count ? Number(countRows[0].count) : 0

    return res.json(
      ok({
        items,
        total,
        selectionFormula,
      }),
    )
  } catch (err: any) {
    return res.status(500).json(fail(err?.message || String(err)))
  }
}

export async function reportLabelPerusahaan(req: Request, res: Response) {
  const goverField = Prisma.raw(`"GOVER"`)
  const nonGoverCondition = Prisma.sql`(${goverField} IS NULL OR ${goverField} <> 'X')`
  return runLabelReport("gabung", req, res, [nonGoverCondition])
}

export async function reportLabelGover(req: Request, res: Response) {
  return runLabelReport("vgabung", req, res)
}

function mapDbRowToLabel(row: any) {
  return {
    companyName: row?.COMPANY ?? "",
    contactName: row?.NAME ?? "",
    position: row?.POSITION ?? row?.TITLE ?? "",
    nourut: row?.NOURUT ?? row?.NO_URUT ?? row?.NO ?? "",
    addressLine1: row?.ALAMAT ?? row?.ADDRESS ?? "",
    addressLine2: row?.ADDRESS2 ?? "",
    city: row?.CITY ?? "",
    province: row?.PROPINCE ?? "",
    country: row?.COUNTRY ?? "",
    postcode: row?.ZIP ?? row?.POSTCODE ?? "",
    sex: row?.SEX ?? "",
    phone: row?.PHONE ?? "",
    handphone: row?.HANDPHONE ?? "",
    email: row?.EMAIL ?? "",
    mainActivity: row?.MAIN_ACTIV ?? "",
    business: row?.BUSINESS ?? "",
  }
}

export async function exportLabelPerusahaanPdf(req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const goverField = Prisma.raw(`"GOVER"`)
    const nonGoverCondition = Prisma.sql`(${goverField} IS NULL OR ${goverField} <> 'X')`
    const { where } = buildLabelQuery(payload, [nonGoverCondition])

    const tableSql = Prisma.raw(`"GABUNG"`)
    const items = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT * FROM ${tableSql} ${where} ORDER BY "COMPANY"`)
    const rows = (items ?? []).map(mapDbRowToLabel)

    const data = {
      title: (payload?.judul_label as string) || "Print Label Perusahaan",
      totalCount: rows.length,
      rows,
    }

    const pdf = await renderLabelPerusahaanPdf(data)

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", 'inline; filename="print-label-perusahaan.pdf"')
    const buffer = Buffer.from(await pdf.arrayBuffer())
    return res.end(buffer)
  } catch (err: any) {
    return res.status(500).json(fail(err?.message || String(err)))
  }
}

export async function exportLabelPerusahaanExcel(req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const goverField = Prisma.raw(`"GOVER"`)
    const nonGoverCondition = Prisma.sql`(${goverField} IS NULL OR ${goverField} <> 'X')`
    const { where } = buildLabelQuery(payload, [nonGoverCondition])
    const tableSql = Prisma.raw(`"GABUNG"`)
    const items = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT * FROM ${tableSql} ${where} ORDER BY "COMPANY"`)
    const rows = (items ?? []).map(mapDbRowToLabel)

    const buffer = await buildLabelExcel(rows)
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", 'attachment; filename="print-label-perusahaan.xlsx"')
    return res.end(buffer)
  } catch (err: any) {
    return res.status(500).json(fail(err?.message || String(err)))
  }
}

export async function exportLabelPerusahaanWord(req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const goverField = Prisma.raw(`"GOVER"`)
    const nonGoverCondition = Prisma.sql`(${goverField} IS NULL OR ${goverField} <> 'X')`
    const { where } = buildLabelQuery(payload, [nonGoverCondition])
    const tableSql = Prisma.raw(`"GABUNG"`)
    const items = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT * FROM ${tableSql} ${where} ORDER BY "COMPANY"`)
    const rows = (items ?? []).map(mapDbRowToLabel)

    const title = (payload?.judul_label as string) || "Print Label Perusahaan"
    const buffer = await buildLabelDocx(rows, title)

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    res.setHeader("Content-Disposition", 'attachment; filename="print-label-perusahaan.docx"')
    return res.end(buffer)
  } catch (err: any) {
    return res.status(500).json(fail(err?.message || String(err)))
  }
}

export async function getLabelOptions(_req: Request, res: Response) {
  try {
    const columns = [
      { key: "code1", column: "CODE1" },
      { key: "code3", column: "CODE3" },
      { key: "source", column: "CODE4" },
      { key: "nonSource", column: "CODE4" },
      { key: "forum", column: "FORUM" },
      { key: "exhthn", column: "EXHTHN" },
      { key: "provinceDb", column: "PROPINCE" },
      { key: "updatedBy", column: "SOURCE" },
    ] as const

    const result: Record<string, string[]> = {}

    for (const { key, column } of columns) {
      const col = Prisma.raw(`"${column}"`)
      const rows = await prisma.$queryRaw<{ val: string | null }[]>(
        Prisma.sql`SELECT DISTINCT ${col} as val FROM "vnongover" WHERE ${col} IS NOT NULL`,
      )
      result[key] = rows
        .map((r) => (r?.val ?? "").trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
    }

    // Code2: gunakan master options dari AddData form
    result.code2 = [...code2Options]

    // Province: gabungkan katalog + dari DB
    const provinceSet = new Set<string>([...provinceOptions, ...(result.provinceDb ?? [])].map((p) => p.trim()).filter(Boolean))
    result.province = Array.from(provinceSet).sort((a, b) => a.localeCompare(b))
    delete result.provinceDb

    // Business/non-business dari katalog backend
    const businessList = businessOptions ?? []
    result.business = [...businessList]
    result.nonBusiness = [...businessList]

    // Non Source share list CODE4
    result.nonSource = result.nonSource ?? result.source ?? []

    // Code1/3 already set; Source already set
    return res.json(ok(result))
  } catch (err: any) {
    return res.status(500).json(fail(err?.message || String(err)))
  }
}
