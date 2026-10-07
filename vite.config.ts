import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    // Forwards auth calls to the Flask server so the browser sees one origin
    // and the session cookie works without extra CORS/SameSite juggling.
    proxy: {
      '/api': {
        // 127.0.0.1, not localhost: Node may resolve localhost to ::1 while Flask binds IPv4 only.
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
})
