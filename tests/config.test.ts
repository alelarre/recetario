import { describe, it, expect } from 'vitest';
import { CLIENT_ID, SCOPE, NOMBRE_RAIZ, NOMBRE_INDICE, SCHEMA_VERSION } from '../src/config.js';

describe('config', () => {
  it('usa el scope amplio de Drive, no drive.file', () => {
    expect(SCOPE).toBe('https://www.googleapis.com/auth/drive');
  });

  it('no hardcodea ids de Drive, solo nombres', () => {
    expect(NOMBRE_RAIZ).toBe('Recetario');
    expect(NOMBRE_INDICE).toBe('_indice');
  });

  it('tiene un client ID de Google', () => {
    expect(CLIENT_ID).toMatch(/\.apps\.googleusercontent\.com$/);
  });

  it('declara una versión de esquema entera', () => {
    expect(Number.isInteger(SCHEMA_VERSION)).toBe(true);
  });
});
