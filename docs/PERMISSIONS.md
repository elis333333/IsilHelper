# Justificación de permisos

Tabla literal para las cajas de justificación del panel de Chrome Web Store y
para la sección de permisos de la ficha de AMO. Cada fila está verificada
contra el código real en la fecha de esta versión — ni un permiso de la lista
es aspiracional ni queda sin usar.

El manifest real es el que genera `manifest.config.ts` en tiempo de build (vía
`@crxjs/vite-plugin`), no ningún archivo `manifest.json` escrito a mano.

**Hay dos manifests generados, uno por navegador** —`dist/manifest.json`
(`pnpm build`, para Chrome Web Store) y `dist-firefox/manifest.json`
(`pnpm build:firefox`, para AMO)—, porque Firefox necesita
`background.scripts` en vez de `background.service_worker` y no admite los
dos a la vez (`docs/SOURCE_SUBMISSION.md`). **Todo lo de esta página aplica
igual a los dos**: `permissions` y `host_permissions` no dependen de a qué
navegador apunte el build, solo `background` y `browser_specific_settings`
cambian entre uno y otro.

Permisos declarados en el manifest, en el orden en que aparecen:

```json
"permissions": ["storage", "webRequest", "downloads"],
"host_permissions": [
  "https://platform.ecala.net/*",
  "https://drive.google.com/*",
  "https://drive.usercontent.google.com/*"
]
```

---

## `storage`

**Para qué se usa exactamente.** Todo el estado de la extensión vive en
`chrome.storage.local` (`src/lib/storage.ts`), bajo cinco claves:

| Clave | Contenido | Quién la escribe |
|---|---|---|
| `moodleToken` | El `wstoken` de los web services de Moodle | `src/background/auth.ts`, al capturar la redirección de `launch.php` |
| `moodleUserId` | El id numérico de usuario en Moodle | `src/background/session.ts`, tras `core_webservice_get_site_info` |
| `moodleProfile` | Correo, unidad (`department`) y foto de perfil ya convertida a `data:` | `src/background/session.ts`, una sola vez por sesión |
| `downloadQueue` | La cola de descargas: qué archivo, de qué curso, en qué estado | `src/background/downloads.ts`, en cada cambio de la cola |
| `downloadLog` | Rutas ya descargadas, con la fecha, para no repetir la descarga | `src/background/downloads.ts`, al terminar cada archivo |

No hay ninguna otra escritura a `chrome.storage.*` en el código. En particular:
no se usa `chrome.storage.sync` (nada sale del equipo del estudiante ni se
sincroniza entre dispositivos), y los cursos, notas, pendientes y contenidos
que se ven en pantalla **no se guardan aquí**: viven en la caché en memoria de
TanStack Query dentro de la pestaña abierta (`src/ui/main.tsx`) y desaparecen
al cerrarla.

**Por qué es el mínimo necesario.** Sin `storage`, el `wstoken` tendría que
pedirse de nuevo en cada apertura de la extensión —lo que dispararía el flujo
de captura por `webRequest` constantemente— o guardarse en memoria del service
worker, que MV3 destruye a los ~30 segundos de inactividad y perdería tanto el
token como la cola de descargas a mitad de una tanda larga. No se pide
`storage.sync` porque no hay nada que sincronizar entre dispositivos: cada
instalación tiene su propia sesión.

---

## `webRequest`

**Para qué se usa exactamente.** Un único listener, registrado de forma
síncrona al arrancar el service worker (`src/background/auth.ts`,
`registerTokenCapture`):

```ts
chrome.webRequest.onBeforeRedirect.addListener(
  ({ redirectUrl }) => { /* lee el token de redirectUrl */ },
  { urls: [`${LAUNCH_ENDPOINT}*`] },
  // LAUNCH_ENDPOINT = https://platform.ecala.net/admin/tool/mobile/launch.php
);
```

Moodle no entrega el token de web service en el cuerpo de una respuesta HTTP:
lo entrega como parámetro de una redirección 302 hacia un esquema propio
(`isilhelper://token=BASE64`) que el navegador no sabe abrir. La única forma de
leerlo es observar esa redirección antes de que falle, y `onBeforeRedirect` es
la API que lo permite.

**Por qué es el mínimo necesario.**

- El filtro `urls` limita el listener a una sola ruta de un solo host —
  `admin/tool/mobile/launch.php` en `platform.ecala.net`—, no a todo el
  tráfico del navegador.
- No se registra ningún listener `blocking` (`onBeforeRequest`,
  `onHeadersReceived`, `onSendHeaders` no se usan en absoluto: verificado, cero
  coincidencias en el código). El permiso es puramente observacional: no se
  bloquea, no se modifica y no se redirige ninguna petición.
- No se lee el cuerpo, las cabeceras ni las cookies de la petición: solo la
  URL de destino de la redirección, que es un campo público del propio evento.

---

## `downloads`

**Para qué se usa exactamente.** Todo en `src/background/downloads.ts`, los
siete métodos de la API que se llaman y para qué:

| Método | Para qué |
|---|---|
| `chrome.downloads.download()` | Lanza la descarga de un archivo de Moodle (con el token pegado a la URL) o de Drive |
| `chrome.downloads.search()` | Consulta el estado, el MIME y los bytes recibidos de una descarga en curso |
| `chrome.downloads.onChanged` | Reacciona cuando una descarga cambia de estado. Es también lo que despierta al service worker cuando se duerme a mitad de una cola larga |
| `chrome.downloads.pause()` / `.resume()` | Los botones de pausar y reanudar la cola |
| `chrome.downloads.erase()` | Borra la entrada del historial de descargas al terminar cada archivo de Moodle. La URL de esa descarga lleva el `wstoken` como parámetro, y sin este borrado quedaría anotada en texto plano en `chrome://downloads` |
| `chrome.downloads.removeFile()` | Borra del disco un archivo que resultó ser HTML en vez del binario esperado —la página de login de Moodle cuando el token no llegó, o una página de Google que no se pudo confirmar— para no dejar ese HTML con nombre de PDF |

**Por qué es el mínimo necesario.** Es la única API que escribe en el disco
del estudiante fuera de la carpeta de la propia extensión, y el producto
—archivar el material del curso antes de que el instituto cierre el acceso—
no existe sin ella. No se usa `chrome.downloads.setShelfEnabled` ni
`chrome.downloads.acceptDanger`: verificado, no aparecen en el código.

---

## Host: `https://platform.ecala.net/*`

**Para qué se usa exactamente.**

1. Es el filtro de host que necesita el listener de `webRequest` de arriba
   para disparar sobre `launch.php`: sin `host_permissions` sobre este
   origen, `webRequest` no observa nada en él.
2. La captura del token hace `fetch(launchUrl, { credentials: "include" })`
   (`src/background/auth.ts`). Es una petición **con credenciales** —necesita
   la cookie `MoodleSession` para que la plataforma sepa quién es— y una
   petición con credenciales no puede completarse contra un origen que
   responde `Access-Control-Allow-Origin: *`: el navegador la bloquea con
   `WildcardOriginNotAllowed`. El permiso de host exime a esta petición de esa
   restricción de CORS.
3. Todas las llamadas a los web services de Moodle
   (`webservice/rest/server.php`, en `src/api/client.ts`) y la foto de perfil
   (`webservice/pluginfile.php`, en `src/api/avatar.ts`) tienen este mismo
   origen y van **sin** credenciales —se autentican con el `wstoken` en el
   cuerpo o en la URL, no con la cookie—. `server.php` responde
   `Access-Control-Allow-Origin: *` (verificado, `domain.md` §2), así que
   esas llamadas funcionarían igual sin el permiso de host: se benefician de
   él —no dependen de que Moodle siga enviando esa cabecera— sin necesitarlo
   en sentido estricto. `pluginfile.php` es distinto: su CORS **no está
   verificado** por separado, así que ahí el permiso de host puede ser lo que
   de verdad sostiene la lectura de la foto de perfil, no solo un respaldo.

**Por qué es el mínimo necesario.** Es un solo origen, con `/*` porque la
extensión llama a rutas distintas dentro de él (`webservice/rest/server.php`,
`webservice/pluginfile.php`, `admin/tool/mobile/launch.php`) y no hay una ruta
más estrecha que las cubra todas. No incluye `login.ecala.net` —el proveedor
de identidad, con captcha y verificación en dos pasos—: la extensión nunca le
hace una petición directa, porque no automatiza el inicio de sesión (regla del
proyecto). El archivo descargado en sí no necesita este permiso para bajarse:
`chrome.downloads.download()` no exige permiso de host sobre la URL que
descarga, así que este permiso no es «para descargar los archivos», es para
las tres razones de arriba.

---

## Host: `https://drive.google.com/*`

**Para qué se usa exactamente.** Un único punto de red hacia Drive
(`src/api/drive.ts`, `fetchFolder`): un `fetch` con `credentials: "include"` a
`https://drive.google.com/embeddedfolderview?id=<carpeta>`, la vista que
Google sirve para incrustar una carpeta en otra página. Devuelve HTML con la
lista de lo que hay dentro —subcarpetas, archivos, documentos nativos—, que
`src/api/drive-folder.ts` interpreta con expresiones regulares. No hay OAuth,
no hay `client_id`: se reutiliza la sesión de Google que el estudiante ya
tiene abierta en el navegador, la misma con la que hoy abre esas carpetas a
mano.

**Por qué es el mínimo necesario.** Un `fetch` desde el service worker hacia
`drive.google.com` es cross-origin, y sin permiso de host el navegador nunca
entrega el cuerpo de la respuesta a la extensión —el síntoma sería una
excepción de red, indistinguible a simple vista de un rechazo de Google—. No
se pide `identity` ni ningún permiso de OAuth: enumerar carpetas no lo
necesita. Bajar los archivos tampoco usa este permiso: eso pasa por
`chrome.downloads.download()`, que no lo exige.

---

## Host: `https://drive.usercontent.google.com/*`

**Para qué se usa exactamente.** Un único punto de red
(`src/background/downloads.ts`, `resolveConfirmation`): cuando un archivo de
Drive supera cierto tamaño, Google no entrega el binario, entrega una página
HTML que avisa de que no pudo analizarlo en busca de virus y pide confirmar.
Esa página llega con estado 200, así que sin leerla `chrome.downloads` la
guardaría con el nombre del archivo esperado y contenido de HTML. Se hace
`fetch(url, { credentials: "include" })` para leer esa página, se saca el
formulario de confirmación (`src/api/drive-confirm.ts`) y se reintenta la
descarga con los mismos campos que enviaría el navegador al pulsar el botón.

**Por qué es el mínimo necesario.** Es el mismo problema de CORS que con
`drive.google.com`: leer esa página de confirmación es un `fetch`
cross-origin y sin permiso de host el cuerpo no llega. **La descarga del
archivo en sí no usa este permiso**: los binarios y las exportaciones de
documentos nativos (que salen de `docs.google.com`, ver más abajo) se lanzan
con `chrome.downloads.download()`, que no exige permiso de host sobre la URL
que descarga. Este permiso existe únicamente para poder leer y reenviar esa
página de confirmación cuando aparece.

---

## Dominios a los que se envían descargas sin tener permiso de host

`chrome.downloads.download()` no requiere `host_permissions` sobre la URL que
recibe: solo lee y escribe en el disco a través del gestor de descargas del
navegador, no hace una petición desde el contexto de la extensión. Dos
destinos reciben tráfico por esta vía, sin figurar en `host_permissions`:

- **`platform.ecala.net`** — los archivos de Moodle (`webservice/pluginfile.php`),
  con el `wstoken` pegado a la URL en el momento de lanzar la descarga.
- **`docs.google.com`** — cuando un curso enlaza un documento nativo de Google
  (Doc, Sheet o Slide), que no se baja tal cual: se exporta a PDF o XLSX vía
  `docs.google.com/.../export?format=...` (`src/api/drive-links.ts`).

Ninguno de los dos necesita entrar en `host_permissions` porque la extensión
nunca lee su respuesta con `fetch`: se limita a pasarle la URL al navegador,
que la descarga por su cuenta.

---

## Lo que la extensión explícitamente no pide, y por qué no hace falta

| Permiso que no está | Por qué no hace falta |
|---|---|
| `identity` | No hay OAuth con Google. Enumerar y bajar Drive funciona con la sesión que el navegador ya tiene abierta |
| `cookies` | La extensión nunca lee el valor de `MoodleSession` ni de ninguna otra cookie. El navegador la adjunta solo por usar `credentials: "include"` en las peticiones a `launch.php`, igual que haría con cualquier pestaña abierta en ese sitio |
| `tabs` | `chrome.tabs.create({ url })` para abrir la interfaz en una pestaña no exige este permiso: solo hace falta para leer título o URL de pestañas ajenas, y eso no ocurre en el código |
| `*://*/*` o `<all_urls>` | Cada permiso de host de la lista es un origen concreto, ligado a una llamada de red concreta |
| `scripting` / `activeTab` | No hay content scripts ni inyección en páginas del estudiante. Toda la lógica vive en el service worker y en la pestaña propia de la interfaz |
