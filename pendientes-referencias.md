# Pendientes menores de las referencias

Archivo temporal de P129. Lo que quedó sin tocar al cerrar las herramientas
de referencia (*Referencia rápida*, *Masas y dulces*, *Básicos de cocción* y
*Conservación*). Se ven de a uno; cada punto resuelto o descartado se borra de
acá. Al terminar, se borran este archivo y la fila P129.

Los datos están en `src/referencias/datos/`, las cuentas en
`src/referencias/cuentas.ts`, la pantalla en `src/ui/referencias.ts` y el MCP
en `mcp/referencias.ts`.

## Datos y fuentes

2. La tabla del café tiene dos columnas que se llaman «Agua».
3. La tabla del aceite no tiene las tiritas de pollo. Falta decidir si van.
4. Notas de la tabla de granos: «fuego bajo tapado» repetido, NDSU citada sin
   su nombre completo y la polenta instantánea como nota en vez de fila.
5. La fecha de consulta de la nota del arroz está escrita a mano.
6. La ricota de la pasta rellena da 33 g por porción: revisar el valor.
7. Los moldes desmontables no tienen un tipo propio.
8. FSIS (conservación) no tiene captura en Internet Archive: si la página
   cambia, se pierde la fuente.

## Cuentas

9. `rangoNapolitana` no contempla una lista vacía (hoy nunca lo está).
10. La lasaña no muestra las notas de la masa que sí muestra la pasta fresca.
11. Con cantidades muy chicas, los litros se muestran como «0 l».
12. Un valor negativo vuelve al valor por defecto sin avisar.
13. Los huevos se ven como «4:01 min» en vez de «4 min».
14. `minutosDe('3 min 30 s')` no lee los segundos.

## Pantalla

15. El buscador de *Conservación* no tiene `aria-label`.
16. La clase `.indice-ref` está de más en `src/ui/base.css`.
17. `ir-a-ficha` busca la ficha por id sin `CSS.escape` (hoy los ids no tienen
    caracteres raros).
18. La tabla no recibe foco con el teclado.
19. Los campos numéricos no tienen `step="any"`: las flechas suben de a 1 y el
    navegador puede marcar inválido un decimal.

## Código, tests y documentos

20. Tres `as IdHerramienta` que se evitan con un tipo mejor.
21. El `buscar` de `consultar_referencia` no tiene probados los bordes: texto
    vacío, sin resultados, acentos.
22. A la búsqueda de la pantalla le faltan tests del caso sin resultados.
23. Falta el test del mínimo de media porción de la lasaña.
24. Falta el test de que `pintarTabla` repinte sólo la tabla.
25. Falta el test de que el botón de minutos cree el temporizador con el
    nombre correcto.
26. Falta el test de que el MCP rechace una opción inexistente.
27. Faltan los tests de las advertencias de llenado y de hervor.
28. Los informes `product-design/research/herramientas/verificacion-*.md`
    citan números del backlog que ya no existen.
29. Detalles de redacción en `E07-Herramientas.md` y en
    `skills/herramientas/SKILL.md`.
