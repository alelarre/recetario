# Evento, planificar — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una herramienta nueva, *Evento* (`#/herramientas/evento`), que dice cuánto comprar o hacer para una reunión —merienda, asado, comida, picada o cóctel—, con bebidas, hielo, infusiones y carbón o leña, y la misma cuenta por el MCP (`calcular_evento`).

**Architecture:** Un módulo puro, `src/eventos/`: la forma (`tipos.ts`), el formato de compra (`formato.ts`), el estado guardado y sus cambios (`estado.ts`), la cuenta común (`evento.ts`), lo que se suma después (`ademas.ts`), los cinco tipos y sus números con fuente (`datos/`). La pantalla (`src/ui/evento.ts`) y el control (`src/eventos-control.ts`) sólo dibujan y guardan; `mcp/eventos.ts` usa la misma cuenta.

**Tech Stack:** TypeScript estricto (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`), Vite, Vitest con el DOM falso de `tests/dom-falso.ts`, zod 4 en el MCP.

**Spec:** `docs/superpowers/specs/2026-10-10-eventos-planificar-design.md`. Investigación: `product-design/research/herramientas/eventos.md`.

## Global Constraints

- **No se commitea nada** hasta que el usuario revise el diff completo (CLAUDE.md: «en esas features, el código no se commitea hasta que el usuario revisa el diff»). Ningún paso de este plan hace `git commit`.
- Todo en español rioplatense: código, comentarios, UI, nombres.
- Imports con `.js`; `import type` para lo que es sólo tipo (`verbatimModuleSyntax`).
- Nada de `instanceof` contra clases del navegador en `src/`; el destino de un evento se estrecha con `conClosest`.
- **Los números viven en `src/eventos/datos/`**, cada uno con su fuente `{ nombre, url }` o con `fuente: null` y una `nota`. **Ningún test fija un valor de esos archivos**: los tests de la cuenta usan tipos y números de prueba.
- Las cuentas no tienen ningún número escrito adentro; la única excepción es la estructura (1/n del reparto, 100 del porcentaje, 1000 de g a kg, 12 y 6 de las docenas).
- Un comentario dice la razón vigente; no cita entradas del backlog ni secciones de este plan o del spec.
- `localStorage` siempre con `try/catch`.
- `npm test`, `npm run typecheck` y `npm run build` en verde al final.

## Review Focus

1. **Adultos o chicos con decimales, o vacíos.** «2,5» se lee 2,5; vacío es `null` y no hay lista. Nunca «NaN» ni «Infinity» en una cantidad → test en la Task 4 y en la Task 6 (cada tipo, sin «NaN» en ningún texto).
2. **Horas vacías o en cero.** Se calcula con las horas por defecto de `COMUNES` → test en la Task 4.
3. **Cambiar de tipo y volver** conserva adultos, chicos y lo de cada tipo → test en la Task 3 y en la Task 8.
4. **«Adultos que toman alcohol» mayor que los adultos** se recorta a los adultos → test en la Task 5.
5. **Lo guardado en el teléfono de una versión anterior** —una cosa, un tipo o una opción que ya no existen, JSON roto— se ignora sin romper → test en la Task 3 y en la Task 8.

---

### Task 1: Verificar los números

Antes de los datos (Task 6). Las Tasks 2 a 5 no dependen de ésta y pueden correr a la vez.

**Files:**
- Create: `product-design/research/herramientas/verificacion-eventos.md`

**Interfaces:**
- Produces: una tabla por archivo de datos con una fila por constante, con la columna **Constante** igual al camino que usa la Task 6 (`ASADO.tira`, `BEBIDAS.cerveza.mlPorHora`…).

- [ ] **Step 1: Mandar a un agente a releer las fuentes**

Un agente `general-purpose` con WebFetch y WebSearch. Prompt:

> Leé `product-design/research/herramientas/eventos.md` y `product-design/research/herramientas/verificacion-conversor.md` (como modelo de formato). Escribí `product-design/research/herramientas/verificacion-eventos.md`: para cada constante de la lista de abajo, abrí la fuente de `eventos.md` que la respalda y anotá el número **tal como lo dice la página**, con la cita textual corta y la URL. Si la página no abre, decilo y buscá otra fuente argentina; si no hay ninguna, marcá la fila «sin fuente». Donde dos fuentes abiertas dicen cosas distintas, poné una fila por fuente y marcá la constante «contradicción». No elijas vos. Las conversiones (onzas, tazas, «1 cada 4») van con la cuenta escrita. En español rioplatense, sin fechas de consulta ni capturas.
>
> Formato: una sección por archivo (`comunes`, `bebidas`, `asado`, `merienda`, `comida`, `picada`, `coctel`) y en cada una una tabla `| Constante | Valor | Unidad | Fuente | URL | Lo que dice | Estado |`, con Estado `ok`, `contradicción` o `sin fuente`.
>
> Constantes (unidad entre paréntesis):
> - `COMUNES.factorChico` (fracción de adulto).
> - `BEBIDAS.horasPlenas` (h), `BEBIDAS.despues` (fracción por hora después), `BEBIDAS.calor` (factor), `BEBIDAS.chico` (lo que toma un chico sin alcohol sobre un adulto); para cerveza, vino, fernet, gaseosa, agua y jugo: `BEBIDAS.<bebida>.mlPorHora` (ml por persona por hora si es la única de las suyas) y `BEBIDAS.<bebida>.envase` (ml y nombre del envase de acá); `BEBIDAS.fernet.cola` (ml de cola por ml de fernet) y su envase; `BEBIDAS.brindis.mlPorAdulto` y su envase.
> - `HIELO.kgPorPersona`, `HIELO.kgPorLitroFrio`, `HIELO.calor` (factor), `HIELO.bolsa` (kg).
> - `INFUSIONES.tazasPorPersona`, `INFUSIONES.cafe` (g por taza), `INFUSIONES.te` y `INFUSIONES.mateCocido` (saquitos por taza), `INFUSIONES.leche` (ml por taza).
> - `COMBUSTIBLE.carbonPorKgCarne`, `COMBUSTIBLE.lenaPorKgCarne` (kg por kg), `COMBUSTIBLE.vientoOFrio` (factor), `COMBUSTIBLE.bolsaCarbon` (kg).
> - `ASADO.<corte>` para tira, vacío, matambre, entraña, pollo, cerdo y cordero (g crudos por persona si es la única carne); `ASADO.chorizo`, `ASADO.morcilla`, `ASADO.provoleta` (unidades por persona); `ASADO.chinchulines`, `ASADO.mollejas`, `ASADO.verduras`, `ASADO.papas`, `ASADO.ensalada`, `ASADO.pan` (g por persona); `ASADO.ocasion.almuerzo`, `.cena`, `.festejo` (factor sobre la carne; sin ajuste, «ninguno»).
> - `MERIENDA.facturas`, `MERIENDA.miga`, `MERIENDA.salados`, `MERIENDA.dulces` (unidades por persona si es lo único, en una merienda de 2 a 4 h); `MERIENDA.torta` (g por persona); `MERIENDA.horas` (factor de hasta 2 h y de más de 4 h sobre la de 2 a 4 h); `MERIENDA.infantil` (factor).
> - `COMIDA.antes.empanadas` (unidades), `COMIDA.antes.vitelTone` (g), `COMIDA.antes.bocaditos` (unidades); `COMIDA.comer.empanadas`, `COMIDA.comer.pizza` (porciones), `COMIDA.comer.pastaSeca`, `.pastaFresca`, `.carne`, `.pollo`, `.pescado` (g); `COMIDA.porcionesPorPizza`; `COMIDA.acompanamiento.pure`, `.papas`, `.ensalada`, `.arroz` (g crudos); `COMIDA.postre.torta` (g), `.helado` (ml), `.postre` (g), `.fruta` (g); `COMIDA.pan` (g); `COMIDA.ocasion.almuerzo`, `.cena`, `.festejo` (factor sobre «Para comer»); `COMIDA.sobras` (factor).
> - `PICADA.antes.<parte>` y `PICADA.comida.<parte>` (g por persona) para fiambres, quesos, pan, vegetales, snacks y dips.
> - `COCTEL.bocados` (unidades por persona si es un solo tipo de bocado, en un cóctel de 2 a 4 h); `COCTEL.horas` (factor de hasta 2 h y de más de 4 h).

- [ ] **Step 2: Que el usuario elija en cada contradicción**

Leer el archivo que dejó el agente. Para cada constante marcada `contradicción`, una pregunta con `AskUserQuestion` —hasta cuatro por llamada—, **con un caso concreto y números** («10 personas con 4,5 kg de carne: ¿4,5 kg de carbón (El Cronista) o 8 kg (servidos.ar)?»), sin nombres de mecanismos. Las que el spec ya anticipa: el factor de chico, el chorizo y la morcilla, el carbón por kilo de carne, el hielo, la cola por fernet, las empanadas para comer, el helado y el vino.

- [ ] **Step 3: Anotar las decisiones**

En `verificacion-eventos.md`, una sección **Decisiones** con una línea por constante elegida: la constante, el valor y la fuente. Toda constante tiene que quedar con un solo valor, una fuente o `sin fuente` con la nota que va a llevar en los datos.

---

### Task 2: La forma y el formato de compra

**Files:**
- Create: `src/eventos/tipos.ts`, `src/eventos/formato.ts`
- Test: `tests/eventos-formato.test.ts`

**Interfaces:**
- Produces: todos los tipos de `tipos.ts` (abajo, completos) y `arriba`, `unidades`, `peso`, `volumen`, `envases` de `formato.ts`.

- [ ] **Step 1: Escribir `src/eventos/tipos.ts`**

```ts
/**
 * La forma de un evento, en un solo lugar: el tipo con sus datos, sus grupos,
 * sus cosas y lo que se suma después; los números con su fuente; lo que se
 * guarda; y lo que se calcula. Los números viven en `datos/`; la cuenta, en
 * `evento.ts` y `ademas.ts`.
 */
import type { Fuente } from '../referencias/tipos.js';

/** Un número de los datos: con su fuente, o sin ninguna y con la nota que lo dice. */
export type Dato =
  | { valor: number; fuente: Fuente }
  | { valor: number; fuente: null; nota: string };

export type ValorDeDato = number | string | boolean | null;
export type Valores = Readonly<Record<string, ValorDeDato>>;

/** Un dato que se pide: un número, una opción o un sí o no. */
export type DatoPedido =
  | { id: string; nombre: string; tipo: 'numero'; unidad?: string; porDefecto: number | null }
  | { id: string; nombre: string; tipo: 'opcion'; opciones: readonly { valor: string; texto: string }[]; porDefecto: string }
  | { id: string; nombre: string; tipo: 'si-no'; porDefecto: boolean };

/** Lo que sabe el evento al calcular una porción o un factor. */
export interface Contexto {
  adultos: number;
  chicos: number;
  /** Los adultos más los chicos por su factor. */
  personas: number;
  horas: number;
  calor: boolean;
  /** Los datos del tipo, ya completos. */
  tipo: Valores;
}

/** Un tramo de horas: hasta cuántas —`null`, sin tope— y su factor; `null`, el tramo que no cambia nada. */
export interface Tramo { hastaHoras: number | null; factor: Dato | null }

export interface Grupo {
  id: string;
  titulo: string;
  /** Con n cosas prendidas, cada una lleva 1/n de su porción. */
  seReparte: boolean;
  /** Lo que multiplica al grupo: las horas, la ocasión, con sobras. */
  factores?: (c: Contexto) => readonly Dato[];
}

export interface NombreDeEnvase { uno: string; varios: string }
/** Un envase de compra: cuántas unidades de la cosa trae —ocho porciones por pizza—. */
export interface Envase { cantidad: Dato; nombre: NombreDeEnvase }

interface CosaBase {
  id: string;
  nombre: string;
  /** El `id` de su grupo. */
  grupo: string;
  prendida: boolean;
  /** El chico come como un adulto: la torta. */
  chicoEntero?: true;
  /** Carne cruda en gramos: cuenta para el carbón o la leña. */
  carne?: true;
}
export interface CosaSimple extends CosaBase {
  /** Cuánto come una persona si es lo único de su grupo, en `unidad`. */
  porcion: (c: Contexto) => Dato;
  unidad: 'unidad' | 'g' | 'ml';
  /** Cómo se llama la unidad, «porciones»; sin nombre, el número solo. */
  nombreUnidad?: string;
  /** Se compra por docena: se redondea a la media docena. */
  docenas?: true;
  envase?: Envase;
}
/** Una cosa hecha de partes en gramos: la picada que va antes, en fiambres, quesos y pan. */
export interface CosaConPartes extends CosaBase {
  partes: readonly { id: string; nombre: string; porcion: (c: Contexto) => Dato }[];
}
export type Cosa = CosaSimple | CosaConPartes;

export interface Item { id: string; nombre: string; cantidad: string }

export type IdAdemas = 'bebidas' | 'infusiones' | 'hielo' | 'combustible';
/** Lo ya calculado que leen las que se suman después. */
export interface Calculado {
  contexto: Contexto;
  /** 1, 1,1 o 1,2. */
  margen: number;
  /** Gramos de carne cruda de las cosas prendidas, con el margen. */
  carneG: number;
  /** Mililitros de bebida fría, con el margen: los enfría el hielo. */
  mlFrios: number;
}
export interface Parcial { items: readonly Item[]; usados: readonly Dato[]; mlFrios?: number }
export interface Ademas {
  id: IdAdemas;
  nombre: string;
  datos: readonly DatoPedido[];
  calcular(c: Calculado, v: Valores): Parcial;
}

export interface TipoDeEvento {
  id: string;
  nombre: string;
  datos: readonly DatoPedido[];
  grupos: readonly Grupo[];
  cosas: readonly Cosa[];
  ademas: readonly { ademas: Ademas; prendido: boolean }[];
  /** Un dato del tipo cuya opción prende sus cosas y apaga las demás que nombra: el tipo de asado. */
  atajo?: { dato: string; cosas: Readonly<Record<string, readonly string[]>> };
  /** El grupo cuyos gramos van en las cifras: la carne del asado. */
  cifra?: { grupo: string; nombre: string };
}

/** Lo que vale para todos los tipos. `horas` es el valor por defecto del campo. */
export interface Comunes { factorChico: Dato; horas: number }

export type Margen = 0 | 10 | 20;
export interface EstadoDeTipo {
  datos: Valores;
  cosas: Readonly<Record<string, boolean>>;
  ademas: Readonly<Record<string, { prendido: boolean; datos: Valores }>>;
}
/** Lo que se guarda: un evento a la vez, con lo de cada tipo por separado. */
export interface EstadoEvento {
  tipo: string;
  adultos: number | null;
  chicos: number | null;
  horas: number | null;
  calor: boolean;
  margen: Margen;
  porTipo: Readonly<Record<string, EstadoDeTipo>>;
}

export interface Linea { nombre: string; valor: string }
export interface GrupoDeResultado { titulo: string; items: readonly Item[] }
export interface ResultadoEvento {
  /** «Asado para 12 (10 adultos, 2 chicos)». */
  titulo: string;
  cifras: readonly Linea[];
  grupos: readonly GrupoDeResultado[];
  ademas: readonly Item[];
  advertencias: readonly string[];
  fuentes: readonly Fuente[];
}
```

- [ ] **Step 2: Escribir el test que falla, `tests/eventos-formato.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { arriba, unidades, peso, volumen, envases } from '../src/eventos/formato.js';

describe('el formato de compra', () => {
  it('redondea para arriba sin sumar uno por la coma flotante', () => {
    expect(arriba(2.0000001)).toBe(2);
    expect(arriba(2.1)).toBe(3);
  });

  it('las unidades van enteras, con su nombre si lo tienen', () => {
    expect(unidades(2.1)).toBe('3');
    expect(unidades(3, { nombre: 'porciones' })).toBe('3 porciones');
  });

  it('lo que se compra por docena se redondea a la media docena y dice las docenas', () => {
    expect(unidades(5, { porDocena: true })).toBe('6 (½ docena)');
    expect(unidades(12, { porDocena: true })).toBe('12 (1 docena)');
    expect(unidades(13, { porDocena: true })).toBe('18 (1 ½ docenas)');
    expect(unidades(30, { porDocena: true })).toBe('30 (2 ½ docenas)');
    expect(unidades(0, { porDocena: true })).toBe('0');
  });

  it('el peso va en gramos debajo de 1 kg y en kg con un decimal desde 1 kg, para arriba', () => {
    expect(peso(450)).toBe('450 g');
    expect(peso(999.2)).toBe('1 kg');
    expect(peso(2400)).toBe('2,4 kg');
    expect(peso(2401)).toBe('2,5 kg');
  });

  it('el volumen va en ml debajo de 1 l y en litros con un decimal desde 1 l', () => {
    expect(volumen(330)).toBe('330 ml');
    expect(volumen(14150)).toBe('14,2 l');
    expect(volumen(12000)).toBe('12 l');
  });

  it('los envases van enteros para arriba, en singular si es uno', () => {
    const lata = { uno: 'lata', varios: 'latas' };
    expect(envases(14150, 473, lata)).toBe('30 latas');
    expect(envases(400, 750, { uno: 'botella', varios: 'botellas' })).toBe('1 botella');
  });
});
```

- [ ] **Step 3: Correrlo y ver que falla**

Run: `npx vitest run tests/eventos-formato.test.ts`
Expected: FAIL, no encuentra `../src/eventos/formato.js`.

- [ ] **Step 4: Escribir `src/eventos/formato.ts`**

```ts
/**
 * Cómo se muestra lo que se compra: lo que va por unidad, entero y para
 * arriba —por docena, a la media docena—; el peso en gramos o en kilos; el
 * volumen en mililitros o en litros; y los envases.
 */
import type { NombreDeEnvase } from './tipos.js';

/** Para arriba, sin que el error de la coma flotante sume uno: 2,0000001 es 2. */
export const arriba = (n: number): number => Math.ceil(n - 1e-9);

const conComa = (n: number): string => String(n).replace('.', ',');

/** «½ docena», «1 docena», «2 ½ docenas»: `n` es múltiplo de seis. */
function docenas(n: number): string {
  const enteras = Math.floor(n / 12);
  const media = n % 12 !== 0;
  const texto = enteras === 0 ? '½' : media ? `${enteras} ½` : String(enteras);
  return `${texto} ${n > 12 ? 'docenas' : 'docena'}`;
}

/** Unidades enteras para arriba; las que se compran por docena, a la media docena. */
export function unidades(n: number, { nombre, porDocena = false }: { nombre?: string | undefined; porDocena?: boolean | undefined } = {}): string {
  const u = porDocena ? arriba(n / 6) * 6 : arriba(n);
  const base = nombre ? `${u} ${nombre}` : String(u);
  return porDocena && u > 0 ? `${base} (${docenas(u)})` : base;
}

/** En gramos enteros debajo de 1 kg; desde 1 kg, en kg con un decimal. Siempre para arriba. */
export function peso(g: number): string {
  const enteros = arriba(g);
  return enteros < 1000 ? `${enteros} g` : `${conComa(arriba(g / 100) / 10)} kg`;
}

/** En mililitros enteros debajo de 1 l; desde 1 l, en litros con un decimal. Siempre para arriba. */
export function volumen(ml: number): string {
  const enteros = arriba(ml);
  return enteros < 1000 ? `${enteros} ml` : `${conComa(arriba(ml / 100) / 10)} l`;
}

/** Cuántos envases hacen falta, para arriba: «30 latas». */
export function envases(total: number, porEnvase: number, nombre: NombreDeEnvase): string {
  const n = arriba(total / porEnvase);
  return `${n} ${n === 1 ? nombre.uno : nombre.varios}`;
}
```

- [ ] **Step 5: Correrlo y ver que pasa**

Run: `npx vitest run tests/eventos-formato.test.ts`
Expected: PASS.

---

### Task 3: El estado guardado y sus cambios

**Files:**
- Create: `src/eventos/estado.ts`
- Test: `tests/eventos-estado.test.ts`

**Interfaces:**
- Consumes: los tipos de la Task 2.
- Produces:
  - `MARGENES: readonly Margen[]`
  - `valoresDe(datos: readonly DatoPedido[], guardado: unknown): Valores`
  - `estadoInicialDeTipo(t: TipoDeEvento): EstadoDeTipo`
  - `estadoInicial(tipos: readonly TipoDeEvento[], comunes: Comunes): EstadoEvento`
  - `completarEvento(crudo: unknown, tipos: readonly TipoDeEvento[], comunes: Comunes): EstadoEvento`
  - `tipoDe(e: EstadoEvento, tipos: readonly TipoDeEvento[]): TipoDeEvento | undefined`
  - `estadoDeTipo(e: EstadoEvento, t: TipoDeEvento): EstadoDeTipo`
  - `conTipo(e, tipos, id: string): EstadoEvento`
  - `conDato(e, tipos, id: string, valor: ValorDeDato): EstadoEvento`
  - `conCosa(e, tipos, id: string, prendida: boolean): EstadoEvento`
  - `conAdemas(e, tipos, id: string, prendido: boolean): EstadoEvento`
  - `conDatoDeAdemas(e, tipos, ademas: string, dato: string, valor: ValorDeDato): EstadoEvento`

- [ ] **Step 1: Escribir el test que falla, `tests/eventos-estado.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import {
  valoresDe, estadoInicial, estadoInicialDeTipo, completarEvento, estadoDeTipo,
  conTipo, conDato, conCosa, conAdemas, conDatoDeAdemas
} from '../src/eventos/estado.js';
import type { Ademas, Comunes, Dato, DatoPedido, TipoDeEvento } from '../src/eventos/tipos.js';

const d = (valor: number): Dato => ({ valor, fuente: { nombre: 'F', url: 'https://f.com' } });
const COMUNES: Comunes = { factorChico: d(0.5), horas: 4 };
const nada = () => d(1);
const ADEMAS: Ademas = {
  id: 'hielo', nombre: 'Hielo',
  datos: [{ id: 'enfriar', nombre: 'Enfriar', tipo: 'si-no', porDefecto: false }],
  calcular: () => ({ items: [], usados: [] })
};
const CON_ATAJO: TipoDeEvento = {
  id: 'uno', nombre: 'Uno',
  datos: [
    { id: 'menu', nombre: 'Menú', tipo: 'opcion', porDefecto: 'a', opciones: [{ valor: 'a', texto: 'A' }, { valor: 'b', texto: 'B' }] },
    { id: 'fiesta', nombre: 'Fiesta', tipo: 'si-no', porDefecto: false }
  ],
  grupos: [{ id: 'g', titulo: 'G', seReparte: true }],
  cosas: [
    { id: 'x', nombre: 'X', grupo: 'g', prendida: false, porcion: nada, unidad: 'unidad' },
    { id: 'y', nombre: 'Y', grupo: 'g', prendida: true, porcion: nada, unidad: 'unidad' },
    { id: 'z', nombre: 'Z', grupo: 'g', prendida: true, porcion: nada, unidad: 'unidad' }
  ],
  ademas: [{ ademas: ADEMAS, prendido: true }],
  atajo: { dato: 'menu', cosas: { a: ['x'], b: ['y'] } }
};
const SIN_ATAJO: TipoDeEvento = { id: 'dos', nombre: 'Dos', datos: CON_ATAJO.datos, grupos: CON_ATAJO.grupos, cosas: CON_ATAJO.cosas, ademas: CON_ATAJO.ademas };
const TIPOS = [CON_ATAJO, SIN_ATAJO];

describe('los datos de un tipo', () => {
  it('lo guardado que sigue valiendo se queda; lo demás vuelve a su valor por defecto', () => {
    const datos: DatoPedido[] = [
      { id: 'n', nombre: 'N', tipo: 'numero', porDefecto: 3 },
      { id: 'o', nombre: 'O', tipo: 'opcion', porDefecto: 'a', opciones: [{ valor: 'a', texto: 'A' }, { valor: 'b', texto: 'B' }] },
      { id: 's', nombre: 'S', tipo: 'si-no', porDefecto: false }
    ];
    expect(valoresDe(datos, { n: 5, o: 'b', s: true })).toEqual({ n: 5, o: 'b', s: true });
    expect(valoresDe(datos, { n: -1, o: 'c', s: 'si' })).toEqual({ n: 3, o: 'a', s: false });
    expect(valoresDe(datos, null)).toEqual({ n: 3, o: 'a', s: false });
  });
});

describe('el estado inicial', () => {
  it('arranca en el primer tipo, sin personas y con las horas por defecto', () => {
    expect(estadoInicial(TIPOS, COMUNES)).toEqual({ tipo: 'uno', adultos: null, chicos: null, horas: 4, calor: false, margen: 0, porTipo: {} });
  });

  it('lo inicial de un tipo aplica su atajo: prende las de la opción y apaga las demás que nombra', () => {
    expect(estadoInicialDeTipo(CON_ATAJO).cosas).toEqual({ x: true, y: false, z: true });
    expect(estadoInicialDeTipo(CON_ATAJO).ademas).toEqual({ hielo: { prendido: true, datos: { enfriar: false } } });
  });
});

describe('lo leído del teléfono', () => {
  it('sin nada, o roto, es el estado inicial', () => {
    expect(completarEvento(null, TIPOS, COMUNES)).toEqual(estadoInicial(TIPOS, COMUNES));
    expect(completarEvento('roto', TIPOS, COMUNES)).toEqual(estadoInicial(TIPOS, COMUNES));
  });

  it('un tipo que ya no existe vuelve al primero; un margen que no es uno de los tres, a cero', () => {
    const e = completarEvento({ tipo: 'viejo', margen: 15, adultos: -3, chicos: 2.5 }, TIPOS, COMUNES);
    expect([e.tipo, e.margen, e.adultos, e.chicos]).toEqual(['uno', 0, null, 2.5]);
  });

  it('sin horas guardadas, las de por defecto; vacías, quedan vacías', () => {
    expect(completarEvento({}, TIPOS, COMUNES).horas).toBe(4);
    expect(completarEvento({ horas: null }, TIPOS, COMUNES).horas).toBeNull();
  });

  it('una cosa o algo de lo que se suma que ya no existen se ignoran; una opción vieja vuelve a la de por defecto', () => {
    const e = completarEvento({
      porTipo: { uno: { datos: { menu: 'c' }, cosas: { y: true, vieja: true }, ademas: { vieja: { prendido: true }, hielo: { prendido: false, datos: { enfriar: true } } } } }
    }, TIPOS, COMUNES);
    expect(e.porTipo['uno']).toEqual({
      datos: { menu: 'a', fiesta: false },
      cosas: { x: true, y: true, z: true },
      ademas: { hielo: { prendido: false, datos: { enfriar: true } } }
    });
  });
});

describe('los cambios', () => {
  const inicial = estadoInicial(TIPOS, COMUNES);

  it('cambiar de tipo y volver conserva lo de cada tipo, y las personas', () => {
    let e = { ...conCosa(inicial, TIPOS, 'z', false), adultos: 8 };
    e = conTipo(e, TIPOS, 'dos');
    e = conCosa(e, TIPOS, 'x', true);
    e = conTipo(e, TIPOS, 'uno');
    expect(e.adultos).toBe(8);
    expect(estadoDeTipo(e, CON_ATAJO).cosas['z']).toBe(false);
    expect(e.porTipo['dos']?.cosas['x']).toBe(true);
  });

  it('un tipo que no existe no cambia nada', () => {
    expect(conTipo(inicial, TIPOS, 'otro')).toBe(inicial);
  });

  it('el dato del atajo prende y apaga sólo lo que el atajo nombra', () => {
    const e = conDato(conCosa(inicial, TIPOS, 'z', false), TIPOS, 'menu', 'b');
    expect(estadoDeTipo(e, CON_ATAJO).cosas).toEqual({ x: false, y: true, z: false });
  });

  it('otro dato no toca las cosas', () => {
    const e = conDato(inicial, TIPOS, 'fiesta', true);
    expect(estadoDeTipo(e, CON_ATAJO).datos['fiesta']).toBe(true);
    expect(estadoDeTipo(e, CON_ATAJO).cosas).toEqual(estadoInicialDeTipo(CON_ATAJO).cosas);
  });

  it('una cosa que no existe no cambia nada', () => {
    expect(estadoDeTipo(conCosa(inicial, TIPOS, 'nada', true), CON_ATAJO)).toEqual(estadoInicialDeTipo(CON_ATAJO));
  });

  it('lo que se suma después se apaga y se le cambian los datos', () => {
    let e = conAdemas(inicial, TIPOS, 'hielo', false);
    e = conDatoDeAdemas(e, TIPOS, 'hielo', 'enfriar', true);
    expect(estadoDeTipo(e, CON_ATAJO).ademas['hielo']).toEqual({ prendido: false, datos: { enfriar: true } });
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `npx vitest run tests/eventos-estado.test.ts`
Expected: FAIL, no encuentra `../src/eventos/estado.js`.

- [ ] **Step 3: Escribir `src/eventos/estado.ts`**

```ts
/**
 * Lo que se guarda del evento: completar lo leído del teléfono —lo que ya no
 * existe se descarta o vuelve a su valor por defecto— y cada cambio, que
 * devuelve un estado nuevo. Puro: el control guarda y dibuja.
 */
import type { Comunes, DatoPedido, EstadoDeTipo, EstadoEvento, Margen, TipoDeEvento, ValorDeDato, Valores } from './tipos.js';

export const MARGENES: readonly Margen[] = [0, 10, 20];

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Un número finito y no negativo, o `null`: vacío. */
const numeroOVacio = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : null);

/** Lo guardado de cada dato que sigue valiendo; el resto, su valor por defecto. */
export function valoresDe(datos: readonly DatoPedido[], guardado: unknown): Valores {
  const g = esObjeto(guardado) ? guardado : {};
  return Object.fromEntries(datos.map((d): [string, ValorDeDato] => {
    const v = g[d.id];
    if (d.tipo === 'numero') return [d.id, numeroOVacio(v) ?? d.porDefecto];
    if (d.tipo === 'si-no') return [d.id, typeof v === 'boolean' ? v : d.porDefecto];
    return [d.id, typeof v === 'string' && d.opciones.some(o => o.valor === v) ? v : d.porDefecto];
  }));
}

/** Las cosas con el atajo aplicado: prende las de la opción y apaga las demás que nombra; las que no nombra quedan. */
function conAtajo(t: TipoDeEvento, cosas: Readonly<Record<string, boolean>>, opcion: ValorDeDato): Record<string, boolean> {
  const atajo = t.atajo;
  const prende = atajo && typeof opcion === 'string' ? atajo.cosas[opcion] : undefined;
  if (!atajo || !prende) return { ...cosas };
  const nombradas = new Set(Object.values(atajo.cosas).flat());
  return { ...cosas, ...Object.fromEntries([...nombradas].map(id => [id, prende.includes(id)])) };
}

export function estadoInicialDeTipo(t: TipoDeEvento): EstadoDeTipo {
  const datos = valoresDe(t.datos, {});
  const cosas = Object.fromEntries(t.cosas.map(c => [c.id, c.prendida]));
  return {
    datos,
    cosas: t.atajo ? conAtajo(t, cosas, datos[t.atajo.dato] ?? null) : cosas,
    ademas: Object.fromEntries(t.ademas.map(a => [a.ademas.id, { prendido: a.prendido, datos: valoresDe(a.ademas.datos, {}) }]))
  };
}

/** Lo de un tipo leído del teléfono: lo que ya no existe se descarta y lo que falta toma su valor inicial. */
function completarTipo(t: TipoDeEvento, crudo: unknown): EstadoDeTipo {
  const inicial = estadoInicialDeTipo(t);
  if (!esObjeto(crudo)) return inicial;
  const cosas = esObjeto(crudo['cosas']) ? crudo['cosas'] : {};
  const ademas = esObjeto(crudo['ademas']) ? crudo['ademas'] : {};
  return {
    datos: valoresDe(t.datos, crudo['datos']),
    cosas: Object.fromEntries(t.cosas.map(c => {
      const v = cosas[c.id];
      return [c.id, typeof v === 'boolean' ? v : inicial.cosas[c.id] ?? c.prendida];
    })),
    ademas: Object.fromEntries(t.ademas.map(a => {
      const g = ademas[a.ademas.id];
      const prendido = esObjeto(g) && typeof g['prendido'] === 'boolean' ? g['prendido'] : a.prendido;
      return [a.ademas.id, { prendido, datos: valoresDe(a.ademas.datos, esObjeto(g) ? g['datos'] : {}) }];
    }))
  };
}

export function estadoInicial(tipos: readonly TipoDeEvento[], comunes: Comunes): EstadoEvento {
  return { tipo: tipos[0]?.id ?? '', adultos: null, chicos: null, horas: comunes.horas, calor: false, margen: 0, porTipo: {} };
}

/** Lo leído del teléfono, completo: un tipo que ya no existe vuelve al primero. */
export function completarEvento(crudo: unknown, tipos: readonly TipoDeEvento[], comunes: Comunes): EstadoEvento {
  const inicial = estadoInicial(tipos, comunes);
  if (!esObjeto(crudo)) return inicial;
  const porTipo = esObjeto(crudo['porTipo']) ? crudo['porTipo'] : {};
  const tipo = tipos.find(t => t.id === crudo['tipo']);
  return {
    tipo: tipo?.id ?? inicial.tipo,
    adultos: numeroOVacio(crudo['adultos']),
    chicos: numeroOVacio(crudo['chicos']),
    horas: 'horas' in crudo ? numeroOVacio(crudo['horas']) : inicial.horas,
    calor: crudo['calor'] === true,
    margen: MARGENES.find(m => m === crudo['margen']) ?? 0,
    porTipo: Object.fromEntries(tipos.filter(t => t.id in porTipo).map(t => [t.id, completarTipo(t, porTipo[t.id])]))
  };
}

export const tipoDe = (e: EstadoEvento, tipos: readonly TipoDeEvento[]): TipoDeEvento | undefined =>
  tipos.find(t => t.id === e.tipo);

/** Lo del tipo en el evento: lo guardado, o lo inicial si nunca se tocó. */
export const estadoDeTipo = (e: EstadoEvento, t: TipoDeEvento): EstadoDeTipo => e.porTipo[t.id] ?? estadoInicialDeTipo(t);

/** El evento con lo del tipo elegido cambiado; sin tipo, igual. */
function cambiarTipo(e: EstadoEvento, tipos: readonly TipoDeEvento[], cambio: (t: TipoDeEvento, et: EstadoDeTipo) => EstadoDeTipo): EstadoEvento {
  const t = tipoDe(e, tipos);
  return t ? { ...e, porTipo: { ...e.porTipo, [t.id]: cambio(t, estadoDeTipo(e, t)) } } : e;
}

export const conTipo = (e: EstadoEvento, tipos: readonly TipoDeEvento[], id: string): EstadoEvento =>
  (tipos.some(t => t.id === id) ? { ...e, tipo: id } : e);

/** Un dato del tipo; el del atajo, además, prende y apaga sus cosas. */
export const conDato = (e: EstadoEvento, tipos: readonly TipoDeEvento[], id: string, valor: ValorDeDato): EstadoEvento =>
  cambiarTipo(e, tipos, (t, et) => {
    const datos = valoresDe(t.datos, { ...et.datos, [id]: valor });
    return { ...et, datos, cosas: t.atajo?.dato === id ? conAtajo(t, et.cosas, datos[id] ?? null) : et.cosas };
  });

export const conCosa = (e: EstadoEvento, tipos: readonly TipoDeEvento[], id: string, prendida: boolean): EstadoEvento =>
  cambiarTipo(e, tipos, (t, et) => (t.cosas.some(c => c.id === id) ? { ...et, cosas: { ...et.cosas, [id]: prendida } } : et));

export const conAdemas = (e: EstadoEvento, tipos: readonly TipoDeEvento[], id: string, prendido: boolean): EstadoEvento =>
  cambiarTipo(e, tipos, (_t, et) => {
    const a = et.ademas[id];
    return a ? { ...et, ademas: { ...et.ademas, [id]: { ...a, prendido } } } : et;
  });

export const conDatoDeAdemas = (e: EstadoEvento, tipos: readonly TipoDeEvento[], ademas: string, dato: string, valor: ValorDeDato): EstadoEvento =>
  cambiarTipo(e, tipos, (t, et) => {
    const a = et.ademas[ademas];
    const declarado = t.ademas.find(x => x.ademas.id === ademas)?.ademas;
    return a && declarado
      ? { ...et, ademas: { ...et.ademas, [ademas]: { ...a, datos: valoresDe(declarado.datos, { ...a.datos, [dato]: valor }) } } }
      : et;
  });
```

- [ ] **Step 4: Correrlo y ver que pasa**

Run: `npx vitest run tests/eventos-estado.test.ts`
Expected: PASS.

---

### Task 4: La cuenta común

**Files:**
- Create: `src/eventos/evento.ts`
- Test: `tests/eventos-evento.test.ts`

**Interfaces:**
- Consumes: `formato.ts` (Task 2), `estado.ts` (Task 3).
- Produces:
  - `calcularEvento(e: EstadoEvento, tipos: readonly TipoDeEvento[], comunes: Comunes): ResultadoEvento | null`
  - `textoEvento(r: ResultadoEvento): string`
  - para los tipos: `fija(d: Dato): () => Dato`, `porTramo(tramos: readonly Tramo[], horas: number): Dato | null`, `deOpcion(tabla: Readonly<Record<string, Dato | null>>, valor: ValorDeDato): Dato | null`, `soloDatos(...xs: readonly (Dato | null)[]): Dato[]`

- [ ] **Step 1: Escribir el test que falla, `tests/eventos-evento.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { calcularEvento, textoEvento, porTramo, deOpcion, soloDatos } from '../src/eventos/evento.js';
import type { Comunes, Dato, EstadoEvento, TipoDeEvento, Valores } from '../src/eventos/tipos.js';

const F = { nombre: 'F', url: 'https://f.com' };
const G = { nombre: 'G', url: 'https://g.com' };
const d = (valor: number, fuente = F): Dato => ({ valor, fuente });
const COMUNES: Comunes = { factorChico: d(0.5, G), horas: 4 };

const PRUEBA: TipoDeEvento = {
  id: 'prueba', nombre: 'Prueba',
  datos: [{ id: 'fiesta', nombre: 'Fiesta', tipo: 'si-no', porDefecto: false }],
  grupos: [
    { id: 'comer', titulo: 'Para comer', seReparte: true, factores: c => (c.tipo['fiesta'] === true ? [d(2)] : []) },
    { id: 'aparte', titulo: 'Aparte', seReparte: false }
  ],
  cosas: [
    { id: 'empanadas', nombre: 'Empanadas', grupo: 'comer', prendida: true, porcion: () => d(6), unidad: 'unidad', docenas: true },
    { id: 'pizza', nombre: 'Pizza', grupo: 'comer', prendida: false, porcion: () => d(4), unidad: 'unidad', nombreUnidad: 'porciones',
      envase: { cantidad: d(8), nombre: { uno: 'pizza', varios: 'pizzas' } } },
    { id: 'carne', nombre: 'Carne', grupo: 'comer', prendida: false, porcion: () => d(300), unidad: 'g', carne: true },
    { id: 'torta', nombre: 'Torta', grupo: 'aparte', prendida: false, porcion: () => d(100), unidad: 'g', chicoEntero: true },
    { id: 'helado', nombre: 'Helado', grupo: 'aparte', prendida: false, porcion: () => ({ valor: 250, fuente: null, nota: 'El helado es un supuesto.' }), unidad: 'ml' },
    { id: 'bocados', nombre: 'Bocados', grupo: 'aparte', prendida: false, porcion: c => d(c.horas), unidad: 'unidad' },
    { id: 'picada', nombre: 'Picada', grupo: 'aparte', prendida: false,
      partes: [{ id: 'quesos', nombre: 'Quesos', porcion: () => d(50) }, { id: 'pan', nombre: 'Pan', porcion: () => d(30) }] }
  ],
  ademas: [],
  cifra: { grupo: 'comer', nombre: 'Para comer' }
};
const TIPOS = [PRUEBA];

const evento = (cambios: Partial<EstadoEvento> = {}, cosas: Record<string, boolean> = {}, datos: Valores = {}): EstadoEvento => ({
  tipo: 'prueba', adultos: 10, chicos: 0, horas: 4, calor: false, margen: 0,
  porTipo: { prueba: { datos, cosas, ademas: {} } }, ...cambios
});
const cantidades = (e: EstadoEvento): Record<string, string> =>
  Object.fromEntries((calcularEvento(e, TIPOS, COMUNES)?.grupos ?? []).flatMap(g => g.items.map(i => [i.id, i.cantidad])));

describe('la cuenta común', () => {
  it('una cosa sola lleva su porción entera', () => {
    expect(cantidades(evento())).toEqual({ empanadas: '60 (5 docenas)' });
  });

  it('dos cosas del mismo grupo se reparten la porción', () => {
    expect(cantidades(evento({}, { pizza: true }))).toEqual({ empanadas: '30 (2 ½ docenas)', pizza: '3 pizzas (20 porciones)' });
  });

  it('tres cosas, un tercio cada una', () => {
    expect(cantidades(evento({}, { pizza: true, carne: true })))
      .toEqual({ empanadas: '24 (2 docenas)', pizza: '2 pizzas (14 porciones)', carne: '1 kg' });
  });

  it('en un grupo que no se reparte, cada cosa lleva su porción entera', () => {
    expect(cantidades(evento({}, { empanadas: false, torta: true, helado: true }))).toEqual({ torta: '1 kg', helado: '2,5 l' });
  });

  it('un chico cuenta por su factor; en la torta, entero', () => {
    expect(cantidades(evento({ chicos: 4 }, { torta: true }))).toEqual({ empanadas: '72 (6 docenas)', torta: '1,4 kg' });
  });

  it('los factores del grupo lo multiplican', () => {
    expect(cantidades(evento({}, {}, { fiesta: true }))).toEqual({ empanadas: '120 (10 docenas)' });
  });

  it('el margen va sobre todo', () => {
    expect(cantidades(evento({ margen: 10 }))).toEqual({ empanadas: '66 (5 ½ docenas)' });
  });

  it('una cosa con partes sale en gramos de cada parte', () => {
    expect(cantidades(evento({}, { empanadas: false, picada: true }))).toEqual({ 'picada-quesos': '500 g', 'picada-pan': '300 g' });
  });

  it('sin horas, o en cero, calcula con las horas por defecto', () => {
    const solo = { empanadas: false, bocados: true };
    expect(cantidades(evento({ horas: null }, solo))).toEqual({ bocados: '40' });
    expect(cantidades(evento({ horas: 0 }, solo))).toEqual({ bocados: '40' });
    expect(cantidades(evento({ horas: 2 }, solo))).toEqual({ bocados: '20' });
  });

  it('con decimales no hay NaN ni Infinity', () => {
    const r = calcularEvento(evento({ adultos: 2.5, chicos: 1.5 }, { pizza: true, carne: true, torta: true }), TIPOS, COMUNES);
    expect(JSON.stringify(r)).not.toMatch(/NaN|Infinity/);
  });

  it('sin personas, con todo apagado o con un tipo que no existe, no hay resultado', () => {
    expect(calcularEvento(evento({ adultos: null, chicos: null }), TIPOS, COMUNES)).toBeNull();
    expect(calcularEvento(evento({ adultos: 0 }), TIPOS, COMUNES)).toBeNull();
    expect(calcularEvento(evento({}, { empanadas: false }), TIPOS, COMUNES)).toBeNull();
    expect(calcularEvento(evento({ tipo: 'otro' }), TIPOS, COMUNES)).toBeNull();
  });

  it('las cifras: las personas, y los gramos del grupo de la cifra', () => {
    expect(calcularEvento(evento({ chicos: 2 }, { carne: true }), TIPOS, COMUNES)?.cifras)
      .toEqual([{ nombre: 'Personas', valor: '12' }, { nombre: 'Para comer', valor: '1,7 kg' }]);
    expect(calcularEvento(evento(), TIPOS, COMUNES)?.cifras).toEqual([{ nombre: 'Personas', valor: '10' }]);
  });

  it('el título dice cuántos son, y adultos y chicos si hay chicos', () => {
    expect(calcularEvento(evento(), TIPOS, COMUNES)?.titulo).toBe('Prueba para 10');
    expect(calcularEvento(evento({ chicos: 4 }), TIPOS, COMUNES)?.titulo).toBe('Prueba para 14 (10 adultos, 4 chicos)');
    expect(calcularEvento(evento({ adultos: 1, chicos: 1 }), TIPOS, COMUNES)?.titulo).toBe('Prueba para 2 (1 adulto, 1 chico)');
  });

  it('las fuentes de los números usados, una vez cada una; la nota de los que van sin fuente, como advertencia', () => {
    const r = calcularEvento(evento({ chicos: 2 }, { pizza: true, helado: true }), TIPOS, COMUNES);
    expect(r?.fuentes).toEqual([G, F]);
    expect(r?.advertencias).toEqual(['El helado es un supuesto.']);
    expect(calcularEvento(evento(), TIPOS, COMUNES)?.fuentes).toEqual([F]);
  });

  it('el texto para mandar', () => {
    const r = calcularEvento(evento({}, { torta: true }), TIPOS, COMUNES);
    expect(r && textoEvento(r)).toBe('Prueba para 10\n\nPara comer\n- Empanadas: 60 (5 docenas)\n\nAparte\n- Torta: 1 kg');
  });
});

describe('las ayudas de los tipos', () => {
  it('el tramo de las horas: el primero que las alcanza; el último, sin tope', () => {
    const tramos = [{ hastaHoras: 2, factor: d(0.75) }, { hastaHoras: 4, factor: null }, { hastaHoras: null, factor: d(1.25) }];
    expect(porTramo(tramos, 1)?.valor).toBe(0.75);
    expect(porTramo(tramos, 2)?.valor).toBe(0.75);
    expect(porTramo(tramos, 3)).toBeNull();
    expect(porTramo(tramos, 9)?.valor).toBe(1.25);
  });

  it('el dato de una opción; la que no está, ninguno', () => {
    const tabla = { almuerzo: null, festejo: d(1.2) };
    expect(deOpcion(tabla, 'festejo')?.valor).toBe(1.2);
    expect(deOpcion(tabla, 'almuerzo')).toBeNull();
    expect(deOpcion(tabla, 'otra')).toBeNull();
    expect(deOpcion(tabla, true)).toBeNull();
  });

  it('soloDatos saca los nulos', () => {
    expect(soloDatos(null, d(2), null).map(x => x.valor)).toEqual([2]);
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `npx vitest run tests/eventos-evento.test.ts`
Expected: FAIL, no encuentra `../src/eventos/evento.js`.

- [ ] **Step 3: Escribir `src/eventos/evento.ts`**

```ts
/**
 * La cuenta común de un evento: para cada cosa prendida, su porción por las
 * personas, repartida en su grupo, por los factores del grupo y el margen; y
 * después lo que se suma —bebidas, infusiones, hielo, carbón o leña—, que lee
 * lo ya calculado. No tiene ningún número propio: los trae cada tipo de
 * `datos/`, y los tests le pasan otros.
 */
import type { Fuente } from '../referencias/tipos.js';
import type {
  Calculado, Comunes, Contexto, CosaSimple, Dato, EstadoEvento, GrupoDeResultado, IdAdemas, Item, Linea,
  ResultadoEvento, TipoDeEvento, Tramo, ValorDeDato
} from './tipos.js';
import { estadoDeTipo, tipoDe, valoresDe } from './estado.js';
import { envases, peso, unidades, volumen } from './formato.js';

/** Las que se suman después, en el orden en que se calculan: el hielo enfría lo que calcularon las bebidas. */
const ORDEN: readonly IdAdemas[] = ['bebidas', 'infusiones', 'hielo', 'combustible'];

/** Una porción que no depende del evento. */
export const fija = (d: Dato) => (): Dato => d;

/** El factor del tramo de horas: el primero que las alcanza. */
export function porTramo(tramos: readonly Tramo[], horas: number): Dato | null {
  const t = tramos.find(x => x.hastaHoras === null || horas <= x.hastaHoras) ?? tramos[tramos.length - 1];
  return t?.factor ?? null;
}

/** El dato de la opción elegida —la ocasión—; `null` si la opción no lo cambia o no está. */
export function deOpcion(tabla: Readonly<Record<string, Dato | null>>, valor: ValorDeDato): Dato | null {
  return typeof valor === 'string' && Object.hasOwn(tabla, valor) ? tabla[valor] ?? null : null;
}

export const soloDatos = (...xs: readonly (Dato | null)[]): Dato[] => xs.filter((x): x is Dato => x !== null);

/** La cantidad de una cosa simple, en su unidad de compra. */
function enCompra(c: CosaSimple, total: number): string {
  const base = c.unidad === 'g' ? peso(total)
    : c.unidad === 'ml' ? volumen(total)
    : unidades(total, { nombre: c.nombreUnidad, porDocena: c.docenas === true });
  return c.envase ? `${envases(total, c.envase.cantidad.valor, c.envase.nombre)} (${base})` : base;
}

const cuantos = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`;

/** «Asado para 12 (10 adultos, 2 chicos)»; sin chicos, «Asado para 10». */
function tituloDe(t: TipoDeEvento, adultos: number, chicos: number): string {
  const total = `${t.nombre} para ${adultos + chicos}`;
  return chicos ? `${total} (${cuantos(adultos, 'adulto', 'adultos')}, ${cuantos(chicos, 'chico', 'chicos')})` : total;
}

/** Las fuentes de los números usados, una vez por link; las notas de los que van sin fuente, como advertencias. */
function procedencia(usados: readonly Dato[]): { fuentes: Fuente[]; advertencias: string[] } {
  const fuentes: Fuente[] = [];
  const advertencias: string[] = [];
  for (const d of usados) {
    if (d.fuente === null) {
      if (!advertencias.includes(d.nota)) advertencias.push(d.nota);
      continue;
    }
    const f = d.fuente;
    if (!fuentes.some(x => x.url === f.url)) fuentes.push(f);
  }
  return { fuentes, advertencias };
}

export function calcularEvento(e: EstadoEvento, tipos: readonly TipoDeEvento[], comunes: Comunes): ResultadoEvento | null {
  const t = tipoDe(e, tipos);
  const adultos = e.adultos ?? 0;
  const chicos = e.chicos ?? 0;
  if (!t || adultos + chicos <= 0) return null;
  const et = estadoDeTipo(e, t);
  const contexto: Contexto = {
    adultos, chicos, personas: adultos + chicos * comunes.factorChico.valor,
    horas: e.horas && e.horas > 0 ? e.horas : comunes.horas,
    calor: e.calor, tipo: valoresDe(t.datos, et.datos)
  };
  const margen = 1 + e.margen / 100;
  const usados: Dato[] = chicos > 0 ? [comunes.factorChico] : [];
  const grupos: GrupoDeResultado[] = [];
  let carneG = 0;
  let cifraG = 0;

  for (const g of t.grupos) {
    const cosas = t.cosas.filter(c => c.grupo === g.id && (et.cosas[c.id] ?? c.prendida));
    if (!cosas.length) continue;
    const factores = g.factores?.(contexto) ?? [];
    usados.push(...factores);
    const multiplica = factores.reduce((p, x) => p * x.valor, 1) * margen * (g.seReparte ? 1 / cosas.length : 1);
    const enCifra = t.cifra?.grupo === g.id;
    const items: Item[] = [];
    for (const c of cosas) {
      const personas = c.chicoEntero ? adultos + chicos : contexto.personas;
      if ('partes' in c) {
        for (const p of c.partes) {
          const porcion = p.porcion(contexto);
          usados.push(porcion);
          const total = porcion.valor * personas * multiplica;
          if (c.carne) carneG += total;
          if (enCifra) cifraG += total;
          items.push({ id: `${c.id}-${p.id}`, nombre: p.nombre, cantidad: peso(total) });
        }
        continue;
      }
      const porcion = c.porcion(contexto);
      usados.push(porcion, ...(c.envase ? [c.envase.cantidad] : []));
      const total = porcion.valor * personas * multiplica;
      if (c.carne && c.unidad === 'g') carneG += total;
      if (enCifra && c.unidad === 'g') cifraG += total;
      items.push({ id: c.id, nombre: c.nombre, cantidad: enCompra(c, total) });
    }
    grupos.push({ titulo: g.titulo, items });
  }

  let calculado: Calculado = { contexto, margen, carneG, mlFrios: 0 };
  const ademas: Item[] = [];
  for (const id of ORDEN) {
    const declarado = t.ademas.find(x => x.ademas.id === id);
    const estado = et.ademas[id];
    if (!declarado || !(estado?.prendido ?? declarado.prendido)) continue;
    const r = declarado.ademas.calcular(calculado, valoresDe(declarado.ademas.datos, estado?.datos ?? {}));
    ademas.push(...r.items);
    usados.push(...r.usados);
    if (r.mlFrios !== undefined) calculado = { ...calculado, mlFrios: r.mlFrios };
  }

  if (!grupos.length && !ademas.length) return null;
  const cifras: Linea[] = [{ nombre: 'Personas', valor: String(adultos + chicos) }];
  if (t.cifra && cifraG > 0) cifras.push({ nombre: t.cifra.nombre, valor: peso(cifraG) });
  return { titulo: tituloDe(t, adultos, chicos), cifras, grupos, ademas, ...procedencia(usados) };
}

/** La lista como texto, para mandar: el título, cada grupo con sus ítems y lo que se suma después. */
export function textoEvento(r: ResultadoEvento): string {
  const bloque = (titulo: string, items: readonly Item[]): string =>
    [titulo, ...items.map(i => `- ${i.nombre}: ${i.cantidad}`)].join('\n');
  return [r.titulo, ...r.grupos.map(g => bloque(g.titulo, g.items)), ...(r.ademas.length ? [bloque('Además', r.ademas)] : [])].join('\n\n');
}
```

La cifra del test de chicos: 12 personas → 10 + 2 × 0,5 = 11 para la carne → 300 × 11 / 2 (con empanadas) = 1650 g → «1,7 kg». Si el test da otro número, revisar la cuenta, no el test.

- [ ] **Step 4: Correrlo y ver que pasa**

Run: `npx vitest run tests/eventos-evento.test.ts`
Expected: PASS.

---

### Task 5: Lo que se suma después

**Files:**
- Create: `src/eventos/ademas.ts`
- Test: `tests/eventos-ademas.test.ts`

**Interfaces:**
- Consumes: `formato.ts`; para el test de integración, `calcularEvento` (Task 4).
- Produces: `bebidas(d: DatosBebidas, prendidas: readonly string[]): Ademas`, `hielo(d: DatosHielo): Ademas`, `infusiones(d: DatosInfusiones): Ademas`, `combustible(d: DatosCombustible): Ademas`, y los tipos `Bebida`, `EnvaseDeBebida`, `DatosBebidas`, `DatosHielo`, `Infusion`, `DatosInfusiones`, `DatosCombustible`. Los datos de bebidas llevan un `id` especial, `brindis`, en la lista `prendidas`.

- [ ] **Step 1: Escribir el test que falla, `tests/eventos-ademas.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { bebidas, hielo, infusiones, combustible, type DatosBebidas, type DatosHielo, type DatosInfusiones, type DatosCombustible } from '../src/eventos/ademas.js';
import { calcularEvento } from '../src/eventos/evento.js';
import type { Calculado, Contexto, Dato, TipoDeEvento, Valores } from '../src/eventos/tipos.js';

const F = { nombre: 'F', url: 'https://f.com' };
const d = (valor: number): Dato => ({ valor, fuente: F });
const env = (ml: number, uno: string, varios: string) => ({ ml: d(ml), nombre: { uno, varios } });
const botella = (ml: number) => env(ml, 'botella', 'botellas');

const BEB: DatosBebidas = {
  bebidas: [
    { id: 'cerveza', nombre: 'Cerveza', alcohol: true, mlPorHora: d(300), envase: env(500, 'lata', 'latas') },
    { id: 'vino', nombre: 'Vino', alcohol: true, mlPorHora: d(150), envase: botella(750) },
    { id: 'fernet', nombre: 'Fernet', alcohol: true, mlPorHora: d(100), envase: botella(1000),
      con: { id: 'cola', nombre: 'Cola para el fernet', mlPorMl: d(3), envase: botella(2000) } },
    { id: 'gaseosa', nombre: 'Gaseosa', alcohol: false, mlPorHora: d(200), envase: botella(2000) },
    { id: 'agua', nombre: 'Agua', alcohol: false, mlPorHora: d(100), envase: botella(2000) }
  ],
  horasPlenas: d(4), despues: d(0.5), calor: d(1.5), chico: d(2),
  brindis: { mlPorAdulto: d(100), envase: botella(750) }
};
const HIELO: DatosHielo = { kgPorPersona: d(0.5), kgPorLitroFrio: d(0.5), calor: d(1.3), bolsa: { kg: d(3), nombre: { uno: 'bolsa de 3 kg', varios: 'bolsas de 3 kg' } } };
const INF: DatosInfusiones = {
  tazasPorPersona: { valor: 2, fuente: null, nota: 'Las tazas por persona son un supuesto.' },
  infusiones: [
    { id: 'cafe', nombre: 'Café', prendida: true, porTaza: d(10), unidad: 'g' },
    { id: 'te', nombre: 'Té', prendida: false, porTaza: d(1), unidad: 'saquitos' },
    { id: 'leche', nombre: 'Leche', prendida: false, porTaza: d(200), unidad: 'ml' }
  ]
};
const COMB: DatosCombustible = { carbonPorKgCarne: d(1), lenaPorKgCarne: d(2.5), vientoOFrio: d(1.3), bolsaCarbon: { kg: d(3), nombre: { uno: 'bolsa de 3 kg', varios: 'bolsas de 3 kg' } } };

const calc = (c: Partial<Contexto> = {}, extra: Partial<Calculado> = {}): Calculado => ({
  contexto: { adultos: 10, chicos: 0, personas: 10, horas: 4, calor: false, tipo: {}, ...c },
  margen: 1, carneG: 0, mlFrios: 0, ...extra
});
const cantidades = (r: { items: readonly { id: string; cantidad: string }[] }) => Object.fromEntries(r.items.map(i => [i.id, i.cantidad]));
const solo = (...ids: string[]): Valores => Object.fromEntries(['cerveza', 'vino', 'fernet', 'gaseosa', 'agua', 'brindis'].map(id => [id, ids.includes(id)]));

describe('las bebidas', () => {
  const b = bebidas(BEB, ['cerveza']);

  it('piden los adultos que toman y un sí o no por bebida, prendidas las del tipo', () => {
    expect(b.datos.map(x => [x.id, x.porDefecto])).toEqual([
      ['toman', null], ['cerveza', true], ['vino', false], ['fernet', false], ['gaseosa', false], ['agua', false], ['brindis', false]
    ]);
  });

  it('una sola con alcohol: los que toman por las horas, en litros y envases', () => {
    const r = b.calcular(calc(), solo('cerveza'));
    expect(cantidades(r)).toEqual({ cerveza: '12 l · 24 latas' });
    expect(r.mlFrios).toBe(12000);
  });

  it('dos con alcohol se reparten', () => {
    expect(cantidades(b.calcular(calc(), solo('cerveza', 'vino')))).toEqual({ cerveza: '6 l · 12 latas', vino: '3 l · 4 botellas' });
  });

  it('los que toman: los escritos, nunca más que los adultos; vacío, todos', () => {
    expect(cantidades(b.calcular(calc(), { ...solo('cerveza'), toman: 4 }))).toEqual({ cerveza: '4,8 l · 10 latas' });
    expect(cantidades(b.calcular(calc(), { ...solo('cerveza'), toman: 20 }))).toEqual({ cerveza: '12 l · 24 latas' });
  });

  it('después de las horas plenas se toma menos; con calor, más', () => {
    expect(cantidades(b.calcular(calc({ horas: 6 }), solo('cerveza')))).toEqual({ cerveza: '15 l · 30 latas' });
    expect(cantidades(b.calcular(calc({ calor: true }), solo('cerveza')))).toEqual({ cerveza: '18 l · 36 latas' });
  });

  it('los chicos toman sólo sin alcohol, por su factor', () => {
    expect(cantidades(b.calcular(calc({ chicos: 5 }), solo('cerveza', 'gaseosa'))))
      .toEqual({ cerveza: '12 l · 24 latas', gaseosa: '16 l · 8 botellas' });
  });

  it('el fernet suma su cola; el brindis va aparte, por adulto', () => {
    expect(cantidades(b.calcular(calc(), solo('fernet', 'brindis'))))
      .toEqual({ fernet: '4 l · 4 botellas', cola: '12 l · 6 botellas', brindis: '1 l · 2 botellas' });
  });

  it('con el margen', () => {
    expect(cantidades(b.calcular(calc({}, { margen: 1.1 }), solo('cerveza')))).toEqual({ cerveza: '13,2 l · 27 latas' });
  });

  it('sin ninguna prendida, nada', () => {
    expect(b.calcular(calc(), solo())).toEqual({ items: [], usados: [], mlFrios: 0 });
  });
});

describe('el hielo', () => {
  const h = hielo(HIELO);
  it('por persona, chicos enteros; con calor, más', () => {
    expect(cantidades(h.calcular(calc({ chicos: 2 }), { enfriar: false }))).toEqual({ hielo: '6 kg · 2 bolsas de 3 kg' });
    expect(cantidades(h.calcular(calc({ calor: true }), { enfriar: false }))).toEqual({ hielo: '6,5 kg · 3 bolsas de 3 kg' });
  });
  it('para enfriar, suma por litro de bebida fría', () => {
    expect(cantidades(h.calcular(calc({}, { mlFrios: 12000 }), { enfriar: true }))).toEqual({ hielo: '11 kg · 4 bolsas de 3 kg' });
  });
});

describe('las infusiones', () => {
  const i = infusiones(INF);
  it('las tazas se reparten entre las prendidas, y cada una dice cuánto lleva', () => {
    expect(cantidades(i.calcular(calc(), { cafe: true, te: false, leche: false }))).toEqual({ cafe: '20 tazas · 200 g' });
    expect(cantidades(i.calcular(calc(), { cafe: true, te: true, leche: false })))
      .toEqual({ cafe: '10 tazas · 100 g', te: '10 tazas · 10 saquitos' });
    expect(cantidades(i.calcular(calc(), { cafe: false, te: false, leche: true }))).toEqual({ leche: '20 tazas · 4 l' });
  });
  it('el número sin fuente viaja con su nota', () => {
    expect(i.calcular(calc(), { cafe: true }).usados).toContain(INF.tazasPorPersona);
  });
});

describe('el carbón o la leña', () => {
  const c = combustible(COMB);
  it('sale de los kilos de carne', () => {
    expect(cantidades(c.calcular(calc({}, { carneG: 4500 }), { que: 'carbon', viento: false }))).toEqual({ carbon: '4,5 kg · 2 bolsas de 3 kg' });
    expect(cantidades(c.calcular(calc({}, { carneG: 4500 }), { que: 'lena', viento: false }))).toEqual({ lena: '11,3 kg' });
    expect(cantidades(c.calcular(calc({}, { carneG: 4500 }), { que: 'carbon', viento: true }))).toEqual({ carbon: '5,9 kg · 2 bolsas de 3 kg' });
  });
  it('sin carne, nada', () => {
    expect(c.calcular(calc(), { que: 'carbon', viento: false }).items).toEqual([]);
  });
});

describe('en el evento', () => {
  const TIPO: TipoDeEvento = {
    id: 'asado', nombre: 'Asado', datos: [],
    grupos: [{ id: 'carne', titulo: 'Carne', seReparte: true }],
    cosas: [{ id: 'vacio', nombre: 'Vacío', grupo: 'carne', prendida: true, porcion: () => d(450), unidad: 'g', carne: true }],
    ademas: [{ ademas: hielo(HIELO), prendido: true }, { ademas: combustible(COMB), prendido: true }, { ademas: bebidas(BEB, ['cerveza']), prendido: true }]
  };
  const COMUNES = { factorChico: d(0.5), horas: 4 };

  it('el carbón lee la carne, y el hielo lo que calcularon las bebidas aunque estén declaradas después', () => {
    const e = {
      tipo: 'asado', adultos: 10, chicos: 0, horas: 4, calor: false, margen: 0 as const,
      porTipo: { asado: { datos: {}, cosas: {}, ademas: { hielo: { prendido: true, datos: { enfriar: true } } } } }
    };
    const r = calcularEvento(e, [TIPO], COMUNES);
    expect(Object.fromEntries((r?.ademas ?? []).map(i => [i.id, i.cantidad]))).toEqual({
      cerveza: '12 l · 24 latas', hielo: '11 kg · 4 bolsas de 3 kg', carbon: '4,5 kg · 2 bolsas de 3 kg'
    });
  });

  it('lo apagado no se calcula', () => {
    const e = {
      tipo: 'asado', adultos: 10, chicos: 0, horas: 4, calor: false, margen: 0 as const,
      porTipo: { asado: { datos: {}, cosas: {}, ademas: { hielo: { prendido: false, datos: {} }, combustible: { prendido: false, datos: {} }, bebidas: { prendido: false, datos: {} } } } }
    };
    expect(calcularEvento(e, [TIPO], COMUNES)?.ademas).toEqual([]);
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `npx vitest run tests/eventos-ademas.test.ts`
Expected: FAIL, no encuentra `../src/eventos/ademas.js`.

- [ ] **Step 3: Escribir `src/eventos/ademas.ts`**

```ts
/**
 * Lo que se suma después de las cosas: bebidas, infusiones, hielo, carbón o
 * leña. Cada fábrica recibe sus números de `datos/`, como las cuentas de las
 * referencias, y los tests le pasan otros. El margen ya viene en lo
 * calculado; lo que lee de las cosas —la carne, la bebida fría— ya lo trae.
 */
import type { Ademas, Dato, Item, NombreDeEnvase } from './tipos.js';
import { envases, peso, unidades, volumen } from './formato.js';

export interface EnvaseDeBebida { ml: Dato; nombre: NombreDeEnvase }
export interface Bebida {
  id: string;
  nombre: string;
  alcohol: boolean;
  /** Mililitros por persona por hora si es la única de las suyas, con alcohol o sin. */
  mlPorHora: Dato;
  envase: EnvaseDeBebida;
  /** Lo que se sirve con ella: la cola del fernet, en ml por ml. */
  con?: { id: string; nombre: string; mlPorMl: Dato; envase: EnvaseDeBebida };
}
export interface DatosBebidas {
  bebidas: readonly Bebida[];
  /** Las primeras horas se toma a pleno; cada una de las siguientes cuenta `despues`. */
  horasPlenas: Dato;
  despues: Dato;
  calor: Dato;
  /** Lo que toma un chico de lo sin alcohol, sobre lo que toma un adulto. */
  chico: Dato;
  /** El espumante del brindis, por adulto. */
  brindis: { mlPorAdulto: Dato; envase: EnvaseDeBebida };
}
export interface DatosHielo { kgPorPersona: Dato; kgPorLitroFrio: Dato; calor: Dato; bolsa: { kg: Dato; nombre: NombreDeEnvase } }
export interface Infusion { id: string; nombre: string; prendida: boolean; porTaza: Dato; unidad: 'g' | 'saquitos' | 'ml' }
export interface DatosInfusiones { tazasPorPersona: Dato; infusiones: readonly Infusion[] }
export interface DatosCombustible { carbonPorKgCarne: Dato; lenaPorKgCarne: Dato; vientoOFrio: Dato; bolsaCarbon: { kg: Dato; nombre: NombreDeEnvase } }

/** Los litros y los envases: «12 l · 24 latas». */
const enEnvases = (ml: number, e: EnvaseDeBebida): string => `${volumen(ml)} · ${envases(ml, e.ml.valor, e.nombre)}`;

/** `prendidas`: las que van al empezar, por `id`; `brindis`, el espumante del brindis. Cambian con el tipo. */
export function bebidas(d: DatosBebidas, prendidas: readonly string[]): Ademas {
  return {
    id: 'bebidas', nombre: 'Bebidas',
    datos: [
      { id: 'toman', nombre: 'Adultos que toman alcohol', tipo: 'numero', porDefecto: null },
      ...d.bebidas.map(b => ({ id: b.id, nombre: b.nombre, tipo: 'si-no' as const, porDefecto: prendidas.includes(b.id) })),
      { id: 'brindis', nombre: 'Espumante para el brindis', tipo: 'si-no', porDefecto: prendidas.includes('brindis') }
    ],
    calcular({ contexto: c, margen }, v) {
      const horas = Math.min(c.horas, d.horasPlenas.valor) + Math.max(0, c.horas - d.horasPlenas.valor) * d.despues.valor;
      const calor = c.calor ? d.calor.valor : 1;
      // Vacío, toman todos los adultos; nunca más que ellos.
      const toman = typeof v['toman'] === 'number' ? Math.min(v['toman'], c.adultos) : c.adultos;
      const prendidas = d.bebidas.filter(b => v[b.id] === true);
      const items: Item[] = [];
      const usados: Dato[] = [];
      let mlFrios = 0;
      const sumar = (id: string, nombre: string, ml: number, envase: EnvaseDeBebida, ...datos: Dato[]): void => {
        items.push({ id, nombre, cantidad: enEnvases(ml, envase) });
        usados.push(envase.ml, ...datos);
        mlFrios += ml;
      };
      for (const alcohol of [true, false]) {
        const grupo = prendidas.filter(b => b.alcohol === alcohol);
        // Los chicos toman sólo lo sin alcohol, por su factor.
        const personas = alcohol ? toman : c.adultos + c.chicos * d.chico.valor;
        for (const b of grupo) {
          const ml = b.mlPorHora.valor * horas * personas * calor * margen / grupo.length;
          if (ml <= 0) continue;
          sumar(b.id, b.nombre, ml, b.envase, b.mlPorHora, d.horasPlenas, d.despues,
            ...(c.calor ? [d.calor] : []), ...(!alcohol && c.chicos > 0 ? [d.chico] : []));
          if (b.con) sumar(b.con.id, b.con.nombre, ml * b.con.mlPorMl.valor, b.con.envase, b.con.mlPorMl);
        }
      }
      if (v['brindis'] === true && c.adultos > 0) {
        sumar('brindis', 'Espumante para el brindis', d.brindis.mlPorAdulto.valor * c.adultos * margen, d.brindis.envase, d.brindis.mlPorAdulto);
      }
      return { items, usados, mlFrios };
    }
  };
}

export function hielo(d: DatosHielo): Ademas {
  return {
    id: 'hielo', nombre: 'Hielo',
    datos: [{ id: 'enfriar', nombre: 'También para enfriar las bebidas', tipo: 'si-no', porDefecto: false }],
    calcular({ contexto: c, margen, mlFrios }, v) {
      const enfriar = v['enfriar'] === true;
      // Los vasos son de todos: el chico cuenta entero.
      const kg = d.kgPorPersona.valor * (c.adultos + c.chicos) * (c.calor ? d.calor.valor : 1) * margen
        + (enfriar ? d.kgPorLitroFrio.valor * mlFrios / 1000 : 0);
      if (kg <= 0) return { items: [], usados: [] };
      return {
        items: [{ id: 'hielo', nombre: 'Hielo', cantidad: `${peso(kg * 1000)} · ${envases(kg, d.bolsa.kg.valor, d.bolsa.nombre)}` }],
        usados: [d.kgPorPersona, d.bolsa.kg, ...(c.calor ? [d.calor] : []), ...(enfriar ? [d.kgPorLitroFrio] : [])]
      };
    }
  };
}

export function infusiones(d: DatosInfusiones): Ademas {
  return {
    id: 'infusiones', nombre: 'Infusiones',
    datos: d.infusiones.map(i => ({ id: i.id, nombre: i.nombre, tipo: 'si-no' as const, porDefecto: i.prendida })),
    calcular({ contexto: c, margen }, v) {
      const prendidas = d.infusiones.filter(i => v[i.id] === true);
      if (!prendidas.length || c.personas <= 0) return { items: [], usados: [] };
      const tazas = d.tazasPorPersona.valor * c.personas * margen / prendidas.length;
      return {
        items: prendidas.map(i => {
          const cuanto = tazas * i.porTaza.valor;
          const en = i.unidad === 'g' ? peso(cuanto) : i.unidad === 'ml' ? volumen(cuanto) : unidades(cuanto, { nombre: 'saquitos' });
          return { id: i.id, nombre: i.nombre, cantidad: `${unidades(tazas, { nombre: 'tazas' })} · ${en}` };
        }),
        usados: [d.tazasPorPersona, ...prendidas.map(i => i.porTaza)]
      };
    }
  };
}

export function combustible(d: DatosCombustible): Ademas {
  return {
    id: 'combustible', nombre: 'Carbón o leña',
    datos: [
      { id: 'que', nombre: 'Fuego', tipo: 'opcion', porDefecto: 'carbon', opciones: [{ valor: 'carbon', texto: 'Carbón' }, { valor: 'lena', texto: 'Leña' }] },
      { id: 'viento', nombre: 'Viento o frío', tipo: 'si-no', porDefecto: false }
    ],
    calcular({ carneG }, v) {
      if (carneG <= 0) return { items: [], usados: [] };
      const carbon = v['que'] !== 'lena';
      const porKg = carbon ? d.carbonPorKgCarne : d.lenaPorKgCarne;
      const viento = v['viento'] === true;
      const kg = carneG / 1000 * porKg.valor * (viento ? d.vientoOFrio.valor : 1);
      return {
        items: [carbon
          ? { id: 'carbon', nombre: 'Carbón', cantidad: `${peso(kg * 1000)} · ${envases(kg, d.bolsaCarbon.kg.valor, d.bolsaCarbon.nombre)}` }
          : { id: 'lena', nombre: 'Leña', cantidad: peso(kg * 1000) }],
        usados: [porKg, ...(viento ? [d.vientoOFrio] : []), ...(carbon ? [d.bolsaCarbon.kg] : [])]
      };
    }
  };
}
```

El test «sin ninguna prendida» espera `{ items: [], usados: [], mlFrios: 0 }`: es lo que devuelve esta versión.

- [ ] **Step 4: Correrlo y ver que pasa**

Run: `npx vitest run tests/eventos-ademas.test.ts tests/eventos-evento.test.ts`
Expected: PASS.

---

### Task 6: Los números y los cinco tipos

Necesita la Task 1 terminada, con todas las decisiones.

**Files:**
- Create: `src/eventos/datos/comunes.ts`, `src/eventos/datos/bebidas.ts`, `src/eventos/datos/asado.ts`, `src/eventos/datos/merienda.ts`, `src/eventos/datos/comida.ts`, `src/eventos/datos/picada.ts`, `src/eventos/datos/coctel.ts`
- Create: `src/eventos/merienda.ts`, `src/eventos/asado.ts`, `src/eventos/comida.ts`, `src/eventos/picada.ts`, `src/eventos/coctel.ts`, `src/eventos/indice.ts`, `src/eventos/forma.ts`
- Test: `tests/eventos-tipos.test.ts`

**Interfaces:**
- Consumes: Tasks 2 a 5.
- Produces: `TIPOS_DE_EVENTO: readonly TipoDeEvento[]` (merienda, asado, comida, picada, cóctel, en ese orden) en `indice.ts`; `COMUNES: Comunes` en `datos/comunes.ts`; `datosDe(nombre, x)`, `problemasDeDato(donde, d)`, `problemasDeTipo(t)` en `forma.ts`.

- [ ] **Step 1: Escribir el test que falla, `tests/eventos-tipos.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { TIPOS_DE_EVENTO } from '../src/eventos/indice.js';
import { COMUNES } from '../src/eventos/datos/comunes.js';
import { BEBIDAS, HIELO, INFUSIONES } from '../src/eventos/datos/bebidas.js';
import { ASADO, COMBUSTIBLE } from '../src/eventos/datos/asado.js';
import { MERIENDA } from '../src/eventos/datos/merienda.js';
import { COMIDA } from '../src/eventos/datos/comida.js';
import { PICADA } from '../src/eventos/datos/picada.js';
import { COCTEL } from '../src/eventos/datos/coctel.js';
import { datosDe, problemasDeDato, problemasDeTipo } from '../src/eventos/forma.js';
import { calcularEvento } from '../src/eventos/evento.js';
import { estadoInicial, conTipo } from '../src/eventos/estado.js';
import type { EstadoEvento, TipoDeEvento } from '../src/eventos/tipos.js';

const ARCHIVOS = { COMUNES, BEBIDAS, HIELO, INFUSIONES, ASADO, COMBUSTIBLE, MERIENDA, COMIDA, PICADA, COCTEL };

describe('la forma de los números', () => {
  it('cada número dice de dónde sale: una fuente con URL, o la nota de por qué no tiene', () => {
    const todos = Object.entries(ARCHIVOS).flatMap(([nombre, x]) => datosDe(nombre, x));
    expect(todos.length).toBeGreaterThan(0);
    expect(todos.flatMap(x => problemasDeDato(x.donde, x.dato))).toEqual([]);
  });

  it('un dato sin URL o sin nota es un problema', () => {
    expect(problemasDeDato('X', { valor: 1, fuente: { nombre: 'F', url: 'f.com' } })).toEqual(['X: la fuente «F» no tiene una URL http o https']);
    expect(problemasDeDato('X', { valor: 1, fuente: null, nota: ' ' })).toEqual(['X: va sin fuente y sin nota']);
    expect(problemasDeDato('X', { valor: Number.NaN, fuente: { nombre: 'F', url: 'https://f.com' } })).toEqual(['X: el valor no es un número positivo']);
  });
});

describe('los cinco tipos', () => {
  it('son merienda, asado, comida, picada y cóctel, en ese orden', () => {
    expect(TIPOS_DE_EVENTO.map(t => t.id)).toEqual(['merienda', 'asado', 'comida', 'picada', 'coctel']);
  });

  it('cada uno nombra grupos, cosas y atajos que existen', () => {
    expect(TIPOS_DE_EVENTO.flatMap(problemasDeTipo)).toEqual([]);
  });

  it('un tipo mal armado tiene problemas', () => {
    const malo: TipoDeEvento = {
      id: 'malo', nombre: 'Malo', datos: [],
      grupos: [{ id: 'g', titulo: 'G', seReparte: true }, { id: 'vacio', titulo: 'V', seReparte: true }],
      cosas: [{ id: 'x', nombre: 'X', grupo: 'otro', prendida: true, porcion: () => COMUNES.factorChico, unidad: 'g' }],
      ademas: [], atajo: { dato: 'nada', cosas: { a: ['y'] } }, cifra: { grupo: 'otro', nombre: 'C' }
    };
    expect(problemasDeTipo(malo)).toEqual([
      'malo: la cosa «x» es de un grupo que no está, «otro»',
      'malo: el grupo «g» no tiene cosas',
      'malo: el grupo «vacio» no tiene cosas',
      'malo: el atajo es de «nada», que no es una opción del tipo',
      'malo: el atajo nombra «y», que no es una cosa',
      'malo: la cifra es de un grupo que no está, «otro»'
    ]);
  });

  /** Todo prendido, para que cada cosa y cada una de las que se suman calculen. */
  function todoPrendido(t: TipoDeEvento): EstadoEvento {
    const e = conTipo(estadoInicial(TIPOS_DE_EVENTO, COMUNES), TIPOS_DE_EVENTO, t.id);
    return {
      ...e, adultos: 10, chicos: 3, horas: 6, calor: true, margen: 10,
      porTipo: { [t.id]: {
        datos: {},
        cosas: Object.fromEntries(t.cosas.map(c => [c.id, true])),
        ademas: Object.fromEntries(t.ademas.map(a => [a.ademas.id, {
          prendido: true, datos: Object.fromEntries(a.ademas.datos.flatMap(x => (x.tipo === 'si-no' ? [[x.id, true]] : [])))
        }]))
      } }
    };
  }

  for (const t of TIPOS_DE_EVENTO) {
    it(`${t.nombre}: con los valores por defecto calcula sin errores`, () => {
      const e = { ...conTipo(estadoInicial(TIPOS_DE_EVENTO, COMUNES), TIPOS_DE_EVENTO, t.id), adultos: 10 };
      const r = calcularEvento(e, TIPOS_DE_EVENTO, COMUNES);
      expect(r).not.toBeNull();
      expect(JSON.stringify(r)).not.toMatch(/NaN|Infinity|undefined/);
    });

    it(`${t.nombre}: con todo prendido, cada cosa sale en la lista y nada da NaN`, () => {
      const r = calcularEvento(todoPrendido(t), TIPOS_DE_EVENTO, COMUNES);
      const ids = new Set((r?.grupos ?? []).flatMap(g => g.items.map(i => i.id.split('-')[0])));
      for (const c of t.cosas) expect(ids.has(c.id.split('-')[0]), c.id).toBe(true);
      expect(JSON.stringify(r)).not.toMatch(/NaN|Infinity|undefined/);
      expect(r?.fuentes.length).toBeGreaterThan(0);
    });
  }
});

describe('el atajo del asado', () => {
  it('cada tipo de asado prende algo', () => {
    const asado = TIPOS_DE_EVENTO.find(t => t.id === 'asado');
    const dato = asado?.datos.find(x => x.id === asado.atajo?.dato);
    expect(dato?.tipo).toBe('opcion');
    if (dato?.tipo !== 'opcion' || !asado?.atajo) return;
    for (const o of dato.opciones) expect(asado.atajo.cosas[o.valor]?.length, o.valor).toBeGreaterThan(0);
  });
});
```

Las partes de la picada salen con id `picada-quesos`: por eso el test compara el tramo antes del primer guion, de los dos lados (`pasta-seca` busca `pasta`, que está).

- [ ] **Step 2: Correrlo y ver que falla**

Run: `npx vitest run tests/eventos-tipos.test.ts`
Expected: FAIL, no encuentra `../src/eventos/indice.js`.

- [ ] **Step 3: Escribir `src/eventos/forma.ts`**

```ts
/**
 * La forma de los números y de los tipos de *Evento*: no mira ningún valor,
 * sólo que cada número diga de dónde sale —una fuente con URL, o la nota de
 * por qué no tiene— y que cada tipo nombre grupos, cosas y atajos que
 * existen. La usan los tests que custodian `datos/` y los tipos.
 */
import type { Dato, TipoDeEvento } from './tipos.js';

const esDato = (x: unknown): x is Dato => typeof x === 'object' && x !== null && 'valor' in x && 'fuente' in x;

/** Todos los números de un archivo de datos, con su camino: «ASADO.tira». */
export function datosDe(nombre: string, x: unknown): { donde: string; dato: Dato }[] {
  if (esDato(x)) return [{ donde: nombre, dato: x }];
  if (Array.isArray(x)) return x.flatMap((y, i) => datosDe(`${nombre}[${i}]`, y));
  if (typeof x === 'object' && x !== null) return Object.entries(x).flatMap(([k, y]) => datosDe(`${nombre}.${k}`, y));
  return [];
}

export function problemasDeDato(donde: string, d: Dato): string[] {
  const problemas: string[] = [];
  if (!Number.isFinite(d.valor) || d.valor < 0) problemas.push(`${donde}: el valor no es un número positivo`);
  if (d.fuente === null) {
    if (!d.nota.trim()) problemas.push(`${donde}: va sin fuente y sin nota`);
  } else if (!/^https?:\/\/\S+$/.test(d.fuente.url)) {
    problemas.push(`${donde}: la fuente «${d.fuente.nombre}» no tiene una URL http o https`);
  }
  return problemas;
}

export function problemasDeTipo(t: TipoDeEvento): string[] {
  const p: string[] = [];
  const grupos = new Set(t.grupos.map(g => g.id));
  const cosas = new Set<string>();
  for (const c of t.cosas) {
    if (cosas.has(c.id)) p.push(`${t.id}: la cosa «${c.id}» está dos veces`);
    cosas.add(c.id);
    if (!grupos.has(c.grupo)) p.push(`${t.id}: la cosa «${c.id}» es de un grupo que no está, «${c.grupo}»`);
  }
  for (const g of t.grupos) if (!t.cosas.some(c => c.grupo === g.id)) p.push(`${t.id}: el grupo «${g.id}» no tiene cosas`);
  const atajo = t.atajo;
  if (atajo) {
    const dato = t.datos.find(x => x.id === atajo.dato);
    if (dato?.tipo !== 'opcion') p.push(`${t.id}: el atajo es de «${atajo.dato}», que no es una opción del tipo`);
    else for (const o of dato.opciones) if (!(o.valor in atajo.cosas)) p.push(`${t.id}: la opción «${o.valor}» del atajo no prende nada`);
    for (const id of Object.values(atajo.cosas).flat()) if (!cosas.has(id)) p.push(`${t.id}: el atajo nombra «${id}», que no es una cosa`);
  }
  if (t.cifra && !grupos.has(t.cifra.grupo)) p.push(`${t.id}: la cifra es de un grupo que no está, «${t.cifra.grupo}»`);
  const ademas = t.ademas.map(a => a.ademas.id);
  if (new Set(ademas).size !== ademas.length) p.push(`${t.id}: lo que se suma después está repetido`);
  return p;
}
```

- [ ] **Step 4: Escribir los archivos de datos**

Cada archivo empieza con este encabezado, cambiando lo que contiene:

```ts
/**
 * Los números del asado: <qué contiene>. Salen de
 * `product-design/research/herramientas/verificacion-eventos.md`, sección
 * Decisiones; corregir uno es editar su línea, y ningún test fija un valor.
 * Sólo datos, sin funciones.
 */
```

**Cada `valor` y cada `fuente` se copian de la fila de `verificacion-eventos.md` cuya columna Constante es el camino de la clave** (`ASADO.tira` es `ASADO.tira`). Una constante `sin fuente` va `{ valor, fuente: null, nota: '<la nota de la verificación>' }`. Para leer los archivos de abajo: `D` es un `Dato` de la verificación; `E` es un envase `{ ml: D, nombre: { uno, varios } }` con el nombre de la verificación.

`src/eventos/datos/comunes.ts`:

```ts
import type { Comunes } from '../tipos.js';

export const COMUNES: Comunes = {
  factorChico: D,
  // El valor con que arranca el campo de horas, no un número de una fuente.
  horas: 4
};
```

`src/eventos/datos/bebidas.ts` (las tres constantes con `satisfies`, para que el tipo controle sin perder lo literal):

```ts
import type { DatosBebidas, DatosHielo, DatosInfusiones } from '../ademas.js';

export const BEBIDAS = {
  bebidas: [
    { id: 'cerveza', nombre: 'Cerveza', alcohol: true, mlPorHora: D, envase: E },
    { id: 'vino', nombre: 'Vino', alcohol: true, mlPorHora: D, envase: E },
    { id: 'fernet', nombre: 'Fernet', alcohol: true, mlPorHora: D, envase: E,
      con: { id: 'cola', nombre: 'Cola para el fernet', mlPorMl: D, envase: E } },
    { id: 'gaseosa', nombre: 'Gaseosa', alcohol: false, mlPorHora: D, envase: E },
    { id: 'agua', nombre: 'Agua', alcohol: false, mlPorHora: D, envase: E },
    { id: 'jugo', nombre: 'Jugo', alcohol: false, mlPorHora: D, envase: E }
  ],
  horasPlenas: D, despues: D, calor: D, chico: D,
  brindis: { mlPorAdulto: D, envase: E }
} satisfies DatosBebidas;

export const HIELO = { kgPorPersona: D, kgPorLitroFrio: D, calor: D, bolsa: { kg: D, nombre: { uno: 'bolsa de N kg', varios: 'bolsas de N kg' } } } satisfies DatosHielo;

export const INFUSIONES = {
  tazasPorPersona: D,
  infusiones: [
    { id: 'cafe', nombre: 'Café', prendida: true, porTaza: D, unidad: 'g' },
    { id: 'te', nombre: 'Té', prendida: true, porTaza: D, unidad: 'saquitos' },
    { id: 'mate-cocido', nombre: 'Mate cocido', prendida: false, porTaza: D, unidad: 'saquitos' },
    { id: 'leche', nombre: 'Leche', prendida: false, porTaza: D, unidad: 'ml' }
  ]
} satisfies DatosInfusiones;
```

(`N` es el peso de la bolsa decidido en la verificación.)

`src/eventos/datos/asado.ts`:

```ts
import type { Dato } from '../tipos.js';
import type { DatosCombustible } from '../ademas.js';

export const ASADO = {
  tira: D, vacio: D, matambre: D, entrana: D, pollo: D, cerdo: D, cordero: D,
  chorizo: D, morcilla: D, chinchulines: D, mollejas: D, provoleta: D,
  verduras: D, papas: D, ensalada: D, pan: D,
  // `null`: la ocasión no cambia la carne.
  ocasion: { almuerzo: D_o_null, cena: D_o_null, festejo: D_o_null }
} satisfies Record<string, Dato | Record<string, Dato | null>>;

export const COMBUSTIBLE = { carbonPorKgCarne: D, lenaPorKgCarne: D, vientoOFrio: D, bolsaCarbon: { kg: D, nombre: { uno: 'bolsa de N kg', varios: 'bolsas de N kg' } } } satisfies DatosCombustible;
```

`src/eventos/datos/merienda.ts`:

```ts
import type { Dato, Tramo } from '../tipos.js';

export const MERIENDA = {
  facturas: D, miga: D, salados: D, dulces: D, torta: D,
  // El factor de cada tramo sobre la merienda de 2 a 4 h, que no cambia nada.
  horas: [{ hastaHoras: 2, factor: D }, { hastaHoras: 4, factor: null }, { hastaHoras: null, factor: D }],
  infantil: D
} satisfies { facturas: Dato; miga: Dato; salados: Dato; dulces: Dato; torta: Dato; horas: readonly Tramo[]; infantil: Dato };
```

`src/eventos/datos/comida.ts`:

```ts
import type { Dato } from '../tipos.js';

export const COMIDA = {
  antes: { empanadas: D, vitelTone: D, bocaditos: D },
  comer: { empanadas: D, pizza: D, pastaSeca: D, pastaFresca: D, carne: D, pollo: D, pescado: D },
  porcionesPorPizza: D,
  acompanamiento: { pure: D, papas: D, ensalada: D, arroz: D },
  postre: { torta: D, helado: D, postre: D, fruta: D },
  pan: D,
  ocasion: { almuerzo: D_o_null, cena: D_o_null, festejo: D_o_null },
  sobras: D
} satisfies Record<string, Dato | Record<string, Dato | null>>;
```

`src/eventos/datos/picada.ts`:

```ts
import type { Dato } from '../tipos.js';

type Partes = { fiambres: Dato; quesos: Dato; pan: Dato; vegetales: Dato; snacks: Dato; dips: Dato };
export const PICADA = {
  antes: { fiambres: D, quesos: D, pan: D, vegetales: D, snacks: D, dips: D },
  comida: { fiambres: D, quesos: D, pan: D, vegetales: D, snacks: D, dips: D }
} satisfies { antes: Partes; comida: Partes };
```

`src/eventos/datos/coctel.ts`:

```ts
import type { Dato, Tramo } from '../tipos.js';

export const COCTEL = {
  bocados: D,
  horas: [{ hastaHoras: 2, factor: D }, { hastaHoras: 4, factor: null }, { hastaHoras: null, factor: D }]
} satisfies { bocados: Dato; horas: readonly Tramo[] };
```

- [ ] **Step 5: Escribir los cinco tipos**

`src/eventos/merienda.ts`:

```ts
/** La merienda: bocados que se reparten, por las horas y si es cumpleaños infantil; la torta aparte; infusiones y bebidas sin alcohol. */
import type { TipoDeEvento } from './tipos.js';
import { MERIENDA } from './datos/merienda.js';
import { BEBIDAS, HIELO, INFUSIONES } from './datos/bebidas.js';
import { bebidas, hielo, infusiones } from './ademas.js';
import { fija, porTramo, soloDatos } from './evento.js';

export const MERIENDA_EVENTO: TipoDeEvento = {
  id: 'merienda', nombre: 'Merienda',
  datos: [{ id: 'infantil', nombre: 'Cumpleaños infantil', tipo: 'si-no', porDefecto: false }],
  grupos: [
    { id: 'bocados', titulo: 'Bocados', seReparte: true,
      factores: c => soloDatos(porTramo(MERIENDA.horas, c.horas), c.tipo['infantil'] === true ? MERIENDA.infantil : null) },
    { id: 'aparte', titulo: 'Aparte', seReparte: false }
  ],
  cosas: [
    { id: 'facturas', nombre: 'Facturas y medialunas', grupo: 'bocados', prendida: true, porcion: fija(MERIENDA.facturas), unidad: 'unidad', docenas: true },
    { id: 'miga', nombre: 'Sándwiches de miga', grupo: 'bocados', prendida: true, porcion: fija(MERIENDA.miga), unidad: 'unidad', docenas: true },
    { id: 'salados', nombre: 'Salados (chipá, pizzetas)', grupo: 'bocados', prendida: false, porcion: fija(MERIENDA.salados), unidad: 'unidad' },
    { id: 'dulces', nombre: 'Dulces (masas secas, alfajores)', grupo: 'bocados', prendida: false, porcion: fija(MERIENDA.dulces), unidad: 'unidad' },
    { id: 'torta', nombre: 'Torta o budín', grupo: 'aparte', prendida: true, porcion: fija(MERIENDA.torta), unidad: 'g', chicoEntero: true }
  ],
  ademas: [
    { ademas: infusiones(INFUSIONES), prendido: true },
    { ademas: bebidas(BEBIDAS, ['gaseosa', 'jugo', 'agua']), prendido: true },
    { ademas: hielo(HIELO), prendido: false }
  ]
};
```

`src/eventos/picada.ts` (va antes que asado y comida, que usan sus partes):

```ts
/** La picada: fiambres, quesos, pan y lo demás, en gramos, según sea lo que se come o vaya antes de comer. */
import type { Contexto, CosaConPartes, Dato, TipoDeEvento } from './tipos.js';
import { PICADA } from './datos/picada.js';
import { BEBIDAS, HIELO } from './datos/bebidas.js';
import { bebidas, hielo } from './ademas.js';

type Parte = keyof typeof PICADA.antes;
const parte = (p: Parte) => (c: Contexto): Dato => (c.tipo['rol'] === 'comida' ? PICADA.comida[p] : PICADA.antes[p]);

/** La picada que va antes de un asado o de una comida: una cosa con partes, siempre como antes de comer. */
export const PICADA_ANTES: CosaConPartes['partes'] = [
  { id: 'fiambres', nombre: 'Fiambres', porcion: () => PICADA.antes.fiambres },
  { id: 'quesos', nombre: 'Quesos', porcion: () => PICADA.antes.quesos },
  { id: 'pan', nombre: 'Pan de la picada', porcion: () => PICADA.antes.pan }
];

export const PICADA_EVENTO: TipoDeEvento = {
  id: 'picada', nombre: 'Picada',
  datos: [{ id: 'rol', nombre: 'La picada', tipo: 'opcion', porDefecto: 'antes',
    opciones: [{ valor: 'antes', texto: 'Antes de comer' }, { valor: 'comida', texto: 'Es lo que se come' }] }],
  grupos: [{ id: 'picada', titulo: 'Picada', seReparte: false }],
  cosas: [
    { id: 'fiambres', nombre: 'Fiambres', grupo: 'picada', prendida: true, porcion: parte('fiambres'), unidad: 'g' },
    { id: 'quesos', nombre: 'Quesos', grupo: 'picada', prendida: true, porcion: parte('quesos'), unidad: 'g' },
    { id: 'pan', nombre: 'Pan', grupo: 'picada', prendida: true, porcion: parte('pan'), unidad: 'g' },
    { id: 'vegetales', nombre: 'Vegetales', grupo: 'picada', prendida: true, porcion: parte('vegetales'), unidad: 'g' },
    { id: 'snacks', nombre: 'Snacks', grupo: 'picada', prendida: true, porcion: parte('snacks'), unidad: 'g' },
    { id: 'dips', nombre: 'Dips', grupo: 'picada', prendida: true, porcion: parte('dips'), unidad: 'g' }
  ],
  ademas: [
    { ademas: bebidas(BEBIDAS, ['cerveza', 'vino', 'gaseosa', 'agua']), prendido: true },
    { ademas: hielo(HIELO), prendido: true }
  ]
};
```

`src/eventos/asado.ts`:

```ts
/**
 * El asado: la carne se reparte, cada corte con sus gramos —los de hueso,
 * más—; embutidos, achuras y lo demás aparte; y el carbón o la leña, que sale
 * de los kilos de carne. El tipo de asado es un punto de partida: prende las
 * cosas que trae, y después se cambia lo que haga falta.
 */
import type { Cosa, CosaSimple, Dato, TipoDeEvento } from './tipos.js';
import { ASADO, COMBUSTIBLE } from './datos/asado.js';
import { BEBIDAS, HIELO } from './datos/bebidas.js';
import { bebidas, combustible, hielo } from './ademas.js';
import { deOpcion, fija, soloDatos } from './evento.js';
import { PICADA_ANTES } from './picada.js';

const corte = (id: string, nombre: string, d: Dato): Cosa => ({ id, nombre, grupo: 'carne', prendida: false, porcion: fija(d), unidad: 'g', carne: true });
const aparte = (id: string, nombre: string, d: Dato, extra: Partial<Pick<CosaSimple, 'unidad' | 'nombreUnidad' | 'carne'>> = {}): Cosa =>
  ({ id, nombre, grupo: 'aparte', prendida: false, porcion: fija(d), unidad: 'g', ...extra });

export const ASADO_EVENTO: TipoDeEvento = {
  id: 'asado', nombre: 'Asado',
  datos: [
    { id: 'tipo-asado', nombre: 'Tipo de asado', tipo: 'opcion', porDefecto: 'clasico', opciones: [
      { valor: 'clasico', texto: 'Clásico' }, { valor: 'completo', texto: 'Completo' }, { valor: 'cerdo', texto: 'De cerdo' },
      { valor: 'mixto', texto: 'Mixto' }, { valor: 'cordero', texto: 'Cordero' }, { valor: 'veggie', texto: 'Veggie' }] },
    { id: 'ocasion', nombre: 'Ocasión', tipo: 'opcion', porDefecto: 'almuerzo', opciones: [
      { valor: 'almuerzo', texto: 'Almuerzo' }, { valor: 'cena', texto: 'Cena' }, { valor: 'festejo', texto: 'Festejo' }] }
  ],
  grupos: [
    { id: 'antes', titulo: 'Para picar antes', seReparte: true },
    { id: 'carne', titulo: 'Carne', seReparte: true, factores: c => soloDatos(deOpcion(ASADO.ocasion, c.tipo['ocasion'])) },
    { id: 'aparte', titulo: 'Aparte', seReparte: false }
  ],
  cosas: [
    { id: 'picada', nombre: 'Picada', grupo: 'antes', prendida: false, partes: PICADA_ANTES },
    corte('tira', 'Tira de asado', ASADO.tira),
    corte('vacio', 'Vacío', ASADO.vacio),
    corte('matambre', 'Matambre', ASADO.matambre),
    corte('entrana', 'Entraña', ASADO.entrana),
    corte('pollo', 'Pollo', ASADO.pollo),
    corte('cerdo', 'Cerdo (bondiola o costillas)', ASADO.cerdo),
    corte('cordero', 'Cordero', ASADO.cordero),
    aparte('chorizo', 'Chorizos', ASADO.chorizo, { unidad: 'unidad' }),
    aparte('morcilla', 'Morcillas', ASADO.morcilla, { unidad: 'unidad' }),
    aparte('chinchulines', 'Chinchulines', ASADO.chinchulines, { carne: true }),
    aparte('mollejas', 'Mollejas', ASADO.mollejas, { carne: true }),
    aparte('provoleta', 'Provoleta', ASADO.provoleta, { unidad: 'unidad', nombreUnidad: 'provoletas' }),
    aparte('verduras', 'Verduras a la parrilla', ASADO.verduras),
    aparte('papas', 'Papas', ASADO.papas),
    aparte('ensalada', 'Ensalada', ASADO.ensalada),
    aparte('pan', 'Pan', ASADO.pan)
  ],
  ademas: [
    { ademas: bebidas(BEBIDAS, ['cerveza', 'vino', 'gaseosa', 'agua']), prendido: true },
    { ademas: hielo(HIELO), prendido: true },
    { ademas: combustible(COMBUSTIBLE), prendido: true }
  ],
  // Los de servidos.ar. El pan, la ensalada y lo que no nombra ninguno queda como esté.
  atajo: { dato: 'tipo-asado', cosas: {
    clasico: ['tira', 'chorizo'],
    completo: ['tira', 'vacio', 'chorizo', 'morcilla', 'chinchulines', 'mollejas'],
    cerdo: ['cerdo', 'chorizo'],
    mixto: ['tira', 'pollo'],
    cordero: ['cordero'],
    veggie: ['provoleta', 'verduras']
  } },
  cifra: { grupo: 'carne', nombre: 'Carne' }
};
```

`src/eventos/comida.ts`:

```ts
/**
 * La comida —almuerzo, cena o festejo—: lo que se pica antes, lo que se
 * come, el acompañamiento y el postre se reparten cada uno entre lo suyo; el
 * pan va aparte. Las empanadas están en dos grupos, como dos cosas.
 */
import type { Cosa, Dato, TipoDeEvento } from './tipos.js';
import { COMIDA } from './datos/comida.js';
import { BEBIDAS, HIELO } from './datos/bebidas.js';
import { bebidas, hielo } from './ademas.js';
import { deOpcion, fija, soloDatos } from './evento.js';
import { PICADA_ANTES } from './picada.js';

const g = (id: string, nombre: string, grupo: string, d: Dato, prendida = false): Cosa =>
  ({ id, nombre, grupo, prendida, porcion: fija(d), unidad: 'g' });

export const COMIDA_EVENTO: TipoDeEvento = {
  id: 'comida', nombre: 'Comida',
  datos: [
    { id: 'ocasion', nombre: 'Ocasión', tipo: 'opcion', porDefecto: 'almuerzo', opciones: [
      { valor: 'almuerzo', texto: 'Almuerzo' }, { valor: 'cena', texto: 'Cena' }, { valor: 'festejo', texto: 'Festejo' }] },
    { id: 'sobras', nombre: 'Con sobras', tipo: 'si-no', porDefecto: false }
  ],
  grupos: [
    { id: 'antes', titulo: 'Para picar antes', seReparte: true },
    { id: 'comer', titulo: 'Para comer', seReparte: true,
      factores: c => soloDatos(deOpcion(COMIDA.ocasion, c.tipo['ocasion']), c.tipo['sobras'] === true ? COMIDA.sobras : null) },
    { id: 'acompanamiento', titulo: 'Acompañamiento', seReparte: true },
    { id: 'postre', titulo: 'Postre', seReparte: true },
    { id: 'aparte', titulo: 'Aparte', seReparte: false }
  ],
  cosas: [
    { id: 'picada', nombre: 'Picada', grupo: 'antes', prendida: false, partes: PICADA_ANTES },
    { id: 'empanadas-antes', nombre: 'Empanadas', grupo: 'antes', prendida: false, porcion: fija(COMIDA.antes.empanadas), unidad: 'unidad', docenas: true },
    g('vitel-tone', 'Vitel toné', 'antes', COMIDA.antes.vitelTone),
    { id: 'bocaditos', nombre: 'Bocaditos', grupo: 'antes', prendida: false, porcion: fija(COMIDA.antes.bocaditos), unidad: 'unidad' },
    { id: 'empanadas', nombre: 'Empanadas', grupo: 'comer', prendida: false, porcion: fija(COMIDA.comer.empanadas), unidad: 'unidad', docenas: true },
    { id: 'pizza', nombre: 'Pizzas', grupo: 'comer', prendida: false, porcion: fija(COMIDA.comer.pizza), unidad: 'unidad', nombreUnidad: 'porciones',
      envase: { cantidad: COMIDA.porcionesPorPizza, nombre: { uno: 'pizza', varios: 'pizzas' } } },
    g('pasta-seca', 'Pasta seca', 'comer', COMIDA.comer.pastaSeca),
    g('pasta-fresca', 'Pasta fresca', 'comer', COMIDA.comer.pastaFresca),
    g('carne', 'Carne', 'comer', COMIDA.comer.carne, true),
    g('pollo', 'Pollo', 'comer', COMIDA.comer.pollo),
    g('pescado', 'Pescado', 'comer', COMIDA.comer.pescado),
    g('pure', 'Puré (papas)', 'acompanamiento', COMIDA.acompanamiento.pure),
    g('papas', 'Papas', 'acompanamiento', COMIDA.acompanamiento.papas),
    g('ensalada', 'Ensalada', 'acompanamiento', COMIDA.acompanamiento.ensalada, true),
    g('arroz', 'Arroz', 'acompanamiento', COMIDA.acompanamiento.arroz),
    { id: 'torta', nombre: 'Torta', grupo: 'postre', prendida: false, porcion: fija(COMIDA.postre.torta), unidad: 'g', chicoEntero: true },
    { id: 'helado', nombre: 'Helado', grupo: 'postre', prendida: true, porcion: fija(COMIDA.postre.helado), unidad: 'ml' },
    g('postre', 'Postre en porciones (flan, tiramisú, mousse)', 'postre', COMIDA.postre.postre),
    g('fruta', 'Fruta', 'postre', COMIDA.postre.fruta),
    g('pan', 'Pan', 'aparte', COMIDA.pan, true)
  ],
  ademas: [
    { ademas: bebidas(BEBIDAS, ['vino', 'gaseosa', 'agua']), prendido: true },
    { ademas: hielo(HIELO), prendido: true }
  ]
};
```

`src/eventos/coctel.ts`:

```ts
/** El cóctel o lunch: bocados que se reparten, por las horas. */
import type { Cosa, TipoDeEvento } from './tipos.js';
import { COCTEL } from './datos/coctel.js';
import { BEBIDAS, HIELO } from './datos/bebidas.js';
import { bebidas, hielo } from './ademas.js';
import { fija, porTramo, soloDatos } from './evento.js';

/** Todos los bocados tienen la misma porción: la del cóctel, repartida entre los que haya. */
const bocado = (id: string, nombre: string, prendida: boolean, docenas = false): Cosa =>
  ({ id, nombre, grupo: 'bocados', prendida, porcion: fija(COCTEL.bocados), unidad: 'unidad', ...(docenas ? { docenas: true as const } : {}) });

export const COCTEL_EVENTO: TipoDeEvento = {
  id: 'coctel', nombre: 'Cóctel o lunch',
  datos: [],
  grupos: [{ id: 'bocados', titulo: 'Bocados', seReparte: true, factores: c => soloDatos(porTramo(COCTEL.horas, c.horas)) }],
  cosas: [
    bocado('miga', 'Sándwiches de miga', true, true),
    bocado('frios', 'Bocaditos fríos', true),
    bocado('calientes', 'Bocaditos calientes', true),
    bocado('empanaditas', 'Empanaditas', false, true),
    bocado('pizzetas', 'Pizzetas', false),
    bocado('dulces', 'Dulces', true)
  ],
  ademas: [
    { ademas: bebidas(BEBIDAS, ['cerveza', 'vino', 'gaseosa', 'agua']), prendido: true },
    { ademas: hielo(HIELO), prendido: true }
  ]
};
```

`src/eventos/indice.ts`:

```ts
/** Los tipos de evento, en el orden del desplegable. Un tipo nuevo se suma acá. */
import type { TipoDeEvento } from './tipos.js';
import { MERIENDA_EVENTO } from './merienda.js';
import { ASADO_EVENTO } from './asado.js';
import { COMIDA_EVENTO } from './comida.js';
import { PICADA_EVENTO } from './picada.js';
import { COCTEL_EVENTO } from './coctel.js';

export const TIPOS_DE_EVENTO: readonly TipoDeEvento[] = [MERIENDA_EVENTO, ASADO_EVENTO, COMIDA_EVENTO, PICADA_EVENTO, COCTEL_EVENTO];
```

- [ ] **Step 6: Correr los tests de eventos y el typecheck**

Run: `npx vitest run tests/eventos-*.test.ts && npm run typecheck`
Expected: PASS y sin errores de tipos.

---

### Task 7: La pantalla

**Files:**
- Create: `src/ui/evento.ts`
- Modify: `src/ui/herramientas.ts` (exportar `cifras`, `lineas`, `grupo`, `advertencias`, `fichaResultado`; sumar la entrada de *Evento*), `src/ui/referencias.ts` (exportar `pieDeFuentes`), `src/ui/iconos.ts` (ícono `invitados`), `src/ui/router.ts` (vista `evento`), `src/ui/base.css`
- Test: `tests/vista-evento.test.ts`; Modify: `tests/vista-herramientas.test.ts`, `tests/router.test.ts`

**Interfaces:**
- Consumes: Tasks 2 a 4 (la pantalla recibe los tipos y los comunes por parámetro: el test usa los suyos).
- Produces:
  - `renderEvento(e: EstadoEvento, tipos: readonly TipoDeEvento[], comunes: Comunes, compartir?: EstadoCompartir): string`
  - `resultadoEvento(r: ResultadoEvento | null): string` (un `div.ficha.resultado[data-resultado]`)
  - Atributos que lee el control (Task 8): `<select data-evento="tipo">`; `<input data-evento="adultos|chicos|horas">`; `<select|input data-evento="dato" data-id>`; `<select|input data-evento="dato-ademas" data-ademas data-id>`; botones `data-accion="evento-alternar"` con `data-evento="calor|cosa|ademas|dato|dato-ademas"`, `data-id`, `data-ademas` y `data-valor` (`'1'` prende, `''` apaga); `data-accion="evento-margen" data-valor="0|10|20"`; `data-accion="evento-reiniciar"`; `data-accion="compartir-evento"` en el encabezado.
  - Vista del router: `'evento'` para `#/herramientas/evento`.

- [ ] **Step 1: Escribir el test que falla, `tests/vista-evento.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { renderEvento, resultadoEvento } from '../src/ui/evento.js';
import { calcularEvento } from '../src/eventos/evento.js';
import { estadoInicial } from '../src/eventos/estado.js';
import { ICO } from '../src/ui/iconos.js';
import type { Ademas, Comunes, Dato, EstadoEvento, TipoDeEvento } from '../src/eventos/tipos.js';

const d = (valor: number): Dato => ({ valor, fuente: { nombre: 'La fuente', url: 'https://f.com' } });
const COMUNES: Comunes = { factorChico: d(0.5), horas: 4 };
const HIELO: Ademas = {
  id: 'hielo', nombre: 'Hielo', datos: [{ id: 'enfriar', nombre: 'También para enfriar', tipo: 'si-no', porDefecto: false }],
  calcular: () => ({ items: [{ id: 'hielo', nombre: 'Hielo', cantidad: '5 kg' }], usados: [] })
};
const PRUEBA: TipoDeEvento = {
  id: 'prueba', nombre: 'Prueba',
  datos: [{ id: 'ocasion', nombre: 'Ocasión', tipo: 'opcion', porDefecto: 'a', opciones: [{ valor: 'a', texto: 'Almuerzo' }, { valor: 'c', texto: 'Cena' }] }],
  grupos: [{ id: 'antes', titulo: 'Para picar antes', seReparte: true }, { id: 'comer', titulo: 'Para comer', seReparte: true }],
  cosas: [
    { id: 'empanadas-antes', nombre: 'Empanadas', grupo: 'antes', prendida: false, porcion: () => d(3), unidad: 'unidad' },
    { id: 'empanadas', nombre: 'Empanadas', grupo: 'comer', prendida: true, porcion: () => d(6), unidad: 'unidad' }
  ],
  ademas: [{ ademas: HIELO, prendido: false }]
};
const OTRO: TipoDeEvento = { ...PRUEBA, id: 'otro', nombre: 'Otro' };
const TIPOS = [PRUEBA, OTRO];
const con = (cambios: Partial<EstadoEvento>): EstadoEvento => ({ ...estadoInicial(TIPOS, COMUNES), ...cambios });

describe('la pantalla de Evento', () => {
  it('lleva el volver, el ícono, el título y Compartir', () => {
    const html = renderEvento(con({}), TIPOS, COMUNES);
    expect(html).toContain('data-accion="volver"');
    expect(html).toContain(`${ICO.invitados}Evento`);
    expect(html).toContain('data-accion="compartir-evento"');
  });

  it('el tipo en un desplegable, con el elegido marcado', () => {
    const html = renderEvento(con({ tipo: 'otro' }), TIPOS, COMUNES);
    expect(html).toContain('<select data-evento="tipo">');
    expect(html).toContain('<option value="otro" selected>Otro</option>');
  });

  it('adultos, chicos y horas son campos con lo escrito; vacío, vacíos', () => {
    const html = renderEvento(con({ adultos: 12, chicos: null }), TIPOS, COMUNES);
    expect(html).toContain('data-evento="adultos" value="12"');
    expect(html).toContain('data-evento="chicos" value=""');
    expect(html).toContain('data-evento="horas" value="4"');
  });

  it('el calor es un interruptor y el margen un conmutador con el elegido apretado', () => {
    const html = renderEvento(con({ calor: true, margen: 10 }), TIPOS, COMUNES);
    expect(html).toMatch(/role="switch" aria-checked="true" data-accion="evento-alternar" data-evento="calor" data-valor=""/);
    expect(html).toContain('data-accion="evento-margen" data-valor="10" aria-pressed="true"');
    expect(html).toContain('data-valor="0" aria-pressed="false">Sin margen');
  });

  it('los datos del tipo, con lo elegido', () => {
    expect(renderEvento(con({}), TIPOS, COMUNES)).toContain('<select data-evento="dato" data-id="ocasion">');
  });

  it('una ficha por grupo, con su título, y la misma cosa en dos grupos se distingue por el título', () => {
    const html = renderEvento(con({}), TIPOS, COMUNES);
    const antes = html.indexOf('<h2>Para picar antes</h2>');
    const comer = html.indexOf('<h2>Para comer</h2>');
    expect(antes).toBeGreaterThan(0);
    expect(comer).toBeGreaterThan(antes);
    expect(html).toContain('aria-checked="false" data-accion="evento-alternar" data-evento="cosa" data-id="empanadas-antes" data-valor="1"');
    expect(html).toContain('aria-checked="true" data-accion="evento-alternar" data-evento="cosa" data-id="empanadas" data-valor=""');
  });

  it('lo que se suma después: apagado, sólo su interruptor; prendido, sus datos debajo', () => {
    const apagado = renderEvento(con({}), TIPOS, COMUNES);
    expect(apagado).toContain('<h2>Además</h2>');
    expect(apagado).toContain('data-evento="ademas" data-id="hielo" data-valor="1"');
    expect(apagado).not.toContain('data-ademas="hielo"');
    const prendido = renderEvento(con({ porTipo: { prueba: { datos: {}, cosas: {}, ademas: { hielo: { prendido: true, datos: {} } } } } }), TIPOS, COMUNES);
    expect(prendido).toContain('data-evento="dato-ademas" data-ademas="hielo" data-id="enfriar"');
  });

  it('el resultado al pie, con la cuenta de la app; sin personas, la línea que lo pide', () => {
    const e = con({ adultos: 10 });
    const r = calcularEvento(e, TIPOS, COMUNES);
    expect(renderEvento(e, TIPOS, COMUNES)).toContain(resultadoEvento(r));
    expect(resultadoEvento(null)).toContain('Escribí cuántos son y prendé lo que va a haber.');
    expect(resultadoEvento(null)).toContain('data-resultado');
  });

  it('el resultado: cifras, grupos con sus ítems, lo que se suma, advertencias y fuentes', () => {
    const html = resultadoEvento({
      titulo: 'Prueba para 10', cifras: [{ nombre: 'Personas', valor: '10' }],
      grupos: [{ titulo: 'Para comer', items: [{ id: 'e', nombre: 'Empanadas', cantidad: '60' }] }],
      ademas: [{ id: 'hielo', nombre: 'Hielo', cantidad: '5 kg' }],
      advertencias: ['Un supuesto.'], fuentes: [{ nombre: 'La fuente', url: 'https://f.com' }]
    });
    expect(html).toContain('<span class="v">10</span><span class="n">Personas</span>');
    expect(html).toContain('<div class="grupo">Para comer</div>');
    expect(html).toContain('<span class="n">Empanadas</span><span class="c">60</span>');
    expect(html).toContain('<div class="grupo">Además</div>');
    expect(html).toContain('<li>Un supuesto.</li>');
    expect(html).toContain('href="https://f.com"');
  });

  it('Empezar de nuevo, al final', () => {
    expect(renderEvento(con({}), TIPOS, COMUNES)).toContain('data-accion="evento-reiniciar">Empezar de nuevo</button>');
  });

  it('con la ficha de compartir abierta, la dibuja', () => {
    expect(renderEvento(con({}), TIPOS, COMUNES, { paso: 'opciones', solo: 'texto' })).toContain('class="hoja-compartir"');
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `npx vitest run tests/vista-evento.test.ts`
Expected: FAIL, no encuentra `../src/ui/evento.js`.

- [ ] **Step 3: Exportar lo que se comparte**

En `src/ui/herramientas.ts`, poner `export` delante de `fichaResultado`, `lineas`, `cifras`, `grupo` y `advertencias` (las cinco son `const` del módulo; quedan iguales). En `src/ui/referencias.ts`, `export` delante de `function pieDeFuentes`.

- [ ] **Step 4: El ícono `invitados`**

En `src/ui/iconos.ts`, después de `medidor`:

```ts
  /** Evento: dos personas, el `users` de Lucide. */
  invitados: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
```

Si hay un test que lista los íconos (`grep -rn "medidor" tests/`), sumarle `invitados`.

- [ ] **Step 5: Escribir `src/ui/evento.ts`**

```ts
/**
 * *Evento*: los datos, las cosas por grupo, lo que se suma después y el
 * resultado. Sólo dibuja: la cuenta sale de `src/eventos/`, y lo elegido lo
 * guarda `eventos-control.ts`. Usa las filas de las calculadoras
 * (design-system §6.28); las fichas de las cosas llevan título porque la
 * misma cosa puede estar en dos grupos.
 *
 * El resultado es un bloque aparte (`[data-resultado]`) para pintarlo solo
 * mientras se escribe un número: redibujar le sacaría el foco al campo.
 */
import { escapar } from './markdown.js';
import { encabezado } from './componentes.js';
import { ICO } from './iconos.js';
import { renderFichaCompartir } from './compartir.js';
import type { EstadoCompartir } from './compartir.js';
import { advertencias, cifras, fichaResultado, grupo, lineas } from './herramientas.js';
import { pieDeFuentes } from './referencias.js';
import { calcularEvento } from '../eventos/evento.js';
import { MARGENES, estadoDeTipo, tipoDe, valoresDe } from '../eventos/estado.js';
import type { Comunes, DatoPedido, EstadoEvento, Item, ResultadoEvento, TipoDeEvento, Valores } from '../eventos/tipos.js';

/** Una fila que se toca entera, apagada o prendida. Manda el estado al que pasa: `'1'` prende. */
const interruptor = (nombre: string, prendido: boolean, datos: string): string =>
  `<button type="button" class="dato interruptor" role="switch" aria-checked="${prendido}" data-accion="evento-alternar" ${datos} ` +
  `data-valor="${prendido ? '' : '1'}"><span class="n">${escapar(nombre)}</span><span class="perilla" aria-hidden="true"></span></button>`;

/** Un dato del tipo o de lo que se suma después. `donde` son los atributos que dicen de quién es. */
function filaDeDato(d: DatoPedido, v: Valores, donde: string): string {
  const valor = v[d.id];
  const atributos = `${donde} data-id="${escapar(d.id)}"`;
  if (d.tipo === 'si-no') return interruptor(d.nombre, valor === true, atributos);
  if (d.tipo === 'opcion') {
    const opciones = d.opciones.map(o => `<option value="${escapar(o.valor)}"${o.valor === valor ? ' selected' : ''}>${escapar(o.texto)}</option>`).join('');
    return `<label class="dato"><span class="n">${escapar(d.nombre)}</span><select ${atributos}>${opciones}</select></label>`;
  }
  return `<label class="dato"><span class="n">${escapar(d.unidad ? `${d.nombre} (${d.unidad})` : d.nombre)}</span>` +
    `<input type="number" inputmode="decimal" min="0" step="any" ${atributos} value="${typeof valor === 'number' ? valor : ''}"></label>`;
}

const comoLineas = (items: readonly Item[]): string => lineas(items.map(i => ({ nombre: i.nombre, valor: i.cantidad })));

/** El resultado, en la ficha del resultado; sin resultado, la línea que dice qué falta. */
export function resultadoEvento(r: ResultadoEvento | null): string {
  if (!r) return fichaResultado('<p class="aviso-mudo">Escribí cuántos son y prendé lo que va a haber.</p>');
  return fichaResultado(
    cifras(r.cifras) +
    r.grupos.map(g => grupo(g.titulo) + comoLineas(g.items)).join('') +
    (r.ademas.length ? grupo('Además') + comoLineas(r.ademas) : '') +
    advertencias(r.advertencias) +
    (r.fuentes.length ? pieDeFuentes(r.fuentes) : ''));
}

const campo = (etiqueta: string, que: 'adultos' | 'chicos', valor: number | null): string =>
  `<label class="campo"><span>${etiqueta}</span><input type="number" inputmode="numeric" min="0" step="1" data-evento="${que}" value="${valor ?? ''}"></label>`;

export function renderEvento(e: EstadoEvento, tipos: readonly TipoDeEvento[], comunes: Comunes, compartir?: EstadoCompartir): string {
  const t = tipoDe(e, tipos);
  const et = t ? estadoDeTipo(e, t) : null;
  const tipo = `<label class="dato"><span class="n">Evento</span><select data-evento="tipo">` +
    tipos.map(x => `<option value="${escapar(x.id)}"${x.id === e.tipo ? ' selected' : ''}>${escapar(x.nombre)}</option>`).join('') + '</select></label>';
  const personas = `<div class="ficha"><div class="par-cantidades">${campo('Adultos', 'adultos', e.adultos)}` +
    `<span class="entre" aria-hidden="true">+</span>${campo('Chicos', 'chicos', e.chicos)}</div></div>`;
  const horas = `<label class="dato"><span class="n">Horas</span><input type="number" inputmode="decimal" min="0" step="any" data-evento="horas" value="${e.horas ?? ''}"></label>`;
  const margen = '<div class="dato"><span class="n">Margen</span><div class="seg" role="group" aria-label="Margen">' +
    MARGENES.map(m => `<button type="button" data-accion="evento-margen" data-valor="${m}" aria-pressed="${m === e.margen}">${m ? `${m} %` : 'Sin margen'}</button>`).join('') +
    '</div></div>';
  const datosDelTipo = t && et ? t.datos.map(d => filaDeDato(d, valoresDe(t.datos, et.datos), 'data-evento="dato"')).join('') : '';

  const grupos = t && et ? t.grupos.map(g => {
    const cosas = t.cosas.filter(c => c.grupo === g.id);
    return `<div class="ficha datos con-titulo"><h2>${escapar(g.titulo)}</h2>` +
      cosas.map(c => interruptor(c.nombre, et.cosas[c.id] ?? c.prendida, `data-evento="cosa" data-id="${escapar(c.id)}"`)).join('') + '</div>';
  }).join('') : '';

  const ademas = t && et && t.ademas.length ? '<div class="ficha datos con-titulo"><h2>Además</h2>' +
    t.ademas.map(({ ademas: a, prendido }) => {
      const estado = et.ademas[a.id];
      const prendida = estado?.prendido ?? prendido;
      const filas = prendida
        ? a.datos.map(d => filaDeDato(d, valoresDe(a.datos, estado?.datos ?? {}), `data-evento="dato-ademas" data-ademas="${a.id}"`)).join('')
        : '';
      return interruptor(a.nombre, prendida, `data-evento="ademas" data-id="${a.id}"`) + filas;
    }).join('') + '</div>' : '';

  return encabezado({
    titulo: 'Evento', icono: ICO.invitados, volver: true,
    derecha: `<button class="ico" data-accion="compartir-evento" aria-label="Compartir">${ICO.compartir}</button>`
  }) +
    '<div class="cuerpo"><div class="calculadora">' +
      `<div class="ficha datos">${tipo}</div>` + personas +
      `<div class="ficha datos">${horas}${interruptor('Hace calor', e.calor, 'data-evento="calor"')}${margen}${datosDelTipo}</div>` +
      grupos + ademas +
    '</div>' +
    resultadoEvento(t ? calcularEvento(e, tipos, comunes) : null) +
    '<button type="button" class="btn sec reiniciar-evento" data-accion="evento-reiniciar">Empezar de nuevo</button>' +
    '</div>' +
    (compartir ? renderFichaCompartir(compartir) : '');
}
```

El test del interruptor de cosa espera `aria-checked="…" data-accion="evento-alternar" data-evento="cosa" data-id="…" data-valor="…"`: el orden de los atributos de `interruptor` es ése.

- [ ] **Step 6: El CSS**

Al final de las reglas de las calculadoras en `src/ui/base.css` (después de `.ficha.datos { padding-block: 0; }`):

```css
/* Evento: las fichas de las cosas llevan título, porque la misma cosa puede estar en dos grupos. */
.ficha.datos.con-titulo { padding-top: var(--e-4); }
.reiniciar-evento { width: 100%; margin-top: var(--e-5); }
```

- [ ] **Step 7: La entrada en la lista y la ruta**

En `renderHerramientas` de `src/ui/herramientas.ts`, después del Conversor:

```ts
      entrada('#/herramientas/evento', ICO.invitados, 'Evento', 'Cuánto comprar para una reunión') +
```

En `src/ui/router.ts`: sumar `| 'evento'` al final de la unión `Vista` (en la línea de `'referencias' | 'conversor'`), y en el bloque de `herramientas`, antes del `return` de la lista:

```ts
    if (partes[1] === 'evento') return { vista: 'evento', params: {} };
```

- [ ] **Step 8: Los tests de la lista y del router**

En `tests/vista-herramientas.test.ts`, un caso más en `describe('la lista de herramientas')`:

```ts
  it('termina con Evento, con su ícono y su línea', () => {
    const html = renderHerramientas({});
    const conversor = html.indexOf('href="#/herramientas/conversor"');
    const evento = html.indexOf(`href="#/herramientas/evento">${ICO.invitados}`);
    expect(evento).toBeGreaterThan(conversor);
    expect(html).toContain('<span class="tit">Evento</span>');
    expect(html).toContain('Cuánto comprar para una reunión');
  });
```

En `tests/router.test.ts`, al lado del caso del Conversor (línea con `'#/herramientas/conversor'`):

```ts
    expect(parsearHash('#/herramientas/evento')).toEqual({ vista: 'evento', params: {} });
```

- [ ] **Step 9: Correr los tests y ver que pasan**

Run: `npx vitest run tests/vista-evento.test.ts tests/vista-herramientas.test.ts tests/router.test.ts tests/vista-referencias.test.ts`
Expected: PASS. Si un test de la lista contaba cinco entradas, ahora son seis: corregir ese número.

---

### Task 8: El control, `main.ts` y compartir

**Files:**
- Create: `src/eventos-control.ts`
- Modify: `src/main.ts`
- Test: `tests/eventos-control.test.ts`; Modify: `tests/main-rutas.test.ts`

**Interfaces:**
- Consumes: `estado.ts` (Task 3), `evento.ts` (Task 4), `TIPOS_DE_EVENTO` y `COMUNES` (Task 6), `renderEvento` y `resultadoEvento` (Task 7).
- Produces: `CLAVE_EVENTO = 'recetario.evento'`; `crearControlEvento({ almacen, tipos, comunes, redibujar, pintarResultado }): ControlEvento` con `estado(): EstadoEvento`, `alCambiar(campo: Pick<HTMLInputElement, 'value' | 'dataset'>, esDesplegable: boolean): void` y `acciones` (`evento-alternar`, `evento-margen`, `evento-reiniciar`).

- [ ] **Step 1: Escribir el test que falla, `tests/eventos-control.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { crearControlEvento, CLAVE_EVENTO } from '../src/eventos-control.js';
import { estadoInicial } from '../src/eventos/estado.js';
import { localStorageFalso } from './dom-falso.js';
import type { Comunes, Dato, TipoDeEvento } from '../src/eventos/tipos.js';

const d = (valor: number): Dato => ({ valor, fuente: { nombre: 'F', url: 'https://f.com' } });
const COMUNES: Comunes = { factorChico: d(0.5), horas: 4 };
const PRUEBA: TipoDeEvento = {
  id: 'prueba', nombre: 'Prueba',
  datos: [
    { id: 'ocasion', nombre: 'Ocasión', tipo: 'opcion', porDefecto: 'a', opciones: [{ valor: 'a', texto: 'A' }, { valor: 'c', texto: 'C' }] },
    { id: 'sobras', nombre: 'Sobras', tipo: 'si-no', porDefecto: false }
  ],
  grupos: [{ id: 'g', titulo: 'G', seReparte: true }],
  cosas: [{ id: 'x', nombre: 'X', grupo: 'g', prendida: true, porcion: () => d(1), unidad: 'unidad' }],
  ademas: [{ ademas: { id: 'hielo', nombre: 'Hielo', datos: [{ id: 'kg', nombre: 'Kg', tipo: 'numero', porDefecto: null }], calcular: () => ({ items: [], usados: [] }) }, prendido: true }]
};
const OTRO: TipoDeEvento = { ...PRUEBA, id: 'otro', nombre: 'Otro' };
const TIPOS = [PRUEBA, OTRO];

const boton = (accion: string, datos: Record<string, string>) => ({ dataset: { accion, ...datos } }) as unknown as HTMLElement;
const campo = (datos: Record<string, string>, value: string) => ({ dataset: datos, value }) as unknown as HTMLInputElement;

function armar(almacen: Pick<Storage, 'getItem' | 'setItem'> | null = localStorageFalso()) {
  const redibujar = vi.fn();
  const pintarResultado = vi.fn();
  const control = crearControlEvento({ almacen, tipos: TIPOS, comunes: COMUNES, redibujar, pintarResultado });
  const tocar = (accion: string, datos: Record<string, string> = {}) => control.acciones[accion]!(boton(accion, datos), new Event('click'));
  return { control, redibujar, pintarResultado, tocar, almacen };
}

describe('el control de Evento', () => {
  it('sin nada guardado, el estado inicial; con algo roto, también', () => {
    expect(armar().control.estado()).toEqual(estadoInicial(TIPOS, COMUNES));
    const almacen = localStorageFalso();
    almacen.setItem(CLAVE_EVENTO, '{roto');
    expect(armar(almacen).control.estado()).toEqual(estadoInicial(TIPOS, COMUNES));
  });

  it('escribir adultos, chicos u horas guarda y pinta sólo el resultado; con coma, vacío o algo que no es un número', () => {
    const { control, redibujar, pintarResultado, almacen } = armar();
    control.alCambiar(campo({ evento: 'adultos' }, '2,5'), false);
    control.alCambiar(campo({ evento: 'chicos' }, ''), false);
    control.alCambiar(campo({ evento: 'horas' }, 'abc'), false);
    expect([control.estado().adultos, control.estado().chicos, control.estado().horas]).toEqual([2.5, null, null]);
    expect(pintarResultado).toHaveBeenCalledTimes(3);
    expect(redibujar).not.toHaveBeenCalled();
    expect(JSON.parse(almacen!.getItem(CLAVE_EVENTO) ?? '{}').adultos).toBe(2.5);
  });

  it('elegir el tipo redibuja; cambiar de tipo y volver conserva lo de cada uno', () => {
    const { control, redibujar, tocar } = armar();
    tocar('evento-alternar', { evento: 'cosa', id: 'x', valor: '' });
    control.alCambiar(campo({ evento: 'tipo' }, 'otro'), true);
    control.alCambiar(campo({ evento: 'tipo' }, 'prueba'), true);
    expect(control.estado().porTipo['prueba']?.cosas['x']).toBe(false);
    expect(redibujar).toHaveBeenCalledTimes(3);
  });

  it('un dato del tipo: el desplegable redibuja; el sí o no, también', () => {
    const { control, redibujar, tocar } = armar();
    control.alCambiar(campo({ evento: 'dato', id: 'ocasion' }, 'c'), true);
    tocar('evento-alternar', { evento: 'dato', id: 'sobras', valor: '1' });
    expect(control.estado().porTipo['prueba']?.datos).toEqual({ ocasion: 'c', sobras: true });
    expect(redibujar).toHaveBeenCalledTimes(2);
  });

  it('un número de lo que se suma pinta sólo el resultado', () => {
    const { control, pintarResultado } = armar();
    control.alCambiar(campo({ evento: 'dato-ademas', ademas: 'hielo', id: 'kg' }, '3'), false);
    expect(control.estado().porTipo['prueba']?.ademas['hielo']?.datos['kg']).toBe(3);
    expect(pintarResultado).toHaveBeenCalledTimes(1);
  });

  it('el calor, lo que se suma y el margen redibujan', () => {
    const { control, redibujar, tocar } = armar();
    tocar('evento-alternar', { evento: 'calor', valor: '1' });
    tocar('evento-alternar', { evento: 'ademas', id: 'hielo', valor: '' });
    tocar('evento-margen', { valor: '20' });
    tocar('evento-margen', { valor: '15' });
    expect(control.estado().calor).toBe(true);
    expect(control.estado().porTipo['prueba']?.ademas['hielo']?.prendido).toBe(false);
    expect(control.estado().margen).toBe(20);
    expect(redibujar).toHaveBeenCalledTimes(3);
  });

  it('Empezar de nuevo vuelve todo al estado inicial y lo guarda', () => {
    const { control, tocar, almacen } = armar();
    control.alCambiar(campo({ evento: 'adultos' }, '8'), false);
    tocar('evento-reiniciar');
    expect(control.estado()).toEqual(estadoInicial(TIPOS, COMUNES));
    expect(JSON.parse(almacen!.getItem(CLAVE_EVENTO) ?? '{}').adultos).toBeNull();
  });

  it('sin almacenamiento, o con uno que falla, sigue andando', () => {
    const { control } = armar(null);
    control.alCambiar(campo({ evento: 'adultos' }, '4'), false);
    expect(control.estado().adultos).toBe(4);
    const roto = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); } };
    const conRoto = armar(roto).control;
    conRoto.alCambiar(campo({ evento: 'adultos' }, '4'), false);
    expect(conRoto.estado().adultos).toBe(4);
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `npx vitest run tests/eventos-control.test.ts`
Expected: FAIL, no encuentra `../src/eventos-control.js`.

- [ ] **Step 3: Escribir `src/eventos-control.ts`**

```ts
/**
 * Lo elegido en *Evento*: un evento a la vez, guardado en el teléfono en cada
 * cambio (`recetario.evento`), como las calculadoras. No va a Drive: es una
 * comodidad de este teléfono.
 *
 * Un toque o un desplegable redibujan la pantalla, porque cambian qué filas
 * se ven; escribir un número pinta sólo el resultado, para no sacarle el foco
 * al campo.
 */
import type { SeccionDeAcciones } from './acciones.js';
import { MARGENES, completarEvento, conAdemas, conCosa, conDato, conDatoDeAdemas, conTipo, estadoInicial } from './eventos/estado.js';
import type { Comunes, EstadoEvento, TipoDeEvento } from './eventos/tipos.js';

export const CLAVE_EVENTO = 'recetario.evento';

type Almacen = Pick<Storage, 'getItem' | 'setItem'>;

export interface ControlEvento {
  estado(): EstadoEvento;
  /** Un campo o un desplegable `[data-evento]` que cambió. */
  alCambiar(campo: Pick<HTMLInputElement, 'value' | 'dataset'>, esDesplegable: boolean): void;
  acciones: SeccionDeAcciones;
}

/** Un número escrito con coma o punto; vacío, negativo o lo que no es un número, `null`. */
function numeroEscrito(texto: string): number | null {
  const n = Number(texto.trim().replace(',', '.'));
  return texto.trim() && Number.isFinite(n) && n >= 0 ? n : null;
}

export function crearControlEvento({ almacen, tipos, comunes, redibujar, pintarResultado }: {
  almacen: Almacen | null;
  tipos: readonly TipoDeEvento[];
  comunes: Comunes;
  redibujar: () => void;
  pintarResultado: () => void;
}): ControlEvento {
  let e = leer();

  function leer(): EstadoEvento {
    try {
      const crudo = almacen?.getItem(CLAVE_EVENTO);
      return completarEvento(crudo ? JSON.parse(crudo) : null, tipos, comunes);
    } catch {
      return estadoInicial(tipos, comunes);
    }
  }

  function cambiar(nuevo: EstadoEvento, pintar: () => void): void {
    e = nuevo;
    try { almacen?.setItem(CLAVE_EVENTO, JSON.stringify(e)); } catch { /* sin almacenamiento: queda para esta vez */ }
    pintar();
  }

  function alCambiar(campo: Pick<HTMLInputElement, 'value' | 'dataset'>, esDesplegable: boolean): void {
    const { evento: que = '', id = '', ademas = '' } = campo.dataset;
    if (que === 'tipo') return cambiar(conTipo(e, tipos, campo.value), redibujar);
    if (que === 'adultos' || que === 'chicos' || que === 'horas') return cambiar({ ...e, [que]: numeroEscrito(campo.value) }, pintarResultado);
    const valor = esDesplegable ? campo.value : numeroEscrito(campo.value);
    const pintar = esDesplegable ? redibujar : pintarResultado;
    if (que === 'dato') return cambiar(conDato(e, tipos, id, valor), pintar);
    if (que === 'dato-ademas') return cambiar(conDatoDeAdemas(e, tipos, ademas, id, valor), pintar);
  }

  const acciones: SeccionDeAcciones = {
    'evento-alternar': (boton) => {
      const { evento: que = '', id = '', ademas = '', valor = '' } = boton.dataset;
      const prender = valor === '1';
      const nuevo = que === 'calor' ? { ...e, calor: prender }
        : que === 'cosa' ? conCosa(e, tipos, id, prender)
        : que === 'ademas' ? conAdemas(e, tipos, id, prender)
        : que === 'dato' ? conDato(e, tipos, id, prender)
        : que === 'dato-ademas' ? conDatoDeAdemas(e, tipos, ademas, id, prender)
        : e;
      cambiar(nuevo, redibujar);
    },
    'evento-margen': (boton) => {
      const m = MARGENES.find(x => String(x) === boton.dataset['valor']);
      if (m !== undefined) cambiar({ ...e, margen: m }, redibujar);
    },
    'evento-reiniciar': () => cambiar(estadoInicial(tipos, comunes), redibujar)
  };

  return { estado: () => e, alCambiar, acciones };
}
```

- [ ] **Step 4: Correrlo y ver que pasa**

Run: `npx vitest run tests/eventos-control.test.ts`
Expected: PASS.

- [ ] **Step 5: Cablear `src/main.ts`**

Imports, junto a los de herramientas (línea ~75):

```ts
import { crearControlEvento } from './eventos-control.js';
import { renderEvento, resultadoEvento } from './ui/evento.js';
import { calcularEvento, textoEvento } from './eventos/evento.js';
import { TIPOS_DE_EVENTO } from './eventos/indice.js';
import { COMUNES as COMUNES_DE_EVENTO } from './eventos/datos/comunes.js';
```

Después de `const herramientas = crearControlHerramientas({...});`:

```ts
/** Lo elegido en *Evento*. Antes del primer dibujo: `render` lo usa. */
const controlEvento = crearControlEvento({
  almacen: almacenLocal(),
  tipos: TIPOS_DE_EVENTO,
  comunes: COMUNES_DE_EVENTO,
  redibujar: () => { void render(); },
  pintarResultado: pintarResultadoDelEvento
});
```

Después de `function pintarResultadoDeHerramienta()`:

```ts
/** Escribir un número en *Evento* pinta sólo el resultado: redibujar le sacaría el foco al campo. */
function pintarResultadoDelEvento(): void {
  const bloque = document.querySelector('#app [data-resultado]');
  if (bloque) pintarParte(bloque, resultadoEvento(calcularEvento(controlEvento.estado(), TIPOS_DE_EVENTO, COMUNES_DE_EVENTO)), 'reemplazar');
}
```

En `render`, después de `case 'conversor':`:

```ts
    case 'evento':
      return pintar(renderEvento(controlEvento.estado(), TIPOS_DE_EVENTO, COMUNES_DE_EVENTO, estadoDePantalla.compartiendo ?? undefined));
```

En `registrarAcciones({...})`, después de `herramientas: herramientas.acciones,`:

```ts
  evento: controlEvento.acciones,
```

En el oyente de `input` de `#app`, antes de `const cantidad = …closest('[data-cantidad]')`:

```ts
  const deEvento = conClosest(e.target)?.closest<HTMLInputElement | HTMLSelectElement>('[data-evento]');
  if (deEvento && vistaActual?.vista === 'evento') return controlEvento.alCambiar(deEvento, 'options' in deEvento);
```

Compartir: reemplazar `compartirLasCompras` por una función para cualquier texto solo, y sumar el del evento:

```ts
/** Un texto que se comparte solo, sin link ni PDF: la lista de compras y la del evento. */
async function compartirSoloTexto(contenido: string): Promise<void> {
  const apertura = aperturaDeCompartir;
  try {
    const r = await compartirTexto(plataformaDelNavegador(), contenido);
    return seguirCompartiendo(apertura, r === 'copiado' ? { paso: 'copiado', que: 'texto' }
      : r === 'sin-portapapeles' ? { paso: 'mostrar', que: 'texto', contenido }
      : null);
  } catch (err) {
    console.error(err);
    return seguirCompartiendo(apertura, { paso: 'mostrar', que: 'texto', contenido });
  }
}

/** La lista de compras, que se comparte sólo como texto. */
const compartirLasCompras = (): Promise<void> =>
  compartirSoloTexto(textoCompras(comprasLeidas?.lista ?? { conCantidad: [], sinCantidad: [] }));

/** La lista del evento; sin resultado no hay nada que mandar, y la ficha se cierra. */
function compartirElEvento(): Promise<void> | undefined {
  const r = calcularEvento(controlEvento.estado(), TIPOS_DE_EVENTO, COMUNES_DE_EVENTO);
  return r ? compartirSoloTexto(textoEvento(r)) : seguirCompartiendo(aperturaDeCompartir, null);
}
```

Y en `accionesDeCompartir`, junto a `'compartir-compras'`:

```ts
  'compartir-evento': () => {
    // La lista del evento se comparte sólo como texto, como la de compras.
    aperturaDeCompartir++;
    estadoDePantalla.compartiendo = { paso: 'opciones', solo: 'texto' };
    nav.abrirCapa('compartir');
    return render();
  },
  'compartir-texto': () =>
    vistaActual?.vista === 'plan-compras' ? compartirLasCompras()
      : vistaActual?.vista === 'evento' ? compartirElEvento()
      : compartirLaReceta('texto'),
```

(La línea `'compartir-texto'` reemplaza a la que estaba.)

- [ ] **Step 6: Los tests de `main`**

En `tests/main-rutas.test.ts`:

1. En `it('cada ruta dibuja su pantalla')`, sumar `['#/herramientas/evento', 'data-evento="tipo"']`.
2. En el `describe('MENU es la única fuente del menú')`, sumar `'#/herramientas/evento'` a `SIN_MENU`.
3. En el `return` de `montar()`, al lado de `tipearCantidad`, un ayudante:

```ts
      /** Escribir o elegir en un campo de *Evento*. */
      cambiarEnEvento: async (datos: Record<string, string>, valor: string, desplegable = false) => {
        const campo = { dataset: datos, value: valor, ...(desplegable ? { options: [] } : {}), closest: (sel: string) => (sel === '[data-evento]' ? campo : null) };
        for (const fn of tecleos) await fn({ target: campo });
        await esperar();
      },
```

4. Casos nuevos, al lado de los de la calculadora:

```ts
  describe('Evento', () => {
    it('escribir los adultos pinta sólo el resultado y lo guarda', async () => {
      const { abrir, cambiarEnEvento, pinturas, resultadosHerramienta, almacen } = await montar();
      await abrir('#/herramientas/evento');
      const antes = pinturas.length;
      await cambiarEnEvento({ evento: 'adultos' }, '10');
      expect(pinturas.length).toBe(antes);
      expect(resultadosHerramienta.at(-1)).toContain('data-resultado');
      expect(JSON.parse(almacen.getItem('recetario.evento') ?? '{}').adultos).toBe(10);
    });

    it('elegir el tipo redibuja con el elegido', async () => {
      const { abrir, cambiarEnEvento, pinturas, app } = await montar();
      await abrir('#/herramientas/evento');
      const antes = pinturas.length;
      await cambiarEnEvento({ evento: 'tipo' }, 'asado', true);
      expect(pinturas.length).toBe(antes + 1);
      expect(app.innerHTML).toContain('<option value="asado" selected>');
    });

    it('prender una cosa redibuja', async () => {
      const { abrir, tocar, pinturas } = await montar();
      await abrir('#/herramientas/evento');
      const antes = pinturas.length;
      await tocar('evento-alternar', { evento: 'cosa', id: 'salados', valor: '1' });
      expect(pinturas.length).toBe(antes + 1);
    });

    it('Compartir abre la ficha con sólo texto', async () => {
      const { abrir, tocar, app } = await montar();
      await abrir('#/herramientas/evento');
      await tocar('compartir-evento');
      expect(app.innerHTML).toContain('class="hoja-compartir"');
      expect(app.innerHTML).not.toContain('data-accion="compartir-link"');
    });
  });
```

Si el `tocar` de `compartir-evento` necesita la capa del historial falsa como `compartir-compras`, copiar lo que hace el test de la lista de compras (`grep -n "compartir-compras" tests/main-rutas.test.ts`).

- [ ] **Step 7: Correr los tests de main**

Run: `npx vitest run tests/main-rutas.test.ts tests/eventos-control.test.ts`
Expected: PASS.

---

### Task 9: El agente

**Files:**
- Create: `mcp/eventos.ts`
- Modify: `mcp/servidor.ts`, `skills/herramientas/SKILL.md`
- Test: `tests/mcp-eventos.test.ts`; Modify: `tests/mcp-servidor.test.ts`

**Interfaces:**
- Consumes: `estado.ts`, `evento.ts`, `TIPOS_DE_EVENTO`, `COMUNES`.
- Produces: `calcularEventoParaElAgente(p: PedidoEvento, tipos?: readonly TipoDeEvento[], comunes?: Comunes)` y `listadoDeTipos(tipos)`; la herramienta del MCP `calcular_evento`.

- [ ] **Step 1: Escribir el test que falla, `tests/mcp-eventos.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { calcularEventoParaElAgente, listadoDeTipos } from '../mcp/eventos.js';
import { calcularEvento, textoEvento } from '../src/eventos/evento.js';
import type { Ademas, Comunes, Dato, EstadoEvento, TipoDeEvento } from '../src/eventos/tipos.js';

const d = (valor: number): Dato => ({ valor, fuente: { nombre: 'F', url: 'https://f.com' } });
const COMUNES: Comunes = { factorChico: d(0.5), horas: 4 };
const HIELO: Ademas = {
  id: 'hielo', nombre: 'Hielo', datos: [{ id: 'enfriar', nombre: 'Enfriar', tipo: 'si-no', porDefecto: false }],
  calcular: (_c, v) => ({ items: [{ id: 'hielo', nombre: 'Hielo', cantidad: v['enfriar'] === true ? 'mucho' : 'poco' }], usados: [] })
};
const ASADO: TipoDeEvento = {
  id: 'asado', nombre: 'Asado',
  datos: [
    { id: 'tipo-asado', nombre: 'Tipo de asado', tipo: 'opcion', porDefecto: 'clasico', opciones: [{ valor: 'clasico', texto: 'Clásico' }, { valor: 'mixto', texto: 'Mixto' }] },
    { id: 'ocasion', nombre: 'Ocasión', tipo: 'opcion', porDefecto: 'almuerzo', opciones: [{ valor: 'almuerzo', texto: 'Almuerzo' }, { valor: 'cena', texto: 'Cena' }] }
  ],
  grupos: [{ id: 'antes', titulo: 'Para picar antes', seReparte: true }, { id: 'carne', titulo: 'Carne', seReparte: true }],
  cosas: [
    { id: 'empanadas-antes', nombre: 'Empanadas', grupo: 'antes', prendida: false, porcion: () => d(2), unidad: 'unidad' },
    { id: 'empanadas-comer', nombre: 'Empanadas', grupo: 'carne', prendida: false, porcion: () => d(5), unidad: 'unidad' },
    { id: 'tira', nombre: 'Tira de asado', grupo: 'carne', prendida: false, porcion: () => d(500), unidad: 'g' },
    { id: 'pollo', nombre: 'Pollo', grupo: 'carne', prendida: false, porcion: () => d(400), unidad: 'g' }
  ],
  ademas: [{ ademas: HIELO, prendido: true }],
  atajo: { dato: 'tipo-asado', cosas: { clasico: ['tira'], mixto: ['tira', 'pollo'] } }
};
const TIPOS = [ASADO];

describe('calcular_evento', () => {
  it('sin tipo, la lista de tipos con sus datos, sus cosas y lo que se suma', () => {
    const r = calcularEventoParaElAgente({}, TIPOS, COMUNES);
    expect(r).toEqual({ tipos: listadoDeTipos(TIPOS) });
    expect(listadoDeTipos(TIPOS)[0]?.cosas[0]).toEqual({ id: 'empanadas-antes', nombre: 'Empanadas', grupo: 'Para picar antes', prendida: false });
  });

  it('con un tipo que no existe, la lista y el error', () => {
    const r = calcularEventoParaElAgente({ tipo: 'boda' }, TIPOS, COMUNES);
    expect('tipos' in r && 'error' in r).toBe(true);
  });

  it('con lo mínimo calcula igual que la app, por nombre y sin tildes', () => {
    const r = calcularEventoParaElAgente({ tipo: 'ASADO', adultos: 10 }, TIPOS, COMUNES);
    const e: EstadoEvento = { tipo: 'asado', adultos: 10, chicos: null, horas: 4, calor: false, margen: 0, porTipo: {} };
    const app = calcularEvento(e, TIPOS, COMUNES);
    expect(r).toEqual({ ...app, texto: textoEvento(app!) });
  });

  it('el tipo de asado prende lo suyo, y prender y apagar corrigen después', () => {
    const r = calcularEventoParaElAgente({ tipo: 'asado', adultos: 10, datos: { 'tipo-asado': 'Mixto' }, apagar: ['tira'] }, TIPOS, COMUNES);
    expect('grupos' in r && r.grupos.flatMap(g => g.items.map(i => i.id))).toEqual(['pollo']);
  });

  it('un nombre que está en dos grupos pide el id; con el id, va', () => {
    const doble = calcularEventoParaElAgente({ tipo: 'asado', adultos: 10, prender: ['empanadas'] }, TIPOS, COMUNES);
    expect('error' in doble && doble.opciones).toEqual(['empanadas-antes (Empanadas)', 'empanadas-comer (Empanadas)']);
    const r = calcularEventoParaElAgente({ tipo: 'asado', adultos: 10, prender: ['empanadas-antes'] }, TIPOS, COMUNES);
    expect('grupos' in r && r.grupos[0]?.titulo).toBe('Para picar antes');
  });

  it('una cosa que no existe, o una opción que no es, devuelve el error con las opciones', () => {
    expect(calcularEventoParaElAgente({ tipo: 'asado', adultos: 10, prender: ['lechón'] }, TIPOS, COMUNES)).toMatchObject({ error: 'No hay «lechón».' });
    expect(calcularEventoParaElAgente({ tipo: 'asado', adultos: 10, datos: { ocasion: 'merienda' } }, TIPOS, COMUNES))
      .toEqual({ error: '«merienda» no es una opción de «ocasion».', opciones: ['Almuerzo', 'Cena'] });
  });

  it('lo que se suma: false lo apaga; un objeto lo prende con sus datos', () => {
    const con = calcularEventoParaElAgente({ tipo: 'asado', adultos: 10, ademas: { hielo: { enfriar: true } } }, TIPOS, COMUNES);
    expect('ademas' in con && con.ademas).toEqual([{ id: 'hielo', nombre: 'Hielo', cantidad: 'mucho' }]);
    const sin = calcularEventoParaElAgente({ tipo: 'asado', adultos: 10, ademas: { hielo: false } }, TIPOS, COMUNES);
    expect('ademas' in sin && sin.ademas).toEqual([]);
  });

  it('sin personas, dice que no hay lista', () => {
    expect(calcularEventoParaElAgente({ tipo: 'asado' }, TIPOS, COMUNES)).toEqual({ vacio: 'Sin personas, o con todo apagado, no hay lista.' });
  });

  it('con los tipos de la app, sin pasarlos, también calcula', () => {
    expect('titulo' in calcularEventoParaElAgente({ tipo: 'merienda', adultos: 10 })).toBe(true);
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `npx vitest run tests/mcp-eventos.test.ts`
Expected: FAIL, no encuentra `../mcp/eventos.js`.

- [ ] **Step 3: Escribir `mcp/eventos.ts`**

```ts
/**
 * *Evento* para el agente: la misma cuenta de la app (`src/eventos/`), con
 * los mismos tipos y números. No usa el Drive ni el login.
 *
 * El tipo es un punto de partida, como en la pantalla: lo que no se pasa
 * queda como lo trae; el tipo de asado prende lo suyo antes de que `prender`
 * y `apagar` lo corrijan.
 */
import { normalizar } from '../src/normalizar.js';
import { TIPOS_DE_EVENTO } from '../src/eventos/indice.js';
import { COMUNES } from '../src/eventos/datos/comunes.js';
import { calcularEvento, textoEvento } from '../src/eventos/evento.js';
import { MARGENES, conAdemas, conCosa, conDato, conDatoDeAdemas, conTipo, estadoInicial } from '../src/eventos/estado.js';
import type { Comunes, DatoPedido, EstadoEvento, TipoDeEvento, ValorDeDato } from '../src/eventos/tipos.js';

type ValorLibre = string | number | boolean;
export interface PedidoEvento {
  tipo?: string | undefined;
  adultos?: number | undefined;
  chicos?: number | undefined;
  horas?: number | undefined;
  calor?: boolean | undefined;
  margen?: number | undefined;
  datos?: Record<string, ValorLibre> | undefined;
  prender?: string[] | undefined;
  apagar?: string[] | undefined;
  ademas?: Record<string, false | Record<string, ValorLibre>> | undefined;
}
interface ErrorDelPedido { error: string; opciones: string[] }
const esError = (x: unknown): x is ErrorDelPedido => typeof x === 'object' && x !== null && 'error' in x;

const describirDato = (d: DatoPedido) => (d.tipo === 'opcion'
  ? { id: d.id, nombre: d.nombre, opciones: d.opciones.map(o => o.texto), por_defecto: d.opciones.find(o => o.valor === d.porDefecto)?.texto ?? d.porDefecto }
  : { id: d.id, nombre: d.nombre, tipo: d.tipo === 'numero' ? 'número' : 'sí o no', por_defecto: d.porDefecto });

export const listadoDeTipos = (tipos: readonly TipoDeEvento[]) => tipos.map(t => ({
  id: t.id, nombre: t.nombre, datos: t.datos.map(describirDato),
  cosas: t.cosas.map(c => ({ id: c.id, nombre: c.nombre, grupo: t.grupos.find(g => g.id === c.grupo)?.titulo ?? c.grupo, prendida: c.prendida })),
  ademas: t.ademas.map(a => ({ id: a.ademas.id, nombre: a.ademas.nombre, prendido: a.prendido, datos: a.ademas.datos.map(describirDato) }))
}));

/** El que coincide por id, o si no por nombre, sin tildes ni mayúsculas; tiene que ser uno solo. */
function encontrar<T extends { id: string; nombre: string }>(xs: readonly T[], texto: string): T | ErrorDelPedido {
  const q = normalizar(texto);
  const porId = xs.filter(x => normalizar(x.id) === q);
  const candidatos = porId.length ? porId : xs.filter(x => normalizar(x.nombre) === q);
  const uno = candidatos.length === 1 ? candidatos[0] : undefined;
  if (uno) return uno;
  return {
    error: candidatos.length ? `«${texto}» nombra a más de una: pasá el id.` : `No hay «${texto}».`,
    opciones: (candidatos.length ? candidatos : xs).map(x => `${x.id} (${x.nombre})`)
  };
}

/** El valor de un dato como lo pasó el agente; una opción, por su valor o por su texto. */
function valorDe(d: DatoPedido, x: ValorLibre): ValorDeDato | ErrorDelPedido {
  if (d.tipo === 'numero') return typeof x === 'number' ? x : { error: `«${d.id}» es un número.`, opciones: [] };
  if (d.tipo === 'si-no') return typeof x === 'boolean' ? x : { error: `«${d.id}» es true o false.`, opciones: [] };
  const o = d.opciones.find(op => normalizar(op.valor) === normalizar(String(x)) || normalizar(op.texto) === normalizar(String(x)));
  return o ? o.valor : { error: `«${String(x)}» no es una opción de «${d.id}».`, opciones: d.opciones.map(op => op.texto) };
}

export function calcularEventoParaElAgente(p: PedidoEvento, tipos: readonly TipoDeEvento[] = TIPOS_DE_EVENTO, comunes: Comunes = COMUNES) {
  const tipo = p.tipo === undefined ? null : encontrar(tipos, p.tipo);
  if (!tipo || esError(tipo)) return { tipos: listadoDeTipos(tipos), ...(tipo ? { error: tipo.error } : {}) };

  let e: EstadoEvento = {
    ...conTipo(estadoInicial(tipos, comunes), tipos, tipo.id),
    adultos: p.adultos ?? null, chicos: p.chicos ?? null, horas: p.horas ?? comunes.horas,
    calor: p.calor ?? false, margen: MARGENES.find(m => m === p.margen) ?? 0
  };
  for (const [id, x] of Object.entries(p.datos ?? {})) {
    const d = encontrar(tipo.datos, id);
    if (esError(d)) return d;
    const v = valorDe(d, x);
    if (esError(v)) return v;
    e = conDato(e, tipos, d.id, v);
  }
  // Después de los datos: el tipo de asado ya prendió lo suyo, y esto lo corrige.
  const alternar = (nombres: readonly string[], prendida: boolean): ErrorDelPedido | null => {
    for (const nombre of nombres) {
      const c = encontrar(tipo.cosas, nombre);
      if (esError(c)) return c;
      e = conCosa(e, tipos, c.id, prendida);
    }
    return null;
  };
  const errorAlPrender = alternar(p.prender ?? [], true) ?? alternar(p.apagar ?? [], false);
  if (errorAlPrender) return errorAlPrender;
  for (const [id, x] of Object.entries(p.ademas ?? {})) {
    const a = encontrar(tipo.ademas.map(y => y.ademas), id);
    if (esError(a)) return a;
    e = conAdemas(e, tipos, a.id, x !== false);
    if (x === false) continue;
    for (const [dato, valor] of Object.entries(x)) {
      const d = encontrar(a.datos, dato);
      if (esError(d)) return d;
      const v = valorDe(d, valor);
      if (esError(v)) return v;
      e = conDatoDeAdemas(e, tipos, a.id, d.id, v);
    }
  }
  const r = calcularEvento(e, tipos, comunes);
  return r ? { ...r, texto: textoEvento(r) } : { vacio: 'Sin personas, o con todo apagado, no hay lista.' };
}
```

- [ ] **Step 4: Registrar la herramienta en `mcp/servidor.ts`**

Import, junto a los de referencias:

```ts
import { calcularEventoParaElAgente } from './eventos.js';
import { TIPOS_DE_EVENTO } from '../src/eventos/indice.js';
import { COMUNES as COMUNES_DE_EVENTO } from '../src/eventos/datos/comunes.js';
```

Después del `for (const c of CUENTAS) {...}`:

```ts
  const valorLibre = z.union([z.string(), z.number(), z.boolean()]);
  servidor.registerTool('calcular_evento', {
    description: 'Cuánto comprar o hacer para una reunión —merienda, asado, comida, picada o cóctel—, con los tipos y los números de *Evento* de la app y sus fuentes. ' +
      'El tipo trae prendidas unas cosas y lo que se suma después (bebidas, hielo, infusiones, carbón o leña): pasá sólo lo que dijo el usuario, lo demás sale del tipo. ' +
      'Las cosas del mismo grupo se reparten la porción: con empanadas y pizza para comer, la mitad de cada una. ' +
      'Sin `tipo`, devuelve los tipos con sus datos, sus cosas y lo que se suma después, con sus id. ' +
      'Un nombre que no se encuentra, o que nombra a dos cosas, devuelve un error con las opciones. Devuelve también `texto`, la lista lista para mandar.',
    inputSchema: {
      tipo: z.string().optional().describe(`Uno de: ${TIPOS_DE_EVENTO.map(t => t.nombre).join(', ')}.`),
      adultos: z.number().optional().describe('Cuántos adultos.'),
      chicos: z.number().optional().describe('Cuántos chicos.'),
      horas: z.number().optional().describe(`Cuánto dura. Sin él, ${COMUNES_DE_EVENTO.horas}.`),
      calor: z.boolean().optional().describe('Si hace calor: sube las bebidas y el hielo.'),
      margen: z.number().optional().describe('0, 10 o 20 (%). Sin él, 0.'),
      datos: z.record(z.string(), valorLibre).optional().describe('Los datos propios del tipo, por id: { "ocasion": "cena", "tipo-asado": "completo" }.'),
      prender: z.array(z.string()).optional().describe('Cosas que van, por id o por nombre.'),
      apagar: z.array(z.string()).optional().describe('Cosas que no van, por id o por nombre.'),
      ademas: z.record(z.string(), z.union([z.literal(false), z.record(z.string(), valorLibre)])).optional()
        .describe('Lo que se suma después, por id: false lo apaga; un objeto lo prende con sus datos: { "bebidas": { "toman": 6, "fernet": true }, "hielo": false }.')
    }
  }, (pedido) => responder(() => json(calcularEventoParaElAgente(pedido))));
```

- [ ] **Step 5: El test del servidor**

En `tests/mcp-servidor.test.ts`, sumar `'calcular_evento'` a la lista ordenada de nombres (entre `'calcular_conversion'` y `'calcular_merengue'`) y cambiar el título del caso a «… y las doce cuentas» si cuenta.

- [ ] **Step 6: El skill**

En `skills/herramientas/SKILL.md`:

1. En la `description`, después de «o pasar tazas y cucharas a gramos (medidas de otro país, sticks de manteca)», sumar «, o cuánto comprar para una reunión —merienda, asado, comida, picada o cóctel—», y entre los ejemplos «¿cuánta carne compro para un asado de 15?». Verificar que la `description` no pase de 1.024 caracteres (`awk` sobre la línea, o contarla a mano).
2. En la lista de arriba, una línea: «- **Eventos:** `calcular_evento` (ver *Los eventos*).»
3. Una sección nueva, antes de `## Ejemplos`:

```markdown
## Los eventos

- **Los números salen de `calcular_evento`.** No sumes porciones por tu
  cuenta ni corrijas lo que devuelve con lo que sepas.
- **Preguntá sólo el tipo y cuántos son** —adultos y chicos— si no vinieron
  en el pedido. Lo demás sale del tipo; el usuario lo ve en la lista y pide
  cambiarlo.
- **Pasá sólo lo que dijo el usuario.** «Un asado completo para 15, a la
  noche» es `tipo: asado`, `adultos: 15`, `datos: { "tipo-asado": "completo",
  "ocasion": "cena" }`. «Sin morcilla» es `apagar: ["morcilla"]`.
- **Si devuelve `error` con `opciones`**, preguntá cuál, con las opciones. Si
  devuelve `vacio`, falta cuántos son.
- **Mostrá `texto`** tal como viene, y debajo las advertencias y las fuentes.
```

- [ ] **Step 7: Correr los tests del MCP**

Run: `npx vitest run tests/mcp-eventos.test.ts tests/mcp-servidor.test.ts tests/publicacion.test.ts`
Expected: PASS. `publicacion.test.ts` custodia que `src/` no importe de `mcp/`.

---

### Task 10: Los documentos

**Files:**
- Modify: `product-design/product/specs/E07-Herramientas.md`, `product-design/ux/information-architecture.md`, `product-design/ux/design-system.md`, `CLAUDE.md`, `BACKLOG.md`

- [ ] **Step 1: E07**

1. En **La épica**, el segundo párrafo nombra lo que hay: sumar *Evento* («Son los temporizadores, dos calculadoras, las *Referencias*, el Conversor y *Evento*»).
2. **C07.1.1**: «una lista con cinco entradas» pasa a seis, y al final de la enumeración, después del Conversor: «y **Evento** —*Cuánto comprar para una reunión*—», con «Los íconos de las tres últimas son `libro`, `medidor` e `invitados`».
3. **C07.1.2**: una línea: «`#/herramientas/evento` es *Evento* (F07.12), con el volver y el ícono delante del título.»
4. **C07.6**: en la lista de herramientas del MCP (C07.6.1 o la que enumera las doce que no usan Drive), sumar `calcular_evento` con una línea: «recibe el tipo, las personas, las horas, el calor, el margen, los datos del tipo, qué cosas prender y apagar y lo que se suma después; lo que falta sale del tipo; sin tipo, devuelve los tipos.»
5. Una feature nueva al final, antes de **Trazabilidad**:

```markdown
### F07.12 — Evento

**Evento** dice cuánto comprar o hacer para una reunión. Hay cinco tipos
—merienda, asado, comida, picada y cóctel o lunch—, cada uno con sus datos,
sus cosas por grupo y lo que se suma después: bebidas, hielo, infusiones,
carbón o leña. Un evento a la vez, guardado en el teléfono. No lee recetas
ni usa Drive, así que el velo no aparece. **La cuenta vive en `src/eventos/`
y los números en `src/eventos/datos/`**, cada uno con su fuente; ningún test
fija un valor.

#### C07.12.1 — La cuenta *(J6)*

- [ ] Para cada cosa prendida: su porción por persona —la de si fuera lo
  único de su grupo— por las personas, donde un chico cuenta por un factor
  y en la torta entero.
- [ ] **Las cosas de un grupo que se reparte llevan cada una 1/n de su
  porción**: con empanadas y pizza para comer, la mitad de cada una. Las de
  un grupo que no se reparte, la entera.
- [ ] Las horas, la ocasión y *con sobras* multiplican los grupos que dice
  cada tipo; el margen —ninguno, 10 % o 20 %— va sobre todo.
- [ ] Lo que se compra por unidad va entero y para arriba; las facturas, los
  sándwiches de miga y las empanadas, a la media docena, con las docenas
  dichas. El peso, en gramos debajo de 1 kg y en kg con un decimal; el
  volumen, en ml o en litros con un decimal; los envases, enteros.
- [ ] **Lo que se suma después:** las bebidas —el alcohol repartido entre las
  que hay, para los adultos que toman; lo sin alcohol para todos, los chicos
  por su factor; el fernet con su cola; el espumante del brindis aparte—;
  el hielo, por persona y, si se pide, por litro de bebida fría; las
  infusiones, tazas repartidas entre las que hay; el carbón o la leña, por
  kilo de carne cruda, con más si hay viento o frío.
- [ ] Un número sin fuente lleva su nota, que sale como advertencia.

**Edge case:** sin personas, o con todo apagado, no hay lista: una línea lo
dice. Horas vacías o en cero calculan con las de por defecto.

#### C07.12.2 — Los tipos *(J6)*

- [ ] **Merienda:** bocados que se reparten —facturas y medialunas,
  sándwiches de miga, salados, dulces—, por las horas y si es cumpleaños
  infantil; la torta aparte; infusiones y bebidas sin alcohol.
- [ ] **Asado:** el tipo de asado —clásico, completo, de cerdo, mixto,
  cordero o veggie— prende sus cosas y apaga las demás que nombra, como el
  tipo de pan; la carne se reparte, cada corte con sus gramos; la ocasión la
  multiplica; embutidos, achuras, provoleta, verduras, papas, ensalada y pan
  aparte; la picada antes, opcional; carbón o leña.
- [ ] **Comida:** para picar antes, para comer, acompañamiento y postre, cada
  uno se reparte entre lo suyo; el pan aparte; la ocasión y *con sobras*
  multiplican lo de comer. Las empanadas están en dos grupos.
- [ ] **Picada:** fiambres, quesos, pan, vegetales, snacks y dips, según sea
  lo que se come o vaya antes de comer.
- [ ] **Cóctel o lunch:** bocados que se reparten, por las horas.

#### C07.12.3 — La pantalla *(J6)*

- [ ] El encabezado con el volver, el ícono `invitados`, *Evento* y, a la
  derecha, Compartir: la ficha de compartir con *Texto* como única opción,
  como la lista de compras.
- [ ] Los datos (design-system §6.28): el tipo en un desplegable, adultos y
  chicos en el par de cantidades, las horas, *Hace calor*, el margen en un
  conmutador y los datos del tipo.
- [ ] Una ficha por grupo, **con su título**, y un interruptor por cosa; una
  ficha *Además* con un interruptor por lo que se suma, que prendido abre sus
  datos.
- [ ] El resultado al pie: las personas y, en el asado, la carne en kg; los
  ítems por grupo; lo que se suma; las advertencias y las fuentes.
- [ ] **Empezar de nuevo**, al final, vuelve todo a los valores por defecto.
- [ ] Escribir un número pinta sólo el resultado; un toque o un desplegable
  redibujan sin cambiar de ruta.
- [ ] Lo elegido se guarda en `localStorage` (`recetario.evento`) en cada
  cambio, con `try/catch`: el tipo, las personas, las horas, el calor, el
  margen y lo de cada tipo por separado. Lo que ya no existe se ignora o
  vuelve a su valor por defecto.
```

Y en **Trazabilidad**, si es una tabla de capacidades por job, sumar las tres.

- [ ] **Step 2: IA, design-system, CLAUDE.md y el backlog**

1. `product-design/ux/information-architecture.md`: en la tabla de rutas, después de `#/herramientas/conversor`, `#/herramientas/evento` — *Evento*, con el volver.
2. `product-design/ux/design-system.md`: en §6.28, un párrafo al final: «**Las fichas de las cosas de *Evento* llevan título** (`.ficha.datos.con-titulo`): la misma cosa —las empanadas— puede estar en dos grupos, y el título dice en cuál. Cada cosa es un interruptor.» Donde se listan los íconos (`grep -n "medidor" product-design/ux/design-system.md`), sumar `invitados` —*Evento*: dos personas, el `users` de Lucide—.
3. `CLAUDE.md`:
   - En **Lo esencial**, en el párrafo de **Herramientas**, sumar *Evento* a la lista y una oración: «*Evento* (`#/herramientas/evento`) dice cuánto comprar para una reunión: cinco tipos —merienda, asado, comida, picada, cóctel—, cada uno con sus datos, sus cosas por grupo y lo que se suma después; las cosas de un grupo se reparten la porción. La cuenta vive en `src/eventos/` y sus números en `src/eventos/datos/`, con fuente; un evento a la vez, en `localStorage`.»
   - En la tabla **Dónde está cada cosa**, fila **Dominio**: «`eventos/` (*Evento*: `tipos.ts`, `formato.ts`, `estado.ts`, `evento.ts` —la cuenta común—, `ademas.ts` —bebidas, hielo, infusiones, carbón o leña—, un archivo por tipo, `indice.ts`, `forma.ts` y `datos/`)». Fila **Controladores**: «`eventos-control.ts`: lo elegido en *Evento*, que guarda en `localStorage`». Fila **UI**: «`evento.ts` (*Evento*)».
   - Fila **MCP**: «veintiuna herramientas» pasa a «veintidós», sumar `calcular_evento` a la lista, y «`calcular_evento` vive en `eventos.ts`, sobre `src/eventos/`»; «Ninguna de las doce» pasa a «las trece».
4. `BACKLOG.md`: **P123** pasa a `Falta probar` (la fila se borra recién cuando está probada). En **P118**, el detalle queda «Tiempo de parrilla por corte; tiempo de horno por peso, corte y punto; método de la mano para medir el calor. Los tiempos por corte no coinciden entre las fuentes relevadas: hay que elegir una. Va con P119, sobre *Evento*. Ideas 185 y 187.» y el estado vuelve a `Abierto`.

- [ ] **Step 3: Revisar que los documentos no citen el plan ni el spec**

Run: `grep -rn "superpowers" product-design/ CLAUDE.md skills/ src/ mcp/`
Expected: nada nuevo.

---

### Task 11: Verificación final y el diff para el usuario

- [ ] **Step 1: Las tres en verde**

Run: `npm test && npm run typecheck && npm run build`
Expected: todo pasa. Si algo falla, arreglarlo antes de seguir; no dar el trabajo por terminado con una falla.

- [ ] **Step 2: Mostrar el diff y esperar**

Run: `git status && git diff --stat`

Mostrarle al usuario el resumen y ofrecer el diff completo. **No commitear**: el commit y el push a `main` —que es como se prueba en el teléfono— van recién con su visto bueno.
