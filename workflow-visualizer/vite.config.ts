import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    open: true,
    fs: {
      // Allow serving files from parent directory (for workflow files)
      allow: ['..', '../..']
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  // Configure static file serving
  publicDir: 'public',
  // Enable raw imports for YAML files
  assetsInclude: ['**/*.yaml', '**/*.yml']
});
