/**
 * La comida —almuerzo, cena o festejo—: lo que se pica antes, lo que se
 * come, el acompañamiento y el postre se reparten cada uno entre lo suyo; el
 * pan va aparte. Las empanadas están en dos grupos, como dos cosas.
 */
import type { Cosa, Dato, TipoDeEvento } from './tipos.js';
import { COMIDA } from './datos/comida.js';
import { BEBIDAS, HIELO } from './datos/bebidas.js';
import { bebidas, hielo } from './ademas.js';
import { deOpcion, fija, soloDatos } from './evento.js';
import { PICADA_ANTES } from './picada.js';

const g = (id: string, nombre: string, grupo: string, d: Dato, prendida = false): Cosa =>
  ({ id, nombre, grupo, prendida, porcion: fija(d), unidad: 'g' });

export const COMIDA_EVENTO: TipoDeEvento = {
  id: 'comida', nombre: 'Comida',
  datos: [
    { id: 'ocasion', nombre: 'Ocasión', tipo: 'opcion', porDefecto: 'almuerzo', opciones: [
      { valor: 'almuerzo', texto: 'Almuerzo' }, { valor: 'cena', texto: 'Cena' }, { valor: 'festejo', texto: 'Festejo' }] },
    { id: 'sobras', nombre: 'Con sobras', tipo: 'si-no', porDefecto: false }
  ],
  grupos: [
    { id: 'antes', titulo: 'Para picar antes', seReparte: true },
    { id: 'comer', titulo: 'Para comer', seReparte: true,
      factores: c => soloDatos(deOpcion(COMIDA.ocasion, c.tipo['ocasion']), c.tipo['sobras'] === true ? COMIDA.sobras : null) },
    { id: 'acompanamiento', titulo: 'Acompañamiento', seReparte: true },
    { id: 'postre', titulo: 'Postre', seReparte: true },
    { id: 'aparte', titulo: 'Aparte', seReparte: false }
  ],
  cosas: [
    { id: 'picada', nombre: 'Picada', grupo: 'antes', prendida: false, partes: PICADA_ANTES },
    { id: 'empanadas-antes', nombre: 'Empanadas', grupo: 'antes', prendida: false, porcion: fija(COMIDA.antes.empanadas), unidad: 'unidad', docenas: true },
    g('vitel-tone', 'Vitel toné', 'antes', COMIDA.antes.vitelTone),
    { id: 'bocaditos', nombre: 'Bocaditos', grupo: 'antes', prendida: false, porcion: fija(COMIDA.antes.bocaditos), unidad: 'unidad' },
    { id: 'empanadas-comer', nombre: 'Empanadas', grupo: 'comer', prendida: false, porcion: fija(COMIDA.comer.empanadas), unidad: 'unidad', docenas: true },
    { id: 'pizza', nombre: 'Pizzas', grupo: 'comer', prendida: false, porcion: fija(COMIDA.comer.pizza), unidad: 'unidad', nombreUnidad: 'porciones',
      envase: { cantidad: COMIDA.porcionesPorPizza, nombre: { uno: 'pizza', varios: 'pizzas' } } },
    g('pasta-seca', 'Pasta seca', 'comer', COMIDA.comer.pastaSeca),
    g('pasta-fresca', 'Pasta fresca', 'comer', COMIDA.comer.pastaFresca),
    g('carne', 'Carne', 'comer', COMIDA.comer.carne, true),
    g('pollo', 'Pollo', 'comer', COMIDA.comer.pollo),
    g('pescado', 'Pescado', 'comer', COMIDA.comer.pescado),
    g('pure', 'Puré (papas)', 'acompanamiento', COMIDA.acompanamiento.pure),
    g('papas', 'Papas', 'acompanamiento', COMIDA.acompanamiento.papas),
    g('ensalada', 'Ensalada', 'acompanamiento', COMIDA.acompanamiento.ensalada, true),
    g('arroz', 'Arroz', 'acompanamiento', COMIDA.acompanamiento.arroz),
    { id: 'torta', nombre: 'Torta', grupo: 'postre', prendida: false, porcion: fija(COMIDA.postre.torta), unidad: 'g', chicoEntero: true },
    { id: 'helado', nombre: 'Helado', grupo: 'postre', prendida: true, porcion: fija(COMIDA.postre.helado), unidad: 'ml' },
    g('postre', 'Postre en porciones (flan, tiramisú, mousse)', 'postre', COMIDA.postre.postre),
    g('fruta', 'Fruta', 'postre', COMIDA.postre.fruta),
    g('pan', 'Pan', 'aparte', COMIDA.pan, true)
  ],
  ademas: [
    { ademas: bebidas(BEBIDAS, ['vino', 'gaseosa', 'agua']), prendido: true },
    { ademas: hielo(HIELO), prendido: true }
  ]
};
