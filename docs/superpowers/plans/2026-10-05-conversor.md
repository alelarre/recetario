# Conversor (P120) — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** sumar a *Herramientas* una herramienta de referencia más, *Conversor*, con la cuenta `conversion`, la tabla de pesos por ingrediente y la de medidas, en la app y en el MCP.

**Architecture:** es una quinta herramienta de `src/referencias/`, sin mecanismo nuevo. Los datos van en `datos/conversor.ts`. La cuenta y las tres tablas derivadas van en `cuentas.ts`, y la herramienta, en `indice.ts`. La pantalla genérica, el controlador y `mcp/referencias.ts` la toman solos.

**Tech Stack:** TypeScript estricto, Vite, Vitest con el DOM falso, MCP con zod.

**Spec:** `docs/superpowers/specs/2026-10-04-conversor-design.md`; datos en `product-design/research/herramientas/verificacion-conversor.md`.

## Global Constraints

- Todo en español rioplatense: UI, comentarios, nombres.
- Ningún test fija un valor de los datos: los tests de la cuenta usan datos armados en el test.
- Sin commits hasta que el usuario revise el diff.
- `npm test`, `npm run typecheck` y `npm run build` en verde.
- El ícono `balanza` ya es el de *Herramientas*: el conversor lleva uno nuevo, `medidor` (una taza medidora).

## Review Focus

- Pasar de volumen a peso sin ingrediente: el resultado lo dice; no devuelve nada vacío ni mal calculado.
- Stick con otro ingrediente que no sea manteca: dice que el stick es de manteca.
- Cantidades muy chicas (un pinch): no muestra «0 cucharaditas». Sí muestra los ml y los g con decimales.
- Cantidades grandes (2 kg de harina): no muestra cientos de cucharadas.
- El MCP con el ingrediente escrito con o sin tildes, y con un ingrediente que no existe.

---

### Task 1: Los datos

**Files:**
- Create: `src/referencias/datos/conversor.ts`
- Modify: `src/referencias/tipos.ts`
- Test: `tests/referencias-forma.test.ts`

**Produces** (en `tipos.ts`):

```ts
export type IdSistema = 'metrica' | 'australia' | 'eeuu' | 'japon';
export type MedidaCasera = 'taza' | 'cucharada' | 'cucharadita';
export interface Sistema {
  id: IdSistema; nombre: string; taza: number; cucharada: number; cucharadita: number;
  notas?: readonly string[]; fuentes: readonly FuenteAbreviada[];
}
export interface IngredienteConvertible {
  id: string; nombre: string; grupo: string;
  /** La medida tal como la da la fuente: «½ taza de EE. UU. = 113 g». */
  medida: { cantidad: number; unidad: MedidaCasera; sistema: IdSistema; gramos: number };
  fuente: FuenteAbreviada;
}
```

En `datos/conversor.ts`, sólo datos:

- `SISTEMAS: readonly Sistema[]`, con los cuatro de §1 del spec. EE. UU.: 236.5882, 14.7868, 4.9289. Métrica, 250/15/5, con las fuentes HC, PRH, DEL y HCU (Health Canada, Penguin, delicious., Hacé Cuentas). Australia, 250/20/5 (PRH). Japón, 200/15/5 (WJA), con la nota del gō. Una nota en Métrica sobre la taza de 200 ml de las etiquetas argentinas.
- `UNIDADES`, cada una `Constante`:
  - `flOz` 29.5735 ml, `oz` 28.3495 g y `lb` 453.59237 g, de NIST HB44;
  - `dash` 1/8, `pinch` 1/16 y `smidgen` 1/32, en «cdita EE. UU.», de Taste of Home;
  - `stick` 0.5 «taza EE. UU.», de Land O'Lakes.
- `INGREDIENTE_DEL_STICK = 'manteca'`.
- `INGREDIENTES: readonly IngredienteConvertible[]`: los 47 del informe, en sus cinco grupos (Harinas y almidones, Azúcares y dulces, Grasas y lácteos, Otros, Leudantes y sal), con la medida de la fuente. Si USDA da varias medidas, va la taza. Manteca: ½ taza = 113 g.
- `NOTAS_CONVERSOR`: la del método («Medidas al ras; la harina, volcada con cuchara en la taza. Hundiendo la taza entra hasta un tercio más.») y la de 000/0000.
- `NOTAS_MEDIDAS`: UNL y Smitten Kitchen; los panes de manteca de 100 y 200 g.
- Encabezado como el de `coccion.ts`, con la procedencia `verificacion-conversor.md`.

- [ ] **Step 1: el test de forma.** Sumarlo a `tests/referencias-forma.test.ts`:

```ts
import { SISTEMAS, UNIDADES, INGREDIENTES, INGREDIENTE_DEL_STICK } from '../src/referencias/datos/conversor.js';

describe('los datos del conversor', () => {
  it('cada sistema, unidad e ingrediente dice de dónde sale', () => {
    for (const s of SISTEMAS) for (const f of s.fuentes) expect(problemasDeConstante(`sistema ${s.id}`, { valor: s.taza, unidad: 'ml', fuente: f })).toEqual([]);
    for (const [nombre, c] of Object.entries(UNIDADES)) expect(problemasDeConstante(nombre, c)).toEqual([]);
    for (const i of INGREDIENTES) expect(problemasDeConstante(`ingrediente ${i.id}`, { valor: i.medida.gramos, unidad: 'g', fuente: i.fuente })).toEqual([]);
  });

  it('los id no se repiten, cada medida usa un sistema que existe y el stick es de un ingrediente que está', () => {
    const ids = INGREDIENTES.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(SISTEMAS.map(s => s.id)).size).toBe(SISTEMAS.length);
    for (const i of INGREDIENTES) expect(SISTEMAS.map(s => s.id), i.id).toContain(i.medida.sistema);
    for (const i of INGREDIENTES) expect(i.medida.cantidad > 0 && i.medida.gramos > 0, i.id).toBe(true);
    expect(ids).toContain(INGREDIENTE_DEL_STICK);
  });
});
```

- [ ] **Step 2:** `npx vitest run tests/referencias-forma.test.ts` → falla (no existe el módulo).
- [ ] **Step 3:** escribir los tipos y `datos/conversor.ts`.
- [ ] **Step 4:** el test pasa y `npm run typecheck` en verde.

### Task 2: La cuenta y las tablas derivadas

**Files:**
- Modify: `src/referencias/cuentas.ts`
- Test: `tests/referencias-cuentas.test.ts`

**Consumes:** los tipos de la Task 1. La cuenta recibe `k: Conversor`, con

```ts
export interface Conversor {
  sistemas: readonly Sistema[]; unidades: typeof UNIDADES; ingredienteDelStick: string;
  ingredientes: readonly IngredienteConvertible[]; notas: readonly string[]; notasMedidas: readonly string[];
}
```

(declarado en `cuentas.ts`, con `import type` de `datos/conversor.ts`). En `datos/conversor.ts` se exporta `CONVERSOR: Conversor`, que junta todo.

**Produces:** `cuentaConversion(k): Cuenta`, `tablaDePesos(k): Tabla`, `tablaDeSistemas(k): Tabla`, `tablaDeMedidasEeuu(k): Tabla` y `medidaPractica(n: number, pasos: readonly number[]): string`.

Reglas de `cuentaConversion`:

- **Entradas:**
  - `cantidad`: número, sin valor por defecto;
  - `unidad`: opción, por defecto `taza`. Textos: Taza, Cucharada, Cucharadita, ml, l, fl oz (EE. UU.), g, kg, oz, lb, pinch, dash, smidgen, stick (manteca);
  - `sistema`: opción, por defecto `metrica`;
  - `ingrediente`: opción, por defecto `''` («Ninguno»), y después los 47 en orden.
- **Gramos por ml de un ingrediente:** `gramos / (cantidad × ml de su unidad en su sistema)`.
- **Los ml de la entrada:**
  - taza, cucharada y cucharadita miden lo del sistema elegido; ml es 1 y l, 1000;
  - fl oz es `UNIDADES.flOz`;
  - dash, pinch y smidgen son su fracción por la cucharadita de `eeuu`;
  - stick es 0,5 por la taza de `eeuu`.
- **Los gramos de la entrada:** g es 1, kg 1000, y oz y lb salen de `UNIDADES`.
- **Stick con otro ingrediente** (o sin ninguno): una sola línea, `{ nombre: 'Stick', valor: 'Es una medida de manteca: elegí Manteca' }`.
- **Sin ingrediente, desde volumen:** las líneas de volumen y una línea `{ nombre: 'Gramos', valor: 'Elegí un ingrediente para pasar a peso' }`. **Desde peso:** las de peso y `{ nombre: 'Tazas y cucharas', valor: 'Elegí un ingrediente para pasar a volumen' }`.
- **Líneas de volumen, en orden:**
  - `Tazas (<ml> ml)`, con `medidaPractica(ml / taza, [0, 1/4, 1/3, 1/2, 2/3, 3/4])`;
  - `Cucharadas (<ml> ml)` y `Cucharaditas (<ml> ml)`, con `[0, 1/2]`;
  - `ml`, con `gramos()`.

  Una medida casera no se muestra si redondea a 0, ni una cuchara si pasa de 16. Los ml del nombre van con coma: «236,6».
- **Líneas de peso:** `g` con `gramos()` y `oz` con un decimal y coma. Con manteca, además, `Sticks` con `medidaPractica(ml / (0,5 × taza eeuu), [0, 1/4, 1/2, 3/4])`.
- **Fuentes:** las del sistema, más la del ingrediente si lo hay, más la de las unidades fijas que se usaron (fl oz, oz, lb, informales, stick).
- **Advertencias:** `k.notas[0]`, la del método.
- Una cantidad que no es positiva → `null`.

`medidaPractica(n, pasos)`: el entero más la fracción de `pasos` más cercana. Sin «≈» si la diferencia es menor que 0,01, y con «≈ » delante si no. Si el resultado es 0, devuelve `''` (no se muestra). Formatos: «1», «¾», «1 ½», «≈ 2 ⅓».

Tablas (las tres `Tabla`, con `fuentes` y `columnaFuente: 'fuente'`):

- **`tablaDePesos`**, id `pesos`, «Pesos por ingrediente»:
  - columnas Ingrediente, Taza (g, 250 ml), Cucharada (g, 15 ml), Cucharadita (g, 5 ml) y Fuente. La taza y las cucharas son las del sistema `metrica`, y los ml del encabezado salen de él;
  - `grupos` por `grupo`;
  - las notas, `k.notas`.
- **`tablaDeSistemas`**, id `sistemas`, «Tazas y cucharas»: Sistema, Taza (ml), Cucharada (ml), Cucharadita (ml) y Fuente (las abreviaturas, separadas por coma), más las notas de cada sistema.
- **`tablaDeMedidasEeuu`**, id `medidas-eeuu`, «Medidas de EE. UU.», con las filas fl oz, oz, lb, dash, pinch, smidgen y stick (equivalencia formateada) y las notas `k.notasMedidas`.

- [ ] **Step 1: los tests.** Con un `Conversor` armado en el test: dos sistemas (`metrica` 250/15/5 y `eeuu` 200/10/5, inventados para que se note), un ingrediente `harina` con «1 taza metrica = 100 g», `manteca` con «1 taza eeuu = 200 g», y unidades con valores redondos. Casos:
  - 1 taza métrica de harina → «Tazas (250 ml)» = «1», g = «100»;
  - 1 taza en `eeuu` de harina → 200 ml → g = «80» (lee la taza del sistema y los g/ml del ingrediente);
  - 100 g de harina → «Tazas (250 ml)» = «1»;
  - 30 g de harina → «≈ ⅓»;
  - sin ingrediente, 1 taza → no hay línea `g` y está la de «Elegí un ingrediente para pasar a peso»;
  - sin ingrediente, 100 g → `oz`, sin tazas;
  - stick con harina → la línea del stick;
  - 1 stick de manteca → 100 ml de la taza `eeuu` → g «100», con la línea `Sticks` «1»;
  - 1 pinch → sin cucharadas ni cucharaditas, con ml;
  - 5000 g de harina → sin línea de cucharadas;
  - cantidad 0 → `null`;
  - `medidaPractica(0.75, …)` es «¾», `(2.3, …)` es «≈ 2 ⅓» y `(0.01, [0, .5])` es `''`.
  - **Tablas:** `tablaDePesos` agrupa por `grupo` y los gramos de la taza salen del sistema métrico. `problemasDeForma` vacío en las tres tablas armadas con los datos reales.
- [ ] **Step 2:** fallan.
- [ ] **Step 3:** implementar en `cuentas.ts`.
- [ ] **Step 4:** pasan; typecheck.

### Task 3: La herramienta en la app

**Files:**
- Modify: `src/referencias/tipos.ts` (`IdHerramienta` suma `'conversor'`; `icono` suma `'medidor'`), `src/referencias/indice.ts`, `src/ui/router.ts` (`DE_REFERENCIA.conversor = 'conversor'`), `src/ui/iconos.ts` (`medidor`)
- Test: `tests/referencias-forma.test.ts` (el índice con cinco), `tests/vista-herramientas.test.ts` (cinco, con `medidor`), `tests/router.test.ts`, `tests/vista-referencias.test.ts`

En `indice.ts`, después de Conservación:

```ts
{ id: 'conversor', ruta: '#/herramientas/conversor', titulo: 'Conversor', detalle: 'Tazas, cucharas y gramos por ingrediente', icono: 'medidor', buscador: true,
  fichas: [
    { tipo: 'cuenta', cuenta: cuentaConversion(CONVERSOR) },
    { tipo: 'tabla', tabla: tablaDePesos(CONVERSOR) },
    { tipo: 'tabla', tabla: tablaDeSistemas(CONVERSOR) },
    { tipo: 'tabla', tabla: tablaDeMedidasEeuu(CONVERSOR) }
  ] }
```

Ícono `medidor`, una taza medidora con marcas, del trazo de los demás:
`svg('<path d="M5 4h12v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M17 8h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2"/><path d="M5 9h4M5 13h4"/>')`.

- [ ] **Step 1: los tests.**
  - router: `parsearHash('#/herramientas/conversor')` da `{ vista: 'referencia', params: { herramienta: 'conversor' } }`;
  - índice: cinco herramientas, con la ruta del conversor al final;
  - lista de Herramientas: cinco, con `medidor`;
  - vista: `renderReferencia(herramientaDeReferencia('conversor'), { valores: {}, busqueda: 'harina' })` tiene el buscador, la ficha `ficha-conversion` y una fila de la tabla de pesos con «Harina», y no tiene «Azúcar blanca». Con volver.
- [ ] **Step 2:** fallan.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** `npm test` y `npm run typecheck`.

### Task 4: MCP, skill y documentos

**Files:**
- Modify: `mcp/servidor.ts` (la descripción de `consultar_referencia` suma «tazas, cucharas y gramos por ingrediente, medidas de otro país, sticks de manteca»; `herramienta` suma `conversor`)
- Modify: `skills/herramientas/SKILL.md` (la `description` suma el conversor con «¿cuántos gramos es una taza de azúcar?», hasta 1.024 caracteres; `calcular_conversion` en la lista), `mcp/LEEME.md`
- Modify: `product-design/product/specs/E07-Herramientas.md`, `product-design/ux/information-architecture.md`, `product-design/ux/design-system.md` (el ícono `medidor`), `CLAUDE.md` (cinco de referencia, con el conversor y su ruta), `BACKLOG.md` (P120 → `Falta probar`)
- Test: `tests/mcp-referencias.test.ts`

- [ ] **Step 1: los tests del MCP.**
  - `calcularParaElAgente(cuenta conversion, { cantidad: 1, unidad: 'taza', ingrediente: 'azucar blanca' })` devuelve `resultado` con una línea `g`;
  - sin `cantidad`, devuelve `faltan` con `cantidad`;
  - con `ingrediente: 'kriptonita'`, devuelve `faltan` con las opciones de ingrediente;
  - `consultarReferencia({ buscar: 'harina' })` trae filas de la tabla `Pesos por ingrediente`.

  Sin fijar gramos.
- [ ] **Step 2:** correrlos; deberían pasar ya con lo de la Task 3. Si alguno falla, arreglar.
- [ ] **Step 3:** descripción del MCP, skill, LEEME y documentos.
- [ ] **Step 4:** `npm test`, `npm run typecheck` y `npm run build`.
- [ ] **Step 5:** mostrar el diff al usuario. Se commitea y se pushea a `main` con su visto bueno, para probar en el teléfono.
