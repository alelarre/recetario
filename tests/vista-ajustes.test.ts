import { describe, it, expect } from 'vitest';
import { renderAjustes, cuando } from '../src/ui/ajustes.js';
import type { InformeArranque } from '../src/store.js';

const base = { cuenta: 'a@b.c', ultimaReindexado: '', ignorados: [] as string[], reindexando: null };

describe('Ajustes', () => {
  it('la ficha Recetario dice qué carpeta se usa, cuántas categorías hay, y ofrece cambiar y gestionar', () => {
    const html = renderAjustes({ ...base, carpeta: 'Recetario', categorias: 16 });
    const recetario = html.slice(html.indexOf('<h2>Recetario</h2>'), html.indexOf('<h2>Índice</h2>'));
    expect(recetario).toContain('Carpeta: Recetario');
    expect(recetario).toContain('data-accion="cambiar-carpeta"');
    expect(recetario).toContain('16 categorías');
    expect(recetario).toContain('href="#/categorias"');
    const cuenta = html.slice(html.indexOf('<h2>Cuenta</h2>'), html.indexOf('<h2>Recetario</h2>'));
    expect(cuenta).not.toContain('Carpeta:');
  });

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

  it('con más de un `_plan.md`, el aviso dice cuántos hay y cuál se usa', () => {
    const modifiedTime = new Date(2026, 8, 18, 9, 5).toISOString();
    const html = renderAjustes({ ...base, planDuplicado: { cantidad: 2, modifiedTime } });
    expect(html).toContain('Hay 2 archivos _plan.md en Drive. Se usa el modificado el 18/09 a las 09:05.');
    expect(html).not.toContain('No hay nada para avisar.');
  });

  it('el aviso del duplicado convive con los archivos ignorados', () => {
    const modifiedTime = new Date(2026, 8, 12, 14, 30).toISOString();
    const html = renderAjustes({ ...base, ignorados: ['suelta.md'], indiceDuplicado: { cantidad: 3, modifiedTime } });
    expect(html).toContain('Hay 3 planillas _indice en Drive.');
    expect(html).toContain('suelta.md');
  });

  // Una sola barra de punta a punta, igual que en el primer arranque.
  it('recién arrancando la barra está en cero, y no hay spinner', () => {
    const html = renderAjustes({ ...base, reindexando: 0 });
    expect(html).toContain('Reindexando');
    expect(html).toContain('class="barra"');
    expect(html).not.toContain('class="spin"');
  });

  it('reindexando hay barra con el porcentaje, y no hay cancelar', () => {
    const html = renderAjustes({ ...base, reindexando: 0.2 });
    expect(html).toContain('20%');
    expect(html).toContain('width:20%');
    expect(html).not.toMatch(/cancelar/i);
  });

  it('mientras reindexa no se ofrece reindexar de nuevo', () => {
    expect(renderAjustes({ ...base, reindexando: 0.5 }))
      .not.toContain('data-accion="reindexar"');
  });
});

describe('Ajustes: la ficha «Registro de actividad»', () => {
  const f = (d: number, h: number, m: number) => new Date(2026, 8, d, h, m).toISOString();
  const informe: InformeArranque = {
    momento: f(13, 14, 31), indiceModificado: f(13, 14, 30), copia: 'coincide',
    copiaModificada: f(13, 14, 30), reindexado: ''
  };
  const conInforme = (cambios: Partial<InformeArranque> = {}) =>
    renderAjustes({ ...base, informe: { ...informe, ...cambios }, recetas: 61, borradores: 3, categorias: 16 });

  it('dice cuándo abrió, la fecha de _indice, lo que hay y que no reindexó', () => {
    const html = conInforme();
    expect(html).toContain('<h2>Registro de actividad</h2>');
    expect(html).toContain('Abrió el 13/09 a las 14:31.');
    expect(html).toContain('_indice: modificada el 13/09 a las 14:30.');
    expect(html).toContain('Copia local: coincide con _indice; no se leyó Sheets.');
    // Los borradores son recetas con un tag: van contados en las recetas.
    expect(html).toContain('61 recetas · 16 categorías.');
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

  it('una receta va en singular', () => {
    const html = renderAjustes({ ...base, informe, recetas: 1, borradores: 1, categorias: 16 });
    expect(html).toContain('1 receta · 16 categorías.');
  });

  it('sin informe no hay ficha', () => {
    expect(renderAjustes(base)).not.toContain('Registro de actividad');
  });
});

describe('Ajustes: borrar los datos locales', () => {
  it('ofrece borrar lo guardado en este navegador, y dice qué pasa después', () => {
    const html = renderAjustes(base);
    expect(html).toContain('<h2>Archivos locales</h2>');
    expect(html).toContain('data-accion="borrar-datos-locales"');
    expect(html).toMatch(/se baja todo de Drive/);
  });

  it('mientras reindexa no se ofrece', () => {
    expect(renderAjustes({ ...base, reindexando: 0.5 }))
      .not.toContain('data-accion="borrar-datos-locales"');
  });
});

describe('Ajustes: el orden de las fichas', () => {
  it('Cuenta, Índice, Archivos locales, Avisos y Registro de actividad, en ese orden', () => {
    const informe = {
      momento: new Date(2026, 8, 13, 14, 31).toISOString(), indiceModificado: '', copia: 'coincide' as const,
      copiaModificada: '', reindexado: '' as const
    };
    const html = renderAjustes({ ...base, informe, carpeta: 'Recetario' });
    const titulos = [...html.matchAll(/<h2>([^<]+)<\/h2>/g)].map(m => m[1]);
    expect(titulos).toEqual(['Cuenta', 'Recetario', 'Índice', 'Archivos locales', 'Avisos', 'Registro de actividad']);
  });
});

describe('cuando', () => {
  const ahora = new Date('2026-09-11T12:00:00Z');

  it('lo reciente se cuenta en días', () => {
    expect(cuando('2026-09-10T12:00:00Z', ahora)).toBe('ayer');
    expect(cuando('2026-09-08T12:00:00Z', ahora)).toBe('hace 3 días');
  });

  it('pasada la semana, la fecha dice más que la cuenta', () => {
    expect(cuando('2026-09-01T10:00:00Z', ahora)).toBe('1 de septiembre');
  });

  it('una fecha ilegible no rompe la lista', () => {
    expect(cuando('cualquier cosa', ahora)).toBe('');
  });
});
