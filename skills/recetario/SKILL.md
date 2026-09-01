---
name: recetario
description: Use when the user wants to save a recipe into their Google Drive recipe collection from any source — a website, a PDF, a photo of a cookbook, a video, or pasted text — or wants to fix or complete a recipe already saved there.
---

# Recetario

Convierte una fuente cualquiera en un archivo `.md` dentro de `Recetario/` en Google
Drive. **El archivo es el dato real y sobrevive a cualquier app que lo lea**, así que
el esquema de abajo es un contrato: lo que no está acá no se inventa.

Este documento es autosuficiente a propósito. Funciona igual desde el celular y desde
la computadora, y no depende de tener a mano ningún otro archivo.

## Procedimiento

1. **Leer la fuente entera** antes de escribir nada.
2. **Elegir la carpeta.** Listar las subcarpetas de `Recetario/` en Drive y elegir
   entre esas, nunca de memoria. Si ninguna corresponde con claridad, dejar el
   archivo en la raíz de `Recetario/`: la raíz es la bandeja de entrada y archivar
   después cuesta un arrastre.
3. **Escribir el `.md`** con el esquema de abajo.
4. **Subirlo como `text/markdown`**, no como documento de Google. Si la herramienta
   convierte a formato nativo por defecto, desactivar esa conversión.
5. **Decir dónde quedó**: carpeta, nombre del archivo, y qué se dejó afuera.

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

## Decisiones que la fuente no resuelve

| Situación | Qué hacer |
|---|---|
| Un plato dulce que también es una tarta, un pan o una masa | Manda **para qué se come**, no de qué está hecho: si se sirve de postre va a `Postres`. La carpeta es el curso. |
| Guarnición que también podría ser entrada | Cómo la come esta casa. Si no hay forma de saberlo, la raíz. |
| La fuente es una URL | `fuente` es la URL completa, no el nombre del autor. Es lo único que permite volver al original. |
| La fuente es un libro | `fuente: Nombre del libro, p. 24`. |
| La fuente es una foto o un video sin título | Describir de dónde salió: `fuente: Video de Instagram, @cuenta`. |
| Hay comentarios de lectores con consejos útiles | No entran. Son de terceros y no están verificados. Si uno es realmente valioso, va a `## Notas` diciendo que salió de un comentario. |
| El sitio trae navegación, publicidad, rating, "recetas relacionadas" | Nada de eso entra al archivo. |
| La receta ya existe en el recetario | No crear un duplicado: abrir la existente y completarla, o guardarla como `## Variaciones` de aquella. |
| Los tags | Antes de inventar uno, mirar los que ya usan otras recetas de esa carpeta y reusarlos. Un tag nuevo por receta no sirve para filtrar. |
| La fuente trae la anécdota personal del autor ("me la pasó mi abuela", "para el cumple de mi hija") | La descripción se condensa en tercera persona, o se omite. Esa abuela no es la de quien lee el recetario. Lo que sí se conserva literal son los pasos y las cantidades. |

## Errores comunes

| Error | Por qué importa |
|---|---|
| Inventar `dificultad` porque la receta parece simple | Ensucia el filtro con opiniones que nadie escribió. |
| Escribir tags sin tilde (`clasica`) | El vocabulario se parte en dos para siempre: `clasica` y `clásica` no se cruzan. |
| Formatos de `tiempo` distintos en cada receta | `1 hora 15 minutos (más heladera)` y `1 h 15` no se ordenan juntos. El tiempo activo va en una nota. |
| Agregar claves nuevas al frontmatter | Se preservan, pero ninguna app las mira. Lo que no entra en las seis claves va al cuerpo. |
| Subir el archivo como documento de Google | Deja de ser un `.md` legible y editable por fuera, que es el punto de todo esto. |
| Reescribir los pasos o las cantidades "mejorándolos" | Los ingredientes y la preparación se transcriben tal como los dice la fuente. Corregir de memoria es cómo una receta que funcionaba deja de funcionar. |
| Traducir las cantidades a otro sistema | `1 cup` se deja como está, o se convierte y se aclara en una nota. |
