// El MCP importa de `src/`, nunca al revés, y no entra al bundle de la PWA:
// Pages sólo publica `dist/`. Este test cubre las dos reglas.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const carpetaSrc = join(raiz, 'src');
const carpetaMcp = join(raiz, 'mcp');
const carpetaDist = join(raiz, 'dist');

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

  it('después del build, dist/ no tiene código de mcp/', () => {
    // `npm test` corre `vite build` antes de vitest, así que dist/ está
    // recién armado. Si no existe, el build no corrió: falla en vez de
    // dar un falso verde.
    expect(existsSync(carpetaDist)).toBe(true);
    const conLaMarca: string[] = [];
    for (const archivo of archivosDe(carpetaDist)) {
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
