import { describe, it, expect } from 'vitest';
import { calcularEventoParaElAgente, listadoDeTipos } from '../mcp/eventos.js';
import { calcularEvento, textoEvento } from '../src/eventos/evento.js';
import type { Ademas, Comunes, Dato, EstadoEvento, TipoDeEvento } from '../src/eventos/tipos.js';

const d = (valor: number): Dato => ({ valor, fuente: { nombre: 'F', url: 'https://f.com' } });
const COMUNES: Comunes = { factorChico: d(0.5), horas: 4 };
const HIELO: Ademas = {
  id: 'hielo', nombre: 'Hielo', datos: [{ id: 'enfriar', nombre: 'Enfriar', tipo: 'si-no', porDefecto: false }],
  calcular: (_c, v) => ({ items: [{ id: 'hielo', nombre: 'Hielo', cantidad: v['enfriar'] === true ? 'mucho' : 'poco' }], usados: [] })
};
const ASADO: TipoDeEvento = {
  id: 'asado', nombre: 'Asado',
  datos: [
    { id: 'tipo-asado', nombre: 'Tipo de asado', tipo: 'opcion', porDefecto: 'clasico', opciones: [{ valor: 'clasico', texto: 'Clásico' }, { valor: 'mixto', texto: 'Mixto' }] },
    { id: 'ocasion', nombre: 'Ocasión', tipo: 'opcion', porDefecto: 'almuerzo', opciones: [{ valor: 'almuerzo', texto: 'Almuerzo' }, { valor: 'cena', texto: 'Cena' }] }
  ],
  grupos: [{ id: 'antes', titulo: 'Para picar antes', seReparte: true }, { id: 'carne', titulo: 'Carne', seReparte: true }],
  cosas: [
    { id: 'empanadas-antes', nombre: 'Empanadas', grupo: 'antes', prendida: false, porcion: () => d(2), unidad: 'unidad' },
    { id: 'empanadas-comer', nombre: 'Empanadas', grupo: 'carne', prendida: false, porcion: () => d(5), unidad: 'unidad' },
    { id: 'tira', nombre: 'Tira de asado', grupo: 'carne', prendida: false, porcion: () => d(500), unidad: 'g' },
    { id: 'pollo', nombre: 'Pollo', grupo: 'carne', prendida: false, porcion: () => d(400), unidad: 'g' }
  ],
  ademas: [{ ademas: HIELO, prendido: true }],
  atajo: { dato: 'tipo-asado', cosas: { clasico: ['tira'], mixto: ['tira', 'pollo'] } }
};
const TIPOS = [ASADO];

describe('calcular_evento', () => {
  it('sin tipo, la lista de tipos con sus datos, sus cosas y lo que se suma', () => {
    const r = calcularEventoParaElAgente({}, TIPOS, COMUNES);
    expect(r).toEqual({ tipos: listadoDeTipos(TIPOS) });
    expect(listadoDeTipos(TIPOS)[0]?.cosas[0]).toEqual({ id: 'empanadas-antes', nombre: 'Empanadas', grupo: 'Para picar antes', prendida: false });
  });

  it('con un tipo que no existe, la lista y el error', () => {
    const r = calcularEventoParaElAgente({ tipo: 'boda' }, TIPOS, COMUNES);
    expect('tipos' in r && 'error' in r).toBe(true);
  });

  it('con lo mínimo calcula igual que la app, por nombre y sin tildes', () => {
    const r = calcularEventoParaElAgente({ tipo: 'ASADO', adultos: 10 }, TIPOS, COMUNES);
    const e: EstadoEvento = { tipo: 'asado', adultos: 10, chicos: null, horas: 4, calor: false, margen: 0, porTipo: {} };
    const app = calcularEvento(e, TIPOS, COMUNES);
    expect(r).toEqual({ ...app, texto: textoEvento(app!) });
  });

  it('el tipo de asado prende lo suyo, y prender y apagar corrigen después', () => {
    const r = calcularEventoParaElAgente({ tipo: 'asado', adultos: 10, datos: { 'tipo-asado': 'Mixto' }, apagar: ['tira'] }, TIPOS, COMUNES);
    expect('grupos' in r && r.grupos.flatMap(g => g.items.map(i => i.id))).toEqual(['pollo']);
  });

  it('un nombre que está en dos grupos pide el id; con el id, va', () => {
    const doble = calcularEventoParaElAgente({ tipo: 'asado', adultos: 10, prender: ['empanadas'] }, TIPOS, COMUNES);
    expect('opciones' in doble && doble.opciones).toEqual(['empanadas-antes (Empanadas)', 'empanadas-comer (Empanadas)']);
    const r = calcularEventoParaElAgente({ tipo: 'asado', adultos: 10, prender: ['empanadas-antes'] }, TIPOS, COMUNES);
    expect('grupos' in r && r.grupos[0]?.titulo).toBe('Para picar antes');
  });

  it('una cosa que no existe, o una opción que no es, devuelve el error con las opciones', () => {
    expect(calcularEventoParaElAgente({ tipo: 'asado', adultos: 10, prender: ['lechón'] }, TIPOS, COMUNES)).toMatchObject({ error: 'No hay «lechón».' });
    expect(calcularEventoParaElAgente({ tipo: 'asado', adultos: 10, datos: { ocasion: 'merienda' } }, TIPOS, COMUNES))
      .toEqual({ error: '«merienda» no es una opción de «ocasion».', opciones: ['Almuerzo', 'Cena'] });
  });

  it('lo que se suma: false lo apaga; un objeto lo prende con sus datos', () => {
    const con = calcularEventoParaElAgente({ tipo: 'asado', adultos: 10, ademas: { hielo: { enfriar: true } } }, TIPOS, COMUNES);
    expect('ademas' in con && con.ademas).toEqual([{ id: 'hielo', nombre: 'Hielo', cantidad: 'mucho' }]);
    const sin = calcularEventoParaElAgente({ tipo: 'asado', adultos: 10, ademas: { hielo: false } }, TIPOS, COMUNES);
    expect('ademas' in sin && sin.ademas).toEqual([]);
  });

  it('sin personas, dice que no hay lista', () => {
    expect(calcularEventoParaElAgente({ tipo: 'asado' }, TIPOS, COMUNES)).toEqual({ vacio: 'Sin personas, o con todo apagado, no hay lista.' });
  });

  it('en la comida de la app, «empanadas» nombra a dos cosas y pide el id', () => {
    const r = calcularEventoParaElAgente({ tipo: 'comida', adultos: 4, prender: ['empanadas'] });
    expect('opciones' in r && r.opciones).toEqual(['empanadas-antes (Empanadas)', 'empanadas-comer (Empanadas)']);
  });

  it('con los tipos de la app, sin pasarlos, también calcula', () => {
    expect('titulo' in calcularEventoParaElAgente({ tipo: 'merienda', adultos: 10 })).toBe(true);
  });
});
