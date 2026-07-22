import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: new URL('./index.html', import.meta.url).pathname,
        deploy: new URL('./deploy/index.html', import.meta.url).pathname,
      },
    },
  },
});
