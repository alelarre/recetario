/**
 * El estado de *Temporizadores*: los temporizadores, el cronómetro, las ruedas del
 * temporizador nuevo y el aviso. Tiene el tic de 1 s, pide la pantalla encendida mientras
 * corra algo y se esté en *Temporizadores*, y registra sus acciones en el mapa. El reloj, el almacén, el
 * aviso y la pantalla se inyectan: los tests le pasan dobles.
 *
 * Un toque redibuja la pantalla; el tic y las ruedas pintan sólo los tiempos
 * (`pintarVivo`): redibujar perdería el nombre que se está escribiendo.
 */
import type { SeccionDeAcciones } from './acciones.js';
import {
  type Temporizador, type Cronometro, type Duracion, type EnLista,
  esCrono, empezarCrono, pausarCrono, seguirCrono, corriendo, terminado, empezar, pausar, seguir, sumarMinuto,
  cronoCorriendo, iniciarCrono, pararCrono, reiniciarCrono,
  aMs, girar, esRueda, leerGuardado, CLAVE_TEMPORIZADORES
} from './temporizadores.js';

export interface Reloj {
  ahora(): number;
  /** Llama `fn` cada segundo hasta que se llame lo que devuelve. */
  cadaSegundo(fn: () => void): () => void;
}

export interface Aviso {
  /** En el toque que empieza un temporizador: el audio del navegador necesita un gesto para arrancar. */
  preparar(): void;
  sonar(): void;
  vibrar(): void;
}

/** La pantalla encendida. `mantener` se puede llamar seguido: pide una sola vez. */
export interface Pantalla {
  mantener(): void;
  soltar(): void;
}

type Almacen = Pick<Storage, 'getItem' | 'setItem'>;

export interface EstadoTemporizadores {
  temporizadores: readonly EnLista[];
  crono: Cronometro;
  ruedas: Duracion;
  /** El id del temporizador cuyo aviso suena, o ninguno. */
  avisando: string | null;
  ahora: number;
}

export interface ControlTemporizadores {
  estado(): EstadoTemporizadores;
  /** Empieza un temporizador con ese nombre y esa duración (ms), como *Empezar*: lo llaman las referencias. */
  empezarCon(nombre: string, duracion: number): void;
  /** Empieza un cronómetro con nombre: lo llaman las marcas de la receta. */
  empezarCronoCon(nombre: string): void;
  /** Después de cambiar de pantalla: la pantalla encendida depende de estar en *Temporizadores*. */
  revisarPantalla(): void;
  acciones: SeccionDeAcciones;
}

/** Cuántos tics dura el aviso si nadie lo para: un minuto. */
export const TICS_DE_AVISO = 60;

function leer(almacen: Almacen | null): unknown {
  try {
    const crudo = almacen?.getItem(CLAVE_TEMPORIZADORES);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

function guardar(almacen: Almacen | null, valor: unknown): void {
  try { almacen?.setItem(CLAVE_TEMPORIZADORES, JSON.stringify(valor)); } catch { /* sin almacenamiento: queda para esta vez */ }
}

export function crearControlTemporizadores({ almacen, reloj, aviso, pantalla, enTemporizadores, redibujar, pintarVivo, nombreEscrito, vaciarNombre }: {
  almacen: Almacen | null;
  reloj: Reloj;
  aviso: Aviso;
  pantalla: Pantalla;
  /**
   * Si se está en la pantalla de *Temporizadores*. Sólo ahí algo corriendo
   * mantiene la pantalla encendida: en las demás, una tira con un cronómetro
   * de horas no deja que el teléfono se apague nunca; para cocinar con la
   * pantalla prendida está el sol del modo cocina.
   */
  enTemporizadores: () => boolean;
  redibujar: () => void;
  pintarVivo: () => void;
  /** El nombre escrito en el campo del temporizador nuevo. */
  nombreEscrito: () => string;
  /** Vacía ese campo: el temporizador siguiente no hereda el nombre. */
  vaciarNombre: () => void;
}): ControlTemporizadores {
  const guardado = leerGuardado(leer(almacen));
  let temporizadores: readonly EnLista[] = guardado.temporizadores;
  let crono: Cronometro = guardado.crono;
  let ruedas: Duracion = guardado.ultimaDuracion;
  let avisando: string | null = null;
  let ticsAvisando = 0;
  /** Los que ya avisaron o están avisando: uno terminado que no está acá arranca el aviso. */
  const avisadas = new Set<string>();
  let detener: (() => void) | null = null;
  let contador = 0;

  const nuevoId = (): string => `${reloj.ahora().toString(36)}-${(contador++).toString(36)}`;

  /** Las cuentas regresivas solas: los cronómetros con nombre ni terminan ni avisan. */
  const cuentas = (): Temporizador[] => temporizadores.filter((x): x is Temporizador => !esCrono(x));

  /** Si algún temporizador está corriendo de verdad —no terminado— o el cronómetro anda. */
  const enMarcha = (): boolean => {
    const ahora = reloj.ahora();
    return cuentas().some(c => corriendo(c) && !terminado(c, ahora)) || cronoCorriendo(crono) ||
      temporizadores.some(x => esCrono(x) && cronoCorriendo(x));
  };

  /**
   * El intervalo y la pantalla siguen al estado: con algo en marcha, los dos
   * —la pantalla, sólo en *Temporizadores*—; con un aviso sonando o uno
   * terminado sin sacar, sólo el intervalo —la tira sigue rotando por él—;
   * sin nada, ninguno.
   */
  function ajustarMarcha(): void {
    const marcha = enMarcha();
    if (marcha && enTemporizadores()) pantalla.mantener(); else pantalla.soltar();
    const ahora = reloj.ahora();
    const necesitaTic = marcha || avisando !== null || cuentas().some(t => terminado(t, ahora));
    if (necesitaTic && !detener) detener = reloj.cadaSegundo(tic);
    if (!necesitaTic && detener) { detener(); detener = null; }
  }

  function tic(): void {
    const ahora = reloj.ahora();
    const avisabaAntes = avisando;
    const nuevas = cuentas().filter(c => terminado(c, ahora) && !avisadas.has(c.id));
    for (const c of nuevas) avisadas.add(c.id);
    if (avisando === null && nuevas[0]) { avisando = nuevas[0].id; ticsAvisando = 0; }
    if (avisando !== null) {
      if (ticsAvisando % 2 === 0) { aviso.sonar(); aviso.vibrar(); }
      ticsAvisando++;
      if (ticsAvisando >= TICS_DE_AVISO) avisando = null;
    }
    ajustarMarcha();
    // Uno que termina, aunque no sea el que avisa, cambia su ficha a «¡Listo!».
    if (avisando !== avisabaAntes || nuevas.length > 0) redibujar(); else pintarVivo();
  }

  const guardarTodo = (): void => guardar(almacen, { temporizadores, crono, ultimaDuracion: ruedas });

  /** Un cambio por un toque: guarda, acomoda el intervalo y la pantalla, y redibuja. */
  function cambiar(fn: () => void): void {
    fn();
    guardarTodo();
    ajustarMarcha();
    redibujar();
  }

  const porId = (boton: HTMLElement): EnLista | undefined => temporizadores.find(c => c.id === boton.dataset['id']);

  /** Un temporizador deja de avisar: lo sacan, o le suman un minuto y vuelve a correr. */
  function callar(c: EnLista): void {
    if (avisando === c.id) avisando = null;
    avisadas.delete(c.id);
  }

  const reemplazar = (c: EnLista, nueva: EnLista): void => { temporizadores = temporizadores.map(x => (x === c ? nueva : x)); };

  const sobre = (fn: (c: EnLista, ahora: number) => void) => (boton: HTMLElement): void => {
    const c = porId(boton);
    if (c) cambiar(() => fn(c, reloj.ahora()));
  };

  const girarRueda = (paso: 1 | -1) => (boton: HTMLElement): void => {
    const rueda = boton.dataset['rueda'];
    if (!esRueda(rueda)) return;
    ruedas = girar(ruedas, rueda, paso);
    guardarTodo();
    pintarVivo();
  };

  const acciones: SeccionDeAcciones = {
    'temporizador-empezar': () => {
      const duracion = aMs(ruedas);
      if (duracion <= 0) return;
      aviso.preparar();
      cambiar(() => {
        temporizadores = [...temporizadores, empezar(nuevoId(), nombreEscrito(), duracion, reloj.ahora())];
        vaciarNombre();
      });
    },
    'temporizador-pausar': sobre((c, ahora) => reemplazar(c, esCrono(c) ? pausarCrono(c, ahora) : pausar(c, ahora))),
    'temporizador-seguir': sobre((c, ahora) => reemplazar(c, esCrono(c) ? seguirCrono(c, ahora) : seguir(c, ahora))),
    // Un cronómetro no tiene minutos que sumar.
    'temporizador-sumar': sobre((c, ahora) => { if (esCrono(c)) return; callar(c); reemplazar(c, sumarMinuto(c, ahora)); }),
    'temporizador-sacar': sobre((c) => { callar(c); temporizadores = temporizadores.filter(x => x !== c); }),
    'rueda-mas': girarRueda(1),
    'rueda-menos': girarRueda(-1),
    'crono-iniciar': () => cambiar(() => { crono = iniciarCrono(crono, reloj.ahora()); }),
    'crono-parar': () => cambiar(() => { crono = pararCrono(crono, reloj.ahora()); }),
    'crono-reiniciar': () => cambiar(() => { crono = reiniciarCrono(); })
  };

  // Lo guardado puede venir corriendo, o terminado mientras la app estaba cerrada.
  ajustarMarcha();

  return {
    estado: () => ({ temporizadores, crono, ruedas, avisando, ahora: reloj.ahora() }),
    revisarPantalla: ajustarMarcha,
    empezarCon(nombre, duracion) {
      if (!(duracion > 0)) return;
      aviso.preparar();
      cambiar(() => { temporizadores = [...temporizadores, empezar(nuevoId(), nombre, duracion, reloj.ahora())]; });
    },
    empezarCronoCon(nombre) {
      cambiar(() => { temporizadores = [...temporizadores, empezarCrono(nuevoId(), nombre, reloj.ahora())]; });
    },
    acciones
  };
}
