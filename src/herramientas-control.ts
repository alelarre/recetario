/**
 * Lo elegido en las calculadoras de *Herramientas*: se guarda en el teléfono
 * en cada cambio, para que la próxima vez —por el menú o por el botón
 * *Calcular* de una receta— abra con lo mismo. No va a Drive: es una
 * comodidad de este teléfono.
 *
 * Un toque redibuja la pantalla; escribir una cantidad pinta sólo el
 * resultado, para no sacarle el foco al campo.
 */
import {
  PANES, completarPan, fermentacionesPara, alElegirTipo, hidratacionAlCambiarHarinas, segundaAlMezclar,
  type DatosPan
} from './calculadoras/pan.js';
import { completarSal, type DatosSal } from './calculadoras/fermentados.js';
import type { SeccionDeAcciones } from './acciones.js';

export const CLAVE_PAN = 'recetario.herramientas.pan';
/** Los grupos que cambian las harinas del pan, y con ellas la hidratación. */
const HARINAS_DEL_PAN: readonly string[] = ['harina', 'mezcla', 'segunda', 'porcentaje'];
export const CLAVE_SAL = 'recetario.herramientas.sal';

type Almacen = Pick<Storage, 'getItem' | 'setItem'>;

export interface ControlHerramientas {
  pan(): DatosPan;
  sal(): DatosSal;
  acciones: SeccionDeAcciones;
  /** Una opción elegida en un desplegable `[data-opcion]`: su grupo y su valor. */
  alElegir(grupo: string, valor: string): void;
  /** Un campo `[data-cantidad]` que cambió. */
  alEscribir(campo: HTMLInputElement): void;
}

/** Lo guardado, o `null` si no hay o no se puede leer. */
function leer(almacen: Almacen | null, clave: string): unknown {
  try {
    const crudo = almacen?.getItem(clave);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

function guardar(almacen: Almacen | null, clave: string, valor: unknown): void {
  try { almacen?.setItem(clave, JSON.stringify(valor)); } catch { /* sin almacenamiento: queda para esta vez */ }
}

/** Gramos escritos con coma o punto; lo que no es un número da `NaN`, que no tiene resultado. */
const gramosEscritos = (texto: string): number => (texto.trim() ? Number(texto.replace(',', '.')) : Number.NaN);

export function crearControlHerramientas({ almacen, redibujar, pintarResultado }: {
  almacen: Almacen | null;
  redibujar: () => void;
  pintarResultado: () => void;
}): ControlHerramientas {
  let pan = completarPan(leer(almacen, CLAVE_PAN));
  let sal = completarSal(leer(almacen, CLAVE_SAL));

  /** El pan con un dato cambiado, sin combinaciones que no van. */
  function conElegido(grupo: string, valor: string): DatosPan {
    switch (grupo) {
      case 'mezcla': return { ...pan, segunda: valor ? segundaAlMezclar(pan.harina) : null };
      case 'segunda': return { ...pan, segunda: (valor || null) as DatosPan['segunda'] };
      case 'porcentaje': return { ...pan, porcentajeSegunda: Number(valor) as DatosPan['porcentajeSegunda'] };
      case 'modo': {
        const primera = fermentacionesPara(pan.prefermento).find(f => f.modo === valor);
        return primera ? { ...pan, fermentacion: primera.clave } : pan;
      }
      // El tipo carga todo de nuevo.
      case 'pan': {
        const tipo = PANES.find(p => p.clave === valor);
        return tipo ? alElegirTipo(pan, tipo.clave) : pan;
      }
      case 'prefermento': return { ...pan, prefermento: (valor || null) as DatosPan['prefermento'] };
      case 'horas-prefermento': return { ...pan, horasPrefermento: Number(valor) };
      case 'temperatura-pan': return { ...pan, temperatura: valor as DatosPan['temperatura'] };
      case 'harina': case 'levadura': case 'fermentacion':
        return { ...pan, [grupo]: valor };
      default: return pan;
    }
  }

  /** Lo elegido en un conmutador, un interruptor o un desplegable: guarda y redibuja. */
  function alElegir(grupo: string, valor: string): void {
    if (grupo === 'fermento' || grupo === 'temperatura') {
      sal = completarSal({ ...sal, [grupo]: valor });
      guardar(almacen, CLAVE_SAL, sal);
    } else {
      // `completarPan` descarta lo que no es una opción y corrige la segunda
      // igual a la principal y las 2 h con masa madre. La cantidad y la
      // hidratación se conservan aunque estén vacías: es lo que el usuario
      // dejó escrito. Al cambiar de tipo, las que trae el tipo.
      const elegido = conElegido(grupo, valor);
      const completo = { ...completarPan(elegido), cantidad: elegido.cantidad, hidratacion: elegido.hidratacion };
      // Otra harina, u otra mezcla, corre la hidratación por lo que absorben.
      pan = HARINAS_DEL_PAN.includes(grupo)
        ? { ...completo, hidratacion: hidratacionAlCambiarHarinas(pan, completo) }
        : completo;
      guardar(almacen, CLAVE_PAN, pan);
    }
    redibujar();
  }

  const acciones: SeccionDeAcciones = {
    'elegir-opcion': (boton) => alElegir(boton.dataset['grupo'] ?? '', boton.dataset['valor'] ?? '')
  };

  function alEscribir(campo: HTMLInputElement): void {
    const de = campo.dataset['cantidad'];
    const gramos = gramosEscritos(campo.value);
    if (de === 'peso') {
      sal = { ...sal, pesoTotal: gramos };
      guardar(almacen, CLAVE_SAL, sal);
    } else if (de === 'harina' || de === 'masa') {
      pan = { ...pan, cantidad: { de, gramos } };
      guardar(almacen, CLAVE_PAN, pan);
    } else if (de === 'hidratacion') {
      pan = { ...pan, hidratacion: gramos };
      guardar(almacen, CLAVE_PAN, pan);
    } else if ((de === 'bollos' || de === 'bollo') && pan.cantidad.de === 'bollos') {
      pan = { ...pan, cantidad: de === 'bollos' ? { ...pan.cantidad, bollos: gramos } : { ...pan.cantidad, gramos } };
      guardar(almacen, CLAVE_PAN, pan);
    } else {
      return;
    }
    pintarResultado();
  }

  return { pan: () => pan, sal: () => sal, acciones, alElegir, alEscribir };
}
