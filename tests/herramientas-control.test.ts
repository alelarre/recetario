import { describe, it, expect, vi } from 'vitest';
import { crearControlHerramientas, CLAVE_PAN, CLAVE_SAL } from '../src/herramientas-control.js';
import { PAN_POR_DEFECTO } from '../src/calculadoras/pan.js';
import { SAL_POR_DEFECTO } from '../src/calculadoras/fermentados.js';
import { localStorageFalso } from './dom-falso.js';

/** Un botón o un campo como los que dibuja la pantalla. */
const boton = (grupo: string, valor: string) => ({ dataset: { grupo, valor } }) as unknown as HTMLElement;
const campo = (cantidad: string, value: string) => ({ dataset: { cantidad }, value }) as unknown as HTMLInputElement;

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
    expect(control.pan().harina).toBe('000');
    expect(control.sal()).toEqual(SAL_POR_DEFECTO);
  });

  it('elegir masa madre con 2 h pasa a 4 h, guarda y redibuja', () => {
    const almacen = localStorageFalso();
    const { control, elegir, redibujar } = armar(almacen);
    // El pan de miga trae 2 h y sin prefermento.
    elegir('pan', 'miga');
    expect(control.pan().fermentacion).toBe('ambiente-2');
    elegir('prefermento', 'masa-madre');
    expect(control.pan().fermentacion).toBe('ambiente-4');
    expect(JSON.parse(almacen.getItem(CLAVE_PAN)!).prefermento).toBe('masa-madre');
    expect(redibujar).toHaveBeenCalledTimes(2);
  });

  it('cambiar el modo elige la primera fermentación del modo', () => {
    const { control, elegir } = armar();
    elegir('modo', 'frio');
    expect(control.pan().fermentacion).toBe('frio-12');
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
    expect(control.sal().temperatura).toBe('18-24');
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
    expect(control.pan().cantidad).toEqual({ de: 'bollos', bollos: 4, gramos: 250 });
    control.alEscribir(campo('bollos', '6'));
    control.alEscribir(campo('bollo', '270'));
    expect(control.pan().cantidad).toEqual({ de: 'bollos', bollos: 6, gramos: 270 });
    expect(pintarResultado).toHaveBeenCalledTimes(2);
    elegir('pan', 'new-york');
    expect(control.pan().cantidad).toEqual({ de: 'bollos', bollos: 6, gramos: 380 });
    elegir('pan', 'campo');
    expect(control.pan().cantidad).toEqual({ de: 'masa', gramos: 2280 });
  });

  it('otra elección no cambia los bollos', () => {
    const { control, elegir } = armar();
    elegir('pan', 'napolitana');
    control.alEscribir(campo('bollos', '3'));
    elegir('levadura', 'seca');
    expect(control.pan().cantidad).toEqual({ de: 'bollos', bollos: 3, gramos: 250 });
  });
});

describe('el control de Herramientas — el prefermento', () => {
  it('elegir poolish y sus horas; la levadura elegida se conserva al pasar por masa madre', () => {
    const { control, elegir } = armar();
    elegir('levadura', 'seca');
    elegir('prefermento', 'poolish');
    expect(control.pan()).toMatchObject({ prefermento: 'poolish', horasPrefermento: 8 });
    elegir('horas-prefermento', '18');
    expect(control.pan().horasPrefermento).toBe(18);
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
    expect(control.pan().segunda).toBe('integral');
    elegir('segunda', 'centeno');
    expect(control.pan().segunda).toBe('centeno');
    elegir('mezcla', '');
    expect(control.pan().segunda).toBeNull();
  });

  it('con integral de principal, la mezcla arranca en otra harina', () => {
    const { control, elegir } = armar();
    elegir('harina', 'integral');
    elegir('mezcla', '1');
    expect(control.pan().segunda).toBe('0000');
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
    expect(control.pan()).toMatchObject({ pan: 'baguette', harina: '000', hidratacion: 68, prefermento: 'poolish', horasPrefermento: 12 });
    elegir('levadura', 'seca');
    elegir('harina', 'centeno');
    control.alEscribir(campo('hidratacion', '90'));
    control.alEscribir(campo('harina', '700'));
    elegir('pan', 'frances');
    expect(control.pan()).toEqual({
      pan: 'frances', harina: '000', segunda: null, porcentajeSegunda: 30, hidratacion: 60, prefermento: null,
      levadura: 'fresca', fermentacion: 'ambiente-4', temperatura: '18-24', cantidad: { de: 'harina', gramos: 700 }, horasPrefermento: 0
    });
    elegir('pan', 'no-existe');
    expect(control.pan().pan).toBe('frances');
  });

  it('cambiar la harina o la mezcla corre la hidratación; lo demás no la toca', () => {
    const { control, elegir } = armar();
    expect(control.pan().hidratacion).toBe(72);
    elegir('harina', 'integral');
    expect(control.pan().hidratacion).toBe(80);
    elegir('levadura', 'seca');
    elegir('prefermento', 'biga');
    expect(control.pan().hidratacion).toBe(80);
    elegir('mezcla', '1');
    expect(control.pan()).toMatchObject({ segunda: '0000', hidratacion: 76.4 });
    elegir('porcentaje', '50');
    expect(control.pan().hidratacion).toBe(74);
    elegir('mezcla', '');
    expect(control.pan().hidratacion).toBe(80);
  });

  it('escribir la hidratación la guarda y pinta sólo el resultado; lo escrito se conserva al cambiar de harina', () => {
    const almacen = localStorageFalso();
    const { control, elegir, redibujar, pintarResultado } = armar(almacen);
    control.alEscribir(campo('hidratacion', '75,5'));
    expect(control.pan().hidratacion).toBe(75.5);
    expect(JSON.parse(almacen.getItem(CLAVE_PAN)!).hidratacion).toBe(75.5);
    expect(pintarResultado).toHaveBeenCalledTimes(1);
    expect(redibujar).not.toHaveBeenCalled();
    elegir('harina', 'integral');
    expect(control.pan().hidratacion).toBe(83.5);
  });

  it('una hidratación vacía queda vacía hasta que se escribe o se elige un tipo', () => {
    const { control, elegir } = armar();
    control.alEscribir(campo('hidratacion', ''));
    expect(control.pan().hidratacion).toBeNaN();
    elegir('levadura', 'seca');
    expect(control.pan().hidratacion).toBeNaN();
    elegir('pan', 'focaccia');
    expect(control.pan().hidratacion).toBe(75);
  });
});
