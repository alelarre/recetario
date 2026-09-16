# Convertir un borrador con Claude — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desde un borrador, mandar a Claude un pedido con las reglas del formato y recibir de vuelta —compartiendo o pegando— la receta en `.md`, que abre el editor para revisarla y guardarla.

**Architecture:** Las funciones puras (armar el pedido, reconocer una receta, sacar el id) viven en `src/conversion.ts`. La salida hacia Claude y la lectura del portapapeles se suman a `src/compartir.ts`, con la plataforma inyectada como ya hace ese archivo. `src/ui/borradores.ts` suma los botones y la pantalla «¿De qué borrador es esta receta?». `src/main.ts` guarda la receta recibida en memoria y la usa para abrir el editor de «nueva».

**Tech Stack:** TypeScript estricto + Vite, sin framework, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-16-convertir-con-claude-design.md`

## Global Constraints

- Todo en español rioplatense: UI, comentarios, tests, mensajes de commit.
- La app no llama a ningún modelo ni a ninguna API nueva.
- Textos de la UI, exactos: «Convertir con Claude», «Pegar receta», «¿De qué borrador es esta receta?», «Ninguno», «Pedido copiado: pegalo en Claude», «Lo copiado no es una receta en .md.», «No pude leer lo copiado.».
- El link a Claude: `https://claude.ai/new?q=<encodeURIComponent(pedido)>` si el link completo mide hasta 8.000 caracteres; si no, copiar el pedido y abrir `https://claude.ai/new`.
- Una receta es un texto que, sin espacios al principio, empieza con `---`, tiene un cierre `---`, y entre los dos una línea `titulo:`.
- La clave `borrador` nunca se muestra ni se guarda.
- La receta recibida abre el editor con la categoría sin elegir, con `incompleta`, y cuenta como cambios sin guardar desde que se abre.
- Atada a un borrador, guardar usa `convertirBorrador`; sin borrador, crea la receta como cualquier nueva.
- Todo texto que venga de afuera pasa por `escapar()`.
- Sin código muerto.
- Gates: `npx vitest run`, `npm run typecheck`, `npm run build`.
- Commits locales; nada de push.

---

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `src/conversion.ts` (nuevo) | `pedidoDeConversion`, `esRecetaEnMd`, `recetaRecibida` |
| `src/compartir.ts` | `enviarAClaude`, y `leer`/`abrir` en `Plataforma` |
| `src/ui/borradores.ts` | Botones del borrador y de Borradores; `renderPreguntaBorrador` |
| `src/ui/router.ts` | Vista `recibida` (`#/recibida`) y el parámetro `recibida` de `nueva` |
| `src/main.ts` | Estado, acciones y rutas |
| `skills/recetario/SKILL.md` y documentos | Task 5 |

---

### Task 1: El pedido y reconocer una receta

**Files:**
- Create: `src/conversion.ts`
- Test: `tests/conversion.test.ts`

**Interfaces:**
- Consumes: `DURACIONES`, `DIFICULTADES`, `TAGS_RESERVADOS` de `src/catalogo.ts`; `parse` de `src/recipe.ts`; tipo `Borrador` de `src/tipos.ts` (con `id_archivo`, `titulo`, `fuente`, `nota`; verificar los nombres reales en `tipos.ts` y usarlos).
- Produces:
  - `pedidoDeConversion(borrador: { id: string; titulo: string; fuente: string; nota: string }): string`
  - `esRecetaEnMd(texto: unknown): boolean`
  - `recetaRecibida(texto: string): { receta: Receta; borradorId: string }` — `parse` del texto, con la clave `borrador` sacada de `receta.extras` y devuelta aparte (vacío si no venía).

- [ ] **Step 1: Tests que fallan** — `tests/conversion.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { pedidoDeConversion, esRecetaEnMd, recetaRecibida } from '../src/conversion.js';
import { DURACIONES, DIFICULTADES } from '../src/catalogo.js';

const borrador = { id: 'b123', titulo: 'Focaccia', fuente: 'https://ejemplo.com/focaccia', nota: 'La de la abuela, sin romero' };

describe('el pedido para Claude', () => {
  const pedido = pedidoDeConversion(borrador);

  it('lleva el borrador tal cual', () => {
    expect(pedido).toContain('Focaccia');
    expect(pedido).toContain('https://ejemplo.com/focaccia');
    expect(pedido).toContain('La de la abuela, sin romero');
  });

  it('pide la línea del id del borrador', () => {
    expect(pedido).toContain('borrador: b123');
  });

  it('lleva los valores cerrados desde las constantes de la app', () => {
    for (const d of DURACIONES) expect(pedido).toContain(d);
    for (const d of DIFICULTADES) expect(pedido).toContain(d);
    expect(pedido).toContain('menú diario');
    expect(pedido).toContain('incompleta');
  });

  it('pide sólo el .md, sin texto alrededor ni bloque de código', () => {
    expect(pedido).toContain('## Ingredientes');
    expect(pedido).toContain('## Preparación');
    expect(pedido).toMatch(/sin bloque de código/i);
  });

  it('un borrador sin fuente ni nota no deja líneas vacías con rótulo', () => {
    const p = pedidoDeConversion({ id: 'b1', titulo: 'Pan', fuente: '', nota: '' });
    expect(p).not.toMatch(/Fuente:\s*\n/);
    expect(p).not.toMatch(/Nota:\s*\n/);
  });
});

describe('reconocer una receta en .md', () => {
  it('una receta con frontmatter y titulo', () => {
    expect(esRecetaEnMd('---\ntitulo: Pan\n---\n\n## Ingredientes\n- Harina — 500 g\n')).toBe(true);
    expect(esRecetaEnMd('  \n---\ntitulo: Pan\ntiempo: ~60 min\n---\n')).toBe(true);
  });

  it('un link, un texto suelto, sin titulo o sin cierre no son recetas', () => {
    expect(esRecetaEnMd('https://ejemplo.com/pan')).toBe(false);
    expect(esRecetaEnMd('Mirá esta receta de pan')).toBe(false);
    expect(esRecetaEnMd('---\nrinde: 4\n---\n')).toBe(false);
    expect(esRecetaEnMd('---\ntitulo: Pan\n')).toBe(false);
    expect(esRecetaEnMd(null)).toBe(false);
  });
});

describe('la receta recibida', () => {
  it('saca la clave borrador y devuelve el id', () => {
    const { receta, borradorId } = recetaRecibida('---\ntitulo: Pan\nborrador: b9\n---\n\n## Preparación\n1. Amasar.\n');
    expect(borradorId).toBe('b9');
    expect(receta.titulo).toBe('Pan');
    expect(receta.extras).not.toHaveProperty('borrador');
  });

  it('sin la clave, el id es vacío y las demás claves desconocidas se conservan', () => {
    const { receta, borradorId } = recetaRecibida('---\ntitulo: Pan\nmaridaje: tinto\n---\n');
    expect(borradorId).toBe('');
    expect(receta.extras['maridaje']).toBe('tinto');
  });
});
```

- [ ] **Step 2: Correrlos y ver que fallan** — `npx vitest run tests/conversion.test.ts` → FAIL.

- [ ] **Step 3: Implementar** — `src/conversion.ts`:

```ts
/**
 * Convertir un borrador con Claude (P28). La app no llama a ningún modelo:
 * arma el pedido, y reconoce la receta en `.md` que vuelve. Las reglas del
 * formato salen de las mismas constantes que usa la app, así el pedido no se
 * desactualiza cuando cambia el esquema.
 */
import { DURACIONES, DIFICULTADES, TAGS_RESERVADOS } from './catalogo.js';
import { parse } from './recipe.js';
import type { Receta } from './tipos.js';

export interface BorradorAConvertir { id: string; titulo: string; fuente: string; nota: string }

export function pedidoDeConversion({ id, titulo, fuente, nota }: BorradorAConvertir): string {
  const lista = (xs: readonly string[]): string => xs.map(x => `\`${x}\``).join(', ');
  return [
    'Convertí este borrador en una receta para mi Recetario. Leé la fuente y escribí la receta en el formato de abajo.',
    '',
    'Borrador:',
    `Título: ${titulo}`,
    ...(fuente ? [`Fuente: ${fuente}`] : []),
    ...(nota ? [`Nota: ${nota}`] : []),
    '',
    'Formato:',
    '- Frontmatter entre `---`, con estas claves y ninguna otra: `titulo` (obligatoria), `tags` como lista `[a, b]`, `rinde`, `tiempo`, `dificultad`, `fuente`, `foto`.',
    `- \`tiempo\` es uno de estos valores, tal cual: ${lista(DURACIONES)}. Cuenta el tiempo hasta comer, con reposo y horno. Si la fuente no lo dice, no lo pongas.`,
    `- \`dificultad\` es uno de estos valores: ${lista(DIFICULTADES)}. Si no se puede saber, no la pongas.`,
    `- En \`tags\` no uses estos: ${lista(TAGS_RESERVADOS)}.`,
    `- La última línea del frontmatter es \`borrador: ${id}\`.`,
    '- Después del frontmatter, una descripción corta opcional y las secciones `## Ingredientes`, `## Preparación`, `## Variaciones` y `## Notas`, sólo las que haya.',
    '- Un ingrediente por línea: `- nombre — cantidad`. Los `###` agrupan ingredientes o tramos de la preparación.',
    '- La preparación en pasos numerados.',
    '',
    'No inventes temperaturas, tiempos ni cantidades que la fuente no dice. No agregues datos nutricionales.',
    '',
    'Respondé sólo con el .md, sin texto antes ni después y sin bloque de código.'
  ].join('\n');
}

/** Empieza con un frontmatter cerrado que tiene `titulo:`. */
export function esRecetaEnMd(texto: unknown): boolean {
  if (typeof texto !== 'string') return false;
  const m = texto.trimStart().match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  return !!m && /^titulo\s*:/m.test(m[1] ?? '');
}

/** La receta parseada, sin la clave `borrador`, que se devuelve aparte. */
export function recetaRecibida(texto: string): { receta: Receta; borradorId: string } {
  const receta = parse(texto.trimStart());
  const borradorId = String(receta.extras['borrador'] ?? '').trim();
  const { borrador: _, ...extras } = receta.extras;
  return { receta: { ...receta, extras }, borradorId };
}
```

Si el linter de tipos marca `_` sin uso, reemplazar la desestructuración por copiar `extras` y `delete` la clave.

- [ ] **Step 4: Correr todo** — `npx vitest run && npm run typecheck` → PASS.

- [ ] **Step 5: Commit local**

```bash
git add src/conversion.ts tests/conversion.test.ts
git commit -m "El pedido para Claude y reconocer la receta que vuelve"
```

---

### Task 2: Salir hacia Claude y leer el portapapeles

**Files:**
- Modify: `src/compartir.ts`
- Test: `tests/compartir.test.ts`

**Interfaces:**
- Produces:
  - `Plataforma` suma `abrir?: (url: string) => void` y `leer?: () => Promise<string>`.
  - `Resultado` suma `'abierto'`.
  - `export const LARGO_MAXIMO_DEL_LINK = 8000;`
  - `export async function enviarAClaude(p: Plataforma, pedido: string): Promise<Resultado>`
  - `export async function leerPortapapeles(p: Plataforma): Promise<string | null>` — `null` si no hay `leer` o falla.

- [ ] **Step 1: Tests que fallan** — sumar a `tests/compartir.test.ts`:

```ts
describe('enviar el pedido a Claude', () => {
  const base = { descargar: () => {} };

  it('con el menú Compartir, lo comparte como texto', async () => {
    const compartidos: ShareData[] = [];
    const r = await enviarAClaude({ ...base, share: async d => { compartidos.push(d); } }, 'pedido');
    expect(r).toBe('compartido');
    expect(compartidos).toEqual([{ text: 'pedido' }]);
  });

  it('sin menú Compartir y con un pedido corto, abre claude.ai con el pedido cargado', async () => {
    const abiertos: string[] = [];
    const r = await enviarAClaude({ ...base, abrir: u => abiertos.push(u) }, 'hola mundo');
    expect(r).toBe('abierto');
    expect(abiertos).toEqual(['https://claude.ai/new?q=hola%20mundo']);
  });

  it('con un pedido que no entra en el link, lo copia y abre claude.ai vacío', async () => {
    const abiertos: string[] = [];
    const copiados: string[] = [];
    const largo = 'x'.repeat(LARGO_MAXIMO_DEL_LINK);
    const r = await enviarAClaude({ ...base, abrir: u => abiertos.push(u), copiar: async t => { copiados.push(t); } }, largo);
    expect(r).toBe('copiado');
    expect(copiados).toEqual([largo]);
    expect(abiertos).toEqual(['https://claude.ai/new']);
  });

  it('si cancela el menú Compartir, no abre nada más', async () => {
    const abiertos: string[] = [];
    const abortar = async () => { throw Object.assign(new Error('x'), { name: 'AbortError' }); };
    expect(await enviarAClaude({ ...base, share: abortar, abrir: u => abiertos.push(u) }, 'p')).toBe('cancelado');
    expect(abiertos).toEqual([]);
  });
});

describe('leer el portapapeles', () => {
  it('devuelve el texto, o null si no se puede', async () => {
    expect(await leerPortapapeles({ descargar: () => {}, leer: async () => 'hola' })).toBe('hola');
    expect(await leerPortapapeles({ descargar: () => {} })).toBeNull();
    expect(await leerPortapapeles({ descargar: () => {}, leer: async () => { throw new Error('no'); } })).toBeNull();
  });
});
```

(Importar `enviarAClaude`, `leerPortapapeles`, `LARGO_MAXIMO_DEL_LINK`.)

- [ ] **Step 2: Correrlos y ver que fallan.**

- [ ] **Step 3: Implementar** — en `src/compartir.ts`:

```ts
export const LARGO_MAXIMO_DEL_LINK = 8000;

/**
 * El pedido de P28 hacia Claude. Con el menú Compartir del sistema (Android)
 * se elige Claude ahí. Sin él, un link a claude.ai con el pedido cargado; si
 * el pedido no entra en el link, se copia y se abre Claude vacío para pegarlo.
 */
export async function enviarAClaude(p: Plataforma, pedido: string): Promise<Resultado> {
  if (p.share) {
    const r = await mandar(p.share, { text: pedido });
    if (r !== 'sin-activacion') return r;
  }
  const link = `https://claude.ai/new?q=${encodeURIComponent(pedido)}`;
  if (link.length <= LARGO_MAXIMO_DEL_LINK) {
    p.abrir?.(link);
    return 'abierto';
  }
  if (!p.copiar) return 'sin-portapapeles';
  try {
    await p.copiar(pedido);
  } catch {
    return 'sin-portapapeles';
  }
  p.abrir?.('https://claude.ai/new');
  return 'copiado';
}

/** El texto copiado, o `null` si el navegador no lo deja leer. */
export async function leerPortapapeles(p: Plataforma): Promise<string | null> {
  if (!p.leer) return null;
  try { return await p.leer(); } catch { return null; }
}
```

Sumar a `Plataforma` los campos `abrir?` y `leer?`, `'abierto'` a `Resultado`, y en `plataformaDelNavegador()`:

```ts
    abrir: (url: string) => { window.open(url, '_blank', 'noopener'); },
    ...(nav.clipboard && typeof nav.clipboard.readText === 'function'
      ? { leer: () => nav.clipboard.readText() } : {}),
```

Si `abrir` queda siempre definido en la plataforma real, dejarlo opcional en la interfaz igual: los tests lo omiten.

- [ ] **Step 4: Correr todo** — `npx vitest run && npm run typecheck` → PASS.

- [ ] **Step 5: Commit local**

```bash
git add src/compartir.ts tests/compartir.test.ts
git commit -m "Mandar el pedido a Claude y leer lo copiado"
```

---

### Task 3: Los botones y la pregunta

**Files:**
- Modify: `src/ui/borradores.ts`, `src/ui/router.ts`
- Test: `tests/vista-borradores.test.ts`, `tests/router.test.ts`

**Interfaces:**
- Produces:
  - `OpcionesBorrador` y `OpcionesBorradores` suman `aviso?: string` (un aviso sin acción, con `aviso({ texto })`).
  - En `renderBorrador`: botones `data-accion="convertir-con-claude"` («Convertir con Claude», `btn sec`) y `data-accion="pegar-receta"` («Pegar receta», `btn sec`), entre «Descartar» y «Crear la receta».
  - En `renderBorradores`: botón `data-accion="pegar-receta"` («Pegar receta», `btn sec`, ancho completo) junto a «Nuevo».
  - `export function renderPreguntaBorrador({ borradores }: { borradores: EntradaBorrador[] }): string` — encabezado con volver y título «¿De qué borrador es esta receta?»; un botón por borrador `data-accion="elegir-borrador-recibido" data-valor="<id>"` con su título; y «Ninguno» `data-accion="elegir-borrador-recibido" data-valor=""`.
  - Router: `#/recibida` → `{ vista: 'recibida', params: {} }`; `#/nueva?recibida=1` y `#/nueva?borrador=b1&recibida=1` → `params` incluye `recibida: '1'` (y `borrador` si viene). `Vista` suma `'recibida'`.

- [ ] **Step 1: Tests que fallan**

`tests/vista-borradores.test.ts` (usar el borrador de ejemplo que ya tenga el archivo):

```ts
it('el borrador ofrece convertir con Claude y pegar la receta', () => {
  const html = renderBorrador({ borrador: BORRADOR, confirmando: false });
  expect(html).toContain('data-accion="convertir-con-claude"');
  expect(html).toContain('>Convertir con Claude<');
  expect(html).toContain('data-accion="pegar-receta"');
  expect(html.indexOf('convertir-con-claude')).toBeLessThan(html.indexOf('crear-receta'));
});

it('un aviso del borrador se muestra sin botón de reintentar', () => {
  const html = renderBorrador({ borrador: BORRADOR, confirmando: false, aviso: 'Lo copiado no es una receta en .md.' });
  expect(html).toContain('Lo copiado no es una receta en .md.');
  expect(html).not.toContain('data-accion="reintentar"');
});

it('Borradores ofrece pegar una receta', () => {
  expect(renderBorradores({ borradores: [] })).toContain('data-accion="pegar-receta"');
});

it('la pregunta lista los borradores y «Ninguno»', () => {
  const html = renderPreguntaBorrador({ borradores: [
    { id_archivo: 'b1', titulo: 'Focaccia <b>', capturado: '', nombre_archivo: '', fuente: '', nota: '' }
  ] as never });
  expect(html).toContain('¿De qué borrador es esta receta?');
  expect(html).toContain('data-accion="elegir-borrador-recibido" data-valor="b1"');
  expect(html).toContain('Focaccia &lt;b&gt;');
  expect(html).toContain('data-accion="elegir-borrador-recibido" data-valor=""');
  expect(html).toContain('>Ninguno<');
});
```

(Armar la `EntradaBorrador` con los campos reales de `src/tipos.ts` en vez de `as never` si es simple.)

`tests/router.test.ts`:

```ts
it('la pregunta del borrador y la receta recibida', () => {
  expect(parsearHash('#/recibida')).toEqual({ vista: 'recibida', params: {} });
  expect(parsearHash('#/nueva?recibida=1')).toEqual({ vista: 'nueva', params: { recibida: '1' } });
  expect(parsearHash('#/nueva?borrador=b1&recibida=1')).toEqual({ vista: 'nueva', params: { borrador: 'b1', recibida: '1' } });
  expect(parsearHash('#/nueva?borrador=b1')).toEqual({ vista: 'nueva', params: { borrador: 'b1' } });
});
```

- [ ] **Step 2: Correrlos y ver que fallan.**

- [ ] **Step 3: Implementar.**

`src/ui/router.ts` — `Vista` suma `'recibida'`; en `nueva`:

```ts
  if (partes[0] === 'nueva') {
    const p: Record<string, string> = {};
    if (params['borrador']) p['borrador'] = params['borrador'];
    // `recibida`: el editor abre con la receta que llegó de Claude (P28).
    if (params['recibida']) p['recibida'] = params['recibida'];
    return { vista: 'nueva', params: p };
  }
  if (partes[0] === 'recibida') return { vista: 'recibida', params: {} };
```

`src/ui/borradores.ts` — actualizar el comentario de cabecera («Ninguna acción de acá llama a un agente…»): ahora el borrador ofrece mandarlo a Claude, que convierte afuera, y recibir la receta de vuelta. Sumar los botones, `aviso` en las dos pantallas (`aviso({ texto })`, arriba del cuerpo, igual que `error`), y `renderPreguntaBorrador`:

```ts
/** A qué borrador corresponde una receta que llegó sin id, o con uno que ya no existe (P28). */
export function renderPreguntaBorrador({ borradores }: { borradores: EntradaBorrador[] }): string {
  const opciones = borradores.map(b =>
    `<button class="btn sec" data-accion="elegir-borrador-recibido" data-valor="${escapar(b.id_archivo)}">${escapar(b.titulo)}</button>`
  ).join('');
  return encabezado({ titulo: '¿De qué borrador es esta receta?', volver: true }) +
    '<div class="cuerpo denso"><div style="display:flex;flex-direction:column;gap:var(--e-2)">' +
      opciones +
      '<button class="btn sec" data-accion="elegir-borrador-recibido" data-valor="">Ninguno</button>' +
    '</div></div>';
}
```

- [ ] **Step 4: Correr todo** — `npx vitest run && npm run typecheck` → PASS.

- [ ] **Step 5: Commit local**

```bash
git add src/ui/borradores.ts src/ui/router.ts tests/
git commit -m "Los botones de Claude en el borrador y la pregunta de a qué borrador va"
```

---

### Task 4: El cableado

**Files:**
- Modify: `src/main.ts`
- Test: `tests/main-rutas.test.ts`

**Interfaces:**
- Consumes: `pedidoDeConversion`, `esRecetaEnMd`, `recetaRecibida` (Task 1); `enviarAClaude`, `leerPortapapeles`, `plataformaDelNavegador` (Task 2); `renderPreguntaBorrador`, `aviso` en `renderBorrador`/`renderBorradores`, vista `recibida`, parámetro `recibida` (Task 3).

- [ ] **Step 1: Tests que fallan** — en `tests/main-rutas.test.ts`, con los helpers reales (`montar`, `abrir`, `tocar`, `estado`, `storeFake`). Para la plataforma, inyectar dobles de `navigator.share` / `navigator.clipboard` / `window.open` en el `global` que arma el archivo, restaurándolos en `finally`. Casos:

1. **Convertir con Claude sin menú Compartir:** con `estado.borradores = [{ id: 'b1', titulo: 'Focaccia', fuente: 'https://x', nota: '', capturado: '' }]`, abrir `#/borradores/b1`, `tocar('convertir-con-claude')` → `window.open` recibió un link que empieza con `https://claude.ai/new?q=` y contiene `borrador%3A%20b1`.
2. **Compartir una receta con id válido:** abrir `#/capturar?text=` + `encodeURIComponent('---\ntitulo: Focaccia\nborrador: b1\n---\n\n## Preparación\n1. Hornear.\n')` → el hash queda en `#/nueva?borrador=b1&recibida=1`, el editor muestra `value="Focaccia"`, no contiene `borrador: b1` ni un campo `borrador`, y lleva `data-valor="incompleta" aria-pressed="true"`.
3. **Compartir una receta sin id:** → el hash queda en `#/recibida` y la pantalla dice «¿De qué borrador es esta receta?». `tocar('elegir-borrador-recibido', { valor: '' })` → `#/nueva?recibida=1` con `value="Focaccia"`. Con `{ valor: 'b1' }` → `#/nueva?borrador=b1&recibida=1`.
4. **Compartir una receta con un id que no existe** → `#/recibida`.
5. **Compartir algo que no es receta** (`?text=hola`) → sigue dibujando la captura (lo que hoy prueba el archivo para `capturar`).
6. **Pegar receta en el borrador:** con `navigator.clipboard.readText` devolviendo una receta con `borrador: otro`, abrir `#/borradores/b1`, `tocar('pegar-receta')` → `#/nueva?borrador=b1&recibida=1`.
7. **Pegar receta en Borradores sin id** → `#/recibida`.
8. **Pegar algo que no es receta** → sigue en el borrador y muestra «Lo copiado no es una receta en .md.». **Portapapeles bloqueado** (`readText` rechaza) → «No pude leer lo copiado.».
9. **El editor con la receta recibida cuenta como cambios sin guardar:** abierto por el caso 2, navegar a otra pantalla → aparece `data-salida` («¿Salir sin guardar los cambios?»).
10. **Guardar atado a un borrador convierte:** desde el caso 2, completar el formulario como los tests existentes de guardar desde borrador (`estado.formulario` con `carpeta`) y `tocar('guardar')` → el borrador `b1` se descartó (`estado.descartados` contiene `b1`) y se creó la receta. Si el archivo ya tiene un test de «guardar desde un borrador convierte», reusar su forma.

Si un caso necesita más del doble del DOM de lo que hay, extenderlo lo mínimo y anotarlo.

- [ ] **Step 2: Correrlos y ver que fallan.**

- [ ] **Step 3: Implementar** — `src/main.ts`:

Estado, junto a los demás:

```ts
/**
 * La receta que llegó de Claude —compartida o pegada— mientras se decide a qué
 * borrador va y se revisa en el editor (P28). Vive en memoria: el `.md` puede
 * ser largo para el hash.
 */
let recibida: Receta | null = null;
let avisoBorradores = '';
```

En el bloque `cambiaDePantalla`, limpiar `avisoBorradores = ''`, y `recibida = null` salvo que la vista nueva sea `recibida` o `nueva` con `params.recibida`.

Una función que decide a dónde va lo recibido:

```ts
/** Lo recibido va al editor del borrador del id si existe; si no, a la pregunta. */
function recibirReceta(texto: string, borradorElegido?: string): void {
  const { receta, borradorId } = recetaRecibida(texto);
  recibida = receta;
  const id = borradorElegido ?? borradorId;
  const existe = !!id && store.borradores().some(b => b.id_archivo === id);
  location.hash = existe ? `#/nueva?borrador=${encodeURIComponent(id)}&recibida=1` : '#/recibida';
}
```

`case 'capturar'`: al principio,

```ts
      const compartido = ruta.params['text'] || '';
      if (esRecetaEnMd(compartido)) { recibirReceta(compartido); return; }
```

Nuevo `case 'recibida'`: si `!recibida`, ir a `#/borradores` con `irCerrando`; si no, `pintar(renderPreguntaBorrador({ borradores: store.borradores() }))`.

`case 'nueva'`: si `ruta.params['recibida'] && recibida`, usar `recibida` como receta (sin mezclar la nota del borrador) en vez de `parse('')` y los datos del borrador; poner `incompleta` como hoy; `abrirEditor(...)`, y después marcar el formulario como distinto de la foto para que salir pregunte: `if (editorAbierto) editorAbierto.formulario = '';`. Si `recibida` pide `recibida=1` pero ya no hay receta en memoria (recarga), abrir como hoy.

`guardar`: cuando `vistaActual.params.recibida` y `recibida`, la `base` es `recibida` en vez de `parse('')`, así se conservan las claves desconocidas; al guardar bien, `recibida = null`.

Acciones:

```ts
  if (accion === 'convertir-con-claude') {
    const b = borradorLeido;
    if (!b) return;
    const r = await enviarAClaude(plataformaDelNavegador(),
      pedidoDeConversion({ id: b.id_archivo, titulo: b.titulo, fuente: b.fuente, nota: b.nota }));
    if (r === 'copiado') { avisoBorradores = 'Pedido copiado: pegalo en Claude'; return render(); }
    return;
  }
  if (accion === 'pegar-receta') {
    const texto = await leerPortapapeles(plataformaDelNavegador());
    if (texto === null) { avisoBorradores = 'No pude leer lo copiado.'; return render(); }
    if (!esRecetaEnMd(texto)) { avisoBorradores = 'Lo copiado no es una receta en .md.'; return render(); }
    avisoBorradores = '';
    const enBorrador = vistaActual?.vista === 'borrador' ? vistaActual.params['id'] : undefined;
    return recibirReceta(texto, enBorrador);
  }
  if (accion === 'elegir-borrador-recibido') {
    if (!recibida) return;
    const id = boton.dataset['valor'] ?? '';
    location.hash = id ? `#/nueva?borrador=${encodeURIComponent(id)}&recibida=1` : '#/nueva?recibida=1';
    return;
  }
```

Usar los nombres reales de los campos del borrador leído (`borradorLeido`) y de `Borrador` en `tipos.ts`. Pasar `aviso: avisoBorradores` (si no es vacío) a `renderBorrador` y `renderBorradores` en sus `case`. Si `pegar-receta` en el borrador recibe un id propio, `recibirReceta(texto, id)` abre directo el editor de ese borrador.

- [ ] **Step 4: Correr todo** — `npx vitest run && npm run typecheck && npm run build` → PASS.

- [ ] **Step 5: Commit local**

```bash
git add src/main.ts tests/
git commit -m "Convertir con Claude: mandar el pedido y recibir la receta de vuelta"
```

---

### Task 5: El skill y los documentos

**Files:**
- Modify: `skills/recetario/SKILL.md`, `product-design/plan/decision-log.md`, `product-design/plan/BACKLOG.md`, `product-design/product/specs/E01-CapturaYBorradores.md`, `CLAUDE.md`, `docs/superpowers/specs/2026-09-16-convertir-con-claude-design.md`

- [ ] **Step 1: `SKILL.md`** — una sección corta: además de subir el `.md` a Drive, la receta se puede devolver a la app compartiendo la respuesta a Recetario (Android) o copiándola y tocando «Pegar receta» en Borradores. La app la abre en el editor y la guarda con su fila del índice. Si viene de un borrador, la última línea del frontmatter es `borrador: <id>`.

- [ ] **Step 2: `decision-log.md`** — una fila al final, con las columnas reales de la tabla:
  - **Decisión:** convertir un borrador con Claude sin modelo en la app: la app arma el pedido y recibe la receta en `.md` compartida o pegada.
  - **Contexto:** P28; la app es estática y no puede guardar una API key ajena; el conector de Drive de claude.ai no escribe planillas (P14).
  - **Alternativas descartadas:** la API key del usuario guardada en el navegador; un proxy en la nube con la key; que el agente escriba en Drive; que Claude sugiera la categoría; que la app recuerde el último borrador enviado; preguntar siempre de qué borrador es; las reglas del formato sólo en el skill.
  - **Rationale:** sin infraestructura ni costo de API; la vuelta es independiente de la ida, así una receta empezada en Claude también llega; el pedido se arma desde las constantes y no se desactualiza; nada se guarda sin revisar en el editor.
  - **Consecuencias:** `conversion.ts`, `compartir.ts`, `borradores.ts`, `router.ts`, `main.ts`. El skill ya no necesita escribir en Drive para cargar una receta.

- [ ] **Step 3: `BACKLOG.md`** — P28 **Resuelto** `[2026-09-16]` con resumen y spec; P14 suma nota fechada: la receta se devuelve a la app compartida o pegada, así que el skill ya no necesita escribir en Drive; queda rehacerlo para que produzca ese `.md`.

- [ ] **Step 4: `E01-CapturaYBorradores.md`** — con nota `[cambio del 2026-09-16]`: los botones «Convertir con Claude» y «Pegar receta», la captura que reconoce una receta en `.md`, y la pregunta «¿De qué borrador es esta receta?».

- [ ] **Step 5: `CLAUDE.md`** — bloque «Hecho el 2026-09-16 — convertir un borrador con Claude (P28)» con spec y plan, y que queda probarlo en el teléfono y en la Mac (§6 del spec); P28 sale de pendientes; «Para retomar» lo nombra.

- [ ] **Step 6: el spec** — «Estado» pasa a «Implementado».

- [ ] **Step 7: Commit local**

```bash
git add skills product-design CLAUDE.md docs/superpowers/specs
git commit -m "El skill y los documentos dicen cómo se convierte un borrador con Claude"
```

---

## Verificación final

La del §6 del spec.
