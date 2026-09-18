// El Picker es la ventana de Google con la que se elige una carpeta que ya
// existe. Su SDK se carga por `<script>`, como el de Identity Services: acá se
// simula ese script y el `google.picker` que deja, para probar que se carga una
// sola vez y que la promesa termina siempre en algo.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { comoGlobal, limpiarGlobales } from './dom-falso.js';

/** Lo que el Picker falso devolvió en el último `setCallback`. */
type Respuesta = { action: string; docs?: { id: string; name?: string }[] };

const armarEntorno = ({ cargaElScript = true } = {}) => {
  const scripts: { src: string; onload?: () => void; onerror?: () => void }[] = [];
  /** El callback que el Picker falso guardó: el test lo dispara como lo haría Google. */
  let responder: ((r: Respuesta) => void) | null = null;
  /** Los valores con los que se armó el Picker, para mirar la consulta. */
  const armado: Record<string, unknown> = {};
  let visible = 0;

  const picker = {
    ViewId: { FOLDERS: 'folders' },
    Action: { PICKED: 'picked', CANCEL: 'cancel' },
    DocsView: class {
      constructor(id: string) { armado['vista'] = id; }
      setSelectFolderEnabled(v: boolean) { armado['carpetas'] = v; return this; }
      setOwnedByMe(v: boolean) { armado['propias'] = v; return this; }
      setMimeTypes(m: string) { armado['mime'] = m; return this; }
    },
    PickerBuilder: class {
      addView(v: unknown) { armado['agregada'] = v; return this; }
      setOAuthToken(t: string) { armado['token'] = t; return this; }
      setDeveloperKey(k: string) { armado['key'] = k; return this; }
      setTitle(t: string) { armado['titulo'] = t; return this; }
      setLocale(l: string) { armado['idioma'] = l; return this; }
      setCallback(cb: (r: Respuesta) => void) { responder = cb; return this; }
      build() { return { setVisible: () => { visible++; } }; }
    }
  };

  global.window = comoGlobal<Window & typeof globalThis>({});
  global.document = comoGlobal<Document>({
    createElement: () => {
      const s = { src: '', async: false } as (typeof scripts)[number];
      scripts.push(s);
      return s;
    },
    head: {
      appendChild: (s: (typeof scripts)[number]) => {
        // El script real deja `gapi` colgado de `window` antes de su `load`.
        if (!cargaElScript) return queueMicrotask(() => s.onerror?.());
        comoGlobal<Record<string, unknown>>(global.window)['gapi'] = {
          load: (_n: string, cfg: { callback: () => void }) => {
            comoGlobal<Record<string, unknown>>(global.window)['google'] = { picker };
            cfg.callback();
          }
        };
        queueMicrotask(() => s.onload?.());
      }
    }
  });

  return { scripts, armado, elegir: (r: Respuesta) => responder?.(r), visible: () => visible };
};

const esperar = () => new Promise(r => setTimeout(r, 0));

describe('el Picker de carpetas', () => {
  afterEach(() => {
    limpiarGlobales();
    vi.resetModules();
  });

  it('carga el script una sola vez y arma la vista de carpetas propias', async () => {
    const entorno = armarEntorno();
    const { elegirCarpeta } = await import('../src/picker.js');

    const primera = elegirCarpeta('tok');
    await esperar();
    entorno.elegir({ action: 'cancel' });
    await primera;

    expect(entorno.scripts).toHaveLength(1);
    expect(entorno.scripts[0]!.src).toBe('https://apis.google.com/js/api.js');
    expect(entorno.armado['vista']).toBe('folders');
    expect(entorno.armado['carpetas']).toBe(true);
    expect(entorno.armado['propias']).toBe(true);
    expect(entorno.armado['mime']).toBe('application/vnd.google-apps.folder');
    expect(entorno.armado['token']).toBe('tok');
    expect(entorno.armado['idioma']).toBe('es');
    expect(entorno.visible()).toBe(1);

    const segunda = elegirCarpeta('tok');
    await esperar();
    entorno.elegir({ action: 'cancel' });
    await segunda;
    expect(entorno.scripts).toHaveLength(1);
    expect(entorno.visible()).toBe(2);
  });

  it('elegir una carpeta resuelve con su id y su nombre', async () => {
    const entorno = armarEntorno();
    const { elegirCarpeta } = await import('../src/picker.js');
    const pedido = elegirCarpeta('tok');
    await esperar();
    entorno.elegir({ action: 'picked', docs: [{ id: 'c1', name: 'Mis recetas' }] });
    expect(await pedido).toEqual({ id: 'c1', nombre: 'Mis recetas' });
  });

  it('cancelar resuelve con null: nada cambia', async () => {
    const entorno = armarEntorno();
    const { elegirCarpeta } = await import('../src/picker.js');
    const pedido = elegirCarpeta('tok');
    await esperar();
    entorno.elegir({ action: 'cancel' });
    expect(await pedido).toBeNull();
  });

  it('si el script no carga, rechaza', async () => {
    armarEntorno({ cargaElScript: false });
    const { elegirCarpeta } = await import('../src/picker.js');
    await expect(elegirCarpeta('tok')).rejects.toThrow();
  });
});
