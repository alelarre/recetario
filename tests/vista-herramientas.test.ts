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
    const orden = ['pan', 'harina', 'segunda', 'levadura', 'modo', 'fermentacion'].map(g => pos(html, g));
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

  it('la segunda harina no ofrece la principal, y sin segunda no hay porcentaje', () => {
    expect(html).not.toContain('data-grupo="segunda" data-valor="000"');
    expect(html).toContain('data-grupo="segunda" data-valor="" aria-pressed="true"');
    expect(pos(html, 'porcentaje')).toBe(-1);
    const conSegunda = renderPan({ ...PAN_POR_DEFECTO, segunda: 'centeno' });
    expect(conSegunda).toContain('data-grupo="porcentaje" data-valor="30" aria-pressed="true"');
  });

  it('con masa madre: sin 2 h, y harina y agua «a agregar»', () => {
    const d: DatosPan = { ...PAN_POR_DEFECTO, levadura: 'masa-madre', fermentacion: 'ambiente-4' };
    const h = renderPan(d);
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

  it('el campo que manda lleva lo escrito; el otro, lo calculado', () => {
    expect(html).toContain('data-cantidad="harina" value="1000"');
    expect(html).toContain('data-cantidad="masa" value="1745"');
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
