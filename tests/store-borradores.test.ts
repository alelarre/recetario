import { describe, it, expect } from 'vitest';
import { crearStore } from '../src/store.js';
import { COLUMNAS } from '../src/catalogo.js';
import { COLUMNAS_BORRADORES, parseBorrador, serializeBorrador } from '../src/borrador.js';
import { SCHEMA_VERSION } from '../src/config.js';
import type { CopiaIndice } from '../src/indice-local.js';
import { driveFalso, sheetsFalso, indiceLocalFalso, recetaFalsa } from './dobles.js';
import type { SheetsFalso } from './dobles.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const FECHA = '2026-09-13T10:00:00.000Z';

const md = (titulo: string, capturado: string, nota = '', fuente = ''): string =>
  serializeBorrador({ titulo, fuente, capturado, nota, fotos: [] });

/**
 * Un Recetario con `_borradores/` y dos borradores: el más nuevo primero en la
 * hoja, para ver que la lista ordena. `conCarpeta: false` arma uno sin la
 * carpeta, y `hojas` elige qué hojas tiene la planilla.
 */
async function armar({
  conCarpeta = true,
  hojas = ['recetas', 'meta', 'borradores'],
  copia = null as CopiaIndice | null
} = {}) {
  const drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } },
    { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'], modifiedTime: FECHA },
    ...(conCarpeta ? [
      { id: 'bc', name: '_borradores', mimeType: CARPETA, parents: ['raiz'] },
      { id: 'b1', name: 'focaccia.md', parents: ['bc'], contenido: md('Focaccia', '2026-09-10T00:00:00.000Z', 'Con romero.', 'https://x/1') },
      { id: 'b2', name: 'rabas.md', parents: ['bc'], contenido: md('Rabas', '2026-09-01T00:00:00.000Z') }
    ] : [])
  ]);
  const sheets = sheetsFalso();
  sheets.crearPlanilla('i1', hojas);
  sheets.cargar('i1', 'recetas', [[...COLUMNAS]]);
  sheets.cargar('i1', 'meta', [
    ['schemaVersion', String(SCHEMA_VERSION)], ...(conCarpeta ? [['carpeta_borradores', 'bc']] : [])
  ]);
  if (hojas.includes('borradores')) {
    sheets.cargar('i1', 'borradores', [
      [...COLUMNAS_BORRADORES],
      ['b1', 'focaccia.md', 'Focaccia', '2026-09-10T00:00:00.000Z'],
      ['b2', 'rabas.md', 'Rabas', '2026-09-01T00:00:00.000Z']
    ]);
  }
  const lecturas: string[] = [];
  const leer = sheets.leer.bind(sheets);
  sheets.leer = async (id: string, rango: string) => { lecturas.push(rango); return leer(id, rango); };
  const indiceLocal = indiceLocalFalso(copia);
  const store = crearStore({ drive, sheets, indiceLocal });
  return { drive, sheets, indiceLocal, store, lecturas };
}

/** Cada fila de borradores de la copia apunta a la fila de la hoja donde está ese borrador. */
async function borradoresCoincidenConLaPlanilla(sheets: SheetsFalso, copia: CopiaIndice | null) {
  const hoja = await sheets.leer('i1', 'borradores!A1:D100');
  expect(copia).not.toBeNull();
  expect(copia!.borradores).toHaveLength(hoja.length - 1);
  for (const { fila, entrada } of copia!.borradores) {
    expect(hoja[fila - 1]?.[0], `fila ${fila}`).toBe(entrada.id_archivo);
  }
}

describe('los borradores al abrir', () => {
  it('se cargan de la hoja borradores, y la lista va de lo más viejo a lo más nuevo', async () => {
    const { store } = await armar();
    await store.arrancar();
    await store.cargarIndice();
    expect(store.borradores().map(b => b.titulo)).toEqual(['Rabas', 'Focaccia']);
  });

  it('entran en la copia local con su número de fila', async () => {
    const { store, sheets, indiceLocal } = await armar();
    await store.arrancar();
    await store.cargarIndice();
    await borradoresCoincidenConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('una copia que sirve trae los borradores sin leer Sheets', async () => {
    const primera = await armar();
    await primera.store.arrancar();
    await primera.store.cargarIndice();

    const segunda = await armar({ copia: primera.indiceLocal.actual() });
    await segunda.store.arrancar();
    await segunda.store.cargarIndice();

    expect(segunda.lecturas).toEqual([]);
    expect(segunda.store.borradores()).toEqual(primera.store.borradores());
  });

  it('borrador(id) lee y parsea su .md', async () => {
    const { store } = await armar();
    await store.arrancar();
    await store.cargarIndice();
    expect(await store.borrador('b1')).toEqual({
      id: 'b1', titulo: 'Focaccia', fuente: 'https://x/1',
      capturado: '2026-09-10T00:00:00.000Z', nota: 'Con romero.', fotos: []
    });
  });

  it('la carpeta _borradores no es una categoría', async () => {
    const { store } = await armar();
    await store.arrancar();
    await store.reconstruir();
    expect(store.categorias().map(c => c.nombre)).toEqual(['Carnes']);
  });

  it('crear la planilla crea también la hoja borradores con su encabezado', async () => {
    const drive = driveFalso([{ id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } }]);
    const sheets = sheetsFalso();
    const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
    await store.arrancar();
    const id = store._ctx.indiceId;
    expect((await sheets.hojas(id)).map(h => h.title)).toEqual(['recetas', 'meta', 'borradores', 'categorias']);
    expect((await sheets.leer(id, 'borradores!A1:D1'))[0]).toEqual([...COLUMNAS_BORRADORES]);
  });
});

describe('reindexar los borradores', () => {
  it('rearma la hoja borradores desde la carpeta', async () => {
    const { store, sheets, drive } = await armar();
    await store.arrancar();
    await store.cargarIndice();
    // Un borrador escrito por fuera: sólo aparece al reindexar.
    drive._store.set('b3', {
      id: 'b3', name: 'pan.md', parents: ['bc'], mimeType: 'text/markdown',
      modifiedTime: FECHA, contenido: md('Pan', '2026-09-05T00:00:00.000Z')
    });

    await store.reconstruir();

    expect(store.borradores().map(b => b.titulo)).toEqual(['Rabas', 'Pan', 'Focaccia']);
    const hoja = await sheets.leer('i1', 'borradores!A1:D100');
    expect(hoja).toHaveLength(4);
    expect(hoja.slice(1).map(f => f[0]).sort()).toEqual(['b1', 'b2', 'b3']);
  });

  it('crea la hoja borradores si la planilla no la tiene', async () => {
    const { store, sheets, indiceLocal } = await armar({ hojas: ['recetas', 'meta'] });
    await store.arrancar();
    await store.reconstruir();
    const hoja = await sheets.leer('i1', 'borradores!A1:D100');
    expect(hoja[0]).toEqual([...COLUMNAS_BORRADORES]);
    expect(hoja).toHaveLength(3);
    await borradoresCoincidenConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('un borrador sin título se saltea y se nombra en ignorados', async () => {
    const { store, drive } = await armar();
    await store.arrancar();
    drive._store.set('b9', {
      id: 'b9', name: 'suelto.md', parents: ['bc'], mimeType: 'text/markdown',
      modifiedTime: FECHA, contenido: 'sin frontmatter'
    });
    const r = await store.reconstruir();
    expect(r.ignorados).toContain('suelto.md');
    expect(store.borradores().map(b => b.id_archivo)).not.toContain('b9');
  });

  it('sin carpeta _borradores, la hoja queda vacía', async () => {
    const { store, sheets } = await armar({ conCarpeta: false });
    await store.arrancar();
    await store.reconstruir();
    expect(store.borradores()).toEqual([]);
    expect(await sheets.leer('i1', 'borradores!A1:D100')).toHaveLength(1);
  });

  it('el progreso cuenta recetas y borradores juntos', async () => {
    const { store } = await armar();
    await store.arrancar();
    const vistos: number[] = [];
    await store.reconstruir(p => vistos.push(p.total));
    expect(vistos.at(-1)).toBe(2);
  });
});

/** La app abierta, con la copia ya guardada y la fecha de `_indice` que cambiaría al escribir. */
async function abierta(opciones: Parameters<typeof armar>[0] = {}) {
  const armado = await armar(opciones);
  await armado.store.arrancar();
  await armado.store.cargarIndice();
  armado.drive._store.get('i1')!.modifiedTime = '2026-09-13T11:00:00.000Z';
  return armado;
}

describe('agregar un borrador', () => {
  it('crea el .md en _borradores con su formato, agrega la fila y deja la copia al día', async () => {
    const { store, drive, sheets, indiceLocal } = await abierta();
    const b = await store.agregarBorrador({ titulo: 'Pollo al disco', fuente: 'https://x/2', nota: 'Con cerveza.' });

    const archivo = drive._store.get(b.id)!;
    expect(archivo.parents).toEqual(['bc']);
    expect(archivo.name).toBe('pollo-al-disco.md');
    expect(parseBorrador(archivo.contenido ?? '')).toEqual({
      titulo: 'Pollo al disco', fuente: 'https://x/2', nota: 'Con cerveza.', capturado: b.capturado, fotos: []
    });
    expect(store.borradores().map(x => x.id_archivo)).toContain(b.id);
    expect(indiceLocal.actual()?.modifiedTime).toBe('2026-09-13T11:00:00.000Z');
    await borradoresCoincidenConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('sin carpeta _borradores, la crea una vez', async () => {
    const { store, drive } = await abierta({ conCarpeta: false });
    await store.agregarBorrador({ titulo: 'A', fuente: '', nota: '' });
    await store.agregarBorrador({ titulo: 'B', fuente: '', nota: '' });
    const carpetas = [...drive._store.values()].filter(a => a.name === '_borradores' && a.mimeType === CARPETA);
    expect(carpetas).toHaveLength(1);
    expect(carpetas[0]?.parents).toEqual(['raiz']);
  });

  it('un título repetido no pisa el archivo', async () => {
    const { store, drive } = await abierta();
    const b = await store.agregarBorrador({ titulo: 'Focaccia', fuente: '', nota: '' });
    expect(drive._store.get(b.id)?.name).toBe('focaccia-2.md');
  });
});

describe('editar un borrador', () => {
  it('reescribe el .md conservando capturado, y reescribe su fila', async () => {
    const { store, drive, sheets, indiceLocal } = await abierta();
    await store.editarBorrador('b1', { titulo: 'Focaccia de romero', fuente: 'https://x/9', nota: 'Otra nota.' });

    expect(parseBorrador(drive._store.get('b1')?.contenido ?? '')).toEqual({
      titulo: 'Focaccia de romero', fuente: 'https://x/9', nota: 'Otra nota.',
      capturado: '2026-09-10T00:00:00.000Z', fotos: []
    });
    expect(store.borradores().find(b => b.id_archivo === 'b1')?.titulo).toBe('Focaccia de romero');
    expect(sheets.appends).toHaveLength(0);   // reescribe, no agrega
    await borradoresCoincidenConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('un borrador que no está en el índice no es un error', async () => {
    const { store } = await abierta();
    await expect(store.editarBorrador('fantasma', { titulo: 'A', fuente: '', nota: '' })).resolves.toBeUndefined();
  });
});

describe('descartar un borrador', () => {
  it('manda el .md a la papelera, borra la fila y corre las siguientes en la copia', async () => {
    const { store, drive, sheets, indiceLocal } = await abierta();
    await store.descartarBorrador('b1');

    expect(drive._store.get('b1')?.trashed).toBe(true);
    expect(store.borradores().map(b => b.id_archivo)).toEqual(['b2']);
    expect(indiceLocal.actual()?.borradores).toEqual([
      { fila: 2, entrada: expect.objectContaining({ id_archivo: 'b2' }) }
    ]);
    await borradoresCoincidenConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('descartar dos veces termina bien', async () => {
    const { store } = await abierta();
    await store.descartarBorrador('b1');
    await expect(store.descartarBorrador('b1')).resolves.toBeUndefined();
  });

  it('si borrar la fila falla, reintentar la borra', async () => {
    const { store, sheets } = await abierta();
    const borrarFila = sheets.borrarFila.bind(sheets);
    let fallas = 1;
    sheets.borrarFila = async (id: string, hojaId: number, fila: number) => {
      if (fallas-- > 0) throw new Error('red');
      return borrarFila(id, hojaId, fila);
    };
    await expect(store.descartarBorrador('b1')).rejects.toThrow('red');
    await store.descartarBorrador('b1');
    expect(store.borradores().map(b => b.id_archivo)).toEqual(['b2']);
    expect(await sheets.leer('i1', 'borradores!A1:D100')).toHaveLength(2);
  });
});

describe('las fotos de un borrador', () => {
  const foto = (texto: string): Blob => new Blob([texto], { type: 'image/jpeg' });
  /** Un borrador con dos fotos al lado de su `.md`. */
  const conFotos = async () => {
    const armado = await abierta();
    armado.drive._store.set('f1', { id: 'f1', name: 'focaccia-1.jpg', parents: ['bc'], mimeType: 'image/jpeg', blob: foto('a') });
    armado.drive._store.set('f2', { id: 'f2', name: 'focaccia-2.jpg', parents: ['bc'], mimeType: 'image/jpeg', blob: foto('b') });
    armado.drive._store.get('b1')!.contenido = serializeBorrador({
      titulo: 'Focaccia', fuente: 'https://x/1', nota: 'Con romero.', capturado: '2026-09-10T00:00:00.000Z', fotos: ['f1', 'f2']
    });
    return armado;
  };

  it('agregar con fotos las sube en orden al lado del .md, y después el .md con sus ids', async () => {
    const { store, drive } = await abierta();
    const b = await store.agregarBorrador({ titulo: 'Tarta', fuente: '', nota: '', fotos: [foto('uno'), foto('dos')] });

    const creados = drive.llamadas.filter(l => l[0] === 'crear').map(l => l[1]);
    expect(creados).toEqual(['tarta-1.jpg', 'tarta-2.jpg', 'tarta.md']);
    const [id1, id2] = b.fotos;
    expect(await drive._store.get(id1!)?.blob?.text()).toBe('uno');
    expect(drive._store.get(id2!)?.parents).toEqual(['bc']);
    expect(drive._store.get(id2!)?.mimeType).toBe('image/jpeg');
    expect(parseBorrador(drive._store.get(b.id)?.contenido ?? '').fotos).toEqual([id1, id2]);
  });

  it('el reintento no vuelve a subir las fotos que ya subió', async () => {
    const { store, drive } = await abierta();
    const subidas: [number, string][] = [];
    drive.fallar('crear:tarta-2.jpg', new Error('red'));
    await expect(store.agregarBorrador(
      { titulo: 'Tarta', fuente: '', nota: '', fotos: [foto('uno'), foto('dos')] },
      (i, id) => { subidas.push([i, id]); }
    )).rejects.toThrow('red');
    expect(subidas).toHaveLength(1);

    drive.fallar('crear:tarta-2.jpg', undefined);
    const [[, id1] = [0, '']] = subidas;
    const b = await store.agregarBorrador(
      { titulo: 'Tarta', fuente: '', nota: '', fotos: [id1, foto('dos')] },
      (i, id) => { subidas.push([i, id]); }
    );

    const creados = drive.llamadas.filter(l => l[0] === 'crear').map(l => l[1]);
    expect(creados.filter(n => String(n).endsWith('.jpg'))).toEqual(['tarta-1.jpg', 'tarta-2.jpg', 'tarta-2.jpg']);
    expect(b.fotos[0]).toBe(id1);
    expect(subidas.map(([i]) => i)).toEqual([0, 1]);
  });

  it('agregar una foto la sube con el primer número libre y la suma al final del .md', async () => {
    const { store, drive } = await conFotos();
    drive._store.get('f1')!.trashed = true;   // la -1 está en la papelera: el número vuelve a estar libre
    const b = await store.agregarFotoABorrador('b1', foto('c'));

    const nueva = b.fotos[2]!;
    expect(drive._store.get(nueva)?.name).toBe('focaccia-1.jpg');
    const leido = parseBorrador(drive._store.get('b1')?.contenido ?? '');
    expect(leido.fotos).toEqual(['f1', 'f2', nueva]);
    expect(leido.nota).toBe('Con romero.');
  });

  it('con cinco fotos, agregar no sube nada', async () => {
    const { store, drive } = await abierta();
    drive._store.get('b1')!.contenido = serializeBorrador({
      titulo: 'Focaccia', fuente: '', nota: '', capturado: '', fotos: ['a', 'b', 'c', 'd', 'e']
    });
    const b = await store.agregarFotoABorrador('b1', foto('f'));
    expect(b.fotos).toHaveLength(5);
    expect(drive.llamadas.filter(l => l[0] === 'crear')).toEqual([]);
  });

  it('sacar una foto la manda a la papelera y la saca del .md', async () => {
    const { store, drive } = await conFotos();
    const b = await store.sacarFotoDeBorrador('b1', 'f1');
    expect(drive._store.get('f1')?.trashed).toBe(true);
    expect(b.fotos).toEqual(['f2']);
    expect(parseBorrador(drive._store.get('b1')?.contenido ?? '').fotos).toEqual(['f2']);
  });

  it('sacar una foto que ya no está en Drive la saca igual de la lista', async () => {
    const { store, drive } = await conFotos();
    drive._store.delete('f1');
    const b = await store.sacarFotoDeBorrador('b1', 'f1');
    expect(b.fotos).toEqual(['f2']);
  });

  it('sacar un id que no es foto del borrador no toca nada', async () => {
    const { store, drive } = await conFotos();
    await store.sacarFotoDeBorrador('b1', 'c1');
    expect(drive._store.get('c1')?.trashed).toBeFalsy();
  });

  it('descartar manda las fotos a la papelera, y después el .md', async () => {
    const { store, drive } = await conFotos();
    drive._store.delete('f2');   // una que ya no está no es un error
    await store.descartarBorrador('b1');
    expect(drive._store.get('f1')?.trashed).toBe(true);
    expect(drive._store.get('b1')?.trashed).toBe(true);
    const papelera = drive.llamadas.filter(l => l[0] === 'borrar').map(l => l[1]);
    expect(papelera).toEqual(['f1', 'f2', 'b1']);
  });

  it('descartar con conservar no manda esas fotos a la papelera: ya pasaron a la receta', async () => {
    const { store, drive } = await conFotos();
    await store.descartarBorrador('b1', { conservar: ['f2'] });
    expect(drive._store.get('f1')?.trashed).toBe(true);
    expect(drive._store.get('f2')?.trashed).toBeFalsy();
    expect(drive._store.get('b1')?.trashed).toBe(true);
  });

  it('editar conserva las fotos', async () => {
    const { store, drive } = await conFotos();
    await store.editarBorrador('b1', { titulo: 'Focaccia', fuente: '', nota: 'Otra.' });
    expect(parseBorrador(drive._store.get('b1')?.contenido ?? '').fotos).toEqual(['f1', 'f2']);
  });

  it('el reindexado no ve las fotos: sólo los .md', async () => {
    const { store } = await conFotos();
    await store.reconstruir();
    expect(store.borradores().map(b => b.id_archivo).sort()).toEqual(['b1', 'b2']);
  });
});

describe('las recetas, con las filas generalizadas', () => {
  it('crear una receta sigue escribiendo en la hoja recetas', async () => {
    const { store, sheets } = await abierta();
    await store.crear(recetaFalsa({ titulo: 'Asado' }), { carpetaId: 'c1' });
    expect(sheets.appends.at(-1)?.hoja).toBe('recetas');
  });
});
