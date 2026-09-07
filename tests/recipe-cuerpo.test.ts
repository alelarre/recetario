import { describe, it, expect } from 'vitest';
import { parse, gruposDe, tramosDe, variacionesDe } from '../src/recipe.js';

const RECETA = `---
titulo: Milanesas napolitanas
---

Un clásico de los domingos.

## Ingredientes
### Para la milanesa
- 4 milanesas de nalga

### Para la salsa
- 1 lata de tomate triturado

## Preparación
1. Precalentar el horno.
2. Hornear 15 minutos.

## Variaciones
### A la suiza
Salsa blanca y gruyere.

## Notas
- Bajar a 180 °C.
`;

describe('parse — cuerpo', () => {
  it('separa la descripción de las secciones', () => {
    const r = parse(RECETA);
    expect(r.descripcion).toBe('Un clásico de los domingos.');
  });

  it('conserva las subsecciones ### dentro de su sección', () => {
    const r = parse(RECETA);
    expect(r.ingredientes).toContain('### Para la milanesa');
    expect(r.ingredientes).toContain('- 1 lata de tomate triturado');
    expect(r.ingredientes).not.toContain('## Preparación');
  });

  it('lee preparación, variaciones y notas', () => {
    const r = parse(RECETA);
    expect(r.preparacion).toContain('1. Precalentar el horno.');
    expect(r.variaciones).toContain('### A la suiza');
    expect(r.notas).toBe('- Bajar a 180 °C.');
  });

  it('reconoce los encabezados normalizando: sin tildes y en cualquier caja', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## INGREDIENTES\n- sal\n\n## preparacion\n1. Cocinar.\n`);
    expect(r.ingredientes).toBe('- sal');
    expect(r.preparacion).toBe('1. Cocinar.');
  });

  it('preserva las secciones desconocidas en otras, con su encabezado', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## Maridaje\nUn malbec joven.\n\n## Notas\n- ojo\n`);
    expect(r.otras).toEqual([{ encabezado: 'Maridaje', cuerpo: 'Un malbec joven.' }]);
    expect(r.notas).toBe('- ojo');
  });

  it('una receta sin ninguna sección deja todo vacío y no rompe', () => {
    const r = parse(`---\ntitulo: X\n---\n`);
    expect(r.descripcion).toBe('');
    expect(r.ingredientes).toBe('');
    expect(r.otras).toEqual([]);
  });

  it('acumula secciones duplicadas y avisa', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## Notas\nPrimera nota.\n\n## Ingredientes\n- sal\n\n## Notas\nSegunda nota.\n`);
    expect(r.notas).toBe('Primera nota.\n\nSegunda nota.');
    expect(r.avisos).toContain('seccion-duplicada');
  });

  it('una sección que aparece una sola vez no dispara aviso de duplicada', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## Notas\nUnica nota.\n`);
    expect(r.notas).toBe('Unica nota.');
    expect(r.avisos).not.toContain('seccion-duplicada');
  });
});

describe('gruposDe', () => {
  it('parte los ingredientes por los ### del archivo', () => {
    expect(gruposDe('### Para la milanesa\n- Nalga — 4\n### Para el melón\n- Melón — 1/2'))
      .toEqual([
        { nombre: 'Para la milanesa', items: [{ nombre: 'Nalga', cantidad: '4', crudo: '- Nalga — 4' }] },
        { nombre: 'Para el melón', items: [{ nombre: 'Melón', cantidad: '1/2', crudo: '- Melón — 1/2' }] }
      ]);
  });

  it('sin ### hay un solo grupo sin nombre', () => {
    const [grupo] = gruposDe('- Sal\n- Pimienta');
    expect(grupo?.nombre).toBe('');
    expect(grupo?.items).toHaveLength(2);
  });
});

describe('tramosDe', () => {
  it('parte la preparación por los ###, y la numeración vuelve a empezar', () => {
    const tramos = tramosDe('### Para la anchoa\n1. Descabezar.\n2. Lavar.\n### Final\n1. Servir.');
    expect(tramos).toEqual([
      { nombre: 'Para la anchoa', pasos: ['Descabezar.', 'Lavar.'] },
      { nombre: 'Final', pasos: ['Servir.'] }
    ]);
  });

  it('acepta pasos con bullets además de numerados', () => {
    expect(tramosDe('- Batir.\n- Hornear.')).toEqual([{ nombre: '', pasos: ['Batir.', 'Hornear.'] }]);
  });

  it('sin ### hay un solo tramo sin nombre', () => {
    expect(tramosDe('1. Precalentar.')).toEqual([{ nombre: '', pasos: ['Precalentar.'] }]);
  });
});

describe('variacionesDe', () => {
  it('una lista de bullets se devuelve como lista', () => {
    expect(variacionesDe('- Pasar por harina directamente, sin usar huevo.\n- Con panko.'))
      .toEqual({ lista: ['Pasar por harina directamente, sin usar huevo.', 'Con panko.'], secciones: [] });
  });

  it('los ### son variaciones con nombre, y la itálica del principio es su fuente', () => {
    expect(variacionesDe('### A la suiza\n*fuente: Libro de cocina*\n\nCambiar la salsa.'))
      .toEqual({
        lista: [],
        secciones: [{ nombre: 'A la suiza', fuente: 'Libro de cocina', cuerpo: 'Cambiar la salsa.' }]
      });
  });

  it('una sección sin fuente deja la fuente en null', () => {
    const { secciones } = variacionesDe('### Con panko\nUsar panko en vez de pan rallado.');
    expect(secciones[0]).toEqual({ nombre: 'Con panko', fuente: null, cuerpo: 'Usar panko en vez de pan rallado.' });
  });
});
