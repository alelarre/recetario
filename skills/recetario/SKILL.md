---
name: recetario
description: Use when the user wants to save a recipe into their Google Drive recipe collection from any source — a website, a PDF, a photo of a cookbook page, a video, or pasted text — or wants to edit, complete, or fix a recipe already saved there.
---

# Recetario

Convierte una fuente en un archivo `.md` dentro de `Recetario/` en Google Drive.

El `.md` es el dato real y vale por sí solo. El esquema de abajo es un contrato: lo
que no está listado, no se agrega.

Este documento es autosuficiente: funciona igual desde el celular y desde la
computadora, sin depender de ningún otro archivo.

## Validar con el usuario siempre antes de subir el contenido

Mostrá el `.md` completo y esperá aprobación antes de escribir en Drive:

- El archivo entero, con su frontmatter y su cuerpo. No un resumen.
- En qué carpeta va y con qué nombre.
- Qué dejaste afuera de la fuente.

Corregí lo que te digan, mostrá de nuevo, y repetí hasta que esté. Recién ahí subilo.

## Procedimiento

1. Leé la fuente entera, según su tipo (ver más abajo).
2. Elegí la carpeta. Listá las subcarpetas de `Recetario/` en Drive y elegí entre
   esas, nunca de memoria. Si ninguna corresponde, dejá el archivo en la raíz de
   `Recetario/`, que es la bandeja de entrada.
3. Escribí el `.md` con el esquema de abajo.
4. Mostralo y esperá aprobación.
5. Subilo como `text/markdown`, no como documento de Google. Si la herramienta
   convierte a formato nativo por defecto, desactivá esa conversión.
6. Confirmá dónde quedó: carpeta y nombre del archivo.

## El esquema

### Frontmatter

Estas seis claves y ninguna más. Solo `titulo` es obligatorio.

| clave | valores |
|---|---|
| `titulo` | libre |
| `tags` | lista, vocabulario libre, minúsculas y con tildes |
| `rinde` | texto libre: `4 porciones`, `1 tarta de 24 cm`, `12 medialunas` |
| `tiempo` | texto corto y parejo: `40 min`, `1 h 15`, `3 h` |
| `dificultad` | exactamente `fácil`, `media` o `difícil` |
| `fuente` | de dónde salió |

Un campo que la fuente no dice, se omite. No infieras la dificultad ni calcules el
tiempo sumando pasos.

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

- **Nota o variación:** si cambia el plato que sale, es variación. Si es un consejo
  para que este plato salga bien, es nota.
- **Imágenes:** `![](url)` en cualquier punto del cuerpo, solo con URL externa
  (`http:` o `https:`). No subas imágenes a Drive ni referencies archivos de Drive:
  la app no los muestra. Ninguna imagen es portada.
- **`incompleto`:** si algo quedó a medias, agregá el tag `incompleto` y una nota
  diciendo qué falta. No completes con suposiciones.

### Nombre del archivo

El título en minúsculas, sin tildes, con guiones: `milanesas-napolitanas.md`.
Completo, no abreviado. Si ya existe uno igual en la carpeta, agregá sufijo numérico.

## Según de dónde venga la receta

### Sitio web

- Muchas páginas traen la receta como JSON-LD (`schema.org/Recipe`) en el HTML. Si
  está, usala: es la versión limpia. Miralo antes que el texto renderizado.
- No entra al archivo: navegación, publicidad, rating, "recetas relacionadas", botones
  de compartir, biografía del autor. De la historia previa a la receta, rescatá una o
  dos líneas para la descripción.
- Los comentarios de lectores no entran. Si uno trae una corrección valiosa, ponela en
  `## Notas` aclarando que salió de un comentario.
- `fuente`: la URL completa.

### PDF o documento

- Puede haber varias recetas en el mismo archivo. No las mezcles: preguntá cuál se
  quiere, o proponé una receta por archivo y confirmalo antes de escribir.
- Un PDF escaneado se leyó con OCR, y el OCR confunde números: `1/2` con `12`, `l` con
  `1`, `0,5` con `05`. Una cantidad que no se entiende no se adivina: dejala como está
  y marcá `incompleto` con una nota indicando cuál es dudosa.
- Los libros ponen datos fuera de la receta: la temperatura del horno en la
  introducción del capítulo, los tiempos en una tabla al final. Mirá alrededor antes
  de dar un dato por faltante.
- `fuente`: el libro o documento y la página — `El gran libro del pan, p. 24`.

### Foto

- Leé todo lo que se ve, incluido lo escrito a mano en los márgenes.
- Lo que no se lee, no se inventa. Un renglón cortado, tapado o borroso va con
  `incompleto` y una nota indicando qué parte falta.
- Varias fotos de la misma receta se unen en un solo archivo, en orden.
- La foto del plato impresa en la página no sirve como imagen de la receta. No la
  referencies.
- Si la receta sigue fuera del encuadre, decilo en vez de completar de memoria.
- `fuente`: qué se fotografió — `Libreta de la abuela`, `Cocina al natural, p. 88`.

### Video

- La descripción del video y el comentario fijado suelen traer los ingredientes ya
  escritos. Mirá ahí antes de transcribir del audio.
- Las cantidades se dicen en voz y no siempre aparecen en pantalla, y al revés: los
  sobreimpresos a veces corrigen lo que se dijo. Cuando difieren, gana lo escrito y la
  diferencia va a `## Notas`.
- Los videos cortos omiten temperaturas y tiempos. Si no se dicen, no los estimes:
  `incompleto` y una nota.
- El paso a paso de un video es más granular que una receta escrita. Agrupá en pasos
  con sentido, sin perder ninguna acción.
- `fuente`: la URL del video y el canal.

### Texto pegado

Suele venir sin estructura y con el formato roto. Separá ingredientes y preparación
por el sentido, no por dónde cayeron los saltos de línea. Si no se sabe de dónde
salió, omití `fuente`: no inventes una atribución.

## Editar una receta guardada

### Encontrarla

1. Buscá en `Recetario/` por nombre de archivo y por contenido. El usuario la va a
   nombrar como la llama él ("la de las milanesas"), no por el nombre del archivo.
2. Si hay más de una candidata, mostralas y preguntá cuál. No elijas por parecido.
3. Si no aparece ninguna, decilo antes de ofrecer crearla. Puede estar con otro
   nombre, o suelta en la raíz sin archivar.

### Editarla

Partí siempre del contenido actual del archivo, leído completo. Nunca de lo que
recuerdes de un mensaje anterior: el archivo pudo cambiar desde la app o desde otra
sesión.

1. Leé el archivo entero y mostrá la parte de la que se está hablando.
2. Proponé el cambio concreto.
3. Ajustá con lo que te digan.
4. Mostrá el archivo completo como va a quedar.
5. Con la aprobación, escribí.

Preservá todo lo que no estás editando: las claves desconocidas del frontmatter, las
secciones que la app no reconoce (`## Maridaje`) y el resto del cuerpo. No reescribas
el archivo entero para cambiar una línea.

Además:

- Si la receta tenía el tag `incompleto` y la edición la completó, sacá el tag y la
  nota que decía qué faltaba.
- Si cambia el título, ofrecé renombrar el archivo. No lo renombres por tu cuenta.
- Si el cambio es una versión alternativa del plato, va como `## Variaciones` de la
  receta existente, no como receta nueva.
- Si ya existe una receta igual, no crees un duplicado: completá la que está.

## Errores comunes

| Error | Consecuencia |
|---|---|
| Subir el archivo sin mostrarlo antes | Corregir en Drive cuesta encontrar, releer y reescribir. |
| Elegir entre recetas parecidas sin preguntar | Se pisa el contenido de la receta equivocada. |
| Reescribir el archivo entero para cambiar una línea | Se pierden las secciones y claves que la app no conoce. |
| Inventar `dificultad` | Ensucia el filtro con opiniones que nadie escribió. |
| Estimar una temperatura o un tiempo que la fuente no dice | La receta falla la primera vez que alguien la cocina. |
| Escribir tags sin tilde (`clasica`) | `clasica` y `clásica` quedan como dos tags distintos. |
| Usar formatos de `tiempo` distintos en cada receta | No se ordenan juntos. El tiempo activo va en una nota. |
| Agregar claves nuevas al frontmatter | Se preservan pero ninguna app las lee. Lo que no entra en las seis claves va al cuerpo. |
| Subir el archivo como documento de Google | Deja de ser un `.md` legible y editable por fuera. |
| Reescribir pasos o cantidades "mejorándolos" | Una receta que funcionaba deja de funcionar. |
| Traducir cantidades a otro sistema | `1 cup` se deja como está, o se convierte y se aclara en una nota. |
