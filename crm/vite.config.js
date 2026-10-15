import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// HouseDeal CRM dashboard. In production Express (server.cjs) serves the build from dist/.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    open: true,
    // Forward API calls to the Express backend during local development (npm run server)
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
