// tests/herramientas-editor.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHerramientasDeLinea, HERRAMIENTAS_DE_LINEA } from '../src/ui/herramientas-editor.js';
import { crearHerramientasEditor } from '../src/herramientas-editor-control.js';
import { ICO } from '../src/ui/iconos.js';

const ctx = { seccion: 'preparacion', linea: 1, fotos: [{ n: 1, url: 'https://a.com/1.jpg' }], ruedas: { h: 0, m: 10, s: 0 } };

describe('la capa de herramientas', () => {
  it('Foto, Cuenta regresiva y Cronómetro, en ese orden, con su ícono', () => {
    expect(HERRAMIENTAS_DE_LINEA.map(h => h.id)).toEqual(['foto', 'cuenta', 'cronometro']);
    const html = renderHerramientasDeLinea(ctx);
    expect(html).toContain('Agregar en esta línea');
    expect(html.indexOf('Foto')).toBeLessThan(html.indexOf('Cuenta regresiva'));
    expect(html.indexOf('Cuenta regresiva')).toBeLessThan(html.indexOf('Cronómetro'));
    expect(html).toContain(ICO.relojMas);
    expect(html).toContain('data-accion="elegir-herramienta-linea" data-herramienta="cuenta" data-seccion="preparacion" data-linea="1"');
  });
  it('se cierra con el velo, como las otras fichas del editor', () => {
    expect(renderHerramientasDeLinea(ctx).startsWith('<div class="velo" data-accion="cerrar-ficha-foto">')).toBe(true);
  });
  it('sin fotos en el depósito, Foto va deshabilitada y dice por qué', () => {
    const html = renderHerramientasDeLinea({ ...ctx, fotos: [] });
    expect(html).toMatch(/data-herramienta="foto"[^>]*disabled/);
    expect(html).toContain('Primero agregá una foto en la ficha Fotos');
  });
  it('el paso de la cuenta: nombre vacío, ruedas y Poner', () => {
    const paso = HERRAMIENTAS_DE_LINEA.find(h => h.id === 'cuenta')!.paso(ctx);
    expect(paso).toContain('data-etiqueta-marca value=""');
    expect(paso).toContain('data-accion="marca-rueda-mas"');
    expect(paso).toContain('data-accion="poner-marca" data-tipo="cuenta" data-seccion="preparacion" data-linea="1"');
  });
  it('Poner va deshabilitado con las ruedas en cero', () => {
    const paso = HERRAMIENTAS_DE_LINEA.find(h => h.id === 'cuenta')!.paso({ ...ctx, ruedas: { h: 0, m: 0, s: 0 } });
    expect(paso).toMatch(/data-accion="poner-marca"[^>]*disabled/);
  });
  it('el paso del cronómetro: nombre y Poner, sin ruedas', () => {
    const paso = HERRAMIENTAS_DE_LINEA.find(h => h.id === 'cronometro')!.paso(ctx);
    expect(paso).toContain('data-etiqueta-marca');
    expect(paso).not.toContain('name="etiqueta-marca"');
    expect(paso).not.toContain('marca-rueda');
  });
});

describe('las acciones', () => {
  function armar(campo = 'Freír.\nCocinar 50 minutos.') {
    let valor = campo;
    const pantalla = { abrirFicha: vi.fn(), cerrarFicha: vi.fn(), etiquetaEscrita: vi.fn(() => 'cocinar'), pintarRuedas: vi.fn() };
    const campos = { leer: (n: string) => (n === 'preparacion' ? valor : null), escribir: (_: string, v: string) => { valor = v; } };
    const h = crearHerramientasEditor({ campos, fotos: () => [], pantalla });
    const tocar = (accion: string, dataset: Record<string, string>) => h.acciones[accion]!({ dataset } as unknown as HTMLElement, new Event('click'));
    return { pantalla, tocar, valor: () => valor };
  }
  it('abrir abre la capa con la sección y la línea del botón', () => {
    const { pantalla, tocar } = armar();
    tocar('abrir-herramientas-linea', { seccion: 'preparacion', linea: '1' });
    expect(pantalla.abrirFicha.mock.calls[0]?.[0]).toContain('Agregar en esta línea');
  });
  it('elegir Cuenta abre su paso con las ruedas en 0:10:00', () => {
    const { pantalla, tocar } = armar();
    tocar('elegir-herramienta-linea', { herramienta: 'cuenta', seccion: 'preparacion', linea: '1' });
    expect(pantalla.abrirFicha.mock.calls[0]?.[0]).toContain('data-rueda-marca="m">10<');
  });
  it('las ruedas giran y se pintan sin reabrir la ficha', () => {
    const { pantalla, tocar } = armar();
    tocar('elegir-herramienta-linea', { herramienta: 'cuenta', seccion: 'preparacion', linea: '1' });
    tocar('marca-rueda-mas', { rueda: 'm' });
    expect(pantalla.pintarRuedas).toHaveBeenLastCalledWith({ h: 0, m: 11, s: 0 });
    expect(pantalla.abrirFicha).toHaveBeenCalledOnce();
  });
  it('Poner escribe la marca vacía al final de la línea y cierra la capa', () => {
    const { pantalla, tocar, valor } = armar();
    tocar('elegir-herramienta-linea', { herramienta: 'cuenta', seccion: 'preparacion', linea: '1' });
    for (let i = 0; i < 40; i++) tocar('marca-rueda-mas', { rueda: 'm' });
    tocar('poner-marca', { tipo: 'cuenta', seccion: 'preparacion', linea: '1' });
    expect(valor()).toBe('Freír.\nCocinar 50 minutos. [](cuenta:50:00 "cocinar")');
    expect(pantalla.cerrarFicha).toHaveBeenCalled();
  });
  it('Poner un cronómetro sin etiqueta', () => {
    const { pantalla, tocar, valor } = armar();
    pantalla.etiquetaEscrita.mockReturnValue('');
    tocar('poner-marca', { tipo: 'cronometro', seccion: 'preparacion', linea: '0' });
    expect(valor()).toBe('Freír. [](cronometro:)\nCocinar 50 minutos.');
  });
  it('una cuenta en cero no se pone', () => {
    const { tocar, valor } = armar();
    tocar('elegir-herramienta-linea', { herramienta: 'cuenta', seccion: 'preparacion', linea: '1' });
    for (let i = 0; i < 10; i++) tocar('marca-rueda-menos', { rueda: 'm' });
    tocar('poner-marca', { tipo: 'cuenta', seccion: 'preparacion', linea: '1' });
    expect(valor()).toBe('Freír.\nCocinar 50 minutos.');
  });
});
