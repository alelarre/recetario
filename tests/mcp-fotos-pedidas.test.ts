// La numeración de las fotos que pide el agente: fija y conocida antes de
// subirlas, para que el `.md` las nombre con `foto:N` desde el principio.
import { describe, it, expect } from 'vitest';
import { numerosDeFotos, fotosQueSeSuben, portadaCon, type FotoPedida } from '../mcp/fotos-pedidas.js';

const pedidas = (...usos: FotoPedida['uso'][]): FotoPedida[] => usos.map((uso, i) => ({ origen: `f${i}.jpg`, uso }));

describe('numerosDeFotos', () => {
  it('al crear, la foto i de la lista es foto:i', () => {
    expect(numerosDeFotos(pedidas('plato', 'paso', 'paso'), [])).toEqual([1, 2, 3]);
  });

  it('al guardar, las nuevas siguen al número más alto del depósito, aunque haya huecos', () => {
    const deposito = [{ n: 1, url: 'https://a' }, { n: 3, url: 'https://b' }];
    expect(numerosDeFotos(pedidas('plato', 'paso'), deposito)).toEqual([4, 5]);
  });

  it('una fuente también tiene su número: si no se sube, queda sin usar', () => {
    expect(numerosDeFotos(pedidas('fuente', 'plato'), [])).toEqual([1, 2]);
  });

  it('sin fotos pedidas, ninguna', () => {
    expect(numerosDeFotos([], [{ n: 2, url: 'https://a' }])).toEqual([]);
  });
});

describe('fotosQueSeSuben', () => {
  it('sin borrador, la fuente no se sube y su número queda sin usar', () => {
    expect(fotosQueSeSuben(pedidas('fuente', 'plato'), [], { conBorrador: false }).map(s => s.n)).toEqual([2]);
  });

  it('con borrador, la fuente se sube con su número', () => {
    expect(fotosQueSeSuben(pedidas('fuente', 'plato'), [], { conBorrador: true }).map(s => s.n)).toEqual([1, 2]);
  });
});

describe('portadaCon', () => {
  const seSuben = [{ n: 2, pedida: { origen: 'a.jpg', uso: 'paso' as const } }, { n: 3, pedida: { origen: 'b.jpg', uso: 'plato' as const } }];

  it('sin portada en el .md, la primera foto del plato', () => {
    expect(portadaCon(null, seSuben)).toBe('foto:3');
  });

  it('la del .md se respeta', () => {
    expect(portadaCon('foto:1', seSuben)).toBe('foto:1');
  });

  it('sin foto del plato, ninguna', () => {
    expect(portadaCon(null, seSuben.slice(0, 1))).toBeNull();
  });
});
