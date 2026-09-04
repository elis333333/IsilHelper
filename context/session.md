# Sesión

> Estado vivo del trabajo. **Actualizar al cerrar cada tanda.**
> Si algo aquí contradice a `project.md` o `domain.md`, gana este archivo:
> es lo más reciente.

---

**Fase 0 — cerrada.** Verificada con sesión real: "Conectado como *X*" con los
11 cursos y su avance.

## Fase actual

**Fase 1a.** Commiteada en la rama `fase-1a-dashboard`, con la paginación de
eventos corregida y barrera de error en la raíz.

## Siguiente paso

**Cerrar las cuatro dudas de la API contra la cuenta real** y endurecer
`types.ts` con lo aprendido. El andamio para hacerlo vive en la rama
`diagnostico-temporal`, aparte a propósito: se borra entera al terminar y no
deja rastro en la historia del repo público.

Las cuatro dudas:

1. **Qué campos trae de verdad `core_calendar_get_action_events_by_timesort`.**
   Los tipos declaran obligatorios solo `id`, `name` y `timesort`; el resto es
   opcional a propósito. Si `course`, `modulename` o `action.url` vienen
   siempre, se pueden endurecer.
2. **Si devuelve entregas ya entregadas.** Si aparecen, hay que filtrarlas por
   `action.actionable` o por el estado de la entrega.
3. **Si `gradereport_user_get_grade_items` trae el ítem `itemtype: "course"`.**
   Si viene, el promedio sale del total oficial de Moodle; si no, de la
   ponderación por `weightraw`. La tabla marca cuál usó con la palabra
   "calculado".
4. **Si el filtro de ruido deja pasar algo nuevo.** El patrón es el de
   `domain.md` §5.

Después: endurecer `types.ts`, borrar `diagnostico-temporal` y la Fase 1b
(entregas con retroalimentación, perfil y carnet, buscador global).

---

## Hecho

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

---

## Pendiente de resolver

- [ ] **`.gitignore` es un directorio, no un archivo.** Nada está ignorado y
      dentro hay un `.env` con un token real, 2,3 GB de descargas y el venv.
      Lo arregla Elis. **Nadie toca git hasta que
      `git check-ignore -v .env` devuelva una regla.**
- [ ] Iconografía de tienda (16/32/48/128 px)
- [ ] Confirmar si las notas oficiales están en Moodle o en un SIS aparte
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

**2026-09-04** — Ingeniería inversa completada. Scripts de Python funcionando y
material del ciclo 2026-2 archivado. Decidida la arquitectura de extensión.
Redactada la especificación. Creados los archivos de contexto.

**2026-09-04** — Fase 1a commiteada en `fase-1a-dashboard`. Corregido el fallo
de paginación del calendario que avisó Elis: faltaba seguir `aftereventid`, y
sin eso la lista salía corta sin avisar. Añadida barrera de error tras
comprobar que una respuesta con forma inesperada dejaba la página en blanco.

**2026-09-04** — Fase 0 cerrada y verificada con sesión real. Primer commit
(`c499d9a`), 87 archivos, sin secretos. Fase 1a escrita: pendientes en lista
cronológica única, cursos, detalle de curso con el ruido filtrado, y notas con
promedio y estado parcial. `project.md` actualizado con la partición 1a/1b.

**2026-09-04** — Fase 0 completa a falta de la prueba con sesión real.
Retirada de los tres documentos la premisa falsa de que `server.php` no envía
CORS: sí envía `Access-Control-Allow-Origin: *`, así que la única razón válida
para elegir extensión es el origen de la sesión. Corregido el atajo de parseo
de la URL de redirección, que devolvía `null` y además rompía el base64.

**2026-09-04** — Revisión de contexto y arranque de la Fase 0. Corregidos la
cookie real del ejemplo de `get-token.sh`, el `urlscheme`, los permisos por
fase y la sugerencia de gdown. `ESPECIFICACION.md` movido a `context/`.
Corregido `domain.md`: las cabeceras **no** son gratis desde el service worker.
Andamiaje en pie y sondeo del WAF superado — no hace falta `Referer`.
