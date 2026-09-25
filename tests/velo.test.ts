import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { crearVelo, MS_CIERRE, MS_RESPALDO_CIERRE, MS_ESPERA_VISIBLE } from '../src/velo.js';
import { comoGlobal } from './dom-falso.js';

/** El velo de `index.html`: su `hidden`, sus clases y la tarjeta del progreso. */
function domFalso() {
  const clases = new Set<string>();
  /** Cada vez que se puso o se sacó, en orden: sirve para ver si parpadea. */
  const idasYVueltas: boolean[] = [];
  const texto = { textContent: '' };
  const barra = { style: { width: '' } };
  const velo = {
    _hidden: true,
    get hidden(): boolean { return this._hidden; },
    set hidden(v: boolean) {
      if (v !== this._hidden) idasYVueltas.push(v);
      this._hidden = v;
    },
    classList: {
      add: (c: string) => { clases.add(c); },
      remove: (...cs: string[]) => { for (const c of cs) clases.delete(c); },
      toggle: (c: string, si: boolean) => { if (si) clases.add(c); else clases.delete(c); },
      contains: (c: string) => clases.has(c)
    },
    querySelector: (sel: string) =>
      sel === '[data-progreso-texto]' ? texto : sel === '[data-progreso-barra]' ? barra : null
  };
  const atributos: Record<string, string> = {};
  const app = {
    setAttribute: (n: string, v: string) => { atributos[n] = v; },
    removeAttribute: (n: string) => { delete atributos[n]; }
  };
  let tapadas = 0;
  const v = crearVelo({
    velo: () => comoGlobal<HTMLElement>(velo),
    app: () => comoGlobal<Element>(app),
    alTapar: () => { tapadas++; }
  });
  /** Lo que se ve: nada, la olla, el tilde o la tarjeta del progreso. */
  const seVe = (): 'nada' | 'olla' | 'tilde' | 'progreso' =>
    velo.hidden ? 'nada' : clases.has('exito') ? 'tilde' : clases.has('progreso') ? 'progreso' : 'olla';
  return { v, velo, seVe, texto, barra, atributos, idasYVueltas, vecesTapado: () => tapadas };
}

/** Una tarea que termina cuando el test lo dice. */
function pendiente<T = void>() {
  let terminar!: (valor: T) => void;
  let fallar!: (err: unknown) => void;
  const promesa = new Promise<T>((ok, mal) => { terminar = ok; fallar = mal; });
  return { promesa, terminar, fallar };
}

const vueltas = () => vi.advanceTimersByTimeAsync(0);

describe('el velo', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }); });
  afterEach(() => { vi.useRealTimers(); });

  describe('escribir', () => {
    it('tapa desde el toque, cierra con el tilde y se va cuando la pantalla nueva se pinta', async () => {
      const { v, seVe, atributos } = domFalso();
      const t = pendiente<string>();
      let resultado = '';
      const corriendo = v.escribir(() => t.promesa).then(r => { resultado = r; });
      expect(seVe()).toBe('olla');
      expect(v.ocupado()).toBe(true);
      expect(atributos['aria-busy']).toBe('true');

      t.terminar('listo');
      await vueltas();
      // El tilde se dibuja con la pantalla todavía ocupada: el que escribió no navega aún.
      expect(seVe()).toBe('tilde');
      expect(v.ocupado()).toBe(true);
      expect(resultado).toBe('');

      await vi.advanceTimersByTimeAsync(MS_CIERRE);
      await corriendo;
      // Terminado el tilde, se puede navegar, pero el velo sigue puesto hasta
      // que la pantalla de destino se pinte.
      expect(resultado).toBe('listo');
      expect(v.ocupado()).toBe(false);
      expect(atributos['aria-busy']).toBeUndefined();
      expect(seVe()).toBe('tilde');

      v.alPintar();
      expect(seVe()).toBe('nada');
    });

    it('un pintado durante el tilde no saca el velo: todavía no se navegó', async () => {
      const { v, seVe } = domFalso();
      const corriendo = v.escribir(async () => {});
      await vueltas();
      expect(seVe()).toBe('tilde');
      v.alPintar();
      expect(seVe()).toBe('tilde');
      await vi.advanceTimersByTimeAsync(MS_CIERRE);
      await corriendo;
    });

    it('si nadie pinta después del tilde, el respaldo lo saca', async () => {
      const { v, seVe } = domFalso();
      const corriendo = v.escribir(async () => {});
      await vi.advanceTimersByTimeAsync(MS_CIERRE);
      await corriendo;
      expect(seVe()).toBe('tilde');
      await vi.advanceTimersByTimeAsync(MS_RESPALDO_CIERRE);
      expect(seVe()).toBe('nada');
    });

    it('una escritura nueva corta el cierre de la anterior y suelta al que lo esperaba', async () => {
      const { v, seVe } = domFalso();
      let primera = false;
      const corriendo = v.escribir(async () => {}).then(() => { primera = true; });
      await vueltas();
      expect(seVe()).toBe('tilde');
      const t = pendiente();
      const segunda = v.escribir(() => t.promesa);
      await corriendo;
      expect(primera).toBe(true);
      expect(seVe()).toBe('olla');
      // El respaldo de la primera ya no corre: la segunda sigue tapando.
      await vi.advanceTimersByTimeAsync(MS_CIERRE + MS_RESPALDO_CIERRE);
      expect(seVe()).toBe('olla');
      t.terminar();
      await vi.advanceTimersByTimeAsync(MS_CIERRE + MS_RESPALDO_CIERRE);
      await segunda;
      expect(seVe()).toBe('nada');
    });
  });

  describe('esperar', () => {
    it('lo que termina antes de 250 ms no llega a verse, pero la pantalla queda ocupada', async () => {
      const { v, seVe, idasYVueltas } = domFalso();
      const t = pendiente<number>();
      const corriendo = v.esperar(() => t.promesa);
      expect(v.ocupado()).toBe(true);
      expect(seVe()).toBe('nada');
      await vi.advanceTimersByTimeAsync(MS_ESPERA_VISIBLE - 10);
      t.terminar(7);
      expect(await corriendo).toBe(7);
      expect(v.ocupado()).toBe(false);
      await vi.advanceTimersByTimeAsync(MS_ESPERA_VISIBLE);
      expect(seVe()).toBe('nada');
      expect(idasYVueltas).toEqual([]);
    });

    it('pasados los 250 ms se ve la olla, y al terminar se va sin tilde', async () => {
      const { v, seVe } = domFalso();
      const t = pendiente();
      const corriendo = v.esperar(() => t.promesa);
      await vi.advanceTimersByTimeAsync(MS_ESPERA_VISIBLE);
      expect(seVe()).toBe('olla');
      t.terminar();
      await corriendo;
      expect(seVe()).toBe('nada');
      expect(v.ocupado()).toBe(false);
    });

    it('con el velo ya puesto por el cierre de una escritura, la espera lo sigue tapando', async () => {
      const { v, seVe, idasYVueltas } = domFalso();
      const escrita = v.escribir(async () => {});
      await vi.advanceTimersByTimeAsync(MS_CIERRE);
      await escrita;
      // Se navegó y la pantalla de destino lee de la red antes de pintar.
      const t = pendiente();
      const leyendo = v.esperar(() => t.promesa);
      expect(seVe()).toBe('olla');
      await vi.advanceTimersByTimeAsync(MS_RESPALDO_CIERRE);
      expect(seVe()).toBe('olla');
      t.terminar();
      await leyendo;
      expect(seVe()).toBe('nada');
      // Puesto una vez y sacado una vez: nada de parpadeo entre las dos.
      expect(idasYVueltas).toEqual([false, true]);
    });
  });

  describe('conProgreso', () => {
    it('dibuja la tarjeta con el texto y la barra, y avance la mueve', async () => {
      const { v, seVe, texto, barra } = domFalso();
      const t = pendiente();
      let avance!: (p: number) => void;
      const corriendo = v.conProgreso('Reindexando…', a => { avance = a; return t.promesa; });
      expect(seVe()).toBe('progreso');
      expect(v.ocupado()).toBe(true);
      expect(texto.textContent).toBe('Reindexando…');
      expect(barra.style.width).toBe('0%');
      avance(0.5);
      expect(barra.style.width).toBe('50%');
      avance(1.2);
      expect(barra.style.width).toBe('100%');
      t.terminar();
      await corriendo;
      expect(seVe()).toBe('nada');
      expect(v.ocupado()).toBe(false);
    });

    it('la olla de otra operación no queda con la clase del progreso', async () => {
      const { v, seVe } = domFalso();
      await v.conProgreso('Reindexando…', async () => {});
      const t = pendiente();
      const corriendo = v.escribir(() => t.promesa);
      expect(seVe()).toBe('olla');
      t.terminar();
      await vi.advanceTimersByTimeAsync(MS_CIERRE);
      await corriendo;
    });
  });

  describe('los errores', () => {
    it.each(['escribir', 'esperar', 'conProgreso'] as const)(
      '%s: un error saca el velo, sin tilde, y se propaga', async forma => {
        const { v, seVe } = domFalso();
        const falla = () => Promise.reject(new Error('sin red'));
        const corriendo = forma === 'escribir' ? v.escribir(falla)
          : forma === 'esperar' ? v.esperar(falla)
          : v.conProgreso('Reindexando…', falla);
        await expect(corriendo).rejects.toThrow('sin red');
        expect(seVe()).toBe('nada');
        expect(v.ocupado()).toBe(false);
      });
  });

  describe('anidadas', () => {
    it('dos operaciones anidadas no parpadean: hay un contador', async () => {
      const { v, seVe, idasYVueltas, vecesTapado } = domFalso();
      const corriendo = v.escribir(async () => {
        await v.esperar(async () => {});
        await v.escribir(async () => {});
        expect(seVe()).toBe('olla');
        expect(v.ocupado()).toBe(true);
      });
      await vueltas();
      expect(seVe()).toBe('tilde');
      await vi.advanceTimersByTimeAsync(MS_CIERRE);
      await corriendo;
      v.alPintar();
      expect(idasYVueltas).toEqual([false, true]);
      expect(vecesTapado()).toBe(1);
    });

    it('la de afuera termina mal después de una de adentro que salió bien: sin tilde', async () => {
      const { v, seVe } = domFalso();
      const corriendo = v.escribir(async () => {
        await v.escribir(async () => {});
        throw new Error('validación');
      });
      await expect(corriendo).rejects.toThrow('validación');
      expect(seVe()).toBe('nada');
    });

    it('ocupado mientras dura cualquiera de las tres', async () => {
      const { v } = domFalso();
      for (const forma of ['escribir', 'esperar', 'conProgreso'] as const) {
        const t = pendiente();
        const corriendo = forma === 'escribir' ? v.escribir(() => t.promesa)
          : forma === 'esperar' ? v.esperar(() => t.promesa)
          : v.conProgreso('Preparando la carpeta…', () => t.promesa);
        expect(v.ocupado(), forma).toBe(true);
        t.terminar();
        await vi.advanceTimersByTimeAsync(MS_CIERRE + MS_RESPALDO_CIERRE);
        await corriendo;
        expect(v.ocupado(), forma).toBe(false);
      }
    });
  });

  it('sin el velo en el DOM, las operaciones corren igual', async () => {
    const v = crearVelo({ velo: () => null, app: () => null });
    expect(await v.escribir(async () => 3)).toBe(3);
    expect(await v.esperar(async () => 4)).toBe(4);
    expect(await v.conProgreso('x', async avance => { avance(0.3); return 5; })).toBe(5);
  });
});
