import type { Request, Response } from "express"
import { Prisma } from "@prisma/client"
import prisma from "../prisma"
import { buildLabelQuery } from "../services/labelReport"
import { ok, fail } from "../utils/apiResponse"
import { code2Options, businessOptions, provinceOptions } from "../constants/labelOptions"
import { renderLabelPerusahaanPdf } from "../services/labelRender"
import { buildLabelDocx, buildLabelExcel } from "../services/labelExport"
import { buildReportDocx } from "../services/reportExport"
import { renderReportPdf } from "../services/reportRender"
import { buildReportJumlahDocx, buildReportJumlahExcel } from "../services/reportJumlahExport"
import { renderReportJumlahPdf } from "../services/reportJumlahRender"

type ReportTarget = "vnongover" | "vgabung" | "gabung"

function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max)
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function formatReportDate(value: Date) {
  const day = String(value.getDate()).padStart(2, "0")
  const month = MONTH_NAMES[value.getMonth()] || ""
  const year = value.getFullYear()
  return `${day}-${month}-${year}`
}

function formatIsoDate(value: unknown) {
  if (!value) return ""
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return ""
    if (trimmed.length >= 10) return trimmed.slice(0, 10)
    return trimmed
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  return ""
}

function splitBusiness(value: unknown) {
  if (value == null) return []
  const raw = String(value).trim()
  if (!raw) return []
  return raw
    .split(/[;,]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function buildBusinessCounts(items: any[]) {
  const counts = new Map<string, number>()
  items.forEach((row) => {
    splitBusiness(row?.BUSINESS).forEach((entry) => {
      counts.set(entry, (counts.get(entry) ?? 0) + 1)
    })
  })

  return Array.from(counts.entries())
    .map(([business, count]) => ({ business, count }))
    .sort((a, b) => a.business.localeCompare(b.business))
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
  const goverField = Prisma.raw(`"GOVER"`)
  const goverCondition = Prisma.sql`${goverField} = 'X'`
  return runLabelReport("vgabung", req, res, [goverCondition])
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

function mapDbRowToReport(row: any) {
  return {
    company: row?.COMPANY ?? "",
    address1: row?.ALAMAT ?? row?.ADDRESS ?? "",
    address2: row?.ADDRESS2 ?? "",
    city: row?.CITY ?? "",
    zip: row?.ZIP ?? row?.POSTCODE ?? "",
    sex: row?.SEX ?? "",
    name: row?.NAME ?? "",
    position: row?.POSITION ?? row?.TITLE ?? "",
    phone: row?.PHONE ?? "",
    facsimile: row?.FACSIMILE ?? "",
    business: row?.BUSINESS ?? "",
    email: row?.EMAIL ?? "",
    handphone: row?.HANDPHONE ?? "",
    lastupdate: formatIsoDate(row?.LASTUPDATE),
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

export async function exportLabelGoverPdf(req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const goverField = Prisma.raw(`"GOVER"`)
    const goverCondition = Prisma.sql`${goverField} = 'X'`
    const { where } = buildLabelQuery(payload, [goverCondition])

    const tableSql = Prisma.raw(`"vgabung"`)
    const items = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT * FROM ${tableSql} ${where} ORDER BY "COMPANY"`)
    const rows = (items ?? []).map(mapDbRowToLabel)

    const data = {
      title: (payload?.judul_label as string) || "Print Label Government",
      totalCount: rows.length,
      rows,
    }

    const pdf = await renderLabelPerusahaanPdf(data)

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", 'inline; filename="print-label-government.pdf"')
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

export async function exportLabelGoverExcel(req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const goverField = Prisma.raw(`"GOVER"`)
    const goverCondition = Prisma.sql`${goverField} = 'X'`
    const { where } = buildLabelQuery(payload, [goverCondition])
    const tableSql = Prisma.raw(`"vgabung"`)
    const items = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT * FROM ${tableSql} ${where} ORDER BY "COMPANY"`)
    const rows = (items ?? []).map(mapDbRowToLabel)

    const buffer = await buildLabelExcel(rows)
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", 'attachment; filename="print-label-government.xlsx"')
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

export async function exportLabelGoverWord(req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const goverField = Prisma.raw(`"GOVER"`)
    const goverCondition = Prisma.sql`${goverField} = 'X'`
    const { where } = buildLabelQuery(payload, [goverCondition])
    const tableSql = Prisma.raw(`"vgabung"`)
    const items = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT * FROM ${tableSql} ${where} ORDER BY "COMPANY"`)
    const rows = (items ?? []).map(mapDbRowToLabel)

    const title = (payload?.judul_label as string) || "Print Label Government"
    const buffer = await buildLabelDocx(rows, title)

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    res.setHeader("Content-Disposition", 'attachment; filename="print-label-government.docx"')
    return res.end(buffer)
  } catch (err: any) {
    return res.status(500).json(fail(err?.message || String(err)))
  }
}

export async function reportPerusahaan(req: Request, res: Response) {
  const goverField = Prisma.raw(`"GOVER"`)
  const nonGoverCondition = Prisma.sql`(${goverField} IS NULL OR ${goverField} <> 'X')`
  return runLabelReport("gabung", req, res, [nonGoverCondition])
}

export async function reportGovernment(req: Request, res: Response) {
  const goverField = Prisma.raw(`"GOVER"`)
  const goverCondition = Prisma.sql`${goverField} = 'X'`
  return runLabelReport("vgabung", req, res, [goverCondition])
}

export async function exportReportPerusahaanPdf(req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const goverField = Prisma.raw(`"GOVER"`)
    const nonGoverCondition = Prisma.sql`(${goverField} IS NULL OR ${goverField} <> 'X')`
    const { where } = buildLabelQuery(payload, [nonGoverCondition])
    const tableSql = Prisma.raw(`"GABUNG"`)
    const items = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT * FROM ${tableSql} ${where} ORDER BY "COMPANY"`)
    const rows = (items ?? []).map(mapDbRowToReport)

    const title =
      (payload?.judul_report as string) || (payload?.judul_label as string) || "Report Perusahaan"
    const reportDate = formatReportDate(new Date())
    const data = {
      title,
      reportDate,
      totalCount: rows.length,
      rows,
    }

    const pdf = await renderReportPdf(data)

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", 'inline; filename="report-perusahaan.pdf"')
    const buffer = Buffer.from(await pdf.arrayBuffer())
    return res.end(buffer)
  } catch (err: any) {
    return res.status(500).json(fail(err?.message || String(err)))
  }
}

export async function exportReportGovernmentPdf(req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const goverField = Prisma.raw(`"GOVER"`)
    const goverCondition = Prisma.sql`${goverField} = 'X'`
    const { where } = buildLabelQuery(payload, [goverCondition])
    const tableSql = Prisma.raw(`"vgabung"`)
    const items = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT * FROM ${tableSql} ${where} ORDER BY "COMPANY"`)
    const rows = (items ?? []).map(mapDbRowToReport)

    const title =
      (payload?.judul_report as string) || (payload?.judul_label as string) || "Report Government"
    const reportDate = formatReportDate(new Date())
    const data = {
      title,
      reportDate,
      totalCount: rows.length,
      rows,
    }

    const pdf = await renderReportPdf(data)

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", 'inline; filename="report-government.pdf"')
    const buffer = Buffer.from(await pdf.arrayBuffer())
    return res.end(buffer)
  } catch (err: any) {
    return res.status(500).json(fail(err?.message || String(err)))
  }
}

export async function exportReportPerusahaanWord(req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const goverField = Prisma.raw(`"GOVER"`)
    const nonGoverCondition = Prisma.sql`(${goverField} IS NULL OR ${goverField} <> 'X')`
    const { where } = buildLabelQuery(payload, [nonGoverCondition])
    const tableSql = Prisma.raw(`"GABUNG"`)
    const items = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT * FROM ${tableSql} ${where} ORDER BY "COMPANY"`)
    const rows = (items ?? []).map(mapDbRowToReport)

    const title =
      (payload?.judul_report as string) || (payload?.judul_label as string) || "Report Perusahaan"
    const reportDate = formatReportDate(new Date())
    const buffer = await buildReportDocx(rows, title, reportDate)

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    res.setHeader("Content-Disposition", 'attachment; filename="report-perusahaan.docx"')
    return res.end(buffer)
  } catch (err: any) {
    return res.status(500).json(fail(err?.message || String(err)))
  }
}

export async function exportReportGovernmentWord(req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const goverField = Prisma.raw(`"GOVER"`)
    const goverCondition = Prisma.sql`${goverField} = 'X'`
    const { where } = buildLabelQuery(payload, [goverCondition])
    const tableSql = Prisma.raw(`"vgabung"`)
    const items = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT * FROM ${tableSql} ${where} ORDER BY "COMPANY"`)
    const rows = (items ?? []).map(mapDbRowToReport)

    const title =
      (payload?.judul_report as string) || (payload?.judul_label as string) || "Report Government"
    const reportDate = formatReportDate(new Date())
    const buffer = await buildReportDocx(rows, title, reportDate)

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    res.setHeader("Content-Disposition", 'attachment; filename="report-government.docx"')
    return res.end(buffer)
  } catch (err: any) {
    return res.status(500).json(fail(err?.message || String(err)))
  }
}

export async function exportReportPerusahaanExcel(req: Request, res: Response) {
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
    res.setHeader("Content-Disposition", 'attachment; filename="report-perusahaan.xlsx"')
    return res.end(buffer)
  } catch (err: any) {
    return res.status(500).json(fail(err?.message || String(err)))
  }
}

export async function exportReportGovernmentExcel(req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const goverField = Prisma.raw(`"GOVER"`)
    const goverCondition = Prisma.sql`${goverField} = 'X'`
    const { where } = buildLabelQuery(payload, [goverCondition])
    const tableSql = Prisma.raw(`"vgabung"`)
    const items = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT * FROM ${tableSql} ${where} ORDER BY "COMPANY"`)
    const rows = (items ?? []).map(mapDbRowToLabel)

    const buffer = await buildLabelExcel(rows)
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", 'attachment; filename="report-government.xlsx"')
    return res.end(buffer)
  } catch (err: any) {
    return res.status(500).json(fail(err?.message || String(err)))
  }
}

export async function reportJumlahPerusahaan(req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const goverField = Prisma.raw(`"GOVER"`)
    const nonGoverCondition = Prisma.sql`(${goverField} IS NULL OR ${goverField} <> 'X')`
    const { where, selectionFormula } = buildLabelQuery(payload, [nonGoverCondition])
    const tableSql = Prisma.raw(`"GABUNG"`)

    const items = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT "BUSINESS" FROM ${tableSql} ${where}`)
    const countRows = await prisma.$queryRaw<{ count: bigint }[]>(
      Prisma.sql`SELECT COUNT(*)::bigint as count FROM ${tableSql} ${where}`,
    )
    const total = countRows?.[0]?.count ? Number(countRows[0].count) : 0

    const rows = buildBusinessCounts(items ?? [])

    return res.json(
      ok({
        items: rows,
        total,
        selectionFormula,
      }),
    )
  } catch (err: any) {
    return res.status(500).json(fail(err?.message || String(err)))
  }
}

export async function reportJumlahGovernment(req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const goverField = Prisma.raw(`"GOVER"`)
    const goverCondition = Prisma.sql`${goverField} = 'X'`
    const { where, selectionFormula } = buildLabelQuery(payload, [goverCondition])
    const tableSql = Prisma.raw(`"vgabung"`)

    const items = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT "BUSINESS" FROM ${tableSql} ${where}`)
    const countRows = await prisma.$queryRaw<{ count: bigint }[]>(
      Prisma.sql`SELECT COUNT(*)::bigint as count FROM ${tableSql} ${where}`,
    )
    const total = countRows?.[0]?.count ? Number(countRows[0].count) : 0

    const rows = buildBusinessCounts(items ?? [])

    return res.json(
      ok({
        items: rows,
        total,
        selectionFormula,
      }),
    )
  } catch (err: any) {
    return res.status(500).json(fail(err?.message || String(err)))
  }
}

export async function exportReportJumlahPerusahaanPdf(req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const goverField = Prisma.raw(`"GOVER"`)
    const nonGoverCondition = Prisma.sql`(${goverField} IS NULL OR ${goverField} <> 'X')`
    const { where } = buildLabelQuery(payload, [nonGoverCondition])
    const tableSql = Prisma.raw(`"GABUNG"`)
    const items = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT "BUSINESS" FROM ${tableSql} ${where}`)
    const rows = buildBusinessCounts(items ?? [])

    const title =
      (payload?.judul_jumlah_report as string) ||
      (payload?.judul_report as string) ||
      (payload?.judul_label as string) ||
      "Report Jumlah Perusahaan"
    const reportDate = formatReportDate(new Date())
    const data = {
      title,
      reportDate,
      totalCount: rows.length,
      rows,
    }

    const pdf = await renderReportJumlahPdf(data)

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", 'inline; filename="report-jumlah-perusahaan.pdf"')
    const buffer = Buffer.from(await pdf.arrayBuffer())
    return res.end(buffer)
  } catch (err: any) {
    return res.status(500).json(fail(err?.message || String(err)))
  }
}

export async function exportReportJumlahGovernmentPdf(req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const goverField = Prisma.raw(`"GOVER"`)
    const goverCondition = Prisma.sql`${goverField} = 'X'`
    const { where } = buildLabelQuery(payload, [goverCondition])
    const tableSql = Prisma.raw(`"vgabung"`)
    const items = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT "BUSINESS" FROM ${tableSql} ${where}`)
    const rows = buildBusinessCounts(items ?? [])

    const title =
      (payload?.judul_jumlah_report as string) ||
      (payload?.judul_report as string) ||
      (payload?.judul_label as string) ||
      "Report Jumlah Government"
    const reportDate = formatReportDate(new Date())
    const data = {
      title,
      reportDate,
      totalCount: rows.length,
      rows,
    }

    const pdf = await renderReportJumlahPdf(data)

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", 'inline; filename="report-jumlah-government.pdf"')
    const buffer = Buffer.from(await pdf.arrayBuffer())
    return res.end(buffer)
  } catch (err: any) {
    return res.status(500).json(fail(err?.message || String(err)))
  }
}

export async function exportReportJumlahPerusahaanWord(req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const goverField = Prisma.raw(`"GOVER"`)
    const nonGoverCondition = Prisma.sql`(${goverField} IS NULL OR ${goverField} <> 'X')`
    const { where } = buildLabelQuery(payload, [nonGoverCondition])
    const tableSql = Prisma.raw(`"GABUNG"`)
    const items = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT "BUSINESS" FROM ${tableSql} ${where}`)
    const rows = buildBusinessCounts(items ?? [])

    const title =
      (payload?.judul_jumlah_report as string) ||
      (payload?.judul_report as string) ||
      (payload?.judul_label as string) ||
      "Report Jumlah Perusahaan"
    const reportDate = formatReportDate(new Date())
    const buffer = await buildReportJumlahDocx(rows, title, reportDate)

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    res.setHeader("Content-Disposition", 'attachment; filename="report-jumlah-perusahaan.docx"')
    return res.end(buffer)
  } catch (err: any) {
    return res.status(500).json(fail(err?.message || String(err)))
  }
}

export async function exportReportJumlahGovernmentWord(req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const goverField = Prisma.raw(`"GOVER"`)
    const goverCondition = Prisma.sql`${goverField} = 'X'`
    const { where } = buildLabelQuery(payload, [goverCondition])
    const tableSql = Prisma.raw(`"vgabung"`)
    const items = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT "BUSINESS" FROM ${tableSql} ${where}`)
    const rows = buildBusinessCounts(items ?? [])

    const title =
      (payload?.judul_jumlah_report as string) ||
      (payload?.judul_report as string) ||
      (payload?.judul_label as string) ||
      "Report Jumlah Government"
    const reportDate = formatReportDate(new Date())
    const buffer = await buildReportJumlahDocx(rows, title, reportDate)

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    res.setHeader("Content-Disposition", 'attachment; filename="report-jumlah-government.docx"')
    return res.end(buffer)
  } catch (err: any) {
    return res.status(500).json(fail(err?.message || String(err)))
  }
}

export async function exportReportJumlahPerusahaanExcel(req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const goverField = Prisma.raw(`"GOVER"`)
    const nonGoverCondition = Prisma.sql`(${goverField} IS NULL OR ${goverField} <> 'X')`
    const { where } = buildLabelQuery(payload, [nonGoverCondition])
    const tableSql = Prisma.raw(`"GABUNG"`)
    const items = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT "BUSINESS" FROM ${tableSql} ${where}`)
    const rows = buildBusinessCounts(items ?? [])

    const buffer = await buildReportJumlahExcel(rows)
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", 'attachment; filename="report-jumlah-perusahaan.xlsx"')
    return res.end(buffer)
  } catch (err: any) {
    return res.status(500).json(fail(err?.message || String(err)))
  }
}

export async function exportReportJumlahGovernmentExcel(req: Request, res: Response) {
  try {
    const payload = req.body ?? {}
    const goverField = Prisma.raw(`"GOVER"`)
    const goverCondition = Prisma.sql`${goverField} = 'X'`
    const { where } = buildLabelQuery(payload, [goverCondition])
    const tableSql = Prisma.raw(`"vgabung"`)
    const items = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT "BUSINESS" FROM ${tableSql} ${where}`)
    const rows = buildBusinessCounts(items ?? [])

    const buffer = await buildReportJumlahExcel(rows)
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", 'attachment; filename="report-jumlah-government.xlsx"')
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
