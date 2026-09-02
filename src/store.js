import { NOMBRE_RAIZ, NOMBRE_INDICE, NOMBRE_FOTOS, SCHEMA_VERSION } from './config.js';
import { COLUMNAS, entradaDesdeFila, diffCambios, filaDesde } from './catalogo.js';
import { HOJA_RECETAS, HOJA_META, rangoDeFila } from './sheets.js';
import { parse, serialize, slugArchivo } from './recipe.js';

const CATEGORIA_RAIZ = 'Sin categorizar';

export function crearStore({ drive, sheets, cache }) {
  const ctx = { raizId: null, indiceId: null, fotosId: null, categorias: [], carpetas: new Map(), soloLectura: false };
  let entradas = [];
  let filas = new Map();

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

  async function guardarMeta(clave, valor) {
    const meta = await sheets.leer(ctx.indiceId, `${HOJA_META}!A1:B20`);
    const i = meta.findIndex(f => f[0] === clave);
    const fila = i >= 0 ? i + 1 : meta.length + 1;
    await sheets.escribir(ctx.indiceId, `${HOJA_META}!A${fila}:B${fila}`, [[clave, valor]]);
  }

  async function cargarIndice() {
    const crudo = await sheets.leer(ctx.indiceId, `${HOJA_RECETAS}!A1:M100000`);
    const cuerpo = crudo.slice(1);  // la fila 1 son los encabezados
    entradas = cuerpo.map(entradaDesdeFila).filter(e => e.id_archivo);
    filas = new Map(entradas.map((e, i) => [e.id_archivo, i + 2]));
    await cache.guardarIndice(entradas);
    await cache.guardarMapaFilas(filas);
    return entradas;
  }

  async function escribirFila(entrada, receta, ubicacion) {
    const fila = filaDesde(receta, ubicacion);
    const nro = filas.get(ubicacion.id);
    if (nro) await sheets.escribir(ctx.indiceId, rangoDeFila(nro), [fila]);
    else {
      await sheets.append(ctx.indiceId, HOJA_RECETAS, [fila]);
      filas.set(ubicacion.id, filas.size + 2);
    }
  }

  async function borrarDelIndice(id) {
    const nro = filas.get(id);
    if (!nro) return;
    const hojas = await sheets.hojas(ctx.indiceId);
    const hojaId = hojas.find(h => h.title === HOJA_RECETAS)?.sheetId ?? 0;
    await sheets.borrarFila(ctx.indiceId, hojaId, nro);
    filas.delete(id);
    // El corrimiento es determinístico: no hace falta releer nada (§4.3).
    for (const [otroId, otraFila] of filas) if (otraFila > nro) filas.set(otroId, otraFila - 1);
    entradas = entradas.filter(e => e.id_archivo !== id);
  }

  async function sync() {
    const meta = await leerMeta();
    let pageToken = meta.changesPageToken;
    if (!pageToken) {
      pageToken = await drive.tokenInicialDeCambios();
      await guardarMeta('changesPageToken', pageToken);
    }

    const { changes = [], newStartPageToken } = await drive.cambios(pageToken);
    const indice = new Map(entradas.map(e => [e.id_archivo, e]));
    const plan = diffCambios(changes, { indice, carpetas: ctx.carpetas });

    let ignoradosSinTitulo = 0;

    for (const ubicacion of plan.releer) {
      const texto = await drive.leerTexto(ubicacion.id);
      const receta = parse(texto);
      if (!receta.titulo) { ignoradosSinTitulo++; continue; }
      await cache.guardarCuerpo(ubicacion.id, texto);
      await escribirFila(indice.get(ubicacion.id), receta, ubicacion);
      const entrada = entradaDesdeFila(filaDesde(receta, ubicacion));
      entradas = [...entradas.filter(e => e.id_archivo !== ubicacion.id), entrada];
    }

    for (const ubicacion of plan.parchear) {
      const entrada = indice.get(ubicacion.id);
      const actualizada = { ...entrada, nombre_archivo: ubicacion.nombre_archivo, categoria: ubicacion.categoria, carpeta_id: ubicacion.carpeta_id };
      entradas = entradas.map(e => e.id_archivo === ubicacion.id ? actualizada : e);
      const nro = filas.get(ubicacion.id);
      if (nro) {
        const fila = COLUMNAS.map(c => {
          const v = actualizada[c];
          return Array.isArray(v) ? v.join('|') : String(v ?? '');
        });
        await sheets.escribir(ctx.indiceId, rangoDeFila(nro), [fila]);
      }
    }

    for (const id of plan.borrar) await borrarDelIndice(id);

    if (newStartPageToken) await guardarMeta('changesPageToken', newStartPageToken);
    await cache.guardarIndice(entradas);
    await cache.guardarMapaFilas(filas);

    return { releidos: plan.releer.length - ignoradosSinTitulo, parcheados: plan.parchear.length, borrados: plan.borrar.length, ignoradosSinTitulo };
  }

  /** Los ids de Drive que aparecen en las URLs de las imágenes del .md (§3.3). */
  function idsDeFotos(texto) {
    const ids = [];
    const re = /!\[[^\]]*\]\((?:https?:\/\/[^)]*?\/d\/([A-Za-z0-9_-]+)[^)]*|[^)]*)\)/g;
    let m;
    while ((m = re.exec(texto)) !== null) if (m[1]) ids.push(m[1]);
    return [...new Set(ids)];
  }

  async function guardar(id, receta, { carpetaDestino } = {}) {
    const entrada = entradas.find(e => e.id_archivo === id);
    const meta = await drive.metadatos(id);
    const remoto = Date.parse(meta.modifiedTime) || 0;

    // No se pisa lo que cambió afuera: Drive no tiene escritura condicional (§8).
    if (entrada && remoto && entrada.mtime && remoto !== entrada.mtime) {
      return { ok: false, conflicto: { remoto, local: entrada.mtime } };
    }

    const texto = serialize(receta);
    const actualizado = await drive.actualizar(id, texto);
    await cache.guardarCuerpo(id, texto);

    let carpeta_id = entrada?.carpeta_id ?? ctx.raizId;
    if (carpetaDestino && carpetaDestino !== carpeta_id) {
      await drive.mover(id, { de: carpeta_id, a: carpetaDestino });
      carpeta_id = carpetaDestino;
    }

    const ubicacion = {
      id,
      nombre_archivo: entrada?.nombre_archivo ?? meta.name,
      categoria: ctx.carpetas.get(carpeta_id) ?? CATEGORIA_RAIZ,
      carpeta_id,
      mtime: Date.parse(actualizado.modifiedTime) || Date.now()
    };

    const nueva = entradaDesdeFila(filaDesde(receta, ubicacion));
    entradas = [...entradas.filter(e => e.id_archivo !== id), nueva];
    await cache.guardarIndice(entradas);
    await cache.encolar({ tipo: 'fila', id, fila: filaDesde(receta, ubicacion) });
    return { ok: true };
  }

  async function crear({ titulo, carpetaId }) {
    const padre = carpetaId ?? ctx.raizId;
    const hermanos = (await drive.listarHijos(padre)).map(a => a.name);
    const nombre = slugArchivo(titulo, hermanos);
    const receta = { ...parse(''), titulo, tags: ['incompleto'] };
    const texto = serialize(receta);
    const archivo = await drive.crear({ nombre, contenido: texto, padre });

    const ubicacion = {
      id: archivo.id, nombre_archivo: nombre,
      categoria: ctx.carpetas.get(padre) ?? CATEGORIA_RAIZ,
      carpeta_id: padre, mtime: Date.parse(archivo.modifiedTime) || Date.now()
    };
    entradas = [...entradas, entradaDesdeFila(filaDesde(receta, ubicacion))];
    await cache.guardarCuerpo(archivo.id, texto);
    await cache.guardarIndice(entradas);
    await cache.encolar({ tipo: 'fila', id: archivo.id, fila: filaDesde(receta, ubicacion) });
    return { id: archivo.id, nombre_archivo: nombre };
  }

  async function fotosDe(id) {
    const texto = (await cache.leerCuerpo(id)) ?? (await drive.leerTexto(id));
    return idsDeFotos(texto);
  }

  async function borrar(id, { borrarFotos = false } = {}) {
    const fotos = borrarFotos ? await fotosDe(id) : [];
    await drive.borrar(id);
    await borrarDelIndice(id);
    const fotosBorradas = [];
    for (const foto of fotos) {
      try { await drive.borrar(foto); fotosBorradas.push(foto); } catch { /* ya no estaba */ }
    }
    await cache.guardarIndice(entradas);
    return { fotosBorradas };
  }

  async function flush() {
    const cola = await cache.leerCola();
    for (const op of cola) {
      if (op.tipo !== 'fila') continue;
      const nro = filas.get(op.id);
      if (nro) await sheets.escribir(ctx.indiceId, rangoDeFila(nro), [op.fila]);
      else {
        await sheets.append(ctx.indiceId, HOJA_RECETAS, [op.fila]);
        filas.set(op.id, filas.size + 2);
      }
    }
    await cache.vaciarCola();
    await cache.guardarMapaFilas(filas);
  }

  return { arrancar, cargarIndice, sync, entradas: () => entradas, guardarMeta, guardar, crear, borrar, fotosDe, flush, _ctx: ctx };
}
