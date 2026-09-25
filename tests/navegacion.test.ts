import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { crearNavegacion } from '../src/navegacion.js';
import { historialFalso } from './dom-falso.js';

/** Deja llegar los `hashchange` encolados. */
const esperar = async () => { for (let i = 0; i < 3; i++) await Promise.resolve(); };

/**
 * El módulo sobre un historial falso. Cada `hashchange` numera y cada
 * `popstate` revisa la capa, como hace la app; `llegadas` es lo que devolvió
 * cada `numerar`, y `cerradas` las capas que el atrás cerró.
 */
function montar(hash = '#/') {
  const llegadas: string[] = [];
  const cerradas: string[] = [];
  let nav: ReturnType<typeof crearNavegacion> | null = null;
  const h = historialFalso({
    hash,
    alCambiarHash: () => { if (nav) llegadas.push(nav.numerar()); },
    alPopstate: () => { nav?.alPopstate(); }
  });
  nav = crearNavegacion({ location: h.location, history: h.history });
  nav.arrancar();
  nav.alCerrarCapa(capa => { cerradas.push(capa); });
  return { nav, llegadas, cerradas, ...h };
}

const capa = (state: unknown): unknown => (state as { capa?: unknown } | null)?.capa;

const profundidad = (state: unknown): unknown => (state as { profundidad?: unknown } | null)?.profundidad;

describe('la navegación', () => {
  it('al arrancar, la entrada actual queda con profundidad 0 y no hay atrás', () => {
    const { nav, history } = montar();
    expect(profundidad(history.state)).toBe(0);
    expect(nav.hayAtras()).toBe(false);
  });

  it('arrancar con una URL la pone en lugar de la actual', () => {
    const { nav, location, history } = montar('');
    nav.arrancar('/recetario/#/nueva?text=hola');
    expect(location.hash).toBe('#/nueva?text=hola');
    expect(profundidad(history.state)).toBe(0);
  });

  it('ir agrega una entrada con la profundidad de la anterior más uno', async () => {
    const { nav, location, history, pila, llegadas } = montar();
    nav.ir('#/c/Carnes');
    nav.ir('#/r/f1');
    await esperar();
    expect(location.hash).toBe('#/r/f1');
    expect(pila().map(e => profundidad(e.state))).toEqual([0, 1, 2]);
    expect(profundidad(history.state)).toBe(2);
    // Las dos llegan ya numeradas: el `hashchange` no las cuenta de nuevo, y
    // son entradas nuevas, adelante, como las de un link.
    expect(llegadas).toEqual(['nueva', 'nueva']);
    expect(nav.hayAtras(2)).toBe(true);
  });

  it('ir al hash en el que ya se está no agrega nada', async () => {
    const { nav, pila } = montar();
    nav.ir('#/');
    await esperar();
    expect(pila()).toHaveLength(1);
    expect(nav.hayAtras()).toBe(false);
  });

  it('reemplazar conserva la profundidad', async () => {
    const { nav, location, history, pila, reemplazos } = montar();
    nav.ir('#/plan/agregar?dia=1&momento=noche');
    nav.reemplazar('#/plan');
    await esperar();
    expect(reemplazos).toEqual(['#/plan']);
    expect(location.hash).toBe('#/plan');
    expect(pila().map(e => e.hash)).toEqual(['#/', '#/plan']);
    expect(profundidad(history.state)).toBe(1);
  });

  it('numerar le pone a una entrada sin state la profundidad de la anterior más uno', async () => {
    const { nav, location, history, llegadas } = montar();
    nav.ir('#/c/Carnes');
    await esperar();
    // Un `<a href>`: el navegador agrega la entrada sin `state`.
    location.hash = '#/r/f1';
    await esperar();
    expect(llegadas.at(-1)).toBe('nueva');
    expect(profundidad(history.state)).toBe(2);
    expect(nav.hayAtras(2)).toBe(true);
  });

  it('volver a una entrada anterior recupera su profundidad', async () => {
    const { nav, atras, llegadas } = montar();
    nav.ir('#/c/Carnes');
    nav.ir('#/r/f1');
    await esperar();
    atras();
    await esperar();
    expect(llegadas.at(-1)).toBe('conocida');
    expect(nav.hayAtras(1)).toBe(true);
    expect(nav.hayAtras(2)).toBe(false);
  });

  it('hayAtras(1) y hayAtras(2)', async () => {
    const { nav } = montar();
    expect([nav.hayAtras(1), nav.hayAtras(2)]).toEqual([false, false]);
    nav.ir('#/c/Carnes');
    expect([nav.hayAtras(1), nav.hayAtras(2)]).toEqual([true, false]);
    nav.ir('#/r/f1');
    expect([nav.hayAtras(1), nav.hayAtras(2)]).toEqual([true, true]);
    await esperar();
  });

  it('volver hace back si hay atrás', async () => {
    const { nav, location, vueltasAtras, reemplazos } = montar();
    nav.ir('#/c/Carnes');
    await esperar();
    nav.volver('#/');
    await esperar();
    expect(vueltasAtras).toHaveLength(1);
    expect(reemplazos).toEqual([]);
    expect(location.hash).toBe('#/');
  });

  it('volver sin atrás reemplaza por el respaldo', async () => {
    const { nav, location, vueltasAtras, reemplazos, pila } = montar('#/r/f1/cocinar');
    nav.volver('#/r/f1');
    await esperar();
    expect(vueltasAtras).toEqual([]);
    expect(reemplazos).toEqual(['#/r/f1']);
    expect(location.hash).toBe('#/r/f1');
    expect(pila()).toHaveLength(1);
  });

  it('volver con n = 2 retrocede dos entradas', async () => {
    const { nav, location, saltos } = montar();
    nav.ir('#/r/f1');
    nav.ir('#/r/f1/editar');
    await esperar();
    nav.volver('#/', 2);
    await esperar();
    expect(saltos).toEqual([-2]);
    expect(location.hash).toBe('#/');
    expect(nav.hayAtras()).toBe(false);
  });

  it('con una sola entrada atrás, volver con n = 2 reemplaza', async () => {
    const { nav, saltos, reemplazos } = montar('#/r/f1');
    nav.ir('#/r/f1/editar');
    await esperar();
    nav.volver('#/', 2);
    expect(saltos).toEqual([]);
    expect(reemplazos).toEqual(['#/']);
  });

  it('una entrada de profundidad 0 no vuelve, aunque el navegador tenga entradas atrás', async () => {
    // Lo de antes de abrir la app —otro sitio, o la entrada del Share
    // Target— está en el historial del navegador, pero no es una pantalla de
    // la app: volver ahí sería salirse.
    const { nav, history, vueltasAtras, reemplazos } = montar();
    history.pushState(null, '', '#/nueva?text=hola');
    nav.arrancar();
    nav.volver('#/');
    expect(vueltasAtras).toEqual([]);
    expect(reemplazos).toEqual(['#/']);
  });

  it('deshacer vuelve atrás, y ese hashchange llega como deshecho', async () => {
    const { nav, location, pila, llegadas } = montar();
    nav.ir('#/nueva');
    await esperar();
    const antes = pila();
    location.hash = '#/plan';
    await esperar();
    expect(llegadas.at(-1)).toBe('nueva');
    nav.deshacer();
    await esperar();
    expect(llegadas.at(-1)).toBe('deshecha');
    expect(pila()).toEqual(antes);
    expect(nav.hayAtras(1)).toBe(true);
    expect(nav.hayAtras(2)).toBe(false);
  });

  it('restaurar vuelve a poner una pantalla sin avisar', async () => {
    const { nav, atras, pila, empujados, llegadas } = montar();
    nav.ir('#/r/f1/editar');
    await esperar();
    atras();
    await esperar();
    const cuantas = llegadas.length;
    nav.restaurar('#/r/f1/editar');
    await esperar();
    expect(empujados).toEqual(['#/r/f1/editar']);
    expect(llegadas).toHaveLength(cuantas);
    expect(pila().map(e => [e.hash, profundidad(e.state)])).toEqual([['#/', 0], ['#/r/f1/editar', 1]]);
    expect(nav.hayAtras()).toBe(true);
  });
});

describe('salirDe: volver hasta salir de una pantalla', () => {
  it('lleva los hashes de la sesión: una entrada que se dejó adelante con el atrás no cuenta', async () => {
    const { nav, location, atras } = montar();
    nav.ir('#/c/Carnes');
    location.hash = '#/r/f1';
    await esperar();
    nav.reemplazar('#/r/f1/editar');
    atras();
    await esperar();
    // Lo de adelante sigue en el historial, pero una entrada nueva lo pisa.
    nav.ir('#/r/f1');
    await esperar();
    nav.salirDe('#/r/f1', '#/');
    await esperar();
    expect(location.hash).toBe('#/c/Carnes');
  });

  it('una entrada sin anotar —de antes de recargar— no se cruza: reemplaza por el respaldo', async () => {
    const { nav, location, history, vueltasAtras, saltos, reemplazos } = montar('#/c/Carnes');
    // La recarga: las entradas del navegador siguen, pero el módulo arranca
    // de nuevo y sólo conoce la actual.
    location.hash = '#/r/f1';
    history.replaceState({ profundidad: 1 }, '');
    location.hash = '#/r/f1/cocinar';
    history.replaceState({ profundidad: 2 }, '');
    await esperar();
    const recargada = crearNavegacion({ location, history });
    // La entrada actual, tal como la dejó la sesión de antes.
    recargada.numerar();
    recargada.salirDe('#/r/f1', '#/c/Carnes');
    await esperar();
    expect(vueltasAtras).toEqual([]);
    expect(saltos).toEqual([]);
    expect(reemplazos).toEqual(['#/c/Carnes']);
  });

  it('con una entrada de la receta, retrocede una', async () => {
    const { nav, location, vueltasAtras, saltos } = montar();
    nav.ir('#/borradores');
    nav.ir('#/r/f1/editar');
    await esperar();
    nav.salirDe('#/r/f1', '#/');
    await esperar();
    expect(vueltasAtras).toHaveLength(1);
    expect(saltos).toEqual([]);
    expect(location.hash).toBe('#/borradores');
  });

  it('con dos entradas de la receta, retrocede dos', async () => {
    const { nav, location, saltos } = montar();
    nav.ir('#/buscar?q=pan');
    nav.ir('#/r/f1');
    nav.ir('#/r/f1/cocinar');
    await esperar();
    nav.salirDe('#/r/f1', '#/c/Carnes');
    await esperar();
    expect(saltos).toEqual([-2]);
    expect(location.hash).toBe('#/buscar?q=pan');
  });

  it('sin ninguna entrada de otra pantalla atrás, reemplaza por el respaldo', async () => {
    const { nav, location, vueltasAtras, saltos, reemplazos } = montar('#/r/f1');
    nav.ir('#/r/f1/cocinar');
    await esperar();
    nav.salirDe('#/r/f1', '#/c/Carnes');
    await esperar();
    expect(vueltasAtras).toEqual([]);
    expect(saltos).toEqual([]);
    expect(reemplazos).toEqual(['#/c/Carnes']);
    expect(location.hash).toBe('#/c/Carnes');
  });

  it('el prefijo es la ruta entera: otra receta cuyo id empieza igual es otra pantalla', async () => {
    const { nav, location } = montar();
    nav.ir('#/r/f10');
    nav.ir('#/r/f1');
    await esperar();
    nav.salirDe('#/r/f1', '#/');
    await esperar();
    expect(location.hash).toBe('#/r/f10');
  });
});

describe('las capas: lo que se abre sin cambiar de pantalla', () => {
  it('abrirCapa suma una entrada con el mismo hash, la misma profundidad y state.capa', async () => {
    const { nav, pila, llegadas } = montar();
    nav.ir('#/r/f1');
    await esperar();
    const antes = llegadas.length;
    nav.abrirCapa('visor');
    await esperar();
    expect(pila().map(e => [e.hash, profundidad(e.state), capa(e.state)]))
      .toEqual([['#/', 0, undefined], ['#/r/f1', 1, undefined], ['#/r/f1', 1, 'visor']]);
    expect(nav.capaActual()).toBe('visor');
    // No es otra pantalla: ni hashchange ni pantalla atrás de más.
    expect(llegadas).toHaveLength(antes);
    expect(nav.hayAtras(2)).toBe(false);
  });

  it('otra capa abierta encima toma el lugar de la anterior', async () => {
    const { nav, pila } = montar();
    nav.abrirCapa('ficha-foto');
    nav.abrirCapa('visor');
    expect(pila().map(e => capa(e.state))).toEqual([undefined, 'visor']);
    expect(nav.capaActual()).toBe('visor');
  });

  it('el atrás cierra la capa sin cambiar de pantalla, y se le avisa a quien la abrió', async () => {
    const { nav, atras, location, llegadas, cerradas } = montar();
    nav.ir('#/r/f1');
    await esperar();
    const antes = llegadas.length;
    nav.abrirCapa('visor');
    atras();
    await esperar();
    expect(cerradas).toEqual(['visor']);
    expect(nav.capaActual()).toBeNull();
    expect(location.hash).toBe('#/r/f1');
    expect(llegadas).toHaveLength(antes);
  });

  it('cerrarCapa consume la entrada con un atrás, sin avisar', async () => {
    const { nav, pila, vueltasAtras, cerradas } = montar();
    nav.abrirCapa('menu');
    nav.cerrarCapa();
    await esperar();
    expect(vueltasAtras).toHaveLength(1);
    expect(pila()).toHaveLength(1);
    expect(cerradas).toEqual([]);
    expect(nav.capaActual()).toBeNull();
  });

  it('cerrarCapa no hace nada si la entrada actual no es una capa', async () => {
    const { nav, vueltasAtras } = montar();
    nav.ir('#/r/f1');
    await esperar();
    nav.cerrarCapa();
    expect(vueltasAtras).toEqual([]);
  });

  it('cerrarCapa con nombre sólo cierra esa', async () => {
    const { nav, vueltasAtras } = montar();
    nav.abrirCapa('visor');
    nav.cerrarCapa('menu');
    expect(vueltasAtras).toEqual([]);
    expect(nav.capaActual()).toBe('visor');
    nav.cerrarCapa('visor');
    expect(vueltasAtras).toHaveLength(1);
  });

  it('ir desde una capa pone la entrada nueva en su lugar', async () => {
    const { nav, pila, llegadas, cerradas } = montar();
    nav.abrirCapa('menu');
    nav.ir('#/plan');
    await esperar();
    expect(pila().map(e => [e.hash, profundidad(e.state), capa(e.state)]))
      .toEqual([['#/', 0, undefined], ['#/plan', 1, undefined]]);
    expect(llegadas).toEqual(['nueva']);
    expect(nav.capaActual()).toBeNull();
    expect(cerradas).toEqual([]);
  });

  it('volver desde una capa retrocede también su entrada', async () => {
    const { nav, location, saltos, pila } = montar();
    nav.ir('#/plan/agregar?dia=1&momento=noche');
    await esperar();
    nav.abrirCapa('categoria-plan');
    nav.volver('#/plan');
    await esperar();
    expect(saltos).toEqual([-2]);
    expect(location.hash).toBe('#/');
    expect(pila()).toHaveLength(1);
  });

  it('sin pantalla atrás, volver desde una capa sale de ella y reemplaza la pantalla', async () => {
    const { nav, location, pila, reemplazos } = montar('#/plan/agregar?dia=1&momento=noche');
    nav.abrirCapa('categoria-plan');
    nav.volver('#/plan');
    await esperar();
    expect(reemplazos).toEqual(['#/plan']);
    expect(location.hash).toBe('#/plan');
    expect(pila().map(e => [e.hash, capa(e.state)])).toEqual([['#/plan', undefined]]);
  });

  it('salirDe desde una capa retrocede también su entrada', async () => {
    const { nav, location, saltos } = montar();
    nav.ir('#/r/f1');
    await esperar();
    nav.abrirCapa('visor');
    nav.salirDe('#/r/f1', '#/');
    await esperar();
    expect(saltos).toEqual([-2]);
    expect(location.hash).toBe('#/');
  });

  it('un link con la capa abierta la deja atrás; deshacerlo vuelve a la pantalla, no a la capa', async () => {
    const { nav, location, pila, saltos, cerradas, llegadas } = montar();
    nav.ir('#/nueva');
    await esperar();
    nav.abrirCapa('menu');
    // El navegador avisa el link con `popstate` y después con `hashchange`:
    // el `popstate` no es el atrás de la capa, y no se la cierra a mano.
    location.hash = '#/plan';
    await esperar();
    expect(cerradas).toEqual([]);
    expect(llegadas.at(-1)).toBe('nueva');
    expect(nav.capaActual()).toBeNull();
    nav.deshacer();
    await esperar();
    expect(saltos).toEqual([-2]);
    expect(pila().map(e => [e.hash, capa(e.state)])).toEqual([['#/', undefined], ['#/nueva', undefined]]);
  });
});

describe('un link al mismo fragmento', () => {
  it('sin capa, la entrada que el navegador reemplazó queda numerada', async () => {
    const { nav, pila, mismoFragmento, llegadas } = montar();
    nav.ir('#/r/f1');
    await esperar();
    mismoFragmento();
    await esperar();
    expect(pila().map(e => [e.hash, profundidad(e.state)])).toEqual([['#/', 0], ['#/r/f1', 1]]);
    expect(llegadas).toEqual(['nueva']);
    expect(nav.hayAtras()).toBe(true);
  });

  it('con una capa abierta, la cierra y la entrada queda numerada', async () => {
    const { nav, pila, mismoFragmento, cerradas } = montar();
    nav.ir('#/r/f1');
    await esperar();
    nav.abrirCapa('visor');
    mismoFragmento();
    await esperar();
    expect(cerradas).toEqual(['visor']);
    expect(nav.capaActual()).toBeNull();
    expect(pila().map(e => [e.hash, profundidad(e.state), capa(e.state)]))
      .toEqual([['#/', 0, undefined], ['#/r/f1', 1, undefined], ['#/r/f1', 1, undefined]]);
  });
});

describe('ir sin un hashchange que lo avise', () => {
  it('un hash sin # es un error: no navega fuera de la app ni agrega nada', async () => {
    const { nav, location, pila } = montar();
    nav.ir('#/r/f1');
    await esperar();
    // Asignado a `location.hash` iría al mismo fragmento, pero pasado a una
    // URL sería una ruta relativa: fuera de la app.
    expect(() => { nav.ir('/r/f1'); }).toThrow();
    expect(() => { nav.ir('plan'); }).toThrow();
    await esperar();
    expect(location.hash).toBe('#/r/f1');
    expect(pila()).toHaveLength(2);
  });

  it('cada ir avisado una vez, aunque lleguen juntos', async () => {
    const { nav, location, llegadas, atras } = montar();
    nav.ir('#/c/Carnes');
    nav.ir('#/r/f1');
    await esperar();
    expect(llegadas).toEqual(['nueva', 'nueva']);
    atras();
    await esperar();
    expect(llegadas.at(-1)).toBe('conocida');
    expect(location.hash).toBe('#/c/Carnes');
  });
});

describe('un solo lugar toca location e history', () => {
  // Salvo la navegación, nadie cambia la URL ni se mueve por el historial.
  // `location.reload` no cuenta: recargar no es navegar.
  it.each(['src/main.ts', 'src/invitado.ts', 'src/ui/router.ts', 'src/cocina-control.ts'])('%s', (archivo) => {
    const prohibidos = [
      /location\.hash\s*=[^=]/, /location\.replace\(/, /history\.back\(/, /history\.go\(/,
      /pushState\(/, /replaceState\(/
    ];
    const lineas = readFileSync(archivo, 'utf8').split('\n');
    expect(lineas.filter(l => prohibidos.some(p => p.test(l)))).toEqual([]);
  });
});

describe('el historial falso de los tests', () => {
  it('avisa en el orden del navegador: el popstate de location.hash en el acto, el de back después', async () => {
    const orden: string[] = [];
    const h = historialFalso({
      hash: '#/',
      alCambiarHash: () => { orden.push(`hashchange ${h.location.hash}`); },
      alPopstate: () => { orden.push(`popstate ${h.location.hash}`); }
    });
    h.location.hash = '#/plan';
    orden.push('asignado');
    h.history.back();
    orden.push(`back ${h.location.hash}`);
    await esperar();
    expect(orden).toEqual([
      'popstate #/plan', 'asignado', 'back #/plan', 'hashchange #/plan', 'popstate #/', 'hashchange #/'
    ]);
  });
});
