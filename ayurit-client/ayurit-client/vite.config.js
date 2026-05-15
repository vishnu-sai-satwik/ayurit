import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4002',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        // Proxy WebSocket connections as well (for Socket.io)
        ws: true,
      },
      '/socket.io': {
        target: 'http://localhost:4002',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
})
