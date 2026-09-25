// El servidor MCP del recetario: un proceso de Node que Claude Code o Claude
// Desktop lanzan por stdio en la Mac. Todavía no registra ninguna
// herramienta; eso llega en las tareas siguientes.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// La marca que el test de publicación busca en `dist/`: si aparece ahí, el
// build de la PWA incluyó código del MCP, que no tiene que salir por Pages.
export const MCP_RECETARIO = 'MCP-RECETARIO';

export function crearServidor(): McpServer {
  return new McpServer({ name: 'recetario', version: '1.0.0' });
}

async function main(): Promise<void> {
  const servidor = crearServidor();
  const transporte = new StdioServerTransport();
  await servidor.connect(transporte);
}

// `tsx mcp/servidor.ts` es el único punto de entrada real; el chequeo de
// `import.meta.url` evita que un test que importe este módulo abra stdio.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
