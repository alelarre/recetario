import { describe, it, expect, afterEach } from 'vitest';
import { pintar, pintarParte, despuesDePintar } from '../src/ui/pintar.js';
import { comoGlobal, limpiarGlobales } from './dom-falso.js';

/** Un elemento que anota cada forma en que se le escribió HTML. */
function elementoFalso() {
  const escrito: string[] = [];
  const el = {
    escrito,
    set innerHTML(html: string) { escrito.push(`adentro:${html}`); },
    set outerHTML(html: string) { escrito.push(`reemplazar:${html}`); },
    insertAdjacentHTML: (donde: string, html: string) => { escrito.push(`${donde}:${html}`); }
  };
  return el;
}

describe('pintarParte', () => {
  const sacar: (() => void)[] = [];
  afterEach(() => {
    for (const s of sacar.splice(0)) s();
    limpiarGlobales();
  });

  it('escribe el HTML donde se le pide', () => {
    const el = elementoFalso();
    const comoElemento = el as unknown as Element;
    pintarParte(comoElemento, '<b>1</b>');
    pintarParte(comoElemento, '<b>2</b>', 'adentro');
    pintarParte(comoElemento, '<b>3</b>', 'reemplazar');
    pintarParte(comoElemento, '<b>4</b>', 'al-principio');
    pintarParte(comoElemento, '<b>5</b>', 'al-final');
    expect(el.escrito).toEqual([
      'adentro:<b>1</b>', 'adentro:<b>2</b>', 'reemplazar:<b>3</b>',
      'afterbegin:<b>4</b>', 'beforeend:<b>5</b>'
    ]);
  });

  it('termina como pintar: corre lo registrado, después de escribir', () => {
    const el = elementoFalso();
    const orden: string[] = [];
    sacar.push(despuesDePintar(() => { orden.push(`completar tras ${el.escrito.length}`); }));
    pintarParte(el as unknown as Element, '<img data-drive="d1">', 'al-final');
    expect(orden).toEqual(['completar tras 1']);
  });

  it('pintar la pantalla entera corre lo mismo', () => {
    const app = elementoFalso();
    global.document = comoGlobal<Document>({ querySelector: (sel: string) => (sel === '#app' ? app : null) });
    let corridas = 0;
    sacar.push(despuesDePintar(() => { corridas++; }));
    pintar('<p>hola</p>');
    expect(app.escrito).toEqual(['adentro:<p>hola</p>']);
    expect(corridas).toBe(1);
  });

  it('lo que se saca deja de correr', () => {
    let corridas = 0;
    const quitar = despuesDePintar(() => { corridas++; });
    quitar();
    pintarParte(elementoFalso() as unknown as Element, '');
    expect(corridas).toBe(0);
  });
});
