// tests/vistas-listas.test.js
import { describe, it, expect } from 'vitest';
import { entradaFalsa } from './dobles.js';
import { renderHome } from '../src/ui/home.js';
import { renderLista } from '../src/ui/lista.js';

const ENTRADAS = [
  entradaFalsa({ id_archivo: 'r1', titulo: 'Milanesas napolitanas', rinde: '4 porciones', tiempo: '40 min', dificultad: 'fácil', tags: ['horno'] }),
  entradaFalsa({ id_archivo: 'r2', titulo: 'Matambre a la pizza', tags: ['incompleto'] })
];

describe('renderHome', () => {
  it('dibuja un tile por categoría con su conteo', () => {
    const html = renderHome({ categorias: [{ id: 'c1', nombre: 'Carnes', cantidad: 33 }] });
    expect(html).toContain('Carnes');
    expect(html).toContain('33');
    expect(html).toContain('href="#/c/Carnes"');
  });

  it('escapa los nombres de categoría', () => {
    const html = renderHome({ categorias: [{ id: 'c1', nombre: '<b>x</b>', cantidad: 1 }] });
    expect(html).not.toContain('<b>x</b>');
  });

  it('ofrece reconstruir con la fecha de la última reconstrucción', () => {
    const html = renderHome({ categorias: [], ultimaReconstruccion: '2026-09-01T10:00:00.000Z' });
    expect(html).toContain('Reconstruir índice');
    expect(html).toContain('2026');
    // La hora importa: si reconstruyo dos veces el mismo día, sin hora no se
    // distingue si la última corrida es la mía o la de la mañana.
    expect(html).toMatch(/\d{2}:\d{2}/);
  });

  it('ofrece reconectar la cuenta', () => {
    expect(renderHome({ categorias: [] })).toContain('Reconectar cuenta');
  });
});

  it('ordena las categorías alfabéticamente, no por cantidad', () => {
    // Por cantidad, la grilla se reacomodaría entera cada vez que se agrega
    // una receta y se perdería la posición aprendida.
    const html = renderHome({ categorias: [
      { nombre: 'Postres', cantidad: 7 },
      { nombre: 'Arroces y legumbres', cantidad: 3 },
      { nombre: 'Carnes', cantidad: 4 },
    ] });
    expect(html.indexOf('Arroces y legumbres')).toBeLessThan(html.indexOf('Carnes'));
    expect(html.indexOf('Carnes')).toBeLessThan(html.indexOf('Postres'));
  });

  it('pliega las categorías vacías sin hacerlas desaparecer', () => {
    // Crear una carpeta en Drive tiene que seguir siendo evidente.
    const cats = [{ nombre: 'Carnes', cantidad: 4 }, { nombre: 'Pastas', cantidad: 0 }];
    const plegado = renderHome({ categorias: cats });
    expect(plegado).toContain('1 categoría vacía');
    expect(plegado).not.toContain('#/c/Pastas');

    const abierto = renderHome({ categorias: cats, vaciasVisibles: true });
    expect(abierto).toContain('#/c/Pastas');
  });

  it('«Nueva» sale del menú de mantenimiento', () => {
    // Convivía con Reconstruir índice y Reconectar cuenta: una acción de todos
    // los días mezclada con lo que se usa una vez por mes.
    const html = renderHome({ categorias: [] });
    const menu = html.slice(html.indexOf('class="menu"'));
    expect(menu).not.toContain('#/nueva');
    expect(html).toContain('class="alta" href="#/nueva"');
  });

  it('«Nueva» está en el encabezado, no al pie de los tiles', () => {
    // Al pie hay que pasar dieciséis tiles para encontrarla, que no es donde
    // nadie la busca. Se fija el lugar: sin esto, nada impide que vuelva.
    const html = renderHome({ categorias: [] });
    const encabezado = html.slice(html.indexOf('<header'), html.indexOf('</header>'));
    expect(encabezado).toContain('#/nueva');
    // Y queda antes del ⋯, que es la acción menos frecuente de las dos.
    expect(encabezado.indexOf('#/nueva')).toBeLessThan(encabezado.indexOf('data-accion="menu"'));
  });

describe('renderLista', () => {
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
