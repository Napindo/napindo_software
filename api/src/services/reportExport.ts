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
import type { ReportRow } from "./reportRender"

type DocxAlignment = (typeof AlignmentType)[keyof typeof AlignmentType]

const RUN_FONT = "Arial Narrow"
const BASE_FONT_SIZE = 20
const HEADER_FONT_SIZE = 24
const PAGE_MARGIN_TWIP = 720
const COL_NO_TWIP = 700
const COL_COMPANY_TWIP = 3800
const COL_CONTACT_TWIP = 3000
const COL_BUSINESS_TWIP = 3000

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

const makeParagraph = (text: string, bold = false, alignment?: DocxAlignment) =>
  new Paragraph({
    alignment,
    spacing: { after: 0 },
    children: [makeTextRun(text, bold)],
  })

const makeCell = (lines: Array<{ text: string; bold?: boolean }>, width: number, align?: DocxAlignment) =>
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
            width: { size: COL_COMPANY_TWIP + COL_NO_TWIP, type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [new Paragraph({ spacing: { after: 80 }, children: [titleRun] })],
          }),
          new TableCell({
            width: { size: COL_CONTACT_TWIP + COL_BUSINESS_TWIP, type: WidthType.DXA },
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
      makeCell([{ text: "No", bold: true }], COL_NO_TWIP, AlignmentType.CENTER),
      makeCell([{ text: "Company", bold: true }], COL_COMPANY_TWIP),
      makeCell([{ text: "Contact Person", bold: true }], COL_CONTACT_TWIP),
      makeCell([{ text: "Business / Product", bold: true }], COL_BUSINESS_TWIP),
    ],
  })
}

function buildDataRow(row: ReportRow, index: number) {
  const companyLines = [
    { text: row.company || "-", bold: true },
    ...(row.address1 ? [{ text: row.address1 }] : []),
    ...(row.address2 ? [{ text: row.address2 }] : []),
    { text: `${row.city ?? ""}${row.zip ? ` ${row.zip}` : ""}`.trim() },
  ].filter((line) => line.text.trim() !== "")

  const contactLines = [
    {
      text: `${row.sex ? `${row.sex} ` : ""}${row.name ?? ""}`.trim(),
      bold: true,
    },
    ...(row.position ? [{ text: row.position }] : []),
    ...(row.phone ? [{ text: `Telp. ${row.phone}` }] : []),
    ...(row.facsimile ? [{ text: `Fax. ${row.facsimile}` }] : []),
  ].filter((line) => line.text.trim() !== "")

  const businessLines = [
    ...(row.business ? [{ text: row.business, bold: true }] : []),
    ...(row.email ? [{ text: row.email }] : []),
    ...(row.handphone ? [{ text: row.handphone }] : []),
    ...(row.lastupdate ? [{ text: row.lastupdate }] : []),
  ].filter((line) => line.text.trim() !== "")

  return new TableRow({
    children: [
      makeCell([{ text: String(index + 1) }], COL_NO_TWIP, AlignmentType.CENTER),
      makeCell(companyLines, COL_COMPANY_TWIP),
      makeCell(contactLines, COL_CONTACT_TWIP),
      makeCell(businessLines, COL_BUSINESS_TWIP),
    ],
  })
}

export async function buildReportDocx(rows: ReportRow[], title: string, reportDate: string) {
  const bodyTable = new Table({
    rows: [buildHeaderRow(), ...rows.map((row, index) => buildDataRow(row, index))],
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
