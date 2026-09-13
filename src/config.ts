export const CLIENT_ID = '670194416271-psq474ahahgia41v9frctqaom4to7cio.apps.googleusercontent.com';

// drive.file no alcanza: es por archivo y no ve los .md que escriben los
// agentes por fuera de la app. Medido el 2026-09-01, ver §4.4 del spec.
export const SCOPE = 'https://www.googleapis.com/auth/drive';

export const NOMBRE_RAIZ = 'Recetario';
export const NOMBRE_INDICE = '_indice';
/** La carpeta de los borradores, un `.md` por borrador. El `_` la deja fuera de las categorías. */
export const NOMBRE_BORRADORES = '_borradores';

// Subir esta versión fuerza una reconstrucción del índice en el próximo
// arranque. Fue a 2 con el rediseño —la fila sumó `foto` y `completa`—, a 3
// el 2026-09-12 —la columna `completa` pasó de guardar un cálculo a guardar lo
// que dice el `.md`— y a 4 el 2026-09-13, cuando la planilla sumó la hoja
// `borradores`.
export const SCHEMA_VERSION = 4;
