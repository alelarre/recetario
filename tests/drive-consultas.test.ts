import { describe, it, expect } from 'vitest';
import { q } from '../src/drive.js';
import { invalido } from './aserciones.js';

describe('q', () => {
  it('arma la consulta de hijos excluyendo la papelera', () => {
    expect(q.hijosDe('c1')).toBe("'c1' in parents and trashed=false");
  });

  it('arma la consulta por nombre dentro de un padre', () => {
    expect(q.porNombre('_indice', 'raiz')).toBe("name='_indice' and 'raiz' in parents and trashed=false");
  });

  it('arma la consulta por nombre sin padre', () => {
    expect(q.porNombre('Recetario')).toBe("name='Recetario' and trashed=false");
  });

  it('escapa las comillas simples del nombre', () => {
    expect(q.porNombre("Ají de gallina's")).toContain("\\'");
  });

  it('filtra solo carpetas cuando se lo piden', () => {
    expect(q.carpetasDe('c1')).toBe("'c1' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false");
  });

  it('defiende q.hijosDe contra null', () => {
    expect(() => q.hijosDe(invalido(null))).not.toThrow();
    expect(q.hijosDe(invalido(null))).toBe("'' in parents and trashed=false");
  });

  it('defiende q.porNombre contra undefined', () => {
    expect(() => q.porNombre(invalido(undefined))).not.toThrow();
    expect(q.porNombre(invalido(undefined))).toBe("name='' and trashed=false");
  });

  it('defiende q.porNombre contra undefined como padre', () => {
    expect(() => q.porNombre('algo', undefined)).not.toThrow();
    expect(q.porNombre('algo', undefined)).toBe("name='algo' and trashed=false");
  });
});
