/**
 * El estado de *Cuentas*: las cuentas, el cronómetro, las ruedas de la cuenta
 * nueva y el aviso. Tiene el tic de 1 s, pide la pantalla encendida mientras
 * corra algo y registra sus acciones en el mapa. El reloj, el almacén, el
 * aviso y la pantalla se inyectan: los tests le pasan dobles.
 *
 * Un toque redibuja la pantalla; el tic y las ruedas pintan sólo los tiempos
 * (`pintarVivo`): redibujar perdería el nombre que se está escribiendo.
 */
import type { SeccionDeAcciones } from './acciones.js';
import {
  type Cuenta, type Cronometro, type Duracion,
  corriendo, terminada, empezar, pausar, seguir, sumarMinuto,
  cronoCorriendo, iniciarCrono, pararCrono, reiniciarCrono,
  aMs, girar, esRueda, leerGuardado, CLAVE_CUENTAS
} from './cuentas.js';

export interface Reloj {
  ahora(): number;
  /** Llama `fn` cada segundo hasta que se llame lo que devuelve. */
  cadaSegundo(fn: () => void): () => void;
}

export interface Aviso {
  /** En el toque que empieza una cuenta: el audio del navegador necesita un gesto para arrancar. */
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

export interface EstadoCuentas {
  cuentas: readonly Cuenta[];
  crono: Cronometro;
  ruedas: Duracion;
  /** El id de la cuenta cuyo aviso suena, o ninguno. */
  avisando: string | null;
  ahora: number;
}

export interface ControlCuentas {
  estado(): EstadoCuentas;
  acciones: SeccionDeAcciones;
}

/** Cuántos tics dura el aviso si nadie lo para: un minuto. */
export const TICS_DE_AVISO = 60;

function leer(almacen: Almacen | null): unknown {
  try {
    const crudo = almacen?.getItem(CLAVE_CUENTAS);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

function guardar(almacen: Almacen | null, valor: unknown): void {
  try { almacen?.setItem(CLAVE_CUENTAS, JSON.stringify(valor)); } catch { /* sin almacenamiento: queda para esta vez */ }
}

export function crearControlCuentas({ almacen, reloj, aviso, pantalla, redibujar, pintarVivo, nombreEscrito, vaciarNombre }: {
  almacen: Almacen | null;
  reloj: Reloj;
  aviso: Aviso;
  pantalla: Pantalla;
  redibujar: () => void;
  pintarVivo: () => void;
  /** El nombre escrito en el campo de la cuenta nueva. */
  nombreEscrito: () => string;
  /** Vacía ese campo: la cuenta siguiente no hereda el nombre. */
  vaciarNombre: () => void;
}): ControlCuentas {
  const guardado = leerGuardado(leer(almacen));
  let cuentas: readonly Cuenta[] = guardado.cuentas;
  let crono: Cronometro = guardado.crono;
  let ruedas: Duracion = guardado.ultimaDuracion;
  let avisando: string | null = null;
  let ticsAvisando = 0;
  /** Las que ya avisaron o están avisando: una terminada que no está acá arranca el aviso. */
  const avisadas = new Set<string>();
  let detener: (() => void) | null = null;
  let contador = 0;

  const nuevoId = (): string => `${reloj.ahora().toString(36)}-${(contador++).toString(36)}`;

  /** Si alguna cuenta está corriendo de verdad —no terminada— o el cronómetro anda. */
  const enMarcha = (): boolean => {
    const ahora = reloj.ahora();
    return cuentas.some(c => corriendo(c) && !terminada(c, ahora)) || cronoCorriendo(crono);
  };

  /**
   * El intervalo y la pantalla siguen al estado: con algo en marcha, los dos;
   * con un aviso sonando, sólo el intervalo; sin nada, ninguno. Una terminada
   * sin sacar no cuenta: su «¡Listo!» no cambia.
   */
  function ajustarMarcha(): void {
    const marcha = enMarcha();
    if (marcha) pantalla.mantener(); else pantalla.soltar();
    const necesitaTic = marcha || avisando !== null || hayTerminadaSinAvisar();
    if (necesitaTic && !detener) detener = reloj.cadaSegundo(tic);
    if (!necesitaTic && detener) { detener(); detener = null; }
  }

  const hayTerminadaSinAvisar = (): boolean => {
    const ahora = reloj.ahora();
    return cuentas.some(c => terminada(c, ahora) && !avisadas.has(c.id));
  };

  function tic(): void {
    const ahora = reloj.ahora();
    const avisabaAntes = avisando;
    const nuevas = cuentas.filter(c => terminada(c, ahora) && !avisadas.has(c.id));
    for (const c of nuevas) avisadas.add(c.id);
    if (avisando === null && nuevas[0]) { avisando = nuevas[0].id; ticsAvisando = 0; }
    if (avisando !== null) {
      if (ticsAvisando % 2 === 0) { aviso.sonar(); aviso.vibrar(); }
      ticsAvisando++;
      if (ticsAvisando >= TICS_DE_AVISO) avisando = null;
    }
    ajustarMarcha();
    // Una que termina, aunque no sea la que avisa, cambia su ficha a «¡Listo!».
    if (avisando !== avisabaAntes || nuevas.length > 0) redibujar(); else pintarVivo();
  }

  const guardarTodo = (): void => guardar(almacen, { cuentas, crono, ultimaDuracion: ruedas });

  /** Un cambio por un toque: guarda, acomoda el intervalo y la pantalla, y redibuja. */
  function cambiar(fn: () => void): void {
    fn();
    guardarTodo();
    ajustarMarcha();
    redibujar();
  }

  const porId = (boton: HTMLElement): Cuenta | undefined => cuentas.find(c => c.id === boton.dataset['id']);

  /** Una cuenta deja de avisar: la sacan, o le suman un minuto y vuelve a correr. */
  function callar(c: Cuenta): void {
    if (avisando === c.id) avisando = null;
    avisadas.delete(c.id);
  }

  const reemplazar = (c: Cuenta, nueva: Cuenta): void => { cuentas = cuentas.map(x => (x === c ? nueva : x)); };

  const sobre = (fn: (c: Cuenta, ahora: number) => void) => (boton: HTMLElement): void => {
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
    'cuenta-empezar': () => {
      const duracion = aMs(ruedas);
      if (duracion <= 0) return;
      aviso.preparar();
      cambiar(() => {
        cuentas = [...cuentas, empezar(nuevoId(), nombreEscrito(), duracion, reloj.ahora())];
        vaciarNombre();
      });
    },
    'cuenta-pausar': sobre((c, ahora) => reemplazar(c, pausar(c, ahora))),
    'cuenta-seguir': sobre((c, ahora) => reemplazar(c, seguir(c, ahora))),
    'cuenta-sumar': sobre((c, ahora) => { callar(c); reemplazar(c, sumarMinuto(c, ahora)); }),
    'cuenta-sacar': sobre((c) => { callar(c); cuentas = cuentas.filter(x => x !== c); }),
    'rueda-mas': girarRueda(1),
    'rueda-menos': girarRueda(-1),
    'crono-iniciar': () => cambiar(() => { crono = iniciarCrono(crono, reloj.ahora()); }),
    'crono-parar': () => cambiar(() => { crono = pararCrono(crono, reloj.ahora()); }),
    'crono-reiniciar': () => cambiar(() => { crono = reiniciarCrono(); })
  };

  // Lo guardado puede venir corriendo, o terminado mientras la app estaba cerrada.
  ajustarMarcha();

  return {
    estado: () => ({ cuentas, crono, ruedas, avisando, ahora: reloj.ahora() }),
    acciones
  };
}
