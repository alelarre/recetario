import { describe, it, expect, vi, afterEach } from 'vitest';
import { comoGlobal, limpiarGlobales } from './dom-falso.js';
import { parse } from '../src/recipe.js';
import { codificar } from '../src/link-receta.js';

const esperar = async (vueltas = 8) => { for (let i = 0; i < vueltas; i++) await new Promise(r => setTimeout(r, 0)); };

async function montar(hash: string) {
  const oyentes: Record<string, ((e: unknown) => unknown)[]> = {};
  const listeners: Record<string, () => void> = {};
  const app = {
    innerHTML: '',
    addEventListener: (ev: string, fn: (e: unknown) => unknown) => { (oyentes[ev] ??= []).push(fn); }
  };
  const reemplazos: string[] = [];
  const atras: number[] = [];
  const recargas: number[] = [];
  global.document = comoGlobal<Document>({
    title: '', visibilityState: 'visible',
    querySelector: (sel: string) => (sel === '#app' ? app : null),
    addEventListener: () => {}
  });
  global.window = comoGlobal<Window & typeof globalThis>({
    addEventListener: (ev: string, fn: () => void) => { listeners[ev] = fn; }, scrollTo: () => {}, scrollY: 0
  });
  global.location = comoGlobal<Location>({ hash, replace: (h: string) => { reemplazos.push(h); global.location.hash = h; },
    reload: () => { recargas.push(1); }
  });
  global.history = comoGlobal<History>({ back: () => { atras.push(1); } });

  const { iniciarInvitado } = await import('../src/invitado.js');
  iniciarInvitado();
  await esperar();
  return {
    app, reemplazos, atras, recargas,
    abrir: async (h: string) => { global.location.hash = h; listeners['hashchange']?.(); await esperar(); },
    tocar: async (accion: string, datos: Record<string, string> = {}) => {
      const boton = { dataset: { accion, ...datos } };
      for (const fn of oyentes['click'] ?? []) await fn({ target: { closest: () => boton } });
      await esperar();
    },
    deslizar: async (desde: number, hasta: number) => {
      for (const fn of oyentes['touchstart'] ?? []) await fn({ touches: [{ clientX: desde }] });
      for (const fn of oyentes['touchend'] ?? []) await fn({ changedTouches: [{ clientX: hasta }] });
      await esperar();
    }
  };
}

describe('el controlador del invitado', () => {
  afterEach(() => { limpiarGlobales(); vi.resetModules(); });

  const cargaDe = () => codificar(parse('---\ntitulo: Rabas\n---\n\n## Ingredientes\n- Calamar\n\n## Preparación\n1. Lavar.\n2. Freír.\n'), 'Pescados');

  it('dibuja la receta del link y pone su título a la pestaña', async () => {
    const carga = await cargaDe();
    const { app } = await montar(`#/ver?r=${carga}`);
    expect(app.innerHTML).toContain('class="rec-tit">Rabas<');
    expect(global.document.title).toBe('Rabas');
  });

  it('Cocinar lleva a la cocina del invitado, sin Salir; el chevron vuelve atrás', async () => {
    const carga = await cargaDe();
    const { app, tocar, abrir, atras } = await montar(`#/ver?r=${carga}`);
    await tocar('cocinar');
    expect(global.location.hash).toBe(`#/ver/cocinar?r=${carga}`);
    await abrir(`#/ver/cocinar?r=${carga}`);
    expect(app.innerHTML).toContain('class="coc"');
    expect(app.innerHTML).not.toContain('salir-cocina');
    await tocar('volver-receta');
    expect(atras).toHaveLength(1);
  });

  it('con un link directo a la cocina, el chevron reemplaza por la lectura', async () => {
    const carga = await cargaDe();
    const { tocar, reemplazos } = await montar(`#/ver/cocinar?r=${carga}`);
    await tocar('volver-receta');
    expect(reemplazos).toEqual([`#/ver?r=${carga}`]);
  });

  it('marcar un paso se dibuja', async () => {
    const carga = await cargaDe();
    const { app, tocar } = await montar(`#/ver/cocinar?r=${carga}`);
    await tocar('conmutar', { posicion: 'pasos' });
    await tocar('paso', { paso: '0' });
    expect(app.innerHTML).toContain('<li class="hecho" data-accion="paso" data-paso="0">');
  });

  it('tocar una foto abre el visor, el dedo pasa a la siguiente y un toque lo cierra', async () => {
    const carga = await codificar(parse(
      '---\ntitulo: Rabas\nfoto: foto:1\n---\n\n## Preparación\n1. Freír.\n\n## Fotos\n- 1: https://x/1.jpg\n- 2: https://x/2.jpg\n'
    ), 'Pescados');
    const { app, tocar, deslizar } = await montar(`#/ver?r=${carga}`);
    await tocar('ver-foto-receta', { n: '1' });
    expect(app.innerHTML).toContain('class="visor"');
    expect(app.innerHTML).toContain('data-i="0"');
    await deslizar(200, 100);
    expect(app.innerHTML).toContain('data-i="1"');
    expect(app.innerHTML).toContain('src="https://x/2.jpg"');
    // El click con el que termina el deslizamiento no cierra: ya cambió de foto.
    await tocar('cerrar-visor');
    expect(app.innerHTML).toContain('class="visor"');
    await deslizar(100, 100);
    await tocar('cerrar-visor');
    expect(app.innerHTML).not.toContain('class="visor"');
  });

  it('el visor no queda abierto al ir a la cocina', async () => {
    const carga = await codificar(parse(
      '---\ntitulo: Rabas\n---\n\n## Ingredientes\n- Calamar\n\n## Preparación\n1. Freír.\n\n## Fotos\n- 1: https://x/1.jpg\n'
    ), 'Pescados');
    const { app, tocar, abrir } = await montar(`#/ver?r=${carga}`);
    await tocar('ver-foto-receta', { n: '1' });
    expect(app.innerHTML).toContain('class="visor"');
    await abrir(`#/ver/cocinar?r=${carga}`);
    expect(app.innerHTML).not.toContain('class="visor"');
  });

  it('un hash de la app desde el invitado recarga: la app se decide al cargar', async () => {
    const carga = await cargaDe();
    const { abrir, recargas } = await montar(`#/ver?r=${carga}`);
    await abrir('#/r/f1');
    expect(recargas).toHaveLength(1);
  });

  it('un link roto lo dice', async () => {
    const { app } = await montar('#/ver?r=1roto');
    expect(app.innerHTML).toContain('Este link está roto o incompleto.');
  });
});
