# IsilHelper — Especificación

> Extensión de navegador que le devuelve a los estudiantes de ISIL el control
> sobre su propia información académica.
>
> Estado: borrador previo a la Fase 0
> Autor: Elis · Producto de **Suki**

---

## 1. Por qué existe

La plataforma actual (Moodle sobre `platform.ecala.net`) tiene tres problemas
concretos para el estudiante:

1. **Descargar material es un suplicio.** Cada contenido exige abrir un modal,
   hacer clic, esperar la redirección a Google Drive y bajar el archivo a mano.
   Son 16 por materia. Con 11 materias, son ~176 ciclos de ese ritual.
2. **El material desaparece.** Al cerrar el ciclo, el instituto revoca el acceso
   a contenidos y sílabos. Lo que no bajaste antes, lo perdiste.
3. **La información está dispersa.** Notas, entregas pendientes, horarios y
   perfil viven repartidos entre la plataforma y un par de apps móviles con
   funcionalidad parcial. No existe una vista única de "cómo voy".

La extensión no reemplaza a Moodle. Se apoya en la **API oficial de web
services** que el propio Moodle expone para su app móvil, y construye encima una
interfaz que sí sirve.

---

## 2. Principios de diseño

Estos no son negociables; el resto de decisiones se derivan de ellos.

| Principio | Qué implica |
|---|---|
| **Cero servidor** | No existe backend. Ninguna credencial, token ni archivo del estudiante toca una máquina que no sea la suya. |
| **Cero credenciales pedidas** | La extensión nunca muestra un formulario de usuario/contraseña. Reutiliza la sesión que el navegador ya tiene. |
| **Auditable** | Código abierto. Cualquiera puede verificar que no hay llamadas salientes a terceros. |
| **Degrada, no revienta** | Si el instituto desactiva algo, la extensión lo dice con claridad en vez de romperse. |
| **Local primero** | Todo lo descargado queda en el disco del estudiante, en carpetas normales que puede abrir sin la extensión. |

---

## 3. Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│  Navegador del estudiante                               │
│                                                         │
│  ┌───────────────┐        ┌──────────────────────────┐  │
│  │ Service Worker│◄──────►│  UI (React, pestaña)     │  │
│  │  - token      │        │  - dashboard             │  │
│  │  - API client │        │  - cursos / notas        │  │
│  │  - descargas  │        │  - pendientes            │  │
│  └───────┬───────┘        └──────────────────────────┘  │
│          │                                              │
│  ┌───────▼────────┐                                     │
│  │ storage.local  │  token, caché, preferencias         │
│  └────────────────┘                                     │
└──────────┬───────────────────────────┬──────────────────┘
           │                           │
           ▼                           ▼
  platform.ecala.net            Google Drive API
  (Moodle Web Services)         (OAuth propio del alumno)
```

**Por qué extensión y no aplicación web.** La razón es una sola, y es suficiente: **el token deriva de la cookie
`MoodleSession`**, que solo existe tras pasar captcha y TOTP en el navegador.
Una web hospedada no puede leer esa cookie de otro dominio, así que tendría que
pedírsela al estudiante — indistinguible de un phishing, y sin forma de que él
verifique intenciones. La extensión no pide nada porque ya vive dentro del
navegador que tiene la sesión.

> **Lo que no es una razón: CORS.** Durante un tiempo se sostuvo que
> `webservice/rest/server.php` no enviaba cabeceras CORS y que por eso hacía
> falta un proxy. Es falso: responde `Access-Control-Allow-Origin: *`
> (verificado el 4 de septiembre de 2026), así que se puede llamar desde
> cualquier origen con `credentials` omitido. El argumento se retira.

Como efecto secundario, las peticiones de la extensión salen con cabeceras de
navegador reales y el WAF no las distingue del tráfico normal.

---

## 4. Autenticación

### 4.1 El flujo

Moodle expone `admin/tool/mobile/launch.php`, pensado para que la app móvil
oficial obtenga un token. Devuelve un `302` cuyo `Location` apunta a un esquema
personalizado con el token en base64.

```
GET /admin/tool/mobile/launch.php?service=moodle_mobile_app&passport=1&urlscheme=isilhelper
  ↓ 302
Location: isilhelper://token=BASE64
  ↓ base64 -d
firma_md5:::TOKEN:::private_token
```

El token resultante son 32 caracteres hexadecimales, **no caduca con la sesión**
y sustituye por completo al captcha y al TOTP en usos posteriores.

### 4.2 La captura

Se observa la redirección, no la respuesta. La de `fetch` llega opaca porque
`isilhelper://` no es HTTP y la petición muere con `ERR_UNKNOWN_URL_SCHEME`,
pero `onBeforeRedirect` ya disparó antes de eso.

Se dispara desde el service worker y no desde una pestaña: navegar a
`isilhelper://` abriría el diálogo de protocolo externo del navegador, que el
estudiante no sabe qué hacer con él.

```js
// Registro SÍNCRONO en el arranque del worker: si se registra tras un await,
// el worker puede estar dormido cuando llegue el evento y se pierde.
chrome.webRequest.onBeforeRedirect.addListener(
  ({ redirectUrl }) => {
    // La URL es `isilhelper://token=BASE64`, SIN query string: usar
    // new URL(...).searchParams.get("token") devuelve null, y de paso el
    // parser baja el hostname a minúsculas y rompe el base64.
    const marca = redirectUrl.indexOf("token=");
    if (marca === -1) return;                 // redirigió al login: no hay sesión
    const b64 = redirectUrl.slice(marca + 6);
    const campos = atob(b64 + "=".repeat((4 - b64.length % 4) % 4)).split(":::");
    const token = campos[1];                  // el SEGUNDO campo, 32 hex
    chrome.storage.local.set({ token });
  },
  { urls: ["*://platform.ecala.net/admin/tool/mobile/launch.php*"] }
);

// credentials:"include" es obligatorio: el fetch de la extensión es
// cross-origin y sin él no viaja MoodleSession, así que launch.php redirige
// al login y parece un problema de sesión.
await fetch(launchUrl, { credentials: "include" }).catch(() => {});
```

`webRequest` en modo observacional (sin `blocking`) sigue disponible en
Manifest V3.

### 4.3 Experiencia del estudiante

1. Inicia sesión en la plataforma como siempre.
2. Abre la extensión → **Conectar**.
3. Listo. No vuelve a pasar por captcha ni TOTP.

Si el token deja de ser válido, la extensión detecta el `errorcode:
invalidtoken` y ofrece reconectar con el mismo clic.

---

## 5. Funcionalidades

### Fase 0 — Esqueleto y autenticación

Valida la pieza de mayor riesgo antes de construir nada encima.

- [ ] Manifest V3 con permisos mínimos
- [ ] Captura y persistencia del token
- [ ] Llamada a `core_webservice_get_site_info`
- [ ] Pantalla: "Conectado como *X* — *N* cursos"
- [ ] Detección de token inválido y reconexión
- [ ] Manejo del `418` del WAF con reintento y espera creciente

### Fase 1 — Dashboard

El valor central. Todo es lectura y todo son llamadas ya verificadas.

- [ ] **Inicio** — pendientes de los 11 cursos en una sola lista ordenada por
      fecha de entrega. Hoy exige abrir curso por curso.
- [ ] **Cursos** — grilla con progreso de completado por curso
- [ ] **Detalle de curso** — secciones, contenidos, sílabo, complementarios,
      evaluaciones, con estado de completado
- [ ] **Notas** — todas las calificaciones de todos los cursos en una tabla,
      con promedio ponderado calculado
- [ ] **Entregas** — qué se entregó, cuándo, nota y retroalimentación
- [ ] **Perfil / carnet** — datos del estudiante y foto
- [ ] **Buscador global** — sobre nombres de módulos y cursos

### Fase 2 — Descarga de material propio de Moodle

- [ ] Descarga individual y masiva de archivos `pluginfile.php`
- [ ] Estructura de carpetas `Curso / Sección / Tema /`
- [ ] Cola con progreso, pausa y reanudación
- [ ] Omitir lo ya descargado
- [ ] Exportar `metadata.json` por curso

### Fase 3 — Google Drive

La fase más costosa. El material principal (contenidos y sílabos) vive en
carpetas de Drive compartidas con la cuenta institucional, no accesibles de
forma anónima.

- [ ] OAuth propio vía `chrome.identity.launchWebAuthFlow`, scope
      `drive.readonly`
- [ ] Resolución de enlace ambiguo (`?id=`) a carpeta o archivo
- [ ] Listado recursivo y descarga por `alt=media`
- [ ] Exportación de documentos nativos de Google a PDF/DOCX/PPTX
- [ ] Control de rate limiting

### Fase 4 — Distribución

- [ ] Compilado para Firefox y Chromium
- [ ] Publicación en AMO (gratis) y Chrome Web Store (5 USD, pago único)
- [ ] README con instalación y advertencias
- [ ] Política de privacidad (trivial: no se recoge nada)

### Fuera de alcance

Explícitamente **no** se hará:

- Escribir en la plataforma (entregar tareas, responder foros, marcar
  completado). Solo lectura.
- Descargar clases grabadas de Zoom. Son pocas, frágiles de obtener y de valor
  marginal. Queda como script aparte.
- Cualquier sincronización, cuenta o servidor propio.
- Automatizar el login. Nunca.

---

## 6. API de Moodle utilizada

Todas por `POST` a `/webservice/rest/server.php` con `wstoken`, `wsfunction` y
`moodlewsrestformat=json`. Verificado: **445 funciones disponibles**.

| Función | Para qué |
|---|---|
| `core_webservice_get_site_info` | Validar token, obtener `userid` |
| `core_enrol_get_users_courses` | Lista de cursos matriculados |
| `core_course_get_contents` | Secciones, módulos y archivos de un curso |
| `gradereport_user_get_grade_items` | Notas por curso |
| `core_calendar_get_action_events_by_timesort` | Pendientes por fecha |
| `mod_assign_get_assignments` | Tareas y adjuntos del profesor |
| `mod_assign_get_submission_status` | Estado de la entrega propia |
| `core_user_get_users_by_field` | Perfil y foto |
| `core_course_get_course_module` | Resolver módulos sueltos |

**Detalles que ya costaron trabajo descubrir:**

- Los `fileurl` apuntan a `webservice/pluginfile.php` y necesitan `?token=` o
  `&token=` para descargar. Sin eso devuelven HTML de login con estado `200`.
- `core_course_get_contents` **no** funciona por `lib/ajax/service.php`; ese
  endpoint solo acepta funciones marcadas como AJAX.
- Los `mod_url` traen la URL externa ya resuelta en `contents[0].fileurl`. No
  hace falta seguir redirecciones.
- Moodle responde `200` con HTML cuando el token es inválido en descargas.
  Siempre verificar `Content-Type`.

### Ruido a filtrar

Aparecen como módulos pero no son material: `Ayúdanos a mejorar`,
`Tus calificaciones`, `Encuesta: …` (enlaces a jotform).

---

## 7. Stack

| Capa | Elección | Motivo |
|---|---|---|
| Build | Vite + `@crxjs/vite-plugin` | Hot reload; sin esto, desarrollar extensiones es doloroso |
| Lenguaje | TypeScript | Las respuestas de Moodle son objetos grandes; el tipado paga solo |
| UI | React 18 | Ecosistema y familiaridad |
| Estilos | Tailwind + tokens de Suki | Ver §8 |
| Estado | Zustand | Ligero; Redux es excesivo aquí |
| Datos | TanStack Query | Caché, reintentos y estados de carga resueltos |
| Compatibilidad | `webextension-polyfill` | Firefox casi gratis desde el día uno |
| Almacenamiento | `chrome.storage.local` | Token y caché |
| Descargas | `chrome.downloads` | Maneja rutas de destino y progreso |

### Permisos del manifest

Mínimos y justificables uno por uno, porque los revisores de tienda preguntan.
**Se declaran por fase, no de golpe:** un permiso pedido antes de que exista la
función que lo usa es una advertencia de instalación que no se puede explicar.

| Fase | Se añade | Para qué |
|---|---|---|
| 0 | `storage`, `webRequest`, host `platform.ecala.net` | Token y llamadas a la API |
| 2 | `downloads` | Descarga de material de Moodle |
| 3 | `identity`, host `www.googleapis.com` | OAuth de Drive del propio alumno |

Estado final, al terminar la Fase 3:

```json
{
  "permissions": ["storage", "downloads", "webRequest", "identity"],
  "host_permissions": [
    "https://platform.ecala.net/*",
    "https://www.googleapis.com/*"
  ]
}
```

---

## 8. Branding — Suki

El sistema vive en las skills de Suki, en `.claude/skills/`. No se copia aquí
para que no haya dos fuentes de verdad; se referencia.

| Qué | De dónde sale |
|---|---|
| Color, tipografía, espaciado, radio, movimiento | `suki-brand-tokens/assets/tokens.css` |
| Componentes, densidad, estados | `suki-product-ui/assets/ui.css` y `componentes.tsx` |
| Textos de UI, errores y vacíos | `suki-voice` |

Decidido:

- **Color de acción: `#06D6A0`.** IsilHelper es producto de Suki, no de Suki
  Labs, así que no lleva el azul de Labs. Verificado con `contraste.py`:
  10,30 : 1 sobre `#0D0D0D`, 9,23 : 1 sobre tarjeta, 8,23 : 1 sobre hover.
  **El texto encima del acento es `#0D0D0D`** (10,30 : 1); el blanco da
  1,89 : 1 y está descartado.
- **Dark-first** sobre `#0D0D0D`, modo claro completo desde el primer día.
- **Inter y JetBrains Mono.** Montserrat no entra: es tipografía de la marca
  madre y un producto propio no la hereda.
- **Radio 0, sin sombras ni degradados.** La profundidad sale de superficie más
  borde de 1 px.

Pendiente: iconografía de la tienda (16/32/48/128 px) y la firma de respaldo del
pie.

La UI debe verse como un producto de Suki, no como una extensión genérica. Es el
primer producto público de la marca y funciona como carta de presentación.

---

## 9. Seguridad y privacidad

**Qué se guarda y dónde.** Todo en `chrome.storage.local`, en el equipo del
estudiante: el token de Moodle, el token de Drive, la caché de cursos y las
preferencias. Nada sale hacia ningún servidor del proyecto, porque no existe tal
servidor.

**Riesgos honestos:**

| Riesgo | Mitigación |
|---|---|
| El token no caduca solo | Botón visible de "Cerrar sesión" que lo borra y enlace a `user/managetoken.php` para revocarlo del lado de Moodle |
| Otra extensión maliciosa lee el storage | Fuera de nuestro control; se documenta |
| Alguien publica un fork con backend oculto | El proyecto oficial se identifica claramente; el código es auditable |
| El estudiante comparte capturas con el token visible | La UI nunca muestra el token completo |

**Compromisos con el usuario:** no hay telemetría, ni analytics, ni llamadas a
terceros más allá de `platform.ecala.net` y las APIs de Google. La política de
privacidad cabe en un párrafo.

---

## 10. Riesgos del proyecto

**El instituto desactiva el servicio móvil.** Es el riesgo mayor y está fuera de
nuestro control. Rompería la extensión por completo. Mitigación: mensaje claro
al usuario, y el README no promete permanencia. Vale la pena considerar avisar a
sistemas de ISIL antes de publicar — un proyecto estudiantil transparente y de
solo lectura tiene mejores probabilidades de tolerarse que uno descubierto por
sorpresa en los logs.

**El WAF endurece las reglas.** Manejable: la extensión ya envía cabeceras
reales y respeta pausas entre peticiones.

**Cambios en la API de Moodle.** Bajo. Los web services son estables entre
versiones.

**Fricción de marca.** No usar logos ni nombre de ISIL en la tienda. Dejar
explícito que es un proyecto estudiantil no oficial.

---

## 11. Estado actual

Ya funciona y está validado en Python (`isil_download.py`, `drive_rclone.py`):

- Obtención del token vía `launch.php` ✔
- Cabeceras que sortean el WAF ✔
- Descarga de material propio de Moodle — 55 archivos, 0 errores ✔
- Inventario completo — 202 enlaces externos clasificados ✔
- Descarga desde Drive con OAuth (`rclone`) — 166 carpetas ✔

Los scripts se conservan como referencia de la API y como vía para usuarios
avanzados. La extensión es la vía amable para el resto.

---

## 12. Siguiente paso

Fase 0. Esqueleto mínimo que capture el token y muestre el nombre y el número de
cursos. Hasta que esa pieza funcione, no tiene sentido construir nada encima.
