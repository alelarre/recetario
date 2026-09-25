import { describe, it, expect, vi, afterEach } from 'vitest';
import { rangoDeFila, crearSheets } from '../src/sheets.js';

describe('rangos A1', () => {
  it('una fila entera abarca las trece columnas', () => {
    expect(rangoDeFila(2)).toBe('recetas!A2:M2');
  });

  describe('defensa de parámetros en rangoDeFila', () => {
    it('null lanza error de programación', () => {
      expect(() => rangoDeFila(null)).toThrow();
    });

    it('undefined lanza error de programación', () => {
      expect(() => rangoDeFila(undefined)).toThrow();
    });

    it('un número negativo lanza error de programación', () => {
      expect(() => rangoDeFila(-5)).toThrow();
    });

    it('un string lanza error de programación', () => {
      expect(() => rangoDeFila('algo')).toThrow();
    });

    it('un flotante lanza error de programación', () => {
      expect(() => rangoDeFila(1.5)).toThrow();
    });

    it('un número positivo entero retorna la fila correcta', () => {
      expect(rangoDeFila(1)).toBe('recetas!A1:M1');
      expect(rangoDeFila(10)).toBe('recetas!A10:M10');
      expect(rangoDeFila(100)).toBe('recetas!A100:M100');
    });
  });
});

describe('el cliente de Sheets', () => {
  /** Un `fetch` que contesta `respuesta` y anota cada pedido. */
  function servidor(respuesta: unknown) {
    const pedidos: { url: string; cuerpo: unknown }[] = [];
    vi.stubGlobal('fetch', async (url: string, opciones: RequestInit = {}) => {
      pedidos.push({ url, cuerpo: opciones.body ? JSON.parse(String(opciones.body)) : null });
      return new Response(JSON.stringify(respuesta), { status: 200 });
    });
    return pedidos;
  }
  afterEach(() => { vi.unstubAllGlobals(); });

  it('agregar una hoja devuelve su id, sin otro pedido', async () => {
    const pedidos = servidor({ replies: [{ addSheet: { properties: { sheetId: 7, title: 'meta' } } }] });
    const hoja = await crearSheets(async () => 'tok').agregarHoja('i1', 'meta');
    expect(hoja).toEqual({ sheetId: 7, title: 'meta' });
    expect(pedidos).toHaveLength(1);
  });

  it('las hojas traen el tamaño de su grilla', async () => {
    const pedidos = servidor({ sheets: [{ properties: { sheetId: 0, title: 'recetas', gridProperties: { rowCount: 1000 } } }] });
    const hojas = await crearSheets(async () => 'tok').hojas('i1');
    expect(hojas[0]?.gridProperties?.rowCount).toBe(1000);
    expect(decodeURIComponent(pedidos[0]?.url ?? '')).toContain('gridProperties(rowCount)');
  });

  it('vaciar una hoja es un solo deleteDimension, de la fila 2 al final de la grilla', async () => {
    const pedidos = servidor({});
    await crearSheets(async () => 'tok').vaciarHoja('i1', 3, 1000);
    expect(pedidos[0]?.cuerpo).toEqual({ requests: [{ deleteDimension: {
      range: { sheetId: 3, dimension: 'ROWS', startIndex: 1, endIndex: 1000 }
    } }] });
  });
});
