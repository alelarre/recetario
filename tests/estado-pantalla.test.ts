import { describe, it, expect } from 'vitest';
import { estadoNuevo, TRAMO } from '../src/estado-pantalla.js';

describe('estadoNuevo', () => {
  it('trae los valores con los que arranca cualquier pantalla', () => {
    expect(estadoNuevo()).toEqual({
      editorAbierto: null,
      salidaPendiente: null,
      compartidasPorLeer: 0,
      tagsActivos: [],
      duracionesActivas: [],
      orden: 'alfa',
      visibles: TRAMO,
      confirmandoReinicio: false,
      consultaPlan: '',
      categoriaPlan: null,
      selector: { confirmando: null, error: '' },
      visor: null,
      fotoPropia: null,
      compartiendo: null,
      pdfListo: null,
      marcandoFavorito: false,
      errorFavorito: '',
      avisoDeLlegada: '',
      pedidoPendiente: null
    });
  });

  it('cada estado es otro: lo que una pantalla cambia no pasa a la siguiente', () => {
    const anterior = estadoNuevo();
    anterior.tagsActivos.push('vegano');
    anterior.duracionesActivas.push('~15 min');
    anterior.selector.error = 'No se pudo crear la carpeta.';
    const nuevo = estadoNuevo();
    expect(nuevo.tagsActivos).toEqual([]);
    expect(nuevo.duracionesActivas).toEqual([]);
    expect(nuevo.selector.error).toBe('');
  });
});
