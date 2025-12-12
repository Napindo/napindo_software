import ExcelJS from "exceljs"
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx"
import type { LabelRow } from "./labelRender"

// Convert millimeters to twips (1 mm is roughly 56.7 twips)
const mmToTwip = (mm: number) => Math.round(mm * 56.7)
const RUN_FONT = "Arial Narrow"
const LABEL_WIDTH_MM = 75
const LABEL_HEIGHT_MM = 38
const COLUMN_GAP_MM = 2 // 0.2 cm
const ROW_GAP_MM = 2 // 0.2 cm
const BADGE_ROW_HEIGHT = mmToTwip(6)

const BORDER_NONE = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
}

// Padding dalam label (selaras dengan HTML: padding 2mm, margin-top 5mm ditiru dengan margin atas sel)
const LABEL_INNER_MARGINS = {
  top: mmToTwip(4),
  bottom: mmToTwip(4),
  left: mmToTwip(4),
  right: mmToTwip(4),
}

export async function buildLabelExcel(rows: LabelRow[]) {
  const wb = new ExcelJS.Workbook()
  const sheet = wb.addWorksheet("Labels")

  sheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Name", key: "contactName", width: 28 },
    { header: "Sex", key: "sex", width: 6 },
    { header: "Position", key: "position", width: 18 },
    { header: "Company", key: "companyName", width: 30 },
    { header: "Address 1", key: "addressLine1", width: 32 },
    { header: "Address 2", key: "addressLine2", width: 28 },
    { header: "City", key: "city", width: 16 },
    { header: "Province", key: "province", width: 16 },
    { header: "Country", key: "country", width: 16 },
    { header: "Postcode", key: "postcode", width: 12 },
  ]

  rows.forEach((row, idx) => {
    sheet.addRow({
      no: idx + 1,
      ...row,
    })
  })

  sheet.getRow(1).font = { bold: true }

  const buffer = await wb.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

export async function buildLabelDocx(rows: LabelRow[], title: string) {
  const labelWidthTwip = mmToTwip(LABEL_WIDTH_MM)
  const labelHeightTwip = mmToTwip(LABEL_HEIGHT_MM)
  const gapColTwip = mmToTwip(COLUMN_GAP_MM)
  const gapRowTwip = mmToTwip(ROW_GAP_MM)
  const tableWidthTwip = labelWidthTwip * 2 + gapColTwip

  // Margins mengikuti HTML (.page padding): Top 0.4 cm, Right 0.15 cm, Bottom 3 cm, Left 1.32 cm
  const pageMarginTop = mmToTwip(4)
  const pageMarginRight = mmToTwip(1.5)
  const pageMarginBottom = mmToTwip(30)
  const pageMarginLeft = mmToTwip(13.2)

  const grouped: Array<[LabelRow | undefined, LabelRow | undefined]> = []
  for (let i = 0; i < rows.length; i += 2) {
    grouped.push([rows[i], rows[i + 1]])
  }

  const makeLabelContent = (row: LabelRow | undefined, idx: number) => {
    if (!row) return { body: [new Paragraph("")], badge: new Paragraph("") }
    const body: Paragraph[] = []

    body.push(
      new Paragraph({
        children: [new TextRun({ text: "Kepada Yth.", size: 18, bold: true, font: RUN_FONT })], // 9pt
        spacing: { after: mmToTwip(0.6) },
      }),
    )

    const nameText = `${row.sex ? `${row.sex} ` : ""}${row.contactName ?? ""}`.trim()
    body.push(
      new Paragraph({
        children: [new TextRun({ text: nameText, size: 18, bold: true, font: RUN_FONT })], // 9pt
        spacing: { after: mmToTwip(0.6) },
      }),
    )

    if (row.position) {
      body.push(
        new Paragraph({
          children: [new TextRun({ text: row.position, size: 18, bold: true, italics: true, font: RUN_FONT })],
          spacing: { after: mmToTwip(0.6) },
        }),
      )
    }

    if (row.companyName) {
      body.push(
        new Paragraph({
          children: [new TextRun({ text: row.companyName, size: 16, font: RUN_FONT, bold: true })], // 8pt
          spacing: { after: mmToTwip(0.6) },
        }),
      )
    }

    if (row.addressLine1) {
      body.push(
        new Paragraph({
          children: [new TextRun({ text: row.addressLine1, size: 18, font: RUN_FONT })],
          spacing: { after: mmToTwip(0.6) },
        }),
      )
    }
    if (row.addressLine2) {
      body.push(
        new Paragraph({
          children: [new TextRun({ text: row.addressLine2, size: 18, font: RUN_FONT })],
          spacing: { after: mmToTwip(0.6) },
        }),
      )
    }

    const cityZip = `${row.city ?? ""}${row.postcode ? ` ${row.postcode}` : ""}`.trim()
    if (cityZip) {
      body.push(
        new Paragraph({
          children: [new TextRun({ text: cityZip, size: 18, font: RUN_FONT })],
          spacing: { after: mmToTwip(0.6) },
        }),
      )
    }

    const badge = new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: `${title}${idx + 1}`, size: 16, font: RUN_FONT })], // 8pt
      spacing: { before: mmToTwip(2), after: mmToTwip(2) },
    })

    return { body, badge }
  }

  const buildLabelCell = (row: LabelRow | undefined, idx: number) => {
    const { body, badge } = makeLabelContent(row, idx)

    const innerTable = new Table({
      width: { size: labelWidthTwip, type: WidthType.DXA },
      columnWidths: [labelWidthTwip],
      borders: BORDER_NONE,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: body,
              margins: LABEL_INNER_MARGINS,
              verticalAlign: VerticalAlign.TOP,
            }),
          ],
        }),
        new TableRow({
          height: { value: BADGE_ROW_HEIGHT, rule: HeightRule.ATLEAST },
          children: [
            new TableCell({
              children: [badge],
              margins: LABEL_INNER_MARGINS,
              verticalAlign: VerticalAlign.BOTTOM,
            }),
          ],
        }),
      ],
      layout: "fixed",
    })

    return new TableCell({
      width: { size: labelWidthTwip, type: WidthType.DXA },
      children: [innerTable],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      verticalAlign: VerticalAlign.TOP,
    })
  }

  const makeSpacerCell = (widthTwip: number) =>
    new TableCell({
      width: { size: widthTwip, type: WidthType.DXA },
      children: [new Paragraph("")],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    })

  const tableRows: TableRow[] = []
  grouped.forEach((pair, pairIndex) => {
    const [c1, c2] = pair
    const baseIndex = pairIndex * 2
    tableRows.push(
      new TableRow({
        height: { value: labelHeightTwip, rule: HeightRule.EXACT },
        children: [buildLabelCell(c1, baseIndex), makeSpacerCell(gapColTwip), buildLabelCell(c2, baseIndex + 1)],
      }),
    )

    if (pairIndex < grouped.length - 1) {
      tableRows.push(
        new TableRow({
          height: { value: gapRowTwip, rule: HeightRule.EXACT },
          children: [makeSpacerCell(labelWidthTwip), makeSpacerCell(gapColTwip), makeSpacerCell(labelWidthTwip)],
        }),
      )
    }
  })

  const table = new Table({
    width: { size: tableWidthTwip, type: WidthType.DXA },
    columnWidths: [labelWidthTwip, gapColTwip, labelWidthTwip],
    alignment: AlignmentType.CENTER,
    borders: BORDER_NONE,
    rows: tableRows,
    layout: "fixed",
  })

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: pageMarginTop,
              right: pageMarginRight,
              bottom: pageMarginBottom,
              left: pageMarginLeft,
            },
          },
        },
        children: [table],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return buffer
}
