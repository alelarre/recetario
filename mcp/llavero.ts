// El refresh token del MCP en el Llavero de macOS, con el comando `security`.
// Nunca se escribe en un archivo.
import { spawn } from 'node:child_process';
import { userInfo } from 'node:os';
import type { Llavero } from './auth.js';

const SERVICIO = 'recetario-mcp';

/** `security find-generic-password` sale con 44 cuando no hay nada guardado. */
const NO_ENCONTRADO = 44;

/**
 * Un token de Google es base64 con `/`, `-`, `_` y poco más. Cualquier otro
 * carácter (una comilla, un espacio) podría romper la línea de comando que
 * recibe `security -i`, así que se rechaza antes.
 */
const TOKEN_SEGURO = /^[A-Za-z0-9._~+/=-]+$/;
const CUENTA_SEGURA = /^[A-Za-z0-9._-]+$/;

export type EjecutarComando = (
  comando: string, args: string[], entrada?: string
) => Promise<{ codigo: number; salida: string }>;

/** Corre un comando sin shell, le pasa `entrada` por stdin y junta stdout. */
const ejecutarReal: EjecutarComando = (comando, args, entrada) => new Promise((resolver, rechazar) => {
  const proceso = spawn(comando, args, { stdio: ['pipe', 'pipe', 'ignore'] });
  let salida = '';
  proceso.stdout.setEncoding('utf-8');
  proceso.stdout.on('data', (parte: string) => { salida += parte; });
  proceso.on('error', rechazar);
  proceso.on('close', (codigo) => resolver({ codigo: codigo ?? 1, salida }));
  proceso.stdin.end(entrada ?? '');
});

export interface OpcionesLlavero {
  ejecutar?: EjecutarComando;
  /** La cuenta del ítem del Llavero; por defecto, el usuario de la Mac. */
  cuenta?: string;
}

export function crearLlaveroMac(opciones: OpcionesLlavero = {}): Llavero {
  const ejecutar = opciones.ejecutar ?? ejecutarReal;
  const cuenta = opciones.cuenta ?? userInfo().username;

  async function leer(): Promise<string | null> {
    const { codigo, salida } = await ejecutar('security', ['find-generic-password', '-s', SERVICIO, '-w']);
    if (codigo === NO_ENCONTRADO) return null;
    if (codigo !== 0) throw new Error(`No se pudo leer el Llavero (security salió con ${codigo}).`);
    return salida.trim() || null;
  }

  return {
    leer,

    async guardar(token) {
      if (!TOKEN_SEGURO.test(token)) throw new Error('El token de Google tiene caracteres inesperados; no se guardó.');
      if (!CUENTA_SEGURA.test(cuenta)) throw new Error(`La cuenta «${cuenta}» no sirve para el Llavero.`);
      // `add-generic-password -w <token>` como argumento dejaría el token a la
      // vista en `ps` mientras corre. Con `security -i` el comando entero entra
      // por stdin y los argumentos del proceso son sólo `-i`.
      const linea = `add-generic-password -U -s ${SERVICIO} -a ${cuenta} -w "${token}"\n`;
      await ejecutar('security', ['-i'], linea);
      // En modo `-i` el código de salida no siempre refleja un fallo del
      // comando: se relee para confirmar que quedó guardado.
      if (await leer() !== token) throw new Error('El token no quedó guardado en el Llavero.');
    }
  };
}
