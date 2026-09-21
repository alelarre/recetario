import { describe, it, expect } from 'vitest';
import {
  renderEditor, recetaDesdeFormulario, formularioDesde, pillTag,
  renderAccionesFoto, renderPonerEn, renderSelectorPortada
} from '../src/ui/editor.js';
import { ICO, ICONO_DE_DURACION } from '../src/ui/iconos.js';
import { escapar } from '../src/ui/markdown.js';
import { parse, serialize } from '../src/recipe.js';
import { lineasDeLaReceta } from '../src/fotos-receta.js';
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
    // Con carpeta elegida `incompleta` no se fuerza: el hidden es sólo los
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

  it('en el alta la categoría arranca sin elegir, y hay que elegirla', () => {
    const html = dibujar();
    expect(html).toContain('<option value="" disabled selected>Elegí una categoría</option>');
    // Y la primera categoría real no queda seleccionada por descarte.
    expect(html).not.toContain('<option value="c1" selected>');
  });

  it('editando una receta no aparece el placeholder: ya tiene carpeta', () => {
    const html = renderEditor({ entrada: entradaFalsa({ carpeta_id: 'c1' }), receta: cargada, categorias });
    expect(html).not.toContain('Elegí una categoría');
    expect(html).toContain('value="c1" selected');
  });

  it('la categoría son las subcarpetas, y la actual viene elegida', () => {
    const html = renderEditor({
      entrada: entradaFalsa({ carpeta_id: 'c2' }), receta: cargada, categorias
    });
    expect(html).toContain('Pescados y mariscos');
    expect(html).toContain('value="c2" selected');
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

  it('el encabezado queda fijo arriba, como en la receta abierta', () => {
    expect(dibujar()).toContain('<div class="enc peg">');
  });

  it('las dos fichas llevan título: Datos y Contenido', () => {
    const html = dibujar();
    expect(html.indexOf('<h2>Datos</h2>')).toBeLessThan(html.indexOf('name="titulo"'));
    expect(html.indexOf('name="foto"')).toBeLessThan(html.indexOf('<h2>Contenido</h2>'));
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
    // El reintento es Guardar, que sigue en el encabezado: el aviso no repite
    // un control que ya está.
    expect(html).not.toContain('Reintentar');
  });
});

describe('los tags especiales en el editor', () => {
  it('hay un botón por especial, en su orden, dentro del campo Tags', () => {
    const html = dibujar();
    const orden = ['favorito', 'menú diario', 'probar', 'incompleta']
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

  it('sin lo mínimo, incompleta queda apretado y deshabilitado, con la leyenda', () => {
    const vacia = { ...cargada, tags: [], preparacion: '' };
    const html = renderEditor({ entrada: entradaFalsa({ carpeta_id: 'c1' }), receta: vacia, categorias });
    expect(html).toContain('data-valor="incompleta" aria-pressed="true" disabled');
    expect(html).toMatch(/class="aviso-mudo leyenda-incompleta"(?! hidden)/);
    expect(html).toContain('name="tags" value="incompleta"');
  });

  it('con lo mínimo, incompleta se puede soltar y la leyenda no se ve', () => {
    const html = renderEditor({ entrada: entradaFalsa({ carpeta_id: 'c1' }), receta: { ...cargada, tags: ['incompleta'] }, categorias });
    expect(html).toContain('data-valor="incompleta" aria-pressed="true">');
    expect(html).toContain('leyenda-incompleta" hidden');
  });

  it('el conmutador de Estado ya no existe', () => {
    const html = dibujar();
    expect(html).not.toContain('data-completa');
    expect(html).not.toContain('conm-doble');
    expect(html).not.toContain('name="completa"');
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

describe('las fotos en el editor', () => {
  const conFotos = parse(MD_CON_FOTOS);
  const dibujarFotos = (receta = conFotos) =>
    renderEditor({ entrada: entradaFalsa({ carpeta_id: 'c1' }), receta, categorias });

  it('la ficha Fotos va después de Contenido, con el número de cada una y Agregar foto sin tope', () => {
    const html = dibujarFotos();
    expect(html.indexOf('<h2>Contenido</h2>')).toBeLessThan(html.indexOf('<h2>Fotos</h2>'));
    expect(html).toContain('data-accion="acciones-foto" data-n="1"');
    expect(html).toContain('data-accion="acciones-foto" data-n="3"');
    // El badge lleva el número del depósito, no la posición en la fila.
    expect(html).toContain('<span class="miniatura-n">3</span>');
    expect(html).toContain('Agregar foto');
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

  it('un JSON ilegible se lee como depósito vacío, sin romper nada', () => {
    expect(recetaDesdeFormulario({ titulo: 'A', fotos: '{roto' }, conFotos).fotos).toEqual([]);
    expect(recetaDesdeFormulario({ titulo: 'A', fotos: '[{"n":"a"}]' }, conFotos).fotos).toEqual([]);
  });

  it('sin el campo, el depósito sigue siendo el de la receta de base', () => {
    expect(recetaDesdeFormulario({ titulo: 'A' }, conFotos).fotos).toEqual(conFotos.fotos);
  });

  it('guardar sin tocar nada conserva la sección Fotos', () => {
    expect(serialize(recetaDesdeFormulario(formularioDesde(conFotos), conFotos))).toBe(serialize(conFotos));
  });

  it('el campo Foto es un oculto y un botón con la miniatura de la cabecera', () => {
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
});

describe('renderAccionesFoto', () => {
  it('las cuatro acciones, cada una con su número', () => {
    const html = renderAccionesFoto(2, { portada: false });
    const acciones: [string, string][] = [
      ['Ver', 'ver-foto'], ['Portada', 'elegir-portada'],
      ['Poner en…', 'abrir-poner-en'], ['Sacar', 'sacar-foto']
    ];
    for (const [etiqueta, accion] of acciones) {
      expect(html).toContain(`data-accion="${accion}" data-n="2"`);
      expect(html).toContain(`>${etiqueta}</button>`);
    }
  });

  it('si ya es la portada, Portada no se dibuja', () => {
    const html = renderAccionesFoto(2, { portada: true });
    expect(html).not.toContain('elegir-portada');
    expect(html).not.toContain('>Portada</button>');
    expect(html).toContain('data-accion="sacar-foto" data-n="2"');
  });

  it('la ficha se encuentra por su marca: se saca del DOM sin redibujar', () => {
    expect(renderAccionesFoto(2, { portada: false })).toContain('data-acciones-foto');
  });
});

describe('renderPonerEn', () => {
  const receta = parse('---\ntitulo: A\n---\n\nUna entrada clásica.\n\n' +
    '## Ingredientes\n### Para la salsa\n- Tomate perita — 1 lata\n\n## Preparación\n1. Mezclar.\n');
  const lugares = lineasDeLaReceta(receta);

  it('los lugares agrupados, con su sección, su línea y el número de la foto', () => {
    const html = renderPonerEn(lugares, 5);
    expect(html).toContain('data-accion="poner-en" data-seccion="ingredientes" data-linea="1" data-n="5"');
    expect(html).toContain('Tomate perita — 1 lata');
    expect(html).toContain('<h3>Para la salsa</h3>');
    expect(html).toContain('<h3>Descripción</h3>');
    // El `###` agrupa y no es un lugar.
    expect(html).not.toContain('>### Para la salsa<');
  });

  it('un lugar sin línea —descripción, variaciones, notas— va con data-linea vacío', () => {
    expect(renderPonerEn(lugares, 5))
      .toContain('data-accion="poner-en" data-seccion="descripcion" data-linea="" data-n="5"');
  });

  it('el texto de cada lugar se corta a una línea', () => {
    const largo = 'Mezclar todo muy despacio hasta que quede una masa lisa y elástica, sin grumos.';
    const html = renderPonerEn([{ seccion: 'preparacion', linea: 0, texto: largo, grupo: 'Preparación' }], 1);
    expect(html).not.toContain(largo);
    expect(html).toContain('Mezclar todo muy');
    expect(html).toContain('…');
  });

  it('un lugar vacío se ofrece igual: es donde va la primera foto', () => {
    expect(renderPonerEn([{ seccion: 'notas', linea: null, texto: '', grupo: 'Notas' }], 1))
      .toContain('(sin texto)');
  });

  it('la ficha se encuentra por su marca', () => {
    expect(renderPonerEn(lugares, 5)).toContain('data-poner-en');
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

  it('el campo de URL trae la cabecera de hoy cuando es una URL, y está Sin foto', () => {
    const conUrl = renderSelectorPortada(fotos, 'https://ejemplo.com/otra.jpg');
    expect(conUrl).toContain('value="https://ejemplo.com/otra.jpg"');
    // Una URL suelta no marca ninguna del depósito.
    expect(conUrl).not.toContain('aria-pressed="true"');
    expect(renderSelectorPortada(fotos, 'foto:3')).toContain('<input data-url-portada value=""');
    expect(renderSelectorPortada(fotos, null)).toContain('data-accion="sin-portada"');
  });

  it('la ficha se encuentra por su marca', () => {
    expect(renderSelectorPortada(fotos, null)).toContain('data-selector-portada');
  });
});
