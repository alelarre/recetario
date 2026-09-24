export const CLIENT_ID = '670194416271-psq474ahahgia41v9frctqaom4to7cio.apps.googleusercontent.com';

// drive.file no alcanza: es por archivo y no ve los .md que escriben los
// agentes por fuera de la app.
export const SCOPE = 'https://www.googleapis.com/auth/drive';

/**
 * La API key del Google Picker, la ventana con la que se elige una carpeta que
 * ya existe. No es un secreto: va restringida por referente —`localhost:8080` y
 * el origen de Pages— y a la Picker API. Vacía, la app sólo ofrece crear.
 */
export const API_KEY = 'AIzaSyC0T7P6AqTmoUeZk8Kcm5pbeqXg7jZx6BI';

export const NOMBRE_RAIZ = 'Recetario';
export const NOMBRE_INDICE = '_indice';
/** La carpeta de los borradores, un `.md` por borrador. El `_` la deja fuera de las categorías. */
export const NOMBRE_BORRADORES = '_borradores';
/**
 * La bandeja de entrada: las recetas sin categoría, un `.md` por receta. Se
 * crea con la primera. El `_` la deja fuera de las categorías y del reindexado.
 */
export const NOMBRE_SIN_CATEGORIA = '_sin-categoria';
/**
 * Las fotos de las recetas y de las categorías, en la carpeta base. Se crea con
 * la primera foto. El `_` la deja fuera de las categorías y del reindexado.
 */
export const NOMBRE_FOTOS = '_fotos';
/** El plan de la semana: un solo archivo en la carpeta base, al lado de `_indice`. */
export const NOMBRE_PLAN = '_plan.md';

/**
 * La marca de la carpeta base en sus `appProperties`. La app la encuentra por
 * esta marca y no por el nombre: la carpeta puede llamarse como el usuario quiera.
 */
export const MARCA_RAIZ = { clave: 'recetario', valor: 'raiz' } as const;

// Subir esta versión fuerza una reconstrucción del índice en el próximo
// arranque. La sube cambiar la forma de la fila o de las hojas; lo que se
// valida al leer —`tiempo`, `dificultad`— no.
export const SCHEMA_VERSION = 7;
