// El servidor local que recibe el código de Google cuando el navegador vuelve
// del permiso. Escucha sólo en 127.0.0.1, en un puerto libre, atiende un único
// pedido y se cierra: nadie más de la red puede entregarle un código, y no
// queda un puerto abierto después del login.
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

/** Si el permiso no vuelve en este tiempo, el login se da por abandonado. */
const ESPERA_MAXIMA = 5 * 60_000;

export interface Loopback {
  /** `http://127.0.0.1:<puerto>`: el `redirect_uri` del pedido de permiso. */
  redirect: string;
  /**
   * Lo que trajo el navegador con el `state` esperado: el código de
   * autorización, o el `error` con que Google no dio el permiso.
   */
  vuelta: Promise<{ codigo: string } | { error: string }>;
  cerrar(): void;
}

function pagina(texto: string): string {
  return `<!doctype html><meta charset="utf-8"><title>Recetario</title><p>${texto}</p>`;
}

export async function abrirLoopback(state: string, esperaMaxima = ESPERA_MAXIMA): Promise<Loopback> {
  let resolver!: (vuelta: { codigo: string } | { error: string }) => void;
  let rechazar!: (error: Error) => void;
  const vuelta = new Promise<{ codigo: string } | { error: string }>((res, rej) => { resolver = res; rechazar = rej; });
  // Si el login falla antes de esperar la vuelta, la promesa no queda sin atender.
  vuelta.catch(() => {});

  let temporizador: NodeJS.Timeout | undefined;

  const servidor = createServer((pedido, respuesta) => {
    const parametros = new URL(pedido.url ?? '/', 'http://127.0.0.1').searchParams;
    const error = parametros.get('error');
    let texto: string;
    if (parametros.get('state') !== state) {
      texto = 'Este pedido no corresponde al permiso que pidió el recetario. Se canceló el login.';
      rechazar(new Error('La vuelta del navegador no corresponde al pedido de permiso; se canceló el login.'));
    } else if (error) {
      texto = 'Google no dio el permiso. Volvé a la terminal para ver qué pasó.';
      resolver({ error });
    } else {
      const recibido = parametros.get('code');
      if (recibido) {
        texto = 'Listo: el recetario ya tiene permiso. Podés cerrar esta pestaña.';
        resolver({ codigo: recibido });
      } else {
        texto = 'Google volvió sin código. Se canceló el login.';
        rechazar(new Error('Google volvió sin código de autorización.'));
      }
    }
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
    rechazar(new Error('Pasaron cinco minutos sin que volviera el permiso de Google; se canceló el login.'));
    cerrar();
  }, esperaMaxima);

  return { redirect: `http://127.0.0.1:${port}`, vuelta, cerrar };
}
