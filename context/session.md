# Sesión

> Estado vivo del trabajo. **Actualizar al cerrar cada tanda.**
> Si algo aquí contradice a `project.md` o `domain.md`, gana este archivo:
> es lo más reciente.

---

## Fase actual

**Fase 0 — Esqueleto y autenticación.** Código completo. Falta una única
comprobación, que solo Elis puede hacer: el camino feliz con su sesión real.

## Siguiente paso

**Probar el camino feliz.** Todo lo demás está verificado; esto no, porque
necesita una `MoodleSession` viva y el perfil de pruebas no la tiene.

1. Entrar en `platform.ecala.net` como siempre.
2. `chrome://extensions` → modo desarrollador → *Cargar sin empaquetar* →
   `dist/`. **Ojo: Google Chrome ignora `--load-extension` por política; Brave
   sí lo permite.**
3. Pulsar el ícono, luego Conectar. Debe aparecer "Conectado como *X*" con los
   11 cursos y su avance.

Si sale, la Fase 0 está terminada y toca la Fase 1. Si no, el mensaje de la
pantalla dice cuál de las cinco causas fue.

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
