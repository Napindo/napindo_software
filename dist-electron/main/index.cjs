"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const node_url = require("node:url");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
function createWindow(options) {
  const window = new electron.BrowserWindow({
    icon: path.join(options.publicDir, "electron-vite.svg"),
    webPreferences: {
      preload: options.preload
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
    window.webContents.openDevTools({ mode: "detach" });
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
async function reportLabelVisitor(filter) {
  const { body } = await apiFetch("/report/labelvisitor", {
    method: "POST",
    body: JSON.stringify(filter)
  });
  if (!body.success) throw new Error(body.message);
  return body.data;
}
async function reportLabelGover(filter) {
  const { body } = await apiFetch("/report/labelgover", {
    method: "POST",
    body: JSON.stringify(filter)
  });
  if (!body.success) throw new Error(body.message);
  return body.data;
}
const errorResponse$1 = (error) => ({
  success: false,
  message: error instanceof Error ? error.message : String(error)
});
function registerGabungIpcHandlers() {
  electron.ipcMain.handle("db:testConnection", async () => {
    try {
      const result = await testConnection();
      return { ...result };
    } catch (error) {
      return errorResponse$1(error);
    }
  });
  electron.ipcMain.handle("db:fetchTableData", async (_event, tableName) => {
    try {
      const rows = await fetchTopRows(tableName);
      return { success: true, rows };
    } catch (error) {
      return errorResponse$1(error);
    }
  });
  electron.ipcMain.handle("db:fetchExhibitors", async (_event, segment, limit = 200, person = "exhibitor") => {
    try {
      const rows = await fetchExhibitorsBySegment(segment, limit, person);
      return { success: true, rows };
    } catch (error) {
      return errorResponse$1(error);
    }
  });
  electron.ipcMain.handle("db:findCompany", async (_event, company) => {
    try {
      const rows = await findCompanyByName(company);
      return { success: true, rows };
    } catch (error) {
      return errorResponse$1(error);
    }
  });
  electron.ipcMain.handle("db:saveAddData", async (_event, payload) => {
    try {
      const result = await saveAddData(payload);
      return { success: true, data: result };
    } catch (error) {
      return errorResponse$1(error);
    }
  });
  electron.ipcMain.handle("db:updateAddData", async (_event, id, payload) => {
    try {
      const result = await updateAddData(id, payload);
      return { success: true, data: result };
    } catch (error) {
      return errorResponse$1(error);
    }
  });
  electron.ipcMain.handle("db:deleteAddData", async (_event, ids) => {
    try {
      const result = await deleteAddData(ids);
      return { success: true, data: result };
    } catch (error) {
      return errorResponse$1(error);
    }
  });
  electron.ipcMain.handle("report:labelvisitor", async (_event, filter) => {
    try {
      const data = await reportLabelVisitor(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse$1(error);
    }
  });
  electron.ipcMain.handle("report:labelgover", async (_event, filter) => {
    try {
      const data = await reportLabelGover(filter);
      return { success: true, data };
    } catch (error) {
      return errorResponse$1(error);
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
const errorResponse = (error) => ({
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
      return errorResponse(error);
    }
  });
  electron.ipcMain.handle("db:userHints", async () => {
    try {
      const hints = await fetchUserHints();
      return { success: true, hints };
    } catch (error) {
      return errorResponse(error);
    }
  });
}
function registerReportsIpcHandlers() {
  electron.ipcMain.handle("report:businessvisitor", async () => ({
    success: false,
    message: "Not implemented yet."
  }));
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
