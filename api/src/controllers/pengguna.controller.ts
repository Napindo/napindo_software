import prisma from "../prisma"
import { ok, fail } from "../utils/apiResponse"

const normalize = (value?: string | null) => value?.trim() ?? ""

export async function listPengguna(req, res) {
  try {
    const items = await prisma.pengguna.findMany()
    return ok(res, items)
  } catch (err) {
    return fail(res, err.message)
  }
}

export async function getPengguna(req, res) {
  try {
    const username = req.params.username
    const item = await prisma.pengguna.findUnique({
      where: { username },
    })
    if (!item) return fail(res, "User tidak ditemukan", 404)

    return ok(res, item)
  } catch (err) {
    return fail(res, err.message)
  }
}

export async function createPengguna(req, res) {
  try {
    const item = await prisma.pengguna.create({
      data: req.body,
    })
    return ok(res, item)
  } catch (err) {
    return fail(res, err.message)
  }
}

export async function updatePengguna(req, res) {
  try {
    const username = req.params.username
    const item = await prisma.pengguna.update({
      where: { username },
      data: req.body,
    })
    return ok(res, item)
  } catch (err) {
    return fail(res, err.message)
  }
}

export async function deletePengguna(req, res) {
  try {
    const username = req.params.username
    await prisma.pengguna.delete({ where: { username } })
    return ok(res, true)
  } catch (err) {
    return fail(res, err.message)
  }
}

export async function loginPengguna(req, res) {
  try {
    const username = normalize(req.body?.username)
    const password = normalize(req.body?.password)
    const division = normalize(req.body?.division)

    if (!username || !password) {
      return fail(res, "Username dan password wajib diisi", 400)
    }

    const user = await prisma.pengguna.findUnique({
      where: { username },
    })

    if (!user) {
      return fail(res, "Username atau password salah", 401)
    }

    const storedDivision = normalize(user.division)
    const isDivisionMatch = !division || !storedDivision || storedDivision.toLowerCase() === division.toLowerCase()

    if (normalize(user.password) !== password || !isDivisionMatch) {
      return fail(res, "Username, password, atau divisi tidak cocok.", 401)
    }

    return ok(res, {
      username: user.username,
      division: user.division,
      name: user.username,
    })
  } catch (err) {
    return fail(res, err.message)
  }
}

export async function userHints(req, res) {
  try {
    const rows = await prisma.pengguna.findMany({
      select: { username: true, division: true },
      orderBy: { username: "asc" },
    })

    const usernames = Array.from(new Set(rows.map((row) => normalize(row.username)).filter(Boolean)))
    const divisions = Array.from(new Set(rows.map((row) => normalize(row.division)).filter(Boolean)))

    return ok(res, { usernames, divisions })
  } catch (err) {
    return fail(res, err.message)
  }
}
