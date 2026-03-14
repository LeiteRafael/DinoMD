import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  root: 'src/web',
  plugins: [react()],
  resolve: {
    alias: [
      // Swap the Electron IPC-backed api for the browser localStorage adapter
      {
        find: /.*\/services\/api(\.js)?$/,
        replacement: resolve(__dirname, 'src/web/browserApi.js')
      },
      // Keep the @renderer alias working for any direct imports
      {
        find: '@renderer',
        replacement: resolve(__dirname, 'src/renderer/src')
      }
    ]
  },
  build: {
    outDir: resolve(__dirname, 'dist/web'),
    emptyOutDir: true
  },
  server: {
    port: 5174
  }
})
