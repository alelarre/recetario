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

/** Lo que hay adentro de una consulta de medios, con los espacios normalizados. */
function enLaConsulta(css: string, consulta: string): string {
  const i = css.indexOf(`@media ${consulta}`);
  if (i < 0) return '';
  const abre = css.indexOf('{', i);
  let nivel = 0;
  let j = abre;
  do {
    if (css[j] === '{') nivel++;
    if (css[j] === '}') nivel--;
    j++;
  } while (nivel > 0 && j < css.length);
  return css.slice(abre + 1, j - 1).replace(/\s+/g, ' ').trim();
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

  it('con una ficha al pie abierta, la página de atrás no se desplaza', () => {
    // Compartir y, con la misma forma, las fichas de fotos del editor.
    expect(BASE).toContain('html:has(:where(.hoja-compartir, .hoja-foto)) { overflow: hidden; }');
    expect(BASE).toContain('.hoja-compartir .copia { overscroll-behavior: contain; }');
  });

  it('con el velo de escritura puesto, la página de atrás tampoco se desplaza (R8)', () => {
    // También mientras dibuja el cierre con el tilde: recién después navega.
    expect(BASE).toContain('html:has(:where(#velo-escritura:not([hidden]))) { overflow: hidden; }');
  });

  it('con el menú lateral desplegado tampoco, y sólo mientras se despliega', () => {
    expect(BASE).toContain('html:has(:where(.velo-lat.on)) { overflow: hidden; }');
    // Desde 900 px el menú es fijo: la traba vive adentro del complemento
    // exacto del `min-width: 900px` del resto del archivo, en vez de
    // destrabarse con otra regla que pueda pisar la de las fichas.
    expect(enLaConsulta(BASE, '(width < 900px)')).toContain('html:has(:where(.velo-lat.on))');
    const destrabas = BASE.split('\n').filter(l => l.includes('html:has') && l.includes('overflow: visible'));
    expect(destrabas).toEqual([]);
  });

  it('las tres trabas de scroll pesan lo mismo: ninguna le gana a otra', () => {
    // `:where()` adentro del `:has()` lleva las tres a la especificidad de
    // `html`. Sin eso, la del menú —dos clases— le ganaba a la de las fichas.
    const trabas = BASE.split('\n').filter(l => l.includes('overflow: hidden;') && l.includes('html:has'));
    expect(trabas.length).toBe(3);
    for (const traba of trabas) expect(traba).toContain('html:has(:where(');
  });

  it('lo que es sólo de un dedo no se dibuja con mouse o trackpad', () => {
    expect(TOKENS).toContain('@media (hover: hover) and (pointer: fine) { .solo-tactil { display: none; } }');
  });

  it('el velo tapa también mientras dibuja el cierre', () => {
    // El tilde se dibuja antes de navegar: ahí abajo sigue estando el editor,
    // y un toque suelto no puede llegarle.
    const regla = BASE.match(/#velo-escritura\.exito\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(regla).not.toContain('pointer-events');
  });
});
