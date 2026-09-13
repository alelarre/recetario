// El defineConfig sale de vitest/config y no de vite: la sección `test` es de
// Vitest, y con el de Vite queda fuera del tipo (no se valida nada de lo que
// haya adentro).
import { execSync } from 'node:child_process';
import { defineConfig } from 'vitest/config';

/**
 * El commit que se está compilando, para la versión visible (P20). En el CI lo
 * da `GITHUB_SHA`; en local, git. Sin ninguno de los dos, `dev`.
 */
function commit(): string {
  if (process.env['GITHUB_SHA']) return process.env['GITHUB_SHA'].slice(0, 7);
  try {
    return execSync('git rev-parse --short=7 HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}

export default defineConfig({
  define: {
    __COMMIT__: JSON.stringify(commit()),
    __COMPILADO__: JSON.stringify(new Date().toISOString())
  },
  // GitHub Pages sirve el sitio bajo /recetario/
  base: '/recetario/',
  server: {
    port: 8080,
  },
  test: { environment: 'node' }
});
