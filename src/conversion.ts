/**
 * Convertir una receta con el agente. La app no llama a ningún modelo: arma
 * el pedido, y reconoce la receta en `.md` que vuelve. Las reglas del
 * formato salen de las mismas constantes que usa la app, así el pedido no se
 * desactualiza cuando cambia el esquema.
 */
import { DURACIONES, DIFICULTADES, TAGS_RESERVADOS, conEspecial } from './catalogo.js';
import { parse } from './recipe.js';
import { linkDeFoto } from './fotos-receta.js';
import { esTituloPorDefecto } from './compartido.js';
import type { Receta } from './tipos.js';

/** Una foto del pedido: su número en el depósito de la receta y su id de Drive. */
export interface FotoDelPedido {
  n: number;
  id: string;
}

/** «la 1.ª es foto:1, la 2.ª es foto:3 y la 3.ª es foto:4». */
function numeracion(fotos: readonly FotoDelPedido[]): string {
  const partes = fotos.map((f, i) => `la ${i + 1}.ª es foto:${f.n}`);
  const ultima = partes.pop() ?? '';
  return partes.length ? `${partes.join(', ')} y ${ultima}` : ultima;
}

/**
 * Qué son las fotos y cómo tratarlas. Con `links`, una línea por foto con su
 * link de Drive: es el pedido que no puede llevar las fotos como archivos.
 *
 * Cada foto se nombra con su número del depósito y no con su posición: la
 * receta que vuelve se aplica sobre ese depósito, y un depósito puede tener
 * huecos —una foto sacada— o fotos que no van —un link externo—.
 */
function parrafoDeFotos(fotos: readonly FotoDelPedido[], links: boolean): string[] {
  if (!fotos.length) return [];
  return [
    '',
    `Fotos: ${fotos.length === 1 ? 'va 1' : `van ${fotos.length}`}, en orden. Pueden ser páginas de un libro, una receta escrita a ` +
      'mano, una captura de pantalla o el plato terminado. Transcribir lo que se lee, sin inventar cantidades ni pasos ' +
      'que no estén. Una foto del plato sirve para el título y la descripción, no para la receta.',
    ...(links
      ? [...fotos.map(f => `foto:${f.n}: ${linkDeFoto(f.id)}`),
        'Las fotos están en mi Google Drive: leerlas con el conector de Drive.']
      : []),
    '',
    // Cómo se referencian en la receta que vuelve: el depósito del
    // editor las resuelve, así que la receta ya trae la portada y las
    // referencias apenas se pega o se comparte.
    `En la receta, cada foto se nombra con su número: ${numeracion(fotos)}. Si una muestra el plato terminado, poner ` +
      '`foto: foto:N`. Si una muestra un paso, sumar `![](foto:N)` al final de ese paso. No escribir la sección ' +
      'Fotos: la arma la app.'
  ];
}

/** Lo que el pedido lleva de la receta: lo que el agente usa para escribirla. */
export interface DatosDelPedido {
  id: string;
  titulo: string;
  fuente: string;
  descripcion: string;
  rinde: string;
  ingredientes: string;
  preparacion: string;
  notas: string;
}

/** «a», «a y b», «a, b y c». */
function enumerar(xs: readonly string[]): string {
  const resto = [...xs];
  const ultima = resto.pop() ?? '';
  return resto.length ? `${resto.join(', ')} y ${ultima}` : ultima;
}

/**
 * Lo que ya está escrito en el editor viaja con su rótulo: el agente parte de
 * ahí y lo completa. Sin eso, lo que vuelve reemplaza esos campos y se pierde
 * lo que el usuario había escrito. Ingredientes y preparación van en su propia
 * línea, porque son listas.
 */
function camposCargados(d: DatosDelPedido): { lineas: string[]; nombres: string[] } {
  const lineas: string[] = [];
  const nombres: string[] = [];
  const campo = (valor: string, rotulo: string, nombre: string, enBloque = false): void => {
    const v = valor.trim();
    if (!v) return;
    lineas.push(enBloque ? `${rotulo}:\n${v}` : `${rotulo}: ${v}`);
    nombres.push(nombre);
  };
  campo(d.descripcion, 'Descripción', 'descripción');
  campo(d.rinde, 'Rinde', 'rinde');
  campo(d.ingredientes, 'Ingredientes', 'ingredientes', true);
  campo(d.preparacion, 'Preparación', 'preparación', true);
  return { lineas, nombres };
}

const lista = (xs: readonly string[]): string => xs.map(x => `\`${x}\``).join(', ');

/** Las reglas del frontmatter: claves, valores cerrados y tags reservados. */
const REGLAS_DEL_FRONTMATTER: readonly string[] = [
  '- Frontmatter entre `---`, con estas claves y ninguna otra: `titulo` (obligatoria), `tags` como lista `[a, b]`, `rinde`, `tiempo`, `dificultad`, `fuente`, `foto`.',
  `- \`tiempo\` es uno de estos valores, tal cual: ${lista(DURACIONES)}. Cuenta el tiempo hasta comer, con reposo y horno. Si no se sabe, no ponerlo.`,
  `- \`dificultad\` es uno de estos valores: ${lista(DIFICULTADES)}. Si no se puede saber, no ponerla.`,
  `- En \`tags\` no usar estos: ${lista(TAGS_RESERVADOS)}.`
];

/** Las reglas del cuerpo: secciones, ingredientes y pasos. */
const REGLAS_DEL_CUERPO: readonly string[] = [
  '- Después del frontmatter, una descripción corta opcional y las secciones `## Ingredientes`, `## Preparación`, `## Variaciones` y `## Notas`, sólo las que haya.',
  '- Un ingrediente por línea: `- nombre — cantidad`. Los `###` agrupan ingredientes o tramos de la preparación.',
  '- La preparación en pasos numerados.'
];

/**
 * Las reglas del `.md`, una por línea: las mismas del pedido de *Convertir
 * con Agente* y las que recibe cualquier otro agente que escriba recetas.
 * Salen de las constantes de la app, así que no se desactualizan cuando
 * cambia el esquema. No llevan el `id` del pedido, que es de una receta.
 */
export function reglasDelFormato(): string[] {
  return [...REGLAS_DEL_FRONTMATTER, ...REGLAS_DEL_CUERPO];
}

export function pedidoDeConversion(
  datos: DatosDelPedido,
  { fotos = [], links = false }: { fotos?: readonly FotoDelPedido[]; links?: boolean } = {}
): string {
  const titulo = datos.titulo.trim();
  const fuente = datos.fuente.trim();
  const notas = datos.notas.trim();
  // El título por defecto es la fecha: no describe el plato.
  const conTitulo = !!titulo && !esTituloPorDefecto(titulo);
  const cargados = camposCargados(datos);
  return [
    'Convertir este borrador en una receta para mi Recetario, en el formato de abajo.',
    '',
    'Borrador:',
    conTitulo ? `Título: ${titulo}` : 'Título: no tiene. Proponer un título corto que represente el plato.',
    ...(fuente ? [`Fuente: ${fuente}`] : []),
    ...cargados.lineas,
    ...(notas ? [`Notas: ${notas}`] : []),
    '',
    ...(cargados.nombres.length
      ? [`Lo que ya está cargado (${enumerar(cargados.nombres)}) es el punto de partida: conservarlo y refinarlo con ` +
          'lo que aporten la fuente, las fotos, las notas y la búsqueda, sin descartar nada que no esté contradicho.', '']
      : []),
    // Con fuente, la receta es la de la fuente y la búsqueda la verifica; sin
    // fuente, la receta se arma y la búsqueda es de donde sale.
    ...(fuente
      ? ['Leer la fuente y transcribir la receta. Después, corroborarla con una búsqueda web contra una o más fuentes ' +
          'externas. Si difieren en cantidades, tiempos o temperaturas, quedarse con la fuente original y anotar la ' +
          'diferencia en `## Notas`.']
      : ['No hay fuente: proponer la receta a partir del borrador y contrastarla con una búsqueda web de una o más ' +
          'fuentes. En `fuente`, poner la URL de la fuente principal consultada.']),
    ...parrafoDeFotos(fotos, links),
    '',
    'Formato:',
    ...REGLAS_DEL_FRONTMATTER,
    `- La última línea del frontmatter es \`id: ${datos.id}\`.`,
    ...REGLAS_DEL_CUERPO,
    '',
    'No inventar temperaturas, tiempos ni cantidades que ninguna fuente respalde. No agregar datos nutricionales.',
    '',
    'Responder en formato markdown, sólo con el texto plano, sin texto antes ni después. Usar un bloque de código o una cita si hace falta para que no se le aplique formato a la salida.'
  ].join('\n');
}

/**
 * `\r\n` → `\n`, una vez, para que el resto del módulo no tenga que pensar en
 * CRLF. `parse()` de `recipe.ts` sólo reconoce `\n`: sin esto, una receta
 * compartida o pegada con saltos de Windows se detecta como receta pero se
 * parsea vacía.
 */
const normalizarSaltos = (texto: string): string => texto.replace(/\r\n/g, '\n');

/**
 * El contenido del primer bloque de código, si hay uno. El pedido acepta que
 * la respuesta venga envuelta —algunos agentes la muestran así para no
 * aplicarle formato—, y de paso tolera el texto que quede afuera del bloque.
 */
function sinBloqueDeCodigo(texto: string): string {
  const m = texto.match(/(?:^|\n)[ \t]*(`{3,}|~{3,})[^\n]*\n([\s\S]*?)\n?[ \t]*\1[ \t]*(?:\n|$)/);
  return m?.[2] ?? texto;
}

/** Sin el `>` de la cita, cuando todo lo que tiene texto viene citado. */
function sinCita(texto: string): string {
  const lineas = texto.split('\n');
  const conTexto = lineas.filter(l => l.trim());
  if (!conTexto.length || !conTexto.every(l => /^\s*>/.test(l))) return texto;
  return lineas.map(l => l.replace(/^\s*>\s?/, '')).join('\n');
}

/**
 * Lo que llega compartido, pegado o de un agente, sin el envoltorio que le
 * puso: sin CRLF, sin el bloque de código y sin la cita.
 */
export const limpiarRecibido = (texto: string): string =>
  sinCita(sinBloqueDeCodigo(normalizarSaltos(texto))).trim();

/** Empieza con un frontmatter cerrado que tiene `titulo:`. */
export function esRecetaEnMd(texto: unknown): boolean {
  if (typeof texto !== 'string') return false;
  const m = limpiarRecibido(texto).match(/^---\n([\s\S]*?)\n---(\n|$)/);
  return !!m && /^titulo\s*:/m.test(m[1] ?? '');
}

/**
 * La receta parseada, sin la clave `id`, que se devuelve aparte. Una receta
 * vieja que todavía trae `borrador:` no tiene `id`: esa clave queda en los
 * extras como cualquier otra desconocida.
 */
export function recetaRecibida(texto: string): { receta: Receta; id: string } {
  const receta = parse(limpiarRecibido(texto) + '\n');
  const id = String(receta.extras['id'] ?? '').trim();
  const extras = { ...receta.extras };
  delete extras['id'];
  return { receta: { ...receta, extras }, id };
}

/**
 * Lo pegado o recibido sobre la receta que el editor tiene abierta: título,
 * datos, tags y secciones son los de lo pegado, y el depósito de fotos es el
 * del editor —las fotos ya están ahí, y lo pegado las nombra por número—. La
 * portada que no venga queda la que estaba. Sin categoría la receta sólo puede
 * ser un borrador, así que el tag queda puesto aunque lo pegado no lo traiga.
 */
export function aplicarPegada(actual: Receta, pegada: Receta, carpeta: string): Receta {
  const receta = { ...pegada, fotos: actual.fotos, foto: pegada.foto ?? actual.foto };
  return carpeta === '' ? { ...receta, tags: conEspecial(receta.tags, 'borrador', true) } : receta;
}
