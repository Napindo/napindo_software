import prisma from "../prisma";

type AuditPayload = {
  username?: string | null;
  action: string;
  page?: string | null;
  summary?: string | null;
  data?: unknown;
};

export async function writeAuditLog(payload: AuditPayload) {
  try {
    const dataJson = payload.data ? JSON.stringify(payload.data) : null;
    await prisma.$executeRaw`
      INSERT INTO "AUDIT_LOG" ("USERNAME", "ACTION", "PAGE", "SUMMARY", "DATA")
      VALUES (${payload.username ?? null}, ${payload.action}, ${payload.page ?? null}, ${payload.summary ?? null}, ${dataJson}::jsonb)
    `;
  } catch (error: any) {
    if (error?.code === "42P01") {
      return;
    }
    // Audit log failure should not block main operation.
  }
}
