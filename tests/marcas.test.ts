import { describe, it, expect } from 'vitest';
import {
  leerDuracion, leerMarca, nombreDeMarca, escribirMarca, quitarMarcas, marcasMalFormadas,
  agregarAlFinal, sinMarcas, PATRON_MARCA, DURACION_MAXIMA, duracionDeTexto, envolver
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
  it('la etiqueta, o el de por defecto: el texto entre corchetes no cuenta', () => {
    expect(nombreDeMarca({ tipo: 'cuenta', texto: '50 minutos', etiqueta: 'cocinar', duracion: 50 * MIN })).toBe('cocinar');
    expect(nombreDeMarca({ tipo: 'cuenta', texto: '50 minutos', etiqueta: '', duracion: 50 * MIN })).toBe('50 min');
    expect(nombreDeMarca({ tipo: 'cronometro', texto: 'hasta que esté liso', etiqueta: '', duracion: null })).toBe('Cronómetro');
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

describe('duracionDeTexto: la duración que se propone desde lo seleccionado', () => {
  const d = (s: string) => duracionDeTexto(s);
  const hms = (h: number, m: number, s = 0) => ((h * 60 + m) * 60 + s) * 1000;
  it('cada unidad, en castellano y en inglés', () => {
    for (const s of ['2 horas', '2 hora', '2 h', '2 hs', '2 hs.', '2 hr', '2 hrs', '2 hours', '2 hour', '2h']) expect(d(s)).toBe(hms(2, 0));
    for (const s of ['50 minutos', '50 minuto', '50 min', '50 min.', '50 mins', '50 minutes', "50'"]) expect(d(s)).toBe(hms(0, 50));
    for (const s of ['30 segundos', '30 seg', '30 seg.', '30 segs', '30 s', '30 sec', '30 seconds', "30''"]) expect(d(s)).toBe(hms(0, 0, 30));
  });
  it('sin distinguir mayúsculas ni acentos, con palabras alrededor', () => {
    expect(d('durante 50 MINUTOS')).toBe(hms(0, 50));
    expect(d('Hornear 1 Hora')).toBe(hms(1, 0));
  });
  it('decimales con coma o punto', () => {
    expect(d('1,5 horas')).toBe(hms(1, 30));
    expect(d('2.5 min')).toBe(hms(0, 2, 30));
  });
  it('varios pares se suman', () => {
    expect(d('1 h 30 min')).toBe(hms(1, 30));
    expect(d('1 hora y 15 minutos')).toBe(hms(1, 15));
  });
  it('un rango toma el mayor', () => {
    expect(d('20 a 25 minutos')).toBe(hms(0, 25));
    expect(d('20-25 min')).toBe(hms(0, 25));
    expect(d('20–25 min')).toBe(hms(0, 25));
  });
  it('fracciones y las formas habladas', () => {
    expect(d('½ hora')).toBe(hms(0, 30));
    expect(d('1½ h')).toBe(hms(1, 30));
    expect(d('media hora')).toBe(hms(0, 30));
    expect(d('hora y media')).toBe(hms(1, 30));
    expect(d('una hora y media')).toBe(hms(1, 30));
    expect(d('2 horas y media')).toBe(hms(2, 30));
    expect(d('un cuarto de hora')).toBe(hms(0, 15));
  });
  it('lo que no se entiende no propone nada', () => {
    for (const s of ['', 'hasta que dore', '50', '3 tazas', '10 min y 3 tazas', 'cocinar 5 min, después 10 min', '0 min', '25 horas', '1h30']) {
      expect(d(s)).toBeNull();
    }
  });
});

describe('envolver: la selección pasa a ser el texto de la marca', () => {
  const cuenta = { tipo: 'cuenta' as const, duracion: 50 * MIN, etiqueta: 'cocinar' };
  it('envuelve en su lugar y deja el cursor después de la marca', () => {
    const texto = 'Freír.\nCocinar durante 50 minutos.';
    const desde = texto.indexOf('50');
    const r = envolver(texto, desde, desde + '50 minutos'.length, cuenta);
    expect(r?.texto).toBe('Freír.\nCocinar durante [50 minutos](cuenta:50:00 "cocinar").');
    expect(r?.cursor).toBe(r!.texto.indexOf(').') + 1);
  });
  it('los espacios de las puntas quedan afuera', () => {
    const texto = 'Cocinar durante 50 minutos.';
    const r = envolver(texto, texto.indexOf(' 50'), texto.indexOf('.') , cuenta);
    expect(r?.texto).toBe('Cocinar durante [50 minutos](cuenta:50:00 "cocinar").');
  });
  it('de varias líneas, sólo lo de la primera', () => {
    const texto = 'Cocinar 50 minutos.\nServir.';
    const r = envolver(texto, texto.indexOf('50'), texto.length, cuenta);
    expect(r?.texto).toBe('Cocinar [50 minutos.](cuenta:50:00 "cocinar")\nServir.');
  });
  it('saca corchetes y paréntesis de lo seleccionado y lo usa igual', () => {
    const texto = 'Cocinar 50 minutos (aprox).';
    const r = envolver(texto, texto.indexOf('50'), texto.indexOf(').') + 1, cuenta);
    expect(r?.texto).toBe('Cocinar [50 minutos aprox](cuenta:50:00 "cocinar").');
  });
  it('sin texto útil, o adentro de otra marca, link o foto, no envuelve', () => {
    expect(envolver('a   b', 1, 4, cuenta)).toBeNull();
    expect(envolver('a () b', 2, 4, cuenta)).toBeNull();
    const conMarca = 'Hornear [1 h](cuenta:1:00:00).';
    expect(envolver(conMarca, conMarca.indexOf('1 h'), conMarca.indexOf('1 h') + 3, cuenta)).toBeNull();
    const conFoto = 'Servir ![plato](foto:2) caliente.';
    expect(envolver(conFoto, conFoto.indexOf('plato'), conFoto.indexOf('plato') + 5, cuenta)).toBeNull();
    const conLink = 'Ver [sitio](https://a.com) y servir.';
    expect(envolver(conLink, conLink.indexOf('sitio'), conLink.indexOf('sitio') + 5, cuenta)).toBeNull();
  });
  it('un rango vacío o fuera del texto no envuelve', () => {
    expect(envolver('abc', 1, 1, cuenta)).toBeNull();
    expect(envolver('abc', 2, 9, cuenta)).toBeNull();
  });
});
