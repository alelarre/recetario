// La grilla del plan vive sólo en el CSS: ningún otro test la mira, y sin
// estas reglas las celdas se apilan en una columna y el pie deja de ser pie.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const BASE = readFileSync(new URL('../src/ui/base.css', import.meta.url), 'utf8');
const TOKENS = readFileSync(new URL('../src/ui/tokens.css', import.meta.url), 'utf8');

describe('el CSS del plan de la semana', () => {
  it('la grilla es tres columnas: el día, mediodía y noche', () => {
    expect(BASE).toContain('.grilla-sem { display: grid; grid-template-columns: 52px 1fr 1fr;');
  });

  it('la celda vacía se dibuja punteada y la línea toma el color de su categoría', () => {
    expect(BASE).toContain('.celda.libre');
    expect(BASE).toContain('border: 1px dashed var(--borde)');
    expect(BASE).toContain('border-left: 3px solid var(--c, var(--borde))');
  });

  it('la receta que ya no está va tachada, con el borde en error', () => {
    expect(BASE).toContain('.celda .it.ida');
    expect(BASE).toContain('border-left-color: var(--error)');
  });

  it('el pie queda pegado abajo y sus botones ocupan el ancho', () => {
    expect(BASE).toContain('.pie-plan { position: sticky; bottom: 0;');
    expect(BASE).toContain('.pie-plan .btn { width: 100%; }');
  });

  it('la tarjeta que suma al plan es un botón y se ve como la tarjeta link', () => {
    expect(TOKENS).toContain('button.tarjeta');
  });
});
