import type { Request, Response } from "express";
import prisma from "../prisma";
import { ok, fail } from "../utils/apiResponse";
import { writeAuditLog } from "../services/auditLog";
import { validateDivision, validatePassword, validateUsername } from "../utils/validation";

/**
 * GET /pengguna
 * Optional query: q (search by username or division)
 */
export async function listPengguna(req: Request, res: Response) {
  try {
    const { q, page = "1", pageSize = "200" } = req.query;

    const pageNum = Number(page) || 1;
    const sizeNum = Number(pageSize) || 200;
    const skip = (pageNum - 1) * sizeNum;
    const take = sizeNum;

    const where: any = {};

    if (q) {
      const keyword = String(q);
      where.OR = [
        { username: { contains: keyword, mode: "insensitive" } },
        { division: { contains: keyword, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.pengguna.findMany({
        where,
        orderBy: { username: "asc" },
        skip,
        take,
        select: { username: true, division: true, status: true },
      }),
      prisma.pengguna.count({ where }),
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
    return res.status(500).json(fail(err.message));
  }
}

/**
 * GET /pengguna/:username
 */
export async function getPenggunaByUsername(req: Request, res: Response) {
  try {
    const { username } = req.params;

    const user = await prisma.pengguna.findUnique({
      where: { username },
      select: { username: true, division: true, status: true },
    });

    if (!user) {
      return res.status(404).json(fail("User tidak ditemukan"));
    }

    return res.json(ok(user));
  } catch (err: any) {
    return res.status(500).json(fail(err.message));
  }
}

/**
 * POST /pengguna
 * body: { username, password, division?, status? }
 */
export async function createPengguna(req: Request, res: Response) {
  try {
    const { username, password, division, status } = req.body;

    const usernameError = validateUsername(username);
    if (usernameError) return res.status(400).json(fail(usernameError));
    const passwordError = validatePassword(password, { min: 4 });
    if (passwordError) return res.status(400).json(fail(passwordError));
    const divisionError = validateDivision(division);
    if (divisionError) return res.status(400).json(fail(divisionError));

    const existing = await prisma.pengguna.findUnique({
      where: { username: String(username) },
    });

    if (existing) {
      return res.status(409).json(fail("username sudah digunakan"));
    }

    const user = await prisma.pengguna.create({
      data: {
        username: String(username),
        password: String(password),
        division: division ? String(division) : null,
        status: status ?? null,
      },
    });

    return res.status(201).json(ok(user, "User berhasil dibuat"));
  } catch (err: any) {
    return res.status(500).json(fail(err.message));
  }
}

/**
 * PUT /pengguna/:username
 * body: { password?, division?, status? }
 */
export async function updatePengguna(req: Request, res: Response) {
  try {
    const { username } = req.params;
    const { password, division, status } = req.body ?? {};

    const user = await prisma.pengguna.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json(fail("User tidak ditemukan"));
    }

    const divisionError = validateDivision(division);
    if (divisionError) return res.status(400).json(fail(divisionError));

    const shouldUpdatePassword = password !== undefined && password !== null && String(password).trim() !== "";
    if (shouldUpdatePassword) {
      const passwordError = validatePassword(password, { min: 4 });
      if (passwordError) return res.status(400).json(fail(passwordError));
    }

    const updated = await prisma.pengguna.update({
      where: { username },
      data: {
        password: shouldUpdatePassword ? String(password) : user.password,
        division: division ?? user.division,
        status: status ?? user.status,
      },
    });

    return res.json(ok(updated, "User berhasil diupdate"));
  } catch (err: any) {
    return res.status(500).json(fail(err.message));
  }
}

/**
 * DELETE /pengguna/:username
 */
export async function deletePengguna(req: Request, res: Response) {
  try {
    const { username } = req.params;

    const user = await prisma.pengguna.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json(fail("User tidak ditemukan"));
    }

    await prisma.pengguna.delete({ where: { username } });

    return res.json(ok(null, "User berhasil dihapus"));
  } catch (err: any) {
    return res.status(500).json(fail(err.message));
  }
}

/**
 * POST /pengguna/login
 * body: { username, password }
 * (untuk sekarang plaintext compare, sama seperti VB.NET lama)
 */
export async function loginPengguna(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    const usernameError = validateUsername(username);
    if (usernameError) return res.status(400).json(fail(usernameError));
    if (String(password ?? "").trim() === "") {
      return res.status(400).json(fail("password wajib diisi"));
    }

    const user = await prisma.pengguna.findUnique({
      where: { username },
    });

    if (!user || String(user.password ?? "") !== String(password)) {
      return res
        .status(401)
        .json(fail("Username atau password salah"));
    }

    if (user.status === "ON") {
      return res
        .status(409)
        .json(fail("User sedang digunakan. Silakan logout terlebih dahulu."));
    }

    const updated = await prisma.pengguna.update({
      where: { username },
      data: { status: "ON" },
    });

    await writeAuditLog({
      username,
      action: "login",
      page: "Login",
      summary: "Login berhasil",
      data: { division: updated.division, status: updated.status },
    });

    // Untuk sekarang cukup kembalikan data user,
    // nanti kalau perlu bisa ditambah token / session.
    return res.json(
      ok(
        {
          username: updated.username,
          division: updated.division,
          status: updated.status,
        },
        "Login berhasil",
      ),
    );
  } catch (err: any) {
    return res.status(500).json(fail(err.message));
  }
}
/**
 * POST /pengguna/change-password
 * body: { username, currentPassword, newPassword, division? }
 */
export async function changePasswordPengguna(req: Request, res: Response) {
  try {
    const { username, currentPassword, newPassword, division } = req.body ?? {};

    const usernameError = validateUsername(username);
    if (usernameError) return res.status(400).json(fail(usernameError));

    if (String(currentPassword ?? "").trim() === "") {
      return res.status(400).json(fail("currentPassword wajib diisi"));
    }

    const passwordError = validatePassword(newPassword, { min: 4 });
    if (passwordError) return res.status(400).json(fail(passwordError));

    const user = await prisma.pengguna.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json(fail("User tidak ditemukan"));
    }

    if (String(user.password ?? "") !== String(currentPassword)) {
      return res.status(401).json(fail("Password saat ini salah"));
    }

    const updated = await prisma.pengguna.update({
      where: { username },
      data: {
        password: String(newPassword),
        division: division ?? user.division,
      },
    });

    return res.json(
      ok(
        {
          username: updated.username,
          division: updated.division,
          status: updated.status,
        },
        "Password berhasil diubah",
      ),
    );
  } catch (err: any) {
    return res.status(500).json(fail(err.message));
  }
}

/**
 * POST /pengguna/logout
 * body: { username }
 */
export async function logoutPengguna(req: Request, res: Response) {
  try {
    const { username } = req.body ?? {};

    const usernameError = validateUsername(username);
    if (usernameError) return res.status(400).json(fail(usernameError));

    const user = await prisma.pengguna.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json(fail("User tidak ditemukan"));
    }

    const updated = await prisma.pengguna.update({
      where: { username },
      data: { status: "OFF" },
    });

    return res.json(
      ok(
        {
          username: updated.username,
          division: updated.division,
          status: updated.status,
        },
        "Logout berhasil",
      ),
    );
  } catch (err: any) {
    return res.status(500).json(fail(err.message));
  }
}

