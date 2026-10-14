import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '^/event-config\\.json(?:\\?|$)': {
        target: 'https://storage.googleapis.com', changeOrigin: true,
        rewrite: (path) => path.replace(/^\/event-config\.json/, '/katsu-map-images/app-config/events.json'),
        configure: (proxy) => proxy.on('proxyReq', (request) => {
          request.removeHeader('authorization'); request.removeHeader('cookie');
        }),
      },
    },
  },
});
