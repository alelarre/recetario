import { describe, it, expect } from 'vitest';
import { medidas, achicar } from '../src/fotos.js';
import type { Lienzo } from '../src/fotos.js';

describe('medidas', () => {
  it('una vertical queda con el alto en el máximo', () => {
    expect(medidas(3000, 4000)).toEqual({ ancho: 1200, alto: 1600 });
  });

  it('una horizontal queda con el ancho en el máximo', () => {
    expect(medidas(4000, 3000)).toEqual({ ancho: 1600, alto: 1200 });
  });

  it('una más chica que el máximo no se agranda', () => {
    expect(medidas(800, 600)).toEqual({ ancho: 800, alto: 600 });
  });

  it('el máximo se puede elegir, y redondea', () => {
    expect(medidas(1000, 333, 100)).toEqual({ ancho: 100, alto: 33 });
  });
});

/** Un canvas que anota lo que le hicieron. */
function lienzoFalso(salida: Blob | null = new Blob(['jpeg'], { type: 'image/jpeg' })) {
  const registro = { dibujos: [] as unknown[][], exportado: [] as unknown[] };
  const lienzo: Lienzo = {
    width: 0, height: 0,
    getContext: () => ({ drawImage: (...args: unknown[]) => { registro.dibujos.push(args); } }),
    toBlob: (cb, tipo, calidad) => { registro.exportado.push(tipo, calidad); cb(salida); }
  };
  return { lienzo, registro };
}

describe('achicar', () => {
  it('dibuja con las medidas nuevas y exporta en JPEG', async () => {
    const { lienzo, registro } = lienzoFalso();
    let cerrada = false;
    const imagen = { width: 4000, height: 3000, close: () => { cerrada = true; } };

    const blob = await achicar(new Blob(['x']), () => lienzo, async () => imagen);

    expect(lienzo.width).toBe(1600);
    expect(lienzo.height).toBe(1200);
    expect(registro.dibujos).toEqual([[imagen, 0, 0, 1600, 1200]]);
    expect(registro.exportado).toEqual(['image/jpeg', 0.85]);
    expect(await blob.text()).toBe('jpeg');
    expect(cerrada).toBe(true);
  });

  it('lo que no se decodifica rechaza', async () => {
    const { lienzo } = lienzoFalso();
    await expect(achicar(new Blob(['heic']), () => lienzo, async () => { throw new Error('no'); }))
      .rejects.toThrow();
  });

  it('si el canvas no exporta, rechaza', async () => {
    const { lienzo } = lienzoFalso(null);
    await expect(achicar(new Blob(['x']), () => lienzo, async () => ({ width: 10, height: 10 })))
      .rejects.toThrow();
  });
});
