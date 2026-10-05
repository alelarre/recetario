import { describe, it, expect } from 'vitest';
import { renderHerramientas, renderPan, renderSal, resultadoPan } from '../src/ui/herramientas.js';
import { PAN_POR_DEFECTO, ADVERTENCIA_TIEMPOS, ADVERTENCIA_AMBIENTE, ADVERTENCIA_FRIO, AVISO_TOPE, type DatosPan } from '../src/calculadoras/pan.js';
import { SAL_POR_DEFECTO } from '../src/calculadoras/fermentados.js';
import { escapar } from '../src/ui/markdown.js';
import { ICO } from '../src/ui/iconos.js';

/** Dónde está la fila de un dato: su desplegable, o su conmutador o interruptor. */
/** El pan de campo sin su masa madre: un pan directo, con levadura, que es donde están todas las filas. */
const DIRECTO: DatosPan = { ...PAN_POR_DEFECTO, prefermento: null };

const pos = (html: string, grupo: string): number => {
  const i = html.indexOf(`data-opcion="${grupo}"`);
  return i !== -1 ? i : html.indexOf(`data-grupo="${grupo}"`);
};

/** El desplegable de un dato, o '' si no está. */
const desplegable = (html: string, grupo: string): string => {
  const ini = html.indexOf(`<select data-opcion="${grupo}">`);
  return ini === -1 ? '' : html.slice(ini, html.indexOf('</select>', ini));
};
const elegidoEn = (html: string, grupo: string): string | undefined =>
  desplegable(html, grupo).match(/<option value="([^"]*)" selected>/)?.[1];
const opcionesDe = (html: string, grupo: string): string[] =>
  [...desplegable(html, grupo).matchAll(/<option value="([^"]*)"/g)].map(m => m[1] ?? '');

describe('la lista de herramientas', () => {
  it('lleva los temporizadores primero y después las dos calculadoras', () => {
    const html = renderHerramientas({});
    const temporizadores = html.indexOf('href="#/herramientas/temporizadores"');
    expect(temporizadores).toBeGreaterThan(0);
    expect(temporizadores).toBeLessThan(html.indexOf('href="#/herramientas/pan"'));
    expect(html).toContain('Cronómetro y cuentas regresivas');
    // Cada una con su ícono, como las entradas del menú lateral.
    expect(html).toContain(`href="#/herramientas/temporizadores">${ICO.reloj}`);
    expect(html).toContain(`href="#/herramientas/pan">${ICO.pan}`);
    expect(html).toContain(`href="#/herramientas/fermentados">${ICO.frasco}`);
    expect(html).toContain('href="#/herramientas/pan"');
    expect(html).toContain('href="#/herramientas/fermentados"');
    expect(html).toContain('<span class="tit">Fermentados</span>');
  });

  it('con el menú, la hamburguesa y el lateral', () => {
    const html = renderHerramientas({ menu: { activo: 'herramientas', abierto: false, borradores: 0 } });
    expect(html).toContain('data-accion="abrir-menu"');
    expect(html).toContain('<a class="act" href="#/herramientas">');
  });
});

describe('la calculadora de pan', () => {
  const html = renderPan(DIRECTO);

  it('las filas en el orden del embudo, y el volver', () => {
    // El prefermento va antes que la levadura: dice si hace falta.
    const orden = ['pan', 'harina', 'mezcla', 'prefermento', 'levadura', 'modo', 'fermentacion', 'temperatura-pan'].map(g => pos(html, g));
    expect(orden.every(i => i > 0)).toBe(true);
    expect(orden).toEqual([...orden].sort((a, b) => a - b));
    expect(pos(html, 'temperatura-pan')).toBeLessThan(html.indexOf('data-cantidad="harina"'));
    expect(html).toContain('data-accion="volver"');
  });

  it('los datos van en tres fichas —el pan y sus harinas, cómo leva, y la cantidad— y el resultado en la suya', () => {
    const fichas = html.split('<div class="ficha').slice(1);
    expect(fichas).toHaveLength(4);
    expect(fichas[0]).toContain('data-opcion="pan"');
    expect(fichas[0]).toContain('data-grupo="mezcla"');
    expect(fichas[0]).toContain('data-cantidad="hidratacion"');
    expect(fichas[1]).toContain('data-opcion="prefermento"');
    expect(fichas[1]).toContain('data-grupo="temperatura-pan"');
    expect(fichas[2]).toContain('data-cantidad="harina"');
    expect(fichas[3]).toContain('data-resultado');
  });

  it('los datos con muchas opciones son un desplegable con lo elegido; el pan, con los panes y las pizzas aparte', () => {
    expect(elegidoEn(html, 'pan')).toBe('campo');
    expect(elegidoEn(html, 'harina')).toBe('000');
    expect(opcionesDe(html, 'pan')).toHaveLength(11);
    const pan = desplegable(html, 'pan');
    expect(pan.indexOf('<optgroup label="Panes">')).toBeLessThan(pan.indexOf('value="focaccia"'));
    expect(pan.indexOf('value="focaccia"')).toBeLessThan(pan.indexOf('<optgroup label="Pizzas">'));
    expect(pan.indexOf('<optgroup label="Pizzas">')).toBeLessThan(pan.indexOf('value="napolitana"'));
  });

  it('el tipo se llama «Tipo», y tal como viene trae su prefermento', () => {
    expect(html).toContain('<span class="n">Tipo</span><select data-opcion="pan">');
    expect(elegidoEn(renderPan(PAN_POR_DEFECTO), 'pan')).toBe('campo');
    expect(elegidoEn(renderPan(PAN_POR_DEFECTO), 'prefermento')).toBe('masa-madre');
  });

  it('la hidratación es una fila más, con su campo, debajo de la mezcla de harinas', () => {
    expect(html).toContain('<span class="n">Hidratación (%)</span><input type="number" inputmode="decimal" min="0" data-cantidad="hidratacion" value="72">');
    const conMezcla = renderPan({ ...DIRECTO, segunda: 'centeno', hidratacion: 78 });
    expect(pos(conMezcla, 'porcentaje')).toBeLessThan(conMezcla.indexOf('data-cantidad="hidratacion" value="78"'));
    expect(conMezcla.indexOf('data-cantidad="hidratacion"')).toBeLessThan(pos(conMezcla, 'prefermento'));
    // Vacía mientras se escribe: el campo queda vacío, no con un NaN.
    expect(renderPan({ ...DIRECTO, hidratacion: Number.NaN })).toContain('data-cantidad="hidratacion" value="">');
  });

  it('los de dos o tres opciones son un conmutador, con lo elegido apretado', () => {
    expect(html).toContain('data-grupo="levadura" data-valor="fresca" aria-pressed="true"');
    expect(html).toContain('data-grupo="levadura" data-valor="seca" aria-pressed="false"');
    expect(html).toContain('<div class="seg" role="group" aria-label="Levadura">');
    expect(desplegable(html, 'levadura')).toBe('');
  });

  it('el resultado y las advertencias', () => {
    const r = resultadoPan(DIRECTO);
    expect(r).toContain('data-resultado');
    for (const valor of ['1000 g', '720 g', '20 g', '5,0 g', '72 %']) expect(r).toContain(valor);
    for (const a of [ADVERTENCIA_TIEMPOS, ADVERTENCIA_AMBIENTE]) expect(r).toContain(escapar(a));
    expect(r).not.toContain(escapar(ADVERTENCIA_FRIO));
    expect(r).not.toContain(AVISO_TOPE);
    expect(html).toContain(r);
  });

  it('la mezcla es un interruptor apagado: sin él no hay otra harina ni porcentaje', () => {
    expect(html).toContain('role="switch" aria-checked="false" data-accion="elegir-opcion" data-grupo="mezcla" data-valor="1"');
    expect(pos(html, 'segunda')).toBe(-1);
    expect(pos(html, 'porcentaje')).toBe(-1);
  });

  it('con la mezcla encendida: la otra harina, sin la principal ni «Ninguna», y su porcentaje', () => {
    const conMezcla = renderPan({ ...DIRECTO, segunda: 'centeno' });
    expect(conMezcla).toContain('role="switch" aria-checked="true" data-accion="elegir-opcion" data-grupo="mezcla" data-valor=""');
    expect(elegidoEn(conMezcla, 'segunda')).toBe('centeno');
    expect(opcionesDe(conMezcla, 'segunda')).toEqual(['0000', '00', 'semolin', 'integral', 'centeno']);
    expect(conMezcla).toContain('data-grupo="porcentaje" data-valor="30" aria-pressed="true"');
    expect(pos(conMezcla, 'mezcla')).toBeLessThan(pos(conMezcla, 'segunda'));
  });

  it('con masa madre: sin levadura que elegir, sin 2 h, y harina y agua «a agregar»', () => {
    const d: DatosPan = { ...DIRECTO, prefermento: 'masa-madre', fermentacion: 'ambiente-4' };
    const h = renderPan(d);
    expect(elegidoEn(h, 'prefermento')).toBe('masa-madre');
    expect(h).not.toContain('data-grupo="levadura"');
    expect(h).not.toContain('data-valor="ambiente-2"');
    expect(h).toContain('a agregar');
    expect(h).toContain('Masa madre');
  });

  it('las horas son las del modo elegido', () => {
    expect(html).toContain('data-valor="ambiente-8"');
    expect(html).not.toContain('data-valor="frio-24"');
    const frio = renderPan({ ...DIRECTO, fermentacion: 'frio-24' });
    expect(frio).toContain('data-grupo="modo" data-valor="frio" aria-pressed="true"');
    expect(frio).toContain('data-valor="frio-24"');
  });

  it('el campo que manda lleva lo escrito; el otro, lo calculado; los dos en una fila, con las flechas en el medio', () => {
    expect(html).toContain('data-cantidad="harina" value="1000"');
    expect(html).toContain('data-cantidad="masa" value="1745"');
    const par = html.slice(html.indexOf('class="par-cantidades"'));
    expect(par.indexOf('data-cantidad="harina"')).toBeLessThan(par.indexOf('class="entre"'));
    expect(par.indexOf('class="entre"')).toBeLessThan(par.indexOf('data-cantidad="masa"'));
    expect(par).toContain('<svg');
  });

  it('el resultado destaca la masa total y la hidratación, arriba de las líneas', () => {
    const r = resultadoPan(DIRECTO);
    expect(r).toContain('<span class="v">1745 g</span><span class="n">Masa total</span>');
    expect(r).toContain('<span class="v">72 %</span><span class="n">Hidratación</span>');
    expect(r.indexOf('class="cifras"')).toBeLessThan(r.indexOf('class="ing"'));
  });

  it('topeado, lo avisa', () => {
    expect(resultadoPan({ ...DIRECTO, hidratacion: 90 })).toContain(AVISO_TOPE);
    expect(resultadoPan({ ...DIRECTO, hidratacion: 90 })).toContain('<span class="v">85 %</span>');
  });

  it('sin cantidad válida, cada valor es un guion', () => {
    const r = resultadoPan({ ...DIRECTO, cantidad: { de: 'harina', gramos: 0 } });
    expect(r).toContain('—');
    expect(r).not.toContain('720 g');
  });
});

describe('la calculadora de sal', () => {
  it('el fermento, el peso y el resultado', () => {
    const html = renderSal(SAL_POR_DEFECTO);
    expect(html).toContain('<span class="n">Tipo</span><select data-opcion="fermento">');
    expect(elegidoEn(html, 'fermento')).toBe('chucrut');
    // El porcentaje de sal que sugiere el tipo, en su fila, para cambiarlo.
    expect(html).toContain('<span class="n">Sal (%)</span><input type="number" inputmode="decimal" min="0" step="0.1" data-cantidad="sal" value="2">');
    expect(pos(html, 'fermento')).toBeLessThan(html.indexOf('data-cantidad="sal"'));
    expect(html.indexOf('data-cantidad="sal"')).toBeLessThan(pos(html, 'temperatura'));
    expect(renderSal({ ...SAL_POR_DEFECTO, sal: 3.5 })).toContain('<span class="v">35 g</span>');
    expect(opcionesDe(html, 'fermento')).toEqual(['chucrut', 'kimchi', 'ajies', 'salmuera', 'pepinos']);
    expect(html).toContain('data-cantidad="peso" value="1000"');
    expect(html).toContain('la verdura y, si va en salmuera, el agua');
    expect(html).toContain('20 g');
    expect(html).toContain('2 %');
  });

  it('la temperatura va entre el fermento y el peso, y el tiempo con su advertencia en el resultado', () => {
    const html = renderSal(SAL_POR_DEFECTO);
    expect(html).toContain(`<span class="tit">${ICO.frasco}Fermentados</span>`);
    expect(html).toContain('data-grupo="temperatura" data-valor="18-24" aria-pressed="true"');
    expect(pos(html, 'fermento')).toBeLessThan(pos(html, 'temperatura'));
    expect(pos(html, 'temperatura')).toBeLessThan(html.indexOf('data-cantidad="peso"'));
    expect(html).toContain('6 a 16 días');
    expect(html).toContain('empezar a probar');
  });
});

describe('la calculadora de pan — la temperatura del ambiente', () => {
  it('a temperatura ambiente, la fila va después de las horas: un conmutador con las cuatro franjas, en corto', () => {
    const html = renderPan(DIRECTO);
    expect(html).toContain('data-grupo="temperatura-pan" data-valor="18-24" aria-pressed="true"');
    const fila = html.slice(html.indexOf('aria-label="Temperatura ambiente"'), html.indexOf('data-cantidad="harina"'));
    expect([...fila.matchAll(/data-valor="([^"]*)" aria-pressed="[a-z]+">([^<]*)</g)].map(m => [m[1], m[2]])).toEqual([
      ['menos-13', '&lt; 13 °C'], ['13-18', '13–18 °C'], ['18-24', '18–24 °C'], ['mas-24', '&gt; 24 °C']
    ]);
    // No entra al lado del nombre en un teléfono: la fila lo deja bajar a su renglón.
    expect(html).toContain('<div class="dato ancho"><span class="n">Temperatura ambiente</span>');
    expect(pos(html, 'fermentacion')).toBeLessThan(pos(html, 'temperatura-pan'));
    expect(pos(html, 'temperatura-pan')).toBeLessThan(html.indexOf('data-cantidad="harina"'));
  });

  it('en frío sin prefermento, o con biga, no está; con poolish, sí', () => {
    expect(pos(renderPan({ ...DIRECTO, fermentacion: 'frio-24' }), 'temperatura-pan')).toBe(-1);
    expect(pos(renderPan({ ...DIRECTO, prefermento: 'biga', horasPrefermento: 18 }), 'temperatura-pan')).toBe(-1);
    expect(renderPan({ ...DIRECTO, prefermento: 'poolish', horasPrefermento: 12 }))
      .toContain('data-grupo="temperatura-pan" data-valor="18-24" aria-pressed="true"');
  });
});

describe('la calculadora de pan — la pizza', () => {
  it('en una pizza, bollos y gramos por bollo en lugar de harina y masa total', () => {
    const html = renderPan({ ...DIRECTO, pan: 'napolitana', cantidad: { de: 'bollos', bollos: 4, gramos: 250 } });
    expect(html).toContain('data-cantidad="bollos" value="4"');
    expect(html).toContain('data-cantidad="bollo" value="250"');
    expect(html).not.toContain('data-cantidad="harina"');
    expect(html).not.toContain('data-cantidad="masa"');
    expect(html).toContain('<span class="entre" aria-hidden="true">×</span>');
    expect(html).toContain('Pizza napolitana');
  });
});

describe('la calculadora de pan — el prefermento', () => {
  it('la fila de prefermento ofrece ninguno, la masa madre y los tres con levadura', () => {
    const h = renderPan(DIRECTO);
    expect(elegidoEn(h, 'prefermento')).toBe('');
    expect(opcionesDe(h, 'prefermento')).toEqual(['', 'masa-madre', 'poolish', 'biga', 'pate']);
  });

  it('con un prefermento elegido, debajo va su explicación, cerrada; sin prefermento, no hay', () => {
    expect(renderPan(DIRECTO)).not.toContain('<details');
    for (const [clave, titulo] of [
      ['masa-madre', 'Qué es la masa madre'], ['poolish', 'Qué es el poolish'],
      ['biga', 'Qué es la biga'], ['pate', 'Qué es la pâte fermentée']
    ] as const) {
      const h = renderPan({ ...DIRECTO, prefermento: clave });
      expect(h).toContain(`<details class="explica"><summary>${titulo}</summary><p>`);
      expect(h).not.toContain('<details class="explica" open');
      expect(pos(h, 'prefermento')).toBeLessThan(h.indexOf('<details'));
      expect(h.indexOf('<details')).toBeLessThan(h.indexOf('data-cantidad="harina"'));
    }
  });

  it('con poolish: sus horas, la levadura, y sin la fermentación de la tabla; el resultado, en dos grupos', () => {
    const poolish = renderPan({ ...DIRECTO, prefermento: 'poolish', horasPrefermento: 12 });
    expect(poolish).toContain('data-grupo="horas-prefermento" data-valor="12" aria-pressed="true"');
    expect(poolish).toContain('data-grupo="levadura" data-valor="fresca" aria-pressed="true"');
    expect(poolish).not.toContain('data-grupo="modo"');
    expect(poolish).toContain('<div class="grupo">Prefermento</div>');
    expect(poolish).toContain('<div class="grupo">Masa final</div>');
    expect(poolish.indexOf('>Prefermento</div>')).toBeLessThan(poolish.indexOf('>Masa final</div>'));
  });

  it('con pâte fermentée, sin fila de horas propias y con la fermentación, que es la de la masa final', () => {
    const h = renderPan({ ...DIRECTO, prefermento: 'pate', horasPrefermento: 14 });
    expect(h).not.toContain('data-grupo="horas-prefermento"');
    expect(h).toContain('data-grupo="modo" data-valor="ambiente" aria-pressed="true"');
  });

  it('con biga, la ficha de cómo leva tiene sólo el prefermento y la levadura', () => {
    const fichas = renderPan({ ...DIRECTO, prefermento: 'biga', horasPrefermento: 18 }).split('<div class="ficha').slice(1);
    expect(fichas[1]!.match(/class="dato/g)).toHaveLength(2);
  });

  it('el resultado es siempre una sola ficha; sin prefermento con levadura, sin grupos', () => {
    const conBiga = resultadoPan({ ...DIRECTO, prefermento: 'biga', horasPrefermento: 18 });
    for (const r of [resultadoPan(DIRECTO), conBiga]) {
      expect(r.match(/data-resultado/g)).toHaveLength(1);
      expect(r.match(/class="ficha/g)).toHaveLength(1);
    }
    expect(resultadoPan(DIRECTO)).not.toContain('class="grupo"');
    expect(resultadoPan({ ...DIRECTO, prefermento: 'masa-madre' })).not.toContain('class="grupo"');
  });
});
