/**
 * El asado: la carne se reparte, cada corte con sus gramos —los de hueso,
 * más—; embutidos, achuras y lo demás aparte; y el carbón o la leña, que sale
 * de los kilos de carne. El tipo de asado es un punto de partida: prende las
 * cosas que trae, y después se cambia lo que haga falta.
 */
import type { Cosa, CosaSimple, Dato, TipoDeEvento } from './tipos.js';
import { ASADO, COMBUSTIBLE } from './datos/asado.js';
import { BEBIDAS, HIELO } from './datos/bebidas.js';
import { bebidas, combustible, hielo } from './ademas.js';
import { deOpcion, fija, soloDatos } from './evento.js';
import { PICADA_ANTES } from './picada.js';

const corte = (id: string, nombre: string, d: Dato): Cosa => ({ id, nombre, grupo: 'carne', prendida: false, porcion: fija(d), unidad: 'g', carne: true });
const aparte = (id: string, nombre: string, d: Dato, extra: Partial<Pick<CosaSimple, 'unidad' | 'nombreUnidad' | 'carne'>> = {}): Cosa =>
  ({ id, nombre, grupo: 'aparte', prendida: false, porcion: fija(d), unidad: 'g', ...extra });

export const ASADO_EVENTO: TipoDeEvento = {
  id: 'asado', nombre: 'Asado',
  datos: [
    { id: 'tipo-asado', nombre: 'Tipo de asado', tipo: 'opcion', porDefecto: 'clasico', opciones: [
      { valor: 'clasico', texto: 'Clásico' }, { valor: 'completo', texto: 'Completo' }, { valor: 'cerdo', texto: 'De cerdo' },
      { valor: 'mixto', texto: 'Mixto' }, { valor: 'cordero', texto: 'Cordero' }, { valor: 'veggie', texto: 'Veggie' }] },
    { id: 'ocasion', nombre: 'Ocasión', tipo: 'opcion', porDefecto: 'almuerzo', opciones: [
      { valor: 'almuerzo', texto: 'Almuerzo' }, { valor: 'cena', texto: 'Cena' }, { valor: 'festejo', texto: 'Festejo' }] }
  ],
  grupos: [
    { id: 'antes', titulo: 'Para picar antes', seReparte: true },
    { id: 'carne', titulo: 'Carne', seReparte: true, factores: c => soloDatos(deOpcion(ASADO.ocasion, c.tipo['ocasion'])) },
    { id: 'aparte', titulo: 'Aparte', seReparte: false }
  ],
  cosas: [
    { id: 'picada', nombre: 'Picada', grupo: 'antes', prendida: false, partes: PICADA_ANTES },
    corte('tira', 'Tira de asado', ASADO.tira),
    corte('vacio', 'Vacío', ASADO.vacio),
    corte('matambre', 'Matambre', ASADO.matambre),
    corte('entrana', 'Entraña', ASADO.entrana),
    corte('pollo', 'Pollo', ASADO.pollo),
    corte('cerdo', 'Cerdo (bondiola o costillas)', ASADO.cerdo),
    corte('cordero', 'Cordero', ASADO.cordero),
    aparte('chorizo', 'Chorizos', ASADO.chorizo, { unidad: 'unidad' }),
    aparte('morcilla', 'Morcillas', ASADO.morcilla, { unidad: 'unidad' }),
    aparte('chinchulines', 'Chinchulines', ASADO.chinchulines, { carne: true }),
    aparte('mollejas', 'Mollejas', ASADO.mollejas, { carne: true }),
    aparte('provoleta', 'Provoleta', ASADO.provoleta, { unidad: 'unidad', nombreUnidad: 'provoletas' }),
    aparte('verduras', 'Verduras a la parrilla', ASADO.verduras),
    aparte('papas', 'Papas', ASADO.papas),
    aparte('ensalada', 'Ensalada', ASADO.ensalada),
    aparte('pan', 'Pan', ASADO.pan)
  ],
  ademas: [
    { ademas: bebidas(BEBIDAS, ['cerveza', 'vino', 'gaseosa', 'agua']), prendido: true },
    { ademas: hielo(HIELO), prendido: true },
    { ademas: combustible(COMBUSTIBLE), prendido: true }
  ],
  // Los de servidos.ar. El pan, la ensalada y lo que no nombra ninguno queda como esté.
  atajo: { dato: 'tipo-asado', cosas: {
    clasico: ['tira', 'chorizo'],
    completo: ['tira', 'vacio', 'chorizo', 'morcilla', 'chinchulines', 'mollejas'],
    cerdo: ['cerdo', 'chorizo'],
    mixto: ['tira', 'pollo'],
    cordero: ['cordero'],
    veggie: ['provoleta', 'verduras']
  } },
  cifra: { grupo: 'carne', nombre: 'Carne' }
};
