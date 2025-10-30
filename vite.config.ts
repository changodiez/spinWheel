import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Detecta si estás en modo producción
const isProduction = process.env.NODE_ENV === 'production'

// Configuración dinámica de base:
// - Desarrollo: '/'
//– Producción: '/spinWheel/' (puedes cambiar según tu subdirectorio)
const basePath = isProduction ? '/spinWheel/' : '/'

export default defineConfig({
  plugins: [react()],

  base: basePath,

  server: {
    host: true,       // Escucha en todas las interfaces
    port: 3000,
    hmr: {
      overlay: false  // Desactiva overlay de errores si molesta
    }
  },

  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html') // solo si realmente tienes admin.html
      }
    }
  },

  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },

  define: {
    'process.env': {}
  }
})
