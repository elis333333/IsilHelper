# Convenciones

## Idioma

- **Código en inglés**: nombres de variables, funciones, tipos, archivos.
- **Comentarios y documentación en español.**
- **Textos de la UI en español**, tono de Suki (ver skill).
- Commits en español, imperativo: `agrega captura de token`, no `agregado`.

## TypeScript

- `strict: true`. Sin `any`; si algo es genuinamente desconocido, `unknown` y
  estrechar.
- Las respuestas de Moodle se tipan en `src/api/types.ts`. **Nunca acceder a
  campos de una respuesta sin tipo declarado**: los objetos son grandes y los
  errores llegan como JSON con estado 200.
- Preferir `type` sobre `interface` salvo que haga falta extender.
- Sin exportaciones por defecto salvo componentes de página.

## Errores

- La capa de API devuelve `Result<T>` o lanza un error tipado. Nunca devolver
  `null` para señalar fallo.
- Todo error que llegue a la UI tiene un mensaje en español que dice **qué pasó
  y qué puede hacer el usuario**. `Error: request failed` no es aceptable.
- Los tres estados de fallo que siempre hay que distinguir:
  - `418` → WAF; reintentar con espera creciente
  - `exception.errorcode === "invalidtoken"` → ofrecer reconectar
  - `Content-Type: text/html` en una descarga → el token no llegó

## Seguridad

- **Nunca `console.log` del token**, ni completo ni parcial, ni en desarrollo.
- Nunca incluir tokens, cookies ni IDs reales en ejemplos, tests o fixtures.
  Usar marcadores: `<TOKEN>`, `1AbCdEf...`.
- La UI jamás muestra el token completo.
- Nada de telemetría, analytics ni llamadas a dominios fuera de
  `platform.ecala.net` y `drive.google.com`. Añadir un dominio a
  `host_permissions` es una decisión de diseño, no un detalle.
- **El token de Moodle solo viaja a `platform.ecala.net`.** Las descargas de
  Drive van con la sesión de Google y sin token: pegárselo a una URL de Google
  sería filtrárselo a un tercero. Lo decide el campo `source` de cada archivo
  de la cola.

## Red

- Toda petición a `platform.ecala.net` pasa por `src/api/client.ts`. No hacer
  `fetch` suelto desde componentes.
- Pausa mínima de 600 ms entre peticiones en operaciones masivas.
- Reintentos con espera creciente, máximo 4.
- Timeout explícito en toda petición.

## React

- Componentes funcionales con hooks.
- Datos remotos siempre vía TanStack Query; nada de `useEffect` + `fetch`.
- Estado global mínimo en Zustand: token, preferencias, cola de descargas. Todo
  lo demás es estado de servidor y pertenece a Query.
- Un componente por archivo. Si pasa de ~150 líneas, partirlo.

## Estilos

- Tailwind con los tokens de Suki. **Consultar la skill de Suki** antes de
  elegir un color, espaciado, radio o tamaño de texto.
- Nada de valores mágicos (`p-[13px]`, `#3a7bd5`). Si no hay token para algo, se
  discute y se añade al sistema, no se improvisa.
- Soporte de modo claro y oscuro desde el principio.

## Archivos

- Componentes: `PascalCase.tsx`
- Todo lo demás: `kebab-case.ts`
- Tests junto al archivo: `client.test.ts`

## Git

- Ramas: `fase-0-auth`, `fase-1-dashboard`
- Commits pequeños y con un solo propósito
- `.env`, `.venv/`, `dist/`, `downloads/` y `*.part` van en `.gitignore` desde el
  primer commit

## Tests

- Obligatorios en `src/api/`: parseo del token, detección de `exception`,
  manejo del 418, clasificación de enlaces de Drive.
- La UI no requiere cobertura exhaustiva.
- Fixtures con respuestas reales pero **anonimizadas**.

## Documentación

- Al terminar una tanda de trabajo, actualizar `context/session.md`.
- Un hallazgo nuevo sobre la plataforma va a `context/domain.md`, no a un
  comentario en el código.
