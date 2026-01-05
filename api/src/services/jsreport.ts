import fetch from "node-fetch"

function getAuthHeader(): Record<string, string> {
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
    process.env.JSREPORT_PORT ||
    ""

  if (envUrl) {
    // Jika hanya port yang diberikan, lengkapi jadi http://192.168.1.86:<port>
    if (/^\d+$/.test(envUrl.trim())) return `http://192.168.1.86:${envUrl.trim()}`
    return envUrl
  }

  // Default to IPv4 to avoid ::1 resolution issues (JSReport running on 9133 per setup)
  return "http://192.168.1.86:9133"
}

export async function renderWithJsreport(body: any) {
  const baseUrl = resolveBaseUrl()
  const url = `${baseUrl.replace(/\/$/, "")}/api/report`

  const authHeader = getAuthHeader()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeader,
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `jsreport error: ${response.status}`)
  }

  return response
}
