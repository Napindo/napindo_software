export function ok(res: any, data: any, meta: any = {}) {
  // Include both `success` and `ok` flags so old clients keep working while new ones rely on `success`.
  return res.status(200).json({ success: true, ok: true, data, meta })
}

export function fail(res: any, message: string, code = 400) {
  return res.status(code).json({ success: false, ok: false, message })
}
