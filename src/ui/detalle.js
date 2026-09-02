import { aHtml, escapar } from './markdown.js';

export function renderDetalle(args = {}) {
  const { entrada = {}, receta = {}, pestana = 'ingredientes' } = args || {};

  // Normalizar con ?? para manejar null
  const recetaNorm = receta ?? {};
  const entradaNorm = entrada ?? {};

  const meta = [recetaNorm.rinde, recetaNorm.tiempo, recetaNorm.dificultad].filter(Boolean).join(' · ');
  const variaciones = (recetaNorm.variaciones ? recetaNorm.variaciones.split(/^###\s+/m).filter(Boolean).length : 0);
  const notas = (recetaNorm.notas ? 1 : 0) + variaciones + (recetaNorm.otras?.length ?? 0);
  const incompleto = entradaNorm?.tags?.includes('incompleto');

  const cuerpos = {
    ingredientes: aHtml(recetaNorm.ingredientes),
    preparacion: aHtml(recetaNorm.preparacion, { pasos: true }),
    notas: [
      recetaNorm.notas ? aHtml(recetaNorm.notas) : '',
      recetaNorm.variaciones ? `<h2>Variaciones</h2>${aHtml(recetaNorm.variaciones)}` : '',
      ...(recetaNorm.otras ?? []).map(o => `<h2>${escapar(o.encabezado)}</h2>${aHtml(o.cuerpo)}`)
    ].filter(Boolean).join('')
  };

  const pestanasInfo = [
    ['ingredientes', 'Ingredientes', !!recetaNorm.ingredientes],
    ['preparacion', 'Preparación', !!recetaNorm.preparacion],
    ['notas', notas ? `Notas · ${notas}` : 'Notas', notas > 0]
  ];

  // Si la pestaña solicitada no existe o está deshabilitada, caer a la primera con contenido
  let pestanaActiva = pestana;
  if (!pestanasInfo.some(p => p[0] === pestana && p[2])) {
    const primera = pestanasInfo.find(p => p[2]);
    pestanaActiva = primera ? primera[0] : 'ingredientes';
  }

  const pestanas = pestanasInfo.map(([clave, texto, activa]) => `
    <button class="pestana" data-pestana="${clave}" aria-selected="${clave === pestanaActiva}"${activa ? '' : ' disabled'}>${escapar(texto)}</button>`).join('');

  return `
    <header class="encabezado">
      <button data-accion="atras" aria-label="Volver">‹</button>
      <button data-accion="editar" aria-label="Editar">Editar</button>
    </header>
    <div class="contenido">
      <h1 class="${incompleto ? 'incompleto' : ''}">${escapar(recetaNorm.titulo ?? entradaNorm?.titulo ?? '')}</h1>
      ${meta ? `<p class="meta">${escapar(meta)}</p>` : ''}
      ${recetaNorm.descripcion ? aHtml(recetaNorm.descripcion) : ''}
    </div>
    <nav class="pestanas">${pestanas}</nav>
    <section class="contenido" data-cuerpo>${cuerpos[pestanaActiva] ?? ''}</section>`;
}
