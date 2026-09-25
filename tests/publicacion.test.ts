// El MCP importa de `src/`, nunca al revés, y no entra al bundle de la PWA:
// Pages sólo publica `dist/`. Este test cubre las dos reglas.
import { describe, it, expect, beforeAll } from 'vitest';
import { build } from 'vite';
import { readFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const carpetaSrc = join(raiz, 'src');
const carpetaMcp = join(raiz, 'mcp');

// Un build propio del test, en una carpeta que no es `dist/` (la que
// publica Pages): así el test siempre construye lo que va a revisar, sin
// importarle si algo corrió `npm run build` antes ni pisar ese `dist/`.
const carpetaDistDeTest = join(raiz, '.vitest-dist');

function archivosDe(carpeta: string): string[] {
  const resultado: string[] = [];
  for (const nombre of readdirSync(carpeta)) {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) {
      resultado.push(...archivosDe(ruta));
    } else {
      resultado.push(ruta);
    }
  }
  return resultado;
}

// Toma cada especificador de import/export relativo (`from '...'`) de un
// archivo TypeScript, sin depender de cuántos `../` tenga.
function especificadoresRelativos(contenido: string): string[] {
  const especificadores: string[] = [];
  const patron = /\bfrom\s+['"](\.[^'"]*)['"]/g;
  let coincidencia: RegExpExecArray | null;
  while ((coincidencia = patron.exec(contenido)) !== null) {
    const grupo = coincidencia[1];
    if (grupo !== undefined) especificadores.push(grupo);
  }
  return especificadores;
}

beforeAll(async () => {
  rmSync(carpetaDistDeTest, { recursive: true, force: true });
  await build({
    root: raiz,
    logLevel: 'silent',
    build: { outDir: carpetaDistDeTest, emptyOutDir: true }
  });
}, 30000);

describe('publicación: mcp/ no se mezcla con la app', () => {
  it('ningún archivo de src/ importa de mcp/', () => {
    const infractores: string[] = [];
    for (const archivo of archivosDe(carpetaSrc)) {
      if (!archivo.endsWith('.ts')) continue;
      const contenido = readFileSync(archivo, 'utf-8');
      for (const especificador of especificadoresRelativos(contenido)) {
        const resuelto = resolve(dirname(archivo), especificador);
        if (resuelto === carpetaMcp || resuelto.startsWith(carpetaMcp + '/')) {
          infractores.push(`${archivo} -> ${especificador}`);
        }
      }
    }
    expect(infractores).toEqual([]);
  });

  it('el build no tiene código de mcp/', () => {
    const conLaMarca: string[] = [];
    for (const archivo of archivosDe(carpetaDistDeTest)) {
      const contenido = readFileSync(archivo, 'utf-8');
      if (contenido.includes('MCP-RECETARIO')) conLaMarca.push(archivo);
    }
    expect(conLaMarca).toEqual([]);
  });

  it('.gitignore excluye las credenciales del MCP', () => {
    const contenido = readFileSync(join(raiz, '.gitignore'), 'utf-8');
    expect(contenido).toContain('credentials*.json');
    expect(contenido).toContain('token*.json');
    expect(contenido).toContain('client_secret*.json');
  });
});
