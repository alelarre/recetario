import { NOMBRE_RAIZ, NOMBRE_INDICE, NOMBRE_FOTOS, NOMBRE_SIN_CATEGORIA, NOMBRE_PLAN, MARCA_RAIZ, SCHEMA_VERSION } from './config.js';
import { COLUMNAS, entradaDesdeFila, filaDesde, coincideTag } from './catalogo.js';
import { HOJA_RECETAS, HOJA_META, HOJA_CATEGORIAS, rangoDeFila } from './sheets.js';
import { parse, serialize, slugArchivo, normalizar } from './recipe.js';
import { COLUMNAS_CATEGORIAS, PREDEFINIDAS, categoriaDesdeFila, filaDeCategoria, predefinidaPorNombre, problemaDelNombre } from './categorias.js';
import { parsePlan, serializePlan } from './plan.js';
import { idDeDrive, linkDeFoto } from './fotos-receta.js';
import type { Drive } from './drive.js';
import type { Sheets } from './sheets.js';
import type { CopiaIndice, IndiceLocal } from './indice-local.js';
import type {
  Receta, Ubicacion, Entrada, Filtros, Coincidencia, Coincidencias, ArchivoDrive,
  Categoria, Plan, CambiosDeFotos
} from './tipos.js';

const CATEGORIA_RAIZ = 'Sin categoría';
const ULTIMA_COLUMNA = String.fromCharCode(64 + COLUMNAS.length);
const ULTIMA_COLUMNA_CATEGORIAS = String.fromCharCode(64 + COLUMNAS_CATEGORIAS.length);
const MIME_CARPETA = 'application/vnd.google-apps.folder';
/** Las fotos se achican a JPEG antes de subir (`fotos.ts`). */
const MIME_FOTO = 'image/jpeg';

/** Drive dice que el archivo no existe. */
const noEsta = (e: unknown): boolean =>
  !!e && typeof e === 'object' && (e as { status?: unknown }).status === 404;

/**
 * Cuántos `.md` se leen a la vez al reconstruir. La cuota de lectura de Drive
 * es generosa, pero sin tope una carpeta de mil recetas abre mil pedidos juntos:
 * seis alcanzan para que la reconstrucción deje de ser una espera en fila.
 */
export const TOPE_LECTURAS = 6;

/**
 * Corre `tarea` sobre cada ítem con a lo sumo `tope` en vuelo, y devuelve los
 * resultados **en el orden de `items`**, no en el que fueron terminando. Un
 * error corta el reparto y se propaga, como cuando las lecturas eran en fila.
 */
export async function conConcurrencia<T, R>(
  items: readonly T[], tope: number, tarea: (item: T) => Promise<R>
): Promise<R[]> {
  const resultados: R[] = new Array<R>(items.length);
  let siguiente = 0;
  let cortado = false;
  const obrero = async (): Promise<void> => {
    while (!cortado) {
      const i = siguiente++;
      if (i >= items.length) return;
      const item = items[i] as T;  // El corte de arriba ya garantiza que está.
      try {
        resultados[i] = await tarea(item);
      } catch (e) {
        cortado = true;
        throw e;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(tope, items.length) }, obrero));
  return resultados;
}

export type { Categoria } from './tipos.js';

/**
 * Hay más de un archivo con el mismo nombre —`_indice` o `_plan.md`—: cuántos,
 * y la fecha del que se usa (el más reciente).
 */
export interface IndiceDuplicado {
  cantidad: number;
  modifiedTime: string;
}

/** Qué pasó con la copia local al abrir, comparada con `_indice`. */
export type EstadoCopia = 'coincide' | 'sin-copia' | 'otra-fecha' | 'otra-planilla' | 'otro-esquema';

/** Por qué el arranque pide reindexar, o vacío si no hace falta. */
export type MotivoReindexado = '' | 'planilla-nueva' | 'esquema' | 'a-medias';

/** Lo que el arranque verificó, para la ficha «Al abrir» de Ajustes. */
export interface InformeArranque {
  /** Cuándo arrancó, en ISO. */
  momento: string;
  /** El modifiedTime de `_indice`; vacío si se creó al abrir. */
  indiceModificado: string;
  copia: EstadoCopia;
  /** La fecha de la copia local; vacío si no había. */
  copiaModificada: string;
  reindexado: MotivoReindexado;
}

/**
 * Cómo terminó el arranque. Es una unión discriminada por `estado` a propósito:
 * cada caso trae exactamente los datos que la vista necesita para dibujarlo, y
 * ninguno de los otros. `main` la consume con un switch.
 */
export type ResultadoArranque =
  /** Drive falló. Nunca se crea nada tras un fallo. */
  | { estado: 'solo-lectura'; motivo: string; avisos: string[] }
  /**
   * No hay carpeta marcada, o hay más de una: la elige el usuario. Las
   * sugerencias son las marcadas o, si no hay ninguna, las propias llamadas
   * Recetario.
   */
  | { estado: 'elegir-carpeta'; sugerencias: ArchivoDrive[]; avisos: string[] }
  | {
      estado: 'listo';
      raizId: string;
      indiceId: string;
      /** El índice quedó viejo o a medio hacer y hay que rehacerlo. */
      reconstruir: boolean;
      /** Para el aviso de Ajustes; `null` si hay una sola planilla. */
      indiceDuplicado: IndiceDuplicado | null;
      informe: InformeArranque;
      avisos: string[];
    };

interface Contexto {
  raizId: string;
  /** El nombre de la carpeta base, para Ajustes. */
  raizNombre: string;
  indiceId: string;
  categorias: Categoria[];
  /** Id de carpeta → nombre de categoría. Incluye la raíz. */
  carpetas: Map<string, string>;
  /** La carpeta `_fotos/`, o vacío si todavía no existe: se crea con la primera foto. */
  fotosId: string;
  /** La carpeta `_sin-categoria/`, o vacío si todavía no existe: se crea con la primera receta suelta. */
  sinCategoriaId: string;
  soloLectura: boolean;
  /** La hoja `meta` como se vio por última vez, de la planilla o de la copia. */
  meta: Record<string, string>;
  /**
   * El modifiedTime de `_indice` que se vio por última vez: el de la búsqueda
   * al arrancar, o el que se pidió después de escribir. Vacío si no se sabe, y
   * entonces la copia no se usa ni se guarda.
   */
  modifiedTime: string;
}

/**
 * Cuánto del reindexado va hecho, de 0 a 1.
 *
 * Es una sola barra de punta a punta y no un conteo de archivos: con una
 * carpeta recién creada no hay ningún `.md` que contar, y el rato largo se lo
 * llevan las carpetas, la planilla y los listados. Cada etapa avanza
 * dentro de su tramo, con los pesos de `TRAMOS`.
 */
export type Progreso = number;

/**
 * Hasta dónde llega la barra al terminar cada etapa del reindexado. Los pesos
 * son a ojo —lo que tarda cada una depende del Drive de cada uno—: lo único
 * que importa es que la barra no se quede quieta ni vuelva atrás.
 */
const TRAMOS = { carpetas: 0.08, listados: 0.2, lecturas: 0.9, hojas: 0.95 };

/** El setup de una carpeta base: sus dos etapas propias, antes de reindexar. */
const TRAMOS_SETUP = { categorias: 0.2, indice: 0.25 };

/** Lo que va de `desde` a `hasta` según la parte hecha, de 0 a 1. */
const entre = (desde: number, hasta: number, parte: number): number => desde + (hasta - desde) * parte;

/**
 * El store no necesita el cliente entero de Drive ni de Sheets, solo estas
 * operaciones. Pedir el subconjunto y no la interfaz completa es lo que deja
 * que un doble de test sea exactamente lo que el store usa, sin tener que
 * implementar de más para satisfacer al compilador.
 */
export type DriveDelStore = Pick<Drive,
  'buscarPorNombre' | 'listarCarpetas' | 'listarHijos' | 'leerTexto' | 'metadatos' | 'propiedades' |
  'carpetasMarcadas' | 'carpetasPropiasPorNombre' |
  'crear' | 'actualizar' | 'renombrar' | 'mover' | 'borrar'>;

export type SheetsDelStore = Pick<Sheets,
  'leer' | 'escribir' | 'append' | 'agregarHoja' | 'borrarFila' | 'borrarFilas' |
  'hojas' | 'renombrarHoja'>;

/** Lo que el store usa del caché de imágenes (`imagenes.ts`). */
export interface ImagenesDelStore {
  guardarImagen(id: string, blob: Blob): Promise<void>;
  olvidarImagen(id: string): Promise<void>;
}

export interface Dependencias {
  drive: DriveDelStore;
  sheets: SheetsDelStore;
  /** La copia local del índice. `main` pasa `indice-local.ts`; los tests, un doble. */
  indiceLocal: IndiceLocal;
  /**
   * El caché de imágenes, para que una foto recién subida entre con su blob y
   * una que va a la papelera salga. Opcional: sin él, el store escribe igual.
   */
  imagenes?: ImagenesDelStore | undefined;
}

/** Un 404 de Drive: el archivo no está, que es distinto de no poder preguntar. */
const esNoEncontrado = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && (e as { status?: unknown }).status === 404;

export function crearStore({ drive, sheets, indiceLocal, imagenes }: Dependencias) {
  const ctx: Contexto = {
    raizId: '', raizNombre: '', indiceId: '', categorias: [], carpetas: new Map(),
    fotosId: '', sinCategoriaId: '', soloLectura: false, meta: {}, modifiedTime: ''
  };
  let entradas: Entrada[] = [];
  let filas = new Map<string, number>();
  /**
   * El plan de la semana: el id de `_plan.md` y lo último que se leyó o
   * escribió. `buscado` distingue «todavía no lo busqué» de «no existe»: la
   * búsqueda en Drive es una sola por sesión.
   */
  const plan = {
    buscado: false, id: '', contenido: { comidas: [] } as Plan,
    duplicado: null as IndiceDuplicado | null
  };

  async function leerMeta(): Promise<Record<string, string>> {
    const filas = await sheets.leer(ctx.indiceId, `${HOJA_META}!A1:B20`);
    return Object.fromEntries(filas.map(f => [f[0] ?? '', f[1] ?? '']));
  }

  /**
   * La copia local, si es de esta planilla, la escribió este código y Drive
   * tiene la misma fecha que ella. Se compara metadata, nunca contenido.
   */
  function copiaQueSirve(): CopiaIndice | null {
    const { copia, estado } = compararCopia();
    return estado === 'coincide' ? copia : null;
  }

  /** La copia local y cómo está respecto de `_indice`, en el orden en que se descarta. */
  function compararCopia(): { copia: CopiaIndice | null; estado: EstadoCopia } {
    const copia = indiceLocal.leer();
    if (!copia) return { copia, estado: 'sin-copia' };
    if (copia.schemaVersion !== SCHEMA_VERSION) return { copia, estado: 'otro-esquema' };
    if (copia.indiceId !== ctx.indiceId) return { copia, estado: 'otra-planilla' };
    if (!ctx.modifiedTime || copia.modifiedTime !== ctx.modifiedTime) return { copia, estado: 'otra-fecha' };
    return { copia, estado: 'coincide' };
  }

  /** Cada entrada con su número de fila; una entrada sin fila no está en la planilla. */
  function conFila<E extends { id_archivo: string }>(
    lista: E[], nros: Map<string, number>
  ): { fila: number; entrada: E }[] {
    return lista.flatMap(entrada => {
      const fila = nros.get(entrada.id_archivo);
      return fila ? [{ fila, entrada }] : [];
    });
  }

  /** Lo que hay en memoria, con el número de fila que cada entrada tiene en la planilla. */
  function copiaActual(): CopiaIndice {
    return {
      schemaVersion: SCHEMA_VERSION,
      indiceId: ctx.indiceId,
      raizId: ctx.raizId,
      raizNombre: ctx.raizNombre,
      modifiedTime: ctx.modifiedTime,
      meta: { ...ctx.meta },
      filas: conFila(entradas, filas),
      categorias: ctx.categorias
    };
  }

  /** Carga la copia en memoria, en el orden de la planilla, como si se la hubiera leído. */
  function usarCopia(copia: CopiaIndice): void {
    ctx.meta = { ...copia.meta };
    // Antes de armar el mapa de carpetas: `usarCategorias` necesita conocer
    // `_sin-categoria/` para sumarla.
    ctx.sinCategoriaId = ctx.meta['carpeta_sin_categoria'] ?? '';
    usarCategorias(copia.categorias);
    const ordenadas = [...copia.filas].sort((a, b) => a.fila - b.fila);
    entradas = ordenadas.map(f => conCategoria(f.entrada));
    filas = new Map(ordenadas.map(f => [f.entrada.id_archivo, f.fila]));
    ctx.fotosId = ctx.meta['carpeta_fotos'] ?? '';
  }

  /**
   * Las categorías en memoria y el mapa de carpeta → nombre que usan guardar y
   * crear. `_sin-categoria/` entra con el mismo nombre que la raíz: las dos son
   * Sin categoría, así `delRecetario` y `conCategoria` la reconocen.
   */
  function usarCategorias(lista: Categoria[]): void {
    ctx.categorias = lista;
    ctx.carpetas = new Map<string, string>([
      [ctx.raizId, CATEGORIA_RAIZ],
      ...(ctx.sinCategoriaId ? [[ctx.sinCategoriaId, CATEGORIA_RAIZ] as [string, string]] : []),
      ...lista.map(c => [c.id, c.nombre] as [string, string])
    ]);
  }

  /**
   * La categoría de una receta sale de su carpeta, no de la columna: así
   * renombrar una categoría no obliga a reescribir las filas de sus recetas.
   * Una carpeta que no es categoría —la raíz o `_sin-categoria/`— es Sin
   * categoría.
   */
  function conCategoria(e: Entrada): Entrada {
    return { ...e, categoria: ctx.carpetas.get(e.carpeta_id) ?? CATEGORIA_RAIZ };
  }

  /**
   * El paso con que termina toda escritura en `_indice`: pedir su fecha nueva
   * y guardar la copia entera. Si la fecha no llega, la copia se borra y la
   * próxima apertura baja la planilla; la escritura ya salió, así que no se
   * propaga nada. Así la copia nunca queda más nueva que la planilla.
   */
  async function persistir(): Promise<void> {
    try {
      const { modifiedTime } = await drive.metadatos(ctx.indiceId, 'modifiedTime');
      if (!modifiedTime) throw new Error('Drive no devolvió la fecha de _indice');
      ctx.modifiedTime = modifiedTime;
    } catch {
      ctx.modifiedTime = '';
      indiceLocal.borrar();
      return;
    }
    indiceLocal.guardar(copiaActual());
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
      await sheets.agregarHoja(archivo.id, HOJA_CATEGORIAS);
      await sheets.escribir(archivo.id, `${HOJA_CATEGORIAS}!A1:${ULTIMA_COLUMNA_CATEGORIAS}1`, [[...COLUMNAS_CATEGORIAS]]);
      return archivo.id;
    } catch (e) {
      // Si algo después de crear el archivo falla, no dejar una planilla a
      // medio hacer: la única recuperación sería encontrarla y borrarla a mano
      // en Drive. Borrándola acá, la próxima carga la vuelve a crear sola.
      await drive.borrar(archivo.id).catch(() => {});
      throw e;
    }
  }

  async function arrancar(): Promise<ResultadoArranque> {
    const momento = new Date().toISOString();
    const avisos: string[] = [];
    const mensaje = (e: unknown): string => e instanceof Error ? e.message : String(e);
    const soloLectura = (e: unknown): ResultadoArranque => {
      // "No la encontré" no es "no existe": nunca se crea nada tras un fallo.
      ctx.soloLectura = true;
      return { estado: 'solo-lectura', motivo: mensaje(e), avisos };
    };

    let indiceDuplicado: IndiceDuplicado | null = null;
    let planillaNueva = false;

    /**
     * Sin copia útil: la carpeta marcada. Devuelve un resultado si el arranque
     * termina acá —sin red, o sin una sola carpeta marcada—; si no, deja la raíz
     * y `_indice` en el contexto.
     */
    const porLaMarca = async (): Promise<ResultadoArranque | null> => {
      let marcadas: ArchivoDrive[];
      try {
        marcadas = await drive.carpetasMarcadas();
      } catch (e) {
        return soloLectura(e);
      }
      const raiz = marcadas.length === 1 ? marcadas[0] : undefined;
      if (!raiz) {
        let sugerencias = marcadas;
        if (marcadas.length === 0) {
          try {
            sugerencias = await drive.carpetasPropiasPorNombre(NOMBRE_RAIZ);
          } catch (e) {
            return soloLectura(e);
          }
        }
        return { estado: 'elegir-carpeta', sugerencias, avisos };
      }
      ctx.raizId = raiz.id;
      ctx.raizNombre = raiz.name ?? '';

      let planillas: ArchivoDrive[];
      try {
        planillas = await drive.buscarPorNombre(NOMBRE_INDICE, ctx.raizId);
      } catch (e) {
        return soloLectura(e);
      }
      if (planillas.length === 0) {
        ctx.indiceId = await crearPlanilla();
        ctx.modifiedTime = '';
        ctx.meta = { schemaVersion: String(SCHEMA_VERSION), ultima_reconstruccion: '' };
        planillaNueva = true;
      } else {
        if (planillas.length > 1) avisos.push('indice-duplicado');
        const ordenadas = [...planillas].sort(
          (a, b) => Date.parse(b.modifiedTime ?? '') - Date.parse(a.modifiedTime ?? ''));
        ctx.indiceId = ordenadas[0]?.id ?? '';
        // La búsqueda ya trae la fecha: esa es toda la verificación, sin pedidos nuevos.
        ctx.modifiedTime = ordenadas[0]?.modifiedTime ?? '';
        if (planillas.length > 1) indiceDuplicado = { cantidad: planillas.length, modifiedTime: ctx.modifiedTime };
      }
      return null;
    };

    // Con una copia de esta versión, la raíz y `_indice` ya se conocen: alcanza
    // con la fecha de `_indice`. Un pedido en vez de dos búsquedas.
    const guardada = indiceLocal.leer();
    let conocida = guardada?.schemaVersion === SCHEMA_VERSION;
    if (guardada && conocida) {
      try {
        const archivo = await drive.metadatos(guardada.indiceId, 'modifiedTime,trashed');
        conocida = !archivo.trashed && !!archivo.modifiedTime;
        if (conocida) {
          ctx.raizId = guardada.raizId;
          ctx.raizNombre = guardada.raizNombre;
          ctx.indiceId = guardada.indiceId;
          ctx.modifiedTime = archivo.modifiedTime ?? '';
        }
      } catch (e) {
        if (!esNoEncontrado(e)) return soloLectura(e);
        conocida = false;
      }
    }

    if (!conocida) {
      const resultado = await porLaMarca();
      if (resultado) return resultado;
    }

    let comparacion = compararCopia();
    if (!planillaNueva) {
      if (comparacion.estado !== 'coincide') {
        ctx.meta = await leerMeta();
        // Otro dispositivo cambió de carpeta: la de la copia quedó atrás.
        if (conocida && ctx.meta['reemplazada']) {
          indiceLocal.borrar();
          const resultado = await porLaMarca();
          if (resultado) return resultado;
          comparacion = compararCopia();
          if (!planillaNueva) ctx.meta = await leerMeta();
        }
      } else if (comparacion.copia) {
        usarCopia(comparacion.copia);
      }
    }
    let reindexado: MotivoReindexado = planillaNueva ? 'planilla-nueva' : '';
    if (!planillaNueva) {
      if (ctx.meta['reconstruccion_en_curso']) reindexado = 'a-medias';
      if (Number(ctx.meta['schemaVersion']) !== SCHEMA_VERSION) reindexado = 'esquema';
    }

    const informe: InformeArranque = {
      momento, indiceModificado: ctx.modifiedTime,
      copia: comparacion.estado, copiaModificada: comparacion.copia?.modifiedTime ?? '',
      reindexado
    };

    return {
      estado: 'listo', raizId: ctx.raizId, indiceId: ctx.indiceId,
      reconstruir: reindexado !== '', indiceDuplicado, informe, avisos
    };
  }

  /** Cuándo se reconstruyó el índice por última vez, para Ajustes. Sin red: sale de la meta en memoria. */
  function ultimaReconstruccion(): string {
    return ctx.meta['ultima_reconstruccion'] ?? '';
  }

  async function guardarMeta(clave: string, valor: string): Promise<void> {
    const meta = await sheets.leer(ctx.indiceId, `${HOJA_META}!A1:B20`);
    const i = meta.findIndex(f => f[0] === clave);
    const fila = i >= 0 ? i + 1 : meta.length + 1;
    await sheets.escribir(ctx.indiceId, `${HOJA_META}!A${fila}:B${fila}`, [[clave, valor]]);
    ctx.meta[clave] = valor;
  }

  async function cargarIndice(): Promise<Entrada[]> {
    const copia = copiaQueSirve();
    if (copia) {
      usarCopia(copia);
      return entradas;
    }
    const crudo = await sheets.leer(ctx.indiceId, `${HOJA_RECETAS}!A1:${ULTIMA_COLUMNA}100000`);
    const cuerpo = crudo.slice(1);  // la fila 1 son los encabezados
    entradas = cuerpo.map(entradaDesdeFila).filter(e => e.id_archivo);
    filas = new Map(entradas.map((e, i) => [e.id_archivo, i + 2]));
    const crudoCategorias = await sheets.leer(
      ctx.indiceId, `${HOJA_CATEGORIAS}!A1:${ULTIMA_COLUMNA_CATEGORIAS}1000`);
    // Antes de `usarCategorias`, que necesita conocer `_sin-categoria/` para sumarla.
    ctx.sinCategoriaId = ctx.meta['carpeta_sin_categoria'] ?? '';
    usarCategorias(crudoCategorias.slice(1).map(categoriaDesdeFila).filter(c => c.id));
    entradas = entradas.map(conCategoria);
    ctx.fotosId = ctx.meta['carpeta_fotos'] ?? '';
    // La fecha es la de la búsqueda de recién: nada escribió entre medio. Sin
    // fecha —la planilla recién creada— no se guarda: lo hace el reindexado al
    // terminar.
    if (ctx.modifiedTime) indiceLocal.guardar(copiaActual());
    return entradas;
  }

  /** Escribe la fila de `id` donde está, o la agrega al final. `nros` es el mapa de esa hoja. */
  async function escribirEnHoja(
    hoja: string, nros: Map<string, number>, id: string, valores: string[], columnas: number
  ): Promise<void> {
    const nro = nros.get(id);
    if (nro) await sheets.escribir(ctx.indiceId, rangoDeFila(nro, hoja, columnas), [valores]);
    else {
      await sheets.append(ctx.indiceId, hoja, [valores]);
      nros.set(id, nros.size + 2);
    }
  }

  /** Borra la fila de `id` y corre las siguientes. Devuelve si tenía fila. */
  async function borrarDeHoja(hoja: string, nros: Map<string, number>, id: string): Promise<boolean> {
    const nro = nros.get(id);
    if (!nro) return false;
    const hojas = await sheets.hojas(ctx.indiceId);
    await sheets.borrarFila(ctx.indiceId, idDeHoja(hojas, hoja), nro);
    nros.delete(id);
    // El corrimiento es determinístico: no hace falta releer nada.
    for (const [otroId, otraFila] of nros) if (otraFila > nro) nros.set(otroId, otraFila - 1);
    return true;
  }

  async function escribirFila(receta: Receta, ubicacion: Ubicacion): Promise<void> {
    const fila = filaDesde(receta, ubicacion);
    // La entrada en memoria se actualiza acá y no en quien llama: la capa
    // compartida escribe la fila sin pasar por guardar ni crear, y la copia
    // se arma desde las entradas.
    entradas = [...entradas.filter(e => e.id_archivo !== ubicacion.id), entradaDesdeFila(fila)];
    await escribirEnHoja(HOJA_RECETAS, filas, ubicacion.id, fila, COLUMNAS.length);
    await persistir();
  }

  async function borrarDelIndice(id: string): Promise<void> {
    // Sacar la entrada siempre, tenga fila o no.
    entradas = entradas.filter(e => e.id_archivo !== id);
    if (await borrarDeHoja(HOJA_RECETAS, filas, id)) await persistir();
  }

  /**
   * La carpeta y el nombre de un archivo que no está en el índice, si está en
   * la carpeta base o en una categoría. Si no, falla: con el permiso `drive`,
   * un id que llegó en un link a `#/r/<id>` podría ser cualquier archivo del
   * usuario, y guardar o borrar lo reescribiría o lo mandaría a la papelera.
   */
  async function delRecetario(id: string): Promise<{ carpeta: string; nombre: string }> {
    const meta = await drive.metadatos(id, 'name,parents');
    const carpeta = (meta.parents ?? []).find(p => ctx.carpetas.has(p));
    if (!carpeta) throw new Error('El archivo no está en la carpeta del Recetario.');
    return { carpeta, nombre: meta.name ?? '' };
  }

  /** El caché no es parte de la escritura: si falla, la foto se vuelve a pedir a Drive. */
  async function enElCache(tarea: (cache: ImagenesDelStore) => Promise<void>): Promise<void> {
    if (!imagenes) return;
    try { await tarea(imagenes); } catch { /* sin caché, se pide a Drive */ }
  }

  /** `_fotos/`, creada con la primera foto. Sin listar carpetas al abrir, `meta` es la única forma de volver a encontrarla. */
  async function carpetaDeFotos(): Promise<string> {
    if (!ctx.fotosId) {
      const carpeta = await drive.crear({ nombre: NOMBRE_FOTOS, padre: ctx.raizId, mime: MIME_CARPETA });
      ctx.fotosId = carpeta.id;
      await guardarMeta('carpeta_fotos', carpeta.id);
    }
    return ctx.fotosId;
  }

  /**
   * `_sin-categoria/`, la bandeja de entrada de las recetas sin categoría,
   * creada con la primera. Sin listar carpetas al abrir, `meta` es la única
   * forma de volver a encontrarla; se suma al mapa de carpetas para que
   * `delRecetario` y `conCategoria` la reconozcan en la misma sesión.
   */
  async function carpetaSinCategoria(): Promise<string> {
    if (!ctx.sinCategoriaId) {
      const carpeta = await drive.crear({ nombre: NOMBRE_SIN_CATEGORIA, padre: ctx.raizId, mime: MIME_CARPETA });
      ctx.sinCategoriaId = carpeta.id;
      await guardarMeta('carpeta_sin_categoria', carpeta.id);
      ctx.carpetas.set(ctx.sinCategoriaId, CATEGORIA_RAIZ);
    }
    return ctx.sinCategoriaId;
  }

  /** Sube una foto a `_fotos/` y la deja en el caché con el blob que ya está en memoria. */
  async function subirAFotos(nombre: string, blob: Blob): Promise<string> {
    const padre = await carpetaDeFotos();
    const { id } = await drive.crear({ nombre, contenido: blob, padre, mime: MIME_FOTO });
    await enElCache(c => c.guardarImagen(id, blob));
    return id;
  }

  /**
   * Antes de escribir el `.md`: sube las fotos nuevas a `_fotos/`, con el
   * nombre del `.md` y su número. Devuelve la receta con el link de cada nueva
   * en su línea. Cada subida se avisa apenas termina, para que un reintento no
   * la resuba.
   */
  async function subirFotosNuevas(nombreMd: string, receta: Receta, fotos: CambiosDeFotos | undefined): Promise<Receta> {
    const base = nombreMd.replace(/\.md$/i, '');
    const links = new Map<number, string>();
    for (const [n, blob] of fotos?.nuevas ?? []) {
      const id = await subirAFotos(`${base}-${n}.jpg`, blob);
      fotos?.alSubir?.(n, id);
      links.set(n, linkDeFoto(id));
    }
    // Una línea sin URL —una foto nueva que no llegó a subirse— dejaría la
    // sección `## Fotos` sin la forma que `parsearFotos` exige, y la receta
    // perdería el depósito entero al leerla. Antes que eso, la línea no se
    // escribe: el editor la vuelve a poner con la foto que sigue en memoria.
    return { ...receta, fotos: receta.fotos.flatMap(f => {
      const url = links.get(f.n) ?? f.url;
      return url.trim() ? [{ ...f, url }] : [];
    }) };
  }

  /** Los ids de las URLs que son links de Drive; las externas quedan afuera. */
  const idsDeDrive = (urls: readonly string[]): string[] =>
    urls.flatMap(url => { const id = idDeDrive(url); return id ? [id] : []; });

  /**
   * A la papelera y fuera del caché, pero sólo las fotos que están en
   * `_fotos/`: un link de Drive pegado a mano que apunta a otra carpeta no se
   * toca. Una que ya no está no es un error.
   */
  async function tirarFotos(ids: readonly string[]): Promise<void> {
    if (!ctx.fotosId) return;
    for (const id of ids) {
      let padres: string[];
      try {
        padres = (await drive.metadatos(id, 'parents')).parents ?? [];
      } catch (e) {
        if (!noEsta(e)) throw e;
        await enElCache(c => c.olvidarImagen(id));
        continue;
      }
      if (!padres.includes(ctx.fotosId)) continue;
      await aLaPapelera(id);
      await enElCache(c => c.olvidarImagen(id));
    }
  }

  /**
   * Con `fotos`, en este orden: subir las nuevas a `_fotos/`, el `.md` y su fila, y recién
   * después la papelera. Si algo falla en el medio, lo peor que queda es una
   * foto huérfana en `_fotos/`, nunca una receta que nombra una foto borrada.
   */
  async function guardar(
    id: string,
    receta: Receta,
    { carpetaDestino, fotos }: { carpetaDestino?: string | undefined; fotos?: CambiosDeFotos | undefined } = {}
  ): Promise<void> {
    const entrada = entradas.find(e => e.id_archivo === id);

    // Sin fila —por ejemplo, una receta abierta por link directo y marcada
    // favorita ahí mismo— no hay de dónde sacar su carpeta real ni su nombre
    // de archivo: caer en la raíz la mandaría a «Sin categoría» aunque esté
    // en una categoría. Se le pregunta a Drive, y sólo en este caso, antes de
    // escribir: un id que llegó en un link puede ser cualquier archivo.
    let carpeta_id: string;
    let nombre_archivo: string;
    if (entrada) {
      carpeta_id = entrada.carpeta_id;
      nombre_archivo = entrada.nombre_archivo;
    } else {
      const meta = await delRecetario(id);
      carpeta_id = meta.carpeta;
      nombre_archivo = meta.nombre;
    }

    const conLinks = await subirFotosNuevas(nombre_archivo, receta, fotos);
    const actualizado = await drive.actualizar(id, serialize(conLinks));

    // Vacío es «Sin categoría»: si ya está suelta —en la raíz o en
    // `_sin-categoria/`— no se mueve; si no, va a `_sin-categoria/`, que se
    // crea si todavía no existe.
    let destino = carpetaDestino;
    if (destino === '') {
      destino = (carpeta_id === ctx.raizId || carpeta_id === ctx.sinCategoriaId)
        ? undefined : await carpetaSinCategoria();
    }
    if (destino !== undefined && destino !== carpeta_id) {
      await drive.mover(id, { de: carpeta_id, a: destino });
      carpeta_id = destino;
    }

    const ubicacion: Ubicacion = {
      id,
      nombre_archivo,
      categoria: ctx.carpetas.get(carpeta_id) ?? CATEGORIA_RAIZ,
      carpeta_id,
      mtime: Date.parse(actualizado.modifiedTime ?? '') || Date.now()
    };

    await escribirFila(conLinks, ubicacion);
    if (fotos) await tirarFotos(idsDeDrive(fotos.sacadas));
  }

  /** Como `guardar`: el nombre del `.md` se calcula antes de subir, porque las fotos lo llevan. */
  async function crear(
    receta: Receta,
    { carpetaId, fotos }: { carpetaId?: string | undefined; fotos?: CambiosDeFotos | undefined } = {}
  ): Promise<{ id: string; nombre_archivo: string }> {
    const padre = carpetaId ?? await carpetaSinCategoria();
    const hermanos = (await drive.listarHijos(padre)).map(a => a.name ?? '');
    const nombre = slugArchivo(receta.titulo, hermanos);
    const conLinks = await subirFotosNuevas(nombre, receta, fotos);
    const archivo = await drive.crear({ nombre, contenido: serialize(conLinks), padre });

    const ubicacion: Ubicacion = {
      id: archivo.id, nombre_archivo: nombre,
      categoria: ctx.carpetas.get(padre) ?? CATEGORIA_RAIZ,
      carpeta_id: padre, mtime: Date.parse(archivo.modifiedTime ?? '') || Date.now()
    };
    await escribirFila(conLinks, ubicacion);
    if (fotos) await tirarFotos(idsDeDrive(fotos.sacadas));
    return { id: archivo.id, nombre_archivo: nombre };
  }

  /**
   * El `.md` se lee antes de mandarlo a la papelera, para saber sus fotos; las
   * de `_fotos/` van después del `.md` y de su fila. Las externas no se tocan.
   */
  async function borrar(id: string): Promise<void> {
    if (!entradas.some(e => e.id_archivo === id)) await delRecetario(id);
    // Si el `.md` no se puede leer, se borra igual y sus fotos quedan
    // huérfanas en `_fotos/`: no poder borrar una receta es peor que dejar una
    // foto de más, y es el mismo lado seguro que el resto de la feature.
    const fotos = await drive.leerTexto(id).then(texto => parse(texto).fotos).catch(() => []);
    await drive.borrar(id);
    await borrarDelIndice(id);
    await tirarFotos(idsDeDrive(fotos.map(f => f.url)));
  }

  /** El `sheetId` de una hoja por su nombre. Una hoja recién agregada no está en la lista, y no hace falta: está vacía. */
  function idDeHoja(hojas: { sheetId: number; title: string }[], nombre: string): number {
    return hojas.find(h => h.title === nombre)?.sheetId ?? 0;
  }

  /** Agrega la hoja con su encabezado si la planilla es de un esquema anterior y no la tiene. */
  async function asegurarHoja(
    hojas: { title: string }[], hoja: string, ultimaColumna: string, columnas: readonly string[]
  ): Promise<void> {
    if (hojas.some(h => h.title === hoja)) return;
    await sheets.agregarHoja(ctx.indiceId, hoja);
    await sheets.escribir(ctx.indiceId, `${hoja}!A1:${ultimaColumna}1`, [[...columnas]]);
  }

  /** Vacía una hoja, salvo el encabezado, y la llena con `nuevas`. */
  async function reemplazarFilas(hoja: string, hojaId: number, ultimaColumna: string, nuevas: string[][]): Promise<void> {
    const previas = await sheets.leer(ctx.indiceId, `${hoja}!A1:${ultimaColumna}100000`);
    if (previas.length >= 2) {
      // Todas juntas en una sola llamada: de a una, la cuota de escritura de
      // Sheets (60/min) se agota apenas la cantidad de recetas pasa un puñado.
      const filasABorrar: number[] = [];
      for (let fila = previas.length; fila >= 2; fila--) filasABorrar.push(fila);
      await sheets.borrarFilas(ctx.indiceId, hojaId, filasABorrar);
    }
    for (let i = 0; i < nuevas.length; i += 500) {
      await sheets.append(ctx.indiceId, hoja, nuevas.slice(i, i + 500));
    }
  }

  async function reconstruir(alProgresar: (p: Progreso) => void = () => {}): Promise<{ indexadas: number; ignorados: string[] }> {
    if (typeof alProgresar !== 'function') alProgresar = () => {};

    await guardarMeta('reconstruccion_en_curso', 'si');

    // Las carpetas: la verdad de cada categoría. Las predefinidas que todavía
    // no tienen propiedades las reciben de la tabla, una sola vez.
    let fotosId = '';
    let sinCategoriaId = '';
    const categorias: Categoria[] = [];
    // Cada carpeta mueve la barra: escribirle las propiedades a una
    // predefinida es un viaje a Drive, y son hasta dieciséis.
    const carpetas = await drive.listarCarpetas(ctx.raizId);
    for (const [i, carpeta] of carpetas.entries()) {
      const nombre = carpeta.name ?? '';
      if (nombre === NOMBRE_FOTOS) fotosId = carpeta.id;
      else if (nombre === NOMBRE_SIN_CATEGORIA) sinCategoriaId = carpeta.id;
      else if (!nombre.startsWith('_')) {
        let color = carpeta.appProperties?.['color'] ?? '';
        let foto = carpeta.appProperties?.['foto'] ?? '';
        const predefinida = !color && !foto ? predefinidaPorNombre(nombre) : null;
        if (predefinida) {
          color = predefinida.color;
          foto = `catalogo:${predefinida.foto}`;
          await drive.propiedades(carpeta.id, { color, foto });
        }
        categorias.push({ id: carpeta.id, nombre, color, foto });
      }
      alProgresar(TRAMOS.carpetas * ((i + 1) / carpetas.length));
    }
    ctx.fotosId = fotosId;
    // Antes de `usarCategorias`, que necesita conocer `_sin-categoria/` para sumarla.
    ctx.sinCategoriaId = sinCategoriaId;
    usarCategorias(categorias);

    // Lo que empieza con `_` es de la app y no es una receta: `_plan.md` vive
    // en la carpeta base, al lado de `_indice`, y sin esto entraría al índice
    // como una receta suelta.
    const esMd = (a: ArchivoDrive): boolean =>
      a.mimeType !== MIME_CARPETA && /\.md$/i.test(a.name ?? '') && !(a.name ?? '').startsWith('_');

    const lugares = [
      { id: ctx.raizId, categoria: CATEGORIA_RAIZ },
      ...(ctx.sinCategoriaId ? [{ id: ctx.sinCategoriaId, categoria: CATEGORIA_RAIZ }] : []),
      ...ctx.categorias.map(c => ({ id: c.id, categoria: c.nombre }))
    ];

    // Un listado por lugar, uno detrás de otro: son otros tantos viajes a
    // Drive antes de leer el primer archivo.
    const pendientes: { archivo: ArchivoDrive; lugar: { id: string; categoria: string } }[] = [];
    for (const [i, lugar] of lugares.entries()) {
      for (const archivo of (await drive.listarHijos(lugar.id)).filter(esMd)) pendientes.push({ archivo, lugar });
      alProgresar(entre(TRAMOS.carpetas, TRAMOS.listados, (i + 1) / lugares.length));
    }
    const total = pendientes.length;

    const nuevas: string[][] = [];
    // Por nombre y no un conteo: un archivo que se salteó hay que poder
    // encontrarlo en Drive.
    const ignorados: string[] = [];
    let leidas = 0;
    // Leer y parsear van separados: las lecturas se solapan, pero las filas se
    // arman después, en el orden de los archivos y no en el que Drive contestó.
    const leer = async (archivo: ArchivoDrive): Promise<string> => {
      const texto = await drive.leerTexto(archivo.id);
      leidas++;
      alProgresar(entre(TRAMOS.listados, TRAMOS.lecturas, leidas / total));
      return texto;
    };

    const textos = await conConcurrencia(pendientes, TOPE_LECTURAS, p => leer(p.archivo));
    for (const [i, { archivo, lugar }] of pendientes.entries()) {
      const receta = parse(textos[i] ?? '');
      if (!receta.titulo) { ignorados.push(archivo.name ?? archivo.id); continue; }
      nuevas.push(filaDesde(receta, {
        id: archivo.id, nombre_archivo: archivo.name ?? '',
        categoria: lugar.categoria, carpeta_id: lugar.id,
        mtime: Date.parse(archivo.modifiedTime ?? '') || 0
      }));
    }

    // Leído todo, aunque no hubiera nada que leer: lo que queda es escribir.
    alProgresar(TRAMOS.lecturas);

    const hojas = await sheets.hojas(ctx.indiceId);
    await reemplazarFilas(HOJA_RECETAS, idDeHoja(hojas, HOJA_RECETAS), ULTIMA_COLUMNA, nuevas);
    await asegurarHoja(hojas, HOJA_CATEGORIAS, ULTIMA_COLUMNA_CATEGORIAS, COLUMNAS_CATEGORIAS);
    await reemplazarFilas(HOJA_CATEGORIAS, idDeHoja(hojas, HOJA_CATEGORIAS), ULTIMA_COLUMNA_CATEGORIAS,
      ctx.categorias.map(filaDeCategoria));

    alProgresar(TRAMOS.hojas);

    entradas = nuevas.map(entradaDesdeFila).map(conCategoria);
    filas = new Map(entradas.map((e, i) => [e.id_archivo, i + 2]));

    const ahora = new Date().toISOString();
    // La versión del esquema se escribe acá y no solo al crear la planilla:
    // subirla es lo que fuerza la reconstrucción, y si al terminar no queda
    // anotada, el próximo arranque vuelve a reconstruir para siempre.
    await guardarMeta('carpeta_fotos', ctx.fotosId);
    await guardarMeta('carpeta_sin_categoria', ctx.sinCategoriaId);
    await guardarMeta('schemaVersion', String(SCHEMA_VERSION));
    await guardarMeta('ultima_reconstruccion', ahora);
    await guardarMeta('reconstruccion_en_curso', '');
    // Una sola vez, al final: si se corta a mitad, la primera anotación ya
    // cambió la fecha de _indice, y la próxima apertura baja la planilla y ve
    // la reconstrucción en curso.
    await persistir();
    alProgresar(1);

    return { indexadas: entradas.length, ignorados };
  }

  function buscar(filtros?: Filtros | unknown): Entrada[] {
    // Lo que no es un objeto plano se trata como {}, y cada campo por su tipo.
    const filtrosValidos: Filtros =
      (filtros && typeof filtros === 'object' && !Array.isArray(filtros)) ? filtros as Filtros : {};
    const { texto, categoria, tags, dificultad } = filtrosValidos;

    const t = normalizar(String(texto ?? ''));
    const cat = String(categoria ?? '');
    const diff = String(dificultad ?? '');
    const tagList = Array.isArray(tags) ? tags : [];

    return entradas.filter(e => {
      if (cat && e.categoria !== cat) return false;
      if (diff && e.dificultad !== diff) return false;
      if (tagList.length && !tagList.every(tag => e.tags.some(x => coincideTag(x, tag)))) return false;
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
   * la comparación, no del texto que se muestra (C02.3.2).
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
      if (tag) porTag.push({ entrada: e, motivo: `tiene tag ${tag}` });
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

  /** A la papelera. Lo que ya no está en Drive no es un error: ya se fue. */
  async function aLaPapelera(id: string): Promise<void> {
    try {
      await drive.borrar(id);
    } catch (e) {
      if (!noEsta(e)) throw e;
    }
  }

  /** La carpeta base nueva: «Crear la carpeta Recetario en Mi unidad». */
  async function crearCarpeta(nombre: string, padre: string): Promise<{ id: string; nombre: string }> {
    const creada = await drive.crear({ nombre, padre, mime: MIME_CARPETA });
    return { id: creada.id, nombre };
  }

  /**
   * El setup de una carpeta base (C05.7.4): las predefinidas que falten,
   * `_indice`, el reindexado y la marca, en ese orden. La marca va última: si
   * algo falla antes, la carpeta queda sin marcar y el selector vuelve a
   * ofrecerla. Repetirlo no duplica nada.
   */
  async function prepararCarpeta(
    carpeta: { id: string; nombre: string }, alProgresar: (p: Progreso) => void = () => {}
  ): Promise<{ ignorados: string[] }> {
    ctx.raizId = carpeta.id;
    ctx.raizNombre = carpeta.nombre;
    ctx.modifiedTime = '';

    // 1. Las predefinidas que falten, con su color y su foto ya escritos. Son
    // dos viajes a Drive cada una y hasta dieciséis: sobre una carpeta recién
    // creada, este paso es el rato largo del setup.
    const existentes = new Set((await drive.listarCarpetas(carpeta.id)).map(c => normalizar(c.name ?? '')));
    const faltan = PREDEFINIDAS.filter(p => !existentes.has(normalizar(p.nombre)));
    for (const [i, p] of faltan.entries()) {
      const nueva = await drive.crear({ nombre: p.nombre, padre: carpeta.id, mime: MIME_CARPETA });
      await drive.propiedades(nueva.id, { color: p.color, foto: `catalogo:${p.foto}` });
      alProgresar(TRAMOS_SETUP.categorias * ((i + 1) / faltan.length));
    }

    // 2. `_indice`, y sin la anotación de una carpeta que se había dejado.
    const planillas = await drive.buscarPorNombre(NOMBRE_INDICE, carpeta.id);
    const masReciente = [...planillas].sort(
      (a, b) => Date.parse(b.modifiedTime ?? '') - Date.parse(a.modifiedTime ?? ''))[0];
    if (masReciente) {
      ctx.indiceId = masReciente.id;
      ctx.meta = await leerMeta();
      if (ctx.meta['reemplazada']) await guardarMeta('reemplazada', '');
    } else {
      ctx.indiceId = await crearPlanilla();
      ctx.meta = { schemaVersion: String(SCHEMA_VERSION), ultima_reconstruccion: '' };
    }
    alProgresar(TRAMOS_SETUP.indice);

    // 3. Reindexar: escribe las propiedades que falten y guarda la copia. Su
    // barra, que va de 0 a 1, entra comprimida en lo que queda de la de acá.
    const { ignorados } = await reconstruir(p => alProgresar(entre(TRAMOS_SETUP.indice, 1, p)));

    // 4. La marca, y fuera de las otras.
    try {
      for (const otra of await drive.carpetasMarcadas()) {
        if (otra.id !== carpeta.id) await drive.propiedades(otra.id, { [MARCA_RAIZ.clave]: null });
      }
      await drive.propiedades(carpeta.id, { [MARCA_RAIZ.clave]: MARCA_RAIZ.valor });
    } catch (e) {
      // La copia ya se guardó: sin marca, la próxima apertura la usaría igual.
      indiceLocal.borrar();
      throw e;
    }
    return { ignorados };
  }

  /**
   * Antes de cambiar de carpeta: la `meta` de la actual dice que quedó atrás.
   * Escribir le cambia la fecha a `_indice`, y así otro dispositivo con su copia
   * deja de usarla.
   */
  async function marcarReemplazada(): Promise<void> {
    await guardarMeta('reemplazada', 'si');
  }

  /** Las recetas de una categoría: para contarlas y nombrarlas antes de borrar. */
  function recetasDe(id: string): Entrada[] {
    return entradas.filter(e => e.carpeta_id === id);
  }

  /** Tira si el nombre no sirve; `idPropio` es la categoría que se edita. */
  function validarNombre(nombre: string, idPropio = ''): void {
    const problema = problemaDelNombre(nombre, ctx.categorias.filter(c => c.id !== idPropio).map(c => c.nombre));
    if (problema) throw new Error(problema);
  }

  /** La fila de una categoría en su hoja: su lugar en `ctx.categorias`, que sigue el orden de la hoja. */
  const filaDeLaCategoria = (id: string): number => ctx.categorias.findIndex(c => c.id === id) + 2;

  /** Lo que se pide para crear o editar una categoría. `fotoPropia` es una foto subida, que reemplaza a `foto`. */
  interface DatosCategoria {
    nombre: string;
    color: string;
    foto: string;
    fotoPropia?: Blob | undefined;
  }

  /** El id de una foto propia (`drive:<id>`); las del catálogo dan `null`. */
  const idDeFotoPropia = (foto: string): string | null =>
    foto.startsWith('drive:') ? foto.slice('drive:'.length) || null : null;

  /**
   * La foto de la categoría como queda en `appProperties`: la propia, subida a
   * `_fotos/` como `categoria-<nombre>.jpg` (el mismo slug que el tile), o la
   * que se eligió.
   */
  async function fotoDeCategoria(nombre: string, datos: DatosCategoria): Promise<string> {
    if (!datos.fotoPropia) return datos.foto;
    const slug = slugArchivo(nombre).replace(/\.md$/, '');
    return `drive:${await subirAFotos(`categoria-${slug}.jpg`, datos.fotoPropia)}`;
  }

  /**
   * Una categoría nueva: su carpeta en la raíz, con color y foto, y su fila. La
   * foto propia se sube antes que la carpeta: si falla, no queda una categoría
   * a medias.
   */
  async function crearCategoria(datos: DatosCategoria): Promise<Categoria> {
    const nombre = datos.nombre.trim();
    validarNombre(nombre);
    const foto = await fotoDeCategoria(nombre, datos);
    const carpeta = await drive.crear({ nombre, padre: ctx.raizId, mime: MIME_CARPETA });
    await drive.propiedades(carpeta.id, { color: datos.color, foto });
    const categoria: Categoria = { id: carpeta.id, nombre, color: datos.color, foto };
    await sheets.append(ctx.indiceId, HOJA_CATEGORIAS, [filaDeCategoria(categoria)]);
    usarCategorias([...ctx.categorias, categoria]);
    await persistir();
    return categoria;
  }

  /**
   * Renombrar, cambiar color o foto: la carpeta, su fila, y las recetas en
   * memoria. Si la foto cambió, la propia anterior va a la papelera al final,
   * cuando la carpeta ya no la nombra.
   */
  async function editarCategoria(id: string, datos: DatosCategoria): Promise<void> {
    const actual = ctx.categorias.find(c => c.id === id);
    if (!actual) return;
    const nombre = datos.nombre.trim();
    validarNombre(nombre, id);
    const foto = await fotoDeCategoria(nombre, datos);
    if (nombre !== actual.nombre) await drive.renombrar(id, nombre);
    if (datos.color !== actual.color || foto !== actual.foto) {
      await drive.propiedades(id, { color: datos.color, foto });
    }
    const editada: Categoria = { id, nombre, color: datos.color, foto };
    const nro = filaDeLaCategoria(id);
    await sheets.escribir(ctx.indiceId, rangoDeFila(nro, HOJA_CATEGORIAS, COLUMNAS_CATEGORIAS.length), [filaDeCategoria(editada)]);
    usarCategorias(ctx.categorias.map(c => c.id === id ? editada : c));
    entradas = entradas.map(conCategoria);
    await persistir();
    const anterior = idDeFotoPropia(actual.foto);
    if (anterior && foto !== actual.foto) await tirarFotos([anterior]);
  }

  /**
   * La carpeta a la papelera con sus recetas adentro, y sus filas afuera: las de
   * las recetas en una sola llamada —de a una, la cuota de Sheets se agota— y la
   * de la categoría. Su foto propia va al final: vive en `_fotos/`, no adentro
   * de la carpeta.
   */
  async function borrarCategoria(id: string): Promise<void> {
    const nroCategoria = filaDeLaCategoria(id);
    if (nroCategoria < 2) return;
    const propia = idDeFotoPropia(ctx.categorias.find(c => c.id === id)?.foto ?? '');
    await drive.borrar(id);

    const hojas = await sheets.hojas(ctx.indiceId);
    const nros = recetasDe(id)
      .map(e => filas.get(e.id_archivo))
      .filter((n): n is number => typeof n === 'number')
      .sort((a, b) => b - a);
    if (nros.length) {
      await sheets.borrarFilas(ctx.indiceId, idDeHoja(hojas, HOJA_RECETAS), nros);
      entradas = entradas.filter(e => e.carpeta_id !== id);
      const quedan = new Map<string, number>();
      for (const [otro, nro] of filas) {
        if (nros.includes(nro)) continue;
        // Cada fila borrada por encima corre a esta un lugar hacia arriba.
        quedan.set(otro, nro - nros.filter(n => n < nro).length);
      }
      filas = quedan;
    }

    await sheets.borrarFila(ctx.indiceId, idDeHoja(hojas, HOJA_CATEGORIAS), nroCategoria);
    usarCategorias(ctx.categorias.filter(c => c.id !== id));
    await persistir();
    if (propia) await tirarFotos([propia]);
  }

  /** La carpeta base en uso, para la ficha Cuenta de Ajustes. */
  function carpeta(): { id: string; nombre: string } {
    return { id: ctx.raizId, nombre: ctx.raizNombre };
  }

  /** Las categorías en memoria: de la copia, de la hoja o del último reindexado. */
  function categorias(): Categoria[] {
    return ctx.categorias;
  }

  /**
   * El plan de la semana. `_plan.md` no está en el índice: se lo busca por
   * nombre en la carpeta base la primera vez y el id queda en memoria. Con más
   * de uno manda el más reciente, y el aviso va a *Ajustes → Avisos*, como el
   * `_indice` repetido.
   */
  async function planSemanal(): Promise<Plan> {
    if (plan.buscado) return plan.contenido;
    const archivos = await drive.buscarPorNombre(NOMBRE_PLAN, ctx.raizId);
    plan.buscado = true;
    const ordenados = [...archivos].sort(
      (a, b) => Date.parse(b.modifiedTime ?? '') - Date.parse(a.modifiedTime ?? ''));
    const elegido = ordenados[0];
    plan.duplicado = archivos.length > 1
      ? { cantidad: archivos.length, modifiedTime: elegido?.modifiedTime ?? '' }
      : null;
    if (!elegido) return plan.contenido;
    plan.id = elegido.id;
    plan.contenido = parsePlan(await drive.leerTexto(elegido.id));
    return plan.contenido;
  }

  /**
   * El plan entero, reescrito. Se crea al primer cambio si no existía; el plan
   * vacío es un archivo vacío. Reintentar vuelve a escribir todo (R2).
   */
  async function guardarPlan(nuevo: Plan): Promise<void> {
    // Sin haberlo buscado no se sabe si ya existe, y crearlo de nuevo dejaría
    // dos archivos con el mismo nombre.
    if (!plan.buscado) await planSemanal();
    const texto = serializePlan(nuevo);
    if (plan.id) {
      await drive.actualizar(plan.id, texto);
    } else {
      const archivo = await drive.crear({ nombre: NOMBRE_PLAN, contenido: texto, padre: ctx.raizId });
      plan.id = archivo.id;
    }
    // Escrito el archivo, lo que hay en memoria es lo que dice Drive: la
    // pantalla no vuelve a leer para redibujarse.
    plan.buscado = true;
    plan.contenido = nuevo;
  }

  /** Hay más de un `_plan.md` en la carpeta base, para Ajustes. */
  const planDuplicado = (): IndiceDuplicado | null => plan.duplicado;

  return { arrancar, cargarIndice, entradas: () => entradas, guardarMeta, ultimaReconstruccion, escribirFila, guardar, crear, borrar, reconstruir, buscar, buscarPorTexto, categoriasConConteo, tagsDe, receta, recetasDe, crearCategoria, editarCategoria, borrarCategoria, carpeta, crearCarpeta, prepararCarpeta, marcarReemplazada, categorias, plan: planSemanal, guardarPlan, planDuplicado, _ctx: ctx };
}

/** El objeto que devuelve `crearStore`. Lo consumen `compartido`, `main` y los tests. */
export type Store = ReturnType<typeof crearStore>;
