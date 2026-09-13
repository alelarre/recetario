import { describe, it, expect } from 'vitest';
import { renderAjustes } from '../src/ui/ajustes.js';
import type { InformeArranque } from '../src/store.js';

const base = { cuenta: 'a@b.c', ultimaReindexado: '', ignorados: [] as string[], reindexando: null };

describe('Ajustes', () => {
  it('las tres secciones: cuenta, índice y avisos', () => {
    const html = renderAjustes({ ...base, cuenta: 'alguien@gmail.com', ultimaReindexado: '2026-09-06T10:00:00Z' });
    expect(html).toContain('alguien@gmail.com');
    expect(html).toContain('Reindexar');
    expect(html).toContain('Avisos');
  });

  it('Salir dice que no borra nada de Drive', () => {
    const html = renderAjustes(base);
    expect(html).toContain('Salir');
    expect(html).toMatch(/no borra nada/i);
  });

  it('los avisos nombran los archivos, para poder encontrarlos en Drive', () => {
    const html = renderAjustes({ ...base, ignorados: ['notas-sueltas.md', 'borrador.md'] });
    expect(html).toContain('notas-sueltas.md');
    expect(html).toContain('2');
  });

  it('sin avisos, la sección lo dice y no dibuja ilustración', () => {
    const html = renderAjustes(base);
    expect(html).toContain('No hay nada para avisar.');
    expect(html).not.toContain('<svg class="ilustracion"');
  });

  it('con más de una planilla _indice, el aviso dice cuántas hay y cuál se usa', () => {
    // La fecha se arma en hora local: el aviso la muestra en la hora del teléfono.
    const modifiedTime = new Date(2026, 8, 12, 14, 30).toISOString();
    const html = renderAjustes({ ...base, indiceDuplicado: { cantidad: 2, modifiedTime } });
    expect(html).toContain('Hay 2 planillas _indice en Drive. Se usa la modificada el 12/09 a las 14:30.');
    expect(html).not.toContain('No hay nada para avisar.');
  });

  it('el aviso del duplicado convive con los archivos ignorados', () => {
    const modifiedTime = new Date(2026, 8, 12, 14, 30).toISOString();
    const html = renderAjustes({ ...base, ignorados: ['suelta.md'], indiceDuplicado: { cantidad: 3, modifiedTime } });
    expect(html).toContain('Hay 3 planillas _indice en Drive.');
    expect(html).toContain('suelta.md');
  });

  it('antes del primer archivo no hay números: spinner, no «0 de 0»', () => {
    const html = renderAjustes({ ...base, reindexando: { leidas: 0, total: 0 } });
    expect(html).toContain('Reindexando…');
    expect(html).toContain('class="spin"');
    expect(html).not.toContain('0 de 0');
    expect(html).not.toContain('class="barra"');
  });

  it('reindexando hay barra con cuántos van sobre el total, y no hay cancelar', () => {
    const html = renderAjustes({ ...base, reindexando: { leidas: 40, total: 200 } });
    expect(html).toContain('40');
    expect(html).toContain('200');
    expect(html).toContain('class="barra"');
    expect(html).not.toMatch(/cancelar/i);
  });

  it('mientras reindexa no se ofrece reindexar de nuevo', () => {
    expect(renderAjustes({ ...base, reindexando: { leidas: 1, total: 2 } }))
      .not.toContain('data-accion="reindexar"');
  });
});

describe('Ajustes: la ficha «Al abrir» (P18)', () => {
  const f = (d: number, h: number, m: number) => new Date(2026, 8, d, h, m).toISOString();
  const informe: InformeArranque = {
    momento: f(13, 14, 31), indiceModificado: f(13, 14, 30), copia: 'coincide',
    copiaModificada: f(13, 14, 30), reindexado: '', categorias: 16
  };
  const conInforme = (cambios: Partial<InformeArranque> = {}) =>
    renderAjustes({ ...base, informe: { ...informe, ...cambios }, recetas: 61, borradores: 3 });

  it('dice cuándo abrió, la fecha de _indice, lo que hay y que no reindexó', () => {
    const html = conInforme();
    expect(html).toContain('<h2>Al abrir</h2>');
    expect(html).toContain('Abrió el 13/09 a las 14:31.');
    expect(html).toContain('_indice: modificada el 13/09 a las 14:30.');
    expect(html).toContain('Copia local: coincide con _indice; no se leyó Sheets.');
    expect(html).toContain('61 recetas · 3 borradores · 16 categorías.');
    expect(html).toContain('No hizo falta reindexar.');
  });

  const lineasDeCopia: [Partial<InformeArranque>, string][] = [
    [{ copia: 'otra-fecha', copiaModificada: f(12, 10, 2) }, 'Copia local: del 12/09 a las 10:02, distinta; se bajó la planilla.'],
    [{ copia: 'sin-copia', copiaModificada: '' }, 'Copia local: no había; se bajó la planilla.'],
    [{ copia: 'otra-planilla' }, 'Copia local: de otra planilla; se bajó la planilla.'],
    [{ copia: 'otro-esquema' }, 'Copia local: de otra versión; se bajó la planilla.']
  ];

  it.each(lineasDeCopia)('la línea de la copia: %o', (cambios, texto) => {
    expect(conInforme(cambios)).toContain(texto);
  });

  const motivos: [InformeArranque['reindexado'], string][] = [
    ['planilla-nueva', 'Se reindexó: la planilla es nueva.'],
    ['esquema', 'Se reindexó: cambió la versión del esquema.'],
    ['a-medias', 'Se reindexó: había uno a medias.']
  ];

  it.each(motivos)('reindexado por %s', (reindexado, texto) => {
    const html = conInforme({ reindexado, copia: 'otra-fecha', copiaModificada: f(12, 10, 2) });
    expect(html).toContain(texto);
    // Reindexar reemplaza a bajar la planilla: la copia dice sólo cómo estaba.
    expect(html).toContain('Copia local: del 12/09 a las 10:02, distinta.');
    expect(html).not.toContain('se bajó la planilla');
  });

  it('con la planilla nueva, _indice se creó al abrir', () => {
    expect(conInforme({ reindexado: 'planilla-nueva', indiceModificado: '' }))
      .toContain('_indice: se creó al abrir.');
  });

  it('una receta y un borrador van en singular', () => {
    const html = renderAjustes({ ...base, informe, recetas: 1, borradores: 1 });
    expect(html).toContain('1 receta · 1 borrador · 16 categorías.');
  });

  it('sin informe no hay ficha', () => {
    expect(renderAjustes(base)).not.toContain('Al abrir');
  });
});
