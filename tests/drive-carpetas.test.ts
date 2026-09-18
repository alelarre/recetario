import { describe, it, expect, beforeEach, vi } from 'vitest';
import { crearDrive } from '../src/drive.js';
import type { Drive } from '../src/drive.js';

describe('las consultas de carpetas propias', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let drive: Drive;
  const consulta = (): string => decodeURIComponent(String(fetchMock.mock.calls[0]?.[0]));

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({ files: [] })
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    drive = crearDrive(() => Promise.resolve('token-test'));
  });

  it('las marcadas: por la propiedad de la app, propias, carpetas y fuera de la papelera', async () => {
    await drive.carpetasMarcadas();
    expect(consulta()).toContain("appProperties has { key='recetario' and value='raiz' }");
    expect(consulta()).toContain("'me' in owners");
    expect(consulta()).toContain("mimeType='application/vnd.google-apps.folder'");
    expect(consulta()).toContain('trashed=false');
  });

  it('por nombre: propias y carpetas', async () => {
    await drive.carpetasPropiasPorNombre('Recetario');
    expect(consulta()).toContain("name='Recetario'");
    expect(consulta()).toContain("'me' in owners");
  });

  it('quitar una propiedad es mandarla en null', async () => {
    await drive.propiedades('c1', { recetario: null });
    const [, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(opciones.body))).toEqual({ appProperties: { recetario: null } });
  });
});
