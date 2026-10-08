import { describe, it, expect, vi } from 'vitest';
import { accionesDeMarcas, BLOQUEO_MARCA } from '../src/marca-control.js';
import { ICO } from '../src/ui/iconos.js';

function armar() {
  const pendientes: { ms: number; fn: () => void }[] = [];
  const d = { empezarCuenta: vi.fn(), empezarCrono: vi.fn(), demorar: (ms: number, fn: () => void) => { pendientes.push({ ms, fn }); } };
  const acciones = accionesDeMarcas(d);
  const tocar = (b: HTMLElement) => acciones['crear-temporizador']!(b, new Event('click'));
  const pasar = () => { for (const p of pendientes.splice(0)) p.fn(); };
  return { d, tocar, pasar, pendientes };
}
const boton = (dataset: Record<string, string>) =>
  ({ dataset, disabled: false, innerHTML: ICO.relojMas, classList: { add: vi.fn(), remove: vi.fn() } }) as unknown as HTMLElement & { disabled: boolean };

describe('crear-temporizador', () => {
  it('una cuenta, con su nombre y su duración', () => {
    const { d, tocar } = armar();
    tocar(boton({ tipo: 'cuenta', duracion: '3000000', nombre: 'cocinar' }));
    expect(d.empezarCuenta).toHaveBeenCalledWith('cocinar', 3_000_000);
  });
  it('un cronómetro, con su nombre', () => {
    const { d, tocar } = armar();
    tocar(boton({ tipo: 'cronometro', nombre: 'amasar' }));
    expect(d.empezarCrono).toHaveBeenCalledWith('amasar');
  });
  it('queda 2 s deshabilitado con la tilde, y después vuelve', () => {
    const { tocar, pasar, pendientes } = armar();
    const b = boton({ tipo: 'cuenta', duracion: '60000', nombre: 'x' });
    tocar(b);
    expect(b.disabled).toBe(true);
    expect(b.innerHTML).toBe(ICO.tilde);
    expect(pendientes[0]?.ms).toBe(BLOQUEO_MARCA);
    pasar();
    expect(b.disabled).toBe(false);
    expect(b.innerHTML).toBe(ICO.relojMas);
  });
  it('un segundo toque mientras está bloqueado no crea otro', () => {
    const { d, tocar, pasar } = armar();
    const b = boton({ tipo: 'cuenta', duracion: '60000', nombre: 'x' });
    tocar(b); tocar(b);
    expect(d.empezarCuenta).toHaveBeenCalledOnce();
    pasar(); tocar(b);
    expect(d.empezarCuenta).toHaveBeenCalledTimes(2);
  });
  it('sin duración válida, una cuenta no crea nada', () => {
    const { d, tocar } = armar();
    tocar(boton({ tipo: 'cuenta', duracion: 'x', nombre: 'x' }));
    expect(d.empezarCuenta).not.toHaveBeenCalled();
  });
});
