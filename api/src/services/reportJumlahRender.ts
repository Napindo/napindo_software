import { renderWithJsreport } from "./jsreport"
import { REPORT_JUMLAH_TEMPLATE_NAME, reportJumlahHtml } from "../templates/reportJumlah"

export type ReportJumlahRow = {
  business: string
  count: number
}

export type ReportJumlahData = {
  title: string
  reportDate: string
  totalCount: number
  rows: ReportJumlahRow[]
}

export async function renderReportJumlahPdf(data: ReportJumlahData) {
  const response = await renderWithJsreport({
    template: {
      name: REPORT_JUMLAH_TEMPLATE_NAME,
      content: reportJumlahHtml,
      engine: "handlebars",
      recipe: "chrome-pdf",
      chrome: {
        format: "A4",
        marginTop: "0cm",
        marginRight: "0cm",
        marginBottom: "0cm",
        marginLeft: "0cm",
      },
    },
    data,
  })

  return response
}
