// `npm run mcp:conectar`: da permiso al MCP para usar el Drive. Abre el
// navegador, guarda el refresh token en el Llavero (reemplaza el que hubiera)
// y dice con qué cuenta quedó. Es el mismo paso la primera vez y para reconectar.
//
// `npm run mcp:conectar -- <ruta del JSON>` guarda antes el cliente OAuth que
// se bajó de Google Cloud en el Llavero; después el archivo se puede borrar.
import { readFile } from 'node:fs/promises';
import { clienteDeJson, crearAuthEscritorio, cuentaConectada, ErrorDeLogin, guardarCliente } from './auth.js';
import { crearLlaveroMac, SERVICIO_CLIENTE } from './llavero.js';
import { abrirNavegadorMac } from './navegador.js';

async function main(): Promise<void> {
  const llaveroCliente = crearLlaveroMac({ servicio: SERVICIO_CLIENTE });
  const rutaJson = process.argv[2];
  if (rutaJson) {
    let texto: string;
    try {
      texto = await readFile(rutaJson, 'utf-8');
    } catch {
      throw new Error(`No se pudo leer ${rutaJson}.`);
    }
    await guardarCliente(llaveroCliente, clienteDeJson(texto));
    console.log(`El cliente quedó en el Llavero; ya podés borrar ${rutaJson}.`);
  }
  const auth = crearAuthEscritorio({
    llavero: crearLlaveroMac(), llaveroCliente,
    abrirNavegador: (url) => { abrirNavegadorMac(url); }, fetch
  });
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
