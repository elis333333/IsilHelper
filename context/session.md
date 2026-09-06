# Sesión

> Estado vivo del trabajo. **Actualizar al cerrar cada tanda.**
> Si algo aquí contradice a `project.md` o `domain.md`, gana este archivo:
> es lo más reciente.

---

> **Cambio de prioridades, 6 de septiembre de 2026.** El proyecto nació para
> archivar el material antes de que cierren el ciclo y llevaba un día en el
> dashboard. **El propósito es archivar**; el dashboard es lo que hace
> agradable llegar al material, no el producto. El dashboard se congela —
> funciona, se queda, deja de crecer— y lo que crece es la descarga.

**Fase 0 — cerrada.** Verificada con sesión real: "Conectado como *X*" con los
11 cursos y su avance.

**Fase 1a — cerrada.** Corrida contra la cuenta real el 5 de septiembre de
2026 y corregida con lo que devolvió.

**Fase 1b — cerrada y congelada.** Buscador hecho; retroalimentación sin
fuente, y ya no espera turno.

**Fase 2 — Descargas de Moodle. Cerrada el 6 de septiembre de 2026**, a falta
de correrla contra la cuenta real.

## Fase actual

**La Fase 2 está escrita y en verde**, y lo siguiente es una sola cosa:
**correrla contra la cuenta real**. 126 tests, `typecheck`, `lint` y `build`
pasando, pero ni un solo archivo se ha bajado todavía de la plataforma de
verdad. Hasta que eso ocurra, la fase no está cerrada de verdad.

En paralelo, **la medición de Drive por sesión**, que decide la Fase 3 entera y
no depende de nada de lo anterior. Protocolo completo en `context/fase-3.md`
§8: qué identificadores hacen falta, qué observar y cómo se corre.

El orden de las fases 2 y 3 **vuelve a la 2 primero**. El 5 de septiembre se
había invertido para hacer Drive antes; el argumento —los contenidos viven en
Drive— sigue siendo cierto y aun así el orden era el equivocado: la descarga de
Moodle funciona hoy sin ningún obstáculo, y Drive está detrás de una decisión
de producto sin tomar.

### Las ramas

| Rama | Qué tiene |
|---|---|
| `master` | El producto: Fase 0, 1a, 1b y 2. Sin código de medición |
| `fase-1a-dashboard` | Mismo contenido que `master` en su día; se puede borrar |
| `diagnostico-temporal` | **Se conserva hasta octubre.** Congelada, con el producto de septiembre más el modo diagnóstico |

La medición de Drive **no necesita rama**: el service worker ya tiene el permiso
`downloads`, así que la sonda es un script que se pega en su consola
(`scripts/medir-drive.js`), no se compila y no entra en `dist/`.

**`diagnostico-temporal` no se borra**, y la decisión cambia respecto a lo
escrito en septiembre. El modo diagnóstico son unas 400 líneas medidas y
funcionando, y las preguntas de octubre son las mismas de septiembre: borrarlo
significaría reescribirlo. Se queda congelada y **no hace falta mergearla con
`master`**: para correr el diagnóstico se saca esa rama, se construye y se
corre, que es todo lo que tiene que hacer.

    git checkout diagnostico-temporal && pnpm build   # y cargar dist/ en Brave

## Lo que dijo el primer diagnóstico

Corrido el 5 de septiembre de 2026, tercer día del ciclo 2026-2. **Muestra
pequeña: 2 eventos, 3 tareas, 0 notas.** Sirve para descubrir formas, no para
endurecer tipos.

| Duda | Respuesta |
|---|---|
| 1 · Campos del calendario | **Sin decidir.** Con n=2 no hay evidencia. `course`, `modulename` y `action.url` siguen opcionales |
| 2 · ¿Aparecen las entregas ya entregadas? | **No.** Comprobado entregando una tarea: desaparece de la lista. No hace falta filtrar por `actionable` |
| 3 · ¿Trae el total del curso? | **Sin decidir.** El boletín está vacío en los 11 cursos |
| 4 · Filtro de ruido | **Estaba mal planteado.** Todo lo que se colaba era `modname === "label"`, entre 7 y 22 por curso. Ahora se filtra por estructura |
| 5 · Perfil | **No da para un carnet.** Solo identidad, correo, `department` y un `secondmail`. Sin código de alumno, sin carrera, sin ciclo |
| 6 · Retroalimentación | **Sin fuente por ahora.** Ningún ítem del boletín trae `feedback`, porque no hay ningún ítem |

Tipos de módulo nuevos: `folder` y `zoom`. Las clases grabadas **no** son
`mod_url`, son módulos de `mod_zoom`. Todo en `domain.md` §5.

## Siguiente paso

**1 · Correr la Fase 2 contra la cuenta real.** Es lo único que falta para
poder darla por cerrada. Qué mirar, en orden:

- Que los 55 archivos del inventario acaben en `Descargas/IsilHelper/`, con el
  árbol de curso y sección, y que los PDFs **abran** —no que existan: que
  abran—. Un HTML de login pesa unos pocos KB y tiene extensión de PDF.
- Que la cola no se pare al dormirse el service worker. La prueba es dejarla
  corriendo con un curso entero y no tocar nada durante un minuto.
- Que `chrome://downloads` **no** tenga entradas de IsilHelper al terminar: ahí
  es donde quedaría la URL con el token si el `erase` fallara.
- Que un segundo *Descargar todo el curso* diga "ya lo tienes" en vez de
  bajarlo otra vez.
- Los adjuntos de las tareas, que son la llamada nueva
  (`mod_assign_get_assignments`) y la única pieza sin verificar contra datos
  reales.

Empezar por **un curso**, no por los once: es la regla de siempre, probar con
límite antes de correr sobre todo.

**2 · La Fase 3 funciona.** Enumeración medida desde el service worker —permiso
concedido, `credentials: include`, HTTP 200, 1280 bytes, `flip-entries`
presente—, así que **Google no trata distinto a la extensión que a una
pestaña**. La hipótesis que quedaba abierta queda descartada por medición y el
diagnóstico temporal ya está fuera.

Se bajaron 14 carpetas de contenidos. Lo que salió de ahí:

- **La advertencia de antivirus existe y es por tamaño.** Fallaron dos PPTX y
  ningún PDF. Implementada la confirmación: se lee el formulario y se repite la
  petición con todos sus campos. Tercer permiso de host,
  `drive.usercontent.google.com`, solo para leer esa página.
- **Una carpeta no se pudo leer** y el aviso lo dijo con su ruta y la
  sugerencia de abrirla a mano. Es la condición de rotura legible funcionando
  en un caso real, así que se queda como está.

**3 · Medir lo que queda de Drive** (`fase-3.md` §8c): las rutas de exportación
de los nativos y una subcarpeta suelta. Ninguno bloquea, pero los dos son
supuestos que el código ya da por buenos.

Y más adelante, **repetir el diagnóstico a partir del 6 de octubre de 2026**
—desde la rama `diagnostico-temporal`—, con un mes de ciclo encima. Solo
entonces habrá muestra para endurecer `types.ts`, y solo entonces se sabrá si
el libro de calificaciones se llena.

Lo que ese segundo diagnóstico tiene que contestar:

1. **Si el boletín se llenó.** Es la pregunta que decide la Fase 1b entera. Si
   a finales de septiembre sigue vacío con evaluaciones ya rendidas, las notas
   no están en Moodle, y entonces la pantalla de notas y la de
   retroalimentación se quedan sin fuente.
2. **Los campos del calendario y el total del curso**, con muestra de verdad.
3. **Si `mod_zoom_get_state` está publicada aquí.** La sonda ya está puesta: el
   informe lista las funciones de `site_info` que mencionan Zoom. No se
   implementa nada todavía.
4. **Si los `mod_url` traen el destino en `contents[0].fileurl`.** De eso
   depende poder volver a filtrar `Tus calificaciones` por estructura en vez de
   por nombre (`domain.md` §5).

Después del segundo diagnóstico: endurecer `types.ts` y retomar la Fase 1b por
las entregas con retroalimentación, si es que para entonces tienen fuente.
## Hecho

### Fase 2 · descargas de Moodle

El equivalente en extensión de `isil_download.py`, y la razón de ser del
proyecto.

- `src/lib/paths.ts` — saneado de nombres y ruta de destino. Puro, 16 tests.
  Conserva tildes, se lleva por delante lo que rompe una ruta en Windows y en
  Linux, y **nunca produce una ruta que suba de carpeta**
- `src/api/files.ts` — qué se baja con el token y qué es enlace externo, por
  **estructura y no por nombre**, igual que el filtro de ruido. 8 tests
- `src/api/assign.ts` — los adjuntos del profesor, que `get_contents` no
  devuelve: un módulo `assign` llega con `contents` vacío aunque el enunciado
  esté colgado ahí. Cuesta una petición por curso y solo se paga si el curso
  tiene tareas
- `src/background/downloads.ts` — la cola. 12 tests con dobles de `chrome`
- `src/ui/pages/Downloads.tsx` y los botones del detalle de curso
- `src/ui/lib/inventory.ts` — el `metadata.json` del curso, con la lista de
  archivos y los enlaces a Drive. Se genera **en la pestaña**: el service worker
  de MV3 no tiene `URL.createObjectURL`
- Permiso `downloads` en el manifest, que entra ahora y no antes

**Decisiones de diseño de esta fase:**

- **El estado de la cola vive en `storage.local`, no en memoria.** El worker se
  duerme a los ~30 s y una cola de 55 archivos en una variable de módulo se
  pierde a mitad de tanda. En disco, el worker puede morir: `onChanged` lo
  despierta al terminar cada archivo y sigue donde estaba. **La reanudación no
  es una función, es una consecuencia**
- **Toda lectura-modificación-escritura del estado va serializada**, con la
  misma cadena de promesas que usa `client.ts` para la pausa. Un `onChanged` y
  una petición de la interfaz caen a la vez, y dos ciclos leyendo el mismo
  estado se pisan la escritura
- **Una descarga a la vez, con la pausa de 600 ms.** `chrome.downloads` no pasa
  por `client.ts`, así que la pausa que protege del WAF hay que ponerla en la
  cola. Cincuenta y cinco peticiones en ráfaga son un 418 seguro
- **La entrada del historial se borra al terminar** con `chrome.downloads.erase`.
  Los `fileurl` necesitan el token pegado, y esa URL completa quedaría anotada
  en `chrome://downloads` a la vista de cualquiera. El archivo no se toca: lo
  que desaparece es la anotación. Es la regla 4 del proyecto aplicada a un sitio
  donde no se había pensado
- **Un 200 con HTML es un fallo, no un archivo.** Cuando el token no llega,
  Moodle devuelve la página de login con estado 200 y `chrome.downloads` la
  guardaría tan contenta con nombre de PDF. Se mira el `mime`, se borra lo
  bajado y se dice qué pasó
- **`skipped` no es `done`.** Son dos respuestas distintas a "¿lo tengo?", y
  mezclarlas haría que una tanda entera de omitidos pareciera una descarga que
  nunca ocurrió
- **La extensión no puede mirar el disco**, así que lleva su propio registro de
  lo bajado. La consecuencia se dice en voz alta en la interfaz: si borras un
  archivo a mano, la extensión sigue creyendo que lo tiene, y para eso está
  "volver a descargar"
- **Carpeta propia solo si el módulo trae más de un archivo.** Dos carpetas de
  Moodle con un `guia.pdf` cada una se pisarían dentro de la misma sección, y
  la segunda acabaría como `guia (1).pdf`, que ya no dice de dónde salió

### Fase 1b · buscador global

- `src/lib/search.ts` — puro: normaliza sin tildes, exige todas las palabras en
  cualquier orden y puntúa antes el comienzo exacto que la coincidencia suelta.
  10 tests
- `src/ui/pages/Search.tsx` — busca sobre la caché de TanStack Query: cursos,
  pendientes y el material de los cursos ya abiertos
- **La pantalla dice siempre su alcance.** Un buscador que calla lo que no mira
  convierte "no lo he cargado" en "no existe", que es justo la confusión que
  esta extensión intenta quitar de encima. No se piden los 11 cursos en cada
  tecla: sería una ráfaga contra el WAF
- Clase `.enlace` nueva en `ui.css` para el botón que navega dentro de la
  aplicación. Lleva subrayado además del color de acción

### Fase 1b · perfil en la cabecera

- `getUserProfile` tipado en `src/api/profile.ts`, junto a la versión cruda que
  sigue usando el diagnóstico
- Se guarda en `storage.local` como el `userid`: el perfil no cambia de un día
  para otro y así cuesta una sola petición en la vida de la sesión
- Si la llamada falla, la sesión sigue: quedarse sin correo no es motivo para
  dejar al estudiante sin cursos
- La cabecera enseña lo que hay. Lo que no viene no se enseña: ni un guion, ni
  un hueco con etiqueta

### Correcciones del tema

Todo esto lo heredaba el navegador porque nadie lo había fijado:

- **Los enlaces no se veían como enlaces.** El preflight de Tailwind los deja
  en `color: inherit` y sin subrayado, así que eran indistinguibles del texto
  de alrededor. Ahora van en color de acción **y** subrayados; los anclas con
  aspecto de botón se quitan el subrayado en `.btn`. En modo claro el enlace
  usa el color de titular, porque #06D6A0 sobre #F5F5F5 da 1,9:1 y como texto
  no vale: ahí lo distingue el subrayado. La regla vive en `ui.css`, que es
  nuestra; `tokens.css` sigue siendo la copia de la skill sin editar
- **Los botones no se sentían pulsables.** El preflight no toca el cursor y el
  del navegador para `button` es la flecha. `.btn` fija `cursor: pointer`
  (`.nav__item` y `.curso` ya lo tenían)
- **El foco de teclado en los campos era la mitad de lo que pide el sistema.**
  `.campo__control:focus` traía un `outline` de 1 px que ganaba por
  especificidad al anillo global de 2 px. Ahora solo cambia el borde y el
  anillo lo pone la regla global

### Correcciones del 5 de septiembre

- `src/api/noise.ts` reescrito: filtro **estructural** por `modname`, con la
  expresión regular reducida a las dos encuestas de jotform. 8 tests
- Pantalla de notas: cuando el boletín está vacío en todos los cursos lo dice y
  explica las dos causas posibles, en vez de mostrar una tabla de guiones que
  parece un error
- Modo diagnóstico: sonda de funciones de `site_info` para saber si esta
  plataforma publica algo de `mod_zoom`

### Ingeniería inversa (completa)

- Servicio móvil de Moodle activo, 445 funciones disponibles
- Flujo de obtención del token vía `launch.php` documentado y verificado
- Cabeceras necesarias para sortear el WAF identificadas **y medidas desde la
  extensión** (ver `domain.md` §2)
- Estructura de curso mapeada: Contenidos / Complementario / Evaluaciones /
  Clases grabadas

### Scripts en Python (funcionando)

Se conservan como referencia de la API y vía para usuarios avanzados:

| Script | Qué hace | Resultado |
|---|---|---|
| `get-token.sh` | Obtiene y valida el token, escribe `.env` | ✔ |
| `isil_download.py` | Descarga material de Moodle, inventaría enlaces externos | 55 archivos, 0 errores |
| `drive_rclone.py` | Descarga carpetas de Drive vía rclone con OAuth | 166 carpetas |

`drive_download.py` (versión con gdown) se eliminó: la decisión de usar rclone
lo dejaba obsoleto y contradecía la documentación.

### Fase 0 · paso 1 — Andamiaje

- Vite 8 + `@crxjs/vite-plugin` 2.7 + React 18 + TypeScript 5.9 estricto
- Tailwind 4 con los tokens de Suki copiados de la skill, sin editar
- Manifest MV3 con **solo** `storage` y `webRequest`, un único host
- `pnpm typecheck`, `pnpm lint` y `pnpm build` en verde

### Fase 1a — Pendientes, cursos, detalle y notas

- `src/api/pending.ts` — clasificación por urgencia y orden por fecha. Puro: el
  "ahora" se pasa como argumento, así que se prueba sin reloj del sistema
- `src/api/noise.ts` — filtro del ruido de `domain.md` §5
- `src/api/average.ts` — nota por curso y promedio. Prefiere el total oficial de
  Moodle; si no está, pondera con `weightraw`
- `src/api/calendar.ts`, `contents.ts`, `grades.ts` — las tres llamadas nuevas
- `src/background/data.ts` — carga en el worker, donde vive la pausa de 600 ms
- Cuatro pantallas: Pendientes, Cursos, Detalle de curso y Notas, más
  navegación en Zustand
- 34 tests nuevos (55 en total)

**Decisiones de diseño de esta fase:**

- Los pendientes van en **una sola lista cronológica**, no agrupada por curso:
  agrupar por curso es exactamente lo que obliga hoy a abrir once pestañas
- La urgencia se marca con borde de color **y etiqueta de texto** (Vencido, Hoy,
  Esta semana, Más adelante). El color solo no informa a quien no lo distingue.
  Los colores son los funcionales del sistema, no acentos de marca: error
  `#FF3B30`, advertencia `#FFBE0B`, información `#3A86FF`. Todos ≥ 4,9:1 sobre
  la superficie de tarjeta, y las filas no cambian de fondo al pasar el cursor
  para que ninguno caiga por debajo de AA
- **Vacío y fallo se dicen distinto.** Una lista de pendientes vacía no dice
  "no tienes nada": dice que la plataforma respondió sin devolver nada y que a
  mitad de ciclo eso conviene comprobarlo
- Las notas son **11 llamadas**, así que un fallo suelto no tumba la tabla: el
  curso que falla se marca en su fila y el resto se muestra. Es el estado
  "parcial" del sistema de diseño
- El promedio se presenta como **media simple**, y la pantalla dice por qué: la
  API no expone créditos, así que ponderar exigiría inventarlos

Verificado en Brave: las cuatro vistas con datos de prueba, el estado vacío de
pendientes, y contra la plataforma real un token inválido → `exception` con
estado 200 → "La conexión con tu cuenta ya no vale".

### Fase 0 · paso 3 — Autenticación, cliente y pantalla

- `src/api/token.ts` — extracción y parseo del token, con 13 tests
- `src/api/client.ts` — único punto de red: detección de `exception` con estado
  200, 418 con espera creciente, pausa de 600 ms serializada para toda la
  extensión, timeout explícito, 4 reintentos. 8 tests con dobles, sin red
- `src/api/types.ts`, `errors.ts`, `result.ts`, `site.ts`
- `src/background/auth.ts` — captura vía `onBeforeRedirect`, listener registrado
  de forma síncrona en el arranque
- `src/background/session.ts` — compone las llamadas y traduce los errores a las
  cinco causas que la interfaz sabe explicar
- Pantalla `Home` con tres estados: sin conectar, conectado, y fallo con causa
- 21 tests en verde · `typecheck`, `lint` y `build` en verde

Verificado de punta a punta en Brave con perfil limpio: estado inicial
`disconnected`; al pulsar Conectar sin sesión en la plataforma devuelve
`{"state":"failed","reason":"nosession"}`, la pantalla lo explica y
`storage.local` queda vacío. El token nunca cruza a la interfaz.

### Fase 0 · paso 2 — Sondeo del WAF (**pasa**)

La pregunta era si el WAF acepta lo que el service worker puede enviar, dado
que desde ahí no hay `Referer`. Medido en Brave 149 con la extensión cargada:

```
POST /webservice/rest/server.php  (token inválido a propósito)
→ 200 · Server: CW · application/json
  {"exception":"moodle_exception","errorcode":"invalidtoken", …}
```

**No hace falta `Referer`.** Ni content script ni `declarativeNetRequest`. El
detalle completo está en `domain.md` §2.

---

## Decisiones tomadas

| Decisión | Motivo |
|---|---|
| Extensión de navegador, no web app | CORS + el token deriva de la sesión del navegador |
| Solo lectura | Escribir multiplica el riesgo y aporta poco frente a usar Moodle |
| Sin backend | No custodiar credenciales ajenas |
| Zoom fuera de alcance | Solo 2 grabaciones en todo el ciclo; alta fragilidad |
| rclone en vez de gdown | Las carpetas de Drive no son públicas; requieren OAuth |
| Color de acción `#06D6A0` | IsilHelper es producto de Suki, no de Suki Labs. Verificado a AAA con `contraste.py` |
| `urlscheme=isilhelper` | Unificado en el script, la especificación y `domain.md` |
| Permisos por fase | Un permiso sin función que lo use es una advertencia que no se puede justificar |
| `retry: false` en TanStack Query | Los reintentos viven solo en `client.ts`; apilarlos castiga al WAF |
| `credentials: "include"` en toda petición a la plataforma | Sin él `launch.php` no recibe `MoodleSession` y parece un fallo de sesión |
| React 19 | Subido desde el 18 de la especificación |
| TypeScript 5.9, no 7 | `typescript-eslint@8.69` declara `typescript: >=4.8.4 <6.1.0`. TS 7 rompería `pnpm lint` |
| `credentials` por endpoint | `server.php` se autentica con `wstoken` y va sin credenciales; solo `launch.php` las lleva |
| Identificadores en inglés | Lo pide `CONVENTIONS.md`. Comentarios y textos de UI en español |
| No endurecer `types.ts` con el primer diagnóstico | Muestras de n=2 y n=3 al tercer día del ciclo no son evidencia. Un campo que vino dos veces no es un campo obligatorio |
| Filtro de ruido por `modname`, no por nombre | Todo lo que se colaba eran etiquetas. El tipo es un hecho de la plataforma; el título lo escribe cada profesor |
| Perfil sin pantalla propia | La API no da código de alumno, carrera ni ciclo. Un carnet sin datos de carnet no vale una pantalla, y rellenarlo sería inventar |
| Buscador antes que retroalimentación | Es lo único de la 1b que no depende de datos que todavía no existen |
| El buscador solo mira la caché | Buscar de verdad serían 11 peticiones por tecla contra un WAF que castiga las ráfagas. A cambio, la pantalla declara su alcance |
| El perfil va en la cabecera, no en una pantalla | Correo y `department` son dos líneas. Una pantalla para eso sería una pantalla que se abre una vez |
| El perfil se guarda en `storage.local` | No cambia de un día para otro, y así son 600 ms una sola vez y no en cada apertura |
| **El propósito es archivar; el dashboard se congela** | El proyecto nació para no perder el material al cerrar el ciclo. El dashboard hace agradable llegar a él, pero sin la descarga la herramienta no cumple nada |
| Fase 2 antes que Fase 3 | La descarga de Moodle funciona hoy sin obstáculos; Drive está detrás de una decisión de producto sin tomar. Primero lo que no está bloqueado |
| Estado de la cola en `storage.local` | El worker de MV3 se duerme a los 30 s. En memoria, una tanda de 55 archivos se pierde a la mitad |
| Borrar la entrada del historial tras cada descarga | El `fileurl` lleva el token pegado y la URL quedaría anotada en `chrome://downloads`. Es la regla 4 en un sitio donde no se había pensado |
| Registro propio de lo descargado | Una extensión no puede leer el disco. Se lleva la cuenta y **se dice que se lleva**, con salida para volver a bajar lo que se borró a mano |
| Los adjuntos de tareas entran en la Fase 2 | `get_contents` no los devuelve y `isil_download.py` sí los bajaba. Sin ellos no hay paridad con el script |
| El `metadata.json` se genera en la pestaña | El service worker de MV3 no tiene `URL.createObjectURL`, así que ahí no hay forma de convertir un texto en algo descargable |
| **Scraping de Drive como vía por defecto, OAuth como respaldo** | La elección no es entre frágil y sólido, sino entre una herramienta que todos pueden usar y que algún día habrá que arreglar, y otra que la mayoría no llega a usar porque abandona en el paso tres de la consola de Google |
| La rotura del scraping tiene que ser legible | Un scraping que falla en silencio convierte un cambio de Google en «perdí mi material». Cero archivos dice que la vía se rompió, nunca que la carpeta está vacía |
| El parser de Drive, aislado y con tests sobre HTML real | Para que arreglarlo el día que se rompa sea cambiar un archivo, no perseguirlo por media base de código |
| El tipo de cada entrada sale del `href`, no de `_DRIVE_ivd` | El blob da más campos —tamaño y padre— pero exige otra petición a la ruta menos estable. De lo que aporta de más, solo el mime hacía falta, y el `href` ya lo dice. Entre dos fuentes frágiles gana la que tiene rehenes: cambiar el `href` rompería todas las carpetas incrustadas del mundo |
| Cero entradas se informa como rotura, no como carpeta vacía | El día que Drive cambie el HTML sin quitar el contenedor, todas las carpetas parecerían vacías y el estudiante concluiría que no tiene material |
| El ancla del parser es `class="flip-entry"`, no el `id` del div | El identificador bueno está en el `href`, que es además el que se usa para bajar. Fiarse de dos sitios para el mismo dato sobra, y el atributo `id` no se usa para nada más |
| El mime del icono es respaldo, no confirmación | Confirmar obliga a escribir una rama de «¿y si discrepan?» y a decidir cuál gana, sin ningún dato sobre cuándo ocurre. Como respaldo no toca el camino normal y salva la clasificación el día que cambien las URLs |
| La Fase 3 no lleva OAuth ni `client_id` | Las dos mediciones salieron bien: enumerar y descargar funcionan con la sesión de Google. El muro que dejaba fuera a la mayoría desaparece |
| El campo `source` de cada archivo de la cola | Decide cómo se autentica: Moodle lleva el token pegado, Drive va con la sesión de Google. Pegarle el token de Moodle a una URL de Google sería filtrárselo a un tercero |
| Explorar y encolar son dos pasos | El recorrido tarda y puede salir a medias. Un botón único que bajara lo que pudiera dejaría la sensación de haberlo archivado todo, que es la peor forma de fallar aquí |
| El recorrido va en anchura | Si se alcanza un tope, lo que falta son las ramas más hondas y no media carpeta de primer nivel: más fácil de explicar y de reanudar |
| Un tipo desconocido no se encola | Bajarlo por la ruta de binario podría traer una página en vez del archivo y ensuciar el destino |
| Acento por sección, y el verde solo para la acción | El sistema es 70/20/10, y usar el color de acción como decoración hace que deje de leerse como acción. Cada sección toma el color de su familia; los botones, enlaces y foco siguen en verde porque eso es una regla del sistema |
| El texto de la pestaña activa no es del mismo color en las cinco | Sobre el morado el oscuro da 3,46:1 y falla; el blanco da 5,61. La excepción viaja con la pestaña para no tener que acordarse de ella |
| El nombre del curso ya no se colorea al pasar el cursor | Sobre `#242424` el rosa cae a 4,05 y el azul a 4,46: ninguno llega a AA como texto. El acento va en la barra de zona, que da al fondo base |

---

## Pendiente de resolver

- [x] ~~**`.gitignore` es un directorio, no un archivo.**~~ Resuelto:
      `git check-ignore -v .env` devuelve `.gitignore:1:.env`.
- [ ] **Correr la Fase 2 contra la cuenta real.** Escrita y en verde, pero sin
      un solo archivo bajado de la plataforma de verdad
- [x] ~~**Medir la descarga de Drive por sesión.**~~ Hecho el 6 de septiembre
      de 2026: funciona sin OAuth ni `client_id`
- [x] ~~**Medir la enumeración de carpetas.**~~ Hecho: funciona por
      `embeddedfolderview`, sin OAuth. Parser escrito, 27 tests
- [x] ~~**Validar la enumeración con la cuenta institucional**~~ sobre
      «Compartidos conmigo». Hecho: responde igual, sin pedir login
- [x] ~~**Guardar el HTML real como fixture**~~, anonimizado
- [x] ~~**Correr la Fase 2 contra la cuenta real.**~~ Verificada: 45 archivos en
      Base de Datos, tildes y estructura correctas
- [x] ~~**La Fase 3 falla al explorar.**~~ Resuelto: funcionaba, y el
      diagnóstico descartó las tres hipótesis
- [x] ~~**Quitar el diagnóstico temporal de Drive.**~~ Fuera
- [ ] **Comprobar si sigue saliendo el diálogo de guardado** tras desactivar
      «Preguntar dónde guardar cada archivo» en `brave://settings/downloads`.
      `saveAs: false` está puesto desde el primer commit, así que si persiste
      es del navegador y hay que medirlo aparte
- [ ] **Medir las rutas de exportación de los nativos** y **que una subcarpeta
      se enumere igual** (`fase-3.md` §8c). El código ya las da por buenas
- [ ] **Capturar un fixture limpio** de `embeddedfolderview` con la sonda ya
      corregida, y guardarlo junto al corrompido
- [ ] **Medir las subcarpetas y los documentos nativos** (`fase-3.md` §8c), que
      son los dos límites conocidos de la vía por defecto
- [x] ~~Iconografía de tienda (16/32/48/128 px)~~. Generada desde
      `assets/dibujo_Ícono Oscuro.svg` con `rsvg-convert`, en `public/iconos/`
- [ ] **Confirmar si las notas están en Moodle o en un SIS aparte.** Boletín
      vacío en los 11 cursos el 5 de septiembre de 2026. Se resuelve corriendo
      el diagnóstico a partir del 6 de octubre. **De esto depende la pieza de
      retroalimentación de la Fase 1b**
- [ ] Decidir qué hacer con `Tus calificaciones`, que ya no filtra nadie
      (`domain.md` §5)
- [ ] Confirmar si el horario está disponible vía API
- [ ] Decidir si avisar a sistemas de ISIL antes de publicar

---

## Notas de entorno

- `pnpm` no está instalado; se usa vía `npx pnpm@10`. Para tenerlo nativo:
  `sudo pacman -S pnpm`.
- **Google Chrome branded ignora `--load-extension`** ("not allowed in Google
  Chrome"), así que no sirve para probar la extensión sin empaquetar. **Brave
  sí funciona**, que además es el navegador objetivo.
- El service worker de MV3 se duerme a los ~30 s. Para depurarlo hay que
  despertarlo (abrir la interfaz) antes de engancharse.

---

## Bitácora

> Orden cronológico: lo más antiguo arriba. La hora es la de cierre de cada
> tanda. Las del 4 de septiembre se reconstruyeron después, a partir de las
> marcas de tiempo de los commits y de los archivos.

**2026-09-04 · 14:00** — Ingeniería inversa completada. Scripts de Python
funcionando y material del ciclo 2026-2 archivado. Decidida la arquitectura de
extensión. Redactada la especificación. Creados los archivos de contexto.

**2026-09-04 · 14:45** — Revisión de contexto y arranque de la Fase 0.
Corregidos la cookie real del ejemplo de `get-token.sh`, el `urlscheme`, los
permisos por fase y la sugerencia de gdown. `ESPECIFICACION.md` movido a
`context/`. Corregido `domain.md`: las cabeceras **no** son gratis desde el
service worker. Andamiaje en pie y sondeo del WAF superado — no hace falta
`Referer`.

**2026-09-04 · 14:55** — Fase 0 completa a falta de la prueba con sesión real.
Retirada de los tres documentos la premisa falsa de que `server.php` no envía
CORS: sí envía `Access-Control-Allow-Origin: *`, así que la única razón válida
para elegir extensión es el origen de la sesión. Corregido el atajo de parseo
de la URL de redirección, que devolvía `null` y además rompía el base64.

**2026-09-04 · 17:00** — Fase 0 cerrada y verificada con sesión real. Primer
commit (`c499d9a`), 87 archivos, sin secretos. Fase 1a escrita: pendientes en
lista cronológica única, cursos, detalle de curso con el ruido filtrado, y
notas con promedio y estado parcial. `project.md` actualizado con la partición
1a/1b.

**2026-09-04 · 17:34** — Fase 1a commiteada en `fase-1a-dashboard`. Corregido
el fallo de paginación del calendario que avisó Elis: faltaba seguir
`aftereventid`, y sin eso la lista salía corta sin avisar. Añadida barrera de
error tras comprobar que una respuesta con forma inesperada dejaba la página
en blanco.

**2026-09-05 · 10:55** — Bitácora reordenada en cronológico con hora, que hasta
ahora iba invertida y ponía la Fase 1a antes que la Fase 0. Ampliado el modo
diagnóstico antes de correrlo: sondeaba calendario, notas y contenidos, pero
ninguna de las dos funciones de las que depende la 1b. Añadidos
`core_user_get_users_by_field` (una petición) y `mod_assign_get_assignments` +
`mod_assign_get_submission_status` sobre una muestra de tres entregas, más el
recuento de `feedback` en el boletín, que no cuesta ninguna petición y puede
ahorrar la pantalla entera. `src/api/assign.ts`, `src/api/profile.ts`, 7 tests
nuevos (85 en total).

**2026-09-05 · 17:51** — Primer diagnóstico contra la cuenta real, analizado
por Elis. Decisión suya, y es la correcta: **no endurecer los tipos** con
muestras de n=2 al tercer día del ciclo. Tres hallazgos que cambian código y
documentación: Moodle ya excluye de los pendientes lo que está entregado, así
que sobra el filtro por `actionable`; el filtro de ruido estaba mal planteado y
pasa a ser estructural por `modname`, porque todo lo que se colaba eran
etiquetas; y el perfil no da para un carnet, así que esa pantalla se cae de la
Fase 1b en vez de rellenarse con campos inventados. Aparecen `folder` y `zoom`
como tipos de módulo, y las clases grabadas resultan ser `mod_zoom` y no
`mod_url`. El boletín de calificaciones está vacío en los 11 cursos: queda como
incógnita abierta, la pantalla de notas lo dice con honestidad, y de ella
depende que la retroalimentación de la 1b tenga fuente. Arrancada la Fase 1b
por el buscador global. 102 tests.

**2026-09-05 · 18:00** — Cerradas las dos propuestas que Elis aprobó. El perfil
deja de ser una pantalla y pasa a dos líneas en la cabecera, con el correo y el
`department`, guardadas en `storage.local` para no repetir la petición. Y
arreglado lo que el tema heredaba del navegador sin querer: los enlaces no se
distinguían del texto porque el preflight de Tailwind los deja en
`color: inherit` y sin subrayado, los botones salían con cursor de flecha, y el
foco de teclado en los campos era de 1 px en vez de los 2 px del sistema. La
Fase 1b queda en dos piezas.

**2026-09-05 · 18:20** — Arreglado el fallo que encontró Elis probando el
buscador: decía "0 cursos" con once cargados. El índice se calculaba una sola
vez, memorizado sobre la identidad del cliente de Query, que nunca cambia, así
que congelaba lo que hubiera en caché en el primer montaje. Sacado a
`src/ui/lib/cache-index.ts`, con 10 tests y uno de ellos contra una caché real
con las mismas claves que usan las pantallas. Corregida también la jerarquía de
los resultados: manda el nombre y el curso baja a contexto. Fase 1b cerrada y
mergeada a `master`; `diagnostico-temporal` se conserva congelada hasta la
corrida de octubre. Invertido el orden de las fases 2 y 3: primero Drive.

**2026-09-06 · 13:10** — Cambio de prioridades de Elis, y es el correcto: el
proyecto nació para archivar y llevaba un día en el dashboard. **El propósito
es archivar**; el dashboard es lo que hace agradable llegar al material, no el
producto. El dashboard se congela y la Fase 2 se escribe entera de una vez:
botón por archivo, por sección y por curso, cola reanudable con progreso y
pausa, saltar lo ya bajado, e índice del curso en `metadata.json` con los
enlaces a Drive. Vuelve a invertirse el orden de las fases 2 y 3, esta vez
hacia la 2, porque la descarga de Moodle no tiene ningún obstáculo y Drive está
detrás de una decisión sin tomar. Tres cosas que no eran evidentes y salieron
al escribirlo: el token pegado al `fileurl` quedaba anotado en el historial de
descargas del navegador, así que la entrada se borra al terminar; una descarga
corta puede acabar antes de que su id llegue a guardarse, lo que dejaba la cola
colgada, y por eso todas las mutaciones del estado van serializadas; y los
adjuntos del profesor no vienen en `get_contents`, así que hacen falta una
llamada y un módulo más para tener paridad con `isil_download.py`. README
escrito, que no existía, con el propósito por delante. 126 tests. Falta lo
único que importa: correrlo contra la cuenta real.

**2026-09-06 · 13:40** — Elis corrió la sonda de Drive: **la descarga por
sesión funciona**. 118 055 bytes que coinciden exactamente con los 115 KB que
Drive declara para ese PDF, sin OAuth y sin `client_id`. Cae el muro para los
archivos, pero no para la fase: los 32 enlaces del inventario son carpetas, y
sin enumerar no hay ids que bajar. Escrita la sonda de enumeración
(`scripts/medir-carpetas.js`) y un detalle que habría costado horas de
depuración en la dirección equivocada: **no se puede correr desde el service
worker**, porque un `fetch` a `drive.google.com` desde ahí es cross-origin y
CORS bloquea la lectura sin `host_permissions`; el síntoma es una excepción de
red y se confunde con un rechazo de Google. Va en la consola de una pestaña de
Drive, donde la petición es del mismo origen y no hace falta permiso ninguno.
Prueba dos rutas —`embeddedfolderview`, que es la vista para incrustar y
debería ser más estable, y la página completa— y reporta qué estructuras
embebidas aparecen, con muestras del HTML para escribir el parser mirando la
forma real. Tomada la decisión de producto: **scraping como vía por defecto,
OAuth documentado como respaldo**, con las tres condiciones que eso exige
—rotura legible, parser aislado con tests sobre HTML real, y respaldo escrito
antes de que haga falta—. Ampliada la otra sonda con las rutas de exportación
de Docs, Sheets y Slides, que no se bajan sino que se exportan y cada uno tiene
la suya.

**2026-09-06 · 15:20** — Las muestras de Elis confirman la enumeración y con
eso **el `client_id` desaparece del proyecto**: enumerar y descargar funcionan
los dos con la sesión del navegador. Escrito el parser en dos módulos aislados
—`drive-links.ts` y `drive-folder.ts`, 27 tests—, porque todo el conocimiento
sobre la forma del HTML de Drive tiene que vivir en un sitio del que se pueda
sacar el día que Google lo cambie. La duda que planteaba Elis, si usar
`_DRIVE_ivd` como fuente del tipo, se resuelve que no: da más campos —tamaño y
padre— pero exige otra petición a la ruta menos estable, y de todo eso solo el
mime hacía falta, que el `href` ya lo dice. Entre dos fuentes frágiles gana la
que tiene rehenes. Dos trampas que encontraron los tests y no se veían venir:
las entidades HTML acentuadas son la forma normal en material en español y son
**sensibles a mayúsculas** —normalizar la clave convertía `&Oacute;` en `ó`
minúscula dentro del nombre del archivo—, y el prefijo `/u/<n>/` de las rutas
aparece en cuanto hay dos sesiones de Google abiertas, que es justo el caso de
un estudiante con cuenta personal y cuenta del instituto. La rotura va en el
tipo de retorno y no en un comentario: cero entradas es `reason: "shape"`,
nunca una lista vacía. **Queda sin confirmar lo que más importa**: la medición
se hizo con la cuenta personal de Elis, y falta repetirla con la institucional
sobre «Compartidos conmigo», que es como están compartidas las carpetas de los
cursos. Los fixtures de hoy están reconstruidos y el archivo lo dice en la
primera línea; el real se captura con `anonimizarHtml()`, que la sonda ya trae
porque el HTML de Drive lleva el correo de quien mira la carpeta. 153 tests.

**2026-09-06 · 17:45** — Fixture real capturado y **verificación cerrada**: la
carpeta era de «Compartidos conmigo» con la cuenta de ISIL, que es el caso que
importaba, y `embeddedfolderview` respondió igual. Quitadas las marcas de «sin
verificar» de `fase-3.md` y `domain.md` §6. El HTML real trajo dos cosas que no
se habían visto: **el mime explícito en el icono** —segunda fuente del tipo,
mismo HTML, ninguna petición extra— y **el `<title>` con el nombre de la
carpeta**, que sirve para el directorio de destino. El icono se usa como
respaldo y no como confirmación: confirmar obligaría a escribir una rama de
«¿y si discrepan?» sin ningún dato sobre cuándo ocurre.

Y el fixture destapó un fallo propio: **el anonimizador se comía el prefijo
`entry-`** del atributo `id`, porque el patrón de identificadores incluía el
guion. El fixture se deja tal cual vino en vez de arreglarlo a mano —es lo
capturado, y prueba que el parser no depende de ese atributo—, y de paso se
cambió el ancla del parser a `class="flip-entry"` sacando el identificador del
`href`, que es el que se usa para bajar. La sonda ya está corregida. También
salió que el aviso de «no quedan correos» del anonimizador **nunca podía
disparar**, porque usaba el mismo patrón que la sustitución: se cambió por un
recuento de lo sustituido y un aviso de lo que no sabe detectar, que son los
nombres de personas de `flip-entry-last-writer`. 160 tests. Commiteado todo lo
pendiente: la Fase 2 y el parser llevaban demasiado tiempo sin versionar.

**2026-09-06 · 18:05** — **Fase 3 implementada, y sin OAuth.** Enumerar y
descargar salen los dos con la sesión de Google del navegador, así que el
`client_id` no existe en el proyecto y ningún estudiante toca la consola de
Google Cloud. El permiso nuevo es uno solo, `drive.google.com`, y solo para
leer las carpetas: bajar los archivos no necesita ninguno.

La descarga **reutiliza la cola de la Fase 2 entera**. Lo único que se añadió
es el campo `source`, que decide cómo se autentica cada archivo, y no es
cosmético: pegarle el token de Moodle a una URL de Google sería filtrárselo a
un tercero. De paso salió que el mensaje de «devolvió HTML» decía «vuelve a
conectar tu cuenta», que es cierto para Moodle y falso para Drive, donde
significa sesión de Google o página de confirmación de antivirus; ahora depende
del origen.

Explorar y encolar quedaron como dos pasos y no uno: el recorrido tarda y puede
salir a medias, y un botón único dejaría la sensación de haberlo archivado
todo. La rotura legible vive en las tres capas —el parser devuelve `shape`, el
recorrido devuelve `problems[]` con la ruta y la causa de cada carpeta que
falló, y la pantalla los enseña **aunque la descarga vaya bien**—. El recorrido
va en anchura, lleva cuenta de las carpetas visitadas porque los atajos de
Drive permiten ciclos, y avisa cuando para por un tope. 181 tests.

Queda correrlo contra la cuenta real, que es lo único que falta, y capturar el
fixture limpio de `embeddedfolderview` con la sonda ya corregida.

**2026-09-06 · 18:30** — **Fase 2 verificada contra la cuenta real**: 45
archivos, tildes y estructura correctas. La Fase 3 falla al explorar, y el
mensaje que salía estaba **mal atribuido**: decía que la plataforma respondió
mal y que suele pasar cuando el instituto cambia algo, cuando quien respondió
mal fue Google. Es el mismo error por origen que ya se había corregido en las
descargas y que había quedado sin corregir en la enumeración; ahora el
resultado de explorar distingue `course-failed` —de la plataforma— de
`drive-failed` —de Google—, y `exploreDrive` captura las excepciones, porque
una que se escapara dejaba la petición sin respuesta y la interfaz caía en el
aviso genérico, que era justo la atribución equivocada.

Puesto un **diagnóstico temporal** para resolverlo por medición: permiso de
host concedido —que no es lo mismo que declarado—, modo de credenciales, estado
HTTP, bytes, si el HTML trae `flip-entries` y si parece pantalla de acceso. La
hipótesis de las credenciales queda descartada por código: el `fetch` lleva
`credentials: "include"` desde el principio. La que más pesa es la tercera, y
es culpa de cómo se midió: **la validación se hizo desde una pestaña de Drive,
donde era del mismo origen, y desde la extensión no lo es.** Esa diferencia
nunca se midió.

Cuatro cosas de interfaz. **La barra de avance salía vacía** con el porcentaje
escrito al lado: `.barra` es un `<span>` y en línea ignora `height` y no
contiene a un hijo con `width` en porcentaje; en la cola sí se veía porque allí
había un `display: block` local. **El logotipo** entra por el pie, que es donde
la skill pone la firma de respaldo, generado a PNG con `rsvg-convert` porque el
SVG lleva el texto como `<text>` en Montserrat y dependería de la fuente; en la
cabecera van los cinco puntos, que son el elemento gráfico que puede aparecer
solo, con el nombre del producto en Inter. De paso salieron los **iconos de
tienda**, que estaban pendientes. **Indicador de carga propio**: los cinco
puntos saltando en secuencia con el desfase de 60 ms de la animación firma,
movimiento de 400 ms —el máximo del sistema— dentro de un ciclo con reposo, y
quietos con `prefers-reduced-motion`. Y **más presencia del verde** donde es
acento y no decoración: cifras de resumen, barra de zona en las secciones,
regla de la cabecera y el nombre del curso al pasar el cursor, este último
verificado a 8,23:1 sobre `#242424` con `contraste.py`. 181 tests.

**2026-09-06 · 19:00** — **La Fase 3 funciona.** El diagnóstico descartó las
tres hipótesis: permiso concedido, `credentials: include`, HTTP 200 con 1280
bytes y `flip-entries` presente. **Google no trata distinto a la extensión que
a una pestaña**, que era la duda que quedaba y la que más pesaba. Anotado en
`domain.md` §6 y diagnóstico retirado de todas las capas.

Se bajaron 14 carpetas, y salieron dos cosas. La primera, **la advertencia de
antivirus**, que estaba anticipada en `medir-drive.js` y se confirmó de la
forma más limpia posible: fallaron dos PPTX y ningún PDF, y el archivo
siguiente bajó bien con la misma sesión. Eso descarta la sesión y señala el
tamaño. Implementada la confirmación, y con dos detalles que no se ven venir:
**no basta con `confirm=t`** —el formulario trae un `uuid` de esa sesión de
descarga y sin él Google vuelve a preguntar— y **la pantalla de acceso también
llega como HTML con estado 200**, así que sin distinguirla el reintento entra
en bucle contra una página que nunca dará el archivo. Tercer permiso de host,
solo para leer esa página. La segunda, una carpeta ilegible cuyo aviso salió
bien redactado y con su ruta: la rotura legible funcionando en un caso real.

**Color repartido.** Me había pasado con el verde en la tanda anterior: usar el
color de acción como decoración hace que deje de leerse como acción. Ahora cada
sección toma el color de su familia —Pendientes/Integrar, Cursos/Adaptar,
Notas/Escalar, Buscar/Evolucionar, Descargas/Construir— y los cinco están
presentes siempre en las viñetas de la navegación, que es un uso aprobado de
los puntos. Los botones, enlaces y foco siguen en verde porque eso sí es una
regla del sistema. Todo verificado con `contraste.py` sobre el fondo real, y de
ahí salieron dos límites: el morado **falla como texto** (3,46 sobre base, 2,77
sobre hover) así que solo va como punto, barra de zona y cifra grande; y la
pestaña activa morada necesita texto blanco cuando las otras cuatro lo llevan
oscuro. 193 tests.
