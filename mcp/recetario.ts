// Las herramientas del MCP, sin el transporte: cada una es una función sobre el
// store de la app, así el MCP lee y escribe con el mismo código que el editor.
// El servidor las registra; un transporte distinto no obliga a rehacerlas.
import { crearStore, type DriveDelStore, type SheetsDelStore, type Progreso } from '../src/store.js';
import { crearDrive } from '../src/drive.js';
import { crearSheets } from '../src/sheets.js';
import { reglasDelFormato, reglaDeReservados } from '../src/conversion.js';
import { leerRecibido, problemasDe, type Problema } from '../src/validar.js';
import { TAGS_RESERVADOS, tagEspecial, tieneEspecial } from '../src/catalogo.js';
import { normalizar } from '../src/recipe.js';
import { idDeDrive } from '../src/fotos-receta.js';
import { SIN_CATEGORIA } from '../src/categorias.js';
import type { CopiaIndice, IndiceLocal } from '../src/indice-local.js';
import type { CambiosDeFotos, Entrada, Filtros, FotoDeReceta, Receta } from '../src/tipos.js';
import { conLogin } from './google.js';
import { fotosQueSeSuben, numerosDeFotos, portadaCon, type FotoASubir, type FotoPedida } from './fotos-pedidas.js';
import { achicarEnNode, NoSeBajo } from './fotos.js';
import { ErrorDeLogin, mensajeDeGoogle, type ErrorDeGoogle } from './errores.js';
import type { AuthEscritorio } from './auth.js';

/**
 * La copia del índice que usa el MCP: la última, en una variable del proceso.
 * La de la app vive en el `localStorage` del navegador y el MCP no la ve. Con
 * ella, cada herramienta pide sólo la fecha de `_indice` y relee la planilla
 * únicamente si cambió: el proceso vive días, y las filas se escriben por
 * posición. Clona al guardar y al leer, como el JSON de `localStorage`, para
 * que el store no comparta objetos con la copia.
 */
export function indiceEnMemoria(): IndiceLocal {
  let copia: CopiaIndice | null = null;
  return {
    leer: () => (copia ? structuredClone(copia) : null),
    guardar: c => { copia = structuredClone(c); },
    borrar: () => { copia = null; }
  };
}

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
  '- La foto del plato va en `foto: foto:N`, y la de un paso con `![](foto:N)` al final de ese paso. `foto` también acepta una URL externa. Si el `.md` no trae `foto:`, el MCP pone la primera foto `plato` que se sube.',
  '- No escribas la sección `## Fotos`: la arma el MCP, y la que traiga el `.md` se ignora. `leer` la muestra para que sepas qué números hay. Una foto se saca sólo pidiendo su número en `sacar`, después de sacar del texto su `foto:N`.'
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
  texto?: string | undefined;
  categoria?: string | undefined;
  tags?: string[] | undefined;
  dificultad?: string | undefined;
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
 * mensaje; el último error de login y el último de Google conservan el código
 * y el status, pero son los del arranque sólo si su mensaje es ese: uno que el
 * store atrapó y siguió no lo es. El mensaje de uno de Google es el cuerpo
 * crudo de la respuesta, así que sale sólo el status.
 */
export function errorDeSoloLectura(
  motivo: string, ultimoDeLogin: ErrorDeLogin | null, ultimoDeGoogle: ErrorDeGoogle | null = null
): Error {
  if (ultimoDeLogin && ultimoDeLogin.message === motivo) return ultimoDeLogin;
  if (ultimoDeGoogle && ultimoDeGoogle.message === motivo) {
    return new Error(`No se pudo leer el Drive: ${mensajeDeGoogle(ultimoDeGoogle)}`);
  }
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
 * La categoría nombrada, sin distinguir mayúsculas ni tildes: el agente la
 * escribe como la leyó o como la dice el usuario. Vacío o el nombre de Sin
 * categoría es `null`. Una que no existe no se crea: el agente escribió mal
 * una que sí existe, o hay que crearla desde la app con su color y su foto.
 */
function categoriaNombrada<C extends { id: string; nombre: string }>(nombre: string, categorias: readonly C[]): C | null {
  const buscado = normalizar(nombre);
  if (!buscado || buscado === normalizar(SIN_CATEGORIA)) return null;
  const categoria = categorias.find(c => normalizar(c.nombre) === buscado);
  if (categoria) return categoria;
  throw new Error(`No hay ninguna categoría «${nombre}». Las que existen son: ${categorias.map(c => c.nombre).join(', ')}.`);
}

/** La carpeta de la categoría nombrada; vacía es Sin categoría. */
export function carpetaDeCategoria(nombre: string, categorias: readonly { id: string; nombre: string }[]): string {
  return categoriaNombrada(nombre, categorias)?.id ?? '';
}

/**
 * El depósito que se escribe al guardar: el que está en Drive, menos las
 * fotos que se sacan. La sección `## Fotos` del `.md` recibido no cuenta: un
 * depósito alterado perdería fotos o nombraría las de otra receta, que el
 * store después mandaría a la papelera como propias. Un número repetido se
 * saca una vez; uno que no está es error.
 */
export function sacarDelDeposito(
  deposito: readonly FotoDeReceta[], sacar: readonly number[]
): { quedan: FotoDeReceta[]; sacadas: string[]; problemas: Problema[] } {
  const pedidos = new Set(sacar);
  const problemas: Problema[] = [...pedidos]
    .filter(n => !deposito.some(f => f.n === n))
    .map(n => ({
      campo: 'fotos', nivel: 'error' as const,
      mensaje: `\`foto:${n}\` no está en el depósito de la receta: no hay qué sacar.`
    }));
  const quedan = deposito.filter(f => !pedidos.has(f.n));
  // Una foto que otra línea sigue nombrando no va a la papelera: esa línea
  // quedaría apuntando a un archivo borrado. Un archivo de Drive se reconoce
  // por su id, porque dos links distintos pueden llevar al mismo.
  const clave = (url: string): string => idDeDrive(url) ?? url;
  const siguen = new Set(quedan.map(f => clave(f.url)));
  const sacadas = new Map<string, string>();
  for (const f of deposito) {
    if (pedidos.has(f.n) && !siguen.has(clave(f.url))) sacadas.set(clave(f.url), f.url);
  }
  return { quedan, sacadas: [...sacadas.values()], problemas };
}

/** El número que va a tener una foto pedida en el depósito, y si se sube. */
export interface NumeroDeFoto extends FotoPedida {
  n: number;
  seSube: boolean;
}

/**
 * El aviso de un `.md` que trae su propio depósito: se ignora siempre, y el
 * agente tiene que saber que lo que escribió ahí no llega a Drive. Al
 * corregir, `enDrive` es el depósito actual: el que vino de `leer` sin tocar
 * no avisa, porque un aviso de todas las veces se aprende a ignorar. Se
 * compara por número y URL, sin importar el orden.
 */
function fotosIgnoradas(recibida: Receta, enDrive: readonly FotoDeReceta[] = []): Problema[] {
  if (!recibida.fotos.length) return [];
  const clave = (f: FotoDeReceta): string => `${f.n} ${f.url}`;
  const deDrive = new Set(enDrive.map(clave));
  const igual = recibida.fotos.length === enDrive.length && recibida.fotos.every(f => deDrive.has(clave(f)));
  return igual
    ? []
    : [{ campo: 'fotos', nivel: 'aviso', mensaje: 'Se ignoró la sección `## Fotos` del .md; el depósito lo arma el MCP.' }];
}

/** Una receta nueva no tiene depósito: sacar fotos es sólo al corregir, con el `id`. */
const SACAR_SIN_ID: Problema = {
  campo: 'fotos', nivel: 'error',
  mensaje: '`sacar` es para corregir una receta: pasá también su `id`. Sin `id`, se valida como una receta nueva, que no tiene fotos que sacar.'
};

/**
 * Una receta nueva armada sin escribir, como la escribe `crear`: el depósito
 * vacío más las fotos que se van a pedir, y los problemas contra ese
 * depósito. No necesita el Drive.
 */
function armarNueva(md: string, fotos: readonly FotoPedida[]) {
  const recibida = leerRecibido(md);
  const { receta, seSuben } = conFotosPedidas(recibida, [], fotos, []);
  const problemas = [...problemasDe(receta, { fotosPendientes: seSuben.map(s => s.n) }), ...fotosIgnoradas(recibida)];
  return { receta, problemas, seSuben, numeros: numerados(fotos, [], seSuben) };
}

/** La herramienta `validar` sin `id`: la receta nueva como la armaría `crear`. */
function validarNueva(md: string, fotos: readonly FotoPedida[] = [], sacar: readonly number[] = []): {
  receta: Receta; problemas: Problema[]; fotos: NumeroDeFoto[];
} {
  const { receta, problemas, numeros } = armarNueva(md, fotos);
  return { receta, problemas: sacar.length ? [...problemas, SACAR_SIN_ID] : problemas, fotos: numeros };
}

/**
 * El número de cada foto pedida y si se sube: el agente escribe `foto:N` con
 * estos números. `seSube` en falso es una `fuente` que no se sube porque la
 * receta no lleva `borrador`.
 */
function numerados(
  fotos: readonly FotoPedida[], numerarDesde: readonly FotoDeReceta[], seSuben: readonly FotoASubir[]
): NumeroDeFoto[] {
  const numeros = numerosDeFotos(fotos, numerarDesde);
  const subidas = new Set(seSuben.map(s => s.n));
  return fotos.map((f, i) => {
    const n = numeros[i] ?? 0;
    return { origen: f.origen, uso: f.uso, n, seSube: subidas.has(n) };
  });
}

/**
 * La receta recibida con el depósito que se va a escribir (`deposito`) y la
 * portada que pone una foto del plato, y cuáles de las pedidas se suben.
 */
function conFotosPedidas(
  recibida: Receta, deposito: FotoDeReceta[], pedidas: readonly FotoPedida[], numerarDesde: readonly FotoDeReceta[]
): { receta: Receta; seSuben: FotoASubir[] } {
  const seSuben = fotosQueSeSuben(pedidas, numerarDesde, { conBorrador: tieneEspecial(recibida, 'borrador') });
  return { receta: { ...recibida, fotos: deposito, foto: portadaCon(recibida.foto, seSuben) }, seSuben };
}

/**
 * Achica las fotos que se suben y las suma al depósito, cada una con su
 * número: la línea va sin URL, que el store completa al subir el blob del
 * mismo número. Una URL que no se bajó entra como link externo, como en *Por
 * URL*. Cualquier otra falla corta antes de escribir nada, con el nombre de la
 * foto.
 */
async function prepararFotos(
  receta: Receta, seSuben: readonly FotoASubir[], sacadas: string[], achicar: (origen: string) => Promise<Blob>
): Promise<{ receta: Receta; cambios: CambiosDeFotos }> {
  const nuevas = new Map<number, Blob>();
  const lineas: FotoDeReceta[] = [];
  for (const { n, pedida } of seSuben) {
    try {
      nuevas.set(n, await achicar(pedida.origen));
      lineas.push({ n, url: '' });
    } catch (e) {
      if (!(e instanceof NoSeBajo)) throw e;
      // La URL normalizada: la que llegó puede no tener la forma de una línea del depósito.
      lineas.push({ n, url: e.url });
    }
  }
  return { receta: { ...receta, fotos: [...receta.fotos, ...lineas] }, cambios: { nuevas, sacadas } };
}

/** Lo que recibe una corrección: la receta, el `.md` nuevo, las fotos que se suben y las que se sacan. */
export interface Correccion {
  id: string;
  md: string;
  fotos?: readonly FotoPedida[] | undefined;
  sacar?: readonly number[] | undefined;
}

export interface DependenciasRecetario {
  drive: DriveDelStore;
  sheets: SheetsDelStore;
  /** El login, para descartar el access token ante un 401. */
  auth: Pick<AuthEscritorio, 'olvidar'>;
  /** La foto de una ruta o una URL, achicada. Los tests cambian la red. */
  achicar?: (origen: string) => Promise<Blob>;
}

export function crearRecetario({ drive, sheets, auth, achicar = origen => achicarEnNode(origen) }: DependenciasRecetario) {
  /**
   * El arranque del store atrapa los errores de Drive y devuelve sólo el
   * mensaje: el último error de login que salió conserva el código.
   */
  let ultimoDeLogin: ErrorDeLogin | null = null;
  let ultimoDeGoogle: ErrorDeGoogle | null = null;
  const ganchos = {
    alRechazar: () => auth.olvidar(),
    alFallar: (e: ErrorDeLogin) => { ultimoDeLogin = e; },
    alFallarGoogle: (e: ErrorDeGoogle) => { ultimoDeGoogle = e; }
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
    indiceLocal: indiceEnMemoria()
  });

  /** La última herramienta que usa el Drive: la próxima empieza cuando esta termina. */
  let cola: Promise<unknown> = Promise.resolve();

  /**
   * El arranque de la app, antes de cada herramienta que usa el Drive: con la
   * copia en memoria cuesta un pedido, la fecha de `_indice`, y trae lo que la
   * app escribió desde el anterior —recetas, filas corridas, categorías, otra
   * carpeta—.
   */
  async function arrancar(): Promise<void> {
    ultimoDeLogin = null;
    ultimoDeGoogle = null;
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
    if (resultado.estado === 'solo-lectura') throw errorDeSoloLectura(resultado.motivo, ultimoDeLogin, ultimoDeGoogle);
    // Como la app: un índice viejo o a medio hacer se rehace en lugar de cargarse.
    if (resultado.reconstruir) await store.reconstruir();
    else await store.cargarIndice();
  }

  /**
   * Una herramienta que usa el Drive, con el store al día y de a una: el
   * agente puede pedir varias a la vez, y un arranque en medio de una
   * escritura cambiaría las filas que esa escritura está usando. Un error no
   * frena a las que siguen.
   */
  function conElDrive<T>(tarea: () => Promise<T>): Promise<T> {
    const turno = cola.then(async () => {
      await arrancar();
      return tarea();
    });
    cola = turno.catch(() => {});
    return turno;
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
  function buscarEnIndice(pedida: Consulta): Resultado[] {
    // La categoría con el nombre que tiene en el índice, que es con el que filtra la app.
    const consulta: Consulta = pedida.categoria
      ? { ...pedida, categoria: categoriaNombrada(pedida.categoria, store.categorias())?.nombre ?? SIN_CATEGORIA }
      : pedida;
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

  /**
   * Una corrección armada sin escribir: la receta recibida con el depósito
   * releído de Drive menos las que se sacan, las nuevas numeradas desde ese
   * depósito, sacadas incluidas, porque los números no se reusan, y los
   * problemas contra el depósito resultante.
   */
  async function armarCorreccion({ id, md, fotos = [], sacar = [] }: Correccion) {
    const enDrive = (await store.receta(id)).receta.fotos;
    const { quedan, sacadas, problemas: alSacar } = sacarDelDeposito(enDrive, sacar);
    const recibida = leerRecibido(md);
    const { receta, seSuben } = conFotosPedidas(recibida, quedan, fotos, enDrive);
    const problemas = [...problemasDe(receta, { fotosPendientes: seSuben.map(s => s.n) }), ...alSacar, ...fotosIgnoradas(recibida, enDrive)];
    return { receta, problemas, seSuben, sacadas, numeros: numerados(fotos, enDrive, seSuben) };
  }

  return {
    /** Las reglas del `.md`. No necesita el Drive. */
    formato: (): string[] => reglasDelFormatoDelMcp(),

    validar: validarNueva,

    categorias(): Promise<{ id: string; nombre: string; cantidad: number }[]> {
      return conElDrive(async () => store.categoriasConConteo());
    },

    tags(): Promise<{ tag: string; cantidad: number }[]> {
      return conElDrive(async () => store.tagsDe('recetas'));
    },

    buscar(consulta: Consulta = {}): Promise<Resultado[]> {
      return conElDrive(async () => buscarEnIndice(consulta));
    },

    /** El `.md` como está ahora en Drive, con su categoría y su nombre de archivo. */
    leer(id: string): Promise<{ id: string; md: string; categoria: string; nombre_archivo: string }> {
      return conElDrive(async () => {
        const entrada = entradaDe(id);
        const { texto } = await store.receta(id);
        return { id, md: texto, categoria: entrada.categoria, nombre_archivo: entrada.nombre_archivo };
      });
    },

    /**
     * Una receta nueva, con el mismo camino que el alta del editor: el `.md` y
     * su fila juntos. La categoría se resuelve antes de validar, así un nombre
     * mal escrito no llega a escribir nada. Cada receta se escribe entera o no
     * se escribe: en un lote cortado, las anteriores quedan escritas.
     */
    crear({ md, categoria = '', fotos = [] }: {
      md: string; categoria?: string | undefined; fotos?: readonly FotoPedida[] | undefined;
    }): Promise<Escritura> {
      return conElDrive<Escritura>(async () => {
        const carpetaId = carpetaDeCategoria(categoria, store.categorias());
        const { receta: armada, problemas, seSuben } = armarNueva(md, fotos);
        if (hayErrores(problemas)) return { escrita: false, problemas };
        const { receta, cambios } = await prepararFotos(armada, seSuben, [], achicar);
        const { id, nombre_archivo } = await store.crear(receta, carpetaId ? { carpetaId, fotos: cambios } : { fotos: cambios });
        return { escrita: true, id, nombre_archivo, problemas };
      });
    },

    /**
     * `validar` al corregir una receta: con el mismo armado que `guardar`
     * —el depósito de Drive, menos `sacar`, más las nuevas—, así los números
     * que dice son los que `guardar` va a usar. No escribe nada.
     */
    validarAlCorregir(pedido: Correccion): Promise<{ receta: Receta; problemas: Problema[]; fotos: NumeroDeFoto[] }> {
      return conElDrive(async () => {
        entradaDe(pedido.id);
        const { receta, problemas, numeros } = await armarCorreccion(pedido);
        return { receta, problemas, fotos: numeros };
      });
    },

    /**
     * Reescribe una receta del índice. Antes de escribir la relee de Drive,
     * como Guardar en el editor: los números de las fotos nuevas siguen al
     * depósito de ese momento, y las que se sacan se buscan ahí. Las claves y
     * las secciones que la app no conoce pasan tal cual del `.md` recibido.
     * `categoria` ausente no mueve la receta; vacía la pasa a Sin categoría.
     */
    guardar({ categoria, ...pedido }: Correccion & { categoria?: string | undefined }): Promise<Escritura> {
      return conElDrive<Escritura>(async () => {
        const entrada = entradaDe(pedido.id);
        const carpetaDestino = categoria === undefined ? undefined : carpetaDeCategoria(categoria, store.categorias());
        const { receta: recibida, problemas, seSuben, sacadas } = await armarCorreccion(pedido);
        if (hayErrores(problemas)) return { escrita: false, problemas };
        const { receta, cambios } = await prepararFotos(recibida, seSuben, sacadas, achicar);
        await store.guardar(pedido.id, receta, { carpetaDestino, fotos: cambios });
        return { escrita: true, id: pedido.id, nombre_archivo: entrada.nombre_archivo, problemas };
      });
    },

    /**
     * A la papelera, con su fila y sus fotos de `_fotos/`, como Borrar en la
     * app. `confirmacion` es el título exacto de la receta en el índice: el
     * agente no borra con un id solo, que puede ser el de otra receta, ni sin
     * que el usuario haya visto cuál es. Una receta sin título —o con uno de
     * sólo espacios— se confirma con su nombre de archivo: una confirmación
     * vacía no confirma nada. El error no dice qué se esperaba: un agente con
     * el id equivocado reintentaría con eso y borraría la receta equivocada.
     */
    borrar({ id, confirmacion }: { id: string; confirmacion?: string | undefined }): Promise<void> {
      return conElDrive(async () => {
        const { titulo, nombre_archivo } = entradaDe(id);
        const esperada = titulo.trim() ? titulo : nombre_archivo;
        if (!confirmacion || confirmacion !== esperada) {
          throw new Error('La confirmación no coincide con la receta de ese id. Volvé a buscarla con `leer`, mostrásela al usuario y pedile confirmación.');
        }
        await store.borrar(id);
      });
    },

    /**
     * Rehace el índice entero desde las carpetas, como *Reindexar* en Ajustes.
     * `alProgresar` recibe el avance, de 0 a 1.
     */
    reindexar(alProgresar: (p: Progreso) => void = () => {}): Promise<{ indexadas: number; ignorados: string[]; sinBorrador: string[] }> {
      return conElDrive(async () => store.reconstruir(alProgresar));
    }
  };
}

export type Recetario = ReturnType<typeof crearRecetario>;

/** El recetario contra Google: los clientes de la app con el token del login de escritorio. */
export function recetarioDeGoogle(auth: AuthEscritorio): Recetario {
  const token = (): Promise<string> => auth.token();
  return crearRecetario({ drive: crearDrive(token), sheets: crearSheets(token), auth });
}
