import { describe, it, expect } from 'vitest';
import { estadoNuevo } from '../src/estado-pantalla.js';
import { TRAMO } from '../src/lista-control.js';

describe('estadoNuevo', () => {
  it('trae los valores con los que arranca cualquier pantalla', () => {
    const { lista, ...resto } = estadoNuevo();
    expect(lista.tagsActivos).toEqual([]);
    expect(lista.visibles).toBe(TRAMO);
    expect(resto).toEqual({
      editorAbierto: null,
      salidaPendiente: null,
      compartidasPorLeer: 0,
      confirmandoReinicio: false,
      consultaPlan: '',
      categoriaPlan: null,
      selector: { confirmando: null, error: '' },
      fotoPropia: null,
      compartiendo: null,
      pdfListo: null,
      marcandoFavorito: false,
      errorFavorito: '',
      errorReindexado: false,
      avisoDeLlegada: '',
      pedidoPendiente: null
    });
  });

  it('cada estado es otro: lo que una pantalla cambia no pasa a la siguiente', () => {
    const anterior = estadoNuevo();
    anterior.lista.alternarTag('vegano');
    anterior.lista.alternarDuracion('~15 min');
    anterior.selector.error = 'No se pudo crear la carpeta.';
    const nuevo = estadoNuevo();
    expect(nuevo.lista.tagsActivos).toEqual([]);
    expect(nuevo.lista.duracionesActivas).toEqual([]);
    expect(nuevo.selector.error).toBe('');
  });
});
