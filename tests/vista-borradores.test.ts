import { describe, it, expect } from 'vitest';
import { renderBorradores, renderBorrador, cuando } from '../src/ui/borradores.js';
import type { Borrador } from '../src/tipos.js';

const borradorFalso = (p: Partial<Borrador> = {}): Borrador =>
  ({ id: 'b1', titulo: 'A', fuente: '', nota: '', capturado: '', ...p });

describe('Borradores', () => {
  it('cada entrada muestra el título y cuándo se capturó', () => {
    const html = renderBorradores({
      borradores: [borradorFalso({ titulo: 'Focaccia', fuente: 'https://x/1', capturado: '2026-09-01T10:00:00Z' })]
    });
    expect(html).toContain('Focaccia');
    expect(html).toContain('1 de septiembre');
  });

  it('la lista vacía trae la frase y el control de agregar a mano, sin ilustración', () => {
    const html = renderBorradores({ borradores: [] });
    expect(html).toContain('No hay nada esperando.');
    expect(html).toContain('data-accion="agregar-borrador"');
    expect(html).not.toContain('<svg class="ilustracion"');
  });

  it('la fila muestra sólo el título, y no parece un hipervínculo', () => {
    const html = renderBorradores({
      borradores: [borradorFalso({ titulo: 'Focaccia', fuente: 'https://x/1', nota: 'una nota' })]
    });
    expect(html).toContain('Focaccia');
    // La fuente y la nota están adentro del borrador, no en la fila.
    expect(html).not.toContain('x/1');
    expect(html).not.toContain('una nota');
  });

  it('el control de alta dice Nuevo', () => {
    expect(renderBorradores({ borradores: [] })).toContain('Nuevo</button>');
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

  it('la nota se muestra cuando hay una', () => {
    const conNota = renderBorrador({
      borrador: borradorFalso({ nota: 'La versión sin lactosa' }), confirmando: false
    });
    expect(conNota).toContain('La versión sin lactosa');
    expect(renderBorrador({ borrador: borradorFalso(), confirmando: false })).not.toContain('class="lee"');
  });

  it('descartar pide confirmación y nombra el borrador', () => {
    const html = renderBorrador({ borrador: borradorFalso({ titulo: 'Focaccia' }), confirmando: true });
    expect(html).toContain('Focaccia');
    expect(html).toContain('data-accion="descartar-confirmado"');
  });

  it('editar abre el formulario completo, no un campo suelto', () => {
    const html = renderBorrador({ borrador: borradorFalso(), confirmando: false });
    expect(html).toContain('data-accion="editar-borrador"');
    expect(html).not.toContain('data-accion="guardar-titulo"');
  });

  it('editar está arriba, y crear cierra la lista de acciones', () => {
    const html = renderBorrador({ borrador: borradorFalso({ fuente: 'https://x/1' }), confirmando: false });
    const enc = html.slice(0, html.indexOf('class="cuerpo'));
    expect(enc).toContain('data-accion="editar-borrador"');
    expect(enc).not.toContain('data-accion="descartar"');
    // En el cuerpo: descartar, la fuente y crear, en ese orden.
    expect(html.indexOf('data-accion="descartar"')).toBeLessThan(html.indexOf('Ir a la fuente'));
    expect(html.indexOf('Ir a la fuente')).toBeLessThan(html.indexOf('data-accion="crear-receta"'));
  });

  it('mientras confirma, las acciones no están: no se crea por error', () => {
    const html = renderBorrador({ borrador: borradorFalso(), confirmando: true });
    expect(html).not.toContain('data-accion="crear-receta"');
  });
});
