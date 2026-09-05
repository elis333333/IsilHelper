# Proyecto

## Problema

1. Descargar material exige abrir un modal, hacer clic, esperar redirección a
   Drive y bajar a mano. 16 por materia, 11 materias.
2. Al cerrar el ciclo el instituto revoca el acceso. Lo que no bajaste, lo
   perdiste.
3. Notas, pendientes, horario y perfil están dispersos. No hay vista única.

Afecta a todos los estudiantes de ISIL, no solo al autor.

## Principios

| Principio | Implicación |
|---|---|
| **Cero servidor** | Ninguna credencial ni archivo toca una máquina ajena |
| **Cero credenciales pedidas** | Se reutiliza la sesión del navegador |
| **Auditable** | Código abierto; cualquiera verifica que no hay llamadas salientes |
| **Degrada, no revienta** | Si el instituto desactiva algo, se dice con claridad |
| **Local primero** | Lo descargado queda en carpetas normales del estudiante |

---

## Por qué extensión y no aplicación web

La razón es una sola, y es suficiente: **el token deriva de la cookie
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

## Arquitectura

```
Navegador del estudiante
├── Service Worker      token · cliente API · cola de descargas
├── UI (React, pestaña) dashboard · cursos · notas · pendientes
└── storage.local       token · caché · preferencias
        │
        ├──► platform.ecala.net  (Moodle Web Services)
        └──► googleapis.com      (Drive, OAuth propio del alumno)
```

---

## Stack

| Capa | Elección | Motivo |
|---|---|---|
| Build | Vite + `@crxjs/vite-plugin` | Hot reload |
| Lenguaje | TypeScript | Respuestas de Moodle grandes; el tipado paga solo |
| UI | React 18 | Ecosistema |
| Estilos | Tailwind + tokens de Suki | Ver skill de Suki |
| Estado | Zustand | Redux es excesivo aquí |
| Datos | TanStack Query | Caché, reintentos, estados de carga |
| Compatibilidad | `webextension-polyfill` | Firefox casi gratis |
| Descargas | `chrome.downloads` | Rutas de destino y progreso |

### Permisos del manifest

Mínimos y justificables uno por uno; los revisores de tienda preguntan.

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

## Estructura prevista

```
src/
├── background/       service worker: auth, cola de descargas
│   ├── auth.ts       captura del token vía onBeforeRedirect
│   └── downloads.ts
├── api/              cliente de Moodle
│   ├── client.ts     ws(), manejo de 418 y de exception
│   ├── courses.ts
│   ├── grades.ts
│   └── types.ts      tipos de las respuestas
├── ui/
│   ├── pages/
│   ├── components/
│   └── theme/        tokens de Suki
├── lib/
└── manifest.json
```

---

## Fases

**Fase 0 — Esqueleto.** Manifest MV3, captura del token, `site_info`, pantalla
"conectado como X — N cursos", detección de token inválido, manejo del 418.
*Valida la pieza de mayor riesgo. Nada se construye encima hasta que funcione.*

**Fase 1 — Dashboard.** Partida en dos: la 1a es el valor central y se hace
primero; la 1b espera a que la 1a esté sólida.

*Fase 1a — el núcleo.*

1. **Pendientes.** `core_calendar_get_action_events_by_timesort`: los 11 cursos
   en una sola lista ordenada por fecha de entrega, **no agrupada por curso**.
   Es la pantalla que hoy obliga a abrir curso por curso, y la que justifica la
   extensión por sí sola. Marca lo vencido, lo de hoy y lo de esta semana.
2. **Cursos.** Grilla con el avance.
3. **Detalle de curso.** `core_course_get_contents`: secciones, contenidos,
   sílabo, complementarios y evaluaciones, con estado de completado. Filtra el
   ruido documentado en `domain.md` §5.
4. **Notas.** `gradereport_user_get_grade_items`, todos los cursos en una tabla,
   con promedio.

*Fase 1b — lo que suma encima.* Reordenada el 5 de septiembre de 2026 con los
datos del primer diagnóstico contra la cuenta real: primero lo que no depende
de datos que todavía no existen.

5. **Buscador global** sobre lo que ya está en caché. La única de las tres que
   no espera a nada.
6. **Entregas con retroalimentación.** En espera. El libro de calificaciones
   está vacío en los 11 cursos y no se sabe si es que el ciclo acaba de empezar
   o si ISIL no lo usa (`domain.md` §9). Sin fuente no hay pantalla, y
   fabricarla con datos inventados sería peor que no tenerla.
**El perfil se cayó de la lista**, así que la 1b son dos piezas y no tres.
`core_user_get_users_by_field` no devuelve código de alumno, ni carrera, ni
ciclo: el carnet digital que preveía la especificación no se puede construir
sin inventarse la mitad. Lo poco que aporta —correo institucional y
`department`— está desde el 5 de septiembre de 2026 en la cabecera de la
aplicación, que es donde cabía.

> **El orden de ejecución de las fases 2 y 3 está invertido** desde el 5 de
> septiembre de 2026: primero Drive, después Moodle. Los contenidos T01–T15 y
> los sílabos son lo que motivó el proyecto y viven en Drive; los
> complementarios de Moodle son 55 archivos que ya están archivados. Los
> números de fase se quedan como están para no romper las referencias.

**Fase 2 — Descargas de Moodle.** Individual y masiva de `pluginfile.php`;
estructura `Curso / Sección / Tema /`; cola con progreso, pausa y reanudación;
omitir lo ya descargado; exportar `metadata.json`.

**Fase 3 — Drive.** OAuth por `launchWebAuthFlow`; resolución de enlaces
ambiguos; listado recursivo y descarga por `alt=media`; exportación de
documentos nativos; control de rate limiting.

**Fase 4 — Distribución.** Firefox AMO (gratis) y Chrome Web Store (5 USD pago
único); README con advertencias; política de privacidad.

---

## Fuera de alcance

Explícitamente **no** se hará:

- Escribir en la plataforma (entregar tareas, foros, marcar completado)
- Descargar clases grabadas de Zoom
- Cualquier sincronización, cuenta o servidor propio
- Automatizar el login

---

## Riesgos

| Riesgo | Nivel | Mitigación |
|---|---|---|
| ISIL desactiva el servicio móvil | Alto | Mensaje claro; el README no promete permanencia. Considerar avisar a sistemas antes de publicar |
| El WAF endurece reglas | Medio | Cabeceras reales y pausas ya implementadas |
| Cambios en la API de Moodle | Bajo | Los web services son estables entre versiones |
| Las notas no viven en Moodle sino en un SIS | Medio | Detectado el 5 de septiembre de 2026: boletín vacío en los 11 cursos. Si se confirma, la pantalla de notas y la de retroalimentación se quedan sin fuente y la Fase 1b se replantea. La pantalla ya lo dice con honestidad en vez de mostrar una tabla vacía |
| Fricción de marca | Bajo | Sin logos ni nombre de ISIL en la tienda; "proyecto estudiantil no oficial" |

---

## Precedente en Python

Ya validado y funcionando en los scripts previos:

- Obtención del token vía `launch.php` ✔
- Cabeceras que sortean el WAF ✔
- 55 archivos de Moodle descargados, 0 errores ✔
- 202 enlaces externos inventariados y clasificados ✔
- 166 carpetas de Drive vía OAuth con rclone ✔

Los scripts se conservan como referencia de la API y vía para usuarios
avanzados.
