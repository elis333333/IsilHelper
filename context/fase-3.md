# Fase 3 — Drive

Plan, no implementación. **Nada de código hasta que la decisión de producto
esté tomada.** Lo que aquí aparece como medido lleva fecha; lo que no está
verificado se dice.

> **Estado, 6 de septiembre de 2026.** Las dos mitades están medidas y las dos
> funcionan con la sesión del navegador: **descargar** (§8) y **enumerar
> carpetas** (§8b). **El `client_id` desaparece del proyecto**; ningún
> estudiante toca la consola de Google, y el OAuth queda como respaldo
> documentado y sin implementar (§8d).
>
> **Validado contra el caso real** el 6 de septiembre de 2026: una carpeta de
> «Compartidos conmigo» abierta con la cuenta institucional, que es como el
> instituto comparte el material. `embeddedfolderview` respondió igual —sin
> pedir login— y el HTML capturado está guardado como fixture del parser.
>
> Las secciones 1 a 7 son de antes de esas mediciones: donde contradigan a la
> 8, gana la 8.

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

> **Retirada el 6 de septiembre de 2026.** Lo que sigue era la decisión
> propuesta cuando se creía que descargar exigía OAuth. **Ya no es la vigente**:
> la descarga por sesión está medida y funciona sin `client_id` (§8), así que el
> muro solo podría quedar en la enumeración de carpetas, que es lo que mide §8b.
> El análisis del coste del `client_id` se conserva porque sigue siendo válido y
> es el que justifica que el OAuth sea el respaldo (§8d) y no la vía por defecto.

~~**Decisión propuesta:** las dos piezas. *Abrir contenidos* para todos y por
defecto, sin configuración de ninguna clase. *Descargar* detrás del `client_id`
propio, presentado como lo que es —archivar antes de que cierren el ciclo— y no
como un modo avanzado para entendidos.~~

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

## 8. Descarga por sesión — MEDIDA Y FUNCIONA

**Medido el 6 de septiembre de 2026 contra la cuenta real.**

```
chrome.downloads.download(
  "https://drive.usercontent.google.com/download?id=<ID>&export=download")
→ complete · 118 055 bytes
```

Los 118 055 bytes coinciden exactamente con los 115 KB que Drive muestra para
ese PDF. **`chrome.downloads` baja de Drive con la sesión del navegador: sin
OAuth, sin `client_id` y sin permiso de Google.**

Es la misma idea que ya sostiene toda la extensión —no pedir credenciales,
reutilizar la sesión que el navegador tiene— aplicada a Drive. Y **no hace
falta ningún permiso de host** para bajar: `chrome.downloads.download` no lo
exige sobre la URL que descarga.

### Lo que esto NO resuelve todavía

**Los 32 enlaces del inventario son carpetas, no archivos.** Bajar un archivo
requiere su id, y los ids de dentro de una carpeta solo se conocen
enumerándola. Sin enumerar no hay nada que bajar, así que la mitad que decide
la fase es la de §8b.

## 8b. Enumerar carpetas — MEDIDO Y FUNCIONA

**Medido el 6 de septiembre de 2026.** Las dos vías devuelven el contenido de
la carpeta con la sesión del navegador, sin OAuth y sin `client_id`.

### La vía elegida: `embeddedfolderview`

HTML plano, sin blobs JS, y `pideLogin` en falso. Cada entrada es:

```html
<div class="flip-entry" id="entry-<ID>">
  <a href="https://drive.google.com/file/d/<ID>/view">
    <div class="flip-entry-title">30628-SILABO.pdf</div>
  </a>
</div>
```

**Con esto el `client_id` desaparece del proyecto**: enumerar y descargar
funcionan los dos con la sesión que el navegador ya tiene. Ningún estudiante
toca la consola de Google Cloud.

### De dónde sale el tipo: del `href`, no de `_DRIVE_ivd`

Era la decisión que quedaba abierta, porque `flip-entry` da id y nombre pero
no el tipo, y sin tipo no se distingue una subcarpeta de un archivo ni un
documento nativo de un binario.

La página completa lleva un `_DRIVE_ivd` que, decodificado del hexadecimal, da
bastante más:

```
["<fileId>", ["<parentId>"], "30628-SILABO.pdf", "application/pdf", 0, …, 118055, …]
   id          padre           nombre              mimeType                tamaño
```

**Y aun así el tipo se saca del `href`.** El razonamiento:

| | `href` de `flip-entry` | `_DRIVE_ivd` |
|---|---|---|
| Peticiones | ninguna extra | una más, a la ruta menos estable |
| Formato | un atributo HTML | blob hexadecimal dentro de la aplicación entera |
| Da el tipo | sí: `/folders/`, `/file/d/`, `/document/d/` | sí, con el mime exacto |
| Da el tamaño y el padre | no | sí |

De todo lo que `_DRIVE_ivd` aporta de más, **solo el mime hacía falta, y el
`href` ya lo dice**. El tamaño es cómodo —serviría para el porcentaje de la
barra— pero la cola ya funciona sin él: un archivo sin tamaño declarado se baja
igual y no enseña porcentaje.

Y hay un argumento de estabilidad que pesa más que los campos: **el `href` de
una carpeta incrustada no puede cambiar sin romper todas las carpetas
incrustadas del mundo**, mientras que un blob interno no le debe compatibilidad
a nadie. Entre dos fuentes frágiles se elige la que tiene rehenes.

`_DRIVE_ivd` queda descrito aquí como **segunda fuente**, sin implementar,
para el día que haga falta el tamaño o el árbol de padres.

### Validada contra el caso real

La primera medición se hizo con una cuenta personal, lo que dejaba abierta la
duda que de verdad importaba: las carpetas de los cursos **no son públicas ni
propias**, están en «Compartidos conmigo» de la cuenta institucional
(`domain.md` §6).

**Repetida el 6 de septiembre de 2026 con la cuenta de ISIL sobre una carpeta
de «Compartidos conmigo»:** `pideLogin` en falso, el nombre real del archivo y
2,3 KB de HTML. Se comporta igual. La vía está validada.

Tres cosas que confirmó el HTML capturado:

1. **Es HTML estático y semántico**, sin JavaScript que lo genere. El nombre
   está en `.flip-entry-title`, así que no hay que deducirlo de ningún sitio.
2. **El mime viene explícito en el icono**, en el `src` de
   `drive-thirdparty.googleusercontent.com/16/type/application/pdf`. Es una
   segunda fuente del tipo dentro del mismo HTML y sin peticiones extra.
3. **El `<title>` de la página es el nombre de la carpeta**, que sirve para
   nombrar el directorio de destino sin pedirlo aparte.

### El icono: respaldo, no confirmación

Con el mime a mano cabía usarlo para *confirmar* lo que dice el `href`. Se
descartó: confirmar obliga a escribir una rama de «¿y si discrepan?» y a
decidir cuál gana, sin ningún dato sobre cuándo ocurre eso —ni siquiera consta
que ocurra—. Código que nunca se ejecuta y que nadie sabe si es correcto.

**Se usa como respaldo**, solo cuando el `href` no clasifica. Así no toca el
camino normal y da una segunda oportunidad justo cuando la primera falla, que
es el día que Google cambie la forma de sus URLs. Es ganancia sin coste, y
encaja con la condición de degradar en vez de romper.

### Lo que el código hace con esto

`src/api/drive-links.ts` y `src/api/drive-folder.ts`, con 27 tests. Aislados a
propósito: **todo el conocimiento sobre la forma del HTML de Drive vive en esos
dos archivos**, así que el día que Google lo cambie, arreglarlo es tocar eso y
sus tests.

Dos cosas que salieron al escribirlo y no se veían venir:

- **Las entidades HTML acentuadas.** Los nombres están en español, así que
  `Introducci&oacute;n.pdf` es la forma normal y no un caso raro. Y la tabla es
  **sensible a mayúsculas**: normalizar la clave convertía `&Oacute;` en `ó`
  minúscula dentro del nombre del archivo.
- **El prefijo `/u/<n>/`.** Aparece en cuanto el navegador tiene varias
  sesiones de Google abiertas, que es exactamente el caso de un estudiante con
  cuenta personal y cuenta del instituto. Sin contemplarlo, la clasificación
  falla justo en el navegador de quien más la necesita.

### La rotura, legible

Es la primera de las tres condiciones de esta vía, y está en el tipo de
retorno, no en un comentario:

```ts
type FolderListing =
  | { ok: true; entries: DriveEntry[] }
  | { ok: false; reason: "login" | "shape" }
```

**Cero entradas se informa como rotura, no como carpeta vacía.** La tentación
es tratar «contenedor presente y sin entradas» como vacío legítimo, pero eso
está sin confirmar contra una carpeta vacía real, y acertar por suerte sale
caro: el día que Drive cambie el HTML sin quitar el contenedor, **todas** las
carpetas parecerían vacías y el estudiante concluiría que no tiene material.

El mensaje nombra las dos causas y no afirma la que no consta —el mismo
criterio que la pantalla de notas con el boletín vacío—:

> No pude leer el contenido de esta carpeta. O está vacía, o Google cambió la
> página y hay que actualizar la extensión.

Y «no hay sesión» se dice aparte de «se rompió la vía», porque son dos arreglos
distintos y confundirlos manda a arreglar lo que no está roto.

### Los fixtures

`src/api/fixtures/embedded-folder.ts`. El principal, `REAL_HTML`, **es
capturado**: la carpeta de «Compartidos conmigo» con la cuenta institucional,
anonimizada con `anonimizarHtml()`. Los demás son **sintéticos y llevan el
nombre puesto**, y están solo para lo que la captura no contenía —subcarpetas,
documentos nativos, varias sesiones abiertas, la pantalla de acceso y un HTML
que cambió de forma—. Se sustituyen por material real en cuanto se capture.

**El fixture real conserva un defecto del anonimizador y no se arregla a
mano.** Su `id` de entrada salió como `id="ID39_NJqK"`, sin el prefijo
`entry-`: el patrón de identificadores incluía el guion y se llevó `entry-` por
delante. Se deja tal cual por dos motivos: es lo que se capturó, y **prueba que
el parser no depende de ese atributo**, que es justo por lo que se dejó de usar
como ancla. La sonda ya está corregida para las capturas siguientes.

Y el anonimizador ya no dice «no quedan correos»: esa comprobación usaba el
mismo patrón que la sustitución, así que **nunca podía fallar** y daba una
seguridad falsa. Ahora informa de cuántos correos y avatares sustituyó, y avisa
de lo que no sabe detectar: **nombres de personas**, que en Drive aparecen en
`flip-entry-last-writer` —quién subió el archivo—.

## 8c. Lo que queda por medir

En orden de lo que más puede cambiar la fase:

1. **Subcarpetas.** El parser ya las distingue del archivo por el `href`, así
   que el recorrido recursivo se puede escribir. Falta comprobar que una
   subcarpeta se enumera igual que la de arriba —basta volver a correr la sonda
   con el id de una subcarpeta—. Si no se pudiera, se baja el primer nivel
   **diciéndolo**, que es preferible a bajar la mitad en silencio.
2. **Documentos nativos.** El parser ya los reconoce y sabe a qué ruta van
   (`drive-links.ts`), pero **las rutas de exportación siguen sin medirse**:
   `document/d/<ID>/export?format=pdf`, el mismo a DOCX,
   `spreadsheets/d/<ID>/export?format=xlsx` y `presentation/d/<ID>/export/pdf`
   —esta última sin `?format=`, que es una irregularidad de Slides—. Lo mide
   `scripts/medir-drive.js` (§9). Prueba además `uc?export=download` sobre un
   nativo: si Drive redirigiera solo a la exportación, no haría falta saber de
   qué tipo es cada documento antes de bajarlo.
3. **Una carpeta vacía de verdad.** Hoy se informa como rotura a propósito
   (§8b). Con una muestra real se podría distinguir el vacío legítimo, pero
   solo si el marcador que lo distingue resulta ser fiable; si no, se queda
   como está, que es el lado seguro.
4. **Que `chrome.downloads.download` acepte una URL `blob:`.** Solo haría falta
   si el respaldo por OAuth pasara a ser la vía principal.

## 8d. El respaldo: la API por OAuth

Se documenta ahora, antes de que haga falta, porque el día que el scraping se
rompa no es el día de averiguar cómo era la alternativa.

Es todo lo que ya está medido en §3 y §4 de este documento y no se retira nada
de ello: flujo implícito con `launchWebAuthFlow` y `response_type=token`
—autorización con PKCE y sin secreto **no es una opción con Google**, porque su
endpoint de token no ofrece `none`—, `client_id` propio de cada estudiante,
scope `drive.readonly`, y `files?q='<ID>'+in+parents` para listar.

Su coste es el que ya estaba escrito y no ha cambiado: unos diez pasos en la
consola de Google, una pantalla de «app no verificada», y la mayoría de
estudiantes abandonando en el paso tres. Por eso es el respaldo y no la vía
por defecto.

**Si el respaldo llega a hacer falta, la descarga sigue sin necesitarlo**: lo
medido en §8 no depende del OAuth. Solo la enumeración lo necesitaría, así que
incluso en el peor caso el estudiante que sepa el id de un archivo lo baja sin
tocar nada.

## 9. Cómo se corre la sonda de descarga (ya cumplida)

Se conserva porque las rutas de exportación de documentos nativos aún están sin
medir y usan la misma sonda. `scripts/medir-drive.js`, en la consola del
service worker —`chrome://extensions` → IsilHelper → *service worker*—, que ya
tiene el permiso `downloads` desde la Fase 2 y no necesita ninguno más:

    await medirDrive({ archivo: "<ID>", documento: "<ID>",
                       hojaCalculo: "<ID>", presentacion: "<ID>" })

Deja los archivos en `Descargas/IsilHelper/_medicion/` **sin borrarlos**: hay
que abrirlos, no basta con que existan. Un `complete` con `text/html` y unos
pocos KB no es el archivo; y si ese HTML lleva un formulario con `confirm=`, es
la página de confirmación de antivirus que Drive intercala para archivos
grandes, o sea «funciona con un paso más» y no «no funciona».

Ninguno de los identificadores es un secreto y pueden aparecer en la bitácora.
Lo que **no** se pega en ninguna parte son las cookies de Google ni el
contenido de `.env`.

## 10. Orden

1. ~~Medir la descarga por sesión~~ (§8). **Hecha: funciona.**
2. ~~Medir la enumeración de carpetas~~ (§8b). **Hecha: funciona.** Parser
   escrito y con tests.
3. ~~Validar la enumeración con la cuenta institucional~~ sobre «Compartidos
   conmigo». **Hecha: responde igual.** Fixture real guardado.
4. Medir las rutas de exportación de los nativos y una subcarpeta (§8c.1 y 2).
   Son los dos límites conocidos que quedan.
5. **Abrir contenidos en pestañas.** No depende de nada de lo anterior.
6. ~~El recorrido recursivo y la descarga de Drive~~, sobre el parser que ya
   existe. **Hecho** (§11). El respaldo por OAuth (§8d) queda documentado y sin
   implementar hasta que haga falta.
7. Correr la Fase 3 contra la cuenta real, que es lo único que falta.

## 11. Implementada — 6 de septiembre de 2026

Escrita sobre las dos mediciones, y **sin OAuth, sin `client_id` y sin que
ningún estudiante toque la consola de Google**.

| Pieza | Qué hace |
|---|---|
| `src/api/drive.ts` | Único punto de red hacia Drive. Pausa serializada de 400 ms y timeout, como `client.ts` con Moodle |
| `src/api/drive-walk.ts` | Recorrido de carpetas y subcarpetas. Puro: recibe el lector como argumento, 13 tests sin red |
| `src/background/drive.ts` | Une el recorrido con la cola: de enlace de Moodle a archivos encolables |
| `src/ui/components/DrivePanel.tsx` | Explorar y encolar, en dos pasos |

**La descarga reutiliza la cola de la Fase 2 entera.** Lo único que se añadió
es el campo `source` de cada archivo, que decide cómo se autentica: `moodle`
lleva el token pegado, `drive` va con la sesión de Google. Progreso, pausa,
reanudación, saltar lo ya bajado y borrar la entrada del historial funcionan
igual sin tocar nada.

Ese campo no es cosmético: **pegarle el token de Moodle a una URL de Google
sería filtrárselo a un tercero**, que es justo lo que la regla 4 impide.

### Decisiones

- **Explorar y encolar son dos pasos, no uno.** El recorrido puede tardar
  minutos y puede salir a medias. Un botón único que bajara lo que pudiera
  dejaría la sensación de haberlo archivado todo, que es la peor forma de
  fallar en una herramienta cuyo propósito es no perder material.
- **En anchura y no en profundidad.** Si se alcanza un tope, lo que falta son
  las ramas más hondas y no media carpeta de primer nivel: es más fácil de
  explicar y de reanudar.
- **Los topes son `maxDepth: 8` y `maxFolders: 120`**, holgados para un ciclo
  —el inventario son 166 carpetas repartidas entre once cursos— y ahí para que
  un árbol enorme no se coma la tanda entera sin avisar.
- **Se llevan cuenta de las carpetas visitadas.** Drive permite atajos, así que
  un árbol puede tener ciclos; sin eso, un atajo a una carpeta antecesora deja
  el recorrido dando vueltas.
- **Un tipo desconocido no se encola.** Bajarlo por la ruta de binario podría
  traer una página en vez del archivo y ensuciar el destino.
- **Los documentos nativos llevan extensión puesta.** Un Google Doc se llama
  «Apuntes» y se exporta a PDF; sin el `.pdf` no abre con doble clic.
- **El mensaje de «devolvió HTML» depende del origen.** En Moodle significa que
  el token no llegó; en Drive, que falta sesión de Google o que Drive está
  pidiendo confirmación por ser un archivo grande. Decirle a alguien que
  reconecte su cuenta del instituto cuando lo que falta es la de Google es
  mandarlo a arreglar lo que no está roto.

### La rotura legible, en las tres capas

Es la condición que sostiene toda esta vía, así que no vive en un solo sitio:

1. **`drive-folder.ts`** devuelve `reason: "shape"` en vez de una lista vacía.
2. **`drive-walk.ts`** devuelve `problems[]` con cada carpeta que no se pudo
   leer, su ruta y su causa, y `truncated` cuando paró antes de tiempo. Una
   carpeta que falla **no se omite**: el recorrido sigue y la cuenta.
3. **`DrivePanel.tsx`** los enseña **aunque la descarga vaya bien**. Si dos
   carpetas no se pudieron leer, saberlo hoy es lo que permite ir a buscarlas a
   mano mientras todavía queda acceso.

### El permiso

Uno solo, y no los dos que preveía la especificación:

```json
"host_permissions": ["https://platform.ecala.net/*", "https://drive.google.com/*"]
```

**No entra `identity` ni `googleapis.com`**, porque no hay OAuth. Y
`drive.google.com` hace falta **solo para enumerar**: ese `fetch` desde el
service worker es cross-origin y sin permiso CORS bloquea la lectura. Bajar los
archivos no necesita permiso ninguno.
