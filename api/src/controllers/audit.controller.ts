import type { Request, Response } from "express";
import prisma from "../prisma";
import { ok, fail } from "../utils/apiResponse";

export async function listAuditLogs(req: Request, res: Response) {
  try {
    const limitInput = Number(req.query.limit || 200);
    const limit = Number.isFinite(limitInput)
      ? Math.min(Math.max(Math.floor(limitInput), 1), 1000)
      : 200;

    let logs: any[] = [];
    try {
      logs = await prisma.$queryRaw<
        Array<{
          id: number;
          username: string | null;
          action: string;
          page: string | null;
          summary: string | null;
          data: unknown;
          createdAt: Date;
        }>
      >`
        SELECT
          "ID" as "id",
          "USERNAME" as "username",
          "ACTION" as "action",
          "PAGE" as "page",
          "SUMMARY" as "summary",
          "DATA" as "data",
          "CREATED_AT" as "createdAt"
        FROM "AUDIT_LOG"
        ORDER BY "CREATED_AT" DESC
        LIMIT ${limit}
      `;
    } catch (error: any) {
      if (error?.code === "P2021" || error?.code === "42P01") {
        return res.json(ok([]));
      }
      throw error;
    }

    return res.json(ok(logs));
  } catch (err: any) {
    return res.status(500).json(fail(err.message));
  }
}
