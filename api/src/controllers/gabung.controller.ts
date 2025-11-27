import { Request, Response } from "express"
import prisma from "../prisma"
import { ok, fail } from "../utils/apiResponse"
import { Prisma } from "@prisma/client"

const segmentFilters: Record<"defence" | "aerospace" | "marine", any> = {
  defence: { exhdefence: { not: null } },
  aerospace: { exhaero: { not: null } },
  marine: { exhmarine: { not: null } },
}

export async function listGabung(req: Request, res: Response) {
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
    return fail(res, err instanceof Error ? err.message : String(err))
  }
}

export async function getGabung(req: Request, res: Response) {
  try {
    const id = Number(req.params.id)
    const item = await prisma.gabung.findUnique({
      where: { nourut: id },
    })
    if (!item) return fail(res, "Data tidak ditemukan", 404)

    return ok(res, item)
  } catch (err) {
    return fail(res, err instanceof Error ? err.message : String(err))
  }
}

export async function createGabung(req: Request, res: Response) {
  const data = { ...req.body }
  delete (data as any).nourut
  delete (data as any).NOURUT

  if (data.lastupdate) {
    data.lastupdate = new Date(data.lastupdate)
  }

  try {
    const item = await prisma.gabung.create({
      data,
    })
    return ok(res, item)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && Array.isArray(err.meta?.target) && err.meta?.target.includes("NOURUT")) {
      const max = await prisma.gabung.aggregate({ _max: { nourut: true } })
      const next = (max._max.nourut ?? 0) + 1
      try {
        const retry = await prisma.gabung.create({ data: { ...data, nourut: next } })
        return ok(res, retry)
      } catch (retryErr) {
        return fail(res, retryErr instanceof Error ? retryErr.message : String(retryErr))
      }
    }
    return fail(res, err instanceof Error ? err.message : String(err))
  }
}

export async function updateGabung(req: Request, res: Response) {
  try {
    const id = Number(req.params.id)
    const item = await prisma.gabung.update({
      where: { nourut: id },
      data: req.body,
    })
    return ok(res, item)
  } catch (err) {
    return fail(res, err instanceof Error ? err.message : String(err))
  }
}

export async function deleteGabung(req: Request, res: Response) {
  try {
    const id = Number(req.params.id)
    await prisma.gabung.delete({ where: { nourut: id } })
    return ok(res, true)
  } catch (err) {
    return fail(res, err instanceof Error ? err.message : String(err))
  }
}

export async function listGabungBySegment(req: Request, res: Response) {
  try {
    const segment = req.params.segment as "defence" | "aerospace" | "marine"
    const limit = Number(req.query.limit || 200)
    const where = segmentFilters[segment] || {}

    const items = await prisma.gabung.findMany({
      where,
      take: limit,
    })

    return ok(res, items, { segment, limit })
  } catch (err) {
    return fail(res, err instanceof Error ? err.message : String(err))
  }
}

export async function getTablePreview(req: Request, res: Response) {
  try {
    const tableName = String(req.params.name || "").toLowerCase()
    const limit = Number(req.query.limit || 10)

    if (tableName === "gabung") {
      const rows = await prisma.gabung.findMany({ take: limit })
      return ok(res, rows, { table: tableName, limit })
    }

    if (tableName === "pengguna") {
      const rows = await prisma.pengguna.findMany({
        take: limit,
        select: { username: true, division: true, status: true },
      })
      return ok(res, rows, { table: tableName, limit })
    }

    return fail(res, "Tabel tidak dikenal atau belum didukung", 400)
  } catch (err) {
    return fail(res, err instanceof Error ? err.message : String(err))
  }
}
