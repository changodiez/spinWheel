import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const isProduction = process.env.NODE_ENV === 'production'
// En producción los assets estarán bajo /spinWheel/, en dev bajo /
const basePath = isProduction ? '/spinWheel/' : '/'

export default defineConfig({
  plugins: [react()],
  base: basePath,
  build: {
    outDir: 'docs',           // carpeta que tu server sirve
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html')
      }
    }
  }
})
