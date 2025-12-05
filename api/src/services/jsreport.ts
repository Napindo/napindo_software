import fetch from "node-fetch"

function getAuthHeader() {
  const user = process.env.JSREPORT_USER || process.env.JSREPORT_USERNAME || ""
  const pass = process.env.JSREPORT_PASSWORD || process.env.JSREPORT_PASS || ""
  if (!user && !pass) return {}
  const token = Buffer.from(`${user}:${pass}`).toString("base64")
  return { Authorization: `Basic ${token}` }
}

function resolveBaseUrl() {
  const envUrl =
    process.env.JSREPORT_URL ||
    process.env.JSREPORT_BASE_URL ||
    process.env.JSREPORT_HOST ||
    ""

  if (envUrl) return envUrl

  // Default to IPv4 to avoid ::1 resolution issues
  return "http://127.0.0.1:5488"
}

export async function renderWithJsreport(body: any) {
  const baseUrl = resolveBaseUrl()
  const url = `${baseUrl.replace(/\/$/, "")}/api/report`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `jsreport error: ${response.status}`)
  }

  return response
}
