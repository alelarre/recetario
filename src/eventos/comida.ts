/**
 * La comida: lo que se pica antes, lo que se
 * come, el acompañamiento y el postre se reparten cada uno entre lo suyo; el
 * pan va aparte. Las empanadas están en dos grupos, como dos cosas.
 */
import type { Cosa, Dato, Restriccion, TipoDeEvento } from './tipos.js';
import { COMIDA } from './datos/comida.js';
import { BEBIDAS, HIELO } from './datos/bebidas.js';
import { bebidas, hielo } from './ademas.js';
import { fija, soloDatos } from './evento.js';
import { PICADA_ANTES } from './picada.js';

const g = (id: string, nombre: string, grupo: string, d: Dato, aptaPara: readonly Restriccion[], prendida = false): Cosa =>
  ({ id, nombre, grupo, prendida, porcion: fija(d), unidad: 'g', aptaPara });

export const COMIDA_EVENTO: TipoDeEvento = {
  id: 'comida', nombre: 'Comida',
  datos: [
    { id: 'sobras', nombre: 'Con sobras', tipo: 'si-no', porDefecto: false }
  ],
  grupos: [
    { id: 'antes', titulo: 'Para picar antes', seReparte: true },
    { id: 'comer', titulo: 'Para comer', seReparte: true,
      factores: c => soloDatos(c.tipo['sobras'] === true ? COMIDA.sobras : null) },
    { id: 'acompanamiento', titulo: 'Acompañamiento', seReparte: true },
    { id: 'postre', titulo: 'Postre', seReparte: true },
    { id: 'aparte', titulo: 'Aparte', seReparte: false }
  ],
  cosas: [
    { id: 'picada', nombre: 'Picada', grupo: 'antes', prendida: false, aptaPara: [], partes: PICADA_ANTES },
    { id: 'empanadas-antes', nombre: 'Empanadas', grupo: 'antes', prendida: false, aptaPara: [], porcion: fija(COMIDA.antes.empanadas), unidad: 'unidad', docenas: true },
    g('vitel-tone', 'Vitel toné', 'antes', COMIDA.antes.vitelTone, ['celiaco']),
    { id: 'bocaditos', nombre: 'Bocaditos', grupo: 'antes', prendida: false, aptaPara: [], porcion: fija(COMIDA.antes.bocaditos), unidad: 'unidad' },
    { id: 'empanadas-comer', nombre: 'Empanadas', grupo: 'comer', prendida: false, aptaPara: [], porcion: fija(COMIDA.comer.empanadas), unidad: 'unidad', docenas: true },
    { id: 'pizza', nombre: 'Pizzas', grupo: 'comer', prendida: false, aptaPara: ['vegetariano'], porcion: fija(COMIDA.comer.pizza), unidad: 'unidad', nombreUnidad: 'porciones',
      envase: { cantidad: COMIDA.porcionesPorPizza, nombre: { uno: 'pizza', varios: 'pizzas' } } },
    g('pasta-seca', 'Pasta seca', 'comer', COMIDA.comer.pastaSeca, ['vegetariano', 'vegano', 'sin-lactosa']),
    g('pasta-fresca', 'Pasta fresca', 'comer', COMIDA.comer.pastaFresca, ['vegetariano', 'sin-lactosa']),
    g('carne', 'Carne', 'comer', COMIDA.comer.carne, ['celiaco', 'sin-lactosa'], true),
    g('pollo', 'Pollo', 'comer', COMIDA.comer.pollo, ['celiaco', 'sin-lactosa']),
    g('pescado', 'Pescado', 'comer', COMIDA.comer.pescado, ['celiaco', 'sin-lactosa']),
    g('pure', 'Puré (papas)', 'acompanamiento', COMIDA.acompanamiento.pure, ['vegetariano', 'celiaco']),
    g('papas', 'Papas', 'acompanamiento', COMIDA.acompanamiento.papas, ['vegetariano', 'vegano', 'celiaco', 'sin-lactosa']),
    g('ensalada', 'Ensalada', 'acompanamiento', COMIDA.acompanamiento.ensalada, ['vegetariano', 'vegano', 'celiaco', 'sin-lactosa'], true),
    g('arroz', 'Arroz', 'acompanamiento', COMIDA.acompanamiento.arroz, ['vegetariano', 'vegano', 'celiaco', 'sin-lactosa']),
    { id: 'torta', nombre: 'Torta', grupo: 'postre', prendida: false, aptaPara: ['vegetariano'], porcion: fija(COMIDA.postre.torta), unidad: 'g', chicoEntero: true },
    { id: 'helado', nombre: 'Helado', grupo: 'postre', prendida: true, aptaPara: ['vegetariano', 'celiaco'], porcion: fija(COMIDA.postre.helado), unidad: 'ml' },
    g('postre', 'Postre en porciones (flan, tiramisú, mousse)', 'postre', COMIDA.postre.postre, ['vegetariano']),
    g('fruta', 'Fruta', 'postre', COMIDA.postre.fruta, ['vegetariano', 'vegano', 'celiaco', 'sin-lactosa']),
    g('pan', 'Pan', 'aparte', COMIDA.pan, ['vegetariano', 'vegano', 'sin-lactosa'], true)
  ],
  ademas: [
    { ademas: bebidas(BEBIDAS, ['vino', 'gaseosa', 'agua']), prendido: true },
    { ademas: hielo(HIELO), prendido: true }
  ]
};
