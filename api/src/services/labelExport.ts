import ExcelJS from "exceljs"
import {
  AlignmentType,
  Document,
  HeightRule,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx"
import type { LabelRow } from "./labelRender"

const mmToTwip = (mm: number) => Math.round(mm * 56.7) // 1 mm ≈ 56.7 twips

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

  // Auto header styling
  sheet.getRow(1).font = { bold: true }

  const buffer = await wb.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

export async function buildLabelDocx(rows: LabelRow[], title: string) {
  const labelWidthMm = 75
  const labelHeightMm = 38
  const gapColMm = 22

  const labelWidthTwip = mmToTwip(labelWidthMm)
  const tableWidthTwip = labelWidthTwip * 2 + mmToTwip(gapColMm)

  const pageMarginTop = mmToTwip(10)
  const pageMarginRight = mmToTwip(14)
  const pageMarginBottom = mmToTwip(16)
  const pageMarginLeft = mmToTwip(16)

  // Group rows into pairs for table rows
  const paired: Array<[LabelRow | undefined, LabelRow | undefined]> = []
  for (let i = 0; i < rows.length; i += 2) {
    paired.push([rows[i], rows[i + 1]])
  }

  const makeLabelParas = (row: LabelRow | undefined, idx: number) => {
    if (!row) return [new Paragraph("")]
    const paras: Paragraph[] = []

    const nameText = `${row.sex ? `${row.sex} ` : ""}${row.contactName ?? ""}`
    paras.push(
      new Paragraph({
        children: [new TextRun({ text: nameText, bold: true, size: 17 })], // ~8.5pt
        spacing: { after: 40 },
      }),
    )

    if (row.position) {
      paras.push(
        new Paragraph({
          children: [new TextRun({ text: row.position, bold: true, size: 16 })], // ~8pt
          spacing: { after: 30 },
        }),
      )
    }

    if (row.companyName) {
      paras.push(new Paragraph({ children: [new TextRun({ text: row.companyName, size: 15 })], spacing: { after: 20 } }))
    }
    if (row.addressLine1) {
      paras.push(new Paragraph({ children: [new TextRun({ text: row.addressLine1, size: 15 })], spacing: { after: 20 } }))
    }
    if (row.addressLine2) {
      paras.push(new Paragraph({ children: [new TextRun({ text: row.addressLine2, size: 15 })], spacing: { after: 20 } }))
    }

    const cityZip = `${row.city ?? ""}${row.postcode ? ` ${row.postcode}` : ""}`.trim()
    if (cityZip) {
      paras.push(new Paragraph({ children: [new TextRun({ text: cityZip, size: 15 })], spacing: { after: 20 } }))
    }
    if (row.province) {
      paras.push(new Paragraph({ children: [new TextRun({ text: row.province, size: 15 })], spacing: { after: 20 } }))
    }
    if (row.country) {
      paras.push(new Paragraph({ children: [new TextRun({ text: row.country, size: 15 })], spacing: { after: 20 } }))
    }

    // Badge on bottom-right (simulated by right-aligned paragraph)
    paras.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: `${title} ${idx + 1}`, size: 15 })],
        spacing: { before: 80, after: 0 },
      }),
    )

    return paras
  }

  const tableRows = paired.map((pair, pairIndex) => {
    const [left, right] = pair
    const baseIndex = pairIndex * 2
    return new TableRow({
      children: [
        new TableCell({
          width: { size: labelWidthTwip, type: WidthType.DXA },
          children: makeLabelParas(left, baseIndex),
          margins: { top: mmToTwip(2), bottom: mmToTwip(2), left: mmToTwip(2), right: mmToTwip(2) },
          height: { value: labelHeightMm * 56.7, rule: HeightRule.EXACT },
        }),
        new TableCell({
          width: { size: labelWidthTwip, type: WidthType.DXA },
          children: makeLabelParas(right, baseIndex + 1),
          margins: { top: mmToTwip(2), bottom: mmToTwip(2), left: mmToTwip(2), right: mmToTwip(2) },
          height: { value: labelHeightMm * 56.7, rule: HeightRule.EXACT },
        }),
      ],
    })
  })

  const table = new Table({
    width: { size: tableWidthTwip, type: WidthType.DXA },
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
        children: [
          table,
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return buffer
}
