import { describe, it, expect } from 'vitest';
import { consultarReferencia, calcularParaElAgente, nombreMcp, esquemaDe, CUENTAS } from '../mcp/referencias.js';
import { HERRAMIENTAS_DE_REFERENCIA } from '../src/referencias/indice.js';
import { filasDe } from '../src/referencias/forma.js';
import type { Cuenta } from '../src/referencias/tipos.js';

const fuente = { nombre: 'F', url: 'https://f.com' };
const cuenta: Cuenta = {
  id: 'merengue', titulo: 'Merengue',
  entradas: [{ id: 'claras', nombre: 'Claras', tipo: 'numero', unidad: 'g', porDefecto: null },
             { id: 'tipo', nombre: 'Tipo', tipo: 'opcion', porDefecto: 'frances', opciones: [{ valor: 'frances', texto: 'Francés' }, { valor: 'italiano', texto: 'Italiano' }] }],
  calcular: v => ({ lineas: [{ nombre: 'Tipo', valor: String(v['tipo']) }], advertencias: [], fuentes: [fuente] })
};

describe('consultar_referencia', () => {
  it('sin nada, las cinco herramientas con sus tablas y cuentas', () => {
    const r = consultarReferencia({});
    expect('herramientas' in r && r.herramientas.map(h => h.id)).toEqual(['rapida', 'masas', 'coccion', 'conservacion', 'conversor']);
  });
  it('una herramienta que no existe devuelve las opciones', () => {
    expect(consultarReferencia({ herramienta: 'otra' })).toEqual({ error: expect.any(String), opciones: ['rapida', 'masas', 'coccion', 'conservacion', 'conversor'] });
  });
  it('buscar encuentra sin tildes ni mayúsculas, con su tabla y su fuente', () => {
    // El texto sale de los datos, sea cual sea: el test no depende de ningún valor.
    const t = HERRAMIENTAS_DE_REFERENCIA.flatMap(h => h.fichas).find(f => f.tipo === 'tabla');
    if (t?.tipo !== 'tabla') throw new Error('no hay tablas');
    const texto = filasDe(t.tabla)[0]?.[t.tabla.columnas[0]?.id ?? ''] ?? '';
    const r = consultarReferencia({ buscar: texto.toUpperCase() });
    expect('coincidencias' in r && r.coincidencias.length).toBeGreaterThan(0);
    if ('coincidencias' in r) for (const c of r.coincidencias) expect(c.fuentes.length).toBeGreaterThan(0);
  });
});

describe('una cuenta para el agente', () => {
  it('el nombre de la herramienta', () => expect(nombreMcp(cuenta)).toBe('calcular_merengue'));
  it('sin un número, qué falta', () => {
    expect(calcularParaElAgente(cuenta, { tipo: 'italiano' })).toEqual({ faltan: [{ dato: 'claras' }] });
  });
  it('una opción se acepta por su valor o su texto, sin tildes ni mayúsculas', () => {
    for (const tipo of ['italiano', 'Italiano', 'ítaliano']) {
      expect(calcularParaElAgente(cuenta, { claras: 100, tipo })).toMatchObject({ resultado: [{ nombre: 'Tipo', valor: 'italiano' }] });
    }
  });
  it('una opción que no existe, qué falta con sus opciones', () => {
    expect(calcularParaElAgente(cuenta, { claras: 100, tipo: 'suizo' })).toEqual({ faltan: [{ dato: 'tipo', opciones: ['Francés', 'Italiano'] }] });
  });
  it('sin la opción, la de por defecto', () => {
    expect(calcularParaElAgente(cuenta, { claras: 100 })).toMatchObject({ resultado: [{ valor: 'frances' }] });
  });
  it('lleva las notas de la cuenta, para decir lo que dice la pantalla', () => {
    const conNotas: Cuenta = { ...cuenta, notas: ['Una nota.'] };
    expect(calcularParaElAgente(conNotas, { claras: 100 })).toMatchObject({ notas: ['Una nota.'] });
    expect(calcularParaElAgente(cuenta, { claras: 100 })).toMatchObject({ notas: [] });
  });
});

describe('cuando la cuenta no sale', () => {
  // `largo` sólo se ve con forma `caja` y `radio` no tiene valor por defecto.
  const molde: Cuenta = {
    id: 'molde', titulo: 'Molde',
    entradas: [
      { id: 'forma', nombre: 'Forma', tipo: 'opcion', porDefecto: 'tubo', opciones: [{ valor: 'tubo', texto: 'Tubo' }, { valor: 'caja', texto: 'Caja' }] },
      { id: 'diametro', nombre: 'Diámetro', tipo: 'numero', unidad: 'cm', porDefecto: null },
      { id: 'largo', nombre: 'Largo', tipo: 'numero', unidad: 'cm', porDefecto: null, visibleSi: v => v['forma'] === 'caja' },
      { id: 'llenado', nombre: 'Llenado', tipo: 'numero', unidad: '%', porDefecto: 70 }
    ],
    calcular: () => null
  };

  it('dice que con esos valores no se puede, sin listar como faltantes lo oculto ni lo que tiene valor por defecto', () => {
    expect(calcularParaElAgente(molde, { diametro: 0 })).toEqual({ error: expect.stringContaining('no se puede calcular') });
  });
  it('un número negativo vale como uno inválido: se pide de nuevo', () => {
    expect(calcularParaElAgente(molde, { diametro: -5 })).toEqual({ faltan: [{ dato: 'diametro' }] });
  });
});

describe('el esquema de una cuenta', () => {
  it('un número con valor por defecto lo dice, como las opciones', () => {
    const molde: Cuenta = { id: 'm', titulo: 'M', calcular: () => null, entradas: [{ id: 'llenado', nombre: 'Llenado', tipo: 'numero', unidad: '%', porDefecto: 70 }] };
    expect(esquemaDe(molde)['llenado']?.description).toContain('Sin él, 70');
  });
  it('las opciones se separan con «; » porque sus textos llevan comas, y cada una se nombra por su texto', () => {
    const c: Cuenta = {
      id: 'x', titulo: 'X', calcular: () => null,
      entradas: [{ id: 'o', nombre: 'O', tipo: 'opcion', porDefecto: 'a', opciones: [{ valor: 'a', texto: 'Uno, con coma' }, { valor: 'b', texto: 'Otro, también' }] }]
    };
    expect(esquemaDe(c)['o']?.description).toContain('una de Uno, con coma; Otro, también.');
  });
  it('un número sin valor por defecto no promete ninguno', () => {
    expect(esquemaDe(cuenta)['claras']?.description).not.toContain('Sin él');
  });
});

describe('la descripción de cada cuenta', () => {
  it('todas dicen para qué pregunta sirven', () => {
    for (const c of CUENTAS) expect(c.descripcion, c.id).toMatch(/\S{3}/);
  });
});

describe('el conversor para el agente', () => {
  const conversion = CUENTAS.find(c => c.id === 'conversion');
  if (!conversion) throw new Error('no está la cuenta del conversor');

  it('con cantidad, unidad e ingrediente sin tildes, devuelve los gramos', () => {
    const r = calcularParaElAgente(conversion, { cantidad: 1, unidad: 'taza', ingrediente: 'azucar blanca' });
    expect('resultado' in r && (r.resultado as { nombre: string }[]).map(l => l.nombre)).toContain('g');
  });
  it('la unidad se pide como se escribe: «fl oz»', () => {
    expect('resultado' in calcularParaElAgente(conversion, { cantidad: 1, unidad: 'fl oz' })).toBe(true);
  });
  it('sin cantidad, la pide', () => {
    expect(calcularParaElAgente(conversion, { unidad: 'taza' })).toEqual({ faltan: [{ dato: 'cantidad' }] });
  });
  it('un ingrediente que no está devuelve la lista', () => {
    const r = calcularParaElAgente(conversion, { cantidad: 1, ingrediente: 'kriptonita' });
    expect('faltan' in r && r.faltan[0]?.dato).toBe('ingrediente');
    expect('faltan' in r && r.faltan[0]?.opciones).toContain('Manteca');
  });
  it('buscar «harina» encuentra la tabla de pesos', () => {
    const r = consultarReferencia({ buscar: 'harina' });
    expect('coincidencias' in r && r.coincidencias.map(c => c.tabla)).toContain('Pesos por ingrediente');
  });
});
