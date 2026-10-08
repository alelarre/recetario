import { describe, it, expect } from 'vitest';
import {
  leerDuracion, leerMarca, nombreDeMarca, escribirMarca, quitarMarcas, marcasMalFormadas,
  agregarAlFinal, sinMarcas, PATRON_MARCA, DURACION_MAXIMA
} from '../src/marcas.js';
import { parse } from '../src/recipe.js';

const MIN = 60_000;
const marcaDe = (s: string) => {
  const m = [...s.matchAll(PATRON_MARCA)][0];
  return m ? leerMarca(m[1] ?? '', m[2] ?? '', m[3] ?? '', m[4] ?? '') : undefined;
};

describe('la duración', () => {
  it('m:ss y h:mm:ss', () => {
    expect(leerDuracion('0:30')).toBe(30_000);
    expect(leerDuracion('50:00')).toBe(50 * MIN);
    expect(leerDuracion('1:30:00')).toBe(90 * MIN);
    expect(leerDuracion('23:59:59')).toBe(DURACION_MAXIMA);
  });
  it('lo que no se lee, cero o más de 23:59:59 no es duración', () => {
    for (const s of ['', '50', '1:5', '1:5:00', '1:60', 'a:00', '0:00', '0:00:00', '24:00:00', '1:00:00:00', ' 5:00']) {
      expect(leerDuracion(s)).toBeNull();
    }
  });
});

describe('leer una marca', () => {
  it('una cuenta con texto y etiqueta', () => {
    expect(marcaDe('durante [50 minutos](cuenta:50:00 "cocinar").'))
      .toEqual({ tipo: 'cuenta', texto: '50 minutos', etiqueta: 'cocinar', duracion: 50 * MIN });
  });
  it('la etiqueta entre comillas puede llevar un paréntesis', () => {
    expect(marcaDe('Hornear [5 min](cuenta:5:00 "a (b)") y listo'))
      .toEqual({ tipo: 'cuenta', texto: '5 min', etiqueta: 'a (b)', duracion: 5 * MIN });
  });
  it('sin etiqueta y sin texto', () => {
    expect(marcaDe('[](cuenta:4:00)')).toEqual({ tipo: 'cuenta', texto: '', etiqueta: '', duracion: 4 * MIN });
  });
  it('un cronómetro, con y sin etiqueta', () => {
    expect(marcaDe('[hasta que esté liso](cronometro: "amasar")'))
      .toEqual({ tipo: 'cronometro', texto: 'hasta que esté liso', etiqueta: 'amasar', duracion: null });
    expect(marcaDe('[](cronometro:)')).toEqual({ tipo: 'cronometro', texto: '', etiqueta: '', duracion: null });
  });
  it('mal formadas: null', () => {
    expect(marcaDe('[x](cuenta:5)')).toBeNull();
    expect(marcaDe('[x](cuenta:0:00)')).toBeNull();
    expect(marcaDe('[x](cuenta:5:00 hornear)')).toBeNull();
    expect(marcaDe('[x](cuenta:5:00 "hornear)')).toBeNull();
    expect(marcaDe('[x](cronometro:5:00)')).toBeNull();
  });
  it('un link común no es marca', () => {
    expect(marcaDe('[sitio](https://a.com)')).toBeUndefined();
  });
});

describe('el nombre', () => {
  it('la etiqueta, el texto, o el de por defecto', () => {
    expect(nombreDeMarca({ tipo: 'cuenta', texto: '50 minutos', etiqueta: 'cocinar', duracion: 50 * MIN })).toBe('cocinar');
    expect(nombreDeMarca({ tipo: 'cuenta', texto: '50 minutos', etiqueta: '', duracion: 50 * MIN })).toBe('50 minutos');
    expect(nombreDeMarca({ tipo: 'cuenta', texto: '', etiqueta: '', duracion: 50 * MIN })).toBe('50 min');
    expect(nombreDeMarca({ tipo: 'cronometro', texto: '', etiqueta: '', duracion: null })).toBe('Cronómetro');
  });
});

describe('escribir una marca', () => {
  it('cuenta y cronómetro, con y sin etiqueta', () => {
    expect(escribirMarca({ tipo: 'cuenta', duracion: 50 * MIN, etiqueta: 'cocinar' })).toBe('[](cuenta:50:00 "cocinar")');
    expect(escribirMarca({ tipo: 'cuenta', duracion: 90 * MIN, etiqueta: '' })).toBe('[](cuenta:1:30:00)');
    expect(escribirMarca({ tipo: 'cronometro', duracion: null, etiqueta: ' amasar ' })).toBe('[](cronometro: "amasar")');
    expect(escribirMarca({ tipo: 'cronometro', duracion: null, etiqueta: '' }, 'liso')).toBe('[liso](cronometro:)');
  });
  it('la etiqueta pierde lo que rompería la marca', () => {
    expect(escribirMarca({ tipo: 'cuenta', duracion: MIN, etiqueta: 'a "b") [c]\nd' })).toBe('[](cuenta:1:00 "a b c d")');
  });
  it('lo escrito se vuelve a leer igual', () => {
    expect(marcaDe(escribirMarca({ tipo: 'cuenta', duracion: 50 * MIN, etiqueta: 'cocinar' })))
      .toEqual({ tipo: 'cuenta', texto: '', etiqueta: 'cocinar', duracion: 50 * MIN });
  });
});

describe('quitar y revisar', () => {
  it('quitarMarcas deja el texto de cada marca, válida o no', () => {
    expect(quitarMarcas('durante [50 minutos](cuenta:50:00 "cocinar"). [](cuenta:4:00) [x](cuenta:9)'))
      .toBe('durante 50 minutos.  x');
  });
  it('marcasMalFormadas da las que no se leen', () => {
    expect(marcasMalFormadas('[a](cuenta:5:00) [b](cuenta:5) [c](cronometro:1:00)')).toEqual(['[b](cuenta:5)', '[c](cronometro:1:00)']);
  });
  it('agregarAlFinal: con un espacio, o solo en una línea vacía; fuera de rango no cambia', () => {
    expect(agregarAlFinal('Freír.\nServir.', 1, '[](cronometro:)')).toBe('Freír.\nServir. [](cronometro:)');
    expect(agregarAlFinal('Freír.\n', 1, '[](cronometro:)')).toBe('Freír.\n[](cronometro:)');
    expect(agregarAlFinal('Freír.', 3, '[](cronometro:)')).toBe('Freír.');
  });
  it('sinMarcas limpia todo el cuerpo y deja el frontmatter', () => {
    const r = parse('---\ntitulo: T\n---\nDesc [5 min](cuenta:5:00).\n\n## Preparación\n\n1. Hornear [](cuenta:1:00:00 "horno").\n\n## Pasos extra\n\nOtra [x](cronometro:)\n');
    const limpia = sinMarcas(r);
    expect(limpia.titulo).toBe('T');
    expect(limpia.descripcion).not.toContain('cuenta:');
    expect(limpia.preparacion).toBe('1. Hornear .');
    expect(limpia.otras[0]?.cuerpo).toBe('Otra x');
  });
});
