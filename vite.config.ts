// El defineConfig sale de vitest/config y no de vite: la sección `test` es de
// Vitest, y con el de Vite queda fuera del tipo (no se valida nada de lo que
// haya adentro).
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // GitHub Pages sirve el sitio bajo /recetario/
  base: '/recetario/',
  server: {
    port: 8080,
  },
  test: { environment: 'node' }
});
