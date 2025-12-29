import { renderWithJsreport } from "./jsreport"
import {
  REPORT_TEMPLATE_NAME,
  reportPerusahaanHelpers,
  reportPerusahaanHtml,
} from "../templates/reportPerusahaan"

export type ReportRow = {
  company: string
  address1?: string
  address2?: string
  city?: string
  zip?: string
  sex?: string
  name?: string
  position?: string
  phone?: string
  facsimile?: string
  business?: string
  email?: string
  handphone?: string
  lastupdate?: string
}

export type ReportData = {
  title: string
  reportDate: string
  totalCount: number
  rows: ReportRow[]
}

export async function renderReportPdf(data: ReportData) {
  const response = await renderWithJsreport({
    template: {
      name: REPORT_TEMPLATE_NAME,
      content: reportPerusahaanHtml,
      engine: "handlebars",
      recipe: "chrome-pdf",
      helpers: reportPerusahaanHelpers,
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
