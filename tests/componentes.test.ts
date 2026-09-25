import { describe, it, expect } from 'vitest';
import {
  tarjeta, placeholder, aviso, encabezado, chipsSueltos, chipTag, iconoDeTag, vacio, tile, carrusel, carruselTags,
  filaDuraciones, conmutadorOrden, lateral, lateralFijo, conLateral, filaDeFotos
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

  it('una receta con foto propia la dibuja encima del placeholder', () => {
    const html = tarjeta(entradaFalsa({ foto: 'https://x/1.jpg' }));
    expect(html).toContain('<img src="https://x/1.jpg"');
    expect(html).toContain('class="foto"');
    // El placeholder de la categoría está siempre: si la foto no llega —o ya
    // no está en Drive— abajo queda él, y la fila no se mueve (F02.5b).
    expect(html).toContain('class="ph"');
  });

  it('la foto de la receta va adentro del placeholder, y última: se dibuja encima', () => {
    registrarCategorias([{ id: 'c1', nombre: 'Carnes', color: 'carnes', foto: 'catalogo:carnes' }]);
    const html = placeholder('Carnes', 'https://drive.google.com/file/d/abc/view');
    expect(html.indexOf('class="ph"')).toBeLessThan(html.indexOf('data-drive="abc"'));
    expect(html.indexOf('catalogo')).toBeLessThan(html.indexOf('data-drive="abc"'));
    expect(html.endsWith('</span>')).toBe(true);
  });

  it('una foto propia de Drive se dibuja como recuadro, con data-drive', () => {
    const html = tarjeta(entradaFalsa({ foto: 'https://drive.google.com/file/d/abc/view' }));
    expect(html).toContain('data-drive="abc"');
    expect(html).toContain('class="foto"');
  });

  it('el placeholder ocupa el mismo espacio que una foto', () => {
    expect(placeholder('Carnes')).toContain('class="ph"');
    // Las dos clases fijan 56px en tokens.css: la lista no se desalinea.
  });

  it('el placeholder lleva el color y la foto de la categoría', () => {
    registrarCategorias([{ id: 'c1', nombre: 'Pescados y mariscos', color: 'pescados', foto: 'catalogo:pescados-y-mariscos' }]);
    const html = placeholder('Pescados y mariscos');
    expect(html).toContain('--c:var(--cat-pescados)');
    expect(html).toMatch(/<img src="[^"]*pescados-y-mariscos/);
  });

  it('la foto propia de una categoría, si es de Drive, se dibuja como recuadro', () => {
    registrarCategorias([{ id: 'c1', nombre: 'Rara', color: 'fucsia', foto: 'drive:abc' }]);
    expect(placeholder('Rara')).toContain('data-drive="abc"');
  });

  it('la fila de una receta sin categoría cae en la trama neutra, sin color propio', () => {
    const html = placeholder('Sin categoría');
    expect(html).toContain('--c:var(--cat-otros)');
    expect(html).not.toMatch(/<img/);
  });

  it('el tag borrador no lleva marca: el borrador sólo se ve en su lista', () => {
    const html = tarjeta(entradaFalsa({ tags: ['incompleta'] }));
    expect(html).not.toContain('marcas-esq');
    expect(html).not.toContain('--marcas');
  });

  it('por defecto abre la receta; con destino editor, abre su editor', () => {
    expect(tarjeta(entradaFalsa({ id_archivo: 'r1' }))).toContain('href="#/r/r1"');
    expect(tarjeta(entradaFalsa({ id_archivo: 'r1' }), { destino: 'editor' })).toContain('href="#/r/r1/editar"');
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
    const html = tarjeta(entradaFalsa({ titulo: 'Pan', tags: ['probar', 'horno', 'favorito', 'menú diario', 'borrador'] }));
    const esq = html.slice(html.indexOf('class="marcas-esq"'));
    expect(esq).not.toContain('Borrador');
    const orden = ['Favorita', 'Menú diario', 'Para probar'].map(n => esq.indexOf(`aria-label="${n}"`));
    expect(orden.every(i => i > 0)).toBe(true);
    expect(orden).toEqual([...orden].sort((a, b) => a - b));
    expect(html).toContain('style="--marcas:3"');
  });

  it('la línea de contexto no lleva ninguna marca', () => {
    const html = tarjeta(entradaFalsa({ titulo: 'Pan', categoria: 'Panes', tags: ['probar'] }));
    const inicio = html.indexOf('class="ctx"');
    const ctx = html.slice(inicio, html.indexOf('</span></span>', inicio));
    expect(ctx).not.toContain('class="marca');
  });

  it('sin especiales no hay esquina', () => {
    expect(tarjeta(entradaFalsa({ titulo: 'Pan', tags: ['horno'] }))).not.toContain('marcas-esq');
  });

  it('la marca de favorito lleva su propia clase, para el relleno de tokens.css', () => {
    const html = tarjeta(entradaFalsa({ titulo: 'Pan', tags: ['favorito', 'probar'] }));
    expect(html).toContain('<span class="marca favorita" role="img" aria-label="Favorita" title="Favorita">');
    expect(html).toContain('<span class="marca" role="img" aria-label="Para probar" title="Para probar">');
  });

  it('cada marca dice qué es al apoyar el mouse', () => {
    const html = tarjeta(entradaFalsa({ titulo: 'Pan', tags: ['menú diario', 'probar'] }));
    expect(html).toContain('title="Menú diario"');
    expect(html).toContain('title="Para probar"');
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
  it('en la fila de tags de la receta, borrador no aparece, ni en su forma vieja', () => {
    const html = chipsSueltos(['horno', 'incompleta', 'borrador']);
    expect(html).toContain('horno');
    expect(html).not.toContain('incompleta');
    expect(html).not.toContain('borrador');
    expect(html).not.toContain('data-accion');
  });
});

describe('los chips de tags', () => {
  it('cada especial tiene su ícono y los comunes no llevan ninguno', () => {
    expect(iconoDeTag('favorito')).toBe(ICO.estrella);
    expect(iconoDeTag('probar')).toBe(ICO.marcador);
    expect(iconoDeTag('menú diario')).toBe(ICO.calendario);
    expect(iconoDeTag('horno')).toBe('');
  });

  it('borrador no tiene ícono, ni en su forma vieja', () => {
    expect(iconoDeTag('borrador')).toBe('');
    expect(iconoDeTag('incompleta')).toBe('');
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

describe('el carrusel: el marco que comparten los tags y las fotos', () => {
  const opciones = { etiquetaIzq: 'Anteriores', etiquetaDer: 'Más' };

  it('envuelve lo que recibe en la pista, adentro del marco', () => {
    const html = carrusel('<span class="x">uno</span>', opciones);
    expect(html).toContain('<div class="carrusel-marco">');
    expect(html).toContain('<div class="carrusel" data-carrusel><span class="x">uno</span></div>');
  });

  it('lleva las dos flechas, con las etiquetas que le pasan', () => {
    const html = carrusel('<span></span>', opciones);
    expect(html).toContain('data-accion="carrusel-izq" aria-label="Anteriores"');
    expect(html).toContain('data-accion="carrusel-der" aria-label="Más"');
  });

  it('sin contenido no dibuja nada', () => {
    expect(carrusel('', opciones)).toBe('');
  });

  it('la clase propia de cada carrusel se suma al marco', () => {
    expect(carrusel('<span></span>', { ...opciones, clase: 'carrusel-fotos' }))
      .toContain('<div class="carrusel-marco carrusel-fotos">');
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

  it('el tag fijo —el de la ruta en la lista por tag— no es tocable', () => {
    const html = carruselTags(tags, { fijo: 'horno' });
    expect(html).not.toContain('data-tag="horno"');
    // Los demás siguen siendo botones que acumulan como siempre.
    expect(html).toContain('data-tag="clásica"');
  });
});

describe('la fila de duraciones y el conmutador de orden', () => {
  it('un chip por valor con su relojito y cantidad; el encendido va activo', () => {
    const html = filaDuraciones([{ valor: '~15 min', cantidad: 2 }, { valor: '>1 día', cantidad: 1 }], ['>1 día']);
    expect(html).toContain('data-accion="filtrar-duracion" data-valor="~15 min"');
    expect(html).toContain(ICO_DUR['~15 min']);
    expect(html).toContain('<span class="cuenta">2</span>');
    expect(html).toMatch(/class="chip act" data-accion="filtrar-duracion" data-valor="&gt;1 día"/);
  });

  it('un valor encendido sin recetas se dibuja igual, para poder apagarlo', () => {
    expect(filaDuraciones([], ['~30 min'])).toContain('data-valor="~30 min"');
  });

  it('sin valores ni encendidos, no hay fila', () => {
    expect(filaDuraciones([], [])).toBe('');
  });

  it('el conmutador marca el orden elegido', () => {
    const html = conmutadorOrden('duracion');
    expect(html).toContain('data-accion="ordenar" data-valor="alfa" aria-pressed="false"');
    expect(html).toContain('data-accion="ordenar" data-valor="duracion" aria-pressed="true"');
    expect(html).toContain('A–Z');
    expect(html).toContain('Duración');
  });
});

describe('tile', () => {
  it('lleva la foto de la categoría y su color', () => {
    registrarCategorias([{ id: 'c1', nombre: 'Pescados y mariscos', color: 'pescados', foto: 'catalogo:pescados-y-mariscos' }]);
    const html = tile('Pescados y mariscos');
    expect(html).toContain('--c:var(--cat-pescados)');
    expect(html).toMatch(/<img src="[^"]*pescados-y-mariscos/);
    expect(html).toContain('href="#/c/Pescados%20y%20mariscos"');
  });

  it('una categoría sin foto cae en la trama, no en un hueco', () => {
    expect(tile('Fiambres caseros')).toContain('class="im trama"');
  });

  it('una foto propia de Drive se dibuja como recuadro, con data-drive', () => {
    registrarCategorias([{ id: 'c1', nombre: 'Rara', color: 'fucsia', foto: 'drive:abc' }]);
    expect(tile('Rara')).toContain('data-drive="abc"');
  });

  it('el contador aparece cuando la categoría tiene recetas', () => {
    expect(tile('Carnes', { cantidad: 20 })).toContain('<span class="cu">20</span>');
  });

  it('en cero no se dibuja: una categoría vacía se muestra igual, sin un 0 encima', () => {
    expect(tile('Carnes', { cantidad: 0 })).not.toContain('class="cu"');
    expect(tile('Carnes')).not.toContain('class="cu"');
  });

  it('con acción, es un botón que lleva el nombre, y no un link a la categoría', () => {
    const html = tile('Carnes', { accion: 'elegir-categoria-plan' });
    expect(html).toContain('<button type="button" class="tile"');
    expect(html).toContain('data-accion="elegir-categoria-plan"');
    expect(html).toContain('data-nombre="Carnes"');
    expect(html).not.toContain('href=');
    expect(html.trimEnd().endsWith('</button>')).toBe(true);
  });
});

describe('el menú lateral', () => {
  it('lleva las cinco entradas, con el plan entre Borradores y Nueva receta', () => {
    const html = lateral({ activo: 'recetario', abierto: false, borradores: 0 });
    const orden = ['Inicio', 'Borradores', 'Plan de la semana', 'Nueva receta', 'Ajustes']
      .map(t => html.indexOf(t));
    expect(orden.every((n, i) => n >= 0 && (i === 0 || n > (orden[i - 1] ?? -1)))).toBe(true);
    expect(html).toContain('href="#/plan"');
  });

  it('el fijo de las pantallas que no son del menú va sin velo, sin marca y con su clase, que lo esconde en el teléfono', () => {
    const html = lateralFijo(2, '<p>pantalla</p>');
    expect(html).not.toContain('velo-lat');
    expect(html).toMatch(/^<nav class="lat solo-ancho">/);
    expect(html).not.toContain('<a class="act"');
    expect(html).toContain('<span class="cu">2</span>');
    expect(html).toContain('<div class="conten"><p>pantalla</p></div>');
  });

  it('con el menú de la pantalla, el lateral y el contenido corrido; sin menú, la pantalla sola', () => {
    expect(conLateral({ activo: 'plan', abierto: true, borradores: 0 }, '<p>x</p>'))
      .toMatch(/^<div class="velo-lat on"[^]*<nav class="lat abierto">[^]*<div class="conten"><p>x<\/p><\/div>$/);
    expect(conLateral(undefined, '<p>x</p>')).toBe('<p>x</p>');
  });

  it('en el plan, su entrada queda marcada', () => {
    expect(lateral({ activo: 'plan', abierto: false, borradores: 0 })).toContain('<a class="act" href="#/plan">');
  });
});

describe('la tarjeta con acción', () => {
  it('es un botón que lleva el id, y no un link a la receta', () => {
    const html = tarjeta(entradaFalsa({ id_archivo: 'f1', titulo: 'Rabas' }), { accion: 'elegir-para-el-plan' });
    expect(html).toContain('<button class="tarjeta" type="button" data-accion="elegir-para-el-plan" data-id="f1"');
    expect(html).not.toContain('href=');
    expect(html.trimEnd().endsWith('</button>')).toBe(true);
  });

  it('marca con un «+» que tocarla agrega, y no abre la receta', () => {
    const html = tarjeta(entradaFalsa({ id_archivo: 'f1', titulo: 'Rabas' }), { accion: 'elegir-para-el-plan' });
    expect(html).toContain('class="mas-elegir"');
  });

  it('sin acción, es un link y no lleva el «+»', () => {
    const html = tarjeta(entradaFalsa({ id_archivo: 'f1', titulo: 'Rabas' }));
    expect(html).not.toContain('mas-elegir');
  });
});

describe('filaDeFotos: Cámara y Galería', () => {
  it('con agregar, hay dos inputs de archivo: uno directo a la cámara y otro a la galería', () => {
    const html = filaDeFotos({ fotos: [], agregar: true });
    const inputs = html.match(/<input type="file"[^>]*>/g) ?? [];
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toContain('capture="environment"');
    expect(inputs[0]).not.toContain('multiple');
    expect(inputs[1]).not.toContain('capture');
    expect(inputs[1]).toContain('multiple');
    // Los dos llegan al mismo manejador de `change` en `main.ts`.
    expect(inputs[0]).toContain('data-fotos');
    expect(inputs[1]).toContain('data-fotos');
    expect(html).toContain('Cámara');
    expect(html).toContain('Galería');
  });

  it('Cámara no se dibuja con mouse: lo esconde el CSS por puntero', () => {
    const html = filaDeFotos({ fotos: [], agregar: true });
    const camara = html.slice(html.indexOf('Cámara') - 200, html.indexOf('Cámara'));
    expect(camara).toContain('solo-tactil');
    // Galería sí se usa en los dos lados.
    const galeria = html.slice(html.indexOf('Galería') - 200, html.indexOf('Galería'));
    expect(galeria).not.toContain('solo-tactil');
  });

  it('los dos botones van en su propia fila, debajo de las miniaturas', () => {
    const html = filaDeFotos({ fotos: [{ url: 'https://ejemplo/a.jpg', n: 1 }], agregar: true });
    expect(html.indexOf('class="miniaturas"')).toBeLessThan(html.indexOf('class="fotos-botones"'));
    // Los botones quedan afuera de la fila de fotos, no mezclados con ellas.
    const fila = html.slice(html.indexOf('class="miniaturas"'), html.indexOf('class="fotos-botones"'));
    expect(fila).not.toContain('type="file"');
  });

  it('Galería también lleva ícono, y no es el de la foto del depósito', () => {
    const html = filaDeFotos({ fotos: [], agregar: true });
    expect(html).toContain(`${ICO.galeria}Galería`);
    expect(html).toContain(`${ICO.camara}Cámara`);
    expect(ICO.galeria).not.toBe(ICO.imagen);
  });

  it('sin agregar, no hay ningún input', () => {
    const html = filaDeFotos({ fotos: [], agregar: false });
    expect(html).not.toContain('type="file"');
    expect(html).not.toContain('Cámara');
    expect(html).not.toContain('Galería');
  });

  it('*Por URL* es el tercer botón de la fila, y sólo donde se lo pide', () => {
    const html = filaDeFotos({ fotos: [], agregar: true, porUrl: true });
    expect(html).toContain(`${ICO.link}Por URL`);
    expect(html).toContain('data-accion="abrir-foto-url"');
    // Va en la misma fila que los otros dos, después de ellos.
    const botones = html.slice(html.indexOf('class="fotos-botones"'));
    expect(botones.indexOf('Galería')).toBeLessThan(botones.indexOf('Por URL'));
    // No es un input de archivo: la foto la trae la app de la URL.
    expect((html.match(/<input type="file"[^>]*>/g) ?? [])).toHaveLength(2);
  });

  it('en la captura y en el borrador no hay *Por URL*: es sólo de la receta', () => {
    expect(filaDeFotos({ fotos: [], agregar: true })).not.toContain('Por URL');
    expect(filaDeFotos({ fotos: [], agregar: false, porUrl: true })).not.toContain('Por URL');
  });

  it('las marcas de uso son de la receta: sin uso, la miniatura no lleva ninguna', () => {
    const sinUso = filaDeFotos({ fotos: [{ url: 'https://ejemplo/a.jpg', n: 1 }], agregar: false });
    expect(sinUso).not.toContain('miniatura-usos');
    const conUso = filaDeFotos({
      fotos: [{ url: 'https://ejemplo/a.jpg', n: 1, uso: { portada: true, enElTexto: false } }], agregar: false
    });
    expect(conUso).toContain(`<span class="miniatura-usos">${ICO.portada}</span>`);
    expect(conUso).not.toContain(ICO.enElTexto);
    // El número no se mueve de su esquina: la marca va arriba a la derecha.
    expect(conUso).toContain('<span class="miniatura-n">#1</span>');
  });
});
