import { describe, it, expect } from 'vitest';
import {
  renderEditor, recetaDesdeFormulario, formularioDesde, pillTag,
  renderAccionesFoto, renderElegirFoto, renderSelectorPortada, renderFotoPorUrl, botonPonerFoto
} from '../src/ui/editor.js';
import { ICO, ICONO_DE_DURACION } from '../src/ui/iconos.js';
import { escapar } from '../src/ui/markdown.js';
import { parse, serialize } from '../src/recipe.js';
import { DURACIONES } from '../src/catalogo.js';
import { entradaFalsa } from './dobles.js';
import type { Categoria } from '../src/store.js';

const categorias: Pick<Categoria, 'id' | 'nombre'>[] = [
  { id: 'c1', nombre: 'Carnes' }, { id: 'c2', nombre: 'Pescados y mariscos' }
];

const MD_REAL = `---
titulo: Rabas
tags: [fritura, rápido]
rinde: 4 porciones
fuente: Recetario original
maridaje: tinto
---

Una entrada clásica.

## Ingredientes
- Calamar — 500 g

## Preparación
1. Lavar.

## Maridaje
Un tinto.
`;

const cargada = parse(MD_REAL);
const dibujar = (extra = {}) => renderEditor({ entrada: null, receta: cargada, categorias, ...extra });

describe('renderEditor', () => {
  it('hay un control por clave del frontmatter y el YAML no se ve', () => {
    const html = dibujar();
    for (const c of ['titulo', 'tags', 'rinde', 'tiempo', 'dificultad', 'fuente', 'foto']) {
      expect(html).toContain(`name="${c}"`);
    }
    expect(html).not.toContain('---\ntitulo:');
  });

  // *Nueva receta* se alcanza desde el Recetario y se sale volviendo: no está
  // en `PANTALLAS_CON_MENU`, así que el encabezado no abre el menú.
  it('el encabezado lleva el volver, no la hamburguesa', () => {
    const html = dibujar();
    expect(html).toContain('Nueva receta');
    expect(html).toContain('data-accion="volver"');
    expect(html).not.toContain('data-accion="abrir-menu"');
  });

  it('los tags son pills que se sacan de a una, más un campo para agregar', () => {
    const html = dibujar();
    expect(html).toContain('data-accion="tag-quitar"');
    expect(html).toContain('data-valor="fritura"');
    expect(html).toContain('data-valor="rápido"');
    expect(html).toContain('data-tag-nuevo');
  });

  it('un tag especial se dibuja con su ícono, y se puede sacar como cualquiera', () => {
    const html = pillTag('probar');
    expect(html).toContain(ICO.marcador);
    expect(html).toContain('data-accion="tag-quitar"');
    // No alcanza con que el ícono esté: tiene que ir antes del nombre. Con
    // `toContain` solo, invertir el orden en `pillTag` no lo detectaría.
    expect(html).toContain(`valor="probar">${ICO.marcador}probar`);
  });

  it('un tag común no lleva ícono', () => {
    // La cruz de sacar el tag también es un <svg>, así que "sin ícono" se
    // verifica por orden: el nombre aparece pegado al cierre del botón, sin
    // nada antepuesto.
    expect(pillTag('horno')).toContain('valor="horno">horno<svg');
  });

  it('los tags reservados no se sugieren, y el aviso está listo pero oculto', () => {
    const html = renderEditor({
      entrada: null, receta: cargada, categorias,
      tagsConocidos: ['horno', 'incompleto', 'favorito', 'probar', 'rápido']
    });
    const lista = html.slice(html.indexOf('<datalist'), html.indexOf('</datalist>'));
    expect(lista).toContain('horno');
    expect(lista).toContain('rápido');
    for (const t of ['incompleto', 'favorito', 'probar']) expect(lista).not.toContain(t);
    expect(html).toContain('<p class="error-tag" hidden>Tag no permitido</p>');
  });

  it('lo que viaja en el formulario es el campo oculto, no lo a medio escribir', () => {
    // Con carpeta elegida `borrador` no se fuerza: el hidden es sólo los
    // tags comunes del `.md` («los tags especiales en el editor» cubre el
    // caso con especiales puestos).
    const html = renderEditor({ entrada: entradaFalsa({ carpeta_id: 'c1' }), receta: cargada, categorias });
    expect(html).toContain('<input type="hidden" name="tags" value="fritura, rápido">');
    // El campo de agregar no se llama `tags`: un tag a medio tipear no se guarda.
    expect(html.match(/name="tags"/g)).toHaveLength(1);
  });

  it('rinde sigue siendo texto libre, a lo ancho', () => {
    const html = renderEditor({ entrada: null, receta: parse('---\ntitulo: A\n---\n'), categorias });
    expect(html).toContain('<input name="rinde" value="">');
    expect(html).not.toContain('<input name="tiempo"');
  });

  it('la duración son cinco botones con su relojito, y el cargado va apretado', () => {
    const html = renderEditor({ entrada: null, receta: parse('---\ntitulo: A\ntiempo: ~60 min\n---\n'), categorias });
    for (const d of DURACIONES) expect(html).toContain(`data-accion="elegir-duracion" data-valor="${escapar(d)}"`);
    expect(html).toContain(`data-valor="~60 min" aria-pressed="true"`);
    expect(html.match(/aria-pressed="true"/g)?.length).toBeGreaterThanOrEqual(1);
    expect(html).toContain(ICONO_DE_DURACION['~15 min']);
    expect(html).toContain('<input type="hidden" name="tiempo" value="~60 min">');
    expect(html).toContain('Hasta comer, con reposo y horno incluidos.');
  });

  it('un tiempo inválido abre sin ningún botón de duración apretado', () => {
    const html = renderEditor({ entrada: null, receta: parse('---\ntitulo: A\ntiempo: 55 min\n---\n'), categorias });
    const bloque = html.slice(html.indexOf('data-duraciones'), html.indexOf('name="tiempo"'));
    expect(bloque).not.toContain('aria-pressed="true"');
    expect(html).toContain('<input type="hidden" name="tiempo" value="">');
  });

  it('del formulario sale sólo un valor válido', () => {
    const base = parse('---\ntitulo: A\ntiempo: 55 min\n---\n');
    expect(recetaDesdeFormulario({ tiempo: '~30 min' }, base).tiempo).toBe('~30 min');
    expect(recetaDesdeFormulario({ tiempo: '' }, base).tiempo).toBeNull();
    expect(recetaDesdeFormulario({ tiempo: '45 min' }, base).tiempo).toBeNull();
  });

  it('dificultad es una elección de tres', () => {
    const html = dibujar();
    for (const d of ['fácil', 'media', 'difícil']) expect(html).toContain(d);
  });

  it('el select tiene Sin categoría como opción elegible, no un placeholder', () => {
    const html = dibujar({ carpeta: 'c1' });
    expect(html).toContain('<option value="">Sin categoría</option>');
    expect(html).not.toContain('<option value="" disabled');
  });

  it('sin carpeta ni entrada, queda elegida Sin categoría', () => {
    const html = dibujar();
    expect(html).toContain('<option value="" selected>Sin categoría</option>');
    // Y la primera categoría real no queda seleccionada por descarte.
    expect(html).not.toContain('<option value="c1" selected>');
  });

  it('con carpeta elegida, queda seleccionada esa categoría', () => {
    const html = dibujar({ carpeta: 'c1' });
    expect(html).toContain('value="c1" selected');
  });

  it('la carpeta sale de la entrada cuando no se pasa `carpeta`', () => {
    const html = renderEditor({
      entrada: entradaFalsa({ carpeta_id: 'c2' }), receta: cargada, categorias
    });
    expect(html).toContain('Pescados y mariscos');
    expect(html).toContain('value="c2" selected');
  });

  it('con una entrada cuya carpeta no es una categoría de la lista, queda Sin categoría', () => {
    // La raíz o `_sin-categoria/` no aparecen en `categorias`.
    const html = renderEditor({
      entrada: entradaFalsa({ carpeta_id: 'id-de-la-raiz' }), receta: cargada, categorias
    });
    expect(html).toContain('<option value="" selected>Sin categoría</option>');
  });

  it('hay cinco campos de contenido, y los ingredientes son uno más', () => {
    const html = dibujar();
    for (const s of ['descripcion', 'ingredientes', 'preparacion', 'variaciones', 'notas']) {
      expect(html).toContain(`name="${s}"`);
    }
    expect(html.match(/name="ingredientes"/g)).toHaveLength(1);
  });

  it('debajo de los ingredientes va el formato, plegado', () => {
    const html = dibujar();
    expect(html.indexOf('name="ingredientes"')).toBeLessThan(html.indexOf('class="esbozo"'));
    expect(html).toContain('<summary>Formato</summary>');
    expect(html).not.toContain('<details class="esbozo" open>');
    // Dice lo que hay que saber: el separador y los grupos.
    expect(html).toContain('- Merluza — 800 g');
    expect(html).toContain('### Para la salsa');
  });

  it('lo que el editor no entiende no se muestra', () => {
    const html = dibujar();
    expect(html).not.toContain('maridaje: tinto');
    expect(html).not.toContain('name="otra-0"');
  });

  it('sin entrada no se ofrece borrar: el archivo todavía no existe', () => {
    expect(dibujar()).not.toContain('data-accion="borrar"');
    expect(renderEditor({ entrada: entradaFalsa(), receta: cargada, categorias }))
      .toContain('data-accion="borrar"');
  });

  it('el encabezado ya no queda fijo: arriba no hay nada que tenga que quedar a mano', () => {
    expect(dibujar()).not.toContain('<div class="enc peg">');
  });

  it('el encabezado lleva Pegar, principal compacto con el ícono de portapapeles, y no Guardar', () => {
    const html = dibujar();
    expect(html).toContain(
      `<button class="btn prim compacto" data-accion="pegar-receta">${ICO.portapapeles}Pegar</button>`
    );
    const encabezado = html.slice(0, html.indexOf('<form'));
    expect(encabezado).not.toContain('data-accion="guardar"');
  });

  it('el orden de las marcas va de arriba a abajo', () => {
    const html = dibujar({ entrada: entradaFalsa({ carpeta_id: 'c1' }), receta: { ...cargada, tags: ['borrador'] } });
    const marcas = [
      'name="titulo"', 'name="carpeta"', 'name="fuente"', '<h2>Fotos</h2>', '<h2>Contenido</h2>',
      'data-portada', 'name="descripcion"', 'name="notas"',
      'data-accion="convertir-con-agente"', 'data-accion="guardar"'
    ];
    const indices = marcas.map(m => html.indexOf(m));
    for (const i of indices) expect(i).toBeGreaterThan(-1);
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it('borrar receta va suelto al pie, fuera de las fichas', () => {
    const html = renderEditor({ entrada: entradaFalsa(), receta: cargada, categorias });
    expect(html.match(/class="ficha"/g)).toHaveLength(3);
    expect(html.indexOf('<h2>Fotos</h2>')).toBeLessThan(html.indexOf('data-accion="borrar"'));
  });

  it('borrar receta lleva el tacho, como descartar un borrador', () => {
    expect(renderEditor({ entrada: entradaFalsa(), receta: cargada, categorias }))
      .toContain(`${ICO.tacho}Borrar receta</button>`);
  });

  it('borrar pide confirmación y nombra la receta', () => {
    const html = renderEditor({
      entrada: entradaFalsa(), receta: cargada, categorias, confirmandoBorrado: true
    });
    expect(html).toContain('¿Borrar <b>Rabas</b>?');
    expect(html).toContain('data-accion="borrar-confirmado"');
  });

  it('cuando falla, el aviso aparece y lo escrito sigue en pantalla', () => {
    const html = dibujar({ error: 'No se pudo guardar.' });
    expect(html).toContain('No se pudo guardar.');
    expect(html).toContain(cargada.titulo!);
    // El reintento es Guardar, al pie del formulario: el aviso no repite un
    // control que ya está.
    expect(html).not.toContain('Reintentar');
  });
});

describe('los tags especiales en el editor', () => {
  it('hay un botón por especial, en su orden, dentro del campo Tags', () => {
    const html = dibujar();
    const orden = ['favorito', 'menú diario', 'probar', 'borrador']
      .map(t => html.indexOf(`data-accion="tag-especial" data-valor="${t}"`));
    expect(orden.every(i => i > 0)).toBe(true);
    expect(orden).toEqual([...orden].sort((a, b) => a - b));
    expect(html.indexOf('data-tags')).toBeLessThan(orden[0]!);
  });

  it('apretado si la receta tiene el tag, suelto si no', () => {
    const conProbar = { ...cargada, tags: ['probar', 'horno'] };
    const html = renderEditor({ entrada: entradaFalsa({ carpeta_id: 'c1' }), receta: conProbar, categorias });
    expect(html).toContain('data-valor="probar" aria-pressed="true"');
    expect(html).toContain('data-valor="favorito" aria-pressed="false"');
  });

  it('las pills son sólo de los tags comunes', () => {
    const html = renderEditor({ entrada: entradaFalsa({ carpeta_id: 'c1' }), receta: { ...cargada, tags: ['probar', 'horno'] }, categorias });
    expect(html).toContain('data-accion="tag-quitar" data-valor="horno"');
    expect(html).not.toContain('data-accion="tag-quitar" data-valor="probar"');
  });

  it('el hidden de tags lleva los especiales apretados y los comunes', () => {
    const html = renderEditor({ entrada: entradaFalsa({ carpeta_id: 'c1' }), receta: { ...cargada, tags: ['horno', 'probar'] }, categorias });
    expect(html).toContain('name="tags" value="probar, horno"');
  });

  it('sin lo mínimo, borrador queda apretado y deshabilitado, con la leyenda', () => {
    const vacia = { ...cargada, tags: [], preparacion: '' };
    const html = renderEditor({ entrada: entradaFalsa({ carpeta_id: 'c1' }), receta: vacia, categorias });
    expect(html).toContain('data-valor="borrador" aria-pressed="true" disabled');
    expect(html).toMatch(/class="aviso-mudo leyenda-borrador"(?! hidden)/);
    expect(html).toContain('name="tags" value="borrador"');
  });

  it('con lo mínimo, borrador se puede soltar y la leyenda no se ve, aunque el tag esté en su forma vieja', () => {
    const html = renderEditor({ entrada: entradaFalsa({ carpeta_id: 'c1' }), receta: { ...cargada, tags: ['incompleta'] }, categorias });
    expect(html).toContain('data-valor="borrador" aria-pressed="true">');
    expect(html).toContain('leyenda-borrador" hidden');
  });

  it('el conmutador de Estado ya no existe', () => {
    const html = dibujar();
    expect(html).not.toContain('data-completa');
    expect(html).not.toContain('conm-doble');
    expect(html).not.toContain('name="completa"');
  });
});

describe('las acciones al pie del editor', () => {
  it('Convertir con Agente aparece con el tag borrador puesto, y no sin él', () => {
    const conBorrador = renderEditor({
      entrada: entradaFalsa({ carpeta_id: 'c1' }), receta: { ...cargada, tags: ['borrador'] }, categorias
    });
    expect(conBorrador).toContain('data-accion="convertir-con-agente"');
    expect(conBorrador).toContain(`${ICO.compartir}Convertir con Agente`);

    const sinBorrador = renderEditor({
      entrada: entradaFalsa({ carpeta_id: 'c1' }), receta: { ...cargada, tags: [] }, categorias
    });
    expect(sinBorrador).not.toContain('data-accion="convertir-con-agente"');
  });

  it('Convertir con Agente es secundario', () => {
    const html = renderEditor({
      entrada: entradaFalsa({ carpeta_id: 'c1' }), receta: { ...cargada, tags: ['borrador'] }, categorias
    });
    expect(html).toContain('<button class="btn sec" data-accion="convertir-con-agente" type="button">');
  });

  it('Guardar es principal, a lo ancho, y al final del formulario', () => {
    const html = dibujar();
    expect(html).toContain('<button class="btn prim" data-accion="guardar" type="button">Guardar</button>');
  });

  it('al editar, Borrar receta va después de Guardar', () => {
    const html = renderEditor({ entrada: entradaFalsa({ carpeta_id: 'c1' }), receta: cargada, categorias });
    expect(html.indexOf('data-accion="guardar"')).toBeLessThan(html.indexOf('data-accion="borrar"'));
  });
});

describe('recetaDesdeFormulario', () => {
  it('un campo vacío no escribe su clave', () => {
    const r = recetaDesdeFormulario({ titulo: 'A', rinde: '', foto: '' }, parse(''));
    expect(serialize(r)).not.toContain('rinde:');
    expect(serialize(r)).not.toContain('foto:');
  });

  it('las claves y secciones desconocidas se conservan', () => {
    const original = parse('---\ntitulo: A\nmaridaje: tinto\n---\n## Maridaje\nUn tinto.');
    const nueva = recetaDesdeFormulario({ titulo: 'B' }, original);
    const md = serialize(nueva);
    expect(md).toContain('maridaje: tinto');
    expect(md).toContain('## Maridaje');
    expect(md).toContain('Un tinto.');
  });

  it('guardar sin tocar nada produce un archivo equivalente', () => {
    const original = parse(MD_REAL);
    expect(serialize(recetaDesdeFormulario(formularioDesde(original), original))).toBe(serialize(original));
  });

  it('el título vacío no borra el que había: es el único obligatorio', () => {
    const r = recetaDesdeFormulario({ titulo: '' }, parse('---\ntitulo: A\n---\n'));
    expect(r.titulo).toBe('A');
  });

  it('los tags se separan por coma y se limpian', () => {
    const r = recetaDesdeFormulario({ titulo: 'A', tags: ' horno , , rápido ' }, parse(''));
    expect(r.tags).toEqual(['horno', 'rápido']);
  });

  it('no corrige la convención de los ingredientes: los guarda tal cual', () => {
    const texto = '- Sal, pimienta\n-   Aceite para freír';
    const r = recetaDesdeFormulario({ titulo: 'A', ingredientes: texto }, parse(''));
    expect(r.ingredientes).toBe(texto);
  });
});

const MD_CON_FOTOS = `---
titulo: Pan de campo
foto: foto:3
---

Masa madre, 24 horas.

## Ingredientes
- Harina 000 — 1 kg

## Preparación
1. Mezclar y dejar reposar.

## Fotos
- 1: https://drive.google.com/file/d/1AbC/view
- 3: https://ejemplo.com/pan.jpg
`;

/** El contenido de cada `.miniatura` de la fila, en su orden. */
const miniaturas = (html: string): string[] =>
  html.split('<div class="miniatura">').slice(1).map(s => s.slice(0, s.indexOf('</div>')));

describe('las fotos en el editor', () => {
  const conFotos = parse(MD_CON_FOTOS);
  const dibujarFotos = (receta = conFotos) =>
    renderEditor({ entrada: entradaFalsa({ carpeta_id: 'c1' }), receta, categorias });

  it('la ficha Fotos va antes de Contenido, con el número de cada una y Cámara/Galería sin tope', () => {
    const html = dibujarFotos();
    expect(html.indexOf('<h2>Fotos</h2>')).toBeLessThan(html.indexOf('<h2>Contenido</h2>'));
    expect(html).toContain('data-accion="acciones-foto" data-n="1"');
    expect(html).toContain('data-accion="acciones-foto" data-n="3"');
    // El badge lleva el número del depósito, no la posición en la fila, y va
    // adentro del botón: tocarlo es tocar la foto.
    expect(html).toContain('<span class="miniatura-n">#3</span>');
    // La foto 3 se anuncia como la 3, y la etiqueta dice que abre las acciones.
    expect(html).toContain('aria-label="Qué hacer con la foto 3"');
    expect(html).toContain('Cámara');
    expect(html).toContain('Galería');
    // El tercer control: agregar una foto por URL, que la app baja y guarda.
    expect(html).toContain('data-accion="abrir-foto-url"');
    expect(html).toContain('Por URL');
  });

  it('cada miniatura lleva un ícono por uso, y las dos si es las dos cosas', () => {
    const r = parse(`---
titulo: Pan
foto: foto:1
---

## Ingredientes
- Harina — 1 kg ![](foto:1)

## Preparación
1. Mezclar ![](foto:2)

## Fotos
- 1: https://x/a.jpg
- 2: https://x/b.jpg
- 3: https://x/c.jpg
`);
    const minis = miniaturas(dibujarFotos(r));
    expect(minis).toHaveLength(3);
    // La 1 es portada y está en un ingrediente; la 2, sólo en un paso.
    expect(minis[0]).toContain(ICO.portada);
    expect(minis[0]).toContain(ICO.enElTexto);
    expect(minis[1]).not.toContain(ICO.portada);
    expect(minis[1]).toContain(ICO.enElTexto);
    // La 3 no se usa en ningún lado: sin marca.
    expect(minis[2]).not.toContain('miniatura-usos');
    // El número sigue igual, y las marcas van sobre el mismo fondo oscuro.
    expect(minis[0]).toContain('<span class="miniatura-n">#1</span>');
    expect(minis[0]).toContain('<span class="miniatura-usos">');
  });

  it('una sección ajena también cuenta: una foto puesta ahí no queda sin marca', () => {
    const r = parse('---\ntitulo: Pan\n---\n\n## Maridaje\nUn malbec ![](foto:1)\n\n## Fotos\n- 1: https://x/a.jpg\n');
    expect(miniaturas(dibujarFotos(r))[0]).toContain(ICO.enElTexto);
  });

  it('debajo de la fila va el epígrafe, con los íconos en línea con el texto', () => {
    const html = dibujarFotos();
    expect(html.indexOf('class="fotos-campo"')).toBeLessThan(html.indexOf('class="fotos-ayuda"'));
    const ayuda = html.slice(html.indexOf('class="fotos-ayuda"'));
    expect(ayuda).toContain(`<span class="ico-linea">${ICO.portada}</span> es la portada`);
    expect(ayuda).toContain(`<span class="ico-linea">${ICO.enElTexto}</span> está en un paso o un ingrediente`);
    expect(ayuda).toContain(
      'Las que no tienen marca solo se ven en el carrusel de la receta: para poner una en un paso, tocá el ' +
      `<span class="ico-linea">${ICO.imagen}</span> que aparece al costado del renglón que estás escribiendo.`
    );
    // Un párrafo, no una fila de flex: la última línea corta como cualquier texto.
    expect(html).toContain('<p class="fotos-ayuda">');
  });

  it('nada del formulario lo manda: ni los botones de la fila ni Enter en un campo', () => {
    const html = dibujarFotos();
    expect(html).toContain('<form class="cuerpo" data-formulario onsubmit="return false">');
    // Un <button> sin type dentro de un form es un submit. Guardar queda
    // afuera, en el encabezado.
    const form = html.slice(html.indexOf('<form'));
    expect(form).not.toMatch(/<button(?![^>]*type=)[^>]*>/);
  });

  it('una foto de Drive espera su blob, y una nueva queda marcada por su número', () => {
    const html = dibujarFotos({ ...conFotos, fotos: [...conFotos.fotos, { n: 4, url: '' }] });
    expect(html).toContain('data-drive="1AbC"');
    expect(html).toContain('<img data-n="4"');
  });

  it('el depósito viaja en un campo oculto y vuelve del formulario', () => {
    expect(dibujarFotos())
      .toContain(`<input type="hidden" name="fotos" value="${escapar(JSON.stringify(conFotos.fotos))}">`);
    const r = recetaDesdeFormulario(
      { titulo: 'A', fotos: JSON.stringify([{ n: 2, url: 'https://x.com/y.jpg' }]) }, parse('')
    );
    expect(r.fotos).toEqual([{ n: 2, url: 'https://x.com/y.jpg' }]);
    expect(formularioDesde(conFotos)['fotos']).toBe(JSON.stringify(conFotos.fotos));
  });

  it('un JSON ilegible deja el depósito de la receta, no uno vacío', () => {
    // Vaciarlo sería «las saqué a todas», y el store manda esas fotos a la
    // papelera de Drive: un error de escritura no puede querer decir eso.
    expect(recetaDesdeFormulario({ titulo: 'A', fotos: '{roto' }, conFotos).fotos).toEqual(conFotos.fotos);
    expect(recetaDesdeFormulario({ titulo: 'A', fotos: '[{"n":"a"}]' }, conFotos).fotos).toEqual(conFotos.fotos);
    expect(recetaDesdeFormulario({ titulo: 'A', fotos: '{"n":1}' }, conFotos).fotos).toEqual(conFotos.fotos);
    // Sacarlas a todas sí se puede: es el arreglo vacío, bien escrito.
    expect(recetaDesdeFormulario({ titulo: 'A', fotos: '[]' }, conFotos).fotos).toEqual([]);
  });

  it('sin el campo, el depósito sigue siendo el de la receta de base', () => {
    expect(recetaDesdeFormulario({ titulo: 'A' }, conFotos).fotos).toEqual(conFotos.fotos);
  });

  it('guardar sin tocar nada conserva la sección Fotos', () => {
    expect(serialize(recetaDesdeFormulario(formularioDesde(conFotos), conFotos))).toBe(serialize(conFotos));
  });

  it('el campo de la cabecera se llama Portada, y no Foto como la ficha del depósito', () => {
    const html = dibujarFotos();
    expect(html).toContain('<div class="campo" data-portada><span>Portada</span>');
    expect(html).not.toContain('<span>Foto</span>');
  });

  it('el campo Portada es un oculto y un botón con la miniatura de la cabecera', () => {
    const html = dibujarFotos();
    expect(html).toContain('<input type="hidden" name="foto" value="foto:3">');
    expect(html).toContain('data-accion="abrir-portada"');
    // La cabecera `foto:3` se dibuja resuelta: la URL de su línea del depósito.
    expect(html).toContain('<img src="https://ejemplo.com/pan.jpg"');
    expect(html).not.toContain('<input name="foto"');
  });

  it('sin cabecera, el botón lo dice', () => {
    expect(dibujarFotos({ ...conFotos, foto: null })).toContain('Sin foto');
  });

  it('cada campo de texto va en un marco con su espejo, donde se cuelga el botón de la foto', () => {
    const html = dibujarFotos();
    for (const seccion of ['descripcion', 'ingredientes', 'preparacion', 'variaciones', 'notas']) {
      expect(html).toContain(`<div class="campo-texto" data-campo-texto="${seccion}">`);
    }
    // El espejo copia el texto hasta el cursor para saber a qué altura quedó:
    // no se ve, y el lector de pantalla no lo lee.
    expect(html).toContain('<div class="espejo" aria-hidden="true"><span data-antes></span>');
    expect(html).toContain('<span data-marca>&#8203;</span>');
  });
});

describe('renderAccionesFoto', () => {
  it('Ver y Sacar, cada una con su número', () => {
    const html = renderAccionesFoto(2);
    const acciones: [string, string][] = [
      ['Ver', 'ver-foto-receta'], ['Sacar', 'sacar-foto-editor']
    ];
    for (const [etiqueta, accion] of acciones) {
      expect(html).toContain(`data-accion="${accion}" data-n="2"`);
      expect(html).toContain(`>${etiqueta}</button>`);
    }
  });

  it('no ofrece Portada: se elige sólo desde el campo Portada', () => {
    const html = renderAccionesFoto(2);
    expect(html).not.toContain('elegir-portada');
    expect(html).not.toContain('>Portada</button>');
  });

  it('las acciones de las fotos del borrador no se pisan con las del editor', () => {
    // `ver-foto` y `sacar-foto` son las del borrador, con `data-valor` y una
    // escritura a Drive de por medio; el despachador de `main` es plano.
    const html = renderAccionesFoto(2);
    expect(html).not.toContain('data-accion="ver-foto"');
    expect(html).not.toContain('data-accion="sacar-foto"');
  });

  it('*Poner en…* ya no está: la foto se pone desde el paso', () => {
    const html = renderAccionesFoto(2);
    expect(html).not.toContain('Poner en');
    expect(html).not.toContain('abrir-poner-en');
  });

  it('la ficha se encuentra por su marca: se saca del DOM sin redibujar', () => {
    expect(renderAccionesFoto(2)).toContain('data-acciones-foto');
  });
});

describe('las fichas de fotos se cierran con el velo', () => {
  it('cada una arranca con el velo, como la hoja de Compartir', () => {
    const velo = '<div class="velo" data-accion="cerrar-ficha-foto"></div>';
    expect(renderAccionesFoto(1).startsWith(velo)).toBe(true);
    expect(renderElegirFoto([], 'notas', 0).startsWith(velo)).toBe(true);
    expect(renderSelectorPortada([], null).startsWith(velo)).toBe(true);
    expect(renderFotoPorUrl().startsWith(velo)).toBe(true);
  });

  it('ninguna suma un Cancelar: se cierran tocando afuera', () => {
    expect(renderAccionesFoto(1)).not.toContain('Cancelar');
    expect(renderElegirFoto([], 'notas', 0)).not.toContain('Cancelar');
    expect(renderSelectorPortada([], null)).not.toContain('Cancelar');
    expect(renderFotoPorUrl()).not.toContain('Cancelar');
  });
});

describe('el botón de poner una foto, sobre el campo de texto', () => {
  it('va donde está el cursor: su sección, su línea y la altura del renglón', () => {
    const html = botonPonerFoto('preparacion', 2, 48);
    expect(html).toContain('data-accion="abrir-elegir-foto"');
    expect(html).toContain('data-seccion="preparacion"');
    expect(html).toContain('data-linea="2"');
    expect(html).toContain('style="top:48px"');
  });

  it('no lleva texto: el ícono de foto y su nombre para el lector de pantalla', () => {
    const html = botonPonerFoto('notas', 0, 0);
    expect(html).toContain(ICO.imagen);
    expect(html).toContain('aria-label="Poner una foto en esta línea"');
    expect(html).toMatch(/>(<svg[\s\S]*<\/svg>)<\/button>$/);
  });

  it('es de tipo button: adentro del formulario, un botón sin tipo lo manda', () => {
    expect(botonPonerFoto('notas', 0, 0)).toContain('type="button"');
  });
});

describe('renderElegirFoto', () => {
  const fotos = [
    { n: 1, url: 'https://drive.google.com/file/d/1AbC/view' },
    { n: 3, url: 'https://ejemplo.com/pan.jpg' }
  ];

  it('sólo las fotos del depósito, cada una con la línea a la que va', () => {
    const html = renderElegirFoto(fotos, 'preparacion', 2);
    expect(html).toContain('data-accion="poner-en" data-seccion="preparacion" data-linea="2" data-n="1"');
    expect(html).toContain('data-accion="poner-en" data-seccion="preparacion" data-linea="2" data-n="3"');
    expect(html).toContain('data-drive="1AbC"');
    expect(html).toContain('aria-label="Poner la foto 3"');
  });

  it('desde acá no se agregan fotos: eso es la ficha Fotos', () => {
    const html = renderElegirFoto(fotos, 'notas', 0);
    expect(html).not.toContain('Agregar foto');
    expect(html).not.toContain('type="file"');
  });

  it('la ficha se encuentra por su marca', () => {
    expect(renderElegirFoto(fotos, 'notas', 0)).toContain('data-elegir-foto');
  });
});

describe('renderSelectorPortada', () => {
  const fotos = [
    { n: 1, url: 'https://drive.google.com/file/d/1AbC/view' },
    { n: 3, url: 'https://ejemplo.com/pan.jpg' }
  ];

  it('el depósito entero, con la actual marcada', () => {
    const html = renderSelectorPortada(fotos, 'foto:3');
    expect(html).toContain('data-accion="elegir-portada" data-n="1" aria-pressed="false"');
    expect(html).toContain('data-accion="elegir-portada" data-n="3" aria-pressed="true"');
    expect(html).toContain('data-drive="1AbC"');
  });

  it('no hay campo de URL: la portada sale de lo que ya está, o de nada', () => {
    const html = renderSelectorPortada(fotos, 'foto:3');
    expect(html).not.toContain('data-url-portada');
    expect(html).not.toContain('portada-url');
    expect(html).not.toContain('Usar la URL');
    expect(html).not.toContain('<input');
    expect(renderSelectorPortada(fotos, null)).toContain('data-accion="sin-portada"');
  });

  it('una cabecera que es una URL suelta se muestra como la actual, aunque no esté en el depósito', () => {
    // La escribió un agente o quedó de antes: se conserva mientras no se elija
    // otra cosa (C04.2.1d).
    const conUrl = renderSelectorPortada(fotos, 'https://ejemplo.com/otra.jpg');
    expect(conUrl).toContain('<img src="https://ejemplo.com/otra.jpg"');
    expect(conUrl).toContain('class="galeria-item actual"');
    // Y no marca ninguna del depósito.
    expect(conUrl).not.toContain('aria-pressed="true"');
    // La que sí está en el depósito se marca ahí y no se repite arriba.
    expect(renderSelectorPortada(fotos, 'foto:3')).not.toContain('galeria-item actual');
  });

  it('la ficha se encuentra por su marca', () => {
    expect(renderSelectorPortada(fotos, null)).toContain('data-selector-portada');
  });
});

describe('renderFotoPorUrl', () => {
  it('un campo de texto y *Traer*, y nada más', () => {
    const html = renderFotoPorUrl();
    expect(html).toContain('<input data-url-foto type="url"');
    expect(html).toContain('value=""');
    expect(html).toContain('placeholder="https://…"');
    // El teclado del teléfono no toca lo pegado: una mayúscula de más en el
    // esquema rompería la línea del depósito.
    expect(html).toContain('autocapitalize="off"');
    expect(html).toContain('autocorrect="off"');
    expect(html).toContain('spellcheck="false"');
    expect(html).toContain('data-accion="traer-foto-url"');
    expect(html).toContain('>Traer</button>');
    // La ficha se encuentra por su marca, como las otras tres.
    expect(html).toContain('data-foto-url');
    // Adentro del formulario, un botón sin tipo lo manda.
    expect(html).not.toMatch(/<button(?![^>]*type=)[^>]*>/);
  });

  it('con un aviso, lo escrito sigue en el campo (R1)', () => {
    const html = renderFotoPorUrl('https://ejemplo.com/pagina', 'Esa URL no es una foto.');
    expect(html).toContain('value="https://ejemplo.com/pagina"');
    expect(html).toContain('Esa URL no es una foto.');
    expect(html).toContain('class="aviso"');
  });

  it('sin aviso no se dibuja ninguno', () => {
    expect(renderFotoPorUrl('https://ejemplo.com/a.jpg')).not.toContain('class="aviso"');
  });
});
