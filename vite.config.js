import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages sirve el sitio bajo /recetario/
  base: '/recetario/',
  test: { environment: 'node' }
});
