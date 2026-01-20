import { app, BrowserWindow, Menu, globalShortcut, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
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

type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'not-available'
  | 'error'

const updateState: { status: UpdateStatus; message?: string } = {
  status: 'idle',
}

function createMainWindow() {
  mainWindow = createWindow(windowConfig)
  return mainWindow
}

function setupAutoUpdater() {
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('error', (err) => {
    const message = err == null ? 'unknown' : (err as Error).message
    updateState.status = 'error'
    updateState.message = message
    console.log('Auto update error:', message)
  })
  autoUpdater.on('update-available', () => {
    updateState.status = 'available'
    updateState.message = undefined
    console.log('Auto update available. Downloading in background.')
  })
  autoUpdater.on('update-not-available', () => {
    updateState.status = 'not-available'
    updateState.message = undefined
    console.log('Auto update not available.')
  })
  autoUpdater.on('download-progress', () => {
    updateState.status = 'downloading'
    updateState.message = undefined
  })
  autoUpdater.on('update-downloaded', () => {
    updateState.status = 'downloaded'
    updateState.message = undefined
    console.log('Auto update downloaded. Will install on app quit.')
  })

  updateState.status = 'checking'
  updateState.message = undefined
  autoUpdater.checkForUpdates().catch((err) => {
    updateState.status = 'error'
    console.log('Auto update check failed:', err == null ? 'unknown' : (err as Error).message)
  })

  const sixHoursMs = 6 * 60 * 60 * 1000
  setInterval(() => {
    updateState.status = 'checking'
    updateState.message = undefined
    autoUpdater.checkForUpdates().catch((err) => {
      updateState.status = 'error'
      console.log('Auto update check failed:', err == null ? 'unknown' : (err as Error).message)
    })
  }, sixHoursMs)
}

function registerAppIpcHandlers() {
  ipcMain.handle('app:getInfo', () => ({
    version: app.getVersion(),
    update: { ...updateState },
  }))
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  registerGabungIpcHandlers()
  registerAuditIpcHandlers()
  registerPenggunaIpcHandlers()
  registerReportsIpcHandlers()
  registerAppIpcHandlers()
  setupAutoUpdater()
  createMainWindow()
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow?.webContents) {
      mainWindow.webContents.toggleDevTools()
    }
  })
  globalShortcut.register('F12', () => {
    if (mainWindow?.webContents) {
      mainWindow.webContents.toggleDevTools()
    }
  })
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

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
