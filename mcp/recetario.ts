// Las herramientas del MCP, sin el transporte: cada una es una función sobre el
// store de la app, así el MCP lee y escribe con el mismo código que el editor.
// El servidor las registra; un transporte distinto no obliga a rehacerlas.
import { crearStore, type DriveDelStore, type SheetsDelStore, type Progreso } from '../src/store.js';
import { crearDrive } from '../src/drive.js';
import { crearSheets } from '../src/sheets.js';
import { reglasDelFormato, reglaDeReservados } from '../src/conversion.js';
import { validarMd, type Problema } from '../src/validar.js';
import { TAGS_RESERVADOS, tagEspecial } from '../src/catalogo.js';
import { normalizar } from '../src/recipe.js';
import { usosDeFotos } from '../src/fotos-receta.js';
import { SIN_CATEGORIA } from '../src/categorias.js';
import type { IndiceLocal } from '../src/indice-local.js';
import type { CambiosDeFotos, Entrada, Filtros, FotoDeReceta, Receta } from '../src/tipos.js';
import { conLogin } from './google.js';
import { numerosDeFotos, type FotoPedida } from './fotos-pedidas.js';
import { ErrorDeLogin } from './errores.js';
import type { AuthEscritorio } from './auth.js';

/**
 * La copia local del índice que usa el MCP: ninguna. La de la app vive en el
 * `localStorage` del navegador y el MCP no la ve; cada sesión lee la planilla
 * una vez y trabaja en memoria.
 */
export const indiceEnMemoria: IndiceLocal = {
  leer: () => null,
  guardar: () => {},
  borrar: () => {}
};

/**
 * Los tags reservados menos `borrador` y sus otras formas. El pedido de
 * *Convertir con Agente* prohíbe `borrador` porque la app lo pone sola; acá lo
 * decide el agente, y el resto de la prohibición sigue: `terminado`
 * contradice a `borrador`, y `favorita` es una segunda forma de `favorito`.
 */
const REGLA_RESERVADOS = reglaDeReservados(TAGS_RESERVADOS.filter(t => tagEspecial(t) !== 'borrador'));

const REGLA_BORRADOR =
  '- El tag `borrador` va cuando algo de la fuente quedó sin volcar a la receta (un renglón ilegible, la receta sigue en otra página, una cantidad dudosa), o cuando faltan los ingredientes o los pasos. Si no, no va.';

/**
 * Las fotos las sube el MCP, que arma el depósito. El número de cada una se
 * sabe antes de subirla (`numerosDeFotos`), así el `.md` ya las nombra.
 */
const REGLAS_FOTOS: readonly string[] = [
  '- La sección `## Fotos` la arma el MCP con las fotos que se le piden. Cada foto pedida tiene un número fijo, que se sabe de antemano: al crear, la foto i de la lista de fotos (contando desde 1, en el orden en que se piden) es `foto:i`; al guardar, las nuevas siguen al número más alto del depósito que devolvió `leer`, en el orden en que se piden. Una foto `fuente` que no se sube deja su número sin usar: los números nunca se reusan y los huecos valen.',
  '- La foto del plato va en `foto: foto:N`, y la de un paso con `![](foto:N)` al final de ese paso. `foto` también acepta una URL externa.',
  '- Al crear, el `.md` no lleva la sección `## Fotos`. Al corregir, la sección `## Fotos` se deja tal como vino de `leer`: para sacar una foto se pide su número en `sacar`, después de sacar del texto su `foto:N`.'
];

/**
 * Las reglas de la app, con la línea de los reservados cambiada por la del
 * MCP y la regla de `borrador` al lado, y al final las de las fotos.
 */
function reglasDelFormatoDelMcp(): string[] {
  const deLaApp = reglaDeReservados(TAGS_RESERVADOS);
  return [
    ...reglasDelFormato().flatMap(l => l === deLaApp ? [REGLA_RESERVADOS, REGLA_BORRADOR] : [l]),
    ...REGLAS_FOTOS
  ];
}

/** Lo que recibe `buscar`: texto, filtros o las dos cosas. */
export interface Consulta {
  texto?: string;
  categoria?: string;
  tags?: string[];
  dificultad?: string;
}

/** Una receta encontrada y por qué apareció. */
export interface Resultado {
  id: string;
  titulo: string;
  categoria: string;
  nombre_archivo: string;
  tags: string[];
  motivos: string[];
}

const MENSAJE_VARIAS_MARCADAS =
  'Hay más de una carpeta marcada como Recetario. Abrí la app y elegí cuál usar desde Ajustes → Cambiar carpeta.';

/**
 * El error de un arranque que no pudo leer el Drive. El store devuelve sólo el
 * mensaje; el último error de login conserva el código, pero es el del
 * arranque sólo si su mensaje es ese: uno que el store atrapó y siguió no lo es.
 */
export function errorDeSoloLectura(motivo: string, ultimoDeLogin: ErrorDeLogin | null): Error {
  if (ultimoDeLogin && ultimoDeLogin.message === motivo) return ultimoDeLogin;
  return new Error(`No se pudo leer el Drive: ${motivo}`);
}

/**
 * Lo que devuelve una herramienta que escribe. Con un problema de nivel
 * `error` no se escribió nada; los avisos no frenan la escritura y vuelven
 * junto con lo escrito.
 */
export type Escritura =
  | { escrita: true; id: string; nombre_archivo: string; problemas: Problema[] }
  | { escrita: false; problemas: Problema[] };

const hayErrores = (problemas: readonly Problema[]): boolean => problemas.some(p => p.nivel === 'error');

/**
 * La carpeta de la categoría nombrada, sin distinguir mayúsculas ni tildes:
 * el agente la escribe como la leyó o como la dice el usuario. Vacío es Sin
 * categoría, igual que su nombre. Una que no existe no se crea: el agente
 * escribió mal una que sí existe, o hay que crearla desde la app con su color
 * y su foto.
 */
export function carpetaDeCategoria(nombre: string, categorias: readonly { id: string; nombre: string }[]): string {
  const buscado = normalizar(nombre);
  if (!buscado || buscado === normalizar(SIN_CATEGORIA)) return '';
  const categoria = categorias.find(c => normalizar(c.nombre) === buscado);
  if (categoria) return categoria.id;
  throw new Error(`No hay ninguna categoría «${nombre}». Las que existen son: ${categorias.map(c => c.nombre).join(', ')}.`);
}

/**
 * La receta sin las fotos que se sacan, y las URLs que van a la papelera. Los
 * números se buscan en el depósito que está en Drive: sólo se tira una foto
 * que la receta tiene de verdad. Una foto que el `.md` todavía nombra no se
 * saca, porque la receta quedaría con una referencia rota.
 */
export function sacarFotos(
  receta: Receta, sacar: readonly number[], deposito: readonly FotoDeReceta[]
): { receta: Receta; sacadas: string[]; problemas: Problema[] } {
  const usos = usosDeFotos(receta);
  const problemas: Problema[] = [];
  const sacadas: string[] = [];
  for (const n of sacar) {
    const foto = deposito.find(f => f.n === n);
    const uso = usos.get(n);
    if (!foto) {
      problemas.push({ campo: 'fotos', nivel: 'error', mensaje: `\`foto:${n}\` no está en el depósito de la receta: no hay qué sacar.` });
    } else if (uso && (uso.portada || uso.enElTexto)) {
      problemas.push({ campo: 'fotos', nivel: 'error', mensaje: `\`foto:${n}\` se saca, pero el .md todavía la nombra: primero hay que sacar la referencia.` });
    } else {
      sacadas.push(foto.url);
    }
  }
  const quedan = receta.fotos.filter(f => !sacar.includes(f.n));
  return { receta: { ...receta, fotos: quedan }, sacadas, problemas };
}

/**
 * Cómo lee la app el `.md` y qué tiene fuera del formato. Con las fotos que
 * se van a pedir, sus números cuentan como si ya estuvieran en el depósito
 * del `.md`. No necesita el Drive.
 */
function validarConFotos(md: string, fotos: readonly FotoPedida[] = []) {
  const numeros = numerosDeFotos(fotos, validarMd(md).receta.fotos);
  return { ...validarMd(md, { fotosPendientes: numeros }), numeros };
}

/**
 * Las fotos pedidas, listas para que el store las suba, con el número que
 * les dio `numerosDeFotos`. Todavía no se achican en Node: una receta con
 * fotos pedidas no se escribe, porque nombraría fotos que no se suben.
 */
async function cambiosDeFotos(pedidas: readonly FotoPedida[], _numeros: readonly number[], sacadas: string[]): Promise<CambiosDeFotos> {
  if (pedidas.length) throw new Error('Todavía no se pueden subir fotos desde el MCP: la receta no se escribió.');
  return { nuevas: new Map(), sacadas };
}

export interface DependenciasRecetario {
  drive: DriveDelStore;
  sheets: SheetsDelStore;
  /** El login, para descartar el access token ante un 401. */
  auth: Pick<AuthEscritorio, 'olvidar'>;
}

export function crearRecetario({ drive, sheets, auth }: DependenciasRecetario) {
  /**
   * El arranque del store atrapa los errores de Drive y devuelve sólo el
   * mensaje: el último error de login que salió conserva el código.
   */
  let ultimoDeLogin: ErrorDeLogin | null = null;
  const ganchos = {
    alRechazar: () => auth.olvidar(),
    alFallar: (e: ErrorDeLogin) => { ultimoDeLogin = e; }
  };
  /**
   * Cuántas carpetas marcadas vio el arranque. `elegir-carpeta` es igual con
   * ninguna que con varias, y cada caso pide un paso distinto al usuario.
   */
  let marcadas = 0;
  const conLoginDrive = conLogin(drive, ganchos);
  // Sin caché de imágenes: el MCP no muestra fotos.
  const store = crearStore({
    drive: {
      ...conLoginDrive,
      carpetasMarcadas: async () => {
        const carpetas = await conLoginDrive.carpetasMarcadas();
        marcadas = carpetas.length;
        return carpetas;
      }
    },
    sheets: conLogin(sheets, ganchos),
    indiceLocal: indiceEnMemoria
  });

  /** El arranque de la sesión: uno solo aunque varias herramientas lo pidan a la vez. */
  let arranque: Promise<void> | null = null;

  async function arrancar(): Promise<void> {
    ultimoDeLogin = null;
    marcadas = 0;
    const resultado = await store.arrancar();
    // Ninguna carpeta marcada, o más de una: la app la hace elegir, y el MCP
    // no elige por el usuario.
    if (resultado.estado === 'elegir-carpeta') {
      if (marcadas > 1) {
        throw new ErrorDeLogin('sin-carpeta', { detalle: String(marcadas), mensaje: MENSAJE_VARIAS_MARCADAS });
      }
      throw new ErrorDeLogin('sin-carpeta');
    }
    if (resultado.estado === 'solo-lectura') throw errorDeSoloLectura(resultado.motivo, ultimoDeLogin);
    // Como la app: un índice viejo o a medio hacer se rehace en lugar de cargarse.
    if (resultado.reconstruir) await store.reconstruir();
    else await store.cargarIndice();
  }

  /** El store listo; si el arranque falla, el próximo uso lo reintenta. */
  function listo(): Promise<void> {
    arranque ??= arrancar().catch((e: unknown) => {
      arranque = null;
      throw e;
    });
    return arranque;
  }

  /**
   * Sólo recetas del índice: con el permiso `drive`, un id cualquiera podría
   * ser cualquier archivo del usuario. Una receta subida a mano aparece al
   * reindexar.
   */
  function entradaDe(id: string): Entrada {
    const entrada = store.entradas().find(e => e.id_archivo === id);
    if (!entrada) {
      throw new Error(`No hay ninguna receta con el id ${id} en el índice. Si se subió a Drive por fuera, hay que reindexar.`);
    }
    return entrada;
  }

  const resultado = (e: Entrada, motivos: string[]): Resultado => ({
    id: e.id_archivo, titulo: e.titulo, categoria: e.categoria,
    nombre_archivo: e.nombre_archivo, tags: e.tags, motivos
  });

  /** Los filtros como motivo: en una búsqueda sin texto, son lo único que coincidió. */
  function motivosDeFiltros({ categoria, tags, dificultad }: Consulta): string[] {
    return [
      ...(categoria ? [`categoría ${categoria}`] : []),
      ...(tags ?? []).map(t => `tag ${t}`),
      ...(dificultad ? [`dificultad ${dificultad}`] : [])
    ];
  }

  /**
   * Como la app: con texto, la búsqueda de la app, que separa por título,
   * ingrediente y tag y no trae borradores; los filtros recortan esos
   * resultados. Sin texto, o pidiendo borradores, el filtro de la app, que
   * trae borradores sólo si se piden con el tag.
   */
  function buscarEnIndice(consulta: Consulta): Resultado[] {
    const texto = (consulta.texto ?? '').trim();
    const filtros: Filtros = {
      ...(consulta.categoria ? { categoria: consulta.categoria } : {}),
      ...(consulta.tags ? { tags: consulta.tags } : {}),
      ...(consulta.dificultad ? { dificultad: consulta.dificultad } : {})
    };
    const deFiltros = motivosDeFiltros(consulta);
    const pideBorradores = (consulta.tags ?? []).some(t => tagEspecial(t) === 'borrador');

    if (!texto || pideBorradores) {
      const porTexto = texto ? [`«${texto}» en el título o los ingredientes`] : [];
      return store.buscar({ ...filtros, texto }).map(e => resultado(e, [...porTexto, ...deFiltros]));
    }

    const permitidas = new Set(store.buscar(filtros).map(e => e.id_archivo));
    const { porNombre, porIngrediente, porTag } = store.buscarPorTexto(texto);
    const encontradas = new Map<string, { entrada: Entrada; motivos: string[] }>();
    const sumar = (entrada: Entrada, motivo: string): void => {
      if (!permitidas.has(entrada.id_archivo)) return;
      const ya = encontradas.get(entrada.id_archivo);
      if (ya) ya.motivos.push(motivo);
      else encontradas.set(entrada.id_archivo, { entrada, motivos: [motivo] });
    };
    for (const e of porNombre) sumar(e, 'título');
    for (const c of porIngrediente) sumar(c.entrada, c.motivo);
    for (const c of porTag) sumar(c.entrada, c.motivo);
    return [...encontradas.values()].map(({ entrada, motivos }) => resultado(entrada, [...motivos, ...deFiltros]));
  }

  return {
    /** Las reglas del `.md`. No necesita el Drive. */
    formato: (): string[] => reglasDelFormatoDelMcp(),

    /**
     * Cómo lee la app el `.md` y qué tiene fuera del formato. Con las fotos que
     * se van a pedir, sus números cuentan como si ya estuvieran en el depósito.
     * No necesita el Drive.
     */
    /** Cómo lee la app el `.md` y qué tiene fuera del formato. No necesita el Drive. */
    validar(md: string, fotos: readonly FotoPedida[] = []): { receta: Receta; problemas: Problema[] } {
      const { receta, problemas } = validarConFotos(md, fotos);
      return { receta, problemas };
    },

    async categorias(): Promise<{ id: string; nombre: string; cantidad: number }[]> {
      await listo();
      return store.categoriasConConteo();
    },

    async tags(): Promise<{ tag: string; cantidad: number }[]> {
      await listo();
      return store.tagsDe('recetas');
    },

    async buscar(consulta: Consulta = {}): Promise<Resultado[]> {
      await listo();
      return buscarEnIndice(consulta);
    },

    /** El `.md` como está ahora en Drive, con su categoría y su nombre de archivo. */
    async leer(id: string): Promise<{ id: string; md: string; categoria: string; nombre_archivo: string }> {
      await listo();
      const entrada = entradaDe(id);
      const { texto } = await store.receta(id);
      return { id, md: texto, categoria: entrada.categoria, nombre_archivo: entrada.nombre_archivo };
    },

    /**
     * Una receta nueva, con el mismo camino que el alta del editor: el `.md` y
     * su fila juntos. La categoría se resuelve antes de validar, así un nombre
     * mal escrito no llega a escribir nada. Cada receta se escribe entera o no
     * se escribe: en un lote cortado, las anteriores quedan escritas.
     */
    async crear({ md, categoria = '', fotos = [] }: {
      md: string; categoria?: string; fotos?: readonly FotoPedida[];
    }): Promise<Escritura> {
      await listo();
      const carpetaId = carpetaDeCategoria(categoria, store.categorias());
      const { receta, problemas, numeros } = validarConFotos(md, fotos);
      if (hayErrores(problemas)) return { escrita: false, problemas };
      const cambios = await cambiosDeFotos(fotos, numeros, []);
      const { id, nombre_archivo } = await store.crear(receta, carpetaId ? { carpetaId, fotos: cambios } : { fotos: cambios });
      return { escrita: true, id, nombre_archivo, problemas };
    },

    /**
     * Reescribe una receta del índice. Antes de escribir la relee de Drive,
     * como Guardar en el editor: los números de las fotos nuevas siguen al
     * depósito de ese momento, y las que se sacan se buscan ahí. Las claves y
     * las secciones que la app no conoce pasan tal cual del `.md` recibido.
     * `categoria` ausente no mueve la receta; vacía la pasa a Sin categoría.
     */
    async guardar({ id, md, categoria, fotos = [], sacar = [] }: {
      id: string; md: string; categoria?: string; fotos?: readonly FotoPedida[]; sacar?: readonly number[];
    }): Promise<Escritura> {
      await listo();
      const entrada = entradaDe(id);
      const carpetaDestino = categoria === undefined ? undefined : carpetaDeCategoria(categoria, store.categorias());
      const deposito = (await store.receta(id)).receta.fotos;
      const numeros = numerosDeFotos(fotos, deposito);
      const validada = validarMd(md, { fotosPendientes: numeros });
      const sinSacadas = sacarFotos(validada.receta, sacar, deposito);
      const problemas = [...validada.problemas, ...sinSacadas.problemas];
      if (hayErrores(problemas)) return { escrita: false, problemas };
      const cambios = await cambiosDeFotos(fotos, numeros, sinSacadas.sacadas);
      await store.guardar(id, sinSacadas.receta, { carpetaDestino, fotos: cambios });
      return { escrita: true, id, nombre_archivo: entrada.nombre_archivo, problemas };
    },

    /** A la papelera, con su fila y sus fotos de `_fotos/`, como Borrar en la app. */
    async borrar(id: string): Promise<void> {
      await listo();
      entradaDe(id);
      await store.borrar(id);
    },

    /**
     * Rehace el índice entero desde las carpetas, como *Reindexar* en Ajustes.
     * `alProgresar` recibe el avance, de 0 a 1.
     */
    async reindexar(alProgresar: (p: Progreso) => void = () => {}): Promise<{ indexadas: number; ignorados: string[]; sinBorrador: string[] }> {
      await listo();
      return store.reconstruir(alProgresar);
    }
  };
}

export type Recetario = ReturnType<typeof crearRecetario>;

/** El recetario contra Google: los clientes de la app con el token del login de escritorio. */
export function recetarioDeGoogle(auth: AuthEscritorio): Recetario {
  const token = (): Promise<string> => auth.token();
  return crearRecetario({ drive: crearDrive(token), sheets: crearSheets(token), auth });
}
