// Una lectura de Drive o de Sheets que no contesta se corta sola: al dibujar
// la receta, el editor, el plan o las compras la pantalla está tapada mientras
// lee (R8), y sin corte quedaría tapada sin salida. Una escritura no se corta.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { crearDrive } from '../src/drive.js';
import { crearSheets } from '../src/sheets.js';
import { CORTE_DE_LECTURA } from '../src/config.js';

/**
 * `AbortSignal.timeout` corre con un reloj propio de Node, que el reloj falso
 * de los tests no mueve: acá se lo arma con `setTimeout`, que sí.
 */
function conRelojFalso(): void {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms: number) => {
    const corte = new AbortController();
    setTimeout(() => { corte.abort(new DOMException('corte', 'TimeoutError')); }, ms);
    return corte.signal;
  });
}

/** Un servidor que acepta el pedido y nunca contesta: sólo el corte lo termina. */
function servidorMudo() {
  const pedidos: RequestInit[] = [];
  global.fetch = vi.fn((_url: string, opciones: RequestInit = {}) => {
    pedidos.push(opciones);
    return new Promise<Response>((_, rechazar) => {
      opciones.signal?.addEventListener('abort', () => { rechazar(opciones.signal?.reason); });
    });
  }) as unknown as typeof fetch;
  return pedidos;
}

/** Cómo terminó una promesa, sin esperarla: sigue pendiente mientras no cambie. */
function mirar(promesa: Promise<unknown>) {
  const estado = { termino: false, fallo: false };
  promesa.then(() => { estado.termino = true; }, () => { estado.termino = true; estado.fallo = true; });
  return estado;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('el corte de las lecturas', () => {
  it('es el mismo tope que traer una foto por URL: 20 s', () => {
    expect(CORTE_DE_LECTURA).toBe(20_000);
  });

  it('una lectura de Drive que no contesta se corta a los 20 s', async () => {
    conRelojFalso();
    servidorMudo();
    const drive = crearDrive(async () => 'tok');
    const lectura = mirar(drive.leerTexto('f1'));
    await vi.advanceTimersByTimeAsync(CORTE_DE_LECTURA - 1);
    expect(lectura.termino).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(lectura.fallo).toBe(true);
  });

  it('también el listado con el que se busca el plan', async () => {
    conRelojFalso();
    servidorMudo();
    const drive = crearDrive(async () => 'tok');
    const listado = mirar(drive.buscarPorNombre('_plan.md', 'raiz'));
    await vi.advanceTimersByTimeAsync(CORTE_DE_LECTURA);
    expect(listado.fallo).toBe(true);
  });

  it('una lectura de Sheets que no contesta se corta a los 20 s', async () => {
    conRelojFalso();
    servidorMudo();
    const sheets = crearSheets(async () => 'tok');
    const lectura = mirar(sheets.leer('indice', 'recetas!A1:M10'));
    await vi.advanceTimersByTimeAsync(CORTE_DE_LECTURA - 1);
    expect(lectura.termino).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(lectura.fallo).toBe(true);
  });

  it('una escritura no se corta: cortarla a mitad no diría si llegó', async () => {
    conRelojFalso();
    const pedidos = servidorMudo();
    const drive = crearDrive(async () => 'tok');
    const sheets = crearSheets(async () => 'tok');
    void drive.actualizar('f1', '# receta');
    void drive.borrar('f1');
    void sheets.escribir('indice', 'recetas!A2:M2', [['x']]);
    void sheets.append('indice', 'recetas', [['x']]);
    await vi.advanceTimersByTimeAsync(0);
    expect(pedidos).toHaveLength(4);
    for (const p of pedidos) expect(p.signal).toBeUndefined();
  });
});
