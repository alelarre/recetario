import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validarMd, type Problema } from '../src/validar.js';

const CORRECTA = `---
titulo: Milanesas napolitanas
tags: [carne, favorito, borrador]
rinde: 4 porciones
tiempo: ~60 min
dificultad: media
fuente: https://ejemplo.com/milanesas
foto: foto:1
---

Las de los domingos.

## Ingredientes
### Milanesas
- Nalga — 1 kg
- Huevos — 3
- Pan rallado; 2 tazas
- Sal
### Cobertura
- Salsa de tomate | 1 taza
- Muzzarella, 300 g

## Preparación
1. Cortar y golpear la carne.
2. Pasar por huevo y pan rallado. ![](foto:2)
3. Hornear con la cobertura.

## Fotos
- 1: https://drive.google.com/file/d/aaa/view
- 2: https://drive.google.com/file/d/bbb/view
`;

const campos = (ps: Problema[]): string[] => ps.map(p => p.campo);

/** La receta correcta con el frontmatter cambiado: una línea reemplazada o sumada. */
const conFrontmatter = (reemplazar: string, por: string): string => {
  const md = CORRECTA.replace(reemplazar, por);
  if (md === CORRECTA) throw new Error(`no está: ${reemplazar}`);
  return md;
};

describe('un .md correcto', () => {
  it('no tiene problemas y devuelve la receta como la lee la app', () => {
    const { receta, problemas } = validarMd(CORRECTA);
    expect(problemas).toEqual([]);
    expect(receta.titulo).toBe('Milanesas napolitanas');
    expect(receta.fotos).toHaveLength(2);
  });

  it('una dificultad con mayúscula o sin tilde es la misma: la app la lee', () => {
    expect(validarMd(conFrontmatter('dificultad: media', 'dificultad: Fácil')).problemas).toEqual([]);
    expect(validarMd(conFrontmatter('dificultad: media', 'dificultad: dificil')).problemas).toEqual([]);
  });

  it('una foto externa en la portada no es una foto:N', () => {
    const md = conFrontmatter('foto: foto:1', 'foto: https://ejemplo.com/plato.jpg');
    expect(validarMd(md).problemas).toEqual([]);
  });
});

describe('el frontmatter', () => {
  it('sin frontmatter', () => {
    const { problemas } = validarMd('# Pan\n\n## Ingredientes\n- Harina — 500 g\n');
    expect(problemas.find(p => p.campo === 'frontmatter')?.mensaje).toMatch(/frontmatter/);
  });

  it('sin titulo', () => {
    const { problemas } = validarMd(conFrontmatter('titulo: Milanesas napolitanas\n', ''));
    expect(campos(problemas)).toEqual(['titulo']);
    expect(problemas[0]?.mensaje).toMatch(/titulo/);
  });

  it('un tiempo fuera de los cinco valores, con los valores que sí van', () => {
    const { problemas } = validarMd(conFrontmatter('tiempo: ~60 min', 'tiempo: 45 minutos'));
    expect(campos(problemas)).toEqual(['tiempo']);
    expect(problemas[0]?.mensaje).toContain('45 minutos');
    expect(problemas[0]?.mensaje).toContain('>1 día');
  });

  it('una dificultad fuera de sus valores', () => {
    const { problemas } = validarMd(conFrontmatter('dificultad: media', 'dificultad: intermedia'));
    expect(campos(problemas)).toEqual(['dificultad']);
    expect(problemas[0]?.mensaje).toContain('intermedia');
    expect(problemas[0]?.mensaje).toContain('difícil');
  });

  it('una clave desconocida, cada una con su nombre', () => {
    const md = conFrontmatter('rinde: 4 porciones', 'rinde: 4 porciones\ncategoria: Carnes\ncalorias: 500');
    const { problemas } = validarMd(md);
    expect(campos(problemas)).toEqual(['categoria', 'calorias']);
    expect(problemas[0]?.mensaje).toMatch(/clave desconocida/i);
  });
});

describe('los tags', () => {
  it('los especiales, escritos como la app los escribe, se permiten', () => {
    const md = conFrontmatter('tags: [carne, favorito, borrador]', 'tags: [favorito, menú diario, probar, borrador]');
    expect(validarMd(md).problemas).toEqual([]);
  });

  it('otra forma de un especial es un problema y dice cuál usar', () => {
    const md = conFrontmatter('tags: [carne, favorito, borrador]', 'tags: [carne, favoritas, incompleta, Menu Diario]');
    const { problemas } = validarMd(md);
    expect(campos(problemas)).toEqual(['tags', 'tags', 'tags']);
    expect(problemas[0]?.mensaje).toContain('favoritas');
    expect(problemas[0]?.mensaje).toContain('`favorito`');
    expect(problemas[1]?.mensaje).toContain('`borrador`');
    expect(problemas[2]?.mensaje).toContain('`menú diario`');
  });

  it('terminado, en cualquiera de sus formas, es reservado', () => {
    const md = conFrontmatter('tags: [carne, favorito, borrador]', 'tags: [carne, Terminada]');
    const { problemas } = validarMd(md);
    expect(campos(problemas)).toEqual(['tags']);
    expect(problemas[0]?.mensaje).toContain('Terminada');
  });
});

describe('los ingredientes', () => {
  it('con la cantidad adelante', () => {
    const md = CORRECTA.replace('- Huevos — 3', '- 4 milanesas');
    const { problemas } = validarMd(md);
    expect(campos(problemas)).toEqual(['ingredientes']);
    expect(problemas[0]?.mensaje).toContain('4 milanesas');
    expect(problemas[0]?.mensaje).toContain('nombre — cantidad');
  });

  it('sin separador reconocible y con un número al principio, también con fracciones', () => {
    const md = CORRECTA.replace('- Huevos — 3', '- 2 dientes de ajo, picados\n- ½ taza de leche');
    const { problemas } = validarMd(md);
    expect(problemas.map(p => p.mensaje)).toEqual([
      expect.stringContaining('2 dientes de ajo, picados'),
      expect.stringContaining('½ taza de leche')
    ]);
  });

  it('sin cantidad y sin número adelante no es un problema: es un ingrediente sin cantidad', () => {
    expect(validarMd(CORRECTA.replace('- Sal', '- Sal y pimienta')).problemas).toEqual([]);
  });
});

describe('las fotos', () => {
  it('foto: foto:N que no está en el depósito', () => {
    const { problemas } = validarMd(conFrontmatter('foto: foto:1', 'foto: foto:7'));
    expect(campos(problemas)).toEqual(['foto']);
    expect(problemas[0]?.mensaje).toContain('foto:7');
  });

  it('una referencia ![](foto:N) que no está en el depósito, en cualquier sección', () => {
    const md = CORRECTA
      .replace('![](foto:2)', '![el rebozado](foto:3)')
      .replace('Las de los domingos.', 'Las de los domingos. ![](foto:9)');
    const { problemas } = validarMd(md);
    expect(campos(problemas)).toEqual(['fotos', 'fotos']);
    expect(problemas.map(p => p.mensaje).join(' ')).toContain('foto:3');
    expect(problemas.map(p => p.mensaje).join(' ')).toContain('foto:9');
  });

  it('una foto:N sin sección Fotos', () => {
    const md = CORRECTA.replace(/\n## Fotos[\s\S]*$/, '\n');
    expect(campos(validarMd(md).problemas)).toEqual(['foto', 'fotos']);
  });
});

describe('lo que llega como lo devuelve un agente', () => {
  it('con CRLF, se limpia como al pegar y no tiene problemas', () => {
    const { receta, problemas } = validarMd(CORRECTA.replace(/\n/g, '\r\n'));
    expect(problemas).toEqual([]);
    expect(receta.titulo).toBe('Milanesas napolitanas');
  });

  it('envuelto en un bloque de código con charla alrededor', () => {
    const { receta, problemas } = validarMd('Acá va:\n\n```markdown\n' + CORRECTA + '```\n\n¿Algo más?');
    expect(problemas).toEqual([]);
    expect(receta.preparacion).toContain('Hornear');
  });

  it('citado con >', () => {
    const citada = CORRECTA.split('\n').map(l => (l ? '> ' + l : '>')).join('\n');
    expect(validarMd(citada).problemas).toEqual([]);
  });
});

describe('el nivel de cada problema', () => {
  const niveles = (md: string): Record<string, string[]> => {
    const por: Record<string, string[]> = {};
    for (const p of validarMd(md).problemas) (por[p.campo] ??= []).push(p.nivel);
    return por;
  };

  it('error, y no se escribe: sin frontmatter, sin titulo', () => {
    expect(niveles('# Pan\n')).toEqual({ frontmatter: ['error'], titulo: ['error'] });
    expect(niveles(conFrontmatter('titulo: Milanesas napolitanas\n', ''))).toEqual({ titulo: ['error'] });
  });

  it('error: tiempo o dificultad inválidos', () => {
    expect(niveles(conFrontmatter('tiempo: ~60 min', 'tiempo: 45 minutos'))).toEqual({ tiempo: ['error'] });
    expect(niveles(conFrontmatter('dificultad: media', 'dificultad: intermedia'))).toEqual({ dificultad: ['error'] });
  });

  it('error: un tag reservado', () => {
    expect(niveles(conFrontmatter('tags: [carne, favorito, borrador]', 'tags: [favoritas, terminado]')))
      .toEqual({ tags: ['error', 'error'] });
  });

  it('error: una foto:N que no está en el depósito, en la portada o en el texto', () => {
    const md = CORRECTA.replace(/\n## Fotos[\s\S]*$/, '\n');
    expect(niveles(md)).toEqual({ foto: ['error'], fotos: ['error'] });
  });

  it('aviso, y se escribe igual: una clave desconocida', () => {
    expect(niveles(conFrontmatter('rinde: 4 porciones', 'rinde: 4 porciones\nmaridaje: tinto')))
      .toEqual({ maridaje: ['aviso'] });
  });

  it('aviso: un ingrediente con la cantidad adelante', () => {
    expect(niveles(CORRECTA.replace('- Huevos — 3', '- 4 milanesas'))).toEqual({ ingredientes: ['aviso'] });
  });

  it('aviso: lo que avisa el parser y no está entre los errores', () => {
    const ilegible = conFrontmatter('rinde: 4 porciones', 'rinde: 4 porciones\nesto no es clave valor');
    expect(niveles(ilegible)).toEqual({ frontmatter: ['aviso'] });
    const duplicada = CORRECTA.replace('## Fotos', '## Preparación\n4. Servir.\n\n## Fotos');
    expect(niveles(duplicada)).toEqual({ cuerpo: ['aviso'] });
  });

  it('una receta vieja, escrita antes de las reglas de los ingredientes, sólo tiene avisos', () => {
    const baba = readFileSync(new URL('./fixtures/baba-ganush.md', import.meta.url), 'utf8');
    const { problemas } = validarMd(baba);
    expect(problemas.length).toBeGreaterThan(0);
    expect(problemas.every(p => p.nivel === 'aviso')).toBe(true);
  });
});
