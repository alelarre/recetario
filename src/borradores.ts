/**
 * La cola de captura: lo que entró a la app y todavía no es una receta.
 *
 * Vive en su propia planilla, `Recetario/_borradores`, y no en el índice: un
 * borrador no es un archivo consolidado sino trabajo pendiente (IA §2.1).
 * Mismo trato que el índice en lo demás —la planilla se crea sola la primera
 * vez y cada operación es una fila, no un rewrite (§4.3)—.
 */
import { NOMBRE_BORRADORES } from './config.js';
import type { Drive } from './drive.js';
import type { Sheets } from './sheets.js';
import type { Borrador } from './tipos.js';

export const HOJA_BORRADORES = 'borradores';
export const COLUMNAS_BORRADORES = ['id', 'titulo', 'fuente', 'capturado'] as const;

const ULTIMA_COLUMNA = String.fromCharCode(64 + COLUMNAS_BORRADORES.length);
const MIME_PLANILLA = 'application/vnd.google-apps.spreadsheet';

/** Solo estas operaciones, por la misma razón que `DriveDelStore` (ver `store.ts`). */
export type DriveDeBorradores = Pick<Drive, 'buscarPorNombre' | 'crear' | 'borrar'>;

export type SheetsDeBorradores = Pick<Sheets,
  'leer' | 'escribir' | 'append' | 'borrarFila' | 'hojas' | 'renombrarHoja'>;

export interface DependenciasBorradores {
  drive: DriveDeBorradores;
  sheets: SheetsDeBorradores;
  raizId: string;
}

const filaDesde = (b: Borrador): string[] => [b.id, b.titulo, b.fuente, b.capturado];

const desdeFila = (f: string[]): Borrador => ({
  id: f[0] ?? '', titulo: f[1] ?? '', fuente: f[2] ?? '', capturado: f[3] ?? ''
});

export function crearBorradores({ drive, sheets, raizId }: DependenciasBorradores) {
  let planillaId = '';

  async function crearPlanilla(): Promise<string> {
    const archivo = await drive.crear({ nombre: NOMBRE_BORRADORES, padre: raizId, mime: MIME_PLANILLA });

    try {
      // La hoja por defecto viene con el nombre que Google le ponga según el
      // idioma; todos los rangos de acá dicen 'borradores'.
      const hojas = await sheets.hojas(archivo.id);
      const primera = hojas[0];
      if (!primera) throw new Error('La planilla se creó sin ninguna hoja');
      if (primera.title !== HOJA_BORRADORES) {
        await sheets.renombrarHoja(archivo.id, primera.sheetId, HOJA_BORRADORES);
      }
      await sheets.escribir(archivo.id, `${HOJA_BORRADORES}!A1:${ULTIMA_COLUMNA}1`, [[...COLUMNAS_BORRADORES]]);
      return archivo.id;
    } catch (e) {
      // Igual que el índice: nunca dejar una planilla a medio hacer, que es lo
      // que una vez dejó la app sin arrancar y sin más salida que borrarla a
      // mano (ver `crearPlanilla` en `store.ts`).
      await drive.borrar(archivo.id).catch(() => {});
      throw e;
    }
  }

  async function idDePlanilla(): Promise<string> {
    if (planillaId) return planillaId;
    const encontradas = await drive.buscarPorNombre(NOMBRE_BORRADORES, raizId);
    planillaId = encontradas[0]?.id ?? await crearPlanilla();
    return planillaId;
  }

  /** Cada borrador con el número de fila en el que está, para escribir o borrar. */
  async function filas(): Promise<{ borrador: Borrador; fila: number }[]> {
    const id = await idDePlanilla();
    const crudo = await sheets.leer(id, `${HOJA_BORRADORES}!A1:${ULTIMA_COLUMNA}100000`);
    return crudo.slice(1)   // la fila 1 son los encabezados
      .map((f, i) => ({ borrador: desdeFila(f), fila: i + 2 }))
      .filter(x => x.borrador.id);
  }

  /** Lo más viejo primero: la cola se atiende por antigüedad (C01.4.1). */
  async function listar(): Promise<Borrador[]> {
    const todas = await filas();
    return todas
      .map(x => x.borrador)
      .sort((a, b) => a.capturado.localeCompare(b.capturado));
  }

  async function agregar({ titulo, fuente }: { titulo: string; fuente: string }): Promise<Borrador> {
    const id = await idDePlanilla();
    // El id es propio y no la posición: las filas se corren cuando se borra una.
    const borrador: Borrador = {
      id: crypto.randomUUID(), titulo, fuente, capturado: new Date().toISOString()
    };
    await sheets.append(id, HOJA_BORRADORES, [filaDesde(borrador)]);
    return borrador;
  }

  async function editarTitulo(id: string, titulo: string): Promise<void> {
    const encontrado = (await filas()).find(x => x.borrador.id === id);
    if (!encontrado) return;   // que ya no esté no es un error
    const planilla = await idDePlanilla();
    await sheets.escribir(
      planilla,
      `${HOJA_BORRADORES}!A${encontrado.fila}:${ULTIMA_COLUMNA}${encontrado.fila}`,
      [filaDesde({ ...encontrado.borrador, titulo })]
    );
  }

  async function descartar(id: string): Promise<void> {
    const encontrado = (await filas()).find(x => x.borrador.id === id);
    if (!encontrado) return;   // descartar dos veces termina bien
    const planilla = await idDePlanilla();
    const hojas = await sheets.hojas(planilla);
    const hojaId = hojas.find(h => h.title === HOJA_BORRADORES)?.sheetId ?? 0;
    await sheets.borrarFila(planilla, hojaId, encontrado.fila);
  }

  return { listar, agregar, editarTitulo, descartar };
}

/** El objeto que devuelve `crearBorradores`. Lo consumen la UI y los tests. */
export type Borradores = ReturnType<typeof crearBorradores>;
