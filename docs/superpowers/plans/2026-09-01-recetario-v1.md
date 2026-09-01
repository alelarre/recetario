# Recetario v1 — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una PWA de archivos estáticos que lee y escribe recetas `.md` en Google Drive, indexadas en una planilla, usable desde el celular y sin backend.

**Architecture:** Módulos ES sin framework. El núcleo puro (`recipe.js`, `catalogo.js`) no toca la red y se testea entero en memoria; `drive.js` y `sheets.js` son clientes crudos de las APIs de Google; `store.js` los combina con un cache y es la única cara que ve la UI. Las vistas son funciones que renderizan sobre el DOM y consultan el store.

**Tech Stack:** JavaScript ES2022 (sin TypeScript), Vite como build y dev server, Vitest como runner de tests, sin dependencias de runtime. Google Identity Services para el token, Drive API v3 y Sheets API v4 por `fetch`.

**Spec:** `docs/superpowers/specs/2026-08-31-recetario-design.md`

## Global Constraints

- **Idioma:** todo en español rioplatense — identificadores, comentarios, textos de UI y nombres de archivo. Los nombres de campo del frontmatter y de las columnas del índice se escriben exactamente como el spec: `titulo`, `tags`, `rinde`, `tiempo`, `dificultad`, `fuente`; `id_archivo`, `nombre_archivo`, `titulo`, `categoria`, `carpeta_id`, `rinde`, `tiempo`, `dificultad`, `fuente`, `tags`, `ingredientes`, `foto`, `mtime`.
- **Un único scope OAuth:** `https://www.googleapis.com/auth/drive` (§4.4).
- **Ningún id de Drive hardcodeado.** Carpeta y planilla se ubican por nombre (§5.1). El único valor de configuración es el client ID: `670194416271-psq474ahahgia41v9frctqaom4to7cio.apps.googleusercontent.com`.
- **Nombres reservados en Drive:** carpeta raíz `Recetario`, planilla `_indice`, carpeta de fotos `_fotos`. Todo nombre que empieza con `_` no es una categoría (§3.1).
- **Nada de recorrer subcarpetas ni leer `.md` en el arranque** (§5.1). La única operación que lee todos los `.md` es la reconstrucción (§5.3).
- **Un `.md` malformado nunca puede romper la app** (§8). Requisito duro: cualquier función de parseo devuelve algo usable o avisos, nunca lanza.
- **Sin dependencias de runtime.** `package.json` solo tiene devDependencies. Nada de frameworks, ni librerías de YAML o Markdown: el parser es propio porque el esquema es cerrado (§3.2).
- **Medidas en `rem`, nunca en píxeles fijos** (§7.3). Área táctil mínima 44 px.
- **Node 20 o superior**, npm como gestor.

## Estructura de archivos

| archivo | responsabilidad |
|---|---|
| `index.html` | punto de entrada, monta `#app` |
| `vite.config.js` | `base` para GitHub Pages, config de Vitest |
| `src/config.js` | client ID, scope, nombres reservados, `SCHEMA_VERSION` |
| `src/recipe.js` | puro: `parse`, `serialize`, ingredientes, slug del nombre de archivo |
| `src/catalogo.js` | puro: receta ↔ fila de la planilla, y el diff de cambios |
| `src/auth.js` | token de Google: pedirlo, renovarlo silenciosamente |
| `src/drive.js` | cliente crudo de Drive v3 |
| `src/sheets.js` | cliente crudo de Sheets v4 |
| `src/cache.js` | IndexedDB: índice, cuerpos LRU, mapa de filas, cola de escrituras |
| `src/store.js` | arranque, sync, búsqueda, guardado, reconstrucción |
| `src/ui/tokens.css` | los tokens del §7.3, y nada más |
| `src/ui/app.css` | layout y componentes, consumiendo tokens |
| `src/ui/router.js` | hash routing y stack de navegación |
| `src/ui/home.js` | grilla de categorías y menú de overflow |
| `src/ui/lista.js` | lista de categoría y resultados de búsqueda |
| `src/ui/detalle.js` | portada, pestañas, pasos marcables |
| `src/ui/visor.js` | visor de fotos a pantalla completa |
| `src/ui/editor.js` | formulario de edición y alta |
| `src/sw.js` | service worker del app shell |
| `tests/*.test.js` | unitarios de los módulos puros y del store con dobles |

Los tests viven en `tests/`, uno por módulo. `store.js` recibe sus dependencias por parámetro, así que se testea con un Drive y un Sheets falsos en memoria, sin tocar red ni IndexedDB (§9).

---

### Task 1: Andamiaje del proyecto

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `.gitignore` (modificar), `src/config.js`
- Test: `tests/config.test.js`

**Interfaces:**
- Consumes: nada.
- Produces: `npm test` y `npm run dev` funcionando. `src/config.js` exporta `CLIENT_ID`, `SCOPE`, `NOMBRE_RAIZ`, `NOMBRE_INDICE`, `NOMBRE_FOTOS`, `SCHEMA_VERSION`.

- [ ] **Step 1: Inicializar el proyecto e instalar las herramientas**

```bash
cd /Users/alelarre/Documents/recetario
npm init -y
npm install --save-dev vite vitest
npm pkg set type=module
npm pkg set scripts.dev="vite"
npm pkg set scripts.build="vite build"
npm pkg set scripts.test="vitest run"
npm pkg set scripts.test:watch="vitest"
```

- [ ] **Step 2: Escribir el test de configuración**

```javascript
// tests/config.test.js
import { describe, it, expect } from 'vitest';
import { CLIENT_ID, SCOPE, NOMBRE_RAIZ, NOMBRE_INDICE, NOMBRE_FOTOS, SCHEMA_VERSION } from '../src/config.js';

describe('config', () => {
  it('usa el scope amplio de Drive, no drive.file', () => {
    expect(SCOPE).toBe('https://www.googleapis.com/auth/drive');
  });

  it('no hardcodea ids de Drive, solo nombres', () => {
    expect(NOMBRE_RAIZ).toBe('Recetario');
    expect(NOMBRE_INDICE).toBe('_indice');
    expect(NOMBRE_FOTOS).toBe('_fotos');
  });

  it('tiene un client ID de Google', () => {
    expect(CLIENT_ID).toMatch(/\.apps\.googleusercontent\.com$/);
  });

  it('declara una versión de esquema entera', () => {
    expect(Number.isInteger(SCHEMA_VERSION)).toBe(true);
  });
});
```

- [ ] **Step 3: Correr el test y verificar que falla**

Run: `npm test`
Expected: FAIL — no existe `src/config.js`.

- [ ] **Step 4: Escribir la configuración y el andamiaje**

```javascript
// src/config.js
export const CLIENT_ID = '670194416271-psq474ahahgia41v9frctqaom4to7cio.apps.googleusercontent.com';

// drive.file no alcanza: es por archivo y no ve los .md que escriben los
// agentes por fuera de la app. Medido el 2026-09-01, ver §4.4 del spec.
export const SCOPE = 'https://www.googleapis.com/auth/drive';

export const NOMBRE_RAIZ = 'Recetario';
export const NOMBRE_INDICE = '_indice';
export const NOMBRE_FOTOS = '_fotos';

// Subir esta versión fuerza una reconstrucción del índice en el próximo arranque.
export const SCHEMA_VERSION = 1;
```

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages sirve el sitio bajo /recetario/
  base: '/recetario/',
  test: { environment: 'node' }
});
```

```html
<!-- index.html -->
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>Recetario</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

```javascript
// src/main.js
document.querySelector('#app').textContent = 'Recetario';
```

Agregar a `.gitignore`: `node_modules/` ya está; agregar `dist/` ya está. Nada nuevo.

- [ ] **Step 5: Correr los tests y verificar que pasan**

Run: `npm test`
Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.js index.html src/ tests/
git commit -m "Andamiaje: Vite, Vitest y la configuración sin ids hardcodeados"
```

---

### Task 2: `recipe.js` — parseo del frontmatter

**Files:**
- Create: `src/recipe.js`
- Test: `tests/recipe-frontmatter.test.js`

**Interfaces:**
- Consumes: nada.
- Produces: `parse(texto) → Receta`. `Receta` es un objeto plano con: `titulo` (string|null), `tags` (string[]), `rinde`/`tiempo`/`dificultad`/`fuente` (string|null), `extras` (objeto con las claves desconocidas tal cual), `descripcion`/`ingredientes`/`preparacion`/`variaciones`/`notas` (string, vacío si no está), `otras` (array de `{encabezado, cuerpo}`) y `avisos` (string[]). También exporta `normalizar(texto)`.

- [ ] **Step 1: Escribir los tests que fallan**

```javascript
// tests/recipe-frontmatter.test.js
import { describe, it, expect } from 'vitest';
import { parse, normalizar } from '../src/recipe.js';

const COMPLETA = `---
titulo: Milanesas napolitanas
tags: [italiana, horno, rápido]
rinde: 4 porciones
tiempo: 40 min
dificultad: fácil
fuente: Cuaderno de mamá, p. 12
---

Un clásico de los domingos.
`;

describe('parse — frontmatter', () => {
  it('lee las seis claves conocidas', () => {
    const r = parse(COMPLETA);
    expect(r.titulo).toBe('Milanesas napolitanas');
    expect(r.tags).toEqual(['italiana', 'horno', 'rápido']);
    expect(r.rinde).toBe('4 porciones');
    expect(r.tiempo).toBe('40 min');
    expect(r.dificultad).toBe('fácil');
    expect(r.fuente).toBe('Cuaderno de mamá, p. 12');
    expect(r.avisos).toEqual([]);
  });

  it('acepta tags en lista de guiones además de la lista corta', () => {
    const r = parse(`---\ntitulo: X\ntags:\n  - horno\n  - rápido\n---\n`);
    expect(r.tags).toEqual(['horno', 'rápido']);
  });

  it('deja en null lo que falta, sin inventar', () => {
    const r = parse(`---\ntitulo: Solo título\n---\n`);
    expect(r.titulo).toBe('Solo título');
    expect(r.rinde).toBeNull();
    expect(r.dificultad).toBeNull();
    expect(r.tags).toEqual([]);
  });

  it('preserva las claves desconocidas en extras', () => {
    const r = parse(`---\ntitulo: X\nautor_agente: claude\n---\n`);
    expect(r.extras).toEqual({ autor_agente: 'claude' });
  });

  it('sin titulo avisa, pero devuelve una receta usable', () => {
    const r = parse(`---\nrinde: 2\n---\n\nTexto suelto.\n`);
    expect(r.titulo).toBeNull();
    expect(r.avisos).toContain('sin-titulo');
    expect(r.descripcion).toBe('Texto suelto.');
  });

  it('sin frontmatter trata todo como cuerpo y avisa', () => {
    const r = parse('Una receta pegada de cualquier lado.\n');
    expect(r.titulo).toBeNull();
    expect(r.avisos).toContain('sin-frontmatter');
    expect(r.descripcion).toBe('Una receta pegada de cualquier lado.');
  });

  it('con frontmatter ilegible rescata lo que puede y no lanza', () => {
    const r = parse(`---\ntitulo: X\n:::basura:::\n---\n\nCuerpo.\n`);
    expect(r.titulo).toBe('X');
    expect(r.avisos).toContain('frontmatter-ilegible');
    expect(r.descripcion).toBe('Cuerpo.');
  });
});

describe('normalizar', () => {
  it('baja a minúsculas y saca tildes', () => {
    expect(normalizar('Fácil')).toBe('facil');
    expect(normalizar('PREPARACIÓN')).toBe('preparacion');
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/recipe-frontmatter.test.js`
Expected: FAIL — no existe `src/recipe.js`.

- [ ] **Step 3: Implementar el parseo del frontmatter**

```javascript
// src/recipe.js

const CLAVES = ['titulo', 'tags', 'rinde', 'tiempo', 'dificultad', 'fuente'];

/** Minúsculas y sin tildes. Es la única normalización del sistema (§3.2). */
export function normalizar(texto) {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // marcas de combinación
    .toLowerCase()
    .trim();
}

function recetaVacia() {
  return {
    titulo: null, tags: [], rinde: null, tiempo: null, dificultad: null, fuente: null,
    extras: {},
    descripcion: '', ingredientes: '', preparacion: '', variaciones: '', notas: '',
    otras: [], avisos: []
  };
}

function parsearLista(valor, resto) {
  // Formato corto: [a, b, c]
  const corta = valor.match(/^\[(.*)\]$/);
  if (corta) {
    return corta[1].split(',').map(s => s.trim()).filter(Boolean);
  }
  // Formato largo: líneas siguientes que empiezan con guión
  const items = [];
  for (const linea of resto) {
    const m = linea.match(/^\s*-\s+(.*)$/);
    if (!m) break;
    items.push(m[1].trim());
  }
  return items;
}

function parsearFrontmatter(bloque, receta) {
  const lineas = bloque.split('\n');
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    if (!linea.trim()) continue;
    if (/^\s*-\s+/.test(linea)) continue; // ya consumida por una lista
    const m = linea.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!m) { receta.avisos.push('frontmatter-ilegible'); continue; }
    const [, clave, valor] = m;
    if (clave === 'tags') {
      receta.tags = parsearLista(valor.trim(), lineas.slice(i + 1));
    } else if (CLAVES.includes(clave)) {
      receta[clave] = valor.trim() === '' ? null : valor.trim();
    } else {
      receta.extras[clave] = valor.trim();
    }
  }
}

export function parse(texto) {
  const receta = recetaVacia();
  const fuente = String(texto ?? '');

  const m = fuente.match(/^---\n([\s\S]*?)\n---\n?/);
  let cuerpo = fuente;
  if (m) {
    parsearFrontmatter(m[1], receta);
    cuerpo = fuente.slice(m[0].length);
  } else {
    receta.avisos.push('sin-frontmatter');
  }

  if (!receta.titulo) receta.avisos.push('sin-titulo');
  receta.avisos = [...new Set(receta.avisos)];

  parsearCuerpo(cuerpo, receta);
  return receta;
}

// Implementada en la tarea siguiente; por ahora todo el cuerpo es descripción.
function parsearCuerpo(cuerpo, receta) {
  receta.descripcion = cuerpo.trim();
}
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npx vitest run tests/recipe-frontmatter.test.js`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/recipe.js tests/recipe-frontmatter.test.js
git commit -m "recipe.js: frontmatter con claves cerradas y extras preservados"
```

---

### Task 3: `recipe.js` — parseo del cuerpo

**Files:**
- Modify: `src/recipe.js` (reemplazar `parsearCuerpo`)
- Test: `tests/recipe-cuerpo.test.js`

**Interfaces:**
- Consumes: `parse` de la Task 2.
- Produces: `parse` completa `descripcion`, `ingredientes`, `preparacion`, `variaciones`, `notas` y `otras`. Cada sección es el texto crudo debajo del `##`, sin el encabezado, con las subsecciones `###` adentro.

- [ ] **Step 1: Escribir los tests que fallan**

```javascript
// tests/recipe-cuerpo.test.js
import { describe, it, expect } from 'vitest';
import { parse } from '../src/recipe.js';

const RECETA = `---
titulo: Milanesas napolitanas
---

Un clásico de los domingos.

## Ingredientes
### Para la milanesa
- 4 milanesas de nalga

### Para la salsa
- 1 lata de tomate triturado

## Preparación
1. Precalentar el horno.
2. Hornear 15 minutos.

## Variaciones
### A la suiza
Salsa blanca y gruyere.

## Notas
- Bajar a 180 °C.
`;

describe('parse — cuerpo', () => {
  it('separa la descripción de las secciones', () => {
    const r = parse(RECETA);
    expect(r.descripcion).toBe('Un clásico de los domingos.');
  });

  it('conserva las subsecciones ### dentro de su sección', () => {
    const r = parse(RECETA);
    expect(r.ingredientes).toContain('### Para la milanesa');
    expect(r.ingredientes).toContain('- 1 lata de tomate triturado');
    expect(r.ingredientes).not.toContain('## Preparación');
  });

  it('lee preparación, variaciones y notas', () => {
    const r = parse(RECETA);
    expect(r.preparacion).toContain('1. Precalentar el horno.');
    expect(r.variaciones).toContain('### A la suiza');
    expect(r.notas).toBe('- Bajar a 180 °C.');
  });

  it('reconoce los encabezados normalizando: sin tildes y en cualquier caja', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## INGREDIENTES\n- sal\n\n## preparacion\n1. Cocinar.\n`);
    expect(r.ingredientes).toBe('- sal');
    expect(r.preparacion).toBe('1. Cocinar.');
  });

  it('preserva las secciones desconocidas en otras, con su encabezado', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## Maridaje\nUn malbec joven.\n\n## Notas\n- ojo\n`);
    expect(r.otras).toEqual([{ encabezado: 'Maridaje', cuerpo: 'Un malbec joven.' }]);
    expect(r.notas).toBe('- ojo');
  });

  it('una receta sin ninguna sección deja todo vacío y no rompe', () => {
    const r = parse(`---\ntitulo: X\n---\n`);
    expect(r.descripcion).toBe('');
    expect(r.ingredientes).toBe('');
    expect(r.otras).toEqual([]);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/recipe-cuerpo.test.js`
Expected: FAIL — todo el cuerpo cae en `descripcion`.

- [ ] **Step 3: Implementar el parseo del cuerpo**

```javascript
// src/recipe.js — reemplaza la función parsearCuerpo de la Task 2

const SECCIONES = {
  ingredientes: 'ingredientes',
  preparacion: 'preparacion',
  variaciones: 'variaciones',
  notas: 'notas'
};

function parsearCuerpo(cuerpo, receta) {
  const lineas = String(cuerpo).split('\n');
  let destino = 'descripcion';
  let encabezadoOtra = null;
  let buffer = [];

  const volcar = () => {
    const texto = buffer.join('\n').trim();
    buffer = [];
    if (!texto) { encabezadoOtra = null; return; }
    if (destino === 'otra') receta.otras.push({ encabezado: encabezadoOtra, cuerpo: texto });
    else receta[destino] = texto;
    encabezadoOtra = null;
  };

  for (const linea of lineas) {
    const m = linea.match(/^##\s+(.+?)\s*$/);
    if (m && !linea.startsWith('###')) {
      volcar();
      const clave = SECCIONES[normalizar(m[1])];
      if (clave) { destino = clave; } else { destino = 'otra'; encabezadoOtra = m[1]; }
      continue;
    }
    buffer.push(linea);
  }
  volcar();
}
```

- [ ] **Step 4: Correr toda la suite y verificar que pasa**

Run: `npm test`
Expected: PASS — los tests de la Task 2 siguen verdes y los 6 nuevos también.

- [ ] **Step 5: Commit**

```bash
git add src/recipe.js tests/recipe-cuerpo.test.js
git commit -m "recipe.js: secciones del cuerpo, con las desconocidas preservadas"
```

---

### Task 4: `recipe.js` — serialización y round-trip

**Files:**
- Modify: `src/recipe.js`
- Test: `tests/recipe-serialize.test.js`

**Interfaces:**
- Consumes: `parse`.
- Produces: `serialize(receta) → string`. Emite el frontmatter con las seis claves conocidas presentes en ese orden, después los `extras`, y el cuerpo en el orden canónico del §3.2: descripción, Ingredientes, Preparación, Variaciones, Notas, y al final las `otras`.

- [ ] **Step 1: Escribir los tests que fallan**

```javascript
// tests/recipe-serialize.test.js
import { describe, it, expect } from 'vitest';
import { parse, serialize } from '../src/recipe.js';

const ORIGINAL = `---
titulo: Milanesas napolitanas
tags: [italiana, horno]
rinde: 4 porciones
tiempo: 40 min
dificultad: fácil
fuente: Cuaderno de mamá
---

Un clásico.

## Ingredientes
- 4 milanesas

## Preparación
1. Hornear.

## Variaciones
### A la suiza
Gruyere.

## Notas
- Ojo con el horno.
`;

describe('serialize', () => {
  it('hace round-trip sin perder nada', () => {
    expect(serialize(parse(ORIGINAL))).toBe(ORIGINAL);
  });

  it('omite las claves vacías en vez de escribirlas en null', () => {
    const texto = serialize(parse(`---\ntitulo: X\n---\n`));
    expect(texto).toBe('---\ntitulo: X\n---\n');
  });

  it('escribe las secciones en el orden canónico aunque vengan al revés', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## Notas\n- b\n\n## Ingredientes\n- a\n`);
    const texto = serialize(r);
    expect(texto.indexOf('## Ingredientes')).toBeLessThan(texto.indexOf('## Notas'));
  });

  it('serializa las secciones desconocidas al final, después de Notas', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## Maridaje\nMalbec.\n\n## Notas\n- a\n`);
    const texto = serialize(r);
    expect(texto.indexOf('## Notas')).toBeLessThan(texto.indexOf('## Maridaje'));
    expect(texto).toContain('## Maridaje\nMalbec.');
  });

  it('preserva las claves desconocidas del frontmatter', () => {
    const texto = serialize(parse(`---\ntitulo: X\nautor_agente: claude\n---\n`));
    expect(texto).toContain('autor_agente: claude');
  });

  it('sobrevive a un round-trip doble sin cambiar', () => {
    const una = serialize(parse(ORIGINAL));
    expect(serialize(parse(una))).toBe(una);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/recipe-serialize.test.js`
Expected: FAIL — `serialize` no está exportada.

- [ ] **Step 3: Implementar la serialización**

```javascript
// src/recipe.js — agregar

const ORDEN_CUERPO = [
  ['ingredientes', 'Ingredientes'],
  ['preparacion', 'Preparación'],
  ['variaciones', 'Variaciones'],
  ['notas', 'Notas']
];

export function serialize(receta) {
  const fm = [];
  if (receta.titulo) fm.push(`titulo: ${receta.titulo}`);
  if (receta.tags?.length) fm.push(`tags: [${receta.tags.join(', ')}]`);
  for (const clave of ['rinde', 'tiempo', 'dificultad', 'fuente']) {
    if (receta[clave]) fm.push(`${clave}: ${receta[clave]}`);
  }
  for (const [clave, valor] of Object.entries(receta.extras ?? {})) {
    fm.push(`${clave}: ${valor}`);
  }

  const partes = [];
  if (receta.descripcion) partes.push(receta.descripcion);
  for (const [clave, encabezado] of ORDEN_CUERPO) {
    if (receta[clave]) partes.push(`## ${encabezado}\n${receta[clave]}`);
  }
  for (const otra of receta.otras ?? []) {
    partes.push(`## ${otra.encabezado}\n${otra.cuerpo}`);
  }

  const cabecera = fm.length ? `---\n${fm.join('\n')}\n---\n` : '';
  const cuerpo = partes.length ? `\n${partes.join('\n\n')}\n` : '';
  return cabecera + cuerpo;
}
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/recipe.js tests/recipe-serialize.test.js
git commit -m "recipe.js: serialización en orden canónico, con round-trip estable"
```

---

### Task 5: `recipe.js` — ingredientes, portada y nombre de archivo

**Files:**
- Modify: `src/recipe.js`
- Test: `tests/recipe-derivados.test.js`

**Interfaces:**
- Consumes: `parse`, `normalizar`.
- Produces:
  - `parseIngrediente(linea) → {cantidad: string|null, unidad: string|null, item: string, crudo: string}`
  - `ingredientesIndexables(receta) → string[]` — los `item` en minúsculas, sin repetir, para la columna K.
  - `primeraImagen(receta) → string|null` — la URL del primer `![](…)` del cuerpo, en orden de serialización.
  - `slugArchivo(titulo, existentes = []) → string` — `'Milanesas napolitanas'` → `'milanesas-napolitanas.md'`.

- [ ] **Step 1: Escribir los tests que fallan**

```javascript
// tests/recipe-derivados.test.js
import { describe, it, expect } from 'vitest';
import { parse, parseIngrediente, ingredientesIndexables, primeraImagen, slugArchivo } from '../src/recipe.js';

describe('parseIngrediente', () => {
  it('separa cantidad, unidad e item', () => {
    expect(parseIngrediente('- 200 g de muzzarella')).toEqual({
      cantidad: '200', unidad: 'g', item: 'muzzarella', crudo: '- 200 g de muzzarella'
    });
  });

  it('acepta cantidad sin unidad', () => {
    const r = parseIngrediente('- 4 milanesas de nalga');
    expect(r.cantidad).toBe('4');
    expect(r.item).toBe('milanesas de nalga');
  });

  it('acepta fracciones y decimales', () => {
    expect(parseIngrediente('- 1/2 taza de leche').cantidad).toBe('1/2');
    expect(parseIngrediente('- 1,5 kg de papas').cantidad).toBe('1,5');
  });

  it('lo que no matchea se devuelve entero como item, sin perder nada', () => {
    const r = parseIngrediente('- sal y pimienta a gusto');
    expect(r.cantidad).toBeNull();
    expect(r.unidad).toBeNull();
    expect(r.item).toBe('sal y pimienta a gusto');
  });

  it('ignora los encabezados de subsección', () => {
    expect(parseIngrediente('### Para la salsa')).toBeNull();
  });
});

describe('ingredientesIndexables', () => {
  it('devuelve los items en minúsculas, sin repetidos ni subsecciones', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## Ingredientes\n### Para la salsa\n- 200 g de Muzzarella\n- 1 lata de tomate\n- 200 g de muzzarella\n`);
    expect(ingredientesIndexables(r)).toEqual(['muzzarella', 'tomate']);
  });
});

describe('primeraImagen', () => {
  it('toma la primera del documento en orden de serialización', () => {
    const r = parse(`---\ntitulo: X\n---\n\n![](https://a/1)\n\n## Preparación\n![](https://a/2)\n`);
    expect(primeraImagen(r)).toBe('https://a/1');
  });

  it('la encuentra aunque esté en una sección y no en la descripción', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## Preparación\n![](https://a/2)\n`);
    expect(primeraImagen(r)).toBe('https://a/2');
  });

  it('devuelve null si no hay ninguna', () => {
    expect(primeraImagen(parse(`---\ntitulo: X\n---\n`))).toBeNull();
  });
});

describe('slugArchivo', () => {
  it('baja a minúsculas, saca tildes y usa guiones', () => {
    expect(slugArchivo('Milanesas napolitanas')).toBe('milanesas-napolitanas.md');
    expect(slugArchivo('Ñoquis del 29')).toBe('noquis-del-29.md');
  });

  it('saca la puntuación y no deja guiones dobles ni en los bordes', () => {
    expect(slugArchivo('  ¡Torta: de manzana!  ')).toBe('torta-de-manzana.md');
  });

  it('agrega sufijo numérico si el nombre ya existe en la carpeta', () => {
    expect(slugArchivo('Pan', ['pan.md'])).toBe('pan-2.md');
    expect(slugArchivo('Pan', ['pan.md', 'pan-2.md'])).toBe('pan-3.md');
  });

  it('un título vacío cae en un nombre usable', () => {
    expect(slugArchivo('')).toBe('sin-titulo.md');
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/recipe-derivados.test.js`
Expected: FAIL — las cuatro funciones no existen.

- [ ] **Step 3: Implementar**

```javascript
// src/recipe.js — agregar

const UNIDADES = ['g', 'kg', 'mg', 'ml', 'l', 'cc', 'taza', 'tazas', 'cda', 'cdas',
  'cdta', 'cdtas', 'cucharada', 'cucharadas', 'cucharadita', 'cucharaditas',
  'pizca', 'diente', 'dientes', 'lata', 'latas', 'paquete', 'paquetes'];

/** Best-effort a propósito (§3.2): lo que no matchea se muestra tal cual. */
export function parseIngrediente(linea) {
  const crudo = String(linea ?? '');
  const limpia = crudo.replace(/^\s*[-*]\s+/, '').trim();
  if (!limpia || limpia.startsWith('#')) return null;

  const m = limpia.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?)\s+(.*)$/);
  if (!m) return { cantidad: null, unidad: null, item: limpia, crudo };

  let [, cantidad, resto] = m;
  let unidad = null;
  const primera = resto.split(/\s+/)[0];
  if (UNIDADES.includes(normalizar(primera))) {
    unidad = primera;
    resto = resto.slice(primera.length).trim();
  }
  return { cantidad, unidad, item: resto.replace(/^de\s+/i, '').trim(), crudo };
}

export function ingredientesIndexables(receta) {
  const vistos = new Set();
  for (const linea of String(receta.ingredientes ?? '').split('\n')) {
    const ing = parseIngrediente(linea);
    if (!ing?.item) continue;
    vistos.add(ing.item.toLowerCase());  // solo minúsculas, nada de sinónimos (§3.2)
  }
  return [...vistos];
}

export function primeraImagen(receta) {
  const bloques = [
    receta.descripcion, receta.ingredientes, receta.preparacion,
    receta.variaciones, receta.notas,
    ...(receta.otras ?? []).map(o => o.cuerpo)
  ];
  for (const bloque of bloques) {
    const m = String(bloque ?? '').match(/!\[[^\]]*\]\(([^)\s]+)/);
    if (m) return m[1];
  }
  return null;
}

export function slugArchivo(titulo, existentes = []) {
  const base = normalizar(titulo)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'sin-titulo';
  const tomados = new Set(existentes.map(n => n.toLowerCase()));
  if (!tomados.has(`${base}.md`)) return `${base}.md`;
  let n = 2;
  while (tomados.has(`${base}-${n}.md`)) n++;
  return `${base}-${n}.md`;
}
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/recipe.js tests/recipe-derivados.test.js
git commit -m "recipe.js: ingredientes best-effort, portada y slug del archivo"
```

---

### Task 6: `catalogo.js` — receta ↔ fila del índice

**Files:**
- Create: `src/catalogo.js`
- Test: `tests/catalogo-fila.test.js`

**Interfaces:**
- Consumes: `ingredientesIndexables`, `primeraImagen` de `recipe.js`.
- Produces:
  - `COLUMNAS` → `['id_archivo','nombre_archivo','titulo','categoria','carpeta_id','rinde','tiempo','dificultad','fuente','tags','ingredientes','foto','mtime']` (§4.3).
  - `filaDesde(receta, ubicacion) → string[]` de 13 celdas. `ubicacion` es `{id, nombre_archivo, categoria, carpeta_id, mtime}`.
  - `entradaDesdeFila(fila) → objeto` con las 13 claves, `tags` e `ingredientes` como arrays y `mtime` como número.
  - `DIFICULTADES` → `['fácil','media','difícil']`, y `dificultadValida(valor) → string|''`.

- [ ] **Step 1: Escribir los tests que fallan**

```javascript
// tests/catalogo-fila.test.js
import { describe, it, expect } from 'vitest';
import { parse } from '../src/recipe.js';
import { COLUMNAS, filaDesde, entradaDesdeFila, dificultadValida } from '../src/catalogo.js';

const UBICACION = { id: 'id1', nombre_archivo: 'milanesas.md', categoria: 'Carnes', carpeta_id: 'c1', mtime: 1700000000000 };

const RECETA = parse(`---
titulo: Milanesas napolitanas
tags: [italiana, horno]
rinde: 4 porciones
tiempo: 40 min
dificultad: fácil
fuente: Cuaderno
---

![](https://a/portada)

## Ingredientes
- 200 g de muzzarella
- 4 milanesas de nalga
`);

describe('filaDesde', () => {
  it('tiene exactamente las trece columnas del §4.3, en orden', () => {
    expect(COLUMNAS).toHaveLength(13);
    expect(filaDesde(RECETA, UBICACION)).toHaveLength(13);
  });

  it('mapea cada campo a su columna', () => {
    const f = filaDesde(RECETA, UBICACION);
    expect(f[COLUMNAS.indexOf('id_archivo')]).toBe('id1');
    expect(f[COLUMNAS.indexOf('titulo')]).toBe('Milanesas napolitanas');
    expect(f[COLUMNAS.indexOf('categoria')]).toBe('Carnes');
    expect(f[COLUMNAS.indexOf('foto')]).toBe('https://a/portada');
    expect(f[COLUMNAS.indexOf('mtime')]).toBe('1700000000000');
  });

  it('junta tags e ingredientes con barra vertical', () => {
    const f = filaDesde(RECETA, UBICACION);
    expect(f[COLUMNAS.indexOf('tags')]).toBe('italiana|horno');
    expect(f[COLUMNAS.indexOf('ingredientes')]).toBe('muzzarella|milanesas de nalga');
  });

  it('escribe cadena vacía y nunca null para lo que falta', () => {
    const f = filaDesde(parse(`---\ntitulo: X\n---\n`), UBICACION);
    expect(f.every(celda => typeof celda === 'string')).toBe(true);
  });

  it('no escribe la descripción en ninguna columna', () => {
    const r = parse(`---\ntitulo: X\n---\n\nUna descripción larga.\n`);
    expect(filaDesde(r, UBICACION).join('|')).not.toContain('descripción larga');
  });
});

describe('entradaDesdeFila', () => {
  it('es la inversa de filaDesde', () => {
    const e = entradaDesdeFila(filaDesde(RECETA, UBICACION));
    expect(e.id_archivo).toBe('id1');
    expect(e.tags).toEqual(['italiana', 'horno']);
    expect(e.ingredientes).toEqual(['muzzarella', 'milanesas de nalga']);
    expect(e.mtime).toBe(1700000000000);
  });

  it('tolera una fila corta sin romper', () => {
    const e = entradaDesdeFila(['id1', 'x.md', 'X']);
    expect(e.titulo).toBe('X');
    expect(e.tags).toEqual([]);
    expect(e.mtime).toBe(0);
  });
});

describe('dificultadValida', () => {
  it('acepta los tres valores comparando normalizado', () => {
    expect(dificultadValida('FACIL')).toBe('fácil');
    expect(dificultadValida('difícil')).toBe('difícil');
  });

  it('lo que no matchea cae en vacío en vez de romper el filtro', () => {
    expect(dificultadValida('regular')).toBe('');
    expect(dificultadValida(null)).toBe('');
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/catalogo-fila.test.js`
Expected: FAIL — no existe `src/catalogo.js`.

- [ ] **Step 3: Implementar**

```javascript
// src/catalogo.js
import { normalizar, ingredientesIndexables, primeraImagen } from './recipe.js';

export const COLUMNAS = ['id_archivo', 'nombre_archivo', 'titulo', 'categoria', 'carpeta_id',
  'rinde', 'tiempo', 'dificultad', 'fuente', 'tags', 'ingredientes', 'foto', 'mtime'];

export const DIFICULTADES = ['fácil', 'media', 'difícil'];

/** Un valor que no matchea cae en "sin definir" en vez de romper el filtro (§3.2). */
export function dificultadValida(valor) {
  const n = normalizar(valor);
  return DIFICULTADES.find(d => normalizar(d) === n) ?? '';
}

export function filaDesde(receta, ubicacion) {
  const celdas = {
    id_archivo: ubicacion.id,
    nombre_archivo: ubicacion.nombre_archivo,
    titulo: receta.titulo ?? '',
    categoria: ubicacion.categoria,
    carpeta_id: ubicacion.carpeta_id,
    rinde: receta.rinde ?? '',
    tiempo: receta.tiempo ?? '',
    dificultad: dificultadValida(receta.dificultad),
    fuente: receta.fuente ?? '',
    tags: (receta.tags ?? []).join('|'),
    ingredientes: ingredientesIndexables(receta).join('|'),
    foto: primeraImagen(receta) ?? '',
    mtime: String(ubicacion.mtime ?? 0)
  };
  return COLUMNAS.map(c => String(celdas[c] ?? ''));
}

export function entradaDesdeFila(fila) {
  const e = {};
  COLUMNAS.forEach((col, i) => { e[col] = fila[i] ?? ''; });
  e.tags = e.tags ? e.tags.split('|') : [];
  e.ingredientes = e.ingredientes ? e.ingredientes.split('|') : [];
  e.mtime = Number(e.mtime) || 0;
  return e;
}
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/catalogo.js tests/catalogo-fila.test.js
git commit -m "catalogo.js: una receta es exactamente una fila de trece columnas"
```

---

### Task 7: `catalogo.js` — el diff de cambios

**Files:**
- Modify: `src/catalogo.js`
- Test: `tests/catalogo-diff.test.js`

**Interfaces:**
- Consumes: nada de red. Es la función pura donde vive la corrección del sync (§7.1).
- Produces: `diffCambios(cambios, {indice, carpetas}) → {releer, parchear, borrar, ignorados}`.
  - `cambios`: lo que devuelve la Changes API, `[{fileId, removed, file}]`, con `file` = `{id, name, mimeType, parents, modifiedTime, trashed}`.
  - `indice`: `Map` de `id_archivo` → entrada (la de `entradaDesdeFila`).
  - `carpetas`: `Map` de id de carpeta → nombre de categoría. La raíz va con el nombre `'Sin categorizar'`.
  - `releer`: `[{id, nombre_archivo, categoria, carpeta_id, mtime}]` — hay que bajar el `.md`.
  - `parchear`: igual forma — solo cambió dónde vive o cómo se llama, no hay que bajar nada (§5.1).
  - `borrar`: `[id]`. `ignorados`: `[id]`.

- [ ] **Step 1: Escribir los tests que fallan**

```javascript
// tests/catalogo-diff.test.js
import { describe, it, expect } from 'vitest';
import { diffCambios } from '../src/catalogo.js';

const CARPETAS = new Map([['raiz', 'Sin categorizar'], ['c1', 'Carnes'], ['c2', 'Postres']]);

const entrada = (extra = {}) => ({
  id_archivo: 'id1', nombre_archivo: 'milanesas.md', titulo: 'Milanesas',
  categoria: 'Carnes', carpeta_id: 'c1', mtime: 1000, tags: [], ingredientes: [], ...extra
});

const cambio = (extra = {}) => ({
  fileId: 'id1', removed: false,
  file: { id: 'id1', name: 'milanesas.md', mimeType: 'text/markdown', parents: ['c1'], modifiedTime: '2026-01-01T00:00:00.000Z', trashed: false, ...extra }
});

const indiceCon = (...entradas) => new Map(entradas.map(e => [e.id_archivo, e]));

describe('diffCambios', () => {
  it('un archivo nuevo hay que leerlo', () => {
    const r = diffCambios([cambio()], { indice: new Map(), carpetas: CARPETAS });
    expect(r.releer).toEqual([{ id: 'id1', nombre_archivo: 'milanesas.md', categoria: 'Carnes', carpeta_id: 'c1', mtime: Date.parse('2026-01-01T00:00:00.000Z') }]);
    expect(r.parchear).toEqual([]);
  });

  it('un mtime distinto obliga a releer el contenido', () => {
    const r = diffCambios([cambio()], { indice: indiceCon(entrada()), carpetas: CARPETAS });
    expect(r.releer).toHaveLength(1);
    expect(r.parchear).toEqual([]);
  });

  it('una movida con el mismo mtime se parchea sin descargar el archivo', () => {
    const mismo = Date.parse('2026-01-01T00:00:00.000Z');
    const r = diffCambios([cambio({ parents: ['c2'] })], { indice: indiceCon(entrada({ mtime: mismo })), carpetas: CARPETAS });
    expect(r.releer).toEqual([]);
    expect(r.parchear).toEqual([{ id: 'id1', nombre_archivo: 'milanesas.md', categoria: 'Postres', carpeta_id: 'c2', mtime: mismo }]);
  });

  it('un renombre con el mismo mtime también se parchea', () => {
    const mismo = Date.parse('2026-01-01T00:00:00.000Z');
    const r = diffCambios([cambio({ name: 'napolitanas.md' })], { indice: indiceCon(entrada({ mtime: mismo })), carpetas: CARPETAS });
    expect(r.parchear[0].nombre_archivo).toBe('napolitanas.md');
  });

  it('sin cambios reales no propone nada', () => {
    const mismo = Date.parse('2026-01-01T00:00:00.000Z');
    const r = diffCambios([cambio()], { indice: indiceCon(entrada({ mtime: mismo })), carpetas: CARPETAS });
    expect(r).toEqual({ releer: [], parchear: [], borrar: [], ignorados: ['id1'] });
  });

  it('removed y trashed borran', () => {
    const indice = indiceCon(entrada());
    expect(diffCambios([{ fileId: 'id1', removed: true }], { indice, carpetas: CARPETAS }).borrar).toEqual(['id1']);
    expect(diffCambios([cambio({ trashed: true })], { indice, carpetas: CARPETAS }).borrar).toEqual(['id1']);
  });

  it('moverlo fuera del recetario equivale a borrarlo del índice', () => {
    const r = diffCambios([cambio({ parents: ['otra'] })], { indice: indiceCon(entrada()), carpetas: CARPETAS });
    expect(r.borrar).toEqual(['id1']);
  });

  it('ignora lo que no es un .md', () => {
    const r = diffCambios([cambio({ name: 'foto.png', mimeType: 'image/png' })], { indice: new Map(), carpetas: CARPETAS });
    expect(r.ignorados).toEqual(['id1']);
    expect(r.releer).toEqual([]);
  });

  it('ignora un .md que nunca estuvo y vive fuera del recetario', () => {
    const r = diffCambios([cambio({ parents: ['otra'] })], { indice: new Map(), carpetas: CARPETAS });
    expect(r).toEqual({ releer: [], parchear: [], borrar: [], ignorados: ['id1'] });
  });

  it('procesa varios cambios de distinto tipo en una sola pasada', () => {
    const mismo = Date.parse('2026-01-01T00:00:00.000Z');
    const indice = indiceCon(entrada(), entrada({ id_archivo: 'id2', nombre_archivo: 'flan.md', categoria: 'Postres', carpeta_id: 'c2', mtime: mismo }));
    const r = diffCambios([
      cambio(),
      { fileId: 'id2', removed: true },
      cambio({ id: 'id3', name: 'nueva.md', parents: ['c2'] })
    ], { indice, carpetas: CARPETAS });
    expect(r.releer.map(x => x.id)).toEqual(['id1', 'id3']);
    expect(r.borrar).toEqual(['id2']);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/catalogo-diff.test.js`
Expected: FAIL — `diffCambios` no existe.

- [ ] **Step 3: Implementar**

```javascript
// src/catalogo.js — agregar

const esMarkdown = (file) => file.mimeType === 'text/markdown' || /\.md$/i.test(file.name ?? '');

export function diffCambios(cambios, { indice, carpetas }) {
  const salida = { releer: [], parchear: [], borrar: [], ignorados: [] };

  for (const cambio of cambios ?? []) {
    const id = cambio.fileId ?? cambio.file?.id;
    const file = cambio.file;
    const estaba = indice.get(id);

    if (cambio.removed || !file || file.trashed) {
      if (estaba) salida.borrar.push(id); else salida.ignorados.push(id);
      continue;
    }

    const carpetaId = (file.parents ?? [])[0];
    const categoria = carpetas.get(carpetaId);

    if (categoria === undefined) {
      // Se movió fuera del recetario, o nunca estuvo adentro.
      if (estaba) salida.borrar.push(id); else salida.ignorados.push(id);
      continue;
    }

    if (!esMarkdown(file)) { salida.ignorados.push(id); continue; }

    const ubicacion = {
      id,
      nombre_archivo: file.name,
      categoria,
      carpeta_id: carpetaId,
      mtime: Date.parse(file.modifiedTime) || 0
    };

    if (!estaba || estaba.mtime !== ubicacion.mtime) { salida.releer.push(ubicacion); continue; }
    if (estaba.nombre_archivo !== ubicacion.nombre_archivo || estaba.carpeta_id !== ubicacion.carpeta_id) {
      salida.parchear.push(ubicacion);
      continue;
    }
    salida.ignorados.push(id);
  }

  return salida;
}
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test`
Expected: PASS, 10 tests nuevos.

- [ ] **Step 5: Commit**

```bash
git add src/catalogo.js tests/catalogo-diff.test.js
git commit -m "catalogo.js: el diff, con movidas y renombres que no bajan el archivo"
```

---

### Task 8: `auth.js` y `drive.js`

**Files:**
- Create: `src/auth.js`, `src/drive.js`
- Test: `tests/drive-consultas.test.js`

**Interfaces:**
- Consumes: `CLIENT_ID`, `SCOPE` de `config.js`.
- Produces:
  - `auth.js`: `crearAuth() → {conectar(), token(), olvidar()}`. `token()` devuelve un token válido, renovándolo en silencio con `prompt: ''` si venció; lanza `ErrorDeAuth` si hace falta intervención.
  - `drive.js`: `crearDrive(obtenerToken) → cliente` con `buscarPorNombre(nombre, {padre})`, `listarHijos(carpetaId, {campos})`, `leerTexto(id)`, `crear({nombre, contenido, padre, mime})`, `actualizar(id, contenido)`, `renombrar(id, nombre)`, `mover(id, {de, a})`, `borrar(id)`, `subirFoto(blob, {nombre, padre})`, `metadatos(id, campos)`, `tokenInicialDeCambios()`, `cambios(token)`.
  - Ambos exportan además las funciones puras que arman consultas: `q.hijosDe(id)`, `q.porNombre(nombre, padre)`, que son lo único que se testea (§9: los clientes se verifican a mano).

- [ ] **Step 1: Escribir los tests de las consultas**

```javascript
// tests/drive-consultas.test.js
import { describe, it, expect } from 'vitest';
import { q } from '../src/drive.js';

describe('q', () => {
  it('arma la consulta de hijos excluyendo la papelera', () => {
    expect(q.hijosDe('c1')).toBe("'c1' in parents and trashed=false");
  });

  it('arma la consulta por nombre dentro de un padre', () => {
    expect(q.porNombre('_indice', 'raiz')).toBe("name='_indice' and 'raiz' in parents and trashed=false");
  });

  it('arma la consulta por nombre sin padre', () => {
    expect(q.porNombre('Recetario')).toBe("name='Recetario' and trashed=false");
  });

  it('escapa las comillas simples del nombre', () => {
    expect(q.porNombre("Ají de gallina's")).toContain("\\'");
  });

  it('filtra solo carpetas cuando se lo piden', () => {
    expect(q.carpetasDe('c1')).toBe("'c1' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false");
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/drive-consultas.test.js`
Expected: FAIL — no existe `src/drive.js`.

- [ ] **Step 3: Implementar los dos clientes**

```javascript
// src/auth.js
import { CLIENT_ID, SCOPE } from './config.js';

export class ErrorDeAuth extends Error {}

export function crearAuth() {
  let token = null;
  let vence = 0;
  let cliente = null;

  const clienteGis = () => {
    if (cliente) return cliente;
    if (!window.google?.accounts?.oauth2) throw new ErrorDeAuth('Google Identity no cargó');
    cliente = window.google.accounts.oauth2.initTokenClient({ client_id: CLIENT_ID, scope: SCOPE, callback: () => {} });
    return cliente;
  };

  const pedir = (prompt) => new Promise((resolve, reject) => {
    const c = clienteGis();
    c.callback = (resp) => {
      if (resp.error) return reject(new ErrorDeAuth(resp.error));
      token = resp.access_token;
      // Google devuelve expires_in en segundos; se renueva un minuto antes.
      vence = Date.now() + (Number(resp.expires_in) - 60) * 1000;
      resolve(token);
    };
    c.requestAccessToken({ prompt });
  });

  return {
    conectar: () => pedir('consent'),
    /** Renovación silenciosa mientras haya sesión de Google; si no, hay que reconectar. */
    token: async () => (token && Date.now() < vence) ? token : pedir(''),
    olvidar: () => { token = null; vence = 0; }
  };
}
```

```javascript
// src/drive.js
const API = 'https://www.googleapis.com/drive/v3';
const SUBIDA = 'https://www.googleapis.com/upload/drive/v3';
const MIME_CARPETA = 'application/vnd.google-apps.folder';

const escapar = (s) => String(s).replace(/'/g, "\\'");

export const q = {
  hijosDe: (id) => `'${escapar(id)}' in parents and trashed=false`,
  carpetasDe: (id) => `'${escapar(id)}' in parents and mimeType='${MIME_CARPETA}' and trashed=false`,
  porNombre: (nombre, padre) => padre
    ? `name='${escapar(nombre)}' and '${escapar(padre)}' in parents and trashed=false`
    : `name='${escapar(nombre)}' and trashed=false`
};

export class ErrorDeDrive extends Error {
  constructor(mensaje, status) { super(mensaje); this.status = status; }
}

export function crearDrive(obtenerToken) {
  async function pedir(ruta, opciones = {}, base = API) {
    const token = await obtenerToken();
    const esJson = typeof opciones.body === 'string';
    const r = await fetch(base + ruta, {
      ...opciones,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(esJson ? { 'Content-Type': 'application/json' } : {}),
        ...opciones.headers
      }
    });
    if (!r.ok) throw new ErrorDeDrive(await r.text(), r.status);
    const tipo = r.headers.get('content-type') ?? '';
    return tipo.includes('json') ? r.json() : r.text();
  }

  const listar = async (consulta, campos = 'files(id,name,mimeType,parents,modifiedTime)') => {
    const archivos = [];
    let pageToken = '';
    do {
      const url = `/files?q=${encodeURIComponent(consulta)}&fields=nextPageToken,${campos}&pageSize=1000` +
        (pageToken ? `&pageToken=${pageToken}` : '');
      const r = await pedir(url);
      archivos.push(...(r.files ?? []));
      pageToken = r.nextPageToken ?? '';
    } while (pageToken);
    return archivos;
  };

  return {
    q,
    listar,
    buscarPorNombre: (nombre, padre) => listar(q.porNombre(nombre, padre)),
    listarCarpetas: (id) => listar(q.carpetasDe(id), 'files(id,name)'),
    listarHijos: (id, campos) => listar(q.hijosDe(id), campos),
    metadatos: (id, campos = 'id,name,parents,modifiedTime') => pedir(`/files/${id}?fields=${campos}`),
    leerTexto: (id) => pedir(`/files/${id}?alt=media`),

    crear: ({ nombre, contenido = '', padre, mime = 'text/markdown' }) => {
      const meta = { name: nombre, mimeType: mime, ...(padre ? { parents: [padre] } : {}) };
      const fd = new FormData();
      fd.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
      fd.append('file', new Blob([contenido], { type: mime }));
      return pedir('/files?uploadType=multipart&fields=id,name,modifiedTime', { method: 'POST', body: fd }, SUBIDA);
    },

    actualizar: (id, contenido) => pedir(`/files/${id}?uploadType=media&fields=id,modifiedTime`,
      { method: 'PATCH', body: contenido, headers: { 'Content-Type': 'text/markdown' } }, SUBIDA),

    renombrar: (id, nombre) => pedir(`/files/${id}?fields=id,name`, { method: 'PATCH', body: JSON.stringify({ name: nombre }) }),
    mover: (id, { de, a }) => pedir(`/files/${id}?addParents=${a}&removeParents=${de}&fields=id,parents`, { method: 'PATCH' }),
    borrar: (id) => pedir(`/files/${id}`, { method: 'DELETE' }),

    subirFoto: (blob, { nombre, padre }) => {
      const fd = new FormData();
      fd.append('metadata', new Blob([JSON.stringify({ name: nombre, parents: [padre] })], { type: 'application/json' }));
      fd.append('file', blob);
      return pedir('/files?uploadType=multipart&fields=id,name', { method: 'POST', body: fd }, SUBIDA);
    },

    /** Una sola llamada devuelve el mapa id→miniatura de todas las fotos (§3.3). */
    miniaturas: (carpetaFotos) => listar(q.hijosDe(carpetaFotos), 'files(id,thumbnailLink)'),

    tokenInicialDeCambios: async () => (await pedir('/changes/startPageToken')).startPageToken,
    cambios: (pageToken) => pedir(`/changes?pageToken=${pageToken}&pageSize=200` +
      '&fields=newStartPageToken,nextPageToken,changes(fileId,removed,file(id,name,mimeType,parents,modifiedTime,trashed))')
  };
}
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test`
Expected: PASS, 5 tests nuevos.

- [ ] **Step 5: Commit**

```bash
git add src/auth.js src/drive.js tests/drive-consultas.test.js
git commit -m "auth.js y drive.js: token con renovación silenciosa y cliente de Drive"
```

---

### Task 9: `sheets.js`

**Files:**
- Create: `src/sheets.js`
- Test: `tests/sheets-rangos.test.js`

**Interfaces:**
- Consumes: `obtenerToken`, y `drive.crear` para crear la planilla.
- Produces: `crearSheets(obtenerToken) → cliente` con `leer(id, rango)`, `escribir(id, rango, valores)`, `append(id, hoja, filas)`, `borrarFila(id, hojaId, fila)`, `agregarHoja(id, titulo)`, `hojas(id)`. Y las funciones puras `rangoDeFila(fila)` y `rangoDeCelda(columna, fila)`.
- El `fila` que reciben es **1-based, tal como lo numera Sheets**: la fila 1 son los encabezados y la primera receta es la 2.

- [ ] **Step 1: Escribir los tests de rangos**

```javascript
// tests/sheets-rangos.test.js
import { describe, it, expect } from 'vitest';
import { rangoDeFila, rangoDeCelda } from '../src/sheets.js';

describe('rangos A1', () => {
  it('una fila entera abarca las trece columnas', () => {
    expect(rangoDeFila(2)).toBe('recetas!A2:M2');
  });

  it('una celda usa la letra de su columna', () => {
    expect(rangoDeCelda('titulo', 5)).toBe('recetas!C5');
    expect(rangoDeCelda('mtime', 5)).toBe('recetas!M5');
  });

  it('una columna desconocida es un error de programación, no un rango raro', () => {
    expect(() => rangoDeCelda('inexistente', 2)).toThrow();
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/sheets-rangos.test.js`
Expected: FAIL — no existe `src/sheets.js`.

- [ ] **Step 3: Implementar**

```javascript
// src/sheets.js
import { COLUMNAS } from './catalogo.js';

const API = 'https://sheets.googleapis.com/v4/spreadsheets';
export const HOJA_RECETAS = 'recetas';
export const HOJA_META = 'meta';

const letra = (i) => String.fromCharCode(65 + i);

export const rangoDeFila = (fila) => `${HOJA_RECETAS}!A${fila}:${letra(COLUMNAS.length - 1)}${fila}`;

export function rangoDeCelda(columna, fila) {
  const i = COLUMNAS.indexOf(columna);
  if (i < 0) throw new Error(`Columna desconocida: ${columna}`);
  return `${HOJA_RECETAS}!${letra(i)}${fila}`;
}

export function crearSheets(obtenerToken) {
  async function pedir(ruta, opciones = {}) {
    const token = await obtenerToken();
    const r = await fetch(API + ruta, {
      ...opciones,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
        ...opciones.headers
      }
    });
    if (!r.ok) { const e = new Error(await r.text()); e.status = r.status; throw e; }
    return r.json();
  }

  return {
    leer: async (id, rango) => (await pedir(`/${id}/values/${encodeURIComponent(rango)}`)).values ?? [],

    escribir: (id, rango, valores) => pedir(
      `/${id}/values/${encodeURIComponent(rango)}?valueInputOption=RAW`,
      { method: 'PUT', body: JSON.stringify({ values: valores }) }),

    append: (id, hoja, filas) => pedir(
      `/${id}/values/${encodeURIComponent(hoja + '!A1')}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      { method: 'POST', body: JSON.stringify({ values: filas }) }),

    agregarHoja: (id, titulo) => pedir(`/${id}:batchUpdate`,
      { method: 'POST', body: JSON.stringify({ requests: [{ addSheet: { properties: { title: titulo } } }] }) }),

    /** Borra la fila de verdad: el corrimiento posterior es determinístico (§4.3). */
    borrarFila: (id, hojaId, fila) => pedir(`/${id}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [{ deleteDimension: { range: { sheetId: hojaId, dimension: 'ROWS', startIndex: fila - 1, endIndex: fila } } }]
      })
    }),

    hojas: async (id) => (await pedir(`/${id}?fields=sheets(properties(sheetId,title))`)).sheets
      .map(s => s.properties)
  };
}
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sheets.js tests/sheets-rangos.test.js
git commit -m "sheets.js: escritura por fila y por celda, y borrado con deleteDimension"
```

---

### Task 10: `cache.js` y los dobles de prueba

**Files:**
- Create: `src/cache.js`, `tests/dobles.js`
- Test: `tests/cache.test.js`

**Interfaces:**
- Produces:
  - `crearCacheMemoria() → cache` — implementación en memoria, la que usan los tests y la referencia de la interfaz.
  - `abrirCache() → Promise<cache>` — la misma interfaz sobre IndexedDB. No lleva unitarios: se verifica a mano (§9).
  - Interfaz del cache: `leerIndice()`, `guardarIndice(entradas)`, `leerMapaFilas()`, `guardarMapaFilas(mapa)`, `leerCuerpo(id)`, `guardarCuerpo(id, texto)`, `leerMeta(clave)`, `guardarMeta(clave, valor)`, `encolar(op)`, `leerCola()`, `vaciarCola()`.
  - `tests/dobles.js`: `driveFalso(archivos)` y `sheetsFalso()`, un Drive y un Sheets en memoria con la misma superficie que los reales.
- El mapa de filas es `Map` de `id_archivo` → número de fila 1-based (§4.3).

- [ ] **Step 1: Escribir el test del cache**

```javascript
// tests/cache.test.js
import { describe, it, expect } from 'vitest';
import { crearCacheMemoria } from '../src/cache.js';

describe('cache en memoria', () => {
  it('guarda y devuelve el índice', async () => {
    const c = crearCacheMemoria();
    expect(await c.leerIndice()).toEqual([]);
    await c.guardarIndice([{ id_archivo: 'a' }]);
    expect(await c.leerIndice()).toEqual([{ id_archivo: 'a' }]);
  });

  it('guarda el mapa de filas como Map', async () => {
    const c = crearCacheMemoria();
    await c.guardarMapaFilas(new Map([['a', 2]]));
    expect((await c.leerMapaFilas()).get('a')).toBe(2);
  });

  it('la cola es FIFO y se vacía entera', async () => {
    const c = crearCacheMemoria();
    await c.encolar({ tipo: 'fila', id: 'a' });
    await c.encolar({ tipo: 'fila', id: 'b' });
    expect((await c.leerCola()).map(o => o.id)).toEqual(['a', 'b']);
    await c.vaciarCola();
    expect(await c.leerCola()).toEqual([]);
  });

  it('los cuerpos se guardan y se leen por id', async () => {
    const c = crearCacheMemoria();
    await c.guardarCuerpo('a', '# hola');
    expect(await c.leerCuerpo('a')).toBe('# hola');
    expect(await c.leerCuerpo('b')).toBeNull();
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/cache.test.js`
Expected: FAIL — no existe `src/cache.js`.

- [ ] **Step 3: Implementar el cache y los dobles**

```javascript
// src/cache.js
export function crearCacheMemoria() {
  let indice = [];
  let mapaFilas = new Map();
  const cuerpos = new Map();
  const meta = new Map();
  let cola = [];

  return {
    leerIndice: async () => indice,
    guardarIndice: async (entradas) => { indice = entradas; },
    leerMapaFilas: async () => mapaFilas,
    guardarMapaFilas: async (mapa) => { mapaFilas = mapa; },
    leerCuerpo: async (id) => cuerpos.get(id) ?? null,
    guardarCuerpo: async (id, texto) => { cuerpos.set(id, texto); },
    leerMeta: async (clave) => meta.get(clave) ?? null,
    guardarMeta: async (clave, valor) => { meta.set(clave, valor); },
    encolar: async (op) => { cola.push(op); },
    leerCola: async () => [...cola],
    vaciarCola: async () => { cola = []; }
  };
}

const TIENDAS = ['indice', 'cuerpos', 'meta', 'cola'];

export function abrirCache() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('recetario', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const t of TIENDAS) if (!db.objectStoreNames.contains(t)) db.createObjectStore(t);
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(envolver(req.result));
  });
}

function envolver(db) {
  const tx = (tienda, modo, fn) => new Promise((resolve, reject) => {
    const t = db.transaction(tienda, modo);
    const req = fn(t.objectStore(tienda));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return {
    leerIndice: async () => (await tx('indice', 'readonly', s => s.get('todo'))) ?? [],
    guardarIndice: (entradas) => tx('indice', 'readwrite', s => s.put(entradas, 'todo')),
    leerMapaFilas: async () => new Map((await tx('indice', 'readonly', s => s.get('filas'))) ?? []),
    guardarMapaFilas: (mapa) => tx('indice', 'readwrite', s => s.put([...mapa], 'filas')),
    leerCuerpo: async (id) => (await tx('cuerpos', 'readonly', s => s.get(id))) ?? null,
    guardarCuerpo: (id, texto) => tx('cuerpos', 'readwrite', s => s.put(texto, id)),
    leerMeta: async (clave) => (await tx('meta', 'readonly', s => s.get(clave))) ?? null,
    guardarMeta: (clave, valor) => tx('meta', 'readwrite', s => s.put(valor, clave)),
    encolar: async (op) => {
      const cola = (await tx('cola', 'readonly', s => s.get('ops'))) ?? [];
      return tx('cola', 'readwrite', s => s.put([...cola, op], 'ops'));
    },
    leerCola: async () => (await tx('cola', 'readonly', s => s.get('ops'))) ?? [],
    vaciarCola: () => tx('cola', 'readwrite', s => s.put([], 'ops'))
  };
}
```

```javascript
// tests/dobles.js
import { COLUMNAS } from '../src/catalogo.js';

/**
 * Drive falso en memoria. `archivos` es un array de
 * {id, name, mimeType, parents, modifiedTime, contenido}.
 */
export function driveFalso(archivos = []) {
  const store = new Map(archivos.map(a => [a.id, { mimeType: 'text/markdown', parents: [], modifiedTime: '2026-01-01T00:00:00.000Z', ...a }]));
  let siguiente = 1;
  const fallas = new Map();  // ruta lógica → error a lanzar

  const vivos = () => [...store.values()].filter(a => !a.trashed);

  const api = {
    llamadas: [],
    fallar(operacion, error) { fallas.set(operacion, error); },
    _store: store,

    async buscarPorNombre(nombre, padre) {
      api.llamadas.push(['buscarPorNombre', nombre, padre]);
      if (fallas.has('buscarPorNombre')) throw fallas.get('buscarPorNombre');
      return vivos().filter(a => a.name === nombre && (!padre || a.parents.includes(padre)));
    },
    async listarCarpetas(id) {
      return vivos().filter(a => a.parents.includes(id) && a.mimeType === 'application/vnd.google-apps.folder');
    },
    async listarHijos(id) {
      return vivos().filter(a => a.parents.includes(id));
    },
    async metadatos(id) { return store.get(id); },
    async leerTexto(id) {
      api.llamadas.push(['leerTexto', id]);
      return store.get(id)?.contenido ?? '';
    },
    async crear({ nombre, contenido = '', padre, mime = 'text/markdown' }) {
      const a = { id: `nuevo${siguiente++}`, name: nombre, mimeType: mime, parents: padre ? [padre] : [], modifiedTime: new Date().toISOString(), contenido };
      store.set(a.id, a);
      return a;
    },
    async actualizar(id, contenido) {
      const a = store.get(id);
      a.contenido = contenido;
      a.modifiedTime = new Date().toISOString();
      return a;
    },
    async renombrar(id, nombre) { store.get(id).name = nombre; return store.get(id); },
    async mover(id, { de, a: destino }) {
      const a = store.get(id);
      a.parents = [destino, ...a.parents.filter(p => p !== de && p !== destino)].slice(0, 1);
      return a;
    },
    async borrar(id) { store.delete(id); },
    async miniaturas() { return []; },
    async tokenInicialDeCambios() { return '100'; },
    async cambios(token) { return { changes: [], newStartPageToken: String(Number(token) + 1) }; }
  };
  return api;
}

/** Sheets falso: una planilla es un objeto {hojas: {nombre: filas[][]}}. */
export function sheetsFalso() {
  const planillas = new Map();
  // La app crea la planilla con drive.crear y después le escribe: el doble tiene
  // que aceptar una escritura sobre un id que todavía no vio.
  const asegurar = (id) => {
    if (!planillas.has(id)) planillas.set(id, { recetas: [], meta: [] });
    return planillas.get(id);
  };
  return {
    _planillas: planillas,
    crearPlanilla(id) { planillas.set(id, { recetas: [], meta: [] }); },
    async leer(id, rango) {
      const hoja = rango.split('!')[0];
      return (planillas.get(id)?.[hoja] ?? []).map(f => [...f]);
    },
    async escribir(id, rango, valores) {
      const [hoja, celdas] = rango.split('!');
      const fila = Number(celdas.match(/\d+/)[0]);
      const p = asegurar(id);
      p[hoja] = p[hoja] ?? [];
      while (p[hoja].length < fila) p[hoja].push([]);
      p[hoja][fila - 1] = valores[0];
    },
    async append(id, hoja, filas) { const p = asegurar(id); p[hoja] = p[hoja] ?? []; p[hoja].push(...filas); },
    async agregarHoja(id, titulo) { asegurar(id)[titulo] = []; },
    async borrarFila(id, _hojaId, fila) { planillas.get(id).recetas.splice(fila - 1, 1); },
    async hojas() { return [{ sheetId: 0, title: 'recetas' }, { sheetId: 1, title: 'meta' }]; }
  };
}

export const COLUMNAS_ESPERADAS = COLUMNAS;
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cache.js tests/dobles.js tests/cache.test.js
git commit -m "cache.js con implementación en memoria, y los dobles de Drive y Sheets"
```

---

### Task 11: `store.js` — arranque en frío

**Files:**
- Create: `src/store.js`
- Test: `tests/store-arranque.test.js`

**Interfaces:**
- Consumes: `drive`, `sheets`, `cache` (inyectados), `NOMBRE_RAIZ`, `NOMBRE_INDICE`, `SCHEMA_VERSION`.
- Produces: `crearStore({drive, sheets, cache}) → store`. En esta tarea solo `arrancar()`, que devuelve un objeto de estado:
  - `{estado: 'listo', raizId, indiceId, categorias}` — todo en orden.
  - `{estado: 'falta-estructura'}` — no hay carpeta `Recetario`. La app no la crea (§5.1).
  - `{estado: 'elegir-carpeta', candidatas}` — hay más de una.
  - `{estado: 'solo-lectura', motivo}` — la búsqueda falló; **no se creó nada**.
  - `{estado: 'listo', reconstruir: true}` — hay que reconstruir (planilla nueva, `schemaVersion` viejo o `reconstruccion_en_curso` marcado).
  - `avisos: string[]` — incluye `'indice-duplicado'` cuando había más de una planilla.

- [ ] **Step 1: Escribir los tests que fallan**

```javascript
// tests/store-arranque.test.js
import { describe, it, expect } from 'vitest';
import { crearStore } from '../src/store.js';
import { crearCacheMemoria } from '../src/cache.js';
import { driveFalso, sheetsFalso } from './dobles.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';

function conRecetario(extra = []) {
  return driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
    { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'c2', name: 'Postres', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'fotos', name: '_fotos', mimeType: CARPETA, parents: ['raiz'] },
    ...extra
  ]);
}

const armar = (drive) => {
  const sheets = sheetsFalso();
  const cache = crearCacheMemoria();
  return { store: crearStore({ drive, sheets, cache }), sheets, cache, drive };
};

describe('arranque en frío', () => {
  it('sin carpeta Recetario no crea nada y manda al SETUP', async () => {
    const { store, drive } = armar(driveFalso([]));
    const r = await store.arrancar();
    expect(r.estado).toBe('falta-estructura');
    expect(drive._store.size).toBe(0);
  });

  it('con dos carpetas Recetario pide elegir', async () => {
    const drive = driveFalso([
      { id: 'r1', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
      { id: 'r2', name: 'Recetario', mimeType: CARPETA, parents: ['otra'] }
    ]);
    const r = await armar(drive).store.arrancar();
    expect(r.estado).toBe('elegir-carpeta');
    expect(r.candidatas).toHaveLength(2);
  });

  it('descubre las categorías listando subcarpetas, y excluye las que empiezan con _', async () => {
    const r = await armar(conRecetario()).store.arrancar();
    expect(r.categorias.map(c => c.nombre).sort()).toEqual(['Carnes', 'Postres']);
  });

  it('sin planilla la crea con encabezados y pide reconstruir', async () => {
    const { store, drive } = armar(conRecetario());
    const r = await store.arrancar();
    expect(r.estado).toBe('listo');
    expect(r.reconstruir).toBe(true);
    const creada = [...drive._store.values()].find(a => a.name === '_indice');
    expect(creada).toBeDefined();
  });

  it('con dos planillas usa la más reciente y avisa', async () => {
    const drive = conRecetario([
      { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'], modifiedTime: '2026-01-01T00:00:00.000Z' },
      { id: 'i2', name: '_indice', mimeType: PLANILLA, parents: ['raiz'], modifiedTime: '2026-02-01T00:00:00.000Z' }
    ]);
    const { store, sheets } = armar(drive);
    sheets.crearPlanilla('i1'); sheets.crearPlanilla('i2');
    const r = await store.arrancar();
    expect(r.indiceId).toBe('i2');
    expect(r.avisos).toContain('indice-duplicado');
  });

  it('si la búsqueda falla arranca en solo lectura y NO crea una segunda planilla', async () => {
    const drive = conRecetario();
    drive.fallar('buscarPorNombre', Object.assign(new Error('sin red'), { status: 0 }));
    const { store } = armar(drive);
    const r = await store.arrancar();
    expect(r.estado).toBe('solo-lectura');
    expect([...drive._store.values()].some(a => a.name === '_indice')).toBe(false);
  });

  it('con reconstruccion_en_curso marcado pide reconstruir en vez de confiar en el índice', async () => {
    const drive = conRecetario([{ id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] }]);
    const { store, sheets } = armar(drive);
    sheets.crearPlanilla('i1');
    await sheets.escribir('i1', 'meta!A1:B1', [['schemaVersion', '1']]);
    await sheets.escribir('i1', 'meta!A2:B2', [['reconstruccion_en_curso', 'si']]);
    expect((await store.arrancar()).reconstruir).toBe(true);
  });

  it('con schemaVersion viejo pide reconstruir', async () => {
    const drive = conRecetario([{ id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] }]);
    const { store, sheets } = armar(drive);
    sheets.crearPlanilla('i1');
    await sheets.escribir('i1', 'meta!A1:B1', [['schemaVersion', '0']]);
    expect((await store.arrancar()).reconstruir).toBe(true);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/store-arranque.test.js`
Expected: FAIL — no existe `src/store.js`.

- [ ] **Step 3: Implementar el arranque**

```javascript
// src/store.js
import { NOMBRE_RAIZ, NOMBRE_INDICE, NOMBRE_FOTOS, SCHEMA_VERSION } from './config.js';
import { COLUMNAS, entradaDesdeFila } from './catalogo.js';
import { HOJA_RECETAS, HOJA_META } from './sheets.js';

const CATEGORIA_RAIZ = 'Sin categorizar';

export function crearStore({ drive, sheets, cache }) {
  const ctx = { raizId: null, indiceId: null, fotosId: null, categorias: [], carpetas: new Map(), soloLectura: false };

  async function leerMeta() {
    const filas = await sheets.leer(ctx.indiceId, `${HOJA_META}!A1:B20`);
    return Object.fromEntries(filas.map(f => [f[0], f[1]]));
  }

  async function crearPlanilla() {
    const archivo = await drive.crear({
      nombre: NOMBRE_INDICE, padre: ctx.raizId,
      mime: 'application/vnd.google-apps.spreadsheet'
    });
    await sheets.escribir(archivo.id, `${HOJA_RECETAS}!A1:${String.fromCharCode(64 + COLUMNAS.length)}1`, [COLUMNAS]);
    await sheets.agregarHoja(archivo.id, HOJA_META);
    await sheets.escribir(archivo.id, `${HOJA_META}!A1:B3`, [
      ['schemaVersion', String(SCHEMA_VERSION)],
      ['changesPageToken', ''],
      ['ultima_reconstruccion', '']
    ]);
    return archivo.id;
  }

  async function arrancar() {
    const avisos = [];

    let raices;
    try {
      raices = await drive.buscarPorNombre(NOMBRE_RAIZ);
    } catch (e) {
      // "No la encontré" no es "no existe": nunca se crea nada tras un fallo (§5.1).
      ctx.soloLectura = true;
      return { estado: 'solo-lectura', motivo: e.message, avisos };
    }

    if (raices.length === 0) return { estado: 'falta-estructura', avisos };
    if (raices.length > 1) return { estado: 'elegir-carpeta', candidatas: raices, avisos };
    ctx.raizId = raices[0].id;

    const subcarpetas = await drive.listarCarpetas(ctx.raizId);
    ctx.categorias = subcarpetas
      .filter(c => !c.name.startsWith('_'))
      .map(c => ({ id: c.id, nombre: c.name }));
    ctx.fotosId = subcarpetas.find(c => c.name === NOMBRE_FOTOS)?.id ?? null;
    ctx.carpetas = new Map([
      [ctx.raizId, CATEGORIA_RAIZ],
      ...ctx.categorias.map(c => [c.id, c.nombre])
    ]);

    let planillas;
    try {
      planillas = await drive.buscarPorNombre(NOMBRE_INDICE, ctx.raizId);
    } catch (e) {
      ctx.soloLectura = true;
      return { estado: 'solo-lectura', motivo: e.message, avisos };
    }

    let reconstruir = false;
    if (planillas.length === 0) {
      ctx.indiceId = await crearPlanilla();
      reconstruir = true;
    } else {
      if (planillas.length > 1) avisos.push('indice-duplicado');
      const ordenadas = [...planillas].sort((a, b) => Date.parse(b.modifiedTime ?? 0) - Date.parse(a.modifiedTime ?? 0));
      ctx.indiceId = ordenadas[0].id;
      const meta = await leerMeta();
      if (Number(meta.schemaVersion) !== SCHEMA_VERSION) reconstruir = true;
      if (meta.reconstruccion_en_curso) reconstruir = true;
    }

    return {
      estado: 'listo', raizId: ctx.raizId, indiceId: ctx.indiceId,
      categorias: ctx.categorias, reconstruir, avisos
    };
  }

  return { arrancar, _ctx: ctx };
}
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test`
Expected: PASS, 8 tests nuevos.

- [ ] **Step 5: Commit**

```bash
git add src/store.js tests/store-arranque.test.js
git commit -m "store.js: arranque en frío que nunca crea una segunda planilla"
```

---

### Task 12: `store.js` — cargar el índice y sincronizar

**Files:**
- Modify: `src/store.js`
- Test: `tests/store-sync.test.js`

**Interfaces:**
- Consumes: `diffCambios`, `parse`, `filaDesde`.
- Produces:
  - `cargarIndice()` — lee la planilla entera, arma el mapa `id_archivo` → fila y lo guarda en cache.
  - `sync()` — una llamada a la Changes API con el `changesPageToken` guardado; aplica el diff; devuelve `{releidos, parcheados, borrados}`.
  - `entradas()` — el índice en memoria.

- [ ] **Step 1: Escribir los tests que fallan**

```javascript
// tests/store-sync.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { crearStore } from '../src/store.js';
import { crearCacheMemoria } from '../src/cache.js';
import { driveFalso, sheetsFalso } from './dobles.js';
import { COLUMNAS } from '../src/catalogo.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const MD = `---\ntitulo: Milanesas\ntags: [horno]\n---\n\n## Ingredientes\n- 200 g de muzzarella\n`;

let drive, sheets, cache, store;

beforeEach(async () => {
  drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
    { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'c2', name: 'Postres', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
    { id: 'r1', name: 'milanesas.md', parents: ['c1'], contenido: MD, modifiedTime: '2026-01-01T00:00:00.000Z' }
  ]);
  sheets = sheetsFalso();
  sheets.crearPlanilla('i1');
  await sheets.escribir('i1', 'recetas!A1:M1', [COLUMNAS]);
  await sheets.escribir('i1', 'meta!A1:B1', [['schemaVersion', '1']]);
  cache = crearCacheMemoria();
  store = crearStore({ drive, sheets, cache });
  await store.arrancar();
});

describe('cargarIndice', () => {
  it('arma el mapa de filas 1-based salteando el encabezado', async () => {
    await sheets.append('i1', 'recetas', [['r1', 'milanesas.md', 'Milanesas', 'Carnes', 'c1', '', '', '', '', 'horno', 'muzzarella', '', '1000']]);
    await store.cargarIndice();
    expect((await cache.leerMapaFilas()).get('r1')).toBe(2);
    expect(store.entradas()).toHaveLength(1);
  });
});

describe('sync', () => {
  it('un archivo nuevo se lee, se parsea y entra al índice', async () => {
    await store.cargarIndice();
    drive.cambios = async () => ({
      changes: [{ fileId: 'r1', removed: false, file: { id: 'r1', name: 'milanesas.md', mimeType: 'text/markdown', parents: ['c1'], modifiedTime: '2026-01-01T00:00:00.000Z', trashed: false } }],
      newStartPageToken: '101'
    });
    const r = await store.sync();
    expect(r.releidos).toBe(1);
    expect(store.entradas()[0].titulo).toBe('Milanesas');
  });

  it('una movida parchea la fila sin descargar el .md', async () => {
    await sheets.append('i1', 'recetas', [['r1', 'milanesas.md', 'Milanesas', 'Carnes', 'c1', '', '', '', '', '', '', '', String(Date.parse('2026-01-01T00:00:00.000Z'))]]);
    await store.cargarIndice();
    drive.llamadas.length = 0;
    drive.cambios = async () => ({
      changes: [{ fileId: 'r1', removed: false, file: { id: 'r1', name: 'milanesas.md', mimeType: 'text/markdown', parents: ['c2'], modifiedTime: '2026-01-01T00:00:00.000Z', trashed: false } }],
      newStartPageToken: '101'
    });
    const r = await store.sync();
    expect(r.parcheados).toBe(1);
    expect(drive.llamadas.some(l => l[0] === 'leerTexto')).toBe(false);
    expect(store.entradas()[0].categoria).toBe('Postres');
  });

  it('un borrado saca la fila y corre las siguientes en el mapa', async () => {
    await sheets.append('i1', 'recetas', [
      ['r1', 'a.md', 'A', 'Carnes', 'c1', '', '', '', '', '', '', '', '1'],
      ['r2', 'b.md', 'B', 'Carnes', 'c1', '', '', '', '', '', '', '', '1']
    ]);
    await store.cargarIndice();
    drive.cambios = async () => ({ changes: [{ fileId: 'r1', removed: true }], newStartPageToken: '101' });
    await store.sync();
    const mapa = await cache.leerMapaFilas();
    expect(mapa.has('r1')).toBe(false);
    expect(mapa.get('r2')).toBe(2);  // era 3, se corrió una
  });

  it('guarda el nuevo changesPageToken para la próxima vez', async () => {
    await store.cargarIndice();
    drive.cambios = async () => ({ changes: [], newStartPageToken: '999' });
    await store.sync();
    const meta = await sheets.leer('i1', 'meta!A1:B20');
    expect(meta.find(f => f[0] === 'changesPageToken')[1]).toBe('999');
  });

  it('una receta sin titulo no entra al índice', async () => {
    drive._store.get('r1').contenido = '---\nrinde: 2\n---\n\nsin título\n';
    await store.cargarIndice();
    drive.cambios = async () => ({
      changes: [{ fileId: 'r1', removed: false, file: { id: 'r1', name: 'milanesas.md', mimeType: 'text/markdown', parents: ['c1'], modifiedTime: '2026-01-01T00:00:00.000Z', trashed: false } }],
      newStartPageToken: '101'
    });
    const r = await store.sync();
    expect(r.ignoradosSinTitulo).toBe(1);
    expect(store.entradas()).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/store-sync.test.js`
Expected: FAIL — `cargarIndice` y `sync` no existen.

- [ ] **Step 3: Implementar**

```javascript
// src/store.js — agregar dentro de crearStore

import { diffCambios, filaDesde } from './catalogo.js';   // sumar a los imports de arriba
import { parse } from './recipe.js';
import { rangoDeFila } from './sheets.js';

  let entradas = [];
  let filas = new Map();

  async function guardarMeta(clave, valor) {
    const meta = await sheets.leer(ctx.indiceId, `${HOJA_META}!A1:B20`);
    const i = meta.findIndex(f => f[0] === clave);
    const fila = i >= 0 ? i + 1 : meta.length + 1;
    await sheets.escribir(ctx.indiceId, `${HOJA_META}!A${fila}:B${fila}`, [[clave, valor]]);
  }

  async function cargarIndice() {
    const crudo = await sheets.leer(ctx.indiceId, `${HOJA_RECETAS}!A1:M100000`);
    const cuerpo = crudo.slice(1);  // la fila 1 son los encabezados
    entradas = cuerpo.map(entradaDesdeFila).filter(e => e.id_archivo);
    filas = new Map(entradas.map((e, i) => [e.id_archivo, i + 2]));
    await cache.guardarIndice(entradas);
    await cache.guardarMapaFilas(filas);
    return entradas;
  }

  async function escribirFila(entrada, receta, ubicacion) {
    const fila = filaDesde(receta, ubicacion);
    const nro = filas.get(ubicacion.id);
    if (nro) await sheets.escribir(ctx.indiceId, rangoDeFila(nro), [fila]);
    else {
      await sheets.append(ctx.indiceId, HOJA_RECETAS, [fila]);
      filas.set(ubicacion.id, filas.size + 2);
    }
  }

  async function borrarDelIndice(id) {
    const nro = filas.get(id);
    if (!nro) return;
    const hojas = await sheets.hojas(ctx.indiceId);
    const hojaId = hojas.find(h => h.title === HOJA_RECETAS)?.sheetId ?? 0;
    await sheets.borrarFila(ctx.indiceId, hojaId, nro);
    filas.delete(id);
    // El corrimiento es determinístico: no hace falta releer nada (§4.3).
    for (const [otroId, otraFila] of filas) if (otraFila > nro) filas.set(otroId, otraFila - 1);
    entradas = entradas.filter(e => e.id_archivo !== id);
  }

  async function sync() {
    const meta = await leerMeta();
    let pageToken = meta.changesPageToken;
    if (!pageToken) {
      pageToken = await drive.tokenInicialDeCambios();
      await guardarMeta('changesPageToken', pageToken);
      return { releidos: 0, parcheados: 0, borrados: 0, ignoradosSinTitulo: 0 };
    }

    const { changes = [], newStartPageToken } = await drive.cambios(pageToken);
    const indice = new Map(entradas.map(e => [e.id_archivo, e]));
    const plan = diffCambios(changes, { indice, carpetas: ctx.carpetas });

    let ignoradosSinTitulo = 0;

    for (const ubicacion of plan.releer) {
      const texto = await drive.leerTexto(ubicacion.id);
      const receta = parse(texto);
      if (!receta.titulo) { ignoradosSinTitulo++; continue; }
      await cache.guardarCuerpo(ubicacion.id, texto);
      await escribirFila(indice.get(ubicacion.id), receta, ubicacion);
      const entrada = entradaDesdeFila(filaDesde(receta, ubicacion));
      entradas = [...entradas.filter(e => e.id_archivo !== ubicacion.id), entrada];
    }

    for (const ubicacion of plan.parchear) {
      const entrada = indice.get(ubicacion.id);
      const actualizada = { ...entrada, nombre_archivo: ubicacion.nombre_archivo, categoria: ubicacion.categoria, carpeta_id: ubicacion.carpeta_id };
      entradas = entradas.map(e => e.id_archivo === ubicacion.id ? actualizada : e);
      const nro = filas.get(ubicacion.id);
      if (nro) {
        const fila = COLUMNAS.map(c => {
          const v = actualizada[c];
          return Array.isArray(v) ? v.join('|') : String(v ?? '');
        });
        await sheets.escribir(ctx.indiceId, rangoDeFila(nro), [fila]);
      }
    }

    for (const id of plan.borrar) await borrarDelIndice(id);

    if (newStartPageToken) await guardarMeta('changesPageToken', newStartPageToken);
    await cache.guardarIndice(entradas);
    await cache.guardarMapaFilas(filas);

    return { releidos: plan.releer.length - ignoradosSinTitulo, parcheados: plan.parchear.length, borrados: plan.borrar.length, ignoradosSinTitulo };
  }
```

Y agregar al objeto devuelto: `cargarIndice`, `sync`, `entradas: () => entradas`, `guardarMeta`.

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store.js tests/store-sync.test.js
git commit -m "store.js: sync incremental que no baja archivos para movidas ni renombres"
```

---

### Task 13: `store.js` — guardar, crear y borrar, con cola

**Files:**
- Modify: `src/store.js`
- Test: `tests/store-escritura.test.js`

**Interfaces:**
- Produces:
  - `guardar(id, receta, {carpetaDestino}) → {ok, conflicto?}` — escribe el `.md`, parchea el índice local, encola la fila. Si `modifiedTime` cambió desde la última lectura, **no pisa**: devuelve `{ok:false, conflicto:{remoto}}` (§8).
  - `crear({titulo, carpetaId}) → {id, nombre_archivo}` — `.md` nuevo con frontmatter y tag `incompleto` (§7.2).
  - `borrar(id, {borrarFotos}) → {fotosBorradas}` — borra el `.md`, saca la fila y opcionalmente borra las fotos que solo referenciaba esa receta (§3.3).
  - `fotosDe(id) → string[]` — ids de Drive de las fotos referenciadas por el `.md`.
  - `flush()` — vuelca la cola a la planilla. Se llama con debounce de 30 s y al pasar a segundo plano (§5.2).

- [ ] **Step 1: Escribir los tests que fallan**

```javascript
// tests/store-escritura.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { crearStore } from '../src/store.js';
import { crearCacheMemoria } from '../src/cache.js';
import { driveFalso, sheetsFalso } from './dobles.js';
import { parse } from '../src/recipe.js';
import { COLUMNAS } from '../src/catalogo.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const MD = `---\ntitulo: Milanesas\n---\n\n## Notas\n- ojo\n`;

let drive, sheets, cache, store;

beforeEach(async () => {
  drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
    { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'c2', name: 'Postres', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'fotos', name: '_fotos', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
    { id: 'r1', name: 'milanesas.md', parents: ['c1'], contenido: MD, modifiedTime: '2026-01-01T00:00:00.000Z' }
  ]);
  sheets = sheetsFalso();
  sheets.crearPlanilla('i1');
  await sheets.escribir('i1', 'recetas!A1:M1', [COLUMNAS]);
  await sheets.escribir('i1', 'meta!A1:B1', [['schemaVersion', '1']]);
  await sheets.append('i1', 'recetas', [['r1', 'milanesas.md', 'Milanesas', 'Carnes', 'c1', '', '', '', '', '', '', '', String(Date.parse('2026-01-01T00:00:00.000Z'))]]);
  cache = crearCacheMemoria();
  store = crearStore({ drive, sheets, cache });
  await store.arrancar();
  await store.cargarIndice();
});

describe('guardar', () => {
  it('escribe el .md y deja la fila encolada, no escrita', async () => {
    const receta = parse(MD);
    receta.titulo = 'Milanesas napolitanas';
    const r = await store.guardar('r1', receta, {});
    expect(r.ok).toBe(true);
    expect(drive._store.get('r1').contenido).toContain('titulo: Milanesas napolitanas');
    expect(await cache.leerCola()).toHaveLength(1);
    const filas = await sheets.leer('i1', 'recetas!A1:M10');
    expect(filas[1][2]).toBe('Milanesas');  // la planilla todavía no se tocó
  });

  it('flush vuelca la cola a la planilla y la vacía', async () => {
    const receta = parse(MD);
    receta.titulo = 'Milanesas napolitanas';
    await store.guardar('r1', receta, {});
    await store.flush();
    const filas = await sheets.leer('i1', 'recetas!A1:M10');
    expect(filas[1][2]).toBe('Milanesas napolitanas');
    expect(await cache.leerCola()).toHaveLength(0);
  });

  it('la UI ve el cambio al instante, sin esperar el flush', async () => {
    const receta = parse(MD);
    receta.titulo = 'Otro título';
    await store.guardar('r1', receta, {});
    expect(store.entradas()[0].titulo).toBe('Otro título');
  });

  it('mover de carpeta cambia la categoría y llama a mover en Drive', async () => {
    await store.guardar('r1', parse(MD), { carpetaDestino: 'c2' });
    expect(drive._store.get('r1').parents).toEqual(['c2']);
    expect(store.entradas()[0].categoria).toBe('Postres');
  });

  it('si el archivo cambió en Drive no lo pisa', async () => {
    drive._store.get('r1').modifiedTime = '2026-06-01T00:00:00.000Z';
    const r = await store.guardar('r1', parse(MD), {});
    expect(r.ok).toBe(false);
    expect(r.conflicto).toBeDefined();
    expect(drive._store.get('r1').contenido).toBe(MD);
  });
});

describe('crear', () => {
  it('escribe un .md con titulo, el tag incompleto y nombre derivado del título', async () => {
    const r = await store.crear({ titulo: 'Ñoquis del 29', carpetaId: 'c1' });
    expect(r.nombre_archivo).toBe('noquis-del-29.md');
    const contenido = drive._store.get(r.id).contenido;
    expect(contenido).toContain('titulo: Ñoquis del 29');
    expect(contenido).toContain('incompleto');
  });

  it('sin carpeta cae en la raíz, que es la bandeja de entrada', async () => {
    const r = await store.crear({ titulo: 'Suelta' });
    expect(drive._store.get(r.id).parents).toEqual(['raiz']);
    expect(store.entradas().find(e => e.id_archivo === r.id).categoria).toBe('Sin categorizar');
  });

  it('no pisa un nombre existente', async () => {
    const r = await store.crear({ titulo: 'Milanesas', carpetaId: 'c1' });
    expect(r.nombre_archivo).toBe('milanesas-2.md');
  });
});

describe('borrar', () => {
  it('borra el archivo y saca la fila del índice', async () => {
    await store.borrar('r1', { borrarFotos: false });
    expect(drive._store.has('r1')).toBe(false);
    expect(store.entradas()).toHaveLength(0);
  });

  it('con borrarFotos elimina las fotos de Drive que la receta referenciaba', async () => {
    drive._store.set('f1', { id: 'f1', name: 'foto.jpg', parents: ['fotos'] });
    drive._store.get('r1').contenido = `---\ntitulo: X\n---\n\n![](https://drive.google.com/file/d/f1/view)\n`;
    const r = await store.borrar('r1', { borrarFotos: true });
    expect(r.fotosBorradas).toEqual(['f1']);
    expect(drive._store.has('f1')).toBe(false);
  });

  it('sin borrarFotos las deja intactas', async () => {
    drive._store.set('f1', { id: 'f1', name: 'foto.jpg', parents: ['fotos'] });
    drive._store.get('r1').contenido = `---\ntitulo: X\n---\n\n![](https://drive.google.com/file/d/f1/view)\n`;
    await store.borrar('r1', { borrarFotos: false });
    expect(drive._store.has('f1')).toBe(true);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/store-escritura.test.js`
Expected: FAIL — `guardar`, `crear`, `borrar` y `flush` no existen.

- [ ] **Step 3: Implementar**

```javascript
// src/store.js — agregar dentro de crearStore
import { serialize, slugArchivo } from './recipe.js';   // sumar a los imports

  /** Los ids de Drive que aparecen en las URLs de las imágenes del .md (§3.3). */
  function idsDeFotos(texto) {
    const ids = [];
    const re = /!\[[^\]]*\]\((?:https?:\/\/[^)]*?\/d\/([A-Za-z0-9_-]+)|[^)]*)\)/g;
    let m;
    while ((m = re.exec(texto)) !== null) if (m[1]) ids.push(m[1]);
    return [...new Set(ids)];
  }

  async function guardar(id, receta, { carpetaDestino } = {}) {
    const entrada = entradas.find(e => e.id_archivo === id);
    const meta = await drive.metadatos(id);
    const remoto = Date.parse(meta.modifiedTime) || 0;

    // No se pisa lo que cambió afuera: Drive no tiene escritura condicional (§8).
    if (entrada && remoto && entrada.mtime && remoto !== entrada.mtime) {
      return { ok: false, conflicto: { remoto, local: entrada.mtime } };
    }

    const texto = serialize(receta);
    const actualizado = await drive.actualizar(id, texto);
    await cache.guardarCuerpo(id, texto);

    let carpeta_id = entrada?.carpeta_id ?? ctx.raizId;
    if (carpetaDestino && carpetaDestino !== carpeta_id) {
      await drive.mover(id, { de: carpeta_id, a: carpetaDestino });
      carpeta_id = carpetaDestino;
    }

    const ubicacion = {
      id,
      nombre_archivo: entrada?.nombre_archivo ?? meta.name,
      categoria: ctx.carpetas.get(carpeta_id) ?? CATEGORIA_RAIZ,
      carpeta_id,
      mtime: Date.parse(actualizado.modifiedTime) || Date.now()
    };

    const nueva = entradaDesdeFila(filaDesde(receta, ubicacion));
    entradas = [...entradas.filter(e => e.id_archivo !== id), nueva];
    await cache.guardarIndice(entradas);
    await cache.encolar({ tipo: 'fila', id, fila: filaDesde(receta, ubicacion) });
    return { ok: true };
  }

  async function crear({ titulo, carpetaId }) {
    const padre = carpetaId ?? ctx.raizId;
    const hermanos = (await drive.listarHijos(padre)).map(a => a.name);
    const nombre = slugArchivo(titulo, hermanos);
    const receta = { ...parse(''), titulo, tags: ['incompleto'] };
    const texto = serialize(receta);
    const archivo = await drive.crear({ nombre, contenido: texto, padre });

    const ubicacion = {
      id: archivo.id, nombre_archivo: nombre,
      categoria: ctx.carpetas.get(padre) ?? CATEGORIA_RAIZ,
      carpeta_id: padre, mtime: Date.parse(archivo.modifiedTime) || Date.now()
    };
    entradas = [...entradas, entradaDesdeFila(filaDesde(receta, ubicacion))];
    await cache.guardarCuerpo(archivo.id, texto);
    await cache.guardarIndice(entradas);
    await cache.encolar({ tipo: 'fila', id: archivo.id, fila: filaDesde(receta, ubicacion) });
    return { id: archivo.id, nombre_archivo: nombre };
  }

  async function fotosDe(id) {
    const texto = (await cache.leerCuerpo(id)) ?? (await drive.leerTexto(id));
    return idsDeFotos(texto);
  }

  async function borrar(id, { borrarFotos = false } = {}) {
    const fotos = borrarFotos ? await fotosDe(id) : [];
    await drive.borrar(id);
    await borrarDelIndice(id);
    const fotosBorradas = [];
    for (const foto of fotos) {
      try { await drive.borrar(foto); fotosBorradas.push(foto); } catch { /* ya no estaba */ }
    }
    await cache.guardarIndice(entradas);
    return { fotosBorradas };
  }

  async function flush() {
    const cola = await cache.leerCola();
    for (const op of cola) {
      if (op.tipo !== 'fila') continue;
      const nro = filas.get(op.id);
      if (nro) await sheets.escribir(ctx.indiceId, rangoDeFila(nro), [op.fila]);
      else {
        await sheets.append(ctx.indiceId, HOJA_RECETAS, [op.fila]);
        filas.set(op.id, filas.size + 2);
      }
    }
    await cache.vaciarCola();
    await cache.guardarMapaFilas(filas);
  }
```

Agregar al objeto devuelto: `guardar`, `crear`, `borrar`, `fotosDe`, `flush`.

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test`
Expected: PASS, 11 tests nuevos.

- [ ] **Step 5: Commit**

```bash
git add src/store.js tests/store-escritura.test.js
git commit -m "store.js: guardar sin pisar, crear con tag incompleto, borrar con fotos"
```

---

### Task 14: `store.js` — reconstrucción total

**Files:**
- Modify: `src/store.js`
- Test: `tests/store-reconstruccion.test.js`

**Interfaces:**
- Produces: `reconstruir(alProgresar) → {indexadas, ignoradasSinTitulo}`. `alProgresar` recibe `{leidas, total}`.
- Secuencia obligatoria (§5.3): marcar `reconstruccion_en_curso` → descartar la cola → listar raíz y cada categoría → leer todos los `.md` → reescribir la hoja `recetas` desde cero → resetear `changesPageToken` → escribir `ultima_reconstruccion` y limpiar el flag.

- [ ] **Step 1: Escribir los tests que fallan**

```javascript
// tests/store-reconstruccion.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { crearStore } from '../src/store.js';
import { crearCacheMemoria } from '../src/cache.js';
import { driveFalso, sheetsFalso } from './dobles.js';
import { COLUMNAS } from '../src/catalogo.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const md = (titulo) => `---\ntitulo: ${titulo}\n---\n\n## Ingredientes\n- sal\n`;

let drive, sheets, cache, store;

beforeEach(async () => {
  drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
    { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'fotos', name: '_fotos', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
    { id: 'r1', name: 'a.md', parents: ['c1'], contenido: md('Asado') },
    { id: 'r2', name: 'b.md', parents: ['c1'], contenido: md('Bife') },
    { id: 'r3', name: 'suelta.md', parents: ['raiz'], contenido: md('Suelta') },
    { id: 'x1', name: 'sin-titulo.md', parents: ['c1'], contenido: '---\nrinde: 2\n---\n' },
    { id: 'f1', name: 'foto.jpg', mimeType: 'image/jpeg', parents: ['fotos'] }
  ]);
  sheets = sheetsFalso();
  sheets.crearPlanilla('i1');
  await sheets.escribir('i1', 'recetas!A1:M1', [COLUMNAS]);
  await sheets.escribir('i1', 'meta!A1:B1', [['schemaVersion', '1']]);
  cache = crearCacheMemoria();
  store = crearStore({ drive, sheets, cache });
  await store.arrancar();
});

describe('reconstruir', () => {
  it('indexa la raíz y las categorías, y saltea _fotos', async () => {
    const r = await store.reconstruir();
    expect(r.indexadas).toBe(3);
    const titulos = store.entradas().map(e => e.titulo).sort();
    expect(titulos).toEqual(['Asado', 'Bife', 'Suelta']);
  });

  it('las recetas de la raíz quedan como Sin categorizar', async () => {
    await store.reconstruir();
    expect(store.entradas().find(e => e.titulo === 'Suelta').categoria).toBe('Sin categorizar');
  });

  it('cuenta las ignoradas por no tener titulo, sin borrar el archivo', async () => {
    const r = await store.reconstruir();
    expect(r.ignoradasSinTitulo).toBe(1);
    expect(drive._store.has('x1')).toBe(true);
  });

  it('descarta la cola antes de empezar', async () => {
    await cache.encolar({ tipo: 'fila', id: 'viejo', fila: ['viejo'] });
    await store.reconstruir();
    expect(await cache.leerCola()).toHaveLength(0);
  });

  it('deja el flag limpio y la fecha escrita al terminar', async () => {
    await store.reconstruir();
    const meta = Object.fromEntries((await sheets.leer('i1', 'meta!A1:B20')).map(f => [f[0], f[1]]));
    expect(meta.reconstruccion_en_curso).toBeFalsy();
    expect(meta.ultima_reconstruccion).toBeTruthy();
    expect(meta.changesPageToken).toBeTruthy();
  });

  it('reporta progreso mientras lee', async () => {
    const vistos = [];
    await store.reconstruir(p => vistos.push(p.leidas));
    expect(vistos.length).toBeGreaterThan(0);
    expect(vistos.at(-1)).toBe(4);
  });

  it('reemplaza la planilla entera en vez de agregar filas duplicadas', async () => {
    await store.reconstruir();
    await store.reconstruir();
    const filas = await sheets.leer('i1', 'recetas!A1:M100');
    expect(filas.length).toBe(4);  // encabezado + tres recetas
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/store-reconstruccion.test.js`
Expected: FAIL — `reconstruir` no existe.

- [ ] **Step 3: Implementar**

```javascript
// src/store.js — agregar dentro de crearStore

  async function reconstruir(alProgresar = () => {}) {
    await guardarMeta('reconstruccion_en_curso', 'si');
    await cache.vaciarCola();   // cada op es redundante: el .md ya está en Drive (§5.3)

    const lugares = [
      { id: ctx.raizId, categoria: CATEGORIA_RAIZ },
      ...ctx.categorias.map(c => ({ id: c.id, categoria: c.nombre }))
    ];

    const pendientes = [];
    for (const lugar of lugares) {
      const hijos = await drive.listarHijos(lugar.id);
      for (const archivo of hijos) {
        if (archivo.mimeType === 'application/vnd.google-apps.folder') continue;
        if (!/\.md$/i.test(archivo.name)) continue;
        pendientes.push({ archivo, lugar });
      }
    }

    const nuevas = [];
    let ignoradasSinTitulo = 0;
    let leidas = 0;
    for (const { archivo, lugar } of pendientes) {
      const texto = await drive.leerTexto(archivo.id);
      leidas++;
      alProgresar({ leidas, total: pendientes.length });
      const receta = parse(texto);
      if (!receta.titulo) { ignoradasSinTitulo++; continue; }
      nuevas.push(filaDesde(receta, {
        id: archivo.id, nombre_archivo: archivo.name,
        categoria: lugar.categoria, carpeta_id: lugar.id,
        mtime: Date.parse(archivo.modifiedTime) || 0
      }));
    }

    const hojas = await sheets.hojas(ctx.indiceId);
    const hojaId = hojas.find(h => h.title === HOJA_RECETAS)?.sheetId ?? 0;
    const previas = await sheets.leer(ctx.indiceId, `${HOJA_RECETAS}!A1:M100000`);
    for (let fila = previas.length; fila >= 2; fila--) {
      await sheets.borrarFila(ctx.indiceId, hojaId, fila);
    }
    for (let i = 0; i < nuevas.length; i += 500) {
      await sheets.append(ctx.indiceId, HOJA_RECETAS, nuevas.slice(i, i + 500));
    }

    entradas = nuevas.map(entradaDesdeFila);
    filas = new Map(entradas.map((e, i) => [e.id_archivo, i + 2]));
    await cache.guardarIndice(entradas);
    await cache.guardarMapaFilas(filas);

    await guardarMeta('changesPageToken', await drive.tokenInicialDeCambios());
    await guardarMeta('ultima_reconstruccion', new Date().toISOString());
    await guardarMeta('reconstruccion_en_curso', '');

    return { indexadas: entradas.length, ignoradasSinTitulo };
  }
```

Agregar `reconstruir` al objeto devuelto.

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test`
Expected: PASS, 7 tests nuevos.

- [ ] **Step 5: Commit**

```bash
git add src/store.js tests/store-reconstruccion.test.js
git commit -m "store.js: reconstrucción con flag, progreso y cola descartada"
```

---

### Task 15: `store.js` — búsqueda y filtros

**Files:**
- Modify: `src/store.js`
- Test: `tests/store-busqueda.test.js`

**Interfaces:**
- Produces:
  - `buscar({texto, categoria, tags, dificultad}) → entradas[]` — todo opcional; sin nada devuelve el índice entero. Compara normalizando (§3.2).
  - `categoriasConConteo() → [{id, nombre, cantidad}]` — incluye `Sin categorizar` solo si tiene recetas.
  - `tagsDe(categoria) → [{tag, cantidad}]` — para los chips, ordenados por frecuencia.
  - `receta(id) → {entrada, receta, texto}` — del cache si está, de Drive si no.

- [ ] **Step 1: Escribir los tests que fallan**

```javascript
// tests/store-busqueda.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { crearStore } from '../src/store.js';
import { crearCacheMemoria } from '../src/cache.js';
import { driveFalso, sheetsFalso } from './dobles.js';
import { COLUMNAS } from '../src/catalogo.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const fila = (id, titulo, categoria, carpeta, tags, ingredientes, dificultad = '') =>
  [id, `${id}.md`, titulo, categoria, carpeta, '', '', dificultad, '', tags, ingredientes, '', '1000'];

let store, sheets;

beforeEach(async () => {
  const drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
    { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'c2', name: 'Postres', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] }
  ]);
  sheets = sheetsFalso();
  sheets.crearPlanilla('i1');
  await sheets.escribir('i1', 'recetas!A1:M1', [COLUMNAS]);
  await sheets.escribir('i1', 'meta!A1:B1', [['schemaVersion', '1']]);
  await sheets.append('i1', 'recetas', [
    fila('r1', 'Milanesas napolitanas', 'Carnes', 'c1', 'horno|rápido', 'muzzarella|nalga', 'fácil'),
    fila('r2', 'Bife de chorizo', 'Carnes', 'c1', 'parrilla', 'bife', 'fácil'),
    fila('r3', 'Flan casero', 'Postres', 'c2', 'incompleto', 'huevo|leche', 'media')
  ]);
  store = crearStore({ drive, sheets, cache: crearCacheMemoria() });
  await store.arrancar();
  await store.cargarIndice();
});

describe('buscar', () => {
  it('sin filtros devuelve todo', async () => {
    expect(store.buscar({})).toHaveLength(3);
  });

  it('busca en el título ignorando tildes y mayúsculas', () => {
    expect(store.buscar({ texto: 'MILANESAS' }).map(e => e.id_archivo)).toEqual(['r1']);
    expect(store.buscar({ texto: 'flan' }).map(e => e.id_archivo)).toEqual(['r3']);
  });

  it('busca también por ingrediente', () => {
    expect(store.buscar({ texto: 'muzzarella' }).map(e => e.id_archivo)).toEqual(['r1']);
  });

  it('filtra por categoría', () => {
    expect(store.buscar({ categoria: 'Carnes' })).toHaveLength(2);
  });

  it('filtra por tag, y varios tags piden todos', () => {
    expect(store.buscar({ tags: ['horno'] }).map(e => e.id_archivo)).toEqual(['r1']);
    expect(store.buscar({ tags: ['horno', 'parrilla' ] })).toHaveLength(0);
  });

  it('filtra por dificultad', () => {
    expect(store.buscar({ dificultad: 'fácil' })).toHaveLength(2);
  });

  it('combina filtros', () => {
    expect(store.buscar({ categoria: 'Carnes', tags: ['rápido'] }).map(e => e.id_archivo)).toEqual(['r1']);
  });

  it('lista lo que falta terminar filtrando por incompleto', () => {
    expect(store.buscar({ tags: ['incompleto'] }).map(e => e.id_archivo)).toEqual(['r3']);
  });
});

describe('categoriasConConteo', () => {
  it('cuenta las recetas de cada categoría', () => {
    const c = store.categoriasConConteo();
    expect(c.find(x => x.nombre === 'Carnes').cantidad).toBe(2);
    expect(c.find(x => x.nombre === 'Postres').cantidad).toBe(1);
  });

  it('no muestra Sin categorizar cuando la raíz está vacía', () => {
    expect(store.categoriasConConteo().some(c => c.nombre === 'Sin categorizar')).toBe(false);
  });
});

describe('tagsDe', () => {
  it('devuelve los tags de una categoría ordenados por frecuencia', () => {
    expect(store.tagsDe('Carnes').map(t => t.tag)).toEqual(['horno', 'rápido', 'parrilla']);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/store-busqueda.test.js`
Expected: FAIL — `buscar` no existe.

- [ ] **Step 3: Implementar**

```javascript
// src/store.js — agregar dentro de crearStore
import { normalizar } from './recipe.js';   // sumar a los imports

  function buscar({ texto = '', categoria = '', tags = [], dificultad = '' } = {}) {
    const t = normalizar(texto);
    return entradas.filter(e => {
      if (categoria && e.categoria !== categoria) return false;
      if (dificultad && e.dificultad !== dificultad) return false;
      if (tags.length && !tags.every(tag => e.tags.includes(tag))) return false;
      if (!t) return true;
      return normalizar(e.titulo).includes(t) || e.ingredientes.some(i => normalizar(i).includes(t));
    });
  }

  function categoriasConConteo() {
    const cuenta = new Map();
    for (const e of entradas) cuenta.set(e.categoria, (cuenta.get(e.categoria) ?? 0) + 1);
    const lista = ctx.categorias.map(c => ({ id: c.id, nombre: c.nombre, cantidad: cuenta.get(c.nombre) ?? 0 }));
    const sueltas = cuenta.get(CATEGORIA_RAIZ) ?? 0;
    if (sueltas > 0) lista.unshift({ id: ctx.raizId, nombre: CATEGORIA_RAIZ, cantidad: sueltas });
    return lista;
  }

  function tagsDe(categoria) {
    const cuenta = new Map();
    for (const e of entradas) {
      if (categoria && e.categoria !== categoria) continue;
      for (const tag of e.tags) cuenta.set(tag, (cuenta.get(tag) ?? 0) + 1);
    }
    return [...cuenta].map(([tag, cantidad]) => ({ tag, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad || a.tag.localeCompare(b.tag));
  }

  async function receta(id) {
    const entrada = entradas.find(e => e.id_archivo === id) ?? null;
    let texto = await cache.leerCuerpo(id);
    if (texto === null) {
      texto = await drive.leerTexto(id);
      await cache.guardarCuerpo(id, texto);
    }
    return { entrada, receta: parse(texto), texto };
  }
```

Agregar al objeto devuelto: `buscar`, `categoriasConConteo`, `tagsDe`, `receta`.

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test`
Expected: PASS, 11 tests nuevos.

- [ ] **Step 5: Commit**

```bash
git add src/store.js tests/store-busqueda.test.js
git commit -m "store.js: búsqueda por título e ingrediente, filtros y conteos"
```

---

### Task 16: `ui/markdown.js` — render mínimo y seguro

**Files:**
- Create: `src/ui/markdown.js`
- Test: `tests/markdown.test.js`

**Interfaces:**
- Produces: `aHtml(texto, {pasos = false}) → string`. Soporta exactamente lo que el §3.2 permite en el cuerpo: `###`, listas con `-`, listas numeradas, `![](url)`, `**negrita**`, `*itálica*` y párrafos. Todo lo demás va como texto plano.
- **Escapa siempre el HTML de entrada.** Los `.md` los escriben agentes: no se confía en su contenido.
- Con `pasos: true`, cada ítem de lista numerada se emite como `<li class="paso"><button class="check" aria-pressed="false">` — es lo que hace marcables los pasos de la preparación (§11).

- [ ] **Step 1: Escribir los tests que fallan**

```javascript
// tests/markdown.test.js
import { describe, it, expect } from 'vitest';
import { aHtml } from '../src/ui/markdown.js';

describe('aHtml', () => {
  it('escapa el HTML de entrada', () => {
    expect(aHtml('<script>alert(1)</script>')).not.toContain('<script>');
    expect(aHtml('<script>alert(1)</script>')).toContain('&lt;script&gt;');
  });

  it('convierte listas con guiones', () => {
    expect(aHtml('- sal\n- pimienta')).toBe('<ul><li>sal</li><li>pimienta</li></ul>');
  });

  it('convierte subsecciones ### en h3', () => {
    expect(aHtml('### Para la salsa')).toBe('<h3>Para la salsa</h3>');
  });

  it('convierte imágenes', () => {
    expect(aHtml('![](https://a/1)')).toContain('<img src="https://a/1"');
  });

  it('convierte párrafos', () => {
    expect(aHtml('Hola.\n\nChau.')).toBe('<p>Hola.</p><p>Chau.</p>');
  });

  it('con pasos:true emite ítems marcables', () => {
    const html = aHtml('1. Precalentar.\n2. Hornear.', { pasos: true });
    expect(html).toContain('class="paso"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('Precalentar.');
  });

  it('sin pasos, una lista numerada es una lista común', () => {
    expect(aHtml('1. Precalentar.')).toBe('<ol><li>Precalentar.</li></ol>');
  });

  it('negrita e itálica', () => {
    expect(aHtml('**fuerte** y *suave*')).toBe('<p><strong>fuerte</strong> y <em>suave</em></p>');
  });

  it('un texto vacío devuelve cadena vacía', () => {
    expect(aHtml('')).toBe('');
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/markdown.test.js`
Expected: FAIL — no existe `src/ui/markdown.js`.

- [ ] **Step 3: Implementar**

```javascript
// src/ui/markdown.js

export function escapar(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function enLinea(texto) {
  return escapar(texto)
    .replace(/!\[[^\]]*\]\(([^)\s]+)\)/g, (_, url) => `<img src="${url}" alt="" loading="lazy">`)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

export function aHtml(texto, { pasos = false } = {}) {
  const lineas = String(texto ?? '').split('\n');
  const salida = [];
  let lista = null;   // 'ul' | 'ol' | null
  let parrafo = [];

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
      if (lista !== 'ol') { cerrarLista(); salida.push('<ol>'); lista = 'ol'; }
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
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test`
Expected: PASS, 9 tests nuevos.

- [ ] **Step 5: Commit**

```bash
git add src/ui/markdown.js tests/markdown.test.js
git commit -m "ui/markdown.js: render mínimo que escapa todo lo que viene del .md"
```

---

### Task 17: Tokens, hoja de estilos y router

**Files:**
- Create: `src/ui/tokens.css`, `src/ui/app.css`, `src/ui/router.js`
- Test: `tests/router.test.js`

**Interfaces:**
- Produces:
  - `tokens.css` — exactamente los tokens del §7.3 como variables CSS, en `:root` y bajo `@media (prefers-color-scheme: dark)`. Ningún otro archivo define un color literal.
  - `router.js`: `parsearHash(hash) → {vista, params}` y `crearRouter(alCambiar) → {ir(vista, params), atras()}`. Rutas: `#/` (home), `#/c/<nombre>` (categoría), `#/buscar?q=` (resultados), `#/r/<id>` (detalle), `#/r/<id>/editar`, `#/nueva`.

- [ ] **Step 1: Escribir los tests que fallan**

```javascript
// tests/router.test.js
import { describe, it, expect } from 'vitest';
import { parsearHash } from '../src/ui/router.js';

describe('parsearHash', () => {
  it('la raíz es el home', () => {
    expect(parsearHash('#/')).toEqual({ vista: 'home', params: {} });
    expect(parsearHash('')).toEqual({ vista: 'home', params: {} });
  });

  it('categoría con el nombre decodificado', () => {
    expect(parsearHash('#/c/Panes%20y%20masas')).toEqual({ vista: 'categoria', params: { nombre: 'Panes y masas' } });
  });

  it('búsqueda con su query', () => {
    expect(parsearHash('#/buscar?q=milanesas')).toEqual({ vista: 'buscar', params: { q: 'milanesas' } });
  });

  it('detalle y edición de una receta', () => {
    expect(parsearHash('#/r/abc123')).toEqual({ vista: 'detalle', params: { id: 'abc123' } });
    expect(parsearHash('#/r/abc123/editar')).toEqual({ vista: 'editar', params: { id: 'abc123' } });
  });

  it('alta de receta', () => {
    expect(parsearHash('#/nueva')).toEqual({ vista: 'nueva', params: {} });
  });

  it('una ruta desconocida cae en el home en vez de romper', () => {
    expect(parsearHash('#/cualquiera/cosa')).toEqual({ vista: 'home', params: {} });
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/router.test.js`
Expected: FAIL — no existe `src/ui/router.js`.

- [ ] **Step 3: Implementar**

```css
/* src/ui/tokens.css — los tokens del §7.3 y nada más */
:root {
  color-scheme: light dark;

  --fondo: #ffffff;
  --superficie: #f2f2f7;
  --texto: #1c1c1e;
  --texto-2: #6e6e73;
  --separador: #e5e5ea;
  --acento: #0a5fd0;
  --ambar: #b06f00;

  --tipo: -apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', Roboto, sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, monospace;

  --t-titulo: 1.375rem;
  --t-seccion: 1.125rem;
  --t-cuerpo: 1.0625rem;
  --t-fila: 1rem;
  --t-chip: 0.875rem;
  --t-meta: 0.8125rem;

  --interlineado: 1.62;
  --gap: 0.25rem;       /* la grilla de 4 px */
  --margen: 1rem;
  --radio: 0.5rem;
  --tactil: 2.75rem;    /* 44 px */
}

@media (prefers-color-scheme: dark) {
  :root {
    --fondo: #1c1c1e;
    --superficie: #2c2c2e;
    --texto: #f2f2f7;
    --texto-2: #98989d;
    --separador: #38383a;
    --acento: #5aa9ff;
    --ambar: #e0a94a;
  }
}
```

```css
/* src/ui/app.css — layout y componentes; ningún color literal, solo tokens */
* { box-sizing: border-box; }
body { margin: 0; background: var(--fondo); color: var(--texto); font-family: var(--tipo); font-size: var(--t-cuerpo); line-height: var(--interlineado); }
a, button { font: inherit; color: inherit; }
button { background: none; border: 0; cursor: pointer; min-height: var(--tactil); min-width: var(--tactil); }

.encabezado { display: flex; align-items: center; gap: var(--margen); padding: var(--margen); border-bottom: 1px solid var(--separador); }
.encabezado h1 { font-size: var(--t-titulo); margin: 0; flex: 1; }
.buscador { width: 100%; padding: 0.75rem; border: 1px solid var(--separador); border-radius: var(--radio); background: var(--superficie); color: var(--texto); }

.tiles { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; padding: var(--margen); }
.tile { text-align: left; padding: 1rem; border-radius: var(--radio); background: var(--superficie); min-height: 4.5rem; }
.tile .cuenta { display: block; color: var(--texto-2); font-size: var(--t-meta); }

.chips { display: flex; gap: var(--gap); overflow-x: auto; padding: 0.5rem var(--margen); }
.chip { padding: 0.375rem 0.75rem; border-radius: 999px; background: var(--superficie); font-size: var(--t-chip); white-space: nowrap; }
.chip[aria-pressed="true"] { background: var(--acento); color: var(--fondo); }

.fila { display: flex; gap: 0.75rem; align-items: center; padding: 0.75rem var(--margen); border-bottom: 1px solid var(--separador); width: 100%; text-align: left; }
.fila .miniatura { width: 2.5rem; height: 2.5rem; border-radius: var(--radio); background: var(--superficie); object-fit: cover; flex: none; }
.fila .titulo { font-size: var(--t-fila); font-weight: 550; }
.fila .meta { font-size: var(--t-meta); color: var(--texto-2); }
.incompleto::after { content: ""; display: inline-block; width: 0.4rem; height: 0.4rem; border-radius: 50%; background: var(--ambar); margin-left: 0.375rem; vertical-align: middle; }

.portada { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
.pestanas { display: flex; gap: 1rem; padding: 0 var(--margen); border-bottom: 1px solid var(--separador); }
.pestana[aria-selected="true"] { color: var(--acento); box-shadow: inset 0 -2px 0 var(--acento); font-weight: 600; }
.pestana[disabled] { color: var(--texto-2); opacity: 0.5; }
.contenido { padding: var(--margen); }
.contenido h3 { font-size: var(--t-seccion); }
.contenido img { max-width: 100%; border-radius: var(--radio); }

.paso { display: flex; gap: 0.75rem; align-items: flex-start; margin-bottom: 0.875rem; list-style: none; }
.paso .check { flex: none; width: 1.5rem; height: 1.5rem; min-width: 0; min-height: 0; border: 2px solid var(--texto-2); border-radius: 50%; }
.paso .check[aria-pressed="true"] { background: var(--acento); border-color: var(--acento); }
.paso .check[aria-pressed="true"] + span { color: var(--texto-2); text-decoration: line-through; }
ol:has(.paso) { padding: 0; }

.campo { display: block; margin-bottom: 0.75rem; }
.campo span { display: block; font-size: var(--t-meta); color: var(--texto-2); text-transform: uppercase; letter-spacing: 0.05em; }
.campo input, .campo select, .campo textarea { width: 100%; padding: 0.5rem; border: 1px solid var(--separador); border-radius: var(--radio); background: var(--fondo); color: var(--texto); }
.campo textarea { font-family: var(--mono); font-size: 0.9375rem; min-height: 8rem; }
.otras { border: 1px dashed var(--ambar); border-radius: var(--radio); padding: 0.75rem; }
```

```javascript
// src/ui/router.js
export function parsearHash(hash) {
  const limpio = String(hash ?? '').replace(/^#/, '');
  const [ruta, query = ''] = limpio.split('?');
  const partes = ruta.split('/').filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(query));

  if (partes.length === 0) return { vista: 'home', params: {} };
  if (partes[0] === 'c' && partes[1]) return { vista: 'categoria', params: { nombre: decodeURIComponent(partes[1]) } };
  if (partes[0] === 'buscar') return { vista: 'buscar', params: { q: params.q ?? '' } };
  if (partes[0] === 'nueva') return { vista: 'nueva', params: {} };
  if (partes[0] === 'r' && partes[1]) {
    if (partes[2] === 'editar') return { vista: 'editar', params: { id: partes[1] } };
    if (!partes[2]) return { vista: 'detalle', params: { id: partes[1] } };
  }
  return { vista: 'home', params: {} };
}

export function crearRouter(alCambiar) {
  const disparar = () => alCambiar(parsearHash(location.hash));
  window.addEventListener('hashchange', disparar);
  return {
    ir: (hash) => { location.hash = hash; },
    atras: () => history.back(),
    iniciar: disparar
  };
}
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test`
Expected: PASS, 6 tests nuevos.

- [ ] **Step 5: Commit**

```bash
git add src/ui/tokens.css src/ui/app.css src/ui/router.js tests/router.test.js
git commit -m "ui: tokens del §7.3, hoja de estilos y router por hash"
```

---

### Task 18: Home y lista

**Files:**
- Create: `src/ui/home.js`, `src/ui/lista.js`
- Test: `tests/vistas-listas.test.js`

**Interfaces:**
- Produces:
  - `home.js`: `renderHome({categorias, ultimaReconstruccion}) → string` — grilla de tiles con conteo, buscador y menú de overflow con *Reconstruir índice* y *Reconectar cuenta* (§7.2).
  - `lista.js`: `renderLista({titulo, entradas, tags, tagsActivos, miniaturas}) → string` — filas compactas con miniatura, título y meta en una línea, chips arriba, punto ámbar en las `incompleto`.
- Ambas son funciones puras que devuelven HTML. Los listeners se enganchan en `main.js` por delegación de eventos.

- [ ] **Step 1: Escribir los tests que fallan**

```javascript
// tests/vistas-listas.test.js
import { describe, it, expect } from 'vitest';
import { renderHome } from '../src/ui/home.js';
import { renderLista } from '../src/ui/lista.js';

const ENTRADAS = [
  { id_archivo: 'r1', titulo: 'Milanesas napolitanas', rinde: '4 porciones', tiempo: '40 min', dificultad: 'fácil', tags: ['horno'], foto: 'https://drive.google.com/file/d/1/view' },
  { id_archivo: 'r2', titulo: 'Matambre a la pizza', rinde: '', tiempo: '', dificultad: '', tags: ['incompleto'], foto: '' }
];

describe('renderHome', () => {
  it('dibuja un tile por categoría con su conteo', () => {
    const html = renderHome({ categorias: [{ id: 'c1', nombre: 'Carnes', cantidad: 33 }] });
    expect(html).toContain('Carnes');
    expect(html).toContain('33');
    expect(html).toContain('href="#/c/Carnes"');
  });

  it('escapa los nombres de categoría', () => {
    const html = renderHome({ categorias: [{ id: 'c1', nombre: '<b>x</b>', cantidad: 1 }] });
    expect(html).not.toContain('<b>x</b>');
  });

  it('ofrece reconstruir con la fecha de la última reconstrucción', () => {
    const html = renderHome({ categorias: [], ultimaReconstruccion: '2026-09-01T10:00:00.000Z' });
    expect(html).toContain('Reconstruir índice');
    expect(html).toContain('2026');
  });

  it('ofrece reconectar la cuenta', () => {
    expect(renderHome({ categorias: [] })).toContain('Reconectar cuenta');
  });
});

describe('renderLista', () => {
  it('dibuja una fila por receta con la meta en una línea', () => {
    const html = renderLista({ titulo: 'Carnes', entradas: ENTRADAS });
    expect(html).toContain('Milanesas napolitanas');
    expect(html).toContain('4 porciones · 40 min · fácil');
  });

  it('marca con la clase incompleto solo a las que tienen el tag', () => {
    const html = renderLista({ titulo: 'Carnes', entradas: ENTRADAS });
    const filas = html.split('class="fila');
    expect(filas[1]).not.toContain('incompleto');
    expect(filas[2]).toContain('incompleto');
  });

  it('una receta sin foto usa el cuadro vacío y no una imagen rota', () => {
    const html = renderLista({ titulo: 'Carnes', entradas: [ENTRADAS[1]] });
    expect(html).toContain('<div class="miniatura"');
    expect(html).not.toContain('<img class="miniatura" src=""');
  });

  it('usa la miniatura de Drive cuando la hay', () => {
    const html = renderLista({ titulo: 'Carnes', entradas: ENTRADAS, miniaturas: new Map([['1', 'https://mini/1']]) });
    expect(html).toContain('https://mini/1');
  });

  it('dibuja los chips y marca los activos', () => {
    const html = renderLista({ titulo: 'Carnes', entradas: ENTRADAS, tags: [{ tag: 'horno', cantidad: 1 }], tagsActivos: ['horno'] });
    expect(html).toContain('aria-pressed="true"');
  });

  it('una categoría vacía dice que está vacía en vez de quedar en blanco', () => {
    expect(renderLista({ titulo: 'Carnes', entradas: [] })).toContain('Todavía no hay recetas');
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/vistas-listas.test.js`
Expected: FAIL — no existen las vistas.

- [ ] **Step 3: Implementar**

```javascript
// src/ui/home.js
import { escapar } from './markdown.js';

export function renderHome({ categorias = [], ultimaReconstruccion = '' } = {}) {
  const fecha = ultimaReconstruccion
    ? new Date(ultimaReconstruccion).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'nunca';

  const tiles = categorias.map(c => `
    <a class="tile" href="#/c/${encodeURIComponent(c.nombre)}">
      ${escapar(c.nombre)}
      <span class="cuenta">${c.cantidad}</span>
    </a>`).join('');

  return `
    <header class="encabezado">
      <h1>Recetario</h1>
      <button data-accion="menu" aria-label="Más acciones" aria-expanded="false">⋯</button>
    </header>
    <div class="chips"><input class="buscador" data-accion="buscar" type="search" placeholder="Buscar receta o ingrediente"></div>
    <nav class="tiles">${tiles}</nav>
    <div class="menu" hidden>
      <button data-accion="reconstruir">Reconstruir índice <span class="cuenta">última vez: ${escapar(fecha)}</span></button>
      <button data-accion="reconectar">Reconectar cuenta</button>
      <a class="tile" href="#/nueva">Nueva receta</a>
    </div>`;
}
```

```javascript
// src/ui/lista.js
import { escapar } from './markdown.js';

const idDeDrive = (url) => (String(url).match(/\/d\/([A-Za-z0-9_-]+)/) ?? [])[1] ?? null;

function miniatura(entrada, miniaturas) {
  const id = idDeDrive(entrada.foto);
  const mini = id && miniaturas?.get(id);
  if (mini) return `<img class="miniatura" src="${escapar(mini)}" alt="" loading="lazy">`;
  if (entrada.foto && !id) return `<img class="miniatura" src="${escapar(entrada.foto)}" alt="" loading="lazy">`;
  return '<div class="miniatura"></div>';
}

export function renderLista({ titulo, entradas = [], tags = [], tagsActivos = [], miniaturas } = {}) {
  const chips = tags.map(t => `
    <button class="chip" data-tag="${escapar(t.tag)}" aria-pressed="${tagsActivos.includes(t.tag)}">${escapar(t.tag)}</button>`).join('');

  const filas = entradas.map(e => {
    const meta = [e.rinde, e.tiempo, e.dificultad].filter(Boolean).join(' · ');
    const incompleto = e.tags?.includes('incompleto');
    return `
      <a class="fila" href="#/r/${escapar(e.id_archivo)}">
        ${miniatura(e, miniaturas)}
        <span>
          <span class="titulo${incompleto ? ' incompleto' : ''}">${escapar(e.titulo)}</span>
          <span class="meta">${escapar(meta || 'Sin datos')}</span>
        </span>
      </a>`;
  }).join('');

  return `
    <header class="encabezado">
      <button data-accion="atras" aria-label="Volver">‹</button>
      <h1>${escapar(titulo)}</h1>
      <span class="cuenta">${entradas.length}</span>
    </header>
    ${tags.length ? `<div class="chips">${chips}</div>` : ''}
    <div class="listado">${filas || '<p class="contenido">Todavía no hay recetas acá.</p>'}</div>`;
}
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test`
Expected: PASS, 11 tests nuevos.

- [ ] **Step 5: Commit**

```bash
git add src/ui/home.js src/ui/lista.js tests/vistas-listas.test.js
git commit -m "ui: home con tiles y menú, lista compacta con punto ámbar"
```

---

### Task 19: Detalle y visor de fotos

**Files:**
- Create: `src/ui/detalle.js`, `src/ui/visor.js`
- Test: `tests/vista-detalle.test.js`

**Interfaces:**
- Produces:
  - `renderDetalle({entrada, receta, pestana}) → string` — portada, título, meta y tres pestañas: Ingredientes, Preparación y Notas (que agrupa `## Notas` y `## Variaciones` y muestra el conteo, apagada si no hay ninguna).
  - `renderVisor({fotos, indice}) → string` — visor a pantalla completa.
- La portada **no se repite** en el cuerpo: es la primera imagen del documento (§3.3).
- Los pasos de la pestaña Preparación se emiten marcables (`aHtml(..., {pasos:true})`).

- [ ] **Step 1: Escribir los tests que fallan**

```javascript
// tests/vista-detalle.test.js
import { describe, it, expect } from 'vitest';
import { parse } from '../src/recipe.js';
import { renderDetalle } from '../src/ui/detalle.js';
import { renderVisor } from '../src/ui/visor.js';

const RECETA = parse(`---
titulo: Milanesas napolitanas
rinde: 4 porciones
tiempo: 40 min
dificultad: fácil
tags: [horno]
---

![](https://a/portada)

Un clásico.

## Ingredientes
- 200 g de muzzarella

## Preparación
1. Precalentar.
2. Hornear.

## Variaciones
### A la suiza
Gruyere.

## Notas
- Ojo con el horno.
`);

const ENTRADA = { id_archivo: 'r1', titulo: 'Milanesas napolitanas', tags: ['horno'] };

describe('renderDetalle', () => {
  it('pone la portada arriba y no la repite en el cuerpo', () => {
    const html = renderDetalle({ entrada: ENTRADA, receta: RECETA, pestana: 'ingredientes' });
    expect(html).toContain('class="portada" src="https://a/portada"');
    expect(html.split('https://a/portada')).toHaveLength(2);
  });

  it('muestra la meta junta', () => {
    const html = renderDetalle({ entrada: ENTRADA, receta: RECETA, pestana: 'ingredientes' });
    expect(html).toContain('4 porciones · 40 min · fácil');
  });

  it('la pestaña Notas cuenta notas y variaciones juntas', () => {
    const html = renderDetalle({ entrada: ENTRADA, receta: RECETA, pestana: 'ingredientes' });
    expect(html).toContain('Notas · 2');
  });

  it('la pestaña Notas queda apagada cuando no hay ninguna', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## Ingredientes\n- sal\n`);
    const html = renderDetalle({ entrada: ENTRADA, receta: r, pestana: 'ingredientes' });
    expect(html).toMatch(/data-pestana="notas"[^>]*disabled/);
  });

  it('los pasos de Preparación son marcables', () => {
    const html = renderDetalle({ entrada: ENTRADA, receta: RECETA, pestana: 'preparacion' });
    expect(html).toContain('class="paso"');
  });

  it('la descripción se muestra en el detalle', () => {
    const html = renderDetalle({ entrada: ENTRADA, receta: RECETA, pestana: 'ingredientes' });
    expect(html).toContain('Un clásico.');
  });

  it('las secciones desconocidas se muestran en Notas y no se pierden', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## Maridaje\nMalbec.\n`);
    const html = renderDetalle({ entrada: ENTRADA, receta: r, pestana: 'notas' });
    expect(html).toContain('Maridaje');
    expect(html).toContain('Malbec.');
  });

  it('una receta incompleta se ve marcada también en el detalle', () => {
    const html = renderDetalle({ entrada: { ...ENTRADA, tags: ['incompleto'] }, receta: RECETA, pestana: 'ingredientes' });
    expect(html).toContain('incompleto');
  });
});

describe('renderVisor', () => {
  it('muestra la foto pedida y cuántas hay', () => {
    const html = renderVisor({ fotos: ['https://a/1', 'https://a/2'], indice: 1 });
    expect(html).toContain('https://a/2');
    expect(html).toContain('2 / 2');
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/vista-detalle.test.js`
Expected: FAIL — no existen las vistas.

- [ ] **Step 3: Implementar**

```javascript
// src/ui/detalle.js
import { aHtml, escapar } from './markdown.js';
import { primeraImagen } from '../recipe.js';

/** Saca del texto la imagen que ya se muestra como portada, para no repetirla. */
function sinPortada(texto, portada) {
  if (!portada) return texto;
  return String(texto).replace(new RegExp(`!\\[[^\\]]*\\]\\(${portada.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`), '').trim();
}

export function renderDetalle({ entrada, receta, pestana = 'ingredientes' }) {
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
```

```javascript
// src/ui/visor.js
import { escapar } from './markdown.js';

export function renderVisor({ fotos = [], indice = 0 }) {
  if (!fotos.length) return '';
  return `
    <div class="visor" role="dialog" aria-label="Foto">
      <button data-accion="cerrar-visor" aria-label="Cerrar">✕</button>
      <img src="${escapar(fotos[indice])}" alt="">
      <p class="meta">${indice + 1} / ${fotos.length}</p>
      <button data-accion="foto-anterior" aria-label="Anterior">‹</button>
      <button data-accion="foto-siguiente" aria-label="Siguiente">›</button>
    </div>`;
}
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test`
Expected: PASS, 9 tests nuevos.

- [ ] **Step 5: Commit**

```bash
git add src/ui/detalle.js src/ui/visor.js tests/vista-detalle.test.js
git commit -m "ui: detalle con tres pestañas y pasos marcables, y visor de fotos"
```

---

### Task 20: Editor, alta y borrado

**Files:**
- Create: `src/ui/editor.js`
- Test: `tests/vista-editor.test.js`

**Interfaces:**
- Produces:
  - `renderEditor({receta, entrada, categorias, tagsConocidos}) → string` — los seis campos del frontmatter con carpeta y dificultad como selectores, un textarea por sección del cuerpo, y el bloque **"Otras secciones"** solo si el archivo trae encabezados desconocidos (§7.2).
  - `recetaDesdeFormulario(datos, recetaOriginal) → Receta` — arma la receta a guardar preservando `extras` y `otras`.
- El editor nunca esconde contenido del archivo: si hay `otras`, se editan.

- [ ] **Step 1: Escribir los tests que fallan**

```javascript
// tests/vista-editor.test.js
import { describe, it, expect } from 'vitest';
import { parse } from '../src/recipe.js';
import { renderEditor, recetaDesdeFormulario } from '../src/ui/editor.js';

const CATEGORIAS = [{ id: 'c1', nombre: 'Carnes' }, { id: 'c2', nombre: 'Postres' }];
const RECETA = parse(`---\ntitulo: Milanesas\ndificultad: fácil\ntags: [horno, incompleto]\nautor_agente: claude\n---\n\n## Ingredientes\n- sal\n\n## Maridaje\nMalbec.\n`);
const ENTRADA = { id_archivo: 'r1', carpeta_id: 'c1' };

describe('renderEditor', () => {
  it('pone carpeta y dificultad como selectores', () => {
    const html = renderEditor({ receta: RECETA, entrada: ENTRADA, categorias: CATEGORIAS });
    expect(html).toContain('<select name="carpeta"');
    expect(html).toContain('<select name="dificultad"');
    expect(html).toContain('<option value="c1" selected');
  });

  it('el resto del frontmatter va como texto', () => {
    const html = renderEditor({ receta: RECETA, entrada: ENTRADA, categorias: CATEGORIAS });
    expect(html).toContain('name="titulo"');
    expect(html).toContain('name="rinde"');
    expect(html).toContain('name="fuente"');
  });

  it('un textarea por sección del cuerpo, con el Markdown crudo', () => {
    const html = renderEditor({ receta: RECETA, entrada: ENTRADA, categorias: CATEGORIAS });
    for (const s of ['descripcion', 'ingredientes', 'preparacion', 'variaciones', 'notas']) {
      expect(html).toContain(`name="${s}"`);
    }
    expect(html).toContain('- sal');
  });

  it('muestra Otras secciones solo cuando el archivo las trae', () => {
    const con = renderEditor({ receta: RECETA, entrada: ENTRADA, categorias: CATEGORIAS });
    expect(con).toContain('Otras secciones · 1');
    expect(con).toContain('Malbec.');
    const sin = renderEditor({ receta: parse('---\ntitulo: X\n---\n'), entrada: ENTRADA, categorias: CATEGORIAS });
    expect(sin).not.toContain('Otras secciones');
  });

  it('marca el tag incompleto de forma distinta', () => {
    const html = renderEditor({ receta: RECETA, entrada: ENTRADA, categorias: CATEGORIAS });
    expect(html).toMatch(/class="chip [^"]*ambar[^"]*"[^>]*>incompleto/);
  });

  it('ofrece borrar la receta', () => {
    expect(renderEditor({ receta: RECETA, entrada: ENTRADA, categorias: CATEGORIAS })).toContain('data-accion="borrar"');
  });
});

describe('recetaDesdeFormulario', () => {
  it('preserva extras y otras secciones que el formulario no toca', () => {
    const r = recetaDesdeFormulario({ titulo: 'Nuevo', tags: 'horno', ingredientes: '- sal' }, RECETA);
    expect(r.extras).toEqual({ autor_agente: 'claude' });
    expect(r.otras).toEqual([{ encabezado: 'Maridaje', cuerpo: 'Malbec.' }]);
    expect(r.titulo).toBe('Nuevo');
  });

  it('parte los tags por coma y limpia espacios', () => {
    const r = recetaDesdeFormulario({ titulo: 'X', tags: 'horno,  rápido ,' }, RECETA);
    expect(r.tags).toEqual(['horno', 'rápido']);
  });

  it('una dificultad inválida no se guarda', () => {
    const r = recetaDesdeFormulario({ titulo: 'X', dificultad: 'regular' }, RECETA);
    expect(r.dificultad).toBe('');
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/vista-editor.test.js`
Expected: FAIL — no existe `src/ui/editor.js`.

- [ ] **Step 3: Implementar**

```javascript
// src/ui/editor.js
import { escapar } from './markdown.js';
import { DIFICULTADES, dificultadValida } from '../catalogo.js';

const campoTexto = (nombre, etiqueta, valor) => `
  <label class="campo"><span>${escapar(etiqueta)}</span>
    <input name="${nombre}" value="${escapar(valor ?? '')}"></label>`;

const campoArea = (nombre, etiqueta, valor) => `
  <label class="campo"><span>${escapar(etiqueta)}</span>
    <textarea name="${nombre}">${escapar(valor ?? '')}</textarea></label>`;

export function renderEditor({ receta, entrada, categorias = [], tagsConocidos = [] }) {
  const opcionesCarpeta = categorias.map(c =>
    `<option value="${escapar(c.id)}"${c.id === entrada?.carpeta_id ? ' selected' : ''}>${escapar(c.nombre)}</option>`).join('');
  const opcionesDificultad = ['', ...DIFICULTADES].map(d =>
    `<option value="${escapar(d)}"${d === (receta.dificultad ?? '') ? ' selected' : ''}>${escapar(d || 'sin definir')}</option>`).join('');

  const chipsTags = (receta.tags ?? []).map(t =>
    `<span class="chip ${t === 'incompleto' ? 'ambar' : ''}">${escapar(t)}</span>`).join('');

  const otras = (receta.otras ?? []).map((o, i) => `
    <label class="campo"><span>## ${escapar(o.encabezado)}</span>
      <textarea name="otra-${i}">${escapar(o.cuerpo)}</textarea></label>`).join('');

  return `
    <header class="encabezado">
      <button data-accion="cancelar">Cancelar</button>
      <h1>Editar receta</h1>
      <button data-accion="guardar">Guardar</button>
    </header>
    <form class="contenido" data-formulario>
      ${campoTexto('titulo', 'Título', receta.titulo)}
      <label class="campo"><span>Carpeta</span>
        <select name="carpeta">${opcionesCarpeta}</select></label>
      <label class="campo"><span>Dificultad</span>
        <select name="dificultad">${opcionesDificultad}</select></label>
      ${campoTexto('rinde', 'Rinde', receta.rinde)}
      ${campoTexto('tiempo', 'Tiempo', receta.tiempo)}
      <label class="campo"><span>Tags</span>
        <div class="chips">${chipsTags}</div>
        <input name="tags" value="${escapar((receta.tags ?? []).join(', '))}" list="tags-conocidos">
        <datalist id="tags-conocidos">${tagsConocidos.map(t => `<option value="${escapar(t)}">`).join('')}</datalist>
      </label>
      ${campoTexto('fuente', 'Fuente', receta.fuente)}
      ${campoArea('descripcion', 'Descripción', receta.descripcion)}
      ${campoArea('ingredientes', 'Ingredientes', receta.ingredientes)}
      ${campoArea('preparacion', 'Preparación', receta.preparacion)}
      ${campoArea('variaciones', 'Variaciones', receta.variaciones)}
      ${campoArea('notas', 'Notas', receta.notas)}
      ${otras ? `<div class="otras"><span>Otras secciones · ${receta.otras.length}</span>${otras}
        <p class="meta">Secciones que la app no reconoce. Se guardan igual, al final del archivo.</p></div>` : ''}
      <button data-accion="borrar" type="button">Borrar receta</button>
    </form>`;
}

export function recetaDesdeFormulario(datos, original) {
  const otras = (original.otras ?? []).map((o, i) => ({
    encabezado: o.encabezado,
    cuerpo: datos[`otra-${i}`] ?? o.cuerpo
  }));

  return {
    ...original,
    titulo: datos.titulo?.trim() || original.titulo,
    tags: String(datos.tags ?? '').split(',').map(t => t.trim()).filter(Boolean),
    rinde: datos.rinde?.trim() || null,
    tiempo: datos.tiempo?.trim() || null,
    dificultad: dificultadValida(datos.dificultad),
    fuente: datos.fuente?.trim() || null,
    descripcion: datos.descripcion ?? original.descripcion,
    ingredientes: datos.ingredientes ?? original.ingredientes,
    preparacion: datos.preparacion ?? original.preparacion,
    variaciones: datos.variaciones ?? original.variaciones,
    notas: datos.notas ?? original.notas,
    otras
  };
}
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test`
Expected: PASS, 9 tests nuevos.

- [ ] **Step 5: Commit**

```bash
git add src/ui/editor.js tests/vista-editor.test.js
git commit -m "ui: editor crudo por secciones, con Otras secciones visibles"
```

---

### Task 21: Ensamblado, offline y PWA

**Files:**
- Modify: `src/main.js`, `index.html`
- Create: `src/sw.js`, `public/manifest.webmanifest`, `public/icono-192.png`, `public/icono-512.png`
- Test: verificación manual (§9: sin automatización de navegador en v1)

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: la app funcionando de punta a punta.
- `main.js` es el único que conoce el DOM global: crea auth, drive, sheets, cache y store, engancha el router, delega los eventos por `data-accion` y decide qué vista renderizar.
- Debounce de 30 s para el `flush`, más flush forzado en `visibilitychange` (§5.2).

- [ ] **Step 1: Escribir el ensamblado**

```javascript
// src/main.js
import './ui/tokens.css';
import './ui/app.css';
import { crearAuth } from './auth.js';
import { crearDrive } from './drive.js';
import { crearSheets } from './sheets.js';
import { abrirCache } from './cache.js';
import { crearStore } from './store.js';
import { crearRouter, parsearHash } from './ui/router.js';
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
  if (accion === 'reconectar') { await auth.conectar(); return render(); }
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

arrancar().catch(err => pintar(`<p class="contenido">No pude arrancar: ${err.message}</p>`));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.error));
}
```

```javascript
// src/sw.js — solo el app shell; los datos los cachea IndexedDB (§6)
const CACHE = 'recetario-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(claves =>
    Promise.all(claves.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   // nada de las APIs de Google
  e.respondWith(
    caches.match(e.request).then(hit => hit ?? fetch(e.request).then(resp => {
      const copia = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia));
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
```

```json
// public/manifest.webmanifest
{
  "name": "Recetario",
  "short_name": "Recetario",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "icons": [
    { "src": "icono-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icono-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Agregar en `index.html`, dentro de `<head>`:

```html
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1c1c1e" media="(prefers-color-scheme: dark)">
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

Los dos íconos: cuadrados de color `#0a5fd0` con la letra R en blanco, exportados a 192 y 512 px.

- [ ] **Step 2: Correr toda la suite**

Run: `npm test`
Expected: PASS — el ensamblado no rompe ningún unitario.

- [ ] **Step 3: Verificación manual, con el recetario real**

Run: `npm run dev` y abrir `http://localhost:5173`.

Verificar en orden, que es la única prueba de integración que tiene v1:
1. Conectar con Google. Aparece el home con las 15 categorías y sus conteos.
2. La primera vez reconstruye: la barra de progreso avanza y `Carnes` queda en 1.
3. Entrar a `Carnes` → aparece *Milanesas napolitanas* con su meta en una línea.
4. Abrir la receta: portada arriba, tres pestañas, "Notas · 2".
5. Marcar un paso en Preparación: queda tachado.
6. Editar el título, guardar, y confirmar que el `.md` en Drive cambió.
7. Esperar 30 segundos y confirmar que la fila de `_indice` también cambió.
8. Editar el `.md` desde Drive, recargar la app y confirmar que el cambio aparece.
9. Mover el `.md` a otra carpeta desde Drive, recargar, y confirmar que cambió de categoría **sin** volver a descargar el archivo (pestaña Red del inspector).
10. Cortar la red y confirmar que la navegación sigue funcionando.

- [ ] **Step 4: Commit**

```bash
git add src/main.js src/sw.js public/ index.html
git commit -m "Ensamblado: router, delegación de eventos, service worker y manifest"
```

---

### Task 22: Publicar en GitHub Pages

**Files:**
- Create: `.github/workflows/pages.yml`
- Modify: `SETUP.md` (marcar el §4 como hecho)

**Interfaces:**
- Produces: el sitio publicado, y su origen autorizado en el cliente OAuth.

- [ ] **Step 1: Escribir el workflow**

```yaml
# .github/workflows/pages.yml
name: Publicar en Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  construir:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }

  publicar:
    needs: construir
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - id: deploy
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verificar que el build sale limpio antes de publicar**

Run: `npm run build`
Expected: `dist/` generado sin errores. Si `base` no coincide con el nombre del repositorio, los assets dan 404 en Pages: corregir `vite.config.js`.

- [ ] **Step 3: Habilitar Pages y autorizar el origen**

1. En GitHub: *Settings → Pages → Source: GitHub Actions*.
2. Empujar a `main` y esperar el workflow.
3. En Google Cloud Console, *Google Auth Platform → Clientes → el cliente web*: agregar el origen `https://<usuario>.github.io` a los orígenes autorizados de JavaScript.
4. Abrir la URL publicada desde el celular y agregarla a la pantalla de inicio.

- [ ] **Step 4: Marcar el paso como hecho en SETUP.md**

Cambiar el encabezado `## 4. GitHub Pages — pendiente` por `## 4. GitHub Pages — hecho` y anotar la URL publicada.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/pages.yml SETUP.md
git commit -m "Publicación automática en GitHub Pages, con los tests como puerta"
```

---

## Cobertura del spec

| sección | dónde queda implementada |
|---|---|
| §3.1 taxonomía, raíz como bandeja, convención `_` | Tasks 11, 14, 15 |
| §3.1 nombre del archivo | Task 5 (`slugArchivo`), Task 13 (`crear`) |
| §3.2 frontmatter, cuerpo, ingredientes | Tasks 2, 3, 4, 5 |
| §3.3 fotos, portada, miniaturas, huérfanas | Tasks 5, 8 (`miniaturas`), 13 (`borrar`), 18 |
| §4.3 esquema del índice, mapa de filas, borrado | Tasks 6, 12 |
| §4.4 permisos | Task 1 (`config.js`) |
| §5.1 arranque y arranque en frío | Task 11 |
| §5.1 sync incremental | Tasks 7, 12 |
| §5.2 escritura y cola | Task 13 |
| §5.3 reconstrucción | Task 14 |
| §6 offline | Tasks 10 (cache), 21 (service worker) |
| §7.1 módulos | toda la estructura de archivos |
| §7.2 vistas | Tasks 18, 19, 20 |
| §7.3 lenguaje visual | Task 17 |
| §8 manejo de errores | Tasks 2 (malformado), 11 (solo lectura), 13 (conflicto), 21 (sin red) |
| §9 testing | todas |
| §11 alcance de v1 | Tasks 1–22 |

**Lo que v1 no cubre a propósito** (§11): planificador y lista de compras, escalado de porciones, importar desde URL, OCR, compartir, y el botón de bajar todo para offline.




