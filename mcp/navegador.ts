// Abre la URL del permiso en el navegador de la Mac con `open`.
import { spawn } from 'node:child_process';

interface ProcesoLanzado {
  on(evento: 'error', escuchar: (error: Error) => void): unknown;
  unref(): void;
}

export interface OpcionesNavegador {
  lanzar?: (comando: string, args: string[]) => ProcesoLanzado;
  avisar?: (mensaje: string) => void;
}

const lanzarReal = (comando: string, args: string[]): ProcesoLanzado =>
  spawn(comando, args, { stdio: 'ignore', detached: true });

export function abrirNavegadorMac(url: string, opciones: OpcionesNavegador = {}): void {
  const lanzar = opciones.lanzar ?? lanzarReal;
  const avisar = opciones.avisar ?? ((m: string) => { console.log(m); });
  // Por si el navegador no se abre solo, la URL queda a mano en la terminal.
  avisar(`Abriendo el navegador para dar permiso. Si no se abre, entrá a:\n${url}\n`);
  const proceso = lanzar('open', [url]);
  // Sin este handler, un `open` que no se puede lanzar tira el proceso entero
  // con un error de Node; el login igual puede seguir con la URL de arriba.
  proceso.on('error', () => {
    avisar('No se pudo abrir el navegador. Copiá la URL de arriba en el navegador para seguir con el permiso.');
  });
  proceso.unref();
}
