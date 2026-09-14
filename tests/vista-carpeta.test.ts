import { describe, it, expect } from 'vitest';
import { renderSelector } from '../src/ui/carpeta.js';
import type { OpcionesSelector } from '../src/ui/carpeta.js';

const base: OpcionesSelector = {
  sugerencias: [], nivel: { id: 'root', nombre: '' }, carpetas: [],
  confirmando: null, creando: false, cambiando: false
};

describe('el selector de carpeta', () => {
  it('dice qué hay que hacer y vuelve', () => {
    const html = renderSelector(base);
    expect(html).toContain('Elegí la carpeta de tus recetas');
    expect(html).toContain('data-accion="volver"');
  });

  it('las sugerencias van arriba y se eligen directo', () => {
    const html = renderSelector({ ...base, sugerencias: [{ id: 'r1', nombre: 'Recetario' }] });
    expect(html).toContain('Encontradas');
    expect(html).toContain('data-accion="carpeta-sugerida" data-id="r1" data-nombre="Recetario"');
  });

  it('sin sugerencias no hay sección', () => {
    expect(renderSelector(base)).not.toContain('Encontradas');
  });

  it('cada carpeta del nivel lleva a su nivel', () => {
    const html = renderSelector({ ...base, carpetas: [{ id: 'a1', nombre: 'Cocina y más' }] });
    expect(html).toContain('href="#/carpeta?id=a1&amp;nombre=Cocina%20y%20m%C3%A1s"');
  });

  it('en Mi unidad no se ofrece usarla; adentro sí, con su nombre en el rótulo', () => {
    expect(renderSelector(base)).not.toContain('data-accion="carpeta-usar"');
    expect(renderSelector(base)).toContain('Mi unidad');
    const adentro = renderSelector({ ...base, nivel: { id: 'a1', nombre: 'Cocina' } });
    expect(adentro).toContain('data-accion="carpeta-usar"');
    expect(adentro).toContain('Mi unidad › Cocina');
  });

  it('crear una carpeta nueva despliega el nombre precargado', () => {
    const html = renderSelector({ ...base, creando: true });
    expect(html).toContain('name="nombre-carpeta"');
    expect(html).toContain('value="Recetario"');
    expect(html).toContain('data-accion="carpeta-crear-confirmado"');
  });

  it('cargando, spinner; vacío, lo dice; con error, reintentar', () => {
    expect(renderSelector({ ...base, carpetas: null })).toContain('class="spin"');
    expect(renderSelector(base)).toContain('No hay carpetas acá.');
    expect(renderSelector({ ...base, error: 'No se pudieron leer las carpetas.' })).toContain('data-accion="reintentar"');
  });

  it('la confirmación nombra la carpeta y reemplaza los botones', () => {
    const html = renderSelector({ ...base, nivel: { id: 'a1', nombre: 'Cocina' }, confirmando: { id: 'a1', nombre: 'Cocina' } });
    expect(html).toContain('Voy a usar <b>Cocina</b>.');
    expect(html).toContain('data-accion="carpeta-confirmar"');
    expect(html).not.toContain('data-accion="carpeta-usar"');
    expect(html).not.toContain('Tu carpeta actual');
  });

  it('al cambiar de carpeta, la confirmación dice que la actual queda', () => {
    const html = renderSelector({ ...base, cambiando: true, confirmando: { id: 'a1', nombre: 'Cocina' } });
    expect(html).toContain('Tu carpeta actual queda como está en Drive.');
  });
});
