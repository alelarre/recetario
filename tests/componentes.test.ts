import { describe, it, expect } from 'vitest';
import {
  tarjeta, placeholder, aviso, encabezado, chipsSueltos, chipTag, iconoDeTag, vacio, tile, carruselTags
} from '../src/ui/componentes.js';
import { entradaFalsa } from './dobles.js';
import { registrarCategorias } from '../src/ui/categorias.js';
import { ICO, ICONO_DE_DURACION as ICO_DUR } from '../src/ui/iconos.js';

describe('tarjeta', () => {
  it('lleva foto, título y la línea de contexto con categoría y duración, con su relojito', () => {
    const html = tarjeta(entradaFalsa({ titulo: 'Rabas', categoria: 'Pescados y mariscos', tiempo: '~30 min', rinde: '4 porciones' }));
    expect(html).toContain('Rabas');
    expect(html).toContain(`Pescados y mariscos · <span class="dur">${ICO_DUR['~30 min']}~30 min</span> · 4 porciones`);
  });

  it('sin duración válida, la línea no la nombra', () => {
    const html = tarjeta(entradaFalsa({ categoria: 'Carnes', tiempo: '55 min', rinde: '4' }));
    expect(html).toContain('Carnes · 4');
    expect(html).not.toContain('class="dur"');
  });

  it('con motivo, la duración va después del motivo', () => {
    const html = tarjeta(entradaFalsa({ tiempo: '>60 min' }), { motivo: 'tiene tag horno' });
    expect(html).toContain(`<span class="motivo">tiene tag horno</span> · <span class="dur">${ICO_DUR['>60 min']}&gt;60 min</span>`);
  });

  it('lleva a la receta', () => {
    expect(tarjeta(entradaFalsa({ id_archivo: 'f1' }))).toContain('href="#/r/f1"');
  });

  it('una receta sin foto lleva el placeholder, no un hueco', () => {
    const html = tarjeta(entradaFalsa({ foto: '' }));
    expect(html).toContain('class="ph"');
    expect(html).not.toContain('<img');
  });

  it('una receta con foto propia la dibuja', () => {
    const html = tarjeta(entradaFalsa({ foto: 'https://x/1.jpg' }));
    expect(html).toContain('<img class="foto" src="https://x/1.jpg"');
    expect(html).not.toContain('class="ph"');
  });

  it('el placeholder ocupa el mismo espacio que una foto', () => {
    expect(placeholder('Carnes')).toContain('class="ph"');
    // Las dos clases fijan 56px en tokens.css: la lista no se desalinea.
  });

  it('el placeholder lleva el color y la foto de la categoría', () => {
    registrarCategorias([{ id: 'c1', nombre: 'Pescados y mariscos', color: 'pescados', foto: 'catalogo:pescados-y-mariscos' }]);
    const html = placeholder('Pescados y mariscos');
    expect(html).toContain('--c:var(--cat-pescados)');
    expect(html).toContain('--img:url(');
  });

  it('una receta incompleta lleva la marca, sin color de error', () => {
    const html = tarjeta(entradaFalsa({ tags: ['incompleta'] }));
    expect(html).toContain('class="inc"');
    expect(html).not.toContain('error');
  });

  it('una receta sin el tag incompleta no lleva ninguna marca', () => {
    expect(tarjeta(entradaFalsa({ tags: [] }))).not.toContain('class="inc"');
  });

  it('en un resultado por ingrediente, la tarjeta dice por qué apareció', () => {
    const html = tarjeta(entradaFalsa({ titulo: 'Gratin' }), { motivo: 'tiene Merluza o pescadilla' });
    expect(html).toContain('tiene Merluza o pescadilla');
  });

  it('escapa el título: un .md lo escribe cualquiera', () => {
    expect(tarjeta(entradaFalsa({ titulo: '<img onerror=alert(1)>' }))).not.toContain('<img onerror');
  });
});

describe('las marcas de la tarjeta', () => {
  it('van juntas arriba a la derecha, en el orden de los especiales', () => {
    const html = tarjeta(entradaFalsa({ titulo: 'Pan', tags: ['incompleta', 'horno', 'favorito', 'probar'] }));
    const esq = html.slice(html.indexOf('class="marcas-esq"'));
    const orden = ['Favorita', 'Para probar', 'Incompleta'].map(n => esq.indexOf(`aria-label="${n}"`));
    expect(orden.every(i => i > 0)).toBe(true);
    expect(orden).toEqual([...orden].sort((a, b) => a - b));
    expect(html).toContain('style="--marcas:3"');
  });

  it('la línea de contexto no lleva ninguna marca', () => {
    const html = tarjeta(entradaFalsa({ titulo: 'Pan', categoria: 'Panes', tags: ['incompleta'] }));
    const inicio = html.indexOf('class="ctx"');
    const ctx = html.slice(inicio, html.indexOf('</span></span>', inicio));
    expect(ctx).not.toContain('class="inc"');
  });

  it('sin especiales no hay esquina', () => {
    expect(tarjeta(entradaFalsa({ titulo: 'Pan', tags: ['horno'] }))).not.toContain('marcas-esq');
  });

  it('la marca de favorito lleva su propia clase, para el relleno de tokens.css', () => {
    const html = tarjeta(entradaFalsa({ titulo: 'Pan', tags: ['favorito', 'incompleta'] }));
    expect(html).toContain('<span class="marca favorita" role="img" aria-label="Favorita">');
    expect(html).toContain('<span class="marca" role="img" aria-label="Incompleta">');
  });
});

describe('aviso', () => {
  it('trae el texto y el control para reintentar', () => {
    const html = aviso({ texto: 'No se pudo guardar.', accion: { etiqueta: 'Reintentar', accion: 'reintentar' } });
    expect(html).toContain('No se pudo guardar.');
    expect(html).toContain('data-accion="reintentar"');
  });

  it('un aviso sin acción no dibuja ningún botón', () => {
    expect(aviso({ texto: 'Se ignoraron 3 archivos.' })).not.toContain('<button');
  });
});

describe('encabezado', () => {
  it('el total va en el encabezado, no en la lista', () => {
    expect(encabezado({ titulo: 'Pescados y mariscos', volver: true, total: 20 })).toContain('>20<');
  });

  it('sin volver no dibuja el botón de volver', () => {
    const html = encabezado({ titulo: 'Recetario' });
    expect(html).not.toContain('data-accion="volver"');
    expect(html).toContain('Recetario');
  });

  it('escapa el título', () => {
    expect(encabezado({ titulo: '<b>x</b>' })).not.toContain('<b>x</b>');
  });
});

describe('chipsSueltos', () => {
  it('marca los activos', () => {
    const html = chipsSueltos(['horno', 'rápido'], ['horno']);
    expect(html).toContain('class="chip act"');
    expect(html).toContain('data-tag="horno"');
  });

  it('en la fila de tags de la receta, incompleta abre el editor en vez de filtrar', () => {
    const html = chipsSueltos(['horno', 'incompleta']);
    expect(html).toContain('data-accion="editar"');
    expect(html).not.toContain('data-tag="incompleta"');
    expect(html.indexOf('incompleta')).toBeLessThan(html.indexOf('horno'));
  });
});

describe('los chips de tags', () => {
  it('cada especial tiene su ícono y los comunes no llevan ninguno', () => {
    expect(iconoDeTag('favorito')).toBe(ICO.estrella);
    expect(iconoDeTag('probar')).toBe(ICO.marcador);
    expect(iconoDeTag('menú diario')).toBe(ICO.calendario);
    expect(iconoDeTag('horno')).toBe('');
  });

  it('incompleta usa la marca de medio círculo como ícono', () => {
    expect(iconoDeTag('incompleta')).toBe('<span class="inc"></span>');
  });

  it('el chip lleva el ícono adelante del nombre', () => {
    expect(chipTag('probar')).toContain(`${ICO.marcador}probar`);
  });

  it('el chip puede llevar su cantidad', () => {
    expect(chipTag('horno', { cantidad: 4 })).toContain('<span class="cuenta">4</span>');
  });

  it('el activo se marca', () => {
    expect(chipTag('horno', { activo: true })).toContain('class="chip act"');
  });

  it('la fila de tags de una receta pone los especiales primero', () => {
    const html = chipsSueltos(['horno', 'menú diario', 'favorito']);
    expect(html.indexOf('favorito')).toBeLessThan(html.indexOf('menú diario'));
    expect(html.indexOf('menú diario')).toBeLessThan(html.indexOf('horno'));
  });

  it('escapa lo que viene del archivo', () => {
    expect(chipTag('<b>x</b>')).toContain('&lt;b&gt;x&lt;/b&gt;');
  });

  it('el fijo va encendido pero no es tocable: sin data-tag y sin ser un botón', () => {
    const html = chipTag('horno', { fijo: true });
    expect(html).toContain('act');
    expect(html).not.toContain('data-tag');
    expect(html).not.toContain('<button');
  });
});

describe('vacio', () => {
  it('es una frase y nada más', () => {
    const html = vacio('Ninguna receta se llama así.');
    expect(html).toContain('Ninguna receta se llama así.');
    expect(html).not.toContain('<button');
  });
});

describe('el carrusel de tags', () => {
  const tags = [
    { tag: 'horno', cantidad: 11 }, { tag: 'favorito', cantidad: 3 },
    { tag: 'clásica', cantidad: 14 }, { tag: 'menú diario', cantidad: 2 }
  ];

  it('pone los especiales primero y después los demás por cantidad', () => {
    const html = carruselTags(tags);
    const orden = ['favorito', 'menú diario', 'clásica', 'horno'].map(t => html.indexOf(`>${t}<`));
    expect(orden).toEqual([...orden].sort((a, b) => a - b));
  });

  it('cada chip lleva su número', () => {
    expect(carruselTags(tags)).toContain('<span class="cuenta">14</span>');
  });

  it('sin tags no dibuja nada', () => {
    expect(carruselTags([])).toBe('');
  });

  it('corta en el tope cuando se lo pasan, sin contar los especiales', () => {
    const muchos = Array.from({ length: 25 }, (_, i) => ({ tag: `t${i}`, cantidad: 25 - i }));
    const html = carruselTags([...muchos, { tag: 'favorito', cantidad: 1 }], { tope: 20 });
    expect(html).toContain('>favorito<');
    expect(html).toContain('>t19<');
    expect(html).not.toContain('>t20<');
  });

  it('lleva las dos flechas y el marco del degradé', () => {
    const html = carruselTags(tags);
    expect(html).toContain('class="carrusel-marco"');
    expect(html).toContain('data-accion="carrusel-izq"');
    expect(html).toContain('data-accion="carrusel-der"');
  });

  it('marca los activos', () => {
    expect(carruselTags(tags, { activos: ['horno'] })).toContain('class="chip act"');
  });

  it('el tag fijo —el de la ruta en la lista por tag— no es tocable (P27 §6)', () => {
    const html = carruselTags(tags, { fijo: 'horno' });
    expect(html).not.toContain('data-tag="horno"');
    // Los demás siguen siendo botones que acumulan como siempre.
    expect(html).toContain('data-tag="clásica"');
  });
});

describe('tile', () => {
  it('lleva la foto de la categoría y su color', () => {
    registrarCategorias([{ id: 'c1', nombre: 'Pescados y mariscos', color: 'pescados', foto: 'catalogo:pescados-y-mariscos' }]);
    const html = tile('Pescados y mariscos');
    expect(html).toContain('--c:var(--cat-pescados)');
    expect(html).toContain('background-image:url(');
    expect(html).toContain('href="#/c/Pescados%20y%20mariscos"');
  });

  it('una categoría sin foto cae en la trama, no en un hueco', () => {
    expect(tile('Fiambres caseros')).toContain('class="im trama"');
  });

  it('el contador aparece cuando la categoría tiene recetas', () => {
    expect(tile('Carnes', 20)).toContain('<span class="cu">20</span>');
  });

  it('en cero no se dibuja: una categoría vacía se muestra igual, sin un 0 encima', () => {
    expect(tile('Carnes', 0)).not.toContain('class="cu"');
    expect(tile('Carnes')).not.toContain('class="cu"');
  });
});
