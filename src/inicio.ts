/**
 * La entrada de `index.html`. Decide antes de cargar nada de la app: un link de
 * receta compartida (`#/ver…`) abre la vista de invitado sin login y sin
 * `main.ts`; cualquier otra cosa, la app.
 */
import './ui/tokens.css';
import './ui/base.css';
import { esHashDeInvitado } from './ui/router.js';

if (esHashDeInvitado(location.hash)) {
  void import('./invitado.js').then(m => m.iniciarInvitado());
} else {
  void import('./main.js');
}
