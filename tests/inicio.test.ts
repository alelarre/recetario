import { describe, it, expect, vi, afterEach } from 'vitest';
import { comoGlobal, limpiarGlobales } from './dom-falso.js';

const cargados = vi.hoisted(() => ({ main: 0, invitado: 0 }));
vi.mock('../src/ui/tokens.css', () => ({}));
vi.mock('../src/ui/base.css', () => ({}));
vi.mock('../src/main.js', () => { cargados.main++; return {}; });
vi.mock('../src/invitado.js', () => ({ iniciarInvitado: () => { cargados.invitado++; } }));

const esperar = async () => { for (let i = 0; i < 5; i++) await new Promise(r => setTimeout(r, 0)); };

describe('la entrada', () => {
  afterEach(() => { limpiarGlobales(); vi.resetModules(); cargados.main = 0; cargados.invitado = 0; });

  it('#/ver… carga el invitado y no la app', async () => {
    global.location = comoGlobal<Location>({ hash: '#/ver?r=1abc' });
    await import('../src/inicio.js');
    await esperar();
    expect(cargados).toEqual({ main: 0, invitado: 1 });
  });

  it('cualquier otro hash carga la app', async () => {
    global.location = comoGlobal<Location>({ hash: '#/r/f1' });
    await import('../src/inicio.js');
    await esperar();
    expect(cargados).toEqual({ main: 1, invitado: 0 });
  });
});
