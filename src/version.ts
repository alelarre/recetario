/**
 * Qué build está corriendo: el commit corto y cuándo se compiló, para
 * saber si el teléfono ya tomó el último deploy. Los inyecta Vite al compilar
 * (`define` en `vite.config.ts`); sin eso, el commit es `dev`.
 */
declare const __COMMIT__: string;
declare const __COMPILADO__: string;

export const COMMIT: string = typeof __COMMIT__ === 'string' ? __COMMIT__ : 'dev';
export const COMPILADO: string = typeof __COMPILADO__ === 'string' ? __COMPILADO__ : '';

/** «8648476 · 13/09 14:30», en la hora del teléfono. Sin fecha, sólo el commit. */
export function textoVersion(commit = COMMIT, compilado = COMPILADO): string {
  const d = new Date(compilado);
  if (!compilado || Number.isNaN(d.getTime())) return commit;
  const dos = (n: number): string => String(n).padStart(2, '0');
  return `${commit} · ${dos(d.getDate())}/${dos(d.getMonth() + 1)} ${dos(d.getHours())}:${dos(d.getMinutes())}`;
}
