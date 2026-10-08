import { describe, it, expect } from 'vitest';
import { renderConversor, renderReferencias, contenidoDeReferencias, resaltar, fichaDeCuenta, minutosDe, filasFiltradas, resultadoDeCuenta, valoresDe } from '../src/ui/referencias.js';
import { REFERENCIAS, FICHAS_DEL_CONVERSOR } from '../src/referencias/indice.js';
import { tagsDe } from '../src/referencias/busqueda.js';
import { idDeFicha, filasDe } from '../src/referencias/forma.js';
import { escapar as escaparHtml } from '../src/ui/markdown.js';
import type { Ficha, Tabla, Cuenta } from '../src/referencias/tipos.js';
import { ICO } from '../src/ui/iconos.js';

const fuente = { nombre: 'Fuente X', url: 'https://x.com/a' };
const tabla: Tabla = {
  id: 'blanqueado', titulo: 'Blanqueado',
  columnas: [{ id: 'verdura', nombre: 'Verdura' }, { id: 'minutos', nombre: 'Minutos', minutos: true }],
  filas: [{ verdura: 'Chauchas', minutos: '3' }, { verdura: 'Repollitos', minutos: '3–5' }, { verdura: 'Hojas', minutos: '—' }],
  notas: ['Después, el mismo tiempo en hielo.'], fuente
};
const cuenta: Cuenta = {
  id: 'agua-sal-pasta', titulo: 'Agua y sal', entradas: [{ id: 'gramos', nombre: 'Pasta', tipo: 'numero', unidad: 'g', porDefecto: null }],
  notas: ['Es el punto medio del proyecto.'],
  calcular: v => (typeof v['gramos'] === 'number' ? { lineas: [{ nombre: 'Agua', valor: '1 l' }], advertencias: [], fuentes: [fuente] } : null)
};
const h: { fichas: Ficha[] } = { fichas: [{ tipo: 'cuenta', cuenta }, { tipo: 'tabla', tabla }] };
const vacio = { valores: {}, busqueda: '' };

describe('la pantalla del Conversor, con fichas de prueba', () => {
  it('título con su ícono y volver, el índice y una ficha por tabla o cuenta, en orden', () => {
    const html = renderConversor(h.fichas, vacio);
    expect(html).toContain('Conversor');
    expect(html).toContain('data-accion="volver"');
    expect(html).toContain('data-accion="ir-a-ficha" data-id="agua-sal-pasta"');
    expect(html.indexOf('id="ficha-agua-sal-pasta"')).toBeLessThan(html.indexOf('id="ficha-blanqueado"'));
  });

  it('la tabla con sus columnas, sus filas, sus notas y la fuente con su link al pie', () => {
    const html = renderConversor(h.fichas, vacio);
    expect(html).toContain('<th>Verdura</th>');
    expect(html).toContain('<td>Chauchas</td>');
    expect(html).toContain('Después, el mismo tiempo en hielo.');
    expect(html).toContain('<a href="https://x.com/a" target="_blank" rel="noopener">Fuente X</a>');
  });

  it('una columna de minutos lleva el botón del temporizador, con el primer número', () => {
    const html = renderConversor(h.fichas, vacio);
    expect(html).toContain('data-accion="referencia-temporizador" data-nombre="Chauchas" data-minutos="3"');
    expect(html).toContain('data-nombre="Repollitos" data-minutos="3"');
    expect(html).not.toContain('data-nombre="Hojas"');
  });

  it('el ícono del botón de minutos no se lee: el botón ya tiene su nombre', () => {
    expect(renderConversor(h.fichas, vacio)).toMatch(/class="ico-min"[^>]*>\s*<svg aria-hidden="true"/);
  });

  it('la cuenta con sus entradas y, sin datos, el resultado vacío', () => {
    const html = renderConversor(h.fichas, vacio);
    expect(html).toContain('data-entrada="gramos" data-cuenta="agua-sal-pasta"');
    expect(html).toContain('data-resultado-cuenta="agua-sal-pasta"');
    expect(html).not.toContain('NaN');
  });

  it('las notas de una cuenta van en su ficha', () => {
    expect(renderConversor(h.fichas, vacio)).toContain('Es el punto medio del proyecto.');
  });

  it('un valor guardado que no es número no se dibuja ni da NaN', () => {
    const html = renderConversor(h.fichas, { valores: { 'agua-sal-pasta': { gramos: 'abc' } }, busqueda: '' });
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('value="abc"');
  });

  it('una entrada con visibleSi que no se cumple no se dibuja', () => {
    const c: Cuenta = { ...cuenta, entradas: [{ id: 'oculta', nombre: 'Oculta', tipo: 'numero', porDefecto: null, visibleSi: () => false }] };
    expect(renderConversor([{ tipo: 'cuenta', cuenta: c }], vacio)).not.toContain('data-entrada="oculta"');
  });

  it('una tabla con varias fuentes las lista todas al pie, sin repetir las del mismo link', () => {
    const t: Tabla = {
      id: 'v', titulo: 'V', columnas: [{ id: 'a', nombre: 'A' }, { id: 'f', nombre: 'F' }],
      filas: [{ a: '1', f: 'AA, BB 3' }],
      columnaFuente: 'f',
      fuentes: [
        { abreviatura: 'AA', nombre: 'Una', url: 'https://u.com' },
        { abreviatura: 'BB', nombre: 'Otra', url: 'https://o.com' },
        { abreviatura: 'CC', nombre: 'Otra más', url: 'https://o.com' }
      ]
    };
    const html = renderConversor([{ tipo: 'tabla', tabla: t }], vacio);
    expect(html).toContain('>Una</a>');
    expect(html).toContain('>Otra</a>');
    expect(html).not.toContain('Otra más');
    expect(html).toContain('<td>AA, BB 3</td>');
  });

  it('con buscador, el campo lleva lo buscado', () => {
    const html = renderConversor(h.fichas, { valores: {}, busqueda: 'pollo' });
    expect(html).toContain('data-buscar-referencia="conversor"');
    expect(html).toContain('value="pollo"');
  });
});

describe('las notas', () => {
  const conNotas = (...notas: string[]): string =>
    renderConversor([{ tipo: 'tabla', tabla: { ...tabla, notas } }], vacio);

  it('una URL dentro de un paréntesis es un link y el paréntesis queda afuera', () => {
    const html = conNotas('Lo dice el fabricante (https://ejemplo.com/a?x=1&y=2), según su ficha.');
    expect(html).toContain('(<a href="https://ejemplo.com/a?x=1&amp;y=2" target="_blank" rel="noopener">https://ejemplo.com/a?x=1&amp;y=2</a>), según su ficha.');
  });

  it('el punto final de la oración no entra en el link', () => {
    expect(conNotas('Está en https://ejemplo.com/pagina.')).toContain('<a href="https://ejemplo.com/pagina" target="_blank" rel="noopener">https://ejemplo.com/pagina</a>.');
  });

  it('el resto del texto sigue escapado', () => {
    const html = conNotas('<script>alert(1)</script> y https://ejemplo.com');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('href="https://ejemplo.com"');
  });

  it('una nota sin URL queda como texto', () => {
    expect(conNotas('Sin links.')).toContain('<li>Sin links.</li>');
  });
});

describe('los minutos de una fila', () => {
  it('el primer número, con medios; sin número, nada', () => {
    expect(['3', '1½', '3–5', '2 (5 al vapor)', '4 min', '2:30', '—', 'según el paquete'].map(minutosDe))
      .toEqual([3, 1.5, 3, 2, 4, 2, null, null]);
  });
  it('los segundos que siguen a los minutos se suman', () => {
    expect(['3 min 30 s', '2 min 15 s', '1 min 30 s a 2 min'].map(minutosDe)).toEqual([3.5, 2.25, 1.5]);
  });
});

describe('el buscador', () => {
  const t: Tabla = { id: 'c', titulo: 'C', columnas: [{ id: 'a', nombre: 'Alimento' }], fuente,
    grupos: [{ titulo: 'Frutas', filas: [{ a: 'Limón' }, { a: 'Banana' }] }, { titulo: 'Aves', filas: [{ a: 'Pollo entero' }] }] };
  it('sin tildes ni mayúsculas; los grupos sin filas no se dibujan', () => {
    const html = filasFiltradas(t, 'LIMON');
    expect(html).toContain('Limón');
    expect(html).not.toContain('Banana');
    expect(html).not.toContain('Aves');
  });
  it('vacío, todo', () => {
    expect(filasFiltradas(t, '')).toContain('Pollo entero');
  });
  it('sin coincidencias, lo dice', () => {
    expect(filasFiltradas(t, 'zzz')).toContain('Ningún alimento con «zzz».');
  });

  describe('en una herramienta con una tabla plana y una agrupada', () => {
    const plana: Tabla = { id: 'general', titulo: 'General', columnas: [{ id: 'dato', nombre: 'Dato' }], fuente, filas: [{ dato: 'Regla uno' }, { dato: 'Regla dos' }] };
    const herramienta: Ficha[] = [{ tipo: 'tabla', tabla: plana }, { tipo: 'tabla', tabla: t }];
    const cuantas = (html: string, texto: string): number => html.split(texto).length - 1;

    it('la búsqueda filtra sólo la agrupada: la plana se dibuja entera y sin aviso', () => {
      const html = renderConversor(herramienta, { valores: {}, busqueda: 'limon' });
      expect(html).toContain('<td>Regla uno</td>');
      expect(html).toContain('<td>Regla dos</td>');
      expect(html).toContain('Limón');
      expect(html).not.toContain('Ningún alimento');
    });

    it('sin coincidencias en ninguna, el aviso sale una sola vez y la plana sigue entera', () => {
      const html = renderConversor(herramienta, { valores: {}, busqueda: 'zzz' });
      expect(cuantas(html, 'Ningún alimento con «zzz»')).toBe(1);
      expect(html).toContain('<td>Regla uno</td>');
    });

    it('filasFiltradas de la plana ignora la búsqueda', () => {
      const html = filasFiltradas(plana, 'zzz');
      expect(html).toContain('Regla dos');
      expect(html).not.toContain('Ningún alimento');
    });
  });
});

describe('lo que se ve es lo que se calcula', () => {
  /** Una cuenta que devuelve en una línea los valores que recibió. */
  const eco: Cuenta = {
    id: 'eco', titulo: 'Eco',
    entradas: [
      { id: 'n', nombre: 'N', tipo: 'numero', porDefecto: 4 },
      { id: 'o', nombre: 'O', tipo: 'opcion', opciones: [{ valor: 'a', texto: 'A' }, { valor: 'b', texto: 'B' }], porDefecto: 'a' }
    ],
    calcular: v => ({ lineas: [{ nombre: 'Recibió', valor: `${String(v['n'])}|${String(v['o'])}` }], advertencias: [], fuentes: [] })
  };
  const conEco = (guardado: Record<string, number | string | null>) =>
    renderConversor([{ tipo: 'cuenta', cuenta: eco }], { valores: { eco: guardado }, busqueda: '' });

  it('valoresDe: un número se queda si es finito; si no, el valor por defecto', () => {
    expect(valoresDe(eco, { n: 7 })['n']).toBe(7);
    expect(valoresDe(eco, { n: null })['n']).toBe(4);
    expect(valoresDe(eco, { n: 'abc' })['n']).toBe(4);
    expect(valoresDe(eco, { n: Infinity })['n']).toBe(4);
    expect(valoresDe(eco, {})['n']).toBe(4);
  });

  it('valoresDe: una opción se queda si existe; si no, o si no es texto, la de por defecto', () => {
    expect(valoresDe(eco, { o: 'b' })['o']).toBe('b');
    expect(valoresDe(eco, { o: 'ya-no-existe' })['o']).toBe('a');
    expect(valoresDe(eco, { o: 5 })['o']).toBe('a');
    expect(valoresDe(eco, { o: null })['o']).toBe('a');
  });

  it('un campo borrado con valor por defecto se calcula —y se ve— con el valor por defecto', () => {
    const html = conEco({ n: null });
    expect(html).toContain('4|a');
    expect(html).toContain('value="4"');
  });

  it('una opción guardada que ya no existe: se ve la de por defecto y se calcula con ella', () => {
    const html = conEco({ o: 'ya-no-existe' });
    expect(html).toContain('4|a');
    expect(html).toContain('<option value="a" selected>');
  });

  it('un texto guardado en una entrada numérica se ve y se calcula con el valor por defecto', () => {
    const html = conEco({ n: 'abc' });
    expect(html).toContain('4|a');
    expect(html).toContain('value="4"');
    expect(html).not.toContain('abc');
  });

  it('un número guardado en una opción se ve y se calcula con la opción por defecto', () => {
    const html = conEco({ o: 5 });
    expect(html).toContain('4|a');
    expect(html).toContain('<option value="a" selected>');
  });

  it('resultadoDeCuenta, pintado solo, parte de lo guardado y aplica los mismos valores por defecto', () => {
    expect(resultadoDeCuenta(eco, { n: null })).toContain('4|a');
    expect(resultadoDeCuenta(eco, {})).toContain('4|a');
    expect(resultadoDeCuenta(eco, { n: 9, o: 'b' })).toContain('9|b');
  });
});

describe('el nombre del temporizador de una fila', () => {
  const tablaCon = (columnas: Tabla['columnas'], filas: readonly Record<string, string>[]): Tabla =>
    ({ id: 't', titulo: 'T', columnas, filas, fuente });
  const dibujar = (t: Tabla) => renderConversor([{ tipo: 'tabla', tabla: t }], vacio);

  it('suma a la primera celda la columna siguiente sin unidad ni minutos, para distinguir filas que la comparten', () => {
    const html = dibujar(tablaCon(
      [{ id: 'v', nombre: 'Verdura' }, { id: 'tam', nombre: 'Tamaño' }, { id: 'm', nombre: 'Minutos', minutos: true }],
      [{ v: 'Espárragos', tam: 'finos', m: '2' }, { v: 'Espárragos', tam: 'gruesos', m: '4' }, { v: 'Chauchas', tam: '—', m: '3' }]));
    expect(html).toContain('data-nombre="Espárragos, finos" data-minutos="2"');
    expect(html).toContain('data-nombre="Espárragos, gruesos" data-minutos="4"');
    expect(html).toContain('aria-label="Temporizador de Espárragos, finos"');
    // Sin valor en esa columna, sólo la primera celda.
    expect(html).toContain('data-nombre="Chauchas" data-minutos="3"');
  });

  it('si las demás columnas tienen unidad o son de minutos, el nombre es la primera celda', () => {
    const html = dibujar(tablaCon(
      [{ id: 'v', nombre: 'Té' }, { id: 'c', nombre: 'Agua', unidad: '°C' }, { id: 'm', nombre: 'Infusión', minutos: true }],
      [{ v: 'Verde', c: '80', m: '3' }]));
    expect(html).toContain('data-nombre="Verde" data-minutos="3"');
  });
});

describe('el conversor', () => {
  const conversor = FICHAS_DEL_CONVERSOR;
  it('con volver, su ícono, el buscador, la cuenta y las tres tablas', () => {
    const html = renderConversor(conversor, { valores: {}, busqueda: '' });
    expect(html).toContain('data-accion="volver"');
    expect(html).toContain(ICO.medidor);
    expect(html).toContain('data-buscar-referencia="conversor"');
    for (const id of ['conversion', 'pesos', 'sistemas', 'medidas-eeuu']) expect(html).toContain(`id="ficha-${id}"`);
  });

  it('el buscador filtra los ingredientes de la tabla de pesos', () => {
    const html = renderConversor(conversor, { valores: {}, busqueda: 'harina' });
    expect(html).toContain('<td>Harina 0000');
    expect(html).not.toContain('<td>Azúcar blanca');
    // El ingrediente sigue en las opciones de la cuenta: el buscador no las toca.
    expect(html).toContain('>Azúcar blanca</option>');
  });

  it('lo elegido se calcula con lo que se ve', () => {
    const html = renderConversor(conversor, { valores: { conversion: { cantidad: 1, unidad: 'taza', ingrediente: 'azucar' } }, busqueda: '' });
    expect(html).toMatch(/<span class="n">g<\/span><span class="c">\d+<\/span>/);
  });
});

describe('la entrada de Referencias', () => {
  const todas = REFERENCIAS;
  const conTabla = todas.find(f => f.tipo === 'tabla');
  const tablaDe = (f: typeof conTabla) => (f?.tipo === 'tabla' ? f.tabla : null);
  const abiertas = (html: string): number => (html.match(/<details[^>]* open/g) ?? []).length;

  it('volver, el título, el buscador vacío y un chip por tag', () => {
    const html = renderReferencias({ tag: '', q: '' });
    expect(html).toContain('data-accion="volver"');
    expect(html).toContain('Referencias');
    expect(html).toContain(ICO.libro);
    expect(html).toContain('data-buscar-referencias');
    expect(html).toContain('placeholder="Buscar" value=""');
    for (const t of tagsDe(REFERENCIAS)) expect(html).toContain(`data-accion="referencias-tag" data-tag-ref="${escaparHtml(t)}"`);
    expect(html).toContain('data-contenido-referencias');
  });

  it('el buscador tiene nombre para los lectores de pantalla', () => {
    expect(renderReferencias({ tag: '', q: '' })).toContain('<input data-buscar-referencias aria-label="Buscar en Referencias"');
    expect(renderConversor(FICHAS_DEL_CONVERSOR, { valores: {}, busqueda: '' })).toContain('aria-label="Buscar un alimento"');
  });

  it('los chips no llevan data-tag: con ese atributo, el toque iría a la lista de recetas del tag', () => {
    expect(renderReferencias({ tag: '', q: '' })).not.toContain(' data-tag="');
  });

  it('sin nada, una sola lista con todas las fichas en orden, cada una un desplegable cerrado', () => {
    const html = contenidoDeReferencias({ tag: '', q: '' });
    expect(html.startsWith('<div class="fichas-ref">')).toBe(true);
    const ids = [...html.matchAll(/id="ficha-([\w-]+)"/g)].map(m => m[1]);
    expect(ids).toEqual(todas.map(idDeFicha));
    expect((html.match(/<details class="ficha-ref"/g) ?? []).length).toBe(todas.length);
    expect(abiertas(html)).toBe(0);
  });

  it('las fichas no muestran sus tags ni repiten el título dentro del desplegable', () => {
    const html = contenidoDeReferencias({ tag: '', q: '' });
    expect(html).not.toContain('class="chip');
    const t = tablaDe(conTabla);
    expect(html).not.toContain(`<h2>${escaparHtml(t?.titulo ?? '')}</h2>`);
  });

  it('con un tag, sólo sus fichas, todo cerrado', () => {
    const tag = tagsDe(REFERENCIAS)[0] ?? '';
    const html = renderReferencias({ tag, q: '' });
    expect(html).toContain(`class="chip act" data-accion="referencias-tag" data-tag-ref="${escaparHtml(tag)}"`);
    for (const f of todas) {
      const ficha = `id="ficha-${idDeFicha(f)}"`;
      if (f.tags.includes(tag)) expect(html).toContain(ficha);
      else expect(html).not.toContain(ficha);
    }
    expect(abiertas(html)).toBe(0);
  });

  it('con texto, cada tabla encontrada abierta, con su encabezado, sólo las filas que coinciden y la palabra resaltada', () => {
    const t = tablaDe(conTabla);
    const primera = t ? filasDe(t)[0] : undefined;
    const celda = primera ? Object.values(primera)[0] ?? '' : '';
    const html = contenidoDeReferencias({ tag: '', q: celda.toUpperCase() });
    expect(html).toContain(`<details class="ficha-ref" open><summary>`);
    expect(html).toContain('<thead>');
    expect(html).toContain(`<mark>${escaparHtml(celda)}</mark>`);
  });

  it('una cuenta que coincide por su título va cerrada, con el título resaltado', () => {
    const c = todas.find(f => f.tipo === 'cuenta');
    const titulo = c?.tipo === 'cuenta' ? c.cuenta.titulo : '';
    const html = contenidoDeReferencias({ tag: '', q: titulo });
    expect(html).toContain(`<details class="ficha-ref"><summary><mark>${escaparHtml(titulo)}</mark>`);
    expect(html).toContain(`id="ficha-${c ? idDeFicha(c) : ''}"`);
  });

  it('sin nada, lo dice con el texto escapado', () => {
    expect(contenidoDeReferencias({ tag: '', q: '<zzz>' })).toContain('Nada con «&lt;zzz&gt;».');
  });
});

describe('resaltar', () => {
  it('marca cada aparición sin mirar mayúsculas ni tildes, y respeta el texto original', () => {
    expect(resaltar('Limón y limon', 'LIMON')).toBe('<mark>Limón</mark> y <mark>limon</mark>');
  });
  it('escapa el resto del texto y lo marcado', () => {
    expect(resaltar('a <b> & c', '<b>')).toBe('a <mark>&lt;b&gt;</mark> &amp; c');
  });
  it('sin texto buscado, sólo escapa', () => {
    expect(resaltar('a & b', '  ')).toBe('a &amp; b');
  });
});

describe('las fichas de las cuentas en la entrada', () => {
  it('un dato numérico acepta decimales con las flechas', () => {
    expect(fichaDeCuenta(cuenta, {})).toContain('step="any"');
  });

  it('fichaDeCuenta dibuja la cuenta sin título, con sus entradas, lo guardado y su resultado', () => {
    const html = fichaDeCuenta(cuenta, { gramos: 200 });
    expect(html).toContain('id="ficha-agua-sal-pasta"');
    expect(html).toContain('data-cuenta="agua-sal-pasta"');
    expect(html).toContain('value="200"');
    expect(html).toContain('data-resultado-cuenta="agua-sal-pasta"');
    expect(html).not.toContain('<h2>');
  });
});
