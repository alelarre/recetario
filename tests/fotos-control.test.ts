import { describe, it, expect } from 'vitest';
import { crearFotosControl, accionesDeFotos, NO_SE_LEYO_UNA_FOTO } from '../src/fotos-control.js';
import type { FotoTraida } from '../src/fotos-control.js';
import { linkDeFoto } from '../src/fotos-receta.js';
import { parse } from '../src/recipe.js';
import type { FotoDeReceta, Receta } from '../src/tipos.js';

const foto = (texto: string): Blob => new Blob([texto], { type: 'image/jpeg' });

/**
 * El controlador con un formulario de mentira: los campos son un registro, y
 * cada vez que avisa un cambio se anota lo que los ocultos decían en ese
 * momento. Achicar devuelve la foto tal cual, y una que dice «roto» no se
 * decodifica.
 */
function montar(campos: Record<string, string> = {}) {
  const formulario: Record<string, string> = { ...campos };
  const cambios: { fotos: string; foto: string }[] = [];
  const creadas: string[] = [];
  const soltadas: string[] = [];
  const fotos = crearFotosControl({
    achicar: async b => {
      if (await b.text() === 'roto') throw new Error('no se decodifica');
      return b;
    },
    crearUrl: b => { const url = `blob:${creadas.length + 1}-${b.size}`; creadas.push(url); return url; },
    soltarUrl: url => { soltadas.push(url); },
    campos: {
      leer: nombre => formulario[nombre] ?? null,
      escribir: (nombre, valor) => { formulario[nombre] = valor; }
    },
    alCambiar: () => { cambios.push({ fotos: formulario['fotos'] ?? '', foto: formulario['foto'] ?? '' }); }
  });
  return { fotos, formulario, cambios, creadas, soltadas };
}

const DEPOSITO: FotoDeReceta[] = [{ n: 1, url: linkDeFoto('f9') }, { n: 2, url: 'https://ejemplo/2.jpg' }];
const receta = (extra: Partial<Receta> = {}): Receta => ({ ...parse(''), fotos: DEPOSITO, foto: 'foto:1', ...extra });

describe('fotos-control — sumar fotos', () => {
  it('sumarFotos achica, numera desde el siguiente y guarda el blob y su URL', async () => {
    const { fotos, formulario, creadas } = montar();
    fotos.cargar(receta());

    const noSeLeyo = await fotos.sumarFotos([foto('a'), foto('bb')]);

    expect(noSeLeyo).toBe(false);
    expect(fotos.fotos()).toEqual([...DEPOSITO, { n: 3, url: '' }, { n: 4, url: '' }]);
    expect(fotos.urlEnMemoria(3)).toBe(creadas[0]);
    expect(fotos.urlEnMemoria(4)).toBe(creadas[1]);
    expect(JSON.parse(formulario['fotos'] ?? '')).toEqual(fotos.fotos());
  });

  it('la que no se decodifica no entra, y lo dice; las demás sí', async () => {
    const { fotos } = montar();
    fotos.cargar(receta({ fotos: [] }));

    const noSeLeyo = await fotos.sumarFotos([foto('roto'), foto('a')]);

    expect(noSeLeyo).toBe(true);
    expect(fotos.fotos()).toEqual([{ n: 1, url: '' }]);
  });

  it('varias fotos son un solo cambio: se redibuja una vez', async () => {
    const { fotos, cambios } = montar();
    fotos.cargar(receta());
    await fotos.sumarFotos([foto('a'), foto('b'), foto('c')]);
    expect(cambios).toHaveLength(1);
  });

  it('un link entra con su URL y sin blob: no hay nada que subir', () => {
    const { fotos } = montar();
    fotos.cargar(receta());
    fotos.sumarLink('https://instagram/3.jpg');
    expect(fotos.fotos().at(-1)).toEqual({ n: 3, url: 'https://instagram/3.jpg' });
    expect(fotos.urlEnMemoria(3)).toBeUndefined();
    expect(fotos.cambiosDeFotos(fotos.conSubidas(receta({ fotos: fotos.fotos() })), receta()).nuevas.size).toBe(0);
  });

  it('antes de que el editor exista, las fotos quedan en memoria para dibujarlo', async () => {
    const { fotos, cambios } = montar();
    await fotos.sumarFotos([foto('a'), foto('b')]);
    expect(fotos.fotos()).toEqual([{ n: 1, url: '' }, { n: 2, url: '' }]);
    expect(cambios).toHaveLength(1);
  });
});

describe('fotos-control — sacar', () => {
  it('sacar una foto la borra del depósito y de todo el texto que la nombraba', () => {
    const { fotos, formulario } = montar({
      preparacion: '1. Freír. ![](foto:2)', notas: 'Ver ![la fuente](foto:2) y ![](foto:1)'
    });
    fotos.cargar(receta());

    fotos.sacar(2);

    expect(fotos.fotos()).toEqual([DEPOSITO[0]]);
    expect(formulario['preparacion']).toBe('1. Freír.');
    expect(formulario['notas']).toBe('Ver y ![](foto:1)');
    expect(JSON.parse(formulario['fotos'] ?? '')).toEqual([DEPOSITO[0]]);
  });

  it('sacar la portada deja la cabecera vacía', () => {
    const { fotos, formulario } = montar();
    fotos.cargar(receta());
    fotos.sacar(1);
    expect(fotos.portada()).toBe('');
    expect(formulario['foto']).toBe('');
  });

  it('sacar otra deja la portada como estaba', () => {
    const { fotos, formulario } = montar();
    fotos.cargar(receta());
    fotos.sacar(2);
    expect(fotos.portada()).toBe('foto:1');
    expect(formulario['foto']).toBe('foto:1');
  });

  it('sacar una nueva suelta su object URL y su blob: no sube al guardar', async () => {
    const { fotos, creadas, soltadas } = montar();
    fotos.cargar(receta());
    await fotos.sumarFotos([foto('a')]);

    fotos.sacar(3);

    expect(soltadas).toEqual([creadas[0]]);
    expect(fotos.urlEnMemoria(3)).toBeUndefined();
    expect(fotos.cambiosDeFotos(receta({ fotos: fotos.fotos() }), receta()).nuevas.size).toBe(0);
  });

  it('una foto sumada después de sacar la última no hereda lo que se había subido de aquélla', async () => {
    const { fotos } = montar();
    fotos.cargar(receta({ fotos: [] }));
    await fotos.sumarFotos([foto('a')]);
    fotos.cambiosDeFotos(receta({ fotos: fotos.fotos() }), receta({ fotos: [] })).alSubir?.(1, 'subida-1');

    fotos.sacar(1);
    await fotos.sumarFotos([foto('b')]);

    expect(fotos.conSubidas(receta({ fotos: fotos.fotos() })).fotos).toEqual([{ n: 1, url: '' }]);
  });
});

describe('fotos-control — la portada y las líneas', () => {
  it('ponerPortada la escribe como foto:N, y sacarPortada la deja vacía', () => {
    const { fotos, formulario, cambios } = montar();
    fotos.cargar(receta());

    fotos.ponerPortada(2);
    expect(fotos.portada()).toBe('foto:2');
    expect(formulario['foto']).toBe('foto:2');

    fotos.sacarPortada();
    expect(fotos.portada()).toBe('');
    expect(formulario['foto']).toBe('');
    expect(cambios).toHaveLength(2);
  });

  it('ponerEn escribe la referencia en la línea y avisa el cambio', () => {
    const { fotos, formulario, cambios } = montar({ preparacion: 'Freír.\nServir.' });
    fotos.cargar(receta());

    fotos.ponerEn('preparacion', 1, 2);

    expect(formulario['preparacion']).toBe('Freír.\nServir. ![](foto:2)');
    expect(cambios).toHaveLength(1);
  });
});

describe('fotos-control — los ocultos salen del estado', () => {
  it('cada cambio reescribe los dos ocultos antes de avisar', () => {
    const { fotos, cambios } = montar({ fotos: 'lo que sea', foto: 'otra cosa' });
    fotos.cargar(receta());

    fotos.ponerPortada(2);

    expect(cambios.at(-1)).toEqual({ fotos: JSON.stringify(DEPOSITO), foto: 'foto:2' });
  });

  it('cargar toma lo dibujado sin avisar: el formulario ya lo tiene', () => {
    const { fotos, cambios } = montar();
    fotos.cargar(receta());
    expect(fotos.fotos()).toEqual(DEPOSITO);
    expect(fotos.portada()).toBe('foto:1');
    expect(cambios).toHaveLength(0);
  });

  it('cargar de nuevo conserva las fotos en memoria: el editor redibujado las sigue mostrando', async () => {
    const { fotos } = montar();
    fotos.cargar(receta());
    await fotos.sumarFotos([foto('a')]);
    const url = fotos.urlEnMemoria(3);

    fotos.cargar(receta({ fotos: fotos.fotos() }));

    expect(fotos.urlEnMemoria(3)).toBe(url);
  });

  it('vaciar lo olvida todo: el editor siguiente abre con lo que dice el .md', async () => {
    const { fotos } = montar();
    fotos.cargar(receta());
    await fotos.sumarFotos([foto('a')]);

    fotos.vaciar();

    expect(fotos.fotos()).toEqual([]);
    expect(fotos.portada()).toBe('');
    expect(fotos.urlEnMemoria(3)).toBeUndefined();
  });
});

describe('fotos-control — guardar', () => {
  it('cambiosDeFotos: las nuevas con su blob y las URLs que ya no están', async () => {
    const { fotos } = montar();
    fotos.cargar(receta());
    await fotos.sumarFotos([foto('nueva')]);
    fotos.sacar(2);

    const cambios = fotos.cambiosDeFotos(receta({ fotos: fotos.fotos() }), receta());

    expect([...cambios.nuevas.keys()]).toEqual([3]);
    expect(await cambios.nuevas.get(3)?.text()).toBe('nueva');
    expect(cambios.sacadas).toEqual(['https://ejemplo/2.jpg']);
  });

  it('conSubidas: la que ya se subió en un intento anterior va por su link', async () => {
    const { fotos } = montar();
    fotos.cargar(receta({ fotos: [] }));
    await fotos.sumarFotos([foto('a')]);
    const escrita = receta({ fotos: fotos.fotos() });

    fotos.cambiosDeFotos(escrita, receta({ fotos: [] })).alSubir?.(1, 'subida-1');

    const reintento = fotos.conSubidas(escrita);
    expect(reintento.fotos).toEqual([{ n: 1, url: linkDeFoto('subida-1') }]);
    // Con su link, ya no es nueva: no se vuelve a subir.
    expect(fotos.cambiosDeFotos(reintento, receta({ fotos: [] })).nuevas.size).toBe(0);
  });
});

describe('fotos-control — las subidas de un intento que falló', () => {
  it('una que se subió y después se sacó va a la papelera en el guardado siguiente', async () => {
    const { fotos } = montar();
    fotos.cargar(receta({ fotos: [] }));
    await fotos.sumarFotos([foto('a'), foto('b')]);
    const escrita = receta({ fotos: fotos.fotos() });
    const intento = fotos.cambiosDeFotos(escrita, receta({ fotos: [] }));
    intento.alSubir?.(1, 'subida-1');
    intento.alSubir?.(2, 'subida-2');

    // El editor vuelve con los links de lo subido, y se saca la 1.
    fotos.cargar(fotos.conSubidas(escrita));
    fotos.sacar(1);

    const cambios = fotos.cambiosDeFotos(receta({ fotos: fotos.fotos() }), receta({ fotos: [] }));
    expect(cambios.sacadas).toEqual([linkDeFoto('subida-1')]);
    // La que quedó no se toca: va en la receta por su link.
    expect(fotos.fotos()).toEqual([{ n: 2, url: linkDeFoto('subida-2') }]);
  });

  it('salir del editor las olvida: no se mandan a la papelera en otro editor', async () => {
    const { fotos } = montar();
    fotos.cargar(receta({ fotos: [] }));
    await fotos.sumarFotos([foto('a')]);
    fotos.cambiosDeFotos(receta({ fotos: fotos.fotos() }), receta({ fotos: [] })).alSubir?.(1, 'subida-1');
    fotos.sacar(1);
    fotos.vaciar();
    fotos.cargar(receta({ fotos: [] }));
    expect(fotos.cambiosDeFotos(receta({ fotos: [] }), receta({ fotos: [] })).sacadas).toEqual([]);
  });
});

describe('fotos-control — las acciones del editor', () => {
  const boton = (datos: Record<string, string> = {}): HTMLElement =>
    ({ dataset: datos }) as unknown as HTMLElement;
  const evento = {} as Event;

  /** Las acciones sobre una pantalla de mentira que anota lo que se le pide. */
  function conPantalla(url: string, traida: FotoTraida = { que: 'no-se-pudo' }) {
    const armado = montar();
    const hechos: string[] = [];
    const acciones = accionesDeFotos(armado.fotos, {
      abrirFicha: html => { hechos.push(`abrir ${html.match(/data-[\w-]+/)?.[0] ?? ''}`); if (html.includes('aviso')) hechos.push(html); },
      cerrarFicha: () => { hechos.push('cerrar'); },
      acomodarBoton: () => { hechos.push('acomodar'); },
      urlEscrita: () => url,
      traer: async u => { hechos.push(`traer ${u}`); return traida; },
      esperar: async tarea => { hechos.push('esperar'); return tarea(); },
      avisar: texto => { hechos.push(`avisar ${texto}`); }
    });
    return { ...armado, hechos, acciones };
  }

  it('Por URL con una dirección http:// no la pide: reabre la ficha con el aviso', async () => {
    const { acciones, hechos } = conPantalla('http://ejemplo/a.jpg');
    await acciones['traer-foto-url']?.(boton(), evento);
    expect(hechos.some(h => h.startsWith('traer'))).toBe(false);
    expect(hechos.join('\n')).toContain('https://');
  });

  it('Por URL con el esquema en mayúsculas lo normaliza y la trae en una sola espera', async () => {
    const { acciones, hechos, fotos } = conPantalla('Https://ejemplo/a.jpg', { que: 'foto', blob: foto('a') });
    fotos.cargar(receta({ fotos: [] }));
    await acciones['traer-foto-url']?.(boton(), evento);
    expect(hechos).toEqual(['avisar ', 'esperar', 'traer https://ejemplo/a.jpg', 'cerrar']);
    expect(fotos.fotos()).toEqual([{ n: 1, url: '' }]);
  });

  it('Por URL que no se pudo bajar entra como link, cierra la ficha y avisa', async () => {
    const { acciones, hechos, fotos } = conPantalla('https://ejemplo/a.jpg');
    fotos.cargar(receta({ fotos: [] }));
    await acciones['traer-foto-url']?.(boton(), evento);
    expect(fotos.fotos()).toEqual([{ n: 1, url: 'https://ejemplo/a.jpg' }]);
    expect(hechos.slice(-2)).toEqual(['cerrar', expect.stringMatching(/^avisar .*queda como link/)]);
  });

  it('Por URL con una foto que no se decodifica reabre la ficha con el aviso', async () => {
    const { acciones, hechos, fotos } = conPantalla('https://ejemplo/a.jpg', { que: 'foto', blob: foto('roto') });
    fotos.cargar(receta({ fotos: [] }));
    await acciones['traer-foto-url']?.(boton(), evento);
    expect(fotos.fotos()).toEqual([]);
    expect(hechos.join('\n')).toContain(NO_SE_LEYO_UNA_FOTO);
  });

  it('elegir la portada sin data-n no hace nada', () => {
    const { acciones, hechos, fotos, cambios } = conPantalla('');
    fotos.cargar(receta());
    void acciones['elegir-portada']?.(boton(), evento);
    expect(fotos.portada()).toBe('foto:1');
    expect(cambios).toEqual([]);
    expect(hechos).toEqual([]);
  });

  it('elegir la portada la pone y cierra la ficha', () => {
    const { acciones, hechos, fotos } = conPantalla('');
    fotos.cargar(receta());
    void acciones['elegir-portada']?.(boton({ n: '2' }), evento);
    expect(fotos.portada()).toBe('foto:2');
    expect(hechos).toEqual(['cerrar']);
  });
});
