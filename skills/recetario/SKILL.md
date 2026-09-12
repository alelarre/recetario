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

Este es el comportamiento por defecto. Se saltea solo si el usuario lo pide de
forma explícita en ese mismo pedido: "subila sin mostrarme", "no me preguntes
nada". Ahí subí directo y avisá dónde quedó.

Nunca lo decidas por tu cuenta. No cuentan como instrucción de saltear: que la
fuente sea clara, que sea una sola receta, que el usuario haya dicho antes que
confía en tu criterio, ni que tengas apuro.

## Procedimiento

1. Leé la fuente entera, según su tipo (ver más abajo).
2. Buscá si la receta ya está en `Recetario/`, por título y por ingredientes
   principales. Si aparece una parecida, mostrasela al usuario y preguntá antes de
   seguir: puede querer completar la que está, guardarla como `## Variaciones` de
   esa, o crear una nueva igual.
3. Elegí la carpeta. Listá las subcarpetas de `Recetario/` en Drive y elegí entre
   esas, nunca de memoria. Si ninguna corresponde, dejá el archivo en la raíz de
   `Recetario/`, que la app muestra como **Sin categorizar**.
4. Escribí el `.md` con el esquema de abajo.
5. Mostralo y esperá aprobación.
6. Subilo como `text/markdown`, no como documento de Google. Si la herramienta
   convierte a formato nativo por defecto, desactivá esa conversión.
7. Confirmá dónde quedó: carpeta y nombre del archivo.
8. Avisá que **la receta no aparece en la app hasta reindexar** (ver «El índice»,
   más abajo).

## El esquema

### Frontmatter

Estas ocho claves y ninguna más. `titulo` es obligatorio, y `completa` se escribe
siempre.

| clave | valores |
|---|---|
| `titulo` | libre |
| `tags` | lista, vocabulario libre, minúsculas y con tildes. Hay palabras prohibidas: ver abajo |
| `rinde` | texto libre: `4 porciones`, `1 tarta de 24 cm`, `12 medialunas` |
| `tiempo` | texto corto y parejo: `40 min`, `1 h 15`, `3 h` |
| `dificultad` | exactamente `fácil`, `media` o `difícil` |
| `fuente` | de dónde salió |
| `foto` | la URL de una foto del plato, sólo `http:` o `https:` externa |
| `completa` | exactamente `sí` o `no`. **Siempre presente** |

Un campo que la fuente no dice, se omite —salvo `completa`—. No infieras la
dificultad ni calcules el tiempo sumando pasos.

**`completa`** dice si la receta está terminada, y **lo decide el usuario, no
vos**:

- Escribí **`completa: no`** por defecto, siempre. Aunque la receta parezca
  entera: terminarla es un juicio de quien la cocina, no una propiedad del texto.
- Escribí **`completa: sí`** sólo si el usuario lo dice en ese pedido, y sólo si
  la receta tiene título, está en una carpeta de categoría —no en la raíz—, y
  trae al menos un ingrediente y al menos un paso. Si falta algo de eso, va `no`
  aunque lo pida, y le decís qué falta.
- **No la omitas.** Sin la clave, la app lee la receta como incompleta igual,
  pero el archivo no dice lo que se decidió.

**Tags reservados.** La app se reserva estas palabras y no las acepta como tag:
`incompleto`, `incompleta`, `incompletos`, `incompletas`, `terminado`,
`terminada`, `terminados`, `terminadas`, `favorito`, `favorita`, `favoritos`,
`favoritas` y `probar`. No las uses nunca, tampoco sin tilde ni con mayúsculas. Lo
que dirían ya lo dice `completa`, o lo va a decir algo que todavía no existe.

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
completa: no
---

La descripción va acá, sin encabezado: entre el frontmatter y el primer `##`.

## Ingredientes
### Para la milanesa
- Milanesas de nalga — 4
- Pan rallado — 2 tazas
- Provenzal, 1 cucharada
- Sal y pimienta

### Para la cubierta
- Salsa de tomate — 1 taza
- Muzzarella | 200 g

## Preparación
### La milanesa
1. Precalentar el horno a 200 °C.
2. Pasar las milanesas por huevo y pan rallado.

### Al horno
1. Cubrir con salsa y muzzarella.
2. Hornear 15 minutos.

## Variaciones
### A la suiza
Salsa blanca y gruyere en lugar de la salsa de tomate.

## Notas
- El horno de casa calienta de más: bajar a 180 °C.
```

- **Ingredientes: el nombre primero, después la cantidad.** Un ítem es
  `nombre` + separador + `cantidad`. Los separadores son `—`, `-`, `|`, `;` y `,`,
  y manda el primero que aparece. **La coma sólo separa si lo que sigue empieza
  con un número:** `Provenzal, 1 cucharada` se parte, `Sal, pimienta` no. Un
  ítem sin cantidad es sólo el nombre. **Nunca la cantidad adelante**
  (`4 milanesas de nalga`): el filtro por ingrediente de la app busca por el
  principio del ítem, y esa receta no aparece buscando «milanesas». Preferí `—`,
  que no se confunde con nada del texto.
- **Grupos:** los `###` agrupan ingredientes y también pasos. En la preparación,
  la numeración vuelve a empezar en cada grupo.
- **Nota o variación:** si cambia el plato que sale, es variación. Si es un consejo
  para que este plato salga bien, es nota.
- **Foto:** la foto del plato va en la clave `foto`, como URL externa. Otras
  imágenes pueden ir en el cuerpo con `![](url)`, también sólo con URL externa. No
  subas imágenes a Drive ni referencies archivos de Drive: la app no los muestra.
- **Si algo quedó a medias:** `completa: no` y una nota en `## Notas` diciendo qué
  falta. No completes con suposiciones. Nunca un tag para decirlo.

### Nombre del archivo

El título en minúsculas, sin tildes, con guiones: `milanesas-napolitanas.md`.
Completo, no abreviado. Si ya existe uno igual en la carpeta, agregá sufijo numérico.

El nombre se decide **una sola vez, al crear el archivo**, y no vuelve a cambiar
aunque cambie el título. La app identifica cada receta por el id del archivo en
Drive, no por su nombre.

## El índice

La app no lee los `.md` para listar ni buscar: lee un índice, la planilla
`Recetario/_indice`, con una fila por receta. **Este skill todavía no escribe esa
fila.** La app tampoco descubre sola lo que se escribe en Drive por fuera de ella.

La consecuencia, para cada receta que subas o edites:

- **Una receta nueva no aparece en la app** hasta que el usuario toque
  **Ajustes → Reindexar**.
- **Una receta editada se sigue viendo como antes en las listas y la búsqueda**
  hasta reindexar. Abierta, en cambio, ya muestra lo nuevo, porque abrirla lee el
  `.md`.

Decíselo al confirmar dónde quedó. Si cargás varias en la misma sesión, alcanza
con reindexar una vez al final.

No toques `_indice` ni `_borradores` a mano, ni para agregar la fila ni para
«arreglar» nada: si el índice queda mal, la reparación es siempre reindexar.

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
  y dejá `completa: no` con una nota indicando cuál es dudosa.
- Los libros ponen datos fuera de la receta: la temperatura del horno en la
  introducción del capítulo, los tiempos en una tabla al final. Mirá alrededor antes
  de dar un dato por faltante.
- `fuente`: el libro o documento y la página — `El gran libro del pan, p. 24`.

### Foto

- Leé todo lo que se ve, incluido lo escrito a mano en los márgenes.
- Lo que no se lee, no se inventa. Un renglón cortado, tapado o borroso va con
  `completa: no` y una nota indicando qué parte falta.
- Varias fotos de la misma receta se unen en un solo archivo, en orden.
- La foto del plato impresa en la página no sirve como `foto` de la receta: `foto`
  es una URL externa, y una foto sacada de un libro no la tiene.
- Si la receta sigue fuera del encuadre, decilo en vez de completar de memoria.
- `fuente`: qué se fotografió — `Libreta de la abuela`, `Cocina al natural, p. 88`.

### Video

- La descripción del video y el comentario fijado suelen traer los ingredientes ya
  escritos. Mirá ahí antes de transcribir del audio.
- Las cantidades se dicen en voz y no siempre aparecen en pantalla, y al revés: los
  sobreimpresos a veces corrigen lo que se dijo. Cuando difieren, gana lo escrito y la
  diferencia va a `## Notas`.
- Los videos cortos omiten temperaturas y tiempos. Si no se dicen, no los estimes:
  `completa: no` y una nota.
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
   nombre, o suelta en la raíz, sin categorizar.

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

- Si la edición completó lo que faltaba, sacá la nota que decía qué faltaba. La
  clave `completa` **no la cambies por tu cuenta**: pasa a `sí` sólo si el usuario
  lo dice, con las mismas condiciones que al crear.
- Si el archivo no tiene la clave `completa`, agregala en `no`, salvo que el
  usuario diga otra cosa.
- Si el cambio saca ingredientes o pasos y la receta estaba en `completa: sí`
  pero deja de tener al menos uno de cada uno, pasala a `no` y decilo.
- Si cambia el título, **no renombres el archivo.** El nombre no vuelve a cambiar
  después de crearlo, y la app tampoco lo renombra.
- Si el cambio es una versión alternativa del plato, va como `## Variaciones` de la
  receta existente, no como receta nueva.

## Errores comunes

| Error | Consecuencia |
|---|---|
| Subir sin mostrar, sin que el usuario lo haya pedido | Corregir en Drive cuesta encontrar, releer y reescribir. |
| Elegir entre recetas parecidas sin preguntar | Se pisa el contenido de la receta equivocada. |
| Reescribir el archivo entero para cambiar una línea | Se pierden las secciones y claves que la app no conoce. |
| Inventar `dificultad` | Ensucia el filtro con opiniones que nadie escribió. |
| Poner `completa: sí` porque la receta parece entera | Terminarla es una declaración del usuario. La app la muestra como terminada y nadie lo decidió. |
| Omitir `completa` | La app la lee como incompleta igual, pero el archivo no dice lo que se decidió. |
| Usar un tag reservado (`incompleto`, `terminada`, `favoritos`, `probar`…) | La app no los acepta, y dicen algo que ya dice `completa` o algo que todavía no existe. |
| Escribir la cantidad antes del nombre (`4 milanesas`) | La receta no aparece al buscar por ese ingrediente. |
| Renombrar el archivo porque cambió el título | El nombre se decide una vez. Cambiarlo no rompe la app, pero deja de ser predecible dónde está cada receta. |
| Escribir la fila en `_indice` a mano | Una fila mal armada rompe la búsqueda. Mientras el skill no la escriba con la misma función que la app, se reindexa. |
| Estimar una temperatura o un tiempo que la fuente no dice | La receta falla la primera vez que alguien la cocina. |
| Escribir tags sin tilde (`clasica`) | `clasica` y `clásica` quedan como dos tags distintos. |
| Usar formatos de `tiempo` distintos en cada receta | No se ordenan juntos. El tiempo activo va en una nota. |
| Agregar claves nuevas al frontmatter | Se preservan pero ninguna app las lee. Lo que no entra en las ocho claves va al cuerpo. |
| Copiar los datos nutricionales de la fuente | El recetario no los guarda, ni en el frontmatter ni como nota. Si la fuente los trae, se descartan. |
| Subir el archivo como documento de Google | Deja de ser un `.md` legible y editable por fuera. |
| Reescribir pasos o cantidades "mejorándolos" | Una receta que funcionaba deja de funcionar. |
| Traducir cantidades a otro sistema | `1 cup` se deja como está, o se convierte y se aclara en una nota. |
