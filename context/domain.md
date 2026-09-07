# Dominio

Todo lo que hay que saber sobre la plataforma de ISIL. Este archivo es el
resultado de ingeniería inversa ya hecha y verificada. **Nada aquí es
suposición**; si algo no está confirmado, se dice explícitamente.

---

## 1. La plataforma

| Dato | Valor |
|---|---|
| Host | `https://platform.ecala.net` |
| Software | Moodle (PHP 8.1.34), formato de curso *Tiles* |
| Identidad | WSO2 Identity Server en `login.ecala.net` — SSO con captcha de imágenes + TOTP |
| WAF | Huawei Cloud (`Server: CW`, cookies `HWWAFSESID` / `HWWAFSESTIME`) |
| Usuario | Formato `cXXXXXXX@carbon.super` |

Las apps móviles del instituto muestran datos derivados de esta misma
plataforma. No son una fuente aparte de interés.

---

## 2. El WAF — leer antes de escribir código de red

Cualquier petición sin cabeceras de navegador recibe **HTTP 418** con
`Block-Event-Id`. No llega a Moodle siquiera.

Cabeceras mínimas para pasar:

```
User-Agent: <UA de navegador real>
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: es-419,es;q=0.9
Referer: https://platform.ecala.net/my/
Accept-Encoding: gzip, deflate, br
```

Desde scripts hay que añadirlas a mano.

**Desde la extensión NO son gratis.** Esto se creyó al principio y es falso. Un
`fetch` desde el service worker no parte de ningún documento, así que:

- **No hay `Referer`.** Y no se puede añadir: es un *forbidden header name*, la
  API de `fetch` lo ignora si se intenta poner a mano.
- Sale `Origin: chrome-extension://<id>` en lugar del origen del sitio.
- El `User-Agent` sí es el real del navegador. Es la única de la lista que se
  obtiene sin hacer nada.

### Lo que el WAF acepta de verdad — medido, no supuesto

Sondeado el 4 de septiembre de 2026 desde el service worker de la extensión
(Brave 149, MV3, con `host_permissions` concedido). Cabeceras que salieron:

```
User-Agent: <UA real del navegador>
Accept-Language: es-419,es;q=0.9
Origin: chrome-extension://<id>
Sec-Fetch-Mode: cors
Sec-Fetch-Site: none
(sin Referer)
```

Respuesta a `POST /webservice/rest/server.php` con un token inválido a
propósito:

```
HTTP 200 · Server: CW · Content-Type: application/json
{"exception":"moodle_exception","errorcode":"invalidtoken",
 "message":"Ficha (token) no válida - ficha no encontrada"}
```

**El WAF no exige `Referer`.** Deja pasar a la extensión sin él y sin que el
`Origin` de `chrome-extension://` le moleste. Lo que dispara el 418 es la
ausencia de un `User-Agent` de navegador real, que es la única cabecera de la
lista de arriba que el service worker obtiene gratis.

Funciona igual con y sin `credentials: "include"`. Se usa **con**, porque el
propio WAF reparte cookies de sesión (`HWWAFSESID` / `HWWAFSESTIME`) y
devolvérselas mantiene la petición en su camino normal.

### CORS: qué está permitido y qué no

**`server.php` responde `Access-Control-Allow-Origin: *`** (verificado). Es
decir: se puede llamar desde cualquier origen mientras las credenciales vayan
omitidas. Esto desmonta el viejo argumento de que hacía falta una extensión
"por CORS"; ver `project.md`.

El comodín tiene una consecuencia práctica que sí importa: **`*` está prohibido
en peticiones con credenciales**. Una llamada a `server.php` con
`credentials: "include"` desde un origen sin permiso de host muere con
`WildcardOriginNotAllowed` —comprobado—. Por eso las credenciales se ponen
**por endpoint**:

| Endpoint | Credenciales | Por qué |
|---|---|---|
| `webservice/rest/server.php` | **omitidas** | Se autentica con `wstoken` en el cuerpo. La cookie no pinta nada y con `ACAO: *` estorba |
| `admin/tool/mobile/launch.php` | **`include`** | Necesita `MoodleSession`; sin ella redirige al login |

`https://platform.ecala.net/*` en `host_permissions` sigue siendo obligatorio,
por dos motivos comprobados: `webRequest` solo observa URLs para las que hay
permiso de host, y `launch.php` va con credenciales, que con `ACAO: *` mueren
con `WildcardOriginNotAllowed` a menos que el permiso de host exima a esa
petición de CORS.

**La tercera razón que se citaba aquí —"y las descargas de `pluginfile.php`
de la Fase 2 también"— estaba mal**, y se corrige el 7 de septiembre de 2026
al escribir `docs/PERMISSIONS.md` para la ficha de tienda. Este mismo
documento, más abajo en §6, ya había establecido el criterio que la
contradice: `chrome.downloads.download` **no exige permiso de host** sobre la
URL que descarga, sea de `platform.ecala.net` o de Drive. Bajar un archivo no
es la razón.

La tercera razón real es otra llamada, que sí es un `fetch` de la extensión y
no una descarga por `chrome.downloads`: la foto de perfil
(`webservice/pluginfile.php`, `src/api/avatar.ts`), con `credentials: "omit"`
igual que `server.php`. A diferencia de `server.php`, **no está verificado
que `pluginfile.php` responda `Access-Control-Allow-Origin: *`** —solo se
midió esa cabecera sobre `server.php`—, así que ahí el permiso de host puede
ser lo que de verdad sostiene la lectura y no solo un respaldo. Las llamadas a
`server.php` en sí, con `ACAO: *` ya comprobado, funcionarían igual sin el
permiso; se benefician de él sin depender de él.

**Ante un 418: esperar y reintentar con espera creciente.** Nunca disparar
ráfagas; mantener al menos 0.6 s entre peticiones.

---

## 3. Autenticación

### Obtención del token

```
GET /admin/tool/mobile/launch.php?service=moodle_mobile_app&passport=1&urlscheme=isilhelper
Cookie: MoodleSession=<sesión activa>
  ↓ 302
Location: isilhelper://token=BASE64
```

Al decodificar el base64 (con padding `=` restaurado si falta):

```
firma_md5:::TOKEN:::private_token
```

- El **segundo campo** es el token. 32 caracteres hexadecimales.
- El primero es `md5(siteid + passport)`, solo sirve para verificar.
- El tercero puede no venir; solo se usa para autologin en navegador.

**Errores frecuentes que ya se cometieron:**

- Usar el base64 completo como token → `invalidtoken`
- Usar el primer campo → `invalidtoken`
- Confundir `MoodleSession` (26 chars alfanuméricos) con el token (32 hex)
- `curl -I` (HEAD) no devuelve el `Location`; hay que usar GET

### Propiedades del token

- **No caduca con la sesión.** Sobrevive al cierre de sesión del navegador.
- Sustituye por completo a captcha y TOTP.
- Se revoca desde `/user/managetoken.php`.
- Servicio: `moodle_mobile_app`. Confirmado activo, **445 funciones**.

### Captura desde la extensión

No se lee de la respuesta, se observa la redirección. La respuesta de `fetch`
llega opaca porque el destino `isilhelper://` no es HTTP, y la petición muere
con `ERR_UNKNOWN_URL_SCHEME` — pero para entonces `onBeforeRedirect` ya
disparó, que es lo único que importa.

```js
// Se registra de forma SÍNCRONA en el arranque del worker, nunca dentro de un
// callback ni tras un await: el service worker duerme, y un listener
// registrado tarde se pierde el evento.
chrome.webRequest.onBeforeRedirect.addListener(
  ({ redirectUrl }) => { /* redirectUrl contiene ?token=BASE64 */ },
  { urls: ["*://platform.ecala.net/admin/tool/mobile/launch.php*"] }
);

// Disparar desde el propio worker. Sin pestaña no hay diálogo de protocolo
// externo, que es lo que vería el estudiante si se navegara a isilhelper://
await fetch(launchUrl, { credentials: "include" }).catch(() => {});
```

**Ojo con el parseo de la URL.** El destino es `isilhelper://token=BASE64`,
**sin query string**. El atajo `new URL(u).searchParams.get("token")` devuelve
`null` —no hay `?`— y además el parser de URL pasa el hostname a minúsculas,
lo que destruiría un base64 que distingue mayúsculas. Se busca el marcador
`token=` a mano. Comprobado el 4 de septiembre de 2026.

**`credentials: "include"` no es opcional.** Un `fetch` desde la extensión es
cross-origin respecto a `platform.ecala.net`, así que por defecto **no manda la
cookie `MoodleSession`**. Sin ella `launch.php` redirige al login en vez de
emitir el token, y el síntoma —"no obtengo token"— es idéntico al de una sesión
caducada. Se depura durante horas en la dirección equivocada.

`webRequest` en modo observacional (sin `blocking`) sigue permitido en MV3.

### Cómo distinguir "no hay sesión" de "bloquea el WAF"

Sin `MoodleSession` viva, `launch.php` y `/my/` redirigen al login de
`login.ecala.net`. Al ser un salto a otro origen, el `Origin` de la petición
pasa a `null` y el `fetch` muere con el error CORS `MissingAllowOriginHeader`
—comprobado—, no con un 418.

| Síntoma | Qué significa |
|---|---|
| `418` | Bloqueó el WAF. Esperar y reintentar con espera creciente |
| CORS `MissingAllowOriginHeader` en `launch.php` | No hay sesión: el estudiante tiene que entrar a la plataforma primero |
| `200` + `{"exception": …}` | Llegó a Moodle. Leer `errorcode` |

Son tres causas distintas con tres mensajes distintos. Confundirlas manda al
estudiante a arreglar lo que no está roto.

---

## 4. API de web services

Endpoint: `POST /webservice/rest/server.php`
Parámetros comunes: `wstoken`, `wsfunction`, `moodlewsrestformat=json`

### Funciones confirmadas disponibles

| Función | Devuelve |
|---|---|
| `core_webservice_get_site_info` | `userid`, `username`, `sitename`, lista de `functions` |
| `core_enrol_get_users_courses` | Cursos matriculados (requiere `userid`) |
| `core_course_get_contents` | Secciones → módulos → contenidos, con `fileurl` |
| `gradereport_user_get_grade_items` | Calificaciones por curso |
| `core_calendar_get_action_events_by_timesort` | Eventos y entregas por fecha |
| `mod_assign_get_assignments` | Tareas y adjuntos del profesor (`courseids[0]=`) |
| `mod_assign_get_submission_status` | Estado de la entrega propia |
| `core_user_get_users_by_field` | Perfil y foto |
| `core_course_get_course_module` | Resolver un módulo suelto |

### Detalles que no son evidentes

**Los `fileurl` necesitan el token pegado.** Apuntan a
`webservice/pluginfile.php` y sin `?token=` o `&token=` devuelven HTML de login
con estado **200**. Siempre verificar `Content-Type` antes de escribir a disco.

**`core_course_get_contents` no funciona por `lib/ajax/service.php`.** Ese
endpoint solo acepta funciones marcadas como AJAX. Va por
`webservice/rest/server.php`.

**Los `mod_url` traen la URL externa ya resuelta** en `contents[0].fileurl`. No
hace falta seguir redirecciones ni leer cabeceras `Location`.

**`core_user_get_users_by_field` no da para un carnet.** Medido el 5 de
septiembre de 2026, devuelve exactamente esto:

| Campo | Qué trae |
|---|---|
| `id` | Id de Moodle |
| `username` | `cXXXXXXX@carbon.super` |
| `fullname` | Nombre completo |
| `email` | Correo institucional |
| `department` | Unidad, no la carrera |
| `profileimageurl` | Avatar |
| `customfields[]` | Uno solo: `secondmail` |

**No hay código de alumno propio, ni carrera, ni ciclo, ni malla.** Lo más
parecido a un código es el prefijo `cXXXXXXX` del `username`, que es el usuario
de inicio de sesión, no un dato de matrícula. Un carnet digital con esto no se
puede construir sin inventarse la mitad.

**Moodle ya excluye de los eventos accionables lo que está entregado.**
Comprobado el 5 de septiembre de 2026 entregando una tarea de verdad: al
recargar, había desaparecido de
`core_calendar_get_action_events_by_timesort`. **No hace falta filtrar por
`action.actionable`** ni consultar el estado de cada entrega para saber qué
queda pendiente; la lista que devuelve la API ya es la lista de lo que falta.

**`mod_zoom` publica una función de solo lectura.** El plugin declara
`mod_zoom_get_state` —estado de la sala, hora de inicio, duración— para el
servicio móvil oficial, que es el que usa el token. También declara
`mod_zoom_grade_item_update`, que **escribe** y por tanto queda fuera por la
regla 3 del proyecto. Ninguna de las dos devuelve grabaciones. Que
`mod_zoom_get_state` esté publicada *en esta plataforma* no se deduce leyendo
el plugin: se mira en la lista de funciones de `site_info`, y eso lo comprueba
el modo diagnóstico.

**Los errores llegan como JSON con estado 200:**

```json
{"exception":"moodle_exception","errorcode":"invalidtoken","message":"..."}
```

Comprobar siempre la presencia de `exception` antes de usar la respuesta.

---

## 5. Estructura de un curso

Cuatro secciones visibles como *tiles*:

| Sección | Contenido | Descargable con token |
|---|---|---|
| **Contenidos** | T01–T15 + sílabo, como `mod_url` a Google Drive | ✗ (Drive) |
| **Complementario** | PDFs, PPTX, DOCX, XLSX, SQL subidos a Moodle | ✔ |
| **Evaluaciones** | Tareas (`mod_assign`) | ✔ los adjuntos |
| **Clases grabadas** | Salas y grabaciones (`mod_zoom`) | ✗ |

**El material principal vive en Drive, no en Moodle.** Es el hallazgo más
importante: de 202 enlaces externos inventariados, 176 eran de Drive.

### Tipos de módulo observados

Medidos el 5 de septiembre de 2026 sobre los 11 cursos del ciclo 2026-2:

| `modname` | Qué es | Material |
|---|---|---|
| `url` | Enlace externo, casi siempre a Drive | ✔ |
| `resource` | Archivo subido a Moodle | ✔ |
| `assign` | Tarea | ✔ |
| `folder` | Carpeta de archivos de Moodle | ✔ |
| `zoom` | Sala de `mod_zoom`, con sus grabaciones | ✔ (no descargable) |
| `label` | Maquetación de la sección | ✗ |

`folder` y `zoom` aparecieron en este diagnóstico y antes no se conocían. **Las
clases grabadas no son `mod_url`**, como se creyó hasta entonces: son módulos
de `mod_zoom`, con salas y grabaciones propias. Sigue sin haber forma de
descargarlas, así que Zoom continúa fuera de alcance (§8).

### Ruido a filtrar

El ruido se descarta **por estructura, no por nombre**. El filtro anterior
adivinaba por título y se le colaba todo lo que el profesor hubiera escrito de
otra forma.

1. **`modname === "label"`.** Las etiquetas no son material: son los bloques
   con los que Moodle maqueta la sección. Entre **7 y 22 por curso**, medidas
   el 5 de septiembre de 2026, y con nombres que no siguen ningún patrón:
   `Etiqueta`, `Área de texto y medios`, `\n\n \n\n`,
   `! ESQUEMA DE EVALUACIÓN DEL CURSO`.
2. **Las dos encuestas de jotform**, que sí son módulos `url` de verdad e
   indistinguibles de material por su estructura. Solo ahí se mira el nombre:
   `/ayúdanos a mejorar|ayudanos a mejorar|encuesta/i`.

**`Tus calificaciones` ya no se filtra.** Salió de la expresión regular al
reducirla a las encuestas, así que vuelve a aparecer en el detalle del curso.
Es un `mod_url` que apunta a la propia plataforma —los 11 enlaces internos de
§7, uno por curso—, y la regla estructural que lo quitaría sería «`url` cuyo
destino es `platform.ecala.net`». Está sin escribir a propósito: hace falta
confirmar antes, con el diagnóstico, que esos módulos traen el destino en
`contents[0].fileurl`.

---

## 6. Google Drive

Las carpetas están compartidas con la **cuenta institucional**, no son públicas.
El acceso anónimo (gdown sin credenciales) falla con error de permisos. Se
requiere OAuth con la cuenta de ISIL.

### Formas de enlace encontradas

| Patrón | Tipo |
|---|---|
| `/drive/folders/<id>` | Carpeta |
| `/file/d/<id>` | Archivo |
| `/document/d/<id>`, `/spreadsheets/d/<id>`, `/presentation/d/<id>` | Documento nativo |
| `?id=<id>` | **Ambiguo** — puede ser cualquiera de los dos |

Los ambiguos hay que resolverlos consultando a Drive antes de decidir el método
de descarga. Tratarlos como archivo por defecto falla.

**Esto se escribió como principio el 6 de septiembre de 2026 y no se
implementó hasta el 7, y en el intervalo era exactamente el bug que costó dos
cursos enteros.** `exploreCourseDrive` (`src/background/drive.ts`) trataba
`ambiguous` igual que `file`/`native`: como un archivo suelto que se encola
sin preguntar nada. Cuando el id no resolvía a una URL de descarga válida, se
descartaba en silencio —sin petición a Drive, sin dejar ningún problema
registrado en la exploración—, así que el enlace desaparecía sin dejar
rastro. Confirmado contra datos reales el 7 de septiembre de 2026: dos cursos
(`1582 DIRECCION DE PERSONAS`, `2016 GESTION DE PROYECTOS`) tenían **14 de 16**
enlaces de Contenidos en forma `https://drive.google.com/open?id=<id>`, y los
14 se perdían así. Un curso que sí funcionaba (`3684 ANALISIS Y DISEÑO DE
SISTEMAS BASICO`) tenía sus 16 enlaces en `/drive/folders/<id>`, la forma
inequívoca — de ahí que el síntoma pareciera depender de la modalidad del
curso cuando en realidad depende de qué vía usó quien compartió la carpeta.

**Arreglado:** ahora un `ambiguous` se recorre como si fuera una carpeta.
`embeddedfolderview` con un id que en realidad es de un archivo no tiene
ningún `flip-entry` que ofrecer, así que `walkFolder` produce una firma
reconocible —cero carpetas leídas, cero archivos, un solo problema de tipo
`shape`—; solo en ese caso exacto se admite que era un archivo y se encola
como tal. Cualquier otro resultado —contenido real, o un fallo genuino como
`login`— se trata igual que una carpeta normal. Sigue habiendo un límite
menor sin resolver: una entrada `ambiguous` **dentro** de una carpeta ya
abierta (no un enlace de curso, sino un elemento del listado de
`embeddedfolderview`) todavía se descarta igual que antes, porque en la
práctica las entradas de un listado real siempre traen `href` en forma
`/file/d/…` o `/folders/…`, nunca `?id=`. Si algún día aparece uno así, el
mismo criterio aplicaría, pero hoy no está implementado ahí.

**Los documentos nativos de Google** (Docs, Slides, Sheets) no son binarios: hay
que exportarlos a PDF/DOCX/PPTX.

### Descarga por sesión — medido el 6 de septiembre de 2026

**`chrome.downloads` baja de Drive con la sesión del navegador, sin OAuth y sin
`client_id`.**

```
chrome.downloads.download(
  "https://drive.usercontent.google.com/download?id=<ID>&export=download")
→ complete · 118 055 bytes, que coinciden con los 115 KB que Drive declara
```

Dos detalles que no son evidentes:

- **No hace falta `host_permissions` para bajar.**
  `chrome.downloads.download` no exige permiso de host sobre la URL que
  descarga; le basta el permiso `downloads`.
- **Sí hace falta para *leer* una página de Drive.** Un `fetch` con
  `credentials: "include"` desde el service worker hacia `drive.google.com` es
  cross-origin, y sin permiso de host CORS bloquea la lectura. El síntoma es
  una excepción de red, que se parece demasiado a «Google lo rechazó» y lleva a
  la conclusión equivocada.

### Enumerar carpetas por sesión — medido el 6 de septiembre de 2026

**También funciona sin OAuth.** Los enlaces de los cursos son carpetas, y bajar
un archivo requiere su id, así que sin esto la descarga no servía de nada.

La fuente es `embeddedfolderview`, la vista que Drive sirve para incrustar una
carpeta en otra página. Devuelve HTML plano, sin blobs JS:

```
https://drive.google.com/embeddedfolderview?id=<ID>#list

<div class="flip-entry" id="entry-<ID>">
  <a href="https://drive.google.com/file/d/<ID>/view">
    <div class="flip-entry-title">30628-SILABO.pdf</div>
  </a>
</div>
```

**El tipo sale del `href`**, no de otra fuente: `/folders/` es carpeta,
`/file/d/` es binario, `/document/d/` y sus hermanas son documentos nativos. Es
la misma clasificación por forma de enlace que ya estaba en la tabla de arriba,
y es lo que distingue una subcarpeta —que se recorre— de un archivo —que se
baja— y de un nativo —que se exporta—.

La página completa de la carpeta lleva además un `_DRIVE_ivd` que, decodificado
del hexadecimal, da id, padre, nombre, mimeType y **tamaño**:

```
["<fileId>", ["<parentId>"], "30628-SILABO.pdf", "application/pdf", 0, …, 118055, …]
```

**No se usa**, y la razón está en `fase-3.md` §8b: de todo lo que aporta de más,
solo el mime hacía falta y el `href` ya lo da; a cambio exige otra petición a
una ruta menos estable y decodificar un blob interno. Queda anotado como
segunda fuente por si algún día hace falta el tamaño.

**Dos trampas del parseo**, las dos encontradas escribiéndolo:

- **Las entidades HTML acentuadas.** `Introducci&oacute;n.pdf` es la forma
  normal en material en español. Y son sensibles a mayúsculas: normalizar la
  clave convierte `&Oacute;` en `ó` minúscula dentro del nombre del archivo.
- **El prefijo `/u/<n>/`** en las rutas (`/drive/u/0/folders/<id>`). Aparece en
  cuanto el navegador tiene varias sesiones de Google abiertas, que es
  exactamente el caso de un estudiante con cuenta personal y cuenta del
  instituto.

**Validado contra el caso real.** Las carpetas de los cursos no son públicas ni
propias: están en «Compartidos conmigo» de la cuenta institucional. Medido así
el 6 de septiembre de 2026 —cuenta de ISIL, carpeta compartida— responde igual,
sin pedir login, con 2,3 KB de HTML.

**El mime viene además explícito en el icono**, en el `src` de
`drive-thirdparty.googleusercontent.com/16/type/application/pdf`. Es una
segunda fuente del tipo dentro del mismo HTML y sin peticiones extra; se usa
**solo como respaldo** cuando el `href` no clasifica, no como confirmación
(`fase-3.md` §8b).

**El `<title>` de la página es el nombre de la carpeta**, útil para nombrar el
directorio de destino sin pedirlo aparte.

**Desde el service worker se comporta igual que desde una pestaña.** Medido el
6 de septiembre de 2026, que era la duda que quedaba: la validación se había
hecho desde una pestaña de Drive, donde la petición es del mismo origen, y
desde la extensión no lo es.

```
permiso de host concedido · credentials: include
→ HTTP 200 · 1280 bytes · flip-entries presente
```

Con `host_permissions` para `drive.google.com` y `credentials: "include"`,
Google devuelve el mismo HTML a la extensión que a una pestaña. **No hay trato
distinto por origen.**

**Esto es scraping**, y Google puede cambiar esa página sin avisar. Se asume a
propósito, con tres condiciones —rotura legible, parser aislado con tests, y
respaldo OAuth documentado— que están en `fase-3.md` §8b.

### La advertencia de antivirus — medida el 6 de septiembre de 2026

**Los archivos que pasan de cierto tamaño no se bajan a la primera.** En vez
del binario, Google devuelve una página que dice que no ha podido analizarlo y
pide confirmar, con **estado 200 y `Content-Type: text/html`**. Sin
comprobarlo, `chrome.downloads` la guarda con nombre de `.pptx`.

En la primera tanda real fallaron dos presentaciones y ningún PDF: **los PPTX
pesan más, y por eso solo fallaban esos**. El síntoma engaña —parece falta de
sesión— pero el archivo siguiente baja bien con la misma sesión un segundo
después. Atribuirlo a la sesión manda a arreglar lo que no está roto.

La solución es la que haría el navegador al pulsar el botón: leer el
formulario y repetir la petición con todos sus campos.

```html
<form id="download-form" action="https://drive.usercontent.google.com/download">
  <input type="hidden" name="id"      value="…">
  <input type="hidden" name="export"  value="download">
  <input type="hidden" name="confirm" value="t">
  <input type="hidden" name="uuid"    value="…">
</form>
```

**No basta con añadir `confirm=t`**: el `uuid` es de esa sesión de descarga y
sin él Google vuelve a preguntar. Se reenvía el formulario entero.

Leer esa página exige `https://drive.usercontent.google.com/*` en
`host_permissions` —es la tercera y última—, porque el `fetch` es cross-origin.
Descargar de ahí, en cambio, sigue sin necesitar permiso.

**Cuidado con reintentar a ciegas:** la pantalla de acceso de Google también
llega como HTML con estado 200. Si no se distingue de la confirmación, el
reintento entra en bucle contra una página que nunca va a dar el archivo.

### En la extensión

Si hiciera falta OAuth: `chrome.identity.launchWebAuthFlow` con scope
`drive.readonly`, y cada estudiante autoriza su propio acceso; no hay
credenciales compartidas. **Queda como respaldo**, no como vía por defecto
(`fase-3.md` §8d).

---

## 7. Inventario de referencia

Datos reales del ciclo 2026-2 de un estudiante, útiles para dimensionar:

- 11 cursos matriculados
- 55 archivos descargables directamente de Moodle
- 202 enlaces externos: 176 Drive, 13 jotform, 11 internos, 2 Zoom
- 166 carpetas de Drive únicas tras filtrar ruido

---

## 8. Zoom

Solo 2 clases grabadas en todo el ciclo. Bajo valor, alta fragilidad. **Fuera de
alcance** para la extensión; queda como script aparte si algún día importa.

---

## 9. Lo que no se sabe todavía

- **Si las rutas de exportación de los documentos nativos funcionan por
  sesión.** El parser ya sabe a cuál va cada tipo, pero ninguna está medida
- **Qué devuelve una carpeta vacía de verdad.** Hoy se informa como rotura a
  propósito, que es el lado seguro (`fase-3.md` §8b)

- **Si las notas están en Moodle o en un SIS aparte.** El 5 de septiembre de
  2026 el libro de calificaciones estaba **vacío en los 11 cursos**: ningún
  ítem con `itemtype: "course"`, ningún `graderaw`. El ciclo había empezado el
  2 de septiembre, así que puede ser sencillamente pronto; o puede ser que ISIL
  no use el libro de Moodle. Se resuelve solo con el tiempo: si a finales de
  septiembre sigue vacío con evaluaciones ya rendidas, la respuesta es la
  segunda. **De esto depende la retroalimentación de la Fase 1b**, que sin
  libro de calificaciones se queda sin fuente
- Si `mod_zoom_get_state` está publicada en esta plataforma (el plugin la
  declara; lo comprueba el modo diagnóstico contra la lista de `site_info`)
- Si el horario está disponible vía API
- Si WSO2 expone tokens OIDC reutilizables entre plataformas
