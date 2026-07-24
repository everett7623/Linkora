import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'node:fs';

const adminPackage = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
) as { version?: string };
const linketryVersion = adminPackage.version ?? '0.0.0';
const basePath = process.env.VITE_LINKETRY_BASE_PATH === '/admin/' ? '/admin/' : '/';

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    {
      name: 'linketry-version-meta',
      transformIndexHtml(html) {
        return html.replace(
          '<meta charset="UTF-8" />',
          `<meta charset="UTF-8" />\n    <meta name="linketry-version" content="${linketryVersion}" />`
        );
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@linketry/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: basePath === '/admin/' ? 'dist/admin' : 'dist',
    sourcemap: true,
  },
});
