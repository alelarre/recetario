import { aHtml, escapar } from './markdown.js';

// Traduce los códigos internos de recipe.js (§8: "se indexa con lo que se
// pueda rescatar y se muestra como texto plano con un aviso") a un texto que
// el usuario entienda, sin exponer el código interno. 'frontmatter-ilegible'
// y 'sin-frontmatter' comparten mensaje: son mutuamente excluyentes (parse()
// nunca empuja los dos juntos) y para quien lee la receta el problema
// práctico es el mismo — no se pudo leer el frontmatter.
const AVISOS_LEGIBLES = {
  'frontmatter-ilegible': 'el frontmatter no se pudo leer',
  'sin-frontmatter': 'el frontmatter no se pudo leer',
  'sin-titulo': 'esta receta no tiene título',
  'seccion-duplicada': 'hay una sección repetida'
};

function avisosLegibles(avisos) {
  const lista = Array.isArray(avisos) ? avisos : [];
  return [...new Set(lista.map(a => AVISOS_LEGIBLES[a]).filter(Boolean))];
}

export function renderDetalle(args = {}) {
  const { entrada = {}, receta = {}, pestana = 'ingredientes' } = args || {};

  // Normalizar con ?? para manejar null
  const recetaNorm = receta ?? {};
  const entradaNorm = entrada ?? {};

  const meta = [recetaNorm.rinde, recetaNorm.tiempo, recetaNorm.dificultad].filter(Boolean).join(' · ');
  const variaciones = (recetaNorm.variaciones ? recetaNorm.variaciones.split(/^###\s+/m).filter(Boolean).length : 0);
  const notas = (recetaNorm.notas ? 1 : 0) + variaciones + (recetaNorm.otras?.length ?? 0);
  const incompleto = entradaNorm?.tags?.includes('incompleto');
  const avisos = avisosLegibles(recetaNorm.avisos);

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
      ${avisos.length ? `<p class="aviso">⚠ ${avisos.map(escapar).join(' · ')}</p>` : ''}
      ${meta ? `<p class="meta">${escapar(meta)}</p>` : ''}
      ${recetaNorm.descripcion ? aHtml(recetaNorm.descripcion) : ''}
    </div>
    <nav class="pestanas">${pestanas}</nav>
    <section class="contenido" data-cuerpo>${cuerpos[pestanaActiva] ?? ''}</section>`;
}
