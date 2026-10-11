/** La merienda: bocados que se reparten, por las horas y si es cumpleaños infantil; la torta aparte; infusiones y bebidas sin alcohol. */
import type { TipoDeEvento } from './tipos.js';
import { MERIENDA } from './datos/merienda.js';
import { BEBIDAS, HIELO, INFUSIONES } from './datos/bebidas.js';
import { bebidas, hielo, infusiones } from './ademas.js';
import { fija, porTramo, soloDatos } from './evento.js';

export const MERIENDA_EVENTO: TipoDeEvento = {
  id: 'merienda', nombre: 'Merienda',
  datos: [{ id: 'infantil', nombre: 'Cumpleaños infantil', tipo: 'si-no', porDefecto: false }],
  grupos: [
    { id: 'bocados', titulo: 'Bocados', seReparte: true,
      factores: c => soloDatos(porTramo(MERIENDA.horas, c.horas), c.tipo['infantil'] === true ? MERIENDA.infantil : null) },
    { id: 'aparte', titulo: 'Aparte', seReparte: false }
  ],
  cosas: [
    { id: 'facturas', nombre: 'Facturas y medialunas', grupo: 'bocados', prendida: true, porcion: fija(MERIENDA.facturas), unidad: 'unidad', docenas: true },
    { id: 'miga', nombre: 'Sándwiches de miga', grupo: 'bocados', prendida: true, porcion: fija(MERIENDA.miga), unidad: 'unidad', docenas: true },
    { id: 'salados', nombre: 'Salados (chipá, pizzetas)', grupo: 'bocados', prendida: false, porcion: fija(MERIENDA.salados), unidad: 'unidad' },
    { id: 'dulces', nombre: 'Dulces (masas secas, alfajores)', grupo: 'bocados', prendida: false, porcion: fija(MERIENDA.dulces), unidad: 'unidad' },
    { id: 'torta', nombre: 'Torta o budín', grupo: 'aparte', prendida: true, porcion: fija(MERIENDA.torta), unidad: 'g', chicoEntero: true }
  ],
  ademas: [
    { ademas: infusiones(INFUSIONES), prendido: true },
    { ademas: bebidas(BEBIDAS, ['gaseosa', 'jugo', 'agua']), prendido: true },
    { ademas: hielo(HIELO), prendido: false }
  ]
};
