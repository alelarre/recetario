/**
 * Lo escrito en las cuentas de las herramientas de referencia —una entrada en
 * `localStorage` por herramienta, como las calculadoras— y la búsqueda de
 * Conservación, que no se guarda. Escribir pinta sólo el resultado o la
 * tabla; elegir una opción redibuja, porque puede cambiar qué entradas se ven.
 */
import type { SeccionDeAcciones } from './acciones.js';
import type { IdHerramienta, Valores } from './referencias/tipos.js';

type Almacen = Pick<Storage, 'getItem' | 'setItem'>;
type ValoresDeHerramienta = Record<string, Record<string, number | string | null>>;
export interface EstadoReferencia { valores: Readonly<Record<string, Valores>>; busqueda: string }
export interface ControlReferencias {
  estado(id: IdHerramienta): EstadoReferencia;
  alEscribir(id: IdHerramienta, cuenta: string, entrada: string, texto: string): void;
  alElegir(id: IdHerramienta, cuenta: string, entrada: string, valor: string): void;
  alBuscar(id: IdHerramienta, texto: string): void;
  acciones: SeccionDeAcciones;
}

const clave = (id: IdHerramienta): string => `recetario.referencias.${id}`;

function leer(almacen: Almacen | null, id: IdHerramienta): ValoresDeHerramienta {
  try {
    const crudo = almacen?.getItem(clave(id));
    const x: unknown = crudo ? JSON.parse(crudo) : null;
    return x && typeof x === 'object' && !Array.isArray(x) ? x as ValoresDeHerramienta : {};
  } catch { return {}; }
}

export function crearControlReferencias({ almacen, redibujar, pintarResultado, pintarTabla, temporizador }: {
  almacen: Almacen | null;
  redibujar: () => void;
  pintarResultado: (id: IdHerramienta, cuenta: string) => void;
  pintarTabla: (id: IdHerramienta) => void;
  temporizador: (nombre: string, minutos: number) => void;
}): ControlReferencias {
  const valores = new Map<IdHerramienta, ValoresDeHerramienta>();
  const busquedas = new Map<IdHerramienta, string>();
  const de = (id: IdHerramienta): ValoresDeHerramienta => {
    let v = valores.get(id);
    if (!v) { v = leer(almacen, id); valores.set(id, v); }
    return v;
  };
  const guardar = (id: IdHerramienta): void => {
    try { almacen?.setItem(clave(id), JSON.stringify(de(id))); } catch { /* sin almacenamiento: queda para esta vez */ }
  };
  const poner = (id: IdHerramienta, cuenta: string, entrada: string, v: number | string | null): void => {
    const todo = de(id);
    todo[cuenta] = { ...(todo[cuenta] ?? {}), [entrada]: v };
    guardar(id);
  };
  return {
    estado: id => ({ valores: de(id), busqueda: busquedas.get(id) ?? '' }),
    alEscribir(id, cuenta, entrada, texto) {
      const n = Number(texto.trim().replace(',', '.'));
      poner(id, cuenta, entrada, texto.trim() && Number.isFinite(n) ? n : null);
      pintarResultado(id, cuenta);
    },
    alElegir(id, cuenta, entrada, valor) { poner(id, cuenta, entrada, valor); redibujar(); },
    alBuscar(id, texto) { busquedas.set(id, texto); pintarTabla(id); },
    acciones: {
      'ir-a-ficha': (boton) => {
        const ficha = typeof document === 'undefined' ? null : document.querySelector<HTMLElement>(`#app #ficha-${boton.dataset['id'] ?? ''}`);
        ficha?.scrollIntoView({ block: 'start' });
      },
      'referencia-temporizador': (boton) => {
        const minutos = Number(boton.dataset['minutos']);
        if (Number.isFinite(minutos) && minutos > 0) temporizador(boton.dataset['nombre'] ?? '', minutos);
      }
    }
  };
}
