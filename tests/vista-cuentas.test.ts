import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderCuentas, renderTira, formaDeTira, CICLO_TIRA } from '../src/ui/cuentas.js';
import type { EstadoCuentas } from '../src/cuentas-control.js';
import { MINUTO, CRONO_EN_CERO } from '../src/cuentas.js';
import { ICO } from '../src/ui/iconos.js';

const T0 = 1_000_000;
const base: EstadoCuentas = { cuentas: [], crono: CRONO_EN_CERO, ruedas: { h: 0, m: 10, s: 0 }, avisando: null, ahora: T0 };
const pasta = { id: 'p', nombre: 'Pasta', duracion: 10 * MINUTO, fin: T0 + 3 * MINUTO + 12_000 };
const horno = { id: 'h', nombre: 'Horno', duracion: 30 * MINUTO, fin: T0 + 24 * MINUTO + 40_000 };
const lista = { id: 'l', nombre: 'Huevos', duracion: 6 * MINUTO, fin: T0 - 2000 };
const dibujar = (extra: Partial<EstadoCuentas> = {}, nombre = '') => renderCuentas({ ...base, ...extra, nombre });

describe('la pantalla de Cuentas', () => {
  it('va con volver y en orden: cronómetro, las que corren, nueva cuenta', () => {
    const html = dibujar({ cuentas: [pasta, horno] });
    expect(html).toContain('>Cuentas<');
    expect(html).toContain('data-accion="volver"');
    const crono = html.indexOf('Cronómetro');
    const p = html.indexOf('data-cuenta="p"');
    const h = html.indexOf('data-cuenta="h"');
    const nueva = html.indexOf('Nueva cuenta');
    expect(crono).toBeGreaterThan(0);
    expect(p).toBeGreaterThan(crono);
    expect(h).toBeGreaterThan(p);
    expect(nueva).toBeGreaterThan(h);
  });

  it('el cronómetro en cero: Reiniciar deshabilitado e Iniciar; corriendo: Parar', () => {
    const enCero = dibujar();
    expect(enCero).toContain('data-tiempo="crono">0:00<');
    expect(enCero).toContain('data-accion="crono-reiniciar" disabled>');
    expect(enCero).toContain('data-accion="crono-iniciar">Iniciar<');
    const andando = dibujar({ crono: { desde: T0 - 727_000, acumulado: 0 } });
    expect(andando).toContain('data-tiempo="crono">12:07<');
    expect(andando).toContain('data-accion="crono-parar">Parar<');
    expect(andando).not.toContain('disabled');
  });

  it('una cuenta corriendo: nombre, tiempo, barra y los tres botones con su id', () => {
    const html = dibujar({ cuentas: [pasta] });
    expect(html).toContain('<span class="nom">Pasta</span>');
    expect(html).toContain('data-tiempo="p">3:12<');
    expect(html).toMatch(/data-avance="p" style="width:68%"/);
    expect(html).toContain(`data-accion="cuenta-sumar" data-id="p" aria-label="Un minuto más">+1'<`);
    expect(html).toContain(`data-accion="cuenta-pausar" data-id="p" aria-label="Pausar">${ICO.pausa}<`);
    expect(html).toContain(`data-accion="cuenta-sacar" data-id="p" aria-label="Sacar">${ICO.cerrar}<`);
  });

  it('pausada: el tiempo apagado y el botón de seguir', () => {
    const html = dibujar({ cuentas: [{ id: 'q', nombre: 'Masa', duracion: 10 * MINUTO, restante: 9 * MINUTO }] });
    expect(html).toContain('class="tiempo pausada" data-tiempo="q">9:00<');
    expect(html).toContain(`data-accion="cuenta-seguir" data-id="q" aria-label="Seguir">${ICO.play}<`);
  });

  it('terminada: ¡Listo!, sin barra, con +1 y Parar', () => {
    const html = dibujar({ cuentas: [lista], avisando: 'l' });
    expect(html).toContain('class="tiempo listo">¡Listo!<');
    expect(html).not.toContain('data-avance="l"');
    expect(html).toContain(`data-accion="cuenta-sumar" data-id="l" aria-label="Un minuto más">+1'<`);
    expect(html).toContain('class="btn prim" type="button" data-accion="cuenta-sacar" data-id="l">Parar<');
    expect(html).not.toContain('data-accion="cuenta-pausar" data-id="l"');
  });

  it('nueva cuenta: el nombre escrito, las ruedas con sus botones y Empezar', () => {
    const html = dibujar({}, 'Pas');
    expect(html).toContain('<input name="nombre-cuenta" value="Pas"');
    for (const r of ['h', 'm', 's']) {
      expect(html).toContain(`data-accion="rueda-mas" data-rueda="${r}"`);
      expect(html).toContain(`data-accion="rueda-menos" data-rueda="${r}"`);
    }
    expect(html).toContain('data-rueda-valor="h">0<');
    expect(html).toContain('data-rueda-valor="m">10<');
    expect(html).toContain('data-rueda-valor="s">00<');
    expect(html).toContain('data-accion="cuenta-empezar">Empezar<');
  });

  it('en 0:00:00, Empezar deshabilitado', () => {
    expect(dibujar({ ruedas: { h: 0, m: 0, s: 0 } })).toContain('data-accion="cuenta-empezar" disabled>Empezar<');
  });
});

describe('la tira', () => {
  it('sin nada corriendo no existe', () => {
    expect(renderTira(base)).toBe('');
    expect(renderTira({ ...base, cuentas: [{ id: 'q', nombre: 'Masa', duracion: MINUTO, restante: MINUTO }] })).toBe('');
  });

  it('va rotando por todo lo que corre, un turno cada 5 s: el cronómetro primero y las cuentas en su orden', () => {
    expect(CICLO_TIRA).toBe(5000);
    const e = { ...base, crono: { desde: T0 - 65_000, acumulado: 0 }, cuentas: [pasta, horno] };
    // T0 es el turno 200: con tres que corren, le toca a la tercera.
    const turno = (k: number) => renderTira({ ...e, ahora: T0 + (k - 200) * CICLO_TIRA });
    expect(turno(201)).toContain('<span class="nom">Cronómetro</span>');
    expect(turno(201)).toContain('data-tiempo-tira>1:10<');
    expect(turno(201)).toContain('<span class="mas">1/3</span>');
    expect(turno(202)).toContain('<span class="nom">Pasta</span>');
    expect(turno(202)).toContain('data-tiempo-tira>3:02<');
    expect(turno(202)).toContain('<span class="mas">2/3</span>');
    expect(turno(203)).toContain('<span class="nom">Horno</span>');
    expect(turno(203)).toContain('<span class="mas">3/3</span>');
    expect(turno(204)).toContain('<span class="nom">Cronómetro</span>');
    expect(turno(202)).toContain('data-accion="ir-cuentas"');
  });

  it('con una sola cosa corriendo, sin la cuenta de cuántas son', () => {
    const html = renderTira({ ...base, cuentas: [pasta] });
    expect(html).toContain('<span class="nom">Pasta</span>');
    expect(html).toContain('data-tiempo-tira>3:12<');
    expect(html).not.toContain('class="mas"');
  });

  it('las pausadas y las terminadas no entran en la rotación', () => {
    const pausada = { id: 'q', nombre: 'Masa', duracion: MINUTO, restante: MINUTO };
    const terminadaCallada = { ...lista };
    for (let k = 0; k < 4; k++) {
      const html = renderTira({ ...base, cuentas: [pausada, terminadaCallada, pasta], ahora: T0 + k * CICLO_TIRA });
      expect(html).toContain('<span class="nom">Pasta</span>');
    }
  });

  it('sólo el cronómetro: su nombre y su tiempo', () => {
    const html = renderTira({ ...base, crono: { desde: T0 - 65_000, acumulado: 0 } });
    expect(html).toContain('<span class="nom">Cronómetro</span>');
    expect(html).toContain('data-tiempo-tira>1:05<');
  });

  it('avisando: ¡Listo! con Parar, y la cuenta por su id', () => {
    const html = renderTira({ ...base, cuentas: [lista, pasta], avisando: 'l' });
    expect(html).toContain('class="tira listo"');
    expect(html).toContain('<span class="nom">Huevos</span>');
    expect(html).toContain('¡Listo!');
    expect(html).toContain('data-accion="cuenta-sacar" data-id="l">Parar<');
  });
});

describe('la forma de la tira', () => {
  it('no cambia dentro de un turno: sólo cambia el tiempo, que se escribe sin rehacerla', () => {
    const e = { ...base, cuentas: [pasta, horno] };
    expect(formaDeTira(e)).toBe(formaDeTira({ ...e, ahora: T0 + CICLO_TIRA - 1000 }));
  });

  it('cambia con el turno, con cuántas corren, con el aviso y sin nada', () => {
    const dos = formaDeTira({ ...base, cuentas: [pasta, horno] });
    expect(formaDeTira({ ...base, cuentas: [pasta, horno], ahora: T0 + CICLO_TIRA })).not.toBe(dos);
    expect(formaDeTira({ ...base, cuentas: [horno] })).not.toBe(dos);
    expect(formaDeTira({ ...base, cuentas: [pasta] })).not.toBe(dos);
    expect(formaDeTira({ ...base, cuentas: [lista, pasta], avisando: 'l' })).not.toBe(dos);
    expect(formaDeTira(base)).toBe('');
  });
});

describe('el CSS de Cuentas', () => {
  const BASE = readFileSync(new URL('../src/ui/base.css', import.meta.url), 'utf8');

  it('las fichas de la pantalla van separadas, como en cualquier cuerpo', () => {
    expect(BASE).toContain('.cuentas { display: flex; flex-direction: column; gap: var(--e-5); }');
  });

  it('con el menú lateral fijo, la tira arranca donde termina el menú', () => {
    const fijo = BASE.indexOf('@media (min-width: 900px) { #tira { left: 260px; } }');
    expect(fijo).toBeGreaterThan(0);
    // Después de la regla que la pone en el borde: con el mismo peso, gana la última.
    expect(fijo).toBeGreaterThan(BASE.indexOf('#tira { position: fixed;'));
  });
});

describe('lo que la tira no tiene que tapar', () => {
  const BASE = readFileSync(new URL('../src/ui/base.css', import.meta.url), 'utf8');

  it('el modo cocina deja abajo el lugar de la tira: es donde más se usan las cuentas', () => {
    expect(BASE).toContain('.coc { padding: var(--e-4); padding-bottom: calc(var(--e-4) + var(--tira));');
  });
});
