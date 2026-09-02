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
// TODO: el visor de fotos (renderVisor) todavía no está cableado a ninguna acción
// (ver "ver-foto" en detalle.js y "cerrar-visor"/"foto-anterior"/"foto-siguiente"
// en visor.js). Se deja importado, sin usar, para la próxima tarea que lo conecte.
import { renderVisor } from './ui/visor.js';

const app = document.querySelector('#app');
const auth = crearAuth();
const drive = crearDrive(() => auth.token());
const sheets = crearSheets(() => auth.token());

let store, estadoArranque, pestana = 'ingredientes', vistaActual = null;
let pendienteFlush = null;

const pintar = (html) => { app.innerHTML = html; };

function programarFlush() {
  clearTimeout(pendienteFlush);
  pendienteFlush = setTimeout(() => store.flush().catch(console.error), 30000);
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') store?.flush().catch(console.error);
});

async function arrancar() {
  pintar('<p class="contenido">Conectando…</p>');
  await auth.conectar();
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
  vistaActual = ruta;
  if (ruta.vista === 'home') {
    return pintar(renderHome({ categorias: store.categoriasConConteo() }));
  }
  if (ruta.vista === 'categoria') {
    const entradas = store.buscar({ categoria: ruta.params.nombre });
    return pintar(renderLista({ titulo: ruta.params.nombre, entradas, tags: store.tagsDe(ruta.params.nombre) }));
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
    const { id } = await store.crear({ titulo });
    programarFlush();
    return location.hash = `#/r/${id}`;
  }
}

const router = crearRouter(render);

app.addEventListener('click', async (e) => {
  const boton = e.target.closest('[data-accion], [data-pestana], .check');
  if (!boton) return;

  if (boton.classList.contains('check')) {
    const marcado = boton.getAttribute('aria-pressed') === 'true';
    boton.setAttribute('aria-pressed', String(!marcado));
    return;
  }

  const accion = boton.dataset.accion;
  if (boton.dataset.pestana) { pestana = boton.dataset.pestana; return render(); }
  if (accion === 'atras') return history.back();
  if (accion === 'editar') return location.hash = `#/r/${vistaActual.params.id}/editar`;
  if (accion === 'cancelar') return history.back();
  if (accion === 'reconstruir') return reconstruir();
  if (accion === 'reconectar') {
    // Si el arranque nunca llegó a "listo" (solo-lectura), reintentar todo el
    // arranque en vez de solo renovar el token: el store todavía no tiene
    // categorías ni índice cargados.
    if (estadoArranque?.estado !== 'listo') return arrancar();
    await auth.conectar();
    return render();
  }
  if (accion === 'menu') return document.querySelector('.menu')?.toggleAttribute('hidden');

  if (accion === 'guardar') {
    const form = document.querySelector('[data-formulario]');
    const datos = Object.fromEntries(new FormData(form));
    const { receta } = await store.receta(vistaActual.params.id);
    const nueva = recetaDesdeFormulario(datos, receta);
    const r = await store.guardar(vistaActual.params.id, nueva, { carpetaDestino: datos.carpeta });
    if (!r.ok) return alert('La receta cambió en Drive desde que la abriste. Recargá antes de guardar.');
    programarFlush();
    return history.back();
  }

  if (accion === 'borrar') {
    if (!confirm('¿Borrar esta receta?')) return;
    const fotos = await store.fotosDe(vistaActual.params.id);
    const tambien = fotos.length ? confirm(`Tiene ${fotos.length} foto(s) en Drive. ¿Borrarlas también?`) : false;
    await store.borrar(vistaActual.params.id, { borrarFotos: tambien });
    programarFlush();
    return location.hash = '#/';
  }
});

app.addEventListener('change', (e) => {
  if (e.target.dataset.accion === 'buscar') location.hash = `#/buscar?q=${encodeURIComponent(e.target.value)}`;
});

arrancar().catch(err => pintar(`<p class="contenido">No pude arrancar: ${escapar(err.message)}</p>`));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.error));
}
