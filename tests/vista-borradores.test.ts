import { describe, it, expect } from 'vitest';
import { renderBorradores, renderBorrador, renderPreguntaBorrador, cuando } from '../src/ui/borradores.js';
import { ICO } from '../src/ui/iconos.js';
import type { Borrador, EntradaBorrador } from '../src/tipos.js';

const borradorFalso = (p: Partial<Borrador> = {}): Borrador =>
  ({ id: 'b1', titulo: 'A', fuente: '', nota: '', capturado: '', fotos: [], ...p });

const entradaFalsa = (p: Partial<EntradaBorrador> = {}): EntradaBorrador =>
  ({ id_archivo: 'b1', nombre_archivo: 'a.md', titulo: 'A', capturado: '', ...p });

describe('Borradores', () => {
  it('cada entrada muestra el título y cuándo se capturó', () => {
    const html = renderBorradores({
      borradores: [entradaFalsa({ titulo: 'Focaccia', capturado: '2026-09-01T10:00:00Z' })]
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

  it('la fila muestra el título y la fecha, y nada más', () => {
    const html = renderBorradores({ borradores: [entradaFalsa({ titulo: 'Focaccia', nombre_archivo: 'focaccia.md' })] });
    expect(html).toContain('Focaccia');
    expect(html).not.toContain('focaccia.md');
  });

  it('el control de alta dice Nuevo', () => {
    expect(renderBorradores({ borradores: [] })).toContain('Nuevo</button>');
  });

  it('cada borrador lleva al suyo', () => {
    expect(renderBorradores({ borradores: [entradaFalsa({ id_archivo: 'b7' })] }))
      .toContain('href="#/borradores/b7"');
  });

  it('Borradores ofrece pegar una receta', () => {
    expect(renderBorradores({ borradores: [] })).toContain('data-accion="pegar-receta"');
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

  it('la fuente lleva el mismo rótulo que en la receta', () => {
    const html = renderBorrador({ borrador: borradorFalso({ fuente: 'https://x/1' }), confirmando: false });
    expect(html).toContain('>📖</span>fuente: ');
  });

  it('cuándo se capturó va al margen, a la derecha', () => {
    const html = renderBorrador({ borrador: borradorFalso({ capturado: '2026-09-01T10:00:00Z' }), confirmando: false });
    expect(html).toContain('text-align:right">Capturado');
  });

  it('la fuente no se edita', () => {
    const html = renderBorrador({ borrador: borradorFalso({ fuente: 'https://x/1' }), confirmando: false });
    expect(html).not.toContain('name="fuente"');
  });

  it('crear la receta a mano sigue disponible junto a las de Claude', () => {
    const html = renderBorrador({ borrador: borradorFalso(), confirmando: false });
    expect(html).toContain('Crear la receta');
  });

  it('el borrador ofrece convertir con Claude y pegar la receta', () => {
    const html = renderBorrador({ borrador: borradorFalso(), confirmando: false });
    expect(html).toContain('data-accion="convertir-con-claude"');
    expect(html).toContain('>Convertir con Claude<');
    expect(html).toContain('data-accion="pegar-receta"');
    expect(html.indexOf('convertir-con-claude')).toBeLessThan(html.indexOf('crear-receta'));
  });

  it('un aviso del borrador se muestra sin botón de reintentar', () => {
    const html = renderBorrador({
      borrador: borradorFalso(), confirmando: false, aviso: 'Lo copiado no es una receta en .md.'
    });
    expect(html).toContain('Lo copiado no es una receta en .md.');
    expect(html).not.toContain('data-accion="reintentar"');
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
    // En el cuerpo: la fuente, descartar y crear, en ese orden.
    expect(html.indexOf('Ir a la fuente')).toBeLessThan(html.indexOf('data-accion="descartar"'));
    expect(html.indexOf('data-accion="descartar"')).toBeLessThan(html.indexOf('data-accion="crear-receta"'));
  });

  it('descartar lleva el tacho, como borrar una receta', () => {
    const html = renderBorrador({ borrador: borradorFalso(), confirmando: false });
    expect(html).toContain(`data-accion="descartar">${ICO.tacho}Descartar</button>`);
  });

  it('mientras confirma, las acciones no están: no se crea por error', () => {
    const html = renderBorrador({ borrador: borradorFalso(), confirmando: true });
    expect(html).not.toContain('data-accion="crear-receta"');
  });
});

describe('las fotos del borrador', () => {
  const conFotos = borradorFalso({ nota: 'Página 84.', fotos: ['f1', 'f2'] });
  const fotos = [{ id: 'f1', url: 'blob:1' }, { id: 'f2', url: null }];

  it('debajo de la nota, las miniaturas: tocarla abre el visor, y cada una tiene su ×', () => {
    const html = renderBorrador({ borrador: conFotos, confirmando: false, fotos });
    expect(html.indexOf('Página 84.')).toBeLessThan(html.indexOf('class="miniaturas"'));
    expect(html).toContain('data-accion="ver-foto" data-valor="f1"');
    expect(html).toContain('<img src="blob:1"');
    expect(html).toContain('data-accion="sacar-foto" data-valor="f1"');
    expect(html).toContain('data-accion="sacar-foto" data-valor="f2"');
  });

  it('una foto que ya no está en Drive es un recuadro que lo dice, sin visor', () => {
    const html = renderBorrador({ borrador: conFotos, confirmando: false, fotos });
    expect(html).toContain('La foto ya no está en Drive.');
    expect(html).not.toContain('data-accion="ver-foto" data-valor="f2"');
  });

  it('Cámara y Galería al final mientras haya menos de cinco (P50)', () => {
    const html = renderBorrador({ borrador: conFotos, confirmando: false, fotos });
    expect(html).toContain('Cámara');
    expect(html).toContain('Galería');
    const cinco = Array.from({ length: 5 }, (_, i) => ({ id: `f${i}`, url: `blob:${i}` }));
    const llena = renderBorrador({ borrador: conFotos, confirmando: false, fotos: cinco });
    expect(llena).not.toContain('Cámara');
    expect(llena).not.toContain('Galería');
  });

  it('el visor muestra la foto sobre un velo y se cierra tocando cualquier lado', () => {
    const html = renderBorrador({ borrador: conFotos, confirmando: false, fotos, visor: 'blob:1' });
    expect(html).toContain('<div class="visor" data-accion="cerrar-visor"><img src="blob:1"');
  });

  it('sin fotos, igual se ofrece agregar', () => {
    const html = renderBorrador({ borrador: borradorFalso(), confirmando: false });
    expect(html).toContain('Cámara');
    expect(html).toContain('Galería');
  });

  it('los ids se escapan', () => {
    const html = renderBorrador({ borrador: conFotos, confirmando: false, fotos: [{ id: 'a"b', url: 'blob:"x' }] });
    expect(html).toContain('data-valor="a&quot;b"');
    expect(html).not.toContain('blob:"x');
  });
});

describe('renderPreguntaBorrador', () => {
  it('la pregunta lista los borradores y «Ninguno»', () => {
    const html = renderPreguntaBorrador({
      borradores: [entradaFalsa({ id_archivo: 'b1', titulo: 'Focaccia <b>' })]
    });
    expect(html).toContain('¿De qué borrador es esta receta?');
    expect(html).toContain('data-accion="elegir-borrador-recibido" data-valor="b1"');
    expect(html).toContain('Focaccia &lt;b&gt;');
    expect(html).toContain('data-accion="elegir-borrador-recibido" data-valor=""');
    expect(html).toContain('>Ninguno<');
  });
});
