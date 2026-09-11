// tests/vistas-listas.test.js
import { describe, it, expect } from 'vitest';
import { entradaFalsa } from './dobles.js';
import { renderLista } from '../src/ui/lista.js';

const ENTRADAS = [
  entradaFalsa({ id_archivo: 'r1', titulo: 'Milanesas napolitanas', rinde: '4 porciones', tiempo: '40 min', dificultad: 'fácil', tags: ['horno'] }),
  entradaFalsa({ id_archivo: 'r2', titulo: 'Matambre a la pizza', tags: ['incompleto'] })
];

// El home se fue: lo reemplaza el Recetario y sus tests son
// tests/vista-recetario.test.ts. Lo que queda acá es la lista de v1, que se
// va entera con la Tarea 15.
describe('renderLista', () => {
  it('la categoría se encabeza con su foto; la búsqueda no', () => {
    // La foto es la misma del tile que se acaba de tocar: confirma dónde
    // entraste sin leer el título. En la búsqueda el título es el texto
    // buscado, que no tiene ni foto ni color, así que ahí no va la cabecera.
    const cat = renderLista({ titulo: 'Pescados y mariscos', categoria: 'Pescados y mariscos', entradas: ENTRADAS });
    expect(cat).toContain('cabecera-cat');
    expect(cat).toContain('<img');

    const busqueda = renderLista({ titulo: '"berenjena"', grupos: { porNombre: [], porIngrediente: [] } });
    expect(busqueda).not.toContain('cabecera-cat');
  });

  it('una categoría sin foto se encabeza igual, con su color plano', () => {
    // "Sin categorizar" es la raíz y no tiene .webp: la cabecera no puede
    // desaparecer por eso, porque entonces esa pantalla vuelve a quedar sin
    // encabezado mientras las otras quince lo tienen.
    const html = renderLista({ titulo: 'Sin categorizar', categoria: 'Sin categorizar', entradas: [] });
    expect(html).toContain('cabecera-cat');
    expect(html).not.toContain('<img');
  });

  it('dibuja una fila por receta con la meta en una línea', () => {
    const html = renderLista({ titulo: 'Carnes', entradas: ENTRADAS });
    expect(html).toContain('Milanesas napolitanas');
    expect(html).toContain('4 porciones · 40 min · fácil');
  });

  it('marca con la clase incompleto solo a las que tienen el tag', () => {
    const html = renderLista({ titulo: 'Carnes', entradas: ENTRADAS });
    const filas = html.split('class="fila');
    expect(filas[1]).not.toContain('incompleto');
    expect(filas[2]).toContain('incompleto');
  });

  it('dibuja los chips y marca los activos', () => {
    const html = renderLista({ titulo: 'Carnes', entradas: ENTRADAS, tags: [{ tag: 'horno', cantidad: 1 }], tagsActivos: ['horno'] });
    expect(html).toContain('aria-pressed="true"');
  });

  it('una categoría vacía dice qué hacer, no queda en blanco', () => {
    const html = renderLista({ titulo: 'Carnes', entradas: [],
      vacio: { titulo: 'Todavía no hay nada acá', detalle: 'Las recetas entran como .md en Drive.' } });
    expect(html).toContain('Todavía no hay nada acá');
    expect(html).toContain('Las recetas entran como .md en Drive.');
  });

  it('la búsqueda separa las coincidencias por nombre de las de ingrediente', () => {
    // El motor ya matcheaba las dos cosas, pero devolvía una lista plana:
    // buscabas "berenjena" y no sabías por qué había aparecido cada resultado.
    const html = renderLista({ titulo: '"berenjena"', grupos: {
      porNombre: [entradaFalsa({ id_archivo: 'a', titulo: 'Escabeche de berenjenas', categoria: 'Entradas y picadas' })],
      porIngrediente: [entradaFalsa({ id_archivo: 'b', titulo: 'Baba ganush', categoria: 'Entradas y picadas' })],
    } });
    expect(html).toContain('Por nombre · 1');
    expect(html).toContain('Por ingrediente · 1');
    expect(html).toContain('<span class="cuenta">2</span>');
  });

  it('el chip de color aparece en la búsqueda y no dentro de una categoría', () => {
    // Vienen categorías mezcladas: ahí el color informa. Dentro de una
    // categoría serían veinte cuadraditos iguales que no dicen nada.
    const entrada = entradaFalsa({ id_archivo: 'a', titulo: 'X', categoria: 'Carnes' });
    const busqueda = renderLista({ titulo: '"x"', grupos: { porNombre: [entrada], porIngrediente: [] } });
    const categoria = renderLista({ titulo: 'Carnes', entradas: [entrada] });
    expect(busqueda).toContain('class="marca"');
    expect(categoria).not.toContain('class="marca"');
  });
});
