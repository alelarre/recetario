import { NOMBRE_RAIZ, NOMBRE_INDICE, SCHEMA_VERSION } from './config.js';
import { COLUMNAS, entradaDesdeFila, filaDesde } from './catalogo.js';
import { HOJA_RECETAS, HOJA_META, rangoDeFila } from './sheets.js';
import { parse, serialize, slugArchivo, normalizar } from './recipe.js';
import type { Drive } from './drive.js';
import type { Sheets } from './sheets.js';
import type {
  Receta, Ubicacion, Entrada, Filtros, Coincidencia, Coincidencias, ArchivoDrive
} from './tipos.js';

const CATEGORIA_RAIZ = 'Sin categorizar';
const ULTIMA_COLUMNA = String.fromCharCode(64 + COLUMNAS.length);

/** Una subcarpeta de `Recetario/`. La carpeta es la categoría (§3.1). */
export interface Categoria {
  id: string;
  nombre: string;
}

/**
 * Cómo terminó el arranque. Es una unión discriminada por `estado` a propósito:
 * cada caso trae exactamente los datos que la vista necesita para dibujarlo, y
 * ninguno de los otros. `main` la consume con un switch (§8).
 */
export type ResultadoArranque =
  /** Drive falló. Nunca se crea nada tras un fallo (§5.1). */
  | { estado: 'solo-lectura'; motivo: string; avisos: string[] }
  /** No existe la carpeta `Recetario/`. */
  | { estado: 'falta-estructura'; avisos: string[] }
  /** Hay más de una carpeta con ese nombre: la elige el usuario. */
  | { estado: 'elegir-carpeta'; candidatas: ArchivoDrive[]; avisos: string[] }
  | {
      estado: 'listo';
      raizId: string;
      indiceId: string;
      categorias: Categoria[];
      /** El índice quedó viejo o a medio hacer y hay que rehacerlo. */
      reconstruir: boolean;
      avisos: string[];
    };

interface Contexto {
  raizId: string;
  indiceId: string;
  categorias: Categoria[];
  /** Id de carpeta → nombre de categoría. Incluye la raíz. */
  carpetas: Map<string, string>;
  soloLectura: boolean;
  ultimaReconstruccionEnMemoria: string;
}

/** Cuántos `.md` se leyeron de cuántos, para la barra de progreso. */
export interface Progreso {
  leidas: number;
  total: number;
}

/**
 * El store no necesita el cliente entero de Drive ni de Sheets, solo estas
 * operaciones. Pedir el subconjunto y no la interfaz completa es lo que deja
 * que un doble de test sea exactamente lo que el store usa, sin tener que
 * implementar de más para satisfacer al compilador.
 */
export type DriveDelStore = Pick<Drive,
  'buscarPorNombre' | 'listarCarpetas' | 'listarHijos' | 'leerTexto' |
  'crear' | 'actualizar' | 'renombrar' | 'mover' | 'borrar'>;

export type SheetsDelStore = Pick<Sheets,
  'leer' | 'escribir' | 'append' | 'agregarHoja' | 'borrarFila' | 'borrarFilas' |
  'hojas' | 'renombrarHoja'>;

export interface Dependencias {
  drive: DriveDelStore;
  sheets: SheetsDelStore;
}

export function crearStore({ drive, sheets }: Dependencias) {
  const ctx: Contexto = {
    raizId: '', indiceId: '', categorias: [], carpetas: new Map(),
    soloLectura: false, ultimaReconstruccionEnMemoria: ''
  };
  let entradas: Entrada[] = [];
  let filas = new Map<string, number>();

  async function leerMeta(): Promise<Record<string, string>> {
    const filas = await sheets.leer(ctx.indiceId, `${HOJA_META}!A1:B20`);
    return Object.fromEntries(filas.map(f => [f[0] ?? '', f[1] ?? '']));
  }

  async function crearPlanilla(): Promise<string> {
    const archivo = await drive.crear({
      nombre: NOMBRE_INDICE, padre: ctx.raizId,
      mime: 'application/vnd.google-apps.spreadsheet'
    });

    try {
      // Google crea una planilla con una hoja por defecto cuyo nombre depende del idioma.
      // Necesitamos renombrarla a 'recetas' antes de escribir, porque todo el resto del
      // código usa rangos como 'recetas!A1:M1'.
      const hojas = await sheets.hojas(archivo.id);
      const hojaPorDefecto = hojas[0];
      if (!hojaPorDefecto) throw new Error('La planilla se creó sin ninguna hoja');
      if (hojaPorDefecto.title !== HOJA_RECETAS) {
        await sheets.renombrarHoja(archivo.id, hojaPorDefecto.sheetId, HOJA_RECETAS);
      }

      await sheets.escribir(archivo.id, `${HOJA_RECETAS}!A1:${ULTIMA_COLUMNA}1`, [[...COLUMNAS]]);
      await sheets.agregarHoja(archivo.id, HOJA_META);
      await sheets.escribir(archivo.id, `${HOJA_META}!A1:B2`, [
        ['schemaVersion', String(SCHEMA_VERSION)],
        ['ultima_reconstruccion', '']
      ]);
      return archivo.id;
    } catch (e) {
      // Si algo después de crear el archivo falla, no dejar una planilla a
      // medio hacer: pasó de verdad (§ "Lo que quedó sabido") y la única
      // recuperación es borrarla a mano. Borrar acá mismo deja que la
      // próxima carga la vuelva a crear sola, sin que nadie tenga que
      // encontrar el archivo roto en Drive.
      await drive.borrar(archivo.id).catch(() => {});
      throw e;
    }
  }

  async function arrancar(): Promise<ResultadoArranque> {
    const avisos: string[] = [];
    const mensaje = (e: unknown): string => e instanceof Error ? e.message : String(e);

    let raices: ArchivoDrive[];
    try {
      raices = await drive.buscarPorNombre(NOMBRE_RAIZ);
    } catch (e) {
      // "No la encontré" no es "no existe": nunca se crea nada tras un fallo (§5.1).
      ctx.soloLectura = true;
      return { estado: 'solo-lectura', motivo: mensaje(e), avisos };
    }

    const raiz = raices[0];
    if (raices.length === 0 || !raiz) return { estado: 'falta-estructura', avisos };
    if (raices.length > 1) return { estado: 'elegir-carpeta', candidatas: raices, avisos };
    ctx.raizId = raiz.id;

    let subcarpetas: ArchivoDrive[];
    try {
      subcarpetas = await drive.listarCarpetas(ctx.raizId);
    } catch (e) {
      ctx.soloLectura = true;
      return { estado: 'solo-lectura', motivo: mensaje(e), avisos };
    }
    ctx.categorias = subcarpetas
      .filter(c => !(c.name ?? '').startsWith('_'))
      .map(c => ({ id: c.id, nombre: c.name ?? '' }));
    ctx.carpetas = new Map<string, string>([
      [ctx.raizId, CATEGORIA_RAIZ],
      ...ctx.categorias.map(c => [c.id, c.nombre] as [string, string])
    ]);

    let planillas: ArchivoDrive[];
    try {
      planillas = await drive.buscarPorNombre(NOMBRE_INDICE, ctx.raizId);
    } catch (e) {
      ctx.soloLectura = true;
      return { estado: 'solo-lectura', motivo: mensaje(e), avisos };
    }

    let reconstruir = false;
    if (planillas.length === 0) {
      ctx.indiceId = await crearPlanilla();
      reconstruir = true;
    } else {
      if (planillas.length > 1) avisos.push('indice-duplicado');
      const ordenadas = [...planillas].sort(
        (a, b) => Date.parse(b.modifiedTime ?? '') - Date.parse(a.modifiedTime ?? ''));
      ctx.indiceId = ordenadas[0]?.id ?? '';
      const meta = await leerMeta();
      if (Number(meta['schemaVersion']) !== SCHEMA_VERSION) reconstruir = true;
      if (meta['reconstruccion_en_curso']) reconstruir = true;
      ctx.ultimaReconstruccionEnMemoria = meta['ultima_reconstruccion'] || '';
    }

    return {
      estado: 'listo', raizId: ctx.raizId, indiceId: ctx.indiceId,
      categorias: ctx.categorias, reconstruir, avisos
    };
  }

  /** Cuándo se reconstruyó el índice por última vez, para el menú del home (§7.2). Retorna el valor en caché sin red. */
  function ultimaReconstruccion(): string {
    return ctx.ultimaReconstruccionEnMemoria;
  }

  async function guardarMeta(clave: string, valor: string): Promise<void> {
    const meta = await sheets.leer(ctx.indiceId, `${HOJA_META}!A1:B20`);
    const i = meta.findIndex(f => f[0] === clave);
    const fila = i >= 0 ? i + 1 : meta.length + 1;
    await sheets.escribir(ctx.indiceId, `${HOJA_META}!A${fila}:B${fila}`, [[clave, valor]]);
  }

  async function cargarIndice(): Promise<Entrada[]> {
    const crudo = await sheets.leer(ctx.indiceId, `${HOJA_RECETAS}!A1:${ULTIMA_COLUMNA}100000`);
    const cuerpo = crudo.slice(1);  // la fila 1 son los encabezados
    entradas = cuerpo.map(entradaDesdeFila).filter(e => e.id_archivo);
    filas = new Map(entradas.map((e, i) => [e.id_archivo, i + 2]));
    return entradas;
  }

  async function escribirFila(receta: Receta, ubicacion: Ubicacion): Promise<void> {
    const fila = filaDesde(receta, ubicacion);
    const nro = filas.get(ubicacion.id);
    if (nro) await sheets.escribir(ctx.indiceId, rangoDeFila(nro), [fila]);
    else {
      await sheets.append(ctx.indiceId, HOJA_RECETAS, [fila]);
      filas.set(ubicacion.id, filas.size + 2);
    }
  }

  async function borrarDelIndice(id: string): Promise<void> {
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
  }

  async function guardar(
    id: string,
    receta: Receta,
    { carpetaDestino }: { carpetaDestino?: string | undefined } = {}
  ): Promise<void> {
    const entrada = entradas.find(e => e.id_archivo === id);

    const texto = serialize(receta);
    const actualizado = await drive.actualizar(id, texto);

    let carpeta_id = entrada?.carpeta_id ?? ctx.raizId;
    if (carpetaDestino && carpetaDestino !== carpeta_id) {
      await drive.mover(id, { de: carpeta_id, a: carpetaDestino });
      carpeta_id = carpetaDestino;
    }

    const ubicacion: Ubicacion = {
      id,
      nombre_archivo: entrada?.nombre_archivo ?? '',
      categoria: ctx.carpetas.get(carpeta_id) ?? CATEGORIA_RAIZ,
      carpeta_id,
      mtime: Date.parse(actualizado.modifiedTime ?? '') || Date.now()
    };

    const nueva = entradaDesdeFila(filaDesde(receta, ubicacion));
    entradas = [...entradas.filter(e => e.id_archivo !== id), nueva];
    await escribirFila(receta, ubicacion);
  }

  async function crear(
    receta: Receta,
    { carpetaId }: { carpetaId?: string | undefined } = {}
  ): Promise<{ id: string; nombre_archivo: string }> {
    const padre = carpetaId ?? ctx.raizId;
    const hermanos = (await drive.listarHijos(padre)).map(a => a.name ?? '');
    const nombre = slugArchivo(receta.titulo, hermanos);
    const texto = serialize(receta);
    const archivo = await drive.crear({ nombre, contenido: texto, padre });

    const ubicacion: Ubicacion = {
      id: archivo.id, nombre_archivo: nombre,
      categoria: ctx.carpetas.get(padre) ?? CATEGORIA_RAIZ,
      carpeta_id: padre, mtime: Date.parse(archivo.modifiedTime ?? '') || Date.now()
    };
    entradas = [...entradas, entradaDesdeFila(filaDesde(receta, ubicacion))];
    await escribirFila(receta, ubicacion);
    return { id: archivo.id, nombre_archivo: nombre };
  }

  async function borrar(id: string): Promise<void> {
    await drive.borrar(id);
    await borrarDelIndice(id);
  }

  async function reconstruir(alProgresar: (p: Progreso) => void = () => {}): Promise<{ indexadas: number; ignorados: string[] }> {
    // Defender el parámetro: si no es función, ignorar.
    if (typeof alProgresar !== 'function') alProgresar = () => {};

    await guardarMeta('reconstruccion_en_curso', 'si');

    const lugares = [
      { id: ctx.raizId, categoria: CATEGORIA_RAIZ },
      ...ctx.categorias.map(c => ({ id: c.id, categoria: c.nombre }))
    ];

    const pendientes: { archivo: ArchivoDrive; lugar: { id: string; categoria: string } }[] = [];
    for (const lugar of lugares) {
      const hijos = await drive.listarHijos(lugar.id);
      for (const archivo of hijos) {
        if (archivo.mimeType === 'application/vnd.google-apps.folder') continue;
        if (!/\.md$/i.test(archivo.name ?? '')) continue;
        pendientes.push({ archivo, lugar });
      }
    }

    const nuevas: string[][] = [];
    // Por nombre y no un conteo: un archivo que se salteó hay que poder
    // encontrarlo en Drive (C05.5.2).
    const ignorados: string[] = [];
    let leidas = 0;
    for (const { archivo, lugar } of pendientes) {
      const texto = await drive.leerTexto(archivo.id);
      leidas++;
      alProgresar({ leidas, total: pendientes.length });
      const receta = parse(texto);
      if (!receta.titulo) { ignorados.push(archivo.name ?? archivo.id); continue; }
      nuevas.push(filaDesde(receta, {
        id: archivo.id, nombre_archivo: archivo.name ?? '',
        categoria: lugar.categoria, carpeta_id: lugar.id,
        mtime: Date.parse(archivo.modifiedTime ?? '') || 0
      }));
    }

    const hojas = await sheets.hojas(ctx.indiceId);
    const hojaId = hojas.find(h => h.title === HOJA_RECETAS)?.sheetId ?? 0;
    const previas = await sheets.leer(ctx.indiceId, `${HOJA_RECETAS}!A1:${ULTIMA_COLUMNA}100000`);
    if (previas.length >= 2) {
      // Todas juntas en una sola llamada: de a una, la cuota de escritura de
      // Sheets (60/min) se agota apenas la cantidad de recetas pasa un
      // puñado — pasó en la práctica con 60 recetas reales.
      const filasABorrar: number[] = [];
      for (let fila = previas.length; fila >= 2; fila--) filasABorrar.push(fila);
      await sheets.borrarFilas(ctx.indiceId, hojaId, filasABorrar);
    }
    for (let i = 0; i < nuevas.length; i += 500) {
      await sheets.append(ctx.indiceId, HOJA_RECETAS, nuevas.slice(i, i + 500));
    }

    entradas = nuevas.map(entradaDesdeFila);
    filas = new Map(entradas.map((e, i) => [e.id_archivo, i + 2]));

    const ahora = new Date().toISOString();
    // La versión del esquema se escribe acá y no solo al crear la planilla:
    // subirla es lo que fuerza la reconstrucción, y si al terminar no queda
    // anotada, el próximo arranque vuelve a reconstruir para siempre.
    await guardarMeta('schemaVersion', String(SCHEMA_VERSION));
    await guardarMeta('ultima_reconstruccion', ahora);
    ctx.ultimaReconstruccionEnMemoria = ahora;
    await guardarMeta('reconstruccion_en_curso', '');

    return { indexadas: entradas.length, ignorados };
  }

  function buscar(filtros?: Filtros | unknown): Entrada[] {
    // Normalizar el argumento: si no es un objeto plano, tratarlo como {}
    const filtrosValidos: Filtros =
      (filtros && typeof filtros === 'object' && !Array.isArray(filtros)) ? filtros as Filtros : {};
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

  /**
   * Busca por texto con los tres criterios —título, ingredientes y tags— y
   * separa por cuál coincidió (C02.3.1). Tres pasadas sin `else`: una receta
   * que coincide por dos entra en los dos grupos, que es lo que fija C02.3.2.
   *
   * El motivo cita el valor **tal como está escrito**: la normalización es de
   * la comparación, no del texto que se muestra (C02.3.4).
   */
  function buscarPorTexto(texto: unknown): Coincidencias {
    const t = normalizar(String(texto ?? ''));
    if (!t) return { porNombre: [], porIngrediente: [], porTag: [] };

    const porNombre: Entrada[] = [];
    const porIngrediente: Coincidencia[] = [];
    const porTag: Coincidencia[] = [];

    for (const e of entradas) {
      if (normalizar(e.titulo).includes(t)) porNombre.push(e);

      const ingrediente = e.ingredientes.find(i => normalizar(i).includes(t));
      if (ingrediente) porIngrediente.push({ entrada: e, motivo: `tiene ${ingrediente}` });

      const tag = e.tags.find(x => normalizar(x).includes(t));
      if (tag) porTag.push({ entrada: e, motivo: `lleva ${tag}` });
    }

    return { porNombre, porIngrediente, porTag };
  }

  function categoriasConConteo(): { id: string; nombre: string; cantidad: number }[] {
    const cuenta = new Map<string, number>();
    for (const e of entradas) cuenta.set(e.categoria, (cuenta.get(e.categoria) ?? 0) + 1);
    const lista = ctx.categorias.map(c => ({ id: c.id, nombre: c.nombre, cantidad: cuenta.get(c.nombre) ?? 0 }));
    const sueltas = cuenta.get(CATEGORIA_RAIZ) ?? 0;
    if (sueltas > 0) lista.unshift({ id: ctx.raizId, nombre: CATEGORIA_RAIZ, cantidad: sueltas });
    return lista;
  }

  function tagsDe(categoria?: unknown): { tag: string; cantidad: number }[] {
    // Defender el parámetro: convertir a string válido
    const cat = typeof categoria === 'string' ? categoria : '';

    const cuenta = new Map<string, number>();
    for (const e of entradas) {
      if (cat && e.categoria !== cat) continue;
      for (const tag of e.tags) cuenta.set(tag, (cuenta.get(tag) ?? 0) + 1);
    }
    return [...cuenta].map(([tag, cantidad]) => ({ tag, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad || a.tag.localeCompare(b.tag));
  }

  async function receta(id: string): Promise<{ entrada: Entrada | null; receta: Receta; texto: string }> {
    const entrada = entradas.find(e => e.id_archivo === id) ?? null;
    const texto = await drive.leerTexto(id);
    return { entrada, receta: parse(texto), texto };
  }

  return { arrancar, cargarIndice, entradas: () => entradas, guardarMeta, ultimaReconstruccion, escribirFila, guardar, crear, borrar, reconstruir, buscar, buscarPorTexto, categoriasConConteo, tagsDe, receta, _ctx: ctx };
}

/** El objeto que devuelve `crearStore`. Lo consumen `compartido`, `main` y los tests. */
export type Store = ReturnType<typeof crearStore>;
