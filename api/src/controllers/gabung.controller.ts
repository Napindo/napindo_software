import type { Request, Response } from "express";
import ExcelJS from "exceljs";
import prisma from "../prisma";
import { ok, fail } from "../utils/apiResponse";
import { writeAuditLog } from "../services/auditLog";
import { buildSegmentWhere, SegmentCode } from "../services/gabungSegments";
import { renderPersonalDatabasePdf } from "../services/personalDatabaseRender";

const CACHE_TTL_MS = 60 * 1000;
const cacheState = {
  exhibitorCount: { at: 0, data: null as null | { indoDefence: number; indoWater: number; indoLivestock: number } },
  expoChart: {
    at: 0,
    data: null as null | {
      indoDefence: Record<number, number>;
      indoWater: Record<number, number>;
      indoLivestock: Record<number, number>;
    },
  },
};


const GABUNG_FIELDS = [
  "ptCv",
  "company",
  "address1",
  "address2",
  "city",
  "zip",
  "propince",
  "code",
  "phone",
  "facsimile",
  "handphone",
  "sex",
  "name",
  "position",
  "email",
  "mainActiv",
  "business",
  "source",
  "lastupdate",
  "ocd",
  "ocljkt",
  "oclsby",
  "ocs",
  "ocwsby",
  "ocwjkt",
  "ocmarine",
  "ocaero",
  "kalender",
  "lebaran",
  "parcel",
  "tahunbaru",
  "ptrw",
  "ptrs",
  "ptrl",
  "ptrd",
  "ptrmarine",
  "ptraero",
  "ptriismex",
  "forum",
  "exhthn",
  "code1",
  "code2",
  "code3",
  "code4",
  "welcoming",
  "offlunch",
  "society",
  "demo1",
  "demo2",
  "demo3",
  "seminar1",
  "seminar2",
  "seminar3",
  "seminar4",
  "courtesycall",
  "courtesyvisit",
  "visitcall",
  "tpp1",
  "tpp2",
  "tpp3",
  "tpp4",
  "tdkkrmidlsby",
  "tdkkrmidwsby",
  "tdkkrmidljkt",
  "tdkkrmidwjkt",
  "tdkkrmidd",
  "gover",
  "viswater",
  "vislives",
  "visagritech",
  "visindovet",
  "visfish",
  "vissecure",
  "visfire",
  "visdairy",
  "visfeed",
  "visdefence",
  "vismarine",
  "visaero",
  "viswaste",
  "visenergy",
  "vissmart",
  "exhwater",
  "exhlives",
  "exhagritech",
  "exhindovet",
  "exhfish",
  "exhsecure",
  "exhfire",
  "exhdairy",
  "exhfeed",
  "exhdefence",
  "exhmarine",
  "exhaero",
  "exhwaste",
  "exhenergy",
  "exhsmart",
  "viw",
  "vis",
  "vil",
  "vipagri",
  "vipindovet",
  "vipidre",
  "vid",
  "vipmarine",
  "vipiismex",
  "vipaero",
  "vvip",
  "website",
  "namauser",
  "tglJamEdit",
  "vishorti",
  "exhhorti",
  "viwaste",
  "vifire",
  "vifish",
  "vifeed",
  "vidairy",
  "vihorti",
  "ocwaste",
  "ocsmart",
  "ocenergy",
  "ocfire",
  "ocagri",
  "ocfish",
  "ocindovet",
  "ocfeed",
  "ocdairy",
  "ochorti",
];

const normalizeHeader = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const GABUNG_FIELD_MAP = new Map<string, string>(
  GABUNG_FIELDS.map((field) => [normalizeHeader(field), field]),
);

const excelSerialToDate = (serial: number) => {
  if (!Number.isFinite(serial)) return null;
  const excelEpoch = 25569;
  const millis = Math.round((serial - excelEpoch) * 86400 * 1000);
  const date = new Date(millis);
  return Number.isNaN(date.getTime()) ? null : date;
};

const coerceDate = (value: unknown, fallbackText?: string) => {
  if (value instanceof Date) return value;
  if (typeof value === "number") return excelSerialToDate(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const anyValue = value as any;
  if (anyValue?.result !== undefined) return coerceDate(anyValue.result, fallbackText);
  if (fallbackText) return coerceDate(fallbackText);
  return null;
};

const readCellValue = (cell: ExcelJS.Cell, fieldName: string) => {
  const rawValue = cell.value;
  if (rawValue === null || typeof rawValue === "undefined") return null;

  if (fieldName === "lastupdate") {
    return coerceDate(rawValue, cell.text ?? "");
  }

  if (typeof rawValue === "string") {
    const trimmed = rawValue.trim();
    return trimmed === "" ? null : trimmed;
  }

  if (typeof rawValue === "number" || typeof rawValue === "boolean") {
    return String(rawValue);
  }

  if (rawValue instanceof Date) {
    return rawValue.toISOString();
  }

  const anyValue = rawValue as any;
  if (Array.isArray(anyValue?.richText)) {
    const text = anyValue.richText.map((item: any) => item.text || "").join("");
    return text.trim() === "" ? null : text;
  }

  if (typeof anyValue?.text === "string") {
    const text = anyValue.text.trim();
    return text === "" ? null : text;
  }

  if (anyValue?.result !== undefined) {
    return readCellValue({ ...cell, value: anyValue.result } as ExcelJS.Cell, fieldName);
  }

  const text = cell.text?.trim?.() || "";
  return text === "" ? null : text;
};

const formatTimestamp = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

// ===================== LIST GABUNG (dengan pencarian & paging) =====================

export async function listGabung(req: Request, res: Response) {
  try {
    const { q, page = "1", pageSize = "50" } = req.query;
    const fields = String(req.query.fields || "").toLowerCase();
    const company = String(req.query.company || "").trim();
    const name = String(req.query.name || "").trim();
    const email = String(req.query.email || "").trim();
    const business = String(req.query.business || "").trim();
    const userName = String(req.query.userName || "").trim();
    const hp = String(req.query.hp || "").trim();
    const city = String(req.query.city || "").trim();

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
    if (company) {
      where.company = { contains: company, mode: "insensitive" };
    }
    if (name) {
      where.name = { contains: name, mode: "insensitive" };
    }
    if (email) {
      where.email = { contains: email, mode: "insensitive" };
    }
    if (business) {
      where.business = { contains: business, mode: "insensitive" };
    }
    if (userName) {
      where.namauser = { contains: userName, mode: "insensitive" };
    }
    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }
    if (hp) {
      where.AND = [
        ...(where.AND ?? []),
        {
          OR: [
            { phone: { contains: hp, mode: "insensitive" } },
            { handphone: { contains: hp, mode: "insensitive" } },
          ],
        },
      ];
    }

    const select =
      fields === "search"
        ? {
            nourut: true,
            ptCv: true,
            company: true,
            address1: true,
            address2: true,
            city: true,
            zip: true,
            propince: true,
            code: true,
            phone: true,
            handphone: true,
            email: true,
            name: true,
            position: true,
            business: true,
            source: true,
            namauser: true,
            lastupdate: true,
            tglJamEdit: true,
          }
        : undefined;

    const [items, total] = await Promise.all([
      prisma.gabung.findMany({
        where,
        orderBy: { company: "asc" },
        skip,
        take,
        select,
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

// ===================== LIST SOURCE OPTIONS (CODE4) =====================

export async function listSourceOptions(_req: Request, res: Response) {
  try {
    const rows = await prisma.gabung.findMany({
      distinct: ["code4"],
      select: { code4: true },
      orderBy: { code4: "asc" },
    });

    const options = Array.from(
      new Set(
        rows
          .map((row: { code4?: string | null }) => String(row.code4 ?? "").trim())
          .filter((value: string) => value !== ""),
      ),
    );

    return res.json(ok({ options }));
  } catch (err: any) {
    return res.status(500).json(fail(err.message || String(err)));
  }
}

// ===================== LIST CODE1 OPTIONS =====================

export async function listCode1Options(_req: Request, res: Response) {
  try {
    const rows = await prisma.gabung.findMany({
      distinct: ["code1"],
      select: { code1: true },
      orderBy: { code1: "asc" },
    });

    const options = Array.from(
      new Set(
        rows
          .map((row: { code1?: string | null }) => String(row.code1 ?? "").trim())
          .filter((value: string) => value !== ""),
      ),
    );

    return res.json(ok({ options }));
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
    await writeAuditLog({
      username: data.namauser ?? null,
      action: "add",
      page: "Add Data",
      summary: `Add data ${item.company ?? ""}`.trim(),
      data: {
        id: item.nourut,
        company: item.company,
        name: item.name,
        city: item.city,
        email: item.email,
      },
    });
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

    const changedKeys = Object.keys(data).filter(
      (key) => !["namauser", "tglJamEdit", "nourut", "NOURUT"].includes(key),
    );
    await writeAuditLog({
      username: data.namauser ?? null,
      action: "update",
      page: "Add Data",
      summary: `Update data ${item.company ?? ""} (NOURUT ${id})`.trim(),
      data: {
        id,
        company: item.company,
        name: item.name,
        city: item.city,
        email: item.email,
        changedKeys,
      },
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

// ===================== IMPORT EXCEL =====================

export async function importGabungExcel(req: Request, res: Response) {
  try {
    const payload = req.body ?? {};
    const base64 = String(payload.fileBase64 || "").trim();
    if (!base64) {
      return res.status(400).json(fail("File Excel belum dipilih"));
    }

    const headerRowIndex = Math.max(Number(payload.headerRow || 1), 1);
    const chunkSizeInput = Number(payload.chunkSize || 500);
    const chunkSize = Number.isFinite(chunkSizeInput)
      ? Math.min(Math.max(Math.floor(chunkSizeInput), 1), 2000)
      : 500;
    const maxRowsInput = Number(payload.maxRows || 0);
    const maxRows =
      Number.isFinite(maxRowsInput) && maxRowsInput > 0
        ? Math.floor(maxRowsInput)
        : 0;

    const buffer = Buffer.from(base64, "base64");
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    );
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer, {
      ignoreNodes: [
        "dataValidations",
        "conditionalFormatting",
        "hyperlinks",
        "pageMargins",
        "pageSetup",
        "printOptions",
        "sheetViews",
        "headerFooter",
        "drawing",
        "legacyDrawing",
        "sheetPr",
        "sheetFormatPr",
        "cols",
        "rowBreaks",
        "colBreaks",
        "mergeCells",
        "extLst",
        "tableParts",
        "autoFilter",
        "styles",
      ],
    });

    const sheetName =
      typeof payload.sheetName === "string" && payload.sheetName.trim()
        ? payload.sheetName.trim()
        : "";
    const sheet = sheetName ? workbook.getWorksheet(sheetName) : workbook.worksheets[0];

    if (!sheet) {
      return res.status(400).json(fail("Sheet Excel tidak ditemukan"));
    }

    if (!sheet.rowCount || headerRowIndex > sheet.rowCount) {
      return res.status(400).json(fail("Header row berada di luar jangkauan data"));
    }

    const headerRow = sheet.getRow(headerRowIndex);
    const headerValues = headerRow.values as Array<unknown>;
    const columnMap = new Map<number, string>();
    const unknownHeaders: string[] = [];

    headerValues.forEach((value, index) => {
      if (!index) return;
      const normalized = normalizeHeader(value);
      if (!normalized) return;
      const field = GABUNG_FIELD_MAP.get(normalized);
      if (field) {
        columnMap.set(index, field);
      } else {
        const label = String(value ?? "").trim();
        if (label) unknownHeaders.push(label);
      }
    });

    if (columnMap.size === 0) {
      return res
        .status(400)
        .json(fail("Tidak ada header kolom yang cocok dengan tabel GABUNG"));
    }

    const mappedHeaders = Array.from(new Set(columnMap.values()));
    const uniqueUnknownHeaders = Array.from(new Set(unknownHeaders));

    const rows: Array<Record<string, unknown>> = [];
    const now = new Date();
    const currentUser = String(payload.currentUser || "").trim() || null;
    const availableRows = Math.max((sheet.actualRowCount || sheet.rowCount) - headerRowIndex, 0);
    const totalScannedRows = maxRows > 0 ? Math.min(availableRows, maxRows) : availableRows;
    let scannedRows = 0;

    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= headerRowIndex) return;
      if (maxRows > 0 && scannedRows >= maxRows) return;
      scannedRows += 1;
      const rowData: Record<string, unknown> = {};
      let hasValue = false;

      columnMap.forEach((fieldName, columnIndex) => {
        const cell = row.getCell(columnIndex);
        const value = readCellValue(cell, fieldName);
        if (value !== null && value !== undefined && String(value).trim() !== "") {
          rowData[fieldName] = value;
          hasValue = true;
        }
      });

      if (hasValue) {
        if (!rowData.lastupdate) {
          rowData.lastupdate = now;
        }
        if (!rowData.tglJamEdit) {
          rowData.tglJamEdit = formatTimestamp(now);
        }
        if (!rowData.namauser && currentUser) {
          rowData.namauser = currentUser;
        }
        rows.push(rowData);
      }
    });

    const effectiveScanned = Math.max(
      maxRows > 0 ? Math.min(scannedRows, maxRows) : scannedRows,
      0,
    );

    if (rows.length === 0) {
      return res.json(
        ok({
          totalRows: 0,
          inserted: 0,
          skipped: effectiveScanned,
          mappedHeaders,
          unknownHeaders: uniqueUnknownHeaders,
        }),
      );
    }

    const dryRun = Boolean(payload.dryRun);
    let inserted = 0;
    if (!dryRun) {
      for (let i = 0; i < rows.length; i += chunkSize) {
        const batch = rows.slice(i, i + chunkSize);
        const result = await prisma.gabung.createMany({ data: batch });
        inserted += result?.count ?? batch.length;
      }

      await writeAuditLog({
        username: currentUser,
        action: "import",
        page: "Import Data",
        summary: `Import Excel ${payload?.fileName || "file"}: ${inserted} masuk, ${Math.max(
          effectiveScanned - rows.length,
          0,
        )} kosong`,
        data: {
          fileName: payload?.fileName || null,
          inserted,
          skipped: Math.max(effectiveScanned - rows.length, 0),
          totalRows: rows.length,
        },
      });
    }

    return res.json(
      ok({
        totalRows: rows.length,
        inserted: dryRun ? 0 : inserted,
        skipped: Math.max(effectiveScanned - rows.length, 0),
        mappedHeaders,
        unknownHeaders: uniqueUnknownHeaders,
        dryRun,
      }),
    );
  } catch (err: any) {
    return res.status(500).json(fail(err.message || String(err)));
  }
}

// ===================== EXPORT PERSONAL DATABASE PDF =====================

export async function exportPersonalDatabasePdf(req: Request, res: Response) {
  try {
    const payload = req.body ?? {};
    const title = String(payload?.title || "DATABASE PERSONAL").trim() || "DATABASE PERSONAL";

    const joinParts = (parts: Array<string | null | undefined>) =>
      parts
        .map((part) => String(part ?? "").trim())
        .filter(Boolean)
        .join(" ");

    const joinAddress = (parts: Array<string | null | undefined>) =>
      parts
        .map((part) => String(part ?? "").trim())
        .filter(Boolean)
        .join(", ");

    const joinPhone = (code: unknown, number: unknown) => {
      const codeText = String(code ?? "").trim();
      const numberText = String(number ?? "").trim();
      if (!codeText && !numberText) return "";
      if (!codeText) return numberText;
      if (!numberText) return `${codeText}-`;
      return `${codeText}-${numberText}`;
    };

    const rows = [
      { label: "Company", value: joinParts([payload?.typeOfBusiness, payload?.company]) },
      { label: "Address", value: joinAddress([payload?.address1, payload?.address2, payload?.city, payload?.zip]) },
      { label: "Name", value: joinParts([payload?.sex, payload?.name]) },
      { label: "Position", value: String(payload?.position ?? "").trim() },
      { label: "Phone", value: joinPhone(payload?.codePhone, payload?.phoneNumber) },
      { label: "Handphone", value: String(payload?.handphone ?? "").trim() },
      { label: "Email", value: String(payload?.email ?? "").trim() },
    ].filter((row) => row.value);

    if (rows.length === 0) {
      return res.status(400).json(fail("Tidak ada field terisi untuk diexport"));
    }

    const pdf = await renderPersonalDatabasePdf({ title, rows });

    await writeAuditLog({
      username: String(payload?.currentUser || "").trim() || null,
      action: "export_pdf",
      page: "Add Data",
      summary: `${title} - PDF`,
      data: {
        title,
        fields: rows.map((row) => row.label),
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="database-personal.pdf"');
    const buffer = Buffer.from(await pdf.arrayBuffer());
    return res.end(buffer);
  } catch (err: any) {
    return res.status(500).json(fail(err.message || String(err)));
  }
}

// ===================== LIST BY SEGMENT (DEFENCE / AEROSPACE / MARINE) =====================

export async function listGabungBySegment(req: Request, res: Response) {
  try {
    const segment = req.params.segment as SegmentCode;
    const limitInput = Number(req.query.limit ?? 200);
    const limit = Number.isFinite(limitInput) ? Math.floor(limitInput) : 200;
    const take = limit > 0 ? limit : undefined;

    const personParam = String(req.query.person || "exhibitor").toLowerCase();
    const person = personParam === "visitor" ? "visitor" : "exhibitor";

    const where = buildSegmentWhere(segment, person);

    const items = await prisma.gabung.findMany({
      where,
      take,
    });

    return res.json(ok({ items, segment, limit: take ? limit : 0, person }));
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
    const limitInput = Number(req.query.limit ?? 200);
    const limit = Number.isFinite(limitInput) ? Math.max(Math.floor(limitInput), 1) : 200;

    const items = await prisma.gabung.findMany({
      where: {
        company: {
          contains: company,
          mode: "insensitive",
        },
      },
      orderBy: { company: "asc" },
      take: limit,
    });

    return res.json(ok({ items }));
  } catch (err: any) {
    return res.status(500).json(fail(err.message || String(err)));
  }
}

/**
 * GET /gabung/exhibitor-count
 * Hitung jumlah exhibitor per pameran (Indo Defence, Indo Water, Indo Livestock).
 */
export async function countExhibitorsByExpo(_req: Request, res: Response) {
  try {
    const now = Date.now();
    if (cacheState.exhibitorCount.data && now - cacheState.exhibitorCount.at < CACHE_TTL_MS) {
      return res.json(ok(cacheState.exhibitorCount.data));
    }

    const flagSql = (column: string) =>
      `LOWER(COALESCE("${column}", '')) IN ('x','1','true','yes','y')`;

    const defence = ["EXHDEFENCE", "EXHAERO", "EXHMARINE"]
      .map(flagSql)
      .join(' OR ');
    const water = [
      "EXHWATER",
      "EXHWASTE",
      "EXHENERGY",
      "EXHSMART",
      "EXHSECURE",
      "EXHFIRE",
    ]
      .map(flagSql)
      .join(' OR ');
    const livestock = [
      "EXHLIVES",
      "EXHAGRITECH",
      "EXHFISH",
      "EXHINDOVET",
      "EXHFEED",
      "EXHDAIRY",
      "EXHHORTI",
    ]
      .map(flagSql)
      .join(' OR ');

    const sql = `
      SELECT
        SUM(CASE WHEN (${defence}) THEN 1 ELSE 0 END)::int AS "indoDefence",
        SUM(CASE WHEN (${water}) THEN 1 ELSE 0 END)::int AS "indoWater",
        SUM(CASE WHEN (${livestock}) THEN 1 ELSE 0 END)::int AS "indoLivestock"
      FROM "GABUNG"
    `;

    const rows = (await prisma.$queryRawUnsafe(sql)) as {
      indoDefence: number | null;
      indoWater: number | null;
      indoLivestock: number | null;
    }[];
    const row = rows?.[0] ?? { indoDefence: 0, indoWater: 0, indoLivestock: 0 };
    const data = {
      indoDefence: row.indoDefence ?? 0,
      indoWater: row.indoWater ?? 0,
      indoLivestock: row.indoLivestock ?? 0,
    };

    cacheState.exhibitorCount = { at: now, data };
    return res.json(ok(data));
  } catch (err: any) {
    return res.status(500).json(fail(err.message));
  }
}

/**
 * GET /gabung/expo-chart
 * Data grafik exhibitor + visitor per tahun (>=2023) untuk Indo Defence/Water/Livestock.
 */
export async function getExpoChartData(req: Request, res: Response) {
  try {
    const now = Date.now();
    if (cacheState.expoChart.data && now - cacheState.expoChart.at < CACHE_TTL_MS) {
      return res.json(ok(cacheState.expoChart.data));
    }

    const flagSql = (column: string) =>
      `LOWER(COALESCE("${column}", '')) IN ('x','1','true','yes','y')`;

    const defence = [
      "EXHDEFENCE",
      "EXHAERO",
      "EXHMARINE",
      "VISDEFENCE",
      "VISAERO",
      "VISMARINE",
    ]
      .map(flagSql)
      .join(' OR ');
    const water = [
      "EXHWATER",
      "EXHWASTE",
      "EXHENERGY",
      "EXHSMART",
      "EXHSECURE",
      "EXHFIRE",
      "VISWATER",
      "VISWASTE",
      "VISENERGY",
      "VISSMART",
      "VISSECURE",
      "VISFIRE",
    ]
      .map(flagSql)
      .join(' OR ');
    const livestock = [
      "EXHLIVES",
      "EXHAGRITECH",
      "EXHFISH",
      "EXHINDOVET",
      "EXHFEED",
      "EXHDAIRY",
      "EXHHORTI",
      "VISLIVES",
      "VISAGRITECH",
      "VISFISH",
      "VISINDOVET",
      "VISFEED",
      "VISDAIRY",
      "VISHORTI",
    ]
      .map(flagSql)
      .join(' OR ');

    const sql = `
      SELECT
        EXTRACT(YEAR FROM "LASTUPDATE")::int AS "year",
        SUM(CASE WHEN (${defence}) THEN 1 ELSE 0 END)::int AS "indoDefence",
        SUM(CASE WHEN (${water}) THEN 1 ELSE 0 END)::int AS "indoWater",
        SUM(CASE WHEN (${livestock}) THEN 1 ELSE 0 END)::int AS "indoLivestock"
      FROM "GABUNG"
      WHERE "LASTUPDATE" >= DATE '2023-01-01'
      GROUP BY 1
      ORDER BY 1
    `;

    const rows = (await prisma.$queryRawUnsafe(sql)) as {
      year: number;
      indoDefence: number | null;
      indoWater: number | null;
      indoLivestock: number | null;
    }[];

    const counts: {
      indoDefence: Record<number, number>;
      indoWater: Record<number, number>;
      indoLivestock: Record<number, number>;
    } = {
      indoDefence: {},
      indoWater: {},
      indoLivestock: {},
    };

    rows.forEach((row: { year: number; indoDefence: number | null; indoWater: number | null; indoLivestock: number | null }) => {
      if (!row?.year) return;
      counts.indoDefence[row.year] = row.indoDefence ?? 0;
      counts.indoWater[row.year] = row.indoWater ?? 0;
      counts.indoLivestock[row.year] = row.indoLivestock ?? 0;
    });

    const debug = String(req.query.debug || "") === "1";
    if (debug) {
      return res.json(
        ok({
          counts,
          meta: {
            rowCount: rows.length,
            sample: rows[0] ?? null,
          },
        }),
      );
    }

    cacheState.expoChart = { at: now, data: counts };
    return res.json(ok(counts));
  } catch (err: any) {
    return res.status(500).json(fail(err.message));
  }
}
