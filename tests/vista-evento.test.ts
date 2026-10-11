import { describe, it, expect } from 'vitest';
import { renderEvento, resultadoEvento } from '../src/ui/evento.js';
import { calcularEvento } from '../src/eventos/evento.js';
import { estadoInicial } from '../src/eventos/estado.js';
import { ICO } from '../src/ui/iconos.js';
import type { Ademas, Comunes, Dato, EstadoEvento, TipoDeEvento } from '../src/eventos/tipos.js';

const d = (valor: number): Dato => ({ valor, fuente: { nombre: 'La fuente', url: 'https://f.com' } });
const COMUNES: Comunes = { factorChico: d(0.5), horas: 4 };
const HIELO: Ademas = {
  id: 'hielo', nombre: 'Hielo', datos: [{ id: 'enfriar', nombre: 'También para enfriar', tipo: 'si-no', porDefecto: false }],
  calcular: () => ({ items: [{ id: 'hielo', nombre: 'Hielo', cantidad: '5 kg' }], usados: [] })
};
const PRUEBA: TipoDeEvento = {
  id: 'prueba', nombre: 'Prueba',
  datos: [{ id: 'ocasion', nombre: 'Ocasión', tipo: 'opcion', porDefecto: 'a', opciones: [{ valor: 'a', texto: 'Almuerzo' }, { valor: 'c', texto: 'Cena' }] }],
  grupos: [{ id: 'antes', titulo: 'Para picar antes', seReparte: true }, { id: 'comer', titulo: 'Para comer', seReparte: true }],
  cosas: [
    { id: 'empanadas-antes', nombre: 'Empanadas', grupo: 'antes', prendida: false, porcion: () => d(3), unidad: 'unidad' },
    { id: 'empanadas', nombre: 'Empanadas', grupo: 'comer', prendida: true, porcion: () => d(6), unidad: 'unidad' }
  ],
  ademas: [{ ademas: HIELO, prendido: false }]
};
const OTRO: TipoDeEvento = { ...PRUEBA, id: 'otro', nombre: 'Otro' };
const TIPOS = [PRUEBA, OTRO];
const con = (cambios: Partial<EstadoEvento>): EstadoEvento => ({ ...estadoInicial(TIPOS, COMUNES), ...cambios });

describe('la pantalla de Evento', () => {
  it('lleva el volver, el ícono, el título y Compartir', () => {
    const html = renderEvento(con({}), TIPOS, COMUNES);
    expect(html).toContain('data-accion="volver"');
    expect(html).toContain(`${ICO.invitados}Evento`);
    expect(html).toContain('data-accion="compartir-evento"');
  });

  it('el tipo en un desplegable, con el elegido marcado', () => {
    const html = renderEvento(con({ tipo: 'otro' }), TIPOS, COMUNES);
    expect(html).toContain('<select data-evento="tipo">');
    expect(html).toContain('<option value="otro" selected>Otro</option>');
  });

  it('adultos, chicos y horas son campos con lo escrito; vacío, vacíos', () => {
    const html = renderEvento(con({ adultos: 12, chicos: null }), TIPOS, COMUNES);
    expect(html).toContain('data-evento="adultos" value="12"');
    expect(html).toContain('data-evento="chicos" value=""');
    expect(html).toContain('data-evento="horas" value="4"');
  });

  it('el calor es un interruptor y el margen un conmutador con el elegido apretado', () => {
    const html = renderEvento(con({ calor: true, margen: 10 }), TIPOS, COMUNES);
    expect(html).toMatch(/role="switch" aria-checked="true" data-accion="evento-alternar" data-evento="calor" data-valor=""/);
    expect(html).toContain('data-accion="evento-margen" data-valor="10" aria-pressed="true"');
    expect(html).toContain('data-valor="0" aria-pressed="false">Sin margen');
  });

  it('los datos del tipo, con lo elegido', () => {
    expect(renderEvento(con({}), TIPOS, COMUNES)).toContain('<select data-evento="dato" data-id="ocasion">');
  });

  it('una ficha por grupo, con su título, y la misma cosa en dos grupos se distingue por el título', () => {
    const html = renderEvento(con({}), TIPOS, COMUNES);
    const antes = html.indexOf('<h2>Para picar antes</h2>');
    const comer = html.indexOf('<h2>Para comer</h2>');
    expect(antes).toBeGreaterThan(0);
    expect(comer).toBeGreaterThan(antes);
    expect(html).toContain('aria-checked="false" data-accion="evento-alternar" data-evento="cosa" data-id="empanadas-antes" data-valor="1"');
    expect(html).toContain('aria-checked="true" data-accion="evento-alternar" data-evento="cosa" data-id="empanadas" data-valor=""');
  });

  it('lo que se suma después: apagado, sólo su interruptor; prendido, sus datos debajo', () => {
    const apagado = renderEvento(con({}), TIPOS, COMUNES);
    expect(apagado).toContain('<h2>Además</h2>');
    expect(apagado).toContain('data-evento="ademas" data-id="hielo" data-valor="1"');
    expect(apagado).not.toContain('data-ademas="hielo"');
    const prendido = renderEvento(con({ porTipo: { prueba: { datos: {}, cosas: {}, ademas: { hielo: { prendido: true, datos: {} } } } } }), TIPOS, COMUNES);
    expect(prendido).toContain('data-evento="dato-ademas" data-ademas="hielo" data-id="enfriar"');
  });

  it('el resultado al pie, con la cuenta de la app; sin personas, la línea que lo pide', () => {
    const e = con({ adultos: 10 });
    const r = calcularEvento(e, TIPOS, COMUNES);
    expect(renderEvento(e, TIPOS, COMUNES)).toContain(resultadoEvento(r));
    expect(resultadoEvento(null)).toContain('Escribí cuántos son y prendé lo que va a haber.');
    expect(resultadoEvento(null)).toContain('data-resultado');
  });

  it('el resultado: cifras, grupos con sus ítems, lo que se suma, advertencias y fuentes', () => {
    const html = resultadoEvento({
      titulo: 'Prueba para 10', cifras: [{ nombre: 'Personas', valor: '10' }],
      grupos: [{ titulo: 'Para comer', items: [{ id: 'e', nombre: 'Empanadas', cantidad: '60' }] }],
      ademas: [{ id: 'hielo', nombre: 'Hielo', cantidad: '5 kg' }],
      advertencias: ['Un supuesto.'], fuentes: [{ nombre: 'La fuente', url: 'https://f.com' }]
    });
    expect(html).toContain('<span class="v">10</span><span class="n">Personas</span>');
    expect(html).toContain('<div class="grupo">Para comer</div>');
    expect(html).toContain('<span class="n">Empanadas</span><span class="c">60</span>');
    expect(html).toContain('<div class="grupo">Además</div>');
    expect(html).toContain('<li>Un supuesto.</li>');
    expect(html).toContain('href="https://f.com"');
  });

  it('Empezar de nuevo, al final', () => {
    expect(renderEvento(con({}), TIPOS, COMUNES)).toContain('data-accion="evento-reiniciar">Empezar de nuevo</button>');
  });

  it('con la ficha de compartir abierta, la dibuja', () => {
    expect(renderEvento(con({}), TIPOS, COMUNES, { paso: 'opciones', solo: 'texto' })).toContain('class="hoja-compartir"');
  });
});
