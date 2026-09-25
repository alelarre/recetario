// tests/main-rutas.test.ts
//
// `main.ts` es el cableado: no exporta nada y corre sobre `environment: 'node'`,
// así que la única forma de probarlo es simular su entorno global y sus
// dependencias, y después mirar qué se pintó. Lo que se prueba acá es lo que
// sólo se ve en el cableado: que cada ruta dibuje su pantalla, y que un fallo
// de red avise sin dejar datos de una lectura anterior.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ErrorDeDrive } from '../src/drive.js';
import { comoGlobal, limpiarGlobales, historialFalso } from './dom-falso.js';
import { entradaFalsa } from './dobles.js';
import { parse } from '../src/recipe.js';
import { DURACIONES } from '../src/catalogo.js';
import { colorDeClave } from '../src/ui/categorias.js';
import { linkDeFoto, parsearFotos, serializarFotos } from '../src/fotos-receta.js';
import { ICO } from '../src/ui/iconos.js';
import type { CambiosDeFotos, Coincidencias, Plan, Receta } from '../src/tipos.js';

vi.mock('../src/ui/tokens.css', () => ({}));
vi.mock('../src/ui/base.css', () => ({}));
// Los tres módulos de Google se simulan, pero conservan sus clases de error:
// `main.ts` las usa para reconocer una sesión vencida.
vi.mock('../src/auth.js', async original => ({
  ...await original<typeof import('../src/auth.js')>(),
  crearAuth: () => ({ conectar: async () => {}, token: async () => 'tok', olvidar: () => {} })
}));
vi.mock('../src/drive.js', async original => ({ ...await original<typeof import('../src/drive.js')>(), crearDrive: () => ({ cuenta: async () => 'alguien@gmail.com' }) }));
vi.mock('../src/sheets.js', async original => ({ ...await original<typeof import('../src/sheets.js')>(), crearSheets: () => ({}) }));
// Con una API key, la pantalla de la carpeta ofrece el Picker; el Picker mismo
// es un doble: `elegida` es lo que devuelve, `null` es cancelar y `falla` tira.
vi.mock('../src/config.js', async original => ({
  ...await original<typeof import('../src/config.js')>(),
  API_KEY: 'key-de-prueba'
}));
const picker = vi.hoisted(() => ({
  elegida: null as null | { id: string; nombre: string },
  falla: false
}));
vi.mock('../src/picker.js', () => ({
  elegirCarpeta: async () => {
    if (picker.falla) throw new Error('no cargó');
    return picker.elegida;
  }
}));
/** `espera`, si está, es una promesa que el test resuelve a mano: el PDF tarda lo que el test quiera. */
const pdfs = vi.hoisted(() => ({ generados: 0, espera: null as Promise<void> | null }));
vi.mock('../src/pdf/generar.js', () => ({
  precargar: async () => ({}),
  generar: async () => {
    pdfs.generados++;
    if (pdfs.espera) await pdfs.espera;
    return new Blob(['%PDF'], { type: 'application/pdf' });
  }
}));

/**
 * `aplicarPegada` es la real, pero deja anotada la carpeta con que se la
 * llamó: es lo que decide si lo pegado queda como borrador.
 */
const pegadas = vi.hoisted(() => ({ carpetas: [] as string[] }));
vi.mock('../src/conversion.js', async original => {
  const real = await original<typeof import('../src/conversion.js')>();
  return {
    ...real,
    aplicarPegada: (...args: Parameters<typeof real.aplicarPegada>) => {
      pegadas.carpetas.push(args[2]);
      return real.aplicarPegada(...args);
    }
  };
});

/** Lo que los dobles le dan a main. `falla` enciende el error de lectura. */
const estadoInicial = () => ({
  falla: false as boolean | Error,
  /** El arranque encuentra el índice de otro esquema y reindexa antes de dibujar. */
  reconstruirAlArrancar: false,
  /** Los títulos de las recetas que se crearon: cada una es un `.md` nuevo. */
  creadas: [] as string[],
  /** Las recetas que llegaron a `crear`, enteras. */
  recetasCreadas: [] as Receta[],
  /** Las opciones con que se llamó a `crear` y a `guardar`, en orden. */
  opcionesCrear: [] as Record<string, unknown>[],
  opcionesGuardar: [] as Record<string, unknown>[],
  /** El `.md` que devuelve `store.receta`. */
  md: '---\ntitulo: Milanesas\n---\n',
  /** Lo que el editor tiene escrito cuando se toca Guardar. */
  formulario: {} as Record<string, string>,
  /** Las fotos que el service worker dejó del menú Compartir. */
  compartidas: [] as Blob[],
  /** Leer las fotos compartidas del caché falla. */
  fallanCompartidas: false,
  /** Cuántas veces se descartó el caché de lo compartido. */
  compartidasDescartadas: 0,
  /** Cuántas veces se borró el caché de las imágenes. */
  imagenesBorradas: 0,
  /** Los ids de las fotos que ya no están en Drive. */
  fotosPerdidas: [] as string[],
  /** Cuántas veces se leyó un `.md` de Drive: cada una es un pedido de red. */
  lecturas: 0,
  /** Lo que el arranque dice de las planillas `_indice` repetidas. */
  indiceDuplicado: null as null | { cantidad: number; modifiedTime: string },
  /** Cuántas veces se borró la copia local del índice. */
  copiasBorradas: 0,
  /** El arranque termina en elegir-carpeta, con estas sugerencias. */
  eligiendo: null as null | { id: string; name: string }[],
  /** Las carpetas que se prepararon con el setup, en orden. */
  preparadas: [] as string[],
  /** Las carpetas que se crearon desde la pantalla de la carpeta base. */
  carpetasCreadas: [] as { nombre: string; padre: string }[],
  /** Cuántas veces se anotó la carpeta anterior como reemplazada. */
  reemplazadas: 0,
  /** Lo que se guardó desde la gestión de categorías, en orden. */
  categoriasGuardadas: [] as string[],
  /** La foto propia que llegó con cada categoría guardada, o `null`. */
  fotosDeCategoria: [] as (Blob | null)[],
  /** Los `CambiosDeFotos` que llegaron a `crear` y a `guardar`, en orden. */
  cambiosDeFotos: [] as (CambiosDeFotos | null)[],
  /** Las recetas escritas, con su depósito: lo que quedaría en el `.md`. */
  depositos: [] as { n: number; url: string }[][],
  /** Los ids que se pidieron precargar, por tanda. */
  precargados: [] as string[][],
  /** Los ids de las categorías borradas. */
  categoriasBorradas: [] as string[],
  /** Los ids de las recetas que se mandaron a la papelera. */
  recetasBorradas: [] as string[],
  /** Los tags con los que se guardó cada vez que se tocó la estrella, en orden. */
  guardados: [] as { tags: string[] }[],
  /** Cuántas veces más falla `guardar` antes de andar, para probar el aviso de la estrella. */
  fallaGuardar: 0,
  /** Lo que devuelve `store.tagsDe()`, ya ordenado por cantidad. */
  tags: [] as { tag: string; cantidad: number }[],
  /** El plan que hay en Drive. */
  plan: { comidas: [] } as Plan,
  /** Cada plan que se escribió, en orden. */
  planesGuardados: [] as Plan[],
  /** Cuántas veces se leyó el plan de Drive. */
  lecturasPlan: 0,
  /** Cuántas veces más falla `guardarPlan` antes de andar. */
  fallaGuardarPlan: 0,
  /**
   * Si está, cada `urlDeImagen` se queda esperando y deja acá su resolutor: el
   * test ve cuántas van en vuelo a la vez.
   */
  frenoDeImagen: null as null | Array<() => void>,
  /** Cada id que se le pidió a `urlDeImagen`, en orden. */
  imagenesPedidas: [] as string[]
});

const estado = estadoInicial();

const storeFake = {
  arrancar: async () => estado.eligiendo
    ? { estado: 'elegir-carpeta', sugerencias: estado.eligiendo, avisos: [] }
    : {
        estado: 'listo', reconstruir: estado.reconstruirAlArrancar, raizId: 'raiz',
        categorias: [{ id: 'c1', nombre: 'Carnes' }], indiceDuplicado: estado.indiceDuplicado
      },
  carpeta: () => ({ id: 'raiz', nombre: 'Recetario' }),
  crearCarpeta: async (nombre: string, padre: string) => {
    estado.carpetasCreadas.push({ nombre, padre });
    return { id: 'nueva', nombre };
  },
  prepararCarpeta: async (c: { id: string }) => { estado.preparadas.push(c.id); return { ignorados: [] }; },
  marcarReemplazada: async () => { estado.reemplazadas++; },
  recetasDe: (id: string) => id === 'c1' ? [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', carpeta_id: 'c1' })] : [],
  crearCategoria: async (d: { nombre: string; fotoPropia?: Blob }) => {
    estado.categoriasGuardadas.push(`nueva:${d.nombre}`);
    estado.fotosDeCategoria.push(d.fotoPropia ?? null);
    return { id: 'c9', nombre: d.nombre, color: '', foto: '' };
  },
  editarCategoria: async (id: string, d: { nombre: string; fotoPropia?: Blob }) => {
    estado.categoriasGuardadas.push(`${id}:${d.nombre}`);
    estado.fotosDeCategoria.push(d.fotoPropia ?? null);
  },
  borrarCategoria: async (id: string) => { estado.categoriasBorradas.push(id); },
  borrar: async (id: string) => { estado.recetasBorradas.push(id); },
  cargarIndice: async () => [],
  guardarMeta: async () => {},
  ultimaReconstruccion: () => '',
  entradas: () => [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', categoria: 'Carnes' })],
  categoriasConConteo: () => [{ id: 'c1', nombre: 'Carnes', cantidad: 1 }],
  categorias: () => [{ id: 'c1', nombre: 'Carnes', color: 'carnes', foto: 'catalogo:carnes' }],
  buscar: () => [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', categoria: 'Carnes' })],
  buscarPorTexto: (): Coincidencias => ({ porNombre: [], porIngrediente: [], porTag: [] }),
  tagsDe: () => estado.tags,
  crear: async (
    receta: Receta,
    opciones?: { fotos?: CambiosDeFotos; carpetaId?: string }
  ) => {
    estado.creadas.push(receta.titulo ?? '');
    estado.recetasCreadas.push(receta);
    estado.opcionesCrear.push({ ...opciones });
    estado.cambiosDeFotos.push(opciones?.fotos ?? null);
    estado.depositos.push(receta.fotos ?? []);
    return { id: `nuevo-${estado.creadas.length}`, nombre_archivo: 'receta.md' };
  },
  guardar: async (
    _id: string,
    receta: { tags: string[]; fotos?: { n: number; url: string }[] },
    opciones?: { fotos?: CambiosDeFotos; carpetaDestino?: string }
  ) => {
    estado.opcionesGuardar.push({ ...opciones });
    if (estado.fallaGuardar > 0) { estado.fallaGuardar--; throw new Error('red'); }
    estado.guardados.push({ tags: receta.tags });
    estado.cambiosDeFotos.push(opciones?.fotos ?? null);
    estado.depositos.push(receta.fotos ?? []);
  },
  receta: async (id: string) => {
    estado.lecturas++;
    if (estado.falla) throw estado.falla === true ? new Error('red') : estado.falla;
    return { entrada: entradaFalsa({ id_archivo: id }), receta: parse(estado.md) };
  },
  plan: async () => { estado.lecturasPlan++; return estado.plan; },
  guardarPlan: async (p: Plan) => {
    if (estado.fallaGuardarPlan > 0) { estado.fallaGuardarPlan--; throw new Error('red'); }
    estado.plan = p;
    estado.planesGuardados.push(p);
  },
  planDuplicado: () => null
};
// El store es un doble entero, pero conserva sus utilidades sueltas:
// `conConcurrencia` y `TOPE_LECTURAS`, con los que `main` lee las recetas del
// plan para la lista de compras.
vi.mock('../src/store.js', async original => ({
  ...await original<typeof import('../src/store.js')>(),
  crearStore: () => storeFake
}));
// Achicar necesita un canvas: acá devuelve la foto tal cual, y una foto
// que dice «roto» no se decodifica.
vi.mock('../src/fotos.js', () => ({
  achicar: async (b: Blob) => {
    if (await b.text() === 'roto') throw new Error('no se decodifica');
    return b;
  }
}));
// Cache Storage y los object URL no existen en Node; `conTope` sí es el real,
// que es lo que reparte el trabajo de completar las fotos.
vi.mock('../src/imagenes.js', async original => ({
  ...await original<typeof import('../src/imagenes.js')>(),
  crearImagenes: () => ({
    imagenDe: async (id: string) => estado.fotosPerdidas.includes(id) ? null : new Blob([id], { type: 'image/jpeg' }),
    urlDeImagen: async (id: string) => {
      estado.imagenesPedidas.push(id);
      if (estado.frenoDeImagen) await new Promise<void>(seguir => estado.frenoDeImagen?.push(seguir));
      return estado.fotosPerdidas.includes(id) ? null : `blob:${id}`;
    },
    urlDeBlob: (b: Blob) => `blob:memoria-${b.size}`,
    soltarUrl: () => {},
    soltarImagenes: () => {},
    guardarImagen: async () => {},
    olvidarImagen: async () => {},
    precargar: async (ids: string[]) => { estado.precargados.push(ids); },
    fotosCompartidas: async (n: number) => {
      if (estado.fallanCompartidas) throw new Error('caché');
      return estado.compartidas.slice(0, n);
    },
    descartarCompartidas: async () => { estado.compartidasDescartadas++; },
    borrarImagenes: async () => { estado.imagenesBorradas++; }
  })
}));
vi.mock('../src/indice-local.js', () => ({
  leer: () => null,
  guardar: () => {},
  borrar: () => { estado.copiasBorradas++; }
}));

/**
 * Los dos tiempos del velo, como los tiene `velo.ts`: lo que dura el cierre
 * con el tilde y lo que se espera después, por si nadie dibuja la pantalla de
 * destino. El reloj de estos tests es falso —esperarlos de verdad, en cada
 * test que guarda una receta, se lleva la mitad de la suite—, así que se los
 * adelanta a mano. Separados porque entre uno y otro hay un momento que se
 * mira: el tilde ya dibujado y el velo todavía puesto.
 */
const MS_CIERRE = 1850;
const MS_RESPALDO_CIERRE = 400;

/**
 * Todo el velo, con margen. No llega a los 20 s del corte de una traída por
 * URL, que tiene su propio temporizador y no debe dispararse acá.
 */
const MS_HASTA_EL_FINAL = MS_CIERRE + MS_RESPALDO_CIERRE + 250;

/**
 * Las vueltas de microtareas que `main` necesita para terminar de pintar.
 * Con el reloj falso, un `setTimeout(0)` sólo corre si alguien adelanta el
 * reloj: por eso no se lo espera, se lo empuja de a cero milisegundos, que
 * deja pasar lo inmediato sin disparar el cierre del velo.
 */
const esperar = async (vueltas = 5) => {
  for (let i = 0; i < vueltas; i++) {
    if (vi.isFakeTimers()) await vi.advanceTimersByTimeAsync(0);
    else await new Promise(r => setTimeout(r, 0));
  }
};

/**
 * Espera a que un manejador termine, alternando microtareas y reloj: entre
 * una lectura de Drive y el temporizador del cierre hay varias vueltas, y el
 * temporizador recién se programa cuando la escritura salió. Seis vueltas de
 * `MS_HASTA_EL_FINAL` no llegan a los 20 s del corte de una traída por URL.
 */
const dejarTerminar = async (corriendo: Promise<unknown>): Promise<void> => {
  let listo = false;
  const marcar = () => { listo = true; };
  void corriendo.then(marcar, marcar);
  for (let i = 0; i < 6 && !listo; i++) {
    await esperar(3);
    await vi.advanceTimersByTimeAsync(MS_HASTA_EL_FINAL);
  }
  await corriendo;
  await esperar();
};

/**
 * Un `<img>` de los que `main` completa después de pintar: los de Drive
 * (`data-drive`) y los de una foto nueva del editor (`data-n`). El test los
 * pone en la lista y después mira qué les pasó.
 */
function imgFalsa(
  dataset: { drive?: string; n?: string },
  /** El recuadro del que cuelga, si la foto va a dejar su motivo en lugar del `<img>`. */
  recuadro: false | '.cuadro-foto' = false,
  tagName = 'IMG'
) {
  const img = {
    dataset,
    tagName,
    atributos: {} as Record<string, string>,
    /** Lo que quedó en su lugar cuando la foto ya no está en Drive. */
    reemplazo: '',
    sacada: false,
    setAttribute: (n: string, v: string) => { img.atributos[n] = v; },
    closest: (sel: string) => (recuadro && sel.includes(recuadro) ? {} : null),
    remove: () => { img.sacada = true; },
    set outerHTML(html: string) { img.reemplazo = html; }
  };
  return img;
}

describe('main.ts: las rutas', () => {
  afterEach(() => {
    limpiarGlobales();
    Object.assign(estado, estadoInicial());
    Object.assign(picker, { elegida: null, falla: false });
    vi.unstubAllGlobals();
    delete (global as unknown as Record<string, unknown>)['FormData'];
    vi.resetModules();
    vi.useRealTimers();
  });

  const montar = async ({
    hash = '', search = '', readyState = 'complete' as DocumentReadyState, reducedMotion = false,
    /** La pantalla mide 900 px o más: el menú es fijo. */
    ancha = false
  } = {}) => {
    // Sólo los temporizadores: `Date` queda real, que es de donde salen las
    // fechas del plan y el título de un borrador sin título.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const clicks: ((e: unknown) => unknown)[] = [];
    const cambios: ((e: unknown) => unknown)[] = [];
    /** Los oyentes de `error` en captura: una foto externa que no carga. */
    const errores: ((e: unknown) => unknown)[] = [];
    /** Los oyentes de `focusin`: el botón de poner una foto sigue al foco. */
    const focos: ((e: unknown) => unknown)[] = [];
    /** Los oyentes de `scroll` en captura: el botón sigue al scroll del campo. */
    const desplazos: ((e: unknown) => unknown)[] = [];
    /** Los oyentes de `pointerdown`: el toque sobre el botón no mueve el foco. */
    const punteos: ((e: unknown) => unknown)[] = [];
    const tecleos: ((e: unknown) => unknown)[] = [];
    /** Lo que se escribió en `[data-resultados-plan]` sin repintar la pantalla. */
    const resultadosPlan: string[] = [];
    /**
     * El menú lateral y su velo mientras el dedo los arrastra: `main` les
     * escribe `transform` y `opacity` sin redibujar, para que sigan al dedo.
     */
    const clasesDe = (clases: Set<string>) => ({
      toggle: (c: string, puesta?: boolean) => {
        const poner = puesta ?? !clases.has(c);
        if (poner) clases.add(c); else clases.delete(c);
        return poner;
      },
      contains: (c: string) => clases.has(c)
    });
    /**
     * Las clases del panel y del velo, como quedaron en el DOM: salen de lo
     * pintado, y `main` las cambia sin repintar al abrir y cerrar el menú.
     */
    const clasesPanel = new Set<string>();
    const clasesVeloLat = new Set<string>();
    const panelLateral = { style: { transition: '', transform: '' }, classList: clasesDe(clasesPanel) };
    const veloLateral = { style: { transition: '', opacity: '' }, classList: clasesDe(clasesVeloLat) };
    /** El menú se ve desplegado: el panel corrido y el velo puesto, los dos. */
    const menuDesplegado = (): boolean => {
      expect(clasesPanel.has('abierto')).toBe(clasesVeloLat.has('on'));
      return clasesPanel.has('abierto');
    };
    /** Los oyentes del gesto del menú lateral: deslizar para abrirlo y cerrarlo. */
    const toquesEmpiezan: ((e: unknown) => unknown)[] = [];
    const toquesMueven: ((e: unknown) => unknown)[] = [];
    const toquesTerminan: ((e: unknown) => unknown)[] = [];
    const toquesCancelan: ((e: unknown) => unknown)[] = [];
    /** Los atributos de `#app`: el único que se pone desde `main` es `aria-busy`. */
    const atributosApp: Record<string, string> = {};
    /** El velo de la escritura en curso, hermano de `#app` en `index.html`. */
    const clasesVelo = new Set<string>();
    /** Cada vez que el velo se puso o se sacó, en orden: sirve para ver si parpadea. */
    const idasYVueltasDelVelo: boolean[] = [];
    const velo = {
      _hidden: true,
      get hidden(): boolean { return this._hidden; },
      set hidden(v: boolean) {
        if (v !== this._hidden) idasYVueltasDelVelo.push(v);
        this._hidden = v;
      },
      classList: {
        add: (c: string) => { clasesVelo.add(c); },
        remove: (...cs: string[]) => { for (const c of cs) clasesVelo.delete(c); },
        toggle: (c: string, si: boolean) => { if (si) clasesVelo.add(c); else clasesVelo.delete(c); },
        contains: (c: string) => clasesVelo.has(c)
      },
      /** La tarjeta del progreso: el texto y la barra. */
      progreso: { texto: { textContent: '' }, barra: { style: { width: '' } } },
      querySelector(sel: string) {
        if (sel === '[data-progreso-texto]') return this.progreso.texto;
        if (sel === '[data-progreso-barra]') return this.progreso.barra;
        return null;
      }
    };
    /**
     * Si el velo está puesto con la olla: una operación en curso. El tilde del
     * cierre no cuenta, aunque siga tapando hasta que se pinta el destino.
     */
    const tapado = () => !velo.hidden && !clasesVelo.has('exito');
    /**
     * Cada vez que se pintó `#app`, con la pantalla tapada o no en ese momento:
     * es la forma de ver el orden entre tapar la pantalla y redibujarla.
     */
    const pinturas: { html: string; velo: boolean; puesto: boolean }[] = [];
    let htmlApp = '';
    const app = {
      get innerHTML() { return htmlApp; },
      set innerHTML(html: string) {
        htmlApp = html;
        // `puesto`: el velo estaba en pantalla, con la olla o con el tilde, y
        // el dibujo quedó abajo, sin verse.
        pinturas.push({ html, velo: tapado(), puesto: !velo.hidden });
        clasesPanel.clear();
        clasesVeloLat.clear();
        if (html.includes('class="lat abierto"')) clasesPanel.add('abierto');
        if (html.includes('class="velo-lat on"')) clasesVeloLat.add('on');
      },
      insertAdjacentHTML: () => {},
      setAttribute: (n: string, v: string) => { atributosApp[n] = v; },
      removeAttribute: (n: string) => { delete atributosApp[n]; },
      addEventListener: (ev: string, fn: (e: unknown) => unknown) => {
        if (ev === 'click') clicks.push(fn);
        if (ev === 'change') cambios.push(fn);
        if (ev === 'input') tecleos.push(fn);
        if (ev === 'error') errores.push(fn);
        if (ev === 'focusin') focos.push(fn);
        if (ev === 'scroll') desplazos.push(fn);
        if (ev === 'pointerdown') punteos.push(fn);
      }
    };
    /** Lo que se insertó en el formulario sin redibujarlo: las preguntas y las fichas de fotos. */
    const preguntas: string[] = [];
    /**
     * Cualquier campo del formulario. Lo que el test dejó escrito en
     * `estado.formulario` es lo que el campo tiene, y lo que `main` le escriba
     * queda ahí: es el mismo lugar del que sale el `FormData` al guardar.
     */
    const campo = (nombre: string) => ({
      get value() { return estado.formulario[nombre] ?? ''; },
      set value(v: string) { estado.formulario[nombre] = v; }
    });
    /**
     * El marco de un campo de sección del editor: su espejo y el botón de
     * poner una foto. El espejo falso mide como el de verdad —24 px por
     * renglón— contando los saltos de línea del texto que se le escribió.
     */
    const antesDelEspejo = new Map<string, string>();
    /** Cada botón de foto que `main` colgó de un campo, con su HTML. */
    const botonesDeFoto: string[] = [];
    let botonDeFoto: string | null = null;
    const marcoDeCampo = (nombre: string) => ({
      insertAdjacentHTML: (_donde: string, html: string) => {
        botonDeFoto = html;
        botonesDeFoto.push(html);
      },
      querySelector: (sel: string) => {
        if (sel === '[data-antes]') {
          return { set textContent(t: string) { antesDelEspejo.set(nombre, t); } };
        }
        if (sel === '[data-marca]') {
          return { get offsetTop() { return ((antesDelEspejo.get(nombre) ?? '').split('\n').length - 1) * 24; } };
        }
        return null;
      }
    });
    /** Lo que tiene el foco: el doble de `document.activeElement`. */
    let campoActivo: {
      name?: string; value?: string; selectionStart?: number; dataset?: Record<string, string>;
      scrollTop?: number; clientHeight?: number;
    } | null = null;
    /**
     * La muestra de la categoría que se edita: el cuadro de arriba que sigue
     * en vivo lo que se escribe y se elige. `main` la toca por partes y sin
     * redibujar, así que el doble guarda cada parte por separado.
     */
    const muestraDeCategoria = {
      color: '',
      /** Sin foto elegida, el cuadro va con la trama sobre el color. */
      conTrama: true,
      imagen: '',
      nombre: '',
      style: {
        setProperty: (n: string, v: string) => { if (n === '--c') muestraDeCategoria.color = v; }
      },
      querySelector: (sel: string) => {
        if (sel === '.im') {
          return {
            classList: {
              toggle: (c: string, puesta: boolean) => { if (c === 'trama') muestraDeCategoria.conTrama = puesta; }
            },
            set innerHTML(html: string) { muestraDeCategoria.imagen = html; }
          };
        }
        if (sel === '.nm') return { set textContent(t: string) { muestraDeCategoria.nombre = t; } };
        return null;
      }
    };
    /** La línea del nombre inválido, que aparece y se va sin redibujar. */
    const errorDeNombre = { hidden: true, textContent: '' };
    /** El botón *Guardar* del encabezado de la categoría. */
    const guardarCategoria = { disabled: true };
    /**
     * Los nombres contra los que se valida el que se escribe. Salen de lo
     * pintado —el `data-otros` del formulario—, y no de una constante: así el
     * doble no puede decir que las otras categorías son otras.
     */
    const otrosPintados = (): string =>
      (app.innerHTML.match(/data-otros="([^"]*)"/)?.[1] ?? '[]')
        .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const formulario = {
      get dataset() { return { otros: otrosPintados() }; },
      insertAdjacentHTML: (_donde: string, html: string) => { preguntas.push(html); },
      querySelector: (sel: string) => {
        const nombre = sel.match(/^\[name="([\w-]+)"\]$/)?.[1];
        if (nombre) return campo(nombre);
        // Las dos partes que la edición de una categoría actualiza en vivo.
        if (sel === '[data-muestra]') return app.innerHTML.includes('data-muestra') ? muestraDeCategoria : null;
        if (sel === '.error-nombre') return app.innerHTML.includes('error-nombre') ? errorDeNombre : null;
        return null;
      }
    };
    /** Saca del formulario lo que se había insertado: la ficha, el velo o el visor. */
    const quitarInsertado = (marca: string) =>
      preguntas.flatMap(html => html.includes(marca)
        ? [{ remove: () => { const i = preguntas.indexOf(html); if (i >= 0) preguntas.splice(i, 1); } }]
        : []);
    /** Cada vez que un aviso se trajo a la vista, con cómo se lo alineó. */
    const avisosALaVista: string[] = [];
    /** Los `<img>` que la pantalla dejó pedidos; los pone el test. */
    const imgs: ReturnType<typeof imgFalsa>[] = [];
    /** Cada vez que `main` redibujó la fila de miniaturas del editor. */
    const filasDeFotos: string[] = [];
    /** Cada vez que `main` cambió la miniatura del campo Foto. */
    const portadas: string[] = [];
    const listeners: Record<string, () => void> = {};
    const listenersDoc: Record<string, (e?: unknown) => unknown> = {};
    /** Lo que se puso en lugar de un elemento, con `outerHTML`, sin redibujar. */
    const enLugar: string[] = [];
    /** Si la pantalla estaba tapada en cada vuelta atrás: tapada no se navega. */
    const tapadoAlVolver: boolean[] = [];
    const scrolls: number[] = [];
    /** Lo que la flecha del carrusel le pidió desplazar a `scrollBy`. */
    const desplazamientos: number[] = [];
    /** El `behavior` de cada desplazamiento: 'auto' con reduced motion, si no 'smooth'. */
    const comportamientos: string[] = [];
    // La pista del carrusel: 400 px visibles, como para que el 80% dé un número
    // redondo. Se llega a ella desde el marco de la flecha tocada y no desde el
    // documento: en la receta hay dos carruseles y cada flecha mueve el suyo.
    const pistaDeCarrusel = {
      clientWidth: 400,
      scrollBy: (o: { left: number; behavior?: string }) => {
        desplazamientos.push(o.left);
        comportamientos.push(o.behavior ?? '');
      }
    };
    const marcoDeCarrusel = { querySelector: (sel: string) => (sel === '[data-carrusel]' ? pistaDeCarrusel : null) };
    // La duración del editor: sin HTML real que releer, cada botón
    // guarda su propio `aria-pressed` en este mapa, y el campo oculto su
    // propio valor en una variable aparte —dos estados independientes, como
    // en el DOM real, para que un test pueda notar si `main.ts` deja de
    // escribir uno de los dos. `tocar` reutiliza estos mismos objetos como
    // el botón tocado, para que la comparación por referencia de
    // `elegir-duracion` en `main.ts` encuentre al que se tocó.
    const presionados = new Map(DURACIONES.map(valor => [valor as string, false]));
    const botonesDuracion = new Map(DURACIONES.map(valor => [valor as string, {
      dataset: { accion: 'elegir-duracion', valor }, classList: { contains: () => false },
      closest: () => null, tagName: 'BUTTON', remove: () => {}, hasAttribute: () => false,
      getAttribute: (n: string) => n === 'aria-pressed' ? String(presionados.get(valor) ?? false) : null,
      setAttribute: (n: string, v: string) => {
        if (n !== 'aria-pressed') return;
        presionados.set(valor, v === 'true');
      }
    }]));
    /** Convertir con Agente al pie del editor: se muestra y se oculta sin redibujar. */
    const botonConvertir = { hidden: false };
    let valorOculto = '';
    const campoTiempoDuracion = {
      get value() { return valorOculto; },
      set value(v: string) { valorOculto = v; },
      setAttribute: (_n: string, v: string) => { valorOculto = v; }
    };
    global.document = comoGlobal<Document>({
      querySelector: (sel: string) => {
        if (sel === '#app') return app;
        if (sel === '#velo-escritura') return velo;
        // El formulario existe sólo donde la pantalla lo dibuja —el editor y la
        // edición de una categoría—. Sale de lo pintado, para que el doble no
        // pueda decir que hay uno donde no lo hay.
        if (sel === '[data-formulario]') return app.innerHTML.includes('data-formulario') ? formulario : null;
        if (sel === '[data-salida]') return preguntas.length ? { remove: () => { preguntas.length = 0; } } : null;
        if (sel === '[data-confirmar-borrado]') {
          return enLugar.at(-1)?.includes('data-confirmar-borrado')
            ? { set outerHTML(html: string) { enLugar.push(html); } } : null;
        }
        // El sol encendido, tal como lo dibuja la cocina.
        if (sel === '[data-accion="wake"].on') return app.innerHTML.includes('class="ico on" data-accion="wake"') ? {} : null;
        if (sel === '#app input[name="tiempo"]') return campoTiempoDuracion;
        if (sel === '#app [data-accion="convertir-con-agente"]') {
          return app.innerHTML.includes('data-accion="convertir-con-agente"') ? botonConvertir : null;
        }
        // El menú lateral y su velo, que el gesto mueve al ritmo del dedo.
        // Salen de lo pintado: una pantalla sin menú no los tiene.
        if (sel === '#app .lat') return app.innerHTML.includes('class="lat') ? panelLateral : null;
        if (sel === '#app .velo-lat') return app.innerHTML.includes('class="velo-lat') ? veloLateral : null;
        if (sel === '#app [data-accion="guardar-categoria"]') {
          return app.innerHTML.includes('data-accion="guardar-categoria"') ? guardarCategoria : null;
        }
        // El editor y la edición de una categoría escriben en sus campos sin
        // redibujar: el depósito de fotos, la portada, las secciones de texto.
        const nombre = sel.match(/^#app (?:input)?\[name="([\w-]+)"\]$/)?.[1];
        if (nombre) return campo(nombre);
        // La dirección escrita en la ficha de *Por URL*.
        if (sel === '#app [data-url-foto]') return campo('url-foto');
        if (sel === '#app .fotos-campo') return { set outerHTML(html: string) { filasDeFotos.push(html); } };
        if (sel === '#app .portada-boton') return { set innerHTML(html: string) { portadas.push(html); } };
        // El aviso que se trae a la vista cuando algo falla con la pantalla scrolleada.
        if (sel === '#app .aviso') {
          return app.innerHTML.includes('class="aviso"')
            ? { scrollIntoView: (o: { block?: string }) => { avisosALaVista.push(o?.block ?? ''); } }
            : null;
        }
        if (sel === '#app .poner-foto') {
          return botonDeFoto === null ? null : { remove: () => { botonDeFoto = null; } };
        }
        const conCampo = sel.match(/^#app \[data-campo-texto="(\w+)"\]$/)?.[1];
        if (conCampo) return marcoDeCampo(conCampo);
        if (sel === '#app .visor') return quitarInsertado('class="visor"')[0] ?? null;
        if (sel === '#app [data-aviso-fotos]') return quitarInsertado('data-aviso-fotos')[0] ?? null;
        // El bloque de la pantalla de agregar al plan: se redibuja solo, para
        // no perder el foco del teclado.
        if (sel === '[data-resultados-plan]') {
          return app.innerHTML.includes('data-resultados-plan')
            ? { set innerHTML(html: string) { resultadosPlan.push(html); } } : null;
        }
        // El spinner del tramo de una lista: lo que mira el observador. El de
        // *Agregar al plan* está en su bloque, que se redibuja aparte.
        if (sel === '#app [data-tramo]') return app.innerHTML.includes('data-tramo') ? {} : null;
        if (sel === '[data-resultados-plan] [data-tramo]') return (resultadosPlan.at(-1) ?? app.innerHTML).includes('data-tramo') ? { plan: true } : null;
        return null;
      },
      querySelectorAll: (sel: string) => {
        if (sel === '#app [data-accion="elegir-duracion"]') return [...botonesDuracion.values()];
        // Las imágenes que la pantalla dejó pedidas, cada una por su marca.
        if (sel.includes('img[data-drive]')) return imgs.filter(i => i.dataset.drive && !i.atributos['src']);
        if (sel.includes('img[data-n]')) return imgs.filter(i => i.dataset.n && !i.atributos['src']);
        // Las fichas de fotos del editor y su velo, que se sacan del DOM.
        if (sel.includes('data-acciones-foto')) return quitarInsertado('hoja-foto');
        return [];
      },
      // Los gestos van en `document` y no en `#app`: una pantalla corta deja
      // abajo un área que no es de `#app`, y ahí el toque no llegaba.
      // Por eso el doble los recoge sólo acá: si volvieran a `#app`, los tests
      // del gesto se quedarían sin oyentes y fallarían.
      addEventListener: (ev: string, fn: (e: unknown) => unknown) => {
        if (ev === 'touchstart') toquesEmpiezan.push(fn);
        else if (ev === 'touchmove') toquesMueven.push(fn);
        else if (ev === 'touchend') toquesTerminan.push(fn);
        else if (ev === 'touchcancel') toquesCancelan.push(fn);
        else listenersDoc[ev] = fn;
      },
      get activeElement() { return campoActivo; },
      visibilityState: 'visible',
      readyState
    });
    /** Los oyentes del cruce del corte de 900 px. */
    const alCruzarElCorte: ((e: { matches: boolean }) => void)[] = [];
    global.window = comoGlobal<Window & typeof globalThis>({
      google: {}, addEventListener: (ev: string, fn: () => void) => { listeners[ev] = fn; },
      scrollTo: (_x: number, y: number) => { scrolls.push(y); }, scrollY: 0, close: () => {},
      // La consulta de reduced motion y la del corte de 900 px, que avisa al cruzarlo.
      matchMedia: (q: string) => ({
        get matches() {
          return (reducedMotion && q.includes('prefers-reduced-motion')) || (ancha && q.includes('min-width: 900px'));
        },
        addEventListener: (ev: string, fn: (e: { matches: boolean }) => void) => {
          if (ev === 'change' && q.includes('min-width: 900px')) alCruzarElCorte.push(fn);
        }
      })
    });
    // El historial, con sus entradas y su `state`: `replace` no agrega una
    // entrada, asignar `hash` sí, y cada cambio de hash avisa después con
    // `hashchange`, como el navegador.
    const recargas: number[] = [];
    const historial = historialFalso({
      hash,
      alCambiarHash: () => { listeners['hashchange']?.(); },
      alPopstate: () => { listeners['popstate']?.(); },
      location: { pathname: '/recetario/', search, origin: 'https://h', reload: () => { recargas.push(1); } },
      alVolver: () => { tapadoAlVolver.push(tapado()); }
    });
    const { reemplazos, empujados, vueltasAtras, saltos, pila } = historial;
    global.location = comoGlobal<Location>(historial.location);
    global.history = comoGlobal<History>(historial.history);
    // El editor se lee con `new FormData(form)`: el doble entrega lo que diga
    // `estado.formulario`, sin importar el form.
    (global as unknown as Record<string, unknown>)['FormData'] = class {
      [Symbol.iterator]() { return Object.entries(estado.formulario)[Symbol.iterator](); }
    };

    await import('../src/main.js');
    await esperar();

    return {
      botonConvertir,
      app,
      velo,
      pinturas,
      atributosApp,
      avisosALaVista,
      idasYVueltasDelVelo,
      recargas,
      vueltasAtras,
      tapadoAlVolver,
      scrolls,
      reemplazos,
      empujados,
      preguntas,
      enLugar,
      desplazamientos,
      comportamientos,
      botonesDeFoto,
      /** Si el botón de poner una foto está colgado de algún campo ahora mismo. */
      hayBotonDeFoto: () => botonDeFoto !== null,
      /**
       * El cursor cae en un campo de texto del editor, como al tocarlo: el
       * navegador avisa con `selectionchange`.
       */
      posarCursor: async (seccion: string, posicion: number, scrollTop = 0) => {
        const c = campo(seccion);
        campoActivo = {
          name: seccion,
          get value() { return c.value; },
          set value(v: string) { c.value = v; },
          selectionStart: posicion,
          scrollTop,
          // Seis renglones de 24, como la Preparación del editor.
          clientHeight: 144
        };
        listenersDoc['selectionchange']?.();
        await esperar();
      },
      /** El dedo corre el texto del campo sin mover el cursor. */
      desplazarCampo: async (scrollTop: number) => {
        if (campoActivo) campoActivo.scrollTop = scrollTop;
        for (const fn of desplazos) await fn({ target: campoActivo });
        await esperar();
      },
      /** El toque sobre el botón, antes del click: devuelve si se lo frenó. */
      tocarBotonDeFoto: async () => {
        let frenado = false;
        const destino = { closest: (sel: string) => (sel === '.poner-foto' ? {} : null) };
        for (const fn of punteos) {
          await fn({ target: destino, preventDefault: () => { frenado = true; } });
        }
        await esperar();
        return frenado;
      },
      /** El campo pierde el foco sin que nadie avise, como al tocar el velo. */
      sacarElFoco: () => { campoActivo = null; },
      /** El foco se va del campo a algo que no es una sección. */
      soltarCursor: async () => {
        campoActivo = null;
        listenersDoc['selectionchange']?.();
        for (const fn of focos) await fn({ target: null });
        await esperar();
      },
      /** La app vuelve a primer plano. */
      volverAPrimerPlano: async () => { listenersDoc['visibilitychange']?.(); await esperar(); },
      /** Una foto externa que no carga avisa con su evento `error`. */
      fallarFoto: async (img: unknown) => { for (const fn of errores) await fn({ target: img }); },
      /** El evento `load` de `window`, para lo que quedó pendiente de él. */
      dispararLoad: async () => { listeners['load']?.(); await esperar(); },
      /**
       * Llega a un hash por un `<a href>`: una entrada nueva, sin `state`.
       * Si ya se está ahí, el navegador no hace nada, y el doble tampoco.
       */
      abrir: async (destino: string) => {
        global.location.hash = destino;
        await esperar();
      },
      /**
       * Un toque en un destino del lateral. Si la app no frena el link, el
       * navegador navega: una entrada nueva, sin `state`.
       */
      tocarDestino: async (href: string) => {
        let frenado = false;
        const link = { getAttribute: (n: string) => (n === 'href' ? href : null) };
        const destino = { closest: (sel: string) => (sel.includes('.lat a') ? link : null) };
        for (const fn of clicks) await fn({ target: destino, preventDefault: () => { frenado = true; } });
        if (!frenado) global.location.hash = href;
        await esperar();
        return frenado;
      },
      /** La ventana se agranda hasta 900 px o más, o se achica por debajo. */
      cambiarAncho: async (ahora: boolean) => {
        ancha = ahora;
        for (const fn of alCruzarElCorte) fn({ matches: ahora });
        await esperar();
      },
      /** El atrás del navegador o de Android, que no pasa por la app. */
      atras: async () => {
        historial.atras();
        await esperar();
      },
      saltos,
      /** Las entradas del historial hasta la actual. */
      pila,
      retenerAvisos: historial.retenerAvisos,
      soltarAvisos: async () => { historial.soltarAvisos(); await esperar(); },
      resultadosPlan,
      /** Una tecla en un campo, como la caja de la pantalla de agregar al plan. */
      tipear: async (accion: string, valor: string) => {
        const campo = { dataset: { accion }, value: valor, name: '' };
        for (const fn of tecleos) await fn({ target: campo });
        await esperar();
      },
      panelLateral,
      menuDesplegado,
      /**
       * El dedo cruza la pantalla, como para abrir o cerrar el menú lateral:
       * apoya, arrastra en unos pasos y suelta. `cancelar` levanta el dedo con
       * `touchcancel` en vez de `touchend`, que es lo que manda Android cuando
       * se queda con el gesto —al arrastrar un enlace, por ejemplo—.
       */
      deslizar: async (
        { desde, hasta, y = 300, sobre = {}, cancelar = false }:
        { desde: number; hasta: number; y?: number; sobre?: Record<string, unknown>; cancelar?: boolean }
      ) => {
        const destino = { closest: () => null, ...sobre };
        const toque = (x: number) => ({ clientX: x, clientY: y });
        const evento = (x: number) => ({ touches: [toque(x)], changedTouches: [toque(x)], target: destino });

        for (const fn of toquesEmpiezan) await fn(evento(desde));
        // En pasos: el gesto decide si es horizontal recién con el primero.
        for (const paso of [0.25, 0.6, 1]) {
          const x = desde + (hasta - desde) * paso;
          for (const fn of toquesMueven) await fn(evento(x));
        }
        for (const fn of (cancelar ? toquesCancelan : toquesTerminan)) await fn(evento(hasta));
        await esperar();
      },
      muestraDeCategoria,
      errorDeNombre,
      guardarCategoria,
      /**
       * Una tecla en el formulario de la categoría. Lo escrito ya está en
       * `estado.formulario`: el evento sólo avisa, como en el navegador.
       */
      tipearEnCategoria: async (nombre: string) => {
        estado.formulario['nombre'] = nombre;
        for (const fn of tecleos) await fn({ target: { dataset: {}, name: 'nombre', value: nombre } });
        await esperar();
      },
      /** Un `change` en la caja de búsqueda, con el valor que tenga. */
      escribir: async (valor: string) => {
        const campo = { dataset: { accion: 'buscar' }, value: valor, focus: () => {} };
        for (const fn of cambios) await fn({ target: campo });
        await esperar();
      },
      imgs,
      filasDeFotos,
      portadas,
      /** El selector de *Cámara* o *Galería* devuelve estos archivos. */
      elegirFotos: async (archivos: Blob[]) => {
        for (const fn of cambios) await fn({ target: { dataset: { fotos: '' }, files: archivos } });
        await esperar(20);
      },
      /** *Subir foto* en la edición de una categoría: un archivo. */
      elegirFotoDeCategoria: async (archivo: Blob) => {
        for (const fn of cambios) await fn({ target: { dataset: { fotoPropia: '' }, files: [archivo] } });
        await esperar(20);
      },
      /**
       * Un toque sobre una foto en línea del texto: no lleva `data-accion`, así
       * que llega a la delegación como el `<span class="foto-linea">` que la envuelve.
       */
      tocarFotoEnLinea: async (datos: { drive?: string; src?: string }) => {
        const img = {
          dataset: datos.drive === undefined ? {} : { drive: datos.drive },
          getAttribute: (n: string) => (n === 'src' ? datos.src ?? null : null)
        };
        const linea = { querySelector: () => img };
        for (const fn of clicks) {
          await fn({ target: { closest: (sel: string) => (sel.includes('foto-linea') ? linea : null) } });
        }
        await esperar();
      },
      /**
       * Deja correr el reloj falso hasta pasado el cierre del velo. Lo usan
       * los tests que tocan algo y quieren mirar el cierre a mitad de camino,
       * con `tocarSinCerrar`.
       */
      correrElReloj: () => vi.advanceTimersByTimeAsync(MS_HASTA_EL_FINAL),
      /**
       * Sólo el cierre con el tilde, sin llegar al respaldo: deja el velo
       * puesto, que es lo que hace mientras espera la pantalla de destino.
       */
      correrElCierre: () => vi.advanceTimersByTimeAsync(MS_CIERRE),
      /**
       * Como `tocar`, pero sin adelantar el reloj: la promesa queda pendiente
       * mientras el cierre del velo se dibuja, y el test mira ese momento.
       * Hay que terminarla con `correrElReloj` antes de esperarla.
       */
      tocarSinCerrar: (accion: string, datos: Record<string, string> = {}) => {
        const boton = {
          dataset: { accion, ...datos }, classList: { contains: () => false },
          closest: () => null, tagName: 'BUTTON', remove: () => {},
          setAttribute: () => {}, getAttribute: () => null, hasAttribute: () => false
        };
        return (async () => {
          for (const fn of clicks) {
            await fn({ target: { closest: (sel: string) => (sel.includes('data-accion') ? boton : null) } });
          }
        })();
      },
      /** Un click en un control con esta acción, como lo entrega la delegación. */
      tocar: async (accion: string, datos: Record<string, string> = {}, atributos: Record<string, string> = {}) => {
        const attrs: Record<string, string> = { ...atributos };
        // Los botones de duración son los mismos objetos que devuelve
        // `document.querySelectorAll`: en el DOM real el botón tocado es el
        // mismo nodo que se vuelve a encontrar al recorrerlos.
        const boton = accion === 'elegir-duracion' && botonesDuracion.has(datos['valor'] ?? '')
          ? botonesDuracion.get(datos['valor']!)!
          : {
              dataset: { accion, ...datos }, classList: { contains: () => false },
              // La flecha del carrusel sale de su propio marco.
              closest: (sel: string) => (sel === '.carrusel-marco' ? marcoDeCarrusel : null),
              tagName: 'BUTTON', remove: () => {},
              setAttribute: (n: string, v: string) => { attrs[n] = v; },
              getAttribute: (n: string) => attrs[n] ?? null,
              hasAttribute: (n: string) => n in attrs,
              set outerHTML(html: string) { enLugar.push(html); }
            };
        // El manejador puede quedarse esperando el cierre del velo: se lo
        // lanza, se le adelanta el reloj y recién ahí se lo espera.
        await dejarTerminar((async () => {
          for (const fn of clicks) {
            await fn({ target: { closest: (sel: string) => (sel.includes('data-accion') ? boton : null) } });
          }
        })());
        return attrs;
      }
    };
  };

  it('cada ruta dibuja su pantalla', async () => {
    const { app, abrir } = await montar();
    for (const [hash, marca] of [
      ['#/', 'class="grilla"'],
      ['#/c/Carnes', 'class="tot"'],
      ['#/r/f1', 'class="rec-tit"'],
      ['#/r/f1/cocinar', 'class="coc"'],
      ['#/buscar?q=nada', 'class="cajaenc"'],
      ['#/ajustes', 'Reindexar']
    ] as const) {
      await abrir(hash);
      expect(app.innerHTML, hash).toContain(marca);
    }
  });

  it('una acción que no está registrada no hace nada', async () => {
    const { abrir, tocar, pinturas, empujados, reemplazos, vueltasAtras } = await montar();
    await abrir('#/r/f1');
    const antes = { pinturas: pinturas.length, hash: location.hash };
    for (const accion of ['no-existe', 'toString', 'constructor']) await tocar(accion);
    expect(pinturas.length).toBe(antes.pinturas);
    expect(location.hash).toBe(antes.hash);
    expect(empujados).toEqual([]);
    expect(reemplazos).toEqual([]);
    expect(vueltasAtras).toEqual([]);
  });

  describe('MENU es la única fuente del menú', () => {
    const HASH_DE: Record<string, string> = {
      recetario: '#/', borradores: '#/borradores', plan: '#/plan', ajustes: '#/ajustes', nueva: '#/nueva'
    };
    const SIN_MENU = ['#/c/Carnes', '#/r/f1', '#/r/f1/editar', '#/buscar?q=pan', '#/t/horno', '#/categorias', '#/plan/compras'];

    it('cada vista de MENU dibuja la hamburguesa, el lateral con su entrada marcada, y el gesto lo abre', async () => {
      const { MENU } = await import('../src/ui/router.js');
      const { abrir, app, deslizar, menuDesplegado } = await montar();
      expect(Object.keys(HASH_DE).sort()).toEqual(Object.keys(MENU).sort());
      for (const [vista, activo] of Object.entries(MENU)) {
        await abrir(HASH_DE[vista]!);
        expect(app.innerHTML, vista).toContain('data-accion="abrir-menu"');
        expect(app.innerHTML, vista).not.toContain('data-accion="volver"');
        expect(app.innerHTML, vista).toContain('<nav class="lat">');
        const marcadas = [...app.innerHTML.matchAll(/<a class="act" href="([^"]*)"/g)].map(m => m[1]);
        expect(marcadas, vista).toEqual(activo ? [HASH_DE[activo]] : []);
        await deslizar({ desde: 30, hasta: 220 });
        expect(menuDesplegado(), vista).toBe(true);
        await deslizar({ desde: 200, hasta: 10 });
      }
    });

    it('las demás dibujan el volver, y el gesto no abre nada', async () => {
      const { abrir, app, deslizar, menuDesplegado } = await montar();
      for (const hash of SIN_MENU) {
        await abrir(hash);
        expect(app.innerHTML, hash).toContain('data-accion="volver"');
        expect(app.innerHTML, hash).not.toContain('data-accion="abrir-menu"');
        await deslizar({ desde: 30, hasta: 220 });
        expect(menuDesplegado(), hash).toBe(false);
      }
    });

    it('desde 900 px, todas las pantallas dibujan el lateral fijo: las demás, sin velo ni marca', async () => {
      const { abrir, app } = await montar({ ancha: true });
      for (const hash of SIN_MENU) {
        await abrir(hash);
        expect(app.innerHTML, hash).toContain('<nav class="lat solo-ancho">');
        expect(app.innerHTML, hash).toContain('<div class="conten">');
        expect(app.innerHTML, hash).not.toContain('velo-lat');
        expect(app.innerHTML, hash).not.toContain('<a class="act"');
      }
    });

    it('la receta, la categoría y el editor llevan el lateral', async () => {
      const { abrir, app } = await montar({ ancha: true });
      for (const hash of ['#/r/f1', '#/c/Carnes', '#/r/f1/editar']) {
        await abrir(hash);
        expect(app.innerHTML, hash).toMatch(/^<nav class="lat solo-ancho">[^]*<\/nav><div class="conten">/);
      }
    });

    it('en pantalla ancha el gesto no abre el menú: es fijo', async () => {
      const { abrir, deslizar, menuDesplegado, pila } = await montar({ ancha: true });
      await abrir('#/borradores');
      await deslizar({ desde: 30, hasta: 220 });
      expect(menuDesplegado()).toBe(false);
      expect(pila()).toHaveLength(2);
    });
  });

  describe('tocar el destino en el que ya se está', () => {
    it('cierra el menú y no navega', async () => {
      const { abrir, tocar, tocarDestino, menuDesplegado, pila } = await montar();
      await abrir('#/plan');
      await tocar('abrir-menu');
      expect(await tocarDestino('#/plan')).toBe(true);
      expect(menuDesplegado()).toBe(false);
      expect(global.location.hash).toBe('#/plan');
      // Ni el link ni la capa del menú quedan en el historial.
      expect(pila().map(e => e.hash)).toEqual(['', '#/plan']);
    });

    it("con la app abierta en '', Inicio es la pantalla actual", async () => {
      const { tocar, tocarDestino, menuDesplegado, pila, pinturas } = await montar();
      await tocar('abrir-menu');
      const antes = pinturas.length;
      expect(await tocarDestino('#/')).toBe(true);
      expect(menuDesplegado()).toBe(false);
      expect(global.location.hash).toBe('');
      expect(pila()).toHaveLength(1);
      expect(pinturas.length).toBe(antes);
    });
  });

  describe('abrir y cerrar el menú no redibuja la pantalla', () => {
    it.each(['#/', '#/borradores', '#/plan', '#/ajustes', '#/nueva'])(
      'en %s, la hamburguesa y el velo cambian las clases sin pintar', async hash => {
        const { abrir, tocar, pinturas, menuDesplegado } = await montar();
        await abrir(hash);
        const antes = pinturas.length;

        await tocar('abrir-menu');
        expect(menuDesplegado()).toBe(true);
        await tocar('cerrar-menu');
        expect(menuDesplegado()).toBe(false);

        expect(pinturas.length).toBe(antes);
      });

    it('el gesto tampoco pinta', async () => {
      const { abrir, deslizar, pinturas, menuDesplegado } = await montar();
      await abrir('#/nueva');
      const antes = pinturas.length;
      await deslizar({ desde: 30, hasta: 220 });
      expect(menuDesplegado()).toBe(true);
      await deslizar({ desde: 200, hasta: 10 });
      expect(menuDesplegado()).toBe(false);
      expect(pinturas.length).toBe(antes);
    });

    it('lo abierto sigue abierto en el próximo dibujo de la misma pantalla', async () => {
      const { abrir, tocar, app } = await montar();
      await abrir('#/');
      await tocar('abrir-menu');
      // Un filtro de la misma pantalla redibuja: el menú sale como estaba.
      await abrir('#/?x=1');
      expect(app.innerHTML).toContain('<nav class="lat abierto">');
    });
  });

  describe('la receta nueva lleva el menú', () => {
    it('#/nueva lleva la hamburguesa y no el volver; el menú no marca ningún destino', async () => {
      const { abrir, app } = await montar();
      await abrir('#/nueva');
      expect(app.innerHTML).toContain('data-accion="abrir-menu"');
      expect(app.innerHTML).not.toContain('data-accion="volver"');
      expect(app.innerHTML).toContain('<nav class="lat">');
      expect(app.innerHTML).not.toContain('<a class="act"');
    });

    it('editar una receta mantiene el volver, sin menú: el lateral es sólo el de pantalla ancha', async () => {
      const { abrir, app } = await montar();
      await abrir('#/r/f1/editar');
      expect(app.innerHTML).toContain('data-accion="volver"');
      expect(app.innerHTML).not.toContain('data-accion="abrir-menu"');
      expect(app.innerHTML).not.toContain('velo-lat');
      expect(app.innerHTML).toContain('<nav class="lat solo-ancho">');
    });

    it('abrir el menú no borra lo escrito', async () => {
      const { abrir, tocar, app, pinturas } = await montar();
      await abrir('#/nueva');
      const formulario = app.innerHTML;
      estado.formulario = { titulo: 'Pan de campo', notas: 'con masa madre' };
      const antes = pinturas.length;

      await tocar('abrir-menu');

      expect(pinturas.length).toBe(antes);
      expect(app.innerHTML).toBe(formulario);
      expect(estado.formulario).toEqual({ titulo: 'Pan de campo', notas: 'con masa madre' });
    });

    it('con cambios, tocar un destino del menú pregunta, y el menú queda cerrado', async () => {
      const { abrir, tocar, tocarDestino, vueltasAtras, preguntas, menuDesplegado, pila } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Pan de campo' };
      await tocar('abrir-menu');
      expect(menuDesplegado()).toBe(true);

      // El destino toma el lugar de la capa del menú, el `hashchange` es el
      // que pregunta, y la entrada del destino se deshace.
      await tocarDestino('#/plan');

      expect(vueltasAtras).toHaveLength(1);
      expect(global.location.hash).toBe('#/nueva');
      expect(pila().map(e => e.hash)).toEqual(['', '#/nueva']);
      expect(preguntas.join('')).toContain('¿Salir sin guardar los cambios?');
      expect(menuDesplegado()).toBe(false);
    });
  });

  describe('el gesto del menú lateral', () => {
    // El gesto entero, que no cubre ningún otro test: los de
    // `ui/gesto-menu.ts` son unitarios y el del botón mira el encabezado. Sin
    // esto, una pantalla puede dejar de responder al dedo sin que nada avise.
    const HASHES: Record<string, string> = {
      recetario: '#/', borradores: '#/borradores', plan: '#/plan', ajustes: '#/ajustes', nueva: '#/nueva'
    };

    it('en las pantallas del menú, deslizar desde el borde lo abre', async () => {
      const { MENU } = await import('../src/ui/router.js');
      const { abrir, deslizar, menuDesplegado } = await montar();
      expect(Object.keys(HASHES).sort()).toEqual(Object.keys(MENU).sort());

      for (const vista of Object.keys(MENU)) {
        await abrir(HASHES[vista]!);
        expect(menuDesplegado(), vista).toBe(false);

        // Arranca pasado el margen que Android se reserva para «atrás», y
        // cruza más de la mitad del menú, que mide 260.
        await deslizar({ desde: 30, hasta: 220 });

        expect(menuDesplegado(), vista).toBe(true);
        // Sale con el menú cerrado, para que la próxima empiece igual.
        await deslizar({ desde: 200, hasta: 10 });
      }
    });

    // Con pocos borradores la pantalla no llega abajo, y
    // debajo de los botones queda un área que no es de `#app`. Ahí el dedo
    // tiene que abrir el menú igual, porque el gesto es de la pantalla.
    it('también abre desde el área vacía debajo del contenido', async () => {
      const { abrir, deslizar, menuDesplegado } = await montar();
      await abrir('#/borradores');

      // El toque no cae sobre nada de la pantalla: el destino no tiene
      // `closest`, como el `<body>` debajo del contenido.
      await deslizar({ desde: 30, hasta: 220, y: 700, sobre: { closest: undefined } });

      expect(menuDesplegado()).toBe(true);
    });

    it('abierto, deslizar para el otro lado lo cierra', async () => {
      const { abrir, deslizar, menuDesplegado } = await montar();
      await abrir('#/borradores');
      await deslizar({ desde: 30, hasta: 220 });
      expect(menuDesplegado()).toBe(true);

      await deslizar({ desde: 200, hasta: 10 });

      expect(menuDesplegado()).toBe(false);
    });

    it('un deslizamiento corto no alcanza: vuelve a donde estaba', async () => {
      const { abrir, deslizar, menuDesplegado } = await montar();
      await abrir('#/borradores');

      // Menos de la mitad del menú.
      await deslizar({ desde: 30, hasta: 100 });

      expect(menuDesplegado()).toBe(false);
    });

    it('desde el borde mismo no arranca: esa franja es el «atrás» de Android', async () => {
      const { abrir, deslizar, menuDesplegado } = await montar();
      await abrir('#/borradores');

      await deslizar({ desde: 5, hasta: 220 });

      expect(menuDesplegado()).toBe(false);
    });

    it('en una pantalla sin menú el dedo no lo abre', async () => {
      const { abrir, deslizar, menuDesplegado, pila } = await montar();
      await abrir('#/r/f1');

      await deslizar({ desde: 30, hasta: 220 });

      expect(menuDesplegado()).toBe(false);
      expect(pila()).toHaveLength(2);
    });

    it('un toque que el sistema cancela termina el gesto igual, sin dejarlo a medias', async () => {
      // `touchcancel` es lo que manda Android cuando se queda con el gesto.
      // Se trata como soltar: el menú queda abierto o cerrado según dónde
      // llegó el dedo, y nunca a mitad de camino.
      const { abrir, deslizar, panelLateral, menuDesplegado } = await montar();
      await abrir('#/borradores');

      await deslizar({ desde: 30, hasta: 220, cancelar: true });

      expect(menuDesplegado()).toBe(true);
      // El panel vuelve a lo que diga el CSS: el `transform` que le escribió
      // el dedo no se queda pegado.
      expect(panelLateral.style.transform).toBe('');
    });
  });

  it('el Recetario corta el carrusel en veinte tags', async () => {
    estado.tags = Array.from({ length: 25 }, (_, i) => ({ tag: `t${i}`, cantidad: 25 - i }));
    const { abrir, app } = await montar();
    await abrir('#/');
    expect(app.innerHTML).toContain('>t19<');
    expect(app.innerHTML).not.toContain('>t20<');
  });

  it('la flecha desplaza el carrusel el 80% de lo que se ve', async () => {
    estado.tags = [{ tag: 'horno', cantidad: 3 }];
    const { abrir, tocar, desplazamientos } = await montar();
    await abrir('#/');

    await tocar('carrusel-der');
    await tocar('carrusel-izq');

    expect(desplazamientos).toEqual([320, -320]);
  });

  it('en la receta, la flecha mueve el carrusel de las fotos', async () => {
    estado.md = '---\ntitulo: Milanesas\n---\n\n## Fotos\n\n- 1: https://ejemplo/1.jpg\n- 2: https://ejemplo/2.jpg\n';
    const { abrir, tocar, app, desplazamientos } = await montar();
    await abrir('#/r/f1');

    expect(app.innerHTML).toContain('carrusel-fotos');
    await tocar('carrusel-der');

    expect(desplazamientos).toEqual([320]);
  });

  it('la flecha respeta prefers-reduced-motion: sin animación al desplazar', async () => {
    estado.tags = [{ tag: 'horno', cantidad: 3 }];
    const { abrir, tocar, comportamientos } = await montar({ reducedMotion: true });
    await abrir('#/');

    await tocar('carrusel-der');

    expect(comportamientos).toEqual(['auto']);
  });

  it('la lista por tag se dibuja, con el total y las recetas', async () => {
    const { abrir, app } = await montar();
    await abrir('#/t/horno');
    expect(app.innerHTML).toContain('>horno<');
    expect(app.innerHTML).toContain('class="fila tarjeta"');
  });

  it('en la lista por tag, tocar otro chip acumula: los dos quedan activos y la lista se achica', async () => {
    // El tag de la ruta (`horno`) no es tocable: el que acumula es el otro
    // chip del carrusel. `buscar` filtra de verdad acá, a diferencia del resto
    // de este archivo, para poder ver que la lista se achica con los dos
    // tags puestos.
    estado.tags = [{ tag: 'horno', cantidad: 2 }, { tag: 'dulce', cantidad: 1 }];
    const original = storeFake.buscar;
    storeFake.buscar = (filtros?: { tags?: string[] }) => {
      const activos = filtros?.tags ?? [];
      const todas = [
        entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', categoria: 'Carnes', tags: ['horno'] }),
        entradaFalsa({ id_archivo: 'f2', titulo: 'Torta frita', categoria: 'Postres', tags: ['horno', 'dulce'] })
      ];
      return todas.filter(e => activos.every(t => e.tags.includes(t)));
    };
    try {
      const { abrir, tocar, app } = await montar();
      await abrir('#/t/horno');
      expect(app.innerHTML).toContain('Milanesas');
      expect(app.innerHTML).toContain('Torta frita');

      await tocar('', { tag: 'dulce' });

      expect(app.innerHTML).not.toContain('Milanesas');
      expect(app.innerHTML).toContain('Torta frita');
    } finally {
      storeFake.buscar = original;
    }
  });

  it('en el Recetario, tocar un chip del carrusel navega a la lista por tag', async () => {
    estado.tags = [{ tag: 'horno', cantidad: 3 }];
    const { abrir, tocar } = await montar();
    await abrir('#/');
    await tocar('', { tag: 'horno' });
    expect(global.location.hash).toBe('#/t/horno');
  });

  it('en la categoría, tocar un chip sigue filtrando ahí mismo, sin navegar', async () => {
    estado.tags = [{ tag: 'horno', cantidad: 3 }];
    const { abrir, tocar, app } = await montar();
    await abrir('#/c/Carnes');
    await tocar('', { tag: 'horno' });
    expect(global.location.hash).toBe('#/c/Carnes');
    expect(app.innerHTML).toContain('class="chip act"');
  });

  it('en la categoría, encender duraciones suma y el total baja; cambiar de pantalla lo limpia', async () => {
    const original = storeFake.buscar;
    storeFake.buscar = () => [
      entradaFalsa({ id_archivo: 'f1', titulo: 'Rabas', categoria: 'Carnes', tiempo: '~30 min' }),
      entradaFalsa({ id_archivo: 'f2', titulo: 'Guiso', categoria: 'Carnes', tiempo: '>60 min' }),
      entradaFalsa({ id_archivo: 'f3', titulo: 'Asado', categoria: 'Carnes', tiempo: '' })
    ];
    try {
      const { abrir, tocar, app } = await montar();
      await abrir('#/c/Carnes');
      await tocar('filtrar-duracion', { valor: '~30 min' });
      expect(app.innerHTML).toContain('Rabas');
      expect(app.innerHTML).not.toContain('Guiso');
      expect(app.innerHTML).toContain('<span class="tot">1</span>');
      await tocar('filtrar-duracion', { valor: '>60 min' });
      expect(app.innerHTML).toContain('Guiso');
      expect(app.innerHTML).not.toContain('Asado');
      await abrir('#/');
      await abrir('#/c/Carnes');
      expect(app.innerHTML).toContain('Asado');
    } finally {
      storeFake.buscar = original;
    }
  });

  it('ordenar por duración reordena la lista y vuelve a A–Z al cambiar de pantalla', async () => {
    const original = storeFake.buscar;
    storeFake.buscar = () => [
      entradaFalsa({ id_archivo: 'f1', titulo: 'Asado', categoria: 'Carnes', tiempo: '>60 min' }),
      entradaFalsa({ id_archivo: 'f2', titulo: 'Rabas', categoria: 'Carnes', tiempo: '~15 min' })
    ];
    try {
      const { abrir, tocar, app } = await montar();
      await abrir('#/c/Carnes');
      expect(app.innerHTML.indexOf('Asado')).toBeLessThan(app.innerHTML.indexOf('Rabas'));
      await tocar('ordenar', { valor: 'duracion' });
      expect(app.innerHTML.indexOf('Rabas')).toBeLessThan(app.innerHTML.indexOf('Asado'));
      await abrir('#/');
      await abrir('#/c/Carnes');
      expect(app.innerHTML.indexOf('Asado')).toBeLessThan(app.innerHTML.indexOf('Rabas'));
    } finally {
      storeFake.buscar = original;
    }
  });

  it('sin la fila de duraciones (por el filtro de tags) el orden vuelve a A–Z aunque quedara en duración', async () => {
    // Con todos los tags, hay una receta con duración: se puede elegir orden
    // por duración. Filtrando por `sinTiempo` quedan sólo las dos sin
    // duración: la fila de orden no se dibuja, y el orden efectivo tiene que
    // volver a A–Z —favoritas primero— en vez de quedarse pegado en
    // duración, donde no hay control para sacarlo.
    const original = storeFake.buscar;
    storeFake.buscar = (filtros?: { tags?: string[] }) => {
      const activos = filtros?.tags ?? [];
      const todas = [
        entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', categoria: 'Carnes', tags: ['horno'], tiempo: '~30 min' }),
        entradaFalsa({ id_archivo: 'f2', titulo: 'Arroz', categoria: 'Carnes', tags: ['sinTiempo'] }),
        entradaFalsa({ id_archivo: 'f3', titulo: 'Zapallo', categoria: 'Carnes', tags: ['sinTiempo', 'favorito'] })
      ];
      return todas.filter(e => activos.every(t => e.tags.includes(t)));
    };
    try {
      const { abrir, tocar, app } = await montar();
      await abrir('#/c/Carnes');
      await tocar('ordenar', { valor: 'duracion' });
      expect(app.innerHTML).toContain('data-accion="ordenar" data-valor="duracion" aria-pressed="true"');

      await tocar('', { tag: 'sinTiempo' });

      // La fila de orden no se dibuja: no hay ninguna duración en lo filtrado.
      expect(app.innerHTML).not.toContain('data-accion="ordenar"');
      // Pero el orden efectivo es A–Z: Zapallo es favorita y va primero,
      // aunque alfabéticamente vaya después de Arroz.
      expect(app.innerHTML.indexOf('Zapallo')).toBeLessThan(app.innerHTML.indexOf('Arroz'));
    } finally {
      storeFake.buscar = original;
    }
  });

  it('lo mismo en la lista por tag: sin la fila de duraciones el orden vuelve a A–Z', async () => {
    const original = storeFake.buscar;
    storeFake.buscar = (filtros?: { tags?: string[] }) => {
      const activos = filtros?.tags ?? [];
      const todas = [
        entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', categoria: 'Carnes', tags: ['horno'], tiempo: '~30 min' }),
        entradaFalsa({ id_archivo: 'f2', titulo: 'Arroz', categoria: 'Carnes', tags: ['horno', 'sinTiempo'] }),
        entradaFalsa({ id_archivo: 'f3', titulo: 'Zapallo', categoria: 'Carnes', tags: ['horno', 'sinTiempo', 'favorito'] })
      ];
      return todas.filter(e => activos.every(t => e.tags.includes(t)));
    };
    try {
      const { abrir, tocar, app } = await montar();
      await abrir('#/t/horno');
      await tocar('ordenar', { valor: 'duracion' });
      expect(app.innerHTML).toContain('data-accion="ordenar" data-valor="duracion" aria-pressed="true"');

      await tocar('', { tag: 'sinTiempo' });

      expect(app.innerHTML).not.toContain('data-accion="ordenar"');
      expect(app.innerHTML.indexOf('Zapallo')).toBeLessThan(app.innerHTML.indexOf('Arroz'));
    } finally {
      storeFake.buscar = original;
    }
  });

  it('ordenar por duración vuelve a mostrar el primer tramo: la única con duración entra ahí aunque alfabético la deje afuera', async () => {
    // 31 recetas: 30 sin duración con títulos A01..A30, y «Zeta» con
    // `~15 min`, que alfabéticamente cae última —fuera del primer tramo de
    // 30 (`TRAMO`)—. Ordenar por duración la trae adelante de todas: tiene
    // que entrar en lo que ya se dibujó, sin tocar «ver más».
    const original = storeFake.buscar;
    const todas = [
      ...Array.from({ length: 30 }, (_, i) =>
        entradaFalsa({ id_archivo: `f${i}`, titulo: `A${String(i + 1).padStart(2, '0')}`, categoria: 'Carnes' })),
      entradaFalsa({ id_archivo: 'fz', titulo: 'Zeta', categoria: 'Carnes', tiempo: '~15 min' })
    ];
    storeFake.buscar = () => todas;
    try {
      const { abrir, tocar, app } = await montar();
      await abrir('#/c/Carnes');
      expect(app.innerHTML).not.toContain('Zeta');

      await tocar('ordenar', { valor: 'duracion' });

      expect(app.innerHTML).toContain('Zeta');
    } finally {
      storeFake.buscar = original;
    }
  });

  it('filtrar por tag vuelve a mostrar el primer tramo, como el filtro de duración y el orden', async () => {
    // 31 recetas con el mismo tag. El tramo avanza con un IntersectionObserver,
    // que en Node no existe: acá es uno falso que se dispara a mano.
    const original = storeFake.buscar;
    const todas = Array.from({ length: 31 }, (_, i) =>
      entradaFalsa({ id_archivo: `f${i}`, titulo: `A${String(i + 1).padStart(2, '0')}`, categoria: 'Carnes', tags: ['horno'] }));
    storeFake.buscar = () => todas;
    let llegarAlPie = (): void => {};
    const g = global as unknown as Record<string, unknown>;
    g['IntersectionObserver'] = class {
      constructor(fn: (e: { isIntersecting: boolean }[]) => void) { llegarAlPie = () => fn([{ isIntersecting: true }]); }
      observe(): void {}
      disconnect(): void {}
    };
    try {
      const { abrir, tocar, app } = await montar();
      await abrir('#/c/Carnes');
      expect(app.innerHTML).not.toContain('A31');
      llegarAlPie();
      await vi.waitFor(() => expect(app.innerHTML).toContain('A31'));

      await tocar('', { tag: 'horno' });

      expect(app.innerHTML).not.toContain('A31');
    } finally {
      storeFake.buscar = original;
      delete g['IntersectionObserver'];
    }
  });

  it('los resultados paginan como la categoría: el tramo siguiente entra al llegar al pie', async () => {
    const original = storeFake.buscarPorTexto;
    storeFake.buscarPorTexto = () => ({
      porNombre: Array.from({ length: 31 }, (_, i) =>
        entradaFalsa({ id_archivo: `f${i}`, titulo: `A${String(i + 1).padStart(2, '0')}`, categoria: 'Carnes' })),
      porIngrediente: [], porTag: []
    });
    let llegarAlPie = (): void => {};
    const g = global as unknown as Record<string, unknown>;
    g['IntersectionObserver'] = class {
      constructor(fn: (e: { isIntersecting: boolean }[]) => void) { llegarAlPie = () => fn([{ isIntersecting: true }]); }
      observe(): void {}
      disconnect(): void {}
    };
    try {
      const { abrir, app } = await montar();
      await abrir('#/buscar?q=a');
      expect(app.innerHTML).not.toContain('A31');
      // El rótulo dice cuántas trajo el grupo, no cuántas se ven.
      expect(app.innerHTML).toContain('<span>Por nombre</span><span>31</span>');
      llegarAlPie();
      await vi.waitFor(() => expect(app.innerHTML).toContain('A31'));
    } finally {
      storeFake.buscarPorTexto = original;
      delete g['IntersectionObserver'];
    }
  });

  it('ordenar por duración en la búsqueda reordena los resultados', async () => {
    const original = storeFake.buscarPorTexto;
    storeFake.buscarPorTexto = () => ({
      porNombre: [
        entradaFalsa({ id_archivo: 'f1', titulo: 'Asado', tiempo: '>60 min' }),
        entradaFalsa({ id_archivo: 'f2', titulo: 'Rabas', tiempo: '~15 min' })
      ],
      porIngrediente: [], porTag: []
    });
    try {
      const { abrir, tocar, app } = await montar();
      await abrir('#/buscar?q=horno');
      expect(app.innerHTML.indexOf('Asado')).toBeLessThan(app.innerHTML.indexOf('Rabas'));
      await tocar('ordenar', { valor: 'duracion' });
      expect(app.innerHTML.indexOf('Rabas')).toBeLessThan(app.innerHTML.indexOf('Asado'));
    } finally {
      storeFake.buscarPorTexto = original;
    }
  });

  it('un link de invitado con la app ya abierta recarga: la vista de invitado se decide al cargar', async () => {
    const { abrir, recargas } = await montar();
    await abrir('#/ver?r=1abc');
    expect(recargas).toHaveLength(1);
  });

  it('borrar los datos locales borra la copia y recarga: lo que hay en memoria salió de ella', async () => {
    const { abrir, tocar, recargas } = await montar();
    await abrir('#/ajustes');
    await tocar('borrar-datos-locales');
    expect(estado.copiasBorradas).toBe(1);
    expect(recargas).toHaveLength(1);
  });

  it('al terminar de reindexar, Ajustes avisa las recetas de Sin categoría sin la marca de borrador', async () => {
    const { app, abrir, tocar } = await montar();
    const conReconstruir = storeFake as typeof storeFake & {
      reconstruir?: () => Promise<{ ignorados: string[]; sinBorrador: string[] }>;
    };
    conReconstruir.reconstruir = async () => ({ ignorados: [], sinBorrador: ['sin-tag.md'] });
    try {
      await abrir('#/ajustes');
      await tocar('reindexar');
      expect(app.innerHTML).toContain('En Sin categoría hay una receta sin la marca de borrador.');
      expect(app.innerHTML).toContain('sin-tag.md');
    } finally {
      delete conReconstruir.reconstruir;
    }
  });

  describe('el reindexado y la carpeta base, con el velo del progreso', () => {
    type Reconstruir = (alProgresar: (p: number) => void) => Promise<{ ignorados: string[]; sinBorrador: string[] }>;
    const conReconstruir = storeFake as typeof storeFake & { reconstruir?: Reconstruir };
    afterEach(() => { delete conReconstruir.reconstruir; });

    /** Un reindexado que avanza hasta la mitad y queda esperando a que el test lo suelte o lo haga fallar. */
    function reindexadoPendiente() {
      let soltar!: () => void;
      let fallar!: () => void;
      conReconstruir.reconstruir = alProgresar => new Promise((ok, mal) => {
        alProgresar(0.5);
        soltar = () => ok({ ignorados: [], sinBorrador: [] });
        fallar = () => mal(new Error('sin red'));
      });
      return { soltar: () => soltar(), fallar: () => fallar() };
    }

    it('Reindexar dibuja la tarjeta del velo con el texto y la barra; la pantalla de atrás no se pinta', async () => {
      const { app, abrir, tocarSinCerrar, velo, pinturas } = await montar();
      await abrir('#/ajustes');
      const pendiente = reindexadoPendiente();
      const antes = pinturas.length;

      const reindexando = tocarSinCerrar('reindexar');
      await esperar();
      expect(velo.hidden).toBe(false);
      expect(velo.classList.contains('progreso')).toBe(true);
      expect(velo.progreso.texto.textContent).toBe('Reindexando…');
      expect(velo.progreso.barra.style.width).toBe('50%');
      expect(pinturas).toHaveLength(antes);

      pendiente.soltar();
      await reindexando;
      await esperar();
      expect(velo.hidden).toBe(true);
      expect(velo.classList.contains('progreso')).toBe(false);
      expect(app.innerHTML).toContain('data-accion="reindexar"');
    });

    it('mientras reindexa, un cambio de hash se deshace y los toques no hacen nada', async () => {
      const { app, abrir, tocarSinCerrar, empujados } = await montar();
      await abrir('#/ajustes');
      const pendiente = reindexadoPendiente();
      const reindexando = tocarSinCerrar('reindexar');
      await esperar();

      const pantalla = app.innerHTML;
      await abrir('#/plan');
      expect(global.location.hash).toBe('#/ajustes');
      expect(app.innerHTML).toBe(pantalla);
      const empujadosAntes = empujados.length;
      await tocarSinCerrar('cambiar-carpeta');
      await esperar();
      expect(empujados).toHaveLength(empujadosAntes);

      pendiente.soltar();
      await reindexando;
    });

    it('si falla, el velo se va y Ajustes avisa con Reintentar', async () => {
      const { app, abrir, tocarSinCerrar, velo } = await montar();
      await abrir('#/ajustes');
      const pendiente = reindexadoPendiente();
      const reindexando = tocarSinCerrar('reindexar');
      await esperar();

      pendiente.fallar();
      await reindexando;
      await esperar();
      expect(velo.hidden).toBe(true);
      expect(app.innerHTML).toContain('No se pudo reindexar.');
      expect(app.innerHTML).toContain('Reintentar');

      // Reintentar vuelve a reindexar, y al salir bien el aviso se va.
      conReconstruir.reconstruir = async () => ({ ignorados: [], sinBorrador: [] });
      await tocarSinCerrar('reindexar');
      await esperar();
      expect(app.innerHTML).not.toContain('No se pudo reindexar.');
    });

    it('al arrancar, reindexa con la tarjeta del velo y no con una pantalla propia', async () => {
      estado.reconstruirAlArrancar = true;
      let aMitad: { progreso: boolean; texto: string } | null = null;
      conReconstruir.reconstruir = async alProgresar => {
        alProgresar(0.5);
        // El velo del documento que armó `montar`, a mitad del reindexado.
        const velo = global.document.querySelector('#velo-escritura') as unknown as
          { classList: { contains: (c: string) => boolean }; progreso: { texto: { textContent: string } } };
        aMitad = { progreso: velo.classList.contains('progreso'), texto: velo.progreso.texto.textContent };
        return { ignorados: [], sinBorrador: [] };
      };
      const { pinturas, velo, app } = await montar({ hash: '#/' });
      expect(aMitad).toEqual({ progreso: true, texto: 'Reindexando…' });
      expect(pinturas.some(p => p.html.includes('Creando el índice'))).toBe(false);
      expect(app.innerHTML).toContain('class="grilla"');
      expect(velo.hidden).toBe(true);
    });

    it('al arrancar, si el reindexado falla, el aviso con Reintentar vuelve a reindexar', async () => {
      estado.reconstruirAlArrancar = true;
      conReconstruir.reconstruir = async () => { throw new Error('sin red'); };
      const { app, tocar, velo } = await montar({ hash: '#/' });
      expect(velo.hidden).toBe(true);
      expect(app.innerHTML).toContain('No se pudo reindexar.');
      expect(app.innerHTML).toContain('data-accion="reindexar-al-arrancar"');

      conReconstruir.reconstruir = async () => ({ ignorados: [], sinBorrador: [] });
      await tocar('reindexar-al-arrancar');
      expect(app.innerHTML).toContain('class="grilla"');
    });

    it('preparar la carpeta usa la tarjeta del velo; si falla, el aviso con Reintentar', async () => {
      estado.eligiendo = [{ id: 'r1', name: 'Recetario' }];
      const original = storeFake.prepararCarpeta;
      let aMitad: { progreso: boolean; texto: string; barra: string } | null = null;
      try {
        const { app, tocar, velo, recargas } = await montar();
        storeFake.prepararCarpeta = async (_c: { id: string }, alProgresar?: (p: number) => void) => {
          alProgresar?.(0.25);
          aMitad = {
            progreso: velo.classList.contains('progreso'), texto: velo.progreso.texto.textContent,
            barra: velo.progreso.barra.style.width
          };
          throw new Error('sin red');
        };
        await tocar('carpeta-sugerida', { id: 'r1', nombre: 'Recetario' });
        await tocar('carpeta-confirmar');
        expect(aMitad).toEqual({ progreso: true, texto: 'Preparando la carpeta…', barra: '25%' });
        expect(velo.hidden).toBe(true);
        expect(app.innerHTML).toContain('No se pudo preparar la carpeta.');
        expect(app.innerHTML).toContain('data-accion="reintentar"');
        expect(recargas).toHaveLength(0);
      } finally {
        storeFake.prepararCarpeta = original;
      }
    });
  });

  describe('la gestión de categorías', () => {
    it('la lista y la edición se dibujan', async () => {
      const { app, abrir } = await montar();
      await abrir('#/categorias');
      expect(app.innerHTML).toContain('href="#/categorias/c1"');
      await abrir('#/categorias/c1');
      expect(app.innerHTML).toContain('name="nombre" value="Carnes"');
      await abrir('#/categorias/nueva');
      expect(app.innerHTML).toContain('Nueva categoría');
    });

    it('guardar una edición llama al store con lo del formulario y vuelve a la lista', async () => {
      const { abrir, tocar, vueltasAtras } = await montar();
      await abrir('#/categorias/c1');
      estado.formulario = { nombre: 'Carnes rojas', color: 'carnes', foto: 'catalogo:carnes' };
      await tocar('guardar-categoria');
      expect(estado.categoriasGuardadas).toEqual(['c1:Carnes rojas']);
      expect(vueltasAtras).toHaveLength(1);
    });

    it('guardar una nueva la crea', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/categorias/nueva');
      estado.formulario = { nombre: 'Fiambres', color: 'bebidas', foto: '' };
      await tocar('guardar-categoria');
      expect(estado.categoriasGuardadas).toEqual(['nueva:Fiambres']);
    });

    // Lo que `revisarCategoria` actualiza en vivo, sin redibujar el
    // formulario: redibujarlo perdería el foco y el cursor.
    it('escribir el nombre lo lleva a la muestra y habilita Guardar', async () => {
      const { abrir, tipearEnCategoria, muestraDeCategoria, guardarCategoria } = await montar();
      await abrir('#/categorias/nueva');
      // Recién dibujada, la nueva no tiene nada escrito: Guardar arranca apagado.
      expect(guardarCategoria.disabled).toBe(true);

      await tipearEnCategoria('Fiambres');

      expect(muestraDeCategoria.nombre).toBe('Fiambres');
      expect(guardarCategoria.disabled).toBe(false);
    });

    it('un nombre vacío o repetido avisa y deja Guardar apagado', async () => {
      const { abrir, tipearEnCategoria, errorDeNombre, guardarCategoria } = await montar();
      await abrir('#/categorias/nueva');

      // «Carnes» es la otra categoría: la comparación no mira ni mayúsculas ni tildes.
      await tipearEnCategoria('carnes');
      expect(errorDeNombre.hidden).toBe(false);
      expect(errorDeNombre.textContent).toBe('Ya hay una categoría con ese nombre.');
      expect(guardarCategoria.disabled).toBe(true);

      await tipearEnCategoria('');
      expect(errorDeNombre.textContent).toBe('Ponele un nombre.');
      expect(guardarCategoria.disabled).toBe(true);

      await tipearEnCategoria('Fiambres');
      expect(errorDeNombre.hidden).toBe(true);
      expect(errorDeNombre.textContent).toBe('');
    });

    it('elegir un color y una foto los marca y los lleva a la muestra', async () => {
      const { abrir, tocar, muestraDeCategoria } = await montar();
      await abrir('#/categorias/nueva');

      await tocar('elegir-color', { valor: 'pastas' });
      expect(muestraDeCategoria.color).toBe(colorDeClave('pastas'));
      // Sin foto elegida, la muestra va con la trama sobre el color.
      expect(muestraDeCategoria.conTrama).toBe(true);

      await tocar('elegir-foto', { valor: 'catalogo:pastas' });
      expect(muestraDeCategoria.conTrama).toBe(false);
      expect(muestraDeCategoria.imagen).toMatch(/<img src="[^"]*pastas/);
    });

    it('borrar pregunta con las recetas, y confirmar borra y vuelve a la lista', async () => {
      const { abrir, tocar, enLugar } = await montar();
      await abrir('#/categorias');
      await abrir('#/categorias/c1');
      await tocar('borrar-categoria');
      expect(enLugar.at(-1)).toContain('Carnes y su receta va a la papelera de Drive.');
      await tocar('borrar-categoria-confirmado');
      expect(estado.categoriasBorradas).toEqual(['c1']);
      expect(global.location.hash).toBe('#/categorias');
    });
  });

  describe('la carpeta base', () => {
    it('sin carpeta marcada, el arranque lleva a la pantalla con las encontradas', async () => {
      estado.eligiendo = [{ id: 'r1', name: 'Recetario' }];
      const { app } = await montar();
      expect(global.location.hash).toBe('#/carpeta');
      expect(app.innerHTML).toContain('Tus recetas en Drive');
      expect(app.innerHTML).toContain('data-id="r1"');
    });

    it('mientras no hay carpeta, otra ruta vuelve a la pantalla', async () => {
      estado.eligiendo = [];
      const { abrir, reemplazos } = await montar();
      await abrir('#/ajustes');
      expect(reemplazos.at(-1)).toBe('#/carpeta');
    });

    it('elegir una encontrada confirma, prepara la carpeta y recarga', async () => {
      estado.eligiendo = [{ id: 'r1', name: 'Recetario' }];
      const { app, tocar, recargas } = await montar();
      await tocar('carpeta-sugerida', { id: 'r1', nombre: 'Recetario' });
      expect(app.innerHTML).toContain('Voy a usar <b>Recetario</b>.');
      await tocar('carpeta-confirmar');
      expect(estado.preparadas).toEqual(['r1']);
      expect(estado.reemplazadas).toBe(0);
      expect(recargas).toHaveLength(1);
    });

    it('crear no pregunta: crea la carpeta en Mi unidad, la prepara y recarga', async () => {
      estado.eligiendo = [];
      const { tocar, recargas } = await montar();
      await tocar('carpeta-crear');
      expect(estado.carpetasCreadas).toEqual([{ nombre: 'Recetario', padre: 'root' }]);
      expect(estado.preparadas).toEqual(['nueva']);
      expect(recargas).toHaveLength(1);
    });

    it('con el Picker, elegir una carpeta confirma y prepara', async () => {
      estado.eligiendo = [];
      picker.elegida = { id: 'p1', nombre: 'Mis recetas' };
      const { app, tocar } = await montar();
      await tocar('carpeta-elegir');
      expect(app.innerHTML).toContain('Voy a usar <b>Mis recetas</b>.');
      await tocar('carpeta-confirmar');
      expect(estado.preparadas).toEqual(['p1']);
    });

    it('cancelar el Picker no cambia nada', async () => {
      estado.eligiendo = [];
      const { app, tocar } = await montar();
      await tocar('carpeta-elegir');
      expect(app.innerHTML).not.toContain('Voy a usar');
      expect(estado.preparadas).toEqual([]);
    });

    it('si el Picker no abre, lo dice y deja reintentar', async () => {
      estado.eligiendo = [];
      picker.falla = true;
      const { app, tocar } = await montar();
      await tocar('carpeta-elegir');
      expect(app.innerHTML).toContain('No se pudo abrir el selector de Google.');
      expect(app.innerHTML).toContain('data-accion="reintentar"');
    });

    it('cambiar de carpeta desde Ajustes anota la anterior antes de preparar la nueva', async () => {
      picker.elegida = { id: 'a1', nombre: 'Cocina' };
      const { app, abrir, tocar } = await montar();
      await abrir('#/ajustes');
      await tocar('cambiar-carpeta');
      await abrir('#/carpeta?cambiando=1');
      expect(app.innerHTML).toContain('Cambiar carpeta');
      await tocar('carpeta-elegir');
      await tocar('carpeta-confirmar');
      expect(estado.reemplazadas).toBe(1);
      expect(estado.preparadas).toEqual(['a1']);
    });

    it('Ajustes dice qué carpeta se usa', async () => {
      const { app, abrir } = await montar();
      await abrir('#/ajustes');
      expect(app.innerHTML).toContain('Carpeta: Recetario');
    });
  });

  it('Salir borra la copia local del índice, además del token', async () => {
    const { tocar } = await montar();
    await tocar('salir');
    expect(estado.copiasBorradas).toBe(1);
  });

  it('Salir recarga la página: lo que quedó en memoria no se vuelve a dibujar', async () => {
    const { abrir, tocar, recargas } = await montar();
    await abrir('#/ajustes');
    await tocar('salir');
    expect(recargas).toHaveLength(1);
  });

  it('el aviso de la planilla _indice duplicada llega a Ajustes', async () => {
    estado.indiceDuplicado = { cantidad: 2, modifiedTime: new Date(2026, 8, 12, 14, 30).toISOString() };
    const { app, abrir } = await montar();
    await abrir('#/ajustes');
    expect(app.innerHTML).toContain('Hay 2 planillas _indice en Drive.');
  });

  it('sin red, la pantalla avisa y no dibuja datos de una lectura anterior', async () => {
    const { app, abrir } = await montar();
    await abrir('#/r/f1');
    expect(app.innerHTML).toContain('Milanesas');

    estado.falla = true;
    await abrir('#/r/f2');
    expect(app.innerHTML).toContain('class="aviso"');
    expect(app.innerHTML).not.toContain('Milanesas');
  });

  it('ningún error muestra el mensaje crudo de Google', async () => {
    const { app, abrir } = await montar();
    estado.falla = new Error('Unable to parse range: meta!A1:B20');
    await abrir('#/r/f1');
    expect(app.innerHTML).not.toContain('Unable to parse range');
    expect(app.innerHTML).toContain('data-accion="reintentar"');
  });

  it('cada pantalla nueva empieza arriba', async () => {
    // El hash no toca el scroll: entrar al modo cocina desde el pie de la
    // receta abría los ingredientes ya scrolleados.
    const { abrir, scrolls } = await montar();
    await abrir('#/r/f1');
    const antes = scrolls.length;
    await abrir('#/r/f1/cocinar');
    expect(scrolls.length).toBeGreaterThan(antes);
    expect(scrolls.at(-1)).toBe(0);
  });

  it('el volver del encabezado vuelve: es la acción que las pantallas dibujan', async () => {
    // El encabezado emite `volver`: si el cableado escuchara otro nombre, el
    // botón no haría nada en ninguna pantalla.
    const { abrir, tocar, vueltasAtras } = await montar();
    await abrir('#/c/Carnes');
    await tocar('volver');
    expect(vueltasAtras).toHaveLength(1);
  });

  it('las dos salidas del modo cocina tienen destinos distintos', async () => {
    const { abrir, tocar } = await montar({ hash: '#/r/f1/cocinar' });

    // El chevron vuelve a la receta, para seguir leyéndola sin la escala de cocina.
    await tocar('volver-receta');
    expect(global.location.hash).toBe('#/r/f1');

    // Salir vuelve a la categoría, que es donde se elige otra cosa.
    await abrir('#/r/f1/cocinar');
    await tocar('salir-cocina');
    expect(global.location.hash).toBe('#/c/Carnes');
  });

  it('volver de la cocina a la receta es un back cuando se entró desde ella', async () => {
    // Con una navegación nueva, la receta quedaría dos veces seguidas en el
    // historial y su chevron parecería no hacer nada; con `location.hash =`,
    // el chevron de la receta volvería al modo cocina.
    const { abrir, tocar, reemplazos, vueltasAtras } = await montar();
    await abrir('#/r/f1');
    await tocar('cocinar');
    await tocar('volver-receta');
    expect(vueltasAtras).toHaveLength(1);
    expect(reemplazos).toEqual([]);
  });

  it('con un link directo al modo cocina, volver navega a la receta', async () => {
    const { tocar, reemplazos } = await montar({ hash: '#/r/f1/cocinar' });
    await tocar('volver-receta');
    expect(reemplazos).toEqual(['#/r/f1']);
  });

  it('salir de la cocina no la deja en el historial', async () => {
    const { abrir, tocar, pila } = await montar();
    await abrir('#/r/f1');
    await tocar('cocinar');
    await tocar('salir-cocina');
    expect(pila().map(e => e.hash)).toEqual(['']);
  });

  it('el modo cocina arranca con el paso 1 como actual', async () => {
    // Sin ingredientes, el modo cocina abre directo en los pasos.
    estado.md = '---\ntitulo: Rabas\n---\n\n## Preparación\n1. Lavar.\n2. Freír.\n';
    const { abrir, app } = await montar();
    await abrir('#/r/f1/cocinar');

    expect(app.innerHTML).toContain('<li class="aqui" data-accion="paso" data-paso="0">');
    expect(app.innerHTML).toContain('<li data-accion="paso" data-paso="1">');
  });

  describe('el .md se lee al entrar a la pantalla, no en cada redibujado', () => {
    const PASOS = '---\ntitulo: Rabas\n---\n\n## Ingredientes\n- Calamar — 1 kg\n\n## Preparación\n1. Lavar.\n2. Freír.\n';

    it('en cocina, marcar pasos, conmutar y tocar el sol no vuelven a leer', async () => {
      vi.stubGlobal('navigator', { wakeLock: { request: async () => ({ addEventListener: () => {}, release: async () => {} }) } });
      estado.md = PASOS;
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1/cocinar');
      expect(estado.lecturas).toBe(1);

      await tocar('conmutar', { posicion: 'pasos' });
      // El paso 1 arranca como actual: tocarlo lo da por hecho.
      await tocar('paso', { paso: '0' });
      await tocar('wake');

      expect(estado.lecturas).toBe(1);
      // Y los toques se dibujaron: el primero hecho, el segundo actual, el sol encendido.
      expect(app.innerHTML).toContain('<li class="hecho" data-accion="paso" data-paso="0">');
      expect(app.innerHTML).toContain('<li class="aqui" data-accion="paso" data-paso="1">');
      expect(app.innerHTML).toContain('class="ico on" data-accion="wake"');
    });

    it('tocar un tag en la receta abierta no vuelve a leer', async () => {
      estado.md = '---\ntitulo: Rabas\ntags: [frito]\n---\n';
      const { abrir, tocar } = await montar();
      await abrir('#/r/f1');
      await tocar('', { tag: 'frito' });
      expect(estado.lecturas).toBe(1);
    });

    it('entre la receta, su modo cocina y su editor se reutiliza la misma copia', async () => {
      estado.md = PASOS;
      const { abrir } = await montar();
      await abrir('#/r/f1');
      await abrir('#/r/f1/cocinar');
      await abrir('#/r/f1');
      await abrir('#/r/f1/editar');
      await abrir('#/r/f1');
      expect(estado.lecturas).toBe(1);
    });

    it('otra receta, o salir a otra pantalla y volver, sí vuelven a leer', async () => {
      estado.md = PASOS;
      const { abrir } = await montar();
      await abrir('#/r/f1');
      await abrir('#/r/f2');
      expect(estado.lecturas).toBe(2);
      await abrir('#/c/Carnes');
      await abrir('#/r/f2');
      expect(estado.lecturas).toBe(3);
    });

    it('reintentar vuelve a leer', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/r/f1');
      await tocar('reintentar');
      expect(estado.lecturas).toBe(2);
    });

    it('después de guardar, volver a la receta muestra lo guardado sin volver a leer', async () => {
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');
      await abrir('#/r/f1/editar');
      expect(estado.lecturas).toBe(1);

      estado.formulario = { titulo: 'Milanesas a caballo', carpeta: 'c1' };
      await tocar('guardar');
      // Guardar relee el .md antes de escribir: lo que la app no conoce se preserva.
      expect(estado.lecturas).toBe(2);

      await abrir('#/r/f1');
      expect(estado.lecturas).toBe(2);
      expect(app.innerHTML).toContain('Milanesas a caballo');
    });

    it('guardar una receta nueva la deja leída: la receta creada se dibuja sin volver a leer', async () => {
      const { abrir, tocar, app } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Pan casero', carpeta: 'c1' };
      await tocar('guardar');
      expect(global.location.hash).toBe('#/r/nuevo-1');
      expect(estado.lecturas).toBe(0);
      expect(app.innerHTML).toContain('Pan casero');
    });

    it('si la lectura falla, reintentar vuelve a pedirla', async () => {
      estado.falla = true;
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');
      estado.falla = false;
      await tocar('reintentar');
      expect(estado.lecturas).toBe(2);
      expect(app.innerHTML).toContain('Milanesas');
    });
  });

  it('al volver de segundo plano con el sol encendido, se vuelve a pedir la pantalla (C03.3.1)', async () => {
    let pedidos = 0;
    let soltar = () => {};
    vi.stubGlobal('navigator', { wakeLock: { request: async () => {
      pedidos++;
      return { addEventListener: (_ev: string, fn: () => void) => { soltar = fn; }, release: async () => {} };
    } } });
    estado.md = '---\ntitulo: Rabas\n---\n\n## Preparación\n1. Lavar.\n';
    const { abrir, tocar, volverAPrimerPlano } = await montar();
    await abrir('#/r/f1/cocinar');
    await tocar('wake');
    expect(pedidos).toBe(1);

    // El navegador suelta el bloqueo al irse a segundo plano.
    soltar();
    await volverAPrimerPlano();

    expect(pedidos).toBe(2);
  });

  describe('borrar receta pregunta sin redibujar el formulario', () => {
    it('la confirmación reemplaza al botón y nombra la receta; no se relee ni se pierde lo escrito', async () => {
      const { abrir, tocar, app, enLugar } = await montar();
      await abrir('#/r/f1/editar');
      const formulario = app.innerHTML;

      await tocar('borrar');

      expect(app.innerHTML).toBe(formulario);
      expect(estado.lecturas).toBe(1);
      expect(enLugar.at(-1)).toContain('¿Borrar <b>Milanesas</b>?');
      expect(enLugar.at(-1)).toContain('data-accion="borrar-confirmado"');
    });

    it('cancelar vuelve a poner el botón, también sin redibujar', async () => {
      const { abrir, tocar, app, enLugar } = await montar();
      await abrir('#/r/f1/editar');
      const formulario = app.innerHTML;

      await tocar('borrar');
      await tocar('cancelar-borrado');

      expect(app.innerHTML).toBe(formulario);
      expect(enLugar.at(-1)).toContain('data-accion="borrar"');
      expect(enLugar.at(-1)).not.toContain('borrar-confirmado');
    });
  });

  describe('los botones de tags especiales en el editor', () => {
    it('tocar un botón especial lo invierte', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/r/f1/editar');
      const attrs = await tocar('tag-especial', { valor: 'probar' }, { 'aria-pressed': 'false' });
      expect(attrs['aria-pressed']).toBe('true');
      const otra = await tocar('tag-especial', { valor: 'probar' }, { 'aria-pressed': 'true' });
      expect(otra['aria-pressed']).toBe('false');
    });

    it('soltar y apretar borrador oculta y muestra Convertir con Agente, sin redibujar', async () => {
      estado.md = '---\ntitulo: Milanesas\ntags: [borrador]\n---\n';
      const { abrir, tocar, botonConvertir, pinturas } = await montar();
      await abrir('#/r/f1/editar');
      const antes = pinturas.length;

      await tocar('tag-especial', { valor: 'borrador' }, { 'aria-pressed': 'true' });
      expect(botonConvertir.hidden).toBe(true);
      await tocar('tag-especial', { valor: 'borrador' }, { 'aria-pressed': 'false' });
      expect(botonConvertir.hidden).toBe(false);
      expect(pinturas.length).toBe(antes);
    });

    it('otro tag especial no toca Convertir con Agente', async () => {
      const { abrir, tocar, botonConvertir } = await montar();
      await abrir('#/r/f1/editar');
      botonConvertir.hidden = true;
      await tocar('tag-especial', { valor: 'probar' }, { 'aria-pressed': 'false' });
      expect(botonConvertir.hidden).toBe(true);
    });

    it('un botón especial deshabilitado no cambia al tocarlo', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/r/f1/editar');
      const attrs = await tocar('tag-especial', { valor: 'borrador' }, { 'aria-pressed': 'true', disabled: '' });
      expect(attrs['aria-pressed']).toBe('true');
    });
  });

  describe('la duración en el editor', () => {
    // El DOM falso de este archivo no vuelve a serializar el árbol en
    // `app.innerHTML` cuando se mutan atributos por fuera del botón tocado
    // (ver el comentario en `montar`), así que la aserción va contra
    // `document.querySelector`/`querySelectorAll`, como el propio código de
    // `main.ts` los usa para encontrar los otros botones y el campo oculto.
    it('elegir una duración aprieta ese botón, suelta los otros y la escribe en el campo oculto; tocarla de nuevo la saca', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/nueva');
      const boton = (valor: string) =>
        [...document.querySelectorAll<HTMLElement & { dataset: Record<string, string> }>('#app [data-accion="elegir-duracion"]')]
          .find(b => b.dataset['valor'] === valor)!;
      const oculto = () => document.querySelector<HTMLInputElement>('#app input[name="tiempo"]')!;

      await tocar('elegir-duracion', { valor: '~30 min' });
      expect(boton('~30 min').getAttribute('aria-pressed')).toBe('true');
      expect(oculto().value).toBe('~30 min');

      await tocar('elegir-duracion', { valor: '>1 día' });
      expect(boton('~30 min').getAttribute('aria-pressed')).toBe('false');
      expect(boton('>1 día').getAttribute('aria-pressed')).toBe('true');
      expect(oculto().value).toBe('>1 día');

      await tocar('elegir-duracion', { valor: '>1 día' });
      expect(boton('>1 día').getAttribute('aria-pressed')).toBe('false');
      expect(oculto().value).toBe('');
    });
  });

  it('una receta nueva abre con borrador', async () => {
    const { abrir, app } = await montar();
    await abrir('#/nueva');
    expect(app.innerHTML).toContain('data-valor="borrador" aria-pressed="true"');
  });

  it('con la sesión vencida, guardar avisa que hay que conectarse y conectar no redibuja el editor (R3)', async () => {
    const original = storeFake.crear;
    storeFake.crear = async () => { throw new ErrorDeDrive('Invalid Credentials', 401); };
    try {
      const { app, abrir, tocar } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Pan', carpeta: 'c1' };
      await tocar('guardar');

      expect(app.innerHTML).toContain('Hay que conectarse de nuevo con Google.');
      expect(app.innerHTML).toContain('data-accion="conectar-de-nuevo"');
      expect(app.innerHTML).not.toContain('Invalid Credentials');

      // Lo escrito vive en el formulario: conectar no puede repintar la pantalla.
      const antes = app.innerHTML;
      await tocar('conectar-de-nuevo');
      expect(app.innerHTML).toBe(antes);
    } finally {
      storeFake.crear = original;
    }
  });

  it('si guardar falla por otra cosa, el aviso habla de la conexión y no lleva control', async () => {
    const original = storeFake.crear;
    storeFake.crear = async () => { throw new Error('red'); };
    try {
      const { app, abrir, tocar } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Pan', carpeta: 'c1' };
      await tocar('guardar');
      expect(app.innerHTML).toContain('No se pudo guardar. Revisá la conexión.');
      expect(app.innerHTML).not.toContain('conectar-de-nuevo');
    } finally {
      storeFake.crear = original;
    }
  });

  describe('salir del editor con cambios pendientes pregunta antes (C04.1.1)', () => {
    it('sin cambios, salir no pregunta', async () => {
      estado.formulario = { titulo: 'Milanesas' };
      const { abrir, app, empujados, preguntas } = await montar();
      await abrir('#/r/f1/editar');

      await abrir('#/r/f1');

      expect(empujados).toEqual([]);
      expect(preguntas).toEqual([]);
      expect(app.innerHTML).not.toContain('data-formulario');
    });

    it('con cambios, el atrás no dibuja la pantalla anterior: vuelve al editor y pregunta', async () => {
      estado.formulario = { titulo: 'Milanesas' };
      const { abrir, atras, app, empujados, preguntas } = await montar();
      await abrir('#/r/f1');
      await abrir('#/r/f1/editar');

      estado.formulario = { titulo: 'Milanesas a la napolitana' };
      await atras();

      expect(empujados).toEqual(['#/r/f1/editar']);
      expect(app.innerHTML).toContain('data-formulario');
      expect(preguntas.join('')).toContain('¿Salir sin guardar los cambios?');
    });

    it('escribir y borrar lo escrito no cuenta como cambio', async () => {
      estado.formulario = { titulo: 'Milanesas' };
      const { abrir, empujados } = await montar();
      await abrir('#/r/f1/editar');

      estado.formulario = { titulo: 'Milanesas' };
      await abrir('#/r/f1');

      expect(empujados).toEqual([]);
    });

    it('seguir editando saca la pregunta y se queda en el editor', async () => {
      estado.formulario = { titulo: 'Milanesas' };
      const { abrir, atras, tocar, preguntas, vueltasAtras } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = { titulo: 'Otra cosa' };
      await atras();

      await tocar('seguir-editando');

      expect(preguntas).toEqual([]);
      expect(vueltasAtras).toEqual([]);
    });

    it('salir sin guardar sale de verdad', async () => {
      estado.formulario = { titulo: 'Milanesas' };
      const { abrir, tocar, app, vueltasAtras } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = { titulo: 'Otra cosa' };
      await abrir('#/r/f1');

      await tocar('salir-sin-guardar');
      await abrir('#/r/f1');

      expect(vueltasAtras).toHaveLength(1);
      expect(app.innerHTML).not.toContain('data-formulario');
    });

    it('guardar no pregunta al volver', async () => {
      estado.formulario = { titulo: 'Milanesas' };
      const { abrir, tocar, empujados } = await montar();
      await abrir('#/r/f1/editar');

      estado.formulario = { titulo: 'Milanesas a la napolitana' };
      await tocar('guardar');
      await abrir('#/r/f1');

      expect(empujados).toEqual([]);
    });

    it('vale también para la receta nueva', async () => {
      estado.formulario = { titulo: '' };
      const { abrir, atras, empujados } = await montar();
      await abrir('#/nueva');

      estado.formulario = { titulo: 'Pan' };
      await atras();

      expect(empujados).toEqual(['#/nueva']);
    });
  });

  it('buscar con la caja vacía no hace nada, y no avisa', async () => {
    const { abrir, escribir, app } = await montar();
    await abrir('#/c/Carnes');
    const antes = global.location.hash;

    await escribir('   ');

    expect(global.location.hash).toBe(antes);
    expect(app.innerHTML).not.toContain('class="aviso"');
  });

  it('con texto, buscar navega a los resultados sin los espacios de más', async () => {
    const { abrir, escribir } = await montar();
    await abrir('#/');
    await escribir('  leche  ');
    expect(global.location.hash).toBe('#/buscar?q=leche');
  });

  describe('compartir desde la receta', () => {
    const PASOS = '---\ntitulo: Rabas\n---\n\n## Ingredientes\n- Calamar — 1 kg\n\n## Preparación\n1. Lavar.\n';
    afterEach(() => { pdfs.generados = 0; pdfs.espera = null; });

    it('el ícono abre la ficha y cancelar la cierra', async () => {
      estado.md = PASOS;
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');
      await tocar('compartir');
      expect(app.innerHTML).toContain('hoja-compartir');
      await tocar('cerrar-compartir');
      expect(app.innerHTML).not.toContain('hoja-compartir');
    });

    it('PDF: genera y lo comparte como archivo, y la ficha se cierra', async () => {
      estado.md = PASOS;
      const compartidos: ShareData[] = [];
      vi.stubGlobal('navigator', { share: async (d: ShareData) => { compartidos.push(d); }, canShare: () => true });
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');
      await tocar('compartir');
      await tocar('compartir-pdf');
      expect(pdfs.generados).toBe(1);
      expect(compartidos[0]?.files?.[0]?.name).toBe('rabas.pdf');
      expect(app.innerHTML).not.toContain('hoja-compartir');
    });

    it('PDF sin activación: Enviar PDF manda el mismo archivo sin volver a generar', async () => {
      estado.md = PASOS;
      let intentos = 0;
      vi.stubGlobal('navigator', {
        share: async () => { if (++intentos === 1) throw Object.assign(new Error('x'), { name: 'NotAllowedError' }); },
        canShare: () => true
      });
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');
      await tocar('compartir');
      await tocar('compartir-pdf');
      expect(app.innerHTML).toContain('El PDF está listo.');
      await tocar('enviar-pdf');
      expect(intentos).toBe(2);
      expect(pdfs.generados).toBe(1);
      expect(app.innerHTML).not.toContain('hoja-compartir');
    });

    it('mientras arma el PDF la ficha no acepta toques, y navegar descarta el resultado', async () => {
      estado.md = PASOS;
      const compartidos: ShareData[] = [];
      vi.stubGlobal('navigator', { share: async (d: ShareData) => { compartidos.push(d); }, canShare: () => true });
      let terminar = (): void => {};
      pdfs.espera = new Promise<void>(r => { terminar = r; });
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');
      await tocar('compartir');
      // Sin await: el toque queda colgado de `generar` hasta que el test lo suelte.
      const generando = tocar('compartir-pdf');
      await esperar();
      expect(app.innerHTML).toContain('Armando el PDF…');
      await tocar('cerrar-compartir');
      expect(app.innerHTML).toContain('Armando el PDF…');
      // Se va a otra receta antes de que termine: el PDF de la primera no se manda.
      await abrir('#/r/f2');
      terminar();
      await generando;
      await esperar();
      expect(compartidos).toHaveLength(0);
      expect(app.innerHTML).not.toContain('hoja-compartir');
    });

    it('texto: lo comparte con el título adentro', async () => {
      estado.md = PASOS;
      const compartidos: ShareData[] = [];
      vi.stubGlobal('navigator', { share: async (d: ShareData) => { compartidos.push(d); } });
      const { abrir, tocar } = await montar();
      await abrir('#/r/f1');
      await tocar('compartir');
      await tocar('compartir-texto');
      expect(compartidos[0]?.text?.startsWith('Rabas\n')).toBe(true);
    });

    it('link sin share ni portapapeles: lo muestra para copiar', async () => {
      estado.md = PASOS;
      vi.stubGlobal('navigator', {});
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');
      await tocar('compartir');
      await tocar('compartir-link');
      expect(app.innerHTML).toContain('#/ver?r=1');
    });
  });

  describe('la estrella de favorito', () => {
    it('la estrella pone el tag, guarda y queda encendida', async () => {
      estado.md = '---\ntitulo: Rabas\ntags: [frito]\n---\n';
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');

      await tocar('favorito');

      expect(estado.guardados.at(-1)?.tags).toEqual(['favorito', 'frito']);
      expect(app.innerHTML).toContain('class="fav on"');
    });

    it('tocarla de nuevo lo saca', async () => {
      estado.md = '---\ntitulo: Rabas\ntags: [favorito, frito]\n---\n';
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');

      await tocar('favorito');

      expect(estado.guardados.at(-1)?.tags).toEqual(['frito']);
      expect(app.innerHTML).not.toContain('class="fav on"');
    });

    it('si la escritura falla, la estrella vuelve como estaba y avisa', async () => {
      estado.md = '---\ntitulo: Rabas\n---\n';
      estado.fallaGuardar = 1;
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');

      await tocar('favorito');

      expect(app.innerHTML).not.toContain('class="fav on"');
      // No sólo «no quedó encendida»: tiene que haber vuelto a su estado
      // normal y no quedar girando —si `marcandoFavorito` no se revierte en
      // el camino de error, la estrella se dibuja "cargando" y `disabled`
      // para siempre, y las dos aserciones de arriba no lo notarían.
      expect(app.innerHTML).not.toContain('class="fav cargando"');
      expect(app.innerHTML).not.toContain('disabled');
      expect(app.innerHTML).toContain('No se pudo marcar');
    });
  });

  describe('el velo de la escritura en curso (R8)', () => {
    /** Una promesa que el test resuelve cuando quiere: la escritura tarda lo que él decida. */
    function pendiente<T>() {
      let resolver!: (valor: T) => void;
      const promesa = new Promise<T>(r => { resolver = r; });
      return { promesa, resolver };
    }

    it('mientras se crea la receta, la pantalla no responde ni navega', async () => {
      const original = storeFake.crear;
      const { promesa, resolver } = pendiente<{ id: string; nombre_archivo: string }>();
      storeFake.crear = () => promesa;
      try {
        const { abrir, atras, tocar, app, velo, empujados, vueltasAtras } = await montar();
        await abrir('#/nueva');
        estado.formulario = { titulo: 'Pan', carpeta: 'c1' };
        // Sin await: el toque queda colgado de `crear` hasta que el test lo suelte.
        const guardando = tocar('guardar');
        await esperar();

        expect(velo.hidden).toBe(false);
        // Ningún otro toque hace nada, ni siquiera el volver del encabezado.
        await tocar('volver');
        expect(vueltasAtras).toEqual([]);
        // Y el gesto de atrás no dibuja la pantalla nueva: la URL vuelve al editor.
        await atras();
        expect(empujados).toEqual(['#/nueva']);
        expect(global.location.hash).toBe('#/nueva');
        expect(app.innerHTML).toContain('data-formulario');

        resolver({ id: 'nuevo-1', nombre_archivo: 'pan.md' });
        await guardando;
      } finally {
        storeFake.crear = original;
      }
    });

    it('al terminar bien, el velo cierra con el tilde y el guardado sigue su camino', async () => {
      const {
        abrir, tocarSinCerrar, correrElCierre, velo, vueltasAtras, tapadoAlVolver, atributosApp, retenerAvisos, soltarAvisos
      } = await montar();
      await abrir('#/r/f1');
      await abrir('#/r/f1/editar');
      estado.formulario = { titulo: 'Milanesas', carpeta: 'c1' };

      const guardando = tocarSinCerrar('guardar');
      await esperar();

      expect(estado.opcionesGuardar).toHaveLength(1);
      // Primero el tilde: el velo sigue puesto, la pantalla sigue ocupada
      // y **todavía no se navegó**, para que el repintado no se vea en el medio.
      expect(velo.hidden).toBe(false);
      expect(velo.classList.contains('exito')).toBe(true);
      expect(atributosApp['aria-busy']).toBe('true');
      expect(vueltasAtras).toHaveLength(0);

      // La vuelta cambia la URL, y el `hashchange` se retiene para mirar el
      // momento de antes de dibujar la receta.
      retenerAvisos();
      await correrElCierre();
      await guardando;

      // Dibujado el tilde, recién ahí se cierra el editor, y con la pantalla
      // libre: la navegación no la frena nadie.
      expect(vueltasAtras).toHaveLength(1);
      expect(tapadoAlVolver).toEqual([false]);
      expect(atributosApp['aria-busy']).toBeUndefined();
      // El velo espera a que la pantalla de destino se pinte.
      expect(velo.hidden).toBe(false);
      await soltarAvisos();
      expect(global.location.hash).toBe('#/r/f1');
      expect(velo.hidden).toBe(true);
      expect(velo.classList.contains('exito')).toBe(false);
    });

    it('si nadie dibuja nada después del tilde, el velo se va igual', async () => {
      const { abrir, tocarSinCerrar, correrElReloj, velo } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Pan', carpeta: 'c1' };

      const guardando = tocarSinCerrar('guardar');
      await esperar();
      expect(velo.hidden).toBe(false);

      // El respaldo: sin pantalla nueva que lo saque, el velo no se queda
      // puesto. Pasado el cierre entero y su respaldo, se fue solo.
      await correrElReloj();
      await guardando;
      expect(velo.hidden).toBe(true);
      expect(velo.classList.contains('exito')).toBe(false);
    });

    it('mientras se dibuja el tilde, un cambio de hash vuelve a la pantalla que escribió', async () => {
      const { abrir, tocarSinCerrar, correrElReloj, app, velo, reemplazos } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Pan', carpeta: 'c1' };

      const guardando = tocarSinCerrar('guardar');
      await esperar();
      expect(velo.classList.contains('exito')).toBe(true);

      // El velo sigue tapando: un link no dibuja otra pantalla.
      const antes = app.innerHTML;
      await abrir('#/r/f1');
      expect(global.location.hash).toBe('#/nueva');
      expect(app.innerHTML).toBe(antes);

      // Terminado el tilde, la receta nueva toma el lugar del editor.
      await correrElReloj();
      await guardando;
      await esperar();
      expect(reemplazos.at(-1)).toBe('#/r/nuevo-1');
    });

    /** Una escritura de R8: cómo llegar a su pantalla, el toque, y adónde queda la app. */
    type Escritura = {
      nombre: string;
      preparar: (abrir: (hash: string) => Promise<void>) => Promise<void>;
      accion: string;
      datos?: Record<string, string>;
      destino: string;
    };
    const unaComida = (): Plan => ({ comidas: [{ dia: 0, momento: 'noche', id: 'f1', titulo: 'Milanesas' }] });
    const ESCRITURAS: Escritura[] = [
      { nombre: 'guardar una receta', accion: 'guardar', destino: '#/r/f1', preparar: async abrir => {
        await abrir('#/r/f1'); await abrir('#/r/f1/editar');
        estado.formulario = { titulo: 'Milanesas', carpeta: 'c1' };
      } },
      { nombre: 'crear una receta', accion: 'guardar', destino: '#/r/nuevo-1', preparar: async abrir => {
        await abrir('#/nueva');
        estado.formulario = { titulo: 'Pan', carpeta: 'c1' };
      } },
      { nombre: 'borrar una receta', accion: 'borrar-confirmado', destino: '#/c/Carnes', preparar: async abrir => {
        await abrir('#/c/Carnes'); await abrir('#/r/f1'); await abrir('#/r/f1/editar');
      } },
      { nombre: 'convertir con el agente', accion: 'convertir-con-agente', destino: '#/r/nuevo-1', preparar: async abrir => {
        await abrir('#/nueva');
        estado.formulario = { titulo: 'Focaccia', carpeta: '', tags: 'borrador' };
      } },
      { nombre: 'crear una categoría', accion: 'guardar-categoria', destino: '#/categorias', preparar: async abrir => {
        await abrir('#/categorias'); await abrir('#/categorias/nueva');
        estado.formulario = { nombre: 'Fiambres', color: 'carnes', foto: '' };
      } },
      { nombre: 'editar una categoría', accion: 'guardar-categoria', destino: '#/categorias', preparar: async abrir => {
        await abrir('#/categorias'); await abrir('#/categorias/c1');
        estado.formulario = { nombre: 'Carnes rojas', color: 'carnes', foto: '' };
      } },
      { nombre: 'borrar una categoría', accion: 'borrar-categoria-confirmado', destino: '#/categorias', preparar: async abrir => {
        await abrir('#/categorias'); await abrir('#/categorias/c1');
      } },
      { nombre: 'agregar al plan', accion: 'elegir-para-el-plan', datos: { id: 'f1' }, destino: '#/plan', preparar: async abrir => {
        await abrir('#/plan'); await abrir('#/plan/agregar?dia=1&momento=noche');
      } },
      { nombre: 'sacar del plan', accion: 'sacar-del-plan', datos: { i: '0' }, destino: '#/plan', preparar: async abrir => {
        estado.plan = unaComida();
        await abrir('#/plan');
      } },
      { nombre: 'reiniciar el plan', accion: 'reiniciar-plan-confirmado', destino: '#/plan', preparar: async abrir => {
        estado.plan = unaComida();
        await abrir('#/plan');
      } }
    ];

    it.each(ESCRITURAS)('$nombre: cierra con el tilde, recién después navega, y el redibujo no se ve', async e => {
      const { abrir, tocarSinCerrar, correrElCierre, correrElReloj, velo, pinturas, idasYVueltasDelVelo } = await montar();
      await e.preparar(abrir);
      const desde = global.location.hash;
      const pintadas = pinturas.length;
      idasYVueltasDelVelo.length = 0;

      const escribiendo = tocarSinCerrar(e.accion, e.datos);
      await esperar();
      // El tilde, con la app todavía en la pantalla que escribió y sin redibujar nada.
      expect(velo.hidden).toBe(false);
      expect(velo.classList.contains('exito')).toBe(true);
      expect(global.location.hash).toBe(desde);
      expect(pinturas).toHaveLength(pintadas);

      await correrElCierre();
      await esperar();
      expect(global.location.hash).toBe(e.destino);
      // Lo que se dibujó después del tilde quedó abajo del velo, y recién ahí se fue.
      const despues = pinturas.slice(pintadas);
      expect(despues.length).toBeGreaterThan(0);
      expect(despues.every(p => p.puesto)).toBe(true);
      expect(velo.hidden).toBe(true);
      // Puesto una vez y sacado una vez.
      expect(idasYVueltasDelVelo).toEqual([false, true]);
      await correrElReloj();
      await escribiendo;
    });

    it.each([
      ['la receta', '#/r/f1', 'receta'],
      ['el editor', '#/r/f1/editar', 'receta'],
      ['el plan', '#/plan', 'plan']
    ] as const)('leer %s al dibujar es una espera: se ve pasados 250 ms y no deja salir', async (_, hash, lectura) => {
      const original = { receta: storeFake.receta, plan: storeFake.plan };
      let soltar!: () => void;
      const frenada = new Promise<void>(listo => { soltar = listo; });
      if (lectura === 'receta') storeFake.receta = async (id: string) => { await frenada; return original.receta(id); };
      else storeFake.plan = async () => { await frenada; return original.plan(); };
      try {
        const { abrir, velo, app } = await montar();
        await abrir(hash);
        expect(velo.hidden).toBe(true);
        await vi.advanceTimersByTimeAsync(250);
        expect(velo.hidden).toBe(false);
        expect(velo.classList.contains('exito')).toBe(false);
        // Mientras lee, un link no se va a otra pantalla.
        await abrir('#/ajustes');
        expect(global.location.hash).toBe(hash);

        soltar();
        await esperar();
        expect(velo.hidden).toBe(true);
        expect(app.innerHTML).not.toContain('Ajustes</span>');
      } finally {
        Object.assign(storeFake, original);
      }
    });

    it('ningún botón cambia su texto ni se deshabilita mientras guarda: el velo ya lo dice', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Pan', carpeta: 'c1' };
      const atributos = await tocar('guardar');
      expect(atributos).toEqual({});
    });

    it('convertir con el agente: el velo cubre bajar las fotos y abrir el agente, y el tilde va al final', async () => {
      let alMandar: { puesto: boolean; tilde: boolean } | null = null;
      const { abrir, tocar, velo } = await montar();
      vi.stubGlobal('navigator', {
        share: async () => { alMandar = { puesto: !velo.hidden, tilde: velo.classList.contains('exito') }; },
        canShare: () => true
      });
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Focaccia', carpeta: '', tags: 'borrador' };
      await tocar('convertir-con-agente');
      expect(alMandar).toEqual({ puesto: true, tilde: false });
    });

    it('el aviso de un guardado que falló se trae a la vista', async () => {
      const original = storeFake.crear;
      storeFake.crear = async () => { throw new Error('red'); };
      try {
        const { abrir, tocar, app, avisosALaVista } = await montar();
        await abrir('#/nueva');
        estado.formulario = { titulo: 'Pan', carpeta: 'c1' };

        await tocar('guardar');

        expect(app.innerHTML).toContain('No se pudo guardar.');
        // Scrolleado al fondo, el aviso de arriba no se ve: se lo trae, y sólo
        // lo justo —`nearest` no mueve nada si ya estaba a la vista—.
        expect(avisosALaVista).toContain('nearest');
      } finally {
        storeFake.crear = original;
      }
    });

    it('si la escritura falla, el velo se va sin tilde y queda el aviso con lo escrito', async () => {
      const original = storeFake.crear;
      storeFake.crear = async () => { throw new Error('red'); };
      try {
        const { abrir, tocar, app, velo } = await montar();
        await abrir('#/nueva');
        estado.formulario = { titulo: 'Pan', carpeta: 'c1' };

        await tocar('guardar');

        expect(velo.hidden).toBe(true);
        expect(velo.classList.contains('exito')).toBe(false);
        expect(app.innerHTML).toContain('No se pudo guardar.');
        expect(app.innerHTML).toContain('Pan');
      } finally {
        storeFake.crear = original;
      }
    });

    it('al tocar Guardar tapa la pantalla antes de releer el `.md` de base', async () => {
      const original = storeFake.receta;
      try {
        const { abrir, tocarSinCerrar, correrElReloj, velo } = await montar();
        await abrir('#/r/f1/editar');
        estado.formulario = { titulo: 'Milanesas', carpeta: 'c1' };
        // La relectura de la base es un pedido a Drive: el velo no puede
        // esperar a que conteste.
        const { promesa, resolver } = pendiente<Awaited<ReturnType<typeof original>>>();
        storeFake.receta = () => promesa;
        const guardando = tocarSinCerrar('guardar');
        await esperar();

        expect(velo.hidden).toBe(false);
        expect(estado.guardados).toEqual([]);

        resolver({ entrada: entradaFalsa({ id_archivo: 'f1' }), receta: parse(estado.md) });
        await esperar();

        // Guardó: el velo se queda dibujando el cierre con el tilde.
        expect(velo.classList.contains('exito')).toBe(true);
        expect(estado.guardados).toHaveLength(1);
        await correrElReloj();
        await guardando;
      } finally {
        storeFake.receta = original;
      }
    });

    it('si la validación falla, el velo no queda puesto', async () => {
      const { abrir, tocar, app, velo } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: '', carpeta: 'c1', notas: 'Algo.' };

      await tocar('guardar');

      // No se escribió nada: el velo se va como siempre, sin tilde.
      expect(velo.hidden).toBe(true);
      expect(velo.classList.contains('exito')).toBe(false);
      expect(app.innerHTML).toContain('Ponele un título antes de guardar.');
      expect(estado.creadas).toEqual([]);
    });

    it('al sumar una receta al plan tapa la pantalla antes de leer `_plan.md`', async () => {
      const original = storeFake.plan;
      try {
        const { promesa, resolver } = pendiente<Plan>();
        // Sin pasar por el plan, el `.md` no está leído todavía: elegir una
        // receta lo lee de Drive y recién después escribe.
        storeFake.plan = () => { estado.lecturasPlan++; return promesa; };
        const { abrir, tocar, velo } = await montar();
        await abrir('#/plan/agregar?dia=1&momento=noche');
        const eligiendo = tocar('elegir-para-el-plan', { id: 'f1' });
        await esperar();

        expect(velo.hidden).toBe(false);
        expect(estado.planesGuardados).toEqual([]);

        resolver({ comidas: [] });
        await eligiendo;

        expect(velo.hidden).toBe(true);
        expect(estado.planesGuardados).toHaveLength(1);
      } finally {
        storeFake.plan = original;
      }
    });

    it('la estrella de favorito no lo muestra: no traba la lectura de la receta', async () => {
      const original = storeFake.guardar;
      const { promesa, resolver } = pendiente<void>();
      storeFake.guardar = () => promesa;
      try {
        const { abrir, tocar, velo } = await montar();
        await abrir('#/r/f1');

        const marcando = tocar('favorito');
        await esperar();

        expect(velo.hidden).toBe(true);
        resolver();
        await marcando;
      } finally {
        storeFake.guardar = original;
      }
    });

  });

  it('ningún guardado exitoso muestra un cartel de confirmación', async () => {
    const { app, abrir } = await montar();
    await abrir('#/r/f1');
    expect(app.innerHTML).not.toMatch(/guardad|listo|éxito/i);
  });

  describe('las fotos en memoria y en el navegador', () => {
    const foto = (texto: string): Blob => new Blob([texto], { type: 'image/jpeg' });

    it('en el editor, tres fotos son una sola espera: el velo no parpadea', async () => {
      const { abrir, elegirFotos, idasYVueltasDelVelo } = await montar();
      await abrir('#/r/f1/editar');
      idasYVueltasDelVelo.length = 0;

      await elegirFotos([foto('a'), foto('bb'), foto('ccc')]);

      // Achicarlas acá es inmediato: una espera de menos de 250 ms no llega a verse.
      expect(idasYVueltasDelVelo).toEqual([]);
    });

    it('Borrar datos locales y Salir borran las fotos guardadas en el navegador', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/ajustes');
      await tocar('borrar-datos-locales');
      expect(estado.imagenesBorradas).toBe(1);
      expect(estado.compartidasDescartadas).toBe(1);
      await tocar('salir');
      expect(estado.imagenesBorradas).toBe(2);
      expect(estado.compartidasDescartadas).toBe(2);
    });
  });


  describe('el plan de la semana', () => {
    /** Un plan con dos recetas en la misma comida. */
    const conDos = (): Plan => ({
      comidas: [
        { dia: 1, momento: 'noche', id: 'f1', titulo: 'Milanesas' },
        { dia: 1, momento: 'noche', id: 'f9', titulo: 'Flan' }
      ]
    });

    it('las tres rutas dibujan su pantalla', async () => {
      estado.plan = conDos();
      const { app, abrir } = await montar();
      for (const [hash, marca] of [
        ['#/plan', 'class="grilla-sem"'],
        ['#/plan/agregar?dia=1&momento=noche', 'Martes a la noche'],
        ['#/plan/compras', 'Lista de compras']
      ] as const) {
        await abrir(hash);
        expect(app.innerHTML, hash).toContain(marca);
      }
    });

    it('el plan lleva el menú lateral, y su entrada queda marcada', async () => {
      const { app, abrir } = await montar();
      await abrir('#/plan');
      expect(app.innerHTML).toContain('<a class="act" href="#/plan">');
    });

    it('la copia del plan se conserva entre las tres pantallas y se descarta al salir', async () => {
      estado.plan = conDos();
      const { abrir } = await montar();
      await abrir('#/plan');
      await abrir('#/plan/compras');
      await abrir('#/plan');
      expect(estado.lecturasPlan).toBe(1);
      await abrir('#/');
      await abrir('#/plan');
      expect(estado.lecturasPlan).toBe(2);
    });

    it('el + lleva a agregar, con el día y el momento de esa celda', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/plan');
      await tocar('agregar-al-plan', { dia: '3', momento: 'mediodia' });
      expect(global.location.hash).toBe('#/plan/agregar?dia=3&momento=mediodia');
    });

    it('tocar una tarjeta suma la receta a esa comida, escribe y cierra a #/plan', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/plan');
      await abrir('#/plan/agregar?dia=2&momento=noche');
      await tocar('elegir-para-el-plan', { id: 'f1' });
      expect(estado.planesGuardados).toEqual([
        { comidas: [{ dia: 2, momento: 'noche', id: 'f1', titulo: 'Milanesas' }] }
      ]);
      expect(global.location.hash).toBe('#/plan');
    });

    it('la cruz saca esa línea nada más, y escribe', async () => {
      estado.plan = conDos();
      const { abrir, tocar, app } = await montar();
      await abrir('#/plan');
      await tocar('sacar-del-plan', { i: '0' });
      expect(estado.planesGuardados).toEqual([
        { comidas: [{ dia: 1, momento: 'noche', id: 'f9', titulo: 'Flan' }] }
      ]);
      expect(app.innerHTML).not.toContain('Milanesas');
      expect(app.innerHTML).toContain('Flan');
    });

    it('reiniciar pregunta antes, y confirmado vacía los siete días', async () => {
      estado.plan = conDos();
      const { abrir, tocar, app } = await montar();
      await abrir('#/plan');
      await tocar('reiniciar-plan');
      expect(app.innerHTML).toContain('¿Reiniciar el plan?');
      expect(estado.planesGuardados).toEqual([]);
      await tocar('reiniciar-plan-confirmado');
      expect(estado.planesGuardados).toEqual([{ comidas: [] }]);
      expect(app.innerHTML).not.toContain('¿Reiniciar el plan?');
    });

    it('cancelar no escribe nada', async () => {
      estado.plan = conDos();
      const { abrir, tocar, app } = await montar();
      await abrir('#/plan');
      await tocar('reiniciar-plan');
      await tocar('cancelar-reinicio');
      expect(estado.planesGuardados).toEqual([]);
      expect(app.innerHTML).toContain('data-accion="reiniciar-plan"');
    });

    it('si falla al sumar, el aviso llega al plan: agregar cierra su pantalla igual', async () => {
      estado.fallaGuardarPlan = 1;
      const { abrir, tocar, app } = await montar();
      await abrir('#/plan');
      await abrir('#/plan/agregar?dia=2&momento=noche');
      await tocar('elegir-para-el-plan', { id: 'f1' });
      expect(app.innerHTML).toContain('class="grilla-sem"');
      expect(app.innerHTML).toContain('No se pudo guardar el plan.');
      // Y salir del plan lo limpia: no se arrastra a la próxima visita.
      await abrir('#/');
      await abrir('#/plan');
      expect(app.innerHTML).not.toContain('No se pudo guardar el plan.');
    });

    it('un fallo al escribir avisa en el plan y la grilla no cambia', async () => {
      estado.plan = conDos();
      estado.fallaGuardarPlan = 1;
      const { abrir, tocar, app } = await montar();
      await abrir('#/plan');
      await tocar('sacar-del-plan', { i: '0' });
      expect(app.innerHTML).toContain('No se pudo guardar el plan.');
      expect(app.innerHTML).toContain('Milanesas');
    });

    it('mientras se escribe el plan, el velo tapa la pantalla y se va al terminar (R8)', async () => {
      estado.plan = conDos();
      let soltar!: () => void;
      const original = storeFake.guardarPlan;
      storeFake.guardarPlan = (p: Plan) =>
        new Promise<void>(r => { soltar = () => { void original(p); r(); }; });
      try {
        const { abrir, tocar, velo } = await montar();
        await abrir('#/plan');
        // Sin await: el toque queda colgado hasta que el test lo suelte.
        const sacando = tocar('sacar-del-plan', { i: '0' });
        await esperar();
        expect(velo.hidden).toBe(false);
        soltar();
        await sacando;
        expect(velo.hidden).toBe(true);
        expect(estado.planesGuardados).toHaveLength(1);
      } finally {
        storeFake.guardarPlan = original;
      }
    });

    it('escribir en la caja reemplaza el bloque sin repintar la pantalla', async () => {
      const original = storeFake.buscarPorTexto;
      storeFake.buscarPorTexto = (): Coincidencias => ({
        porNombre: [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', categoria: 'Carnes' })],
        porIngrediente: [], porTag: []
      });
      try {
        const { abrir, tipear, resultadosPlan } = await montar();
        await abrir('#/plan/agregar?dia=1&momento=noche');
        await tipear('buscar-en-plan', 'mila');
        expect(resultadosPlan.at(-1)).toContain('Por nombre');
        expect(resultadosPlan.at(-1)).toContain('data-accion="elegir-para-el-plan" data-id="f1"');
      } finally {
        storeFake.buscarPorTexto = original;
      }
    });

    it('escribir en la caja completa las fotos de Drive de las tarjetas del bloque', async () => {
      const original = storeFake.buscarPorTexto;
      storeFake.buscarPorTexto = (): Coincidencias => ({
        porNombre: [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', categoria: 'Carnes', foto: linkDeFoto('d1') })],
        porIngrediente: [], porTag: []
      });
      try {
        const { abrir, tipear, resultadosPlan, imgs } = await montar();
        await abrir('#/plan/agregar?dia=1&momento=noche');
        // La tarjeta que el bloque nuevo deja pedida: sale sin `src`.
        const foto = imgFalsa({ drive: 'd1' });
        imgs.push(foto);
        await tipear('buscar-en-plan', 'mila');
        expect(resultadosPlan.at(-1)).toContain('data-drive="d1"');
        expect(foto.atributos['src']).toBe('blob:d1');
      } finally {
        storeFake.buscarPorTexto = original;
      }
    });

    it('la búsqueda es la lista agrupada de los resultados: las favoritas primero en cada grupo', async () => {
      const original = storeFake.buscarPorTexto;
      storeFake.buscarPorTexto = (): Coincidencias => ({
        porNombre: [
          entradaFalsa({ id_archivo: 'f1', titulo: 'Zapallo', categoria: 'Carnes' }),
          entradaFalsa({ id_archivo: 'f2', titulo: 'Arroz', categoria: 'Carnes', tags: ['favorito'] })
        ],
        porIngrediente: [], porTag: []
      });
      try {
        const { abrir, tipear, resultadosPlan } = await montar();
        await abrir('#/plan/agregar?dia=1&momento=noche');
        await tipear('buscar-en-plan', 'a');
        const bloque = resultadosPlan.at(-1) ?? '';
        expect(bloque.indexOf('Arroz')).toBeLessThan(bloque.indexOf('Zapallo'));
      } finally {
        storeFake.buscarPorTexto = original;
      }
    });

    it('la búsqueda pagina, y el tramo siguiente redibuja sólo el bloque mirando el spinner del bloque', async () => {
      const original = storeFake.buscarPorTexto;
      storeFake.buscarPorTexto = (): Coincidencias => ({
        porNombre: Array.from({ length: 31 }, (_, i) =>
          entradaFalsa({ id_archivo: `f${i}`, titulo: `A${String(i + 1).padStart(2, '0')}`, categoria: 'Carnes' })),
        porIngrediente: [], porTag: []
      });
      let llegarAlPie = (): void => {};
      const observados: unknown[] = [];
      const g = global as unknown as Record<string, unknown>;
      g['IntersectionObserver'] = class {
        constructor(fn: (e: { isIntersecting: boolean }[]) => void) { llegarAlPie = () => fn([{ isIntersecting: true }]); }
        observe(el: unknown): void { observados.push(el); }
        disconnect(): void {}
      };
      try {
        const { abrir, tipear, resultadosPlan, app } = await montar();
        await abrir('#/plan/agregar?dia=1&momento=noche');
        await tipear('buscar-en-plan', 'a');
        expect(resultadosPlan.at(-1)).not.toContain('A31');
        expect(observados.at(-1)).toEqual({ plan: true });
        const pantalla = app.innerHTML;
        llegarAlPie();
        await vi.waitFor(() => expect(resultadosPlan.at(-1)).toContain('A31'));
        expect(app.innerHTML).toBe(pantalla);
      } finally {
        storeFake.buscarPorTexto = original;
        delete g['IntersectionObserver'];
      }
    });

    it('el bloque Menú diario sale de las recetas con ese tag', async () => {
      const original = storeFake.entradas;
      storeFake.entradas = () => [
        entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', categoria: 'Carnes', tags: ['menú diario'] }),
        entradaFalsa({ id_archivo: 'f2', titulo: 'Rabas', categoria: 'Carnes' })
      ];
      try {
        const { abrir, app } = await montar();
        await abrir('#/plan/agregar?dia=1&momento=noche');
        expect(app.innerHTML).toContain('Menú diario');
        expect(app.innerHTML).toContain('Milanesas');
        expect(app.innerHTML).not.toContain('Rabas');
      } finally {
        storeFake.entradas = original;
      }
    });

    it('elegir una categoría de la grilla filtra a sus recetas, sin navegar a la categoría', async () => {
      const { abrir, tocar, app } = await montar();
      await abrir('#/plan/agregar?dia=1&momento=noche');
      expect(app.innerHTML).toContain('data-accion="elegir-categoria-plan" data-nombre="Carnes"');
      await tocar('elegir-categoria-plan', { nombre: 'Carnes' });
      expect(app.innerHTML).toContain('Milanesas');
      expect(app.innerHTML).toContain('data-accion="elegir-para-el-plan" data-id="f1"');
      expect(app.innerHTML).not.toContain('data-accion="elegir-categoria-plan"');
      await tocar('volver-categorias-plan');
      expect(app.innerHTML).toContain('data-accion="elegir-categoria-plan" data-nombre="Carnes"');
    });

    it('el Menú diario no muestra un borrador aunque tenga el tag', async () => {
      const original = storeFake.entradas;
      storeFake.entradas = () => [
        entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', categoria: 'Carnes', tags: ['menú diario'] }),
        entradaFalsa({ id_archivo: 'f2', titulo: 'A medio hacer', categoria: 'Carnes', tags: ['menú diario', 'borrador'] })
      ];
      try {
        const { abrir, app } = await montar();
        await abrir('#/plan/agregar?dia=1&momento=noche');
        expect(app.innerHTML).toContain('Milanesas');
        expect(app.innerHTML).not.toContain('A medio hacer');
      } finally {
        storeFake.entradas = original;
      }
    });

    it('elegir una categoría de la grilla no muestra los borradores de esa categoría', async () => {
      const original = storeFake.entradas;
      storeFake.entradas = () => [
        entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', categoria: 'Carnes' }),
        entradaFalsa({ id_archivo: 'f2', titulo: 'A medio hacer', categoria: 'Carnes', tags: ['borrador'] })
      ];
      try {
        const { abrir, tocar, app } = await montar();
        await abrir('#/plan/agregar?dia=1&momento=noche');
        await tocar('elegir-categoria-plan', { nombre: 'Carnes' });
        expect(app.innerHTML).toContain('Milanesas');
        expect(app.innerHTML).not.toContain('A medio hacer');
      } finally {
        storeFake.entradas = original;
      }
    });
  });

  describe('la lista de compras', () => {
    const conDosRecetas = (): Plan => ({
      comidas: [
        { dia: 0, momento: 'noche', id: 'f1', titulo: 'Milanesas' },
        { dia: 1, momento: 'noche', id: 'f2', titulo: 'Tarta' }
      ]
    });

    it('lee una vez cada receta distinta del plan y junta los ingredientes', async () => {
      estado.plan = conDosRecetas();
      const original = storeFake.receta;
      storeFake.receta = async (id: string) => {
        estado.lecturas++;
        return {
          entrada: entradaFalsa({ id_archivo: id }),
          receta: parse(`---\ntitulo: ${id}\n---\n\n## Ingredientes\n- Harina - 250 g\n`)
        };
      };
      try {
        const { abrir, app } = await montar();
        await abrir('#/plan/compras');
        expect(estado.lecturas).toBe(2);
        expect(app.innerHTML).toContain('Harina');
        expect(app.innerHTML).toContain('500 g');
      } finally {
        storeFake.receta = original;
      }
    });

    it('la misma receta dos veces en el plan se lee una sola vez', async () => {
      estado.plan = {
        comidas: [
          { dia: 0, momento: 'noche', id: 'f1', titulo: 'Milanesas' },
          { dia: 3, momento: 'mediodia', id: 'f1', titulo: 'Milanesas' }
        ]
      };
      const original = storeFake.receta;
      storeFake.receta = async (id: string) => {
        estado.lecturas++;
        return {
          entrada: entradaFalsa({ id_archivo: id }),
          receta: parse('---\ntitulo: A\n---\n\n## Ingredientes\n- Harina - 250 g\n')
        };
      };
      try {
        const { abrir, app } = await montar();
        await abrir('#/plan/compras');

        expect(estado.lecturas).toBe(1);
        // Leída una vez, pero cuenta dos: se come dos días.
        expect(app.innerHTML).toContain('500 g');
      } finally {
        storeFake.receta = original;
      }
    });

    it('las lecturas se solapan, y la pantalla se tapa mientras tanto', async () => {
      estado.plan = {
        comidas: ['f1', 'f2', 'f3', 'f4'].map((id, i) => ({
          dia: i, momento: 'noche' as const, id, titulo: id
        }))
      };
      const original = storeFake.receta;
      const soltar: (() => void)[] = [];
      let enVuelo = 0;
      let pico = 0;
      storeFake.receta = async (id: string) => {
        enVuelo++;
        pico = Math.max(pico, enVuelo);
        await new Promise<void>(listo => soltar.push(listo));
        enVuelo--;
        return {
          entrada: entradaFalsa({ id_archivo: id }),
          receta: parse('---\ntitulo: A\n---\n\n## Ingredientes\n- Harina - 250 g\n')
        };
      };
      try {
        const { abrir, app, velo } = await montar();
        await abrir('#/plan/compras');

        // Las cuatro salieron juntas —el tope son seis— y no una detrás de
        // otra, que con un plan cargado son catorce viajes en fila.
        expect(pico).toBe(4);
        // Y mientras lee, la pantalla está tapada: es la espera más larga de
        // la app. Pasado el plazo de una espera, la olla se ve.
        await vi.advanceTimersByTimeAsync(250);
        expect(velo.hidden).toBe(false);

        for (const listo of soltar) listo();
        await esperar();

        expect(velo.hidden).toBe(true);
        expect(app.innerHTML).toContain('1000 g');
      } finally {
        storeFake.receta = original;
      }
    });

    it('una receta que ya no se puede leer se saltea', async () => {
      estado.plan = conDosRecetas();
      const original = storeFake.receta;
      storeFake.receta = async (id: string) => {
        if (id === 'f2') throw new Error('borrada');
        return {
          entrada: entradaFalsa({ id_archivo: id }),
          receta: parse('---\ntitulo: A\n---\n\n## Ingredientes\n- Harina - 250 g\n')
        };
      };
      try {
        const { abrir, app } = await montar();
        await abrir('#/plan/compras');
        expect(app.innerHTML).toContain('250 g');
      } finally {
        storeFake.receta = original;
      }
    });

    it('redibujar no vuelve a leer las recetas', async () => {
      estado.plan = conDosRecetas();
      const { abrir, tocar } = await montar();
      await abrir('#/plan/compras');
      const antes = estado.lecturas;
      await tocar('compartir-compras');
      expect(estado.lecturas).toBe(antes);
    });

    it('compartir ofrece Texto solamente, y lo manda como texto', async () => {
      estado.plan = conDosRecetas();
      const original = storeFake.receta;
      storeFake.receta = async (id: string) => ({
        entrada: entradaFalsa({ id_archivo: id }),
        receta: parse('---\ntitulo: A\n---\n\n## Ingredientes\n- Harina - 250 g\n- Sal\n')
      });
      const compartidos: ShareData[] = [];
      vi.stubGlobal('navigator', { share: async (d: ShareData) => { compartidos.push(d); } });
      try {
        const { abrir, tocar, app } = await montar();
        await abrir('#/plan/compras');
        await tocar('compartir-compras');
        expect(app.innerHTML).toContain('hoja-compartir');
        expect(app.innerHTML).not.toContain('data-accion="compartir-pdf"');
        await tocar('compartir-texto');
        expect(compartidos[0]?.text).toBe('*Con cantidad*\n- Harina: 500 g\n\n*Sin cantidad*\n- Sal');
      } finally {
        storeFake.receta = original;
      }
    });
  });

  describe('las fotos de la receta', () => {
    const EXTERNA = 'https://ejemplo/2.jpg';
    const foto = (texto: string): Blob => new Blob([texto], { type: 'image/jpeg' });
    /** El depósito tal como lo deja `renderEditor` en su campo oculto. */
    const deposito = (fotos: { n: number; url: string }[]): string => JSON.stringify(fotos);
    const MD_CON_FOTOS = [
      '---', 'titulo: Milanesas', 'foto: foto:1', '---', '',
      '## Preparación', '', '1. Freír. ![](foto:2)', '',
      '## Fotos', '', `- 1: ${linkDeFoto('f9')}`, `- 2: ${EXTERNA}`, ''
    ].join('\n');
    /** Lo que el formulario del editor tiene escrito al abrir ese `.md`. */
    const formularioConFotos = () => ({
      titulo: 'Milanesas', carpeta: 'c1', foto: 'foto:1',
      preparacion: '1. Freír. ![](foto:2)',
      fotos: deposito([{ n: 1, url: linkDeFoto('f9') }, { n: 2, url: EXTERNA }])
    });

    it('el editor abre con el depósito del `.md` en su campo oculto', async () => {
      estado.md = MD_CON_FOTOS;
      const { abrir, app } = await montar();
      await abrir('#/r/f1/editar');
      expect(app.innerHTML).toContain('<h2>Fotos</h2>');
      expect(app.innerHTML).toContain('name="fotos"');
      expect(app.innerHTML).toContain(`&quot;n&quot;:2,&quot;url&quot;:&quot;${EXTERNA}&quot;`);
    });

    it('agregar una foto la suma al depósito con el número siguiente y redibuja la fila', async () => {
      estado.md = MD_CON_FOTOS;
      const { abrir, elegirFotos, filasDeFotos } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();

      await elegirFotos([foto('a')]);

      expect(JSON.parse(estado.formulario['fotos'] ?? '')).toEqual([
        { n: 1, url: linkDeFoto('f9') }, { n: 2, url: EXTERNA }, { n: 3, url: '' }
      ]);
      expect(filasDeFotos.at(-1)).toContain('data-n="3"');
    });

    it('guardar manda las fotos nuevas y las sacadas', async () => {
      estado.md = MD_CON_FOTOS;
      const { abrir, tocar, elegirFotos } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();

      await elegirFotos([foto('nueva')]);
      await tocar('sacar-foto-editor', { n: '2' });
      await tocar('guardar');

      const cambios = estado.cambiosDeFotos.at(-1);
      expect([...(cambios?.nuevas.keys() ?? [])]).toEqual([3]);
      expect(await (cambios?.nuevas.get(3) as Blob).text()).toBe('nueva');
      expect(cambios?.sacadas).toEqual([EXTERNA]);
      // Sacarla también borró su referencia del texto.
      expect(estado.formulario['preparacion']).toBe('1. Freír.');
    });

    it('sacar la foto de portada deja la cabecera vacía', async () => {
      estado.md = MD_CON_FOTOS;
      const { abrir, tocar, portadas } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();

      await tocar('sacar-foto-editor', { n: '1' });

      expect(estado.formulario['foto']).toBe('');
      expect(JSON.parse(estado.formulario['fotos'] ?? '')).toEqual([{ n: 2, url: EXTERNA }]);
      expect(portadas.at(-1)).toContain('Sin foto');
    });

    it('elegir una foto de portada la escribe como `foto:N`', async () => {
      estado.md = MD_CON_FOTOS;
      const { abrir, tocar, preguntas, portadas, filasDeFotos } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();

      await tocar('abrir-portada');
      expect(preguntas.at(-1)).toContain('data-selector-portada');

      await tocar('elegir-portada', { n: '2' });
      expect(estado.formulario['foto']).toBe('foto:2');
      expect(portadas.at(-1)).toContain(EXTERNA);
      // Elegir cierra la ficha.
      expect(preguntas.some(h => h.includes('data-selector-portada'))).toBe(false);
      // Y la fila se redibuja con la marca de portada en la que se eligió, sin
      // salir del editor.
      const fila = filasDeFotos.at(-1) ?? '';
      const minis = fila.split('<div class="miniatura cuadro-foto">').slice(1);
      expect(minis[1]).toContain(ICO.portada);
      expect(minis[0]).not.toContain(ICO.portada);
    });

    /** Lo que contesta un sitio que sí deja bajar la foto. */
    const respuestaDeFoto = (texto: string) => ({
      ok: true,
      headers: { get: (n: string) => (n.toLowerCase() === 'content-type' ? 'image/jpeg' : null) },
      blob: async () => foto(texto)
    });
    /** Abre la ficha de *Por URL* con la dirección escrita y toca *Traer*. */
    const traer = async (
      montada: { tocar: (a: string, d?: Record<string, string>) => Promise<unknown> }, url: string
    ) => {
      await montada.tocar('abrir-foto-url');
      estado.formulario['url-foto'] = url;
      await montada.tocar('traer-foto-url');
    };

    it('traer una URL que responde una imagen la suma al depósito y la sube al guardar', async () => {
      estado.md = MD_CON_FOTOS;
      vi.stubGlobal('fetch', async () => respuestaDeFoto('bajada'));
      const montada = await montar();
      const { abrir, tocar, preguntas, filasDeFotos } = montada;
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();

      await tocar('abrir-foto-url');
      expect(preguntas.at(-1)).toContain('data-foto-url');
      estado.formulario['url-foto'] = 'https://ejemplo/3.jpg';
      await tocar('traer-foto-url');

      // Entra por el mismo camino que una de la cámara: sin URL en el depósito
      // y con su blob en memoria hasta Guardar.
      expect(JSON.parse(estado.formulario['fotos'] ?? '')).toEqual([
        { n: 1, url: linkDeFoto('f9') }, { n: 2, url: EXTERNA }, { n: 3, url: '' }
      ]);
      expect(filasDeFotos.at(-1)).toContain('data-n="3"');
      // Traerla cierra la ficha.
      expect(preguntas.some(h => h.includes('data-foto-url'))).toBe(false);

      await tocar('guardar');
      const cambios = estado.cambiosDeFotos.at(-1);
      expect([...(cambios?.nuevas.keys() ?? [])]).toEqual([3]);
      expect(await (cambios?.nuevas.get(3) as Blob).text()).toBe('bajada');
    });

    it('una que el sitio no deja bajar entra igual como link externo, con su aviso', async () => {
      estado.md = MD_CON_FOTOS;
      // Lo que hace CORS: `fetch` ni siquiera llega a contestar.
      vi.stubGlobal('fetch', async () => { throw new TypeError('bloqueado'); });
      const montada = await montar();
      const { abrir, tocar, preguntas } = montada;
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();

      await traer(montada, 'https://instagram/3.jpg');

      expect(JSON.parse(estado.formulario['fotos'] ?? '')).toEqual([
        { n: 1, url: linkDeFoto('f9') }, { n: 2, url: EXTERNA }, { n: 3, url: 'https://instagram/3.jpg' }
      ]);
      expect(preguntas.some(h => h.includes('data-foto-url'))).toBe(false);
      const avisado = preguntas.find(h => h.includes('data-aviso-fotos'));
      expect(avisado).toContain('queda como link');
      // El mismo camino es el de estar sin conexión, y el aviso lo nombra.
      expect(avisado).toContain('conexión');
      // No es un error del usuario: el aviso no ofrece nada que hacer.
      expect(avisado).not.toContain('<button');

      // No hay nada que subir: la línea ya tiene su URL.
      await tocar('guardar');
      expect([...(estado.cambiosDeFotos.at(-1)?.nuevas.keys() ?? [])]).toEqual([]);
    });

    it('una URL que no es una foto no entra, y la ficha queda abierta con lo escrito', async () => {
      estado.md = MD_CON_FOTOS;
      // Una página que contesta 200 con HTML no es una foto.
      vi.stubGlobal('fetch', async () => ({
        ok: true, headers: { get: () => 'text/html; charset=utf-8' }, blob: async () => foto('<html>')
      }));
      const montada = await montar();
      const { abrir, preguntas } = montada;
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();

      await traer(montada, 'https://ejemplo/pagina');

      expect(JSON.parse(estado.formulario['fotos'] ?? '')).toEqual([
        { n: 1, url: linkDeFoto('f9') }, { n: 2, url: EXTERNA }
      ]);
      expect(preguntas.at(-1)).toContain('data-foto-url');
      expect(preguntas.at(-1)).toContain('value="https://ejemplo/pagina"');
      expect(preguntas.at(-1)).toContain('no es una foto');
    });

    it('una URL con un espacio no entra ni como link: rompería la sección Fotos entera', async () => {
      estado.md = MD_CON_FOTOS;
      // El depósito es `- <n>: <url>` sin espacios: escribir una así deja la
      // sección como ajena, y la receta pierde todas sus fotos (C05.1.5).
      let pedidos = 0;
      vi.stubGlobal('fetch', async () => { pedidos++; throw new TypeError('bloqueado'); });
      const montada = await montar();
      const { abrir, preguntas } = montada;
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();

      await traer(montada, 'https://sitio/mi foto.jpg');

      expect(JSON.parse(estado.formulario['fotos'] ?? '')).toEqual([
        { n: 1, url: linkDeFoto('f9') }, { n: 2, url: EXTERNA }
      ]);
      // Ni se la pide: la descarta la forma.
      expect(pedidos).toBe(0);
      expect(preguntas.at(-1)).toContain('data-foto-url');
      expect(preguntas.at(-1)).toContain('no es una foto');
    });

    it('lo que no es una dirección de la web tampoco entra', async () => {
      estado.md = MD_CON_FOTOS;
      let pedidos = 0;
      vi.stubGlobal('fetch', async () => { pedidos++; return respuestaDeFoto('x'); });
      const montada = await montar();
      const { abrir, preguntas } = montada;
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();

      await traer(montada, 'javascript:alert(1)');

      expect(JSON.parse(estado.formulario['fotos'] ?? '')).toHaveLength(2);
      expect(pedidos).toBe(0);
      expect(preguntas.at(-1)).toContain('no es una foto');
    });

    it('el esquema en mayúsculas se escribe en minúsculas, así la línea se relee', async () => {
      estado.md = MD_CON_FOTOS;
      // El teclado del teléfono pone la primera letra en mayúscula solo, y el
      // depósito se parsea con `https?` sin `/i`: cruda, la línea dejaría toda
      // la sección `## Fotos` como ajena (C05.1.5).
      vi.stubGlobal('fetch', async () => { throw new TypeError('bloqueado'); });
      const montada = await montar();
      const { abrir } = montada;
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();

      await traer(montada, 'Https://instagram/MiFoto.jpg');

      const fotos = JSON.parse(estado.formulario['fotos'] ?? '');
      // Sólo el esquema: el resto de la dirección distingue mayúsculas.
      expect(fotos.at(-1)).toEqual({ n: 3, url: 'https://instagram/MiFoto.jpg' });
      // Y la sección que se va a escribir vuelve a leerse entera.
      expect(parsearFotos(serializarFotos(fotos))).toEqual(fotos);
    });

    it('una `http://` se rechaza por su cuenta: desde Pages es contenido mixto', async () => {
      estado.md = MD_CON_FOTOS;
      let pedidos = 0;
      vi.stubGlobal('fetch', async () => { pedidos++; return respuestaDeFoto('x'); });
      const montada = await montar();
      const { abrir, preguntas } = montada;
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();

      await traer(montada, 'http://sitio/foto.jpg');

      expect(JSON.parse(estado.formulario['fotos'] ?? '')).toHaveLength(2);
      expect(pedidos).toBe(0);
      expect(preguntas.at(-1)).toContain('https://');

      // Y en mayúsculas es la misma dirección: el chequeo la ve igual.
      await traer(montada, 'HTTP://sitio/foto.jpg');
      expect(JSON.parse(estado.formulario['fotos'] ?? '')).toHaveLength(2);
      expect(pedidos).toBe(0);
      expect(preguntas.at(-1)).toContain('https://');
    });

    it('el pedido lleva un corte: un sitio que acepta y no contesta no deja el editor tapado', async () => {
      estado.md = MD_CON_FOTOS;
      const señales: (AbortSignal | undefined)[] = [];
      vi.stubGlobal('fetch', async (_u: string, o?: { signal?: AbortSignal }) => {
        señales.push(o?.signal);
        return respuestaDeFoto('bajada');
      });
      const montada = await montar();
      const { abrir } = montada;
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();

      await traer(montada, 'https://ejemplo/3.jpg');

      expect(señales.at(-1)).toBeInstanceOf(AbortSignal);
    });

    it('cada intento limpia el aviso del anterior: nunca quedan dos', async () => {
      estado.md = MD_CON_FOTOS;
      vi.stubGlobal('fetch', async () => { throw new TypeError('bloqueado'); });
      const montada = await montar();
      const { abrir, preguntas } = montada;
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();

      // La primera entra como link y deja su aviso arriba del formulario.
      await traer(montada, 'https://instagram/3.jpg');
      expect(preguntas.filter(h => h.includes('data-aviso-fotos'))).toHaveLength(1);

      // La segunda ni llega a pedirse: su aviso va en la ficha, y el de arriba
      // se va.
      await traer(montada, 'https://sitio/mi foto.jpg');
      expect(preguntas.filter(h => h.includes('data-aviso-fotos'))).toHaveLength(0);
    });

    it('una que no existe tampoco entra', async () => {
      estado.md = MD_CON_FOTOS;
      vi.stubGlobal('fetch', async () => ({
        ok: false, headers: { get: () => null }, blob: async () => foto('')
      }));
      const montada = await montar();
      const { abrir, preguntas } = montada;
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();

      await traer(montada, 'https://ejemplo/no-esta.jpg');

      expect(JSON.parse(estado.formulario['fotos'] ?? '')).toEqual([
        { n: 1, url: linkDeFoto('f9') }, { n: 2, url: EXTERNA }
      ]);
      expect(preguntas.at(-1)).toContain('no es una foto');
    });

    it('el botón de la foto se cuelga del campo, a la altura de la línea del cursor', async () => {
      estado.md = MD_CON_FOTOS;
      const { abrir, posarCursor, botonesDeFoto } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = { ...formularioConFotos(), preparacion: 'Freír.\nServir.\nComer.' };

      // El cursor en la tercera línea: dos renglones de 24 px arriba.
      await posarCursor('preparacion', 'Freír.\nServir.\nCo'.length);

      expect(botonesDeFoto.at(-1)).toContain('data-accion="abrir-elegir-foto"');
      expect(botonesDeFoto.at(-1)).toContain('data-seccion="preparacion"');
      expect(botonesDeFoto.at(-1)).toContain('data-linea="2"');
      expect(botonesDeFoto.at(-1)).toContain('style="top:48px"');
    });

    it('con el depósito vacío no hay botón: no hay foto que poner', async () => {
      estado.md = '---\ntitulo: Milanesas\n---\n\n## Preparación\n\n1. Freír.\n';
      const { abrir, posarCursor, hayBotonDeFoto } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = { titulo: 'Milanesas', carpeta: 'c1', preparacion: '1. Freír.', fotos: deposito([]) };

      await posarCursor('preparacion', 0);

      expect(hayBotonDeFoto()).toBe(false);
    });

    it('el foco fuera de una sección saca el botón', async () => {
      estado.md = MD_CON_FOTOS;
      const { abrir, posarCursor, soltarCursor, hayBotonDeFoto } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();

      await posarCursor('preparacion', 0);
      expect(hayBotonDeFoto()).toBe(true);

      await soltarCursor();
      expect(hayBotonDeFoto()).toBe(false);

      // El título es un campo, pero no una sección que pueda nombrar una foto.
      await posarCursor('titulo', 0);
      expect(hayBotonDeFoto()).toBe(false);
    });

    it('tocar el botón no mueve el foco, así el toque llega al click', async () => {
      estado.md = MD_CON_FOTOS;
      const { abrir, posarCursor, tocarBotonDeFoto, hayBotonDeFoto } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();

      await posarCursor('preparacion', 0);
      // Sin frenar el toque, el navegador le saca el foco al campo y el botón
      // se va del DOM antes de que llegue el click.
      expect(await tocarBotonDeFoto()).toBe(true);
      expect(hayBotonDeFoto()).toBe(true);
    });

    it('el botón sigue al scroll del campo, y no se dibuja si el renglón quedó fuera', async () => {
      estado.md = MD_CON_FOTOS;
      const { abrir, posarCursor, desplazarCampo, botonesDeFoto, hayBotonDeFoto } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = {
        ...formularioConFotos(),
        preparacion: Array.from({ length: 12 }, (_, i) => `${i + 1}. Paso`).join('\n')
      };

      // El cursor en el renglón 8, con el campo sin correr: 192 px, afuera de
      // los 144 que se ven.
      await posarCursor('preparacion', '1. Paso\n'.repeat(8).length);
      expect(hayBotonDeFoto()).toBe(false);

      // El dedo corre el texto y el renglón entra: el botón aparece donde va.
      await desplazarCampo(96);
      expect(botonesDeFoto.at(-1)).toContain('style="top:96px"');

      // Sigue corriendo y el renglón se va por arriba.
      await desplazarCampo(240);
      expect(hayBotonDeFoto()).toBe(false);
    });

    it('cerrar la ficha con el velo no deja el botón colgado', async () => {
      estado.md = MD_CON_FOTOS;
      const { abrir, tocar, posarCursor, sacarElFoco, hayBotonDeFoto } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();

      await posarCursor('preparacion', 0);
      await tocar('abrir-elegir-foto', { seccion: 'preparacion', linea: '0' });
      // Tocar el velo le sacó el foco al campo, y eso no avisa por su cuenta.
      sacarElFoco();

      await tocar('cerrar-ficha-foto');

      expect(hayBotonDeFoto()).toBe(false);
    });

    it('elegir una foto la escribe en la línea del cursor sin redibujar el formulario', async () => {
      estado.md = MD_CON_FOTOS;
      const { abrir, app, tocar, posarCursor, preguntas, filasDeFotos } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = { ...formularioConFotos(), preparacion: 'Freír.\nServir.' };
      const antes = app.innerHTML;

      await posarCursor('preparacion', 'Freír.\nSer'.length);
      await tocar('abrir-elegir-foto', { seccion: 'preparacion', linea: '1' });

      // Sólo las fotos del depósito: agregar sigue siendo la ficha Fotos.
      expect(preguntas.at(-1)).toContain('data-elegir-foto');
      expect(preguntas.at(-1)).toContain('data-n="1"');
      expect(preguntas.at(-1)).not.toContain('Agregar foto');

      await tocar('poner-en', { seccion: 'preparacion', linea: '1', n: '2' });

      expect(estado.formulario['preparacion']).toBe('Freír.\nServir. ![](foto:2)');
      expect(preguntas.some(h => h.includes('data-elegir-foto'))).toBe(false);
      expect(app.innerHTML).toBe(antes);
      // Ahora está en un paso, y la fila se redibuja diciéndolo.
      const minis = (filasDeFotos.at(-1) ?? '').split('<div class="miniatura cuadro-foto">').slice(1);
      expect(minis[1]).toContain(ICO.enElTexto);
      expect(minis[0]).not.toContain(ICO.enElTexto);
    });

    it('en el editor, el visor se agrega y se saca del DOM sin redibujar el formulario', async () => {
      estado.md = MD_CON_FOTOS;
      const { abrir, app, tocar, preguntas } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();
      const antes = app.innerHTML;

      await tocar('acciones-foto', { n: '2' });
      await tocar('ver-foto-receta', { n: '2' });

      expect(preguntas.at(-1)).toContain('class="visor"');
      expect(preguntas.at(-1)).toContain('data-i="1"');
      // Abrir el visor cierra la ficha, y el formulario no se vuelve a pintar.
      expect(preguntas.some(h => h.includes('data-acciones-foto'))).toBe(false);
      expect(app.innerHTML).toBe(antes);

      await tocar('cerrar-visor');

      expect(preguntas.some(h => h.includes('class="visor"'))).toBe(false);
      expect(app.innerHTML).toBe(antes);
    });

    it('una foto que no se decodifica avisa en la categoría sin redibujarla', async () => {
      const { abrir, app, elegirFotoDeCategoria, preguntas } = await montar();
      await abrir('#/categorias/c1');
      estado.formulario = { nombre: 'Carnes', color: 'carnes', foto: 'catalogo:carnes' };
      const antes = app.innerHTML;

      await elegirFotoDeCategoria(new Blob(['roto'], { type: 'image/jpeg' }));

      expect(preguntas.at(-1)).toContain('No se pudo leer una de las fotos.');
      expect(app.innerHTML).toBe(antes);
      expect(estado.formulario['foto']).toBe('catalogo:carnes');
    });

    it('elegir la portada redibuja la fila y la portada, y completa sus fotos en una sola pasada', async () => {
      estado.md = MD_CON_FOTOS;
      const { abrir, tocar, imgs } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();
      // La foto de Drive de la fila y la de la portada, recién dibujadas y sin `src`.
      imgs.push(imgFalsa({ drive: 'f9' }), imgFalsa({ drive: 'f9' }));
      estado.imagenesPedidas = [];

      await tocar('elegir-portada', { n: '1' });

      expect(estado.imagenesPedidas).toEqual(['f9', 'f9']);
      expect(imgs.map(i => i.atributos['src'])).toEqual(['blob:f9', 'blob:f9']);
    });

    it('el velo cierra la ficha de acciones sin tocar el formulario', async () => {
      estado.md = MD_CON_FOTOS;
      const { abrir, tocar, preguntas } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();

      await tocar('acciones-foto', { n: '1' });
      expect(preguntas.at(-1)).toContain('data-acciones-foto');
      // La 1 es la portada: esa acción no se ofrece.
      expect(preguntas.at(-1)).not.toContain('elegir-portada');

      await tocar('cerrar-ficha-foto');
      expect(preguntas.some(h => h.includes('data-acciones-foto'))).toBe(false);
      expect(estado.formulario).toEqual(formularioConFotos());
    });

    it('al reintentar, la foto que ya se subió va por su link y no se vuelve a subir', async () => {
      const original = storeFake.guardar;
      let intentos = 0;
      storeFake.guardar = async (
        id: string,
        receta: { tags: string[]; fotos?: { n: number; url: string }[] },
        opciones?: { fotos?: CambiosDeFotos }
      ) => {
        if (intentos++ === 0) {
          opciones?.fotos?.alSubir?.(1, 'subida-1');
          throw new Error('red');
        }
        return original(id, receta, opciones);
      };
      try {
        const { abrir, app, tocar, elegirFotos } = await montar();
        await abrir('#/r/f1/editar');
        estado.formulario = { titulo: 'Milanesas', carpeta: 'c1', fotos: deposito([]) };
        await elegirFotos([foto('a')]);

        await tocar('guardar');
        expect(app.innerHTML).toContain('No se pudo guardar.');

        await tocar('guardar');
        expect(estado.cambiosDeFotos.at(-1)?.nuevas.size).toBe(0);
        expect(estado.depositos.at(-1)).toEqual([{ n: 1, url: linkDeFoto('subida-1') }]);
      } finally {
        storeFake.guardar = original;
      }
    });

    /** Con dos fotos sin uso: las del carrusel, que es lo que el visor recorre. */
    const MD_CON_SUELTAS = [
      '---', 'titulo: Milanesas', 'foto: foto:1', '---', '',
      '## Fotos', '', `- 1: ${linkDeFoto('f9')}`, `- 2: ${EXTERNA}`, '- 3: https://ejemplo/otra.jpg', ''
    ].join('\n');

    it('desde el carrusel, el visor recorre las del carrusel, y se cierra tocando', async () => {
      estado.md = MD_CON_SUELTAS;
      const { abrir, app, tocar } = await montar();
      await abrir('#/r/f1');

      await tocar('ver-foto-receta', { n: '3' });
      expect(app.innerHTML).toContain('class="visor"');
      // La portada no está en la tira: son las dos sin uso, y ésta es la segunda.
      expect(app.innerHTML).toContain('data-i="1"');
      expect(app.innerHTML).toContain('data-total="2"');

      await tocar('cerrar-visor');
      expect(app.innerHTML).not.toContain('class="visor"');
    });

    it('desde la portada, el visor la abre sola: no recorre el depósito', async () => {
      estado.md = MD_CON_SUELTAS;
      const { abrir, app, tocar } = await montar();
      await abrir('#/r/f1');

      await tocar('ver-foto-receta', { n: '1' });
      expect(app.innerHTML).toContain('data-i="0"');
      expect(app.innerHTML).toContain('data-total="1"');
    });

    it('tocar una foto en línea del texto la abre sola', async () => {
      estado.md = MD_CON_FOTOS;
      const { abrir, app, tocarFotoEnLinea } = await montar();
      await abrir('#/r/f1');

      await tocarFotoEnLinea({ src: EXTERNA });

      expect(app.innerHTML).toContain('class="visor"');
      expect(app.innerHTML).toContain('data-i="0"');
      expect(app.innerHTML).toContain('data-total="1"');
    });

    it('una foto en línea que no está en el depósito se abre sola', async () => {
      estado.md = '---\ntitulo: Milanesas\n---\n\n## Notas\n\n![](https://ejemplo/suelta.jpg)\n';
      const { abrir, app, tocarFotoEnLinea } = await montar();
      await abrir('#/r/f1');

      await tocarFotoEnLinea({ src: 'https://ejemplo/suelta.jpg' });

      expect(app.innerHTML).toContain('data-i="0"');
      expect(app.innerHTML).toContain('data-total="1"');
    });

    it('las imágenes de Drive se completan al llegar; la que no está deja el recuadro', async () => {
      estado.md = MD_CON_FOTOS;
      estado.fotosPerdidas = ['f8', 'f7'];
      const { abrir, imgs } = await montar();
      imgs.push(imgFalsa({ drive: 'f9' }), imgFalsa({ drive: 'f8' }, '.cuadro-foto'), imgFalsa({ drive: 'f7' }));

      await abrir('#/r/f1');

      expect(imgs[0]?.atributos['src']).toBe('blob:f9');
      expect(imgs[1]?.reemplazo).toContain('La foto ya no está en Drive.');
      expect(imgs[2]?.sacada).toBe(true);
    });

    it('una foto externa que no carga se saca de un paso; en su cuadro —la cabecera, el carrusel— deja el recuadro', async () => {
      estado.md = MD_CON_FOTOS;
      const { abrir, fallarFoto } = await montar();
      await abrir('#/r/f1');

      const enUnPaso = imgFalsa({});
      const enSuCuadro = imgFalsa({}, '.cuadro-foto');
      await fallarFoto(enUnPaso);
      await fallarFoto(enSuCuadro);

      expect(enUnPaso.sacada).toBe(true);
      expect(enSuCuadro.reemplazo).toContain('No se pudo cargar la foto.');
    });

    it('una portada del editor cuya foto de Drive ya no está muestra el aviso', async () => {
      estado.md = MD_CON_FOTOS;
      estado.fotosPerdidas = ['f9'];
      const { abrir, imgs } = await montar();
      // La portada es `foto:1`, la de Drive: su `<img>` cuelga del botón de la portada.
      const portada = imgFalsa({ drive: 'f9' }, '.cuadro-foto');
      imgs.push(portada);

      await abrir('#/r/f1/editar');

      expect(portada.reemplazo).toContain('La foto ya no está en Drive.');
      expect(portada.sacada).toBe(false);
    });

    it('el error de algo que no es una imagen no toca nada', async () => {
      estado.md = MD_CON_FOTOS;
      const { abrir, fallarFoto } = await montar();
      await abrir('#/r/f1');

      const script = imgFalsa({}, false, 'SCRIPT');
      await fallarFoto(script);

      expect(script.sacada).toBe(false);
      expect(script.reemplazo).toBe('');
    });

    it('las imágenes de Drive se completan de a dos, no de a una', async () => {
      estado.md = MD_CON_FOTOS;
      const freno: Array<() => void> = [];
      estado.frenoDeImagen = freno;
      const { abrir, imgs } = await montar();
      imgs.push(imgFalsa({ drive: 'f1' }), imgFalsa({ drive: 'f2' }), imgFalsa({ drive: 'f3' }), imgFalsa({ drive: 'f4' }));

      await abrir('#/r/f1');
      await esperar();
      expect(freno).toHaveLength(2);

      while (freno.length) { freno.shift()!(); await esperar(); }
      estado.frenoDeImagen = null;
      expect(imgs.map(i => i.atributos['src'])).toEqual(['blob:f1', 'blob:f2', 'blob:f3', 'blob:f4']);
    });

    it('dibujado el home se precargan las fotos del índice y de las categorías', async () => {
      const original = storeFake.entradas;
      storeFake.entradas = () => [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', foto: linkDeFoto('f9') })];
      const conFoto = storeFake.categorias;
      storeFake.categorias = () => [{ id: 'c1', nombre: 'Carnes', color: 'carnes', foto: 'drive:cf1' }];
      try {
        const { abrir } = await montar();
        await abrir('#/');
        expect(estado.precargados[0]).toEqual(['f9', 'cf1']);
      } finally {
        storeFake.entradas = original;
        storeFake.categorias = conFoto;
      }
    });

    it('al abrir una receta se precarga su depósito entero', async () => {
      estado.md = MD_CON_FOTOS;
      const { abrir } = await montar();
      await abrir('#/r/f1');
      expect(estado.precargados.at(-1)).toEqual(['f9']);
    });

    it('en una categoría, la foto subida se ve en la muestra y se manda al guardar', async () => {
      const { abrir, tocar, elegirFotoDeCategoria } = await montar();
      await abrir('#/categorias/c1');
      estado.formulario = { nombre: 'Carnes', color: 'carnes', foto: 'catalogo:carnes' };

      await elegirFotoDeCategoria(foto('propia'));
      expect(estado.formulario['foto']).toMatch(/^propia:blob:/);

      await tocar('guardar-categoria');
      expect(await (estado.fotosDeCategoria.at(-1) as Blob).text()).toBe('propia');
    });

    it('sin foto nueva, guardar la categoría no manda ninguna', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/categorias/c1');
      estado.formulario = { nombre: 'Carnes', color: 'otros', foto: 'catalogo:carnes' };

      await tocar('guardar-categoria');

      expect(estado.fotosDeCategoria.at(-1)).toBe(null);
    });
  });

  describe('la receta nueva y lo compartido', () => {
    /** El depósito como queda en el campo oculto del editor. */
    const deposito = (fotos: { n: number; url: string }[]) =>
      `name="fotos" value="${JSON.stringify(fotos).replace(/"/g, '&quot;')}"`;
    const RECIBIDA = '---\ntitulo: Focaccia recibida\nid: f1\n---\n\n## Ingredientes\n- Harina — 500 g\n';

    it('#/nueva abre el editor con «Sin categoría» y borrador puesto', async () => {
      const { abrir, app } = await montar();
      await abrir('#/nueva');
      expect(app.innerHTML).toContain('<option value="" selected>Sin categoría</option>');
      expect(app.innerHTML).toContain('data-valor="borrador" aria-pressed="true"');
    });

    it('lo compartido va a la fuente y a las notas', async () => {
      const { abrir, app } = await montar();
      await abrir(`#/nueva?text=${encodeURIComponent('https://ig.com/r mirá esto')}`);
      expect(app.innerHTML).toContain('name="fuente" value="https://ig.com/r"');
      expect(app.innerHTML).toContain('<textarea name="notas" rows="3">mirá esto</textarea>');
      expect(app.innerHTML).toContain('<option value="" selected>Sin categoría</option>');
      expect(app.innerHTML).toContain('data-valor="borrador" aria-pressed="true"');
    });

    it('las fotos compartidas entran al depósito como nuevas, sin tope, con su miniatura', async () => {
      estado.compartidas = [new Blob(['a']), new Blob(['bb']), new Blob(['ccc']), new Blob(['dddd']),
        new Blob(['eeeee']), new Blob(['ffffff'])];
      const { abrir, app, imgs } = await montar();
      imgs.push(imgFalsa({ n: '1' }), imgFalsa({ n: '6' }));
      await abrir('#/nueva?fotos=6');
      expect(app.innerHTML).toContain(deposito([1, 2, 3, 4, 5, 6].map(n => ({ n, url: '' }))));
      expect(imgs[0]?.atributos['src']).toBe('blob:memoria-1');
      expect(imgs[1]?.atributos['src']).toBe('blob:memoria-6');
      // Leídas, el caché del service worker se vacía.
      expect(estado.compartidasDescartadas).toBe(1);
    });

    it('si leer las fotos compartidas falla, el caché se vacía igual y el editor avisa', async () => {
      estado.fallanCompartidas = true;
      const { abrir, app, preguntas } = await montar();
      await abrir('#/nueva?fotos=2');
      expect(estado.compartidasDescartadas).toBe(1);
      expect(app.innerHTML).toContain('name="titulo"');
      expect(preguntas.join('')).toContain('No se pudo leer una de las fotos.');
    });

    it('guardar lo compartido sube las fotos nuevas', async () => {
      estado.compartidas = [new Blob(['a']), new Blob(['bb'])];
      const { abrir, tocar } = await montar();
      await abrir('#/nueva?fotos=2');
      estado.formulario = { titulo: 'Pan', carpeta: '', tags: 'borrador', fotos: JSON.stringify([{ n: 1, url: '' }, { n: 2, url: '' }]) };
      await tocar('guardar');
      expect([...(estado.cambiosDeFotos[0]?.nuevas.keys() ?? [])]).toEqual([1, 2]);
    });

    it('volver sin tocar nada pregunta: lo compartido cuenta como cambio', async () => {
      const { abrir, atras, empujados, preguntas } = await montar();
      await abrir('#/nueva?text=hola');
      await atras();
      expect(empujados).toEqual(['#/nueva?text=hola']);
      expect(preguntas.join('')).toContain('¿Salir sin guardar los cambios?');
    });

    it('salir sin guardar lo compartido, sin pantalla atrás, cierra al Recetario', async () => {
      // El Share Target abre la app con lo compartido: no hay pantalla atrás.
      const { tocar, reemplazos, vueltasAtras } = await montar({ hash: '#/nueva?text=hola' });
      await tocar('salir-sin-guardar');
      expect(reemplazos.at(-1)).toBe('#/');
      expect(vueltasAtras).toEqual([]);
    });

    it('sin nada compartido, volver sin tocar nada no pregunta', async () => {
      const { abrir, empujados } = await montar();
      await abrir('#/nueva');
      await abrir('#/');
      expect(empujados).toEqual([]);
    });

    it('una receta .md con el id de una receta que existe abre su editor con lo recibido', async () => {
      const original = storeFake.receta;
      storeFake.receta = async (id: string) => {
        estado.lecturas++;
        return { entrada: entradaFalsa({ id_archivo: id, carpeta_id: 'c1', categoria: 'Carnes' }), receta: parse(estado.md) };
      };
      try {
        const { abrir, app, reemplazos } = await montar();
        await abrir(`#/nueva?text=${encodeURIComponent(RECIBIDA)}`);
        expect(reemplazos.at(-1)).toBe('#/r/f1/editar?recibida=1');
        // El navegador avisa el cambio de hash que dejó el reemplazo.
        await abrir('#/r/f1/editar?recibida=1');
        expect(app.innerHTML).toContain('name="titulo" value="Focaccia recibida"');
        expect(app.innerHTML).toContain('<option value="c1" selected>Carnes</option>');
        expect(app.innerHTML).toContain('Editando');
      } finally {
        storeFake.receta = original;
      }
    });

    it.each([
      ['en una categoría, la pega con esa carpeta', 'c1', 'c1'],
      ['en la raíz, la pega como «Sin categoría»', 'raiz', ''],
      ['en _sin-categoria/, la pega como «Sin categoría»', 'sin-cat', '']
    ])('una receta .md recibida para una receta existente %s', async (_caso, carpetaId, esperada) => {
      const original = storeFake.receta;
      storeFake.receta = async (id: string) => ({
        entrada: entradaFalsa({ id_archivo: id, carpeta_id: carpetaId }), receta: parse(estado.md)
      });
      pegadas.carpetas = [];
      try {
        const { abrir } = await montar();
        await abrir(`#/nueva?text=${encodeURIComponent(RECIBIDA)}`);
        await abrir('#/r/f1/editar?recibida=1');
        expect(pegadas.carpetas).toEqual([esperada]);
      } finally {
        storeFake.receta = original;
      }
    });

    it('lo recibido para una receta existente cuenta como cambio', async () => {
      const { abrir, atras, empujados } = await montar();
      await abrir(`#/nueva?text=${encodeURIComponent(RECIBIDA)}`);
      await abrir('#/r/f1/editar?recibida=1');
      await atras();
      expect(empujados).toEqual(['#/r/f1/editar?recibida=1']);
    });

    it.each([
      ['sin id', RECIBIDA.replace('id: f1\n', '')],
      ['con un id que no existe', RECIBIDA.replace('id: f1', 'id: otro')]
    ])('una receta .md %s abre la receta nueva llena', async (_caso, md) => {
      const { abrir, app, reemplazos } = await montar();
      await abrir(`#/nueva?text=${encodeURIComponent(md)}`);
      expect(reemplazos.at(-1)).toBe('#/nueva?recibida=1');
      await abrir('#/nueva?recibida=1');
      expect(app.innerHTML).toContain('name="titulo" value="Focaccia recibida"');
      expect(app.innerHTML).toContain('Nueva receta');
      expect(app.innerHTML).toContain('<option value="" selected>Sin categoría</option>');
      expect(app.innerHTML).toContain('data-valor="borrador" aria-pressed="true"');
    });

    it('las fotos que llegan con una receta .md se descartan sin entrar al depósito', async () => {
      estado.compartidas = [new Blob(['a'])];
      const { abrir, app } = await montar();
      await abrir(`#/nueva?text=${encodeURIComponent(RECIBIDA.replace('id: f1\n', ''))}&fotos=1`);
      await abrir('#/nueva?recibida=1');
      expect(estado.compartidasDescartadas).toBe(1);
      expect(app.innerHTML).toContain(deposito([]));
    });

    it('la clave id no llega al .md guardado', async () => {
      const { abrir, tocar } = await montar();
      await abrir(`#/nueva?text=${encodeURIComponent(RECIBIDA.replace('id: f1', 'id: otro'))}`);
      await abrir('#/nueva?recibida=1');
      estado.formulario = { titulo: 'Focaccia recibida', carpeta: '', tags: 'borrador' };
      await tocar('guardar');
      expect(estado.recetasCreadas[0]?.extras).toEqual({});
    });
  });

  describe('guardar desde el editor', () => {
    it('con «Sin categoría» crea sin carpeta, y no pide elegir una', async () => {
      const { abrir, tocar, app } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Pan', carpeta: '', tags: 'borrador' };
      await tocar('guardar');
      expect(estado.creadas).toEqual(['Pan']);
      expect(estado.opcionesCrear[0]).not.toHaveProperty('carpetaId');
      expect(app.innerHTML).not.toContain('Elegí una categoría');
    });

    it('con una categoría crea en su carpeta', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Pan', carpeta: 'c1', tags: 'borrador' };
      await tocar('guardar');
      expect(estado.opcionesCrear[0]?.['carpetaId']).toBe('c1');
    });

    it('sin título, un borrador con algo cargado se guarda con el día y la hora', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: '', carpeta: '', tags: 'borrador', notas: 'La de la abuela.' };
      await tocar('guardar');
      expect(estado.creadas).toHaveLength(1);
      expect(estado.creadas[0]).toMatch(/^Borrador \d{2}\/\d{2} \d{2}:\d{2}$/);
    });

    it('una receta nueva sin nada cargado avisa y no la crea', async () => {
      const { abrir, tocar, app } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: '', carpeta: '', tags: 'borrador', fotos: '[]' };
      await tocar('guardar');
      expect(estado.creadas).toEqual([]);
      expect(app.innerHTML).toContain('Completá algún campo antes de guardar.');
    });

    it('una receta nueva con sólo la fuente se guarda', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: '', carpeta: '', tags: 'borrador', fuente: 'https://ejemplo.com/pan' };
      await tocar('guardar');
      expect(estado.creadas).toHaveLength(1);
    });

    it('una receta nueva con sólo una foto se guarda', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: '', carpeta: '', tags: 'borrador', fotos: JSON.stringify([{ n: 1, url: linkDeFoto('d1') }]) };
      await tocar('guardar');
      expect(estado.creadas).toHaveLength(1);
    });

    it('editando una receta que ya existe, la regla del mínimo no se aplica', async () => {
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = {
        titulo: '', carpeta: '', tags: 'borrador', fotos: '[]',
        descripcion: '', ingredientes: '', preparacion: '', variaciones: '', notas: ''
      };
      await tocar('guardar');
      expect(estado.opcionesGuardar).toHaveLength(1);
      expect(app.innerHTML).not.toContain('Completá algún campo');
    });

    it('sin título y sin borrador, avisa y no guarda', async () => {
      const { abrir, tocar, app } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: '', carpeta: 'c1', tags: '', notas: 'Algo.' };
      await tocar('guardar');
      expect(estado.creadas).toEqual([]);
      expect(app.innerHTML).toContain('Ponele un título antes de guardar.');
    });

    it('editando con «Sin categoría» elegida, guarda con carpetaDestino vacío', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = { titulo: 'Milanesas', carpeta: '', tags: 'borrador' };
      await tocar('guardar');
      expect(estado.opcionesGuardar[0]?.['carpetaDestino']).toBe('');
    });

    it('editando con una categoría, guarda con esa carpeta de destino', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = { titulo: 'Milanesas', carpeta: 'c1' };
      await tocar('guardar');
      expect(estado.opcionesGuardar[0]?.['carpetaDestino']).toBe('c1');
    });

    it('guardar lo recibido cierra en la receta nueva: no hay pantalla atrás', async () => {
      const { abrir, tocar, reemplazos, vueltasAtras } = await montar();
      await abrir(`#/nueva?text=${encodeURIComponent('---\ntitulo: Focaccia\n---\n')}`);
      await abrir('#/nueva?recibida=1');
      estado.formulario = { titulo: 'Focaccia', carpeta: '', tags: 'borrador' };
      await tocar('guardar');
      expect(reemplazos.at(-1)).toBe('#/r/nuevo-1');
      expect(vueltasAtras).toEqual([]);
    });

    it('guardar lo compartido también cierra en la receta nueva', async () => {
      const { abrir, tocar, reemplazos } = await montar();
      await abrir('#/nueva?text=hola');
      estado.formulario = { titulo: 'Pan', carpeta: '', tags: 'borrador' };
      await tocar('guardar');
      expect(reemplazos.at(-1)).toBe('#/r/nuevo-1');
    });
  });

  describe('pegar una receta en el editor', () => {
    const PEGADA = '---\ntitulo: Focaccia pegada\n---\n\n## Ingredientes\n- Harina — 500 g\n';
    const FOTO = { n: 1, url: linkDeFoto('d1') };
    const portapapeles = (texto: string | null) => vi.stubGlobal('navigator', {
      clipboard: { readText: async () => { if (texto === null) throw new Error('sin permiso'); return texto; } }
    });

    it('llena el formulario con lo pegado y conserva el depósito y la categoría elegida', async () => {
      estado.md = `---\ntitulo: Milanesas\n---\n\n## Fotos\n${serializarFotos([FOTO])}`;
      portapapeles(PEGADA);
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = { titulo: 'Milanesas', carpeta: 'c1', fotos: JSON.stringify([FOTO]) };
      await tocar('pegar-receta');
      expect(app.innerHTML).toContain('name="titulo" value="Focaccia pegada"');
      expect(app.innerHTML).toContain('Harina — 500 g');
      expect(app.innerHTML).toContain(`name="fotos" value="${JSON.stringify([FOTO]).replace(/"/g, '&quot;')}"`);
      expect(app.innerHTML).toContain('<option value="c1" selected>Carnes</option>');
      // No guarda: pegar sólo llena el formulario.
      expect(estado.creadas).toEqual([]);
      expect(estado.guardados).toEqual([]);
    });

    it('con «Sin categoría», borrador queda puesto aunque lo pegado no lo traiga', async () => {
      portapapeles('---\ntitulo: Focaccia pegada\ntags: [pan]\n---\n');
      const { abrir, tocar, app } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: '', carpeta: '' };
      await tocar('pegar-receta');
      expect(app.innerHTML).toContain('name="titulo" value="Focaccia pegada"');
      expect(app.innerHTML).toContain('data-valor="borrador" aria-pressed="true"');
      expect(app.innerHTML).toContain('<option value="" selected>Sin categoría</option>');
    });

    it('lo que no es una receta avisa sin redibujar el formulario', async () => {
      portapapeles('una lista de compras');
      const { abrir, tocar, app, preguntas } = await montar();
      await abrir('#/nueva');
      const antes = app.innerHTML;
      await tocar('pegar-receta');
      expect(app.innerHTML).toBe(antes);
      expect(preguntas.join('')).toContain('Lo copiado no es una receta en .md.');
    });

    it('si el portapapeles no se deja leer, lo dice', async () => {
      portapapeles(null);
      const { abrir, tocar, app, preguntas } = await montar();
      await abrir('#/nueva');
      const antes = app.innerHTML;
      await tocar('pegar-receta');
      expect(app.innerHTML).toBe(antes);
      expect(preguntas.join('')).toContain('No se pudo leer lo copiado.');
    });

    it('en una receta nueva, las fotos del .md pegado no son suyas: guardar no las manda a la papelera', async () => {
      portapapeles(`---\ntitulo: Focaccia pegada\n---\n\n## Fotos\n${serializarFotos([FOTO])}`);
      const { abrir, tocar } = await montar();
      await abrir('#/nueva');
      await tocar('pegar-receta');
      estado.formulario = { titulo: 'Focaccia pegada', carpeta: '', tags: 'borrador', fotos: '[]' };
      await tocar('guardar');
      expect(estado.creadas).toEqual(['Focaccia pegada']);
      expect(estado.cambiosDeFotos[0]?.sacadas).toEqual([]);
    });

    it('lo mismo con una receta .md recibida sin id', async () => {
      const md = `---\ntitulo: Focaccia recibida\n---\n\n## Fotos\n${serializarFotos([FOTO])}`;
      const { abrir, tocar } = await montar();
      await abrir(`#/nueva?text=${encodeURIComponent(md)}`);
      await abrir('#/nueva?recibida=1');
      estado.formulario = { titulo: 'Focaccia recibida', carpeta: '', tags: 'borrador', fotos: '[]' };
      await tocar('guardar');
      expect(estado.cambiosDeFotos[0]?.sacadas).toEqual([]);
    });

    it('redibujar la receta nueva después de Pegar no mezcla las fotos pegadas con las del editor', async () => {
      estado.compartidas = [new Blob(['a'])];
      portapapeles(`---\ntitulo: Focaccia pegada\n---\n\n## Fotos\n${serializarFotos([FOTO])}`);
      const { abrir, tocar, app } = await montar();
      await abrir('#/nueva?fotos=1');
      estado.formulario = { titulo: '', carpeta: '', fotos: JSON.stringify([{ n: 1, url: '' }]) };
      await tocar('pegar-receta');
      // Reintentar vuelve a dibujar la pantalla con lo que hay en memoria.
      await tocar('reintentar');
      const campo = app.innerHTML.match(/name="fotos" value="([^"]*)"/)?.[1] ?? '';
      expect(JSON.parse(campo.replace(/&quot;/g, '"'))).toEqual([{ n: 1, url: '' }]);
    });

    it('un id: en lo pegado se ignora: pega en el editor abierto', async () => {
      portapapeles('---\ntitulo: Focaccia pegada\nid: f1\n---\n');
      const { abrir, tocar, app, reemplazos } = await montar();
      await abrir('#/nueva');
      await tocar('pegar-receta');
      expect(global.location.hash).toBe('#/nueva');
      expect(reemplazos).toEqual([]);
      expect(app.innerHTML).toContain('name="titulo" value="Focaccia pegada"');
      estado.formulario = { titulo: 'Focaccia pegada', carpeta: '', tags: 'borrador' };
      await tocar('guardar');
      expect(estado.recetasCreadas[0]?.extras).toEqual({});
    });
  });

  describe('convertir con el agente', () => {
    /** Lo que se mandó por el menú Compartir, con cuántas recetas había creadas en ese momento. */
    const mandados: { datos: ShareData; creadasAntes: number }[] = [];
    afterEach(() => { mandados.length = 0; });
    const conShare = () => vi.stubGlobal('navigator', {
      share: async (datos: ShareData) => { mandados.push({ datos, creadasAntes: estado.creadas.length }); },
      canShare: () => true
    });

    it('guarda primero y después manda el pedido con el id de la receta', async () => {
      conShare();
      const { abrir, tocar } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Focaccia', fuente: 'https://ig.com/r', notas: 'la de la abuela', carpeta: '', tags: 'borrador' };
      await tocar('convertir-con-agente');
      expect(estado.creadas).toEqual(['Focaccia']);
      expect(mandados).toHaveLength(1);
      expect(mandados[0]?.creadasAntes).toBe(1);
      const pedido = mandados[0]?.datos.text ?? '';
      expect(pedido).toContain('`id: nuevo-1`');
      expect(pedido).toContain('Título: Focaccia');
      expect(pedido).toContain('Fuente: https://ig.com/r');
      expect(pedido).toContain('Notas: la de la abuela');
    });

    it('al terminar, la app queda en la receta', async () => {
      conShare();
      const { abrir, tocar, reemplazos } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Focaccia', carpeta: '', tags: 'borrador' };
      await tocar('convertir-con-agente');
      expect(reemplazos.at(-1)).toBe('#/r/nuevo-1');
    });

    it('editando una receta, termina volviendo a ella: no la repite en el historial', async () => {
      conShare();
      const { abrir, tocar, reemplazos, vueltasAtras } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = { titulo: 'Milanesas', carpeta: 'c1', tags: 'borrador' };
      await tocar('convertir-con-agente');
      expect(mandados).toHaveLength(1);
      expect(vueltasAtras).toHaveLength(1);
      expect(reemplazos).toEqual([]);
    });

    it('si guardar falla, no manda nada y el editor queda con el aviso', async () => {
      conShare();
      const original = storeFake.crear;
      storeFake.crear = async () => { throw new Error('red'); };
      try {
        const { abrir, tocar, app, reemplazos } = await montar();
        await abrir('#/nueva');
        estado.formulario = { titulo: 'Focaccia', carpeta: '', tags: 'borrador' };
        await tocar('convertir-con-agente');
        expect(mandados).toEqual([]);
        expect(reemplazos).toEqual([]);
        expect(app.innerHTML).toContain('No se pudo guardar. Revisá la conexión.');
      } finally {
        storeFake.crear = original;
      }
    });

    it('una receta nueva sin nada cargado no se guarda ni se manda', async () => {
      conShare();
      const { abrir, tocar, app } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: '', carpeta: '', tags: 'borrador', fotos: '[]' };
      await tocar('convertir-con-agente');
      expect(estado.creadas).toEqual([]);
      expect(mandados).toEqual([]);
      expect(app.innerHTML).toContain('Completá algún campo antes de guardar.');
    });

    it('si la validación falla, no manda nada', async () => {
      conShare();
      const { abrir, tocar, app } = await montar();
      await abrir('#/nueva');
      // Sin título y con borrador ya sacado: no hay con qué nombrar el archivo.
      estado.formulario = { titulo: '', carpeta: 'c1', tags: '', notas: 'Algo.' };
      await tocar('convertir-con-agente');
      expect(mandados).toEqual([]);
      expect(app.innerHTML).toContain('Ponele un título antes de guardar.');
    });

    it('las fotos de Drive van en orden, cada una con su número del depósito', async () => {
      conShare();
      const { abrir, tocar } = await montar();
      await abrir('#/r/f1/editar');
      const fotos = [
        { n: 3, url: linkDeFoto('d3') }, { n: 1, url: linkDeFoto('d1') }, { n: 2, url: 'https://x/y.jpg' }
      ];
      estado.formulario = { titulo: 'Milanesas', carpeta: 'c1', tags: 'borrador', fotos: JSON.stringify(fotos) };
      await tocar('convertir-con-agente');
      const archivos = (mandados[0]?.datos.files ?? []) as File[];
      // El archivo lleva el número con el que el depósito la nombra: la externa
      // no va, y la 3 sigue siendo la 3.
      expect(archivos.map(a => a.name)).toEqual(['foto-1.jpg', 'foto-3.jpg']);
      expect(await Promise.all(archivos.map(a => a.text()))).toEqual(['d1', 'd3']);
      const pedido = mandados[0]?.datos.text ?? '';
      expect(pedido).toContain('`id: f1`');
      expect(pedido).toContain('van 2');
      expect(pedido).toContain('la 1.ª es foto:1 y la 2.ª es foto:3');
    });

    it('una foto que no se pudo leer no va ni se nombra', async () => {
      conShare();
      estado.fotosPerdidas = ['d1'];
      const { abrir, tocar } = await montar();
      await abrir('#/r/f1/editar');
      const fotos = [{ n: 1, url: linkDeFoto('d1') }, { n: 2, url: linkDeFoto('d2') }];
      estado.formulario = { titulo: 'Milanesas', carpeta: 'c1', tags: 'borrador', fotos: JSON.stringify(fotos) };
      await tocar('convertir-con-agente');
      const archivos = (mandados[0]?.datos.files ?? []) as File[];
      expect(archivos.map(a => a.name)).toEqual(['foto-2.jpg']);
      const pedido = mandados[0]?.datos.text ?? '';
      expect(pedido).toContain('va 1');
      expect(pedido).toContain('la 1.ª es foto:2.');
    });

    it('sin la activación del toque, la receta ofrece mandarlo con otro toque, y manda el mismo pedido', async () => {
      const sinToque = async () => { throw Object.assign(new Error('x'), { name: 'NotAllowedError' }); };
      vi.stubGlobal('navigator', { share: sinToque, canShare: () => true });
      const { abrir, tocar, app } = await montar();
      (global.window as unknown as { open: () => null }).open = () => null;
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Focaccia', notas: 'la de la abuela', carpeta: '', tags: 'borrador' };
      await tocar('convertir-con-agente');
      await abrir('#/r/nuevo-1');
      expect(app.innerHTML).toContain('La receta quedó guardada. Tocá para mandarla al agente.');
      expect(app.innerHTML).toContain('data-accion="mandar-al-agente">Mandar al agente');

      // El toque nuevo trae activación: el menú Compartir ahora anda.
      conShare();
      await tocar('mandar-al-agente');
      expect(mandados).toHaveLength(1);
      expect(mandados[0]?.datos.text).toContain('`id: nuevo-1`');
      expect(mandados[0]?.datos.text).toContain('Notas: la de la abuela');
      expect(app.innerHTML).not.toContain('mandar-al-agente');
    });

    it('si el navegador bloquea la ventana de claude.ai, cuenta como no mandado', async () => {
      vi.stubGlobal('navigator', {});
      const { abrir, tocar, app } = await montar();
      const abiertas: string[] = [];
      (global.window as unknown as { open: (u: string) => null }).open = u => { abiertas.push(u); return null; };
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Focaccia', carpeta: '', tags: 'borrador' };
      await tocar('convertir-con-agente');
      expect(abiertas).toHaveLength(1);
      await abrir('#/r/nuevo-1');
      expect(app.innerHTML).toContain('data-accion="mandar-al-agente"');
    });

    it('si vuelve a fallar, el aviso sigue ahí', async () => {
      vi.stubGlobal('navigator', {});
      const { abrir, tocar, app } = await montar();
      (global.window as unknown as { open: () => null }).open = () => null;
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Focaccia', carpeta: '', tags: 'borrador' };
      await tocar('convertir-con-agente');
      await abrir('#/r/nuevo-1');
      await tocar('mandar-al-agente');
      expect(app.innerHTML).toContain('data-accion="mandar-al-agente"');
    });

    it('con el pedido copiado, el aviso se ve en la receta', async () => {
      const copiados: string[] = [];
      vi.stubGlobal('navigator', { clipboard: { writeText: async (t: string) => { copiados.push(t); } } });
      const { abrir, tocar, app } = await montar();
      (global.window as unknown as { open: () => void }).open = () => {};
      await abrir('#/nueva');
      // Unas notas largas no entran en el link a claude.ai: el pedido se copia.
      estado.formulario = { titulo: 'Focaccia', notas: 'x'.repeat(9000), carpeta: '', tags: 'borrador' };
      await tocar('convertir-con-agente');
      expect(copiados).toHaveLength(1);
      await abrir('#/r/nuevo-1');
      expect(app.innerHTML).toContain('Pedido copiado: pegalo en el agente');
      // Es de esa llegada: la próxima pantalla ya no lo trae.
      await abrir('#/');
      await abrir('#/r/nuevo-1');
      expect(app.innerHTML).not.toContain('Pedido copiado');
    });
  });

  describe('la lista de Borradores', () => {
    it('#/borradores dibuja la lista de las recetas con borrador, con el menú y su contador', async () => {
      const original = storeFake.buscar;
      const pedidas: unknown[] = [];
      storeFake.buscar = (filtro?: unknown) => {
        pedidas.push(filtro);
        return [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', categoria: 'Carnes', tags: ['borrador'] })];
      };
      try {
        const { abrir, app } = await montar();
        await abrir('#/borradores');
        expect(pedidas).toContainEqual({ tags: ['borrador'] });
        expect(app.innerHTML).toContain('Milanesas');
        expect(app.innerHTML).toContain('data-accion="abrir-menu"');
        expect(app.innerHTML).not.toContain('data-accion="volver"');
        expect(app.innerHTML).toContain('<span class="n">1</span>');
        expect(app.innerHTML).toContain('<a class="act" href="#/borradores">');
        expect(app.innerHTML).not.toContain('pegar-receta');
        expect(app.innerHTML).toMatch(/<span class="tit">.*Borradores<\/span>/);
      } finally {
        storeFake.buscar = original;
      }
    });

    it('tocar un borrador abre su editor, y volver vuelve a la lista por el historial', async () => {
      const original = storeFake.buscar;
      storeFake.buscar = () => [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', tags: ['borrador'] })];
      try {
        const { abrir, tocar, app, vueltasAtras } = await montar();
        await abrir('#/borradores');
        expect(app.innerHTML).toContain('href="#/r/f1/editar"');
        expect(app.innerHTML).not.toContain('href="#/r/f1"');
        await abrir('#/r/f1/editar');
        expect(app.innerHTML).toContain('data-formulario');
        await tocar('volver');
        expect(vueltasAtras).toHaveLength(1);
      } finally {
        storeFake.buscar = original;
      }
    });

    it('las demás listas siguen abriendo la receta', async () => {
      const original = storeFake.buscar;
      storeFake.buscar = () => [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', tags: ['horno'] })];
      try {
        const { abrir, app } = await montar();
        await abrir('#/t/horno');
        expect(app.innerHTML).toContain('href="#/r/f1"');
        expect(app.innerHTML).not.toContain('/editar"');
      } finally {
        storeFake.buscar = original;
      }
    });

    it('la hamburguesa abre el menú en la lista', async () => {
      const { abrir, tocar, menuDesplegado } = await montar();
      await abrir('#/borradores');
      await tocar('abrir-menu');
      expect(menuDesplegado()).toBe(true);
    });

    it('una ruta vieja de un borrador cae en la lista', async () => {
      const { abrir, app } = await montar();
      await abrir('#/borradores/b1');
      expect(app.innerHTML).toContain('<a class="act" href="#/borradores">');
    });
  });

  describe('las salidas (§1): adónde lleva cada una, con historial y sin él', () => {
    /** Cuántas veces se dibujó una pantalla con esta marca. */
    const dibujos = (pinturas: { html: string }[], marca: string) => pinturas.filter(p => p.html.includes(marca)).length;

    it('el volver del encabezado vuelve una entrada', async () => {
      const { abrir, tocar, vueltasAtras, reemplazos } = await montar();
      await abrir('#/c/Carnes');
      await tocar('volver');
      expect(vueltasAtras).toHaveLength(1);
      expect(reemplazos).toEqual([]);
      expect(global.location.hash).toBe('');
    });

    it('sin historial, el volver del encabezado va al Recetario sin salirse de la app', async () => {
      const { tocar, vueltasAtras, reemplazos, pila } = await montar({ hash: '#/c/Carnes' });
      await tocar('volver');
      expect(vueltasAtras).toEqual([]);
      expect(reemplazos).toEqual(['#/']);
      expect(pila().map(e => e.hash)).toEqual(['#/']);
    });

    it('salir sin guardar vuelve una entrada', async () => {
      estado.formulario = { titulo: 'Milanesas' };
      const { abrir, atras, tocar, app } = await montar();
      await abrir('#/r/f1');
      await abrir('#/r/f1/editar');
      estado.formulario = { titulo: 'Otra cosa' };
      await atras();
      await tocar('salir-sin-guardar');
      expect(global.location.hash).toBe('#/r/f1');
      expect(app.innerHTML).not.toContain('data-formulario');
    });

    it('sin historial, salir sin guardar va al Recetario', async () => {
      estado.formulario = { titulo: 'Milanesas' };
      const { tocar, vueltasAtras, reemplazos } = await montar({ hash: '#/r/f1/editar' });
      estado.formulario = { titulo: 'Otra cosa' };
      await tocar('salir-sin-guardar');
      expect(vueltasAtras).toEqual([]);
      expect(reemplazos).toEqual(['#/']);
    });

    it('guardar una receta que ya existía vuelve a ella', async () => {
      const { abrir, tocar, vueltasAtras, reemplazos } = await montar();
      await abrir('#/r/f1');
      await abrir('#/r/f1/editar');
      estado.formulario = { titulo: 'Milanesas', carpeta: 'c1' };
      await tocar('guardar');
      expect(vueltasAtras).toHaveLength(1);
      expect(reemplazos).toEqual([]);
      expect(global.location.hash).toBe('#/r/f1');
    });

    it('sin historial, guardar una receta que ya existía la pone en lugar del editor', async () => {
      const { tocar, vueltasAtras, reemplazos } = await montar({ hash: '#/r/f1/editar' });
      estado.formulario = { titulo: 'Milanesas', carpeta: 'c1' };
      await tocar('guardar');
      expect(vueltasAtras).toEqual([]);
      expect(reemplazos).toEqual(['#/r/f1']);
    });

    it.each([
      ['con historial', ''],
      ['sin historial', '#/nueva']
    ])('guardar una receta nueva, %s, termina en la receta creada, en lugar del editor', async (_caso, hash) => {
      const { abrir, tocar, vueltasAtras, reemplazos, pila } = await montar({ hash });
      await abrir('#/nueva');
      const antes = pila().length;
      estado.formulario = { titulo: 'Pan', carpeta: '', tags: 'borrador' };
      await tocar('guardar');
      expect(vueltasAtras).toEqual([]);
      expect(reemplazos).toEqual(['#/r/nuevo-1']);
      expect(pila()).toHaveLength(antes);
      expect(global.location.hash).toBe('#/r/nuevo-1');
    });

    it('Convertir editando una receta vuelve a ella; sin historial, la pone en lugar del editor', async () => {
      vi.stubGlobal('navigator', { share: async () => {}, canShare: () => true });
      const con = await montar();
      await con.abrir('#/r/f1');
      await con.abrir('#/r/f1/editar');
      estado.formulario = { titulo: 'Milanesas', carpeta: 'c1', tags: 'borrador' };
      await con.tocar('convertir-con-agente');
      expect(con.vueltasAtras).toHaveLength(1);
      expect(global.location.hash).toBe('#/r/f1');
      limpiarGlobales();
      vi.resetModules();

      vi.stubGlobal('navigator', { share: async () => {}, canShare: () => true });
      const sin = await montar({ hash: '#/r/f1/editar' });
      estado.formulario = { titulo: 'Milanesas', carpeta: 'c1', tags: 'borrador' };
      await sin.tocar('convertir-con-agente');
      expect(sin.vueltasAtras).toEqual([]);
      expect(sin.reemplazos).toEqual(['#/r/f1']);
    });

    it('Convertir una receta nueva termina en la receta creada, en lugar del editor', async () => {
      vi.stubGlobal('navigator', { share: async () => {}, canShare: () => true });
      const { abrir, tocar, vueltasAtras, reemplazos } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Focaccia', carpeta: '', tags: 'borrador' };
      await tocar('convertir-con-agente');
      expect(vueltasAtras).toEqual([]);
      expect(reemplazos).toEqual(['#/r/nuevo-1']);
    });

    it.each([
      ['guardar', 'guardar-categoria'],
      ['borrar', 'borrar-categoria-confirmado']
    ])('%s una categoría vuelve a la lista', async (_caso, accion) => {
      const { abrir, tocar, vueltasAtras, reemplazos } = await montar();
      await abrir('#/categorias');
      await abrir('#/categorias/c1');
      estado.formulario = { nombre: 'Carnes rojas', color: 'carnes', foto: 'catalogo:carnes' };
      await tocar(accion);
      expect(vueltasAtras).toHaveLength(1);
      expect(reemplazos).toEqual([]);
      expect(global.location.hash).toBe('#/categorias');
    });

    it.each([
      ['guardar', 'guardar-categoria'],
      ['borrar', 'borrar-categoria-confirmado']
    ])('sin historial, %s una categoría pone la lista en su lugar', async (_caso, accion) => {
      const { tocar, vueltasAtras, reemplazos } = await montar({ hash: '#/categorias/c1' });
      estado.formulario = { nombre: 'Carnes rojas', color: 'carnes', foto: 'catalogo:carnes' };
      await tocar(accion);
      expect(vueltasAtras).toEqual([]);
      expect(reemplazos).toEqual(['#/categorias']);
    });

    it('borrar desde la receta abierta vuelve a la lista: ni la receta ni el editor quedan atrás', async () => {
      const { abrir, tocar, saltos, reemplazos, pila } = await montar();
      await abrir('#/c/Carnes');
      await abrir('#/r/f1');
      await abrir('#/r/f1/editar');
      await tocar('borrar-confirmado');
      expect(estado.recetasBorradas).toEqual(['f1']);
      expect(saltos).toEqual([-2]);
      expect(reemplazos).toEqual([]);
      expect(pila().map(e => e.hash)).toEqual(['', '#/c/Carnes']);
    });

    it('borrar una receta cuyo editor se abrió desde Borradores vuelve a Borradores', async () => {
      const { abrir, tocar, saltos, vueltasAtras, reemplazos } = await montar();
      await abrir('#/borradores');
      await abrir('#/r/f1/editar');
      await tocar('borrar-confirmado');
      expect(vueltasAtras).toHaveLength(1);
      expect(saltos).toEqual([]);
      expect(reemplazos).toEqual([]);
      expect(global.location.hash).toBe('#/borradores');
    });

    it('sin nada atrás que no sea la receta, borrarla va al Recetario', async () => {
      const { abrir, tocar, saltos, vueltasAtras, reemplazos } = await montar({ hash: '#/r/f1' });
      await abrir('#/r/f1/editar');
      await tocar('borrar-confirmado');
      expect(saltos).toEqual([]);
      expect(vueltasAtras).toEqual([]);
      expect(reemplazos).toEqual(['#/']);
    });

    it('elegir en Agregar al plan vuelve una entrada y dibuja el plan una sola vez', async () => {
      const { abrir, tocar, pinturas, vueltasAtras, reemplazos } = await montar();
      await abrir('#/plan');
      await abrir('#/plan/agregar?dia=2&momento=noche');
      const antes = pinturas.length;
      await tocar('elegir-para-el-plan', { id: 'f1' });
      expect(vueltasAtras).toHaveLength(1);
      expect(reemplazos).toEqual([]);
      expect(global.location.hash).toBe('#/plan');
      expect(dibujos(pinturas.slice(antes), 'data-accion="agregar-al-plan"')).toBe(1);
    });

    it('sin historial, elegir en Agregar al plan pone el plan en su lugar, y lo dibuja una sola vez', async () => {
      const { tocar, pinturas, vueltasAtras, reemplazos } = await montar({ hash: '#/plan/agregar?dia=2&momento=noche' });
      const antes = pinturas.length;
      await tocar('elegir-para-el-plan', { id: 'f1' });
      expect(vueltasAtras).toEqual([]);
      expect(reemplazos).toEqual(['#/plan']);
      expect(dibujos(pinturas.slice(antes), 'data-accion="agregar-al-plan"')).toBe(1);
    });

    it('Salir de la cocina abierta desde la receta vuelve dos entradas', async () => {
      const { abrir, tocar, saltos, reemplazos } = await montar();
      await abrir('#/c/Carnes');
      await abrir('#/r/f1');
      await tocar('cocinar');
      await tocar('salir-cocina');
      expect(saltos).toEqual([-2]);
      expect(reemplazos).toEqual([]);
      expect(global.location.hash).toBe('#/c/Carnes');
    });

    it('Salir de la cocina con la receta abierta desde resultados vuelve a resultados', async () => {
      const { abrir, tocar, saltos, reemplazos } = await montar();
      await abrir('#/buscar?q=mila');
      await abrir('#/r/f1');
      await tocar('cocinar');
      await tocar('salir-cocina');
      expect(saltos).toEqual([-2]);
      expect(reemplazos).toEqual([]);
      expect(global.location.hash).toBe('#/buscar?q=mila');
    });

    it('Salir de una cocina a la que se llegó sin pasar por la receta vuelve a la pantalla de antes', async () => {
      const { abrir, tocar, saltos, vueltasAtras, reemplazos } = await montar();
      await abrir('#/plan');
      await abrir('#/r/f1/cocinar');
      await tocar('salir-cocina');
      expect(saltos).toEqual([]);
      expect(vueltasAtras).toHaveLength(1);
      expect(reemplazos).toEqual([]);
      expect(global.location.hash).toBe('#/plan');
    });

    it('Salir de la cocina abierta por un link directo va a la categoría', async () => {
      const { tocar, reemplazos } = await montar({ hash: '#/r/f1/cocinar' });
      await tocar('salir-cocina');
      expect(reemplazos).toEqual(['#/c/Carnes']);
    });

    it('el chevron de la cocina vuelve una entrada', async () => {
      const { abrir, tocar, vueltasAtras, reemplazos } = await montar();
      await abrir('#/r/f1');
      await tocar('cocinar');
      await tocar('volver-receta');
      expect(vueltasAtras).toHaveLength(1);
      expect(reemplazos).toEqual([]);
      expect(global.location.hash).toBe('#/r/f1');
    });

    it('sin historial, el chevron de la cocina pone la receta en su lugar', async () => {
      const { tocar, vueltasAtras, reemplazos } = await montar({ hash: '#/r/f1/cocinar' });
      await tocar('volver-receta');
      expect(vueltasAtras).toEqual([]);
      expect(reemplazos).toEqual(['#/r/f1']);
    });
  });

  describe('la pregunta de cambios sin guardar, con un destino nuevo', () => {
    it('deshace la entrada del link: la pila queda como antes', async () => {
      estado.formulario = { titulo: 'Milanesas' };
      const { abrir, pila, preguntas, vueltasAtras, empujados, app } = await montar();
      await abrir('#/r/f1');
      await abrir('#/r/f1/editar');
      const antes = pila();
      estado.formulario = { titulo: 'Otra cosa' };
      await abrir('#/plan');
      expect(preguntas.join('')).toContain('¿Salir sin guardar los cambios?');
      expect(vueltasAtras).toHaveLength(1);
      expect(empujados).toEqual([]);
      expect(pila()).toEqual(antes);
      expect(app.innerHTML).toContain('data-formulario');
    });

    it('Seguir editando no deja entradas de más', async () => {
      estado.formulario = { titulo: 'Milanesas' };
      const { abrir, tocar, pila, preguntas } = await montar();
      await abrir('#/r/f1');
      await abrir('#/r/f1/editar');
      const antes = pila();
      estado.formulario = { titulo: 'Otra cosa' };
      await abrir('#/plan');
      await tocar('seguir-editando');
      expect(preguntas).toEqual([]);
      expect(pila()).toEqual(antes);
    });

    it('Salir sin guardar va al destino anotado', async () => {
      estado.formulario = { titulo: 'Milanesas' };
      const { abrir, tocar, pila, app } = await montar();
      await abrir('#/r/f1');
      await abrir('#/r/f1/editar');
      const antes = pila();
      estado.formulario = { titulo: 'Otra cosa' };
      await abrir('#/plan');
      await tocar('salir-sin-guardar');
      expect(global.location.hash).toBe('#/plan');
      expect(pila().map(e => e.hash)).toEqual([...antes.map(e => e.hash), '#/plan']);
      expect(app.innerHTML).not.toContain('data-formulario');
      expect(app.innerHTML).toContain('data-accion="agregar-al-plan"');
    });

    it('en #/nueva con algo compartido, tocar Nueva receta en el menú pregunta', async () => {
      const { abrir, preguntas, app } = await montar();
      await abrir('#/nueva?text=hola');
      await abrir('#/nueva');
      expect(preguntas.join('')).toContain('¿Salir sin guardar los cambios?');
      expect(global.location.hash).toBe('#/nueva?text=hola');
      expect(app.innerHTML).toContain('data-formulario');
    });
  });

  describe('lo que se abre en la misma pantalla se cierra con el atrás (§1)', () => {
    const DEPOSITO = [
      '---', 'titulo: Milanesas', '---', '',
      '## Fotos', '', '- 1: https://ejemplo/1.jpg', '- 2: https://ejemplo/2.jpg', ''
    ].join('\n');
    const formularioConFotos = () => ({
      titulo: 'Milanesas', carpeta: 'c1', foto: '',
      fotos: JSON.stringify([{ n: 1, url: 'https://ejemplo/1.jpg' }, { n: 2, url: 'https://ejemplo/2.jpg' }])
    });
    const capa = (state: unknown): unknown => (state as { capa?: unknown } | null)?.capa;

    it('el menú, en el teléfono: el atrás lo cierra sin cambiar de pantalla', async () => {
      const { abrir, tocar, atras, menuDesplegado, pila, pinturas } = await montar();
      await abrir('#/plan');
      await tocar('abrir-menu');
      expect(capa(pila().at(-1)?.state)).toBe('menu');
      const antes = pinturas.length;
      await atras();
      expect(menuDesplegado()).toBe(false);
      expect(global.location.hash).toBe('#/plan');
      expect(pila().map(e => e.hash)).toEqual(['', '#/plan']);
      expect(pinturas.length).toBe(antes);
    });

    it('el menú abierto por el gesto también es una capa; cerrarlo con el velo la consume', async () => {
      const { abrir, tocar, deslizar, pila, vueltasAtras } = await montar();
      await abrir('#/plan');
      await deslizar({ desde: 30, hasta: 220 });
      expect(capa(pila().at(-1)?.state)).toBe('menu');
      await tocar('cerrar-menu');
      expect(vueltasAtras).toHaveLength(1);
      expect(pila().map(e => [e.hash, capa(e.state)])).toEqual([['', undefined], ['#/plan', undefined]]);
    });

    it('un destino tocado con el menú abierto no deja la capa en el historial', async () => {
      const { abrir, tocar, tocarDestino, pila, app } = await montar();
      await abrir('#/plan');
      await tocar('abrir-menu');
      expect(await tocarDestino('#/ajustes')).toBe(true);
      expect(global.location.hash).toBe('#/ajustes');
      expect(pila().map(e => [e.hash, capa(e.state)])).toEqual([['', undefined], ['#/plan', undefined], ['#/ajustes', undefined]]);
      expect(app.innerHTML).toContain('Reindexar');
      expect(app.innerHTML).toContain('<nav class="lat">');
    });

    it('un link que no pasa por el menú, con el menú abierto y cambios: pregunta y no deja la capa', async () => {
      const { abrir, tocar, pila, preguntas, pinturas, saltos } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Pan de campo' };
      await tocar('abrir-menu');
      const antes = pinturas.length;
      // La barra del navegador: `popstate` y `hashchange`, sin pasar por la app.
      await abrir('#/plan');
      expect(preguntas.join('')).toContain('¿Salir sin guardar los cambios?');
      expect(global.location.hash).toBe('#/nueva');
      expect(saltos).toEqual([-2]);
      expect(pila().map(e => [e.hash, capa(e.state)])).toEqual([['', undefined], ['#/nueva', undefined]]);
      // El `popstate` del link no redibuja: el formulario sigue con lo escrito.
      expect(pinturas.length).toBe(antes);
    });

    it('desde 900 px, un destino del lateral fijo con la categoría del plan abierta no deja su capa', async () => {
      const { abrir, tocar, tocarDestino, pila, app } = await montar({ ancha: true });
      await abrir('#/plan');
      await abrir('#/plan/agregar?dia=1&momento=noche');
      await tocar('elegir-categoria-plan', { nombre: 'Carnes' });
      expect(await tocarDestino('#/ajustes')).toBe(true);
      expect(global.location.hash).toBe('#/ajustes');
      expect(pila().map(e => [e.hash, capa(e.state)])).toEqual([
        ['', undefined], ['#/plan', undefined], ['#/plan/agregar?dia=1&momento=noche', undefined], ['#/ajustes', undefined]
      ]);
      expect(app.innerHTML).toContain('Reindexar');
    });

    it('el menú abierto al pasar la ventana a 900 px se cierra y consume su entrada', async () => {
      const { abrir, tocar, cambiarAncho, menuDesplegado, pila, vueltasAtras } = await montar();
      await abrir('#/plan');
      await tocar('abrir-menu');
      await cambiarAncho(true);
      expect(menuDesplegado()).toBe(false);
      expect(vueltasAtras).toHaveLength(1);
      expect(pila().map(e => [e.hash, capa(e.state)])).toEqual([['', undefined], ['#/plan', undefined]]);
      // Achicarla de nuevo no lo abre ni toca el historial.
      await cambiarAncho(false);
      expect(menuDesplegado()).toBe(false);
      expect(vueltasAtras).toHaveLength(1);
    });

    it('el visor de la receta: el atrás lo cierra; la cruz consume su entrada', async () => {
      estado.md = DEPOSITO;
      const { abrir, tocar, atras, app, pila } = await montar();
      await abrir('#/r/f1');
      await tocar('ver-foto-receta', { n: '1' });
      expect(app.innerHTML).toContain('class="visor"');
      await atras();
      expect(app.innerHTML).not.toContain('class="visor"');
      expect(app.innerHTML).toContain('class="rec-tit"');
      expect(pila()).toHaveLength(2);

      await tocar('ver-foto-receta', { n: '1' });
      await tocar('cerrar-visor');
      expect(app.innerHTML).not.toContain('class="visor"');
      expect(pila().map(e => capa(e.state))).toEqual([undefined, undefined]);
    });

    it('la ficha de compartir: el atrás la cierra; cancelar consume su entrada', async () => {
      const { abrir, tocar, atras, app, pila } = await montar();
      await abrir('#/r/f1');
      await tocar('compartir');
      expect(app.innerHTML).toContain('hoja-compartir');
      await atras();
      expect(app.innerHTML).not.toContain('hoja-compartir');
      expect(global.location.hash).toBe('#/r/f1');

      await tocar('compartir');
      await tocar('cerrar-compartir');
      expect(pila().map(e => capa(e.state))).toEqual([undefined, undefined]);
    });

    it.each([
      ['la receta', '#/r/f1', 'compartir'],
      ['la lista de compras', '#/plan/compras', 'compartir-compras']
    ])('en %s, si el atrás cerró la ficha mientras se copiaba, no vuelve a abrirse', async (_, hash, accion) => {
      let copiar!: () => void;
      vi.stubGlobal('navigator', { clipboard: { writeText: () => new Promise<void>(r => { copiar = r; }) } });
      const { abrir, tocar, tocarSinCerrar, atras, app, pila } = await montar();
      await abrir(hash);
      await tocar(accion);
      const copiando = tocarSinCerrar('compartir-texto');
      await esperar();
      await atras();
      expect(app.innerHTML).not.toContain('hoja-compartir');
      copiar();
      await copiando;
      await esperar();
      expect(app.innerHTML).not.toContain('hoja-compartir');
      expect(pila().map(e => capa(e.state))).toEqual([undefined, undefined]);
    });

    it('las fichas de fotos del editor: el atrás las cierra sin tocar el formulario; el velo consume su entrada', async () => {
      estado.md = DEPOSITO;
      const { abrir, tocar, atras, app, preguntas, pila } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();
      const antes = app.innerHTML;

      await tocar('acciones-foto', { n: '1' });
      // Otra ficha encima toma el lugar de la anterior: una sola entrada.
      await tocar('abrir-portada');
      expect(pila().map(e => capa(e.state))).toEqual([undefined, undefined, 'ficha-foto']);
      await atras();
      expect(preguntas.some(h => h.includes('hoja-foto'))).toBe(false);
      expect(app.innerHTML).toBe(antes);
      expect(global.location.hash).toBe('#/r/f1/editar');

      await tocar('acciones-foto', { n: '1' });
      await tocar('cerrar-ficha-foto');
      expect(pila().map(e => capa(e.state))).toEqual([undefined, undefined]);
    });

    it('el visor abierto desde una ficha toma su lugar, y el atrás lo cierra', async () => {
      estado.md = DEPOSITO;
      const { abrir, tocar, atras, preguntas, pila } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = formularioConFotos();
      await tocar('acciones-foto', { n: '2' });
      await tocar('ver-foto-receta', { n: '2' });
      expect(pila().map(e => capa(e.state))).toEqual([undefined, undefined, 'visor']);
      await atras();
      expect(preguntas.some(h => h.includes('class="visor"'))).toBe(false);
      expect(pila()).toHaveLength(2);
    });

    it('la categoría de Agregar al plan: el atrás vuelve a la grilla; el chevron consume su entrada', async () => {
      const { abrir, tocar, atras, app, pila } = await montar();
      await abrir('#/plan');
      await abrir('#/plan/agregar?dia=1&momento=noche');
      await tocar('elegir-categoria-plan', { nombre: 'Carnes' });
      expect(app.innerHTML).not.toContain('data-accion="elegir-categoria-plan"');
      await atras();
      expect(app.innerHTML).toContain('data-accion="elegir-categoria-plan" data-nombre="Carnes"');
      expect(global.location.hash).toBe('#/plan/agregar?dia=1&momento=noche');

      await tocar('elegir-categoria-plan', { nombre: 'Carnes' });
      await tocar('volver-categorias-plan');
      expect(app.innerHTML).toContain('data-accion="elegir-categoria-plan" data-nombre="Carnes"');
      expect(pila().map(e => capa(e.state))).toEqual([undefined, undefined, undefined]);
    });

    it('elegir una receta con la categoría abierta vuelve al plan sin pasar por la capa', async () => {
      const { abrir, tocar, pila, app } = await montar();
      await abrir('#/plan');
      await abrir('#/plan/agregar?dia=1&momento=noche');
      await tocar('elegir-categoria-plan', { nombre: 'Carnes' });
      await tocar('elegir-para-el-plan', { id: 'f1' });
      expect(global.location.hash).toBe('#/plan');
      expect(pila().map(e => e.hash)).toEqual(['', '#/plan']);
      expect(app.innerHTML).toContain('data-accion="agregar-al-plan"');
    });
  });

  it('un link tocado mientras se escribe deshace la navegación, y la pila queda igual', async () => {
    const original = storeFake.guardar;
    let soltar!: () => void;
    storeFake.guardar = () => new Promise<void>(r => { soltar = r; });
    try {
      const { abrir, tocar, pila, app } = await montar();
      await abrir('#/r/f1');
      await abrir('#/r/f1/editar');
      estado.formulario = { titulo: 'Milanesas' };
      const antes = pila();
      const guardando = tocar('guardar');
      await esperar();
      await abrir('#/plan');
      expect(global.location.hash).toBe('#/r/f1/editar');
      expect(pila()).toEqual(antes);
      expect(app.innerHTML).toContain('data-formulario');
      soltar();
      await guardando;
    } finally {
      storeFake.guardar = original;
    }
  });

  describe('el arranque dibuja una sola vez', () => {
    it('en #/', async () => {
      const { pinturas } = await montar({ hash: '#/' });
      expect(pinturas.filter(p => p.html.includes('class="grilla"'))).toHaveLength(1);
    });

    it('en #/ después de reindexar', async () => {
      estado.reconstruirAlArrancar = true;
      const conReconstruir = storeFake as typeof storeFake & {
        reconstruir?: () => Promise<{ ignorados: string[]; sinBorrador: string[] }>;
      };
      conReconstruir.reconstruir = async () => ({ ignorados: [], sinBorrador: [] });
      try {
        const { pinturas } = await montar({ hash: '#/' });
        expect(pinturas.filter(p => p.html.includes('class="grilla"'))).toHaveLength(1);
      } finally {
        delete conReconstruir.reconstruir;
      }
    });

    it('en un hash que redirige a la carpeta', async () => {
      estado.eligiendo = [{ id: 'r1', name: 'Recetario' }];
      const { pinturas } = await montar({ hash: '#/ajustes' });
      expect(global.location.hash).toBe('#/carpeta');
      expect(pinturas.filter(p => p.html.includes('Tus recetas en Drive'))).toHaveLength(1);
    });
  });

  describe('el registro del service worker', () => {
    // `main.ts` no es el script de entrada: `inicio.ts` lo carga con
    // `import()`, así que puede evaluarse después de `load`. Sin este chequeo,
    // el `addEventListener('load', …)` no dispara nunca y el SW no se registra.
    it('con el documento ya completo, se registra sin esperar `load`', async () => {
      const registros: string[] = [];
      vi.stubGlobal('navigator', { serviceWorker: { register: async (ruta: string) => { registros.push(ruta); return {}; } } });
      await montar({ readyState: 'complete' });
      expect(registros).toEqual(['./sw.js']);
    });

    it('con el documento todavía cargando, se registra recién al disparar `load`', async () => {
      const registros: string[] = [];
      vi.stubGlobal('navigator', { serviceWorker: { register: async (ruta: string) => { registros.push(ruta); return {}; } } });
      const { dispararLoad } = await montar({ readyState: 'loading' });
      expect(registros).toEqual([]);
      await dispararLoad();
      expect(registros).toEqual(['./sw.js']);
    });
  });
});
