"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const node_url = require("node:url");
const path = require("node:path");
const fs = require("node:fs");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
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
loadEnvFile(path.resolve(process.cwd(), ".env"));
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";
const API_PREFIX = process.env.API_PREFIX || "/api";
async function apiFetch(pathName, init = {}) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${API_PREFIX}${pathName}`;
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init.headers || {}
      }
    });
    const contentType = response.headers.get("content-type") || "";
    let body;
    if (contentType.includes("application/json")) {
      body = await response.json();
    } else {
      const text = await response.text();
      body = { success: false, ok: false, message: text };
    }
    return { status: response.status, body };
  } catch (err) {
    return { status: 500, body: { success: false, message: "Tidak dapat terhubung ke API" } };
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
const __dirname$1 = path.dirname(node_url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("main.cjs", document.baseURI).href));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new electron.BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
function registerDatabaseHandlers() {
  electron.ipcMain.handle("db:testConnection", async () => {
    try {
      const result = await testConnection();
      return { ...result };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  });
  electron.ipcMain.handle("db:fetchTableData", async (_event, tableName) => {
    try {
      const rows = await fetchTopRows(tableName);
      return { success: true, rows };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  });
  electron.ipcMain.handle("db:fetchExhibitors", async (_event, segment, limit = 200, person = "exhibitor") => {
    try {
      const rows = await fetchExhibitorsBySegment(segment, limit, person);
      return { success: true, rows };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  });
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
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  });
  electron.ipcMain.handle("db:userHints", async () => {
    try {
      const hints = await fetchUserHints();
      return { success: true, hints };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  });
  electron.ipcMain.handle("db:findCompany", async (_event, company) => {
    try {
      const rows = await findCompanyByName(company);
      return { success: true, rows };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  });
  electron.ipcMain.handle("db:saveAddData", async (_event, payload) => {
    try {
      const result = await saveAddData(payload);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  });
  electron.ipcMain.handle("db:updateAddData", async (_event, id, payload) => {
    try {
      const result = await updateAddData(id, payload);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  });
  electron.ipcMain.handle("db:deleteAddData", async (_event, ids) => {
    try {
      const result = await deleteAddData(ids);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  });
}
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
    win = null;
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
electron.app.whenReady().then(() => {
  registerDatabaseHandlers();
  createWindow();
});
exports.MAIN_DIST = MAIN_DIST;
exports.RENDERER_DIST = RENDERER_DIST;
exports.VITE_DEV_SERVER_URL = VITE_DEV_SERVER_URL;
