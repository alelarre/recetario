import { describe, it, expect } from 'vitest';
import { crearBorradores } from '../src/borradores.js';
import { driveFalso, sheetsFalso } from './dobles.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';

/**
 * Por defecto la planilla ya existe: crear la planilla es un caso aparte y lo
 * prueba su propio test, no el de todos los demás.
 */
const armar = (filas: string[][] = []) => {
  const drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
    { id: 'b1', name: '_borradores', mimeType: PLANILLA, parents: ['raiz'] }
  ]);
  const sheets = sheetsFalso();
  sheets.crearPlanilla('b1', ['borradores']);
  sheets.cargar('b1', 'borradores', [['id', 'titulo', 'fuente', 'capturado', 'nota'], ...filas]);
  return { drive, sheets, bor: crearBorradores({ drive, sheets, raizId: 'raiz' }) };
};

describe('borradores', () => {
  it('crea la planilla la primera vez, como hace con el índice', async () => {
    const drive = driveFalso([{ id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] }]);
    const sheets = sheetsFalso();
    const bor = crearBorradores({ drive, sheets, raizId: 'raiz' });

    await bor.listar();

    const creadas = await drive.buscarPorNombre('_borradores', 'raiz');
    expect(creadas).toHaveLength(1);
    expect(await sheets.leer(creadas[0]?.id ?? '', 'borradores!A1:E1'))
      .toEqual([['id', 'titulo', 'fuente', 'capturado', 'nota']]);
  });

  it('si algo falla después de crear el archivo, no deja una planilla a medio hacer', async () => {
    const drive = driveFalso([{ id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] }]);
    const sheets = sheetsFalso();
    sheets.alEscribir = async () => { throw new Error('red'); };
    const bor = crearBorradores({ drive, sheets, raizId: 'raiz' });

    await expect(bor.listar()).rejects.toThrow('red');
    expect(await drive.buscarPorNombre('_borradores', 'raiz')).toHaveLength(0);
  });

  it('lista lo más viejo primero', async () => {
    const { bor } = armar([
      ['b2', 'Reel de focaccia', 'https://x/2', '2026-09-06T10:00:00Z'],
      ['b1', 'Fondue de queso', 'libro de fondues, p. 12', '2026-09-01T10:00:00Z']
    ]);

    const lista = await bor.listar();

    expect(lista.map(b => b.id)).toEqual(['b1', 'b2']);
    expect(lista[0]).toMatchObject({ titulo: 'Fondue de queso', fuente: 'libro de fondues, p. 12' });
  });

  it('agregar escribe una fila y no reescribe la planilla', async () => {
    const { sheets, bor } = armar();

    await bor.agregar({ titulo: 'Rabas', fuente: 'https://x/3' });

    expect(sheets.appends).toHaveLength(1);
    // El doble anota el append en `escrituras` también: que no haya ninguna
    // otra es lo que dice que la planilla no se reescribió entera.
    expect(sheets.escrituras).toHaveLength(1);
    expect(sheets.appends[0]?.valores[0]?.slice(1, 3)).toEqual(['Rabas', 'https://x/3']);
  });

  it('la nota es texto libre y opcional, y viaja en su columna', async () => {
    const { sheets, bor } = armar();
    const b = await bor.agregar({ titulo: 'Focaccia', fuente: 'https://x/1', nota: 'sin lactosa' });
    expect(b.nota).toBe('sin lactosa');
    expect(sheets.appends[0]?.valores[0]?.[4]).toBe('sin lactosa');
    expect((await bor.listar())[0]?.nota).toBe('sin lactosa');
  });

  it('una planilla escrita antes de la nota se lee igual: la celda falta', async () => {
    const { sheets, bor } = armar();
    // Cuatro columnas, como la planilla que ya existe en Drive.
    sheets.cargar('b1', 'borradores', [
      ['id', 'titulo', 'fuente', 'capturado'],
      ['b1', 'Fondue', 'libro, p. 12', '2026-09-01T10:00:00Z']
    ]);
    expect((await bor.listar())[0]).toMatchObject({ titulo: 'Fondue', nota: '' });
  });

  it('cada borrador tiene un id propio que no depende de su posición', async () => {
    const { bor } = armar();
    const a = await bor.agregar({ titulo: 'A', fuente: '' });
    const b = await bor.agregar({ titulo: 'B', fuente: '' });
    expect(a.id).not.toBe(b.id);
  });

  it('lo agregado se lista', async () => {
    const { bor } = armar();
    const a = await bor.agregar({ titulo: 'Rabas', fuente: 'https://x/3' });
    expect((await bor.listar()).map(b => b.id)).toEqual([a.id]);
  });

  it('descartar borra una fila', async () => {
    const { sheets, bor } = armar([['b1', 'A', '', '2026-09-01T10:00:00Z']]);

    await bor.descartar('b1');

    expect(sheets.filasBorradas).toEqual([{ id: 'b1', hoja: 'borradores', fila: 2 }]);
    expect(await bor.listar()).toEqual([]);
  });

  it('descartar un borrador que ya no está no es un error', async () => {
    const { sheets, bor } = armar();
    await expect(bor.descartar('inexistente')).resolves.toBeUndefined();
    expect(sheets.filasBorradas).toEqual([]);
  });

  it('editar el título reescribe solo esa fila', async () => {
    const { sheets, bor } = armar([
      ['b1', 'A', 'https://x/1', '2026-09-01T10:00:00Z'],
      ['b2', 'B', '', '2026-09-02T10:00:00Z']
    ]);

    await bor.editarTitulo('b1', 'Anchoítas');

    expect(sheets.escrituras).toHaveLength(1);
    expect(sheets.escrituras[0]?.valores[0])
      .toEqual(['b1', 'Anchoítas', 'https://x/1', '2026-09-01T10:00:00Z', '']);
    expect((await bor.listar()).map(b => b.titulo)).toEqual(['Anchoítas', 'B']);
  });

  it('editar el título de un borrador que ya no está no es un error', async () => {
    const { sheets, bor } = armar();
    await expect(bor.editarTitulo('inexistente', 'X')).resolves.toBeUndefined();
    expect(sheets.escrituras).toHaveLength(0);
  });
});
