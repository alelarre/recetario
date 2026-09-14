import { describe, it, expect, beforeEach, vi } from 'vitest';
import { crearDrive } from '../src/drive.js';
import type { Drive } from '../src/drive.js';

describe('propiedades de carpeta en Drive', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let drive: Drive;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({ files: [] })
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    drive = crearDrive(() => Promise.resolve('token-test'));
  });

  it('propiedades escribe appProperties con PATCH', async () => {
    await drive.propiedades('c1', { color: 'pastas', foto: 'catalogo:pastas' });
    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/drive/v3/files/c1');
    expect(opciones.method).toBe('PATCH');
    expect(JSON.parse(String(opciones.body))).toEqual({ appProperties: { color: 'pastas', foto: 'catalogo:pastas' } });
  });

  it('listarCarpetas pide las propiedades junto con el nombre', async () => {
    await drive.listarCarpetas('raiz');
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(decodeURIComponent(url)).toContain('files(id,name,appProperties)');
  });
});
