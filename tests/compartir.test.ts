import { describe, it, expect } from 'vitest';
import { compartirPdf, compartirLink, compartirTexto } from '../src/compartir.js';
import type { Plataforma } from '../src/compartir.js';

const error = (name: string) => Object.assign(new Error(name), { name });
const pdf = new File(['%PDF'], 'rabas.pdf', { type: 'application/pdf' });

function plataforma(opciones: { share?: 'ok' | 'AbortError' | 'NotAllowedError' | 'otro'; canShare?: boolean; copiar?: boolean } = {}) {
  const registro = { compartido: [] as ShareData[], copiado: [] as string[], descargado: [] as string[] };
  const p: Plataforma = {
    ...(opciones.share ? { share: async (d: ShareData) => {
      registro.compartido.push(d);
      if (opciones.share === 'otro') throw new Error('raro');
      if (opciones.share !== 'ok') throw error(opciones.share!);
    } } : {}),
    ...(opciones.canShare !== undefined ? { canShare: () => opciones.canShare! } : {}),
    ...(opciones.copiar ? { copiar: async (t: string) => { registro.copiado.push(t); } } : {}),
    descargar: (f: File) => { registro.descargado.push(f.name); }
  };
  return { p, registro };
}

describe('compartir el PDF', () => {
  it('con share de archivos, lo comparte con el título', async () => {
    const { p, registro } = plataforma({ share: 'ok', canShare: true });
    expect(await compartirPdf(p, pdf)).toBe('compartido');
    expect(registro.compartido[0]?.files?.[0]?.name).toBe('rabas.pdf');
    expect(registro.compartido[0]?.title).toBe('rabas');
  });
  it('cancelar el menú es cancelado', async () => {
    expect(await compartirPdf(plataforma({ share: 'AbortError', canShare: true }).p, pdf)).toBe('cancelado');
  });
  it('sin la activación del toque es sin-activacion', async () => {
    expect(await compartirPdf(plataforma({ share: 'NotAllowedError', canShare: true }).p, pdf)).toBe('sin-activacion');
  });
  it('sin canShare de archivos, se descarga', async () => {
    const { p, registro } = plataforma({ share: 'ok', canShare: false });
    expect(await compartirPdf(p, pdf)).toBe('descargado');
    expect(registro.descargado).toEqual(['rabas.pdf']);
    expect(registro.compartido).toEqual([]);
  });
  it('sin share, se descarga', async () => {
    expect(await compartirPdf(plataforma().p, pdf)).toBe('descargado');
  });
  it('otro error se propaga', async () => {
    await expect(compartirPdf(plataforma({ share: 'otro', canShare: true }).p, pdf)).rejects.toThrow('raro');
  });
});

describe('compartir link y texto', () => {
  it('el link va con título y url', async () => {
    const { p, registro } = plataforma({ share: 'ok' });
    expect(await compartirLink(p, 'Rabas', 'https://h/#/ver?r=1a')).toBe('compartido');
    expect(registro.compartido[0]).toEqual({ title: 'Rabas', url: 'https://h/#/ver?r=1a' });
  });
  it('el texto va solo, sin title', async () => {
    const { p, registro } = plataforma({ share: 'ok' });
    expect(await compartirTexto(p, 'Rabas\n…')).toBe('compartido');
    expect(registro.compartido[0]).toEqual({ text: 'Rabas\n…' });
  });
  it('sin share se copia', async () => {
    const { p, registro } = plataforma({ copiar: true });
    expect(await compartirTexto(p, 'hola')).toBe('copiado');
    expect(registro.copiado).toEqual(['hola']);
  });
  it('sin share ni portapapeles es sin-portapapeles', async () => {
    expect(await compartirLink(plataforma().p, 'A', 'https://h')).toBe('sin-portapapeles');
  });
  it('cancelar no copia', async () => {
    const { p, registro } = plataforma({ share: 'AbortError', copiar: true });
    expect(await compartirTexto(p, 'hola')).toBe('cancelado');
    expect(registro.copiado).toEqual([]);
  });
  it('sin activación, cae al portapapeles', async () => {
    const { p, registro } = plataforma({ share: 'NotAllowedError', copiar: true });
    expect(await compartirTexto(p, 'hola')).toBe('copiado');
    expect(registro.copiado).toEqual(['hola']);
  });
});
