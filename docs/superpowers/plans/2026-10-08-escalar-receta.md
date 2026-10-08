# Escalar una receta — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un multiplicador en la receta —chips ×½ ×1 ×2 ×3 y, si el rinde empieza con un número, un campo con ese número seguido del resto del rinde— que escala lo que se muestra de los ingredientes y del rinde, en la receta y en su modo cocina.

**Architecture:** Un módulo puro, `src/escalar.ts`, lee el número del principio de una cantidad, lo escala y lo vuelve a escribir. La UI de la receta (`fichas-receta.ts`, `receta.ts`, `cocina.ts`) recibe un `factor` y dibuja con él. `main.ts` guarda `{ id, factor }` entre la receta y su modo cocina, y lo vuelve a ×1 al llegar a otra receta o al abrirla de nuevo.

**Tech Stack:** TypeScript estricto, vitest con el DOM escrito a mano.

**Spec:** `docs/superpowers/specs/2026-10-08-escalar-receta-design.md`

## Global Constraints

- Español rioplatense en UI, comentarios, tests y commits.
- El `.md` no se toca: escalar cambia sólo lo que se muestra.
- Textos: chips «×½», «×1», «×2», «×3»; campo del rinde con `aria-label` «Rinde» y el resto del rinde a su derecha; título «Ingredientes ×2» (con ×1, «Ingredientes»); aviso «Los pasos no cambian: sus cantidades son las de la receta».
- Escribir en el campo del rinde no redibuja la pantalla: pinta sólo los bloques que cambian (`pintarParte`).
- `npm test`, `npm run typecheck` y `npm run build` en verde al cerrar cada tarea.

## Review Focus

1. Escribir en el campo del rinde deja el foco y el teclado en el campo. Test en Tarea 3.
2. Una cantidad con imagen o link en línea (`1 taza ![](foto:2)`) conserva lo que sigue al número. Test en Tarea 1.
3. Volver del modo cocina a la receta conserva el multiplicador; llegar a otra receta lo vuelve a ×1. Test en Tarea 3.
4. Un rinde sin número al principio («para la familia») no muestra el campo; «1 molde de 24 cm» lo muestra con «molde de 24 cm» al lado. Test en Tarea 1 (`porcionesDe`) y 2.
5. La vista de invitado sigue igual. Test en Tarea 2.

---

### Tarea 1: `src/escalar.ts`

**Files:** Create `src/escalar.ts`; Test `tests/escalar.test.ts`.

**Produces:**
- `escribirNumero(n: number): string` — ≥10 entero; <10, entero o fracción común (½ ¼ ¾ ⅓ ⅔, sola o tras un entero) si está a menos de 0,05; si no, un decimal con coma.
- `escalarCantidad(cantidad: string, factor: number): string` — escala el número o el rango del principio; el resto, igual. Con `factor === 1`, devuelve la cantidad sin tocar.
- `porcionesDe(rinde: string | null): number | null` — el número del principio del rinde, o `null`.
- `restoDelRinde(rinde: string): string` — lo que sigue al número: «porciones», «molde de 24 cm».
- `const MULTIPLICADORES = [0.5, 1, 2, 3] as const`.

- [ ] **Paso 1: tests que fallan**

```ts
import { describe, it, expect } from 'vitest';
import { escalarCantidad, escribirNumero, porcionesDe } from '../src/escalar.js';

describe('escribir un número', () => {
  it('de 10 para arriba, entero', () => expect([10, 187.5, 1000.4].map(escribirNumero)).toEqual(['10', '188', '1000']));
  it('debajo de 10, entero o fracción común si está cerca', () =>
    expect([3, 1.5, 0.75, 0.333, 2.667, 2.25, 2.98].map(escribirNumero)).toEqual(['3', '1½', '¾', '⅓', '2⅔', '2¼', '3']));
  it('si no, un decimal con coma', () => expect([2.4, 0.6, 7.1].map(escribirNumero)).toEqual(['2,4', '0,6', '7,1']));
});

describe('escalar una cantidad', () => {
  const x2 = (c: string) => escalarCantidad(c, 2);
  it('enteros y decimales, con coma o punto', () => expect(['250 g', '1,5 l', '0.75 taza'].map(x2)).toEqual(['500 g', '3 l', '1½ taza']));
  it('fracciones y mixtos', () => expect(['½ taza', '¾', '1/2 cebolla', '1½ tazas', '1 ½ taza', '1 1/2 taza'].map(x2))
    .toEqual(['1 taza', '1½', '1 cebolla', '3 tazas', '3 taza', '3 taza']));
  it('un rango escala los dos extremos', () => expect(['2-3 dientes', '2–3', '2 a 3 cdas'].map(x2)).toEqual(['4-6 dientes', '4–6', '4 a 6 cdas']));
  it('la nota y lo que sigue quedan igual', () => expect(x2('1 kg (800 g si es de lata)')).toBe('2 kg (800 g si es de lata)'));
  it('lo que no empieza con número queda igual', () => expect(['a gusto', 'c/n', 'una pizca', 'media taza'].map(x2)).toEqual(['a gusto', 'c/n', 'una pizca', 'media taza']));
  it('una imagen en línea después del número queda igual', () => expect(x2('1 taza ![](foto:2)')).toBe('2 taza ![](foto:2)'));
  it('por ½', () => expect(escalarCantidad('3 huevos', 0.5)).toBe('1½ huevos'));
  it('por 1, sin tocar', () => expect(escalarCantidad('1.50 g', 1)).toBe('1.50 g'));
});

describe('las porciones del rinde', () => {
  it('el número del principio', () => expect(['4 porciones', '12 empanadas', '1½ litros'].map(porcionesDe)).toEqual([4, 12, 1.5]));
  it('cualquier rinde que empiece con número', () => expect(porcionesDe('1 molde de 24 cm')).toBe(1));
  it('sin número, nada', () => expect(['para la familia', '', null].map(porcionesDe)).toEqual([null, null, null]));
});
```

- [ ] **Paso 2:** `npx vitest run tests/escalar.test.ts` → FAIL (no existe el módulo).
- [ ] **Paso 3: implementar.** Un solo patrón para el número del principio: `^(\d+(?:[.,]\d+)?)?\s*(?:([½¼¾⅓⅔⅛])|(\d+)\/(\d+))?` (entero o decimal, y una fracción unicode o `a/b`, juntos o separados por espacio), con la condición de que haya leído algo. Un rango es ese número, `\s*(?:-|–|a)\s*`, y otro. `escribirNumero` busca la fracción más cercana entre `{0, ¼, ⅓, ½, ⅔, ¾, 1}` sobre la parte decimal.
- [ ] **Paso 4:** pasa; suite y typecheck en verde.
- [ ] **Paso 5:** commit «Escalar: leer, escalar y escribir una cantidad».

### Tarea 2: la receta y el modo cocina con un factor

**Files:** Modify `src/ui/fichas-receta.ts`, `src/ui/receta.ts`, `src/ui/cocina.ts`; Test `tests/vista-receta.test.ts`, `tests/vista-cocina.test.ts`.

**Produces:**
- `listaIngredientes(grupos, factor = 1)` — cada cantidad con `escalarCantidad`.
- `fichasDelCuerpo(receta, { alPieDeIngredientes, factor = 1, antesDeIngredientes = '' })` — la ficha de ingredientes lleva el título «Ingredientes» o «Ingredientes ×N» (`<span data-titulo-ingredientes>`), `antesDeIngredientes` arriba de la lista y la lista en `<div data-ingredientes>`.
- `tituloIngredientes(factor): string` — «Ingredientes», «Ingredientes ×2», «Ingredientes ×1,5», «Ingredientes ×½».
- `controlesEscala(factor, rinde): string` — `<div class="escala">` con los chips en `<span data-escala-chips>` (`<button class="chip[ act]" data-accion="escalar" data-factor="0.5">×½</button>`…), el campo `<input type="number" inputmode="decimal" min="0" step="any" data-porciones aria-label="Rinde" value="…">` seguido de `restoDelRinde(rinde)`, sólo si `porcionesDe(rinde)`, y `<p class="aviso-escala" data-escala-aviso>` con el aviso si el factor no es 1 (vacío si es 1).
- `rindeEscalado(rinde, factor)` — `escalarCantidad(rinde, factor)`.
- `renderReceta({ …, factor = 1 })`: la cabecera con el rinde escalado en `<span data-rinde>`, y `fichasDelCuerpo` con `factor` y `antesDeIngredientes: controlesEscala(...)`.
- `renderCocina({ …, factor = 1 })`: `listaIngredientes(grupos, factor)` y el rótulo del conmutador con `tituloIngredientes(factor)`.

- [ ] **Paso 1: tests que fallan** (receta armada en el test con `parse`):
  - con `factor: 2`, «250 g» se ve «500 g», el título «Ingredientes ×2», el rinde «8 porciones», el chip ×2 con `act` y el aviso;
  - con ×1 no hay aviso y el título es «Ingredientes»;
  - con rinde «4 porciones» está `data-porciones` con `value="4"` y «porciones» al lado (y con ×1,5, `value="6"`); con «1 molde de 24 cm», `value="1"` y «molde de 24 cm»; con «para la familia» o sin rinde, no hay campo;
  - una receta sin ingredientes no tiene chips;
  - el modo cocina con `factor: 2` muestra «500 g» y el rótulo «Ingredientes ×2»;
  - la vista de invitado (`fichasDelCuerpo` sin factor) no tiene chips ni aviso.
- [ ] **Paso 2:** FAIL.
- [ ] **Paso 3:** implementar lo de *Produces*.
- [ ] **Paso 4:** pasa; suite y typecheck.
- [ ] **Paso 5:** commit «Escalar: la receta y el modo cocina con un multiplicador».

### Tarea 3: el cableado

**Files:** Modify `src/main.ts`, `src/ui/base.css`; Test `tests/main-rutas.test.ts`.

- [ ] **Paso 1: tests que fallan:**
  - abrir una receta: ×1; tocar `escalar` con `factor: '2'` redibuja con «Ingredientes ×2»;
  - pasar al modo cocina (`#/r/<id>/cocinar`) muestra las cantidades ×2; volver (`history.back`, llegada conocida) sigue en ×2;
  - abrir otra receta vuelve a ×1; volver a abrir la misma desde un link (llegada nueva) también;
  - escribir 6 en `[data-porciones]` con rinde 4 no redibuja y pinta sólo `[data-ingredientes]`, `[data-escala-chips]`, `[data-escala-aviso]`, `[data-titulo-ingredientes]` y `[data-rinde]`; un valor vacío o 0 no pinta nada.
- [ ] **Paso 2:** FAIL.
- [ ] **Paso 3: implementar.** En `main.ts`, `let escala: { id: string; factor: number } | null = null` con su motivo («sobrevive entre la receta y su modo cocina»). En `case 'receta'`, si `llegada === 'nueva'` o `escala?.id !== id`, `escala = { id, factor: 1 }`; pasa `factor: escala.factor`. En `case 'cocinar'`, `factor: escala?.id === id ? escala.factor : 1`. Acción `escalar` en `accionesDeLaReceta`: fija el factor y redibuja. En el listener de `input`, `[data-porciones]` en la vista `receta`: con un número > 0 y el rinde con número, fija `factor = n / porciones` y pinta los cinco bloques con `pintarParte`. CSS: `.escala` (fila con los chips y el campo, `--e-2` de separación, el campo de 72 px), `.aviso-escala` (`--txt-chico`, `--fg-2`).
- [ ] **Paso 4:** pasa; suite, typecheck y build.
- [ ] **Paso 5:** commit «Escalar: el multiplicador en la receta».

### Tarea 4: los documentos

- [ ] C05.1.3 en `E05-Cimientos.md`: la cantidad no se parsea para guardar; para escalar se lee sólo el número del principio, y lo escalado no vuelve al `.md`.
- [ ] La capacidad nueva —el multiplicador— en la épica de la receta (`product-design/product/specs/`, la que tiene la lectura y el modo cocina), con lo del spec.
- [ ] `design-system.md`: la fila `.escala` y el aviso; `information-architecture.md`: la receta y el modo cocina; `CLAUDE.md` si nombra algo de esto.
- [ ] Suite en verde; commit «Escalar: los documentos».

## Al cerrar

Revisión de la rama, diff al usuario antes de `main`, P107 a `Falta probar`, se borran spec y plan.
