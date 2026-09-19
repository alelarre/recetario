// El CSS no lo cubre ningún otro test: estas dos reglas son decisiones que se
// pierden en silencio si alguien las borra, y se ven sólo en el teléfono.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const TOKENS = readFileSync(new URL('../src/ui/tokens.css', import.meta.url), 'utf8');
const BASE = readFileSync(new URL('../src/ui/base.css', import.meta.url), 'utf8');

/** El CSS sin los bloques `@media (hover: hover)`: lo que aplica en el teléfono. */
function sinLosDePuntero(css: string): string {
  const marca = '@media (hover: hover) {';
  let salida = css;
  for (let i = salida.indexOf(marca); i >= 0; i = salida.indexOf(marca, i)) {
    let nivel = 0;
    let j = i + marca.length - 1;
    do {
      if (salida[j] === '{') nivel++;
      if (salida[j] === '}') nivel--;
      j++;
    } while (nivel > 0 && j < salida.length);
    salida = salida.slice(0, i) + salida.slice(j);
  }
  return salida;
}

describe('cómo responden los controles al toque', () => {
  const css = TOKENS + BASE;

  it('ningún hover queda fuera de (hover: hover): en el teléfono se pega después de tocar', () => {
    const sueltos = sinLosDePuntero(css)
      .split('\n')
      .filter(l => l.includes(':hover') && !l.trimStart().startsWith('/*') && !l.trimStart().startsWith('*'));
    expect(sueltos).toEqual([]);
  });

  it('los controles se marcan mientras el dedo está apoyado', () => {
    expect(TOKENS).toContain(':is(.ico, .btn.sec, .btn.pel, .tarjeta, .bor, .lat a):active');
    expect(TOKENS).toContain('.btn.prim:active');
    // Un botón sin acción disponible no se marca.
    expect(TOKENS).toContain('.btn[disabled]:active { background: none; }');
    // El sol y Salir del modo cocina dibujan su caja en un ::before.
    expect(BASE).toContain('.encoc :is([data-accion="wake"], .btn.compacto):active::before');
  });

  it('con la ficha de compartir abierta, la página de atrás no se desplaza', () => {
    expect(BASE).toContain('html:has(.hoja-compartir) { overflow: hidden; }');
    expect(BASE).toContain('.hoja-compartir .copia { overscroll-behavior: contain; }');
  });

  it('el formulario del borrador tiene el ancho de la receta y del editor en pantalla ancha (C05.10.1)', () => {
    const regla = BASE.slice(BASE.indexOf('.hoja {'), BASE.indexOf('}', BASE.indexOf('.hoja {')));
    expect(regla).toContain('max-width: 680px');
    expect(regla).toContain('margin: 0 auto');
  });
});
