import './ui/tokens.css';
import './ui/app.css';
import { crearAuth } from './auth.js';
import { crearDrive } from './drive.js';
import { crearSheets } from './sheets.js';
import { abrirCache } from './cache.js';
import { crearStore } from './store.js';
import { crearRouter, parsearHash } from './ui/router.js';
import { escapar } from './ui/markdown.js';
import { renderHome } from './ui/home.js';
import { renderLista } from './ui/lista.js';
import { renderDetalle } from './ui/detalle.js';
import { renderEditor, recetaDesdeFormulario } from './ui/editor.js';
import { renderVisor } from './ui/visor.js';

const app = document.querySelector('#app');
const auth = crearAuth();
const drive = crearDrive(() => auth.token());
const sheets = crearSheets(() => auth.token());

let store, estadoArranque, pestana = 'ingredientes', vistaActual = null;
let pendienteFlush = null;
let tagsActivos = [];       // filtro de la vista de categoría; se limpia al cambiar de vista
let fotosVisor = null;      // fotos de la receta abierta en el visor; null = visor cerrado
let indiceVisor = 0;

const pintar = (html) => { app.innerHTML = html; };

/** Agrega o saca el visor del final de #app, sin tocar el resto del contenido (§7.2: no pierde el scroll del detalle). */
function pintarVisor() {
  document.querySelector('.visor')?.remove();
  if (fotosVisor) app.insertAdjacentHTML('beforeend', renderVisor({ fotos: fotosVisor, indice: indiceVisor }));
}

function abrirVisor(fotos, indice) {
  fotosVisor = fotos;
  indiceVisor = indice;
  pintarVisor();
}

function cerrarVisor() {
  fotosVisor = null;
  pintarVisor();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && fotosVisor) cerrarVisor();
});

function programarFlush() {
  clearTimeout(pendienteFlush);
  pendienteFlush = setTimeout(() => store.flush().catch(console.error), 30000);
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'hidden') return;
  // Cancelar el debounce antes del flush forzado: si no, y el timer de 30s
  // vencía justo mientras este flush estaba en vuelo, corrían los dos en
  // paralelo y la escritura de fila (que no es atómica) podía duplicar la
  // fila de la misma receta en el índice.
  clearTimeout(pendienteFlush);
  store?.flush().catch(console.error);
});

async function arrancar() {
  pintar('<p class="contenido">Conectando…</p>');
  try {
    // Vía silenciosa primero: es la misma que usa auth.token() para renovar
    // (pedir('') con la sesión en frío). Para una app que se abre a diario,
    // pedir el consentimiento explícito en cada arranque es un popup por
    // apertura; solo corresponde mostrarlo si la vía silenciosa falla —sin
    // sesión previa, o con el permiso revocado.
    await auth.token();
  } catch {
    await auth.conectar();
  }
  store = crearStore({ drive, sheets, cache: await abrirCache() });
  estadoArranque = await store.arrancar();

  if (estadoArranque.estado === 'falta-estructura') {
    return pintar('<p class="contenido">No encontré la carpeta <b>Recetario</b> en tu Drive. Ver <code>SETUP.md</code>.</p>');
  }
  if (estadoArranque.estado === 'elegir-carpeta') {
    return pintar('<p class="contenido">Hay más de una carpeta llamada Recetario. Dejá una sola y recargá.</p>');
  }
  if (estadoArranque.estado === 'solo-lectura') {
    const motivo = estadoArranque.motivo ? `: ${escapar(estadoArranque.motivo)}` : '.';
    return pintar(`<p class="contenido">No pude conectar con Drive${motivo} Quedás en modo solo lectura. <button data-accion="reconectar">Reintentar</button></p>`);
  }

  await store.cargarIndice();
  if (estadoArranque.reconstruir) await reconstruir();
  else store.sync().then(render).catch(console.error);

  router.iniciar();
}

async function reconstruir() {
  pintar('<p class="contenido">Reconstruyendo el índice… <span data-progreso>0</span></p>');
  await store.reconstruir(({ leidas, total }) => {
    const el = document.querySelector('[data-progreso]');
    if (el) el.textContent = `${leidas} / ${total}`;
  });
  render();
}

async function render(ruta = parsearHash(location.hash)) {
  // Cambiar de categoría o de vista limpia el filtro de tags y cierra el visor:
  // si no, se entra a otra categoría y no se ve nada porque quedó filtrando
  // por un tag que ahí no existe, sin forma de darse cuenta.
  if (!vistaActual || ruta.vista !== vistaActual.vista || ruta.params.nombre !== vistaActual.params.nombre) {
    tagsActivos = [];
    fotosVisor = null;
  }
  vistaActual = ruta;
  if (ruta.vista === 'home') {
    return pintar(renderHome({ categorias: store.categoriasConConteo(), ultimaReconstruccion: store.ultimaReconstruccion() }));
  }
  if (ruta.vista === 'categoria') {
    const entradas = store.buscar({ categoria: ruta.params.nombre, tags: tagsActivos });
    return pintar(renderLista({ titulo: ruta.params.nombre, entradas, tags: store.tagsDe(ruta.params.nombre), tagsActivos }));
  }
  if (ruta.vista === 'buscar') {
    return pintar(renderLista({ titulo: `"${ruta.params.q}"`, entradas: store.buscar({ texto: ruta.params.q }) }));
  }
  if (ruta.vista === 'detalle') {
    const { entrada, receta } = await store.receta(ruta.params.id);
    return pintar(renderDetalle({ entrada, receta, pestana }));
  }
  if (ruta.vista === 'editar') {
    const { entrada, receta } = await store.receta(ruta.params.id);
    return pintar(renderEditor({ entrada, receta, categorias: estadoArranque.categorias, tagsConocidos: store.tagsDe().map(t => t.tag) }));
  }
  if (ruta.vista === 'nueva') {
    const titulo = prompt('Título de la receta');
    if (!titulo) return location.hash = '#/';
    try {
      const { id } = await store.crear({ titulo });
      programarFlush();
      // §7.2: crear es el mismo editor con el archivo vacío, así que abre
      // directo el formulario en vez del detalle (que para algo recién
      // creado está casi vacío y obliga a tocar "Editar" a mano).
      return location.hash = `#/r/${id}/editar`;
    } catch (err) {
      console.error(err);
      alert(`No se pudo crear la receta en Drive: ${err.message}. Probá de nuevo.`);
      return location.hash = '#/';
    }
  }
}

const router = crearRouter(render);

app.addEventListener('click', async (e) => {
  const boton = e.target.closest('[data-accion], [data-pestana], .check, [data-tag], img');
  if (!boton) return;

  if (boton.classList.contains('check')) {
    const marcado = boton.getAttribute('aria-pressed') === 'true';
    boton.setAttribute('aria-pressed', String(!marcado));
    return;
  }

  if (boton.dataset.tag) {
    const tag = boton.dataset.tag;
    tagsActivos = tagsActivos.includes(tag) ? tagsActivos.filter(t => t !== tag) : [...tagsActivos, tag];
    return render();
  }

  if (boton.tagName === 'IMG') {
    // Las imágenes del cuerpo son las únicas fotos de la receta: tocar
    // cualquiera abre el visor (§7.2).
    const fotos = [...document.querySelectorAll('#app [data-cuerpo] img')];
    const indice = fotos.indexOf(boton);
    if (indice === -1) return;
    return abrirVisor(fotos.map(img => img.src), indice);
  }

  const accion = boton.dataset.accion;
  if (boton.dataset.pestana) { pestana = boton.dataset.pestana; return render(); }
  if (accion === 'atras') return history.back();
  if (accion === 'editar') return location.hash = `#/r/${vistaActual.params.id}/editar`;
  if (accion === 'cancelar') return history.back();
  if (accion === 'reconstruir') return reconstruir();
  if (accion === 'reconectar') {
    try {
      // Si el arranque nunca llegó a "listo" (solo-lectura), reintentar todo
      // el arranque en vez de solo renovar el token: el store todavía no
      // tiene categorías ni índice cargados.
      if (estadoArranque?.estado !== 'listo') { await arrancar(); return; }
      await auth.conectar();
      return render();
    } catch (err) {
      console.error(err);
      return alert(`No se pudo reconectar con Google: ${err.message}. Probá de nuevo.`);
    }
  }
  if (accion === 'menu') return document.querySelector('.menu')?.toggleAttribute('hidden');
  if (accion === 'cerrar-visor') return cerrarVisor();
  if (accion === 'foto-anterior') { indiceVisor = Math.max(0, indiceVisor - 1); return pintarVisor(); }
  if (accion === 'foto-siguiente') { indiceVisor = Math.min((fotosVisor?.length ?? 1) - 1, indiceVisor + 1); return pintarVisor(); }

  if (accion === 'guardar') {
    try {
      const form = document.querySelector('[data-formulario]');
      const datos = Object.fromEntries(new FormData(form));
      const { receta } = await store.receta(vistaActual.params.id);
      const nueva = recetaDesdeFormulario(datos, receta);
      const r = await store.guardar(vistaActual.params.id, nueva, { carpetaDestino: datos.carpeta });
      if (!r.ok) return alert('La receta cambió en Drive desde que la abriste. Recargá antes de guardar.');
      programarFlush();
      return history.back();
    } catch (err) {
      console.error(err);
      return alert(`No se pudo guardar en Drive: ${err.message}. El cambio puede no haberse guardado — probá de nuevo antes de salir de la receta.`);
    }
  }

  if (accion === 'borrar') {
    if (!confirm('¿Borrar esta receta?')) return;
    try {
      await store.borrar(vistaActual.params.id);
      programarFlush();
      return location.hash = '#/';
    } catch (err) {
      console.error(err);
      return alert(`No se pudo borrar en Drive: ${err.message}. La receta puede seguir estando ahí — probá de nuevo.`);
    }
  }
});

app.addEventListener('change', (e) => {
  if (e.target.dataset.accion === 'buscar') location.hash = `#/buscar?q=${encodeURIComponent(e.target.value)}`;
});

arrancar().catch(err => pintar(`<p class="contenido">No pude arrancar: ${escapar(err.message)} <button data-accion="reconectar">Reintentar</button></p>`));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.error));
}
