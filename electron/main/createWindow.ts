import { BrowserWindow } from 'electron'
import path from 'node:path'

export type CreateWindowOptions = {
  devServerUrl?: string
  rendererDist: string
  preload: string
  publicDir: string
  isDev?: boolean
}

export function createWindow(options: CreateWindowOptions) {
  const window = new BrowserWindow({
    icon: path.join(options.publicDir, 'assets', 'logo.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: options.preload,
      devTools: options.isDev ?? false,
    },
  })

  window.setMenuBarVisibility(false)

  window.webContents.on('did-finish-load', () => {
    window.webContents.send('main-process-message', new Date().toLocaleString())
  })

  window.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('Renderer failed to load', { errorCode, errorDescription, validatedURL })
  })

  if (options.devServerUrl) {
    window.loadURL(options.devServerUrl)
  } else {
    window.loadFile(path.join(options.rendererDist, 'index.html'))
  }

  return window
}
