import { describe, it, expect } from 'vitest';
import { parsearHash, hashDeCompartido, rutaDeInvitado, esHashDeInvitado } from '../src/ui/router.js';

describe('parsearHash', () => {
  it('la raíz es el Recetario', () => {
    expect(parsearHash('#/')).toEqual({ vista: 'recetario', params: {} });
    expect(parsearHash('')).toEqual({ vista: 'recetario', params: {} });
  });

  it('categoría con el nombre decodificado', () => {
    expect(parsearHash('#/c/Panes%20y%20masas')).toEqual({ vista: 'categoria', params: { nombre: 'Panes y masas' } });
  });

  it('búsqueda con su query', () => {
    expect(parsearHash('#/buscar?q=milanesas')).toEqual({ vista: 'resultados', params: { q: 'milanesas' } });
  });

  it('detalle y edición de una receta', () => {
    expect(parsearHash('#/r/abc123')).toEqual({ vista: 'receta', params: { id: 'abc123' } });
    expect(parsearHash('#/r/abc123/editar')).toEqual({ vista: 'editar', params: { id: 'abc123' } });
  });

  it('la edición con una receta recibida aplicada', () => {
    expect(parsearHash('#/r/x/editar?recibida=1')).toEqual({ vista: 'editar', params: { id: 'x', recibida: '1' } });
  });

  it('alta de receta', () => {
    expect(parsearHash('#/nueva')).toEqual({ vista: 'nueva', params: {} });
  });

  it('alta con lo compartido: link, texto y cuántas fotos dejó el service worker', () => {
    expect(parsearHash('#/nueva?url=u&text=t&fotos=2'))
      .toEqual({ vista: 'nueva', params: { url: 'u', text: 't', fotos: '2' } });
    expect(parsearHash('#/nueva?text=hola')).toEqual({ vista: 'nueva', params: { text: 'hola' } });
  });

  it('alta con una receta recibida', () => {
    expect(parsearHash('#/nueva?recibida=1')).toEqual({ vista: 'nueva', params: { recibida: '1' } });
  });

  it('el parámetro borrador de la alta ya no existe', () => {
    expect(parsearHash('#/nueva?borrador=b1')).toEqual({ vista: 'nueva', params: {} });
  });

  it('las rutas de la captura y de la pregunta del borrador caen en el Recetario', () => {
    expect(parsearHash('#/capturar')).toEqual({ vista: 'recetario', params: {} });
    expect(parsearHash('#/capturar?url=u&text=t&fotos=1')).toEqual({ vista: 'recetario', params: {} });
    expect(parsearHash('#/recibida')).toEqual({ vista: 'recetario', params: {} });
  });

  it('una ruta desconocida cae en el Recetario en vez de romper', () => {
    expect(parsearHash('#/cualquiera/cosa')).toEqual({ vista: 'recetario', params: {} });
    expect(parsearHash('#/no-existe')).toEqual({ vista: 'recetario', params: {} });
  });

  it('la gestión de categorías', () => {
    expect(parsearHash('#/categorias')).toEqual({ vista: 'categorias', params: {} });
    expect(parsearHash('#/categorias/nueva')).toEqual({ vista: 'editar-categoria', params: { id: 'nueva' } });
    expect(parsearHash('#/categorias/c1')).toEqual({ vista: 'editar-categoria', params: { id: 'c1' } });
  });

  it('#/t/<tag> es la lista por tag, y el nombre viene decodificado', () => {
    expect(parsearHash('#/t/menú%20diario')).toEqual({ vista: 'tag', params: { nombre: 'menú diario' } });
  });

  it('las tres pantallas del plan de la semana', () => {
    expect(parsearHash('#/plan')).toEqual({ vista: 'plan', params: {} });
    expect(parsearHash('#/plan/compras')).toEqual({ vista: 'plan-compras', params: {} });
    expect(parsearHash('#/plan/agregar?dia=1&momento=noche'))
      .toEqual({ vista: 'plan-agregar', params: { dia: '1', momento: 'noche' } });
  });

  it('agregar sin día ni momento cae en el plan: no hay comida a la que sumar', () => {
    expect(parsearHash('#/plan/agregar')).toEqual({ vista: 'plan', params: {} });
    expect(parsearHash('#/plan/agregar?dia=9&momento=noche')).toEqual({ vista: 'plan', params: {} });
    expect(parsearHash('#/plan/agregar?dia=1&momento=merienda')).toEqual({ vista: 'plan', params: {} });
  });

  it('la carpeta base, y desde Ajustes con el cambio en la query', () => {
    expect(parsearHash('#/carpeta')).toEqual({ vista: 'carpeta', params: {} });
    expect(parsearHash('#/carpeta?cambiando=1')).toEqual({ vista: 'carpeta', params: { cambiando: '1' } });
  });

  it('reconoce las rutas nuevas', () => {
    expect(parsearHash('#/borradores')).toEqual({ vista: 'borradores', params: {} });
    // Un borrador ya no es una pantalla: su vieja ruta cae en la lista.
    expect(parsearHash('#/borradores/b1')).toEqual({ vista: 'borradores', params: {} });
    expect(parsearHash('#/ajustes')).toEqual({ vista: 'ajustes', params: {} });
    expect(parsearHash('#/r/f1/cocinar')).toEqual({ vista: 'cocinar', params: { id: 'f1' } });
  });

  describe('defensa de parámetros', () => {
    it('null, undefined, NaN y objetos devuelven el Recetario', () => {
      expect(parsearHash(null)).toEqual({ vista: 'recetario', params: {} });
      expect(parsearHash(undefined)).toEqual({ vista: 'recetario', params: {} });
      expect(parsearHash(42)).toEqual({ vista: 'recetario', params: {} });
      expect(parsearHash({})).toEqual({ vista: 'recetario', params: {} });
    });

    it('URL rota con escape inválido no rompe la app', () => {
      // decodeURIComponent lanza con %E0%A4%A, así que tenemos que manejarlo
      expect(parsearHash('#/c/%E0%A4%A')).toEqual({ vista: 'recetario', params: {} });
    });

    it('búsqueda sin query devuelve q vacío', () => {
      expect(parsearHash('#/buscar')).toEqual({ vista: 'resultados', params: { q: '' } });
    });

    it('la receta sin ID no es una receta', () => {
      expect(parsearHash('#/r')).toEqual({ vista: 'recetario', params: {} });
      expect(parsearHash('#/r/')).toEqual({ vista: 'recetario', params: {} });
    });

    it('categoría sin nombre no es categoría', () => {
      expect(parsearHash('#/c')).toEqual({ vista: 'recetario', params: {} });
      expect(parsearHash('#/c/')).toEqual({ vista: 'recetario', params: {} });
    });
  });
});

describe('lo compartido desde otra app (Share Target)', () => {
  it('Android manda los datos en la query, antes del #: pasan a la receta nueva', () => {
    expect(hashDeCompartido('?title=Pollo&text=Mir%C3%A1+esto&url=https%3A%2F%2Fx.com%2F1'))
      .toBe('#/nueva?url=https%3A%2F%2Fx.com%2F1&text=Mir%C3%A1+esto');
    expect(hashDeCompartido('?text=hola')).toBe('#/nueva?text=hola');
  });

  it('muchas apps mandan el link sólo en text', () => {
    const hash = hashDeCompartido('?text=https%3A%2F%2Finstagram.com%2Freel%2Fabc');
    expect(hash).toBe('#/nueva?text=https%3A%2F%2Finstagram.com%2Freel%2Fabc');
    expect(parsearHash(hash)).toEqual({ vista: 'nueva', params: { text: 'https://instagram.com/reel/abc' } });
  });

  it('sin url ni text no hay nada compartido', () => {
    expect(hashDeCompartido('')).toBeNull();
    expect(hashDeCompartido('?title=Solo+t%C3%ADtulo')).toBeNull();
    expect(hashDeCompartido('?url=&text=')).toBeNull();
  });
});

describe('rutaDeInvitado', () => {
  it('lectura y cocina, con la carga', () => {
    expect(rutaDeInvitado('#/ver?r=1abc')).toEqual({ vista: 'lectura', carga: '1abc' });
    expect(rutaDeInvitado('#/ver/cocinar?r=1abc')).toEqual({ vista: 'cocina', carga: '1abc' });
  });
  it('sin carga, la carga es vacía; otra cosa no es de invitado', () => {
    expect(rutaDeInvitado('#/ver')).toEqual({ vista: 'lectura', carga: '' });
    expect(rutaDeInvitado('#/r/f1')).toBeNull();
    expect(rutaDeInvitado('')).toBeNull();
    expect(esHashDeInvitado('#/ver?r=x')).toBe(true);
    expect(esHashDeInvitado('#/verduras')).toBe(false);
  });
});
