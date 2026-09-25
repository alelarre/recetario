import { describe, it, expect } from 'vitest';
import { renderSelector } from '../src/ui/carpeta.js';
import type { OpcionesSelector } from '../src/ui/carpeta.js';

const base: OpcionesSelector = {
  sugerencias: [], confirmando: null, cambiando: false, conPicker: true
};

describe('la pantalla de la carpeta base', () => {
  it('la primera vez explica y no deja volver: no hay a dónde', () => {
    const html = renderSelector(base);
    expect(html).toContain('Tus recetas en Drive');
    expect(html).toContain('una carpeta de tu Google Drive');
    expect(html).not.toContain('data-accion="volver"');
  });

  it('desde Ajustes es Cambiar carpeta, con volver y la aclaración', () => {
    const html = renderSelector({ ...base, cambiando: true });
    expect(html).toContain('Cambiar carpeta');
    expect(html).toContain('data-accion="volver"');
    expect(html).toContain('La carpeta actual queda como está en Drive.');
  });

  it('las dos opciones: crear en Mi unidad, o elegir una que ya existe', () => {
    const html = renderSelector(base);
    expect(html).toContain('Crear la carpeta «Recetario» en Mi unidad');
    expect(html).toContain('data-accion="carpeta-crear"');
    expect(html).toContain('Ya tengo una carpeta');
    expect(html).toContain('data-accion="carpeta-elegir"');
  });

  it('sin API key no se ofrece el Picker: queda sólo crear', () => {
    const html = renderSelector({ ...base, conPicker: false });
    expect(html).not.toContain('Ya tengo una carpeta');
    expect(html).not.toContain('data-accion="carpeta-elegir"');
    expect(html).toContain('data-accion="carpeta-crear"');
  });

  it('no lista nada del Drive: sólo lo que la app ya sabe que le pertenece', () => {
    expect(renderSelector(base)).not.toContain('Mi unidad</div>');
    expect(renderSelector(base)).not.toContain('#/carpeta?id=');
  });

  it('las encontradas van arriba, cada una con su Usar', () => {
    const html = renderSelector({ ...base, sugerencias: [{ id: 'r1', nombre: 'Recetario' }] });
    expect(html).toContain('Encontradas');
    expect(html).toContain('data-accion="carpeta-sugerida" data-id="r1" data-nombre="Recetario"');
    expect(html).toContain('>Usar</button>');
  });

  it('sin encontradas no hay sección', () => {
    expect(renderSelector(base)).not.toContain('Encontradas');
  });

  it('la confirmación nombra la carpeta y reemplaza los botones', () => {
    const html = renderSelector({ ...base, confirmando: { id: 'a1', nombre: 'Cocina' } });
    expect(html).toContain('Se va a usar <b>Cocina</b>. Las categorías que falten se crean, y después se indexa lo que haya adentro.');
    expect(html).toContain('data-accion="carpeta-confirmar"');
    expect(html).toContain('data-accion="carpeta-cancelar"');
    expect(html).not.toContain('data-accion="carpeta-crear"');
  });

  it('el error va en el lugar de los botones, con Reintentar', () => {
    const html = renderSelector({ ...base, error: 'No se pudo abrir el selector de Google.' });
    expect(html).toContain('No se pudo abrir el selector de Google.');
    expect(html).toContain('data-accion="reintentar"');
    expect(html).not.toContain('data-accion="carpeta-crear"');
  });
});
