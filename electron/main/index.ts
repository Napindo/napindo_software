import { app, BrowserWindow } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createWindow } from './createWindow.js'
import { registerGabungIpcHandlers } from './ipc/gabung.ipc.js'
import { registerAuditIpcHandlers } from './ipc/audit.ipc.js'
import { registerPenggunaIpcHandlers } from './ipc/pengguna.ipc.js'
import { registerReportsIpcHandlers } from './ipc/reports.ipc.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function resolveAppRoot() {
  const directParent = path.resolve(__dirname, '..')
  if (path.basename(directParent) === 'dist-electron') {
    return path.resolve(directParent, '..')
  }

  const electronParent = path.resolve(__dirname, '..', '..')
  if (path.basename(electronParent) === 'electron') {
    return path.resolve(electronParent, '..')
  }

  return path.resolve(directParent)
}

const APP_ROOT = resolveAppRoot()
process.env.APP_ROOT = APP_ROOT

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(APP_ROOT, 'public')
  : RENDERER_DIST

const preloadCandidates = [
  path.join(MAIN_DIST, 'preload/index.js'),
  path.join(MAIN_DIST, 'preload/index.cjs'),
  path.join(MAIN_DIST, 'preload.js'),
  path.join(MAIN_DIST, 'preload.mjs'),
  path.join(__dirname, '..', 'preload.mjs'),
]

const preloadPath =
  preloadCandidates.find((candidate) => fs.existsSync(candidate)) ??
  path.join(MAIN_DIST, 'preload/index.js')

const windowConfig = {
  devServerUrl: VITE_DEV_SERVER_URL,
  rendererDist: RENDERER_DIST,
  preload: preloadPath,
  publicDir: process.env.VITE_PUBLIC ?? path.join(APP_ROOT, 'public'),
}

let mainWindow: BrowserWindow | null = null

function createMainWindow() {
  mainWindow = createWindow(windowConfig)
  return mainWindow
}

app.whenReady().then(() => {
  registerGabungIpcHandlers()
  registerAuditIpcHandlers()
  registerPenggunaIpcHandlers()
  registerReportsIpcHandlers()
  createMainWindow()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    mainWindow = null
  }
})
