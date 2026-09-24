import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  compartirPdf, compartirLink, compartirTexto, enviarAlAgente, leerPortapapeles, LARGO_MAXIMO_DEL_LINK,
  plataformaDelNavegador
} from '../src/compartir.js';
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

describe('enviar el pedido al agente', () => {
  const base = { descargar: () => {} };

  it('con el menú Compartir, lo comparte como texto', async () => {
    const compartidos: ShareData[] = [];
    const r = await enviarAlAgente({ ...base, share: async d => { compartidos.push(d); } }, 'pedido');
    expect(r).toBe('compartido');
    expect(compartidos).toEqual([{ text: 'pedido' }]);
  });

  it('sin menú Compartir y con un pedido corto, abre claude.ai con el pedido cargado', async () => {
    const abiertos: string[] = [];
    const r = await enviarAlAgente({ ...base, abrir: u => abiertos.push(u) > 0 }, 'hola mundo');
    expect(r).toBe('abierto');
    expect(abiertos).toEqual(['https://claude.ai/new?q=hola%20mundo']);
  });

  it('con un pedido que no entra en el link, lo copia y abre claude.ai vacío', async () => {
    const abiertos: string[] = [];
    const copiados: string[] = [];
    const largo = 'x'.repeat(LARGO_MAXIMO_DEL_LINK);
    const r = await enviarAlAgente({ ...base, abrir: u => abiertos.push(u) > 0, copiar: async t => { copiados.push(t); } }, largo);
    expect(r).toBe('copiado');
    expect(copiados).toEqual([largo]);
    expect(abiertos).toEqual(['https://claude.ai/new']);
  });

  it('si cancela el menú Compartir, no abre nada más', async () => {
    const abiertos: string[] = [];
    const abortar = async () => { throw Object.assign(new Error('x'), { name: 'AbortError' }); };
    expect(await enviarAlAgente({ ...base, share: abortar, abrir: u => abiertos.push(u) > 0 }, 'p')).toBe('cancelado');
    expect(abiertos).toEqual([]);
  });
});

describe('el pedido al agente con fotos', () => {
  const foto = (n: number) => new File(['jpeg'], `foto-${n}.jpg`, { type: 'image/jpeg' });
  const base: Plataforma = { descargar: () => {} };

  it('con canShare de archivos, viajan el texto y las fotos', async () => {
    const compartidos: ShareData[] = [];
    const r = await enviarAlAgente(
      { ...base, share: async d => { compartidos.push(d); }, canShare: d => !!d.files?.length },
      'pedido', { archivos: [foto(1), foto(2)], conLinks: 'pedido con links' });
    expect(r).toBe('compartido');
    expect(compartidos[0]?.text).toBe('pedido');
    expect(compartidos[0]?.files?.map(f => f.name)).toEqual(['foto-1.jpg', 'foto-2.jpg']);
  });

  it('sin canShare de archivos, el link al agente lleva el pedido con los links de Drive', async () => {
    const abiertos: string[] = [];
    const compartidos: ShareData[] = [];
    const r = await enviarAlAgente(
      { ...base, share: async d => { compartidos.push(d); }, canShare: () => false, abrir: u => abiertos.push(u) > 0 },
      'pedido', { archivos: [foto(1)], conLinks: 'pedido con links' });
    expect(r).toBe('abierto');
    expect(compartidos).toEqual([]);
    expect(abiertos).toEqual([`https://claude.ai/new?q=${encodeURIComponent('pedido con links')}`]);
  });

  it('sin menú Compartir, también', async () => {
    const abiertos: string[] = [];
    await enviarAlAgente({ ...base, abrir: u => abiertos.push(u) > 0 }, 'pedido', { archivos: [foto(1)], conLinks: 'con links' });
    expect(abiertos).toEqual([`https://claude.ai/new?q=${encodeURIComponent('con links')}`]);
  });

  it('si no se pudieron leer las fotos, van los links', async () => {
    const abiertos: string[] = [];
    await enviarAlAgente({ ...base, share: async () => {}, canShare: () => true, abrir: u => abiertos.push(u) > 0 },
      'pedido', { archivos: [], conLinks: 'con links' });
    expect(abiertos).toHaveLength(1);
  });

  it('si Chrome perdió el toque, cae a los links', async () => {
    const abiertos: string[] = [];
    const sinToque = async () => { throw Object.assign(new Error('x'), { name: 'NotAllowedError' }); };
    const r = await enviarAlAgente({ ...base, share: sinToque, canShare: () => true, abrir: u => abiertos.push(u) > 0 },
      'pedido', { archivos: [foto(1)], conLinks: 'con links' });
    expect(r).toBe('abierto');
    expect(abiertos[0]).toContain(encodeURIComponent('con links'));
  });
});

describe('el pedido al agente que no se pudo mandar', () => {
  const base: Plataforma = { descargar: () => {} };
  const sinToque = async () => { throw Object.assign(new Error('x'), { name: 'NotAllowedError' }); };

  it('si el navegador bloquea la ventana de claude.ai, no cuenta como abierto', async () => {
    expect(await enviarAlAgente({ ...base, abrir: () => false }, 'pedido')).toBe('sin-activacion');
  });

  it('sin activación para el menú Compartir ni para la ventana, tampoco', async () => {
    expect(await enviarAlAgente({ ...base, share: sinToque, abrir: () => false }, 'pedido')).toBe('sin-activacion');
  });

  it('sin forma de abrir nada, tampoco', async () => {
    expect(await enviarAlAgente(base, 'pedido')).toBe('sin-activacion');
  });
});

describe('abrir una ventana desde el navegador', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('dice si se abrió, y la ventana nueva no queda atada a la app', () => {
    const ventana = { opener: {} as unknown };
    const pedidas: unknown[][] = [];
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('window', { open: (...args: unknown[]) => { pedidas.push(args); return ventana; } });
    expect(plataformaDelNavegador().abrir?.('https://claude.ai/new')).toBe(true);
    expect(ventana.opener).toBeNull();
    // Con `noopener`, `window.open` devuelve null siempre, y no se podría saber
    // si el navegador la bloqueó.
    expect(pedidas[0]).toEqual(['https://claude.ai/new', '_blank']);
  });

  it('si el navegador la bloquea, dice que no', () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('window', { open: () => null });
    expect(plataformaDelNavegador().abrir?.('https://claude.ai/new')).toBe(false);
  });
});

describe('leer el portapapeles', () => {
  it('devuelve el texto, o null si no se puede', async () => {
    expect(await leerPortapapeles({ descargar: () => {}, leer: async () => 'hola' })).toBe('hola');
    expect(await leerPortapapeles({ descargar: () => {} })).toBeNull();
    expect(await leerPortapapeles({ descargar: () => {}, leer: async () => { throw new Error('no'); } })).toBeNull();
  });
});
