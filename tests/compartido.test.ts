import { describe, it, expect, vi } from 'vitest';
import { convertirBorrador, escribirRecetaAlIndice, leerReceta } from '../src/compartido.js';
import { crearStore } from '../src/store.js';
import { crearBorradores } from '../src/borradores.js';
import { driveFalso, sheetsFalso, recetaFalsa } from './dobles.js';
import { COLUMNAS } from '../src/catalogo.js';
import { SCHEMA_VERSION } from '../src/config.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';

/**
 * El store y los borradores de verdad sobre los dobles de Drive y de Sheets:
 * lo que esta capa tiene que probar es que las tres escrituras pasan, y en
 * qué orden, no que un doble del store devuelva lo que el test quiere.
 */
const armar = async ({ borradores: filas = [] as string[][] } = {}) => {
  const drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
    { id: 'c1', name: 'Pescados y mariscos', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
    { id: 'bp', name: '_borradores', mimeType: PLANILLA, parents: ['raiz'] }
  ]);
  const sheets = sheetsFalso();
  sheets.crearPlanilla('i1');
  sheets.cargar('i1', 'recetas', [[...COLUMNAS]]);
  sheets.cargar('i1', 'meta', [['schemaVersion', String(SCHEMA_VERSION)]]);
  sheets.crearPlanilla('bp', ['borradores']);
  sheets.cargar('bp', 'borradores', [['id', 'titulo', 'fuente', 'capturado'], ...filas]);

  const store = crearStore({ drive, sheets });
  await store.arrancar();
  await store.cargarIndice();
  const borradores = crearBorradores({ drive, sheets, raizId: 'raiz' });

  // El orden de las tres escrituras es parte del contrato (C01.7.1), y no se
  // ve en ningún registro del doble: se anota acá, al pasar.
  const orden: string[] = [];
  const anotar = <T extends object, K extends keyof T>(objeto: T, metodo: K, etiqueta: string) => {
    const original = objeto[metodo] as (...args: unknown[]) => unknown;
    vi.spyOn(objeto, metodo as never).mockImplementation(((...args: unknown[]) => {
      orden.push(etiqueta);
      return original.apply(objeto, args);
    }) as never);
  };
  anotar(drive, 'crear', 'crear-md');
  anotar(sheets, 'append', 'escribir-fila');
  anotar(sheets, 'borrarFila', 'borrar-borrador');

  return { drive, sheets, store, borradores, orden, deps: { store, borradores } };
};

describe('convertirBorrador', () => {
  it('escribe el .md, escribe la fila y borra el borrador, en ese orden', async () => {
    const { deps, orden } = await armar({
      borradores: [['b1', 'Rabas', 'https://x/1', '2026-09-01T10:00:00Z']]
    });

    await convertirBorrador(deps, {
      borradorId: 'b1', receta: recetaFalsa({ titulo: 'Rabas' }), carpetaId: 'c1'
    });

    expect(orden).toEqual(['crear-md', 'escribir-fila', 'borrar-borrador']);
  });

  it('la fuente del borrador pasa al frontmatter', async () => {
    const { deps, drive } = await armar({
      borradores: [['b1', 'Rabas', 'https://x/1', '2026-09-01T10:00:00Z']]
    });

    const { id } = await convertirBorrador(deps, {
      borradorId: 'b1',
      receta: recetaFalsa({ titulo: 'Rabas', fuente: 'https://x/1' }),
      carpetaId: 'c1'
    });

    expect(await drive.leerTexto(id)).toContain('fuente: https://x/1');
  });

  it('la receta queda en la categoría que le tocó, con su fila en el índice', async () => {
    const { deps, store } = await armar({
      borradores: [['b1', 'Rabas', '', '2026-09-01T10:00:00Z']]
    });

    const { id } = await convertirBorrador(deps, {
      borradorId: 'b1', receta: recetaFalsa({ titulo: 'Rabas' }), carpetaId: 'c1'
    });

    expect(store.entradas()).toHaveLength(1);
    expect(store.entradas()[0]).toMatchObject({
      id_archivo: id, titulo: 'Rabas', categoria: 'Pescados y mariscos', carpeta_id: 'c1'
    });
  });

  it('el borrador convertido deja de estar en la lista', async () => {
    const { deps, borradores } = await armar({
      borradores: [['b1', 'Rabas', '', '2026-09-01T10:00:00Z']]
    });

    await convertirBorrador(deps, {
      borradorId: 'b1', receta: recetaFalsa({ titulo: 'Rabas' }), carpetaId: 'c1'
    });

    expect(await borradores.listar()).toEqual([]);
  });

  it('si el borrador ya no existe, la operación termina bien', async () => {
    const { deps } = await armar();

    await expect(convertirBorrador(deps, {
      borradorId: 'fantasma', receta: recetaFalsa({ titulo: 'A' }), carpetaId: 'c1'
    })).resolves.toMatchObject({ id: expect.any(String) });
  });

  it('reintentar después de un fallo al borrar deja una sola fila del índice (R2)', async () => {
    const { deps, store, borradores, drive } = await armar({
      borradores: [['b1', 'Rabas', '', '2026-09-01T10:00:00Z']]
    });
    const falla = vi.spyOn(borradores, 'descartar').mockRejectedValueOnce(new Error('red'));

    await expect(convertirBorrador(deps, {
      borradorId: 'b1', receta: recetaFalsa({ titulo: 'Rabas' }), carpetaId: 'c1'
    })).rejects.toThrow('red');

    falla.mockRestore();
    await convertirBorrador(deps, {
      borradorId: 'b1', receta: recetaFalsa({ titulo: 'Rabas' }), carpetaId: 'c1'
    });

    expect(store.entradas()).toHaveLength(1);
    // Y tampoco quedó un segundo .md: el reintento reescribe el que ya estaba.
    expect(await drive.listarHijos('c1')).toHaveLength(1);
    expect(await borradores.listar()).toEqual([]);
  });
});

describe('escribirRecetaAlIndice', () => {
  it('reemplaza la fila de esa receta en vez de agregar otra (R5)', async () => {
    const { deps, store, sheets } = await armar();
    const ubicacion = {
      id: 'f1', nombre_archivo: 'f1.md', categoria: 'Pescados y mariscos',
      carpeta_id: 'c1', mtime: 0
    };

    await escribirRecetaAlIndice(deps, recetaFalsa({ titulo: 'Rabas' }), ubicacion);
    await escribirRecetaAlIndice(deps, recetaFalsa({ titulo: 'Rabas al ajo' }), ubicacion);

    await store.cargarIndice();
    expect(store.entradas()).toHaveLength(1);
    expect(store.entradas()[0]?.titulo).toBe('Rabas al ajo');
    expect(sheets.appends).toHaveLength(1);   // la segunda reemplaza
  });
});

describe('leerReceta', () => {
  it('devuelve el .md parseado', async () => {
    const { deps, drive } = await armar();
    const archivo = await drive.crear({
      nombre: 'rabas.md', padre: 'c1', contenido: '---\ntitulo: Rabas\n---\n\n## Notas\n- ojo\n'
    });

    expect(await leerReceta(deps, archivo.id)).toMatchObject({ titulo: 'Rabas', notas: '- ojo' });
  });
});
