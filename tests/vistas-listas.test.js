// tests/vistas-listas.test.js
import { describe, it, expect } from 'vitest';
import { renderHome } from '../src/ui/home.js';
import { renderLista } from '../src/ui/lista.js';

const ENTRADAS = [
  { id_archivo: 'r1', titulo: 'Milanesas napolitanas', rinde: '4 porciones', tiempo: '40 min', dificultad: 'fácil', tags: ['horno'] },
  { id_archivo: 'r2', titulo: 'Matambre a la pizza', rinde: '', tiempo: '', dificultad: '', tags: ['incompleto'] }
];

describe('renderHome', () => {
  it('dibuja un tile por categoría con su conteo', () => {
    const html = renderHome({ categorias: [{ id: 'c1', nombre: 'Carnes', cantidad: 33 }] });
    expect(html).toContain('Carnes');
    expect(html).toContain('33');
    expect(html).toContain('href="#/c/Carnes"');
  });

  it('escapa los nombres de categoría', () => {
    const html = renderHome({ categorias: [{ id: 'c1', nombre: '<b>x</b>', cantidad: 1 }] });
    expect(html).not.toContain('<b>x</b>');
  });

  it('ofrece reconstruir con la fecha de la última reconstrucción', () => {
    const html = renderHome({ categorias: [], ultimaReconstruccion: '2026-09-01T10:00:00.000Z' });
    expect(html).toContain('Reconstruir índice');
    expect(html).toContain('2026');
    // La hora importa: si reconstruyo dos veces el mismo día, sin hora no se
    // distingue si la última corrida es la mía o la de la mañana.
    expect(html).toMatch(/\d{2}:\d{2}/);
  });

  it('ofrece reconectar la cuenta', () => {
    expect(renderHome({ categorias: [] })).toContain('Reconectar cuenta');
  });
});

describe('renderLista', () => {
  it('dibuja una fila por receta con la meta en una línea', () => {
    const html = renderLista({ titulo: 'Carnes', entradas: ENTRADAS });
    expect(html).toContain('Milanesas napolitanas');
    expect(html).toContain('4 porciones · 40 min · fácil');
  });

  it('marca con la clase incompleto solo a las que tienen el tag', () => {
    const html = renderLista({ titulo: 'Carnes', entradas: ENTRADAS });
    const filas = html.split('class="fila');
    expect(filas[1]).not.toContain('incompleto');
    expect(filas[2]).toContain('incompleto');
  });

  it('dibuja los chips y marca los activos', () => {
    const html = renderLista({ titulo: 'Carnes', entradas: ENTRADAS, tags: [{ tag: 'horno', cantidad: 1 }], tagsActivos: ['horno'] });
    expect(html).toContain('aria-pressed="true"');
  });

  it('una categoría vacía dice que está vacía en vez de quedar en blanco', () => {
    expect(renderLista({ titulo: 'Carnes', entradas: [] })).toContain('Todavía no hay recetas');
  });
});
