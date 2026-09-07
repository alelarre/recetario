# Recetario — Análisis Competitivo

**Versión:** 1.0
**Fecha:** 2026-09-04
**Estado:** Final — Hito 1 cerrado

---

## Nota sobre las fuentes

Casi todas las comparativas del rubro publicadas como "best recipe apps 2026"
están escritas por productos que compiten en él: Cooklang, Swoodie, Fond,
RecipeOne y Recipe-Clipper publican rankings donde ellos mismos figuran. Se usan
acá para el mapa del landscape y para hechos verificables —plataformas, formato
de export, existencia de una feature— y no para sus juicios de valor.

**No se registran precios.** Recetario no se monetiza y el análisis no busca
elegir un producto para usar: lo que importa de cada competidor no es cuánto
sale, sino **qué modelo de negocio tiene**, porque ahí está la causa de que
encierren los datos. Un producto que cobra suscripción necesita que no te vayas;
uno que se vende una vez, no. Las secciones de monetización describen el modelo,
sin cifras.

La ficha 6 (la solución previa del usuario) es la única del análisis con datos
de uso reales de primera mano, recogidos en la entrevista del Hito 1.

---

## Índice

1. [Paprika 3](#1-paprika-3)
2. [Obsidian + Recipe Box / Recipe Vault](#2-obsidian--recipe-box--recipe-vault)
3. [Mealie y Tandoor (self-hosted)](#3-mealie-y-tandoor-self-hosted)
4. [Mela y Crouton (Apple-native)](#4-mela-y-crouton-apple-native)
5. [AnyList](#5-anylist)
6. [La solución previa: Docs, PDFs y fotos](#6-la-solución-previa-docs-pdfs-y-fotos)
7. [Las apps de descubrimiento](#7-las-apps-de-descubrimiento-nyt-cooking-cookpad-samsung-food)
8. [Síntesis comparativa](#síntesis-comparativa)

---

## 1. Paprika 3

**Categoría:** Gestor de recetas propias, multiplataforma
**Plataformas:** iOS, Android, macOS, Windows
**Modelo:** pago único por plataforma, sin suscripción.

### 1.1 Propuesta de valor y audiencia objetivo

Es el archivador del rubro y su referencia desde hace más de una década. Su
propuesta es simple y honesta: recortás recetas de la web con su clipper,
quedan ordenadas, con lista de compras y planificador, y funciona offline para
siempre. Apunta a quien cocina seguido y ya se cansó de guardar links.

Su fortaleza estructural es el **pago único**: no hay tier free que te frene ni
una suscripción que convierta tu recetario en un alquiler.

### 1.2 Modelo de monetización

| Fuente de ingreso | Descripción | Importancia |
|---|---|---|
| Licencia por plataforma | Pago único, repetido en cada sistema operativo donde lo quieras | Total |
| Sync propio | Servicio de sincronización gratuito, incluido | Nula — es costo, no ingreso |

Es el único de los comerciales del análisis sin suscripción ni tier gratuito
limitado.

### 1.3 Fortalezas

- Multiplataforma real: iOS, Android, Mac y Windows.
- Sin suscripción y sin límite de recetas.
- Offline completo.
- Clipper web maduro, el mejor del rubro para importar desde un sitio.
- Planificador y lista de compras incluidos.

### 1.4 Debilidades

- **Las recetas viven en su formato.** Hay export, pero es un formato propio: sirve como backup, no para trabajar los datos afuera.
- La licencia se paga de nuevo en cada plataforma.
- No importa desde PDF, foto ni video: el clipper es para páginas web.
- Sin código abierto: si el producto se discontinúa, el recetario queda en un formato que solo él lee.

### 1.5 Por qué no sustituye a Recetario

Porque resuelve la mitad del problema del usuario y no toca la otra. Ordena y
sincroniza, pero **su ruta de entrada es el clipper web**, y las fuentes reales
del usuario son un PDF de 24 recetas, documentos temáticos y fotos de páginas de
libro. Y una vez adentro, las recetas dejan de ser archivos legibles para pasar
a ser filas de la base de Paprika: es exactamente el intercambio que Recetario
existe para no aceptar.

---

## 2. Obsidian + Recipe Box / Recipe Vault

**Categoría:** Editor de notas en markdown plano, con plugins de gestión de recetas
**Plataformas:** macOS, Windows, Linux, iOS, Android
**Modelo:** gratis para uso personal, sin registro, sin límite de notas ni de dispositivos. Plugins de la comunidad, gratuitos. Obsidian Sync es un servicio pago y opcional: se puede sincronizar gratis por iCloud, Syncthing, Git o Remotely Save. **Con Google Drive no hay camino oficial** — ver 2.4.

> **Este es el competidor más importante del análisis.** No por tamaño de
> mercado, sino porque sostiene la misma tesis que Recetario y ya la tiene
> funcionando.

### 2.1 Propuesta de valor y audiencia objetivo

Obsidian trabaja sobre una carpeta de archivos `.md` en el disco. No hay base de
datos: cada nota es un archivo de texto plano que se abre con cualquier cosa.
Apunta a quien quiere que sus notas le sobrevivan a cualquier app.

**Recipe Box** convierte esas notas en un sistema completo de recetas. Según su
documentación: recetas en markdown plano con frontmatter, explícitamente
legibles sin el plugin; vistas separadas para escritorio y teléfono; **modo
cocina que mantiene la pantalla encendida**; timers integrados; escalado por
multiplicador; plan de comidas por día y por tipo de comida; **lista de compras
generada automáticamente**, agrupable por categoría, receta o fuente; e historial
de cocina con fechas, notas y fotos.

**Recipe Vault** es un plugin distinto con la misma tesis, más orientado a
importar desde páginas web y a una galería de recetas.

En el mismo terreno está **Cooklang**, un formato de texto plano específico para
recetas, con editor propio para Obsidian. Da parsing exacto de ingredientes y
cantidades a cambio de ensuciar el archivo con marcas. Recetario ya lo evaluó y
lo descartó por eso; se menciona acá porque define el borde superior de "cuánta
estructura tolera un archivo de texto".

### 2.2 Modelo de monetización

| Fuente de ingreso | Descripción | Importancia |
|---|---|---|
| Obsidian Sync | Suscripción opcional para sincronizar | Media — el uso personal es gratis y no está limitado |
| Obsidian Publish | Suscripción por sitio publicado | Baja para este análisis |
| Licencia comercial | Para uso en empresas | Baja para este análisis |
| Plugins | Gratuitos, mantenidos por la comunidad | Nula |

**No hay tier free limitado.** El motivo que llevó al usuario a descartar las
apps pagas no aplica acá.

### 2.3 Fortalezas

- Recetas como `.md` planos, en una carpeta propia, sin base de datos.
- **Gratis sin límites y multiplataforma completo:** escritorio y móvil, sin registro, sin techo de notas ni de dispositivos. El motivo por el que el usuario descartó las apps pagas no aplica acá.
- Sincronización gratuita por iCloud, Syncthing, Git o Remotely Save.
- Cubre el planificador y la lista de compras, que en Recetario ni siquiera están diseñados.
- **Modo cocina con pantalla siempre encendida**: el único dolor real que el usuario declaró al cocinar. Recetario también lo tiene, pero por botón manual (ver insight 3).
- Timers, escalado e historial de cocina, features que Recetario no tiene ni tiene planeadas.
- Ecosistema grande: si un plugin muere, hay otros.

### 2.4 Debilidades

- **No captura desde las fuentes reales.** Recipe Vault importa de páginas web; ninguno de los dos lee un PDF, un video ni la foto de una página de un libro. La pila de fuentes del usuario queda afuera.
- **No hay camino soportado para tener el vault en Google Drive**, que es donde Recetario tiene sus `.md` porque ahí los escriben los agentes. Obsidian no sincroniza con Drive de forma oficial. Lo único disponible es `obsidian-gdrive-sync`, un plugin de terceros que **no está en el directorio oficial**, se instala por BRAT, y cuyo propio autor lo describe como *"very much in beta and not ready for public release"* por riesgo de pérdida de datos, pidiendo backup previo del vault. En iOS ni siquiera se instala de la forma normal: hay que armar el vault en una computadora y copiarlo entero al teléfono. Los caminos gratuitos que sí funcionan —iCloud, Syncthing, Git, Remotely Save— no son Drive.
- Es un editor de notas con recetas encima: se abre Obsidian, no se abre el recetario. El contexto de cocina compite con todo el resto del vault.
- La app no es del usuario. Si el plugin se abandona o cambia de criterio, no es su decisión.
- Configurarlo es un proyecto: instalar, elegir plugins, definir frontmatter, resolver sync móvil.

### 2.5 Por qué no sustituye a Recetario

Es el competidor que más se le acerca y hay que decirlo sin adornos: **en
formato abierto, ausencia de costo y ausencia de techo, Obsidian + Recipe Box
empata o gana**, y encima trae el planificador y el modo cocina. Si el
diferenciador de Recetario se formula como "mis recetas son archivos míos y no
me cobran", este competidor ya lo cumple.

Pero para la configuración concreta de Recetario no sustituye, por dos motivos
de distinto peso.

**El primero es una incompatibilidad, no una molestia.** Recetario tiene los
`.md` en Google Drive porque ahí los escriben los agentes, y Obsidian no
sincroniza con Drive por ninguna vía soportada. La única existente es un plugin
beta, fuera del directorio oficial, que advierte sobre pérdida de datos y que en
iOS obliga a armar el vault en una computadora y copiarlo a mano. Poner el
recetario entero detrás de eso no es una opción razonable.

**El segundo es la captura.** Ninguna de sus rutas de importación acepta un PDF,
un video ni la foto de una página de un libro, que es de donde viene el
contenido del usuario.

Queda una tercera diferencia, más blanda pero real: es un editor de notas con
recetas encima. Se abre Obsidian, no se abre el recetario, y el contexto de
cocina compite con el resto del vault.

---

## 3. Mealie y Tandoor (self-hosted)

**Categoría:** Gestores de recetas autoalojados, open source
**Plataformas:** Servidor propio (Docker) + web / PWA
**Modelo:** open source, sin costo de licencia. El costo es el servidor y su mantenimiento.

### 3.1 Propuesta de valor y audiencia objetivo

Resuelven la propiedad de los datos por la vía opuesta a Recetario: en vez de
que los archivos sean tuyos, es la **infraestructura entera** la que es tuya.
Apuntan a quien ya tiene un servidor doméstico y no le molesta administrarlo.

**Mealie** es el más pulido: planificador con calendario y arrastrar-soltar,
listas de compras generadas desde el plan, modelo de hogar con varios usuarios y
permisos, importación desde URL, 35+ idiomas.

**Tandoor** es el más completo del rubro entero: Django + Vue sobre PostgreSQL,
tags y keywords, import/export en varios formatos, permisos granulares,
integración con OpenFoodFacts para datos nutricionales automáticos, costo por
comida, listas de compras ordenadas por pasillo del supermercado con sync en
tiempo real, y escaneo de códigos de barras desde la PWA.

### 3.2 Modelo de monetización

| Fuente de ingreso | Descripción | Importancia |
|---|---|---|
| Ninguna | Open source, sostenidos por donaciones y comunidad | — |

### 3.3 Fortalezas

- Control total: los datos, el código y el servidor.
- Export en JSON, formato estándar.
- Tandoor es la referencia de features del rubro: nada de lo que hace ningún competidor le falta.
- Sin costo de licencia y sin techo.
- Multiusuario real, para un hogar.

### 3.4 Debilidades

- **Exigen infraestructura.** Docker, PostgreSQL, actualizaciones, backups, y un servidor que tiene que estar prendido cuando abrís el teléfono en la cocina.
- Las recetas viven en una base de datos, no en archivos. El JSON de export es un backup, no un formato para trabajar afuera.
- Un agente externo no puede escribir una receta ahí sin pasar por su API.
- Muchísima superficie de producto para un usuario solo.

### 3.5 Por qué no sustituye a Recetario

Por la restricción que Recetario tiene fijada desde el inicio: **sin backend, sin
infraestructura que mantener.** Un servidor que hay que administrar es
exactamente el costo que la arquitectura de archivos estáticos existe para
evitar. Y en el punto que más importa acá, retroceden: la receta vuelve a ser una
fila en una base de datos y deja de ser un archivo que sobrevive por su cuenta.

Sirven, eso sí, como **catálogo de features**: Tandoor muestra hasta dónde llega
el rubro, y contra esa lista se puede decidir a conciencia qué no hacer.

---

## 4. Mela y Crouton (Apple-native)

**Categoría:** Gestores de recetas propias, ecosistema Apple
**Plataformas:** iOS, iPadOS, macOS
**Modelo:** compra única por app y por plataforma. Crouton tiene además un tier gratuito con techo de 20 recetas.

### 4.1 Propuesta de valor y audiencia objetivo

Son la escuela de diseño del rubro. Sincronizan por iCloud sin servicio propio,
se compran una vez, y su modo cocina es el mejor referente disponible de cómo se
lee una receta con las manos ocupadas. Apuntan a quien vive en Apple y valora
que la app se sienta parte del sistema.

### 4.2 Modelo de monetización

| Fuente de ingreso | Descripción | Importancia |
|---|---|---|
| Compra única | Por app y por plataforma | Total |
| Tier gratuito limitado (Crouton) | 20 recetas antes de pagar | Alta como embudo |

### 4.3 Fortalezas

- La mejor experiencia de lectura mientras se cocina del análisis.
- Sync por iCloud: sin servicio propio que pueda caerse.
- Compra única, sin suscripción.
- Diseño cuidado, nativo, rápido.

### 4.4 Debilidades

- **Solo Apple.** Fuera del ecosistema no existen.
- **Export en formato propietario** — señalado explícitamente como obstáculo para migrar después.
- El tier gratuito de Crouton tiene techo de 20 recetas.
- Igual que Paprika: importan desde web, no desde PDF, foto ni video.

### 4.5 Por qué no sustituye a Recetario

Por el formato propietario, que es la línea que Recetario no cruza, y porque la
ruta de entrada vuelve a ser el clipper web. Son, sin embargo, **el referente
obligado para el Hito 8 y el Hito 9**: lo que estas dos apps resolvieron sobre
tipografía, contraste y navegación por pasos en el contexto de cocina es lo
mejor que existe, y no cuesta nada aprenderlo.

---

## 5. AnyList

**Categoría:** Lista de compras con gestión de recetas encima
**Plataformas:** iOS, Android, web
**Modelo:** freemium con suscripción para las features compartidas y avanzadas.

### 5.1 Propuesta de valor y audiencia objetivo

Nace como lista de compras compartida entre convivientes y crece hacia recetas y
planificación semanal. Es, del análisis, **el que mejor resuelve el pendiente que
Recetario todavía no diseñó**: planificar la semana y que de ahí salga la lista.

### 5.2 Modelo de monetización

| Fuente de ingreso | Descripción | Importancia |
|---|---|---|
| Suscripción | Desbloquea compartir, recetas ilimitadas y features avanzadas | Total |

### 5.3 Fortalezas

- La lista de compras mejor resuelta del rubro: agrupación por pasillo, sincronización en vivo entre personas, ítems recurrentes.
- El puente receta → plan semanal → lista está pensado de punta a punta.
- Multiplataforma.

### 5.4 Debilidades

- **Suscripción**: el recetario se alquila.
- Las recetas son ciudadanas de segunda; el centro es la lista.
- Datos en su nube, en su formato.
- Tier gratuito con límites, que es el motivo declarado por el que el usuario descartó las apps pagas.

### 5.5 Por qué no sustituye a Recetario

Porque el modelo de suscripción es incompatible con la premisa del proyecto, y
porque la receta no es su unidad central. Entra al análisis como **referencia de
diseño para el planificador y la lista de compras**, que en Recetario están
listados como pendiente 3 y sin ninguna definición.

---

## 6. La solución previa: Docs, PDFs y fotos

**Categoría:** No es un producto. Es lo que el usuario realmente usaba.
**Plataformas:** Google Drive, en escritorio y teléfono.
**Modelo:** ninguno. Es gratis y ya estaba pago.

> Única ficha del análisis con datos de uso reales, de la entrevista del Hito 1.

### 6.1 Propuesta de valor y audiencia objetivo

Documentos de Google organizados por tema, con un recetario principal y varios
temáticos —fondues, pan, macarons, fermentación— más un PDF de 24 recetas de
pescados y un documento de ~7,3 MB. Las recetas entraban por copiar y pegar
desde la fuente original, y a veces **solo se guardaba la URL**. Para encontrar
algo se abría el documento temático que correspondía, y si no se recordaba
cuál, se usaba el buscador de Drive. Para cocinar, el Doc abierto en el
teléfono.

**Escala.** Al momento del análisis hay ~60 recetas migradas a `Recetario/`. El
target del usuario, terminada la migración, es del orden de **1.000 recetas**.
Esa cifra es la que hay que tener en la cabeza al leer las fortalezas de abajo:
el sistema previo funcionaba con lo que había, no necesariamente con lo que
viene.

### 6.2 Modelo de monetización

No aplica. Es el competidor más barato del análisis y el que más tiempo lleva
ganando.

### 6.3 Fortalezas

Hay que reconocerlas, porque explican por qué el sistema aguantó años:

- **Nunca se perdió nada.** Preguntado explícitamente: no aplica.
- **La búsqueda funcionaba** — a la escala actual. El buscador de Drive resolvía el caso de no recordar dónde estaba una receta, con recetas repartidas en un puñado de documentos temáticos. Es una fortaleza real y hay que reconocerla, pero no está probada contra 1.000 recetas sueltas.
- Costo cero, cero configuración, cero mantenimiento.
- Los archivos son propios y abiertos, sin app de por medio.
- Accesible desde cualquier dispositivo, sin instalar nada.

### 6.4 Debilidades

- **Las recetas están incompletas.** Es el dolor declarado como más desgastante: "no tener la receta completa guardada para revisar". El copy-paste arrastra el formato de la fuente y la URL suelta depende de que el sitio siga vivo.
- **La pantalla se apaga mientras se cocina.** Es el único dolor de contexto que el usuario nombró, y lo nombró como el peor.
- Las recetas están dispersas entre documentos, PDFs y fotos.
- No hay estructura: no se puede filtrar, ni listar, ni construir nada encima.
- Un Doc de 7,3 MB es lento de abrir en un teléfono.

### 6.5 Por qué no sustituye a Recetario

Porque no resuelve las dos únicas cosas que el usuario declaró como dolor real:
que la receta guardada esté completa, y que la pantalla no se apague mientras
cocina.

Pero hay que ser exacto sobre lo que **sí** resolvía, porque acota el problema de
Recetario: no había pérdida de recetas y la búsqueda andaba. Dos de las tres
promesas del `product-vision.md` v1.0 —"tenerlas juntas, encontrarlas rápido y no
perderlas"— describen molestias, no problemas. La única que queda en pie es la
dispersión, y su costo verdadero no es no encontrar: es que **lo que estaba
guardado no servía**.

Con una salvedad de escala: eso vale para las decenas de recetas de hoy. Con
1.000, "abrir el documento temático que corresponde" deja de ser una estrategia y
encontrar vuelve a ser un problema — pero uno **de navegación y filtrado**, que
es trabajo del Hito 5, no un argumento de posicionamiento.

---

## 7. Las apps de descubrimiento: NYT Cooking, Cookpad, Samsung Food

**Categoría:** Catálogos de recetas ajenas
**Modelo:** suscripción (NYT Cooking), freemium con publicidad (Cookpad, Samsung Food).

### 7.1 Propuesta de valor y audiencia objetivo

Resuelven el problema opuesto: **qué cocinar**, no **dónde está mi receta**. Su
activo es el catálogo, no tu contenido. Cookpad es además lo que aparece en los
resultados de búsqueda cuando alguien busca una receta en la web, que es
exactamente el rol que cumplía en el flujo previo del usuario: fuente, no
archivo.

### 7.2 Modelo de monetización

| Fuente de ingreso | Descripción | Importancia |
|---|---|---|
| Suscripción / publicidad | El catálogo es el producto | Total |
| Datos de uso | Qué se cocina, cuándo, con qué | Alta |

### 7.3 Fortalezas

- Catálogo enorme y curado.
- Descubrimiento, estacionalidad, recomendación.
- Alcance por SEO: aparecen antes que cualquier otra cosa al buscar una receta.

### 7.4 Debilidades

- Tus recetas propias son un rincón secundario, si existen.
- El contenido es de ellos: no se exporta, no sobrevive a la suscripción.
- Optimizadas para atención y tiempo en pantalla, no para cocinar rápido.

### 7.5 Por qué no sustituye a Recetario

Porque no compiten: son **proveedores de materia prima**, no archivadores. Su
lugar en este análisis es de contraste, y aporta un dato de posicionamiento
fuerte: el rubro entero, medido en usuarios y en dinero, está optimizando
descubrimiento. La gestión del recetario propio es un nicho chico atendido por
apps de una persona, plugins de comunidad y proyectos self-hosted — lo cual
explica por qué nadie invirtió en capturar desde un PDF o desde la foto de un
libro.

---

## Síntesis Comparativa

### Matriz comparativa

| Dimensión | Recetario | Paprika | Obsidian + Recipe Box | Mealie / Tandoor | Mela / Crouton | AnyList | Docs + PDFs |
|---|---|---|---|---|---|---|---|
| Los datos son archivos abiertos | ✅ `.md` | ❌ formato propio | ✅ `.md` | ❌ base de datos | ❌ propietario | ❌ su nube | ✅ Docs |
| Sobrevive a la app | ✅ | ❌ | ✅ | ⚠️ vía export | ❌ | ❌ | ✅ |
| Modelo de negocio | Ninguno | Pago único por plataforma | Gratis, servicios opcionales | Open source | Compra única; techo free en Crouton | Suscripción | Ninguno |
| Sin infraestructura que mantener | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Captura desde PDF / foto / video | ✅ agentes | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ copy-paste manual |
| Captura desde web | ❌ | ✅ clipper | ✅ Recipe Vault | ✅ | ✅ | ✅ | ⚠️ URL suelta |
| Pantalla encendida al cocinar | ✅ manual | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | ❌ |
| Planificador + lista de compras | ❌ *(sin diseñar)* | ✅ | ✅ | ✅ | ⚠️ | ✅ mejor del rubro | ❌ |
| Escalado, timers, historial | ❌ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| El código es del usuario | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Andar en el teléfono con los `.md` en Drive | ✅ | n/a | ❌ sin vía soportada | n/a | n/a | n/a | ✅ |

### Vacíos identificados

1. **Nadie captura desde las fuentes que la gente realmente tiene.** Los siete competidores importan desde una página web. Ninguno lee un PDF, un video ni la foto de una página de un libro. Es el vacío más grande del análisis y el único donde Recetario no tiene competencia.

2. **Nadie garantiza que la receta guardada esté completa.** El clipper web copia lo que la página traiga; si la fuente es mala, la receta guardada es mala. Nadie interviene en la calidad de lo capturado. Es, textualmente, el dolor que el usuario nombró como el más desgastante.

3. **Un recetario en `.md` sobre Google Drive no tiene cliente.** Obsidian, el único que trabaja sobre `.md` planos, no sincroniza con Drive por ninguna vía soportada: lo único que existe es un plugin beta fuera del directorio oficial que advierte sobre pérdida de datos. Como los agentes escriben en Drive, ese hueco es estructural y no lo cubre nadie.

4. **La propiedad de los datos, sola, ya no es un vacío.** Obsidian + Recipe Box lo resuelve gratis, con formato abierto, sin techo y sin límite de dispositivos. Cualquier posicionamiento que se apoye solo en "mis recetas son archivos míos" ya está ocupado. Lo que sigue vacante es la combinación concreta: archivos abiertos **en Drive**, escritos **por agentes**, leídos **desde el teléfono**.

5. **El planificador y la lista de compras están resueltos hasta el aburrimiento.** AnyList, Mealie, Tandoor y Recipe Box lo hacen todos. Recetario llega último y sin diferencial en ese terreno.

### Insights estratégicos

**1. El diferenciador defendible es la entrada, no el almacenamiento.**
La tesis con la que arrancó el proyecto —"las recetas son archivos míos"— es
correcta y está ocupada. Lo que no tiene nadie es la ruta de entrada: un agente
que recibe un PDF, un video o la foto de una página y escribe un `.md` completo
y estructurado. En el `CLAUDE.md` actual eso figura como detalle de
implementación; el research dice que es el producto.

**2. El problema del usuario no era encontrar: era que lo guardado no servía.**
Confirmado en la entrevista: nunca perdió una receta y el buscador de Drive
alcanzaba. Lo desgastante era "no tener la receta completa guardada para
revisar". Dos de las tres promesas del `product-vision.md` v1.0 hay que
reescribirlas en el Hito 4.

Con una advertencia de escala: eso vale para las decenas de recetas de hoy, no
para las ~1.000 del target. Encontrar va a volver a ser un problema, pero
resoluble con navegación y filtrado — trabajo del Hito 5, no un argumento de
posicionamiento.

**3. "Sin techo" hay que reformularlo, pero se sostiene por otro lado.**
Como "no me cobran ni me encierran el formato", Obsidian ya lo cumple, gratis,
sin registro y sin límite de dispositivos. Esa formulación no diferencia.

Se sostiene por dos caminos más angostos, y los dos son verificables:

- **El código es del usuario.** Con Obsidian los archivos son tuyos, pero la app
  es de otro: si Recipe Box se abandona o cambia de criterio sobre la vista de
  cocina, no es tu decisión.
- **Drive es una condición del sistema, no una preferencia.** Los agentes
  escriben los `.md` en Drive, y ese es el único lugar donde Obsidian no puede
  llegar sin un plugin beta que avisa que podés perder los datos. El competidor
  más cercano se cae justo en la restricción que define al producto.

Las dos son más angostas que "sin techo", y las dos se sostienen. Cuál de ellas
encabeza el posicionamiento es decisión del Hito 4.

**4. El referente de diseño para cocinar es Mela y Crouton; el de planificación es AnyList.**
Ninguno de los dos compite en la tesis de Recetario, y los dos resolvieron
problemas que Recetario todavía tiene abiertos. Van como input a los Hitos 5, 6,
8 y 9.

### Notas de diseño para hitos siguientes

No son insights estratégicos —no cambian el posicionamiento ni la propuesta de
valor— pero salieron del research y tienen destino concreto:

- **El wake lock ya existe y es manual por decisión.** El único dolor de contexto que apareció en la entrevista fue que la pantalla se apaga al cocinar. Verificado en el código: `src/main.ts:93` implementa la Wake Lock API con reintento al volver de segundo plano, expuesta como un botón. Que sea manual es deliberado —no siempre hace falta dejarla prendida—, así que el punto queda cerrado y no es material del Hito 5.
- **Cuatro competidores tienen escalado, timers e historial de cocina.** Recetario no. No es una carencia a corregir por defecto: es material para la discusión de features del Hito 5, donde se decide caso por caso.

### Dimensiones evaluadas y descartadas

Se consideraron y se dejaron afuera a propósito, para que no se vuelvan a
levantar como huecos del análisis:

| Dimensión | Por qué no entra |
|---|---|
| **Precio de cada competidor** | Recetario no se monetiza y el análisis no busca elegir un producto para usar. Lo que sí queda registrado es el modelo de negocio, porque explica el encierre de los datos. |
| **Idioma de la app y del contenido** | El contenido va a ser en español, pero es indistinto como criterio: ninguna decisión de producto depende de eso. |
| **Multiusuario y modelo de hogar** | Confirmado que no hay ningún otro usuario ni consultante. El modelo de hogar de Mealie y AnyList es irrelevante acá. |
| **Costo de construir y mantener Recetario** | No es una variable del proyecto. |
| **Sacar los `.md` de Google Drive** | Movidos a iCloud o a un repo git, Obsidian funcionaría y la incompatibilidad de la ficha 2 desaparecería. Queda fuera: Drive es parte del stack fijo del encuadre, porque ahí escriben los agentes. |

**Límites de verificación.** Las features de Recipe Box están tomadas de su
documentación oficial, no probadas en uso — incluido su modo cocina, que es el
punto donde más presiona a Recetario. Recipe Vault se describe desde su sitio,
sin verificación propia.

---

## Fuentes

- [Best Recipe Management Software in 2026 — Cooklang](https://cooklang.org/blog/48-best-recipe-management-software/)
- [Tandoor vs Mealie vs KitchenOwl — Cooklang](https://cooklang.org/blog/42-tandoor-vs-mealie-vs-kitchenowl/)
- [Mealie Review 2026 — Cooklang](https://cooklang.org/blog/40-mealie-review/)
- [Cooklang for Obsidian](https://cooklang.org/blog/15-cooklang-obsidian-guide/)
- [Recipe Box — documentación](https://recipebox-docs.pages.dev/)
- [Recipe Box — Obsidian Plugins](https://community.obsidian.md/plugins/recipe-box)
- [Recipe Vault — plain markdown recipes in Obsidian](https://recipes.taylordugger.com/)
- [Obsidian — precios y licencias](https://obsidian.md/pricing)
- [`obsidian-gdrive-sync` — repositorio y advertencias del autor](https://github.com/stravo1/obsidian-gdrive-sync)
- [Google Drive Sync — Obsidian community plugins](https://community.obsidian.md/plugins/google-drive-sync)
- [How to Sync Obsidian for Free on Every Device — Stephan Miller](https://www.stephanmiller.com/sync-obsidian-vault-across-devices/)
- [Recipe management with Obsidian — Adam Gallagher](https://adamgallagher.me/blog/recipe-management-with-obsidian/)
- [Paprika vs Mela vs Crouton vs Swoodie 2026 — Swoodie](https://swoodie.app/blog/paprika-vs-mela-vs-crouton-vs-swoodie-2026)
- [Grocery and recipe app comparison and review — Fulcra](https://fulcra.design/Notes/Grocery-and-recipe-app-comparison-and-review/)
- [Best Recipe Manager Apps — Forkee](https://www.getforkee.com/blog/best-recipe-manager-apps/)
- [Self-Host Your Recipe Manager: Mealie and Tandoor — Localtonet](https://localtonet.com/blog/self-host-your-recipe-manager-mealie-and-tandoor-setup-guide)
- [Tandoor Recipes vs Mealie — Pi Stack](https://www.pistack.xyz/posts/tandoor-vs-mealie-self-hosted-recipe-manager/)
- [Cook Mode: step-by-step recipe view](https://www.drizzlelemons.com/blog/cook-mode-step-by-step-recipe-view)
- [Cook Mode — WP Tasty](https://www.wptasty.com/cook-mode)
