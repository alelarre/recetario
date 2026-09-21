import { describe, it, expect } from 'vitest';
import { recetaFalsa } from './dobles.js';
import {
  linkDeFoto, idDeDrive, parsearFotos, serializarFotos, siguienteNumero,
  resolver, resolverReceta, sinFotosDeDrive, lineaDelCursor, ponerEn, sacarReferencias
} from '../src/fotos-receta.js';

describe('linkDeFoto / idDeDrive', () => {
  it('idDeDrive reconoce un link armado por linkDeFoto, con caracteres que necesitan escapar', () => {
    const link = linkDeFoto('1AbC_dé f');
    expect(link).toBe('https://drive.google.com/file/d/1AbC_d%C3%A9%20f/view');
    expect(idDeDrive(link)).toBe('1AbC_dé f');
  });

  it('una URL que no es de Drive da null', () => {
    expect(idDeDrive('https://ejemplo.com/pan.jpg')).toBeNull();
  });

  it('reconoce las formas en que Drive reparte un link, pegadas a mano', () => {
    for (const url of [
      'https://drive.google.com/file/d/abc123/view',
      'https://drive.google.com/file/d/abc123/view?usp=sharing',
      'https://drive.google.com/file/d/abc123/view?usp=drive_link#algo',
      'https://drive.google.com/file/d/abc123/edit',
      'https://drive.google.com/file/d/abc123/preview',
      'https://drive.google.com/file/d/abc123',
      'https://drive.google.com/file/d/abc123/',
      'https://drive.google.com/file/d/abc123?usp=sharing'
    ]) expect(idDeDrive(url), url).toBe('abc123');
  });

  it('otro dominio u otra forma del camino no se reconocen', () => {
    for (const url of [
      'https://ejemplo.com/file/d/abc123/view',
      'http://drive.google.com/file/d/abc123/view',
      'https://docs.google.com/file/d/abc123/view',
      'https://drive.google.com/file/d/abc123/view/otra',
      'https://drive.google.com/uc?id=abc123',
      'https://drive.google.com/file/d//view'
    ]) expect(idDeDrive(url), url).toBeNull();
  });
});

describe('parsearFotos / serializarFotos', () => {
  it('hace ida y vuelta, con huecos en la numeración', () => {
    const cuerpo = '- 1: https://ejemplo.com/a.jpg\n- 3: https://ejemplo.com/c.jpg';
    const fotos = parsearFotos(cuerpo);
    expect(fotos).toEqual([
      { n: 1, url: 'https://ejemplo.com/a.jpg' },
      { n: 3, url: 'https://ejemplo.com/c.jpg' }
    ]);
    expect(serializarFotos(fotos!)).toBe(cuerpo);
  });

  it('una línea sin la forma "- N: url" da null', () => {
    expect(parsearFotos('- 1: https://ejemplo.com/a.jpg\nesto no calza')).toBeNull();
  });

  it('una URL que no es http(s) también da null', () => {
    expect(parsearFotos('- 1: drive://algo')).toBeNull();
  });
});

describe('siguienteNumero', () => {
  it('vacío empieza en 1', () => {
    expect(siguienteNumero([])).toBe(1);
  });

  it('con huecos toma el más alto más uno', () => {
    expect(siguienteNumero([{ n: 1, url: 'x' }, { n: 3, url: 'y' }])).toBe(4);
  });
});

describe('resolver', () => {
  const fotos = [{ n: 1, url: 'https://a.com/1.jpg' }, { n: 2, url: 'https://b.com/2.jpg' }];

  it('foto:N da la URL de su línea', () => {
    expect(resolver('foto:2', fotos)).toBe('https://b.com/2.jpg');
  });

  it('un número que no está da null', () => {
    expect(resolver('foto:9', fotos)).toBeNull();
  });

  it('una URL da la misma URL', () => {
    expect(resolver('https://externa.com/x.jpg', fotos)).toBe('https://externa.com/x.jpg');
  });

  it('null da null', () => {
    expect(resolver(null, fotos)).toBeNull();
  });
});

describe('resolverReceta', () => {
  const fotos = [{ n: 1, url: 'https://a.com/1.jpg' }, { n: 2, url: 'https://b.com/2.jpg' }];

  it('resuelve la cabecera y las referencias, con epígrafe y sin él', () => {
    const receta = recetaFalsa({
      foto: 'foto:2',
      descripcion: 'Textura: ![](foto:1) acá.',
      ingredientes: '- Harina — 1kg ![Bien picada](foto:2)',
      fotos
    });
    const resuelta = resolverReceta(receta);
    expect(resuelta.foto).toBe('https://b.com/2.jpg');
    expect(resuelta.descripcion).toBe('Textura: ![](https://a.com/1.jpg) acá.');
    expect(resuelta.ingredientes).toBe('- Harina — 1kg ![Bien picada](https://b.com/2.jpg)');
  });

  it('una referencia a un número que no está en el depósito se borra', () => {
    const receta = recetaFalsa({ preparacion: '1. Paso ![](foto:9)', fotos });
    const resuelta = resolverReceta(receta);
    expect(resuelta.preparacion).not.toContain('foto:9');
    expect(resuelta.preparacion).not.toContain('![');
  });

  it('no muta la receta original y conserva el depósito', () => {
    const receta = recetaFalsa({ foto: 'foto:1', fotos });
    const resuelta = resolverReceta(receta);
    expect(receta.foto).toBe('foto:1');
    expect(resuelta.fotos).toEqual(fotos);
  });

  it('recorre variaciones, notas y las secciones ajenas', () => {
    const receta = recetaFalsa({
      variaciones: 'Con queso ![](foto:1)',
      notas: 'Ojo ![](foto:2)',
      otras: [{ encabezado: 'Maridaje', cuerpo: 'Un malbec ![](foto:1)' }],
      fotos
    });
    const resuelta = resolverReceta(receta);
    expect(resuelta.variaciones).toBe('Con queso ![](https://a.com/1.jpg)');
    expect(resuelta.notas).toBe('Ojo ![](https://b.com/2.jpg)');
    expect(resuelta.otras).toEqual([{ encabezado: 'Maridaje', cuerpo: 'Un malbec ![](https://a.com/1.jpg)' }]);
  });
});

describe('sinFotosDeDrive', () => {
  const idDrive = 'abc123';
  const linkDrive = linkDeFoto(idDrive);
  const fotos = [{ n: 1, url: linkDrive }, { n: 2, url: 'https://externa.com/x.jpg' }];

  it('saca la de Drive de la cabecera, del texto y del depósito', () => {
    const receta = recetaFalsa({
      foto: 'foto:1',
      descripcion: 'Ver ![](foto:1) y ![](foto:2).',
      fotos
    });
    const limpia = sinFotosDeDrive(receta);
    expect(limpia.foto).toBeNull();
    expect(limpia.descripcion).not.toContain(linkDrive);
    expect(limpia.descripcion).toContain('https://externa.com/x.jpg');
    expect(limpia.fotos).toEqual([{ n: 2, url: 'https://externa.com/x.jpg' }]);
  });

  it('deja las externas como están', () => {
    const receta = recetaFalsa({
      foto: 'https://externa.com/portada.jpg',
      fotos: [{ n: 1, url: 'https://externa.com/x.jpg' }]
    });
    const limpia = sinFotosDeDrive(receta);
    expect(limpia.foto).toBe('https://externa.com/portada.jpg');
    expect(limpia.fotos).toEqual([{ n: 1, url: 'https://externa.com/x.jpg' }]);
  });
});

describe('lineaDelCursor', () => {
  it('cuenta los saltos de línea que quedan antes del cursor', () => {
    const texto = '1. Hervir\n2. Colar\n3. Servir';
    expect(lineaDelCursor(texto, 0)).toBe(0);
    expect(lineaDelCursor(texto, '1. Her'.length)).toBe(0);
    expect(lineaDelCursor(texto, '1. Hervir\n'.length)).toBe(1);
    expect(lineaDelCursor(texto, '1. Hervir\n2. Colar'.length)).toBe(1);
  });

  it('al final del texto, la última línea', () => {
    const texto = '1. Hervir\n2. Colar';
    expect(lineaDelCursor(texto, texto.length)).toBe(1);
    // Un texto que termina en salto tiene una línea vacía más, y ahí cae.
    expect(lineaDelCursor('1. Hervir\n', 10)).toBe(1);
  });

  it('en una línea vacía del medio, esa línea', () => {
    expect(lineaDelCursor('Uno\n\nDos', 4)).toBe(1);
  });

  it('un texto vacío es la línea 0, y una posición fuera de rango se recorta', () => {
    expect(lineaDelCursor('', 0)).toBe(0);
    expect(lineaDelCursor('', 9)).toBe(0);
    expect(lineaDelCursor('Uno\nDos', -3)).toBe(0);
    expect(lineaDelCursor('Uno\nDos', 999)).toBe(1);
  });
});

describe('ponerEn', () => {
  it('en un ingrediente, agrega la referencia al final de esa línea', () => {
    const texto = '- Harina — 1kg\n- Sal — 1 cda';
    expect(ponerEn(texto, 0, 5)).toBe('- Harina — 1kg ![](foto:5)\n- Sal — 1 cda');
  });

  it('en un paso, agrega la referencia al final de esa línea', () => {
    const texto = '1. Hervir\n2. Colar';
    expect(ponerEn(texto, 1, 5)).toBe('1. Hervir\n2. Colar ![](foto:5)');
  });

  it('en una línea vacía, la referencia queda sola, sin el espacio adelante', () => {
    expect(ponerEn('', 0, 5)).toBe('![](foto:5)');
    expect(ponerEn('Uno\n\nDos', 1, 5)).toBe('Uno\n![](foto:5)\nDos');
  });

  it('una línea que no existe deja el texto como está', () => {
    expect(ponerEn('1. Hervir', 4, 5)).toBe('1. Hervir');
  });

  it('no repite la referencia si la línea ya la tiene', () => {
    const conFoto = ponerEn('1. Hervir', 0, 5);
    expect(ponerEn(conFoto, 0, 5)).toBe(conFoto);
  });

  it('con línea, sólo mira esa línea: la misma foto en otra línea no bloquea agregarla', () => {
    const texto = '- Harina — 1kg ![](foto:5)\n- Sal — 1 cda';
    expect(ponerEn(texto, 1, 5)).toBe('- Harina — 1kg ![](foto:5)\n- Sal — 1 cda ![](foto:5)');
  });
});

describe('sacarReferencias', () => {
  it('borra todas las referencias a un número, y deja las demás', () => {
    expect(sacarReferencias('A ![](foto:1) B ![Así](foto:2) C', 2)).toBe('A ![](foto:1) B C');
  });

  it('sin referencias a ese número no cambia nada', () => {
    expect(sacarReferencias('Sin fotos acá.', 3)).toBe('Sin fotos acá.');
  });
});
