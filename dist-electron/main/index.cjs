"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const node_url = require("node:url");
const fs$1 = require("node:fs/promises");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
function createWindow(options) {
  const window = new electron.BrowserWindow({
    icon: path.join(options.publicDir, "electron-vite.svg"),
    webPreferences: {
      preload: options.preload,
      devTools: false
    }
  });
  window.webContents.on("did-finish-load", () => {
    window.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  window.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error("Renderer failed to load", { errorCode, errorDescription, validatedURL });
  });
  if (options.devServerUrl) {
    window.loadURL(options.devServerUrl);
  } else {
    window.loadFile(path.join(options.rendererDist, "index.html"));
  }
  return window;
}
const isResponseOk = (body) => (body == null ? void 0 : body.ok) === true || (body == null ? void 0 : body.success) === true;
const pickData = (body) => {
  if (!body) return void 0;
  if (typeof body.data !== "undefined") return body.data;
  if (typeof body.items !== "undefined") return body.items;
  if (typeof body.rows !== "undefined") return body.rows;
  return void 0;
};
const uniqueClean = (values) => Array.from(
  new Set(
    values.map((item) => item == null ? "" : String(item).trim()).filter(Boolean)
  )
);
function loadEnvFile(filePath) {
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
const appRoot = process.env.APP_ROOT;
if (appRoot) {
  loadEnvFile(path.resolve(appRoot, ".env"));
}
loadEnvFile(path.resolve(process.cwd(), ".env"));
loadEnvFile(path.resolve(process.cwd(), "..", ".env"));
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";
const API_PREFIX = process.env.API_PREFIX || "/api";
const ensureNoProxyForLocal = () => {
  const existing = process.env.NO_PROXY || process.env.no_proxy || "";
  const entries = existing.split(",").map((item) => item.trim()).filter(Boolean);
  const required = ["localhost", "127.0.0.1"];
  let changed = false;
  required.forEach((host) => {
    if (!entries.includes(host)) {
      entries.push(host);
      changed = true;
    }
  });
  if (changed) {
    const value = entries.join(",");
    process.env.NO_PROXY = value;
    process.env.no_proxy = value;
  }
};
async function apiFetch(pathName, init = {}) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}${pathName}`;
  ensureNoProxyForLocal();
  const attempt = async (targetUrl) => {
    const timeoutMs = typeof init.timeoutMs === "number" ? init.timeoutMs : 0;
    const controller = timeoutMs > 0 ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => {
      controller.abort();
    }, timeoutMs) : null;
    try {
      const response = await fetch(targetUrl, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...init.headers || {}
        },
        signal: controller == null ? void 0 : controller.signal
      });
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const contentType = response.headers.get("content-type") || "";
      let body;
      if (contentType.includes("application/json")) {
        body = await response.json();
      } else {
        const text = await response.text();
        body = { success: false, ok: false, message: text };
      }
      return { status: response.status, body };
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };
  try {
    return await attempt(url);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    if (isTimeout) {
      return {
        status: 408,
        body: {
          success: false,
          message: `Request timeout saat menghubungi API (${url}). Coba lagi atau cek koneksi API/DB.`
        }
      };
    }
    if (url.includes("localhost")) {
      const fallbackUrl = url.replace("localhost", "127.0.0.1");
      try {
        return await attempt(fallbackUrl);
      } catch (fallbackError) {
        const fallbackDetail = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        return {
          status: 500,
          body: {
            success: false,
            message: `Tidak dapat terhubung ke API (${url}). ${detail}. Fallback ${fallbackUrl} gagal: ${fallbackDetail}`
          }
        };
      }
    }
    return {
      status: 500,
      body: { success: false, message: `Tidak dapat terhubung ke API (${url}). ${detail}` }
    };
  }
}
async function testConnection() {
  const { body } = await apiFetch("/health");
  if (!isResponseOk(body)) {
    return { success: false, message: body.message };
  }
  const data = pickData(body);
  return { success: true, serverTime: data == null ? void 0 : data.serverTime };
}
async function fetchTopRows(tableName, top = 10) {
  const safe = tableName.replace(/[^\w.]/g, "");
  const params = new URLSearchParams({ limit: String(top) });
  const { body } = await apiFetch(`/gabung/table-preview/${safe}?${params.toString()}`);
  if (!isResponseOk(body)) throw new Error(body.message || "Gagal mengambil preview data");
  const data = pickData(body);
  return (data == null ? void 0 : data.rows) ?? data ?? [];
}
async function fetchExhibitorsBySegment(segment, limit = 200, person = "exhibitor") {
  const params = new URLSearchParams({ limit: String(limit), person });
  const { body } = await apiFetch(
    `/gabung/segment/${encodeURIComponent(segment)}?${params.toString()}`
  );
  if (!isResponseOk(body)) {
    throw new Error(body.message || "Gagal mengambil data gabung");
  }
  const data = pickData(body) ?? {};
  return data.items ?? data.rows ?? data ?? [];
}
async function fetchExhibitorCountByExpo() {
  const { body } = await apiFetch("/gabung/exhibitor-count");
  if (!isResponseOk(body)) {
    throw new Error(body.message || "Gagal mengambil jumlah exhibitor per pameran");
  }
  return pickData(body);
}
async function fetchExpoChartData() {
  const { body } = await apiFetch("/gabung/expo-chart");
  if (!isResponseOk(body)) {
    throw new Error(body.message || "Gagal mengambil data grafik pameran");
  }
  return pickData(body);
}
async function findCompanyByName(company) {
  const trimmed = company.trim();
  const encoded = encodeURIComponent(trimmed);
  const { body } = await apiFetch(`/gabung/company/${encoded}`);
  if (!isResponseOk(body)) throw new Error(body.message || "Gagal mencari perusahaan");
  const data = pickData(body) ?? {};
  return data.items ?? data.rows ?? data ?? [];
}
async function saveAddData(payload) {
  const { body } = await apiFetch("/gabung", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  if (!isResponseOk(body)) throw new Error(body.message || "Gagal menyimpan data");
  return pickData(body) ?? body;
}
async function importGabungExcel(payload) {
  const { body } = await apiFetch("/gabung/import/excel", {
    method: "POST",
    body: JSON.stringify(payload),
    timeoutMs: 7e3
  });
  if (!isResponseOk(body)) throw new Error(body.message || "Gagal mengimpor data Excel");
  return pickData(body) ?? body;
}
async function updateAddData(id, payload) {
  const safeId = encodeURIComponent(String(id));
  const { body } = await apiFetch(`/gabung/${safeId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  if (!isResponseOk(body)) throw new Error(body.message || "Gagal memperbarui data");
  return pickData(body) ?? body;
}
async function deleteAddData(ids) {
  const uniqueIds = Array.from(new Set(ids.map((id) => String(id).trim()).filter(Boolean)));
  const results = [];
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
async function reportLabelVisitor(filter) {
  const { body } = await apiFetch("/report/labelvisitor", {
    method: "POST",
    body: JSON.stringify(filter)
  });
  if (!isResponseOk(body)) throw new Error(body.message || "Gagal memuat label visitor");
  return pickData(body) ?? body.data;
}
async function reportLabelGover(filter) {
  const { body } = await apiFetch("/report/labelgover", {
    method: "POST",
    body: JSON.stringify(filter)
  });
  if (!isResponseOk(body)) throw new Error(body.message || "Gagal memuat label gover");
  return pickData(body) ?? body.data;
}
async function reportPerusahaan(filter) {
  const { body } = await apiFetch("/report/perusahaan", {
    method: "POST",
    body: JSON.stringify(filter)
  });
  if (!isResponseOk(body)) throw new Error(body.message || "Gagal memuat report perusahaan");
  return pickData(body) ?? body.data;
}
async function reportGovernment(filter) {
  const { body } = await apiFetch("/report/government", {
    method: "POST",
    body: JSON.stringify(filter)
  });
  if (!isResponseOk(body)) throw new Error(body.message || "Gagal memuat report government");
  return pickData(body) ?? body.data;
}
async function reportJumlahPerusahaan(filter) {
  const { body } = await apiFetch("/report/jumlah/perusahaan", {
    method: "POST",
    body: JSON.stringify(filter)
  });
  if (!isResponseOk(body)) throw new Error(body.message || "Gagal memuat report jumlah perusahaan");
  return pickData(body) ?? body.data;
}
async function reportJumlahGovernment(filter) {
  const { body } = await apiFetch("/report/jumlah/government", {
    method: "POST",
    body: JSON.stringify(filter)
  });
  if (!isResponseOk(body)) throw new Error(body.message || "Gagal memuat report jumlah government");
  return pickData(body) ?? body.data;
}
async function reportBusinessVisitor(filter) {
  const { body } = await apiFetch("/report/businessvisitor", {
    method: "POST",
    body: JSON.stringify(filter)
  });
  if (!isResponseOk(body)) throw new Error(body.message || "Gagal memuat business visitor");
  return pickData(body) ?? body.data;
}
async function reportLabelOptions() {
  const { body } = await apiFetch("/report/label/options");
  if (!isResponseOk(body)) throw new Error(body.message || "Gagal memuat opsi label");
  return pickData(body) ?? body.data;
}
async function renderLabelVisitorPdf(filter) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}/report/labelvisitor/print`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(filter)
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mencetak label perusahaan");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    contentType: response.headers.get("content-type") || "application/pdf",
    filename: "print-label-perusahaan.pdf",
    buffer,
    base64: buffer.toString("base64")
  };
}
async function renderLabelGoverPdf(filter) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}/report/labelgover/print`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(filter)
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mencetak label government");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    contentType: response.headers.get("content-type") || "application/pdf",
    filename: "print-label-government.pdf",
    buffer,
    base64: buffer.toString("base64")
  };
}
async function renderPersonalDatabasePdf(payload) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}/gabung/personal-pdf`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload || {})
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengunduh PDF");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentDisposition = response.headers.get("content-disposition") || "";
  const match = /filename="?([^"]+)"?/i.exec(contentDisposition);
  const filename = (match == null ? void 0 : match[1]) || "database-personal.pdf";
  return {
    contentType: response.headers.get("content-type") || "application/pdf",
    filename,
    buffer,
    base64: buffer.toString("base64")
  };
}
async function renderLabelVisitorExcel(filter) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}/report/labelvisitor/export/excel`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filter || {})
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengunduh Excel");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    contentType: response.headers.get("content-type") || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    filename: "print-label-perusahaan.xlsx",
    buffer,
    base64: buffer.toString("base64")
  };
}
async function renderLabelGoverExcel(filter) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}/report/labelgover/export/excel`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filter || {})
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengunduh Excel government");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    contentType: response.headers.get("content-type") || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    filename: "print-label-government.xlsx",
    buffer,
    base64: buffer.toString("base64")
  };
}
async function renderLabelVisitorWord(filter) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}/report/labelvisitor/export/word`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filter || {})
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengunduh Word");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    contentType: response.headers.get("content-type") || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    filename: "print-label-perusahaan.docx",
    buffer,
    base64: buffer.toString("base64")
  };
}
async function renderLabelGoverWord(filter) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}/report/labelgover/export/word`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filter || {})
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengunduh Word government");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    contentType: response.headers.get("content-type") || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    filename: "print-label-government.docx",
    buffer,
    base64: buffer.toString("base64")
  };
}
async function renderReportPerusahaanPdf(filter) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}/report/perusahaan/print`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(filter)
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mencetak report perusahaan");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    contentType: response.headers.get("content-type") || "application/pdf",
    filename: "report-perusahaan.pdf",
    buffer,
    base64: buffer.toString("base64")
  };
}
async function renderReportGovernmentPdf(filter) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}/report/government/print`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(filter)
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mencetak report government");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    contentType: response.headers.get("content-type") || "application/pdf",
    filename: "report-government.pdf",
    buffer,
    base64: buffer.toString("base64")
  };
}
async function renderReportJumlahPerusahaanPdf(filter) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}/report/jumlah/perusahaan/print`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(filter)
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mencetak report jumlah perusahaan");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    contentType: response.headers.get("content-type") || "application/pdf",
    filename: "report-jumlah-perusahaan.pdf",
    buffer,
    base64: buffer.toString("base64")
  };
}
async function renderReportJumlahGovernmentPdf(filter) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}/report/jumlah/government/print`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(filter)
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mencetak report jumlah government");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    contentType: response.headers.get("content-type") || "application/pdf",
    filename: "report-jumlah-government.pdf",
    buffer,
    base64: buffer.toString("base64")
  };
}
async function renderReportJumlahPerusahaanExcel(filter) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}/report/jumlah/perusahaan/export/excel`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filter || {})
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengunduh Excel report jumlah perusahaan");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    contentType: response.headers.get("content-type") || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    filename: "report-jumlah-perusahaan.xlsx",
    buffer,
    base64: buffer.toString("base64")
  };
}
async function renderReportJumlahGovernmentExcel(filter) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}/report/jumlah/government/export/excel`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filter || {})
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengunduh Excel report jumlah government");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    contentType: response.headers.get("content-type") || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    filename: "report-jumlah-government.xlsx",
    buffer,
    base64: buffer.toString("base64")
  };
}
async function renderReportPerusahaanExcel(filter) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}/report/perusahaan/export/excel`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filter || {})
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengunduh Excel report perusahaan");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    contentType: response.headers.get("content-type") || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    filename: "report-perusahaan.xlsx",
    buffer,
    base64: buffer.toString("base64")
  };
}
async function renderReportGovernmentExcel(filter) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}/report/government/export/excel`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filter || {})
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengunduh Excel report government");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    contentType: response.headers.get("content-type") || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    filename: "report-government.xlsx",
    buffer,
    base64: buffer.toString("base64")
  };
}
async function renderReportPerusahaanWord(filter) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}/report/perusahaan/export/word`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filter || {})
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengunduh Word report perusahaan");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    contentType: response.headers.get("content-type") || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    filename: "report-perusahaan.docx",
    buffer,
    base64: buffer.toString("base64")
  };
}
async function renderReportGovernmentWord(filter) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}/report/government/export/word`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filter || {})
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengunduh Word report government");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    contentType: response.headers.get("content-type") || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    filename: "report-government.docx",
    buffer,
    base64: buffer.toString("base64")
  };
}
async function renderReportJumlahPerusahaanWord(filter) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}/report/jumlah/perusahaan/export/word`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filter || {})
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengunduh Word report jumlah perusahaan");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    contentType: response.headers.get("content-type") || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    filename: "report-jumlah-perusahaan.docx",
    buffer,
    base64: buffer.toString("base64")
  };
}
async function renderReportJumlahGovernmentWord(filter) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}/report/jumlah/government/export/word`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filter || {})
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengunduh Word report jumlah government");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    contentType: response.headers.get("content-type") || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    filename: "report-jumlah-government.docx",
    buffer,
    base64: buffer.toString("base64")
  };
}
const errorResponse$3 = (error) => ({
  success: false,
  message: error instanceof Error ? error.message : String(error)
});
function registerGabungIpcHandlers() {
  electron.ipcMain.handle("db:testConnection", async () => {
    try {
      const result = await testConnection();
      return { ...result };
    } catch (error) {
      return errorResponse$3(error);
    }
  });
  electron.ipcMain.handle("db:fetchTableData", async (_event, tableName) => {
    try {
      const rows = await fetchTopRows(tableName);
      return { success: true, rows };
    } catch (error) {
      return errorResponse$3(error);
    }
  });
  electron.ipcMain.handle("db:fetchExhibitors", async (_event, segment, limit = 200, person = "exhibitor") => {
    try {
      const rows = await fetchExhibitorsBySegment(segment, limit, person);
      return { success: true, rows };
    } catch (error) {
      return errorResponse$3(error);
    }
  });
  electron.ipcMain.handle("db:fetchExhibitorCountByExpo", async () => {
    try {
      const data = await fetchExhibitorCountByExpo();
      return { success: true, data };
    } catch (error) {
      return errorResponse$3(error);
    }
  });
  electron.ipcMain.handle("db:fetchExpoChartData", async () => {
    try {
      const data = await fetchExpoChartData();
      return { success: true, data };
    } catch (error) {
      return errorResponse$3(error);
    }
  });
  electron.ipcMain.handle("db:findCompany", async (_event, company) => {
    try {
      const rows = await findCompanyByName(company);
      return { success: true, rows };
    } catch (error) {
      return errorResponse$3(error);
    }
  });
  electron.ipcMain.handle("db:saveAddData", async (_event, payload) => {
    try {
      const result = await saveAddData(payload);
      return { success: true, data: result };
    } catch (error) {
      return errorResponse$3(error);
    }
  });
  electron.ipcMain.handle("db:importGabungExcel", async (_event, payload) => {
    try {
      const result = await importGabungExcel(payload);
      return { success: true, data: result };
    } catch (error) {
      return errorResponse$3(error);
    }
  });
  electron.ipcMain.handle("db:updateAddData", async (_event, id, payload) => {
    try {
      const result = await updateAddData(id, payload);
      return { success: true, data: result };
    } catch (error) {
      return errorResponse$3(error);
    }
  });
  electron.ipcMain.handle("db:deleteAddData", async (_event, ids) => {
    try {
      const result = await deleteAddData(ids);
      return { success: true, data: result };
    } catch (error) {
      return errorResponse$3(error);
    }
  });
  electron.ipcMain.handle("report:labelvisitor", async (_event, filter) => {
    try {
      const data = await reportLabelVisitor(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse$3(error);
    }
  });
  electron.ipcMain.handle("report:labelgover", async (_event, filter) => {
    try {
      const data = await reportLabelGover(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse$3(error);
    }
  });
  electron.ipcMain.handle("report:perusahaan", async (_event, filter) => {
    try {
      const data = await reportPerusahaan(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse$3(error);
    }
  });
  electron.ipcMain.handle("report:government", async (_event, filter) => {
    try {
      const data = await reportGovernment(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse$3(error);
    }
  });
  electron.ipcMain.handle("report:jumlah-perusahaan", async (_event, filter) => {
    try {
      const data = await reportJumlahPerusahaan(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse$3(error);
    }
  });
  electron.ipcMain.handle("report:jumlah-government", async (_event, filter) => {
    try {
      const data = await reportJumlahGovernment(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse$3(error);
    }
  });
  electron.ipcMain.handle("report:labeloptions", async () => {
    try {
      const data = await reportLabelOptions();
      return { success: true, data };
    } catch (error) {
      return errorResponse$3(error);
    }
  });
  electron.ipcMain.handle("db:personalDatabasePdf", async (_event, payload) => {
    try {
      const data = await renderPersonalDatabasePdf(payload);
      return { success: true, data };
    } catch (error) {
      return errorResponse$3(error);
    }
  });
}
async function fetchAuditLogs(limit = 200) {
  const params = new URLSearchParams({ limit: String(limit) });
  const { body } = await apiFetch(`/audit/logs?${params.toString()}`);
  if (!isResponseOk(body)) {
    throw new Error(body.message || "Gagal memuat audit log");
  }
  return pickData(body) ?? [];
}
const errorResponse$2 = (error) => ({
  success: false,
  message: error instanceof Error ? error.message : String(error)
});
function registerAuditIpcHandlers() {
  electron.ipcMain.handle("db:fetchAuditLogs", async (_event, limit = 200) => {
    try {
      const rows = await fetchAuditLogs(Number(limit) || 200);
      return { success: true, rows };
    } catch (error) {
      return errorResponse$2(error);
    }
  });
}
async function loginUser(payload) {
  const { body, status } = await apiFetch("/pengguna/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  if (!isResponseOk(body)) {
    if (status === 401) return null;
    throw new Error(body.message || "Login gagal");
  }
  return pickData(body);
}
async function fetchUserHints() {
  const { body } = await apiFetch("/pengguna");
  if (!isResponseOk(body)) {
    throw new Error(body.message || "Gagal memuat data pengguna");
  }
  const users = pickData(body) ?? [];
  const usernames = uniqueClean(users.map((user) => user == null ? void 0 : user.username));
  const divisions = uniqueClean(users.map((user) => user == null ? void 0 : user.division));
  return { usernames, divisions };
}
async function createUser(payload) {
  const { body } = await apiFetch("/pengguna", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  if (!isResponseOk(body)) {
    throw new Error(body.message || "Gagal membuat user");
  }
  return pickData(body);
}
async function listUsers() {
  const { body } = await apiFetch("/pengguna");
  if (!isResponseOk(body)) {
    throw new Error(body.message || "Gagal memuat daftar pengguna");
  }
  return pickData(body) ?? [];
}
async function changePassword(payload) {
  const loginPayload = {
    username: payload.username,
    password: payload.currentPassword,
    division: payload.division ?? null
  };
  const loginResult = await apiFetch("/pengguna/login", {
    method: "POST",
    body: JSON.stringify(loginPayload)
  });
  if (!isResponseOk(loginResult.body)) {
    if (loginResult.status === 401) {
      throw new Error("Password saat ini salah.");
    }
    throw new Error(loginResult.body.message || "Gagal memverifikasi password.");
  }
  const { body } = await apiFetch(`/pengguna/${encodeURIComponent(payload.username)}`, {
    method: "PUT",
    body: JSON.stringify({
      password: payload.newPassword,
      division: payload.division ?? null
    })
  });
  if (!isResponseOk(body)) {
    throw new Error(body.message || "Gagal memperbarui password.");
  }
  return pickData(body);
}
async function logoutUser(payload) {
  const { body } = await apiFetch(`/pengguna/${encodeURIComponent(payload.username)}`, {
    method: "PUT",
    body: JSON.stringify({ status: "OFF" })
  });
  if (!isResponseOk(body)) {
    throw new Error(body.message || "Gagal logout user");
  }
  return pickData(body);
}
const errorResponse$1 = (error) => ({
  success: false,
  message: error instanceof Error ? error.message : String(error)
});
function registerPenggunaIpcHandlers() {
  electron.ipcMain.handle("db:login", async (_event, payload) => {
    try {
      const user = await loginUser(payload);
      if (!user) {
        return {
          success: false,
          message: "Username, password, atau divisi tidak cocok."
        };
      }
      return { success: true, user };
    } catch (error) {
      return errorResponse$1(error);
    }
  });
  electron.ipcMain.handle("db:userHints", async () => {
    try {
      const hints = await fetchUserHints();
      return { success: true, hints };
    } catch (error) {
      return errorResponse$1(error);
    }
  });
  electron.ipcMain.handle("db:createPengguna", async (_event, payload) => {
    try {
      const user = await createUser(payload);
      return { success: true, data: user, message: "User berhasil dibuat" };
    } catch (error) {
      return errorResponse$1(error);
    }
  });
  electron.ipcMain.handle("db:changePenggunaPassword", async (_event, payload) => {
    try {
      const user = await changePassword(payload);
      return { success: true, data: user, message: "Password berhasil diubah" };
    } catch (error) {
      return errorResponse$1(error);
    }
  });
  electron.ipcMain.handle("db:logoutPengguna", async (_event, payload) => {
    try {
      const user = await logoutUser(payload);
      return { success: true, data: user, message: "Logout berhasil" };
    } catch (error) {
      return errorResponse$1(error);
    }
  });
  electron.ipcMain.handle("db:listPengguna", async () => {
    try {
      const users = await listUsers();
      return { success: true, rows: users };
    } catch (error) {
      return errorResponse$1(error);
    }
  });
}
const errorResponse = (error) => ({
  success: false,
  message: error instanceof Error ? error.message : String(error)
});
function registerReportsIpcHandlers() {
  electron.ipcMain.handle("report:businessvisitor", async (_event, filter) => {
    try {
      const data = await reportBusinessVisitor(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:labelvisitor:pdf", async (_event, filter) => {
    try {
      const data = await renderLabelVisitorPdf(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:labelvisitor:excel", async (_event, filter) => {
    try {
      const data = await renderLabelVisitorExcel(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:labelvisitor:word", async (_event, filter) => {
    try {
      const data = await renderLabelVisitorWord(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:labelgover:pdf", async (_event, filter) => {
    try {
      const data = await renderLabelGoverPdf(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:labelgover:excel", async (_event, filter) => {
    try {
      const data = await renderLabelGoverExcel(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:labelgover:word", async (_event, filter) => {
    try {
      const data = await renderLabelGoverWord(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:perusahaan:pdf", async (_event, filter) => {
    try {
      const data = await renderReportPerusahaanPdf(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:perusahaan:excel", async (_event, filter) => {
    try {
      const data = await renderReportPerusahaanExcel(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:perusahaan:word", async (_event, filter) => {
    try {
      const data = await renderReportPerusahaanWord(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:government:pdf", async (_event, filter) => {
    try {
      const data = await renderReportGovernmentPdf(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:government:excel", async (_event, filter) => {
    try {
      const data = await renderReportGovernmentExcel(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:government:word", async (_event, filter) => {
    try {
      const data = await renderReportGovernmentWord(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:jumlah-perusahaan:pdf", async (_event, filter) => {
    try {
      const data = await renderReportJumlahPerusahaanPdf(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:jumlah-perusahaan:excel", async (_event, filter) => {
    try {
      const data = await renderReportJumlahPerusahaanExcel(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:jumlah-perusahaan:word", async (_event, filter) => {
    try {
      const data = await renderReportJumlahPerusahaanWord(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:jumlah-government:pdf", async (_event, filter) => {
    try {
      const data = await renderReportJumlahGovernmentPdf(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:jumlah-government:excel", async (_event, filter) => {
    try {
      const data = await renderReportJumlahGovernmentExcel(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:jumlah-government:word", async (_event, filter) => {
    try {
      const data = await renderReportJumlahGovernmentWord(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:labelvisitor:export-save", async (_event, filter) => {
    try {
      const { canceled, filePath } = await electron.dialog.showSaveDialog({
        title: "Simpan Label Perusahaan",
        defaultPath: "print-label-perusahaan.docx",
        filters: [
          { name: "Microsoft Word (*.docx)", extensions: ["docx"] },
          { name: "Microsoft Word 97-2003 (*.doc)", extensions: ["doc"] },
          { name: "Microsoft Excel (*.xlsx)", extensions: ["xlsx"] },
          { name: "Microsoft Excel 97-2003 (*.xls)", extensions: ["xls"] },
          { name: "PDF", extensions: ["pdf"] }
        ],
        properties: ["createDirectory", "showOverwriteConfirmation"]
      });
      if (canceled || !filePath) return { success: false, canceled: true };
      const ext = path.extname(filePath).toLowerCase();
      let payload;
      if (ext === ".xlsx" || ext === ".xls") {
        payload = await renderLabelVisitorExcel(filter);
      } else if (ext === ".docx" || ext === ".doc") {
        payload = await renderLabelVisitorWord(filter);
      } else {
        payload = await renderLabelVisitorPdf(filter);
      }
      const contentType = ext === ".doc" ? "application/msword" : ext === ".xls" ? "application/vnd.ms-excel" : payload.contentType;
      await fs$1.writeFile(filePath, payload.buffer);
      return { success: true, path: filePath, filename: path.basename(filePath), contentType };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:labelgover:export-save", async (_event, filter) => {
    try {
      const { canceled, filePath } = await electron.dialog.showSaveDialog({
        title: "Simpan Label Government",
        defaultPath: "print-label-government.docx",
        filters: [
          { name: "Microsoft Word (*.docx)", extensions: ["docx"] },
          { name: "Microsoft Word 97-2003 (*.doc)", extensions: ["doc"] },
          { name: "Microsoft Excel (*.xlsx)", extensions: ["xlsx"] },
          { name: "Microsoft Excel 97-2003 (*.xls)", extensions: ["xls"] },
          { name: "PDF", extensions: ["pdf"] }
        ],
        properties: ["createDirectory", "showOverwriteConfirmation"]
      });
      if (canceled || !filePath) return { success: false, canceled: true };
      const ext = path.extname(filePath).toLowerCase();
      let payload;
      if (ext === ".xlsx" || ext === ".xls") {
        payload = await renderLabelGoverExcel(filter);
      } else if (ext === ".docx" || ext === ".doc") {
        payload = await renderLabelGoverWord(filter);
      } else {
        payload = await renderLabelGoverPdf(filter);
      }
      const contentType = ext === ".doc" ? "application/msword" : ext === ".xls" ? "application/vnd.ms-excel" : payload.contentType;
      await fs$1.writeFile(filePath, payload.buffer);
      return { success: true, path: filePath, filename: path.basename(filePath), contentType };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:perusahaan:export-save", async (_event, filter) => {
    try {
      const { canceled, filePath } = await electron.dialog.showSaveDialog({
        title: "Simpan Report Perusahaan",
        defaultPath: "report-perusahaan.docx",
        filters: [
          { name: "Microsoft Word (*.docx)", extensions: ["docx"] },
          { name: "Microsoft Word 97-2003 (*.doc)", extensions: ["doc"] },
          { name: "Microsoft Excel (*.xlsx)", extensions: ["xlsx"] },
          { name: "Microsoft Excel 97-2003 (*.xls)", extensions: ["xls"] },
          { name: "PDF", extensions: ["pdf"] }
        ],
        properties: ["createDirectory", "showOverwriteConfirmation"]
      });
      if (canceled || !filePath) return { success: false, canceled: true };
      const ext = path.extname(filePath).toLowerCase();
      let payload;
      if (ext === ".xlsx" || ext === ".xls") {
        payload = await renderReportPerusahaanExcel(filter);
      } else if (ext === ".docx" || ext === ".doc") {
        payload = await renderReportPerusahaanWord(filter);
      } else {
        payload = await renderReportPerusahaanPdf(filter);
      }
      const contentType = ext === ".doc" ? "application/msword" : ext === ".xls" ? "application/vnd.ms-excel" : payload.contentType;
      await fs$1.writeFile(filePath, payload.buffer);
      return { success: true, path: filePath, filename: path.basename(filePath), contentType };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:government:export-save", async (_event, filter) => {
    try {
      const { canceled, filePath } = await electron.dialog.showSaveDialog({
        title: "Simpan Report Government",
        defaultPath: "report-government.docx",
        filters: [
          { name: "Microsoft Word (*.docx)", extensions: ["docx"] },
          { name: "Microsoft Word 97-2003 (*.doc)", extensions: ["doc"] },
          { name: "Microsoft Excel (*.xlsx)", extensions: ["xlsx"] },
          { name: "Microsoft Excel 97-2003 (*.xls)", extensions: ["xls"] },
          { name: "PDF", extensions: ["pdf"] }
        ],
        properties: ["createDirectory", "showOverwriteConfirmation"]
      });
      if (canceled || !filePath) return { success: false, canceled: true };
      const ext = path.extname(filePath).toLowerCase();
      let payload;
      if (ext === ".xlsx" || ext === ".xls") {
        payload = await renderReportGovernmentExcel(filter);
      } else if (ext === ".docx" || ext === ".doc") {
        payload = await renderReportGovernmentWord(filter);
      } else {
        payload = await renderReportGovernmentPdf(filter);
      }
      const contentType = ext === ".doc" ? "application/msword" : ext === ".xls" ? "application/vnd.ms-excel" : payload.contentType;
      await fs$1.writeFile(filePath, payload.buffer);
      return { success: true, path: filePath, filename: path.basename(filePath), contentType };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:jumlah-perusahaan:export-save", async (_event, filter) => {
    try {
      const { canceled, filePath } = await electron.dialog.showSaveDialog({
        title: "Simpan Report Jumlah Perusahaan",
        defaultPath: "report-jumlah-perusahaan.docx",
        filters: [
          { name: "Microsoft Word (*.docx)", extensions: ["docx"] },
          { name: "Microsoft Word 97-2003 (*.doc)", extensions: ["doc"] },
          { name: "Microsoft Excel (*.xlsx)", extensions: ["xlsx"] },
          { name: "Microsoft Excel 97-2003 (*.xls)", extensions: ["xls"] },
          { name: "PDF", extensions: ["pdf"] }
        ],
        properties: ["createDirectory", "showOverwriteConfirmation"]
      });
      if (canceled || !filePath) return { success: false, canceled: true };
      const ext = path.extname(filePath).toLowerCase();
      let payload;
      if (ext === ".xlsx" || ext === ".xls") {
        payload = await renderReportJumlahPerusahaanExcel(filter);
      } else if (ext === ".docx" || ext === ".doc") {
        payload = await renderReportJumlahPerusahaanWord(filter);
      } else {
        payload = await renderReportJumlahPerusahaanPdf(filter);
      }
      const contentType = ext === ".doc" ? "application/msword" : ext === ".xls" ? "application/vnd.ms-excel" : payload.contentType;
      await fs$1.writeFile(filePath, payload.buffer);
      return { success: true, path: filePath, filename: path.basename(filePath), contentType };
    } catch (error) {
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("report:jumlah-government:export-save", async (_event, filter) => {
    try {
      const { canceled, filePath } = await electron.dialog.showSaveDialog({
        title: "Simpan Report Jumlah Government",
        defaultPath: "report-jumlah-government.docx",
        filters: [
          { name: "Microsoft Word (*.docx)", extensions: ["docx"] },
          { name: "Microsoft Word 97-2003 (*.doc)", extensions: ["doc"] },
          { name: "Microsoft Excel (*.xlsx)", extensions: ["xlsx"] },
          { name: "Microsoft Excel 97-2003 (*.xls)", extensions: ["xls"] },
          { name: "PDF", extensions: ["pdf"] }
        ],
        properties: ["createDirectory", "showOverwriteConfirmation"]
      });
      if (canceled || !filePath) return { success: false, canceled: true };
      const ext = path.extname(filePath).toLowerCase();
      let payload;
      if (ext === ".xlsx" || ext === ".xls") {
        payload = await renderReportJumlahGovernmentExcel(filter);
      } else if (ext === ".docx" || ext === ".doc") {
        payload = await renderReportJumlahGovernmentWord(filter);
      } else {
        payload = await renderReportJumlahGovernmentPdf(filter);
      }
      const contentType = ext === ".doc" ? "application/msword" : ext === ".xls" ? "application/vnd.ms-excel" : payload.contentType;
      await fs$1.writeFile(filePath, payload.buffer);
      return { success: true, path: filePath, filename: path.basename(filePath), contentType };
    } catch (error) {
      return errorResponse(error);
    }
  });
}
const __dirname$1 = path.dirname(node_url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("main/index.cjs", document.baseURI).href));
function resolveAppRoot() {
  const directParent = path.resolve(__dirname$1, "..");
  if (path.basename(directParent) === "dist-electron") {
    return path.resolve(directParent, "..");
  }
  const electronParent = path.resolve(__dirname$1, "..", "..");
  if (path.basename(electronParent) === "electron") {
    return path.resolve(electronParent, "..");
  }
  return path.resolve(directParent);
}
const APP_ROOT = resolveAppRoot();
process.env.APP_ROOT = APP_ROOT;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(APP_ROOT, "public") : RENDERER_DIST;
const preloadCandidates = [
  path.join(MAIN_DIST, "preload/index.js"),
  path.join(MAIN_DIST, "preload/index.cjs"),
  path.join(MAIN_DIST, "preload.js"),
  path.join(MAIN_DIST, "preload.mjs"),
  path.join(__dirname$1, "..", "preload.mjs")
];
const preloadPath = preloadCandidates.find((candidate) => fs.existsSync(candidate)) ?? path.join(MAIN_DIST, "preload/index.js");
const windowConfig = {
  devServerUrl: VITE_DEV_SERVER_URL,
  rendererDist: RENDERER_DIST,
  preload: preloadPath,
  publicDir: process.env.VITE_PUBLIC ?? path.join(APP_ROOT, "public")
};
let mainWindow = null;
function createMainWindow() {
  mainWindow = createWindow(windowConfig);
  return mainWindow;
}
electron.app.whenReady().then(() => {
  registerGabungIpcHandlers();
  registerAuditIpcHandlers();
  registerPenggunaIpcHandlers();
  registerReportsIpcHandlers();
  createMainWindow();
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
    mainWindow = null;
  }
});
exports.MAIN_DIST = MAIN_DIST;
exports.RENDERER_DIST = RENDERER_DIST;
exports.VITE_DEV_SERVER_URL = VITE_DEV_SERVER_URL;
