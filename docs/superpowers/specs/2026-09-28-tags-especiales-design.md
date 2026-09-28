# `tags_especiales` en el frontmatter

Los cuatro tags especiales —`favorito`, `menú diario`, `probar` y `borrador`—
dejan la lista `tags` y pasan a una clave propia, `tags_especiales`. `tags`
queda sólo con los tags comunes. El comportamiento de cada especial se declara
en una tabla, una definición por especial, y el resto del código la consulta
en vez de preguntar por nombre.

Lo que se ve no cambia: los especiales siguen en la fila de chips, primero y en
su orden, con su ícono; `borrador` sigue sin presentación propia. Separar la
fila de chips en dos es otra entrada (P109). Las marcas de las calculadoras
(`pan`, `fermentado`) entran con P106, que espera por esta.

## 1. El formato

- **Clave nueva `tags_especiales`**, con la sintaxis de lista de `tags`,
  escrita justo después de `tags`. Vacía, no se escribe. El frontmatter pasa a
  tener ocho claves.

  ```yaml
  tags: [horno, pollo]
  tags_especiales: [favorito, borrador]
  ```

- **Lista cerrada:** `favorito`, `menú diario`, `probar` y `borrador`. Se
  reconocen sin mirar mayúsculas ni tildes y se escriben siempre en la forma
  canónica. Un valor que no es de la lista se lee como ausente. Adentro no hay
  formas alternativas: `favoritas` no es `favorito`.
- **`tags` no lleva especiales.** Un tag reservado dentro de `tags` —un
  especial, una de las formas de la tabla (`favoritas`, `borradores`,
  `incompleta`…) o `terminado` y sus formas— se ignora al leer: no aparece
  como tag común.
- **`incompleta` y sus formas dejan de leerse como `borrador`.** Quedan sólo
  como reservadas, para que no se escriban a mano. Se borran de la
  documentación, los comentarios y los tests todas las menciones que las
  tratan como `borrador`.
- **Migración:** los `.md` que ya existen los migra el usuario, por fuera de
  este trabajo. Hasta migrar, un `.md` con especiales en `tags` se ve sin
  ellos. No hay código de migración ni lectura de compatibilidad.

### Una sola declaración de las claves

Hoy las claves están repartidas: `CLAVES` en `recipe.ts` (sin `tags`, que
tiene su `if`), el tipo `Receta`, el aviso de clave desconocida de
`validar.ts` y el texto de la regla en `conversion.ts`, escrito a mano.

Pasa a haber una declaración en `recipe.ts`: cada clave con su forma, en el
orden en que se escriben.

```ts
export const CLAVES_FRONTMATTER = [
  { clave: 'titulo', forma: 'texto' },
  { clave: 'tags', forma: 'lista' },
  { clave: 'tags_especiales', forma: 'lista' },
  { clave: 'rinde', forma: 'texto' },
  { clave: 'tiempo', forma: 'texto' },
  { clave: 'dificultad', forma: 'texto' },
  { clave: 'fuente', forma: 'texto' },
  { clave: 'foto', forma: 'texto' }
] as const;
```

- `parse` y `serialize` recorren la declaración en vez de tener un `if` por
  clave; las claves ajenas (`extras`) se siguen escribiendo al final.
  `tags_especiales` además pasa por la lista cerrada al leer.
- `validar` avisa una clave desconocida contra `CLAVES_FRONTMATTER`.
- La regla del frontmatter de `conversion.ts` se arma desde la declaración.
  El pedido de *Convertir con Agente* la arma sin `tags_especiales` (§4).

## 2. Dominio e índice

- **Tipos:** `Receta` y `Entrada` ganan `tags_especiales: TagEspecial[]`. En
  la receta parseada siempre está, vacía si no hay.
- **Lo que no se lee queda anotado.** `Receta` gana `ignorados`: cada valor de
  `tags` o de `tags_especiales` que el parser descartó, con su clave. No se
  escribe al guardar; es lo que `validar` informa (§4).
- **Índice:** columna nueva `tags_especiales`, unida con barra como `tags`.
  `SCHEMA_VERSION` pasa de 7 a 8: la app reindexa sola al próximo arranque.
  Lo prolijo es migrar los `.md` antes de abrir la app nueva, o reindexar a
  mano después de migrar.

### La tabla de especiales (`especiales.ts`)

La tabla vive en un módulo propio, `src/especiales.ts`, porque la usa el
parser: `recipe.ts` no puede importar `catalogo.ts`, que ya importa de
`recipe.ts`. Por lo mismo, `normalizar` pasa a `src/normalizar.ts`, y
`recipe.ts` lo reexporta. `catalogo.ts` reexporta lo de `especiales.ts`, así
los que ya importan de ahí no cambian.

Un objeto por especial, todos con la misma interfaz, en un arreglo cuyo orden
es el de cualquier fila de tags:

```ts
export interface DefinicionEspecial {
  nombre: TagEspecial;             // la forma canónica, la que se escribe
  reservadas: readonly string[];   // otras formas que no se escriben a mano en `tags`
  icono: NombreIcono | null;       // la clave en `iconos.ts`; el dominio no importa la UI
  etiquetaMarca: string | null;    // cómo dice la marca de la tarjeta lo que es
  enChips: boolean;                // se ofrece en la fila de chips de las listas
  enReceta: boolean;               // se muestra en la receta y en la tarjeta
  enBusqueda: boolean;             // la búsqueda por texto lo encuentra
  etiquetaEditor: string;          // el texto de su botón en el editor
}
```

| | ícono | marca | chips | receta y tarjeta | búsqueda | reservadas |
|---|---|---|---|---|---|---|
| `favorito` | estrella | Favorita | sí | sí | no | favorita, favoritos, favoritas |
| `menú diario` | calendario | Menú diario | sí | sí | no | — |
| `probar` | marcador | Para probar | sí | sí | no | — |
| `borrador` | — | — | no | no | no | borradores, incompleta, incompleto, incompletos, incompletas |

- `TAGS_ESPECIALES` y el tipo `TagEspecial` salen de la tabla.
- `terminado`, `terminada`, `terminados` y `terminadas` no son un especial:
  van en una lista aparte de reservadas, porque contradicen a `borrador`.
- `TAGS_RESERVADOS` junta los nombres, las `reservadas` de la tabla y las de
  `terminado`. Se borra `FORMAS_ALTERNATIVAS`.
- `tagEspecial(valor)` reconoce sólo el nombre canónico, sin mirar mayúsculas
  ni tildes.
- `tieneEspecial`, `esFavorita` y `conEspecial` pasan a trabajar sobre
  `tags_especiales`. `conEspecial` devuelve la lista en el orden de la tabla.
- `NombreIcono` es una unión de cadenas declarada en `especiales.ts`
  (`'estrella' | 'calendario' | 'marcador'`), para que el dominio no importe
  la UI; un test verifica que cada `icono` de la tabla exista en `ICO`.

## 3. La app

### Filtros, listas y búsqueda (`store.ts`)

- **Un filtro sigue siendo un nombre suelto.** Un especial ya no puede ser un
  tag común, así que el store decide dónde mirar: si el nombre es un especial,
  en `tags_especiales`; si no, en `tags`. Las listas, el carrusel, la ruta
  `#/t/<tag>`, Borradores (`buscar({ tags: ['borrador'] })`) y *Menú diario*
  del plan no cambian. `coincideTag` pierde las formas alternativas.
- **`tagsDe`** cuenta los especiales con `enChips` desde `tags_especiales` y
  los comunes desde `tags`. `borrador` queda afuera por su `enChips`, sin un
  `if` por nombre. Los alcances (`recetas`, `borradores`, `todas`) no cambian.
- **`buscarPorTexto`** recorre sólo `tags`: ningún especial tiene
  `enBusqueda`. Los borradores siguen fuera de toda búsqueda.

### Editor

- La fila de botones especiales se arma desde la tabla, con `etiquetaEditor` e
  `icono`, y escribe su propio `hidden`, `tags_especiales`, separado del de
  `tags`. `borrador` sigue apretado y deshabilitado mientras falte lo mínimo, y
  «Convertir con Agente» se muestra según ese botón, como hoy.
- Las pills y las sugerencias sólo manejan tags comunes. Escribir un reservado
  a mano da el aviso de hoy.
- «Cambios sin guardar» compara también `tags_especiales`.

### Receta, tarjeta y chips

- La receta muestra como chips los especiales con `enReceta`, menos
  `favorito`, que es la estrella del encabezado, y después los tags comunes.
- La estrella pone y saca `favorito` en `tags_especiales`.
- Las marcas de la tarjeta son los especiales con `enReceta` e `icono`, en el
  orden de la tabla, con `etiquetaMarca` en el `aria-label` y el `title`. Se
  borran `NOMBRE_DE_MARCA` y `CON_MARCA`.
- `iconoDeTag` consulta la tabla.

### Compartir

- El link de invitado vacía `tags_especiales` como ya vacía `tags`. El texto y
  el PDF no muestran tags y no cambian.

### Convertir con Agente y Pegar

- El pedido no menciona `tags_especiales`: los especiales son del usuario, no
  del contenido de la receta. Si la respuesta los trae, se ignoran.
- `aplicarPegada` conserva los especiales que tenía el editor, menos
  `borrador`, y pone `borrador` sólo si no hay categoría. Hoy pegar pisa
  `tags` y pierde `favorito`; con esto no.

## 4. MCP y skill

- **`formato`:** las reglas del MCP suman `tags_especiales` como lista cerrada
  de los cuatro. La regla de `borrador` dice que va en `tags_especiales`. Las
  reglas del frontmatter salen de la declaración única: la del MCP con
  `tags_especiales`, la del pedido sin. La regla de reservados en `tags` es la
  misma para los dos, sin la excepción de `borrador` que hoy tiene el MCP.
- **`validar`, `crear` y `guardar`:** un reservado en `tags` es **error**, y
  también un valor de `tags_especiales` que no es de la lista. Con error no se
  escribe.
- **`leer`** devuelve el `.md` tal cual: el agente ve `tags_especiales` y al
  corregir lo conserva o lo cambia.
- **`buscar` y `tags`** van por el store: filtrar por `favorito` o `borrador`
  sigue igual, y `tags` cuenta los especiales con `enChips` como hoy.
- **Fotos pedidas:** «una foto `fuente` se sube sólo si la receta es
  borrador» mira `tags_especiales`, por `tieneEspecial`.
- **`SKILL.md`:** «el tag `borrador`» pasa a ser «`borrador` en
  `tags_especiales`». *Ordenar* aclara que los especiales no se unifican ni se
  tocan salvo que el usuario lo pida.

## 5. Documentos y tests

- **`CLAUDE.md`:** ocho claves en el frontmatter; «Cuatro tags especiales»
  describe `tags_especiales` y la tabla, sin formas alternativas ni
  `incompleta`. La línea de «No proponer» sobre claves nuevas queda.
- **`product-design/`:** E05 C05.1.4 se reescribe (los especiales viven en
  `tags_especiales`, lista cerrada, sin formas alternativas, con columna en el
  índice); se actualizan las menciones en E01, E02, E03, E04, E06, la IA
  (§ de tags especiales), `user-flows.md`, `design-system.md` y
  `brand-identity.md` donde tratan a los especiales como valores de `tags` o a
  `incompleta` como `borrador`. Los mockups y wireframes no se tocan.
- **Tests:** se ajustan `catalogo`, `recipe`, `validar`, `store`,
  `conversion`, el editor, `componentes`, `link-receta` y los del MCP. Se
  suman:
  - uno por fila de la tabla: ícono, marca, chips, receta y búsqueda;
  - lectura: especial en `tags` ignorado, valor fuera de la lista ignorado,
    mayúsculas y tildes normalizadas, `incompleta` que no es `borrador`;
  - escritura: `tags_especiales` después de `tags`, en orden canónico, y sin
    escribirse si está vacía;
  - el índice con la columna nueva, ida y vuelta;
  - `aplicarPegada` conserva `favorito` y resuelve `borrador` por categoría.
