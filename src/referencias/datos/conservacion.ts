/**
 * Conservación: sólo datos. La tabla va sin fuente.
 *
 * Procedencia: product-design/research/herramientas/verificacion-conservacion.md
 * y, para las filas que se suman, verificacion-conservacion-completa.md.
 * Para corregir un plazo, editá su fila.
 * Para sumar una fila, respetá las columnas de su tabla.
 * El orden en que se muestran las tablas está en `src/referencias/indice.ts`.
 */
import type { Tabla } from '../tipos.js';

export const TABLAS_CONSERVACION = {
  conservacion: {
    id: 'conservacion', titulo: 'Conservación de alimentos',
    columnas: [
      { id: 'alimento', nombre: 'Alimento' },
      { id: 'alacena', nombre: 'Alacena' },
      { id: 'heladera', nombre: 'Heladera' },
      { id: 'freezer', nombre: 'Freezer' }
    ],
    grupos: [
      {
        titulo: 'Carnes vacunas, de cerdo y cordero',
        filas: [
          { alimento: 'Cortes de vaca crudos (bife, asado, nalga, vacío, peceto, carne para guiso)', alacena: 'no corresponde', heladera: '2–3 días', freezer: '4–12 meses' },
          { alimento: 'Carne picada (vaca, cerdo, cordero, ternera)', alacena: 'no corresponde', heladera: '1 día', freezer: '3–4 meses' },
          { alimento: 'Cortes de cerdo crudos (bondiola, carré, solomillo, costillas, pechito)', alacena: 'no corresponde', heladera: '2–3 días', freezer: '4–12 meses' },
          { alimento: 'Cordero y cabrito crudos', alacena: 'no corresponde', heladera: '2–3 días', freezer: '4–12 meses' },
          { alimento: 'Menudencias (hígado, lengua, riñones, chinchulines)', alacena: 'no corresponde', heladera: '1–2 días', freezer: '3–4 meses' },
          { alimento: 'Conejo crudo', alacena: 'no corresponde', heladera: '2 días', freezer: '9 meses' },
          { alimento: 'Carne cocida (asado, carne al horno, peceto, sobras con carne)', alacena: 'no corresponde', heladera: '3 días', freezer: '2–3 meses' },
          { alimento: 'Milanesas crudas compradas congeladas', alacena: 'no corresponde', heladera: 'sin abrir, 6 días a 4 °C; abiertas, 3 días', freezer: '6 meses' },
          { alimento: 'Milanesas cocidas (fritas o al horno)', alacena: 'no corresponde', heladera: '3 días', freezer: 'carne: 2–3 meses; pollo: 4 meses' }
        ]
      },
      {
        titulo: 'Aves',
        filas: [
          { alimento: 'Pollo entero crudo', alacena: 'no corresponde', heladera: '1–2 días', freezer: '12 meses' },
          { alimento: 'Presas de pollo crudas (pechuga, pata-muslo, alitas)', alacena: 'no corresponde', heladera: '1–2 días', freezer: '9 meses' },
          { alimento: 'Pollo picado', alacena: 'no corresponde', heladera: '1–2 días', freezer: '3–4 meses' },
          { alimento: 'Menudos de pollo (hígados, mollejas, corazones)', alacena: 'no corresponde', heladera: '1–2 días', freezer: '3–4 meses' },
          { alimento: 'Pavo (entero o pechuga)', alacena: 'no corresponde', heladera: '1–2 días', freezer: 'entero: 12 meses; presas: 9 meses' },
          { alimento: 'Pollo cocido (al horno, hervido, al spiedo comprado)', alacena: 'no corresponde', heladera: '3 días', freezer: '4 meses' },
          { alimento: 'Pollo con salsa o caldo', alacena: 'no corresponde', heladera: '3 días', freezer: '1–2 meses' },
          { alimento: 'Patitas, medallones y nuggets de pollo congelados', alacena: 'no corresponde', heladera: 'descongelados: 1–2 días', freezer: '1–3 meses' }
        ]
      },
      {
        titulo: 'Pescados y mariscos',
        filas: [
          { alimento: 'Pescado blanco crudo (merluza, lenguado, abadejo y otros magros)', alacena: 'no corresponde', heladera: '1–2 días', freezer: '6–8 meses' },
          { alimento: 'Pescado graso crudo (salmón, atún, caballa, lisa)', alacena: 'no corresponde', heladera: '1–2 días', freezer: '2–3 meses' },
          { alimento: 'Pescado cocido', alacena: 'no corresponde', heladera: '3 días', freezer: '1–2 meses' },
          { alimento: 'Langostinos y camarones crudos', alacena: 'no corresponde', heladera: '1–3 días', freezer: '6–18 meses' },
          { alimento: 'Calamar crudo', alacena: 'no corresponde', heladera: '1–3 días', freezer: '6–18 meses' },
          { alimento: 'Mejillones y almejas vivos', alacena: 'no corresponde', heladera: '1–2 días', freezer: '2–3 meses' },
          { alimento: 'Mariscos cocidos', alacena: 'no corresponde', heladera: '3 días', freezer: '1–3 meses' },
          { alimento: 'Pescado rebozado congelado (comprado)', alacena: 'no corresponde', heladera: 'cocido: no se recomienda', freezer: '18 meses' },
          { alimento: 'Salmón ahumado en frío, al vacío', alacena: 'no corresponde', heladera: 'cerrado: 21–30 días', freezer: '9–12 meses' },
          { alimento: 'Atún en lata', alacena: '3 años', heladera: 'abierto: 3–4 días', freezer: 'no corresponde' },
          { alimento: 'Anchoas en lata', alacena: '5 años', heladera: 'abiertas: 3–4 días', freezer: '2 meses (fuera de la lata)' },
          { alimento: 'Kanikama (surimi)', alacena: 'no corresponde', heladera: 'hasta la fecha del envase', freezer: '9 meses' }
        ]
      },
      {
        titulo: 'Fiambres y embutidos',
        filas: [
          { alimento: 'Fiambre feteado en la fiambrería (jamón cocido, paleta, mortadela, pavita)', alacena: 'no corresponde', heladera: '3–5 días', freezer: '1–2 meses' },
          { alimento: 'Fiambre feteado envasado', alacena: 'no corresponde', heladera: 'cerrado: 2 semanas; abierto: 3–5 días', freezer: '1–2 meses' },
          { alimento: 'Salame (embutido seco) feteado', alacena: 'no corresponde', heladera: '2–3 semanas', freezer: '1–2 meses' },
          { alimento: 'Jamón crudo', alacena: 'no corresponde', heladera: '2–3 meses', freezer: '1 mes' },
          { alimento: 'Panceta', alacena: 'no corresponde', heladera: '1 semana (cerrada o abierta)', freezer: '1 mes' },
          { alimento: 'Salchichas tipo Viena', alacena: 'no corresponde', heladera: 'cerradas: 2 semanas; abiertas: 1 semana', freezer: '1–2 meses' },
          { alimento: 'Chorizo fresco y salchicha parrillera crudos', alacena: 'no corresponde', heladera: '1–2 días', freezer: '1–2 meses' }
        ]
      },
      {
        titulo: 'Huevos',
        filas: [
          { alimento: 'Huevos con cáscara', alacena: 'no corresponde', heladera: '3–5 semanas', freezer: 'no se recomienda' },
          { alimento: 'Claras o yemas crudas', alacena: 'no corresponde', heladera: '2–4 días', freezer: '12 meses' },
          { alimento: 'Huevo duro', alacena: 'no corresponde', heladera: '1 semana', freezer: 'no se recomienda' },
          { alimento: 'Preparaciones con huevo crudo (mayonesa casera, mousse, mezcla de panqueques)', alacena: 'no corresponde', heladera: '24 horas', freezer: 'no corresponde' },
          { alimento: 'Platos con huevo cocido (tortilla, budín salado, revuelto)', alacena: 'no corresponde', heladera: '3 días', freezer: '2–3 meses' }
        ]
      },
      {
        titulo: 'Lácteos',
        filas: [
          { alimento: 'Leche fresca (sachet o cartón refrigerado)', alacena: 'no corresponde', heladera: 'cerrada: hasta la fecha del envase; abierta: 2–3 días', freezer: '3 meses' },
          { alimento: 'Leche larga vida', alacena: 'cerrada: 6–12 meses', heladera: 'abierta: 3 días', freezer: 'no corresponde' },
          { alimento: 'Leche en polvo', alacena: 'cerrada: 3–5 años; abierta: 3 meses', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Leche condensada', alacena: '12 meses', heladera: 'abierta: 4–5 días', freezer: 'no corresponde' },
          { alimento: 'Crema de leche (para batir o para cocinar)', alacena: 'no corresponde', heladera: 'cerrada: 1 mes; abierta: 1 semana', freezer: 'no se recomienda' },
          { alimento: 'Crema larga vida', alacena: 'cerrada: hasta la fecha del envase', heladera: 'abierta: 1 semana', freezer: 'no se recomienda' },
          { alimento: 'Crema batida (chantilly)', alacena: 'no corresponde', heladera: '1 día', freezer: '1–2 meses' },
          { alimento: 'Manteca', alacena: '1–2 días', heladera: '1–2 meses', freezer: '6–9 meses' },
          { alimento: 'Margarina', alacena: 'no corresponde', heladera: '6 meses', freezer: '12 meses' },
          { alimento: 'Quesos duros en trozo (reggianito, sardo, provolone)', alacena: 'no corresponde', heladera: 'cerrado: 6 meses; abierto: 3–4 semanas', freezer: '6 meses' },
          { alimento: 'Queso rallado envasado', alacena: 'cerrado: hasta la fecha del envase, a menos de 20 °C y sin luz', heladera: '12 meses; abierto, siempre en heladera', freezer: 'no se recomienda' },
          { alimento: 'Queso en hebras', alacena: 'no corresponde', heladera: 'cerrado: 1 mes; abierto: 5 días', freezer: '3–4 meses' },
          { alimento: 'Quesos blandos y semiblandos (cremoso, port salut, queso fresco)', alacena: 'no corresponde', heladera: '1–2 semanas', freezer: '6 meses' },
          { alimento: 'Mozzarella', alacena: 'no corresponde', heladera: '1–2 semanas', freezer: '3–6 meses' },
          { alimento: 'Queso crema untable', alacena: 'no corresponde', heladera: 'cerrado: 2 semanas; abierto: 7 días', freezer: 'no se recomienda' },
          { alimento: 'Ricota', alacena: 'no corresponde', heladera: 'cerrada: 2 semanas; abierta: 1 semana', freezer: 'no se recomienda' },
          { alimento: 'Yogur', alacena: 'no corresponde', heladera: '1–2 semanas', freezer: '1–2 meses' },
          { alimento: 'Dulce de leche (de fábrica)', alacena: 'cerrado: unos 120 días', heladera: 'abierto: hasta 30 días', freezer: 'no corresponde' },
          { alimento: 'Dulce de leche casero', alacena: 'no corresponde', heladera: '15 días', freezer: 'no corresponde' }
        ]
      },
      {
        titulo: 'Frutas',
        filas: [
          { alimento: 'Manzanas', alacena: '3 semanas', heladera: '4–6 semanas', freezer: '8 meses' },
          { alimento: 'Bananas', alacena: 'hasta que maduren', heladera: '3 días (maduras)', freezer: '2–3 meses' },
          { alimento: 'Cítricos (naranja, mandarina, limón, pomelo)', alacena: '10 días', heladera: '10–21 días', freezer: 'no se recomienda' },
          { alimento: 'Duraznos, pelones, ciruelas y peras', alacena: 'hasta que maduren; maduros, 1–2 días', heladera: '3–5 días (maduros)', freezer: '2 meses' },
          { alimento: 'Frutillas, frambuesas y cerezas', alacena: 'no corresponde', heladera: '2–3 días', freezer: '8–12 meses' },
          { alimento: 'Arándanos', alacena: 'no corresponde', heladera: '1–2 semanas', freezer: '8–12 meses' },
          { alimento: 'Uvas', alacena: '1 día', heladera: '1 semana', freezer: '1 mes' },
          { alimento: 'Kiwi', alacena: 'hasta que madure', heladera: '3–6 días (maduro)', freezer: 'no se recomienda' },
          { alimento: 'Palta', alacena: 'hasta que madure', heladera: '3–4 días (madura)', freezer: 'no se recomienda' },
          { alimento: 'Melón', alacena: 'hasta que madure; maduro, 7 días', heladera: 'entero: 2 semanas; cortado: 2–4 días', freezer: '1 mes' },
          { alimento: 'Sandía', alacena: '1–2 días', heladera: '3–4 días', freezer: '12 meses' },
          { alimento: 'Ananá', alacena: 'hasta que madure; maduro, 1–2 días', heladera: '5–7 días', freezer: '10–12 meses' },
          { alimento: 'Mango, papaya y maracuyá', alacena: '3–5 días', heladera: '1 semana', freezer: '6–8 meses' },
          { alimento: 'Frutas secas (pasas de uva, orejones, ciruelas)', alacena: 'cerradas: 6 meses; abiertas: 1 mes', heladera: 'abiertas: 6 meses', freezer: 'no corresponde' },
          { alimento: 'Coco rallado', alacena: 'cerrado: 1 año', heladera: 'abierto: 8 meses', freezer: '1 año' }
        ]
      },
      {
        titulo: 'Verduras y hortalizas',
        filas: [
          { alimento: 'Papas', alacena: '1–2 meses', heladera: '1–2 semanas', freezer: '10–12 meses (cocidas, en puré)' },
          { alimento: 'Batatas', alacena: '2–3 semanas', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Cebollas', alacena: '1 mes', heladera: '2 meses', freezer: '10–12 meses' },
          { alimento: 'Cebolla de verdeo', alacena: '1 mes', heladera: '1 semana', freezer: '10–12 meses' },
          { alimento: 'Ajo', alacena: 'cabeza entera: 1 mes', heladera: 'dientes sueltos: 3–14 días', freezer: '1 mes' },
          { alimento: 'Tomates', alacena: 'hasta que maduren; maduros, 7 días', heladera: 'no se recomienda', freezer: '2 meses' },
          { alimento: 'Tomates cherry', alacena: '10 días', heladera: '5 días', freezer: 'no corresponde' },
          { alimento: 'Zanahorias', alacena: 'no corresponde', heladera: '2–3 semanas', freezer: '10–12 meses' },
          { alimento: 'Lechuga, espinaca y rúcula', alacena: 'no corresponde', heladera: 'de hoja (criolla, mantecosa), espinaca y rúcula: 3–7 días; repollada o romana: 1–2 semanas', freezer: 'no se recomienda' },
          { alimento: 'Hojas lavadas en bolsa', alacena: 'no corresponde', heladera: 'cerrada: 3–5 días después de la fecha de la bolsa; abierta: 2 días', freezer: 'no se recomienda' },
          { alimento: 'Acelga', alacena: 'no corresponde', heladera: '1–2 semanas', freezer: 'no corresponde' },
          { alimento: 'Repollo', alacena: 'no corresponde', heladera: '1–2 semanas', freezer: '10–12 meses' },
          { alimento: 'Brócoli y coliflor', alacena: 'no corresponde', heladera: '3–5 días', freezer: '10–12 meses' },
          { alimento: 'Zapallitos y zucchini', alacena: '1–5 días', heladera: '4–5 días', freezer: '10–12 meses' },
          { alimento: 'Zapallo y calabaza (anco, cabutia)', alacena: '2–6 semanas', heladera: '1–3 meses', freezer: '10–12 meses' },
          { alimento: 'Choclo', alacena: 'no corresponde', heladera: '1–2 días', freezer: '8 meses' },
          { alimento: 'Morrones y pimientos', alacena: 'no corresponde', heladera: '4–14 días', freezer: '6–8 meses' },
          { alimento: 'Berenjenas', alacena: '1 día', heladera: '4–7 días', freezer: '6–8 meses' },
          { alimento: 'Pepinos', alacena: 'no corresponde', heladera: '4–6 días', freezer: 'no se recomienda' },
          { alimento: 'Apio y puerro', alacena: 'no corresponde', heladera: '1–2 semanas', freezer: '10–12 meses' },
          { alimento: 'Chauchas, arvejas frescas y habas', alacena: 'no corresponde', heladera: '3–5 días', freezer: '8 meses' },
          { alimento: 'Champiñones y hongos frescos', alacena: 'no corresponde', heladera: '3–7 días', freezer: '10–12 meses' },
          { alimento: 'Remolachas', alacena: '1 día', heladera: '1–2 semanas', freezer: '6–8 meses' },
          { alimento: 'Perejil fresco', alacena: 'no corresponde', heladera: '2–3 días', freezer: '3–4 meses' },
          { alimento: 'Albahaca fresca', alacena: '5 días (con los tallos en agua)', heladera: '10 días', freezer: 'no corresponde' },
          { alimento: 'Hierbas frescas (orégano, romero, tomillo, ciboulette, menta, cilantro)', alacena: '1–2 semanas', heladera: '2–3 semanas', freezer: 'no se recomienda' },
          { alimento: 'Mandioca', alacena: '7 días', heladera: '3 días', freezer: '1–2 meses' },
          { alimento: 'Verduras congeladas compradas', alacena: 'no corresponde', heladera: 'cocidas: 3 días', freezer: '10–18 meses' }
        ]
      },
      {
        titulo: 'Panificados y masas',
        filas: [
          { alimento: 'Pan casero', alacena: '3–5 días', heladera: 'no se recomienda', freezer: '3 meses' },
          { alimento: 'Pan francés de panadería', alacena: '2–3 días', heladera: 'no corresponde', freezer: '3 meses' },
          { alimento: 'Pan de molde envasado', alacena: '14–18 días', heladera: '2–3 semanas', freezer: '3–5 meses' },
          { alimento: 'Medialunas y facturas', alacena: '1–2 días', heladera: '5–7 días', freezer: '1–2 meses' },
          { alimento: 'Torta o bizcochuelo casero, budín', alacena: '1–2 días', heladera: '7 días', freezer: '2–4 meses' },
          { alimento: 'Torta envasada (de fábrica)', alacena: '3–7 días', heladera: 'abierta: 7–10 días', freezer: '6 meses' },
          { alimento: 'Tortas y tartas con crema o crema pastelera', alacena: 'no corresponde', heladera: '3–4 días', freezer: 'no se recomienda' },
          { alimento: 'Tarta de frutas', alacena: '1–2 días', heladera: '1 semana', freezer: '8 meses' },
          { alimento: 'Cheesecake', alacena: 'no corresponde', heladera: '5–7 días', freezer: '3–6 meses' },
          { alimento: 'Muffins', alacena: '3–7 días', heladera: 'no se recomienda', freezer: '2–3 meses' },
          { alimento: 'Galletitas dulces', alacena: 'crocantes: 4–6 meses; blandas: 2–3 meses', heladera: 'no corresponde', freezer: '8–12 meses' },
          { alimento: 'Galletitas de agua y crackers', alacena: 'cerradas: 8 meses; abiertas: 1 mes', heladera: 'abiertas: 3–4 meses', freezer: '3–4 meses' },
          { alimento: 'Pan rallado', alacena: '6 meses', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Tapas de empanada compradas', alacena: 'no corresponde', heladera: 'hasta la fecha del envase; abiertas: 24 horas', freezer: 'hasta 6 meses' },
          { alimento: 'Tapas de tarta (pascualina) compradas', alacena: 'no corresponde', heladera: 'hasta la fecha del envase; abiertas: 24 horas', freezer: 'hasta 6 meses' },
          { alimento: 'Pastas frescas compradas (ravioles, sorrentinos, ñoquis)', alacena: 'no corresponde', heladera: 'hasta la fecha del envase; abiertas: 24 horas', freezer: 'hasta 6 meses' },
          { alimento: 'Pasta fresca casera', alacena: 'no corresponde', heladera: '1–2 días', freezer: '2 meses' },
          { alimento: 'Masa casera cruda con levadura (pan, pizza)', alacena: 'no corresponde', heladera: '1–2 días', freezer: '2–3 meses' },
          { alimento: 'Masa de hojaldre congelada', alacena: 'no corresponde', heladera: 'no corresponde', freezer: '12 meses' }
        ]
      },
      {
        titulo: 'Secos y de alacena',
        filas: [
          { alimento: 'Harina de trigo (000, 0000)', alacena: 'cerrada: 6–12 meses; abierta: 6–8 meses', heladera: 'abierta: 1 año', freezer: 'no corresponde' },
          { alimento: 'Harina integral', alacena: 'cerrada: 3–6 meses', heladera: 'abierta: 6–8 meses', freezer: 'no corresponde' },
          { alimento: 'Harina de maíz y polenta', alacena: 'cerrada: 6–12 meses', heladera: 'abierta: 1 año', freezer: 'no corresponde' },
          { alimento: 'Fécula de maíz', alacena: 'cerrada: 18–24 meses; abierta: 18 meses', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Arroz blanco', alacena: 'cerrado: 2 años; abierto: 1 año', heladera: 'abierto: 6 meses', freezer: 'no corresponde' },
          { alimento: 'Arroz integral', alacena: '1 año (cerrado o abierto)', heladera: 'abierto: 6 meses', freezer: 'no corresponde' },
          { alimento: 'Fideos secos', alacena: 'cerrados: 2 años; abiertos: 1 año', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Porotos secos', alacena: 'cerrados: 1–2 años; abiertos: 1 año', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Lentejas y arvejas secas partidas', alacena: '1 año (cerradas o abiertas)', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Avena', alacena: 'cerrada: 12 meses; abierta: 6–12 meses', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Azúcar (común, negra, impalpable)', alacena: 'indefinida; abierta, mejor calidad 18–24 meses', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Sal', alacena: 'indefinida', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Aceite de girasol, maíz, mezcla u oliva', alacena: 'cerrado: 6–12 meses; abierto: 3–5 meses', heladera: 'abierto: 4 meses', freezer: 'no corresponde' },
          { alimento: 'Aceite usado de freír', alacena: 'no corresponde', heladera: '1 mes', freezer: '6–9 meses' },
          { alimento: 'Vinagre', alacena: '2 años', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Miel', alacena: '2 años', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Mermeladas', alacena: 'cerradas: 6–18 meses', heladera: 'abiertas: 6–12 meses', freezer: 'no corresponde' },
          { alimento: 'Cacao en polvo', alacena: 'cerrado: indefinido; abierto: 1 año', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Chocolate de taza o semiamargo', alacena: 'cerrado: 1–2 años; abierto: 1 año', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Polvo de hornear', alacena: 'cerrado: 6–18 meses; abierto: 3–6 meses', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Bicarbonato de sodio', alacena: 'cerrado: 2–3 años; abierto: 6 meses', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Levadura seca', alacena: 'cerrada: 2 años', heladera: 'abierta: 4 meses', freezer: '6 meses' },
          { alimento: 'Gelatina sin sabor', alacena: 'cerrada: 3 años', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Esencia de vainilla', alacena: 'cerrada: 2 años; abierta: 12 meses', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Especias y hierbas secas', alacena: 'molidas: 2–3 años; enteras: 3–4 años; hierbas secas: 1–2 años', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Caldo en cubitos', alacena: '1 año (cerrado o abierto)', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Conservas en lata de baja acidez (choclo, arvejas, porotos, carnes, pescados)', alacena: '2–5 años; abiertas: no se recomienda', heladera: 'abiertas: 3–4 días', freezer: 'no corresponde' },
          { alimento: 'Conservas ácidas (frutas en almíbar, jugos, pickles, chucrut)', alacena: '12–18 meses; abiertas: no se recomienda', heladera: 'abiertas: 5–7 días', freezer: 'no corresponde' },
          { alimento: 'Salsa de tomate envasada (frasco o caja)', alacena: 'hasta la fecha del envase', heladera: 'abierta: 3–5 días', freezer: 'no corresponde' },
          { alimento: 'Extracto de tomate', alacena: '27 meses', heladera: 'abierto: 5 días', freezer: '2–3 meses' },
          { alimento: 'Aceitunas', alacena: 'cerradas: 12–18 meses', heladera: 'abiertas: 2 semanas', freezer: 'no corresponde' },
          { alimento: 'Nueces', alacena: '2–4 semanas', heladera: '9–12 meses', freezer: '24 meses' },
          { alimento: 'Almendras peladas', alacena: '4 meses', heladera: '8 meses', freezer: '10 meses' },
          { alimento: 'Maní pelado', alacena: '4 semanas', heladera: '12 meses', freezer: '24 meses' },
          { alimento: 'Semillas (chía, sésamo, lino entero)', alacena: 'chía: 18 meses; sésamo: 5 años; lino entero: 2 años', heladera: 'lino molido: 12 meses', freezer: 'lino molido: 12 meses' },
          { alimento: 'Café molido', alacena: 'cerrado: 2 años; abierto: 2 semanas', heladera: 'abierto: 1 mes', freezer: '6–12 meses' },
          { alimento: 'Té en saquitos', alacena: 'cerrado: 18–36 meses; abierto: 6–12 meses', heladera: 'no corresponde', freezer: 'no corresponde' }
        ]
      },
      {
        titulo: 'Salsas y condimentos',
        filas: [
          { alimento: 'Mayonesa (de fábrica)', alacena: 'cerrada: 3–6 meses', heladera: 'abierta: 2 meses', freezer: 'no se recomienda' },
          { alimento: 'Mostaza', alacena: 'cerrada: 1–2 años', heladera: 'abierta: 1 año', freezer: 'no corresponde' },
          { alimento: 'Ketchup', alacena: 'cerrado: 1 año', heladera: 'abierto: 6 meses', freezer: 'no corresponde' },
          { alimento: 'Aderezos envasados', alacena: 'cremosos: 6 meses cerrados; vinagreta: 6 meses cerrada', heladera: 'cremosos abiertos: 3–4 semanas; vinagreta abierta: 4 semanas', freezer: 'no se recomienda' },
          { alimento: 'Salsa de soja', alacena: 'cerrada: 3 años', heladera: 'abierta: 1 mes', freezer: 'no corresponde' },
          { alimento: 'Salsa inglesa', alacena: '1 año', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Salsa picante', alacena: '6 meses', heladera: 'no corresponde', freezer: 'no corresponde' },
          { alimento: 'Pesto envasado', alacena: 'no corresponde', heladera: 'cerrado: 6 meses; abierto: 3 días', freezer: '1 mes' },
          { alimento: 'Pesto casero', alacena: 'no corresponde', heladera: '4–5 días', freezer: '3–4 meses' },
          { alimento: 'Vinagreta casera', alacena: 'no corresponde', heladera: '2–3 semanas', freezer: 'no corresponde' },
          { alimento: 'Salsa fresca de tomate crudo casera', alacena: 'no corresponde', heladera: '5–7 días', freezer: '12 meses' },
          { alimento: 'Guacamole', alacena: 'no corresponde', heladera: '3–4 días', freezer: '3–4 meses' },
          { alimento: 'Hummus casero', alacena: 'no corresponde', heladera: '7 días', freezer: 'no se recomienda' }
        ]
      },
      {
        titulo: 'Comidas cocidas y sobras',
        filas: [
          { alimento: 'Sobras con carne, pollo, pescado o huevo', alacena: 'no corresponde', heladera: '3 días', freezer: '2–3 meses' },
          { alimento: 'Sobras sin carne (verduras cocidas, arroz, papas)', alacena: 'no corresponde', heladera: '3 días', freezer: '1–2 meses' },
          { alimento: 'Caldo casero', alacena: 'no corresponde', heladera: '3 días', freezer: '2–3 meses' },
          { alimento: 'Caldo comprado (en caja)', alacena: 'cerrado: hasta la fecha del envase', heladera: 'abierto: 3–4 días', freezer: '2–3 meses' },
          { alimento: 'Sopas, guisos y estofados (locro, carbonada, carne con salsa)', alacena: 'no corresponde', heladera: '3 días', freezer: '2–3 meses' },
          { alimento: 'Salsa de tomate casera (fileto, bolognesa)', alacena: 'no corresponde', heladera: '3 días', freezer: '4–6 meses' },
          { alimento: 'Empanadas cocidas', alacena: 'no corresponde', heladera: '3 días', freezer: '1–2 meses' },
          { alimento: 'Tartas saladas (pascualina, tarta de verdura, quiche)', alacena: 'máximo 2 horas', heladera: '3 días', freezer: '2–3 meses' },
          { alimento: 'Tortilla de papa', alacena: 'no corresponde', heladera: '3 días', freezer: '2–3 meses' },
          { alimento: 'Pizza', alacena: 'no corresponde', heladera: '3 días', freezer: '1–2 meses' },
          { alimento: 'Pasta cocida', alacena: 'no corresponde', heladera: '3 días', freezer: '1–2 meses' },
          { alimento: 'Arroz cocido', alacena: 'no corresponde', heladera: '3 días', freezer: '6 meses' },
          { alimento: 'Legumbres cocidas (porotos, lentejas, garbanzos)', alacena: 'no corresponde', heladera: '3 días', freezer: '6 meses' },
          { alimento: 'Puré de papas y papas cocidas', alacena: 'no corresponde', heladera: '3 días', freezer: '10–12 meses' },
          { alimento: 'Ensalada de papa o rusa', alacena: 'no corresponde', heladera: '3 días', freezer: 'no se recomienda' },
          { alimento: 'Ensaladas de atún, pollo o huevo', alacena: 'no corresponde', heladera: '3 días', freezer: 'no se recomienda' }
        ]
      }
    ],
    fuentes: []
  }
} satisfies Record<string, Tabla>;
