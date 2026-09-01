# Setup

Pasos manuales, una sola vez. **Nada de esto es lógica de la aplicación:** la app
asume que la estructura de Drive ya existe y no la crea. Si falta algo, falla con
un mensaje que apunta a este documento.

## 1. Estructura en Drive — hecho (2026-09-01)

Carpeta raíz `Recetario/`, creada dentro de la carpeta `recetas` del usuario.

| carpeta | id |
|---|---|
| `Recetario/` | `1B2nNmy0qOAuZT9lomrSdompYta7uuJ7B` |
| `_fotos/` | `1sOYwDUPrNBxj1rvNPPYC8_pRz8wcwNv0` |
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

La razón es el scope `drive.file`: la app tiene acceso garantizado a los archivos
que ella misma crea. Una planilla creada por fuera depende de que el permiso
sobre la carpeta alcance para verla.

## 3. Cliente OAuth — pendiente

En Google Cloud Console:

1. Crear un proyecto en <https://console.cloud.google.com>.
2. En **APIs y servicios → Biblioteca**, habilitar **Google Drive API**,
   **Google Sheets API** y **Google Picker API**.
3. Configurar el consentimiento. Lo que antes era "pantalla de consentimiento
   OAuth" hoy es una sección aparte: **Google Auth Platform**,
   <https://console.cloud.google.com/auth/overview>. La primera vez hay un botón
   *Comenzar* con un formulario corto; después queda repartido en el menú
   izquierdo:
   - **Personalización de marca:** nombre de la app y correo de asistencia.
   - **Público:** tipo de usuario **Externo**, y agregarse a uno mismo en
     *Usuarios de prueba*. Conviene además darle *Publicar app*: en modo prueba
     los tokens de refresco caducan a los 7 días. Como el único scope es no
     sensible, se publica sin revisión de Google.
     Si el consentimiento falla con **Error 403: org_internal**, es que el tipo
     de usuario quedó en *Interno*, que solo admite cuentas de la organización
     dueña del proyecto. Se corrige en esta misma pantalla con *Cambiar a
     externo*.
   - **Acceso a los datos:** *Agregar o quitar permisos* y buscar
     `https://www.googleapis.com/auth/drive.file`. Tiene que quedar como el
     único, y aparece listado como **no sensible**.
4. En **Google Auth Platform → Clientes** (o el viejo *APIs y servicios →
   Credenciales*, es el mismo objeto), crear un **ID de cliente de OAuth →
   Aplicación web**. En orígenes autorizados de JavaScript, poner los dos:
   - `http://localhost:8000` — para el spike y para desarrollo local.
   - el origen de GitHub Pages, cuando exista (paso 4).
5. En **APIs y servicios → Credenciales → Crear credenciales → Clave de API**,
   crear además una **API key**. El Google Picker la exige aparte del token
   OAuth; el resto de la app no la usa, porque las llamadas a Drive y Sheets van
   con el token en el header `Authorization`. Restringirla:
   - *Restricciones de API:* **solo Google Picker API**. Si no figura en la
     lista, falta habilitarla en el paso 2 — el selector solo muestra las APIs
     habilitadas en el proyecto.
   - *Restricciones de aplicación:* **Sitios web**, con `http://localhost:8000/*`
     y el origen de GitHub Pages cuando exista. Si el Picker llegara a fallar con
     un error de clave, esto es lo primero que hay que aflojar.
6. Anotar el client ID y la API key. No hay client secret: el flujo corre entero
   en el navegador, y ninguno de los dos valores va al repositorio.

Con esos dos valores ya se puede correr el spike del §10 (ver `spike/README.md`),
que es lo que destraba escribir la app.

## 4. GitHub Pages — pendiente

Publicar la carpeta de la app como sitio estático y autorizar ese origen en el
paso 3.

## 5. Primer arranque

La app pide elegir la carpeta `Recetario/` con el Google Picker. Ese permiso es
lo que le da acceso al contenido; conviene hacerlo una sola vez y no revocarlo.
