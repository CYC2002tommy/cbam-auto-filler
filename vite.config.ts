import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    base: './',
    server: {
        port: 3000,
        host: '0.0.0.0',
    },
    plugins: [react(), tailwindcss()],
    // The .xlsx template is bundled as an asset and fetched at export time.
    assetsInclude: ['**/*.xlsx'],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
});
