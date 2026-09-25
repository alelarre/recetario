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
 */
import { siguienteNumero, sacarReferencias, ponerEn, linkDeFoto } from './fotos-receta.js';
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
  /** Lo que el depósito cambió respecto del `.md` que el editor abrió. */
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
    // heredar la subida de ésta.
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
        sacadas: base.fotos.map(f => f.url).filter(url => !quedan.has(url)),
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
    }
  };
}
