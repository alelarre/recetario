// Las herramientas del MCP, sin el transporte: cada una es una función sobre el
// store de la app, así el MCP lee y escribe con el mismo código que el editor.
// El servidor las registra; un transporte distinto no obliga a rehacerlas.
import { crearStore, type DriveDelStore, type SheetsDelStore } from '../src/store.js';
import { crearDrive } from '../src/drive.js';
import { crearSheets } from '../src/sheets.js';
import { reglasDelFormato } from '../src/conversion.js';
import { validarMd } from '../src/validar.js';
import { tagEspecial } from '../src/catalogo.js';
import type { IndiceLocal } from '../src/indice-local.js';
import type { Entrada, Filtros } from '../src/tipos.js';
import { conLogin } from './google.js';
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
 * Las reglas del `.md` que el MCP suma a las de la app. El pedido de
 * *Convertir con Agente* no lleva `borrador` porque la app lo pone sola; acá
 * lo decide el agente. Y las fotos las sube el MCP, que arma el depósito.
 */
export const reglasDelMcp: readonly string[] = [
  '- El tag `borrador` va cuando algo de la fuente quedó sin volcar a la receta (un renglón ilegible, la receta sigue en otra página, una cantidad dudosa), o cuando faltan los ingredientes o los pasos. Si no, no va.',
  '- La sección `## Fotos` no se escribe: el depósito lo arma el MCP con las fotos que recibe, y devuelve el número de cada una. Con ese número, la foto del plato va en `foto: foto:N` y la de un paso con `![](foto:N)` al final de ese paso.'
];

/** Las reglas de la app, sin la que prohíbe el tag `borrador`, y las del MCP. */
function reglasDelFormatoDelMcp(): string[] {
  return [...reglasDelFormato().filter(l => !l.includes('`borrador`')), ...reglasDelMcp];
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
  // Sin caché de imágenes: el MCP no muestra fotos.
  const store = crearStore({
    drive: conLogin(drive, ganchos),
    sheets: conLogin(sheets, ganchos),
    indiceLocal: indiceEnMemoria
  });

  /** El arranque de la sesión: uno solo aunque varias herramientas lo pidan a la vez. */
  let arranque: Promise<void> | null = null;

  async function arrancar(): Promise<void> {
    ultimoDeLogin = null;
    const resultado = await store.arrancar();
    // Ninguna carpeta marcada, o más de una: la app la hace elegir, y el MCP
    // no elige por el usuario.
    if (resultado.estado === 'elegir-carpeta') throw new ErrorDeLogin('sin-carpeta');
    if (resultado.estado === 'solo-lectura') {
      throw ultimoDeLogin ?? new Error(`No se pudo leer el Drive: ${resultado.motivo}`);
    }
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

    /** Cómo lee la app el `.md` y qué tiene fuera del formato. No necesita el Drive. */
    validar: (md: string) => validarMd(md),

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
