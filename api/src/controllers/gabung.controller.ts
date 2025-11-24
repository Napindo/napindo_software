import prisma from "../prisma"
import { ok, fail } from "../utils/apiResponse"

export async function listGabung(req, res) {
  try {
    const page = Number(req.query.page || 1)
    const limit = Number(req.query.limit || 20)
    const skip = (page - 1) * limit
    const q = req.query.q || ""

    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { company: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}

    const [items, total] = await Promise.all([
      prisma.gabung.findMany({ where, skip, take: limit }),
      prisma.gabung.count({ where }),
    ])

    return ok(res, items, { total, page, limit })
  } catch (err) {
    return fail(res, err.message)
  }
}

export async function getGabung(req, res) {
  try {
    const id = Number(req.params.id)
    const item = await prisma.gabung.findUnique({
      where: { nourut: id },
    })
    if (!item) return fail(res, "Data tidak ditemukan", 404)

    return ok(res, item)
  } catch (err) {
    return fail(res, err.message)
  }
}

export async function createGabung(req, res) {
  try {
    const item = await prisma.gabung.create({
      data: req.body,
    })
    return ok(res, item)
  } catch (err) {
    return fail(res, err.message)
  }
}

export async function updateGabung(req, res) {
  try {
    const id = Number(req.params.id)
    const item = await prisma.gabung.update({
      where: { nourut: id },
      data: req.body,
    })
    return ok(res, item)
  } catch (err) {
    return fail(res, err.message)
  }
}

export async function deleteGabung(req, res) {
  try {
    const id = Number(req.params.id)
    await prisma.gabung.delete({ where: { nourut: id } })
    return ok(res, true)
  } catch (err) {
    return fail(res, err.message)
  }
}
