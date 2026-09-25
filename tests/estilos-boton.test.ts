// Hay botones de la app que son enlaces y no `<button>` —«Categorías ›» en
// Ajustes y «+ Nueva» en la lista de categorías—, así que el navegador los subraya salvo que `.btn` lo apague. Se
// ve sólo mirando la pantalla: sin este test la regla se pierde en silencio.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const TOKENS = readFileSync(new URL('../src/ui/tokens.css', import.meta.url), 'utf8');

const BASE = readFileSync(new URL('../src/ui/base.css', import.meta.url), 'utf8');

describe('el botón', () => {
  // `.btn` pone `display: inline-flex`, que le gana al `hidden` del navegador:
  // Convertir con Agente se oculta con el atributo cuando se suelta `borrador`.
  it('oculto al pie del editor, no ocupa lugar', () => {
    expect(BASE).toMatch(/^\.acciones-editor \.btn\[hidden\] \{ display: none; \}/m);
  });

  // Los tres botones del pie del editor se separan con el `gap` del bloque y
  // nada más: un margen propio sumaría otro aire distinto entre ellos, y
  // del formulario lo separa el `gap` de `.cuerpo`, como a una ficha.
  it('al pie del editor, los separa sólo el gap del bloque, de la escala', () => {
    const regla = BASE.match(/^\.acciones-editor \{([^}]*)\}/m)?.[1] ?? '';
    expect(regla).toContain('gap: var(--e-2)');
    expect(regla).not.toContain('margin');
  });

  it('no se subraya, aunque sea un <a>', () => {
    const regla = TOKENS.match(/^\.btn \{([^}]*)\}/m)?.[1] ?? '';
    expect(regla).toContain('text-decoration: none');
  });
});
