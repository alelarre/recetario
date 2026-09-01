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

1. Crear un proyecto.
2. Habilitar **Google Drive API**, **Google Sheets API** y **Google Picker API**.
3. Configurar la pantalla de consentimiento con el único scope
   `https://www.googleapis.com/auth/drive.file`, que es no-sensible y no requiere
   verificación de Google. Tipo de usuario externo, y agregarse a uno mismo como
   usuario de prueba.
4. Crear credenciales de tipo **OAuth client ID → Web application**. En orígenes
   autorizados de JavaScript, poner los dos:
   - `http://localhost:8000` — para el spike y para desarrollo local.
   - el origen de GitHub Pages, cuando exista (paso 4).
5. Crear además una **API key** en el mismo proyecto. El Google Picker la exige
   aparte del token OAuth. Conviene restringirla a la Picker API.
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
