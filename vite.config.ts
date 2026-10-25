import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gatewayTarget = env.VITE_GATEWAY_URL ?? 'http://localhost:8080';

  return {
    plugins: [react()],
    define: {
      // sockjs-client references Node's `global`, which is undefined in the browser
      global: 'globalThis',
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      host: true,
      port: 5173,
      strictPort: false,
      // Cloudflare / ngrok gửi Host header public — Vite 5.4+ chặn nếu không mở
      allowedHosts: true,
      proxy: {
        '/api': {
          target: gatewayTarget,
          changeOrigin: true,
        },
        '/ws': {
          target: gatewayTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
