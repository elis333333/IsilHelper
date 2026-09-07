# Ficha de tienda

> Fase 4 · Distribución. Textos listos para pegar en Chrome Web Store y en
> Firefox AMO, y qué capturas hacen falta.

Esto es el «SEO» de una extensión: no hay sitio que indexar, hay una ficha que
alguien busca. Lo que se indexa es **el nombre, la descripción breve y la
descripción larga**, en ese orden de peso. Los términos que un estudiante de
ISIL escribiría en el buscador de la tienda —«ISIL», «moodle», «ecala»,
«descargar contenidos», «sílabos»— tienen que estar en esos tres sitios, y
cuanto antes mejor.

---

## Decisión pendiente: el nombre de ISIL en el título

`project.md` decidió en su día **no usar el nombre de ISIL en la tienda**. Meter
«ISIL» en el título lo contradice, así que la decisión es de Elis y no se aplica
sola.

Los dos lados:

- **A favor.** Nadie busca «IsilHelper»: nadie sabe que existe. Se busca «ISIL»
  o «moodle ISIL». Un título sin esa palabra es una ficha que no encuentra
  quien la necesita, y el producto entero depende de que la encuentren.
- **En contra.** Es el nombre de un tercero. El riesgo no es usarlo —usarlo para
  describir con qué funciona algo es normal y está admitido—, sino que **parezca
  oficial**. Las tiendas rechazan lo que induce a error sobre quién publica.

**Recomendación: usarlo, con tres condiciones que lo dejan fuera de duda.**

1. El nombre propio va delante y es una palabra inventada: **IsilHelper**. Lo de
   ISIL queda como descripción de para qué sirve, no como quién lo firma.
2. **«No oficial» aparece en la descripción breve**, que es lo que se lee en la
   tarjeta de resultados, y otra vez en la primera línea de la larga.
3. **Cero identidad visual ajena**: ni logotipo, ni isotipo, ni los colores del
   instituto, ni en el icono ni en las capturas.

Si la decisión es la contraria, se cae solo el título: la descripción larga
puede seguir nombrando a ISIL de forma descriptiva sin ningún problema, y ahí
sigue habiendo búsqueda que capturar.

### Dónde se aplica cada campo

En Chrome Web Store **el título de la ficha y la descripción breve no se
escriben en el panel: salen del manifest**. Aplicarlos es editar dos archivos:

| Campo de la tienda | De dónde sale | Archivo |
|---|---|---|
| Título | `manifest.name` | `manifest.config.ts` |
| Descripción breve | `manifest.description` | `package.json`, campo `description` |
| Descripción larga | Panel de la tienda | — |

En Firefox AMO los tres se escriben en el panel, así que el nombre puede ser
distinto del que lleva el manifest.

---

## Chrome Web Store

### Título · 41 de 45 caracteres

```
IsilHelper — descarga tu material de ISIL
```

Alternativa más corta, por si el guion largo estorba: `IsilHelper: descargar
material de ISIL` (38).

### Descripción breve · 122 de 132 caracteres

```
Descarga el material de tus cursos de ISIL en Moodle: sílabos, contenidos y adjuntos, curso entero en un clic. No oficial.
```

Es lo que se lee en la tarjeta de resultados, así que lleva los tres términos
que se buscan —ISIL, Moodle, descargar— y el aviso de que no es oficial.

### Categoría e idioma

Categoría **Herramientas** (*Tools*). Idioma principal **español (Perú)**. Sin
segunda traducción: el público es de un solo instituto.

### Descripción larga

```
IsilHelper descarga a tu computadora el material de tus cursos de ISIL antes de
que se cierre el ciclo.

Proyecto estudiantil independiente. No es una aplicación oficial de ISIL, no
está afiliado al instituto y no tiene relación con él.

EL PROBLEMA

Cuando termina el ciclo, el instituto te quita el acceso a la plataforma. Lo
que no bajaste, lo perdiste: los sílabos, las guías, los PDFs del material
complementario, los enunciados de las evaluaciones. Bajarlo todo a mano son
cientos de clics repartidos entre once cursos, y casi nadie llega a hacerlo
hasta que ya es tarde.

QUÉ HACE

· Descarga un archivo suelto, una sección entera o el curso completo.
· Baja también las carpetas de Google Drive donde viven los contenidos T01–T15
  y los sílabos, entrando en las subcarpetas. No hay que configurar nada ni
  crear ninguna credencial de Google.
· Deja el material ordenado en tu carpeta de descargas, por curso y por
  sección, con los nombres tal como aparecen en el aula.
· Guarda junto al material un índice del curso con la lista de archivos y los
  enlaces externos.
· Cola de descargas con progreso, pausa y reanudación. Salta lo que ya bajaste.

Y para llegar cómodo hasta el material:

· Pendientes: las entregas de todos tus cursos en una sola lista ordenada por
  fecha, en vez de una pestaña por curso.
· Cursos: tu avance de un vistazo y el contenido de cada uno.
· Notas: el boletín de todos los cursos en una tabla, con el promedio.
· Buscar: sobre lo que ya está cargado, diciendo siempre qué alcance tiene.

CÓMO FUNCIONA

IsilHelper trabaja sobre los web services públicos de Moodle de la plataforma
del instituto, platform.ecala.net, usando la sesión que tú ya tienes abierta.

Entras a la plataforma como siempre —con tu captcha y tu verificación en dos
pasos, a mano— y luego pulsas Conectar. Eso es todo. No se te pide usuario ni
contraseña en ningún momento, ni de ISIL ni de Google. Cualquier extensión o
página que te pida esas credenciales no es esta.

TU INFORMACIÓN NO SALE DE TU EQUIPO

· No hay servidor. Ninguno. Ni base de datos, ni servicio intermedio.
· Sin estadísticas de uso, sin telemetría, sin publicidad.
· Las únicas peticiones que salen van a la plataforma del instituto y a Google
  Drive, que son los dos sitios donde está tu material.
· La credencial de acceso no se muestra, no se registra y no queda anotada en
  el historial de descargas de tu navegador.
· Todo lo que la extensión guarda se borra al cerrar sesión o al desinstalarla.
· El código es abierto y cualquiera puede comprobar cada línea de lo anterior.

Política de privacidad completa:
https://github.com/elis333333/IsilHelper/blob/master/PRIVACY.md

QUÉ NO HACE

· No escribe nada en la plataforma: no entrega tareas, no marca actividades
  como completadas y no responde en foros. Solo lee.
· No automatiza el inicio de sesión.
· No descarga las clases grabadas de Zoom.
· No te pide crear credenciales en la consola de Google Cloud.

ANTES DE INSTALAR

La extensión depende de servicios que no controla. Si el instituto desactiva el
servicio móvil de Moodle, o si Google cambia sus páginas, dejará de funcionar
en todo o en parte, y te lo dirá con claridad en pantalla en lugar de
enseñarte una lista vacía como si estuviera completa. Aquí no se promete
permanencia.

Aviso legal completo:
https://github.com/elis333333/IsilHelper/blob/master/LEGAL.md

IsilHelper · un proyecto de Suki
```

### URL de política de privacidad

Chrome Web Store la exige y hay que pegarla en la pestaña *Privacidad*:

```
https://github.com/elis333333/IsilHelper/blob/master/PRIVACY.md
```

En esa misma pestaña hay que justificar cada permiso. Está resuelto: la tabla
de `PRIVACY.md` tiene una línea por permiso, redactada para eso.

---

## Firefox AMO

AMO indexa peor que Chrome y muestra el resumen completo en los resultados, así
que ahí el resumen carga con más trabajo que la descripción breve de Chrome.

### Nombre · 39 de 50 caracteres

```
IsilHelper — descargar material de ISIL
```

### Resumen · 242 de 250 caracteres

```
Descarga a tu equipo el material de tus cursos de ISIL antes de que cierren el ciclo: sílabos, contenidos T01–T15, PDFs de complementario y adjuntos de las evaluaciones, incluidas las carpetas de Google Drive. Proyecto estudiantil no oficial.
```

### Descripción

La misma de Chrome. AMO admite un poco de formato: negrita en los encabezados y
listas de verdad en lugar de los puntos medios.

### Etiquetas

```
isil · moodle · ecala · descargas · universidad · estudiantes · drive
```

### Campos propios de AMO

- **Licencia.** AMO obliga a elegir una. Está sin decidir (ver `session.md`).
- **Notas para quien revisa.** Conviene explicar de entrada lo que va a llamar
  la atención al leer el código, o el envío se queda parado en la cola:

  ```
  La extensión obtiene una credencial de la propia plataforma Moodle del
  instituto observando una redirección con webRequest, en modo observacional y
  sin bloquear. No se piden credenciales al usuario en ningún momento; la
  sesión la inicia él a mano en la plataforma.

  La lectura de carpetas de Google Drive se hace sobre la vista pública
  embeddedfolderview con la sesión que el navegador ya tiene, sin OAuth y sin
  client_id. El análisis de ese HTML está aislado en src/api/drive-links.ts y
  src/api/drive-folder.ts, con tests sobre HTML real anonimizado.

  No hay servidor propio, ni telemetría, ni código remoto: todo lo que se
  ejecuta está en el paquete.
  ```

---

## Capturas

Chrome pide **1280 × 800** (o 640 × 400) y admite hasta cinco. AMO acepta las
mismas y les pone pie de foto. Se hacen las cinco en ese orden: la primera es la
que se ve en la tarjeta de resultados y tiene que enseñar **la descarga**, no el
tablero.

| # | Pantalla | Qué tiene que demostrar | Pie de foto |
|---|---|---|---|
| 1 | Detalle de un curso, con los botones de descarga a la vista | Que se baja un curso entero de un clic. Es la razón de ser del producto | «Un curso entero, en un clic» |
| 2 | El explorador de archivos con `Descargas/IsilHelper/` abierto, dos o tres cursos desplegados | Que el material acaba **en tu disco** y ordenado. Es la prueba de la promesa | «Ordenado por curso y sección, en tu carpeta de descargas» |
| 3 | Pantalla de descargas con la cola a media tanda | Progreso, pausa y reanudación, y que salta lo ya bajado | «La cola sigue donde la dejaste» |
| 4 | Panel de Drive con el resultado de explorar un curso | Que los contenidos T01–T15 también se bajan, sin configurar nada | «Los contenidos viven en Drive, y también se bajan» |
| 5 | Pendientes, con la lista cronológica de varios cursos | Lo que hace cómodo llegar al material | «Todas tus entregas en una sola lista» |

Reglas para las cinco:

- **Sin datos personales.** Nombre completo, correo institucional y foto de
  perfil fuera: se recortan o se sustituyen por unos de prueba. Vale la pena
  hacerlas con la cabecera fuera de encuadre.
- **Sin identidad visual del instituto.** Ningún logotipo ajeno, en ninguna.
- **Nombres de curso reales**, que es lo que hace que un estudiante se
  reconozca. No inventarse cursos genéricos.
- Modo oscuro, que es el oficial del sistema, y ventana a 1280 × 800 exactos
  para no reescalar y perder nitidez.
- Nada de flechas ni círculos rojos encima: la interfaz se explica sola y el
  pie de foto dice el resto.

### Otras piezas gráficas

| Pieza | Tamaño | Obligatoria | Nota |
|---|---|---|---|
| Icono de tienda | 128 × 128 | Sí | Hecho: `public/iconos/icono-128.png` |
| Mosaico promocional pequeño | 440 × 280 | Solo si se quiere aparecer en portadas | Los cinco puntos y el nombre sobre `#0D0D0D`. Sin capturas dentro: a ese tamaño no se lee nada |
| Mosaico marquesina | 1400 × 560 | No | Se deja para cuando haya algo que promocionar |
