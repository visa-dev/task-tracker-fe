import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // sockjs-client (a dependency of @stomp/stompjs' websocket fallback) references the
  // Node.js 'global' object, which only Webpack polyfills automatically - Vite doesn't.
  // Without this, the browser throws "Uncaught ReferenceError: global is not defined".
  define: {
    global: 'window',
  },
  server: {
    port: 5173,
  },
})
