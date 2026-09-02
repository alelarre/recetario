---
name: recetario
description: Use when the user wants to save a recipe into their Google Drive recipe collection from any source — a website, a PDF, a photo of a cookbook page, a video, or pasted text — or wants to edit, complete, or fix a recipe already saved there.
---

# Recetario

Convierte una fuente cualquiera en un archivo `.md` dentro de `Recetario/` en Google
Drive. **El archivo es el dato real y sobrevive a cualquier app que lo lea**, así que
el esquema de abajo es un contrato: lo que no está acá no se inventa.

Este documento es autosuficiente a propósito. Funciona igual desde el celular y desde
la computadora, y no depende de tener a mano ningún otro archivo.

## Nada se sube sin que la persona lo vea primero

**Mostrar el `.md` completo y esperar aprobación explícita antes de escribir en
Drive.** No un resumen ni una descripción de lo que hiciste: el archivo entero, tal
como quedaría, con su frontmatter y su cuerpo. Después decir en qué carpeta iría, con
qué nombre, y qué se dejó afuera de la fuente. Recién cuando la persona dice que sí,
se sube.

Corregir un `.md` que ya está en Drive es más caro que revisar un borrador: hay que
encontrarlo, releerlo entero y reescribirlo. Un archivo mal subido además ensucia el
índice de la app hasta que alguien lo note.

| Excusa | Realidad |
|---|---|
| "Me pidió que la guarde, guardar significa subirla" | Pidió tener la receta bien guardada. Un borrador aprobado en diez segundos es más rápido que corregir un archivo subido. |
| "La fuente era clarísima, no hay nada que revisar" | Lo que revisa la persona no es tu lectura de la fuente: es la carpeta, el título y qué dejaste afuera. Nada de eso está en la fuente. |
| "La subo y después la corrijo si hace falta" | La corrección es una segunda escritura sobre un archivo que ya entró al índice. Mostrar primero cuesta un mensaje. |
| "Me dijo que confía en mi criterio" | La confianza es sobre el contenido, no una autorización para saltear la revisión. Mostrás igual. |
| "Es una sola receta, no vale la pena la ceremonia" | Mostrar el borrador es un mensaje, no una ceremonia. |
| "Ya la aprobó cuando pidió guardarla" | Aprobó la intención, no el resultado: todavía no vio el archivo. |
| "Son diez recetas de un PDF, mostrar cada una es tedioso" | Mostrá la primera y acordá el criterio; después mostrá la lista completa antes de subir el lote. |

Vale igual para editar: se muestra cómo va a quedar antes de escribir.

## Procedimiento

1. **Leer la fuente entera**, según su tipo (ver más abajo).
2. **Elegir la carpeta.** Listar las subcarpetas de `Recetario/` en Drive y elegir
   entre esas, nunca de memoria. Si ninguna corresponde con claridad, dejar el
   archivo en la raíz de `Recetario/`: la raíz es la bandeja de entrada.
3. **Escribir el `.md`** con el esquema de abajo.
4. **Mostrarlo entero y esperar el visto bueno.** Corregir lo que digan, mostrar de
   nuevo, y así hasta que esté.
5. **Subirlo como `text/markdown`**, no como documento de Google. Si la herramienta
   convierte a formato nativo por defecto, desactivar esa conversión.
6. **Confirmar dónde quedó**: carpeta y nombre del archivo.

## El esquema

### Frontmatter

Estas seis claves y ninguna más. **Solo `titulo` es obligatorio.**

| clave | valores |
|---|---|
| `titulo` | libre |
| `tags` | lista, vocabulario libre, minúsculas y con tildes correctas |
| `rinde` | texto libre: `4 porciones`, `1 tarta de 24 cm`, `12 medialunas` |
| `tiempo` | texto corto y parejo: `40 min`, `1 h 15`, `3 h` |
| `dificultad` | exactamente `fácil`, `media` o `difícil` |
| `fuente` | de dónde salió |

**Un campo que la fuente no dice, se omite.** No se infiere la dificultad de que la
receta parezca sencilla, ni se calcula un tiempo sumando pasos. Un campo ausente es
información honesta; un campo inventado es una mentira que después filtra mal.

### Cuerpo

En este orden. Ninguna sección es obligatoria.

```markdown
---
titulo: Milanesas napolitanas
tags: [horno, rápido]
rinde: 4 porciones
tiempo: 40 min
dificultad: fácil
fuente: Cuaderno de mamá, p. 12
---

La descripción va acá, sin encabezado: entre el frontmatter y el primer `##`.

## Ingredientes
### Para la milanesa
- 4 milanesas de nalga

## Preparación
1. Precalentar el horno a 200 °C.

## Variaciones
### A la suiza
Salsa blanca y gruyere en lugar de la salsa de tomate.

## Notas
- El horno de casa calienta de más: bajar a 180 °C.
```

- **Nota vs. variación:** si cambia el plato que sale, es variación; si es un consejo
  para que este plato salga bien, es nota.
- **Fotos:** `![](url)` en cualquier punto del cuerpo. La primera imagen del documento
  es la portada.
- **`incompleto`:** si algo quedó a medias —faltan cantidades, la foto no se leía, el
  video no decía el horno—, agregar el tag `incompleto` y una nota diciendo qué falta.
  Es preferible a completar con lo que uno supone.

### Nombre del archivo

El título en minúsculas, sin tildes, con guiones: `milanesas-napolitanas.md`.
Completo, no abreviado. Si ya existe uno igual en la carpeta, sufijo numérico.

## Según de dónde venga la receta

### Sitio web

Muchas páginas de cocina traen la receta estructurada en el HTML como JSON-LD
(`schema.org/Recipe`). Si está, es la versión limpia, sin el ruido de la maquetación:
conviene mirarla antes que el texto renderizado.

No entra al archivo: navegación, publicidad, rating, "recetas relacionadas", botones
de compartir, biografía del autor, ni la historia larga previa a la receta —de esa se
rescatan una o dos líneas para la descripción.

Los comentarios de lectores **no entran**. Si uno trae una corrección claramente
valiosa, va a `## Notas` aclarando que salió de un comentario.

`fuente` es la URL completa.

### PDF o documento

- **Puede haber varias recetas en el mismo archivo.** No mezclarlas: preguntar cuál se
  quiere, o proponer una receta por archivo y confirmarlo antes de escribir.
- **Un PDF escaneado se leyó con OCR, y el OCR confunde números:** `1/2` y `12`, `l` y
  `1`, `0,5` y `05`. Una cantidad que no se entiende no se adivina — se deja como está
  y se marca `incompleto` con una nota diciendo cuál es dudosa.
- **Los libros ponen datos fuera de la receta:** la temperatura del horno en la
  introducción del capítulo, los tiempos en una tabla al final. Mirar alrededor antes
  de dar un dato por faltante.
- `fuente`: el libro o documento y la página — `El gran libro del pan, p. 24`.

### Foto

- **Leer todo lo que se ve, incluido lo escrito a mano** en los márgenes: en una
  libreta familiar, la anotación al costado suele ser la corrección que importa.
- **Lo que no se lee, no se inventa.** Un renglón cortado, tapado o borroso va con
  `incompleto` y una nota que diga qué parte falta.
- **Varias fotos de la misma receta** —la página par y la impar, o el paso a paso— se
  unen en un solo archivo, en orden.
- **La foto del plato que aparece en la página no sirve como foto de la receta:** es
  una foto de un libro, no una imagen usable. No se referencia.
- Si la receta sigue fuera del encuadre, decirlo en vez de completar de memoria.
- `fuente`: qué se fotografió — `Libreta de la abuela`, `Cocina al natural, p. 88`.

### Video

- **La descripción del video y el comentario fijado** suelen traer la lista de
  ingredientes ya escrita: mirar ahí antes de transcribir del audio.
- **Las cantidades se dicen en voz y no siempre aparecen en pantalla**, y al revés:
  los sobreimpresos a veces corrigen lo que se dijo. Cuando difieren, gana lo escrito
  y la diferencia va a `## Notas`.
- **Temperaturas y tiempos son lo que más se omite** en los videos cortos. Si no se
  dicen, no se estiman: `incompleto` y una nota.
- El paso a paso de un video es más granular que una receta escrita: agrupar en pasos
  con sentido, sin perder ninguna acción.
- `fuente`: la URL del video y el canal.

### Texto pegado

Suele venir sin estructura y con el formato roto. Se separa en ingredientes y
preparación por el sentido, no por dónde cayeron los saltos de línea. Si no se sabe de
dónde salió, `fuente` se omite: no se inventa una atribución.

## Editar una receta que ya está guardada

### Encontrarla

1. Buscar en `Recetario/` por nombre de archivo **y** por contenido: el usuario la va
   a nombrar como la llama él ("la de las milanesas"), no por el nombre del archivo.
2. **Si hay más de una candidata, mostrarlas y preguntar cuál.** Nunca elegir por
   parecido: editar la receta equivocada pisa contenido que estaba bien.
3. Si no aparece ninguna, decirlo antes de ofrecer crearla. Puede estar con otro
   nombre, o suelta en la raíz sin archivar.

### Editarla

**Siempre partir del contenido actual del archivo**, leído completo, nunca de lo que
se recuerde de un mensaje anterior: entre una lectura y la siguiente, el archivo pudo
cambiar desde la app o desde otra sesión.

El flujo es de a poco y con el usuario mirando:

1. Leer el archivo entero y mostrar la parte de la que se está hablando.
2. Proponer el cambio concreto.
3. Ajustar con lo que diga.
4. Cuando esté conforme, mostrar el archivo completo como va a quedar.
5. Con su visto bueno, escribir.

**Se preserva todo lo que no se está editando:** las claves desconocidas del
frontmatter, las secciones que la app no reconoce (`## Maridaje`) y el resto del
cuerpo, tal cual. Nunca se reescribe el archivo entero desde cero para cambiar una
línea: así es como se pierden las notas que alguien había agregado a mano.

Además:

- Si la receta tenía el tag `incompleto` y la edición la completó, **sacar el tag** y
  la nota que decía qué faltaba.
- Si cambia el título, **ofrecer** renombrar el archivo para que sigan alineados. No
  renombrarlo por cuenta propia.
- Si el cambio es una versión alternativa del plato y no una corrección, va como
  `## Variaciones` de la receta existente, no como receta nueva.
- Si ya existe una receta igual y se está por guardar otra, no crear un duplicado:
  completar la que está.

## Errores comunes

| Error | Por qué importa |
|---|---|
| Subir el archivo sin mostrarlo antes | Corregir en Drive cuesta encontrar, releer y reescribir; revisar un borrador cuesta un mensaje. |
| Elegir entre varias recetas parecidas sin preguntar | Editar la equivocada pisa contenido bueno. |
| Reescribir el archivo entero para editar una línea | Se pierden las secciones y las claves que la app no conoce pero alguien puso a propósito. |
| Inventar `dificultad` porque la receta parece simple | Ensucia el filtro con opiniones que nadie escribió. |
| Estimar una temperatura o un tiempo que la fuente no dice | Una temperatura inventada arruina la receta la primera vez que alguien la cocina. |
| Escribir tags sin tilde (`clasica`) | El vocabulario se parte en dos para siempre: `clasica` y `clásica` no se cruzan. |
| Formatos de `tiempo` distintos en cada receta | `1 hora 15 minutos (más heladera)` y `1 h 15` no se ordenan juntos. El tiempo activo va en una nota. |
| Agregar claves nuevas al frontmatter | Se preservan, pero ninguna app las mira. Lo que no entra en las seis claves va al cuerpo. |
| Subir el archivo como documento de Google | Deja de ser un `.md` legible y editable por fuera, que es el punto de todo esto. |
| Reescribir los pasos o las cantidades "mejorándolos" | Los ingredientes y la preparación se transcriben como los dice la fuente. Corregir de memoria es cómo una receta que funcionaba deja de funcionar. |
| Traducir las cantidades a otro sistema | `1 cup` se deja como está, o se convierte y se aclara en una nota. |
