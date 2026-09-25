// `npm run mcp:conectar`: da permiso al MCP para usar el Drive. Abre el
// navegador, guarda el refresh token en el Llavero (reemplaza el que hubiera)
// y dice con qué cuenta quedó. Es el mismo paso la primera vez y para reconectar.
import { spawn } from 'node:child_process';
import { crearAuthEscritorio, cuentaConectada, ErrorDeLogin } from './auth.js';
import { crearLlaveroMac } from './llavero.js';

function abrirEnMac(url: string): void {
  // Por si el navegador no se abre solo, la URL queda a mano en la terminal.
  console.log(`Abriendo el navegador para dar permiso. Si no se abre, entrá a:\n${url}\n`);
  spawn('open', [url], { stdio: 'ignore', detached: true }).unref();
}

async function main(): Promise<void> {
  const auth = crearAuthEscritorio({ llavero: crearLlaveroMac(), abrirNavegador: abrirEnMac, fetch });
  await auth.conectar();
  const cuenta = await cuentaConectada(fetch, await auth.token());
  console.log(`Listo: el MCP quedó conectado con ${cuenta}.`);
  console.log('Si no es la cuenta del Drive del recetario, corré `npm run mcp:conectar` otra vez y elegí la correcta.');
}

main().catch((error: unknown) => {
  if (error instanceof ErrorDeLogin) {
    console.error(`[${error.codigo}] ${error.message}`);
  } else {
    console.error(error instanceof Error ? error.message : String(error));
  }
  process.exit(1);
});
