import { describe, it, expect } from 'vitest';
import { renderReceta } from '../src/ui/receta.js';
import { renderFichaCompartir } from '../src/ui/compartir.js';
import { parse } from '../src/recipe.js';
import { entradaFalsa } from './dobles.js';
import { registrarCategorias } from '../src/ui/categorias.js';
import { ICO, ICONO_DE_DURACION } from '../src/ui/iconos.js';

const MINIMA = parse('---\ntitulo: A\n---\n');

const COMPLETA = parse(`---
titulo: Rabas
tags: [fritura]
rinde: 4 porciones
fuente: Recetario original
foto: https://x/1.jpg
---

Una entrada clásica.

## Ingredientes
- Calamar — 500 g
- Sal, pimienta

## Preparación
1. Lavar.
2. Freír.

## Variaciones
- Tempura en vez de harina.

## Notas
Ojo con la temperatura.
`);

const CON_TRAMOS = parse(`---
titulo: Anchoítas
---

## Preparación
### Para la anchoíta
1. Filetear.
### Para el melón
1. Pelar.
### Final
1. Servir.
`);

const CON_FOTOS = parse(`---
titulo: Rabas
foto: foto:1
---

## Preparación
1. Freír. ![](foto:2)

## Notas
Servir bien caliente.

## Fotos
- 1: https://drive.google.com/file/d/abc/view
- 2: https://x/paso.jpg
`);

/** Con una foto ubicada en cada lado y dos que no están en ninguno: las del carrusel. */
const CON_SOBRANTES = parse(`---
titulo: Rabas
foto: foto:1
---

## Ingredientes
- Calamar — 500 g ![](foto:2)

## Fotos
- 1: https://x/portada.jpg
- 2: https://x/ingrediente.jpg
- 3: https://x/suelta.jpg
- 4: https://x/otra.jpg
`);

describe('Receta en lectura', () => {
  it('el orden es foto, título, contexto, fuente, descripción, ingredientes, preparación, variaciones, notas', () => {
    const html = renderReceta({ entrada: null, receta: COMPLETA });
    const pos = (s: string) => html.indexOf(s);
    expect(pos('rec-foto')).toBeLessThan(pos('rec-tit'));
    expect(pos('rec-tit')).toBeLessThan(pos('Ingredientes'));
    expect(pos('Ingredientes')).toBeLessThan(pos('Preparación'));
    expect(pos('Preparación')).toBeLessThan(pos('Variaciones'));
    expect(pos('Variaciones')).toBeLessThan(pos('Notas'));
  });

  it('el encabezado arranca sin texto: ni el título ni la categoría se repiten', () => {
    const html = renderReceta({ entrada: entradaFalsa({ categoria: 'Pescados y mariscos' }), receta: COMPLETA });
    const enc = html.slice(0, html.indexOf('class="cuerpo'));
    // Vacío pero presente: `main` le pone el título cuando el grande sale de
    // pantalla, así que el span tiene que estar.
    expect(enc).toContain('<span class="tit"></span>');
    expect(enc).not.toContain('Rabas');
    expect(enc).not.toContain('Pescados y mariscos');
  });

  it('la fuente lleva su prefijo', () => {
    expect(renderReceta({ entrada: null, receta: COMPLETA })).toContain('>📖</span>fuente: ');
  });

  it('la descripción va en la misma ficha que el título, no en una aparte', () => {
    const html = renderReceta({ entrada: null, receta: COMPLETA });
    // Entre el título y la descripción no hay otra ficha: es la misma.
    const entre = html.slice(html.indexOf('rec-tit'), html.indexOf('Una entrada clásica'));
    expect(entre).not.toContain('class="ficha"');
    expect(html.indexOf('Una entrada clásica')).toBeLessThan(html.indexOf('<h2>Ingredientes'));
  });

  it('una fuente que es URL se dibuja clickeable, sin el esquema a la vista', () => {
    const r = parse('---\ntitulo: A\nfuente: https://cookpad.com/ar/recetas/123\n---\n');
    const html = renderReceta({ entrada: null, receta: r });
    expect(html).toContain('<a href="https://cookpad.com/ar/recetas/123" target="_blank" rel="noopener">');
    expect(html).toContain('>cookpad.com/ar/recetas/123<');
  });

  it('una fuente en markdown usa su texto como link', () => {
    const r = parse('---\ntitulo: A\nfuente: "[Directo al paladar](https://directoalpaladar.com/x)"\n---\n');
    const html = renderReceta({ entrada: null, receta: r });
    expect(html).toContain('href="https://directoalpaladar.com/x"');
    expect(html).toContain('>Directo al paladar<');
  });

  it('una fuente que no es URL queda como texto', () => {
    const r = parse('---\ntitulo: A\nfuente: libro de pescados, pág. 84\n---\n');
    const html = renderReceta({ entrada: null, receta: r });
    expect(html).toContain('libro de pescados, pág. 84');
    expect(html).not.toContain('<a href');
  });

  it('una fuente con esquema raro no se convierte en link', () => {
    const r = parse('---\ntitulo: A\nfuente: "[click](javascript:alert(1))"\n---\n');
    expect(renderReceta({ entrada: null, receta: r })).not.toContain('<a href');
  });

  it('la fuente cierra la cabecera: va después de los tags, no entre el título y ellos', () => {
    const html = renderReceta({ entrada: null, receta: COMPLETA });
    expect(html.indexOf('rec-ctx')).toBeLessThan(html.indexOf('class="chips"'));
    expect(html.indexOf('class="chips"')).toBeLessThan(html.indexOf('rec-fuente'));
    expect(html.indexOf('rec-fuente')).toBeLessThan(html.indexOf('Ingredientes'));
  });

  it('la categoría sale de la fila del índice, no del frontmatter', () => {
    registrarCategorias([{ id: 'c1', nombre: 'Pescados y mariscos', color: 'pescados', foto: 'catalogo:pescados-y-mariscos' }]);
    const html = renderReceta({ entrada: entradaFalsa({ categoria: 'Pescados y mariscos' }), receta: COMPLETA });
    expect(html).toContain('Pescados y mariscos');
    expect(html).toContain('var(--cat-pescados)');
  });

  it('una sección ausente no deja encabezado vacío', () => {
    expect(renderReceta({ entrada: null, receta: MINIMA })).not.toContain('Notas');
  });

  it('sin foto, la receta empieza por el título', () => {
    expect(renderReceta({ entrada: null, receta: MINIMA })).not.toContain('rec-foto');
  });

  it('los ### de preparación son tramos y la numeración vuelve a empezar', () => {
    const html = renderReceta({ entrada: null, receta: CON_TRAMOS });
    expect(html.match(/class="tramo"/g)).toHaveLength(3);
    expect(html.match(/<ol class="pasos">/g)).toHaveLength(3);
  });

  it('una sección desconocida se muestra tal cual, al final', () => {
    const html = renderReceta({ entrada: null, receta: parse('---\ntitulo: A\n---\n## Maridaje\nUn tinto.') });
    expect(html).toContain('Maridaje');
    expect(html).toContain('Un tinto.');
  });

  it('la marca de borrador es tocable y abre el editor', () => {
    const conTag = parse('---\ntitulo: A\ntags: [incompleta]\n---\n');
    const html = renderReceta({ entrada: null, receta: conTag });
    expect(html).toContain('data-accion="editar"');
    expect(html).toContain('class="borr');
  });

  it('la marca es un chip de la fila de tags, y el primero', () => {
    const conTags = parse('---\ntitulo: A\ntags: [incompleta, vegetariano, legumbres]\n---\n');
    const html = renderReceta({ entrada: null, receta: conTags });
    const fila = html.slice(html.indexOf('<div class="chips">'), html.indexOf('</div>', html.indexOf('<div class="chips">')));
    expect(fila).toContain('chip pend');
    expect(fila).toContain('incompleta');
    // Primero el estado, después los tags.
    expect(fila.indexOf('incompleta')).toBeLessThan(fila.indexOf('vegetariano'));
    // Y una sola vez: el tag no se repite como chip suelto, la marca ya lo dice.
    expect(html.split('class="borr"').length - 1).toBe(1);
  });

  it('la fila de tags no repite la marca de borrador: es el chip del tag', () => {
    const r = parse('---\ntitulo: Pan\ntags: [incompleta, horno]\n---\n');
    const html = renderReceta({ entrada: entradaFalsa(), receta: r });
    expect(html.match(/class="borr"/g)).toHaveLength(1);
  });

  it('sin otros tags, la marca arma igual la fila de chips', () => {
    const soloIncompleta = parse('---\ntitulo: A\ntags: [incompleta]\n---\n');
    const html = renderReceta({ entrada: null, receta: soloIncompleta });
    expect(html).toContain('<div class="chips">');
  });

  it('la marca es el tag borrador, no un dato calculado', () => {
    // Sin el tag no aparece, aunque a la receta le falte todo.
    const sinTag = parse('---\ntitulo: A\n---\n');
    expect(renderReceta({ entrada: null, receta: sinTag })).not.toContain('class="borr"');
    // Con el tag aparece, aunque la receta esté escrita entera, y en su forma vieja.
    const conTag = parse('---\ntitulo: A\ntags: [incompleta]\n---\n## Ingredientes\n- Sal\n## Preparación\n1. Salar.');
    expect(renderReceta({ entrada: null, receta: conTag })).toContain('class="borr"');
  });

  it('las variaciones como bullets se muestran como lista', () => {
    const html = renderReceta({ entrada: null, receta: parse('---\ntitulo: A\n---\n## Variaciones\n- Sin huevo.') });
    expect(html).toContain('Sin huevo.');
  });

  it('una variación con fuente propia la muestra como fuente, no como cuerpo', () => {
    const r = parse('---\ntitulo: A\n---\n## Variaciones\n### A la suiza\n*Libro de cocina*\n\nCambiar la salsa.');
    expect(renderReceta({ entrada: null, receta: r })).toContain('class="f"');
  });

  it('los tags se leen y no se tocan: van como chip, sin data-tag', () => {
    const r = parse('---\ntitulo: A\ntags: [horno]\n---\n');
    const html = renderReceta({ entrada: null, receta: r });
    expect(html).toContain('<span class="chip">horno</span>');
    expect(html).not.toContain('data-tag');
  });

  it('el encabezado lleva el link al .md en Drive, en otra pestaña', () => {
    const html = renderReceta({ entrada: entradaFalsa({ id_archivo: 'f1' }), receta: COMPLETA });
    expect(html).toContain('href="https://drive.google.com/file/d/f1/view"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener"');
    expect(html).toContain('.md</a>');
    // El logo viaja con la app: sin él servido por un tercero, el link no depende
    // de que `gstatic.com` conteste.
    expect(html).toContain('drive.png');
    expect(html).not.toContain('gstatic.com');
    // Es un dato al margen, no un botón del encabezado.
    expect(html).toContain('class="archivo"');
  });

  it('sin fila del índice no hay link: no se conoce el id del archivo', () => {
    expect(renderReceta({ entrada: null, receta: COMPLETA })).not.toContain('drive.google.com');
  });

  it('no hay un menú de ⋯: las acciones están al pie', () => {
    expect(renderReceta({ entrada: null, receta: COMPLETA })).not.toContain('data-accion="menu"');
  });

  it('al pie están Cocinar y Editar', () => {
    const html = renderReceta({ entrada: null, receta: COMPLETA });
    expect(html).toContain('>Cocinar<');
    expect(html).toContain('Editar');
  });

  it('sin ingredientes ni pasos, no se ofrece Cocinar', () => {
    expect(renderReceta({ entrada: null, receta: MINIMA })).not.toContain('>Cocinar<');
  });

  it('escapa el título: el .md lo escribe cualquiera', () => {
    const r = parse('---\ntitulo: "<img onerror=alert(1)>"\n---\n');
    expect(renderReceta({ entrada: null, receta: r })).not.toContain('<img onerror');
  });

  it('el encabezado lleva compartir, antes del .md', () => {
    const html = renderReceta({ entrada: entradaFalsa({ id_archivo: 'f1' }), receta: COMPLETA });
    const enc = html.slice(0, html.indexOf('class="cuerpo'));
    expect(enc).toContain('data-accion="compartir" aria-label="Compartir" title="Compartir"');
    expect(enc.indexOf('data-accion="compartir"')).toBeLessThan(enc.indexOf('class="archivo"'));
  });

  it('los tres controles del encabezado dicen qué son al apoyar el mouse', () => {
    const html = renderReceta({ entrada: entradaFalsa({ id_archivo: 'f1' }), receta: COMPLETA });
    expect(html).toContain('title="Marcar como favorita"');
    expect(html).toContain('title="Compartir"');
    expect(html).toContain('title="Ver el archivo en Drive"');
  });

  it('con la receta ya favorita, el globito de la estrella ofrece sacarla', () => {
    const html = renderReceta({ entrada: entradaFalsa(), receta: parse('---\ntitulo: A\ntags: [favorito]\n---\n') });
    expect(html).toContain('title="Sacar de favoritos"');
  });

  it('sin estado de compartir no hay ficha; con estado, sí', () => {
    expect(renderReceta({ entrada: null, receta: COMPLETA })).not.toContain('hoja-compartir');
    expect(renderReceta({ entrada: null, receta: COMPLETA, compartir: { paso: 'opciones' } })).toContain('hoja-compartir');
  });

  it('la línea de contexto de la receta lleva la duración con su relojito', () => {
    const r = parse('---\ntitulo: Pan\nrinde: 4\ntiempo: ~60 min\n---\n');
    const html = renderReceta({ entrada: entradaFalsa({ categoria: 'Panes y masas' }), receta: r });
    expect(html).toContain(`<span class="dur">${ICONO_DE_DURACION['~60 min']}~60 min</span>`);
  });

  it('un tiempo inválido no aparece en la receta', () => {
    const r = parse('---\ntitulo: Pan\ntiempo: 55 min\n---\n');
    expect(renderReceta({ entrada: entradaFalsa(), receta: r })).not.toContain('55 min');
  });
});

describe('Las fotos de la receta', () => {
  it('la cabecera resuelve foto:N y la hace tocable, con su número del depósito', () => {
    const html = renderReceta({ entrada: null, receta: CON_FOTOS });
    expect(html).toContain('data-drive="abc"');
    expect(html).toMatch(/data-accion="ver-foto-receta" data-n="1"[^>]*>[^<]*<img[^>]*data-drive="abc"/);
  });

  it('una cabecera externa que no está en el depósito se abre sin data-n', () => {
    const html = renderReceta({ entrada: null, receta: COMPLETA });
    expect(html).toContain('data-accion="ver-foto-receta"');
    expect(html).not.toMatch(/data-accion="ver-foto-receta" data-n=/);
  });

  it('sin foto no hay botón para verla', () => {
    expect(renderReceta({ entrada: null, receta: MINIMA })).not.toContain('data-accion="ver-foto-receta"');
  });

  it('la referencia en un ingrediente se dibuja debajo de su línea, y no como texto', () => {
    const r = parse(`---
titulo: Pan
---

## Ingredientes
- Masa madre — 200 g ![Activa](foto:1)
- Sal

## Fotos
- 1: https://x/masa.jpg
`);
    const html = renderReceta({ entrada: null, receta: r });
    const item = html.slice(html.indexOf('class="ing"'), html.indexOf('Sal'));
    expect(item).toContain('<span class="n">Masa madre</span>');
    expect(item).toContain('<span class="c">200 g </span>');
    // La foto va adentro del ítem, después del texto: envuelta se acomoda sola
    // abajo, al ancho de la ficha.
    expect(item).toContain('<span class="foto-linea"><img src="https://x/masa.jpg"');
    expect(item).toContain('Activa');
    expect(html).not.toContain('![');
  });

  it('la referencia en un paso se resuelve y se dibuja debajo de su línea', () => {
    const html = renderReceta({ entrada: null, receta: CON_FOTOS });
    expect(html).toContain('class="foto-linea"');
    expect(html).toContain('src="https://x/paso.jpg"');
  });

  it('el carrusel va en un carrusel dentro de la primera ficha, y no hay ficha Fotos al final', () => {
    const conDesc = parse(
      '---\ntitulo: Rabas\nfuente: Un libro\n---\n\nUna entrada clásica.\n\n## Ingredientes\n- Sal\n\n' +
      '## Fotos\n- 1: https://x/a.jpg\n- 2: https://x/b.jpg\n'
    );
    const html = renderReceta({ entrada: null, receta: conDesc });
    expect(html).not.toContain('<h2>Fotos</h2>');
    expect(html).toContain('carrusel-fotos');
    // Debajo de la descripción y arriba del divisor de la fuente, en la primera ficha.
    expect(html.indexOf('rec-desc')).toBeLessThan(html.indexOf('carrusel-fotos'));
    expect(html.indexOf('carrusel-fotos')).toBeLessThan(html.indexOf('rec-fuente'));
    expect(html.indexOf('carrusel-fotos')).toBeLessThan(html.indexOf('<h2>Ingredientes</h2>'));
  });

  it('cada foto del carrusel es un botón que abre el visor, con su número del depósito', () => {
    const html = renderReceta({ entrada: null, receta: CON_SOBRANTES });
    expect(html.match(/data-accion="ver-foto-receta"/g)).toHaveLength(3); // cabecera + 2 del carrusel
    expect(html).toContain('data-n="3"');
    expect(html).toContain('data-n="4"');
  });

  it('el carrusel lleva sólo las sin uso: la portada y la de un ingrediente no se repiten', () => {
    const html = renderReceta({ entrada: null, receta: CON_SOBRANTES });
    const carrusel = html.slice(html.indexOf('carrusel-fotos'), html.indexOf('carrusel-flecha'));
    expect(carrusel).toContain('https://x/suelta.jpg');
    expect(carrusel).toContain('https://x/otra.jpg');
    expect(carrusel).not.toContain('https://x/portada.jpg');
    expect(carrusel).not.toContain('https://x/ingrediente.jpg');
    // Cada una sigue estando una sola vez en la pantalla entera.
    expect(html.match(/https:\/\/x\/portada\.jpg/g)).toHaveLength(1);
    expect(html.match(/https:\/\/x\/ingrediente\.jpg/g)).toHaveLength(1);
  });

  it('con todas ubicadas, el carrusel no se dibuja', () => {
    const html = renderReceta({ entrada: null, receta: CON_FOTOS });
    expect(html).not.toContain('carrusel-fotos');
    // La ficha queda como antes de que existiera el carrusel.
    expect(html.match(/data-accion="ver-foto-receta"/g)).toHaveLength(1);
  });

  it('cada foto del carrusel se llama por su número, no por su posición', () => {
    const conHueco = parse('---\ntitulo: Rabas\n---\n\n## Fotos\n- 3: https://x/a.jpg\n- 7: https://x/b.jpg\n');
    const html = renderReceta({ entrada: null, receta: conHueco });
    expect(html).toContain('data-n="3" aria-label="Ver la foto 3"');
    expect(html).toContain('data-n="7" aria-label="Ver la foto 7"');
  });

  it('sin depósito, el carrusel no se dibuja', () => {
    const html = renderReceta({ entrada: null, receta: COMPLETA });
    expect(html).not.toContain('<h2>Fotos</h2>');
    expect(html).not.toContain('carrusel-fotos');
  });

  it('el visor dibuja la foto actual sobre el velo cuando está abierto', () => {
    const html = renderReceta({ entrada: null, receta: COMPLETA, visor: { urls: ['https://x/1.jpg'], i: 0 } });
    expect(html).toContain('class="visor"');
    expect(html).toContain('src="https://x/1.jpg"');
  });

  it('sin visor abierto, no se dibuja', () => {
    expect(renderReceta({ entrada: null, receta: COMPLETA })).not.toContain('class="visor"');
  });
});

describe('la estrella de favorito', () => {
  const receta = parse('---\ntitulo: Asado\ntags: [horno]\n---\n');

  it('va en el encabezado, apagada', () => {
    const html = renderReceta({ entrada: entradaFalsa(), receta });
    expect(html).toContain('data-accion="favorito"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).not.toContain('class="fav on"');
  });

  it('va antes que compartir', () => {
    const html = renderReceta({ entrada: entradaFalsa(), receta });
    expect(html.indexOf('data-accion="favorito"')).toBeLessThan(html.indexOf('data-accion="compartir"'));
  });

  it('se enciende cuando la receta lleva el tag', () => {
    const conTag = parse('---\ntitulo: Asado\ntags: [favorito]\n---\n');
    const html = renderReceta({ entrada: entradaFalsa(), receta: conTag });
    expect(html).toContain('class="fav on"');
    expect(html).toContain('aria-pressed="true"');
  });

  it('mientras escribe muestra el estado de carga y no acepta otro toque', () => {
    const html = renderReceta({ entrada: entradaFalsa(), receta, favorito: 'escribiendo' });
    expect(html).toContain('class="fav cargando"');
    expect(html).toContain('disabled');
  });

  it('si la escritura falló, avisa arriba de la ficha y ofrece reintentar', () => {
    const html = renderReceta({ entrada: entradaFalsa(), receta, error: 'No se pudo marcar.' });
    expect(html).toContain('No se pudo marcar.');
    expect(html).toContain('data-accion="favorito">Reintentar');
    expect(html.indexOf('class="aviso"')).toBeLessThan(html.indexOf('class="ficha"'));
  });

  it('un aviso que trae la receta de otra pantalla va arriba de la ficha, sin control', () => {
    const html = renderReceta({ entrada: entradaFalsa(), receta, aviso: { texto: 'Pedido copiado: pegalo en el agente' } });
    expect(html).toContain('Pedido copiado: pegalo en el agente');
    expect(html).not.toContain('Reintentar');
    expect(html.indexOf('class="aviso"')).toBeLessThan(html.indexOf('class="ficha"'));
  });

  it('el aviso puede llevar su acción', () => {
    const html = renderReceta({
      entrada: entradaFalsa(), receta,
      aviso: { texto: 'La receta quedó guardada.', accion: { etiqueta: 'Mandar al agente', accion: 'mandar-al-agente' } }
    });
    expect(html).toContain('data-accion="mandar-al-agente">Mandar al agente');
  });

  it('los tags especiales van primeros y con su ícono', () => {
    const conTags = parse('---\ntitulo: Asado\ntags: [horno, probar]\n---\n');
    const html = renderReceta({ entrada: entradaFalsa(), receta: conTags });
    expect(html.indexOf('probar')).toBeLessThan(html.indexOf('horno'));
    expect(html).toContain(ICO.marcador);
  });

  it('favorito no va en la fila de tags: ya está la estrella del encabezado', () => {
    const fav = parse('---\ntitulo: Asado\ntags: [favorito, horno]\n---\n');
    const html = renderReceta({ entrada: entradaFalsa(), receta: fav });
    expect(html).not.toContain('favorito</span>');
    expect(html).toContain('<span class="chip">horno</span>');
  });

  it('una receta con sólo favorito no arma la fila de chips vacía', () => {
    const fav = parse('---\ntitulo: Asado\ntags: [favoritas]\n---\n');
    expect(renderReceta({ entrada: entradaFalsa(), receta: fav })).not.toContain('<div class="chips">');
  });
});

describe('La ficha de compartir', () => {
  it('opciones: PDF, Link, Texto y Cancelar; tocar el velo cierra', () => {
    const html = renderFichaCompartir({ paso: 'opciones' });
    for (const a of ['compartir-pdf', 'compartir-link', 'compartir-texto']) expect(html).toContain(`data-accion="${a}"`);
    expect(html).toContain('>Cancelar<');
    expect(html).toContain('class="velo" data-accion="cerrar-compartir"');
  });
  it('generando: nada se puede tocar', () => {
    const html = renderFichaCompartir({ paso: 'generando' });
    expect(html).toContain('Armando el PDF…');
    expect(html).not.toMatch(/data-accion="compartir-(pdf|link|texto)"/);
  });
  it('pdf-listo: Enviar PDF', () => {
    expect(renderFichaCompartir({ paso: 'pdf-listo' })).toContain('data-accion="enviar-pdf"');
    expect(renderFichaCompartir({ paso: 'pdf-listo' })).toContain('El PDF está listo.');
  });
  it('error-pdf: avisa y ofrece reintentar', () => {
    const html = renderFichaCompartir({ paso: 'error-pdf' });
    expect(html).toContain('No se pudo armar el PDF.');
    expect(html).toContain('data-accion="compartir-pdf">Reintentar');
  });
  it('copiado y mostrar', () => {
    expect(renderFichaCompartir({ paso: 'copiado', que: 'link' })).toContain('Link copiado.');
    expect(renderFichaCompartir({ paso: 'copiado', que: 'texto' })).toContain('Texto copiado.');
    const html = renderFichaCompartir({ paso: 'mostrar', que: 'texto', contenido: '<b>Rabas</b>' });
    expect(html).toContain('&lt;b&gt;Rabas&lt;/b&gt;');
  });
});
