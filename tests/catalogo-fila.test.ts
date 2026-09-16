import { describe, it, expect } from 'vitest';
import { tagReservado, TAGS_RESERVADOS } from '../src/catalogo.js';
import { invalido } from './aserciones.js';
import { parse } from '../src/recipe.js';
import { COLUMNAS, filaDesde, entradaDesdeFila, dificultadValida } from '../src/catalogo.js';

const UBICACION = { id: 'id1', nombre_archivo: 'milanesas.md', categoria: 'Carnes', carpeta_id: 'c1', mtime: 1700000000000 };

const RECETA = parse(`---
titulo: Milanesas napolitanas
tags: [italiana, horno]
rinde: 4 porciones
tiempo: 40 min
dificultad: fácil
fuente: Cuaderno
---

## Ingredientes
- 200 g de muzzarella
- 4 milanesas de nalga
`);

describe('filaDesde', () => {
  it('tiene exactamente las trece columnas del §4.3, en orden', () => {
    expect(COLUMNAS).toHaveLength(13);
    expect(filaDesde(RECETA, UBICACION)).toHaveLength(13);
  });

  it('la fila no tiene la columna completa', () => {
    expect(COLUMNAS).not.toContain('completa');
  });

  it('mapea cada campo a su columna', () => {
    const f = filaDesde(RECETA, UBICACION);
    expect(f[COLUMNAS.indexOf('id_archivo')]).toBe('id1');
    expect(f[COLUMNAS.indexOf('titulo')]).toBe('Milanesas napolitanas');
    expect(f[COLUMNAS.indexOf('categoria')]).toBe('Carnes');
    expect(f[COLUMNAS.indexOf('mtime')]).toBe('1700000000000');
  });

  it('junta tags e ingredientes con barra vertical', () => {
    const f = filaDesde(RECETA, UBICACION);
    expect(f[COLUMNAS.indexOf('tags')]).toBe('italiana|horno');
    expect(f[COLUMNAS.indexOf('ingredientes')]).toBe('200 g de muzzarella|4 milanesas de nalga');
  });

  it('un tag con barra vertical no rompe la celda al releer', () => {
    const receta = { ...RECETA, tags: ['sin|gluten', 'horno'] };
    const f = filaDesde(receta, UBICACION);
    expect(f[COLUMNAS.indexOf('tags')]).toBe('singluten|horno');
    const e = entradaDesdeFila(f);
    expect(e.tags).toEqual(['singluten', 'horno']);  // dos tags, no tres tras el split
  });

  it('un ingrediente con barra vertical no rompe la celda al releer', () => {
    const receta = { ...RECETA, ingredientes: '- queso|crema\n- 200 g de sal' };
    const f = filaDesde(receta, UBICACION);
    expect(f[COLUMNAS.indexOf('ingredientes')]).toBe('queso|200 g de sal');
    const e = entradaDesdeFila(f);
    expect(e.ingredientes).toEqual(['queso', '200 g de sal']);  // dos ingredientes, no tres tras el split
  });

  it('escribe cadena vacía y nunca null para lo que falta', () => {
    const f = filaDesde(parse(`---\ntitulo: X\n---\n`), UBICACION);
    expect(f.every(celda => typeof celda === 'string')).toBe(true);
  });

  it('no escribe la descripción en ninguna columna', () => {
    const r = parse(`---\ntitulo: X\n---\n\nUna descripción larga.\n`);
    expect(filaDesde(r, UBICACION).join('|')).not.toContain('descripción larga');
  });

  it('la fila lleva foto', () => {
    const receta = parse('---\ntitulo: A\nfoto: https://x/y.jpg\n---\n## Ingredientes\n- Sal\n');
    const fila = filaDesde(receta, { id: 'f1', categoria: 'Carnes' });
    expect(fila[COLUMNAS.indexOf('foto')]).toBe('https://x/y.jpg');
  });

  it('los ingredientes van tal como están escritos, sin bajar a minúsculas', () => {
    const receta = parse('---\ntitulo: A\n---\n## Ingredientes\n- Merluza o pescadilla — 1 kg');
    expect(filaDesde(receta, { id: 'f1' })[COLUMNAS.indexOf('ingredientes')]).toBe('Merluza o pescadilla');
  });

  // Tests de defensa
  it('tolera receta null', () => {
    const f = filaDesde(null, UBICACION);
    expect(f).toHaveLength(13);
    expect(f.every(celda => typeof celda === 'string')).toBe(true);
  });

  it('tolera receta como número', () => {
    const f = filaDesde(invalido(42), UBICACION);
    expect(f).toHaveLength(13);
    expect(f.every(celda => typeof celda === 'string')).toBe(true);
  });

  it('tolera receta como objeto incompleto', () => {
    const f = filaDesde({ titulo: 'X' }, UBICACION);
    expect(f).toHaveLength(13);
    expect(f.every(celda => typeof celda === 'string')).toBe(true);
  });

  it('tolera ubicacion null', () => {
    const f = filaDesde(RECETA, null);
    expect(f).toHaveLength(13);
    expect(f.every(celda => typeof celda === 'string')).toBe(true);
  });

  it('tolera ubicacion como número', () => {
    const f = filaDesde(RECETA, invalido(42));
    expect(f).toHaveLength(13);
    expect(f.every(celda => typeof celda === 'string')).toBe(true);
  });

  it('tolera ubicacion como objeto incompleto', () => {
    const f = filaDesde(RECETA, { id: 'id1' });
    expect(f).toHaveLength(13);
    expect(f.every(celda => typeof celda === 'string')).toBe(true);
  });
});

describe('entradaDesdeFila', () => {
  it('es la inversa de filaDesde', () => {
    const e = entradaDesdeFila(filaDesde(RECETA, UBICACION));
    expect(e.id_archivo).toBe('id1');
    expect(e.tags).toEqual(['italiana', 'horno']);
    expect(e.ingredientes).toEqual(['200 g de muzzarella', '4 milanesas de nalga']);
    expect(e.mtime).toBe(1700000000000);
  });

  it('tolera una fila corta sin romper', () => {
    const e = entradaDesdeFila(['id1', 'x.md', 'X']);
    expect(e.titulo).toBe('X');
    expect(e.tags).toEqual([]);
    expect(e.mtime).toBe(0);
  });

  // Tests de defensa
  it('tolera fila null', () => {
    const e = entradaDesdeFila(null);
    expect(e).toHaveProperty('tags');
    expect(Array.isArray(e.tags)).toBe(true);
    expect(e.mtime).toBe(0);
  });

  it('tolera fila como string', () => {
    const e = entradaDesdeFila('no soy un array');
    expect(e).toHaveProperty('tags');
    expect(Array.isArray(e.tags)).toBe(true);
    expect(e.mtime).toBe(0);
  });

  it('tolera fila más larga que las columnas', () => {
    const fila = Array(20).fill('valor');
    const e = entradaDesdeFila(fila);
    expect(Array.isArray(e.tags)).toBe(true);
    expect(e.mtime).toBe(0);
  });

  it('tolera elementos no-string dentro de la fila', () => {
    const fila = ['id1', 42, null, undefined, true, { x: 1 }, ['arr'], ...Array(7).fill('')];
    const e = entradaDesdeFila(fila);
    expect(e).toHaveProperty('tags');
    expect(Array.isArray(e.tags)).toBe(true);
  });
});

describe('dificultadValida', () => {
  it('acepta los tres valores comparando normalizado', () => {
    expect(dificultadValida('FACIL')).toBe('fácil');
    expect(dificultadValida('difícil')).toBe('difícil');
  });

  it('lo que no matchea cae en vacío en vez de romper el filtro', () => {
    expect(dificultadValida('regular')).toBe('');
    expect(dificultadValida(null)).toBe('');
  });

  // Tests de defensa
  it('tolera cualquier tipo de entrada', () => {
    expect(dificultadValida(undefined)).toBe('');
    expect(dificultadValida(42)).toBe('');
    expect(dificultadValida({})).toBe('');
    expect(dificultadValida([])).toBe('');
    expect(dificultadValida(true)).toBe('');
  });
});

describe('tagReservado', () => {
  it('las cuatro formas de cada palabra reservada', () => {
    for (const t of TAGS_RESERVADOS) expect(tagReservado(t)).toBe(true);
    for (const t of ['incompleta', 'incompletos', 'terminada', 'terminadas',
                     'favorita', 'favoritos', 'favoritas', 'probar']) {
      expect(tagReservado(t)).toBe(true);
    }
  });

  it('no distingue mayúsculas ni acentos', () => {
    expect(tagReservado('INCOMPLETO')).toBe(true);
    expect(tagReservado('Favorito')).toBe(true);
    expect(tagReservado(' probar ')).toBe(true);
  });

  it('cualquier otro tag se puede usar', () => {
    for (const t of ['horno', 'rápido', 'terminar', 'favorable', 'probado']) {
      expect(tagReservado(t)).toBe(false);
    }
  });

  it('no lanza con lo que no es texto', () => {
    expect(tagReservado(null)).toBe(false);
    expect(tagReservado(42)).toBe(false);
  });
});
