import { NOMBRE_RAIZ, NOMBRE_INDICE, SCHEMA_VERSION } from './config.js';
import { COLUMNAS, entradaDesdeFila, diffCambios, filaDesde } from './catalogo.js';
import { HOJA_RECETAS, HOJA_META, rangoDeFila } from './sheets.js';
import { parse, serialize, slugArchivo, normalizar } from './recipe.js';

const CATEGORIA_RAIZ = 'Sin categorizar';
const ULTIMA_COLUMNA = String.fromCharCode(64 + COLUMNAS.length);

export function crearStore({ drive, sheets, cache }) {
  const ctx = { raizId: null, indiceId: null, categorias: [], carpetas: new Map(), soloLectura: false, ultimaReconstruccionEnMemoria: '' };
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
    await sheets.escribir(archivo.id, `${HOJA_RECETAS}!A1:${ULTIMA_COLUMNA}1`, [COLUMNAS]);
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
      ctx.ultimaReconstruccionEnMemoria = meta.ultima_reconstruccion || '';
    }

    return {
      estado: 'listo', raizId: ctx.raizId, indiceId: ctx.indiceId,
      categorias: ctx.categorias, reconstruir, avisos
    };
  }

  /** Cuándo se reconstruyó el índice por última vez, para el menú del home (§7.2). Retorna el valor en caché sin red. */
  function ultimaReconstruccion() {
    return ctx.ultimaReconstruccionEnMemoria;
  }

  async function guardarMeta(clave, valor) {
    const meta = await sheets.leer(ctx.indiceId, `${HOJA_META}!A1:B20`);
    const i = meta.findIndex(f => f[0] === clave);
    const fila = i >= 0 ? i + 1 : meta.length + 1;
    await sheets.escribir(ctx.indiceId, `${HOJA_META}!A${fila}:B${fila}`, [[clave, valor]]);
  }

  async function cargarIndice() {
    const crudo = await sheets.leer(ctx.indiceId, `${HOJA_RECETAS}!A1:${ULTIMA_COLUMNA}100000`);
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
    // Sacar la entrada siempre, tenga fila o no.
    entradas = entradas.filter(e => e.id_archivo !== id);

    // Borrar la fila y hacer el corrimiento solo si tenía fila.
    const nro = filas.get(id);
    if (nro) {
      const hojas = await sheets.hojas(ctx.indiceId);
      const hojaId = hojas.find(h => h.title === HOJA_RECETAS)?.sheetId ?? 0;
      await sheets.borrarFila(ctx.indiceId, hojaId, nro);
      filas.delete(id);
      // El corrimiento es determinístico: no hace falta releer nada (§4.3).
      for (const [otroId, otraFila] of filas) if (otraFila > nro) filas.set(otroId, otraFila - 1);
    }

    // Sacar de la cola cualquier operación pendiente de este id.
    const cola = await cache.leerCola();
    const filtrada = cola.filter(op => op.id !== id);
    await cache.vaciarCola();
    for (const op of filtrada) {
      await cache.encolar(op);
    }

    // Como todas las demás mutaciones del mapa de filas, persistirlo.
    await cache.guardarMapaFilas(filas);
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

  async function borrar(id) {
    await drive.borrar(id);
    await borrarDelIndice(id);
    await cache.guardarIndice(entradas);
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

  async function reconstruir(alProgresar = () => {}) {
    // Defender el parámetro: si no es función, ignorar.
    if (typeof alProgresar !== 'function') alProgresar = () => {};

    await guardarMeta('reconstruccion_en_curso', 'si');
    await cache.vaciarCola();   // cada op es redundante: el .md ya está en Drive (§5.3)

    const lugares = [
      { id: ctx.raizId, categoria: CATEGORIA_RAIZ },
      ...ctx.categorias.map(c => ({ id: c.id, categoria: c.nombre }))
    ];

    const pendientes = [];
    for (const lugar of lugares) {
      const hijos = await drive.listarHijos(lugar.id);
      for (const archivo of hijos) {
        if (archivo.mimeType === 'application/vnd.google-apps.folder') continue;
        if (!/\.md$/i.test(archivo.name)) continue;
        pendientes.push({ archivo, lugar });
      }
    }

    const nuevas = [];
    let ignoradasSinTitulo = 0;
    let leidas = 0;
    for (const { archivo, lugar } of pendientes) {
      const texto = await drive.leerTexto(archivo.id);
      leidas++;
      alProgresar({ leidas, total: pendientes.length });
      const receta = parse(texto);
      if (!receta.titulo) { ignoradasSinTitulo++; continue; }
      nuevas.push(filaDesde(receta, {
        id: archivo.id, nombre_archivo: archivo.name,
        categoria: lugar.categoria, carpeta_id: lugar.id,
        mtime: Date.parse(archivo.modifiedTime) || 0
      }));
    }

    const hojas = await sheets.hojas(ctx.indiceId);
    const hojaId = hojas.find(h => h.title === HOJA_RECETAS)?.sheetId ?? 0;
    const previas = await sheets.leer(ctx.indiceId, `${HOJA_RECETAS}!A1:${ULTIMA_COLUMNA}100000`);
    for (let fila = previas.length; fila >= 2; fila--) {
      await sheets.borrarFila(ctx.indiceId, hojaId, fila);
    }
    for (let i = 0; i < nuevas.length; i += 500) {
      await sheets.append(ctx.indiceId, HOJA_RECETAS, nuevas.slice(i, i + 500));
    }

    entradas = nuevas.map(entradaDesdeFila);
    filas = new Map(entradas.map((e, i) => [e.id_archivo, i + 2]));
    await cache.guardarIndice(entradas);
    await cache.guardarMapaFilas(filas);

    await guardarMeta('changesPageToken', await drive.tokenInicialDeCambios());
    const ahora = new Date().toISOString();
    await guardarMeta('ultima_reconstruccion', ahora);
    ctx.ultimaReconstruccionEnMemoria = ahora;
    await guardarMeta('reconstruccion_en_curso', '');

    return { indexadas: entradas.length, ignoradasSinTitulo };
  }

  function buscar(filtros) {
    // Normalizar el argumento: si no es un objeto plano, tratarlo como {}
    const filtrosValidos = (filtros && typeof filtros === 'object' && !Array.isArray(filtros)) ? filtros : {};
    const {
      texto = '',
      categoria = '',
      tags = [],
      dificultad = ''
    } = filtrosValidos;

    // Defender cada campo por tipo
    const t = normalizar(String(texto ?? ''));
    const cat = String(categoria ?? '');
    const diff = String(dificultad ?? '');
    const tagList = Array.isArray(tags) ? tags : [];

    return entradas.filter(e => {
      if (cat && e.categoria !== cat) return false;
      if (diff && e.dificultad !== diff) return false;
      if (tagList.length && !tagList.every(tag => e.tags.includes(tag))) return false;
      if (!t) return true;
      return normalizar(e.titulo).includes(t) || e.ingredientes.some(i => normalizar(i).includes(t));
    });
  }

  function categoriasConConteo() {
    const cuenta = new Map();
    for (const e of entradas) cuenta.set(e.categoria, (cuenta.get(e.categoria) ?? 0) + 1);
    const lista = ctx.categorias.map(c => ({ id: c.id, nombre: c.nombre, cantidad: cuenta.get(c.nombre) ?? 0 }));
    const sueltas = cuenta.get(CATEGORIA_RAIZ) ?? 0;
    if (sueltas > 0) lista.unshift({ id: ctx.raizId, nombre: CATEGORIA_RAIZ, cantidad: sueltas });
    return lista;
  }

  function tagsDe(categoria) {
    // Defender el parámetro: convertir a string válido
    const cat = typeof categoria === 'string' ? categoria : '';

    const cuenta = new Map();
    for (const e of entradas) {
      if (cat && e.categoria !== cat) continue;
      for (const tag of e.tags) cuenta.set(tag, (cuenta.get(tag) ?? 0) + 1);
    }
    return [...cuenta].map(([tag, cantidad]) => ({ tag, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad || a.tag.localeCompare(b.tag));
  }

  async function receta(id) {
    const entrada = entradas.find(e => e.id_archivo === id) ?? null;
    let texto = await cache.leerCuerpo(id);
    if (texto === null) {
      texto = await drive.leerTexto(id);
      await cache.guardarCuerpo(id, texto);
    }
    return { entrada, receta: parse(texto), texto };
  }

  return { arrancar, cargarIndice, sync, entradas: () => entradas, guardarMeta, ultimaReconstruccion, guardar, crear, borrar, flush, reconstruir, buscar, categoriasConConteo, tagsDe, receta, _ctx: ctx };
}
