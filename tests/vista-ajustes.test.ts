import { describe, it, expect } from 'vitest';
import { renderAjustes } from '../src/ui/ajustes.js';

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
