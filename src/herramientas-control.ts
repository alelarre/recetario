/**
 * Lo elegido en las calculadoras de *Herramientas*: se guarda en el teléfono
 * en cada cambio, para que la próxima vez —por el menú o por el botón
 * *Calcular* de una receta— abra con lo mismo. No va a Drive: es una
 * comodidad de este teléfono.
 *
 * Un toque redibuja la pantalla; escribir una cantidad pinta sólo el
 * resultado, para no sacarle el foco al campo.
 */
import { completarPan, fermentacionesPara, type DatosPan } from './calculadoras/pan.js';
import { completarSal, type DatosSal } from './calculadoras/fermentados.js';
import type { SeccionDeAcciones } from './acciones.js';

export const CLAVE_PAN = 'recetario.herramientas.pan';
export const CLAVE_SAL = 'recetario.herramientas.sal';

type Almacen = Pick<Storage, 'getItem' | 'setItem'>;

export interface ControlHerramientas {
  pan(): DatosPan;
  sal(): DatosSal;
  acciones: SeccionDeAcciones;
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
      case 'segunda': return { ...pan, segunda: (valor || null) as DatosPan['segunda'] };
      case 'porcentaje': return { ...pan, porcentajeSegunda: Number(valor) as DatosPan['porcentajeSegunda'] };
      case 'modo': {
        const primera = fermentacionesPara(pan.levadura).find(f => f.modo === valor);
        return primera ? { ...pan, fermentacion: primera.clave } : pan;
      }
      case 'pan': case 'harina': case 'levadura': case 'fermentacion':
        return { ...pan, [grupo]: valor };
      default: return pan;
    }
  }

  const acciones: SeccionDeAcciones = {
    'elegir-opcion': (boton) => {
      const grupo = boton.dataset['grupo'] ?? '';
      const valor = boton.dataset['valor'] ?? '';
      if (grupo === 'fermento' || grupo === 'temperatura') {
        sal = completarSal({ ...sal, [grupo]: valor });
        guardar(almacen, CLAVE_SAL, sal);
      } else {
        // `completarPan` descarta lo que no es una opción y corrige la segunda
        // igual a la principal y las 2 h con masa madre. La cantidad se
        // conserva aunque esté vacía: es lo que el usuario dejó escrito.
        pan = { ...completarPan(conElegido(grupo, valor)), cantidad: pan.cantidad };
        guardar(almacen, CLAVE_PAN, pan);
      }
      redibujar();
    }
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
    } else {
      return;
    }
    pintarResultado();
  }

  return { pan: () => pan, sal: () => sal, acciones, alEscribir };
}
