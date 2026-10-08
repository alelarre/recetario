/**
 * Las acciones del botón de herramientas del editor: abrir la capa, elegir una
 * herramienta, las ruedas de la cuenta y *Poner*. Escribe en el campo por
 * `CamposDelEditor`, como la foto: el formulario no se redibuja nunca.
 */
import type { SeccionDeAcciones } from './acciones.js';
import type { CamposDelEditor } from './fotos-control.js';
import { escribirMarca, agregarAlFinal } from './marcas.js';
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
}

export function crearHerramientasEditor({ campos, fotos, pantalla }: {
  campos: CamposDelEditor;
  fotos: () => FotoDeReceta[];
  pantalla: PantallaDeHerramientas;
}): { acciones: SeccionDeAcciones } {
  /** Las ruedas de la cuenta: cada vez que se abre, desde 0:10:00. */
  let ruedas: Duracion = DURACION_POR_DEFECTO;

  const contexto = (boton: HTMLElement): ContextoDeLinea => ({
    seccion: boton.dataset['seccion'] ?? '',
    linea: Number(boton.dataset['linea'] ?? 0),
    fotos: fotos(),
    ruedas
  });

  const girarRueda = (paso: 1 | -1) => (boton: HTMLElement): void => {
    const r = boton.dataset['rueda'];
    if (!esRueda(r)) return;
    ruedas = girar(ruedas, r, paso);
    pantalla.pintarRuedas(ruedas);
  };

  return {
    acciones: {
      'abrir-herramientas-linea': (boton) => { pantalla.abrirFicha(renderHerramientasDeLinea(contexto(boton))); },
      'elegir-herramienta-linea': (boton) => {
        const h = HERRAMIENTAS_DE_LINEA.find(x => x.id === boton.dataset['herramienta']);
        if (!h) return;
        ruedas = DURACION_POR_DEFECTO;
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
        const marca = escribirMarca({ tipo, duracion, etiqueta: pantalla.etiquetaEscrita() });
        campos.escribir(seccion, agregarAlFinal(texto, Number(boton.dataset['linea'] ?? 0), marca));
        pantalla.cerrarFicha();
      }
    }
  };
}
