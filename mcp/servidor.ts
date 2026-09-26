// El servidor MCP del recetario: un proceso de Node que Claude Code o Claude
// Desktop lanzan por stdio en la Mac. Registra las herramientas de
// `recetario.ts` en el SDK; la lógica vive ahí, y acá están sólo los esquemas
// de entrada y la forma de las respuestas.
import { pathToFileURL } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { crearAuthEscritorio } from './auth.js';
import { comoErrorDeLogin, esErrorDeGoogle, ErrorDeLogin, mensajeDeGoogle } from './errores.js';
import { crearLlaveroMac, SERVICIO_CLIENTE } from './llavero.js';
import { recetarioDeGoogle, type Recetario } from './recetario.js';

// La marca que el test de publicación busca en `dist/`: si aparece ahí, el
// build de la PWA incluyó código del MCP, que no tiene que salir por Pages.
export const MCP_RECETARIO = 'MCP-RECETARIO';

const texto = (t: string, isError = false): CallToolResult => ({
  content: [{ type: 'text', text: t }],
  ...(isError ? { isError } : {})
});

const json = (valor: unknown, isError = false): CallToolResult => texto(JSON.stringify(valor, null, 2), isError);

/**
 * Una falla como respuesta de error de la herramienta. La de login sale con
 * su código entre corchetes, que el skill traduce a un paso para el usuario.
 * Una de Drive o de Sheets que no es de login lleva en el mensaje el cuerpo
 * crudo de Google: sale sólo el status. El resto son errores propios, con su
 * mensaje.
 */
export function respuestaDeError(error: unknown): CallToolResult {
  const deLogin = comoErrorDeLogin(error);
  if (deLogin) return texto(`[${deLogin.codigo}] ${deLogin.message}`, true);
  if (esErrorDeGoogle(error)) return texto(mensajeDeGoogle(error), true);
  return texto(error instanceof Error ? error.message : String(error), true);
}

/** La herramienta, con sus fallas convertidas en respuesta de error. */
async function responder(hacer: () => Promise<CallToolResult> | CallToolResult): Promise<CallToolResult> {
  try {
    return await hacer();
  } catch (e) {
    return respuestaDeError(e);
  }
}

const fotos = z.array(z.object({
  origen: z.string().describe('Una ruta local, o una URL http o https.'),
  uso: z.enum(['plato', 'paso', 'fuente']).describe(
    '`plato`: la foto del plato. `paso`: la foto de un paso. ' +
    '`fuente`: la página o la captura de donde salió la receta; se sube sólo si la receta lleva `borrador`.'
  )
})).describe('Las fotos que se suben con la receta, en orden. El número `foto:N` de cada una lo dice `validar`.');

const sacar = z.array(z.number().int()).describe('Los números de las fotos que se sacan del depósito.');

export function crearServidor(recetario: Recetario): McpServer {
  const servidor = new McpServer({ name: 'recetario', version: '1.0.0' });

  servidor.registerTool('formato', {
    description: 'Las reglas del .md de una receta: frontmatter, tiempo, dificultad, tags reservados, secciones, ingredientes y fotos. Pedilas antes de escribir una receta.',
    inputSchema: {}
  }, () => responder(() => texto(recetario.formato().join('\n'))));

  servidor.registerTool('categorias', {
    description: 'Las categorías del recetario: id, nombre y cuántas recetas tiene cada una.',
    inputSchema: {}
  }, () => responder(async () => json(await recetario.categorias())));

  servidor.registerTool('tags', {
    description: 'Los tags de las recetas, con cuántas recetas usan cada uno.',
    inputSchema: {}
  }, () => responder(async () => json(await recetario.tags())));

  servidor.registerTool('buscar', {
    description: 'Busca recetas como la app, por texto (título, ingredientes y tags) o por filtros, y dice por qué coincide cada una. Los borradores aparecen sólo si se piden con el tag `borrador`.',
    inputSchema: {
      texto: z.string().optional(),
      categoria: z.string().optional().describe('El nombre de la categoría, sin importar mayúsculas ni tildes. «Sin categoría» trae los borradores sin categoría, pedidos con el tag `borrador`.'),
      tags: z.array(z.string()).optional(),
      dificultad: z.string().optional()
    }
  }, consulta => responder(async () => json(await recetario.buscar(consulta))));

  servidor.registerTool('leer', {
    description: 'El .md entero de una receta como está ahora en Drive, con su categoría y su nombre de archivo.',
    inputSchema: { id: z.string() }
  }, ({ id }) => responder(async () => json(await recetario.leer(id))));

  servidor.registerTool('validar', {
    description: 'Cómo lee la app un .md y qué problemas tiene, sin escribir nada. Con las fotos que se van a pedir, dice el número `foto:N` de cada una y si se sube. Al corregir una receta, pasá su `id` (y `sacar`, si se sacan fotos): así los números son los que va a usar `guardar`.',
    inputSchema: {
      md: z.string(),
      fotos: fotos.optional(),
      id: z.string().optional().describe('La receta que se corrige. Sin id, se valida como una receta nueva, igual que `crear`.'),
      sacar: sacar.optional()
    }
  }, ({ md, fotos: pedidas, id, sacar: sacadas }) => responder(async () => json(
    id === undefined
      ? recetario.validar(md, pedidas, sacadas)
      : await recetario.validarAlCorregir({ id, md, fotos: pedidas, sacar: sacadas })
  )));

  servidor.registerTool('crear', {
    description: 'Crea una receta: escribe el .md y su fila del índice, y sube las fotos. Valida primero: con errores no escribe y los devuelve.',
    inputSchema: {
      md: z.string(),
      categoria: z.string().optional().describe('El nombre de una categoría que ya existe. Sin categoría, va a Sin categoría.'),
      fotos: fotos.optional()
    }
  }, args => responder(async () => {
    const r = await recetario.crear(args);
    return json(r, !r.escrita);
  }));

  servidor.registerTool('guardar', {
    description: 'Reescribe una receta del índice; la relee de Drive antes de escribir. Valida primero: con errores no escribe y los devuelve.',
    inputSchema: {
      id: z.string(),
      md: z.string(),
      categoria: z.string().optional().describe('Sólo si la receta cambia de categoría. Vacía la pasa a Sin categoría.'),
      fotos: fotos.optional(),
      sacar: sacar.optional()
    }
  }, args => responder(async () => {
    const r = await recetario.guardar(args);
    return json(r, !r.escrita);
  }));

  servidor.registerTool('borrar', {
    description: 'Manda una receta a la papelera de Drive, con su fila y sus fotos. Sólo después de que el usuario confirmó borrar esta receta.',
    inputSchema: {
      id: z.string(),
      confirmacion: z.string().describe('El título exacto de la receta. Si la receta no tiene título, su nombre de archivo exacto.')
    }
  }, args => responder(async () => {
    await recetario.borrar(args);
    return texto(`La receta ${args.id} quedó en la papelera de Drive.`);
  }));

  servidor.registerTool('reindexar', {
    description: 'Rehace el índice entero desde las carpetas de Drive, como Reindexar en Ajustes. Informa el avance.',
    inputSchema: {}
  }, (_args, extra) => responder(async () => {
    const progressToken = extra._meta?.progressToken;
    const alProgresar = (progress: number): void => {
      if (progressToken === undefined) return;
      void extra.sendNotification({ method: 'notifications/progress', params: { progressToken, progress, total: 1 } });
    };
    return json(await recetario.reindexar(alProgresar));
  }));

  return servidor;
}

/**
 * El servidor no da el permiso: stdout es el canal del protocolo, y una línea
 * suelta ahí rompe la conexión con el cliente. El permiso se da con
 * `npm run mcp:conectar`, que es lo que dice `sin-permiso`.
 */
export function abrirNavegadorDelServidor(_url: string): never {
  throw new ErrorDeLogin('sin-permiso');
}

async function main(): Promise<void> {
  // El login no toca la red ni el Llavero hasta la primera herramienta que usa el Drive.
  const auth = crearAuthEscritorio({
    llavero: crearLlaveroMac(),
    llaveroCliente: crearLlaveroMac({ servicio: SERVICIO_CLIENTE }),
    abrirNavegador: abrirNavegadorDelServidor,
    fetch
  });
  await crearServidor(recetarioDeGoogle(auth)).connect(new StdioServerTransport());
}

// `tsx mcp/servidor.ts` es el único punto de entrada real; el chequeo de
// `import.meta.url` evita que un test que importe este módulo abra stdio. La
// ruta pasa por `pathToFileURL` porque la URL escapa los espacios y los
// caracteres especiales que la ruta trae tal cual.
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
