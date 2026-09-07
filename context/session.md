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

**Fase 4 — Distribución, empezada el 7 de septiembre de 2026.** El producto
está hecho y verificado contra la cuenta real; lo que queda es lo que hace
falta para publicarlo. En esta tanda entraron los cuatro frentes que Elis pidió
cerrar antes de la tienda: interfaz, apoyo económico, ficha de tienda y legal.
Lo que sigue abajo, en **Siguiente paso**, es lo que todavía no está.

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

**1 · Probar en Brave lo de esta tanda.** Está todo en verde —210 tests,
`typecheck`, `lint` y `build`— y la cabecera y el pie se comprobaron
renderizados con el CSS ya compilado, pero **la foto de perfil no se ha
descargado nunca de la plataforma de verdad**. Qué mirar:

- Que la foto aparezca. Si sale la inicial, hay que saber por qué: puede ser
  que la cuenta no tenga foto —correcto— o que la descarga falle, que hoy no se
  distingue desde fuera porque falla en silencio a propósito.
- Que en el inspector de la pestaña **el `src` de la imagen empiece por
  `data:`**. Si alguna vez empezara por `https://platform.ecala.net`, el token
  estaría escrito en el DOM y eso es la regla 4 rota.
- Que a quien ya estaba conectado le aparezca la foto sin cerrar sesión:
  `readProfile` devuelve `null` cuando al perfil guardado le falta la clave
  `avatar`, así que se pide una vez más y se guarda.
- Que el QR del pie **lo lea Yape de verdad**, con un teléfono. Está verificado
  con `zbarimg` —el código reducido lleva exactamente el mismo contenido que el
  original— pero eso comprueba el código, no que la aplicación lo acepte.

**2 · Las tres decisiones que quedan antes de subir nada a una tienda**, y son
de Elis, no del código:

- **El nombre de ISIL en el título de la ficha.** `project.md` decidió en su
  día no usarlo; la recomendación, con sus tres condiciones, está en
  `context/tienda.md`. Si se acepta, aplicarlo es editar `manifest.config.ts`
  (`name`) y `package.json` (`description`): en Chrome esos dos campos **son**
  el título y la descripción breve de la tienda.
- **La licencia.** AMO obliga a elegir una, y hoy el repositorio no tiene
  `LICENSE`. Sin ella, «código abierto para que cualquiera lo verifique» es
  cierto de hecho pero no de derecho.
- **Si avisar a sistemas de ISIL antes de publicar**, que ya estaba anotado.

**3 · Las capturas.** Cinco, a 1280 × 800, con lo que tiene que demostrar cada
una en `context/tienda.md`. La primera enseña la descarga, no el tablero. Sin
datos personales a la vista: para eso conviene encuadrar dejando la cabecera
fuera.

**4 · Medir lo que queda de Drive** (`fase-3.md` §8c): las rutas de exportación
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

### Interfaz · navbar, avisos visibles y apoyo económico como ventana

Tres ajustes de UI que pidió Elis, sin tocar auth, descarga de Moodle ni el
parsing de Drive.

**1 · Navbar en una sola fila.** `SessionHeader.tsx`: la foto, el nombre y el
botón *Cerrar sesión* pasan de "sesión apilada + botón debajo con
`margin-top`" a los tres dentro de `.sesion`, un único flex-row. Nueva clase
`.sesion__detalle` en `layout.css` para el correo/unidad: `.parrafo` traía
`max-width: 65ch` y un margen pensados para texto largo, que sobraban en una
línea compacta de navbar. `.sesion` gana `flex-wrap` como salvaguarda a
ancho angosto —el botón baja de línea dentro del propio bloque en vez de
reventar la cabecera—. Nada de color nuevo: todo sale de tokens ya
existentes.

**2 · Avisos como toast, para lo que antes era texto fácil de ignorar.** No
existía ningún sistema de toast en el proyecto; se construyó el más simple
posible con lo que ya había —`.estado`, tokens de color y movimiento—, sin
traer ninguna librería. `src/ui/store/toasts.ts` (Zustand, mismo patrón que
`navigation.ts`) + `src/ui/components/ToastStack.tsx`, montado una vez en
`Home.tsx` para que un aviso aparezca sin importar la pantalla. Dos
disparadores, elegidos porque son los casos reales que quedaban enterrados:

- `DrivePanel.tsx` — cuando explorar Drive sale `drive-failed` (sin sesión de
  Google, o cuenta no institucional) o `course-failed` (token/WAF), además
  del aviso inline que ya había —que se queda, con su botón de reintentar—.
  `failureTitle()`, exportado de `FailureNotice.tsx`, para no redactar el
  mismo título dos veces.
- `useDownloadFailureToasts()` en `src/ui/lib/downloads.ts` — vigila
  `useQueue()` y avisa del **primer** archivo que empieza a fallar (no de
  los que ya estaban fallados), agrupando en un solo toast si fallan varios
  a la vez. Se monta en `Home.tsx` y no en `Downloads.tsx`: una descarga
  puede fallar mientras el estudiante está en otra pantalla, y ahí es donde
  el texto rojo de la fila no servía de nada.

**Lo que NO cambió, a propósito**: la lista de "carpetas que no pude leer"
dentro de `ExplorationReport` (en `DrivePanel.tsx`) y el aviso de adjuntos
que faltan en `CourseDetail.tsx`. Son información sobre lo que se encontró,
no un fallo que bloquee la acción, y convertirlos en modal habría sido
intrusivo por algo que ya se lee bien donde está.

**3 · Modal de donación**, con el mismo QR del pie
(`public/apoyo/yape.png`, sin generar uno nuevo). Dispara a los dos minutos
de uso con sesión conectada, o justo al terminar una descarga —lo que llegue
antes—, y no más de una vez por apertura de la extensión.
`src/ui/store/donation.ts` lleva el `shown`/`open` **en memoria**, no en
`storage.local`: es una pregunta que solo importa mientras dura la pestaña
abierta, no un dato que tenga sentido guardar junto al token o la cola.
`src/ui/lib/donation.ts` tiene los dos relojes —el de dos minutos y el que
mira `useQueue()` para detectar que la cola pasó de corriendo a parada con
algo `done`—, los dos solo activos con sesión conectada. Reutiliza
`.velo`/`.modal` de `ui.css`, que existían en la skill desde el principio
pero nadie los había usado todavía: se les añadió el centrado
—`display:flex` en `.velo`, que no lo traía— porque sin eso el modal caía
arriba a la izquierda. Cierra con Escape y devuelve el foco a donde estaba,
como pide `suki-product-ui`. Un solo botón, *Ahora no*, tan visible como el
QR: no hay una acción "afirmativa" que compita con él porque no hay nada que
confirmar dentro de la extensión, Yape es escanear con el teléfono.

**El texto queda provisional.** Tres variantes con el tono del pie, a la
espera de que Elis elija:

> A · "¿Te ahorró trabajo esto?" — Escanea el código con Yape si quieres
> invitarme un café. Es un aporte voluntario a quien mantiene esto, no un
> pago por usarlo: la extensión sigue siendo gratis lo escanees o no.
>
> B · "Un café, si quieres" — IsilHelper es gratis y se queda así. Si te
> sirvió y te sobra un sol, este es el Yape de quien lo mantiene. Si no,
> cierra esto y sigue con lo tuyo.
>
> C · "Ya que estás por aquí" — Esto no te pidió nada para funcionar, pero
> mantenerlo sí cuesta tiempo. Si quieres devolver algo, aquí está el Yape.
> Si no, ningún problema: sigue bajando tus cursos.

**Elis eligió la C, «Ya que estás por aquí», la misma tanda.** Puesta en
`DonationModal.tsx`.

`typecheck`, `lint`, `test` (210, sin tests nuevos: es UI, y
`CONVENTIONS.md` no exige cobertura ahí) y los dos builds en verde.
Verificado visualmente con capturas estáticas del CSS ya compilado —navbar en
una fila a 1280 px y a 600 px, toasts apilados, modal centrado y en columna a
480 px—, no cargando la extensión de verdad en un navegador: la máquina
sigue con poca memoria libre después de la tanda de Firefox de hoy.

### Fase 4 · lo que hace falta para publicar

**Interfaz.**

- **Los cinco puntos salen de la cabecera.** El logotipo del pie se queda, que
  es donde la skill pone la firma de respaldo. La cabecera se queda solo con el
  nombre del producto, que es de quien tiene que ser esa zona
- **Foto de perfil**, de `profileimageurl`, sin ninguna petición nueva a la
  API: sale de la misma llamada que ya traía correo y `department`
- `src/lib/avatar.ts` — puro: si la URL es el avatar genérico de Moodle y las
  iniciales del nombre. 10 tests
- `src/api/avatar.ts` — la descarga: token pegado, comprobación de
  `Content-Type` y conversión a `data:`. 7 tests
- `waitForTurn()` exportado desde `client.ts`, para que la foto respete la
  misma pausa de 600 ms que el resto

**Apoyo económico.**

- QR de Yape en el pie de la extensión, a 128 px, junto al enlace al
  repositorio. `public/apoyo/yape.png`, 21 KB, reducido desde
  `assets/QR Yape.jpg` y **verificado con `zbarimg`**: el código reducido
  lleva exactamente el mismo contenido que el original
- `src/ui/components/Footer.tsx`, sacado de `Home.tsx` para no pasar de las
  ~150 líneas que pide `CONVENTIONS.md`
- Sección «Apoyar el proyecto» en el README, con el mismo QR y la misma frase

**Ficha de tienda.** `context/tienda.md`: título, descripción breve y
descripción larga para Chrome Web Store y Firefox AMO, con los caracteres ya
contados contra el límite de cada campo, las etiquetas de AMO, las notas para
quien revisa, y las cinco capturas con lo que tiene que demostrar cada una.

**Legal.** `LEGAL.md` y `PRIVACY.md`, en documentos aparte para que la tienda
pueda enlazarlos —Chrome Web Store exige una URL de política de privacidad— y
enlazados los dos desde el README.

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
| Los cinco puntos salen de la cabecera | El logotipo del pie ya es la firma de respaldo, y era el segundo sitio en la misma pantalla donde hablaba la marca madre. La cabecera es del producto |
| **La foto se baja en el worker y cruza como `data:`** | Su URL va a `pluginfile.php` y necesita el token pegado. Pasarle la URL a la pestaña dejaría el token escrito en el DOM, a la vista en el inspector: es la regla 4 rota en un sitio nuevo, igual que lo estaba en el historial de descargas |
| Un 200 con HTML tampoco es una foto | Es el mismo fallo que ya se cazaba en las descargas. Sin la comprobación, el `<img>` sale roto y no dice por qué |
| El avatar genérico no se descarga | El muñeco gris de Moodle no dice quién es nadie y cuesta 600 ms de pausa. Las iniciales dicen más y no cuestan ninguna petición |
| La foto falla en silencio | Es lo menos importante de la cabecera. Un aviso de «no se pudo cargar tu foto» manda a arreglar algo que no hace falta arreglar |
| El avatar es cuadrado, con radio 0 | El círculo es la excepción reservada a los cinco puntos y a la cajita del logotipo. Redondearlo sería traerse una convención de fuera solo porque «los avatares se hacen así» |
| Sin código de alumno, carrera ni ciclo en la cabecera | Sigue sin haber fuente (`domain.md` §4). Rellenarlo sería inventarlo, que es justo lo que tumbó la pantalla de perfil |
| El QR va en el pie y dice que es voluntario | Un código de pago en una herramienta gratuita se lee como un peaje si no se dice lo contrario. Y va abajo porque una petición no se pone delante de lo que el estudiante vino a hacer |
| Solo Yape, sin PayPal | Decisión de Elis el 7 de septiembre de 2026 |
| El QR se reduce a 320 px y se verifica decodificándolo | Un QR redimensionado que ya no escanea falla en silencio y nadie se entera hasta que alguien lo intenta. `zbarimg` confirma que el contenido es idéntico al del original |
| `LEGAL.md` y `PRIVACY.md` aparte del README | Chrome Web Store exige una **URL** de política de privacidad, y un ancla dentro del README no sirve. Además el registro son dos: el del README es cercano y tutea; el de la tienda es formal |
| El nombre de ISIL en el título de la tienda queda **sin decidir** | Contradice lo escrito en `project.md` y es una decisión de marca, no de código. La recomendación —usarlo, con tres condiciones— está en `context/tienda.md` |
| Licencia MIT | Decisión de Elis el 7 de septiembre de 2026. `LICENSE` sin modificar: un texto no estándar puede confundir a las herramientas que detectan la licencia |
| `gecko.id` es un UUID, no `isilhelper@suki.com.pe` | El dominio no existe —WHOIS de NIC.PE, comprobado— y un id con forma de correo sobre un dominio ajeno o inexistente reclama algo que no es. El UUID no tiene forma de dirección, así que no insinúa nada |
| Dos builds —`dist/` y `dist-firefox/`— en vez de un manifest con `service_worker` y `scripts` juntos | `@crxjs/vite-plugin` reemplaza `manifest.background` entero según la opción `browser` de `crx()`; nunca deja los dos campos a la vez, así que un solo manifest no alcanza. `vite.config.ts` decide `browser` y `outDir` por `mode`, y `manifest.config.ts` es función de ese mismo `env` para la forma de `background` |
| `manifest.config.ts` pasa de objeto a función `(env) => ({...})` | Es lo que permite que la forma de `background` dependa de a qué navegador apunte el build, sin el cast que hacía falta cuando se intentó meter `service_worker` y `scripts` en el mismo objeto estático |
| La pausa es de cada archivo (`QueueStatus: "paused"`), no una bandera de la cola | Una bandera global (`QueueState.paused`) era justo el bug: pausar el curso A dejaba el curso B sin poder arrancar hasta reanudar el A a mano. `claimNext` solo mira si hay algo `"active"`, y un archivo pausado no lo es, así que deja de bloquear a los que vienen detrás |
| Reanudar relanza desde cero, no continúa donde se quedó | Seguir de verdad exigiría que Moodle o Drive acepten una petición por rango bien después de la pausa, sin comprobar. `retryQueue` ya restaba desde cero ante un fallo del servidor; reanudar sigue el mismo criterio ya probado en vez de uno nuevo sin probar |
| Reanudar cancela y borra del historial la descarga vieja antes de relanzar | Si se abandona sin cancelar, esa entrada nunca pasa por el cierre normal de `settle` —el que borra la anotación del historial— y se queda ahí con el token pegado a la URL, a la vista en `chrome://downloads`. Es la regla 4 en un sitio nuevo |
| «Pausar» y «Seguir descargando» dejan de ser el mismo botón según una bandera | Con la pausa por archivo pueden coexistir un archivo bajando —al que pausar tiene sentido— y otro en pausa de antes —al que reanudar tiene sentido—. Un solo botón que se turnaba por una bandera global ocultaría uno de los dos casos |

---

## Pendiente de resolver

- [ ] **Volver a probar la exploración de Drive en los dos cursos afectados**
      (`1582 DIRECCION DE PERSONAS`, `2016 GESTION DE PROYECTOS`) con el fix
      de `exploreCourseDrive` ya en `dist/`. Debería encontrar los 16
      enlaces, no solo 1
- [ ] **Confirmar si el segundo bug —la descarga que no deja fila— sigue
      pasando después de ese fix.** La hipótesis de Elis es que era un efecto
      colateral: con la mayoría de enlaces perdidos en silencio, "1 archivo"
      podía ser un estado ya raro de por sí. Si se repite, el siguiente paso
      es añadir `console.log` temporal en el handler del botón
      (`DrivePanel.tsx`) y en `enqueue()` (`background/downloads.ts`), no
      antes: revisados los dos ahora y no se encontró ningún descarte en
      silencio para un archivo real, así que sin una reproducción de verdad
      no hay más que investigar por lectura de código
- [x] ~~**Elegir la variante del texto del modal de donación.**~~ La C, «Ya
      que estás por aquí», elegida por Elis el 7 de septiembre de 2026 entre
      las tres. Puesta en `DonationModal.tsx`
- [ ] **Probar el navbar, los toasts y el modal de donación cargando la
      extensión de verdad**, no solo con las capturas estáticas del CSS
      compilado. En particular: que el modal dispare de verdad a los dos
      minutos y justo tras una descarga, y que no vuelva a salir si se
      recarga la misma pestaña de la interfaz antes de cerrarla del todo
      —el estado vive en memoria de React, así que un recarga de la
      pestaña sí lo resetea; solo no se repite mientras la pestaña siga
      abierta sin recargar—
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
- [x] ~~**Elegir licencia.**~~ MIT, decidida por Elis el 7 de septiembre de
      2026. `LICENSE` en la raíz, referenciada desde `README.md` y desde
      `package.json` (`"license": "MIT"`)
- [x] ~~**Añadir `browser_specific_settings.gecko.id`.**~~ Hecho el 7 de
      septiembre de 2026. `suki.com.pe` **no existe** —WHOIS oficial de
      NIC.PE, `Domain Status: No Object Found`, comprobado por socket directo
      al puerto 43 porque no había `whois` instalado—, así que en vez de un
      id con forma de correo en un dominio que nadie tiene registrado se usó
      un UUID: `{16b473de-2512-4882-b610-319e856625d4}`. Es el otro formato
      que Firefox acepta explícitamente y no insinúa un dominio que no existe
- [x] ~~**Añadir `gecko.data_collection_permissions`.**~~ Hecho el mismo día:
      `{ required: ["none"] }`, junto al `gecko.id` en el mismo bloque
- [x] ~~**`background.scripts` como respaldo de `background.service_worker`,
      para Firefox.**~~ Resuelto el 7 de septiembre de 2026, con **dos
      builds** en vez de un manifest con los dos campos —eso no funcionaba,
      ver más abajo—: `pnpm build` (Chrome/Brave → `dist/`,
      `service_worker`) y `pnpm build:firefox` (Firefox → `dist-firefox/`,
      `scripts`). `vite.config.ts` decide `browser` según `mode` (Vite lee
      `--mode firefox` del script `build:firefox`) y pasa `outDir` a juego;
      `manifest.config.ts` pasó de objeto estático a función
      `(env) => ({...})` que refleja la misma decisión para la forma de
      `background` —sin necesitar ningún cast, porque ahora cada rama del
      condicional tiene la forma exacta que `defineManifest` espera—.
      `eslint.config.js` necesitó `dist-firefox` en `ignores` junto a `dist`,
      que estaba a mano y no por patrón. `web-ext lint -s dist-firefox`:
      **cero errores** — `BACKGROUND_SERVICE_WORKER_NOFALLBACK` ya no
      aparece, y tampoco los dos que se habían resuelto antes
      (`ADDON_ID_REQUIRED`, `MISSING_DATA_COLLECTION_PERMISSIONS`). Quedan
      dos avisos de `innerHTML`, de React empaquetado, no de código propio
- [ ] **Probar el flujo de conexión y una descarga real, en Chrome y en
      Firefox, contra la cuenta real de ISIL.** Decisión de Elis: lo corre él,
      a mano, ahora que `dist-firefox/` instala limpio según `web-ext lint`.
      No relanzar la prueba pesada en Firefox desde una sesión de Claude en
      esta máquina sin que él la lance manualmente —ver la nota de memoria
      más abajo—. Es la única pieza que falta para saber si
      `webextension-polyfill` hace falta de verdad
- [ ] **Decidir el título de la ficha de tienda** y, si se acepta el que se
      recomienda, aplicarlo en `manifest.config.ts` y `package.json`
- [ ] **Hacer las cinco capturas** de `context/tienda.md`, a 1280 × 800 y sin
      datos personales a la vista
- [ ] **Escanear el QR del pie con Yape de verdad.** Verificado con `zbarimg`,
      que comprueba el código pero no que la aplicación lo acepte
- [ ] **Ver la foto de perfil contra la cuenta real**, y que su `src` empiece
      por `data:` y no por la URL de la plataforma
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
- **La máquina se queda sin memoria con Firefox de prueba abierto.** Pasó el
  7 de septiembre de 2026: con Brave del propio Elis ya abierto (decenas de
  procesos `renderer`) y VS Code con el servidor de lenguaje de Java
  corriendo, la memoria disponible ronda 500-700 MB. Un `web-ext run` con
  Firefox headless más un servidor Python auxiliar bastó para que el
  sistema matara procesos por falta de memoria. **No relanzar pruebas de
  Firefox con `web-ext run` (ni nada que abra un navegador de verdad) desde
  una sesión de Claude en esta máquina sin que Elis las lance él mismo** y
  sepa que va a pasar. Si hace falta comprobar algo de Firefox sin abrirlo,
  `web-ext lint -s dist` es liviano y no tiene este problema.

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

**2026-09-07 · 07:30** — Cuatro frentes para poder publicar, y ninguno es la
descarga: el producto ya está y lo que falta es la tienda.

**Los cinco puntos salen de la cabecera.** Estaban repetidos —el logotipo del
pie ya es la firma de respaldo— y la cabecera tiene que ser del producto, no de
la marca madre. En su lugar entra **la foto de perfil**, que no cuesta ninguna
petición nueva a la API: sale de la misma llamada que ya traía correo y
`department`. Lo que sí cuesta es bajar la imagen, y ahí estaba lo que no se ve
venir: **su URL va a `pluginfile.php`, así que lleva el token pegado**. Pasarle
esa URL a la pestaña habría dejado el token escrito en el DOM, a la vista en el
inspector de cualquiera — la regla 4 rota en un sitio nuevo, exactamente igual
que lo estaba en el historial de descargas. Así que la foto se baja **en el
service worker** y cruza ya convertida en `data:`. De paso, tres cosas más: un
200 con HTML no es una foto y se caza mirando el `Content-Type`, igual que en
las descargas; el avatar genérico de Moodle no se baja porque el muñeco gris no
dice quién es nadie y las iniciales sí; y la foto **falla en silencio**, porque
es lo menos importante de la pantalla y un aviso de «no se pudo cargar tu foto»
manda a arreglar lo que no hace falta arreglar. Cuadrada y con radio 0: el
círculo es la excepción de los cinco puntos y de la cajita, y redondearla sería
importar una convención de fuera solo porque los avatares se hacen así.

**Apoyo económico.** QR de Yape en el pie, pequeño, con el enlace al
repositorio al lado. La frase salió de tres candidatas y ganó «Si te ahorró la
tarde, invítame un café» por ser la única que nombra lo que la herramienta
acaba de hacer por ti en vez de hablar de quien la mantiene. Debajo, la nota
que evita que un código de pago en una herramienta gratuita se lea como un
peaje: aporte voluntario, no pago por usarlo. El QR se redujo de 2 236 a 320 px
y **se verificó decodificándolo con `zbarimg`**, porque un QR redimensionado
que ya no escanea falla en silencio: el contenido es idéntico al del original.
Solo Yape, sin PayPal, por decisión de Elis.

**Ficha de tienda** en `context/tienda.md`, con los caracteres contados contra
el límite de cada campo. Un detalle que cambia dónde se escriben las cosas: en
Chrome Web Store **el título y la descripción breve no se escriben en el panel,
salen del manifest**, así que aplicarlos es editar `manifest.config.ts` y
`package.json`. Y una decisión que no se toma sola: meter «ISIL» en el título
contradice lo que decidió `project.md` en su día. Queda recomendada —con las
tres condiciones que la dejan fuera de duda— y sin aplicar.

**Legal** en dos documentos aparte, `LEGAL.md` y `PRIVACY.md`, y no como
sección del README: Chrome Web Store pide una **URL** de política de
privacidad y un ancla dentro del README no vale. Los dos van en registro
formal, que es lo que pide la skill de voz para un documento legal; el README
se queda con su versión cercana y enlaza a los dos. 210 tests.

**2026-09-07 · 09:45** — Cerradas las cuatro correcciones que pidió Elis sobre
la tanda anterior de documentación.

**1 · Manifest huérfano borrado.** El `manifest.json` de la raíz —el mismo que
se había commiteado vacío por accidente— tenía desde antes de esta tanda un
`browser_specific_settings.gecko.id` escrito a mano, sin ningún efecto real:
`@crxjs/vite-plugin` lo ignora explícitamente. Se borró. Verificado sin
comprometer nada del historial: `git stash create` genera un commit
desechable con el estado actual del árbol de trabajo, sin mover `HEAD` ni la
rama, y un `git archive` sobre ese commit confirma que `manifest.json` ya no
aparece. El `.zip` de código fuente para AMO deja de tener el archivo
contradictorio que `docs/SOURCE_SUBMISSION.md` advertía.

**2 · Probado en Firefox de verdad, y salió un bloqueo real.** Con `web-ext`
—instalado vía `npx`, no estaba en el proyecto— y Firefox 153 en modo
`--headless`. Dos hallazgos, y el primero cambia el plan:

- **El manifest tal como está no instala en Firefox, y no es un problema de
  `chrome.*` sin polyfill.** Falla antes de que corra una sola línea de
  `src/`: `background.service_worker is currently disabled. Add
  background.scripts.` Firefox tiene el service worker de MV3 detrás de un
  flag desactivado por defecto (`extensions.backgroundServiceWorker.enabled`,
  confirmado extrayendo la cadena del propio binario) y exige un
  `background.scripts` de respaldo, que el manifest no tiene. `web-ext lint`
  ya lo marcaba como error (`BACKGROUND_SERVICE_WORKER_NOFALLBACK`) junto con
  otro más serio: `ADDON_ID_REQUIRED`, que dice que un `gecko.id` ya no es
  "algún día" sino obligatorio ahora para cualquier manifest V3 en Firefox.
  Ninguno de los dos se corrigió: son cambios de `manifest.config.ts`, y esta
  tanda era de documentación más las cuatro correcciones puntuales que pidió
  Elis, no una carta abierta para tocar el manifest. Quedan en pendientes,
  con el criterio a decidir por Elis.
- **Una vez sorteado ese bloqueo —parcheando solo `dist/manifest.json`, el
  artefacto de build, nunca `manifest.config.ts`, solo para poder seguir
  probando—, lo que sí se pudo verificar salió bien.** El módulo del service
  worker evalúa entero sin lanzar —lo que ya dice que
  `chrome.webRequest.onBeforeRedirect.addListener(...)` no truena al
  registrarse—, y `chrome.storage.local.set/get/remove` funciona igual que en
  Chrome, sin ningún rastro de necesitar `webextension-polyfill`. Un intento
  de mensajería propio (el background enviándose un mensaje a sí mismo) salió
  mal, pero es un artefacto de la prueba y no una señal real: `runtime.
  sendMessage` no entrega al mismo contexto que lo envía, en ningún
  navegador, y la arquitectura real nunca hace eso —es la pestaña de la
  interfaz la que le habla al background, dos contextos distintos—. Y
  `chrome.downloads.download()` rechazó una URL `data:`, que es una
  restricción propia de Firefox y documentada (bug 1247919 de Mozilla), y
  tampoco es una señal real: el código de verdad nunca le pasa un `data:` a
  esa función, solo URLs `https://`.
- **Lo que no se llegó a probar:** el flujo real UI → background —abrir la
  pestaña de la interfaz de verdad y ver si consigue hablar con el
  background, que es la arquitectura real y la prueba que de verdad importa—
  y una descarga con una URL `https://` real. Se montó un servidor local
  mínimo para recibir el reporte de la sonda sin depender de la cuenta real
  de ISIL, y a mitad de la segunda tanda la máquina —que es el equipo de
  Elis, no un entorno aislado— llegó al límite de memoria y mató el proceso
  del servidor. Se decidió no reintentarlo: ya había un Firefox suelto de la
  corrida anterior consumiendo memoria de más, se mató, y se prefirió no
  arriesgar una segunda vez sobre una máquina con el navegador y el editor
  del propio Elis ya abiertos, en vez de forzarlo. **Sin cuenta real de ISIL,
  tampoco se podía completar el flujo de conexión de verdad ni una descarga
  de un curso real**, así que esa parte queda pendiente de todos modos y la
  tiene que correr Elis.

  **Con lo que sí se probó, la recomendación es no añadir
  `webextension-polyfill` todavía.** Cero señales de que `chrome.*` se
  comporte distinto en Firefox de lo que se ve en Chrome, en todo lo que se
  llegó a ejercitar. Lo que bloquea Firefox hoy es el manifest, no el código.
  `context/project.md` no se tocó: la mención de "Firefox casi gratis" sigue
  en pie porque nada de lo probado la contradice, pero la frase sigue sin
  verificación completa hasta que alguien corra el flujo entero contra una
  cuenta real.

**3 · Licencia MIT.** `LICENSE` en la raíz, texto estándar sin modificar —una
versión no estándar puede confundir a las herramientas que detectan la
licencia automáticamente, GitHub incluido—. `"license": "MIT"` en
`package.json`. Referenciada desde el README, con una aclaración que no sobra:
la licencia cubre el código, no el nombre de ISIL, que no es de este proyecto
para licenciar.

**4 · `domain.md` §2 corregido.** La tercera razón que daba para
`host_permissions` sobre `platform.ecala.net` —"las descargas de
`pluginfile.php` de la Fase 2 también"— se contradecía con lo que el propio
documento establece más abajo, en §6: `chrome.downloads.download` no exige
permiso de host sobre la URL que descarga. La razón real que faltaba era otra:
la foto de perfil (`webservice/pluginfile.php`, `src/api/avatar.ts`) es un
`fetch` de la extensión, no una descarga, y a diferencia de `server.php` no
está verificado que responda `Access-Control-Allow-Origin: *`, así que ahí el
permiso de host puede sostener la lectura de verdad y no ser solo un respaldo.
`docs/PERMISSIONS.md` se ajustó en el mismo sentido para que los dos
documentos usen el mismo criterio.

**Herramientas nuevas usadas, sin quedar instaladas en el proyecto:**
`web-ext` (linter y runner oficial de Mozilla, vía `npx`) para el lint y la
carga real en Firefox.

**2026-09-07 · 10:30** — Las tres ediciones a `manifest.config.ts` que Elis
aprobó tras el resumen anterior, y un hallazgo que cambia el plan de una de
ellas.

**El `gecko.id` no usa `suki.com.pe`.** Elis pidió confirmar que el dominio
existiera antes de usarlo. No existe: consultado el WHOIS oficial de NIC.PE
por socket directo al puerto 43 —no había `whois` instalado—, devuelve
`Domain Status: No Object Found`. En su lugar, un UUID:
`{16b473de-2512-4882-b610-319e856625d4}`, el otro formato que Firefox acepta
para este campo y que no reclama un dominio de nadie. Junto con él,
`gecko.data_collection_permissions: { required: ["none"] }`, tal como pidió
Elis: no hay servidor propio que recoja nada.

**El `background.scripts` de respaldo no se pudo escribir en
`manifest.config.ts`, y no por falta de intento.** Se escribió el campo —con
un cast, porque el tipo de `defineManifest` no admite `service_worker` y
`scripts` a la vez— y compiló. Pero el manifest que sale de `pnpm build` no lo
llevaba. La razón está en el propio `@crxjs/vite-plugin`: el hook
`renderCrxManifest`, en el plugin `crx:background-loader-file`
(`dist/index.mjs` del paquete), **reemplaza `manifest.background` entero**
por `{service_worker, type}` o por `{scripts, type}` según una opción
`browser` que se le pasa a `crx()` en `vite.config.ts` —por defecto
`"chrome"`—, nunca por los dos a la vez. Lo que se escribiera en
`manifest.config.ts` para `scripts` no iba a sobrevivir el build pasara lo
que pasara, y seguir insistiendo con variaciones del mismo archivo no lo iba
a arreglar: es un límite del plugin, no de la sintaxis. Se retiró el campo
—dejarlo habría sido peor que no tenerlo, porque parece que hace algo y no
hace nada— y se dejó un comentario largo explicando el porqué, con las dos
salidas reales: una segunda pasada de build con `browser: "firefox"` (dos
manifests, dos carpetas), o un paso posterior al build que le pegue `scripts`
al `dist/manifest.json` ya generado. Las dos tocan `vite.config.ts` y son una
decisión de arquitectura del build —qué comando produce qué, y cuál salida
va a cada tienda—, así que se quedaron sin aplicar en vez de decidirlas por
cuenta propia.

`web-ext lint -s dist` después del cambio: **un solo error**,
`BACKGROUND_SERVICE_WORKER_NOFALLBACK`, que es justo el pendiente de arriba.
`ADDON_ID_REQUIRED` y `MISSING_DATA_COLLECTION_PERMISSIONS` ya no aparecen.
Quedan dos avisos de `UNSAFE_VAR_ASSIGNMENT` sobre `innerHTML`, que no salen
de `src/`: los cinco usos de `innerHTML` en el bundle de la interfaz vienen de
React empaquetado, no de código propio. `typecheck`, `lint`, `test` (210) y
`build` en verde.

**No se relanzó la prueba pesada de Firefox.** Elis pidió no reintentarla sin
que él la lance a mano, y de todas formas ahora es su turno: corre él el
flujo de conexión y una descarga real contra su cuenta de ISIL, en Chrome y
en Firefox. Anotado en «Notas de entorno» el aviso de memoria para la próxima
vez, con lo que se vio: Brave y VS Code de Elis ya dejan la máquina en
500-700 MB disponibles, y un `web-ext run` con Firefox headless basta para
que el sistema mate procesos.

**2026-09-07 · 11:15** — `background.scripts` resuelto con dos builds
separados, como pidió Elis explícitamente en vez del parche posterior al
build que se había dejado como alternativa.

`vite.config.ts` pasó de un objeto estático a una función de `mode`: decide
`browser` —`"firefox"` cuando el modo es `firefox`, `"chrome"` en cualquier
otro caso, así que `pnpm dev` no cambia— y con él, `outDir`. `crx({ manifest,
browser })` es la opción que el propio plugin ya traía para esto
(`@crxjs/vite-plugin`, tipo `Browser = 'firefox' | 'chrome'`); no hacía falta
inventar nada, solo usarla.

`manifest.config.ts` tuvo que dejar de ser un objeto y pasar a ser una
función `(env) => ({...})`, porque `defineManifest` también acepta esa forma
—`ManifestV3Define`, ya estaba en sus tipos— y es la única manera de que
`background` salga con la forma correcta en cada build sin escribir las dos a
la vez en el mismo objeto: ahora cada rama del condicional (`service_worker`
para Chrome, `scripts` para Firefox) es exactamente lo que `defineManifest`
espera, así que **el cast que hizo falta en la tanda anterior ya no hace
falta**. El resto del manifest —permisos, iconos, `browser_specific_settings`
con el `gecko.id` y `data_collection_permissions`— es igual para los dos
builds y se queda fuera del condicional.

Un efecto colateral que no se veía venir: `eslint.config.js` ignoraba `dist`
por nombre literal, no por patrón, así que en cuanto apareció `dist-firefox/`
el lint intentó analizar el bundle minificado como si fuera código propio y
tiró 1116 errores. Se añadió `dist-firefox` a la lista de `ignores`, al lado
de `dist`.

`docs/SOURCE_SUBMISSION.md` reescrito para que todo apunte a
`dist-firefox/` y a `pnpm build:firefox`, que es lo que de verdad se sube a
AMO; de paso se retiró la sección sobre el `manifest.json` huérfano de la
raíz, que ya no existe —se borró en la tanda anterior— y ya no aportaba nada.
`docs/PERMISSIONS.md` ganó una nota de que hay dos manifests generados y que
la tabla de permisos aplica a los dos por igual, porque `permissions` y
`host_permissions` no dependen del navegador. `README.md` y `CLAUDE.md`
llevan ahora los dos comandos de build y las dos rutas de instalación,
Chrome/Brave y Firefox por separado.

`web-ext lint -s dist-firefox`: **cero errores.** Los tres que había al
empezar el día —`BACKGROUND_SERVICE_WORKER_NOFALLBACK`,
`ADDON_ID_REQUIRED`, `MISSING_DATA_COLLECTION_PERMISSIONS`— están resueltos
los tres. Quedan dos avisos de `innerHTML` que vienen de React empaquetado,
no de `src/`. `typecheck`, `lint`, `test` (210), `pnpm build` y
`pnpm build:firefox` en verde, los dos comprobados desde cero.

**No se relanzó la prueba pesada de Firefox**, tal como pidió Elis: la corre
él mismo ahora que el lint sale limpio.

**2026-09-07 · 12:00** — Tres ajustes de UI que pidió Elis: navbar en una
fila, avisos que ya no se pueden ignorar, y un modal de donación. Detalle
completo en «Hecho · Interfaz». Nada de esto tocó `src/api/`,
`src/background/` ni el parsing de Drive —se leyeron los componentes reales
antes de escribir nada, como pidió—.

Lo nuevo que no era obvio: `.velo`/`.modal` estaban en `ui.css` desde el
principio, copiados de la skill, y nadie los había usado —este es el primer
modal real de la extensión—, así que les faltaba el centrado. Y el intento
más simple de probar el toast de fallo de descarga —el propio background
enviándose un mensaje— habría sido el error equivocado otra vez: se aprendió
en la tanda de Firefox que eso no refleja la arquitectura real, así que aquí
se fue directo a la fuente correcta, `useQueue()`.

Verificado con capturas estáticas del CSS compilado, enviadas a Elis; no se
cargó la extensión en un navegador de verdad porque la máquina seguía baja
de memoria tras la prueba de Firefox de la mañana. Elis eligió la variante
C del texto del modal, «Ya que estás por aquí», nada más ver las capturas.
Queda pendiente que lo pruebe cargado de verdad.

**2026-09-07 · 13:30** — Bug real encontrado y corregido: la exploración de
Drive perdía en silencio la mayoría de los enlaces de dos cursos, sin dejar
ningún rastro.

**El diagnóstico de la ronda anterior sobre el parser de Moodle no era el
bug** —Elis lo descartó con una captura real de la carpeta de Drive— y el
segundo intento fue directo al scraper. Se confirmó **sin pedirle nada a
Elis**: `~/Descargas/IsilHelper/` está en esta misma máquina, y el
`metadata.json` que ya genera la extensión trae la URL completa de cada
enlace de Drive del curso. Con eso:

- `1582 DIRECCION DE PERSONAS (VIR)` y `2016 GESTION DE PROYECTOS (SPR)`
  —los dos cursos afectados, los dos con solo `metadata.json` en disco y
  nada de contenido bajado— tienen **14 de 16 enlaces de Contenidos en forma
  `https://drive.google.com/open?id=<id>`**, y 2 en `/drive/folders/<id>`.
- `3684 ANALISIS Y DISEÑO DE SISTEMAS BASICO (PRE)` —que bajó sus 15 PPTX sin
  problema— tiene los 16 en `/drive/folders/<id>`, cero `open?id=`.

Probado el clasificador real (`classifyDriveUrl`) contra esas URLs exactas:
`open?id=` cae en `kind: "ambiguous"`, tal como está pensado. El bug no
estaba en clasificar mal —eso ya lo cubría un test—, estaba en lo que
`exploreCourseDrive` hacía con un `ambiguous` de curso: lo trataba como
archivo suelto sin preguntarle nada a Drive, y si no resolvía a una URL de
descarga lo descartaba **sin petición, sin problema registrado, sin ningún
rastro**. Es justo lo que `domain.md` §6 llevaba un día diciendo que había
que evitar («los ambiguos hay que resolverlos consultando a Drive... tratarlos
como archivo por defecto falla») sin que el código lo hiciera todavía.

**No es un problema de modalidad de curso** en el sentido de que Moodle
organice distinto el contenido: es la vía que usó quien compartió la carpeta.
`GESTION DE DISPOSITIVOS TECNOLOGICOS`, también «SPR», sí funcionaba —usaba
enlaces normales—, así que la etiqueta VIR/SPR/PRE no predice nada por sí
sola.

**El fix**, en `exploreCourseDrive` (`src/background/drive.ts`): un
`ambiguous` ahora se intenta recorrer como carpeta con `walkFolder`, igual
que un `folder` de verdad. `embeddedfolderview` con un id que en realidad es
de un archivo no tiene ningún `flip-entry`, así que produce una firma
reconocible —cero carpetas leídas, cero archivos, un solo problema de tipo
`shape`—; solo ahí se admite que era un archivo y se encola como tal.
Cualquier otro resultado —contenido real, o un fallo genuino como `login`—
se trata como una carpeta normal, con su problema si corresponde. La función
gana un tercer parámetro `read: FolderReader`, inyectable solo para tests,
con el mismo patrón que ya usa `walkFolder`.

**No había ningún test de `exploreCourseDrive`** —el archivo de tests solo
cubría los dos helpers puros, `driveFileName` y `drivePath`—, así que el
bug pasó 210 tests sin que ninguno lo viera. Escritos 7 tests nuevos,
incluido uno que reproduce la forma exacta de los dos cursos reales (16
enlaces, 14 en `?id=`, ninguno se pierde). 217 en total.

**El segundo bug —la descarga que no deja ninguna fila— se investigó sin
tocar código**, como pidió Elis. El botón "Descargar 1 archivo" lee
`result.files` del mismo render que pinta el número, así que no hay forma de
que muestre "1" con un array vacío detrás: la hipótesis de datos obsoletos
queda descartada. `enqueue()` tampoco tiene ningún descarte silencioso para
un archivo nuevo: el único filtro es contra lo que ya está en la cola de esta
sesión. Sin un bug visible en ninguno de los dos, y con la sospecha de Elis
de que era un efecto colateral del bug de arriba, se dejó así: **sin
`console.log` todavía**, a la espera de que se vuelva a probar con el fix de
Drive puesto. Si se repite, el siguiente paso es logging temporal en esos
dos puntos exactos, no antes.

`typecheck`, `lint`, `test` (217) y los dos builds en verde. `domain.md` §6
actualizado con la causa confirmada y el arreglo. Ningún archivo tocado
fuera de `src/background/drive.ts` y su test.

**2026-09-07 · 14:15** — Segundo bug de lógica confirmado y corregido: pausar
una descarga bloqueaba la cola entera, no solo esa descarga.

**La causa era literal.** `QueueState.paused` (`src/lib/storage.ts`) era una
bandera booleana de la cola entera, y `claimNext()` la miraba antes de sacar
cualquier archivo nuevo: `if (state.paused) return null;`. Pausar el archivo
activo de un curso ponía esa bandera en `true`, y hasta que alguien la
volviera a poner en `false` con "Seguir descargando", **nada** podía arrancar
—ni el resto del mismo curso, ni un curso distinto encolado después—. Y aunque
se hubiera quitado esa línea sola, el archivo pausado seguía marcado
`status: "active"` en el modelo propio —pausar no lo cambiaba—, así que
también habría seguido bloqueando por el otro filtro de `claimNext`
(«no reservar nada mientras algo esté activo»). Hacían falta las dos cosas.

**El arreglo:** `"paused"` pasa a ser un `QueueStatus` más, del archivo, no de
la cola. `QueueState` pierde el campo `paused` por completo —vive ahora en
`storage.ts` como comentario de por qué no está—. `claimNext` sigue sin
reservar nada mientras haya un `"active"`, pero un `"paused"` no cuenta como
tal, así que dos minutos después de pausar el curso A, el curso B arranca
solo. `claimNext` tampoco toma nunca un `"paused"` como si fuera `"pending"`:
un archivo pausado se queda pausado hasta que alguien lo reanuda a propósito,
no en cuanto le toca el turno —si tomara lo que encuentra primero, se habría
auto-reanudado sin que nadie lo pidiera, que es el error contrario al que se
está corrigiendo—.

**Reanudar cambió de forma, no solo de nombre.** Antes llamaba a
`chrome.downloads.resume()` sobre el id pausado, confiando en seguir
descargando desde donde se quedó. Ahora **cancela esa descarga vieja, la
borra del historial, y relanza el archivo desde cero** —exactamente lo mismo
que ya hacía `retryQueue` ante un fallo del servidor—. Dos motivos: preservar
los bytes ya bajados exigiría que Moodle o Drive acepten una petición por
rango bien después de la pausa, que no está comprobado en ningún sitio de
este proyecto; y si se abandonara la descarga vieja sin cancelarla, esa
entrada nunca pasaría por el cierre normal de `settle()` —el que borra la
anotación del historial—, y se quedaría en `chrome://downloads` con el token
pegado a la URL, sin que nada la limpiara. Es la regla 4 en un sitio donde no
se había pensado, igual que pasó con el historial de descargas en la Fase 2.

**La UI también tenía el mismo supuesto enterrado.** `Downloads.tsx` mostraba
"Pausar" o "Seguir descargando" como si fueran las dos caras de una sola
bandera —nunca a la vez—. Con la pausa por archivo, los dos pueden ser
ciertos al mismo tiempo: algo bajando ahora mismo (tiene sentido pausarlo) y
algo pausado de antes (tiene sentido reanudarlo). Los dos botones pasan a
depender de condiciones independientes, y el aviso de "cola en pausa" se
reescribe para decir lo que ahora es cierto: el resto de la cola sigue su
curso, no está todo detenido.

**El test que existía fosilizaba el bug.** Se llamaba «la pausa detiene la
salida de nuevas descargas» —lo decía en el propio nombre— y comprobaba
justo el comportamiento que había que arreglar. Se sustituyó por el
escenario exacto que pidió Elis —pausar un curso, encolar uno distinto,
confirmar que el segundo arranca solo—, más uno para reanudar (cancela lo
viejo, relanza desde cero) y uno para pausar sin nada activo (no revienta).
219 tests en total. `typecheck`, `lint` y los dos builds en verde.

Archivos tocados: `src/lib/messages.ts`, `src/lib/storage.ts`,
`src/background/downloads.ts` y su test, `src/ui/pages/Downloads.tsx`,
`src/ui/components/QueueRow.tsx`, `src/ui/lib/downloads.ts` (nuevos conteos
`active`/`paused` en `tally`). Nada en `src/api/` ni en la lógica de Drive o
de Moodle.
