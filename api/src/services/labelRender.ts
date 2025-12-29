import { renderWithJsreport } from "./jsreport"
import {
  printLabelPerusahaanHelpers,
  printLabelPerusahaanHtml,
  PRINT_LABEL_TEMPLATE_NAME,
} from "../templates/printLabelPerusahaan"

export type LabelRow = {
  companyName: string
  contactName: string
  position?: string
  addressLine1: string
  addressLine2?: string
  city?: string
  province?: string
  country?: string
  postcode?: string
  sex?: string
  nourut?: string | number
  phone?: string
  handphone?: string
  email?: string
  mainActivity?: string
  business?: string
}

export type LabelReportData = {
  title: string
  totalCount: number
  rows: LabelRow[]
}

export async function renderLabelPerusahaanPdf(data: LabelReportData) {
  // Render inline untuk memastikan selalu konsisten tanpa mengandalkan template yang tersimpan di server.
  const response = await renderWithJsreport({
    template: {
      name: PRINT_LABEL_TEMPLATE_NAME,
      content: printLabelPerusahaanHtml,
      engine: "handlebars",
      recipe: "chrome-pdf",
      helpers: printLabelPerusahaanHelpers,
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
