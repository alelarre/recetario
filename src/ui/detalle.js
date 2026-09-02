import { aHtml, escapar } from './markdown.js';
import { primeraImagen } from '../recipe.js';

/** Saca del texto la imagen que ya se muestra como portada, para no repetirla. */
function sinPortada(texto, portada) {
  if (!portada) return texto;
  return String(texto).replace(new RegExp(`!\\[[^\\]]*\\]\\(${portada.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`), '').trim();
}

export function renderDetalle(args = {}) {
  const { entrada = {}, receta = {}, pestana = 'ingredientes' } = args || {};

  const portada = primeraImagen(receta);
  const meta = [receta.rinde, receta.tiempo, receta.dificultad].filter(Boolean).join(' · ');
  const variaciones = (receta.variaciones ? receta.variaciones.split(/^###\s+/m).filter(Boolean).length : 0);
  const notas = (receta.notas ? 1 : 0) + variaciones + (receta.otras?.length ?? 0);
  const incompleto = entrada?.tags?.includes('incompleto');

  const cuerpos = {
    ingredientes: aHtml(sinPortada(receta.ingredientes, portada)),
    preparacion: aHtml(sinPortada(receta.preparacion, portada), { pasos: true }),
    notas: [
      receta.notas ? aHtml(receta.notas) : '',
      receta.variaciones ? `<h2>Variaciones</h2>${aHtml(receta.variaciones)}` : '',
      ...(receta.otras ?? []).map(o => `<h2>${escapar(o.encabezado)}</h2>${aHtml(o.cuerpo)}`)
    ].filter(Boolean).join('')
  };

  const pestanas = [
    ['ingredientes', 'Ingredientes', !!receta.ingredientes],
    ['preparacion', 'Preparación', !!receta.preparacion],
    ['notas', notas ? `Notas · ${notas}` : 'Notas', notas > 0]
  ].map(([clave, texto, activa]) => `
    <button class="pestana" data-pestana="${clave}" aria-selected="${clave === pestana}"${activa ? '' : ' disabled'}>${escapar(texto)}</button>`).join('');

  return `
    <header class="encabezado">
      <button data-accion="atras" aria-label="Volver">‹</button>
      <button data-accion="editar" aria-label="Editar">Editar</button>
    </header>
    ${portada ? `<img class="portada" src="${escapar(portada)}" alt="" data-accion="ver-foto">` : ''}
    <div class="contenido">
      <h1 class="${incompleto ? 'incompleto' : ''}">${escapar(receta.titulo ?? entrada?.titulo ?? '')}</h1>
      ${meta ? `<p class="meta">${escapar(meta)}</p>` : ''}
      ${receta.descripcion ? aHtml(sinPortada(receta.descripcion, portada)) : ''}
    </div>
    <nav class="pestanas">${pestanas}</nav>
    <section class="contenido" data-cuerpo>${cuerpos[pestana] ?? ''}</section>`;
}
