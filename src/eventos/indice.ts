/** Los tipos de evento, en el orden del desplegable. Un tipo nuevo se suma acá. */
import type { TipoDeEvento } from './tipos.js';
import { MERIENDA_EVENTO } from './merienda.js';
import { ASADO_EVENTO } from './asado.js';
import { COMIDA_EVENTO } from './comida.js';
import { PICADA_EVENTO } from './picada.js';
import { COCTEL_EVENTO } from './coctel.js';

export const TIPOS_DE_EVENTO: readonly TipoDeEvento[] = [MERIENDA_EVENTO, ASADO_EVENTO, COMIDA_EVENTO, PICADA_EVENTO, COCTEL_EVENTO];
