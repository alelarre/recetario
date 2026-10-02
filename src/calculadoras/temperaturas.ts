/**
 * Las franjas de temperatura del ambiente. Las comparten las dos
 * calculadoras: qué cambia en cada franja —los días de un fermento, la
 * levadura de un pan— lo dice la tabla de cada una.
 */
export type ClaveTemperatura = 'menos-13' | '13-18' | '18-24' | 'mas-24';

/** `corto` es el nombre para un conmutador, donde las cuatro van en una fila. */
export const TEMPERATURAS: readonly { clave: ClaveTemperatura; nombre: string; corto: string }[] = [
  { clave: 'menos-13', nombre: 'Menos de 13 °C', corto: '< 13 °C' },
  { clave: '13-18', nombre: '13 a 18 °C', corto: '13–18 °C' },
  { clave: '18-24', nombre: '18 a 24 °C', corto: '18–24 °C' },
  { clave: 'mas-24', nombre: 'Más de 24 °C', corto: '> 24 °C' }
];
