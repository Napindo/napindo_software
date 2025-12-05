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
}

export type LabelReportData = {
  title: string
  totalCount: number
  rows: LabelRow[]
}

export async function renderLabelPerusahaanPdf(data: LabelReportData) {
  // Inline template so it works even if not pre-created in Studio.
  const response = await renderWithJsreport({
    template: {
      name: PRINT_LABEL_TEMPLATE_NAME,
      content: printLabelPerusahaanHtml,
      engine: "handlebars",
      recipe: "chrome-pdf",
      helpers: printLabelPerusahaanHelpers,
    },
    data,
  })

  return response
}
