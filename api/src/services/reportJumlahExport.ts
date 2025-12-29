import ExcelJS from "exceljs"
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx"
import type { ReportJumlahRow } from "./reportJumlahRender"

const RUN_FONT = "Arial Narrow"
const BASE_FONT_SIZE = 20
const HEADER_FONT_SIZE = 24
const PAGE_MARGIN_TWIP = 720
const COL_BUSINESS_TWIP = 6000
const COL_COUNT_TWIP = 1500

const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
}

const makeTextRun = (text: string, bold = false) =>
  new TextRun({ text, size: BASE_FONT_SIZE, font: RUN_FONT, bold })

const makeParagraph = (text: string, bold = false, alignment?: AlignmentType) =>
  new Paragraph({
    alignment,
    spacing: { after: 0 },
    children: [makeTextRun(text, bold)],
  })

const makeCell = (lines: Array<{ text: string; bold?: boolean }>, width: number, align?: AlignmentType) =>
  new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: NO_BORDERS,
    children: lines.length
      ? lines.map((line) => makeParagraph(line.text, line.bold ?? false, align))
      : [makeParagraph("", false, align)],
  })

function buildHeaderTable(title: string, reportDate: string) {
  const titleRun = new TextRun({ text: title, size: HEADER_FONT_SIZE, font: RUN_FONT, bold: true })
  const dateRun = new TextRun({ text: reportDate, size: BASE_FONT_SIZE, font: RUN_FONT })

  return new Table({
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: COL_BUSINESS_TWIP, type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [new Paragraph({ spacing: { after: 80 }, children: [titleRun] })],
          }),
          new TableCell({
            width: { size: COL_COUNT_TWIP, type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 80 },
                children: [dateRun],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

function buildHeaderRow() {
  return new TableRow({
    children: [
      makeCell([{ text: "Business", bold: true }], COL_BUSINESS_TWIP),
      makeCell([{ text: "Jumlah", bold: true }], COL_COUNT_TWIP, AlignmentType.RIGHT),
    ],
  })
}

function buildDataRow(row: ReportJumlahRow) {
  return new TableRow({
    children: [
      makeCell([{ text: row.business || "-" }], COL_BUSINESS_TWIP),
      makeCell([{ text: String(row.count ?? 0) }], COL_COUNT_TWIP, AlignmentType.RIGHT),
    ],
  })
}

export async function buildReportJumlahDocx(rows: ReportJumlahRow[], title: string, reportDate: string) {
  const bodyTable = new Table({
    rows: [buildHeaderRow(), ...rows.map((row) => buildDataRow(row))],
    width: { size: 100, type: WidthType.PERCENTAGE },
  })

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: PAGE_MARGIN_TWIP,
              right: PAGE_MARGIN_TWIP,
              bottom: PAGE_MARGIN_TWIP,
              left: PAGE_MARGIN_TWIP,
            },
          },
        },
        children: [buildHeaderTable(title, reportDate), bodyTable],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return buffer
}

export async function buildReportJumlahExcel(rows: ReportJumlahRow[]) {
  const wb = new ExcelJS.Workbook()
  const sheet = wb.addWorksheet("Report")

  sheet.columns = [
    { header: "Business", key: "business", width: 40 },
    { header: "Jumlah", key: "count", width: 12 },
  ]

  rows.forEach((row) => {
    sheet.addRow({
      business: row.business,
      count: row.count,
    })
  })

  sheet.getRow(1).font = { bold: true }

  const buffer = await wb.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
