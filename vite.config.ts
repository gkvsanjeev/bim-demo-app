import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@arcgis/core', '@arcgis/map-components', '@arcgis/charts-components'],
  },
})
