import { describe, it, expect } from 'vitest';
import {
  calcularPan, fermentacionesPara, cantidadAlCambiar, bolloDe, conFermentacion, conLevadura, segundaAlMezclar,
  cifrasPan, lineasPan, lineasPrefermento, advertenciasPan,
  conTemperatura, alElegirTipo, hidratacionAlCambiarHarinas, datosUsados, PANES, PREFERMENTOS, PREFERMENTOS_CON_LEVADURA,
  LEVADURA_POR_TEMPERATURA, BOLLOS_POR_DEFECTO, HIDRATACION_MAXIMA, FERMENTACIONES, HARINAS, SAL, DIVISOR_SECA,
  PORCENTAJE_SEGUNDA_POR_DEFECTO, SEGUNDA_POR_DEFECTO,
  ADVERTENCIA_TIEMPOS, ADVERTENCIA_AMBIENTE, ADVERTENCIA_MUY_FRIO, ADVERTENCIA_FRIO,
  type DatosPan, type ClavePan, type ClaveHarina, type ClaveFermentacion
} from '../src/calculadoras/pan.js';
import { gramos, porciento } from '../src/calculadoras/gramos.js';

// Los números de las tablas son parametrizaciones que se corrigen en su
// archivo: los tests los leen de ahí y prueban la cuenta, no cuánto valen.
const panDe = (clave: ClavePan) => PANES.find(p => p.clave === clave)!;
const fermentacionDe = (clave: ClaveFermentacion) => FERMENTACIONES.find(f => f.clave === clave)!;
const prefermentoDe = (clave: 'poolish' | 'biga' | 'pate') => PREFERMENTOS_CON_LEVADURA.find(p => p.clave === clave)!;
const ajuste = (clave: ClaveHarina) => HARINAS.find(h => h.clave === clave)!.ajuste;
/** Cuánto se corre la hidratación, a menos del redondeo a un decimal. */
const cerca = (real: number, esperado: number) => expect(Math.abs(real - esperado)).toBeLessThanOrEqual(0.05 + 1e-9);

const H = 1000;
const base: DatosPan = {
  pan: 'campo', harina: '000', segunda: null, porcentajeSegunda: 30, hidratacion: 72,
  prefermento: null, levadura: 'fresca', fermentacion: 'ambiente-8', temperatura: '18-24',
  cantidad: { de: 'harina', gramos: 1000 }, horasPrefermento: 0
};

describe('calcularPan', () => {
  it('1 kg de 000 al 72 %, fresca, 8 h: la sal y la levadura, por ciento de la harina', () => {
    const r = calcularPan(base)!;
    const levadura = H * fermentacionDe('ambiente-8').fresca / 100;
    expect(r.hidratacion).toBe(72);
    expect(r.agua).toBeCloseTo(720);
    expect(r.sal).toBeCloseTo(H * SAL / 100);
    expect(r.levadura).toBeCloseTo(levadura);
    expect(r.masaTotal).toBeCloseTo(H + 720 + H * SAL / 100 + levadura);
    expect(r.harinas).toEqual([{ clave: '000', nombre: '000', gramos: 1000 }]);
  });

  it('con dos harinas, una línea por harina según su proporción', () => {
    const r = calcularPan({ ...base, segunda: 'centeno', porcentajeSegunda: 30, hidratacion: 78 })!;
    expect(r.hidratacion).toBe(78);
    expect(r.harinas.map(h => [h.clave, Math.round(h.gramos)])).toEqual([['000', 700], ['centeno', 300]]);
  });

  it('masa madre: la harina y el agua a agregar descuentan la mitad de la masa madre', () => {
    const r = calcularPan({ ...base, prefermento: 'masa-madre', fermentacion: 'ambiente-4' })!;
    const masaMadre = H * fermentacionDe('ambiente-4').masaMadre! / 100;
    expect(r.levadura).toBeCloseTo(masaMadre);
    expect(r.harinas[0]!.gramos).toBeCloseTo(H - masaMadre / 2);
    expect(r.agua).toBeCloseTo(720 - masaMadre / 2);
    expect(r.harinaTotal).toBe(H);
    // La masa madre no suma: su harina y su agua ya están en las del pan.
    expect(r.masaTotal).toBeCloseTo(H + 720 + H * SAL / 100);
  });

  it('el agua a agregar nunca es negativa: peor caso de la tabla', () => {
    const r = calcularPan({ ...base, hidratacion: 52, prefermento: 'masa-madre', fermentacion: 'ambiente-4', temperatura: 'menos-13' })!;
    expect(r.agua).toBeGreaterThan(0);
  });

  it('la hidratación es la escrita, y se topea en la máxima', () => {
    expect(calcularPan({ ...base, hidratacion: 64.5 })!.agua).toBeCloseTo(645);
    const r = calcularPan({ ...base, hidratacion: HIDRATACION_MAXIMA + 15 })!;
    expect(r.agua).toBeCloseTo(H * HIDRATACION_MAXIMA / 100);
    expect(r.hidratacion).toBe(HIDRATACION_MAXIMA);
    expect(r.topeada).toBe(true);
    expect(calcularPan(base)!.topeada).toBe(false);
  });

  it('la seca es la fresca dividida', () => {
    const fresca = calcularPan(base)!.levadura;
    expect(calcularPan({ ...base, levadura: 'seca' })!.levadura).toBeCloseTo(fresca / DIVISOR_SECA);
  });

  it('desde la masa total da la misma harina (ida y vuelta)', () => {
    const ida = calcularPan(base)!;
    const vuelta = calcularPan({ ...base, cantidad: { de: 'masa', gramos: ida.masaTotal } })!;
    expect(vuelta.harinaTotal).toBeCloseTo(1000);
    const conMasaMadre = { ...base, prefermento: 'masa-madre' as const, fermentacion: 'frio-24' as const };
    const idaMM = calcularPan(conMasaMadre)!;
    const vueltaMM = calcularPan({ ...conMasaMadre, cantidad: { de: 'masa', gramos: idaMM.masaTotal } })!;
    expect(vueltaMM.harinaTotal).toBeCloseTo(1000);
  });

  it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])('cantidad %s: sin resultado', g => {
    expect(calcularPan({ ...base, cantidad: { de: 'harina', gramos: g } })).toBeNull();
  });

  it.each([0, -5, Number.NaN])('hidratación %s: sin resultado', h => {
    expect(calcularPan({ ...base, hidratacion: h })).toBeNull();
  });

  it('sin tipo calcula igual: el tipo sólo carga los datos', () => {
    expect(calcularPan({ ...base, pan: null })).toEqual(calcularPan(base));
  });
});

it('con masa madre no se ofrecen las fermentaciones que no dicen cuánta masa madre', () => {
  expect(fermentacionesPara('masa-madre')).toEqual(FERMENTACIONES.filter(f => f.masaMadre !== null));
  expect(fermentacionesPara(null)).toEqual(FERMENTACIONES);
  expect(fermentacionesPara('pate')).toEqual(FERMENTACIONES);
});

it('gramos: enteros; por debajo de 10, un decimal; por debajo de 1, dos, y nunca menos de 0,01', () => {
  expect(gramos(720.4)).toBe('720');
  expect(gramos(5.44)).toBe('5,4');
  expect(gramos(0.333)).toBe('0,33');
  expect(gramos(0.05)).toBe('0,05');
  expect(gramos(0.001)).toBe('0,01');
  expect(gramos(0.996)).toBe('1,0');
  expect(gramos(9.96)).toBe('10');
  expect(gramos(9.94)).toBe('9,9');
});

describe('las pizzas', () => {
  it('elegir un tipo vuelve todo a lo que trae; quedan la temperatura y la cantidad', () => {
    const tocado: DatosPan = {
      ...base, harina: 'centeno', segunda: 'integral', porcentajeSegunda: 50, hidratacion: 90, levadura: 'seca',
      prefermento: 'pate', horasPrefermento: 14, fermentacion: 'frio-72', temperatura: 'mas-24', cantidad: { de: 'masa', gramos: 800 }
    };
    const baguette = panDe('baguette');
    expect(alElegirTipo(tocado, 'baguette')).toEqual({
      pan: 'baguette', harina: baguette.harina, segunda: null, porcentajeSegunda: PORCENTAJE_SEGUNDA_POR_DEFECTO,
      hidratacion: baguette.hidratacion, prefermento: baguette.prefermento, horasPrefermento: baguette.horasPrefermento ?? 0,
      levadura: baguette.levadura, fermentacion: baguette.fermentacion,
      temperatura: 'mas-24', cantidad: { de: 'masa', gramos: 800 }
    });
    const napolitana = panDe('napolitana');
    expect(alElegirTipo(tocado, 'napolitana')).toMatchObject({
      harina: napolitana.harina, hidratacion: napolitana.hidratacion,
      cantidad: { de: 'bollos', bollos: BOLLOS_POR_DEFECTO, gramos: napolitana.bollo }
    });
    // Elegir de nuevo el mismo tipo también lo deja como viene.
    const campo = panDe('campo');
    expect(alElegirTipo(tocado, 'campo')).toMatchObject({ harina: campo.harina, hidratacion: campo.hidratacion, prefermento: campo.prefermento });
  });

  it('cambiar la harina o la mezcla corre la hidratación por lo que absorben, y conserva lo ajustado a mano', () => {
    const centeno30 = { harina: '000', segunda: 'centeno', porcentajeSegunda: 30 } as const;
    const conCenteno = hidratacionAlCambiarHarinas(base, centeno30);
    // Con dos harinas, el ajuste es el promedio según la proporción.
    cerca(conCenteno, 72 + ajuste('000') * 0.7 + ajuste('centeno') * 0.3 - ajuste('000'));
    cerca(hidratacionAlCambiarHarinas(base, { ...base, harina: 'integral' }), 72 + ajuste('integral') - ajuste('000'));
    cerca(hidratacionAlCambiarHarinas({ ...base, hidratacion: 70 }, { ...base, harina: '0000' }), 70 + ajuste('0000') - ajuste('000'));
    // Ida y vuelta: sacar la mezcla devuelve la hidratación que había.
    cerca(hidratacionAlCambiarHarinas({ ...base, ...centeno30, hidratacion: conCenteno }, base), 72);
  });

  it('el bollo es el sugerido por el tipo; un pan, o ningún tipo, no tiene', () => {
    for (const p of PANES) expect(bolloDe(p.clave)).toBe(p.bollo ?? null);
    expect(bolloDe(null)).toBeNull();
  });

  it('4 bollos de 250 g dan lo mismo que 1000 g de masa', () => {
    const napolitana: DatosPan = { ...base, pan: 'napolitana', hidratacion: 65 };
    const porBollos = calcularPan({ ...napolitana, cantidad: { de: 'bollos', bollos: 4, gramos: 250 } })!;
    const porMasa = calcularPan({ ...napolitana, cantidad: { de: 'masa', gramos: 1000 } })!;
    expect(porBollos).toEqual(porMasa);
    expect(porBollos.masaTotal).toBeCloseTo(1000);
    expect(porBollos.hidratacion).toBe(65);
  });

  it.each([0, -1, Number.NaN])('bollos %s: sin resultado', bollos => {
    expect(calcularPan({ ...base, pan: 'napolitana', cantidad: { de: 'bollos', bollos, gramos: 250 } })).toBeNull();
  });

  it('al pasar a una pizza: los bollos que había, o los de por defecto, con el peso del estilo', () => {
    expect(cantidadAlCambiar(base, 'new-york')).toEqual({ de: 'bollos', bollos: BOLLOS_POR_DEFECTO, gramos: panDe('new-york').bollo });
    const pizza: DatosPan = { ...base, pan: 'napolitana', cantidad: { de: 'bollos', bollos: 6, gramos: 270 } };
    expect(cantidadAlCambiar(pizza, 'pizza-molde')).toEqual({ de: 'bollos', bollos: 6, gramos: panDe('pizza-molde').bollo });
    expect(cantidadAlCambiar(pizza, 'napolitana')).toBe(pizza.cantidad);
  });

  it('al pasar de una pizza a un pan se conserva la masa total; entre panes, la cantidad', () => {
    const pizza: DatosPan = { ...base, pan: 'napolitana', cantidad: { de: 'bollos', bollos: 6, gramos: 270 } };
    expect(cantidadAlCambiar(pizza, 'campo')).toEqual({ de: 'masa', gramos: 1620 });
    expect(cantidadAlCambiar(base, 'focaccia')).toBe(base.cantidad);
  });
});

describe('los prefermentos', () => {
  it('lo que se elige: la masa madre primero, y los tres con levadura; cada uno con su explicación', () => {
    expect(PREFERMENTOS.map(p => p.nombre)).toEqual(['Masa madre', 'Poolish', 'Biga', 'Pâte fermentée']);
    for (const p of PREFERMENTOS) {
      expect(p.titulo).toMatch(/^Qué es (el|la) /);
      expect(p.descripcion.length).toBeGreaterThan(80);
    }
  });

  it('biga: su parte de la harina, a su hidratación, con toda la levadura; la masa final, el resto y sin levadura', () => {
    const biga = prefermentoDe('biga');
    const horas = biga.horas[0]!;
    const r = calcularPan({ ...base, prefermento: 'biga', horasPrefermento: horas.horas })!;
    const harina = H * biga.harina / 100;
    const agua = harina * biga.hidratacion / 100;
    const sal = harina * biga.sal / 100;
    const levadura = harina * horas.fresca / 100;
    expect(r.prefermento!.harina).toBeCloseTo(harina);
    expect(r.prefermento!.agua).toBeCloseTo(agua);
    expect(r.prefermento!.sal).toBeCloseTo(sal);
    expect(r.prefermento!.levadura).toBeCloseTo(levadura);
    expect(r.harinas[0]!.gramos).toBeCloseTo(H - harina);
    expect(r.agua).toBeCloseTo(720 - agua);
    expect(r.sal).toBeCloseTo(H * SAL / 100 - sal);
    expect(r.levadura).toBe(0);
    expect(r.masaTotal).toBeCloseTo(H + 720 + H * SAL / 100 + levadura);
  });

  it('poolish: las horas eligen la levadura, y la seca es la fresca dividida', () => {
    const poolish = prefermentoDe('poolish');
    const harina = H * poolish.harina / 100;
    for (const h of poolish.horas) {
      const r = calcularPan({ ...base, prefermento: 'poolish', horasPrefermento: h.horas })!;
      expect(r.prefermento!.harina).toBeCloseTo(harina);
      expect(r.prefermento!.agua).toBeCloseTo(harina * poolish.hidratacion / 100);
      expect(r.prefermento!.levadura).toBeCloseTo(harina * h.fresca / 100);
    }
    const primeras = poolish.horas[0]!;
    expect(calcularPan({ ...base, levadura: 'seca', prefermento: 'poolish', horasPrefermento: primeras.horas })!.prefermento!.levadura)
      .toBeCloseTo(harina * primeras.fresca / 100 / DIVISOR_SECA);
  });

  it('pâte fermentée: su sal sale de la del pan, y la masa final suma la levadura de la tabla', () => {
    const pate = prefermentoDe('pate');
    const r = calcularPan({ ...base, prefermento: 'pate', horasPrefermento: pate.horas[0]!.horas })!;
    expect(r.prefermento!.sal).toBeCloseTo(H * pate.harina / 100 * pate.sal / 100);
    expect(r.sal + r.prefermento!.sal).toBeCloseTo(H * SAL / 100);
    expect(r.levadura).toBeCloseTo(H * fermentacionDe('ambiente-8').fresca / 100);
  });

  it('la masa final tiene fermentación que elegir si el prefermento le deja su propia levadura', () => {
    for (const p of PREFERMENTOS_CON_LEVADURA) expect(conFermentacion({ ...base, prefermento: p.clave })).toBe(p.levaduraFinal);
    expect(conFermentacion(base)).toBe(true);
  });

  it('con segunda harina, el prefermento sale de la principal', () => {
    const biga = prefermentoDe('biga');
    const r = calcularPan({ ...base, segunda: 'integral', porcentajeSegunda: 30, prefermento: 'biga', horasPrefermento: biga.horas[0]!.horas })!;
    expect(r.harinas[0]!.clave).toBe('000');
    expect(r.harinas[0]!.gramos).toBeCloseTo(H * 0.7 - H * biga.harina / 100);
    expect(r.harinas[1]).toMatchObject({ clave: 'integral' });
    expect(r.harinas[1]!.gramos).toBeCloseTo(H * 0.3);
  });

  it('la masa madre es un prefermento que leva sola: sin levadura, sin grupo propio y con lo demás «a agregar»', () => {
    const d: DatosPan = { ...base, prefermento: 'masa-madre', fermentacion: 'ambiente-4' };
    expect(calcularPan(d)!.prefermento).toBeNull();
    expect(conLevadura(d)).toBe(false);
    expect(conLevadura(base)).toBe(true);
    expect(conFermentacion(d)).toBe(true);
    expect(lineasPrefermento(d)).toEqual([]);
    const r = calcularPan(d)!;
    expect(lineasPan(d)).toEqual([
      { nombre: 'Harina 000 a agregar', valor: `${gramos(r.harinas[0]!.gramos)} g` }, { nombre: 'Agua a agregar', valor: `${gramos(r.agua)} g` },
      { nombre: 'Sal', valor: `${gramos(r.sal)} g` }, { nombre: 'Masa madre', valor: `${gramos(r.levadura)} g` }
    ]);
    // La levadura que hubiera quedado elegida no cambia nada.
    expect(calcularPan({ ...d, levadura: 'seca' })).toEqual(calcularPan(d));
  });

  it('las cifras: la masa total y la hidratación del pan entero', () => {
    expect(cifrasPan(base)).toEqual([
      { nombre: 'Masa total', valor: `${gramos(calcularPan(base)!.masaTotal)} g` }, { nombre: 'Hidratación', valor: '72 %' }
    ]);
    expect(cifrasPan({ ...base, prefermento: 'biga', horasPrefermento: 18 })[1]).toEqual({ nombre: 'Hidratación', valor: '72 %' });
    expect(cifrasPan({ ...base, cantidad: { de: 'harina', gramos: 0 } }).map(c => c.valor)).toEqual(['—', '—']);
  });

  it('al encender la mezcla: la de por defecto, o la primera que no sea la principal', () => {
    const otra = HARINAS.find(h => h.clave !== SEGUNDA_POR_DEFECTO)!.clave;
    expect(segundaAlMezclar(otra)).toBe(SEGUNDA_POR_DEFECTO);
    expect(segundaAlMezclar(SEGUNDA_POR_DEFECTO)).toBe(otra);
  });

  it('las líneas: el prefermento aparte; la masa final sin levadura si va toda en el prefermento', () => {
    const d: DatosPan = { ...base, prefermento: 'biga', horasPrefermento: 18 };
    const p = calcularPan(d)!.prefermento!;
    expect(lineasPrefermento(d)).toEqual([
      { nombre: 'Harina 000', valor: `${gramos(p.harina)} g` }, { nombre: 'Agua', valor: `${gramos(p.agua)} g` },
      ...(p.sal ? [{ nombre: 'Sal', valor: `${gramos(p.sal)} g` }] : []),
      { nombre: 'Levadura fresca', valor: `${gramos(p.levadura)} g` }
    ]);
    expect(lineasPan(d).map(l => l.nombre)).toEqual(['Harina 000', 'Agua', 'Sal']);
    expect(lineasPrefermento(base)).toEqual([]);
    expect(lineasPrefermento({ ...base, prefermento: 'pate', horasPrefermento: 14 }).map(l => l.nombre))
      .toEqual(['Harina 000', 'Agua', 'Sal', 'Levadura fresca']);
  });

  it('las advertencias: la del prefermento, y las de la tabla sólo si la masa final lleva levadura', () => {
    const biga = advertenciasPan({ ...base, prefermento: 'biga', horasPrefermento: 18 });
    expect(biga).toEqual([expect.stringContaining('biga')]);
    const pate = advertenciasPan({ ...base, prefermento: 'pate', horasPrefermento: 14 });
    expect(pate).toEqual([ADVERTENCIA_TIEMPOS, ADVERTENCIA_AMBIENTE, expect.stringContaining('pâte fermentée')]);
  });
});

describe('la temperatura del ambiente', () => {
  /** El factor de una franja contra el de la de `base`. */
  const relativo = (t: keyof typeof LEVADURA_POR_TEMPERATURA) => LEVADURA_POR_TEMPERATURA[t] / LEVADURA_POR_TEMPERATURA[base.temperatura];

  it('con más frío va más levadura, y con más calor, menos; el resto del pan no cambia', () => {
    const templado = calcularPan(base)!;
    const frio = calcularPan({ ...base, temperatura: 'menos-13' })!;
    const calor = calcularPan({ ...base, temperatura: 'mas-24' })!;
    expect(frio.levadura).toBeCloseTo(templado.levadura * relativo('menos-13'));
    expect(calor.levadura).toBeCloseTo(templado.levadura * relativo('mas-24'));
    expect([frio.agua, frio.sal, frio.harinaTotal]).toEqual([templado.agua, templado.sal, templado.harinaTotal]);
    expect(frio.masaTotal).toBeCloseTo(templado.masaTotal - templado.levadura + frio.levadura);
  });

  it('la masa madre se ajusta igual, y trae más harina y más agua', () => {
    const d: DatosPan = { ...base, prefermento: 'masa-madre', fermentacion: 'ambiente-4' };
    const frio = calcularPan({ ...d, temperatura: '13-18' })!;
    const masaMadre = calcularPan(d)!.levadura * relativo('13-18');
    expect(frio.levadura).toBeCloseTo(masaMadre);
    expect(frio.harinas[0]!.gramos).toBeCloseTo(H - masaMadre / 2);
    expect(frio.masaTotal).toBeCloseTo(calcularPan(d)!.masaTotal);
  });

  it('en frío no cuenta: manda la heladera', () => {
    const d: DatosPan = { ...base, fermentacion: 'frio-24' };
    expect(conTemperatura(d)).toBe(false);
    expect(conTemperatura(base)).toBe(true);
    expect(calcularPan({ ...d, temperatura: 'menos-13' })).toEqual(calcularPan(d));
  });

  it('con biga no cuenta: fermenta en su lugar a 18 °C', () => {
    const biga: DatosPan = { ...base, prefermento: 'biga', horasPrefermento: 18 };
    expect(conTemperatura(biga)).toBe(false);
    expect(calcularPan({ ...biga, temperatura: 'menos-13' })).toEqual(calcularPan(biga));
  });

  it('el poolish fermenta a temperatura ambiente: su levadura se ajusta, y nada más', () => {
    const poolish: DatosPan = { ...base, prefermento: 'poolish', horasPrefermento: 12 };
    expect(conTemperatura(poolish)).toBe(true);
    const templado = calcularPan(poolish)!;
    const frio = calcularPan({ ...poolish, temperatura: 'menos-13' })!;
    expect(frio.prefermento!.levadura).toBeCloseTo(templado.prefermento!.levadura * relativo('menos-13'));
    expect(frio.prefermento!.harina).toBeCloseTo(templado.prefermento!.harina);
    expect(frio.levadura).toBe(0);
  });

  it('con pâte fermentée se ajustan las dos levaduras; con la masa en frío, sólo la del prefermento', () => {
    const pate: DatosPan = { ...base, prefermento: 'pate', horasPrefermento: 14 };
    const frio = calcularPan({ ...pate, temperatura: 'menos-13' })!;
    expect(frio.levadura).toBeCloseTo(calcularPan(pate)!.levadura * relativo('menos-13'));
    expect(frio.prefermento!.levadura).toBeCloseTo(calcularPan(pate)!.prefermento!.levadura * relativo('menos-13'));

    const enHeladera: DatosPan = { ...pate, fermentacion: 'frio-24' };
    expect(conTemperatura(enHeladera)).toBe(true);
    const heladeraFria = calcularPan({ ...enHeladera, temperatura: 'menos-13' })!;
    expect(heladeraFria.levadura).toBeCloseTo(calcularPan(enHeladera)!.levadura);
    expect(heladeraFria.prefermento!.levadura).toBeCloseTo(calcularPan(enHeladera)!.prefermento!.levadura * relativo('menos-13'));
  });

  it('las advertencias: a temperatura ambiente, la de la temperatura; en frío, la de la heladera', () => {
    expect(advertenciasPan(base)).toEqual([ADVERTENCIA_TIEMPOS, ADVERTENCIA_AMBIENTE]);
    expect(advertenciasPan({ ...base, temperatura: 'menos-13' })).toEqual([ADVERTENCIA_TIEMPOS, ADVERTENCIA_AMBIENTE, ADVERTENCIA_MUY_FRIO]);
    expect(advertenciasPan({ ...base, fermentacion: 'frio-24' })).toEqual([ADVERTENCIA_TIEMPOS, ADVERTENCIA_FRIO]);
    // El poolish fermenta a temperatura ambiente aunque la masa final no tenga fermentación que elegir.
    expect(advertenciasPan({ ...base, prefermento: 'poolish', horasPrefermento: 12 }))
      .toEqual([ADVERTENCIA_AMBIENTE, expect.stringContaining('poolish')]);
    // Con pâte fermentée y la masa en frío van las dos: la del prefermento y la de la heladera.
    expect(advertenciasPan({ ...base, prefermento: 'pate', horasPrefermento: 14, fermentacion: 'frio-24' }))
      .toEqual([ADVERTENCIA_TIEMPOS, ADVERTENCIA_AMBIENTE, ADVERTENCIA_FRIO, expect.stringContaining('pâte fermentée')]);
  });
});

describe('los datos usados', () => {
  it('dicen con qué se calculó, como en la pantalla, y sólo lo que cuenta', () => {
    expect(datosUsados(base)).toEqual([
      { nombre: 'Tipo', valor: 'Pan de campo' }, { nombre: 'Harina', valor: '000' }, { nombre: 'Hidratación', valor: '72 %' },
      { nombre: 'Prefermento', valor: 'Ninguno' }, { nombre: 'Levadura', valor: 'Fresca' },
      { nombre: 'Fermentación', valor: 'Ambiente, 8 h' }, { nombre: 'Temperatura ambiente', valor: '18 a 24 °C' }
    ]);
    const horas = prefermentoDe('poolish').horas.at(-1)!.horas;
    const baguette: DatosPan = {
      ...base, pan: 'baguette', segunda: 'integral', porcentajeSegunda: 20, hidratacion: HIDRATACION_MAXIMA + 15,
      prefermento: 'poolish', horasPrefermento: horas
    };
    expect(datosUsados(baguette)).toEqual([
      { nombre: 'Tipo', valor: 'Baguette' }, { nombre: 'Harina', valor: '000 con 20 % de Integral' },
      { nombre: 'Hidratación', valor: porciento(HIDRATACION_MAXIMA) }, { nombre: 'Prefermento', valor: `Poolish, ${horas} h` },
      { nombre: 'Levadura', valor: 'Fresca' }, { nombre: 'Temperatura ambiente', valor: '18 a 24 °C' }
    ]);
    const sinTipo: DatosPan = { ...base, pan: null, prefermento: 'masa-madre', fermentacion: 'frio-24' };
    expect(datosUsados(sinTipo).map(l => l.nombre)).toEqual(['Harina', 'Hidratación', 'Prefermento', 'Fermentación']);
  });
});
