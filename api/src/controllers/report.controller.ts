import type { Request, Response } from "express"
import { Prisma } from "@prisma/client"
import prisma from "../prisma"
import { buildLabelQuery } from "../services/labelReport"
import { ok, fail } from "../utils/apiResponse"
import { code2Options, businessOptions, provinceOptions } from "../constants/labelOptions"

type ReportTarget = "vnongover" | "vgabung"

function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max)
}

async function runLabelReport(target: ReportTarget, req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const { where, selectionFormula } = buildLabelQuery(payload)

    const limit = clamp(Number(payload.limit) || 500, 1, 2000)
    const offset = Math.max(Number(payload.offset) || 0, 0)

    const tableSql = Prisma.raw(`"${target}"`)

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
  return runLabelReport("vnongover", req, res)
}

export async function reportLabelGover(req: Request, res: Response) {
  return runLabelReport("vgabung", req, res)
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
