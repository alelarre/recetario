// Service worker: solo cachea el app shell. Los datos los cachea IndexedDB (§6);
// si este archivo cacheara respuestas de las APIs de Google, la app mostraría
// datos viejos sin forma de saberlo.
const CACHE = 'recetario-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(claves =>
    Promise.all(claves.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

/** Caché primero: para lo que ya trae la prueba de que es correcto en el propio nombre. */
function cachePrimero(request) {
  return caches.match(request).then(hit => hit ?? fetch(request).then(resp => {
    const copia = resp.clone();
    // Guardar solo si la respuesta es exitosa; una respuesta de error cacheada sobrevive a la recarga y rompe la app.
    if (resp.ok) {
      caches.open(CACHE).then(c => c.put(request, copia));
    }
    return resp;
  }));
}

/** Red primero: para lo que puede cambiar de contenido sin cambiar de nombre. */
function redPrimero(request) {
  return fetch(request).then(resp => {
    const copia = resp.clone();
    // Guardar solo si la respuesta es exitosa; una respuesta de error cacheada sobrevive a la recarga y rompe la app.
    if (resp.ok) {
      caches.open(CACHE).then(c => c.put(request, copia));
    }
    return resp;
  }).catch(() => caches.match(request).then(hit => hit ?? caches.match('./index.html')));
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

  // El documento de navegación no lleva hash: el mismo index.html puede
  // cambiar de contenido entre un deploy y el siguiente (referencia a otros
  // assets/*.js). Antes esto también iba con caché primero, y como este
  // archivo (sw.js) no cambiaba de bytes entre deploys, el navegador nunca
  // reinstalaba el service worker: el index.html viejo quedaba sirviéndose
  // para siempre aunque hubiera una versión nueva publicada. Con red primero,
  // un deploy nuevo se ve apenas hay señal; sin señal, cae al último que
  // quedó cacheado.
  if (e.request.mode === 'navigate') {
    return e.respondWith(redPrimero(e.request));
  }

  // Todo lo que llega hasta acá —manifest.webmanifest, los íconos— tampoco
  // lleva hash y vale el mismo razonamiento: red primero.
  e.respondWith(redPrimero(e.request));
});
