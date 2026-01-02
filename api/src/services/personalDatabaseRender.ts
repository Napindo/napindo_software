import { renderWithJsreport } from "./jsreport"
import { PERSONAL_DATABASE_TEMPLATE_NAME, personalDatabaseHtml } from "../templates/personalDatabase"

type PersonalRow = {
  label: string
  value: string
}

export type PersonalDatabaseData = {
  title: string
  rows: PersonalRow[]
}

export async function renderPersonalDatabasePdf(data: PersonalDatabaseData) {
  const response = await renderWithJsreport({
    template: {
      name: PERSONAL_DATABASE_TEMPLATE_NAME,
      content: personalDatabaseHtml,
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
