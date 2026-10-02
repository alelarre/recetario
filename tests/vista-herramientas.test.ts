import { describe, it, expect } from 'vitest';
import { renderHerramientas, renderPan, renderSal, resultadoPan } from '../src/ui/herramientas.js';
import { PAN_POR_DEFECTO, ADVERTENCIAS_PAN, AVISO_TOPE, type DatosPan } from '../src/calculadoras/pan.js';
import { SAL_POR_DEFECTO } from '../src/calculadoras/fermentados.js';
import { escapar } from '../src/ui/markdown.js';

const pos = (html: string, grupo: string): number => html.indexOf(`data-grupo="${grupo}"`);

describe('la lista de herramientas', () => {
  it('lleva las dos calculadoras', () => {
    const html = renderHerramientas({});
    expect(html).toContain('href="#/herramientas/pan"');
    expect(html).toContain('href="#/herramientas/fermentados"');
  });

  it('con el menú, la hamburguesa y el lateral', () => {
    const html = renderHerramientas({ menu: { activo: 'herramientas', abierto: false, borradores: 0 } });
    expect(html).toContain('data-accion="abrir-menu"');
    expect(html).toContain('<a class="act" href="#/herramientas">');
  });
});

describe('la calculadora de pan', () => {
  const html = renderPan(PAN_POR_DEFECTO);

  it('las filas en el orden del embudo, y el volver', () => {
    // El prefermento va antes que la levadura: dice si hace falta.
    const orden = ['pan', 'harina', 'mezcla', 'prefermento', 'levadura', 'modo', 'fermentacion'].map(g => pos(html, g));
    expect(orden.every(i => i > 0)).toBe(true);
    expect(orden).toEqual([...orden].sort((a, b) => a - b));
    expect(pos(html, 'fermentacion')).toBeLessThan(html.indexOf('data-cantidad="harina"'));
    expect(html).toContain('data-accion="volver"');
  });

  it('lo elegido va apretado', () => {
    expect(html).toContain('data-grupo="pan" data-valor="campo" aria-pressed="true"');
    expect(html).toContain('data-grupo="pan" data-valor="frances" aria-pressed="false"');
  });

  it('el resultado y las advertencias', () => {
    const r = resultadoPan(PAN_POR_DEFECTO);
    expect(r).toContain('data-resultado');
    for (const valor of ['1000 g', '720 g', '20 g', '5,0 g', '72 %']) expect(r).toContain(valor);
    for (const a of ADVERTENCIAS_PAN) expect(r).toContain(escapar(a));
    expect(r).not.toContain(AVISO_TOPE);
    expect(html).toContain(r);
  });

  it('la mezcla es un interruptor apagado: sin él no hay otra harina ni porcentaje', () => {
    expect(html).toContain('role="switch" aria-checked="false" data-accion="elegir-opcion" data-grupo="mezcla" data-valor="1"');
    expect(pos(html, 'segunda')).toBe(-1);
    expect(pos(html, 'porcentaje')).toBe(-1);
  });

  it('con la mezcla encendida: la otra harina, sin la principal ni «Ninguna», y su porcentaje', () => {
    const conMezcla = renderPan({ ...PAN_POR_DEFECTO, segunda: 'centeno' });
    expect(conMezcla).toContain('role="switch" aria-checked="true" data-accion="elegir-opcion" data-grupo="mezcla" data-valor=""');
    expect(conMezcla).toContain('data-grupo="segunda" data-valor="centeno" aria-pressed="true"');
    expect(conMezcla).not.toContain('data-grupo="segunda" data-valor="000"');
    expect(conMezcla).not.toContain('data-grupo="segunda" data-valor=""');
    expect(conMezcla).toContain('data-grupo="porcentaje" data-valor="30" aria-pressed="true"');
    expect(pos(conMezcla, 'mezcla')).toBeLessThan(pos(conMezcla, 'segunda'));
  });

  it('con masa madre: sin levadura que elegir, sin 2 h, y harina y agua «a agregar»', () => {
    const d: DatosPan = { ...PAN_POR_DEFECTO, prefermento: 'masa-madre', fermentacion: 'ambiente-4' };
    const h = renderPan(d);
    expect(h).toContain('data-grupo="prefermento" data-valor="masa-madre" aria-pressed="true"');
    expect(h).not.toContain('data-grupo="levadura"');
    expect(h).not.toContain('data-valor="ambiente-2"');
    expect(h).toContain('a agregar');
    expect(h).toContain('Masa madre');
  });

  it('las horas son las del modo elegido', () => {
    expect(html).toContain('data-valor="ambiente-8"');
    expect(html).not.toContain('data-valor="frio-24"');
    const frio = renderPan({ ...PAN_POR_DEFECTO, fermentacion: 'frio-24' });
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
    const r = resultadoPan(PAN_POR_DEFECTO);
    expect(r).toContain('<span class="v">1745 g</span><span class="n">Masa total</span>');
    expect(r).toContain('<span class="v">72 %</span><span class="n">Hidratación</span>');
    expect(r.indexOf('class="cifras"')).toBeLessThan(r.indexOf('class="ing"'));
  });

  it('topeado, lo avisa', () => {
    expect(resultadoPan({ ...PAN_POR_DEFECTO, pan: 'ciabatta', harina: 'centeno' })).toContain(AVISO_TOPE);
  });

  it('sin cantidad válida, cada valor es un guion', () => {
    const r = resultadoPan({ ...PAN_POR_DEFECTO, cantidad: { de: 'harina', gramos: 0 } });
    expect(r).toContain('—');
    expect(r).not.toContain('720 g');
  });
});

describe('la calculadora de sal', () => {
  it('el fermento, el peso y el resultado', () => {
    const html = renderSal(SAL_POR_DEFECTO);
    expect(html).toContain('data-grupo="fermento" data-valor="chucrut" aria-pressed="true"');
    expect(html).toContain('data-cantidad="peso" value="1000"');
    expect(html).toContain('20 g');
    expect(html).toContain('2 %');
  });

  it('la temperatura va entre el fermento y el peso, y el tiempo con su advertencia en el resultado', () => {
    const html = renderSal(SAL_POR_DEFECTO);
    expect(html).toContain('data-grupo="temperatura" data-valor="18-24" aria-pressed="true"');
    expect(pos(html, 'fermento')).toBeLessThan(pos(html, 'temperatura'));
    expect(pos(html, 'temperatura')).toBeLessThan(html.indexOf('data-cantidad="peso"'));
    expect(html).toContain('6 a 16 días');
    expect(html).toContain('empezar a probar');
  });
});

describe('la calculadora de pan — la pizza', () => {
  it('en una pizza, bollos y gramos por bollo en lugar de harina y masa total', () => {
    const html = renderPan({ ...PAN_POR_DEFECTO, pan: 'napolitana', cantidad: { de: 'bollos', bollos: 4, gramos: 250 } });
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
    const h = renderPan(PAN_POR_DEFECTO);
    expect(h).toContain('data-grupo="prefermento" data-valor="" aria-pressed="true"');
    for (const clave of ['masa-madre', 'poolish', 'biga', 'pate']) expect(h).toContain(`data-grupo="prefermento" data-valor="${clave}"`);
  });

  it('con poolish: sus horas, la levadura, y sin la fermentación de la tabla; el resultado, en dos grupos', () => {
    const poolish = renderPan({ ...PAN_POR_DEFECTO, prefermento: 'poolish', horasPrefermento: 12 });
    expect(poolish).toContain('data-grupo="horas-prefermento" data-valor="12" aria-pressed="true"');
    expect(poolish).toContain('data-grupo="levadura" data-valor="fresca" aria-pressed="true"');
    expect(poolish).not.toContain('data-grupo="modo"');
    expect(poolish).toContain('<div class="grupo">Prefermento</div>');
    expect(poolish).toContain('<div class="grupo">Masa final</div>');
    expect(poolish.indexOf('>Prefermento</div>')).toBeLessThan(poolish.indexOf('>Masa final</div>'));
  });

  it('con pâte fermentée, sin fila de horas propias y con la fermentación de la masa final', () => {
    const h = renderPan({ ...PAN_POR_DEFECTO, prefermento: 'pate', horasPrefermento: 14 });
    expect(h).not.toContain('data-grupo="horas-prefermento"');
    expect(h).toContain('Fermentación de la masa final');
  });

  it('el resultado es siempre una sola ficha; sin prefermento con levadura, sin grupos', () => {
    const conBiga = resultadoPan({ ...PAN_POR_DEFECTO, prefermento: 'biga', horasPrefermento: 18 });
    for (const r of [resultadoPan(PAN_POR_DEFECTO), conBiga]) {
      expect(r.match(/data-resultado/g)).toHaveLength(1);
      expect(r.match(/class="ficha/g)).toHaveLength(1);
    }
    expect(resultadoPan(PAN_POR_DEFECTO)).not.toContain('class="grupo"');
    expect(resultadoPan({ ...PAN_POR_DEFECTO, prefermento: 'masa-madre' })).not.toContain('class="grupo"');
  });
});
