import { NOMBRE_RAIZ, NOMBRE_INDICE, NOMBRE_FOTOS, SCHEMA_VERSION } from './config.js';
import { COLUMNAS, entradaDesdeFila } from './catalogo.js';
import { HOJA_RECETAS, HOJA_META } from './sheets.js';

const CATEGORIA_RAIZ = 'Sin categorizar';

export function crearStore({ drive, sheets, cache }) {
  const ctx = { raizId: null, indiceId: null, fotosId: null, categorias: [], carpetas: new Map(), soloLectura: false };

  async function leerMeta() {
    const filas = await sheets.leer(ctx.indiceId, `${HOJA_META}!A1:B20`);
    return Object.fromEntries(filas.map(f => [f[0], f[1]]));
  }

  async function crearPlanilla() {
    const archivo = await drive.crear({
      nombre: NOMBRE_INDICE, padre: ctx.raizId,
      mime: 'application/vnd.google-apps.spreadsheet'
    });
    await sheets.escribir(archivo.id, `${HOJA_RECETAS}!A1:${String.fromCharCode(64 + COLUMNAS.length)}1`, [COLUMNAS]);
    await sheets.agregarHoja(archivo.id, HOJA_META);
    await sheets.escribir(archivo.id, `${HOJA_META}!A1:B3`, [
      ['schemaVersion', String(SCHEMA_VERSION)],
      ['changesPageToken', ''],
      ['ultima_reconstruccion', '']
    ]);
    return archivo.id;
  }

  async function arrancar() {
    const avisos = [];

    let raices;
    try {
      raices = await drive.buscarPorNombre(NOMBRE_RAIZ);
    } catch (e) {
      // "No la encontré" no es "no existe": nunca se crea nada tras un fallo (§5.1).
      ctx.soloLectura = true;
      return { estado: 'solo-lectura', motivo: e.message, avisos };
    }

    if (raices.length === 0) return { estado: 'falta-estructura', avisos };
    if (raices.length > 1) return { estado: 'elegir-carpeta', candidatas: raices, avisos };
    ctx.raizId = raices[0].id;

    let subcarpetas;
    try {
      subcarpetas = await drive.listarCarpetas(ctx.raizId);
    } catch (e) {
      ctx.soloLectura = true;
      return { estado: 'solo-lectura', motivo: e.message, avisos };
    }
    ctx.categorias = subcarpetas
      .filter(c => !c.name.startsWith('_'))
      .map(c => ({ id: c.id, nombre: c.name }));
    ctx.fotosId = subcarpetas.find(c => c.name === NOMBRE_FOTOS)?.id ?? null;
    ctx.carpetas = new Map([
      [ctx.raizId, CATEGORIA_RAIZ],
      ...ctx.categorias.map(c => [c.id, c.nombre])
    ]);

    let planillas;
    try {
      planillas = await drive.buscarPorNombre(NOMBRE_INDICE, ctx.raizId);
    } catch (e) {
      ctx.soloLectura = true;
      return { estado: 'solo-lectura', motivo: e.message, avisos };
    }

    let reconstruir = false;
    if (planillas.length === 0) {
      ctx.indiceId = await crearPlanilla();
      reconstruir = true;
    } else {
      if (planillas.length > 1) avisos.push('indice-duplicado');
      const ordenadas = [...planillas].sort((a, b) => Date.parse(b.modifiedTime ?? 0) - Date.parse(a.modifiedTime ?? 0));
      ctx.indiceId = ordenadas[0].id;
      const meta = await leerMeta();
      if (Number(meta.schemaVersion) !== SCHEMA_VERSION) reconstruir = true;
      if (meta.reconstruccion_en_curso) reconstruir = true;
    }

    return {
      estado: 'listo', raizId: ctx.raizId, indiceId: ctx.indiceId,
      categorias: ctx.categorias, reconstruir, avisos
    };
  }

  return { arrancar, _ctx: ctx };
}
