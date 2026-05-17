import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// vite.config.js is in src/ alongside index.html (Vite's expected location).
// Builds output to ../dist (the repo's top-level dist/ folder).
export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    target: 'esnext',
    outDir: '../dist',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
