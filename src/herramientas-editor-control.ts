/**
 * Las acciones del botón de herramientas del editor: abrir la capa, elegir una
 * herramienta, las ruedas de la cuenta y *Poner*. Escribe en el campo por
 * `CamposDelEditor`, como la foto: el formulario no se redibuja nunca.
 *
 * Abrir la capa le saca el foco al campo: con el teclado abierto, la capa no
 * se ve. Antes se guarda lo seleccionado, que *Poner* envuelve en la marca, y
 * al cerrar el foco vuelve al campo (C04.3d.3).
 */
import type { SeccionDeAcciones } from './acciones.js';
import type { CamposDelEditor } from './fotos-control.js';
import { escribirMarca, agregarAlFinal, envolver, duracionDeTexto } from './marcas.js';
import { aMs, girar, esRueda, DURACION_POR_DEFECTO, type Duracion } from './temporizadores.js';
import { HERRAMIENTAS_DE_LINEA, renderHerramientasDeLinea, type ContextoDeLinea } from './ui/herramientas-editor.js';
import type { FotoDeReceta } from './tipos.js';

export interface PantallaDeHerramientas {
  abrirFicha(html: string): void;
  cerrarFicha(): void;
  /** Lo escrito en el nombre de la marca. */
  etiquetaEscrita(): string;
  /** Escribe los valores de las ruedas y habilita *Poner*, sin reabrir la ficha. */
  pintarRuedas(r: Duracion): void;
  /** Lo seleccionado en el campo de esa sección, o `null` si no es el que tiene el foco. */
  seleccion(seccion: string): { desde: number; hasta: number } | null;
  /** Le saca el foco al campo de esa sección, y con eso se va el teclado. */
  soltarFoco(seccion: string): void;
  /** Le devuelve el foco al campo de esa sección, con esa selección o ese cursor. */
  devolverFoco(seccion: string, desde: number, hasta: number): void;
}

/** Lo que había en el campo cuando se abrió la capa: el texto, para saber si cambió, y la selección. */
interface Abierta { seccion: string; texto: string; desde: number; hasta: number }

const aDuracion = (ms: number): Duracion => {
  const t = Math.floor(ms / 1000);
  return { h: Math.floor(t / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
};

/** Dónde termina una línea del texto: ahí queda el cursor después de una marca puesta al final. */
const finDeLinea = (texto: string, linea: number): number =>
  texto.split('\n').slice(0, linea + 1).reduce((n, l) => n + l.length + 1, 0) - 1;

export function crearHerramientasEditor({ campos, fotos, titulo, pantalla }: {
  campos: CamposDelEditor;
  fotos: () => FotoDeReceta[];
  /** El título escrito en el formulario: con él arranca el nombre de la marca. */
  titulo: () => string;
  pantalla: PantallaDeHerramientas;
}): { acciones: SeccionDeAcciones; alCerrarCapa(): void } {
  /** Las ruedas de la cuenta: cada vez que se abre, desde 0:10:00. */
  let ruedas: Duracion = DURACION_POR_DEFECTO;
  let abierta: Abierta | null = null;

  /** Lo seleccionado al abrir la capa, si sigue siendo lo que hay en el campo. */
  const seleccionada = (seccion: string, texto: string): Abierta | null =>
    abierta && abierta.seccion === seccion && abierta.texto === texto && abierta.desde < abierta.hasta ? abierta : null;

  const contexto = (boton: HTMLElement): ContextoDeLinea => ({
    seccion: boton.dataset['seccion'] ?? '',
    linea: Number(boton.dataset['linea'] ?? 0),
    fotos: fotos(),
    ruedas,
    etiqueta: titulo().trim()
  });

  const girarRueda = (paso: 1 | -1) => (boton: HTMLElement): void => {
    const r = boton.dataset['rueda'];
    if (!esRueda(r)) return;
    ruedas = girar(ruedas, r, paso);
    pantalla.pintarRuedas(ruedas);
  };

  return {
    acciones: {
      'abrir-herramientas-linea': (boton) => {
        const seccion = boton.dataset['seccion'] ?? '';
        const texto = campos.leer(seccion);
        const sel = pantalla.seleccion(seccion);
        abierta = texto !== null && sel ? { seccion, texto, ...sel } : null;
        pantalla.soltarFoco(seccion);
        pantalla.abrirFicha(renderHerramientasDeLinea(contexto(boton)));
      },
      'elegir-herramienta-linea': (boton) => {
        const h = HERRAMIENTAS_DE_LINEA.find(x => x.id === boton.dataset['herramienta']);
        if (!h) return;
        // Lo seleccionado puede decir cuánto dura: «50 minutos», «1,5 horas».
        const sel = seleccionada(boton.dataset['seccion'] ?? '', campos.leer(boton.dataset['seccion'] ?? '') ?? '');
        const propuesta = sel ? duracionDeTexto(sel.texto.slice(sel.desde, sel.hasta)) : null;
        ruedas = propuesta === null ? DURACION_POR_DEFECTO : aDuracion(propuesta);
        const ctx = contexto(boton);
        if (h.deshabilitada?.(ctx)) return;
        pantalla.abrirFicha(h.paso(ctx));
      },
      'marca-rueda-mas': girarRueda(1),
      'marca-rueda-menos': girarRueda(-1),
      'poner-marca': (boton) => {
        const tipo = boton.dataset['tipo'];
        if (tipo !== 'cuenta' && tipo !== 'cronometro') return;
        const duracion = tipo === 'cuenta' ? aMs(ruedas) : null;
        if (tipo === 'cuenta' && !(duracion && duracion > 0)) return;
        const seccion = boton.dataset['seccion'] ?? '';
        const texto = campos.leer(seccion);
        if (texto === null) return;
        const datos = { tipo, duracion, etiqueta: pantalla.etiquetaEscrita() } as const;
        const sel = seleccionada(seccion, texto);
        const linea = Number(boton.dataset['linea'] ?? 0);
        const envuelta = sel ? envolver(texto, sel.desde, sel.hasta, datos) : null;
        const nuevo = envuelta?.texto ?? agregarAlFinal(texto, linea, escribirMarca(datos));
        const cursor = envuelta?.cursor ?? finDeLinea(nuevo, linea);
        campos.escribir(seccion, nuevo);
        // Ya no hay selección que devolver: el foco vuelve después de la marca.
        abierta = null;
        pantalla.cerrarFicha();
        pantalla.devolverFoco(seccion, cursor, cursor);
      }
    },
    alCerrarCapa() {
      if (!abierta) return;
      const { seccion, desde, hasta } = abierta;
      abierta = null;
      pantalla.devolverFoco(seccion, desde, hasta);
    }
  };
}
