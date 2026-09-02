# Setup

Pasos manuales, una sola vez. **Nada de esto es lógica de la aplicación:** la app
asume que la estructura de Drive ya existe y no la crea. Si falta algo, falla con
un mensaje que apunta a este documento.

## 1. Estructura en Drive — hecho (2026-09-01)

Carpeta raíz `Recetario/`, creada dentro de la carpeta `recetas` del usuario.

Quedó también una carpeta `_fotos/` de un diseño anterior. **La app ya no la usa
ni la mira** —las imágenes van por URL externa (§3.3)— y se puede borrar de
Drive cuando se quiera; mientras esté, la app la ignora por empezar con `_`.

| carpeta | id |
|---|---|
| `Recetario/` | `1B2nNmy0qOAuZT9lomrSdompYta7uuJ7B` |
| `Entradas y picadas/` | `1ioT1u_pqn4EiiFLXBY6Px-XLTYZvoZOO` |
| `Sopas y caldos/` | `1MN77Oj7Sg836b7rEWcgM5WGAk_htrerY` |
| `Ensaladas/` | `10szFByXSWQ6QGkTnDrd36whmRhipi--e` |
| `Pastas/` | `1lYb6YB9QUh-2sISk9Iwj0tenYgdQyuhJ` |
| `Arroces y legumbres/` | `1INJnFwCKOprY4emKy58UdADzBXVHS3Xa` |
| `Carnes/` | `1wjHNmq1u-wIAe94eWww3Zt-eOKeanie4` |
| `Aves/` | `180u7Zmk9UpYw8ss9kvdcFtw9FRB7MGiU` |
| `Pescados y mariscos/` | `1EjWIrmaQYKtKJRsCWQMNGOomx4mg3R4u` |
| `Tartas y empanadas/` | `13ckKL1fkrIATp1QycH0k6dO5W0lgZIkA` |
| `Verduras y guarniciones/` | `14W0qAZn1TuGYFUZLRFR3EBcNaUTxxf8I` |
| `Panes y masas/` | `1ZjmGsxLtnFnAFVlvaamKe3qwwVwskr95` |
| `Postres/` | `1T7vf_BgC7qF5wfuDlBqckhoo9zASooY4` |
| `Salsas y aderezos/` | `11aR96I-jPPms43LMBo9AkJWQ-KPv5zcr` |
| `Desayunos y meriendas/` | `1mAFhFqD84rSHttawmCp8J77k-3FA_p5j` |
| `Bebidas/` | `1o9wvgO8sKpij53hYfcAX3PO7WxizjJmB` |

Los ids están acá solo para depurar. La app **no** los hardcodea: descubre las
categorías listando las subcarpetas de `Recetario/`, así que agregar o renombrar
una categoría se hace en Drive y no toca el código.

Para agregar una categoría más adelante: crear la subcarpeta en Drive. Nada más.

## 2. Planilla `_indice` — la crea la app

No se crea a mano. La app la genera en su primer arranque, junto con los
encabezados y la hoja `meta`, y después dispara una reconstrucción completa.

La razón es que el índice es un cache derivado y no un dato: la app lo crea con
sus encabezados, su hoja `meta` y su `schemaVersion`, y sabe rehacerlo entero
desde los `.md` cuando falta o quedó viejo. Hacerlo a mano no aporta nada y
puede quedar desalineado del esquema.

## 3. Cliente OAuth — hecho (2026-09-01)

En Google Cloud Console:

1. Crear un proyecto en <https://console.cloud.google.com>.
2. En **APIs y servicios → Biblioteca**, habilitar **Google Drive API** y
   **Google Sheets API**.
3. Configurar el consentimiento. Lo que antes era "pantalla de consentimiento
   OAuth" hoy es una sección aparte: **Google Auth Platform**,
   <https://console.cloud.google.com/auth/overview>. La primera vez hay un botón
   *Comenzar* con un formulario corto; después queda repartido en el menú
   izquierdo:
   - **Personalización de marca:** nombre de la app y correo de asistencia.
   - **Público:** tipo de usuario **Externo**, y agregarse a uno mismo en
     *Usuarios de prueba*.
     Si el consentimiento falla con **Error 403: org_internal**, es que el tipo
     de usuario quedó en *Interno*, que solo admite cuentas de la organización
     dueña del proyecto. Se corrige en esta misma pantalla con *Cambiar a
     externo*.
   - **Acceso a los datos:** *Agregar o quitar permisos* y agregar
     `https://www.googleapis.com/auth/drive`. Google lo marca como
     **restringido**: es el precio de que la app pueda ver los `.md` que
     escriben los agentes, y está fundamentado en el §4.4 del spec.
4. En **Google Auth Platform → Clientes** (o el viejo *APIs y servicios →
   Credenciales*, es el mismo objeto), crear un **ID de cliente de OAuth →
   Aplicación web**. En orígenes autorizados de JavaScript, poner los dos:
   - `http://localhost:8080` — para desarrollo local, que es el puerto que usa
     `npm run dev` (fijado en `vite.config.js`).
   - el origen de GitHub Pages, cuando exista (paso 4).
5. Anotar el client ID:

   ```
   670194416271-psq474ahahgia41v9frctqaom4to7cio.apps.googleusercontent.com
   ```

   **No hace falta API key**: la necesitaba el Google
   Picker, que se cayó del diseño junto con `drive.file`. Tampoco se usa el
   client secret: el flujo corre entero en el navegador, y el client ID no es un
   secreto — viaja en el frontend.

Al entrar por primera vez, Google muestra **"Google no verificó esta app"**. Se
pasa con *Configuración avanzada → Ir a…*. Es consecuencia del scope restringido
y no se puede evitar sin someter la app a verificación, que para un solo usuario
no tiene sentido.

## 4. GitHub Pages — pendiente

Publicar la carpeta de la app como sitio estático y autorizar ese origen en el
paso 3.

## 5. Primer arranque

No hay nada que hacer. La app ubica `Recetario/` buscándola por nombre y
descubre las categorías listando sus subcarpetas; después crea la planilla
`_indice` y hace la primera reconstrucción.
