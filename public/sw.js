// Service worker: solo cachea el app shell. Los datos no se cachean acá —la
// copia del índice vive en localStorage—: si este archivo cacheara respuestas
// de las APIs de Google, la app mostraría datos viejos sin forma de saberlo.
// El nombre cambia cuando cambia lo que se guarda: `activate` borra los
// cachés con otro nombre.
const CACHE = 'recetario-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(claves =>
    Promise.all(claves.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

/** Solo se guarda la respuesta exitosa: una de error cacheada sobrevive a la recarga y rompe la app. */
function guardar(request, resp) {
  if (resp.ok) {
    const copia = resp.clone();
    caches.open(CACHE).then(c => c.put(request, copia));
  }
  return resp;
}

/** Caché primero: para lo que ya trae la prueba de que es correcto en el propio nombre. */
function cachePrimero(request) {
  return caches.match(request).then(hit => hit ?? fetch(request).then(resp => guardar(request, resp)));
}

/**
 * La navegación se guarda siempre como `index.html`, sin la query: todas
 * las rutas son el mismo documento, y la query del Share Target trae el
 * texto que se compartió, que no tiene que quedar guardado en el navegador.
 */
function navegar(request) {
  return fetch(request)
    .then(resp => guardar('./index.html', resp))
    .catch(() => caches.match('./index.html'));
}

/** Red primero: para lo que puede cambiar de contenido sin cambiar de nombre. */
function redPrimero(request) {
  return fetch(request)
    .then(resp => guardar(request, resp))
    .catch(() => caches.match(request).then(hit => hit ?? caches.match('./index.html')));
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   // nada de las APIs de Google

  // Los archivos de /assets/ llevan hash en el nombre (Vite se lo cambia cada
  // vez que cambia el contenido): si el nombre ya está en caché, el contenido
  // es, por construcción, el correcto. Caché primero, sin ida y vuelta a red
  // en cada carga.
  if (url.pathname.includes('/assets/')) {
    return e.respondWith(cachePrimero(e.request));
  }

  // El documento de navegación no lleva hash: el mismo index.html cambia de
  // contenido entre un deploy y el siguiente (referencia a otros assets/*.js).
  // Con red primero, un deploy nuevo se ve apenas hay señal; sin señal, cae al
  // último que quedó cacheado. Con caché primero quedaría sirviéndose el viejo
  // para siempre, porque sw.js tampoco cambia de bytes entre deploys y el
  // navegador no reinstala el service worker.
  if (e.request.mode === 'navigate') {
    return e.respondWith(navegar(e.request));
  }

  // Todo lo que llega hasta acá —manifest.webmanifest, los íconos— tampoco
  // lleva hash y vale el mismo razonamiento: red primero.
  e.respondWith(redPrimero(e.request));
});
