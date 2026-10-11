import { describe, it, expect, vi } from 'vitest';
import { crearControlEvento, CLAVE_EVENTO } from '../src/eventos-control.js';
import { estadoInicial } from '../src/eventos/estado.js';
import { localStorageFalso } from './dom-falso.js';
import type { Comunes, Dato, TipoDeEvento } from '../src/eventos/tipos.js';

const d = (valor: number): Dato => ({ valor, fuente: { nombre: 'F', url: 'https://f.com' } });
const COMUNES: Comunes = { factorChico: d(0.5), horas: 4 };
const PRUEBA: TipoDeEvento = {
  id: 'prueba', nombre: 'Prueba',
  datos: [
    { id: 'ocasion', nombre: 'Ocasión', tipo: 'opcion', porDefecto: 'a', opciones: [{ valor: 'a', texto: 'A' }, { valor: 'c', texto: 'C' }] },
    { id: 'sobras', nombre: 'Sobras', tipo: 'si-no', porDefecto: false }
  ],
  grupos: [{ id: 'g', titulo: 'G', seReparte: true }],
  cosas: [{ id: 'x', nombre: 'X', grupo: 'g', prendida: true, porcion: () => d(1), unidad: 'unidad' }],
  ademas: [{ ademas: { id: 'hielo', nombre: 'Hielo', datos: [{ id: 'kg', nombre: 'Kg', tipo: 'numero', porDefecto: null }], calcular: () => ({ items: [], usados: [] }) }, prendido: true }]
};
const OTRO: TipoDeEvento = { ...PRUEBA, id: 'otro', nombre: 'Otro' };
const TIPOS = [PRUEBA, OTRO];

const boton = (accion: string, datos: Record<string, string>) => ({ dataset: { accion, ...datos } }) as unknown as HTMLElement;
const campo = (datos: Record<string, string>, value: string) => ({ dataset: datos, value }) as unknown as HTMLInputElement;

function armar(almacen: Pick<Storage, 'getItem' | 'setItem'> | null = localStorageFalso()) {
  const redibujar = vi.fn();
  const pintarResultado = vi.fn();
  const control = crearControlEvento({ almacen, tipos: TIPOS, comunes: COMUNES, redibujar, pintarResultado });
  const tocar = (accion: string, datos: Record<string, string> = {}) => control.acciones[accion]!(boton(accion, datos), new Event('click'));
  return { control, redibujar, pintarResultado, tocar, almacen };
}

describe('el control de Evento', () => {
  it('sin nada guardado, el estado inicial; con algo roto, también', () => {
    expect(armar().control.estado()).toEqual(estadoInicial(TIPOS, COMUNES));
    const almacen = localStorageFalso();
    almacen.setItem(CLAVE_EVENTO, '{roto');
    expect(armar(almacen).control.estado()).toEqual(estadoInicial(TIPOS, COMUNES));
  });

  it('escribir adultos, chicos u horas guarda y pinta sólo el resultado; con coma, vacío o algo que no es un número', () => {
    const { control, redibujar, pintarResultado, almacen } = armar();
    control.alCambiar(campo({ evento: 'adultos' }, '2,5'), false);
    control.alCambiar(campo({ evento: 'chicos' }, ''), false);
    control.alCambiar(campo({ evento: 'horas' }, 'abc'), false);
    expect([control.estado().adultos, control.estado().chicos, control.estado().horas]).toEqual([2.5, null, null]);
    expect(pintarResultado).toHaveBeenCalledTimes(3);
    expect(redibujar).not.toHaveBeenCalled();
    expect(JSON.parse(almacen!.getItem(CLAVE_EVENTO) ?? '{}').adultos).toBe(2.5);
  });

  it('elegir el tipo redibuja; cambiar de tipo y volver conserva lo de cada uno', () => {
    const { control, redibujar, tocar } = armar();
    tocar('evento-alternar', { evento: 'cosa', id: 'x', valor: '' });
    control.alCambiar(campo({ evento: 'tipo' }, 'otro'), true);
    control.alCambiar(campo({ evento: 'tipo' }, 'prueba'), true);
    expect(control.estado().porTipo['prueba']?.cosas['x']).toBe(false);
    expect(redibujar).toHaveBeenCalledTimes(3);
  });

  it('un dato del tipo: el desplegable redibuja; el sí o no, también', () => {
    const { control, redibujar, tocar } = armar();
    control.alCambiar(campo({ evento: 'dato', id: 'ocasion' }, 'c'), true);
    tocar('evento-alternar', { evento: 'dato', id: 'sobras', valor: '1' });
    expect(control.estado().porTipo['prueba']?.datos).toEqual({ ocasion: 'c', sobras: true });
    expect(redibujar).toHaveBeenCalledTimes(2);
  });

  it('un número de lo que se suma pinta sólo el resultado', () => {
    const { control, pintarResultado } = armar();
    control.alCambiar(campo({ evento: 'dato-ademas', ademas: 'hielo', id: 'kg' }, '3'), false);
    expect(control.estado().porTipo['prueba']?.ademas['hielo']?.datos['kg']).toBe(3);
    expect(pintarResultado).toHaveBeenCalledTimes(1);
  });

  it('el calor, lo que se suma y el margen redibujan', () => {
    const { control, redibujar, tocar } = armar();
    tocar('evento-alternar', { evento: 'calor', valor: '1' });
    tocar('evento-alternar', { evento: 'ademas', id: 'hielo', valor: '' });
    tocar('evento-margen', { valor: '20' });
    tocar('evento-margen', { valor: '15' });
    expect(control.estado().calor).toBe(true);
    expect(control.estado().porTipo['prueba']?.ademas['hielo']?.prendido).toBe(false);
    expect(control.estado().margen).toBe(20);
    expect(redibujar).toHaveBeenCalledTimes(3);
  });

  it('Empezar de nuevo vuelve todo al estado inicial y lo guarda', () => {
    const { control, tocar, almacen } = armar();
    control.alCambiar(campo({ evento: 'adultos' }, '8'), false);
    tocar('evento-reiniciar');
    expect(control.estado()).toEqual(estadoInicial(TIPOS, COMUNES));
    expect(JSON.parse(almacen!.getItem(CLAVE_EVENTO) ?? '{}').adultos).toBeNull();
  });

  it('sin almacenamiento, o con uno que falla, sigue andando', () => {
    const { control } = armar(null);
    control.alCambiar(campo({ evento: 'adultos' }, '4'), false);
    expect(control.estado().adultos).toBe(4);
    const roto = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); } };
    const conRoto = armar(roto).control;
    conRoto.alCambiar(campo({ evento: 'adultos' }, '4'), false);
    expect(conRoto.estado().adultos).toBe(4);
  });
});
