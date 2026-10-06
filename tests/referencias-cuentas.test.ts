// tests/referencias-cuentas.test.ts
import { describe, it, expect } from 'vitest';
import {
  cuentaMolde, cuentaPastaFresca, cuentaBolloPizza, cuentaMerengue, cuentaPuntoAzucar, fraccion,
  cuentaArroz, cuentaAguaSalPasta, cuentaEspagueti, cuentaCaldo, tablaDeArroz,
  cuentaConversion, medidaPractica, tablaDePesos, tablaDeSistemas, tablaDeMedidasEeuu
} from '../src/referencias/cuentas.js';
import { CONVERSOR } from '../src/referencias/datos/conversor.js';
import { problemasDeForma } from '../src/referencias/forma.js';

const fuente = { nombre: 'F', url: 'https://f.com' };
const k = (valor: number, unidad = '') => ({ valor, unidad, fuente });
const valor = (r: ReturnType<ReturnType<typeof cuentaMolde>['calcular']>, nombre: string) =>
  r?.lineas.find(l => l.nombre === nombre)?.valor;

describe('el molde', () => {
  const molde = cuentaMolde({
    densidad: k(2), llenado: k(0.5), notas: [], fuenteAtajos: fuente,
    atajos: [{ id: 'n10', texto: 'N.º 10', forma: 'redondo', diametro: 10, alto: 4 }]
  });
  it('redondo: volumen por llenado por densidad, con la densidad y el llenado de las constantes', () => {
    // π·5²·4 = 314,16 ml → 0,3 l; masa = 314,16 · 0,5 · 2 = 314 g
    const r = molde.calcular({ molde: 'medidas', forma: 'redondo', diametro: 10, alto: 4, llenado: null });
    expect(valor(r, 'Capacidad')).toBe('0,3 l');
    expect(valor(r, 'Masa cruda')).toBe('314 g');
    expect(r?.fuentes).toContain(fuente);
  });
  it('un atajo usa sus medidas', () => {
    const r = molde.calcular({ molde: 'n10', llenado: null });
    expect(valor(r, 'Masa cruda')).toBe('314 g');
  });
  it('rectangular y con tubo', () => {
    expect(valor(molde.calcular({ molde: 'medidas', forma: 'rectangular', largo: 10, ancho: 10, alto: 2, llenado: null }), 'Masa cruda')).toBe('200 g');
    // anillo: π·(5² − 2²)·4 = 263,9 → 264 g
    expect(valor(molde.calcular({ molde: 'medidas', forma: 'tubo', diametro: 10, tubo: 4, alto: 4, llenado: null }), 'Masa cruda')).toBe('264 g');
  });
  it('un tipo de molde sin diámetro lo toma de lo que se escribe', () => {
    const tipo = cuentaMolde({
      densidad: k(2), llenado: k(0.5), notas: [], fuenteAtajos: fuente,
      atajos: [{ id: 'bizcochuelo', texto: 'Bizcochuelo', forma: 'redondo', alto: 4 }]
    });
    expect(valor(tipo.calcular({ molde: 'bizcochuelo', diametro: 10, llenado: null }), 'Masa cruda')).toBe('314 g');
    expect(tipo.calcular({ molde: 'bizcochuelo', llenado: null })).toBeNull();
  });
  it('un llenado de más de 100 % o de menos de 1 % no calcula: resultado vacío con el aviso', () => {
    for (const llenado of [150, 0.5]) {
      const r = molde.calcular({ molde: 'medidas', forma: 'redondo', diametro: 10, alto: 4, llenado });
      expect(r?.lineas).toEqual([]);
      expect(r?.advertencias).toEqual(['El llenado va de 1 a 100 %.']);
    }
    expect(valor(molde.calcular({ molde: 'medidas', forma: 'redondo', diametro: 10, alto: 4, llenado: 100 }), 'Masa cruda')).toBe('628 g');
  });
  it('cada atajo cita su fuente, y los que no tienen una propia, la de los atajos', () => {
    const otra = { nombre: 'Otra', url: 'https://otra.com' };
    const deAtajos = { nombre: 'Atajos', url: 'https://atajos.com' };
    const m = cuentaMolde({
      densidad: k(2), llenado: k(0.5), notas: [], fuenteAtajos: deAtajos,
      atajos: [
        { id: 'a', texto: 'A', forma: 'redondo', diametro: 10, alto: 4 },
        { id: 'b', texto: 'B', forma: 'redondo', diametro: 10, alto: 4, fuente: otra }
      ]
    });
    expect(m.calcular({ molde: 'a', llenado: null })?.fuentes).toContain(deAtajos);
    const deB = m.calcular({ molde: 'b', llenado: null })?.fuentes;
    expect(deB).toContain(otra);
    expect(deB).not.toContain(deAtajos);
  });
  it('una medida vacía, en cero o negativa: sin resultado', () => {
    expect(molde.calcular({ molde: 'medidas', forma: 'redondo', diametro: 0, alto: 4, llenado: null })).toBeNull();
    expect(molde.calcular({ molde: 'medidas', forma: 'redondo', diametro: -3, alto: 4, llenado: null })).toBeNull();
    expect(molde.calcular({ molde: 'medidas', forma: 'redondo', diametro: null, alto: 4, llenado: null })).toBeNull();
  });
});

describe('la pasta fresca', () => {
  const pasta = cuentaPastaFresca([
    { id: 'huevo', texto: 'Al huevo', ingredientes: [{ nombre: 'Harina', cantidad: 100, unidad: 'g' }, { nombre: 'Huevos', cantidad: 1, unidad: 'u' }], notas: ['Sal: una pizca.'], fuente },
    { id: 'yemas', texto: 'De yemas', ingredientes: [{ nombre: 'Yemas', cantidad: 3, cantidadMax: 4, unidad: 'u' }], notas: [], fuente },
    { id: 'rellena', texto: 'Rellena', ingredientes: [{ nombre: 'Huevos', cantidad: 0.5, unidad: 'u' }], notas: [], fuente }
  ]);
  it('multiplica por las porciones y escribe huevos con fracciones', () => {
    expect(pasta.calcular({ porciones: 3, masa: 'huevo' })?.lineas).toEqual([{ nombre: 'Harina', valor: '300 g' }, { nombre: 'Huevos', valor: '3' }]);
    expect(pasta.calcular({ porciones: 3, masa: 'rellena' })?.lineas).toEqual([{ nombre: 'Huevos', valor: '1 ½' }]);
  });
  it('un rango queda rango', () => {
    expect(pasta.calcular({ porciones: 2, masa: 'yemas' })?.lineas).toEqual([{ nombre: 'Yemas', valor: '6 a 8' }]);
  });
  it('sin porciones, o con una masa que no existe: sin resultado', () => {
    expect(pasta.calcular({ porciones: null, masa: 'huevo' })).toBeNull();
    expect(pasta.calcular({ porciones: 2, masa: 'otra' })).toBeNull();
  });
});

describe('el bollo de pizza', () => {
  const pizza = cuentaBolloPizza({
    napolitana: [{ desde: 20, hasta: 25, gramos: 200 }], molde: [{ numero: 30, min: 300, max: 330 }],
    gramosPorCm2Molde: k(0.5), fuenteNapolitana: fuente, fuenteMolde: fuente
  });
  it('lleva las notas de sus constantes, o ninguna', () => {
    expect(pizza.notas).toEqual([]);
    const conNotas = cuentaBolloPizza({ napolitana: [], molde: [], gramosPorCm2Molde: k(1), fuenteNapolitana: fuente, fuenteMolde: fuente, notas: ['Una nota.'] });
    expect(conNotas.notas).toEqual(['Una nota.']);
  });
  it('napolitana: el peso de su rango, por la cantidad', () => {
    expect(pizza.calcular({ estilo: 'napolitana', diametro: 22, cantidad: 3 })?.lineas)
      .toEqual([{ nombre: 'Cada bollo', valor: '200 g' }, { nombre: 'Masa total', valor: '600 g' }]);
  });
  it('napolitana entre dos filas: toma la que empieza antes', () => {
    const entre = cuentaBolloPizza({
      napolitana: [{ desde: 20, hasta: 22, gramos: 200 }, { desde: 23, hasta: 25, gramos: 240 }], molde: [],
      gramosPorCm2Molde: k(0.5), fuenteNapolitana: fuente, fuenteMolde: fuente
    });
    expect(entre.calcular({ estilo: 'napolitana', diametro: 22.5, cantidad: 1 })?.lineas[0]).toEqual({ nombre: 'Cada bollo', valor: '200 g' });
    expect(entre.calcular({ estilo: 'napolitana', diametro: 25, cantidad: 1 })?.lineas[0]).toEqual({ nombre: 'Cada bollo', valor: '240 g' });
    expect(entre.calcular({ estilo: 'napolitana', diametro: 25.5, cantidad: 1 })?.lineas).toEqual([]);
  });
  it('napolitana fuera de la tabla: sin resultado y con el porqué', () => {
    expect(pizza.calcular({ estilo: 'napolitana', diametro: 40, cantidad: 1 })?.lineas).toEqual([]);
    expect(pizza.calcular({ estilo: 'napolitana', diametro: 40, cantidad: 1 })?.advertencias[0]).toContain('20 a 25 cm');
  });
  it('al molde: el rango de su número, o el factor por la superficie', () => {
    expect(pizza.calcular({ estilo: 'molde', diametro: 30, cantidad: 1 })?.lineas[0]).toEqual({ nombre: 'Cada bollo', valor: '300 a 330 g' });
    // 0,5 · π · 10² = 157 g
    expect(pizza.calcular({ estilo: 'molde', diametro: 20, cantidad: 1 })?.lineas[0]).toEqual({ nombre: 'Cada bollo', valor: '157 g' });
  });
});

describe('el merengue', () => {
  const merengue = cuentaMerengue([
    { id: 'italiano', nombre: 'Italiano', azucarPorClara: 1.5, impalpablePorClara: 0, aguaPorAzucarAlmibar: 0.5, azucarAlmibarPorClara: 1, temperatura: 'Almíbar a 100 °C', fuente }
  ]);
  it('azúcar, agua del almíbar y temperatura, por los gramos de claras', () => {
    expect(merengue.calcular({ claras: 100, tipo: 'italiano' })?.lineas).toEqual([
      { nombre: 'Azúcar', valor: '150 g' }, { nombre: 'Azúcar del almíbar', valor: '100 g' },
      { nombre: 'Agua del almíbar', valor: '50 g' }, { nombre: 'Temperatura', valor: 'Almíbar a 100 °C' }
    ]);
  });
  it('un tipo sin almíbar no dice ni su azúcar ni su agua', () => {
    const sin = cuentaMerengue([{ id: 'f', nombre: 'F', azucarPorClara: 1, impalpablePorClara: 0, aguaPorAzucarAlmibar: 0, azucarAlmibarPorClara: 0, temperatura: 't', fuente }]);
    expect(sin.calcular({ claras: 100, tipo: 'f' })?.lineas.map(l => l.nombre)).toEqual(['Azúcar', 'Temperatura']);
  });
});

describe('los puntos del azúcar', () => {
  const azucar = cuentaPuntoAzucar({
    metrosPorGrado: k(100), notas: [], fuente,
    puntos: [{ nombre: 'Hilo', min: 110, max: 112, prueba: 'hilo', usos: 'almíbar' }, { nombre: 'Caramelo', min: 160, max: null, prueba: '—', usos: '—' }]
  });
  it('a nivel del mar, la tabla tal cual', () => {
    expect(azucar.calcular({ referencia: 'altitud', altitud: 0, hervor: null })?.tabla?.filas[0]).toEqual(['Hilo', '110–112', 'hilo', 'almíbar']);
  });
  it('con la altitud, resta un grado cada tantos metros', () => {
    expect(azucar.calcular({ referencia: 'altitud', altitud: 300, hervor: null })?.tabla?.filas.map(f => f[1])).toEqual(['107–109', '157']);
  });
  it('una altitud infinita se toma como inválida, igual que 0', () => {
    expect(azucar.calcular({ referencia: 'altitud', altitud: Infinity, hervor: null })?.tabla?.filas.map(f => f[1])).toEqual(['110–112', '160']);
  });
  it('con el hervor medido, resta la diferencia con 100 °C', () => {
    expect(azucar.calcular({ referencia: 'hervor', altitud: null, hervor: 96 })?.tabla?.filas.map(f => f[1])).toEqual(['106–108', '156']);
  });
  it('un hervor fuera de lo que lee un termómetro no corre la tabla: avisa', () => {
    for (const hervor of [5, 69, 101, 212]) {
      const r = azucar.calcular({ referencia: 'hervor', altitud: null, hervor });
      expect(r?.tabla).toBeUndefined();
      expect(r?.advertencias).toEqual(['El agua hierve entre 70 y 100 °C; revisá la lectura del termómetro.']);
    }
    expect(azucar.calcular({ referencia: 'hervor', altitud: null, hervor: 70 })?.tabla).toBeDefined();
    expect(azucar.calcular({ referencia: 'hervor', altitud: null, hervor: 100 })?.tabla?.filas[0]?.[1]).toBe('110–112');
  });
});

it('fraccion escribe medios, tercios y cuartos', () => {
  expect([0.5, 1, 1.5, 1 / 3, 0.25, 2.75, 0.4].map(fraccion)).toEqual(['½', '1', '1 ½', '⅓', '¼', '2 ¾', '0,4']);
});

describe('el arroz', () => {
  const arroz = { fuente, notas: [], variedades: [
    { id: 'largo', nombre: 'Largo fino', partesVolumen: '2', aguaPorGramo: 2, tiempo: '15–18 min' },
    { id: 'parboil', nombre: 'Parboil', partesVolumen: '2¼', aguaPorGramo: null, tiempo: '20–30 min' }
  ] };
  it('agua en gramos por los gramos de arroz, y el tiempo', () => {
    expect(cuentaArroz(arroz).calcular({ gramos: 200, variedad: 'largo' })?.lineas)
      .toEqual([{ nombre: 'Agua', valor: '400 g' }, { nombre: 'Tiempo', valor: '15–18 min' }]);
  });
  it('sin dato en peso, las partes en volumen', () => {
    expect(cuentaArroz(arroz).calcular({ gramos: 200, variedad: 'parboil' })?.lineas[0])
      .toEqual({ nombre: 'Agua', valor: '2¼ partes por cada parte de arroz, en volumen' });
  });
  it('la tabla de variedades sale de la misma lista', () => {
    const tabla = tablaDeArroz(arroz);
    expect('filas' in tabla && tabla.filas.length).toBe(2);
  });
});

it('agua y sal de la pasta', () => {
  const c = cuentaAguaSalPasta({ litrosPor100g: k(2), salPorLitro: k(5) });
  expect(c.calcular({ gramos: 300 })?.lineas).toEqual([{ nombre: 'Agua', valor: '6 l' }, { nombre: 'Sal', valor: '30 g' }]);
  expect(c.calcular({ gramos: 0 })).toBeNull();
});

it('el medidor de espagueti, de gramos a diámetro y al revés', () => {
  const c = cuentaEspagueti({ gramosPorCm2: k(25) });
  expect(c.calcular({ desde: 'gramos', valor: 100 })?.lineas).toEqual([{ nombre: 'Diámetro del atado', valor: '2 cm' }]);
  expect(c.calcular({ desde: 'diametro', valor: 2 })?.lineas).toEqual([{ nombre: 'Pasta', valor: '100 g' }]);
});

it('el caldo: agua y mirepoix por kilo, repartido, y el tiempo del tipo', () => {
  const c = cuentaCaldo({
    aguaPorKg: k(2), mirepoixMinPorKg: k(100), mirepoixMaxPorKg: k(200), reparto: { cebolla: 2, zanahoria: 1, apio: 1 },
    tipos: [{ id: 'ave', nombre: 'De ave', principal: 'carcasas', antes: 'crudo', tiempo: '3–4 h' }], procedimiento: 'Agua fría.', fuente
  });
  expect(c.calcular({ kilos: 2, tipo: 'ave' })?.lineas).toEqual([
    { nombre: 'Agua', valor: '4 l' }, { nombre: 'Mirepoix', valor: '200 a 400 g' },
    { nombre: 'Cebolla', valor: '100 a 200 g' }, { nombre: 'Zanahoria', valor: '50 a 100 g' }, { nombre: 'Apio', valor: '50 a 100 g' },
    { nombre: 'Tiempo', valor: '3–4 h' }
  ]);
});

describe('el conversor', () => {
  const abreviada = { ...fuente, abreviatura: 'F' };
  const ka = (valor: number, unidad = '') => ({ valor, unidad, fuente: abreviada });
  // Números inventados, redondos, para que se vea de dónde sale cada uno: la taza de «eeuu» mide 200 ml.
  const datos = {
    sistemas: [
      { id: 'metrica', nombre: 'Métrica', taza: 250, cucharada: 15, cucharadita: 5, fuentes: [abreviada] },
      { id: 'eeuu', nombre: 'EE. UU.', taza: 200, cucharada: 10, cucharadita: 5, fuentes: [abreviada] }
    ],
    unidades: {
      flOz: ka(30, 'ml'), oz: ka(25, 'g'), lb: ka(400, 'g'),
      dash: ka(1 / 8), pinch: ka(1 / 16), smidgen: ka(1 / 32), stick: ka(0.5)
    },
    ingredienteDelStick: 'manteca',
    ingredientes: [
      // 100 g en 250 ml: 0,4 g/ml.
      { id: 'harina', nombre: 'Harina', grupo: 'Harinas', medida: { cantidad: 1, unidad: 'taza', sistema: 'metrica', gramos: 100 }, fuente: abreviada },
      // 200 g en 200 ml: 1 g/ml.
      { id: 'manteca', nombre: 'Manteca', grupo: 'Grasas', medida: { cantidad: 1, unidad: 'taza', sistema: 'eeuu', gramos: 200 }, fuente: abreviada }
    ],
    notas: ['Al ras.'], notasMedidas: []
  } satisfies typeof CONVERSOR;
  const conversion = cuentaConversion(datos);
  const convertir = (cantidad: number, unidad: string, ingrediente = '', sistema = 'metrica') =>
    conversion.calcular({ cantidad, unidad, ingrediente, sistema });
  const nombres = (r: ReturnType<typeof convertir>) => r?.lineas.map(l => l.nombre);

  it('los gramos salen de la medida del ingrediente, y la taza mide lo de su sistema', () => {
    const r = convertir(1, 'taza', 'harina');
    expect(valor(r, 'Tazas (250 ml)')).toBe('1');
    expect(valor(r, 'g')).toBe('100');
    expect(valor(r, 'oz')).toBe('4,0');
    expect(valor(convertir(1, 'taza', 'harina', 'eeuu'), 'g')).toBe('80');
    expect(valor(convertir(1, 'taza', 'harina', 'eeuu'), 'Tazas (200 ml)')).toBe('1');
  });

  it('de peso a volumen, con la fracción práctica más cercana', () => {
    expect(valor(convertir(100, 'g', 'harina'), 'Tazas (250 ml)')).toBe('1');
    const r = convertir(30, 'g', 'harina');
    expect(valor(r, 'Tazas (250 ml)')).toBe('≈ ⅓');
    expect(valor(r, 'Cucharadas (15 ml)')).toBe('5');
  });

  it('sin ingrediente no cruza entre volumen y peso, y lo dice', () => {
    const volumen = convertir(1, 'taza');
    expect(nombres(volumen)).not.toContain('g');
    expect(valor(volumen, 'Gramos')).toBe('Elegí un ingrediente para pasar a peso');
    const peso = convertir(100, 'g');
    expect(valor(peso, 'oz')).toBe('4,0');
    expect(nombres(peso)).not.toContain('Tazas (250 ml)');
    expect(valor(peso, 'Tazas y cucharas')).toBe('Elegí un ingrediente para pasar a volumen');
  });

  it('el stick es de manteca: media taza del sistema de EE. UU.', () => {
    expect(convertir(1, 'stick', 'harina')?.lineas).toEqual([{ nombre: 'Stick', valor: 'Es una medida de manteca: elegí Manteca' }]);
    expect(convertir(1, 'stick')?.lineas).toEqual([{ nombre: 'Stick', valor: 'Es una medida de manteca: elegí Manteca' }]);
    const r = convertir(1, 'stick', 'manteca');
    expect(valor(r, 'g')).toBe('100');
    expect(valor(r, 'Sticks')).toBe('1');
    expect(nombres(convertir(100, 'g', 'harina'))).not.toContain('Sticks');
  });

  it('una cantidad muy chica no se muestra en cucharas, y una muy grande no se cuenta en cucharas', () => {
    const pinch = convertir(1, 'pinch');
    expect(nombres(pinch)).toEqual(['ml', 'Gramos']);
    expect(valor(pinch, 'ml')).toBe('0,31');
    expect(nombres(convertir(5000, 'g', 'harina'))).not.toContain('Cucharadas (15 ml)');
    // 1 g son 0,04 oz: redondea a cero y no se muestra.
    expect(nombres(convertir(1, 'g'))).not.toContain('oz');
  });

  it('las unidades fijas salen de sus constantes', () => {
    expect(valor(convertir(1, 'fl oz'), 'ml')).toBe('30');
    expect(valor(convertir(1, 'lb'), 'g')).toBe('400');
    expect(valor(convertir(1, 'kg'), 'g')).toBe('1000');
    expect(valor(convertir(1, 'l'), 'ml')).toBe('1000');
  });

  it('sin cantidad, nada; y el resultado trae la advertencia y las fuentes', () => {
    expect(convertir(0, 'taza')).toBeNull();
    expect(conversion.calcular({ cantidad: null, unidad: 'taza', ingrediente: '', sistema: 'metrica' })).toBeNull();
    const r = convertir(1, 'taza', 'harina');
    expect(r?.advertencias).toEqual(['Al ras.']);
    expect(r?.fuentes).toContain(abreviada);
    // El sistema, el ingrediente y las oz citan la misma fuente: va una sola vez.
    expect(r?.fuentes).toHaveLength(1);
  });

  it('la fracción práctica: exacta sin «≈», aproximada con él, y cero no se muestra', () => {
    const taza = [0, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4];
    expect(medidaPractica(0.75, taza)).toBe('¾');
    expect(medidaPractica(1.5, taza)).toBe('1 ½');
    expect(medidaPractica(2.3, taza)).toBe('≈ 2 ⅓');
    expect(medidaPractica(2, taza)).toBe('2');
    expect(medidaPractica(0.01, [0, 1 / 2])).toBe('');
  });

  it('la tabla de pesos: agrupada, en la taza y las cucharas métricas', () => {
    const t = tablaDePesos(datos);
    expect('grupos' in t && t.grupos.map(g => g.titulo)).toEqual(['Harinas', 'Grasas']);
    const harina = 'grupos' in t ? t.grupos[0]!.filas[0] : undefined;
    expect(harina).toMatchObject({ ingrediente: 'Harina', taza: '100', cucharada: '6,0', cucharadita: '2,0', fuente: 'F' });
    expect(t.columnas.map(c => c.unidad)).toEqual([undefined, 'g, 250 ml', 'g, 15 ml', 'g, 5 ml', undefined]);
  });

  it('las tres tablas, con los datos de la app, tienen buena forma', () => {
    for (const t of [tablaDePesos(CONVERSOR), tablaDeSistemas(CONVERSOR), tablaDeMedidasEeuu(CONVERSOR)]) expect(problemasDeForma(t), t.id).toEqual([]);
  });
});
