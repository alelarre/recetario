# Convertir un borrador con Claude — diseño

**Fecha:** 2026-09-16
**Estado:** Implementado.
**Resuelve:** `product-design/plan/BACKLOG.md` P28 — que un agente convierta un borrador en
receta.

---

## 1. Qué cambia

La app no llama a ningún modelo. Arma el pedido, se lo pasa a Claude, y recibe de vuelta la
receta en `.md` para revisarla y guardarla:

1. En un borrador, **«Convertir con Claude»** manda a Claude un pedido con el borrador y las
   reglas del formato.
2. Claude lee la fuente y responde **sólo con el `.md`** de la receta.
3. Esa respuesta **vuelve a la app** compartiéndola (Android) o pegándola.
4. Se abre **el editor con la receta cargada**. Se revisa, se elige la categoría y se guarda:
   `convertirBorrador` escribe el `.md`, la fila del índice, y borra el borrador.

La vuelta no depende de la ida: **cualquier receta en `.md` que llegue a la app abre el
editor**, empiece donde empiece la conversación.

## 2. La ida

### 2.1 El botón

En la pantalla del borrador, **«Convertir con Claude»**, junto a «Crear la receta», que no
cambia.

### 2.2 El pedido

`pedidoDeConversion(borrador)` lo arma desde las mismas constantes que usa la app
(`DURACIONES`, `DIFICULTADES`, `TAGS_RESERVADOS`, las claves del frontmatter), así no se
desactualiza cuando cambia el esquema. Lleva, en este orden:

1. **La tarea:** leer la fuente del borrador y escribir la receta en el formato del
   Recetario.
2. **El borrador:** título, fuente y nota, tal cual.
3. **El formato:**
   - frontmatter entre `---`, con estas claves y ninguna otra: `titulo` (obligatoria),
     `tags` como lista `[a, b]`, `rinde`, `tiempo`, `dificultad`, `fuente`, `foto`;
   - `tiempo` es uno de los cinco valores, tal cual, y cuenta el tiempo hasta comer, con
     reposo y horno; si la fuente no lo dice, no va;
   - `dificultad` es uno de los tres valores, o no va;
   - en `tags` no van los reservados;
   - `borrador: <id>` como última línea del frontmatter;
   - después del frontmatter, una descripción opcional y las secciones `## Ingredientes`,
     `## Preparación`, `## Variaciones` y `## Notas`, las que haya;
   - un ingrediente por línea: `- nombre — cantidad`; los `###` agrupan ingredientes o
     tramos de la preparación;
   - la preparación en pasos numerados.
4. **Lo que no se hace:** inventar temperaturas, tiempos o cantidades que la fuente no dice;
   agregar datos nutricionales.
5. **La salida:** sólo el `.md`, sin texto antes ni después y sin bloque de código, para
   poder compartirlo entero.

La categoría no viaja: se elige en el editor.

### 2.3 Cómo sale

- **Con el menú Compartir del sistema** (`navigator.share`, Android): se abre con el pedido
  como texto, y se elige Claude.
- **Sin él** (Chrome en la Mac): se abre `https://claude.ai/new?q=<pedido codificado>` si
  el link entra en **8.000 caracteres**. Si no entra, el pedido se copia al portapapeles, se
  abre `https://claude.ai/new` y aparece el aviso «Pedido copiado: pegalo en Claude».

## 3. La vuelta

### 3.1 Reconocer una receta

`esRecetaEnMd(texto)`: sin espacios al principio, el texto empieza con `---`, tiene un
cierre `---`, y entre los dos hay una línea `titulo:`. Cualquier otra cosa no es una
receta.

### 3.2 Por Compartir

Lo que llega por el Share Target a `#/capturar`:

- **No es una receta:** se captura como borrador, igual que hoy.
- **Es una receta con `borrador: <id>` de un borrador que existe:** abre el editor atado a
  ese borrador, con la receta cargada.
- **Es una receta sin id, o con un id que no existe:** abre **«¿De qué borrador es esta
  receta?»**: la lista de borradores por título y **«Ninguno»**. Elegir un borrador abre el
  editor atado a él; «Ninguno» lo abre como receta nueva. Volver descarta lo recibido.

### 3.3 Pegando

**«Pegar receta»** lee el portapapeles (`navigator.clipboard.readText`):

- **En la pantalla del borrador:** abre el editor atado a ese borrador, aunque el texto
  traiga otro id.
- **En la pantalla de Borradores:** hace lo mismo que Compartir: el id si lo trae y existe;
  si no, la pregunta.
- **Lo pegado no es una receta:** aviso «Lo copiado no es una receta en .md.», y no abre
  nada.
- **El navegador no deja leer el portapapeles:** aviso «No pude leer lo copiado.», y no abre
  nada.

### 3.4 El editor con la receta cargada

- La receta llega pasada por `parse`: lo que no respeta el formato se trata como siempre
  —un tiempo inválido queda sin duración, una clave desconocida se conserva—.
- **La clave `borrador` se saca** de la receta antes de dibujar el editor: no se muestra y
  no se guarda.
- La categoría queda sin elegir y la receta lleva `incompleta`, como toda receta nueva.
- **Cuenta como cambios sin guardar desde que se abre:** salir pregunta «¿Salir sin guardar
  los cambios?».
- **Guardar:** atada a un borrador, `convertirBorrador`; sin borrador, se crea como
  cualquier receta nueva.

## 4. Arquitectura

| Archivo | Qué cambia |
|---|---|
| `src/conversion.ts` (nuevo) | `pedidoDeConversion`, `esRecetaEnMd`, `idDeBorrador` (lee y saca la clave `borrador` de una receta parseada) |
| `src/ui/borradores.ts` | «Convertir con Claude» y «Pegar receta» en el borrador; «Pegar receta» en Borradores; la pantalla «¿De qué borrador es esta receta?» |
| `src/compartir.ts` | Abrir el menú Compartir con un texto, o el link a Claude, o el portapapeles |
| `src/main.ts` | Las acciones, la receta recibida en memoria, la ruta de la pregunta, y el editor con la receta cargada |
| `src/ui/router.ts` | La ruta de la pregunta |
| `skills/recetario/SKILL.md` | Una línea: la receta también se puede compartir a la app, que la guarda (P14) |

## 5. Tests

- `pedidoDeConversion` lleva título, fuente, nota, el id, los cinco valores de duración, las
  tres dificultades y los tags reservados.
- `esRecetaEnMd` reconoce una receta, y rechaza un link, un texto suelto, un frontmatter sin
  `titulo` y uno sin cierre.
- `idDeBorrador` devuelve el id y saca la clave.
- Sin `navigator.share`: un pedido corto abre el link con `q`; uno largo copia y avisa.
- Compartir una receta con id válido abre el editor atado; con id inexistente o sin id,
  abre la pregunta; «Ninguno» abre receta nueva.
- Compartir algo que no es receta sigue abriendo la captura.
- «Pegar receta» en el borrador ata a ese borrador; en Borradores sigue la regla del id; lo
  pegado que no es receta y el portapapeles bloqueado avisan.
- El editor con la receta cargada no muestra `borrador`, y pregunta al salir.
- Guardar atado a un borrador llama a `convertirBorrador`.

## 6. Verificación

1. **Android, de punta a punta:** en un borrador real, «Convertir con Claude», compartir la
   respuesta a Recetario, revisar, elegir categoría, guardar; el borrador desaparece.
2. **Mac:** «Convertir con Claude» abre claude.ai con el pedido; copiar la respuesta y
   «Pegar receta» en el borrador.
3. **Desde Claude, sin borrador:** pedir una receta con el formato, compartirla, elegir
   «Ninguno» y guardar.
4. **Una receta larga** llega entera por Compartir, con los saltos de línea.

## 7. Documentos que cambian

- **`decision-log.md`:** una fila con la conversión por Claude sin modelo en la app.
- **`BACKLOG.md`:** P28 resuelto; P14 suma que el skill ya no necesita escribir en Drive:
  le alcanza con producir el `.md` y compartirlo.
- **`E01-CapturaYBorradores.md`:** los dos botones, la
  pregunta y la captura que reconoce recetas.
- **`CLAUDE.md`:** el bloque de lo hecho, y P28 sale de pendientes.

## 8. Fuera de alcance

- Que Claude sugiera la categoría.
- Llamar a un modelo desde la app.
- Rehacer el skill del agente (P14).
