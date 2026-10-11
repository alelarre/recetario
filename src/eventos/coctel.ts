/** El cóctel o lunch: bocados que se reparten, por las horas. */
import type { Cosa, TipoDeEvento } from './tipos.js';
import { COCTEL } from './datos/coctel.js';
import { BEBIDAS, HIELO } from './datos/bebidas.js';
import { bebidas, hielo } from './ademas.js';
import { fija, porTramo, soloDatos } from './evento.js';

/** Todos los bocados tienen la misma porción: la del cóctel, repartida entre los que haya. */
const bocado = (id: string, nombre: string, prendida: boolean, docenas = false): Cosa =>
  ({ id, nombre, grupo: 'bocados', prendida, porcion: fija(COCTEL.bocados), unidad: 'unidad', ...(docenas ? { docenas: true as const } : {}) });

export const COCTEL_EVENTO: TipoDeEvento = {
  id: 'coctel', nombre: 'Cóctel o lunch',
  datos: [],
  grupos: [{ id: 'bocados', titulo: 'Bocados', seReparte: true, factores: c => soloDatos(porTramo(COCTEL.horas, c.horas)) }],
  cosas: [
    bocado('miga', 'Sándwiches de miga', true, true),
    bocado('frios', 'Bocaditos fríos', true),
    bocado('calientes', 'Bocaditos calientes', true),
    bocado('empanaditas', 'Empanaditas', false, true),
    bocado('pizzetas', 'Pizzetas', false),
    bocado('dulces', 'Dulces', true)
  ],
  ademas: [
    { ademas: bebidas(BEBIDAS, ['cerveza', 'vino', 'gaseosa', 'agua']), prendido: true },
    { ademas: hielo(HIELO), prendido: true }
  ]
};
