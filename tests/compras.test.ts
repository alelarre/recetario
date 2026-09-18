import { describe, it, expect } from 'vitest';
import { listaDeCompras, textoCompras } from '../src/compras.js';
import { recetaFalsa } from './dobles.js';

/** Una receta con sólo lo que la lista mira: sus ingredientes. */
const con = (ingredientes: string) => recetaFalsa({ ingredientes });

describe('la lista de compras', () => {
  it('suma las cantidades de mismo nombre y misma unidad', () => {
    const lista = listaDeCompras([con('- Harina - 250 g'), con('- Harina - 250 g')]);
    expect(lista.conCantidad).toEqual([{ nombre: 'Harina', cantidad: '500 g' }]);
  });

  it('no convierte: mismo nombre con otra unidad son dos ítems, uno debajo del otro', () => {
    const lista = listaDeCompras([con('- Harina - 500 g'), con('- Harina - 2 tazas')]);
    expect(lista.conCantidad).toEqual([
      { nombre: 'Harina', cantidad: '500 g' },
      { nombre: 'Harina', cantidad: '2 tazas' }
    ]);
  });

  it('la unidad se compara recortada y en minúsculas, y se muestra como vino la primera vez', () => {
    const lista = listaDeCompras([con('- Leche - 250 ML'), con('- Leche - 500 ml ')]);
    expect(lista.conCantidad).toEqual([{ nombre: 'Leche', cantidad: '750 ML' }]);
  });

  it('una cantidad sin unidad suma igual', () => {
    const lista = listaDeCompras([con('- Huevos - 2'), con('- Huevos - 3')]);
    expect(lista.conCantidad).toEqual([{ nombre: 'Huevos', cantidad: '5' }]);
  });

  it('la coma decimal se lee y el resultado se escribe con punto, sin ceros de más', () => {
    const lista = listaDeCompras([con('- Leche - 1,5 l'), con('- Leche - 0,5 l')]);
    expect(lista.conCantidad).toEqual([{ nombre: 'Leche', cantidad: '2 l' }]);
    expect(listaDeCompras([con('- Agua - 1,25 l'), con('- Agua - 0,25 l')]).conCantidad)
      .toEqual([{ nombre: 'Agua', cantidad: '1.5 l' }]);
  });

  it('una cantidad que no empieza con número no se suma con nada', () => {
    const lista = listaDeCompras([con('- Sal - c/n'), con('- Sal - c/n')]);
    expect(lista.conCantidad).toEqual([
      { nombre: 'Sal', cantidad: 'c/n' },
      { nombre: 'Sal', cantidad: 'c/n' }
    ]);
  });

  it('los ingredientes sin cantidad van a su bloque, una vez por nombre', () => {
    const lista = listaDeCompras([con('- Perejil\n- Sal, pimienta'), con('- Perejil')]);
    expect(lista.sinCantidad).toEqual(['Perejil', 'Sal, pimienta']);
    expect(lista.conCantidad).toEqual([]);
  });

  it('los nombres se comparan tal como están escritos, sin normalizar', () => {
    const lista = listaDeCompras([con('- Papa - 1 kg'), con('- papa - 1 kg')]);
    expect(lista.conCantidad).toHaveLength(2);
    expect(lista.conCantidad.map(i => i.nombre).sort()).toEqual(['Papa', 'papa']);
  });

  it('la misma receta dos veces cuenta dos veces', () => {
    const receta = con('- Harina - 250 g');
    expect(listaDeCompras([receta, receta]).conCantidad)
      .toEqual([{ nombre: 'Harina', cantidad: '500 g' }]);
  });

  it('ordena alfabético por nombre en los dos bloques', () => {
    const lista = listaDeCompras([con('- Zanahoria - 2\n- Ajo - 1\n- Perejil\n- Ají')]);
    expect(lista.conCantidad.map(i => i.nombre)).toEqual(['Ajo', 'Zanahoria']);
    expect(lista.sinCantidad).toEqual(['Ají', 'Perejil']);
  });

  it('para el mismo nombre, el orden es el de aparición', () => {
    const lista = listaDeCompras([con('- Harina - 2 tazas'), con('- Harina - 500 g')]);
    expect(lista.conCantidad.map(i => i.cantidad)).toEqual(['2 tazas', '500 g']);
  });

  it('los grupos de ingredientes no cambian nada: se juntan todos', () => {
    const lista = listaDeCompras([con('### Para la masa\n- Harina - 250 g\n### Para el relleno\n- Harina - 250 g')]);
    expect(lista.conCantidad).toEqual([{ nombre: 'Harina', cantidad: '500 g' }]);
  });

  it('sin recetas, los dos bloques quedan vacíos', () => {
    expect(listaDeCompras([])).toEqual({ conCantidad: [], sinCantidad: [] });
  });
});

describe('la lista como texto', () => {
  it('lleva las dos secciones en negrita de WhatsApp y un ítem por línea', () => {
    const lista = listaDeCompras([con('- Harina - 500 g\n- Sal')]);
    expect(textoCompras(lista)).toBe('*Con cantidad*\n- Harina: 500 g\n\n*Sin cantidad*\n- Sal');
  });

  it('una sección vacía no se escribe', () => {
    expect(textoCompras(listaDeCompras([con('- Sal')]))).toBe('*Sin cantidad*\n- Sal');
    expect(textoCompras({ conCantidad: [], sinCantidad: [] })).toBe('');
  });
});
