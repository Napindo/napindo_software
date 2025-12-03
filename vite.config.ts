import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main/index.ts',
        vite: {
          build: {
            lib: {
              entry: 'electron/main/index.ts',
              formats: ['cjs'],
              fileName: () => 'main/index',
            },
            rollupOptions: {
              output: {
                entryFileNames: 'main/index.cjs',
                format: 'cjs',
              },
            },
            outDir: 'dist-electron',
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload/index.ts'),
        vite: {
          build: {
            rollupOptions: {
              input: path.join(__dirname, 'electron/preload/index.ts'),
              output: {
                entryFileNames: 'preload/index.cjs',
              },
            },
            outDir: 'dist-electron',
          },
        },
      },
      // Ployfill the Electron and Node.js API for Renderer process.
      // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
      // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
      renderer: process.env.NODE_ENV === 'test'
        // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
        ? undefined
        : {},
    }),
  ],
})
