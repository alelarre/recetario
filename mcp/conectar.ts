// `npm run mcp:conectar`: da permiso al MCP para usar el Drive. Abre el
// navegador, guarda el refresh token en el Llavero (reemplaza el que hubiera)
// y dice con qué cuenta quedó. Es el mismo paso la primera vez y para reconectar.
import { crearAuthEscritorio, cuentaConectada, ErrorDeLogin } from './auth.js';
import { crearLlaveroMac } from './llavero.js';
import { abrirNavegadorMac } from './navegador.js';

async function main(): Promise<void> {
  const auth = crearAuthEscritorio({ llavero: crearLlaveroMac(), abrirNavegador: (url) => { abrirNavegadorMac(url); }, fetch });
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
