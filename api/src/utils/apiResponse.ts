export function ok(res: any, data: any, meta: any = {}) {
  return res.status(200).json({ ok: true, data, meta })
}

export function fail(res: any, message: string, code = 400) {
  return res.status(code).json({ ok: false, message })
}
