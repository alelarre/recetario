import { describe, it, expect } from 'vitest';
import { renderBorradores, renderBorrador, cuando } from '../src/ui/borradores.js';
import type { Borrador } from '../src/tipos.js';

const borradorFalso = (p: Partial<Borrador> = {}): Borrador =>
  ({ id: 'b1', titulo: 'A', fuente: '', capturado: '', ...p });

describe('Borradores', () => {
  it('cada entrada muestra título, fuente y cuándo se capturó', () => {
    const html = renderBorradores({
      borradores: [borradorFalso({ titulo: 'Focaccia', fuente: 'https://x/1', capturado: '2026-09-01T10:00:00Z' })]
    });
    expect(html).toContain('Focaccia');
    expect(html).toContain('x/1');
    expect(html).toContain('1 de septiembre');
  });

  it('la lista vacía trae la frase y el control de agregar a mano, sin ilustración', () => {
    const html = renderBorradores({ borradores: [] });
    expect(html).toContain('No hay nada esperando.');
    expect(html).toContain('data-accion="agregar-borrador"');
    expect(html).not.toContain('<svg class="ilustracion"');
  });

  it('cada borrador lleva al suyo', () => {
    expect(renderBorradores({ borradores: [borradorFalso({ id: 'b7' })] }))
      .toContain('href="#/borradores/b7"');
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

describe('Borrador', () => {
  it('Ir a la fuente solo aparece si la fuente es una URL', () => {
    const conUrl = renderBorrador({ borrador: borradorFalso({ fuente: 'https://x/1' }), confirmando: false });
    const sinUrl = renderBorrador({ borrador: borradorFalso({ fuente: 'libro de pescados, pág. 84' }), confirmando: false });
    expect(conUrl).toContain('Ir a la fuente');
    expect(sinUrl).not.toContain('Ir a la fuente');
  });

  it('la fuente no se edita', () => {
    const html = renderBorrador({ borrador: borradorFalso({ fuente: 'https://x/1' }), confirmando: false });
    expect(html).not.toContain('name="fuente"');
  });

  it('no hay ningún botón que prometa llamar a un agente', () => {
    const html = renderBorrador({ borrador: borradorFalso(), confirmando: false });
    expect(html).not.toMatch(/convertir/i);
    expect(html).toContain('Crear la receta');
  });

  it('descartar pide confirmación y nombra el borrador', () => {
    const html = renderBorrador({ borrador: borradorFalso({ titulo: 'Focaccia' }), confirmando: true });
    expect(html).toContain('Focaccia');
    expect(html).toContain('data-accion="descartar-confirmado"');
  });

  it('el título se corrige en su lugar, con un campo y dos botones', () => {
    const html = renderBorrador({ borrador: borradorFalso({ titulo: 'Focacia' }), confirmando: false, editando: true });
    expect(html).toContain('name="titulo"');
    expect(html).toContain('value="Focacia"');
    expect(html).toContain('data-accion="guardar-titulo"');
    expect(html).not.toContain('data-accion="crear-receta"');
  });

  it('mientras confirma, las acciones no están: no se crea por error', () => {
    const html = renderBorrador({ borrador: borradorFalso(), confirmando: true });
    expect(html).not.toContain('data-accion="crear-receta"');
  });
});
