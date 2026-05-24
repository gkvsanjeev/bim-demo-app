import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createWriteStream, mkdirSync } from 'fs'
import { join } from 'path'
import type { Plugin } from 'vite'

// Dev-only middleware: accepts POST /upload, writes to public/uploads/<filename>
function uploadPlugin(): Plugin {
  return {
    name: 'bim-upload',
    configureServer(server) {
      server.middlewares.use('/upload', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }
        const raw = (req.headers['x-filename'] as string | undefined) ?? 'upload.zip'
        // Sanitise: keep only safe chars to prevent path traversal
        const filename = raw.replace(/[^a-zA-Z0-9._-]/g, '_')
        const uploadsDir = join(process.cwd(), 'public', 'uploads')
        mkdirSync(uploadsDir, { recursive: true })
        const dest = createWriteStream(join(uploadsDir, filename))
        req.pipe(dest)
        dest.on('finish', () => {
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ path: `/uploads/${filename}` }))
        })
        dest.on('error', () => {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Write failed' }))
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), uploadPlugin()],
  optimizeDeps: {
    exclude: ['@arcgis/core', '@arcgis/map-components', '@arcgis/charts-components', '@esri/calcite-components'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
