# Fase 3 — Drive

Plan, no implementación. **Nada de código hasta que la decisión de producto
esté tomada.** Lo que aquí aparece como medido lleva fecha; lo que no está
verificado se dice.

Esta fase se adelanta a la 2 porque los contenidos T01–T15 y los sílabos son lo
que motivó el proyecto, y viven en Drive: 176 de los 202 enlaces externos
inventariados (`domain.md` §7).

---

## 1. Son dos problemas, no uno

Conviene separarlos antes de decidir nada, porque una sola pieza no los cubre:

| Problema | Qué lo resuelve | Cuesta |
|---|---|---|
| **Fricción diaria.** Abrir el material exige entrar curso por curso, módulo por módulo | Abrir las carpetas en pestañas | Nada |
| **Pérdida al cerrar el ciclo.** Lo que no bajaste, lo perdiste | Descargar los archivos | El muro del OAuth |

**Abrir pestañas no archiva.** Es la mejora más grande por el menor coste, pero
el problema 2 del proyecto —el instituto revoca el acceso al cerrar el ciclo— se
queda intacto. Por eso las dos piezas no son «normal» y «avanzado»: son dos
funciones distintas, y la segunda es la que sostiene la promesa original.

## 2. Abrir contenidos

Un botón por curso que abre en pestañas los enlaces de Drive de ese curso.

Lo que lo hace barato:

- **No cuesta ningún permiso.** `chrome.tabs.create` no exige el permiso
  `tabs`; ese permiso es para *leer* pestañas, no para abrirlas. Un permiso
  menos que justificar ante la tienda.
- **No cuesta ninguna petición.** Los enlaces ya vienen en el detalle del curso
  que la pantalla tiene cargado.
- **Se salta la ambigüedad de los `?id=`.** Resolver si un enlace es carpeta o
  archivo hace falta para descargarlo; para abrirlo lo resuelve el navegador.
- **Usa la sesión de Google que el estudiante ya tiene**, igual que la
  extensión usa la de Moodle. Ni credenciales, ni OAuth, ni topes.

Cuidados:

- Dieciséis pestañas de golpe destrozan la ventana en la que estés trabajando.
  Van en **ventana nueva**, en segundo plano, y con confirmación previa que
  diga cuántas son.
- Agruparlas por curso con `chrome.tabGroups` está bien en Chrome y Brave;
  Firefox no lo tiene, así que degrada a ventana nueva sin grupo.
- Si el estudiante no tiene sesión de Google en ese perfil, las pestañas caen
  en la pantalla de acceso. No se puede detectar sin más permisos, así que la
  primera vez se avisa de qué va a pasar.

## 3. El muro del OAuth

Dos correcciones a cómo estaba planteado:

**El `client_id` no es un secreto.** Es un identificador público; rclone lleva
el suyo en el repositorio desde siempre. Publicarlo no filtra nada.

**El muro es el alcance.** `drive.readonly` es un *scope restringido* de
Google. Para usarlo con público abierto hacen falta verificación de marca y una
evaluación de seguridad anual por un tercero (CASA), que cuesta dinero y exige
una entidad. Quedarse en modo *Testing* tiene dos topes duros: 100 usuarios
añadidos a mano y *refresh tokens* que caducan a los siete días.

| Opción | Qué implica |
|---|---|
| **No descargar: abrir en pestañas** | Sin OAuth, sin `client_id`, sin verificación, sin topes. No archiva |
| **Cada estudiante crea el suyo** | Sin coste y sin topes, pero ~10 pasos en la consola de Google más una pantalla de «app no verificada» |
| Publicar uno verificado | CASA anual y entidad legal. Fuera de alcance hoy |
| Publicar uno sin verificar | Advertencia en pantalla, 100 usuarios, tu cuota para todos |

**El coste de la segunda opción, sin adornos.** Son unos diez pasos en la
consola de Google: crear proyecto, habilitar la API de Drive, configurar la
pantalla de consentimiento, elegir tipo de cliente, añadir el identificador de
la extensión como URI de redirección, añadirse como usuario de prueba, copiar
el `client_id`. Elis, que es programador y tenía guía, tardó ese rato. **La
mayoría de estudiantes abandona en el paso tres.** Eso convierte la descarga en
una función para quien tolere la consola de Google, y hay que asumirlo al
escribir el README y al medir el éxito del proyecto: no es un detalle de
implementación, es a quién sirve la herramienta.

**Decisión propuesta:** las dos piezas. *Abrir contenidos* para todos y por
defecto, sin configuración de ninguna clase. *Descargar* detrás del `client_id`
propio, presentado como lo que es —archivar antes de que cierren el ciclo— y no
como un modo avanzado para entendidos.

## 4. Spikes — medidos el 5 de septiembre de 2026

### Cabeceras y `chrome.downloads`

`chrome.downloads.download` no admite cabeceras, y bajar de Drive exige
`Authorization: Bearer`. Tres salidas, sondeadas contra la API real:

| Prueba | Resultado |
|---|---|
| `files/{id}?alt=media` con `Authorization` | `401` JSON · credencial leída y rechazada |
| `files/{id}?alt=media` sin credencial | `403` JSON · «missing a valid API key» |
| `files/{id}?alt=media&key=<falsa>` | `400` JSON · parámetro procesado |
| **`files/{id}?alt=media&access_token=<falso>`** | **`403` HTML** · página antiabuso de Google |
| `files/{id}?access_token=<falso>` *(sin `alt=media`)* | `401` JSON · credencial leída |
| `about?access_token=<falso>` | `401` JSON · credencial leída |

**Salida (a), el token en la URL: muerta.** Google lo sigue aceptando en las
rutas de metadatos, pero en la ruta de descarga (`alt=media`) devuelve la
página antiabuso. Comprobado también con `User-Agent` de navegador real, así
que no es detección de bot: es esa ruta con esa credencial.

**Salida (b), `fetch` con cabecera y `blob`: permitida.** El preflight CORS de
la ruta de descarga responde a un origen `chrome-extension://` reflejándolo, y
`access-control-allow-headers: authorization`. Es decir, la extensión puede
descargar con la cabecera correcta y pasar el `blob` a `chrome.downloads`.

Queda por confirmar en el navegador que `chrome.downloads.download` acepta una
URL `blob:`, y a qué precio de memoria: el archivo entero pasa por ella, y hay
que hacerlo en la pestaña de la interfaz porque el service worker de MV3 no
tiene `URL.createObjectURL`.

**Salida (c), documento *offscreen*: descartada** salvo que (b) falle. Es solo
de Chrome y la Fase 4 cuenta con Firefox.

### PKCE sin secreto

Del documento de descubrimiento de Google (`openid-configuration`):

```
response_types_supported:            [code, token, id_token, ...]
code_challenge_methods_supported:    [plain, S256]
token_endpoint_auth_methods_supported: [client_secret_post, client_secret_basic]
```

La última línea es la respuesta: **el endpoint de token no ofrece `none`**, así
que autorización + PKCE **sin secreto no es una opción con Google**.

Pero `response_types_supported` incluye `token`, así que el **flujo implícito
sigue vivo**, y es el que encaja: `launchWebAuthFlow` con
`response_type=token`, redirección a
`https://<id-extensión>.chromiumapp.org/`, y de vuelta un token de una hora sin
intercambio, sin secreto y sin *refresh token* que guardar. Se reautoriza al
empezar cada tanda de descargas, lo que además esquiva la caducidad de siete
días del modo *Testing*.

Si Google retirase el flujo implícito, la salida sería el flujo de código con
un cliente de tipo «aplicación de escritorio», cuyo secreto la propia
documentación de Google declara no confidencial.

## 5. De dónde salen los enlaces

De `core_course_get_contents`: módulos con `modname === "url"`, destino ya
resuelto en `contents[0].fileurl` (`domain.md` §4). Hace falta un cambio
pequeño en `CourseDetail`, porque hoy `ModuleView.url` lleva la URL del módulo
y no la del destino.

Un módulo nuevo, `src/api/drive-links.ts`, puro y con tests —de los que
`CONVENTIONS.md` pide por nombre—, clasifica cada enlace con los patrones de
`domain.md` §6: carpeta, archivo, documento nativo, ambiguo, o externo que no
es de Drive (jotform y Zoom se descartan ahí).

## 6. Los `?id=` ambiguos

Solo estorban en la descarga; para abrir pestañas no hacen falta.

Una llamada a `files/{id}?fields=id,name,mimeType`: si el `mimeType` es
`application/vnd.google-apps.folder` es carpeta; si empieza por
`application/vnd.google-apps.` es documento nativo y hay que exportarlo
(`files/{id}/export`, con el tope de 10 MB); lo demás es binario. El resultado
se guarda en `storage.local` para que una segunda corrida no repita el sondeo,
y un `403` o `404` se reporta como «no accesible con tu cuenta», que es un caso
real cuando algo se compartió con otra cuenta.

## 7. Dónde caen los archivos

`chrome.downloads.download` con `filename` **relativo a la carpeta de
descargas**: no acepta rutas absolutas ni `..`.

```
Descargas/IsilHelper/<Curso>/<Sección>/<Módulo>/…
```

Debajo se conserva el árbol propio de Drive. Sanear cada segmento —los
`/ \ : * ? " < > |`, los caracteres de control, los nombres reservados de
Windows y la longitud— es función pura y va con tests.

El resto de la maquinaria es la de la Fase 2 y se comparte: cola con progreso,
pausa y reanudación, omitir lo ya descargado a partir de un registro en
`storage.local`, y pausa entre peticiones. El permiso `downloads` se añade al
manifest en esta fase, no antes.

## 8. Lo que falta medir

- **Que `chrome.downloads.download` acepte una URL `blob:`**, y el coste de
  memoria con el archivo más grande del ciclo.
- **La descarga por sesión, sin OAuth.** `chrome.downloads` sí manda las
  cookies del navegador. Si
  `https://drive.usercontent.google.com/download?id=<id>&export=download`
  funciona con la sesión de Google del estudiante, los archivos con enlace
  directo se bajan **sin `client_id` ninguno**, y el OAuth quedaría solo para
  *enumerar* el contenido de las carpetas. Eso cambiaría la decisión de
  producto entera, así que conviene medirlo antes de comprometerse con el muro.
  **No verificado**: el endpoint responde, pero hace falta un id real y una
  sesión para saberlo.

## 9. Orden propuesto

1. **Abrir contenidos.** No depende de nada de lo anterior y se puede hacer ya.
2. Medir la descarga por sesión (§8). Es media hora y puede ahorrar el muro.
3. Según el resultado, el OAuth con `client_id` propio y la cola de descargas.
