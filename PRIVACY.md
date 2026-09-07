# Política de privacidad

**IsilHelper no recoge, no transmite y no almacena información personal en
ningún servidor.** No hay servidor que pudiera hacerlo.

Última actualización: 7 de septiembre de 2026.

## Resumen

| Pregunta | Respuesta |
|---|---|
| ¿Hay un servidor propio? | No. Ninguno |
| ¿Se recogen estadísticas de uso o telemetría? | No |
| ¿Se envía información a terceros? | No |
| ¿Se vende o se comparte información? | No |
| ¿Dónde queda lo que la extensión guarda? | En el equipo del estudiante |
| ¿Se piden usuario y contraseña? | Nunca |

## Qué guarda la extensión, y dónde

IsilHelper guarda datos únicamente en `storage.local`, el almacenamiento local
que el navegador reserva para la extensión **en el equipo del estudiante**. Ese
almacenamiento no se sincroniza con ninguna cuenta ni sale del dispositivo.

| Dato | Para qué | Origen |
|---|---|---|
| Credencial de acceso a la plataforma | Consultar los web services de Moodle en nombre del estudiante | La emite la propia plataforma a partir de la sesión ya iniciada |
| Identificador de usuario de Moodle | Evitar repetir la consulta de identidad en cada pantalla | La plataforma |
| Correo institucional, unidad y foto de perfil | Mostrarlos en la cabecera de la extensión | La plataforma |
| Cursos, contenidos, calificaciones y entregas | Mostrar las pantallas de la extensión | La plataforma |
| Cola de descargas y registro de lo ya descargado | Reanudar una descarga interrumpida y no bajar dos veces lo mismo | La propia extensión |

Todo ello se elimina del equipo al pulsar **Cerrar sesión** o al desinstalar la
extensión.

## La credencial de acceso

La extensión no pide usuario ni contraseña. Obtiene una credencial de acceso de
la propia plataforma, a partir de la sesión que el estudiante ya inició a mano,
con captcha y verificación en dos pasos.

Sobre esa credencial:

- **No sale del navegador del estudiante**, salvo hacia la propia plataforma
  que la emitió, que es la única que puede validarla.
- **No se muestra en pantalla**, ni completa ni parcial.
- **No se escribe en registros** ni aparece en los mensajes de error.
- **No queda anotada en el historial de descargas del navegador.** Las
  descargas de material la llevan en la dirección, así que la extensión borra
  la anotación del historial en cuanto cada archivo termina. El archivo
  descargado no se toca.
- **No se envía nunca a Google.** Lo que se descarga de Google Drive va con la
  sesión de Google que el navegador ya tiene, sin la credencial de la
  plataforma.

El estudiante puede revocarla cuando quiera desde
`platform.ecala.net/user/managetoken.php`.

## A dónde salen las peticiones

IsilHelper se comunica con tres direcciones, y con ninguna más:

| Destino | Para qué |
|---|---|
| `platform.ecala.net` | Los web services de Moodle y la descarga del material alojado allí |
| `drive.google.com` | Leer el contenido de las carpetas de Google Drive enlazadas desde los cursos |
| `drive.usercontent.google.com` | Descargar los archivos de Drive y confirmar el aviso de análisis antivirus que Google muestra con los archivos grandes |

Son los dos sitios donde vive el material del estudiante. No hay ninguna
petición a servidores de Suki, del autor ni de ningún tercero, porque no
existen. El código es público y cualquiera puede comprobarlo.

## Los archivos descargados

El material descargado se guarda en la carpeta de descargas del propio equipo,
mediante el mecanismo de descargas del navegador. No pasa por ningún
intermediario. La extensión no lee el disco del estudiante ni accede a ningún
archivo que no haya descargado ella misma.

## Permisos que solicita la extensión, uno por uno

| Permiso | Por qué es necesario |
|---|---|
| `storage` | Guardar en el equipo lo descrito más arriba |
| `webRequest` | Observar la redirección con la que la plataforma entrega la credencial de acceso. Se usa solo para observar: no se bloquea ni se modifica ninguna petición |
| `downloads` | Guardar los archivos en la carpeta de descargas y borrar del historial la anotación que contendría la credencial |
| `platform.ecala.net` | Consultar los web services de Moodle y descargar el material alojado allí |
| `drive.google.com` | Leer el contenido de las carpetas de Drive enlazadas desde los cursos |
| `drive.usercontent.google.com` | Leer la página de confirmación que Google devuelve al descargar archivos grandes |

IsilHelper **no** solicita permisos de identidad ni credenciales de la API de
Google: no hay ningún proceso de autorización de Google Cloud.

## Menores de edad

IsilHelper no está dirigido a menores de 13 años y no recoge información de
nadie, con independencia de su edad.

## Cambios en esta política

Si esta política cambia, el cambio quedará registrado en el historial público
del repositorio, con su fecha. La versión vigente es siempre la publicada en
<https://github.com/elis333333/IsilHelper/blob/master/PRIVACY.md>.

## Contacto

Cualquier consulta sobre privacidad puede plantearse como incidente en el
repositorio público: <https://github.com/elis333333/IsilHelper/issues>.

Condiciones de uso y ausencia de garantías: [LEGAL.md](LEGAL.md).
