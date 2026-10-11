/** La picada: fiambres, quesos, pan y lo demás, en gramos, según sea lo que se come o vaya antes de comer. */
import type { Contexto, CosaConPartes, Dato, TipoDeEvento } from './tipos.js';
import { PICADA } from './datos/picada.js';
import { BEBIDAS, HIELO } from './datos/bebidas.js';
import { bebidas, hielo } from './ademas.js';

type Parte = keyof typeof PICADA.antes;
const parte = (p: Parte) => (c: Contexto): Dato => (c.tipo['rol'] === 'comida' ? PICADA.comida[p] : PICADA.antes[p]);

/** La picada que va antes de un asado o de una comida: una cosa con partes, siempre como antes de comer. */
export const PICADA_ANTES: CosaConPartes['partes'] = [
  { id: 'fiambres', nombre: 'Fiambres', porcion: () => PICADA.antes.fiambres },
  { id: 'quesos', nombre: 'Quesos', porcion: () => PICADA.antes.quesos },
  { id: 'pan', nombre: 'Pan de la picada', porcion: () => PICADA.antes.pan }
];

export const PICADA_EVENTO: TipoDeEvento = {
  id: 'picada', nombre: 'Picada',
  datos: [{ id: 'rol', nombre: 'La picada', tipo: 'opcion', porDefecto: 'antes',
    opciones: [{ valor: 'antes', texto: 'Antes de comer' }, { valor: 'comida', texto: 'Es lo que se come' }] }],
  grupos: [{ id: 'picada', titulo: 'Picada', seReparte: false }],
  cosas: [
    { id: 'fiambres', nombre: 'Fiambres', grupo: 'picada', prendida: true, porcion: parte('fiambres'), unidad: 'g' },
    { id: 'quesos', nombre: 'Quesos', grupo: 'picada', prendida: true, porcion: parte('quesos'), unidad: 'g' },
    { id: 'pan', nombre: 'Pan', grupo: 'picada', prendida: true, porcion: parte('pan'), unidad: 'g' },
    { id: 'vegetales', nombre: 'Vegetales', grupo: 'picada', prendida: true, porcion: parte('vegetales'), unidad: 'g' },
    { id: 'snacks', nombre: 'Snacks', grupo: 'picada', prendida: true, porcion: parte('snacks'), unidad: 'g' },
    { id: 'dips', nombre: 'Dips', grupo: 'picada', prendida: true, porcion: parte('dips'), unidad: 'g' }
  ],
  ademas: [
    { ademas: bebidas(BEBIDAS, ['cerveza', 'vino', 'gaseosa', 'agua']), prendido: true },
    { ademas: hielo(HIELO), prendido: true }
  ]
};
