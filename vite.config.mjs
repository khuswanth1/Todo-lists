import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext' // Support for top-level await
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
      supported: {
        'top-level-await': true
      }
    }
  },
  esbuild: {
    supported: {
      'top-level-await': true
    }
  }
});
