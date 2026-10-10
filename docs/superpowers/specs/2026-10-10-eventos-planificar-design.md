# Herramientas: Evento, planificar (P123 y las cantidades de P118)

Una herramienta nueva en *Herramientas*: **cuánto comprar o hacer para una
reunión**. Se elige el tipo de evento —merienda, asado, comida, picada o
cóctel—, se dice cuántos son y qué va a haber, y sale la lista de lo que hace
falta en unidades de compra, con las bebidas, el hielo y el carbón o la leña.
No lee recetas ni usa Drive. Funciona igual por el MCP.

Es la primera de dos partes. La segunda, **ejecutar**, pone la línea de tiempo
del día con avisos sobre un evento ya planificado (P119), con los tiempos de
cocción del asado. Este spec deja el modelo listo para eso: cada cosa del
evento es un objeto con `id` y nombre, al que la segunda parte le suma sus
pasos.

La investigación está en `product-design/research/herramientas/eventos.md`.

## 1. El modelo: `src/eventos/`

Puro y sin DOM, como `src/calculadoras/`. **Toda la fórmula vive acá**; la
pantalla y el MCP sólo usan lo que exporta.

### 1.1 Un tipo de evento

Un archivo por tipo —`merienda.ts`, `asado.ts`, `comida.ts`, `picada.ts`,
`coctel.ts`—, cada uno con:

- **`id`, `nombre`.**
- **Sus datos:** las entradas propias del tipo, con la forma de `Entrada` de
  `src/referencias/tipos.ts` (número u opción, con valor por defecto y
  `visibleSi`). Adultos, chicos y margen son comunes a todos los tipos y no
  se declaran en cada uno.
- **Sus grupos:** «Para comer», «Para picar antes», «Acompañamiento»,
  «Postre», «Carne», «Bocados», «Aparte»… Cada grupo dice si **se reparte**
  o no.
- **Sus cosas**, cada una en un grupo, con:
  - `id`, `nombre`;
  - si viene prendida;
  - sus opciones propias (por ejemplo, el tamaño de la empanada);
  - **la porción por persona si es lo único de su grupo**, en su unidad
    (unidades, porciones, gramos), que sale de los datos (§3);
  - la unidad de compra en que se muestra (§1.4).
  Una cosa que puede ir en dos grupos —las empanadas, para picar antes o
  para comer— lleva el grupo como opción.
- **Lo que se suma después:** bebidas, hielo, infusiones, carbón o leña
  (§1.5), cada uno prendido o no según el tipo.

### 1.2 La cuenta común: `evento.ts`

Para cada cosa prendida:

1. **Personas:** adultos + chicos × el factor de chico de los datos. Una cosa
   puede declarar que el chico cuenta entero (la torta).
2. **Porción:** la de la cosa si fuera lo único de su grupo.
3. **Reparto:** en un grupo que se reparte, con *n* cosas prendidas, cada una
   lleva 1/*n* de su porción. Con empanadas y pizza para comer, 2,5 empanadas
   y 1,5 porciones de pizza por persona, si solas fueran 5 y 3. En un grupo
   que no se reparte, cada cosa lleva su porción entera.
4. **Ajustes del tipo:** la duración, la ocasión y *con sobras* multiplican
   los grupos que sus datos dicen (§2).
5. **Margen:** ninguno, 10 % o 20 %, sobre todo.
6. **Redondeo** a la unidad de compra (§1.4).

La función devuelve el resultado agrupado: cada grupo con sus ítems —nombre,
cantidad y unidad— y, debajo, lo que se suma después. Más las advertencias y
las fuentes de los números que usó. Y **el texto para copiar**:

```
Asado para 12 (10 adultos, 2 chicos)

Carne
- Vacío: 2,4 kg
- Tira: 2,9 kg
Aparte
- Chorizo: 12
…
Además
- Carbón: 4 bolsas de 3 kg
```

### 1.3 Sin resultado

Sin personas, o con todo apagado, el resultado queda vacío: nunca un error.
Un número vacío que tiene valor por defecto calcula con ese valor; uno
vacío sin valor por defecto, en cero, negativo o que no es un número, no
cuenta.

### 1.4 El redondeo

- **Lo que se compra por unidad** —empanadas, facturas, chorizos, bolsas,
  botellas, latas— va entero y **para arriba**. Las facturas, las medialunas
  y las empanadas suman las docenas: «30 (2 ½ docenas)».
- **Lo que va por peso:** en gramos enteros debajo de 1 kg; desde 1 kg, en
  kg con un decimal, para arriba.
- **Lo que va por volumen:** en litros con un decimal, y en envases enteros
  para arriba.

### 1.5 Lo que se suma después

Se calcula con las cosas ya resueltas y con sus propios datos.

- **Bebidas.** Datos: horas, si hace calor, cuántos adultos toman alcohol, y
  cuáles hay —cerveza, vino, fernet, espumante para el brindis, gaseosa,
  agua, jugo—. El consumo por persona sale de las horas y el calor. **El
  alcohol se reparte** entre las bebidas con alcohol prendidas, como las
  cosas de un grupo; lo mismo las sin alcohol. Los chicos toman sólo sin
  alcohol, con su propio consumo. El espumante para el brindis va aparte,
  una copa por persona. El fernet suma su gaseosa cola. Sale en litros y en
  envases de acá: lata de 473 ml, botella de 750 ml, gaseosa de 2,25 l.
- **Hielo.** Datos: para los vasos o también para enfriar las bebidas, y el
  calor. Para enfriar, suma kilos por litro de bebida fría. Sale en kilos y
  en bolsas.
- **Infusiones** (merienda). Datos: cuáles hay —café, té, mate cocido,
  leche—. Tazas por persona y cuánto café, cuántos saquitos o cuánta leche
  por taza; sale en gramos, saquitos y litros.
- **Carbón o leña** (asado). Datos: carbón o leña, y si hay viento o frío.
  Sale de los kilos de carne cruda —carne, embutidos y achuras— y va en
  bolsas de carbón o en kilos de leña.

## 2. Los cinco tipos

Los nombres de las cosas son los de esta sección; los números, de §3.

### Merienda

- **Datos:** duración (hasta 2 h, de 2 a 4 h, más de 4 h) y si es
  cumpleaños infantil.
- **Bocados**, se reparte: facturas y medialunas, sándwiches de miga,
  salados (chipá, pizzetas), dulces (masas secas, alfajores). La duración y
  el cumpleaños infantil multiplican el grupo.
- **Aparte:** la torta, en kg; el chico cuenta entero.
- **Después:** infusiones y bebidas (sólo sin alcohol, prendidas gaseosa y
  jugo).

### Asado

- **Datos:** ocasión (almuerzo, cena o festejo) y **tipo de asado**:
  clásico, completo, cerdo, mixto, cordero o veggie. El tipo de asado es un
  punto de partida, como el tipo de pan: elegirlo prende y apaga las cosas
  que trae, y después se cambia lo que haga falta.
- **Carne**, se reparte: tira, vacío, matambre, entraña, pollo, cerdo,
  cordero. **Cada corte trae su porción**: los de hueso, más gramos. La
  ocasión multiplica el grupo.
- **Aparte:** chorizo, morcilla, chinchulines, mollejas, provoleta, papas,
  ensalada, pan.
- **Para picar antes:** la picada (la de §2 Picada, entera y como antes de
  comer), apagada.
- **Después:** carbón o leña, bebidas, hielo.

### Comida

- **Datos:** ocasión (almuerzo, cena o festejo) y *con sobras*, que suma a
  «Para comer».
- **Para picar antes**, se reparte: picada, empanadas, vitel toné,
  bocaditos.
- **Para comer**, se reparte: empanadas, pizzas, pasta, carne, pollo,
  pescado. La ocasión multiplica el grupo.
- **Acompañamiento**, se reparte: puré, papas, ensalada, arroz.
- **Postre**, se reparte: torta, helado, postre en porciones, fruta.
- **Aparte:** el pan.
- **Después:** bebidas, hielo.

### Picada

- **Datos:** si es **lo que se come** o va **antes de comer**; cambia la
  porción de todo.
- **Cosas**, no se reparten: fiambres, quesos, pan, vegetales, snacks,
  dips. Salen en gramos.
- **Después:** bebidas, hielo.

### Cóctel o lunch

- **Datos:** duración.
- **Bocados**, se reparte: sándwiches de miga, bocaditos fríos, bocaditos
  calientes, empanaditas, pizzetas, dulces. La duración multiplica el grupo.
- **Después:** bebidas, hielo.

## 3. Los números: `src/eventos/datos/`

Sólo datos, sin funciones, como `src/referencias/datos/`: cada número con
su fuente (`{ nombre, url }`) y cada archivo con su encabezado (qué contiene,
de qué informe salió, cómo se corrige). Las cuentas no tienen ningún número
escrito adentro. **Corregir un número es editar su archivo de datos;
ningún test fija un valor.**

Un número puede ir **sin fuente** cuando ninguna lo respalda —las tazas de
infusión por persona—: se declara así en el dato, y en la pantalla no lleva
pie.

**Cada número sale de `product-design/research/herramientas/verificacion-eventos.md`**,
que es la primera tarea del plan: se vuelve a abrir cada fuente de
`eventos.md` y se anota el número tal como está. Donde las fuentes se
contradicen, el usuario elige: el factor de chico, el chorizo y la morcilla,
el carbón por kilo de carne, el hielo, la gaseosa por botella de fernet, las
empanadas para comer, el helado y el vino por persona.

## 4. La pantalla: `#/herramientas/evento`

**En la lista de Herramientas**, la última: **Evento** —*Cuánto comprar para
una reunión*—, con un ícono nuevo, `invitados` (dos personas, el `users` de
Lucide), del trazo de los demás. Con el volver y el ícono delante del
título, como las calculadoras.

Con los componentes de las calculadoras (`design-system.md` §6.28):

1. **Los datos:** el tipo de evento en un desplegable; adultos y chicos en
   el par de cantidades; el margen en un conmutador (*Sin margen · 10 % ·
   20 %*); y los datos del tipo.
2. **Las cosas, por grupo:** una ficha por grupo, con su nombre arriba y una
   fila con interruptor por cosa. Prendida, abre sus opciones debajo. Estas
   fichas llevan título, a diferencia de las demás de §6.28: la misma cosa
   —las empanadas— puede estar en dos grupos, y el nombre dice en cuál.
3. **Lo que se suma después:** una ficha con un interruptor por cada uno —
   *Bebidas*, *Hielo*, *Infusiones*, *Carbón o leña*—; prendido, abre sus
   datos.
4. **El resultado**, al pie, en la ficha del resultado: arriba las cifras
   —las personas y, en el asado, la carne en kg—; debajo, los ítems por grupo, como
   ítems de ingrediente con sus grupos; después, las advertencias y las
   fuentes. Al pie, **Copiar**, que deja el texto de §1.2 en el portapapeles
   con el respaldo de `compartir.ts`.
5. **Empezar de nuevo**, al final de la pantalla: vuelve todo a los valores
   por defecto, en todos los tipos.

Escribir un número pinta sólo el resultado; prender o apagar algo, o elegir
una opción, pinta la pantalla entera sin cambiar de ruta, porque cambia qué
filas se ven.

**Lo elegido se guarda** en `localStorage`, `recetario.evento`, en cada
cambio, con `try/catch`: el tipo, adultos, chicos y margen, y lo de cada tipo
por separado, así cambiar de tipo y volver no pierde nada. Una opción
guardada que ya no existe vuelve a la de por defecto; una cosa guardada que
ya no existe se ignora.

## 5. El agente

- **`calcular_evento`** en el MCP (`mcp/eventos.ts`, registrada en
  `servidor.ts`). Recibe el tipo, adultos, chicos, margen, los datos del tipo,
  qué cosas van —por `id` o por nombre, sin tildes ni mayúsculas— con sus
  opciones, y lo que se suma después con sus datos. Lo que falta lo completa
  con los valores por defecto; las cosas que no se nombran quedan como las
  trae el tipo. Devuelve el resultado agrupado, las advertencias, las
  fuentes y el texto para copiar. Sin tipo, o con uno que no existe, devuelve
  la lista de tipos con sus cosas y sus datos. No usa el Drive ni el login.
- **El skill `herramientas`** suma cuándo usarla («armame las cantidades para
  un asado de 15», «¿cuántas facturas compro para 20?»). El número sale de la
  herramienta y la respuesta cita la fuente, como con las referencias.

## 6. Tests

- **La cuenta común**, con tipos y datos de prueba: el reparto en un grupo
  con una, dos y tres cosas; un grupo que no se reparte; el factor de chico y
  la cosa donde el chico cuenta entero; los ajustes del tipo; el margen; el
  redondeo de §1.4; el resultado vacío de §1.3; el texto para copiar.
- **Lo que se suma después:** el alcohol repartido entre las bebidas
  prendidas, los chicos sin alcohol, el hielo para enfriar, el carbón desde
  los kilos de carne.
- **La forma de los datos:** cada número con fuente y URL, o declarado sin
  fuente; cada cosa de un tipo con su porción.
- **Cada tipo** se calcula sin errores con sus valores por defecto.
- **El guardado:** lo de cada tipo sobrevive a cambiar de tipo; una opción
  que ya no existe vuelve a la de por defecto.
- **El MCP:** `calcular_evento` con lo mínimo, con nombres en vez de `id`, y
  sin tipo.

## 7. Documentos

- `product-design/product/specs/E07-Herramientas.md`: la feature nueva,
  **F07.12 — Evento**, con sus capacidades y criterios; C07.1.1 suma la
  sexta entrada de la lista; C07.6 suma `calcular_evento`.
- `product-design/ux/information-architecture.md`: la ruta.
- `product-design/ux/design-system.md`: el ícono `invitados`, y las fichas de
  cosas por grupo en §6.28.
- `skills/herramientas/SKILL.md`.
- `CLAUDE.md`: Herramientas, la tabla de dónde está cada cosa y el MCP.
- `BACKLOG.md`: P123 sale; P118 queda con lo de cocinar el asado —minutos
  por corte, horno por peso, el calor de la parrilla—, que va con P119 en la
  segunda parte.
