import { describe, it, expect } from 'vitest';
import { crearStore } from '../src/store.js';
import { driveFalso, sheetsFalso, recetaFalsa } from './dobles.js';

describe('guardar', () => {
  it('escribe la fila del índice en el momento, sin cola', async () => {
    const sheets = sheetsFalso();
    const store = crearStore({ drive: driveFalso(), sheets });
    await store.arrancar();
    await store.cargarIndice();

    await store.guardar('f1', recetaFalsa({ titulo: 'Milanesas' }));

    expect(sheets.escrituras).toHaveLength(1);
    expect(sheets.escrituras[0]?.valores[0]).toContain('Milanesas');
  });

  it('el guardado termina recién cuando Sheets confirmó', async () => {
    const sheets = sheetsFalso();
    let confirmado = false;
    sheets.alEscribir = async () => { await Promise.resolve(); confirmado = true; };
    const store = crearStore({ drive: driveFalso(), sheets });
    await store.arrancar();
    await store.cargarIndice();

    await store.guardar('f1', recetaFalsa());
    expect(confirmado).toBe(true);
  });

  it('guardar dos veces la misma receta deja una sola fila (R2)', async () => {
    const sheets = sheetsFalso();
    const store = crearStore({ drive: driveFalso(), sheets });
    await store.arrancar();
    await store.cargarIndice();

    await store.guardar('f1', recetaFalsa({ titulo: 'A' }));
    await store.guardar('f1', recetaFalsa({ titulo: 'B' }));

    expect(store.entradas().filter(e => e.id_archivo === 'f1')).toHaveLength(1);
    expect(sheets.appends).toHaveLength(1);   // el segundo reemplaza, no agrega
  });

  it('no compara el modifiedTime remoto: pisa lo que haya', async () => {
    const drive = driveFalso({ modifiedTime: '2030-01-01T00:00:00Z' });
    const store = crearStore({ drive, sheets: sheetsFalso() });
    await store.arrancar();
    await store.cargarIndice();

    await expect(store.guardar('f1', recetaFalsa())).resolves.toBeUndefined();
  });

  it('si falla la escritura de la fila, el error sale y no queda nada encolado', async () => {
    const sheets = sheetsFalso();
    sheets.alEscribir = async () => { throw new Error('cuota'); };
    const store = crearStore({ drive: driveFalso(), sheets });
    await store.arrancar();
    await store.cargarIndice();

    await expect(store.guardar('f1', recetaFalsa())).rejects.toThrow();
    expect(store).not.toHaveProperty('flush');
  });
});
