import { describe, it, expect, beforeEach, vi } from 'vitest';
import { crearDrive } from '../src/drive.js';

describe('drive.crear()', () => {
  let fetchMock;
  let drive;

  beforeEach(() => {
    // Mock global fetch
    fetchMock = vi.fn();
    global.fetch = fetchMock;

    // Crear drive con un token simple
    const obtenerToken = () => Promise.resolve('token-test');
    drive = crearDrive(obtenerToken);
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

    // Verificar que se llamó a fetch
    expect(fetchMock).toHaveBeenCalled();
    const [url, options] = fetchMock.mock.calls[0];

    // Verificar que usó el endpoint normal (sin /upload/)
    expect(url).toContain('www.googleapis.com/drive/v3/files');
    expect(url).not.toContain('/upload/');

    // Verificar que NO tiene uploadType
    expect(url).not.toContain('uploadType');

    // Verificar que el body es un JSON string de metadata (no multipart)
    expect(typeof options.body).toBe('string');
    const body = JSON.parse(options.body);
    expect(body.name).toBe('_indice');
    expect(body.mimeType).toBe('application/vnd.google-apps.spreadsheet');
    expect(body.parents).toEqual(['root-id']);

    // Verificar que retorna los campos correctos
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

    // Verificar que se llamó a fetch
    expect(fetchMock).toHaveBeenCalled();
    const [url, options] = fetchMock.mock.calls[0];

    // Verificar que usó el endpoint de subida (con /upload/)
    expect(url).toContain('/upload/drive/v3/files');

    // Verificar que tiene uploadType=multipart
    expect(url).toContain('uploadType=multipart');

    // Verificar que el body es FormData (multipart)
    expect(options.body instanceof FormData).toBe(true);

    // Verificar que retorna los campos correctos
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

    // Verificar que se llamó a fetch
    expect(fetchMock).toHaveBeenCalled();
    const [url, options] = fetchMock.mock.calls[0];

    // Verificar que usó el endpoint normal (no /upload/)
    expect(url).not.toContain('/upload/');
    expect(url).not.toContain('uploadType');

    // Verificar que el body es JSON string (no FormData)
    expect(typeof options.body).toBe('string');
    const body = JSON.parse(options.body);
    expect(body.mimeType).toBe('application/vnd.google-apps.folder');
    expect(body.parents).toEqual(['root-id']);

    // Verificar retorno
    expect(resultado.id).toBe('folder-id');
  });
});
