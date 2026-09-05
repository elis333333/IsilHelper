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
pero por otros tres motivos: `webRequest` solo observa URLs para las que hay
permiso de host, `launch.php` va con credenciales y necesita la exención de
CORS, y las descargas de `pluginfile.php` de la Fase 2 también.

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

**Los documentos nativos de Google** (Docs, Slides, Sheets) no son binarios: hay
que exportarlos a PDF/DOCX/PPTX.

### En la extensión

`chrome.identity.launchWebAuthFlow` con scope `drive.readonly`. Cada estudiante
autoriza su propio acceso; no hay credenciales compartidas.

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
