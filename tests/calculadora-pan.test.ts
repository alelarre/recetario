import { describe, it, expect } from 'vitest';
import {
  calcularPan, fermentacionesPara, cantidadAlCambiar, bolloDe, conFermentacion, conLevadura, segundaAlMezclar,
  cifrasPan, lineasPan, lineasPrefermento, advertenciasPan,
  conTemperatura, alElegirTipo, hidratacionAlCambiarHarinas, datosUsados, PANES, PREFERMENTOS, PREFERMENTOS_CON_LEVADURA, LEVADURA_POR_TEMPERATURA, BOLLOS_POR_DEFECTO, HIDRATACION_MAXIMA,
  ADVERTENCIA_TIEMPOS, ADVERTENCIA_AMBIENTE, ADVERTENCIA_MUY_FRIO, ADVERTENCIA_FRIO, type DatosPan
} from '../src/calculadoras/pan.js';
import { TEMPERATURAS } from '../src/calculadoras/temperaturas.js';
import { gramos } from '../src/calculadoras/gramos.js';

const base: DatosPan = {
  pan: 'campo', harina: '000', segunda: null, porcentajeSegunda: 30, hidratacion: 72,
  prefermento: null, levadura: 'fresca', fermentacion: 'ambiente-8', temperatura: '18-24',
  cantidad: { de: 'harina', gramos: 1000 }, horasPrefermento: 0
};

describe('calcularPan', () => {
  it('pan de campo, 1 kg de 000, fresca, 8 h', () => {
    const r = calcularPan(base)!;
    expect(r.hidratacion).toBe(72);
    expect(r.agua).toBeCloseTo(720);
    expect(r.sal).toBeCloseTo(20);
    expect(r.levadura).toBeCloseTo(5);
    expect(r.masaTotal).toBeCloseTo(1745);
    expect(r.harinas).toEqual([{ clave: '000', nombre: '000', gramos: 1000 }]);
  });

  it('con dos harinas, una línea por harina según su proporción', () => {
    const r = calcularPan({ ...base, segunda: 'centeno', porcentajeSegunda: 30, hidratacion: 78 })!;
    expect(r.hidratacion).toBe(78);
    expect(r.harinas.map(h => [h.clave, Math.round(h.gramos)])).toEqual([['000', 700], ['centeno', 300]]);
  });

  it('masa madre: la harina y el agua a agregar descuentan la mitad de la masa madre', () => {
    const r = calcularPan({ ...base, prefermento: 'masa-madre', fermentacion: 'ambiente-4' })!;
    expect(r.levadura).toBeCloseTo(200);
    expect(r.harinas[0]!.gramos).toBeCloseTo(900);
    expect(r.agua).toBeCloseTo(620);
    expect(r.harinaTotal).toBe(1000);
    expect(r.masaTotal).toBeCloseTo(1740);
  });

  it('el agua a agregar nunca es negativa: peor caso de la tabla', () => {
    const r = calcularPan({ ...base, hidratacion: 52, prefermento: 'masa-madre', fermentacion: 'ambiente-4', temperatura: 'menos-13' })!;
    expect(r.agua).toBeGreaterThan(0);
  });

  it('la hidratación es la escrita, y se topea en 85 %', () => {
    expect(calcularPan({ ...base, hidratacion: 64.5 })!.agua).toBeCloseTo(645);
    const r = calcularPan({ ...base, hidratacion: 100 })!;
    expect(r.agua).toBeCloseTo(850);
    expect(r.hidratacion).toBe(HIDRATACION_MAXIMA);
    expect(r.topeada).toBe(true);
    expect(calcularPan(base)!.topeada).toBe(false);
  });

  it('la seca es la fresca dividida por 3', () => {
    const fresca = calcularPan(base)!.levadura;
    expect(calcularPan({ ...base, levadura: 'seca' })!.levadura).toBeCloseTo(fresca / 3);
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

it('con masa madre no se ofrecen 2 h', () => {
  expect(fermentacionesPara('masa-madre').map(f => f.clave)).not.toContain('ambiente-2');
  expect(fermentacionesPara(null).map(f => f.clave)).toContain('ambiente-2');
  expect(fermentacionesPara('pate').map(f => f.clave)).toContain('ambiente-2');
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
  it('cada tipo carga su harina, su hidratación, su prefermento, su levadura y su fermentación', () => {
    expect(PANES.map(p => [p.nombre, p.harina, p.hidratacion, p.prefermento, p.horasPrefermento ?? null, p.levadura, p.fermentacion])).toEqual([
      ['Pan francés', '000', 60, null, null, 'fresca', 'ambiente-4'],
      ['Pan de molde', '000', 62, null, null, 'fresca', 'ambiente-4'],
      ['Pan de miga', '000', 56, null, null, 'fresca', 'ambiente-2'],
      ['Pizza al molde', '000', 61, null, null, 'fresca', 'ambiente-4'],
      ['Pizza a la piedra', '000', 57, null, null, 'fresca', 'ambiente-4'],
      ['Pizza napolitana', '00', 65, null, null, 'fresca', 'ambiente-8'],
      ['Pizza New York', '000', 65, null, null, 'fresca', 'frio-24'],
      ['Baguette', '000', 68, 'poolish', 12, 'fresca', 'ambiente-4'],
      ['Pan de campo', '000', 72, 'masa-madre', null, 'fresca', 'ambiente-8'],
      ['Ciabatta', '000', 80, 'biga', 18, 'fresca', 'ambiente-4'],
      ['Focaccia', '000', 75, null, null, 'fresca', 'ambiente-4']
    ]);
  });

  it('elegir un tipo vuelve todo a lo que trae; quedan la temperatura y la cantidad', () => {
    const tocado: DatosPan = {
      ...base, harina: 'centeno', segunda: 'integral', porcentajeSegunda: 50, hidratacion: 90, levadura: 'seca',
      prefermento: 'pate', horasPrefermento: 14, fermentacion: 'frio-72', temperatura: 'mas-24', cantidad: { de: 'masa', gramos: 800 }
    };
    expect(alElegirTipo(tocado, 'baguette')).toEqual({
      pan: 'baguette', harina: '000', segunda: null, porcentajeSegunda: 30, hidratacion: 68,
      prefermento: 'poolish', horasPrefermento: 12, levadura: 'fresca', fermentacion: 'ambiente-4',
      temperatura: 'mas-24', cantidad: { de: 'masa', gramos: 800 }
    });
    expect(alElegirTipo(tocado, 'napolitana')).toMatchObject({ harina: '00', hidratacion: 65, cantidad: { de: 'bollos', bollos: 4, gramos: 250 } });
    // Elegir de nuevo el mismo tipo también lo deja como viene.
    expect(alElegirTipo(tocado, 'campo')).toMatchObject({ harina: '000', hidratacion: 72, prefermento: 'masa-madre' });
  });

  it('cambiar la harina o la mezcla corre la hidratación por lo que absorben, y conserva lo ajustado a mano', () => {
    const centeno30 = { harina: '000', segunda: 'centeno', porcentajeSegunda: 30 } as const;
    expect(hidratacionAlCambiarHarinas(base, centeno30)).toBe(78);
    expect(hidratacionAlCambiarHarinas(base, { ...base, harina: 'integral' })).toBe(80);
    expect(hidratacionAlCambiarHarinas({ ...base, hidratacion: 70 }, { ...base, harina: '0000' })).toBe(66);
    // Ida y vuelta: sacar la mezcla devuelve la hidratación que había.
    expect(hidratacionAlCambiarHarinas({ ...base, ...centeno30, hidratacion: 78 }, base)).toBe(72);
    expect(hidratacionAlCambiarHarinas({ ...base, harina: '00', hidratacion: 65 }, { ...base, harina: '000' })).toBe(63);
  });

  it('cuatro estilos, cada uno con su bollo sugerido; los panes no tienen', () => {
    expect(PANES.filter(p => p.bollo !== undefined).map(p => [p.nombre, p.hidratacion, p.bollo])).toEqual([
      ['Pizza al molde', 61, 380], ['Pizza a la piedra', 57, 250], ['Pizza napolitana', 65, 250], ['Pizza New York', 65, 380]
    ]);
    expect(bolloDe('campo')).toBeNull();
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
    expect(cantidadAlCambiar(base, 'new-york')).toEqual({ de: 'bollos', bollos: BOLLOS_POR_DEFECTO, gramos: 380 });
    const pizza: DatosPan = { ...base, pan: 'napolitana', cantidad: { de: 'bollos', bollos: 6, gramos: 270 } };
    expect(cantidadAlCambiar(pizza, 'pizza-molde')).toEqual({ de: 'bollos', bollos: 6, gramos: 380 });
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

  it('la tabla de los que llevan levadura, con su harina, hidratación, sal y horas', () => {
    expect(PREFERMENTOS_CON_LEVADURA.map(p => [p.nombre, p.harina, p.hidratacion, p.sal, p.horas.map(h => h.horas), p.levaduraFinal, p.ambiente])).toEqual([
      ['Poolish', 30, 100, 0, [8, 12, 18], false, true],
      ['Biga', 40, 44, 0, [18], false, false],
      ['Pâte fermentée', 27, 68, 1.4, [14], true, true]
    ]);
  });

  it('biga: el 40 % de la harina al 44 %, con toda la levadura; la masa final, el resto y sin levadura', () => {
    const r = calcularPan({ ...base, prefermento: 'biga', horasPrefermento: 18 })!;
    expect(r.prefermento!.harina).toBeCloseTo(400);
    expect(r.prefermento!.agua).toBeCloseTo(176);
    expect(r.prefermento!.sal).toBe(0);
    expect(r.prefermento!.levadura).toBeCloseTo(4);
    expect(r.harinas[0]!.gramos).toBeCloseTo(600);
    expect(r.agua).toBeCloseTo(544);
    expect(r.sal).toBeCloseTo(20);
    expect(r.levadura).toBe(0);
    expect(r.masaTotal).toBeCloseTo(1744);
  });

  it('poolish: las horas eligen la levadura, y la seca es la fresca dividida', () => {
    const doce = calcularPan({ ...base, prefermento: 'poolish', horasPrefermento: 12 })!;
    expect(doce.prefermento).toMatchObject({ harina: 300, agua: 300 });
    expect(doce.prefermento!.levadura).toBeCloseTo(0.6);
    expect(calcularPan({ ...base, levadura: 'seca', prefermento: 'poolish', horasPrefermento: 8 })!.prefermento!.levadura).toBeCloseTo(0.75);
  });

  it('pâte fermentée: lleva sal, que sale de la del pan, y la masa final suma la levadura de la tabla', () => {
    const r = calcularPan({ ...base, prefermento: 'pate', horasPrefermento: 14 })!;
    expect(r.prefermento!.sal).toBeCloseTo(3.78);
    expect(r.sal + r.prefermento!.sal).toBeCloseTo(20);
    expect(r.levadura).toBeCloseTo(5);
    expect(conFermentacion({ ...base, prefermento: 'pate' })).toBe(true);
    expect(conFermentacion({ ...base, prefermento: 'biga' })).toBe(false);
  });

  it('con segunda harina, el prefermento sale de la principal', () => {
    const r = calcularPan({ ...base, segunda: 'integral', porcentajeSegunda: 30, prefermento: 'biga', horasPrefermento: 18 })!;
    expect(r.harinas.map(h => [h.clave, Math.round(h.gramos)])).toEqual([['000', 300], ['integral', 300]]);
  });

  it('la masa madre es un prefermento que leva sola: sin levadura, sin grupo propio y con lo demás «a agregar»', () => {
    const d: DatosPan = { ...base, prefermento: 'masa-madre', fermentacion: 'ambiente-4' };
    expect(calcularPan(d)!.prefermento).toBeNull();
    expect(conLevadura(d)).toBe(false);
    expect(conLevadura(base)).toBe(true);
    expect(conFermentacion(d)).toBe(true);
    expect(lineasPrefermento(d)).toEqual([]);
    expect(lineasPan(d)).toEqual([
      { nombre: 'Harina 000 a agregar', valor: '900 g' }, { nombre: 'Agua a agregar', valor: '620 g' },
      { nombre: 'Sal', valor: '20 g' }, { nombre: 'Masa madre', valor: '200 g' }
    ]);
    // La levadura que hubiera quedado elegida no cambia nada.
    expect(calcularPan({ ...d, levadura: 'seca' })).toEqual(calcularPan(d));
  });

  it('las cifras: la masa total y la hidratación del pan entero', () => {
    expect(cifrasPan(base)).toEqual([{ nombre: 'Masa total', valor: '1745 g' }, { nombre: 'Hidratación', valor: '72 %' }]);
    expect(cifrasPan({ ...base, prefermento: 'biga', horasPrefermento: 18 })[1]).toEqual({ nombre: 'Hidratación', valor: '72 %' });
    expect(cifrasPan({ ...base, cantidad: { de: 'harina', gramos: 0 } }).map(c => c.valor)).toEqual(['—', '—']);
  });

  it('al encender la mezcla: integral, o la primera que no sea la principal', () => {
    expect(segundaAlMezclar('000')).toBe('integral');
    expect(segundaAlMezclar('integral')).toBe('0000');
  });

  it('las líneas: el prefermento aparte; la masa final sin levadura si va toda en el prefermento', () => {
    const d: DatosPan = { ...base, prefermento: 'biga', horasPrefermento: 18 };
    expect(lineasPrefermento(d)).toEqual([
      { nombre: 'Harina 000', valor: '400 g' }, { nombre: 'Agua', valor: '176 g' }, { nombre: 'Levadura fresca', valor: '4,0 g' }
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
  it('un factor por franja, las mismas de los fermentados; entre 18 y 24 °C, la tabla tal cual', () => {
    expect(TEMPERATURAS.map(t => LEVADURA_POR_TEMPERATURA[t.clave])).toEqual([2, 1.5, 1, 0.65]);
  });

  it('con más frío va más levadura, y con más calor, menos; el resto del pan no cambia', () => {
    const templado = calcularPan(base)!;
    const frio = calcularPan({ ...base, temperatura: 'menos-13' })!;
    const calor = calcularPan({ ...base, temperatura: 'mas-24' })!;
    expect(frio.levadura).toBeCloseTo(templado.levadura * 2);
    expect(calor.levadura).toBeCloseTo(templado.levadura * 0.65);
    expect([frio.agua, frio.sal, frio.harinaTotal]).toEqual([templado.agua, templado.sal, templado.harinaTotal]);
    expect(frio.masaTotal).toBeCloseTo(templado.masaTotal + templado.levadura);
  });

  it('la masa madre se ajusta igual, y trae más harina y más agua', () => {
    const d: DatosPan = { ...base, prefermento: 'masa-madre', fermentacion: 'ambiente-4' };
    const frio = calcularPan({ ...d, temperatura: '13-18' })!;
    expect(frio.levadura).toBeCloseTo(300);
    expect(frio.harinas[0]!.gramos).toBeCloseTo(850);
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
    expect(frio.prefermento!.levadura).toBeCloseTo(templado.prefermento!.levadura * 2);
    expect(frio.prefermento!.harina).toBeCloseTo(templado.prefermento!.harina);
    expect(frio.levadura).toBe(0);
  });

  it('con pâte fermentée se ajustan las dos levaduras; con la masa en frío, sólo la del prefermento', () => {
    const pate: DatosPan = { ...base, prefermento: 'pate', horasPrefermento: 14 };
    const frio = calcularPan({ ...pate, temperatura: 'menos-13' })!;
    expect(frio.levadura).toBeCloseTo(calcularPan(pate)!.levadura * 2);
    expect(frio.prefermento!.levadura).toBeCloseTo(calcularPan(pate)!.prefermento!.levadura * 2);

    const enHeladera: DatosPan = { ...pate, fermentacion: 'frio-24' };
    expect(conTemperatura(enHeladera)).toBe(true);
    const heladeraFria = calcularPan({ ...enHeladera, temperatura: 'menos-13' })!;
    expect(heladeraFria.levadura).toBeCloseTo(calcularPan(enHeladera)!.levadura);
    expect(heladeraFria.prefermento!.levadura).toBeCloseTo(calcularPan(enHeladera)!.prefermento!.levadura * 2);
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
    const baguette: DatosPan = { ...alElegirTipo(base, 'baguette'), segunda: 'integral', porcentajeSegunda: 20, hidratacion: 100 };
    expect(datosUsados(baguette)).toEqual([
      { nombre: 'Tipo', valor: 'Baguette' }, { nombre: 'Harina', valor: '000 con 20 % de Integral' },
      { nombre: 'Hidratación', valor: '85 %' }, { nombre: 'Prefermento', valor: 'Poolish, 12 h' },
      { nombre: 'Levadura', valor: 'Fresca' }, { nombre: 'Temperatura ambiente', valor: '18 a 24 °C' }
    ]);
    const sinTipo: DatosPan = { ...base, pan: null, prefermento: 'masa-madre', fermentacion: 'frio-24' };
    expect(datosUsados(sinTipo).map(l => l.nombre)).toEqual(['Harina', 'Hidratación', 'Prefermento', 'Fermentación']);
  });
});
