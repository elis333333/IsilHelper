# Sesión

> Estado vivo del trabajo. **Actualizar al cerrar cada tanda.**
> Si algo aquí contradice a `project.md` o `domain.md`, gana este archivo:
> es lo más reciente.

---

**Fase 0 — cerrada.** Verificada con sesión real: "Conectado como *X*" con los
11 cursos y su avance.

**Fase 1a — cerrada.** Corrida contra la cuenta real el 5 de septiembre de
2026 y corregida con lo que devolvió.

## Fase actual

**Fase 1b cerrada** y mergeada a `master`. Quedó en dos piezas y solo una se
pudo construir:

- **Buscador global** — hecho.
- **Entregas con retroalimentación** — **en espera**, y no por tiempo: el
  boletín de calificaciones está vacío en los 11 cursos, así que la pantalla no
  tiene fuente. Se decide con el diagnóstico de octubre.

El perfil salió de la lista: no daba para una pantalla, y lo que aportaba
—correo y `department`— está ahora en la cabecera.

**Lo siguiente es la Fase 3 (Drive)**, antes que la 2, a pedido de Elis: los
contenidos y los sílabos son lo que motivó el proyecto. El plan del OAuth se
revisa **antes** de escribir código.

### Las ramas

| Rama | Qué tiene |
|---|---|
| `master` | El producto: Fase 0, 1a y 1b. Sin modo diagnóstico |
| `fase-1a-dashboard` | Mismo contenido que `master`; se puede borrar |
| `diagnostico-temporal` | **Se conserva hasta octubre.** Congelada, con el producto de hoy más el modo diagnóstico |

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

**Revisar el plan del OAuth de la Fase 3**, que está escrito en
`context/fase-3.md` con los dos spikes ya medidos. Nada de código de Drive
hasta que la decisión de producto esté tomada.

Lo que el plan propone, en corto: **abrir contenidos en pestañas** para todos
—sin OAuth, sin `client_id` y sin ningún permiso nuevo—, y **descargar** detrás
del `client_id` propio de cada estudiante, asumiendo que esa configuración deja
fuera a la mayoría. Antes de comprometerse con ese muro conviene medir si
`chrome.downloads` puede bajar de Drive con la sesión del navegador.

Y en paralelo, **repetir el diagnóstico a partir del 6 de octubre de 2026**
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

---

## Pendiente de resolver

- [x] ~~**`.gitignore` es un directorio, no un archivo.**~~ Resuelto:
      `git check-ignore -v .env` devuelve `.gitignore:1:.env`.
- [ ] Iconografía de tienda (16/32/48/128 px)
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
