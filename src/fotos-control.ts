/**
 * El depósito de fotos del editor y su único dueño: las fotos con su número,
 * la portada, las nuevas en memoria —el blob y su object URL— y las que un
 * intento de guardar ya subió.
 *
 * Los campos ocultos del formulario (`fotos` y `foto`) se escriben desde acá y
 * nunca a mano: viajan en el formulario para que agregar, sacar o elegir
 * portada cuente como cambio sin guardar (C04.1.1), pero lo que vale es el
 * estado. Cada cambio pasa por `cambiar`, que actualiza el estado, reescribe
 * los ocultos y avisa una sola vez: quien lo usa redibuja la fila y la
 * portada, acomoda el botón de poner foto y completa las imágenes.
 *
 * Vive lo que dura el editor: las fotos compartidas se suman antes de que el
 * editor se dibuje, y al cambiar de pantalla se vacía.
 *
 * Las acciones del depósito (`accionesDeFotos`) viven acá también; lo que es
 * del DOM —las fichas, el botón de poner foto, el aviso— se lo pasa la pantalla.
 */
import { siguienteNumero, sacarReferencias, ponerEn, linkDeFoto } from './fotos-receta.js';
import { renderAccionesFoto, renderElegirFoto, renderSelectorPortada, renderFotoPorUrl } from './ui/editor.js';
import type { SeccionDeAcciones } from './acciones.js';
import type { CambiosDeFotos, FotoDeReceta, Receta } from './tipos.js';

/** Las cinco secciones de texto del editor, las que pueden nombrar una foto. */
export const SECCIONES = ['descripcion', 'ingredientes', 'preparacion', 'variaciones', 'notas'] as const;

/** Los campos del formulario del editor, por su `name`. Sin editor dibujado, no hay ninguno. */
export interface CamposDelEditor {
  leer(nombre: string): string | null;
  escribir(nombre: string, valor: string): void;
}

export interface DependenciasFotos {
  /** Achica una foto antes de guardarla; rechaza si el navegador no la decodifica. */
  achicar: (foto: Blob) => Promise<Blob>;
  crearUrl: (foto: Blob) => string;
  soltarUrl: (url: string) => void;
  campos: CamposDelEditor;
  /** Lo que se redibuja después de cada cambio, con los ocultos ya escritos. */
  alCambiar: () => void;
}

export interface FotosControl {
  /** El depósito y la portada que se acaban de dibujar. No avisa: el formulario ya los tiene. */
  cargar(receta: Pick<Receta, 'fotos' | 'foto'>): void;
  fotos(): FotoDeReceta[];
  /** El valor crudo de la cabecera: `foto:N`, una URL, o vacío. */
  portada(): string;
  /** El object URL de una foto nueva, que todavía no está en Drive. */
  urlEnMemoria(n: number): string | undefined;
  /** Achica, numera y guarda. Devuelve si alguna no se pudo leer. */
  sumarFotos(fotos: readonly Blob[]): Promise<boolean>;
  /** Una foto que no se pudo bajar entra como link externo, sin blob. */
  sumarLink(url: string): void;
  /** Saca una foto del depósito, de todo el texto que la nombraba y de la portada. */
  sacar(n: number): void;
  ponerPortada(n: number): void;
  sacarPortada(): void;
  /** Pone `![](foto:N)` en una línea de una sección. */
  ponerEn(seccion: string, linea: number, n: number): void;
  /** La receta con el link de cada foto que un intento anterior ya subió. */
  conSubidas(receta: Receta): Receta;
  /** Lo que el depósito cambió respecto del `.md` que el editor abrió, con las subidas que se sacaron. */
  cambiosDeFotos(nueva: Receta, base: Receta): CambiosDeFotos;
  vaciar(): void;
}

export function crearFotosControl({ achicar, crearUrl, soltarUrl, campos, alCambiar }: DependenciasFotos): FotosControl {
  let fotos: FotoDeReceta[] = [];
  let portada = '';
  const nuevas = new Map<number, Blob>();
  const urls = new Map<number, string>();
  /**
   * El id de Drive de cada foto que ya se subió en un intento que falló
   * después: reintentar no la vuelve a subir.
   */
  const subidas = new Map<number, string>();
  /**
   * Los ids de Drive de las que un intento subió y después se sacaron del
   * depósito: no son de ninguna receta, y el guardado siguiente las manda a la
   * papelera con las demás sacadas. Si no, quedarían en `_fotos/` sin nadie
   * que las nombre.
   */
  const huerfanas = new Set<string>();

  function cambiar(nuevasFotos: FotoDeReceta[], nuevaPortada: string): void {
    fotos = nuevasFotos;
    portada = nuevaPortada;
    campos.escribir('fotos', JSON.stringify(fotos));
    campos.escribir('foto', portada);
    alCambiar();
  }

  /** Olvida una foto nueva: su blob, su object URL y lo que se haya subido de ella. */
  function olvidar(n: number): void {
    const url = urls.get(n);
    if (url) soltarUrl(url);
    urls.delete(n);
    nuevas.delete(n);
    // Su número puede volver a tocarle a la próxima que se sume: no puede
    // heredar la subida de ésta, que queda huérfana.
    const subida = subidas.get(n);
    if (subida) huerfanas.add(subida);
    subidas.delete(n);
  }

  return {
    cargar(receta) {
      fotos = receta.fotos;
      portada = receta.foto ?? '';
    },
    fotos: () => fotos,
    portada: () => portada,
    urlEnMemoria: n => urls.get(n),

    async sumarFotos(archivos) {
      let deposito = fotos;
      let noSeLeyo = false;
      for (const archivo of archivos) {
        let blob: Blob;
        try {
          blob = await achicar(archivo);
        } catch (err) {
          console.error(err);
          noSeLeyo = true;
          continue;
        }
        // Cada una toma el número siguiente: ninguno del depósito se reusa.
        const n = siguienteNumero(deposito);
        deposito = [...deposito, { n, url: '' }];
        nuevas.set(n, blob);
        urls.set(n, crearUrl(blob));
      }
      cambiar(deposito, portada);
      return noSeLeyo;
    },

    sumarLink(url) {
      cambiar([...fotos, { n: siguienteNumero(fotos), url }], portada);
    },

    sacar(n) {
      // El texto primero: la fila se redibuja con el uso de las que quedaron.
      for (const seccion of SECCIONES) {
        const texto = campos.leer(seccion);
        if (texto !== null) campos.escribir(seccion, sacarReferencias(texto, n));
      }
      olvidar(n);
      cambiar(fotos.filter(f => f.n !== n), portada === `foto:${n}` ? '' : portada);
    },

    ponerPortada: n => { cambiar(fotos, `foto:${n}`); },
    sacarPortada: () => { cambiar(fotos, ''); },

    ponerEn(seccion, linea, n) {
      const texto = campos.leer(seccion);
      if (texto !== null) campos.escribir(seccion, ponerEn(texto, linea, n));
      // El depósito no cambia, pero la marca de uso de la foto sí.
      cambiar(fotos, portada);
    },

    conSubidas: receta => ({
      ...receta,
      fotos: receta.fotos.map(f => {
        const id = f.url ? undefined : subidas.get(f.n);
        return id ? { ...f, url: linkDeFoto(id) } : f;
      })
    }),

    cambiosDeFotos(nueva, base) {
      const aSubir = new Map<number, Blob>();
      for (const f of nueva.fotos) {
        const blob = f.url ? undefined : nuevas.get(f.n);
        if (blob) aSubir.set(f.n, blob);
      }
      const quedan = new Set(nueva.fotos.map(f => f.url));
      return {
        nuevas: aSubir,
        sacadas: [
          ...base.fotos.map(f => f.url).filter(url => !quedan.has(url)),
          ...[...huerfanas].map(linkDeFoto).filter(url => !quedan.has(url))
        ],
        // Cada subida se anota apenas el store avisa, para el reintento.
        alSubir: (n, id) => { subidas.set(n, id); }
      };
    },

    vaciar() {
      // Los object URL no se sueltan acá: son de la pantalla, y los suelta
      // `imagenes.soltarImagenes` con los demás.
      fotos = [];
      portada = '';
      nuevas.clear();
      urls.clear();
      subidas.clear();
      huerfanas.clear();
    }
  };
}

export const NO_SE_LEYO_UNA_FOTO = 'No se pudo leer una de las fotos.';
const NO_ES_UNA_FOTO = 'Esa URL no es una foto.';
const SOLO_HTTPS = 'La dirección tiene que empezar con https://.';
const QUEDA_COMO_LINK =
  'No se pudo traer la foto —el sitio no lo permite o no hay conexión—: ' +
  'queda como link, y si el sitio la borra se pierde.';

/**
 * La forma que tiene que tener una dirección para poder ser una línea del
 * depósito, **tal cual la parsea `fotos-receta.ts`**: esquema en minúsculas y
 * ni un espacio. Una que no la cumpla se escribiría igual y al releer el `.md`
 * dejaría toda la sección `## Fotos` como sección ajena: la receta perdería
 * sus fotos (C05.1.5).
 */
const URL_DE_FOTO = /^https?:\/\/\S+$/;

/**
 * La dirección con el esquema en minúsculas, que es lo único que se normaliza:
 * el resto distingue mayúsculas y cambiarlo daría otra foto. El teclado del
 * teléfono manda `Https://` solo, y quien lo escribió quiso lo evidente.
 */
const conEsquemaEnMinuscula = (url: string): string =>
  url.replace(/^[A-Za-z]+:\/\//, e => e.toLowerCase());

/** Lo que devolvió una dirección: la foto, algo que no es una foto, o nada. */
export type FotoTraida = { que: 'foto'; blob: Blob } | { que: 'no-es-foto' } | { que: 'no-se-pudo' };

/** Lo que las acciones de fotos necesitan de la pantalla del editor, que el controlador no toca. */
export interface PantallaDeFotos {
  /** Abre una ficha al pie del editor, en lugar de la que esté abierta: es una capa. */
  abrirFicha(html: string): void;
  /** Cierra la ficha abierta y consume su capa. */
  cerrarFicha(): void;
  /** Pone el botón de poner foto en la línea del cursor, o lo saca. */
  acomodarBoton(): void;
  /** La dirección escrita en la ficha de *Por URL*. */
  urlEscrita(): string;
  /** Baja la foto de una dirección. */
  traer(url: string): Promise<FotoTraida>;
  /** Una espera del velo (R8). */
  esperar<T>(tarea: () => Promise<T>): Promise<T>;
  /** El aviso arriba del formulario; `''` lo saca. */
  avisar(texto: string): void;
}

/**
 * *Traer* en la ficha de *Por URL*. La foto bajada entra al depósito por el
 * mismo camino que una de la cámara. Lo que no se pudo bajar entra como link
 * externo —el `.md` de la receta acepta una URL ajena como cualquier otra—, y
 * lo que no es una foto no entra y deja la ficha abierta con lo escrito: el
 * aviso vuelve con lo que se escribió y no con lo normalizado (R1).
 */
async function traerPorUrl(fotos: FotosControl, pantalla: PantallaDeFotos, escrita: string): Promise<void> {
  // Cada intento empieza sin el aviso del anterior: dos avisos a la vez no
  // dicen cuál es el de ahora.
  pantalla.avisar('');
  const url = conEsquemaEnMinuscula(escrita);
  const reabrir = (mensaje: string): void => { pantalla.abrirFicha(renderFotoPorUrl(escrita, mensaje)); };
  // Lo que ni siquiera tiene forma de dirección no se pide: es lo único que se
  // puede escribir como línea del depósito (C05.1.5).
  if (!URL_DE_FOTO.test(url)) return reabrir(NO_ES_UNA_FOTO);
  // Desde Pages, una `http://` es contenido mixto: el pedido falla siempre y
  // la imagen tampoco cargaría después. Entra como link y no sirve de nada.
  if (url.startsWith('http://')) return reabrir(SOLO_HTTPS);
  // Bajarla y achicarla son una sola espera.
  const resultado = await pantalla.esperar(async () => {
    const traida = await pantalla.traer(url);
    if (traida.que !== 'foto') return traida.que;
    return await fotos.sumarFotos([traida.blob]) ? 'no-se-leyo' : 'sumada';
  });
  if (resultado === 'no-es-foto') return reabrir(NO_ES_UNA_FOTO);
  if (resultado === 'no-se-leyo') return reabrir(NO_SE_LEYO_UNA_FOTO);
  if (resultado === 'no-se-pudo') {
    fotos.sumarLink(url);
    pantalla.cerrarFicha();
    // No es un error del usuario: la foto entró, y el aviso dice con qué.
    return pantalla.avisar(QUEDA_COMO_LINK);
  }
  pantalla.cerrarFicha();
}

/**
 * Las acciones del depósito en el editor: las fichas al pie, la portada,
 * traer una por URL, ponerla en una línea y sacarla.
 */
export const accionesDeFotos = (fotos: FotosControl, pantalla: PantallaDeFotos): SeccionDeAcciones => ({
  'cerrar-ficha-foto': () => {
    pantalla.cerrarFicha();
    // Tocar el velo puede haberle sacado el foco al campo: el botón de la
    // foto no puede quedar colgado de un campo que ya no lo tiene.
    pantalla.acomodarBoton();
  },
  'acciones-foto': (boton) => {
    pantalla.abrirFicha(renderAccionesFoto(Number(boton.dataset['n'] ?? '')));
  },
  'abrir-portada': () => {
    pantalla.abrirFicha(renderSelectorPortada(fotos.fotos(), fotos.portada() || null));
  },
  'elegir-portada': (boton) => {
    // Sin número no hay foto que poner: `foto:0` no nombraría ninguna.
    const n = boton.dataset['n'];
    if (n === undefined) return;
    fotos.ponerPortada(Number(n));
    pantalla.cerrarFicha();
  },
  'sin-portada': () => { fotos.sacarPortada(); pantalla.cerrarFicha(); },
  // El aviso de un intento anterior se va al traer la próxima.
  'abrir-foto-url': () => { pantalla.abrirFicha(renderFotoPorUrl()); },
  'traer-foto-url': async () => {
    const url = pantalla.urlEscrita().trim();
    if (url) await traerPorUrl(fotos, pantalla, url);
  },
  'abrir-elegir-foto': (boton) => {
    // La sección y la línea son las que tenía el botón: las escribió quien lo
    // acomodó, con el cursor donde estaba.
    pantalla.abrirFicha(renderElegirFoto(
      fotos.fotos(), boton.dataset['seccion'] ?? '', Number(boton.dataset['linea'] ?? 0)
    ));
  },
  'poner-en': (boton) => {
    // Ahora está en el texto, y su miniatura lo dice.
    fotos.ponerEn(boton.dataset['seccion'] ?? '', Number(boton.dataset['linea'] ?? 0), Number(boton.dataset['n'] ?? 0));
    pantalla.cerrarFicha();
  },
  'sacar-foto-editor': (boton) => {
    // La foto se va del depósito, de la portada y de todo el texto que la nombraba.
    fotos.sacar(Number(boton.dataset['n'] ?? 0));
    pantalla.cerrarFicha();
  }
});
