import { describe, it, expect, vi, afterEach } from 'vitest';
import { parse } from '../src/recipe.js';

const llamadas = vi.hoisted(() => ({ setFonts: [] as unknown[], createPdf: [] as unknown[] }));
vi.mock('pdfmake/build/pdfmake', () => ({
  default: {
    setFonts: (f: unknown) => { llamadas.setFonts.push(f); },
    createPdf: (d: unknown) => { llamadas.createPdf.push(d); return { getBlob: async () => new Blob(['%PDF'], { type: 'application/pdf' }) }; }
  }
}));

describe('generar el PDF', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); llamadas.setFonts = []; llamadas.createPdf = []; });

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
    const blob = await generar(parse('---\ntitulo: Rabas\n---\n'), 'Pescados');
    expect(blob.type).toBe('application/pdf');
    expect(JSON.stringify(llamadas.createPdf[0])).toContain('Rabas');
  });
});
