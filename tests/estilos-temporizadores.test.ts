// El ícono junto al nombre de un temporizador no trae tamaño propio: sin la
// regla el svg ocupa todo el ancho y se rellena de negro.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const BASE = readFileSync(new URL('../src/ui/base.css', import.meta.url), 'utf8');

const regla = (css: string, selector: string): string =>
  css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';

describe('el ícono del nombre en Temporizadores', () => {
  it('tiene tamaño, trazo y sin relleno', () => {
    const r = regla(BASE, '.temporizador-fila .nom svg');
    expect(r).toContain('width: var(--ico)');
    expect(r).toContain('height: var(--ico)');
    expect(r).toContain('fill: none');
    expect(r).toContain('stroke: currentColor');
    expect(r).toContain('stroke-width: 1.5');
  });

  it('la tira al pie también lo tiene', () => {
    const r = regla(BASE, '.tira svg');
    expect(r).toContain('width: var(--ico)');
    expect(r).toContain('fill: none');
  });
});

describe('Poner, en el paso de una marca del editor', () => {
  it('ocupa el renglón entero', () => {
    expect(regla(BASE, '[data-herramientas-linea] [data-accion="poner-marca"]')).toContain('width: 100%');
  });
});
