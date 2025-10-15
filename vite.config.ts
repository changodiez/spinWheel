import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/spinWheel/',
  server: {
    host: true, // Escuchar en todas las interfaces
    port: 3000,
    hmr: {
      overlay: false // Desactiva el overlay de errores si causa problemas
    }

  },
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  },

  build: {
    outDir: 'dist',
    sourcemap: false, // Para produccion
    chunkSizeWarningLimit: 1600,
    // Agregar esta configuración para mejor manejo de rutas
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  // Configuración importante para React
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },

  define: {
    'process.env': {}
  }
})