import ExcelJS from "exceljs"
import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx"
import type { LabelRow } from "./labelRender"

// Convert millimeters to twips (1 mm is roughly 56.7 twips)
const mmToTwip = (mm: number) => Math.round(mm * 56.7)
const RUN_FONT = "Arial Narrow"
const LABEL_WIDTH_MM = 75
const LABEL_HEIGHT_MM = 38
const COLUMN_GAP_MM = 7
const ROW_GAP_MM = 5
const LABEL_PADDING_TWIP = mmToTwip(2) 
const LABEL_MARGIN_TOP_TWIP = mmToTwip(5) 
const PARAGRAPH_MARGIN_TWIP = mmToTwip(1) 
const LINE_GAP_TWIP = mmToTwip(0.2)
const LINE_HEIGHT_TWIP = mmToTwip(3.6)

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

  // Margins mengikuti HTML (.page padding): Top 0.4 cm, Right 0.15 cm, Bottom 3 cm, Left 1.32 cm
  const pageMarginTop = mmToTwip(4)
  const pageMarginRight = mmToTwip(1.5)
  const pageMarginBottom = mmToTwip(30)
  const pageMarginLeft = mmToTwip(11.2)

  const paragraphs: Paragraph[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const colIndex = i % 2
    const rowIndex = Math.floor(i / 2)

    // Koordinat pojok kiri atas label (relatif margin halaman)
    const baseX = pageMarginLeft + colIndex * (labelWidthTwip + gapColTwip)
    const baseY = pageMarginTop + rowIndex * (labelHeightTwip + gapRowTwip)

    // Posisi awal teks di dalam label (ikut margin/padding HTML)
    const startX = baseX + LABEL_PADDING_TWIP
    let cursorY = baseY + LABEL_MARGIN_TOP_TWIP

    const pushLine = (text: string, size: number, bold = false, italics = false) => {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text, size, font: RUN_FONT, bold, italics })],
          spacing: { after: 0 },
          frame: {
            type: "absolute",
            position: { x: startX, y: cursorY },
            width: labelWidthTwip - LABEL_PADDING_TWIP * 2,
            height: LINE_HEIGHT_TWIP,
            anchor: { horizontal: "margin", vertical: "margin" },
            wrap: "none",
          } as any,
        }),
      )
      cursorY += LINE_HEIGHT_TWIP + LINE_GAP_TWIP + PARAGRAPH_MARGIN_TWIP
    }

    pushLine("Kepada Yth.", 18, true)

    const nameText = `${row.sex ? `${row.sex} ` : ""}${row.contactName ?? ""}`.trim()
    pushLine(nameText, 18, true)

    if (row.position) {
      pushLine(row.position, 18, true, true)
    }

    if (row.companyName) {
      pushLine(row.companyName, 16, true)
    }

    if (row.addressLine1) {
      pushLine(row.addressLine1, 18)
    }
    if (row.addressLine2) {
      pushLine(row.addressLine2, 18)
    }

    const cityZip = `${row.city ?? ""}${row.postcode ? ` ${row.postcode}` : ""}`.trim()
    if (cityZip) {
      pushLine(cityZip, 18)
    }

    // Badge absolut di pojok kanan bawah label
    const badgeY = baseY + labelHeightTwip - mmToTwip(6) // 1mm dari bawah, tinggi badge ~5mm
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: `${title}.${i + 1}`, size: 16, font: RUN_FONT })],
        spacing: { after: 0 },
        frame: {
          type: "absolute",
          position: { x: startX, y: badgeY },
          width: labelWidthTwip - LABEL_PADDING_TWIP * 2,
          height: LINE_HEIGHT_TWIP,
          anchor: { horizontal: "margin", vertical: "margin" },
          wrap: "none",
        } as any,
      }),
    )
  }

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
        children: paragraphs,
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return buffer
}
