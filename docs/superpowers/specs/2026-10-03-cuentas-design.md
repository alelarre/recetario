# Cuentas: cronómetro y cuentas regresivas

Una herramienta nueva en *Herramientas*: un cronómetro y cuentas regresivas,
varias a la vez y cada una con su nombre. Corren mientras se usa el resto de
la app y se ven desde cualquier pantalla en una tira al pie. Mientras corre
alguna, la pantalla no se apaga. Al llegar a cero, una cuenta suena y vibra
**con la app a la vista**: no hay aviso con la pantalla apagada ni con la app
cerrada. No leen recetas ni usan Drive; viven en el teléfono.

## 1. El modelo: `src/cuentas.ts`

Puro, sin DOM. Todo tiempo se calcula contra el reloj que se le pasa (`ahora`,
en milisegundos), nunca con un contador: una cuenta no se atrasa aunque la
página se frene, y sobrevive a recargar y a cerrar la app.

### 1.1 Las cuentas

Una cuenta regresiva tiene `id`, `nombre`, `duracion` (ms) y uno de dos
estados:

- **corriendo**: `fin`, el instante en que llega a cero;
- **pausada**: `restante`, los ms que le faltan.

Lo que se deriva: `restante(cuenta, ahora)` —0 como mínimo, nunca negativo—,
`terminada(cuenta, ahora)` (`restante === 0`), y `avance` para la barra,
`1 − restante / duracion`.

Operaciones, todas devuelven una cuenta nueva:

| Operación | Qué hace |
|---|---|
| `empezar(nombre, duracion, ahora)` | corriendo, `fin = ahora + duracion` |
| `pausar(cuenta, ahora)` | pausada con lo que faltaba |
| `seguir(cuenta, ahora)` | corriendo, `fin = ahora + restante` |
| `sumarMinuto(cuenta, ahora)` | 60 s más al `fin` o al `restante`, y 60 s más a `duracion`; una terminada vuelve a correr desde 1:00 |

El nombre vacío se reemplaza por la duración escrita (`10 min`, `1 h 20 min`,
`45 s`).

### 1.2 El cronómetro

Uno solo. Dos estados: **corriendo**, con `desde` y lo `acumulado` antes de
la última pausa; **parado**, sólo con `acumulado`. `transcurrido(crono, ahora)`
es `acumulado + (ahora − desde)` corriendo, `acumulado` parado. Operaciones:
`iniciar`, `parar` (pausa, conserva lo acumulado) y `reiniciar` (parado, en
cero).

### 1.3 Formato

`formatear(ms)` redondea hacia abajo al segundo y escribe `m:ss` hasta 59:59 y
`h:mm:ss` de una hora en adelante. Es el mismo para las cuentas, el cronómetro
y la tira.

### 1.4 Lo guardado

`{ cuentas, crono, ultimaDuracion }` en `localStorage`, clave
`recetario.cuentas`, escrito en cada cambio. `ultimaDuracion` es lo último
que se puso en las ruedas y con lo que se abren la próxima vez. Lo que no se
puede leer —vacío, roto, de otra forma— se toma como sin cuentas, cronómetro
en cero y 10 minutos en las ruedas. Es del teléfono: no va a Drive ni al
índice.

## 2. El control: `src/cuentas-control.ts`

Tiene el estado (§1), el tic, el aviso y el wake lock, y registra sus
acciones en el mapa. Recibe el reloj, el almacén, el wake lock, el sonido y
la vibración inyectados: los tests le pasan dobles.

### 2.1 El tic

Mientras corre alguna cuenta o el cronómetro, un `setInterval` de 1 s llama
a `alTic`, que `main.ts` cablea para redibujar la tira y, en la pantalla
Cuentas, los tiempos de las fichas sin repintar la pantalla. Sin nada
corriendo, no hay intervalo.

### 2.2 El aviso

En el tic en que una cuenta pasa a terminada, el control la marca
`avisando` y arranca el aviso: un pitido corto generado con Web Audio
—sin archivo de audio— y una vibración, repetidos cada 2 s hasta que se
toca *Parar* o pasa un minuto. Si terminan varias, el aviso es uno solo;
*Parar* lo corta y saca de la lista la cuenta que lo muestra. Una cuenta que
llegó a cero con la app cerrada o en segundo plano aparece terminada al
volver y suena recién ahí, en el primer tic a la vista. El sonido y la
vibración usan lo que el teléfono tenga: sin `vibrate`, sólo suena; sin
audio, sólo vibra; sin ninguno, la tira igual dice «¡Listo!».

### 2.3 La pantalla encendida

Mientras corra algo, el control pide el wake lock y lo repide al volver a
primer plano, igual que cocina; lo suelta cuando no queda nada corriendo.
Es un bloqueo propio, independiente del del modo cocina: cada uno pide y
suelta el suyo, y el sistema mantiene la pantalla mientras haya uno.

### 2.4 Acciones

| `data-accion` | Qué hace |
|---|---|
| `cuenta-empezar` | lee nombre y ruedas, empieza, guarda `ultimaDuracion`, vacía el nombre |
| `cuenta-pausar` / `cuenta-seguir` | sobre la cuenta del `data-id` |
| `cuenta-sumar` | +1 minuto |
| `cuenta-sacar` | la quita; si estaba avisando, corta el aviso |
| `cuenta-parar` | corta el aviso y quita la cuenta terminada |
| `rueda-mas` / `rueda-menos` | suben o bajan una rueda (`data-rueda`: `h`, `m`, `s`) con tope circular: 0–23, 0–59, 0–59 |
| `crono-iniciar` / `crono-parar` / `crono-reiniciar` | el cronómetro |
| `ir-cuentas` | la tira: abre la pantalla Cuentas |

Un toque redibuja la pantalla; el tic sólo pinta tiempos.

## 3. La pantalla: `#/herramientas/cuentas`

Título «Cuentas», con volver. Tres partes en este orden:

1. **Cronómetro**, en su ficha: título «Cronómetro», el tiempo grande
   centrado y dos botones, *Reiniciar* (secundario) e *Iniciar*/*Parar*
   (primario, según el estado). *Reiniciar* deshabilitado en cero.
2. **Las cuentas que corren**, una ficha cada una, en orden de creación:
   nombre a la izquierda, tiempo grande en acento a la derecha, y tres
   botones cuadrados: *+1'*, pausa/seguir y ✕; debajo, una barra fina con
   el avance. Pausada, el tiempo va en `--fg-2`. Terminada: el tiempo dice
   «¡Listo!» y quedan dos botones, *+1'* —un minuto más, y vuelve a
   correr— y el primario *Parar*.
3. **Nueva cuenta**, en su ficha: campo «Nombre (opcional)», las tres
   ruedas —horas, min, seg, cada una con ▲, el valor grande y ▼— y el
   botón primario *Empezar*, deshabilitado en 0:00:00.

Sin cuentas, la parte 2 no existe. La tira (§4) no se dibuja en esta
pantalla.

En la lista de Herramientas, **Cuentas va primera**: «Cuentas — Cronómetro
y cuentas regresivas», antes de Pan y Fermentados.

## 4. La tira

Un elemento fijo al pie, fuera de `#app` (hermano del velo de escritura),
que existe sólo mientras corre algo y en toda pantalla salvo Cuentas y la
vista de invitado. 56 px de alto, `--surface-alta`, borde superior
`--borde-fuerte`, sobre la columna. Muestra **la cuenta más próxima a
terminar**: ícono de reloj, nombre, tiempo en acento y, si hay más, «+N más»
a la derecha; si sólo corre el cronómetro, «Cronómetro» y su tiempo. Tocarla
abre Cuentas (`ir-cuentas`).

Con una cuenta avisando, la tira pasa a `--acento-suave` con borde en
acento, dice el nombre y «¡Listo!», y lleva el botón primario *Parar*.

Los pies pegados al fondo —el de la receta y el del plan— suben lo que
mide la tira: `bottom: var(--tira)`, con `--tira` en `:root` a 56 px
mientras la tira existe y 0 sin ella.

## 5. Rutas y documentos

- `router.ts`: vista `cuentas` en `#/herramientas/cuentas`, con volver.
- `information-architecture.md`: la pantalla, la tira y el modelo de
  cuentas (§Pantallas, §Entidades).
- `E07-Herramientas.md`: la capacidad nueva, con sus criterios.
- `design-system.md`: la tira, la ficha de cuenta, las ruedas, el ícono
  de reloj.
- `CLAUDE.md`: Herramientas pasa a tres —las dos calculadoras y las
  cuentas—; `cuentas.ts` y `cuentas-control.ts` en la tabla; en §No
  proponer, que suene con la pantalla apagada: el intent al Reloj ya está;
  se suman el audio de fondo que mantenga viva la página y contar en un Web
  Worker, que no sobrevive a la página congelada.
- `BACKLOG.md`: P112 se borra al terminar; P115 y P119 siguen `Abierto`.

## 6. Tests

- `tests/cuentas.test.ts`: restante y terminada con reloj fijo; pausar y
  seguir conservan lo que falta; sumar un minuto corriendo, pausada y
  terminada; el cronómetro acumula entre pausas; el formato en los bordes
  (0, 59:59, 1:00:00); el nombre por defecto; guardar y leer, y qué pasa
  con lo roto.
- `tests/cuentas-control.test.ts`: con reloj, almacén, wake lock, sonido y
  vibración falsos: el intervalo existe sólo con algo corriendo; el wake lock
  se pide al empezar y se suelta al quedar vacío; al cruzar el cero empieza
  el aviso y repite cada 2 s hasta *Parar* o un minuto; una terminada
  mientras la app estaba cerrada avisa en el primer tic.
- `tests/vista-cuentas.test.ts`: el orden de las tres partes; la ficha
  terminada con *Parar*; *Empezar* deshabilitado en cero; la tira con una,
  con varias, sólo con el cronómetro y avisando; que no aparece en Cuentas.
- `tests/main-rutas.test.ts`: la ruta nueva.
