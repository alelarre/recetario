export function escapar(texto: unknown): string {
  return String(texto ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function enLinea(texto: unknown): string {
  const escapado = escapar(texto);
  // Validar esquemas: solo http:, https: y rutas relativas. Todo lo demás no se emite.
  // Nota: URLs con paréntesis anidados (ej: alert(1)) se truncan en el primer ), limitación conocida.
  return escapado
    .replace(/!\[[^\]]*\]\(([^)\s]+)\)/g, (_, url) => {
      const esSeguro = /^(https?:\/\/|\/|\.\.?\/)/i.test(url);
      return esSeguro ? `<img src="${url}" alt="" loading="lazy">` : `![](${url})`;
    })
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

/** `pasos` convierte la <ol> en la lista tildable del detalle (§7.2). */
export function aHtml(texto: unknown, { pasos = false }: { pasos?: boolean } = {}): string {
  const lineas = String(texto ?? '').split('\n');
  const salida: string[] = [];
  let lista: 'ul' | 'ol' | null = null;
  let parrafo: string[] = [];

  const cerrarParrafo = () => {
    if (!parrafo.length) return;
    salida.push(`<p>${enLinea(parrafo.join(' '))}</p>`);
    parrafo = [];
  };
  const cerrarLista = () => { if (lista) { salida.push(`</${lista}>`); lista = null; } };

  for (const linea of lineas) {
    const h3 = linea.match(/^###\s+(.*)$/);
    const item = linea.match(/^\s*[-*]\s+(.*)$/);
    const num = linea.match(/^\s*\d+[.)]\s+(.*)$/);

    if (h3) { cerrarParrafo(); cerrarLista(); salida.push(`<h3>${enLinea(h3[1])}</h3>`); continue; }

    if (item) {
      cerrarParrafo();
      if (lista !== 'ul') { cerrarLista(); salida.push('<ul>'); lista = 'ul'; }
      salida.push(`<li>${enLinea(item[1])}</li>`);
      continue;
    }

    if (num) {
      cerrarParrafo();
      // La clase va acá y no en quien llama: con `pasos` esta misma <ol> es la
      // lista de pasos tildables del detalle, y el CSS la necesita para numerar.
      if (lista !== 'ol') { cerrarLista(); salida.push(pasos ? '<ol class="pasos">' : '<ol>'); lista = 'ol'; }
      salida.push(pasos
        ? `<li class="paso"><button class="check" aria-pressed="false" aria-label="Marcar paso"></button><span>${enLinea(num[1])}</span></li>`
        : `<li>${enLinea(num[1])}</li>`);
      continue;
    }

    if (!linea.trim()) { cerrarParrafo(); cerrarLista(); continue; }
    parrafo.push(linea.trim());
  }

  cerrarParrafo();
  cerrarLista();
  return salida.join('');
}
