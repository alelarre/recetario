import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages sirve el sitio bajo /recetario/
  base: '/recetario/',
  server: {
    port: 8080,
  },
  test: { environment: 'node' }
});
