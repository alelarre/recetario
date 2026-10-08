import { describe, it, expect, vi } from 'vitest';
import { crearControlTemporizadores, TICS_DE_AVISO } from '../src/temporizadores-control.js';
import type { Reloj, Aviso, Pantalla } from '../src/temporizadores-control.js';
import type { EnLista, Temporizador } from '../src/temporizadores.js';
import {
  CLAVE_TEMPORIZADORES, MINUTO, restante as restanteDe, corriendo as corriendoDe, transcurrido
} from '../src/temporizadores.js';
import { localStorageFalso } from './dom-falso.js';

const T0 = 1_000_000;

// En estas pruebas la lista sólo trae cuentas, salvo en «los cronómetros con nombre».
const restante = (c: EnLista, ahora: number): number => restanteDe(c as Temporizador, ahora);
const corriendo = (c: EnLista): boolean => corriendoDe(c as Temporizador);

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

function armar({ almacen = localStorageFalso(), nombre = '', enTemporizadores = (): boolean => true } = {}) {
  const r = relojFalso();
  const aviso = avisoFalso();
  const { pantalla, encendida } = pantallaFalsa();
  const redibujar = vi.fn();
  const pintarVivo = vi.fn();
  const vaciarNombre = vi.fn();
  const control = crearControlTemporizadores({
    almacen, reloj: r.reloj, aviso, pantalla, enTemporizadores, redibujar, pintarVivo, nombreEscrito: () => nombre, vaciarNombre
  });
  const tocar = (accion: string, b: HTMLElement = boton()) => control.acciones[accion]!(b, new Event('click'));
  return { control, ...r, aviso, encendida, redibujar, pintarVivo, vaciarNombre, tocar, almacen };
}

describe('empezar con nombre y duración', () => {
  it('empezarCon crea uno con ese nombre y esa duración, como Empezar', () => {
    const { control, aviso, andando, encendida, redibujar } = armar();
    control.empezarCon('Chauchas', 3 * MINUTO);
    const [t] = control.estado().temporizadores;
    expect(t?.nombre).toBe('Chauchas');
    expect(t && restante(t, control.estado().ahora)).toBe(3 * MINUTO);
    expect(aviso.preparar).toHaveBeenCalledOnce();
    expect(andando()).toBe(true);
    expect(encendida()).toBe(true);
    expect(redibujar).toHaveBeenCalledOnce();
  });

  it('una duración que no es positiva no crea nada', () => {
    const { control } = armar();
    control.empezarCon('Nada', 0);
    expect(control.estado().temporizadores).toHaveLength(0);
  });
});

describe('empezar un temporizador', () => {
  it('con las ruedas de fábrica arranca uno de 10 minutos, prepara el audio, guarda y redibuja', () => {
    const { control, tocar, aviso, redibujar, almacen, andando, encendida } = armar({ nombre: 'Pasta' });
    expect(andando()).toBe(false);
    tocar('temporizador-empezar');
    const [c] = control.estado().temporizadores;
    expect(c?.nombre).toBe('Pasta');
    expect(c && restante(c, T0)).toBe(10 * MINUTO);
    expect(aviso.preparar).toHaveBeenCalledOnce();
    expect(redibujar).toHaveBeenCalledOnce();
    expect(andando()).toBe(true);
    expect(encendida()).toBe(true);
    expect(JSON.parse(almacen.getItem(CLAVE_TEMPORIZADORES)!).temporizadores).toHaveLength(1);
  });

  it('empezar vacía el nombre antes de redibujar: el próximo temporizador arranca sin él', () => {
    const { tocar, vaciarNombre, redibujar } = armar({ nombre: 'Pasta' });
    tocar('temporizador-empezar');
    expect(vaciarNombre).toHaveBeenCalledOnce();
    expect(vaciarNombre.mock.invocationCallOrder[0]!).toBeLessThan(redibujar.mock.invocationCallOrder[0]!);
  });

  it('en 0:00:00 no empieza nada', () => {
    const { control, tocar, redibujar } = armar();
    for (let i = 0; i < 10; i++) tocar('rueda-menos', boton('', 'm'));
    expect(control.estado().ruedas).toEqual({ h: 0, m: 0, s: 0 });
    tocar('temporizador-empezar');
    expect(control.estado().temporizadores).toHaveLength(0);
    expect(redibujar).not.toHaveBeenCalled();
  });

  it('cada temporizador tiene su id, aunque empiecen en el mismo instante con el mismo nombre', () => {
    const { control, tocar } = armar({ nombre: 'Pasta' });
    tocar('temporizador-empezar');
    tocar('temporizador-empezar');
    const [a, b] = control.estado().temporizadores;
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
    expect(JSON.parse(almacen.getItem(CLAVE_TEMPORIZADORES)!).ultimaDuracion).toEqual({ h: 1, m: 10, s: 59 });
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
    tocar('temporizador-empezar');
    redibujar.mockClear();
    tics(5);
    expect(pintarVivo).toHaveBeenCalledTimes(5);
    expect(redibujar).not.toHaveBeenCalled();
    expect(aviso.sonar).not.toHaveBeenCalled();
    tics(10 * 60 - 5);
    expect(control.estado().avisando).toBe(control.estado().temporizadores[0]!.id);
    expect(redibujar).toHaveBeenCalledOnce();
    expect(aviso.sonar).toHaveBeenCalledOnce();
    expect(aviso.vibrar).toHaveBeenCalledOnce();
  });

  it('el aviso repite cada 2 s hasta un minuto, y después para solo y redibuja', () => {
    const { control, tocar, tics, aviso, redibujar } = armar();
    tocar('temporizador-empezar');
    tics(10 * 60);
    redibujar.mockClear();
    tics(TICS_DE_AVISO - 1);
    expect(aviso.sonar).toHaveBeenCalledTimes(TICS_DE_AVISO / 2);
    expect(control.estado().avisando).toBeNull();
    expect(redibujar).toHaveBeenCalledOnce();
    tics(10);
    expect(aviso.sonar).toHaveBeenCalledTimes(TICS_DE_AVISO / 2);
  });

  it('Parar corta el aviso y saca el temporizador; sin nada corriendo, el intervalo y la pantalla se sueltan', () => {
    const { control, tocar, tics, aviso, andando, encendida } = armar();
    tocar('temporizador-empezar');
    tics(10 * 60 + 3);
    const id = control.estado().temporizadores[0]!.id;
    tocar('temporizador-sacar', boton(id));
    expect(control.estado().temporizadores).toHaveLength(0);
    expect(control.estado().avisando).toBeNull();
    expect(andando()).toBe(false);
    expect(encendida()).toBe(false);
    const sonidos = (aviso.sonar as ReturnType<typeof vi.fn>).mock.calls.length;
    tics(5);
    expect(aviso.sonar).toHaveBeenCalledTimes(sonidos);
  });

  it('con uno terminado sin sacar, el tic sigue después del aviso: la tira rota por él', () => {
    const { tocar, tics, andando, encendida, control } = armar();
    tocar('temporizador-empezar');
    tics(10 * 60 + TICS_DE_AVISO + 5);
    expect(control.estado().avisando).toBeNull();
    expect(control.estado().temporizadores).toHaveLength(1);
    expect(andando()).toBe(true);
    expect(encendida()).toBe(false);
  });

  it('uno terminado mientras la app estaba cerrada avisa en el primer tic al abrir', () => {
    const almacen = localStorageFalso();
    almacen.setItem(CLAVE_TEMPORIZADORES, JSON.stringify({
      temporizadores: [{ id: 'vieja', nombre: 'Horno', duracion: MINUTO, fin: T0 - 5000 }],
      ultimaDuracion: { h: 0, m: 10, s: 0 }
    }));
    const { control, tics, aviso, andando, encendida } = armar({ almacen });
    expect(andando()).toBe(true);
    expect(encendida()).toBe(false);
    tics(1);
    expect(control.estado().avisando).toBe('vieja');
    expect(aviso.sonar).toHaveBeenCalledOnce();
  });

  it('un segundo que termina mientras otro avisa también redibuja: su ficha pasa a ¡Listo!', () => {
    const { control, tocar, tics, redibujar } = armar();
    tocar('temporizador-empezar');
    tocar('rueda-mas', boton('', 's'));
    tocar('rueda-mas', boton('', 's'));
    tocar('temporizador-empezar');
    redibujar.mockClear();
    tics(10 * 60);
    expect(control.estado().avisando).toBe(control.estado().temporizadores[0]!.id);
    expect(redibujar).toHaveBeenCalledOnce();
    tics(2);
    expect(control.estado().avisando).toBe(control.estado().temporizadores[0]!.id);
    expect(redibujar).toHaveBeenCalledTimes(2);
  });

  it('si terminan dos, el aviso es uno; Parar el que avisa deja el otro en Listo, callado', () => {
    const { control, tocar, tics, aviso } = armar();
    tocar('temporizador-empezar');
    tocar('temporizador-empezar');
    tics(10 * 60 + 2);
    const [a, b] = control.estado().temporizadores;
    expect(control.estado().avisando).toBe(a!.id);
    tocar('temporizador-sacar', boton(a!.id));
    const sonidos = (aviso.sonar as ReturnType<typeof vi.fn>).mock.calls.length;
    tics(4);
    expect(control.estado().avisando).toBeNull();
    expect(control.estado().temporizadores).toEqual([b]);
    expect(aviso.sonar).toHaveBeenCalledTimes(sonidos);
  });
});

describe('pausar, seguir y sumar', () => {
  it('pausado no baja; seguir retoma; +1 suma un minuto', () => {
    const { control, tocar, tics } = armar();
    tocar('temporizador-empezar');
    const id = control.estado().temporizadores[0]!.id;
    tics(60);
    tocar('temporizador-pausar', boton(id));
    tics(30);
    const p = control.estado().temporizadores[0]!;
    expect(corriendo(p)).toBe(false);
    expect(restante(p, control.estado().ahora)).toBe(9 * MINUTO);
    tocar('temporizador-seguir', boton(id));
    tics(60);
    expect(restante(control.estado().temporizadores[0]!, control.estado().ahora)).toBe(8 * MINUTO);
    tocar('temporizador-sumar', boton(id));
    expect(restante(control.estado().temporizadores[0]!, control.estado().ahora)).toBe(9 * MINUTO);
  });

  it('+1 sobre el que avisa corta el aviso y lo vuelve a correr', () => {
    const { control, tocar, tics } = armar();
    tocar('temporizador-empezar');
    tics(10 * 60 + 1);
    const id = control.estado().temporizadores[0]!.id;
    tocar('temporizador-sumar', boton(id));
    expect(control.estado().avisando).toBeNull();
    expect(restante(control.estado().temporizadores[0]!, control.estado().ahora)).toBe(MINUTO);
    tics(60);
    expect(control.estado().avisando).toBe(id);
  });

  it('con uno pausado solo, no hay tic ni pantalla encendida', () => {
    const { control, tocar, andando, encendida } = armar();
    tocar('temporizador-empezar');
    tocar('temporizador-pausar', boton(control.estado().temporizadores[0]!.id));
    expect(andando()).toBe(false);
    expect(encendida()).toBe(false);
  });
});

describe('Nuevo temporizador como cronómetro', () => {
  const tipo = (valor: string) => ({ dataset: { valor } }) as unknown as HTMLElement;

  it('arranca en cuenta regresiva; elegir cronómetro redibuja y no guarda nada en la lista', () => {
    const { control, tocar, redibujar } = armar();
    expect(control.estado().tipo).toBe('cuenta');
    tocar('temporizador-tipo', tipo('crono'));
    expect(control.estado().tipo).toBe('crono');
    expect(control.estado().temporizadores).toEqual([]);
    expect(redibujar).toHaveBeenCalledOnce();
    tocar('temporizador-tipo', tipo('crono'));
    tocar('temporizador-tipo', tipo('otro'));
    expect(redibujar).toHaveBeenCalledOnce();
  });

  it('Empezar suma un cronómetro con el nombre escrito, corriendo, y vacía el nombre', () => {
    const { control, tocar, tics, vaciarNombre, andando, encendida, almacen } = armar({ nombre: 'Amasar' });
    tocar('temporizador-tipo', tipo('crono'));
    tocar('temporizador-empezar');
    tocar('temporizador-empezar');
    const lista = control.estado().temporizadores;
    expect(lista).toHaveLength(2);
    expect(lista[0]).toMatchObject({ nombre: 'Amasar', acumulado: 0 });
    expect(lista[0]!.id).not.toBe(lista[1]!.id);
    expect(vaciarNombre).toHaveBeenCalled();
    expect(andando()).toBe(true);
    expect(encendida()).toBe(true);
    tics(7);
    expect(transcurrido(control.estado().temporizadores[0] as never, control.estado().ahora)).toBe(7000);
    expect(JSON.parse(almacen.getItem(CLAVE_TEMPORIZADORES)!).temporizadores).toHaveLength(2);
  });

  it('con las ruedas en 0:00:00 un cronómetro empieza igual', () => {
    const { control, tocar } = armar();
    for (let i = 0; i < 10; i++) tocar('rueda-menos', boton('', 'm'));
    tocar('temporizador-tipo', tipo('crono'));
    tocar('temporizador-empezar');
    expect(control.estado().temporizadores).toHaveLength(1);
  });

  it('un cronómetro guardado corriendo arranca el tic al construir', () => {
    const almacen = localStorageFalso();
    almacen.setItem(CLAVE_TEMPORIZADORES, JSON.stringify({
      temporizadores: [{ id: 'c', nombre: 'Amasar', acumulado: 0, desde: T0 - 4000 }], ultimaDuracion: { h: 0, m: 10, s: 0 }
    }));
    const { control, andando } = armar({ almacen });
    expect(andando()).toBe(true);
    expect(transcurrido(control.estado().temporizadores[0] as never, T0)).toBe(4000);
  });
});

describe('los cronómetros con nombre', () => {
  it('empezarCronoCon lo suma a la lista, corriendo, y lo guarda', () => {
    const { control, almacen, redibujar } = armar();
    control.empezarCronoCon('amasar');
    const [x] = control.estado().temporizadores;
    expect(x).toMatchObject({ nombre: 'amasar', acumulado: 0 });
    expect(JSON.parse(almacen.getItem(CLAVE_TEMPORIZADORES) ?? '{}').temporizadores).toHaveLength(1);
    expect(redibujar).toHaveBeenCalledOnce();
  });
  it('pausar y seguir le paran y le siguen la cuenta', () => {
    const { control, tics, tocar } = armar();
    control.empezarCronoCon('amasar');
    const id = control.estado().temporizadores[0]!.id;
    const va = () => transcurrido(control.estado().temporizadores[0] as never, control.estado().ahora);
    tics(5);
    tocar('temporizador-pausar', boton(id));
    tics(5);
    expect(va()).toBe(5000);
    tocar('temporizador-seguir', boton(id));
    tics(2);
    expect(va()).toBe(7000);
  });
  it('fuera de Temporizadores, algo corriendo no mantiene la pantalla; al entrar, sí; al salir, la suelta', () => {
    let alli = false;
    const { control, encendida } = armar({ enTemporizadores: () => alli });
    control.empezarCronoCon('amasar');
    expect(encendida()).toBe(false);
    alli = true;
    control.revisarPantalla();
    expect(encendida()).toBe(true);
    alli = false;
    control.revisarPantalla();
    expect(encendida()).toBe(false);
  });
  it('en Temporizadores sin nada corriendo, la pantalla no se mantiene', () => {
    const { control, encendida } = armar();
    control.revisarPantalla();
    expect(encendida()).toBe(false);
  });
  it('mientras corre, la pantalla queda encendida; pausado, no', () => {
    const { control, encendida, tocar } = armar();
    control.empezarCronoCon('amasar');
    expect(encendida()).toBe(true);
    tocar('temporizador-pausar', boton(control.estado().temporizadores[0]!.id));
    expect(encendida()).toBe(false);
  });
  it('no termina ni avisa, y sacar lo saca', () => {
    const { control, tics, aviso, tocar } = armar();
    control.empezarCronoCon('amasar');
    tics(120);
    expect(aviso.sonar).not.toHaveBeenCalled();
    expect(control.estado().avisando).toBeNull();
    tocar('temporizador-sacar', boton(control.estado().temporizadores[0]!.id));
    expect(control.estado().temporizadores).toHaveLength(0);
  });
  it("+1' no le hace nada a un cronómetro", () => {
    const { control, tocar } = armar();
    control.empezarCronoCon('amasar');
    const antes = control.estado().temporizadores[0];
    tocar('temporizador-sumar', boton(antes!.id));
    expect(control.estado().temporizadores[0]).toEqual(antes);
  });
});
