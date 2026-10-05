import { describe, it, expect, vi } from 'vitest';
import { crearControlHerramientas, CLAVE_PAN, CLAVE_SAL } from '../src/herramientas-control.js';
import {
  PAN_POR_DEFECTO, PANES, PREFERMENTOS_CON_LEVADURA, BOLLOS_POR_DEFECTO, SEGUNDA_POR_DEFECTO,
  alElegirTipo, fermentacionesPara, hidratacionAlCambiarHarinas, segundaAlMezclar, type ClavePan, type DatosPan
} from '../src/calculadoras/pan.js';
import { SAL_POR_DEFECTO, FERMENTOS } from '../src/calculadoras/fermentados.js';
import { localStorageFalso } from './dom-falso.js';

/** Un botón o un campo como los que dibuja la pantalla. */
const boton = (grupo: string, valor: string) => ({ dataset: { grupo, valor } }) as unknown as HTMLElement;
const campo = (cantidad: string, value: string) => ({ dataset: { cantidad }, value }) as unknown as HTMLInputElement;

// Los valores por defecto y los de las tablas se leen de su archivo: los
// tests prueban qué hace el control con ellos, no cuánto valen.
const panDe = (clave: ClavePan) => PANES.find(p => p.clave === clave)!;
const horasPoolish = PREFERMENTOS_CON_LEVADURA.find(p => p.clave === 'poolish')!.horas.map(h => h.horas);
const salDe = (clave: string) => FERMENTOS.find(f => f.clave === clave)!.sal;
/** La hidratación después de cambiar las harinas de `antes` por las de `ahora`. */
const corrida = (antes: DatosPan, ahora: Partial<DatosPan>) => hidratacionAlCambiarHarinas(antes, { ...antes, ...ahora });

function armar(almacen: Pick<Storage, 'getItem' | 'setItem'> | null = localStorageFalso()) {
  const redibujar = vi.fn();
  const pintarResultado = vi.fn();
  const control = crearControlHerramientas({ almacen, redibujar, pintarResultado });
  const elegir = (grupo: string, valor: string) => control.acciones['elegir-opcion']!(boton(grupo, valor), new Event('click'));
  return { control, redibujar, pintarResultado, elegir };
}

describe('el control de Herramientas', () => {
  it('sin nada guardado, los valores por defecto', () => {
    const { control } = armar();
    expect(control.pan()).toEqual(PAN_POR_DEFECTO);
    expect(control.sal()).toEqual(SAL_POR_DEFECTO);
  });

  it('lee lo guardado, dato por dato', () => {
    const almacen = localStorageFalso();
    almacen.setItem(CLAVE_PAN, JSON.stringify({ ...PAN_POR_DEFECTO, pan: 'ciabatta', harina: 'no-existe' }));
    almacen.setItem(CLAVE_SAL, '{roto');
    const { control } = armar(almacen);
    expect(control.pan().pan).toBe('ciabatta');
    expect(control.pan().harina).toBe(panDe('ciabatta').harina);
    expect(control.sal()).toEqual(SAL_POR_DEFECTO);
  });

  it('elegir masa madre con 2 h pasa a 4 h, guarda y redibuja', () => {
    const almacen = localStorageFalso();
    const { control, elegir, redibujar } = armar(almacen);
    elegir('prefermento', '');
    elegir('fermentacion', 'ambiente-2');
    expect(control.pan().fermentacion).toBe('ambiente-2');
    elegir('prefermento', 'masa-madre');
    expect(control.pan().fermentacion).toBe('ambiente-4');
    expect(JSON.parse(almacen.getItem(CLAVE_PAN)!).prefermento).toBe('masa-madre');
    expect(redibujar).toHaveBeenCalledTimes(3);
  });

  it('cambiar el modo elige la primera fermentación del modo', () => {
    const { control, elegir } = armar();
    elegir('modo', 'frio');
    expect(control.pan().fermentacion).toBe(fermentacionesPara(PAN_POR_DEFECTO.prefermento).find(f => f.modo === 'frio')!.clave);
  });

  it('la segunda: ninguna, una harina, y la principal la descarta', () => {
    const { control, elegir } = armar();
    elegir('segunda', 'centeno');
    elegir('porcentaje', '20');
    expect(control.pan()).toMatchObject({ segunda: 'centeno', porcentajeSegunda: 20 });
    elegir('harina', 'centeno');
    expect(control.pan().segunda).toBeNull();
    elegir('segunda', 'integral');
    elegir('segunda', '');
    expect(control.pan().segunda).toBeNull();
  });

  it('escribir una cantidad guarda y pinta sólo el resultado', () => {
    const { control, redibujar, pintarResultado } = armar();
    control.alEscribir(campo('masa', '1745,5'));
    expect(control.pan().cantidad).toEqual({ de: 'masa', gramos: 1745.5 });
    expect(pintarResultado).toHaveBeenCalled();
    expect(redibujar).not.toHaveBeenCalled();
    control.alEscribir(campo('peso', '1200'));
    expect(control.sal().pesoTotal).toBe(1200);
  });

  it('un campo vacío deja la cantidad sin resultado', () => {
    const { control } = armar();
    control.alEscribir(campo('harina', ''));
    expect(control.pan().cantidad.gramos).toBeNaN();
  });

  it('el fermento', () => {
    const { control, elegir } = armar();
    elegir('fermento', 'pepinos');
    expect(control.sal().fermento).toBe('pepinos');
  });

  it('la temperatura de la sal', () => {
    const { control, elegir } = armar();
    elegir('temperatura', 'mas-24');
    expect(control.sal().temperatura).toBe('mas-24');
    elegir('temperatura', 'heladera');
    expect(control.sal().temperatura).toBe(SAL_POR_DEFECTO.temperatura);
  });

  it('con un almacén que falla, funciona igual', () => {
    const roto = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); } };
    const { control, elegir } = armar(roto);
    expect(control.pan()).toEqual(PAN_POR_DEFECTO);
    elegir('pan', 'focaccia');
    expect(control.pan().pan).toBe('focaccia');
  });
});

describe('el control de Herramientas — la pizza', () => {
  it('elegir una pizza pasa la cantidad a bollos; escribir los bollos y el peso los guarda', () => {
    const { control, elegir, pintarResultado } = armar();
    elegir('pan', 'napolitana');
    expect(control.pan().cantidad).toEqual({ de: 'bollos', bollos: BOLLOS_POR_DEFECTO, gramos: panDe('napolitana').bollo });
    control.alEscribir(campo('bollos', '6'));
    control.alEscribir(campo('bollo', '270'));
    expect(control.pan().cantidad).toEqual({ de: 'bollos', bollos: 6, gramos: 270 });
    expect(pintarResultado).toHaveBeenCalledTimes(2);
    elegir('pan', 'new-york');
    const ny = panDe('new-york').bollo!;
    expect(control.pan().cantidad).toEqual({ de: 'bollos', bollos: 6, gramos: ny });
    elegir('pan', 'campo');
    expect(control.pan().cantidad).toEqual({ de: 'masa', gramos: 6 * ny });
  });

  it('otra elección no cambia los bollos', () => {
    const { control, elegir } = armar();
    elegir('pan', 'napolitana');
    control.alEscribir(campo('bollos', '3'));
    elegir('levadura', 'seca');
    expect(control.pan().cantidad).toEqual({ de: 'bollos', bollos: 3, gramos: panDe('napolitana').bollo });
  });
});

describe('el control de Herramientas — el prefermento', () => {
  it('elegir poolish y sus horas; la levadura elegida se conserva al pasar por masa madre', () => {
    const { control, elegir } = armar();
    elegir('levadura', 'seca');
    elegir('prefermento', 'poolish');
    expect(control.pan()).toMatchObject({ prefermento: 'poolish', horasPrefermento: horasPoolish[0] });
    elegir('horas-prefermento', String(horasPoolish.at(-1)));
    expect(control.pan().horasPrefermento).toBe(horasPoolish.at(-1));
    elegir('prefermento', 'masa-madre');
    expect(control.pan()).toMatchObject({ prefermento: 'masa-madre', horasPrefermento: 0, levadura: 'seca' });
    elegir('prefermento', '');
    expect(control.pan().prefermento).toBeNull();
    // «Masa madre» ya no es una levadura.
    elegir('levadura', 'masa-madre');
    expect(control.pan().levadura).toBe('fresca');
  });
});

describe('el control de Herramientas — la mezcla de harinas', () => {
  it('encender la mezcla suma la harina de por defecto; apagarla la saca', () => {
    const { control, elegir } = armar();
    elegir('mezcla', '1');
    expect(control.pan().segunda).toBe(segundaAlMezclar(PAN_POR_DEFECTO.harina));
    elegir('segunda', 'centeno');
    expect(control.pan().segunda).toBe('centeno');
    elegir('mezcla', '');
    expect(control.pan().segunda).toBeNull();
  });

  it('con la de por defecto de principal, la mezcla arranca en otra harina', () => {
    const { control, elegir } = armar();
    elegir('harina', SEGUNDA_POR_DEFECTO);
    elegir('mezcla', '1');
    expect(control.pan().segunda).toBe(segundaAlMezclar(SEGUNDA_POR_DEFECTO));
    expect(control.pan().segunda).not.toBe(SEGUNDA_POR_DEFECTO);
  });
});

describe('el control de Herramientas — la temperatura del pan', () => {
  it('se elige aparte de la de los fermentados', () => {
    const { control, elegir } = armar();
    elegir('temperatura-pan', 'mas-24');
    expect(control.pan().temperatura).toBe('mas-24');
    expect(control.sal().temperatura).toBe('18-24');
    elegir('temperatura', 'menos-13');
    expect(control.sal().temperatura).toBe('menos-13');
    expect(control.pan().temperatura).toBe('mas-24');
  });
});

describe('el control de Herramientas — los desplegables', () => {
  it('lo elegido en un desplegable guarda y redibuja, igual que un botón', () => {
    const almacen = localStorageFalso();
    const { control, redibujar } = armar(almacen);
    control.alElegir('pan', 'focaccia');
    control.alElegir('fermento', 'kimchi');
    expect(control.pan().pan).toBe('focaccia');
    expect(control.sal().fermento).toBe('kimchi');
    expect(JSON.parse(almacen.getItem(CLAVE_PAN)!).pan).toBe('focaccia');
    expect(redibujar).toHaveBeenCalledTimes(2);
  });
});

describe('el control de Herramientas — el tipo y la hidratación', () => {
  it('elegir un tipo carga todo lo que trae, y pisa lo que se había ajustado', () => {
    const { control, elegir } = armar();
    elegir('pan', 'baguette');
    const baguette = panDe('baguette');
    expect(control.pan()).toMatchObject({
      pan: 'baguette', harina: baguette.harina, hidratacion: baguette.hidratacion,
      prefermento: baguette.prefermento, horasPrefermento: baguette.horasPrefermento ?? 0
    });
    elegir('levadura', 'seca');
    elegir('harina', 'centeno');
    control.alEscribir(campo('hidratacion', '90'));
    control.alEscribir(campo('harina', '700'));
    elegir('pan', 'frances');
    expect(control.pan()).toEqual(
      alElegirTipo({ pan: 'baguette', cantidad: { de: 'harina', gramos: 700 }, temperatura: PAN_POR_DEFECTO.temperatura }, 'frances'));
    elegir('pan', 'no-existe');
    expect(control.pan().pan).toBe('frances');
  });

  it('cambiar la harina o la mezcla corre la hidratación; lo demás no la toca', () => {
    const { control, elegir } = armar();
    let antes = control.pan();
    expect(antes.hidratacion).toBe(PAN_POR_DEFECTO.hidratacion);
    elegir('harina', 'integral');
    expect(control.pan().hidratacion).toBe(corrida(antes, { harina: 'integral' }));
    const conIntegral = control.pan().hidratacion;
    elegir('levadura', 'seca');
    elegir('prefermento', 'biga');
    expect(control.pan().hidratacion).toBe(conIntegral);
    antes = control.pan();
    elegir('mezcla', '1');
    const segunda = segundaAlMezclar('integral');
    expect(control.pan()).toMatchObject({ segunda, hidratacion: corrida(antes, { segunda }) });
    antes = control.pan();
    elegir('porcentaje', '50');
    expect(control.pan().hidratacion).toBe(corrida(antes, { porcentajeSegunda: 50 }));
    elegir('mezcla', '');
    expect(control.pan().hidratacion).toBe(conIntegral);
  });

  it('escribir la hidratación la guarda y pinta sólo el resultado; lo escrito se conserva al cambiar de harina', () => {
    const almacen = localStorageFalso();
    const { control, elegir, redibujar, pintarResultado } = armar(almacen);
    control.alEscribir(campo('hidratacion', '75,5'));
    expect(control.pan().hidratacion).toBe(75.5);
    expect(JSON.parse(almacen.getItem(CLAVE_PAN)!).hidratacion).toBe(75.5);
    expect(pintarResultado).toHaveBeenCalledTimes(1);
    expect(redibujar).not.toHaveBeenCalled();
    const antes = control.pan();
    elegir('harina', 'integral');
    expect(control.pan().hidratacion).toBe(corrida(antes, { harina: 'integral' }));
  });

  it('una hidratación vacía queda vacía hasta que se escribe o se elige un tipo', () => {
    const { control, elegir } = armar();
    control.alEscribir(campo('hidratacion', ''));
    expect(control.pan().hidratacion).toBeNaN();
    elegir('levadura', 'seca');
    expect(control.pan().hidratacion).toBeNaN();
    elegir('pan', 'focaccia');
    expect(control.pan().hidratacion).toBe(panDe('focaccia').hidratacion);
  });
});

describe('el control de Herramientas — el tipo de fermento y la sal', () => {
  it('elegir un tipo carga el porcentaje que sugiere, y pisa el escrito; quedan el peso y la temperatura', () => {
    const { control, elegir } = armar();
    control.alEscribir(campo('sal', '4,5'));
    control.alEscribir(campo('peso', '800'));
    elegir('temperatura', 'mas-24');
    expect(control.sal()).toEqual({ fermento: 'chucrut', sal: 4.5, pesoTotal: 800, temperatura: 'mas-24' });
    elegir('fermento', 'pepinos');
    expect(control.sal()).toEqual({ fermento: 'pepinos', sal: salDe('pepinos'), pesoTotal: 800, temperatura: 'mas-24' });
    elegir('fermento', 'no-existe');
    expect(control.sal().fermento).toBe('pepinos');
  });

  it('escribir el porcentaje lo guarda y pinta sólo el resultado; vacío, queda vacío hasta elegir un tipo', () => {
    const almacen = localStorageFalso();
    const { control, elegir, redibujar, pintarResultado } = armar(almacen);
    control.alEscribir(campo('sal', '2,5'));
    expect(JSON.parse(almacen.getItem(CLAVE_SAL)!).sal).toBe(2.5);
    expect(pintarResultado).toHaveBeenCalledTimes(1);
    expect(redibujar).not.toHaveBeenCalled();
    control.alEscribir(campo('sal', ''));
    elegir('temperatura', '13-18');
    expect(control.sal().sal).toBeNaN();
    elegir('fermento', 'kimchi');
    expect(control.sal().sal).toBe(salDe('kimchi'));
  });
});
