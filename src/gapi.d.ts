/**
 * Los tipos del Google Picker, sólo lo que la app usa.
 *
 * El SDK se carga por `<script>` desde apis.google.com y no es un paquete npm,
 * igual que Identity Services: se declara a mano lo que toca `picker.ts` en vez
 * de traer un paquete de tipos entero. `GoogleGlobal` se declara en `gis.d.ts`
 * y acá se le suma `picker`: los dos SDK cuelgan del mismo global.
 *
 * Se llama `gapi.d.ts` por el global que declara, y no `picker.d.ts`: al lado de
 * `picker.ts`, TypeScript lo tomaría por su declaración y no lo cargaría.
 */

/** El cargador de módulos de `api.js`. `picker` es el único que se pide. */
interface Gapi {
  load(modulo: string, config: { callback: () => void }): void;
}

/** Una carpeta elegida. El nombre puede faltar, como en todo lo que viene de Google. */
interface DocumentoElegido {
  id: string;
  name?: string;
}

/** Lo que llega al callback: qué hizo el usuario y, si eligió, con qué. */
interface RespuestaPicker {
  action: string;
  docs?: DocumentoElegido[];
}

/** La vista de carpetas. Cada método devuelve la misma vista, para encadenar. */
interface VistaDocs {
  setSelectFolderEnabled(valor: boolean): VistaDocs;
  setOwnedByMe(valor: boolean): VistaDocs;
  setMimeTypes(mimes: string): VistaDocs;
}

interface PickerVisible {
  setVisible(valor: boolean): void;
}

/** El armador, también encadenable. */
interface ConstructorPicker {
  addView(vista: VistaDocs): ConstructorPicker;
  setOAuthToken(token: string): ConstructorPicker;
  setDeveloperKey(key: string): ConstructorPicker;
  setTitle(titulo: string): ConstructorPicker;
  setLocale(idioma: string): ConstructorPicker;
  setCallback(callback: (respuesta: RespuestaPicker) => void): ConstructorPicker;
  build(): PickerVisible;
}

interface PickerApi {
  DocsView: new (viewId: string) => VistaDocs;
  PickerBuilder: new () => ConstructorPicker;
  ViewId: { FOLDERS: string };
  Action: { PICKED: string; CANCEL: string };
}

interface GoogleGlobal {
  picker?: PickerApi;
}

interface Window {
  gapi?: Gapi;
}
