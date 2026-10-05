/**
 * Las cuentas de las herramientas de referencia. No tienen ningún número
 * propio: cada fábrica recibe sus constantes de `datos/`, y los tests le pasan
 * otras. Cada cuenta declara sus entradas; la pantalla y el MCP se arman
 * desde esa declaración.
 */
import { gramos } from '../calculadoras/gramos.js';
import type { Cuenta, Valores, Linea, Fuente, Resultado, Tabla } from './tipos.js';
import type { MOLDE, LASANA, PIZZA, AZUCAR, RecetaPorPorcion, TipoDeMerengue, Ingrediente } from './datos/masas-y-dulces.js';
import type { ARROZ, AGUA_SAL_PASTA, ESPAGUETI, CALDO } from './datos/coccion.js';

/** Un número positivo y finito, o nada. */
export function numero(v: Valores, id: string): number | null {
  const x = v[id];
  return typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : null;
}
export const opcion = (v: Valores, id: string): string => (typeof v[id] === 'string' ? v[id] as string : '');

const FRACCIONES: Readonly<Record<string, string>> = { '0.25': '¼', '0.33': '⅓', '0.50': '½', '0.67': '⅔', '0.75': '¾' };

/** Huevos y yemas: enteros, o con su fracción común; si no hay una, un decimal con coma. */
export function fraccion(n: number): string {
  const entero = Math.floor(n + 1e-9);
  const resto = Math.round((n - entero) * 100) / 100;
  if (resto === 0) return String(entero);
  const f = FRACCIONES[resto.toFixed(2)];
  if (!f) return (Math.round(n * 10) / 10).toString().replace('.', ',');
  return entero ? `${entero} ${f}` : f;
}

const litros = (ml: number): string => `${(Math.round(ml / 100) / 10).toString().replace('.', ',')} l`;

function cantidad(i: Ingrediente, por: number): string {
  const una = (x: number): string => (i.unidad === 'u' ? fraccion(x * por) : `${gramos(x * por)} ${i.unidad}`);
  return i.cantidadMax === undefined ? una(i.cantidad) : `${una(i.cantidad).replace(/ (g|ml)$/, '')} a ${una(i.cantidadMax)}`;
}

const lineasDe = (ingredientes: readonly Ingrediente[], por: number): Linea[] =>
  ingredientes.map(i => ({ nombre: i.nombre, valor: cantidad(i, por) }));

const resultado = (lineas: readonly Linea[], fuentes: readonly Fuente[], advertencias: readonly string[] = []): Resultado =>
  ({ lineas, advertencias, fuentes });

/** Un molde no se llena menos del 1 % ni más del 100 %: fuera de eso la masa no entra. */
const LLENADO_MINIMO = 1;
const LLENADO_MAXIMO = 100;

export function cuentaMolde(k: typeof MOLDE): Cuenta {
  const medidas = (v: Valores): boolean => opcion(v, 'molde') === 'medidas';
  const conForma = (...formas: string[]) => (v: Valores): boolean => medidas(v) && formas.includes(opcion(v, 'forma'));
  // Un tipo de molde redondo sin diámetro propio: el número se escribe en `diametro`.
  const tipoSinDiametro = (v: Valores): boolean => {
    const a = k.atajos.find(x => x.id === opcion(v, 'molde'));
    return a !== undefined && a.forma === 'redondo' && a.diametro === undefined;
  };
  return {
    id: 'molde', titulo: 'Masa para un molde', descripcion: 'Cuánta masa lleva un molde de torta, según su forma y sus medidas o su número.',
    notas: k.notas,
    entradas: [
      { id: 'molde', nombre: 'Molde', tipo: 'opcion', porDefecto: 'medidas',
        opciones: [{ valor: 'medidas', texto: 'Con sus medidas' }, ...k.atajos.map(a => ({ valor: a.id, texto: a.texto }))] },
      { id: 'forma', nombre: 'Forma', tipo: 'opcion', porDefecto: 'redondo', visibleSi: medidas,
        opciones: [{ valor: 'redondo', texto: 'Redondo' }, { valor: 'rectangular', texto: 'Cuadrado o rectangular' }, { valor: 'tubo', texto: 'Con tubo' }] },
      { id: 'diametro', nombre: 'Diámetro', tipo: 'numero', unidad: 'cm', porDefecto: null, visibleSi: v => conForma('redondo', 'tubo')(v) || tipoSinDiametro(v) },
      { id: 'tubo', nombre: 'Diámetro del tubo', tipo: 'numero', unidad: 'cm', porDefecto: null, visibleSi: conForma('tubo') },
      { id: 'largo', nombre: 'Largo', tipo: 'numero', unidad: 'cm', porDefecto: null, visibleSi: conForma('rectangular') },
      { id: 'ancho', nombre: 'Ancho', tipo: 'numero', unidad: 'cm', porDefecto: null, visibleSi: conForma('rectangular') },
      { id: 'alto', nombre: 'Alto', tipo: 'numero', unidad: 'cm', porDefecto: null, visibleSi: medidas },
      { id: 'llenado', nombre: 'Llenado', tipo: 'numero', unidad: '%', porDefecto: Math.round(k.llenado.valor * 100) }
    ],
    calcular(v) {
      const atajo = k.atajos.find(a => a.id === opcion(v, 'molde'));
      const forma = atajo ? atajo.forma : opcion(v, 'forma');
      const alto = atajo ? atajo.alto : numero(v, 'alto');
      const d = atajo?.diametro ?? numero(v, 'diametro');
      let volumen: number | null = null;
      if (alto && forma === 'redondo' && d) volumen = Math.PI * (d / 2) ** 2 * alto;
      if (alto && forma === 'rectangular') {
        const largo = atajo ? atajo.largo ?? null : numero(v, 'largo');
        const ancho = atajo ? atajo.ancho ?? null : numero(v, 'ancho');
        if (largo && ancho) volumen = largo * ancho * alto;
      }
      const tubo = numero(v, 'tubo');
      if (alto && forma === 'tubo' && d && tubo && tubo < d) volumen = Math.PI * ((d / 2) ** 2 - (tubo / 2) ** 2) * alto;
      if (volumen === null) return null;
      const porcentaje = numero(v, 'llenado') ?? k.llenado.valor * 100;
      if (porcentaje < LLENADO_MINIMO || porcentaje > LLENADO_MAXIMO) {
        return resultado([], [k.llenado.fuente], [`El llenado va de ${LLENADO_MINIMO} a ${LLENADO_MAXIMO} %.`]);
      }
      return resultado(
        [{ nombre: 'Capacidad', valor: litros(volumen) }, { nombre: 'Masa cruda', valor: `${gramos(volumen * (porcentaje / 100) * k.densidad.valor)} g` }],
        [k.densidad.fuente, k.llenado.fuente, ...(atajo ? [atajo.fuente ?? k.fuenteAtajos] : [])]
      );
    }
  };
}

export function cuentaPastaFresca(recetas: readonly RecetaPorPorcion[]): Cuenta {
  return {
    id: 'pasta-fresca', titulo: 'Pasta fresca', descripcion: 'Qué ingredientes lleva la masa de pasta fresca, o el relleno o el puré, para unas porciones.',
    entradas: [
      { id: 'porciones', nombre: 'Porciones', tipo: 'numero', porDefecto: 4 },
      { id: 'masa', nombre: 'Masa', tipo: 'opcion', porDefecto: recetas[0]?.id ?? '', opciones: recetas.map(r => ({ valor: r.id, texto: r.texto })) }
    ],
    calcular(v) {
      const porciones = numero(v, 'porciones');
      const receta = recetas.find(r => r.id === opcion(v, 'masa'));
      if (!porciones || !receta) return null;
      return resultado(lineasDe(receta.ingredientes, porciones), [receta.fuente], [...receta.notas, ...(receta.advertencia ? [receta.advertencia] : [])]);
    }
  };
}

export function cuentaLasana(k: typeof LASANA): Cuenta {
  return {
    id: 'lasana', titulo: 'Lasaña', descripcion: 'Cuántas porciones rinde una fuente de lasaña por su largo y su ancho, y qué ingredientes lleva.', notas: k.notas,
    entradas: [
      { id: 'largo', nombre: 'Largo de la fuente', tipo: 'numero', unidad: 'cm', porDefecto: null },
      { id: 'ancho', nombre: 'Ancho de la fuente', tipo: 'numero', unidad: 'cm', porDefecto: null },
      { id: 'masa', nombre: 'Masa', tipo: 'opcion', porDefecto: k.masas[0]?.id ?? '', opciones: k.masas.map(m => ({ valor: m.id, texto: m.texto })) }
    ],
    calcular(v) {
      const largo = numero(v, 'largo'); const ancho = numero(v, 'ancho');
      const masa = k.masas.find(m => m.id === opcion(v, 'masa'));
      if (!largo || !ancho || !masa) return null;
      const porciones = (largo * ancho) / k.cm2PorPorcion.valor;
      return resultado(
        [{ nombre: 'Porciones', valor: fraccion(Math.max(Math.round(porciones * 2) / 2, 0.5)) }, ...lineasDe(masa.ingredientes, porciones)],
        [k.cm2PorPorcion.fuente, masa.fuente], masa.advertencia ? [masa.advertencia] : []
      );
    }
  };
}

export function cuentaBolloPizza(k: typeof PIZZA): Cuenta {
  const rangoNapolitana = `${Math.min(...k.napolitana.map(r => r.desde))} a ${Math.max(...k.napolitana.map(r => r.hasta))} cm`;
  return {
    id: 'bollo-pizza', titulo: 'Bollo de pizza', descripcion: 'Cuántos gramos pesa el bollo de una pizza, napolitana o al molde, según su diámetro o su número de molde.',
    notas: k.notas ?? [],
    entradas: [
      { id: 'estilo', nombre: 'Estilo', tipo: 'opcion', porDefecto: 'napolitana', opciones: [{ valor: 'napolitana', texto: 'Napolitana' }, { valor: 'molde', texto: 'Al molde' }] },
      { id: 'diametro', nombre: 'Diámetro o número de molde', tipo: 'numero', unidad: 'cm', porDefecto: null },
      { id: 'cantidad', nombre: 'Pizzas', tipo: 'numero', porDefecto: 1 }
    ],
    calcular(v) {
      const d = numero(v, 'diametro'); const n = numero(v, 'cantidad');
      if (!d || !n) return null;
      if (opcion(v, 'estilo') === 'napolitana') {
        // Cada fila cubre desde su `desde` hasta el `desde` de la siguiente: entre dos filas toma la anterior.
        const dentro = d >= Math.min(...k.napolitana.map(r => r.desde)) && d <= Math.max(...k.napolitana.map(r => r.hasta));
        const fila = dentro ? k.napolitana.filter(r => r.desde <= d).sort((a, b) => b.desde - a.desde)[0] : undefined;
        if (!fila) return resultado([], [k.fuenteNapolitana], [`La tabla de la AVPN va de ${rangoNapolitana}.`]);
        return resultado([{ nombre: 'Cada bollo', valor: `${fila.gramos} g` }, { nombre: 'Masa total', valor: `${gramos(fila.gramos * n)} g` }], [k.fuenteNapolitana]);
      }
      const fila = k.molde.find(r => r.numero === d);
      if (fila) return resultado([{ nombre: 'Cada bollo', valor: `${fila.min} a ${fila.max} g` }, { nombre: 'Masa total', valor: `${gramos(fila.min * n)} a ${gramos(fila.max * n)} g` }], [k.fuenteMolde]);
      const g = k.gramosPorCm2Molde.valor * Math.PI * (d / 2) ** 2;
      return resultado([{ nombre: 'Cada bollo', valor: `${gramos(g)} g` }, { nombre: 'Masa total', valor: `${gramos(g * n)} g` }], [k.gramosPorCm2Molde.fuente]);
    }
  };
}

export function cuentaMerengue(tipos: readonly TipoDeMerengue[]): Cuenta {
  return {
    id: 'merengue', titulo: 'Merengue', descripcion: 'Cuánta azúcar, cuánto impalpable y cuánta agua de almíbar lleva un merengue francés, suizo o italiano para unos gramos de claras.',
    entradas: [
      { id: 'claras', nombre: 'Claras', tipo: 'numero', unidad: 'g', porDefecto: null },
      { id: 'tipo', nombre: 'Tipo', tipo: 'opcion', porDefecto: tipos[0]?.id ?? '', opciones: tipos.map(t => ({ valor: t.id, texto: t.nombre })) }
    ],
    calcular(v) {
      const claras = numero(v, 'claras'); const t = tipos.find(x => x.id === opcion(v, 'tipo'));
      if (!claras || !t) return null;
      const lineas: Linea[] = [{ nombre: 'Azúcar', valor: `${gramos(claras * t.azucarPorClara)} g` }];
      if (t.impalpablePorClara) lineas.push({ nombre: 'Azúcar impalpable', valor: `${gramos(claras * t.impalpablePorClara)} g` });
      if (t.aguaPorAzucarAlmibar) lineas.push({ nombre: 'Azúcar del almíbar', valor: `${gramos(claras * t.azucarAlmibarPorClara)} g` });
      if (t.aguaPorAzucarAlmibar) lineas.push({ nombre: 'Agua del almíbar', valor: `${gramos(claras * t.azucarAlmibarPorClara * t.aguaPorAzucarAlmibar)} g` });
      lineas.push({ nombre: 'Temperatura', valor: t.temperatura });
      return resultado(lineas, [t.fuente], t.nota ? [t.nota] : []);
    }
  };
}

/** Donde hierve el agua al nivel del mar, °C: de ahí se corre la tabla. */
const HERVOR_AL_NIVEL_DEL_MAR = 100;
/** Lo más bajo que hierve el agua sobre la Tierra, °C: por debajo, la lectura del termómetro está mal. */
const HERVOR_MINIMO = 70;

export function cuentaPuntoAzucar(k: typeof AZUCAR): Cuenta {
  return {
    id: 'punto-azucar', titulo: 'Puntos del azúcar', descripcion: 'A qué temperatura está cada punto del azúcar, corrido por la altitud o por donde hierve el agua.', notas: k.notas,
    entradas: [
      { id: 'referencia', nombre: 'Ajustar por', tipo: 'opcion', porDefecto: 'altitud', opciones: [{ valor: 'altitud', texto: 'La altitud' }, { valor: 'hervor', texto: 'El hervor medido' }] },
      { id: 'altitud', nombre: 'Altitud', tipo: 'numero', unidad: 'm', porDefecto: 0, visibleSi: v => opcion(v, 'referencia') !== 'hervor' },
      { id: 'hervor', nombre: 'El agua hierve a', tipo: 'numero', unidad: '°C', porDefecto: null, visibleSi: v => opcion(v, 'referencia') === 'hervor' }
    ],
    calcular(v) {
      const hervor = numero(v, 'hervor');
      const altitud = typeof v['altitud'] === 'number' && Number.isFinite(v['altitud']) && v['altitud'] >= 0 ? v['altitud'] : 0;
      const porHervor = opcion(v, 'referencia') === 'hervor';
      if (porHervor && hervor && (hervor < HERVOR_MINIMO || hervor > HERVOR_AL_NIVEL_DEL_MAR)) {
        return resultado([], [k.fuente], [`El agua hierve entre ${HERVOR_MINIMO} y ${HERVOR_AL_NIVEL_DEL_MAR} °C; revisá la lectura del termómetro.`]);
      }
      const resta = porHervor ? (hervor ? HERVOR_AL_NIVEL_DEL_MAR - hervor : null) : altitud / k.metrosPorGrado.valor;
      if (resta === null) return null;
      const t = (x: number): string => String(Math.round(x - resta));
      return {
        lineas: [], advertencias: [], fuentes: [k.fuente, k.metrosPorGrado.fuente],
        tabla: {
          columnas: ['Punto', '°C', 'Prueba en agua fría', 'Usos'],
          filas: k.puntos.map(p => [p.nombre, p.max === null ? t(p.min) : `${t(p.min)}–${t(p.max)}`, p.prueba, p.usos])
        }
      };
    }
  };
}

export const tablaDeArroz = (k: typeof ARROZ): Tabla => ({
  id: 'arroz-variedades', titulo: 'Arroz en olla',
  columnas: [{ id: 'variedad', nombre: 'Variedad' }, { id: 'partes', nombre: 'Agua (partes en volumen)' },
             { id: 'peso', nombre: 'Agua por gramo de arroz', unidad: 'g' }, { id: 'tiempo', nombre: 'Tiempo' }],
  filas: k.variedades.map(x => ({ variedad: x.nombre, partes: x.partesVolumen, peso: x.aguaPorGramo === null ? '—' : String(x.aguaPorGramo).replace('.', ','), tiempo: x.tiempo })),
  notas: k.notas, fuente: k.fuente
});

export function cuentaArroz(k: typeof ARROZ): Cuenta {
  return {
    id: 'arroz', titulo: 'Agua para el arroz', descripcion: 'Cuánta agua y cuánto tiempo lleva el arroz en olla, según la variedad y los gramos.',
    entradas: [
      { id: 'gramos', nombre: 'Arroz', tipo: 'numero', unidad: 'g', porDefecto: null },
      { id: 'variedad', nombre: 'Variedad', tipo: 'opcion', porDefecto: k.variedades[0]?.id ?? '', opciones: k.variedades.map(x => ({ valor: x.id, texto: x.nombre })) }
    ],
    calcular(v) {
      const g = numero(v, 'gramos'); const x = k.variedades.find(y => y.id === opcion(v, 'variedad'));
      if (!g || !x) return null;
      const agua = x.aguaPorGramo === null
        ? `${x.partesVolumen} partes por cada parte de arroz, en volumen`
        : `${gramos(g * x.aguaPorGramo)} g`;
      return resultado([{ nombre: 'Agua', valor: agua }, { nombre: 'Tiempo', valor: x.tiempo }], [k.fuente]);
    }
  };
}

export function cuentaAguaSalPasta(k: typeof AGUA_SAL_PASTA): Cuenta {
  return {
    id: 'agua-sal-pasta', titulo: 'Agua y sal para la pasta', descripcion: 'Cuánta agua y cuánta sal lleva la cocción de unos gramos de pasta seca.',
    entradas: [{ id: 'gramos', nombre: 'Pasta seca', tipo: 'numero', unidad: 'g', porDefecto: null }],
    calcular(v) {
      const g = numero(v, 'gramos'); if (!g) return null;
      const l = (g / 100) * k.litrosPor100g.valor;
      return resultado([{ nombre: 'Agua', valor: litros(l * 1000) }, { nombre: 'Sal', valor: `${gramos(l * k.salPorLitro.valor)} g` }],
        [k.litrosPor100g.fuente, k.salPorLitro.fuente]);
    }
  };
}

export function cuentaEspagueti(k: typeof ESPAGUETI): Cuenta {
  return {
    id: 'medidor-espagueti', titulo: 'Medidor de espagueti', descripcion: 'Cuántos gramos de espagueti hay en un atado de cierto diámetro, o qué diámetro tiene el atado de unos gramos.',
    entradas: [
      { id: 'desde', nombre: 'Tengo', tipo: 'opcion', porDefecto: 'gramos', opciones: [{ valor: 'gramos', texto: 'Los gramos' }, { valor: 'diametro', texto: 'El diámetro del atado' }] },
      { id: 'valor', nombre: 'Cantidad', tipo: 'numero', porDefecto: null }
    ],
    calcular(v) {
      const x = numero(v, 'valor'); if (!x) return null;
      const kk = k.gramosPorCm2.valor;
      const linea = opcion(v, 'desde') === 'diametro'
        ? { nombre: 'Pasta', valor: `${gramos(kk * x ** 2)} g` }
        : { nombre: 'Diámetro del atado', valor: `${(Math.round(Math.sqrt(x / kk) * 10) / 10).toString().replace('.', ',')} cm` };
      return resultado([linea], [k.gramosPorCm2.fuente]);
    }
  };
}

export function cuentaCaldo(k: typeof CALDO): Cuenta {
  return {
    id: 'caldo', titulo: 'Caldo', descripcion: 'Cuánta agua, cuánto mirepoix y cuánto tiempo lleva un caldo de ave, de vaca o de pescado para unos kilos de huesos.', notas: [k.procedimiento],
    entradas: [
      { id: 'kilos', nombre: 'Huesos', tipo: 'numero', unidad: 'kg', porDefecto: null },
      { id: 'tipo', nombre: 'Tipo', tipo: 'opcion', porDefecto: k.tipos[0]?.id ?? '', opciones: k.tipos.map(t => ({ valor: t.id, texto: t.nombre })) }
    ],
    calcular(v) {
      const kg = numero(v, 'kilos'); const t = k.tipos.find(x => x.id === opcion(v, 'tipo'));
      if (!kg || !t) return null;
      const min = kg * k.mirepoixMinPorKg.valor; const max = kg * k.mirepoixMaxPorKg.valor;
      const partes = k.reparto.cebolla + k.reparto.zanahoria + k.reparto.apio;
      const parte = (n: number): string => `${gramos((min * n) / partes)} a ${gramos((max * n) / partes)} g`;
      return resultado([
        { nombre: 'Agua', valor: litros(kg * k.aguaPorKg.valor * 1000) },
        { nombre: 'Mirepoix', valor: `${gramos(min)} a ${gramos(max)} g` },
        { nombre: 'Cebolla', valor: parte(k.reparto.cebolla) }, { nombre: 'Zanahoria', valor: parte(k.reparto.zanahoria) }, { nombre: 'Apio', valor: parte(k.reparto.apio) },
        { nombre: 'Tiempo', valor: t.tiempo }
      ], [k.aguaPorKg.fuente, k.fuente]);
    }
  };
}
