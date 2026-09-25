import { describe, it, expect, afterEach } from 'vitest';
import { crearListaControl, accionesDeLista, TRAMO } from '../src/lista-control.js';
import { entradaFalsa } from './dobles.js';
import { comoGlobal } from './dom-falso.js';

const e = (titulo: string, extra: Parameters<typeof entradaFalsa>[0] = {}) =>
  entradaFalsa({ id_archivo: titulo, titulo, ...extra });
const titulos = (entradas: { titulo: string }[]) => entradas.map(x => x.titulo);
const muchas = (n: number) => Array.from({ length: n }, (_, i) => e(`A${String(i + 1).padStart(2, '0')}`));

describe('lista-control — el estado', () => {
  it('arranca sin filtros, en A–Z y con el primer tramo', () => {
    const lista = crearListaControl();
    expect(lista.tagsActivos).toEqual([]);
    expect(lista.duracionesActivas).toEqual([]);
    expect(lista.orden).toBe('alfa');
    expect(lista.visibles).toBe(TRAMO);
  });

  it('cada controlador es otro: lo que filtra uno no pasa al siguiente', () => {
    const anterior = crearListaControl();
    anterior.alternarTag('vegano');
    anterior.alternarDuracion('~15 min');
    expect(crearListaControl().tagsActivos).toEqual([]);
    expect(crearListaControl().duracionesActivas).toEqual([]);
  });

  it('tocar un tag lo prende, y tocarlo de nuevo lo apaga', () => {
    const lista = crearListaControl();
    lista.alternarTag('horno');
    lista.alternarTag('vegano');
    expect(lista.tagsActivos).toEqual(['horno', 'vegano']);
    lista.alternarTag('horno');
    expect(lista.tagsActivos).toEqual(['vegano']);
  });

  it('tocar una duración la prende, y tocarla de nuevo la apaga', () => {
    const lista = crearListaControl();
    lista.alternarDuracion('~15 min');
    lista.alternarDuracion('>1 día');
    expect(lista.duracionesActivas).toEqual(['~15 min', '>1 día']);
    lista.alternarDuracion('~15 min');
    expect(lista.duracionesActivas).toEqual(['>1 día']);
  });

  it('mas() agranda el tramo', () => {
    const lista = crearListaControl();
    lista.mas();
    expect(lista.visibles).toBe(2 * TRAMO);
    lista.mas();
    expect(lista.visibles).toBe(3 * TRAMO);
  });

  it('filtrar, ordenar o pedir el primer tramo vuelven al primer tramo', () => {
    const lista = crearListaControl();
    lista.mas(); lista.alternarTag('horno');
    expect(lista.visibles).toBe(TRAMO);
    lista.mas(); lista.alternarDuracion('~15 min');
    expect(lista.visibles).toBe(TRAMO);
    lista.mas(); lista.ordenar('duracion');
    expect(lista.visibles).toBe(TRAMO);
    lista.mas(); lista.primerTramo();
    expect(lista.visibles).toBe(TRAMO);
  });
});

describe('lista-control — la lista plana', () => {
  it('corta al tramo y dice el total real y si hay más', () => {
    const lista = crearListaControl();
    const plana = lista.plana(muchas(TRAMO + 1));
    expect(plana.entradas).toHaveLength(TRAMO);
    expect(plana.total).toBe(TRAMO + 1);
    expect(plana.hayMas).toBe(true);
    lista.mas();
    const toda = lista.plana(muchas(TRAMO + 1));
    expect(toda.entradas).toHaveLength(TRAMO + 1);
    expect(toda.hayMas).toBe(false);
  });

  it('sin paginar van todas, aunque pasen del tramo', () => {
    const plana = crearListaControl().plana(muchas(TRAMO + 5), { filtros: false, paginar: false });
    expect(plana.entradas).toHaveLength(TRAMO + 5);
    expect(plana.hayMas).toBe(false);
  });

  it('A–Z: las favoritas primero y alfabético dentro de cada bloque, venga como venga', () => {
    const plana = crearListaControl().plana([
      e('Vitel toné'), e('Osobuco', { tags: ['favorito'] }), e('Bife'), e('Asado', { tags: ['favorito'] })
    ]);
    expect(titulos(plana.entradas)).toEqual(['Asado', 'Osobuco', 'Bife', 'Vitel toné']);
  });

  it('una receta incompleta no se ordena distinto', () => {
    const plana = crearListaControl().plana([e('B'), e('A', { tags: ['incompleta'] })]);
    expect(titulos(plana.entradas)).toEqual(['A', 'B']);
  });

  it('por duración: de la más corta a la más larga, las sin duración al final', () => {
    const lista = crearListaControl();
    lista.ordenar('duracion');
    const plana = lista.plana([
      e('Abadejo', { tiempo: '>60 min' }), e('Arroz'), e('Zarzuela', { tiempo: '~15 min' })
    ]);
    expect(titulos(plana.entradas)).toEqual(['Zarzuela', 'Abadejo', 'Arroz']);
    expect(plana.orden).toBe('duracion');
  });

  it('el orden se aplica antes de cortar: la única con duración entra en el primer tramo', () => {
    const lista = crearListaControl();
    lista.ordenar('duracion');
    const plana = lista.plana([...muchas(TRAMO), e('Zeta', { tiempo: '~15 min' })]);
    expect(plana.entradas[0]?.titulo).toBe('Zeta');
  });

  it('filtra por las duraciones prendidas, y las cantidades cuentan sobre la lista sin ese filtro', () => {
    const lista = crearListaControl();
    lista.alternarDuracion('~15 min');
    const plana = lista.plana([e('A', { tiempo: '~15 min' }), e('B', { tiempo: '>60 min' }), e('C')]);
    expect(titulos(plana.entradas)).toEqual(['A']);
    expect(plana.total).toBe(1);
    expect(plana.duraciones).toEqual([{ valor: '~15 min', cantidad: 1 }, { valor: '>60 min', cantidad: 1 }]);
    expect(plana.duracionesActivas).toEqual(['~15 min']);
  });

  it('sin ninguna duración no hay conmutador, y el orden por duración se ignora', () => {
    const lista = crearListaControl();
    lista.ordenar('duracion');
    const plana = lista.plana([e('Zapallo', { tags: ['favorito'] }), e('Arroz')]);
    expect(plana.orden).toBeNull();
    expect(titulos(plana.entradas)).toEqual(['Zapallo', 'Arroz']);
  });

  it('con una duración prendida que ya no trae nada, el conmutador sigue', () => {
    const lista = crearListaControl();
    lista.alternarDuracion('~15 min');
    expect(lista.plana([e('Arroz')]).orden).toBe('alfa');
  });

  it('sin filtros, ni duraciones ni conmutador, en A–Z', () => {
    const lista = crearListaControl();
    lista.alternarDuracion('~15 min');
    lista.ordenar('duracion');
    const plana = lista.plana([e('B', { tiempo: '~15 min' }), e('A', { tiempo: '>60 min' })], { filtros: false });
    expect(titulos(plana.entradas)).toEqual(['A', 'B']);
    expect(plana.duraciones).toEqual([]);
    expect(plana.orden).toBeNull();
  });
});

describe('lista-control — la lista agrupada', () => {
  const sinNada = { porNombre: [], porIngrediente: [], porTag: [] };

  it('los tres grupos, con su rótulo y su total; uno vacío no está', () => {
    const agrupada = crearListaControl().agrupada({
      ...sinNada,
      porNombre: [e('Filet')],
      porTag: [{ entrada: e('Caballa'), motivo: 'tiene tag merluza' }]
    });
    expect(agrupada.grupos.map(g => [g.rotulo, g.total])).toEqual([['Por nombre', 1], ['Por tag', 1]]);
    expect(agrupada.grupos[1]?.items[0]?.motivo).toBe('tiene tag merluza');
    expect(agrupada.total).toBe(2);
  });

  it('cada grupo ordena sus favoritas primero, sin mezclarse con los otros, y conserva el motivo', () => {
    const agrupada = crearListaControl().agrupada({
      porNombre: [e('Zapallo'), e('Arroz', { tags: ['favorito'] })],
      porIngrediente: [
        { entrada: e('Budín'), motivo: 'lleva huevo' },
        { entrada: e('Alfajor', { tags: ['favorito'] }), motivo: 'lleva dulce' }
      ],
      porTag: []
    });
    expect(titulos(agrupada.grupos[0]!.items.map(i => i.entrada))).toEqual(['Arroz', 'Zapallo']);
    expect(agrupada.grupos[1]!.items.map(i => [i.entrada.titulo, i.motivo])).toEqual([['Alfajor', 'lleva dulce'], ['Budín', 'lleva huevo']]);
  });

  it('ordena por duración dentro de cada grupo', () => {
    const lista = crearListaControl();
    lista.ordenar('duracion');
    const agrupada = lista.agrupada({
      porNombre: [e('Besugo', { tiempo: '>60 min' }), e('Pollo', { tiempo: '~30 min' })],
      porIngrediente: [],
      porTag: [{ entrada: e('Arroz', { tiempo: '~15 min' }), motivo: 'tiene tag horno' }]
    });
    expect(titulos(agrupada.grupos[0]!.items.map(i => i.entrada))).toEqual(['Pollo', 'Besugo']);
    expect(agrupada.orden).toBe('duracion');
  });

  it('sin ninguna duración, no hay conmutador', () => {
    expect(crearListaControl().agrupada({ ...sinNada, porNombre: [e('Besugo')] }).orden).toBeNull();
  });

  it('pagina a lo largo de los grupos: el tramo corta donde llega, y el rótulo dice el total del grupo', () => {
    const lista = crearListaControl();
    const grupos = {
      porNombre: muchas(TRAMO - 2),
      porIngrediente: [e('B1'), e('B2'), e('B3')].map(entrada => ({ entrada, motivo: 'lleva algo' })),
      porTag: [{ entrada: e('C1'), motivo: 'tiene tag x' }]
    };
    const primera = lista.agrupada(grupos);
    expect(primera.grupos.map(g => [g.rotulo, g.total, g.items.length])).toEqual([
      ['Por nombre', TRAMO - 2, TRAMO - 2], ['Por ingrediente', 3, 2]
    ]);
    expect(primera.hayMas).toBe(true);
    expect(primera.total).toBe(TRAMO + 2);
    lista.mas();
    const toda = lista.agrupada(grupos);
    expect(toda.grupos.map(g => g.items.length)).toEqual([TRAMO - 2, 3, 1]);
    expect(toda.hayMas).toBe(false);
  });
});

describe('lista-control — el observador del tramo', () => {
  const g = global as unknown as Record<string, unknown>;
  afterEach(() => { delete g['IntersectionObserver']; });

  /** Un observador falso que se dispara a mano, y lo que observa y desconecta. */
  function observadorFalso() {
    const observados: unknown[] = [];
    let desconectados = 0;
    let llegar = (_si: boolean): void => {};
    g['IntersectionObserver'] = class {
      constructor(fn: (e: { isIntersecting: boolean }[]) => void) { llegar = (si) => fn([{ isIntersecting: si }]); }
      observe(el: unknown): void { observados.push(el); }
      disconnect(): void { desconectados++; }
    };
    return { observados, desconectados: () => desconectados, llegar: (si = true) => llegar(si) };
  }

  it('observa el spinner que le da quien dibuja la lista, sin buscarlo en el documento', () => {
    const obs = observadorFalso();
    const spin = { es: 'el de la lista' };
    // Sin `document`: si el controlador lo leyera, fallaría acá.
    crearListaControl().observar(() => comoGlobal<Element>(spin), () => {});
    expect(obs.observados).toEqual([spin]);
  });

  it('cuando el spinner entra en pantalla, agranda el tramo y redibuja', () => {
    const obs = observadorFalso();
    const lista = crearListaControl();
    let redibujos = 0;
    lista.observar(() => comoGlobal<Element>({}), () => { redibujos++; });
    obs.llegar(false);
    expect(redibujos).toBe(0);
    obs.llegar();
    expect(lista.visibles).toBe(2 * TRAMO);
    expect(redibujos).toBe(1);
  });

  it('observar de nuevo, o soltar, desconecta el anterior; sin spinner no observa nada', () => {
    const obs = observadorFalso();
    let hay = true;
    const spinner = (): Element | null => (hay ? comoGlobal<Element>({}) : null);
    const lista = crearListaControl();
    lista.observar(spinner, () => {});
    lista.observar(spinner, () => {});
    expect(obs.desconectados()).toBe(1);
    lista.soltar();
    expect(obs.desconectados()).toBe(2);
    hay = false;
    lista.observar(spinner, () => {});
    expect(obs.observados).toHaveLength(2);
  });

  it('sin IntersectionObserver, como en Node, no hace nada', () => {
    expect(() => crearListaControl().observar(() => comoGlobal<Element>({}), () => {})).not.toThrow();
  });
});

describe('lista-control — las acciones', () => {
  const boton = (valor: string) => comoGlobal<HTMLElement>({ dataset: { valor } });

  it('filtrar por duración y ordenar cambian la lista de la pantalla y redibujan', async () => {
    const lista = crearListaControl();
    let redibujos = 0;
    const acciones = accionesDeLista(() => lista, () => { redibujos++; });
    await acciones['filtrar-duracion']?.(boton('~15 min'), new Event('click'));
    await acciones['ordenar']?.(boton('duracion'), new Event('click'));
    expect(lista.duracionesActivas).toEqual(['~15 min']);
    expect(lista.orden).toBe('duracion');
    expect(redibujos).toBe(2);
    await acciones['ordenar']?.(boton('cualquiera'), new Event('click'));
    expect(lista.orden).toBe('alfa');
  });
});
