// Las herramientas del MCP, sin el transporte: cada una es una función sobre el
// store de la app, así el MCP lee y escribe con el mismo código que el editor.
// El servidor las registra; un transporte distinto no obliga a rehacerlas.
import { crearStore, type DriveDelStore, type SheetsDelStore } from '../src/store.js';
import { crearDrive } from '../src/drive.js';
import { crearSheets } from '../src/sheets.js';
import { reglasDelFormato, reglaDeReservados } from '../src/conversion.js';
import { validarMd } from '../src/validar.js';
import { TAGS_RESERVADOS, tagEspecial } from '../src/catalogo.js';
import type { IndiceLocal } from '../src/indice-local.js';
import type { Entrada, Filtros } from '../src/tipos.js';
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
  '- Al crear, el `.md` no lleva la sección `## Fotos`. Al corregir, la sección `## Fotos` se deja tal como vino de `leer`.'
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
    validar(md: string, fotos: readonly FotoPedida[] = []) {
      const deposito = validarMd(md).receta.fotos;
      return validarMd(md, { fotosPendientes: numerosDeFotos(fotos, deposito) });
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

    /**
     * Sólo recetas del índice: con el permiso `drive`, un id cualquiera podría
     * ser cualquier archivo del usuario. Una receta subida a mano aparece al
     * reindexar.
     */
    async leer(id: string): Promise<{ id: string; md: string; categoria: string; nombre_archivo: string }> {
      await listo();
      const entrada = store.entradas().find(e => e.id_archivo === id);
      if (!entrada) {
        throw new Error(`No hay ninguna receta con el id ${id} en el índice. Si se subió a Drive por fuera, hay que reindexar.`);
      }
      const { texto } = await store.receta(id);
      return { id, md: texto, categoria: entrada.categoria, nombre_archivo: entrada.nombre_archivo };
    }
  };
}

export type Recetario = ReturnType<typeof crearRecetario>;

/** El recetario contra Google: los clientes de la app con el token del login de escritorio. */
export function recetarioDeGoogle(auth: AuthEscritorio): Recetario {
  const token = (): Promise<string> => auth.token();
  return crearRecetario({ drive: crearDrive(token), sheets: crearSheets(token), auth });
}
