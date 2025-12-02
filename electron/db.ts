import fs from "node:fs";
import path from "node:path";

export type ExhibitorSegment =
  | "defence"
  | "aerospace"
  | "marine"
  | "water"
  | "waste"
  | "iismex"
  | "renergy"
  | "security"
  | "firex"
  | "livestock"
  | "agrotech"
  | "vet"
  | "fisheries"
  | "feed"
  | "dairy"
  | "horticulture";

export type Gabung = {
  nourut: number;
  company: string | null;
  name: string | null;
  city: string | null;
  propince: string | null;
  code: string | null;
  lastupdate: string | null;
  // … tambahkan semua kolom sesuai prisma
};

type ApiResponse<T = unknown> =
  | { ok?: boolean; success?: boolean; data?: T; rows?: T; items?: T; message?: string };

type ApiResult<T = unknown> = {
  status: number;
  body: ApiResponse<T>;
};

const isResponseOk = (body?: ApiResponse<any>) =>
  body?.ok === true || body?.success === true;

const pickData = <T = unknown>(body?: ApiResponse<T>) => {
  if (!body) return undefined;
  if (typeof body.data !== "undefined") return body.data;
  if (typeof (body as any).items !== "undefined") return (body as any).items;
  if (typeof (body as any).rows !== "undefined") return (body as any).rows;
  return undefined;
};

const uniqueClean = (values: Array<string | null | undefined>) =>
  Array.from(
    new Set(
      values
        .map((item) => (item == null ? "" : String(item).trim()))
        .filter(Boolean),
    ),
  );

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (typeof process.env[key] === "undefined") {
      process.env[key] = rest.join("=").trim();
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env"));

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";
const API_PREFIX = process.env.API_PREFIX || "/api";

async function apiFetch<T = unknown>(pathName: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}${pathName}`;

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });

    const contentType = response.headers.get("content-type") || "";
    let body: ApiResponse<T>;

    if (contentType.includes("application/json")) {
      body = (await response.json()) as ApiResponse<T>;
    } else {
      const text = await response.text();
      body = { success: false, ok: false, message: text };
    }

    return { status: response.status, body };
  } catch (err) {
    return { status: 500, body: { success: false, message: "Tidak dapat terhubung ke API" } };
  }
}

/* ----------------- HEALTH ----------------- */
export async function testConnection() {
  const { body } = await apiFetch<{ serverTime?: string }>("/health");
  if (!isResponseOk(body)) {
    return { success: false, message: body.message };
  }
  const data = pickData(body) as { serverTime?: string } | undefined;
  return { success: true, serverTime: data?.serverTime };
}

/* ----------------- LOGIN ----------------- */
export async function loginUser(payload: { username: string; password: string; division?: string | null }) {
  const { body, status } = await apiFetch("/pengguna/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!isResponseOk(body)) {
    if (status === 401) return null;
    throw new Error(body.message || "Login gagal");
  }

  return pickData(body);
}

/* ----------------- USER HINTS ----------------- */
export async function fetchUserHints() {
  const { body } = await apiFetch<Array<{ username?: string; division?: string | null }>>("/pengguna");
  if (!isResponseOk(body)) {
    throw new Error(body.message || "Gagal memuat data pengguna");
  }

  const users = (pickData(body) as Array<{ username?: string; division?: string | null }> | undefined) ?? [];
  const usernames = uniqueClean(users.map((user) => user?.username));
  const divisions = uniqueClean(users.map((user) => user?.division));

  return { usernames, divisions };
}

/* ----------------- GABUNG CRUD ----------------- */
export async function fetchTopRows(tableName: string, top = 10) {
  const safe = tableName.replace(/[^\w.]/g, "");
  const params = new URLSearchParams({ limit: String(top) });
  const { body } = await apiFetch(`/gabung/table-preview/${safe}?${params.toString()}`);
  if (!isResponseOk(body)) throw new Error(body.message || "Gagal mengambil preview data");
  const data = pickData(body) as any;
  return data?.rows ?? data ?? [];
}

// Ambil data exhibitor per segment (defence, aerospace, marine, dll)
export type PersonType = "exhibitor" | "visitor";

export async function fetchExhibitorsBySegment(
  segment: string,
  limit = 200,
  person: PersonType = "exhibitor",
) {
  const params = new URLSearchParams({ limit: String(limit), person });
  const { body } = await apiFetch<{ items: Gabung[]; segment: string; limit: number; person?: PersonType }>(
    `/gabung/segment/${encodeURIComponent(segment)}?${params.toString()}`,
  );

  if (!isResponseOk(body)) {
    throw new Error(body.message || "Gagal mengambil data gabung");
  }

  const data: any = pickData(body) ?? {};
  return (data.items ?? data.rows ?? data ?? []) as Gabung[];
}

export async function findCompanyByName(company: string) {
  const trimmed = company.trim();
  const encoded = encodeURIComponent(trimmed);
  const { body } = await apiFetch(`/gabung/company/${encoded}`);
  if (!isResponseOk(body)) throw new Error(body.message || "Gagal mencari perusahaan");
  const data: any = pickData(body) ?? {};
  return data.items ?? data.rows ?? data ?? [];
}

export async function saveAddData(payload: Record<string, unknown>) {
  const { body } = await apiFetch("/gabung", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!isResponseOk(body)) throw new Error(body.message || "Gagal menyimpan data");
  return pickData(body) ?? body;
}

export async function updateAddData(id: number | string, payload: Record<string, unknown>) {
  const safeId = encodeURIComponent(String(id));
  const { body } = await apiFetch(`/gabung/${safeId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!isResponseOk(body)) throw new Error(body.message || "Gagal memperbarui data");
  return pickData(body) ?? body;
}

export async function deleteAddData(ids: Array<string | number>) {
  const uniqueIds = Array.from(new Set(ids.map((id) => String(id).trim()).filter(Boolean)));
  const results: Array<{ id: string; success: boolean; message?: string }> = [];

  for (const id of uniqueIds) {
    const safeId = encodeURIComponent(id);
    const { body } = await apiFetch(`/gabung/${safeId}`, { method: "DELETE" });
    const ok = isResponseOk(body);
    results.push({ id, success: ok, message: body.message });
    if (!ok) {
      throw new Error(body.message || `Gagal menghapus data ${id}`);
    }
  }

  return results;
}

/* ----------------- REPORT ENDPOINTS ----------------- */
export async function reportLabelVisitor(filter: unknown) {
  const { body } = await apiFetch("/report/labelvisitor", {
    method: "POST",
    body: JSON.stringify(filter),
  });

  if (!body.success) throw new Error(body.message);
  return body.data;
}

export async function reportLabelGover(filter: unknown) {
  const { body } = await apiFetch("/report/labelgover", {
    method: "POST",
    body: JSON.stringify(filter),
  });

  if (!body.success) throw new Error(body.message);
  return body.data;
}

export async function reportBusinessVisitor(filter: unknown) {
  const { body } = await apiFetch("/report/businessvisitor", {
    method: "POST",
    body: JSON.stringify(filter),
  });

  if (!body.success) throw new Error(body.message);
  return body.data;
}

// … lanjutkan untuk 3 report lainnya
