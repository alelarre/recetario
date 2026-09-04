export const CLIENT_ID = '670194416271-psq474ahahgia41v9frctqaom4to7cio.apps.googleusercontent.com';

// drive.file no alcanza: es por archivo y no ve los .md que escriben los
// agentes por fuera de la app. Medido el 2026-09-01, ver §4.4 del spec.
export const SCOPE = 'https://www.googleapis.com/auth/drive';

export const NOMBRE_RAIZ = 'Recetario';
export const NOMBRE_INDICE = '_indice';

// Subir esta versión fuerza una reconstrucción del índice en el próximo arranque.
export const SCHEMA_VERSION = 1;
