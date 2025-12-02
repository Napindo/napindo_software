import type { Request, Response } from "express";
import prisma from "../prisma";
import { ok, fail } from "../utils/apiResponse";
import { buildSegmentWhere, SegmentCode } from "../services/gabungSegments";

// ===================== LIST GABUNG (dengan pencarian & paging) =====================

export async function listGabung(req: Request, res: Response) {
  try {
    const { q, page = "1", pageSize = "50" } = req.query;

    const pageNum = Number(page) || 1;
    const sizeNum = Number(pageSize) || 50;
    const skip = (pageNum - 1) * sizeNum;
    const take = sizeNum;

    const where: any = {};

    if (q) {
      const keyword = String(q);
      where.OR = [
        { company: { contains: keyword, mode: "insensitive" } },
        { name: { contains: keyword, mode: "insensitive" } },
        { city: { contains: keyword, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.gabung.findMany({
        where,
        orderBy: { company: "asc" },
        skip,
        take,
      }),
      prisma.gabung.count({ where }),
    ]);

    return res.json(
      ok({
        items,
        pagination: {
          page: pageNum,
          pageSize: sizeNum,
          total,
        },
      }),
    );
  } catch (err: any) {
    return res.status(500).json(fail(err.message || String(err)));
  }
}

// ===================== GET DETAIL BY ID (opsional, kalau route-nya ada) =====================

export async function getGabung(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json(fail("ID tidak valid"));
    }

    const item = await prisma.gabung.findUnique({
      where: { nourut: id },
    });

    if (!item) {
      return res.status(404).json(fail("Data tidak ditemukan"));
    }

    return res.json(ok(item));
  } catch (err: any) {
    return res.status(500).json(fail(err.message || String(err)));
  }
}

// ===================== CREATE =====================

export async function createGabung(req: Request, res: Response) {
  try {
    const data: any = { ...req.body };

    // pastikan tidak override PK
    delete data.nourut;
    delete data.NOURUT;

    if (data.lastupdate) {
      data.lastupdate = new Date(data.lastupdate);
    }

    const item = await prisma.gabung.create({ data });
    return res.status(201).json(ok(item));
  } catch (err: any) {
    return res.status(500).json(fail(err.message || String(err)));
  }
}

// ===================== UPDATE =====================

export async function updateGabung(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json(fail("ID tidak valid"));
    }

    const data: any = { ...req.body };
    delete data.nourut;
    delete data.NOURUT;

    if (data.lastupdate) {
      data.lastupdate = new Date(data.lastupdate);
    }

    const item = await prisma.gabung.update({
      where: { nourut: id },
      data,
    });

    return res.json(ok(item));
  } catch (err: any) {
    return res.status(500).json(fail(err.message || String(err)));
  }
}

// ===================== DELETE =====================

export async function deleteGabung(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json(fail("ID tidak valid"));
    }

    await prisma.gabung.delete({ where: { nourut: id } });

    return res.json(ok(true));
  } catch (err: any) {
    return res.status(500).json(fail(err.message || String(err)));
  }
}

// ===================== LIST BY SEGMENT (DEFENCE / AEROSPACE / MARINE) =====================

export async function listGabungBySegment(req: Request, res: Response) {
  try {
    const segment = req.params.segment as SegmentCode;
    const limit = Number(req.query.limit || 200);

    const personParam = String(req.query.person || "exhibitor").toLowerCase();
    const person = personParam === "visitor" ? "visitor" : "exhibitor";

    const where = buildSegmentWhere(segment, person);

    const items = await prisma.gabung.findMany({
      where,
      take: limit,
    });

    return res.json(ok({ items, segment, limit, person }));
  } catch (err: any) {
    return res.status(500).json(fail(err.message || String(err)));
  }
}

// ===================== TABLE PREVIEW (GABUNG / PENGGUNA) =====================

export async function getTablePreview(req: Request, res: Response) {
  try {
    const { name } = req.params;
    const limit = Number(req.query.limit || 10);
    const tableName = String(name || "").toLowerCase();

    if (tableName === "gabung") {
      const rows = await prisma.gabung.findMany({
        take: limit,
        orderBy: { nourut: "desc" },
      });
      return res.json(ok({ table: "GABUNG", rows, limit }));
    }

    if (tableName === "pengguna") {
      const rows = await prisma.pengguna.findMany({
        take: limit,
        orderBy: { username: "asc" },
      });
      return res.json(ok({ table: "PENGGUNA", rows, limit }));
    }

    return res
      .status(400)
      .json(fail("Unknown table name (hanya 'gabung' atau 'pengguna')"));
  } catch (err: any) {
    return res.status(500).json(fail(err.message || String(err)));
  }
}

// ===================== CARI BERDASARKAN COMPANY (LIKE) =====================

export async function findGabungByCompany(req: Request, res: Response) {
  try {
    const { company } = req.params;

    const items = await prisma.gabung.findMany({
      where: {
        company: {
          contains: company,
          mode: "insensitive",
        },
      },
      orderBy: { company: "asc" },
    });

    return res.json(ok({ items }));
  } catch (err: any) {
    return res.status(500).json(fail(err.message || String(err)));
  }
}
