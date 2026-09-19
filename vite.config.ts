import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // Polyfill process for browser
        'process.env': {},
        'global': 'window',
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          // Node.js polyfills
          buffer: 'buffer',
          process: 'process/browser',
          stream: 'stream-browserify',
          util: 'util',
          events: 'events',
        }
      },
      optimizeDeps: {
        esbuildOptions: {
          // Node.js global to browser globalThis
          define: {
            global: 'globalThis'
          }
        }
      }
    };
});
