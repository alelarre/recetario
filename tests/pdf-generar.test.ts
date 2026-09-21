import { describe, it, expect, vi, afterEach } from 'vitest';
import { parse } from '../src/recipe.js';

const llamadas = vi.hoisted(() => ({ setFonts: [] as unknown[], createPdf: [] as unknown[] }));
vi.mock('pdfmake/build/pdfmake', () => ({
  default: {
    setFonts: (f: unknown) => { llamadas.setFonts.push(f); },
    createPdf: (d: unknown) => { llamadas.createPdf.push(d); return { getBlob: async () => new Blob(['%PDF'], { type: 'application/pdf' }) }; }
  }
}));

/** Una receta con una foto de Drive en la cabecera y una externa en un paso. */
const CON_FOTOS = parse(`---
titulo: Rabas
foto: foto:1
---

## Preparación
1. Servir. ![](foto:2)

## Fotos
- 1: https://drive.google.com/file/d/abc/view
- 2: https://x/plato.jpg
`);

const sinFotos = {
  imagenDe: async () => null,
  achicar: async (b: Blob) => b
};

describe('generar el PDF', () => {
  afterEach(() => {
    vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.resetModules();
    llamadas.setFonts = []; llamadas.createPdf = [];
  });

  it('precargar pide las tres fuentes una sola vez y registra Inter con URLs absolutas', async () => {
    const pedidas: string[] = [];
    vi.stubGlobal('location', { href: 'https://h/recetario/' });
    vi.stubGlobal('fetch', async (u: string) => { pedidas.push(u); return { ok: true }; });
    const { precargar } = await import('../src/pdf/generar.js');
    await precargar();
    await precargar();
    expect(pedidas).toHaveLength(3);
    expect(pedidas.every(u => u.startsWith('https://h/'))).toBe(true);
    expect(llamadas.setFonts).toHaveLength(1);
    expect(JSON.stringify(llamadas.setFonts[0])).toContain('Inter');
  });

  it('si falla una fuente, el próximo intento vuelve a pedir', async () => {
    let fallar = true;
    let pedidos = 0;
    vi.stubGlobal('location', { href: 'https://h/recetario/' });
    vi.stubGlobal('fetch', async () => { pedidos++; return { ok: !fallar, status: fallar ? 500 : 200 }; });
    const { precargar } = await import('../src/pdf/generar.js');
    await expect(precargar()).rejects.toThrow();
    fallar = false;
    await precargar();
    expect(pedidos).toBe(6);
  });

  it('generar devuelve el Blob del documento de la receta', async () => {
    vi.stubGlobal('location', { href: 'https://h/recetario/' });
    vi.stubGlobal('fetch', async () => ({ ok: true }));
    const { generar } = await import('../src/pdf/generar.js');
    const blob = await generar(parse('---\ntitulo: Rabas\n---\n'), 'Pescados', sinFotos);
    expect(blob.type).toBe('application/pdf');
    expect(JSON.stringify(llamadas.createPdf[0])).toContain('Rabas');
  });

  it('la de Drive sale del caché, la externa con fetch, y las dos achicadas a 800 como data URL', async () => {
    const pedidas: string[] = [];
    const achicadas: number[] = [];
    vi.stubGlobal('location', { href: 'https://h/recetario/' });
    vi.stubGlobal('fetch', async (u: string) => {
      pedidas.push(u);
      return { ok: true, blob: async () => new Blob(['externa'], { type: 'image/jpeg' }) };
    });
    const { generar } = await import('../src/pdf/generar.js');
    await generar(CON_FOTOS, 'Pescados', {
      imagenDe: async (id: string) => new Blob([`drive:${id}`], { type: 'image/jpeg' }),
      achicar: async (b: Blob, maximo: number) => { achicadas.push(maximo); return b; }
    });
    const json = JSON.stringify(llamadas.createPdf[0]);
    expect(pedidas.filter(u => u === 'https://x/plato.jpg')).toHaveLength(1);
    expect(achicadas).toEqual([800, 800]);
    expect(json).toContain(`data:image/jpeg;base64,${btoa('drive:abc')}`);
    expect(json).toContain(`data:image/jpeg;base64,${btoa('externa')}`);
  });

  it('la foto que falla se omite, y el PDF se arma igual', async () => {
    // El `console.error` de cada foto omitida queda, pero acá es ruido esperado.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('location', { href: 'https://h/recetario/' });
    vi.stubGlobal('fetch', async (u: string) =>
      (u.startsWith('https://x/') ? { ok: false, status: 403 } : { ok: true }));
    const { generar } = await import('../src/pdf/generar.js');
    const blob = await generar(CON_FOTOS, 'Pescados', {
      imagenDe: async () => { throw new Error('sin token'); },
      achicar: async (b: Blob) => b
    });
    expect(blob.type).toBe('application/pdf');
    expect(JSON.stringify(llamadas.createPdf[0])).not.toContain('data:image');
  });
});
