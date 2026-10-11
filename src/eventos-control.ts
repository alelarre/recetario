/**
 * Lo elegido en *Evento*: un evento a la vez, guardado en el teléfono en cada
 * cambio (`recetario.evento`), como las calculadoras. No va a Drive: es una
 * comodidad de este teléfono.
 *
 * Un toque o un desplegable redibujan la pantalla, porque cambian qué filas
 * se ven; escribir un número pinta sólo el resultado, para no sacarle el foco
 * al campo.
 */
import type { SeccionDeAcciones } from './acciones.js';
import { MARGENES, completarEvento, conAdemas, conCosa, conDato, conDatoDeAdemas, conTipo, estadoInicial } from './eventos/estado.js';
import type { Comunes, EstadoEvento, TipoDeEvento } from './eventos/tipos.js';

export const CLAVE_EVENTO = 'recetario.evento';

type Almacen = Pick<Storage, 'getItem' | 'setItem'>;

export interface ControlEvento {
  estado(): EstadoEvento;
  /** Un campo o un desplegable `[data-evento]` que cambió. */
  alCambiar(campo: Pick<HTMLInputElement, 'value' | 'dataset'>, esDesplegable: boolean): void;
  acciones: SeccionDeAcciones;
}

/** Un número escrito con coma o punto; vacío, negativo o lo que no es un número, `null`. */
function numeroEscrito(texto: string): number | null {
  const n = Number(texto.trim().replace(',', '.'));
  return texto.trim() && Number.isFinite(n) && n >= 0 ? n : null;
}

export function crearControlEvento({ almacen, tipos, comunes, redibujar, pintarResultado }: {
  almacen: Almacen | null;
  tipos: readonly TipoDeEvento[];
  comunes: Comunes;
  redibujar: () => void;
  pintarResultado: () => void;
}): ControlEvento {
  let e = leer();

  function leer(): EstadoEvento {
    try {
      const crudo = almacen?.getItem(CLAVE_EVENTO);
      return completarEvento(crudo ? JSON.parse(crudo) : null, tipos, comunes);
    } catch {
      return estadoInicial(tipos, comunes);
    }
  }

  function cambiar(nuevo: EstadoEvento, pintar: () => void): void {
    e = nuevo;
    try { almacen?.setItem(CLAVE_EVENTO, JSON.stringify(e)); } catch { /* sin almacenamiento: queda para esta vez */ }
    pintar();
  }

  function alCambiar(campo: Pick<HTMLInputElement, 'value' | 'dataset'>, esDesplegable: boolean): void {
    const { evento: que = '', id = '', ademas = '' } = campo.dataset;
    if (que === 'tipo') return cambiar(conTipo(e, tipos, campo.value), redibujar);
    if (que === 'adultos' || que === 'chicos' || que === 'horas') return cambiar({ ...e, [que]: numeroEscrito(campo.value) }, pintarResultado);
    const valor = esDesplegable ? campo.value : numeroEscrito(campo.value);
    const pintar = esDesplegable ? redibujar : pintarResultado;
    if (que === 'dato') return cambiar(conDato(e, tipos, id, valor), pintar);
    if (que === 'dato-ademas') return cambiar(conDatoDeAdemas(e, tipos, ademas, id, valor), pintar);
  }

  const acciones: SeccionDeAcciones = {
    'evento-alternar': (boton) => {
      const { evento: que = '', id = '', ademas = '', valor = '' } = boton.dataset;
      const prender = valor === '1';
      const nuevo = que === 'calor' ? { ...e, calor: prender }
        : que === 'cosa' ? conCosa(e, tipos, id, prender)
        : que === 'ademas' ? conAdemas(e, tipos, id, prender)
        : que === 'dato' ? conDato(e, tipos, id, prender)
        : que === 'dato-ademas' ? conDatoDeAdemas(e, tipos, ademas, id, prender)
        : e;
      cambiar(nuevo, redibujar);
    },
    'evento-margen': (boton) => {
      const m = MARGENES.find(x => String(x) === boton.dataset['valor']);
      if (m !== undefined) cambiar({ ...e, margen: m }, redibujar);
    },
    'evento-reiniciar': () => cambiar(estadoInicial(tipos, comunes), redibujar)
  };

  return { estado: () => e, alCambiar, acciones };
}
