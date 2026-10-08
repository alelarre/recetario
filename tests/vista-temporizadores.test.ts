import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  renderTemporizadores, renderTira, formaDeTira, turnosDeTira, rotarTira, pasoDeDeslizar, CICLO_TIRA
} from '../src/ui/temporizadores.js';
import type { EstadoTemporizadores } from '../src/temporizadores-control.js';
import { MINUTO, CRONO_EN_CERO } from '../src/temporizadores.js';
import { ICO } from '../src/ui/iconos.js';

const T0 = 1_000_000;
const base: EstadoTemporizadores = { temporizadores: [], crono: CRONO_EN_CERO, ruedas: { h: 0, m: 10, s: 0 }, avisando: null, ahora: T0 };
const pasta = { id: 'p', nombre: 'Pasta', duracion: 10 * MINUTO, fin: T0 + 3 * MINUTO + 12_000 };
const horno = { id: 'h', nombre: 'Horno', duracion: 30 * MINUTO, fin: T0 + 24 * MINUTO + 40_000 };
const lista = { id: 'l', nombre: 'Huevos', duracion: 6 * MINUTO, fin: T0 - 2000 };
const dibujar = (extra: Partial<EstadoTemporizadores> = {}, nombre = '') => renderTemporizadores({ ...base, ...extra, nombre });

describe('la pantalla de Temporizadores', () => {
  it('va con volver y en orden: cronómetro, los que corren, temporizador nuevo', () => {
    const html = dibujar({ temporizadores: [pasta, horno] });
    expect(html).toContain('>Temporizadores<');
    expect(html).toContain('data-accion="volver"');
    const crono = html.indexOf('Cronómetro');
    const p = html.indexOf('data-temporizador="p"');
    const h = html.indexOf('data-temporizador="h"');
    const nuevo = html.indexOf('Nuevo temporizador');
    expect(crono).toBeGreaterThan(0);
    expect(p).toBeGreaterThan(crono);
    expect(h).toBeGreaterThan(p);
    expect(nuevo).toBeGreaterThan(h);
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

  it('un temporizador corriendo: nombre, tiempo, barra y los tres botones con su id', () => {
    const html = dibujar({ temporizadores: [pasta] });
    expect(html).toContain(`<span class="nom">${ICO.reloj}Pasta</span>`);
    expect(html).toContain('data-tiempo="p">3:12<');
    expect(html).toMatch(/data-avance="p" style="width:68%"/);
    expect(html).toContain(`data-accion="temporizador-sumar" data-id="p" aria-label="Un minuto más">+1'<`);
    expect(html).toContain(`data-accion="temporizador-pausar" data-id="p" aria-label="Pausar">${ICO.pausa}<`);
    expect(html).toContain(`data-accion="temporizador-sacar" data-id="p" aria-label="Sacar">${ICO.cerrar}<`);
  });

  it('pausado: el tiempo apagado y el botón de seguir', () => {
    const html = dibujar({ temporizadores: [{ id: 'q', nombre: 'Masa', duracion: 10 * MINUTO, restante: 9 * MINUTO }] });
    expect(html).toContain('class="tiempo pausado" data-tiempo="q">9:00<');
    expect(html).toContain(`data-accion="temporizador-seguir" data-id="q" aria-label="Seguir">${ICO.play}<`);
  });

  it('terminado: ¡Listo!, sin barra, con +1 y Parar', () => {
    const html = dibujar({ temporizadores: [lista], avisando: 'l' });
    expect(html).toContain('class="tiempo listo">¡Listo!<');
    expect(html).not.toContain('data-avance="l"');
    expect(html).toContain(`data-accion="temporizador-sumar" data-id="l" aria-label="Un minuto más">+1'<`);
    expect(html).toContain('class="btn prim" type="button" data-accion="temporizador-sacar" data-id="l">Parar<');
    expect(html).not.toContain('data-accion="temporizador-pausar" data-id="l"');
  });

  it('temporizador nuevo: el nombre escrito, las ruedas con sus botones y Empezar', () => {
    const html = dibujar({}, 'Pas');
    expect(html).toContain('<input name="nombre-temporizador" value="Pas"');
    for (const r of ['h', 'm', 's']) {
      expect(html).toContain(`data-accion="rueda-mas" data-rueda="${r}"`);
      expect(html).toContain(`data-accion="rueda-menos" data-rueda="${r}"`);
    }
    expect(html).toContain('data-rueda-valor="h">0<');
    expect(html).toContain('data-rueda-valor="m">10<');
    expect(html).toContain('data-rueda-valor="s">00<');
    expect(html).toContain('data-accion="temporizador-empezar">Empezar<');
  });

  it('en 0:00:00, Empezar deshabilitado', () => {
    expect(dibujar({ ruedas: { h: 0, m: 0, s: 0 } })).toContain('data-accion="temporizador-empezar" disabled>Empezar<');
  });
});

describe('la tira', () => {
  const corren = { ...base, crono: { desde: T0 - 65_000, acumulado: 0 }, temporizadores: [pasta, horno] };

  it('sin nada que mostrar no existe; los pausados no cuentan', () => {
    expect(renderTira(base, 0)).toBe('');
    expect(renderTira({ ...base, temporizadores: [{ id: 'q', nombre: 'Masa', duracion: MINUTO, restante: MINUTO }] }, 0)).toBe('');
  });

  it('los turnos van en el orden de la pantalla: el cronómetro y los temporizadores, terminados incluidos', () => {
    const pausado = { id: 'q', nombre: 'Masa', duracion: MINUTO, restante: MINUTO };
    const e = { ...corren, temporizadores: [pasta, pausado, lista, horno] };
    expect(turnosDeTira(e).map(t => (t.tipo === 'crono' ? 'crono' : t.temporizador.id))).toEqual(['crono', 'p', 'l', 'h']);
  });

  it('dibuja el turno que le toca, con su lugar entre todos', () => {
    expect(renderTira(corren, 0)).toContain('<span class="nom">Cronómetro</span>');
    expect(renderTira(corren, 0)).toContain('data-tiempo-tira>1:05<');
    expect(renderTira(corren, 0)).toContain('<span class="mas">1/3</span>');
    expect(renderTira(corren, 1)).toContain('<span class="nom">Pasta</span>');
    expect(renderTira(corren, 1)).toContain('data-tiempo-tira>3:12<');
    expect(renderTira(corren, 2)).toContain('<span class="mas">3/3</span>');
    expect(renderTira(corren, 1)).toContain('data-accion="ir-temporizadores"');
  });

  it('con más de uno, las flechas para pasar a mano', () => {
    const html = renderTira(corren, 1);
    expect(html).toContain(`data-accion="tira-anterior" aria-label="Anterior">${ICO.volver}<`);
    expect(html).toContain(`data-accion="tira-siguiente" aria-label="Siguiente">${ICO.chevron}<`);
  });

  it('con uno solo, ni flechas ni lugar', () => {
    const html = renderTira({ ...base, temporizadores: [pasta] }, 0);
    expect(html).toContain('<span class="nom">Pasta</span>');
    expect(html).not.toContain('class="mas"');
    expect(html).not.toContain('tira-siguiente');
  });

  it('uno terminado rota con los demás, con ¡Listo! y Parar', () => {
    const e = { ...base, temporizadores: [lista, pasta], avisando: 'l' };
    const html = renderTira(e, 0);
    expect(html).toContain('class="tira listo');
    expect(html).toContain('<span class="nom">Huevos</span>');
    expect(html).toContain('¡Listo!');
    expect(html).toContain('data-accion="temporizador-sacar" data-id="l">Parar<');
    expect(renderTira(e, 1)).toContain('<span class="nom">Pasta</span>');
  });

  it('un lugar que ya no existe vuelve al principio', () => {
    expect(renderTira({ ...base, temporizadores: [pasta] }, 4)).toContain('<span class="nom">Pasta</span>');
  });

  it('al cambiar de turno se mueve el contenido y no la tira: el fondo y las flechas quedan quietos', () => {
    const der = renderTira(corren, 1, 'der');
    expect(der).toContain('<div class="tira" data-accion="ir-temporizadores">');
    expect(der).toContain('<span class="tira-contenido entra-der">');
    expect(renderTira(corren, 1, 'izq')).toContain('<span class="tira-contenido entra-izq">');
    expect(renderTira(corren, 1)).toContain('<span class="tira-contenido">');
    // Las flechas, afuera de lo que se mueve.
    const contenido = der.slice(der.indexOf('tira-contenido'), der.indexOf('</span><button class="tira-flecha" type="button" data-accion="tira-siguiente"'));
    expect(contenido).not.toContain('tira-flecha');
    expect(contenido).toContain('<span class="nom">Pasta</span>');
  });
});

describe('la rotación de la tira', () => {
  it('pasa sola al siguiente cada 5 s, y del último vuelve al primero', () => {
    expect(CICLO_TIRA).toBe(5000);
    const r0 = { lugar: 0, desde: T0 };
    expect(rotarTira(r0, 3, T0 + CICLO_TIRA - 1)).toEqual(r0);
    expect(rotarTira(r0, 3, T0 + CICLO_TIRA)).toEqual({ lugar: 1, desde: T0 + CICLO_TIRA });
    expect(rotarTira({ lugar: 2, desde: T0 }, 3, T0 + CICLO_TIRA)).toEqual({ lugar: 0, desde: T0 + CICLO_TIRA });
  });

  it('a mano, un paso para cada lado, y el turno empieza de nuevo', () => {
    const r = { lugar: 0, desde: T0 };
    expect(rotarTira(r, 3, T0 + 1000, 1)).toEqual({ lugar: 1, desde: T0 + 1000 });
    expect(rotarTira(r, 3, T0 + 1000, -1)).toEqual({ lugar: 2, desde: T0 + 1000 });
  });

  it('con uno solo o ninguno no rota', () => {
    expect(rotarTira({ lugar: 0, desde: T0 }, 1, T0 + 9 * CICLO_TIRA).lugar).toBe(0);
    expect(rotarTira({ lugar: 0, desde: T0 }, 1, T0, 1).lugar).toBe(0);
    expect(rotarTira({ lugar: 0, desde: T0 }, 0, T0, 1).lugar).toBe(0);
  });

  it('si se fueron turnos, el lugar vuelve a caer adentro', () => {
    expect(rotarTira({ lugar: 3, desde: T0 }, 2, T0 + 1000).lugar).toBe(1);
  });
});

describe('deslizar sobre la tira', () => {
  it('a la izquierda pasa al siguiente; a la derecha, al anterior', () => {
    expect(pasoDeDeslizar(-60, 5)).toBe(1);
    expect(pasoDeDeslizar(60, -5)).toBe(-1);
  });

  it('poco movimiento, o más vertical que horizontal, no es deslizar', () => {
    expect(pasoDeDeslizar(-20, 0)).toBe(0);
    expect(pasoDeDeslizar(-60, 50)).toBe(0);
  });
});

describe('la forma de la tira', () => {
  const e = { ...base, temporizadores: [pasta, horno] };

  it('no cambia con los segundos: sólo cambia el tiempo, que se escribe sin rehacerla', () => {
    expect(formaDeTira(e, 0)).toBe(formaDeTira({ ...e, ahora: T0 + 3000 }, 0));
  });

  it('cambia con el turno, con cuántos hay, al terminar y sin nada', () => {
    const dos = formaDeTira(e, 0);
    expect(formaDeTira(e, 1)).not.toBe(dos);
    expect(formaDeTira({ ...base, temporizadores: [pasta] }, 0)).not.toBe(dos);
    expect(formaDeTira({ ...e, ahora: pasta.fin }, 0)).not.toBe(dos);
    expect(formaDeTira(base, 0)).toBe('');
  });
});

describe('el CSS de Temporizadores', () => {
  const BASE = readFileSync(new URL('../src/ui/base.css', import.meta.url), 'utf8');

  it('las fichas de la pantalla van separadas, como en cualquier cuerpo', () => {
    expect(BASE).toContain('.temporizadores { display: flex; flex-direction: column; gap: var(--e-5); }');
  });

  it('el contenido del turno nuevo entra deslizándose 16 px, salvo con movimiento reducido', () => {
    expect(BASE).toContain('.tira-contenido.entra-der { animation: tira-entra-der');
    expect(BASE).toContain('.tira-contenido.entra-izq { animation: tira-entra-izq');
    expect(BASE).toContain('@keyframes tira-entra-der { from { transform: translateX(16px);');
    expect(BASE).toMatch(/prefers-reduced-motion: reduce\) \{ \.tira-contenido\.entra-der, \.tira-contenido\.entra-izq \{ animation: none; \} \}/);
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

  it('el modo cocina deja abajo el lugar de la tira: es donde más se usan los temporizadores', () => {
    expect(BASE).toContain('.coc { padding: var(--e-4); padding-bottom: calc(var(--e-4) + var(--tira));');
  });
});

const amasar = { id: 'a', nombre: 'amasar', acumulado: 65_000, desde: T0 - 5000 };
const leudar = { id: 'z', nombre: 'leudar', acumulado: 30_000 };

describe('los cronómetros con nombre', () => {
  it("van en la lista, en su orden, con el tiempo que sube, pausa y sacar, sin +1' ni barra", () => {
    const html = dibujar({ temporizadores: [pasta, amasar] });
    const ficha = html.slice(html.indexOf('data-temporizador="a"'));
    expect(html.indexOf('data-temporizador="a"')).toBeGreaterThan(html.indexOf('data-temporizador="p"'));
    expect(ficha).toContain('1:10');
    expect(ficha).toContain('data-accion="temporizador-pausar"');
    expect(ficha).toContain('data-accion="temporizador-sacar"');
    expect(ficha.slice(0, ficha.indexOf('</div></div>'))).not.toContain('temporizador-sumar');
    expect(ficha.slice(0, ficha.indexOf('</div></div>'))).not.toContain('class="barra"');
  });
  it('el ícono al lado del nombre distingue cuenta y cronómetro', () => {
    const html = dibujar({ temporizadores: [pasta, amasar] });
    expect(html).toContain(`<span class="nom">${ICO.reloj}Pasta</span>`);
    expect(html).toContain(`<span class="nom">${ICO.cronometro}amasar</span>`);
  });
  it('la tira rota por los que corren, mezclados, y no por los pausados', () => {
    const turnos = turnosDeTira({ ...base, temporizadores: [pasta, amasar, leudar] });
    expect(turnos.map(t => (t.tipo === 'temporizador' ? t.temporizador.id : 'crono'))).toEqual(['p', 'a']);
  });
  it('en la tira, un cronómetro muestra su nombre y lo que lleva', () => {
    const html = renderTira({ ...base, temporizadores: [amasar] }, 0);
    expect(html).toContain('>amasar<');
    expect(html).toContain('1:10');
    expect(html).toContain(ICO.cronometro);
  });
});
