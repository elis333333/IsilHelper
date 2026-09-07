# Política de privacidad

**IsilHelper no recoge, no transmite y no almacena información personal en
ningún servidor.** No hay servidor que pudiera hacerlo: es una extensión de
navegador sin backend, y todo lo que hace ocurre dentro del equipo del
estudiante.

Última actualización: 7 de septiembre de 2026.

## Resumen

| Pregunta | Respuesta |
|---|---|
| ¿Hay un servidor propio? | No. Ninguno |
| ¿Se recogen estadísticas de uso o telemetría? | No |
| ¿Se envía información a terceros? | No |
| ¿Se vende o se comparte información? | No |
| ¿Dónde queda lo que la extensión guarda? | En el equipo del estudiante, en el almacenamiento local del navegador |
| ¿Se piden usuario y contraseña? | Nunca |

## Qué guarda la extensión, y dónde

IsilHelper guarda datos únicamente en `storage.local`, el almacenamiento local
que el navegador reserva para la extensión **en el equipo del estudiante**. Ese
almacenamiento no se sincroniza con ninguna cuenta ni sale del dispositivo.

| Dato | Para qué | Se borra al cerrar sesión |
|---|---|---|
| Credencial de acceso a la plataforma (`wstoken`) | Consultar los web services de Moodle en nombre del estudiante | Sí |
| Identificador de usuario de Moodle | Evitar repetir la consulta de identidad en cada pantalla | Sí |
| Correo institucional, unidad y foto de perfil | Mostrarlos en la cabecera de la extensión | Sí |
| Cola de descargas (qué archivo, de qué curso, en qué estado) | Reanudar una descarga interrumpida sin perder el progreso | **No** |
| Registro de rutas ya descargadas, con su fecha | No volver a bajar un archivo que ya está en el disco del estudiante | **No** |

Las dos últimas filas son la excepción, y se dice con precisión y no en
general: al pulsar **Cerrar sesión** se borra la credencial, el identificador
y el perfil, pero la cola y el registro de lo ya descargado **se quedan**,
porque no dependen de ninguna sesión —dicen qué se bajó, no quién lo bajó— y
borrarlos de golpe haría que la extensión se olvidara de qué archivos ya tiene
el estudiante en el disco. Los dos desaparecen al desinstalar la extensión,
que es cuando el navegador borra todo su almacenamiento local, o se pueden
olvidar archivo por archivo con la opción «volver a descargar» de la pantalla
de descargas.

**Los cursos, contenidos, notas y pendientes que se ven en pantalla no se
guardan aquí.** Viven en la memoria de la pestaña mientras está abierta, para
no repetir peticiones a la plataforma cada vez que se cambia de pantalla, y
desaparecen al cerrarla. No quedan en el disco del estudiante en ningún
formato.

## La credencial de acceso

La extensión no pide usuario ni contraseña. Obtiene una credencial de acceso
—un `wstoken` de los web services de Moodle— de la propia plataforma, a partir
de la sesión que el estudiante ya inició a mano, con captcha y verificación en
dos pasos.

Cómo se obtiene, con precisión: la extensión observa —no modifica ni
bloquea— una redirección que la propia plataforma emite al visitar una
dirección de inicio de sesión de su aplicación móvil oficial. Esa
redirección lleva la credencial. La extensión nunca lee la cookie de sesión
del estudiante (`MoodleSession`) ni tiene permiso para hacerlo: el navegador
la adjunta él solo a esa petición, igual que la adjuntaría a cualquier
pestaña que el estudiante tuviera abierta en esa misma plataforma.

Sobre esa credencial:

- **No sale del navegador del estudiante**, salvo hacia la propia plataforma
  que la emitió, que es la única que puede validarla.
- **No se muestra en pantalla**, ni completa ni parcial.
- **No se escribe en registros** ni aparece en los mensajes de error.
- **No queda anotada en el historial de descargas del navegador.** Las
  descargas de material de la plataforma la llevan pegada a la dirección, así
  que la extensión borra la anotación del historial en cuanto cada archivo
  termina. El archivo descargado no se toca: lo que desaparece es la entrada
  del historial, no el archivo.
- **No se envía nunca a Google.** Lo que se descarga de Google Drive va con la
  sesión de Google que el navegador ya tiene, sin la credencial de la
  plataforma.

El estudiante puede revocarla cuando quiera desde
`platform.ecala.net/user/managetoken.php`.

## A dónde salen las peticiones

IsilHelper se comunica con cuatro direcciones, y con ninguna más:

| Destino | Para qué |
|---|---|
| `platform.ecala.net` | Los web services de Moodle y la descarga del material subido directamente a la plataforma |
| `drive.google.com` | Leer el contenido de las carpetas de Google Drive enlazadas desde los cursos |
| `drive.usercontent.google.com` | Descargar los archivos de Drive y leer el aviso de análisis antivirus que Google muestra con los archivos grandes, para confirmarlo igual que lo haría el estudiante a mano |
| `docs.google.com` | Solo cuando un curso enlaza un documento nativo de Google —un Doc, una hoja de cálculo o una presentación—: se exporta a PDF o a la hoja de cálculo correspondiente, en vez de bajarse tal cual |

Son los sitios donde vive el material del estudiante. No hay ninguna petición
a servidores de Suki, del autor ni de ningún tercero, porque no existen. El
código es público y cualquiera puede comprobarlo: el detalle técnico, permiso
por permiso, está en [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md).

## Los archivos descargados

El material descargado se guarda en la carpeta de descargas del propio equipo,
mediante el mecanismo de descargas del navegador. No pasa por ningún
intermediario. La extensión no lee el disco del estudiante ni accede a ningún
archivo que no haya descargado ella misma.

## Permisos que solicita la extensión

| Permiso | Por qué es necesario |
|---|---|
| `storage` | Guardar en el equipo lo descrito más arriba |
| `webRequest` | Observar la redirección con la que la plataforma entrega la credencial de acceso. Se usa solo para observar: no se bloquea ni se modifica ninguna petición |
| `downloads` | Guardar los archivos en la carpeta de descargas, controlar su progreso, y borrar del historial la anotación que contendría la credencial |
| `platform.ecala.net` | Consultar los web services de Moodle y obtener la credencial de acceso |
| `drive.google.com` | Leer el contenido de las carpetas de Drive enlazadas desde los cursos |
| `drive.usercontent.google.com` | Leer la página de confirmación que Google devuelve al descargar archivos grandes |

La justificación línea por línea, con la llamada de código exacta detrás de
cada una, está en [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md).

IsilHelper **no** solicita permisos de identidad ni credenciales de la API de
Google: no hay ningún proceso de autorización de Google Cloud, y enumerar y
descargar Drive funciona con la sesión que el navegador ya tiene abierta.

## Menores de edad

IsilHelper no está dirigido a menores de 13 años y no recoge información de
nadie, con independencia de su edad.

## Cambios en esta política

Si esta política cambia, el cambio quedará registrado en el historial público
del repositorio, con su fecha. La versión vigente es siempre la publicada en
<https://github.com/elis333333/IsilHelper/blob/main/PRIVACY.md>.

## Contacto

Cualquier consulta sobre privacidad puede plantearse como incidente en el
repositorio público: <https://github.com/elis333333/IsilHelper/issues>.

Condiciones de uso y ausencia de garantías: [LEGAL.md](LEGAL.md).
