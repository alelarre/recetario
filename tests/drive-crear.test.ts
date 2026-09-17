import { describe, it, expect, beforeEach, vi } from 'vitest';
import { crearDrive } from '../src/drive.js';
import type { Drive } from '../src/drive.js';

describe('drive.crear()', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let drive: Drive;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    drive = crearDrive(() => Promise.resolve('token-test'));
  });

  it('crea un tipo nativo de Google sin cuerpo multipart', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({ id: 'new-id', name: '_indice', modifiedTime: '2026-01-01T00:00:00Z' })
    });

    const resultado = await drive.crear({
      nombre: '_indice',
      padre: 'root-id',
      mime: 'application/vnd.google-apps.spreadsheet'
    });

    expect(fetchMock).toHaveBeenCalled();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('www.googleapis.com/drive/v3/files');
    expect(url).not.toContain('/upload/');
    expect(url).not.toContain('uploadType');
    expect(typeof options.body).toBe('string');
    const body = JSON.parse(options.body);
    expect(body.name).toBe('_indice');
    expect(body.mimeType).toBe('application/vnd.google-apps.spreadsheet');
    expect(body.parents).toEqual(['root-id']);
    expect(resultado.id).toBe('new-id');
    expect(resultado.name).toBe('_indice');
    expect(resultado.modifiedTime).toBe('2026-01-01T00:00:00Z');
  });

  it('crea un archivo .md con subida multipart', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({ id: 'file-id', name: 'receta.md', modifiedTime: '2026-01-01T00:00:00Z' })
    });

    const contenido = '---\ntitulo: Milanesas\n---\n\n## Preparación\n';
    const resultado = await drive.crear({
      nombre: 'receta.md',
      contenido,
      padre: 'carpeta-id',
      mime: 'text/markdown'
    });

    expect(fetchMock).toHaveBeenCalled();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/upload/drive/v3/files');
    expect(url).toContain('uploadType=multipart');
    expect(options.body instanceof FormData).toBe(true);
    expect(resultado.id).toBe('file-id');
    expect(resultado.name).toBe('receta.md');
    expect(resultado.modifiedTime).toBe('2026-01-01T00:00:00Z');
  });

  it('crea una carpeta (tipo nativo) sin multipart', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({ id: 'folder-id', name: 'Postres', modifiedTime: '2026-01-01T00:00:00Z' })
    });

    const resultado = await drive.crear({
      nombre: 'Postres',
      padre: 'root-id',
      mime: 'application/vnd.google-apps.folder'
    });

    expect(fetchMock).toHaveBeenCalled();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).not.toContain('/upload/');
    expect(url).not.toContain('uploadType');
    expect(typeof options.body).toBe('string');
    const body = JSON.parse(options.body);
    expect(body.mimeType).toBe('application/vnd.google-apps.folder');
    expect(body.parents).toEqual(['root-id']);
    expect(resultado.id).toBe('folder-id');
  });
});
