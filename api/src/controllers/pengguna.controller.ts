import prisma from "../prisma"
import { ok, fail } from "../utils/apiResponse"

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
