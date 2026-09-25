// El servidor local que recibe el código de Google cuando el navegador vuelve
// del permiso. Escucha sólo en 127.0.0.1, en un puerto libre, atiende un único
// pedido y se cierra: nadie más de la red puede entregarle un código, y no
// queda un puerto abierto después del login.
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { ErrorDeLogin, codigoDe } from './errores.js';

/** Si el permiso no vuelve en este tiempo, el login se da por abandonado. */
const ESPERA_MAXIMA = 5 * 60_000;

export interface Loopback {
  /** `http://127.0.0.1:<puerto>`: el `redirect_uri` del pedido de permiso. */
  redirect: string;
  /**
   * El código de autorización que trajo el navegador con el `state` esperado.
   * Si Google no dio el permiso, si volvió sin código o si no volvió a
   * tiempo, un `ErrorDeLogin`.
   */
  vuelta: Promise<string>;
  cerrar(): void;
}

function pagina(texto: string): string {
  return `<!doctype html><meta charset="utf-8"><title>Recetario</title><p>${texto}</p>`;
}

export async function abrirLoopback(state: string, esperaMaxima = ESPERA_MAXIMA): Promise<Loopback> {
  let resolver!: (codigo: string) => void;
  let rechazar!: (error: Error) => void;
  const vuelta = new Promise<string>((res, rej) => { resolver = res; rechazar = rej; });
  // Si el login falla antes de esperar la vuelta, la promesa no queda sin atender.
  vuelta.catch(() => {});

  let temporizador: NodeJS.Timeout | undefined;

  const servidor = createServer((pedido, respuesta) => {
    const parametros = new URL(pedido.url ?? '/', 'http://127.0.0.1').searchParams;
    const error = parametros.get('error');
    const recibido = parametros.get('code');
    if (parametros.get('state') !== state) {
      // Un pedido que no trae el `state` de este login no viene de Google.
      rechazar(new Error('La vuelta del navegador no corresponde al pedido de permiso; se canceló el login.'));
    } else if (error) {
      const codigo = codigoDe({ cuerpo: error });
      rechazar(codigo ? new ErrorDeLogin(codigo) : new ErrorDeLogin('sin-permiso', {
        detalle: error,
        mensaje: `Google no dio el permiso (${error}). Hay que correr \`npm run mcp:conectar\` de nuevo.`
      }));
    } else if (recibido) {
      resolver(recibido);
    } else {
      rechazar(new ErrorDeLogin('sin-permiso', {
        mensaje: 'Google volvió del permiso sin código. Hay que correr `npm run mcp:conectar` de nuevo.'
      }));
    }
    // El canje del código todavía puede fallar: cómo terminó se ve en la terminal.
    const texto = 'Volvé a la terminal para ver cómo terminó el permiso. Ya podés cerrar esta pestaña.';
    respuesta.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', Connection: 'close' });
    respuesta.end(pagina(texto), () => cerrar());
  });

  function cerrar(): void {
    clearTimeout(temporizador);
    servidor.close();
    servidor.closeAllConnections();
  }

  await new Promise<void>((res, rej) => {
    servidor.once('error', rej);
    servidor.listen(0, '127.0.0.1', () => res());
  });
  const { port } = servidor.address() as AddressInfo;

  temporizador = setTimeout(() => {
    rechazar(new ErrorDeLogin('sin-permiso', {
      mensaje: 'El permiso de Google no volvió a tiempo y se canceló el login. Hay que correr `npm run mcp:conectar` de nuevo.'
    }));
    cerrar();
  }, esperaMaxima);

  return { redirect: `http://127.0.0.1:${port}`, vuelta, cerrar };
}
