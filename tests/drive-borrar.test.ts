import { describe, it, expect, beforeEach, vi } from 'vitest';
import { crearDrive } from '../src/drive.js';
import type { Drive } from '../src/drive.js';

describe('drive.borrar()', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let drive: Drive;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({ id: 'f1', trashed: true })
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    drive = crearDrive(() => Promise.resolve('token-test'));
  });

  it('manda el archivo a la papelera: PATCH con trashed, no DELETE', async () => {
    // DELETE en la API v3 borra para siempre, sin pasar por la papelera, y
    // la papelera es la red de seguridad del usuario (E04).
    await drive.borrar('f1');
    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/drive/v3/files/f1');
    expect(opciones.method).toBe('PATCH');
    expect(JSON.parse(String(opciones.body))).toEqual({ trashed: true });
  });
});
