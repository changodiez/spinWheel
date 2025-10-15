import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
    sourcemap: true
  }
})