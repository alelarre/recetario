import { describe, it, expect, vi } from 'vitest';
import { crearControlCuentas, TICS_DE_AVISO } from '../src/cuentas-control.js';
import type { Reloj, Aviso, Pantalla } from '../src/cuentas-control.js';
import { CLAVE_CUENTAS, MINUTO, restante, corriendo, cronoCorriendo, transcurrido } from '../src/cuentas.js';
import { localStorageFalso } from './dom-falso.js';

const T0 = 1_000_000;

/** Un reloj que avanza a mano y un intervalo que se dispara a mano. */
function relojFalso() {
  let t = T0;
  let fn: (() => void) | null = null;
  const reloj: Reloj = {
    ahora: () => t,
    cadaSegundo: (f) => { fn = f; return () => { fn = null; }; }
  };
  return {
    reloj,
    /** Si hay un intervalo andando. */
    andando: () => fn !== null,
    /** Pasa `n` segundos, con un tic por cada uno. */
    tics: (n: number) => { for (let i = 0; i < n; i++) { t += 1000; fn?.(); } },
    /** Adelanta el reloj sin tics: la app estaba cerrada o en segundo plano. */
    saltar: (ms: number) => { t += ms; }
  };
}

const avisoFalso = () => ({ preparar: vi.fn(), sonar: vi.fn(), vibrar: vi.fn() }) satisfies Aviso;

function pantallaFalsa() {
  let encendida = false;
  const p = { mantener: () => { encendida = true; }, soltar: () => { encendida = false; } } satisfies Pantalla;
  return { pantalla: p, encendida: () => encendida };
}

const boton = (id = '', rueda = '') => ({ dataset: { id, rueda } }) as unknown as HTMLElement;

function armar({ almacen = localStorageFalso(), nombre = '' } = {}) {
  const r = relojFalso();
  const aviso = avisoFalso();
  const { pantalla, encendida } = pantallaFalsa();
  const redibujar = vi.fn();
  const pintarVivo = vi.fn();
  const vaciarNombre = vi.fn();
  const control = crearControlCuentas({
    almacen, reloj: r.reloj, aviso, pantalla, redibujar, pintarVivo, nombreEscrito: () => nombre, vaciarNombre
  });
  const tocar = (accion: string, b: HTMLElement = boton()) => control.acciones[accion]!(b, new Event('click'));
  return { control, ...r, aviso, encendida, redibujar, pintarVivo, vaciarNombre, tocar, almacen };
}

describe('empezar una cuenta', () => {
  it('con las ruedas de fábrica arranca una de 10 minutos, prepara el audio, guarda y redibuja', () => {
    const { control, tocar, aviso, redibujar, almacen, andando, encendida } = armar({ nombre: 'Pasta' });
    expect(andando()).toBe(false);
    tocar('cuenta-empezar');
    const [c] = control.estado().cuentas;
    expect(c?.nombre).toBe('Pasta');
    expect(c && restante(c, T0)).toBe(10 * MINUTO);
    expect(aviso.preparar).toHaveBeenCalledOnce();
    expect(redibujar).toHaveBeenCalledOnce();
    expect(andando()).toBe(true);
    expect(encendida()).toBe(true);
    expect(JSON.parse(almacen.getItem(CLAVE_CUENTAS)!).cuentas).toHaveLength(1);
  });

  it('empezar vacía el nombre antes de redibujar: la próxima cuenta arranca sin él', () => {
    const { tocar, vaciarNombre, redibujar } = armar({ nombre: 'Pasta' });
    tocar('cuenta-empezar');
    expect(vaciarNombre).toHaveBeenCalledOnce();
    expect(vaciarNombre.mock.invocationCallOrder[0]!).toBeLessThan(redibujar.mock.invocationCallOrder[0]!);
  });

  it('en 0:00:00 no empieza nada', () => {
    const { control, tocar, redibujar } = armar();
    for (let i = 0; i < 10; i++) tocar('rueda-menos', boton('', 'm'));
    expect(control.estado().ruedas).toEqual({ h: 0, m: 0, s: 0 });
    tocar('cuenta-empezar');
    expect(control.estado().cuentas).toHaveLength(0);
    expect(redibujar).not.toHaveBeenCalled();
  });

  it('cada cuenta tiene su id, aunque empiecen en el mismo instante con el mismo nombre', () => {
    const { control, tocar } = armar({ nombre: 'Pasta' });
    tocar('cuenta-empezar');
    tocar('cuenta-empezar');
    const [a, b] = control.estado().cuentas;
    expect(a?.id).not.toBe(b?.id);
  });
});

describe('las ruedas', () => {
  it('giran, se guardan como última duración y pintan en vivo sin redibujar', () => {
    const { control, tocar, pintarVivo, redibujar, almacen } = armar();
    tocar('rueda-mas', boton('', 'h'));
    tocar('rueda-menos', boton('', 's'));
    expect(control.estado().ruedas).toEqual({ h: 1, m: 10, s: 59 });
    expect(pintarVivo).toHaveBeenCalledTimes(2);
    expect(redibujar).not.toHaveBeenCalled();
    expect(JSON.parse(almacen.getItem(CLAVE_CUENTAS)!).ultimaDuracion).toEqual({ h: 1, m: 10, s: 59 });
  });

  it('una rueda que no existe no hace nada', () => {
    const { control, tocar } = armar();
    tocar('rueda-mas', boton('', 'x'));
    expect(control.estado().ruedas).toEqual({ h: 0, m: 10, s: 0 });
  });
});

describe('el tic', () => {
  it('cada segundo pinta en vivo; al cruzar el cero empieza el aviso y redibuja', () => {
    const { control, tocar, tics, pintarVivo, redibujar, aviso } = armar();
    tocar('cuenta-empezar');
    redibujar.mockClear();
    tics(5);
    expect(pintarVivo).toHaveBeenCalledTimes(5);
    expect(redibujar).not.toHaveBeenCalled();
    expect(aviso.sonar).not.toHaveBeenCalled();
    tics(10 * 60 - 5);
    expect(control.estado().avisando).toBe(control.estado().cuentas[0]!.id);
    expect(redibujar).toHaveBeenCalledOnce();
    expect(aviso.sonar).toHaveBeenCalledOnce();
    expect(aviso.vibrar).toHaveBeenCalledOnce();
  });

  it('el aviso repite cada 2 s hasta un minuto, y después para solo y redibuja', () => {
    const { control, tocar, tics, aviso, redibujar } = armar();
    tocar('cuenta-empezar');
    tics(10 * 60);
    redibujar.mockClear();
    tics(TICS_DE_AVISO - 1);
    expect(aviso.sonar).toHaveBeenCalledTimes(TICS_DE_AVISO / 2);
    expect(control.estado().avisando).toBeNull();
    expect(redibujar).toHaveBeenCalledOnce();
    tics(10);
    expect(aviso.sonar).toHaveBeenCalledTimes(TICS_DE_AVISO / 2);
  });

  it('Parar corta el aviso y saca la cuenta; sin nada corriendo, el intervalo y la pantalla se sueltan', () => {
    const { control, tocar, tics, aviso, andando, encendida } = armar();
    tocar('cuenta-empezar');
    tics(10 * 60 + 3);
    const id = control.estado().cuentas[0]!.id;
    tocar('cuenta-sacar', boton(id));
    expect(control.estado().cuentas).toHaveLength(0);
    expect(control.estado().avisando).toBeNull();
    expect(andando()).toBe(false);
    expect(encendida()).toBe(false);
    const sonidos = (aviso.sonar as ReturnType<typeof vi.fn>).mock.calls.length;
    tics(5);
    expect(aviso.sonar).toHaveBeenCalledTimes(sonidos);
  });

  it('una terminada mientras la app estaba cerrada avisa en el primer tic al abrir', () => {
    const almacen = localStorageFalso();
    almacen.setItem(CLAVE_CUENTAS, JSON.stringify({
      cuentas: [{ id: 'vieja', nombre: 'Horno', duracion: MINUTO, fin: T0 - 5000 }],
      crono: { acumulado: 0 }, ultimaDuracion: { h: 0, m: 10, s: 0 }
    }));
    const { control, tics, aviso, andando, encendida } = armar({ almacen });
    expect(andando()).toBe(true);
    expect(encendida()).toBe(false);
    tics(1);
    expect(control.estado().avisando).toBe('vieja');
    expect(aviso.sonar).toHaveBeenCalledOnce();
  });

  it('una segunda que termina mientras otra avisa también redibuja: su ficha pasa a ¡Listo!', () => {
    const { control, tocar, tics, redibujar } = armar();
    tocar('cuenta-empezar');
    tocar('rueda-mas', boton('', 's'));
    tocar('rueda-mas', boton('', 's'));
    tocar('cuenta-empezar');
    redibujar.mockClear();
    tics(10 * 60);
    expect(control.estado().avisando).toBe(control.estado().cuentas[0]!.id);
    expect(redibujar).toHaveBeenCalledOnce();
    tics(2);
    expect(control.estado().avisando).toBe(control.estado().cuentas[0]!.id);
    expect(redibujar).toHaveBeenCalledTimes(2);
  });

  it('si terminan dos, el aviso es uno; Parar la que avisa deja la otra en Listo, callada', () => {
    const { control, tocar, tics, aviso } = armar();
    tocar('cuenta-empezar');
    tocar('cuenta-empezar');
    tics(10 * 60 + 2);
    const [a, b] = control.estado().cuentas;
    expect(control.estado().avisando).toBe(a!.id);
    tocar('cuenta-sacar', boton(a!.id));
    const sonidos = (aviso.sonar as ReturnType<typeof vi.fn>).mock.calls.length;
    tics(4);
    expect(control.estado().avisando).toBeNull();
    expect(control.estado().cuentas).toEqual([b]);
    expect(aviso.sonar).toHaveBeenCalledTimes(sonidos);
  });
});

describe('pausar, seguir y sumar', () => {
  it('pausada no baja; seguir retoma; +1 suma un minuto', () => {
    const { control, tocar, tics } = armar();
    tocar('cuenta-empezar');
    const id = control.estado().cuentas[0]!.id;
    tics(60);
    tocar('cuenta-pausar', boton(id));
    tics(30);
    const p = control.estado().cuentas[0]!;
    expect(corriendo(p)).toBe(false);
    expect(restante(p, control.estado().ahora)).toBe(9 * MINUTO);
    tocar('cuenta-seguir', boton(id));
    tics(60);
    expect(restante(control.estado().cuentas[0]!, control.estado().ahora)).toBe(8 * MINUTO);
    tocar('cuenta-sumar', boton(id));
    expect(restante(control.estado().cuentas[0]!, control.estado().ahora)).toBe(9 * MINUTO);
  });

  it('+1 sobre la que avisa corta el aviso y la vuelve a correr', () => {
    const { control, tocar, tics } = armar();
    tocar('cuenta-empezar');
    tics(10 * 60 + 1);
    const id = control.estado().cuentas[0]!.id;
    tocar('cuenta-sumar', boton(id));
    expect(control.estado().avisando).toBeNull();
    expect(restante(control.estado().cuentas[0]!, control.estado().ahora)).toBe(MINUTO);
    tics(60);
    expect(control.estado().avisando).toBe(id);
  });

  it('con una pausada sola, no hay tic ni pantalla encendida', () => {
    const { control, tocar, andando, encendida } = armar();
    tocar('cuenta-empezar');
    tocar('cuenta-pausar', boton(control.estado().cuentas[0]!.id));
    expect(andando()).toBe(false);
    expect(encendida()).toBe(false);
  });
});

describe('el cronómetro', () => {
  it('iniciar arranca el tic y la pantalla; parar los suelta; reiniciar lo deja en cero', () => {
    const { control, tocar, tics, andando, encendida, almacen } = armar();
    tocar('crono-iniciar');
    expect(cronoCorriendo(control.estado().crono)).toBe(true);
    expect(andando()).toBe(true);
    expect(encendida()).toBe(true);
    tics(7);
    tocar('crono-parar');
    expect(transcurrido(control.estado().crono, control.estado().ahora)).toBe(7000);
    expect(andando()).toBe(false);
    expect(encendida()).toBe(false);
    expect(JSON.parse(almacen.getItem(CLAVE_CUENTAS)!).crono).toEqual({ acumulado: 7000 });
    tocar('crono-reiniciar');
    expect(transcurrido(control.estado().crono, control.estado().ahora)).toBe(0);
  });

  it('un cronómetro guardado corriendo arranca el tic al construir', () => {
    const almacen = localStorageFalso();
    almacen.setItem(CLAVE_CUENTAS, JSON.stringify({ cuentas: [], crono: { desde: T0 - 4000, acumulado: 0 }, ultimaDuracion: { h: 0, m: 10, s: 0 } }));
    const { control, andando } = armar({ almacen });
    expect(andando()).toBe(true);
    expect(transcurrido(control.estado().crono, T0)).toBe(4000);
  });
});
