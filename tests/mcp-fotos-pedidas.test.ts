// La numeración de las fotos que pide el agente: fija y conocida antes de
// subirlas, para que el `.md` las nombre con `foto:N` desde el principio.
import { describe, it, expect } from 'vitest';
import { numerosDeFotos, type FotoPedida } from '../mcp/fotos-pedidas.js';

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
