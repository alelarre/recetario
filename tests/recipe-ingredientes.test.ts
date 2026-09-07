import { describe, it, expect } from 'vitest';
import { parseIngrediente, ingredientesIndexables } from '../src/recipe.js';

describe('parseIngrediente', () => {
  it('parte el ítem en nombre + separador + cantidad', () => {
    expect(parseIngrediente('- Milanesas de nalga — 4'))
      .toEqual({ nombre: 'Milanesas de nalga', cantidad: '4', crudo: '- Milanesas de nalga — 4' });
  });

  it('acepta los cinco separadores', () => {
    for (const [linea, nombre, cantidad] of [
      ['Muzzarella | 200 g', 'Muzzarella', '200 g'],
      ['Anchoítas — 18-20 medianas', 'Anchoítas', '18-20 medianas'],
      ['Aceite - 6 cucharadas', 'Aceite', '6 cucharadas'],
      ['Sal; c/n', 'Sal', 'c/n'],
      ['Provenzal, 1 cucharada', 'Provenzal', '1 cucharada']
    ] as const) {
      expect(parseIngrediente(linea)).toMatchObject({ nombre, cantidad });
    }
  });

  it('manda el primer separador que aparece', () => {
    expect(parseIngrediente('Aceite de oliva - 50 cc (2 cdas.); tibio'))
      .toMatchObject({ nombre: 'Aceite de oliva', cantidad: '50 cc (2 cdas.); tibio' });
  });

  it('la coma solo separa si lo que sigue empieza con un dígito', () => {
    expect(parseIngrediente('Sal, pimienta')).toMatchObject({ nombre: 'Sal, pimienta', cantidad: null });
    expect(parseIngrediente('Orégano, pimentón, comino, etc'))
      .toMatchObject({ nombre: 'Orégano, pimentón, comino, etc', cantidad: null });
    expect(parseIngrediente('Harina 0000, 200gr?')).toMatchObject({ nombre: 'Harina 0000', cantidad: '200gr?' });
  });

  it('un ítem sin separador es un ingrediente sin cantidad', () => {
    expect(parseIngrediente('- Ramitas de hinojo fresco'))
      .toMatchObject({ nombre: 'Ramitas de hinojo fresco', cantidad: null });
    expect(parseIngrediente('500gr de anillos de calamar'))
      .toMatchObject({ nombre: '500gr de anillos de calamar', cantidad: null });
  });

  it('descarta los espacios alrededor del separador y conserva el resto', () => {
    expect(parseIngrediente('  Melón   —   1/2 mediano  '))
      .toMatchObject({ nombre: 'Melón', cantidad: '1/2 mediano' });
  });

  it('un ítem que empieza con el separador es cantidad sin nombre y no rompe', () => {
    expect(parseIngrediente('- — 4')).toMatchObject({ nombre: '', cantidad: '4' });
  });

  it('ignora lo que no es un ingrediente', () => {
    expect(parseIngrediente('')).toBe(null);
    expect(parseIngrediente('   ')).toBe(null);
    expect(parseIngrediente('### Para la milanesa')).toBe(null);
    expect(parseIngrediente(42)).toBe(null);
    expect(parseIngrediente(null)).toBe(null);
  });
});

describe('ingredientesIndexables', () => {
  it('devuelve los nombres tal como están escritos, sin normalizar', () => {
    const receta = { ingredientes: '- Merluza o pescadilla — 1 kg\n- Aceitunas verdes | 50 g' };
    expect(ingredientesIndexables(receta)).toEqual(['Merluza o pescadilla', 'Aceitunas verdes']);
  });

  it('saltea los grupos y los ítems sin nombre', () => {
    const receta = { ingredientes: '### Para la salsa\n- Sal\n- — 4\n' };
    expect(ingredientesIndexables(receta)).toEqual(['Sal']);
  });

  it('no repite un nombre que aparece dos veces', () => {
    const receta = { ingredientes: '- Aceite de oliva — 6 cdas\n- Aceite de oliva | 50 cc' };
    expect(ingredientesIndexables(receta)).toEqual(['Aceite de oliva']);
  });
});
