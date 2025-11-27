"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const node_url = require("node:url");
const path = require("node:path");
const fs = require("node:fs");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!key) continue;
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
      body = { success: false, message: text || `Unexpected response from API (${response.status})` };
    }
    return { status: response.status, body };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tidak dapat terhubung ke API";
    return { status: 500, body: { success: false, message } };
  }
}
async function testConnection() {
  var _a;
  const { body, status } = await apiFetch("/health");
  if (!body.success) {
    return { success: false, message: body.message || `Healthcheck gagal dengan status ${status}` };
  }
  return {
    success: true,
    serverTime: ((_a = body.data) == null ? void 0 : _a.serverTime) ?? body.data
  };
}
async function fetchTopRows(tableName, top = 10) {
  const safeName = tableName.replace(/[^\w.]/g, "");
  if (!safeName) {
    throw new Error("Nama tabel tidak valid");
  }
  const { body } = await apiFetch(`/gabung/table/${encodeURIComponent(safeName)}?limit=${top}`);
  if (!body.success) {
    throw new Error(body.message || "Gagal mengambil data tabel");
  }
  return body.data ?? [];
}
async function fetchExhibitorsBySegment(segment, limit = 200) {
  const { body } = await apiFetch(`/gabung/${segment}?limit=${limit}`);
  if (!body.success) {
    throw new Error(body.message || "Gagal memuat data exhibitor");
  }
  return body.data ?? [];
}
async function loginUser(payload) {
  var _a;
  const username = payload.username.trim();
  const password = payload.password;
  const division = (_a = payload.division) == null ? void 0 : _a.trim();
  if (!username || !password) {
    throw new Error("Username dan password wajib diisi");
  }
  const { body, status } = await apiFetch(
    "/pengguna/login",
    {
      method: "POST",
      body: JSON.stringify({ username, password, division })
    }
  );
  if (!body.success) {
    if (status === 401) {
      return null;
    }
    throw new Error(body.message || "Gagal memproses login");
  }
  return body.data ?? null;
}
async function closePool() {
}
async function fetchUserHints() {
  const { body } = await apiFetch("/pengguna/hints");
  if (!body.success) {
    throw new Error(body.message || "Gagal memuat data pengguna");
  }
  return body.data ?? { usernames: [], divisions: [] };
}
async function findCompanyByName(company) {
  const name = company.trim();
  if (!name) {
    throw new Error("Nama company wajib diisi");
  }
  const search = new URLSearchParams({ company: name });
  const { body } = await apiFetch(`/gabung/company?${search.toString()}`);
  if (!body.success) {
    throw new Error(body.message || "Gagal mencari data company");
  }
  return body.data ?? [];
}
async function saveAddData(payload) {
  const { body } = await apiFetch("/gabung", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  if (!body.success) {
    throw new Error(body.message || "Gagal menyimpan data");
  }
  return body.data ?? { success: true };
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
      return { success: false, message: error instanceof Error ? error.message : String(error) };
    }
  });
  electron.ipcMain.handle("db:fetchTableData", async (_event, tableName) => {
    try {
      const rows = await fetchTopRows(tableName);
      return { success: true, rows };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : String(error) };
    }
  });
  electron.ipcMain.handle("db:fetchExhibitors", async (_event, segment, limit = 200) => {
    try {
      const rows = await fetchExhibitorsBySegment(segment, limit);
      return { success: true, rows };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : String(error) };
    }
  });
  electron.ipcMain.handle("db:login", async (_event, payload) => {
    try {
      const user = await loginUser(payload);
      if (!user) {
        return { success: false, message: "Username, password, atau divisi tidak cocok." };
      }
      return { success: true, user };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : String(error) };
    }
  });
  electron.ipcMain.handle("db:userHints", async () => {
    try {
      const hints = await fetchUserHints();
      return { success: true, hints };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : String(error) };
    }
  });
  electron.ipcMain.handle("db:findCompany", async (_event, company) => {
    try {
      const rows = await findCompanyByName(company);
      return { success: true, rows };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : String(error) };
    }
  });
  electron.ipcMain.handle("db:saveAddData", async (_event, payload) => {
    try {
      const result = await saveAddData(payload);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : String(error) };
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
electron.app.on("before-quit", async () => {
  await closePool();
});
exports.MAIN_DIST = MAIN_DIST;
exports.RENDERER_DIST = RENDERER_DIST;
exports.VITE_DEV_SERVER_URL = VITE_DEV_SERVER_URL;
