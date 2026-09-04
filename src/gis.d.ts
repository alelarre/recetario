/**
 * Los tipos de Google Identity Services, solo lo que la app usa.
 *
 * El SDK se carga por `<script>` desde accounts.google.com y no es un paquete
 * npm, así que no hay tipos que instalar. Se declara a mano lo que toca `auth`
 * —tres métodos— en vez de traer un paquete de tipos entero para eso.
 *
 * Todo lo que llega en la respuesta es opcional: `access_token` no viene cuando
 * hay `error`, y `expires_in` llega como texto en algunas respuestas, que es
 * por qué `auth` lo pasa por `Number()`.
 */

/** La respuesta del popup de token. O trae token, o trae error. */
interface RespuestaToken {
  access_token?: string;
  expires_in?: string | number;
  error?: string;
  error_description?: string;
}

interface ClienteToken {
  callback: (resp: RespuestaToken) => void;
  error_callback: (err: unknown) => void;
  /** `prompt: ''` intenta la vía silenciosa; `'consent'` fuerza la pantalla. */
  requestAccessToken(opciones?: { prompt?: string }): void;
}

interface ConfigClienteToken {
  client_id: string;
  scope: string;
  callback: (resp: RespuestaToken) => void;
  error_callback: (err: unknown) => void;
}

interface Window {
  google?: {
    accounts?: {
      oauth2?: {
        initTokenClient(config: ConfigClienteToken): ClienteToken;
      };
    };
  };
}
