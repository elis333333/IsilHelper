# Proyecto

## Propósito

**IsilHelper existe para archivar.** El instituto revoca el acceso al cerrar el
ciclo, y lo que el estudiante no bajó, lo perdió para siempre. Esa es la
promesa del producto y la vara con la que se mide: **cuántos archivos acaban
en el disco del estudiante**.

Todo lo demás está al servicio de eso. El dashboard —pendientes, cursos,
notas, buscador— **no es el producto**: es lo que hace agradable llegar al
material y decidir qué llevarse. Sin él la herramienta sería peor; sin la
descarga no sería nada.

La consecuencia práctica, decidida el 6 de septiembre de 2026: **el dashboard
se congela**. Funciona, se queda, y deja de crecer. Lo que crece es la
descarga.

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

Se conceden **por fase**: un permiso sin función que lo use es una advertencia
de instalación que no se puede justificar.

```json
{
  "permissions": ["storage", "webRequest", "downloads"],
  "host_permissions": ["https://platform.ecala.net/*"]
}
```

`downloads` entró con la Fase 2. `identity` y el host de `googleapis.com`
entrarán con la Fase 3, y solo si la medición de la Fase 2.5 dice que hacen
falta.

---

## Estructura prevista

```
src/
├── background/       service worker: auth, datos y cola de descargas
│   ├── auth.ts       captura del token vía onBeforeRedirect
│   ├── data.ts       carga de las pantallas, donde vive la pausa
│   └── downloads.ts  la cola: estado en storage, una descarga a la vez
├── api/              cliente de Moodle
│   ├── client.ts     ws(), manejo de 418 y de exception
│   ├── files.ts      qué se baja con el token y qué es enlace externo
│   ├── assign.ts     adjuntos del profesor, que get_contents no devuelve
│   ├── grades.ts
│   └── types.ts      tipos de las respuestas
├── ui/
│   ├── pages/        Pendientes · Cursos · Detalle · Notas · Buscar · Descargas
│   ├── components/
│   └── theme/        tokens de Suki
├── lib/
│   └── paths.ts      saneado de nombres y ruta de destino
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
> **Congelada desde el 6 de septiembre de 2026.** Lo que hay funciona y se
> queda; el dashboard deja de crecer. La retroalimentación sigue sin fuente y
> ya no espera turno: si el diagnóstico de octubre encuentra el boletín lleno,
> se replantea entonces.

**El perfil se cayó de la lista**, así que la 1b son dos piezas y no tres.
`core_user_get_users_by_field` no devuelve código de alumno, ni carrera, ni
ciclo: el carnet digital que preveía la especificación no se puede construir
sin inventarse la mitad. Lo poco que aporta —correo institucional y
`department`— está desde el 5 de septiembre de 2026 en la cabecera de la
aplicación, que es donde cabía.

> **El orden vuelve a la Fase 2 primero**, decidido el 6 de septiembre de
> 2026. El 5 de septiembre se había invertido para hacer Drive antes, con el
> argumento de que los contenidos T01–T15 viven allí. El argumento sigue siendo
> cierto y aun así el orden era el equivocado: la descarga de Moodle **funciona
> hoy, sin ningún obstáculo pendiente**, y Drive está detrás de una decisión de
> producto que ni siquiera está tomada. Hacer primero lo que no tiene bloqueos
> es lo que convierte el propósito en archivos en el disco. Los números de fase
> se quedan como están para no romper las referencias.

**Fase 2 — Descargas de Moodle. Hecha el 6 de septiembre de 2026.** Botón por
archivo, por sección y por curso entero; estructura
`Descargas/IsilHelper/<Curso>/<Sección>/`; cola con progreso, pausa y
reanudación, que sobrevive a que el service worker se duerma; omitir lo ya
descargado a partir de un registro propio; e índice del curso en
`metadata.json`, con la lista de archivos y los enlaces a Drive. Es el
equivalente en extensión de `isil_download.py`. Añade el permiso `downloads`.

**Fase 2.5 — Medir la descarga de Drive por sesión.** Antes de comprometerse
con el muro del OAuth hay que saber si `chrome.downloads` puede bajar de Drive
con la sesión de Google que el estudiante ya tiene en el navegador. Si puede,
el muro desaparece para los archivos con enlace directo y el OAuth queda solo
para *enumerar* carpetas. El protocolo está en `context/fase-3.md` §8.

**Fase 3 — Drive.** Según el resultado de la medición. Si sale mal: OAuth por
`launchWebAuthFlow` con `client_id` propio de cada estudiante, resolución de
enlaces ambiguos, listado recursivo y descarga por `alt=media`, exportación de
documentos nativos y control de rate limiting.

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
