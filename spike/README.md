# Spike — las cuatro verificaciones del §10

Código descartable. No es la app: existe solo para contestar las cuatro
preguntas del §10 del spec contra las APIs reales, porque sus respuestas pueden
cambiar el §5 entero.

Cuando el spike termine, sus resultados se escriben en el spec, se eliminan los
condicionales del §10 y esta carpeta se puede borrar.

## Requisitos

El cliente OAuth del `SETUP.md` §3, con `http://localhost:8000` entre los
orígenes autorizados de JavaScript, y una API key del mismo proyecto (el Picker
la exige aparte del token).

## Correrlo

```sh
cd spike && python3 -m http.server 8000
```

Abrir <http://localhost:8000>, pegar el client ID y la API key —quedan en
`localStorage`, no en el repo—, conectar, elegir la carpeta `Recetario/` en el
Picker y correr las cuatro pruebas.

## Qué contesta cada una

| # | Pregunta | Si falla |
|---|---|---|
| 1 | ¿Elegir `Recetario/` en el Picker da acceso a las subcarpetas y a los `.md` que la app no creó? | Scope más amplio y pantalla de "app no verificada" (§10.1) |
| 2 | ¿La Changes API responde con `drive.file` y reporta un cambio? | El índice se valida solo con reconstrucción explícita (§10.2) |
| 3 | ¿Sheets hace `append`, `update` por celda, `addSheet` y `deleteDimension` sobre una planilla creada por la app? | Vuelve el índice JSON con journal y partición (§10.3) |
| 4 | ¿El listado de `_fotos/` trae `thumbnailLink` y esa URL pinta en un `<img>`? | Miniaturas propias generadas al subir (§10.4) |

La 1 es la que más importa: es la única cuyo plan B cambia el scope, y de ella
dependen las otras tres.

## Lo que deja en Drive

Un `.md` vacío y una foto de 400×400 en `_fotos/` (prueba 2 y 4) y una planilla
`_indice-spike` (prueba 3). El botón **Borrar lo que creó el spike** los elimina;
todos llevan el prefijo `spike-` o el nombre `_indice-spike`.

## Antes de correr la prueba 1

Necesita un `.md` que **no** haya creado la app dentro de alguna categoría —es
justamente lo que verifica—. Poner uno a mano desde Drive, o pedirle a Claude
que guarde una receta ahí con el conector de Google Drive.
