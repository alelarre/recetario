# Herramientas — plan de implementación

> **Para agentes:** SUB-SKILL REQUERIDO: superpowers:subagent-driven-development
> (recomendado) o superpowers:executing-plans, tarea por tarea. Los pasos usan
> casillas (`- [ ]`).

**Objetivo:** la sección *Herramientas*, con la calculadora de pan y la de sal
para fermentados; las marcas `pan` y `fermentado` con su botón en la receta; y
dos herramientas del MCP con un skill propio.

**Arquitectura:** cada fórmula vive entera en un archivo puro de
`src/calculadoras/` (tablas, constantes, cuentas, valores por defecto y la
lectura de un pedido del MCP). Las pantallas (`src/ui/herramientas.ts`) sólo
dibujan; un controlador (`src/herramientas-control.ts`) guarda las elecciones
en `localStorage`, atiende los toques y actualiza el resultado sin redibujar.
El MCP importa los mismos archivos.

**Stack:** TypeScript estricto, Vite, Vitest con DOM escrito a mano
(`tests/dom-falso.ts`), MCP con `@modelcontextprotocol/sdk` y `zod`.

**Spec:** `docs/superpowers/specs/2026-10-02-herramientas-design.md`. Leelo
antes de empezar.

## Restricciones globales

- Español rioplatense en código, comentarios, UI y documentos.
- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `verbatimModuleSyntax`. Sin `instanceof` contra clases del navegador.
- Un comentario dice la razón vigente; no cita el backlog ni este plan o spec.
- **No se commitea código hasta que el usuario revise el diff** (Tarea 11).
- `src/` nunca importa de `mcp/`.
- Toda lectura y escritura de `localStorage` va en `try/catch`.
- Correr un archivo: `npx vitest run tests/<archivo>.test.ts`. Al final:
  `npm test`, `npm run typecheck`, `npm run build` en verde.

## Qué mirar al revisar

1. Escribir en *Harina total* y después en *Masa total*: manda el último y el
   otro se recalcula; el foco no se pierde (Tarea 8, el resultado se pinta sin
   redibujar).
2. Elegir masa madre con 2 h elegidas: pasa a 4 h y la fila deja de ofrecer
   2 h (Tareas 1 y 8).
3. Un `localStorage` con una opción que ya no existe (o JSON roto): sólo ese
   dato vuelve al defecto (Tarea 4).
4. Una masa madre con hidratación baja y mucha masa madre: el agua a agregar
   nunca es negativa (Tarea 1: con las tablas actuales no pasa; el test lo
   fija con el peor caso de la tabla).
5. El MCP con un dato escrito con tildes o mayúsculas distintas («PAN DE
   CAMPO», «frio»): se reconoce (Tarea 3).

---

### Tarea 1: la fórmula del pan

**Archivos:**
- Crear: `src/calculadoras/gramos.ts`, `src/calculadoras/pan.ts`,
  `tests/calculadora-pan.test.ts`

**Produce:**

```ts
// gramos.ts
export function gramos(valor: number): string; // entero; por debajo de 10, un decimal con coma

// pan.ts
export type ClavePan = 'frances' | 'molde' | 'miga' | 'pizza-molde' | 'pizza-piedra' | 'baguette' | 'campo' | 'ciabatta' | 'focaccia';
export type ClaveHarina = '0000' | '000' | '000-pizza' | 'semolin' | 'integral' | 'centeno';
export type Levadura = 'fresca' | 'seca' | 'masa-madre';
export type ClaveFermentacion = 'ambiente-2' | 'ambiente-4' | 'ambiente-8' | 'frio-12' | 'frio-24' | 'frio-48' | 'frio-72';
export const PANES: readonly { clave: ClavePan; nombre: string; hidratacion: number }[];
export const HARINAS: readonly { clave: ClaveHarina; nombre: string; ajuste: number }[];
export const LEVADURAS: readonly { clave: Levadura; nombre: string }[];
export const FERMENTACIONES: readonly { clave: ClaveFermentacion; modo: 'ambiente' | 'frio'; horas: number; fresca: number; masaMadre: number | null }[];
export const PORCENTAJES_SEGUNDA: readonly [10, 20, 30, 50];
export const SAL: number; export const DIVISOR_SECA: number; export const HIDRATACION_MAXIMA: number;
export const ADVERTENCIAS_PAN: readonly string[];
export const AVISO_TOPE: string;
export interface DatosPan {
  pan: ClavePan; harina: ClaveHarina; segunda: ClaveHarina | null; porcentajeSegunda: 10 | 20 | 30 | 50;
  levadura: Levadura; fermentacion: ClaveFermentacion; cantidad: { de: 'harina' | 'masa'; gramos: number };
}
export interface ResultadoPan {
  harinas: { clave: ClaveHarina; nombre: string; gramos: number }[];
  agua: number; sal: number; levadura: number; levaduraTipo: Levadura;
  hidratacion: number; topeada: boolean; harinaTotal: number; masaTotal: number;
}
export function fermentacionesPara(levadura: Levadura): typeof FERMENTACIONES;
export function calcularPan(d: DatosPan): ResultadoPan | null;
```

- [ ] **Paso 1: el test que falla.** `tests/calculadora-pan.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { calcularPan, fermentacionesPara, HIDRATACION_MAXIMA, type DatosPan } from '../src/calculadoras/pan.js';
  import { gramos } from '../src/calculadoras/gramos.js';

  const base: DatosPan = {
    pan: 'campo', harina: '000', segunda: null, porcentajeSegunda: 30,
    levadura: 'fresca', fermentacion: 'ambiente-8', cantidad: { de: 'harina', gramos: 1000 }
  };

  describe('calcularPan', () => {
    it('pan de campo, 1 kg de 000, fresca, 8 h', () => {
      const r = calcularPan(base)!;
      expect(r.hidratacion).toBe(72);
      expect(r.agua).toBeCloseTo(720);
      expect(r.sal).toBeCloseTo(20);
      expect(r.levadura).toBeCloseTo(5);
      expect(r.masaTotal).toBeCloseTo(1745);
      expect(r.harinas).toEqual([{ clave: '000', nombre: '000', gramos: 1000 }]);
    });

    it('000 con 30 % de centeno: ajuste +6 y una línea por harina', () => {
      const r = calcularPan({ ...base, segunda: 'centeno', porcentajeSegunda: 30 })!;
      expect(r.hidratacion).toBeCloseTo(78);
      expect(r.harinas.map(h => [h.clave, Math.round(h.gramos)])).toEqual([['000', 700], ['centeno', 300]]);
    });

    it('masa madre: la harina y el agua a agregar descuentan la mitad de la masa madre', () => {
      const r = calcularPan({ ...base, levadura: 'masa-madre', fermentacion: 'ambiente-4' })!;
      expect(r.levadura).toBeCloseTo(200);
      expect(r.harinas[0]!.gramos).toBeCloseTo(900);
      expect(r.agua).toBeCloseTo(620);
      expect(r.harinaTotal).toBe(1000);
      expect(r.masaTotal).toBeCloseTo(1740);
    });

    it('el agua a agregar nunca es negativa: peor caso de la tabla', () => {
      const r = calcularPan({ ...base, pan: 'miga', harina: '0000', levadura: 'masa-madre', fermentacion: 'ambiente-4' })!;
      expect(r.agua).toBeGreaterThan(0);
    });

    it('la hidratación se topea en 85 %', () => {
      const r = calcularPan({ ...base, pan: 'ciabatta', harina: 'centeno' })!;
      expect(r.hidratacion).toBe(HIDRATACION_MAXIMA);
      expect(r.topeada).toBe(true);
      expect(calcularPan(base)!.topeada).toBe(false);
    });

    it('la seca es la fresca dividida por 3', () => {
      const fresca = calcularPan(base)!.levadura;
      expect(calcularPan({ ...base, levadura: 'seca' })!.levadura).toBeCloseTo(fresca / 3);
    });

    it('desde la masa total da la misma harina (ida y vuelta)', () => {
      const ida = calcularPan(base)!;
      const vuelta = calcularPan({ ...base, cantidad: { de: 'masa', gramos: ida.masaTotal } })!;
      expect(vuelta.harinaTotal).toBeCloseTo(1000);
      const conMasaMadre = calcularPan({ ...base, levadura: 'masa-madre', fermentacion: 'frio-24' })!;
      const vueltaMM = calcularPan({ ...base, levadura: 'masa-madre', fermentacion: 'frio-24', cantidad: { de: 'masa', gramos: conMasaMadre.masaTotal } })!;
      expect(vueltaMM.harinaTotal).toBeCloseTo(1000);
    });

    it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])('cantidad %s: sin resultado', g => {
      expect(calcularPan({ ...base, cantidad: { de: 'harina', gramos: g } })).toBeNull();
    });
  });

  it('con masa madre no se ofrecen 2 h', () => {
    expect(fermentacionesPara('masa-madre').map(f => f.clave)).not.toContain('ambiente-2');
    expect(fermentacionesPara('fresca').map(f => f.clave)).toContain('ambiente-2');
  });

  it('gramos: enteros, y un decimal por debajo de 10', () => {
    expect(gramos(720.4)).toBe('720');
    expect(gramos(5.44)).toBe('5,4');
    expect(gramos(0.333)).toBe('0,3');
  });
  ```

- [ ] **Paso 2:** correrlo; falla porque los módulos no existen.

- [ ] **Paso 3: implementar.** `src/calculadoras/gramos.ts`:

  ```ts
  /** Gramos para mostrar: enteros, y por debajo de 10 con un decimal (5,4 g de levadura). */
  export function gramos(valor: number): string {
    return valor < 10 ? valor.toFixed(1).replace('.', ',') : String(Math.round(valor));
  }
  ```

  `src/calculadoras/pan.ts`: un comentario de cabecera que diga que **toda la
  fórmula del pan vive acá** y que cambiar un valor es editar este archivo.
  Las tablas con los valores del spec §1.1, en el orden del spec. Constantes:
  `SAL = 2`, `DIVISOR_SECA = 3`, `HIDRATACION_MAXIMA = 85`.

  ```ts
  export const ADVERTENCIAS_PAN = [
    'Los tiempos son totales (primera fermentación y apresto), a unos 24 °C. Con frío ambiente hay que estirarlos; con calor, acortarlos.',
    'En frío, se cuentan 1 o 2 horas a temperatura ambiente antes y después de la heladera.'
  ] as const;
  export const AVISO_TOPE = 'La hidratación se limitó a 85 %.';

  export const fermentacionesPara = (levadura: Levadura) =>
    FERMENTACIONES.filter(f => levadura !== 'masa-madre' || f.masaMadre !== null);

  export function calcularPan(d: DatosPan): ResultadoPan | null {
    if (!Number.isFinite(d.cantidad.gramos) || d.cantidad.gramos <= 0) return null;
    const pan = buscar(PANES, d.pan);
    const fermentacion = buscar(FERMENTACIONES, d.fermentacion);
    const p = d.segunda ? d.porcentajeSegunda / 100 : 0;
    const ajuste = buscar(HARINAS, d.harina).ajuste * (1 - p) + (d.segunda ? buscar(HARINAS, d.segunda).ajuste * p : 0);
    const sinTope = pan.hidratacion + ajuste;
    const hidratacion = Math.min(sinTope, HIDRATACION_MAXIMA);
    const conMasaMadre = d.levadura === 'masa-madre';
    // Con masa madre, la levadura no suma a la masa: su harina y su agua ya están en H y en el agua.
    const pctLevadura = conMasaMadre ? 0
      : d.levadura === 'seca' ? fermentacion.fresca / DIVISOR_SECA : fermentacion.fresca;
    const H = d.cantidad.de === 'harina'
      ? d.cantidad.gramos
      : d.cantidad.gramos / (1 + (hidratacion + SAL + pctLevadura) / 100);
    const agua = H * hidratacion / 100;
    const sal = H * SAL / 100;
    const masaMadre = conMasaMadre ? H * (fermentacion.masaMadre ?? 0) / 100 : 0;
    const harinaAAgregar = H - masaMadre / 2;
    const harinas = [{ clave: d.harina, proporcion: 1 - p }, ...(d.segunda ? [{ clave: d.segunda, proporcion: p }] : [])]
      .map(({ clave, proporcion }) => ({ clave, nombre: buscar(HARINAS, clave).nombre, gramos: harinaAAgregar * proporcion }));
    return {
      harinas, agua: agua - masaMadre / 2, sal,
      levadura: conMasaMadre ? masaMadre : H * pctLevadura / 100, levaduraTipo: d.levadura,
      hidratacion, topeada: sinTope > HIDRATACION_MAXIMA,
      harinaTotal: H, masaTotal: H + agua + sal + H * pctLevadura / 100
    };
  }
  ```

  `buscar(tabla, clave)` es un helper local que devuelve la fila o lanza
  `Error('Opción desconocida: …')` (es un error de programación en la app).
  Si con masa madre llega `ambiente-2` (no debería: el controlador lo
  corrige), `masaMadre` de esa fila es `null` → usar la de `ambiente-4`:
  `fermentacion.masaMadre ?? buscar(FERMENTACIONES, 'ambiente-4').masaMadre!`.

- [ ] **Paso 4:** `npx vitest run tests/calculadora-pan.test.ts` → verde.

---

### Tarea 2: la fórmula de la sal

**Archivos:** Crear `src/calculadoras/fermentados.ts`, `tests/calculadora-fermentados.test.ts`

**Produce:**

```ts
export type ClaveFermento = 'chucrut' | 'kimchi' | 'ajies' | 'salmuera' | 'pepinos';
export const FERMENTOS: readonly { clave: ClaveFermento; nombre: string; sal: number }[];
export interface DatosSal { fermento: ClaveFermento; pesoTotal: number }
export function calcularSal(d: DatosSal): { sal: number; porcentaje: number } | null;
```

- [ ] **Paso 1: test.**

  ```ts
  import { it, expect } from 'vitest';
  import { calcularSal, FERMENTOS } from '../src/calculadoras/fermentados.js';

  it('1200 g de pepinos llevan 42 g de sal', () => {
    expect(calcularSal({ fermento: 'pepinos', pesoTotal: 1200 })).toEqual({ sal: 42, porcentaje: 3.5 });
  });
  it('la tabla en su orden', () => {
    expect(FERMENTOS.map(f => [f.nombre, f.sal])).toEqual([
      ['Chucrut', 2], ['Kimchi', 2.5], ['Ajíes', 3], ['Verduras en salmuera', 3], ['Pepinos', 3.5]
    ]);
  });
  it.each([0, -1, Number.NaN])('peso %s: sin resultado', p => {
    expect(calcularSal({ fermento: 'chucrut', pesoTotal: p })).toBeNull();
  });
  ```

- [ ] **Paso 2:** ver que falla.
- [ ] **Paso 3:** implementar, con comentario de cabecera («toda la fórmula de
  la sal vive acá»; el peso total es todo lo que hay en el frasco).
  `sal = pesoTotal × porcentaje / 100`.
- [ ] **Paso 4:** verde.

---

### Tarea 3: los pedidos del MCP

**Archivos:** Modificar `src/calculadoras/pan.ts`, `src/calculadoras/fermentados.ts`;
test `tests/calculadora-pedidos.test.ts`

**Produce:**

```ts
// pan.ts
export interface Faltante { dato: string; opciones: readonly string[] }
export type Pedido<T> = { datos: T } | { faltan: Faltante[] };
export interface PedidoPan {
  pan?: string; harina?: string; segunda_harina?: string; porcentaje_segunda?: number;
  levadura?: string; fermentacion?: string; horas?: number; harina_total?: number; masa_total?: number;
}
export function leerPedidoPan(p: PedidoPan): Pedido<DatosPan>;
// fermentados.ts
export function leerPedidoSal(p: { fermento?: string; peso_total?: number }): Pedido<DatosSal>;
```

Reglas (spec §5.1):
- Los nombres se comparan con `normalizar` (`src/normalizar.ts`): «PAN DE
  CAMPO» es `campo`, «frio» es `frio`.
- `segunda_harina` es obligatoria: `ninguna` o una harina distinta de la
  principal. Con segunda, `porcentaje_segunda` es obligatorio y uno de 10, 20,
  30, 50.
- `fermentacion` es `ambiente` o `frío`; `horas` tiene que existir en ese
  modo y, con masa madre, en `fermentacionesPara`.
- Exactamente una de `harina_total` o `masa_total`, positiva.
- Cada dato que falta o no vale suma un `Faltante` con sus opciones como
  texto (los nombres de la tabla; para horas, las del modo y la levadura).
  Si hay alguno, no se devuelve `datos`.

- [ ] **Paso 1: test.**

  ```ts
  import { it, expect } from 'vitest';
  import { leerPedidoPan } from '../src/calculadoras/pan.js';
  import { leerPedidoSal } from '../src/calculadoras/fermentados.js';

  it('con todo, sin mirar mayúsculas ni tildes', () => {
    expect(leerPedidoPan({ pan: 'PAN DE CAMPO', harina: '000', segunda_harina: 'ninguna', levadura: 'fresca',
      fermentacion: 'frio', horas: 24, harina_total: 500 }))
      .toEqual({ datos: { pan: 'campo', harina: '000', segunda: null, porcentajeSegunda: 10, levadura: 'fresca',
        fermentacion: 'frio-24', cantidad: { de: 'harina', gramos: 500 } } });
  });

  it('sólo con la harina y la cantidad: dice qué falta y las opciones', () => {
    const r = leerPedidoPan({ harina: '000', harina_total: 500 });
    expect('faltan' in r && r.faltan.map(f => f.dato)).toEqual(['pan', 'segunda_harina', 'levadura', 'fermentacion', 'horas']);
    expect('faltan' in r && r.faltan[0]!.opciones).toContain('Pan de campo');
  });

  it('masa madre con 2 h no vale, y ofrece las horas posibles', () => {
    const r = leerPedidoPan({ pan: 'campo', harina: '000', segunda_harina: 'ninguna', levadura: 'masa madre',
      fermentacion: 'ambiente', horas: 2, harina_total: 500 });
    expect('faltan' in r && r.faltan).toEqual([{ dato: 'horas', opciones: ['4', '8'] }]);
  });

  it('las dos cantidades, o ninguna, es un faltante', () => {
    const r = leerPedidoPan({ pan: 'campo', harina: '000', segunda_harina: 'ninguna', levadura: 'seca',
      fermentacion: 'ambiente', horas: 8, harina_total: 500, masa_total: 900 });
    expect('faltan' in r && r.faltan.map(f => f.dato)).toEqual(['cantidad']);
  });

  it('sal: el fermento por su nombre', () => {
    expect(leerPedidoSal({ fermento: 'pepinos', peso_total: 1200 })).toEqual({ datos: { fermento: 'pepinos', pesoTotal: 1200 } });
    expect(leerPedidoSal({ peso_total: 1200 })).toEqual({ faltan: [{ dato: 'fermento',
      opciones: ['Chucrut', 'Kimchi', 'Ajíes', 'Verduras en salmuera', 'Pepinos'] }] });
  });
  ```

  (La `porcentajeSegunda` sin segunda vale `10`, el primero de la lista: no se
  usa en la cuenta.)

- [ ] **Paso 2:** ver que falla. **Paso 3:** implementar. **Paso 4:** verde.

---

### Tarea 4: valores por defecto y últimas elecciones

**Archivos:** Modificar `pan.ts` y `fermentados.ts`; test `tests/calculadora-defecto.test.ts`

**Produce:**

```ts
export const PAN_POR_DEFECTO: DatosPan; // campo, 000, sin segunda (porcentaje 30), fresca, ambiente-8, harina 1000
export function completarPan(guardado: unknown): DatosPan;
export const SAL_POR_DEFECTO: DatosSal; // chucrut, 1000
export function completarSal(guardado: unknown): DatosSal;
```

Dato por dato: si el guardado lo tiene y es una opción válida, se toma; si no,
el del defecto. La segunda igual a la principal se descarta. Con masa madre y
`ambiente-2`, la fermentación pasa a `ambiente-4`. La cantidad sólo si es un
número finito y positivo.

- [ ] **Paso 1: test.**

  ```ts
  it('un guardado ilegible o vacío da el defecto', () => {
    expect(completarPan(null)).toEqual(PAN_POR_DEFECTO);
    expect(completarPan('x')).toEqual(PAN_POR_DEFECTO);
  });
  it('una opción que ya no existe vuelve al defecto sólo en ese dato', () => {
    const d = completarPan({ ...PAN_POR_DEFECTO, pan: 'pan-viejo', harina: 'integral' });
    expect(d.pan).toBe('campo');
    expect(d.harina).toBe('integral');
  });
  it('masa madre con 2 h pasa a 4 h', () => {
    expect(completarPan({ ...PAN_POR_DEFECTO, levadura: 'masa-madre', fermentacion: 'ambiente-2' }).fermentacion).toBe('ambiente-4');
  });
  it('la segunda igual a la principal se descarta', () => {
    expect(completarPan({ ...PAN_POR_DEFECTO, harina: '000', segunda: '000' }).segunda).toBeNull();
  });
  it('sal: lo mismo', () => {
    expect(completarSal({ fermento: 'kimchi', pesoTotal: -3 })).toEqual({ fermento: 'kimchi', pesoTotal: 1000 });
  });
  ```

- [ ] **Pasos 2–4:** fallar, implementar, verde.

---

### Tarea 5: las marcas `pan` y `fermentado`

**Archivos:**
- Modificar: `src/especiales.ts`, `src/ui/fichas-receta.ts`, `src/ui/receta.ts`
- Tests: `tests/especiales.test.ts`, `tests/vista-receta.test.ts`, `tests/vista-editor.test.ts`

**Produce:** `DefinicionEspecial.herramienta: 'pan' | 'fermentados' | null`;
`TagEspecial` suma `'pan' | 'fermentado'`.

- [ ] **Paso 1: tests.**
  - `especiales.test.ts`: la tabla tiene seis, en el orden
    `favorito, menú diario, probar, borrador, pan, fermentado`; las filas
    nuevas con ícono `null`, marca `null`, chips/receta/búsqueda `false` y
    herramienta `pan` / `fermentados`; los cuatro de antes con herramienta
    `null`; `tagReservado('pan')` y `tagReservado('Fermentado')` son `true`.
  - `vista-receta.test.ts`: con `tags_especiales: [pan]` y un ingrediente, la
    ficha de ingredientes termina con
    `<a class="btn sec" href="#/herramientas/pan">Calcular pan</a>`; con
    `fermentado`, *Calcular sal* hacia `#/herramientas/fermentados`; sin marca,
    ninguno; sin ingredientes, el botón va igual, en una ficha propia antes de
    *Preparación*; y no hay chip `pan`.
  - `vista-editor.test.ts`: hay botones `data-valor="pan"` y
    `data-valor="fermentado"` en el grupo de especiales, después de
    `borrador`.

- [ ] **Paso 2:** ver que fallan (ajustar el test existente «tiene los cuatro»
  a seis).

- [ ] **Paso 3: implementar.**
  - `especiales.ts`: sumar a `TagEspecial` los dos; campo `herramienta` en la
    interfaz y en cada fila; las dos filas:
    ```ts
    { nombre: 'pan', reservadas: [], icono: null, etiquetaMarca: null,
      enChips: false, enReceta: false, enBusqueda: false, etiquetaEditor: 'pan', herramienta: 'pan' },
    { nombre: 'fermentado', reservadas: [], icono: null, etiquetaMarca: null,
      enChips: false, enReceta: false, enBusqueda: false, etiquetaEditor: 'fermentado', herramienta: 'fermentados' }
    ```
    con un comentario: abren su calculadora desde la receta y no se muestran
    en ningún otro lado.
  - `fichas-receta.ts`: `fichasDelCuerpo(receta, { alPieDeIngredientes = '' } = {})`
    agrega ese HTML al final de la ficha de ingredientes; si no hay
    ingredientes, lo dibuja en una ficha propia, sin título, en ese mismo
    lugar. La vista de invitado no lo pasa.
  - `receta.ts`: arma los botones con
    `ESPECIALES.filter(d => d.herramienta && receta.tags_especiales.includes(d.nombre))`,
    con el texto de una tabla local
    `{ pan: 'Calcular pan', fermentados: 'Calcular sal' }` y el `href`
    `#/herramientas/<herramienta>`. Van en un `<div class="calcular">`.
  - El editor no cambia: ya dibuja un botón por cada fila de la tabla.

- [ ] **Paso 4:** los tres archivos de test y `tests/catalogo-*.test.ts`,
  `tests/store-busqueda.test.ts` (los especiales con `enChips: false` no se
  cuentan) → verde.

---

### Tarea 6: rutas, menú e ícono

**Archivos:**
- Modificar: `src/ui/router.ts`, `src/ui/componentes.ts` (`lateral`), `src/ui/iconos.ts`
- Tests: `tests/router.test.ts`, `tests/componentes.test.ts`

- [ ] **Paso 1: tests.**
  ```ts
  expect(parsearHash('#/herramientas')).toEqual({ vista: 'herramientas', params: {} });
  expect(parsearHash('#/herramientas/pan')).toEqual({ vista: 'calculadora-pan', params: {} });
  expect(parsearHash('#/herramientas/fermentados')).toEqual({ vista: 'calculadora-sal', params: {} });
  expect(parsearHash('#/herramientas/otra')).toEqual({ vista: 'herramientas', params: {} });
  expect(MENU['herramientas']).toBe('herramientas');
  expect(esDelMenu('calculadora-pan')).toBe(false);
  ```
  En `componentes.test.ts`: el lateral tiene `href="#/herramientas"` entre
  `#/plan` y `#/nueva`, marcado con `act` cuando `activo: 'herramientas'`.

- [ ] **Paso 2:** fallan.
- [ ] **Paso 3:** `Vista` suma `'herramientas' | 'calculadora-pan' | 'calculadora-sal'`;
  `DestinoLateral` suma `'herramientas'`; `MENU` suma
  `herramientas: 'herramientas'`; `parsearHash` la rama `herramientas`. En
  `iconos.ts`, `ICO.balanza` (una balanza de cocina simple, trazo como los
  demás). En `lateral`, `item('herramientas', '#/herramientas', ICO.balanza, 'Herramientas')`
  después del plan; actualizar el comentario de `lateral` que enumera las
  entradas.
- [ ] **Paso 4:** verde. Ajustar en `tests/main-rutas.test.ts` el mapa
  `HASH_DE` de «MENU es la única fuente del menú» con
  `herramientas: '#/herramientas'`, y sumar `'#/herramientas/pan'` a
  `SIN_MENU`.

---

### Tarea 7: las pantallas

**Archivos:**
- Crear: `src/ui/herramientas.ts`, `tests/vista-herramientas.test.ts`
- Modificar: `src/ui/base.css`

**Produce:**

```ts
export function renderHerramientas(o: { menu?: MenuDePantalla }): string;
export function renderPan(datos: DatosPan): string;      // la pantalla entera
export function resultadoPan(datos: DatosPan): string;   // sólo el bloque [data-resultado]
export function renderSal(datos: DatosSal): string;
export function resultadoSal(datos: DatosSal): string;
```

Marcado:
- Cada fila de opciones: `<div class="fila-opc" role="group" aria-label="…">`
  con botones `<button type="button" class="tag-esp" data-accion="elegir-opcion"
  data-grupo="pan|harina|segunda|porcentaje|levadura|modo|fermentacion|fermento"
  data-valor="…" aria-pressed="…">`. Reusa el estilo `.tag-esp`.
- La segunda harina: un botón *Ninguna* (`data-valor=""`) y las harinas menos
  la principal; la fila de porcentaje sólo si hay segunda.
- Fermentación: una fila de modo (*Ambiente* / *En frío*, `data-grupo="modo"`)
  y una de horas con `fermentacionesPara(levadura)` del modo elegido
  (`data-grupo="fermentacion"`, `data-valor` = la clave, texto «8 h»).
- Cantidad: dos `<input type="number" inputmode="decimal" min="0" data-cantidad="harina|masa">`
  con su `<label>`; el que manda lleva el valor escrito, el otro el calculado
  redondeado (`Math.round`).
- Resultado: `<div class="ficha" data-resultado>` con las filas como la ficha
  de ingredientes (`.ing` con `.n` y `.c`): una por harina (con masa madre,
  «Harina 000 a agregar»), agua (o «Agua a agregar»), sal, levadura fresca /
  seca / masa madre, hidratación («72 %»). Sin resultado, cada `.c` es «—».
  Debajo, `<ul class="advertencias">` con `ADVERTENCIAS_PAN` y, si
  `topeada`, `AVISO_TOPE`.
- Encabezado: `renderHerramientas` con `izquierdaDelEncabezado(menu)` y
  `conLateral(menu, …)`, como `renderPlan`; las calculadoras con
  `volver: true`.
- Lista de herramientas: dos enlaces a las calculadoras, cada uno con su
  título y una línea («Harinas, agua, sal y levadura», «La sal de un
  frasco»).
- Sal: fila de fermentos, un campo *Peso total (g)* `data-cantidad="peso"`,
  resultado con sal y porcentaje.

- [ ] **Paso 1: tests** (`vista-herramientas.test.ts`):
  - la lista lleva los dos `href`;
  - `renderPan(PAN_POR_DEFECTO)`: las filas en orden (pan, harina, segunda,
    levadura, modo, fermentación, cantidad) por la posición de cada
    `data-grupo`; el botón de `campo` con `aria-pressed="true"`; el resultado
    dice 720, 20, «5,0» y «72 %»; las dos advertencias;
  - la fila de segunda no ofrece `data-valor="000"` cuando la principal es
    000; sin segunda no hay fila de porcentaje;
  - con masa madre, la fila de horas no tiene `ambiente-2` y las filas dicen
    «a agregar»;
  - topeado: aparece el aviso del tope;
  - cantidad 0: el resultado muestra «—»;
  - `renderSal(SAL_POR_DEFECTO)`: 20 g y «2 %».
- [ ] **Paso 2:** fallan. **Paso 3:** implementar y sumar a `base.css` lo
  mínimo: `.fila-opc` (flex, wrap, gap `var(--e-2)`), `.advertencias`
  (texto `--txt-chico`, color tenue), `.calcular` (margen arriba). Usar sólo
  tokens de `tokens.css`. **Paso 4:** verde.

---

### Tarea 8: el controlador y `main.ts`

**Archivos:**
- Crear: `src/herramientas-control.ts`, `tests/herramientas-control.test.ts`
- Modificar: `src/main.ts`, `tests/main-rutas.test.ts`

**Produce:**

```ts
export interface ControlHerramientas {
  pan(): DatosPan; sal(): DatosSal;
  acciones: SeccionDeAcciones;           // 'elegir-opcion'
  alEscribir(campo: HTMLInputElement): void; // un input [data-cantidad]
}
export function crearControlHerramientas(o: {
  almacen: Pick<Storage, 'getItem' | 'setItem'> | null;
  redibujar: () => void;                 // repinta la pantalla actual
  pintarResultado: () => void;           // repinta sólo [data-resultado] y el otro campo
}): ControlHerramientas;
```

- Claves de `localStorage`: `recetario.herramientas.pan` y
  `recetario.herramientas.sal`. Se leen una vez al crear el control
  (`completarPan` / `completarSal` sobre el `JSON.parse`, todo en `try/catch`)
  y se escriben en cada cambio (en `try/catch`).
- `elegir-opcion`: actualiza el dato del `data-grupo`, aplica las reglas de
  `completarPan` (segunda igual a la principal → ninguna; masa madre con 2 h →
  4 h; cambiar de modo elige la primera fermentación del nuevo modo), guarda y
  llama a `redibujar()` (un toque no tiene foco que perder).
- `alEscribir`: lee el número (coma o punto), pone
  `cantidad = { de, gramos }` (o `pesoTotal`), guarda y llama a
  `pintarResultado()`: **no redibuja**, para no sacarle el foco al campo.
- `main.ts`:
  - crear el control con `almacen` = `localStorage` dentro de `try/catch`
    (null si no se puede);
  - registrar `herramientas: control.acciones` en `registrarAcciones`;
  - en el `switch` de `render`: `herramientas` → `renderHerramientas({ ...menuDe('herramientas') })`;
    `calculadora-pan` → `renderPan(control.pan())`; `calculadora-sal` →
    `renderSal(control.sal())`;
  - en el listener de `input`: si el destino es `[data-cantidad]` en una
    calculadora, `control.alEscribir(destino)`;
  - `pintarResultado`: con `pintarParte` reemplaza `[data-resultado]` por
    `resultadoPan`/`resultadoSal` y pone en el otro campo de cantidad el valor
    calculado.

- [ ] **Paso 1: tests.** `herramientas-control.test.ts` con `localStorageFalso()`:
  - sin nada guardado, `pan()` es el defecto;
  - `elegir-opcion` con `grupo=levadura, valor=masa-madre` estando en
    `ambiente-2` deja `ambiente-4`, guarda en la clave y llama a `redibujar`;
  - `alEscribir` en `data-cantidad="masa"` con «1745» deja
    `cantidad = { de: 'masa', gramos: 1745 }` y llama a `pintarResultado`, no
    a `redibujar`;
  - con `almacen` que lanza en `getItem`/`setItem`, todo funciona igual.

  En `main-rutas.test.ts`: `#/herramientas`, `#/herramientas/pan` y
  `#/herramientas/fermentados` dibujan su pantalla (sumar al test «cada ruta
  dibuja su pantalla»); tocar una opción cambia `aria-pressed`; desde una
  receta con `pan`, el botón *Calcular pan* lleva a la calculadora y volver
  regresa a la receta.
- [ ] **Paso 2:** fallan. **Paso 3:** implementar. **Paso 4:** verde, más
  `npm run typecheck`.

---

### Tarea 9: MCP y skills

**Archivos:**
- Modificar: `mcp/recetario.ts`, `mcp/servidor.ts`, `skills/recetario/SKILL.md`
- Crear: `skills/herramientas/SKILL.md`
- Tests: `tests/mcp-servidor.test.ts`, `tests/mcp-herramientas.test.ts` (nuevo)

- [ ] **Paso 1: tests.**
  - `mcp-servidor.test.ts`: la lista de herramientas suma `calcular_pan` y
    `calcular_sal` (doce, ordenadas); cambiar el título «lista las diez» por
    «lista las doce».
  - `mcp-herramientas.test.ts` (sin Drive, como los de `formato`):
    - `calcularPan` con todos los datos devuelve
      `{ resultado, advertencias }` con los mismos números que
      `calcularPan(datos)` y las advertencias;
    - con datos faltantes devuelve `{ faltan }` de `leerPedidoPan`;
    - `calcularSal` igual.
- [ ] **Paso 2:** fallan.
- [ ] **Paso 3:**
  - `mcp/recetario.ts`: `calcularPan(pedido)` y `calcularSal(pedido)` que
    usan `leerPedidoPan`/`leerPedidoSal` y, con datos, devuelven el resultado
    con los gramos ya redondeados con `gramos()` (las harinas con su nombre)
    y `ADVERTENCIAS_PAN` (más `AVISO_TOPE` si corresponde). No usan el
    arranque ni el login.
  - `mcp/servidor.ts`: `registerTool('calcular_pan', …)` con un `inputSchema`
    de `zod` con todos los campos de `PedidoPan` opcionales (los nombres de la
    tabla en la descripción de cada uno) y la descripción: «Las cantidades de
    un pan… Si falta un dato, no calcula: devuelve qué falta y sus opciones.
    No completes datos por tu cuenta: preguntáselos al usuario.» Igual
    `calcular_sal`.
  - `skills/herramientas/SKILL.md`: frontmatter con `name: herramientas` y una
    descripción que lo active con pedidos de calcular las cantidades de un pan
    (harina, agua, sal, levadura, masa madre, hidratación) o la sal de un
    fermentado. Cuerpo:
    - tomar del pedido los datos que vienen y no repreguntarlos;
    - no asumir ningún otro: llamar a la herramienta con lo que hay; si
      devuelve `faltan`, preguntar todo lo que falta en **un solo mensaje**,
      en el orden pan, harinas (y si hay segunda, su porcentaje), levadura,
      fermentación (ambiente o frío, y horas), cantidad, con las opciones que
      devolvió;
    - los números salen siempre de `calcular_pan` / `calcular_sal`: no
      inventar porcentajes ni corregir los resultados;
    - mostrar el resultado como lista y las advertencias debajo;
    - ejemplo: «quiero hacer un pan con 500 g de 000» → ya están la harina y
      la cantidad; se preguntan pan, segunda harina, levadura y fermentación.
  - `skills/recetario/SKILL.md`: la regla de las marcas (spec §5.3) donde
    habla de `tags_especiales`, y una línea: «Si el pedido es calcular un pan
    o la sal de un fermentado, usá el skill `herramientas`.»
- [ ] **Paso 4:** `npx vitest run tests/mcp-*.test.ts` y
  `npx tsc -p mcp/tsconfig.json --noEmit` → verde.
- [ ] **Paso 5 (otro repo, sin pushear):** en
  `/Users/alelarre/Documents/claude-code-marketplace/.claude-plugin/marketplace.json`,
  el plugin `recetario` suma `"./skills/herramientas"` a `skills` y pasa a
  `"version": "1.1.0"`. Dejarlo sin commitear y mostrarlo en la Tarea 11.

---

### Tarea 10: documentos

- `product-design/product/specs/E07-Herramientas.md` (nuevo), con la forma de
  las otras épicas: la sección, las dos calculadoras (datos, tablas, cuentas,
  redondeo, tope, advertencias, últimas elecciones), el botón *Calcular*, y
  los criterios de aceptación con edge cases. Las tablas apuntan a
  `src/calculadoras/` como la fuente: el documento dice cómo funciona y el
  archivo, los números.
- `specs-overview.md`: la épica nueva.
- `E05-Cimientos.md` C05.1.4: seis especiales; `pan` y `fermentado` sin
  presentación propia, con su herramienta.
- `E03-LeerYCocinar.md`: el botón *Calcular* al pie de los ingredientes.
- `E04-Corregir.md`: los dos botones nuevos del editor.
- `ux/information-architecture.md`: el destino *Herramientas*, las tres rutas
  y la entidad *Herramienta*.
- `CLAUDE.md`: los especiales son seis; «Dónde está cada cosa» suma
  `src/calculadoras/` (con «toda la fórmula de cada calculadora vive en su
  archivo»), `src/ui/herramientas.ts` y `src/herramientas-control.ts`; el MCP
  tiene doce herramientas (sumar `calcular_pan` y `calcular_sal`, que no usan
  Drive); el plugin trae dos skills.

---

### Tarea 11: verificación y revisión

- [ ] `npm test`, `npm run typecheck`, `npm run build` → verde.
- [ ] Revisión del diff completo por un revisor nuevo.
- [ ] Mostrar al usuario el diff de este repo y el de
  `claude-code-marketplace`; con su visto bueno, commitear, sacar P106 del
  backlog, borrar este plan y el spec, y pushear los dos repos.
