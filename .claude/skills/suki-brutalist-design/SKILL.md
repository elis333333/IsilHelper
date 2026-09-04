---
name: suki-brutalist-design
description: Dirección de arte brutalista de las piezas con las que Suki se comunica — web y landing pages, secciones de portada, piezas y carruseles de redes, presentaciones, portadas de documentos, tarjeta y papelería. Da escala extrema, bloques macizos a sangre, retícula expuesta, márgenes asimétricos, etiquetas en monoespaciada, los cinco verbos como bloques macizos de altura completa, clamp() para titulares y patrones de componente sin radio ni sombra. Úsala cuando el encargo sea diseñar, maquetar o revisar una pieza propia de Suki que alguien mira, no usa. NO se usa para diseñar pantallas de trabajo ni interfaces donde alguien opera: un producto propio como Tonemap va con suki-product-ui y el software de un cliente con suki-client-ui. Un tablero brutalista es un tablero que se termina odiando.
---

# Brutalismo tipográfico — piezas de comunicación de Suki

## Dónde no se usa

| Sí | No | Con qué skill |
|---|---|---|
| Web y landing de Suki | Interfaces de producto propio (Tonemap, herramientas de Labs) | `suki-product-ui` |
| Piezas y carruseles de redes | ERP, CRM, tableros, portales de cliente | `suki-client-ui` |
| Presentaciones y portadas de propuesta | Interior de propuestas, presupuestos e informes | `suki-documents` |
| Tarjeta y papelería | Facturas y documentos legales | Manda el formato de SUNAT |

**El brutalismo es cómo se comunica Suki, no cómo construye software.** Una pieza brutalista se mira treinta segundos; un tablero se usa ocho horas al día. Un ERP brutalista es un ERP inutilizable, y eso destruye el argumento comercial entero.

Los valores —HEX, escalas, contrastes— salen de `suki-brand-tokens`. Esta skill decide la composición.

## El principio

**Brutalismo estructural, no brutalismo descuidado.** Mostrar la estructura en lugar de esconderla: la retícula se ve, los bloques son macizos, los contrastes son violentos, la tipografía es enorme y las divisiones son cortes, no transiciones.

No significa desorden, ni tipografías feas a propósito, ni contraste roto, ni maquetación descuidada. Suki enfrenta una objeción de edad: un cliente que ya sospecha de improvisación no puede recibir una pieza que parezca improvisada. **La rareza tiene que leerse como decisión, nunca como falta de oficio.** Un brutalismo mal ejecutado confirma la objeción; uno preciso la destruye, porque solo alguien que domina un sistema puede tensarlo así.

## Escala extrema

El contraste tipográfico es la herramienta principal. **Se salta de 180 pt a 9 pt sin escalones intermedios.** Los tamaños medios se usan lo mínimo posible: son los que hacen que una pieza se vea tibia.

Cómo se consigue:

- **Números gigantes.** La numeración de sección en Montserrat a gran tamaño, recortada contra el borde de la página. También los datos: un `10.3:1`, un `#06D6A0`, un `70/20/10`.
- **Un solo titular por pantalla**, con todo el peso. Si compiten dos, no hay escala: hay dos tamaños medios.
- **La nota al pie a 9 pt junto al número a 180 pt.** La tensión está en la distancia entre los dos, no en el tamaño de uno.
- **El texto de lectura mantiene su escala normal.** Body 16/26, línea de 45 a 90 caracteres. El exceso vive en los titulares y en las cifras, nunca en los párrafos.

## Titulares con clamp()

```css
/* Portada: enorme en escritorio, todavía grande en móvil */
.titular-portada { font-size: clamp(2.75rem, 11vw, 9rem);  line-height: 0.95; letter-spacing: -0.03em; }
/* Título de sección */
.titular-seccion { font-size: clamp(2rem, 7vw, 5.5rem);    line-height: 1.02; letter-spacing: -0.02em; }
/* Número de sección, recortable contra el borde */
.numero-seccion  { font-size: clamp(6rem, 22vw, 18rem);    line-height: 0.8;  letter-spacing: -0.04em; }
```

Montserrat 600 en los tres. Interlineado por debajo de 1 en tamaños grandes: es lo que hace que un titular de tres líneas se lea como un bloque macizo y no como tres frases sueltas.

## Bloques macizos y sangrado

Rectángulos de color pleno **a sangre**: sin margen, sin radio, sin sombra. Un bloque termina donde termina la página.

Los elementos gráficos cortan contra el borde. **Nada flota centrado con márgenes iguales por los cuatro lados**, salvo el logotipo. El vacío es un elemento, no un sobrante: se busca que el texto se alinee contra un borde y deje un vacío enorme del otro lado. Sobre un bloque de acento el texto sigue las reglas de contraste de `suki-brand-tokens`: sobre verde y sobre amarillo, `#0D0D0D`; sobre morado, blanco. **El texto nunca va sobre una imagen: va sobre un bloque de color pleno.**

## Retícula expuesta y márgenes asimétricos

Se permite —y se busca— mostrar las líneas de columna como elemento gráfico a baja opacidad. Es la diferencia entre un sistema que se esconde y uno que se enseña.

Los márgenes son asimétricos y visibles. En documento A4: izquierdo 45 mm, derecho 18 mm, superior 22 mm, inferior 22 mm. **El margen ancho es la columna de etiquetas:** ahí viven la numeración, las notas y las etiquetas en monoespaciada. Cada elemento se alinea a la retícula: una posición arbitraria no es brutalismo, es un error disfrazado.

## Etiquetas en monoespaciada

Todas las etiquetas, categorías, numeraciones y overlines van en **JetBrains Mono, mayúsculas, tracking +8 %**. Es el recurso que hace legible la estructura y aporta la textura técnica que sostiene la seriedad del conjunto: `SECCIÓN 04 · LOGOTIPO` · `FASE 2 · ADAPTAR` · `FAMILIA B · AUTOMATIZACIÓN`.

## Reglas gruesas

Las divisiones se hacen con líneas de **3 a 6 pt**, no con filetes de 1 px. En interfaz web: bordes de 1 px para componentes y de 4 px para separar zonas. En tablas: regla superior de 3 pt, regla inferior de 1 pt, encabezado en monoespaciada mayúsculas, sin relleno alternado y sin bordes decorativos.

## Repetición

Una palabra o un elemento repetido en malla es un recurso permitido: la fila de cinco puntos repetida, una etiqueta repetida en el margen, すき en malla al 6 % de opacidad —máximo 8 %, nunca detrás de texto que deba leerse—. Las reglas completas de すき y de los cinco puntos están en `suki-brand-tokens/reference/elementos-graficos.md`.

## Los cinco verbos como bloques a pantalla completa

Es la sección donde el maximalismo tiene permiso total, y no por casualidad es la que explica el cobro por fases.

Cinco bloques macizos, uno por verbo, cada uno con su color, ocupando la pantalla completa en secuencia. Estructura de cada bloque:

```
[etiqueta mono]   FASE 1 · CONSTRUIR
[titular]         Levantar lo que no existe
[texto]           Una o dos frases en lenguaje de negocio
[dato]            Qué se entrega al terminar esta fase
```

Orden fijo: Construir `#06D6A0` · Adaptar `#8338EC` · Integrar `#FFBE0B` · Escalar `#FF006E` · Evolucionar `#3A86FF`. Texto `#0D0D0D` sobre verde, amarillo, rosa y azul; blanco sobre morado.

Plantilla en `assets/verbos.html`. Es la única composición del sistema donde conviven los cinco acentos.

## Componentes

- **Botón principal:** relleno `#06D6A0`, texto `#0D0D0D`, radio 0, borde de 2 px del mismo verde, altura 48 px, padding 16/32, Inter 600. Hover: se invierte a fondo `#0D0D0D` con borde y texto verdes. Nunca texto blanco encima.
- **Botón secundario:** fondo transparente, borde de 2 px en `#CCCCCC`, texto `#CCCCCC`. Hover: fondo `#242424`.
- **Tarjeta:** fondo `#1A1A1A`, borde de 1 px en `#4D4D4D`, radio 0, **sin sombra**. La profundidad es contraste de superficie. Hover: fondo `#242424`; si hay texto de acento dentro, sube a `#CCCCCC` porque el acento pierde AA sobre `#242424`.
- **Navegación:** barra sólida `#0D0D0D`, borde inferior de 4 px, enlaces en Inter 600 con la etiqueta activa subrayada con una regla de 3 px en `#06D6A0`. Sin desenfoque de fondo, sin transparencias.
- **Cursor, scroll y navegación se comportan de forma estándar.** El brutalismo es visual; la usabilidad no se toca.

## Móvil

**La escala baja, la actitud no.** Se mantienen los bloques a sangre, las etiquetas mono y los cortes duros. Cuatro columnas, márgenes de 20 px, titulares con el `clamp()` de arriba. Los cinco bloques de verbos pasan a apilarse a pantalla completa cada uno. Lo que no se mantiene es el margen asimétrico ancho: en 4 columnas no cabe la columna de etiquetas, así que las etiquetas mono pasan encima del titular.

## El 70/20/10 cuando la pieza es maximalista

El maximalismo empuja a más color; la proporción empuja a la contención. La resolución: **el maximalismo se consigue con escala y densidad de información, no con cantidad de color.**

1. **La proporción se mide sobre la pieza completa, no sobre cada página.** Una divisoria puede ser 100 % magenta a sangre. Lo que se verifica es el conjunto: si de 70 páginas ocho son bloques de color pleno, la proporción se sostiene.
2. **El exceso vive en la tipografía.** Un número a 180 pt junto a una nota a 9 pt es maximalismo. Cinco colores en la misma página no lo es: es ruido.
3. **Sigue habiendo un solo acento por composición de contenido.** Excepciones: la fila de cinco puntos y la secuencia de los cinco verbos.
4. **El negro sigue siendo el territorio.** El 70 % no se negocia. Lo que cambia es que el 10 % puede aparecer como un bloque enorme en lugar de un detalle pequeño.

## Lo que este estilo no permite

Romper, deformar o recomponer el logotipo: es la zona intocable del sistema · bajar de WCAG AA, porque el contraste alto es parte del estilo y no su víctima · tipografías fuera de las tres familias · colores fuera de la paleta · sombras, degradados, texturas sucias, ruido, glitch, cintas de advertencia o elementos «rotos» a propósito · emojis, aunque el estilo invite a ello · texto sobre imagen sin bloque de color detrás · párrafos largos en tamaño grande.

## El error que más se comete

**Quedarse en tamaños medios.** Un titular a 48 px con un cuerpo a 20 px no es brutalismo: es una web normal con la tipografía un poco grande. Si el salto no es de un orden de magnitud, la pieza se lee tibia y la rareza no se justifica. El segundo error: **confundir asimetría con desorden.** Un margen asimétrico está medido y se repite en todas las páginas; un elemento colocado a ojo se nota, y confirma la objeción de la edad.

## Checklist — correr antes de dar por terminada la pieza

1. ¿La proporción 70/20/10 se sostiene sobre el conjunto de la pieza?
2. ¿Hay un solo acento por composición de contenido?
3. ¿El contraste llega a AA en todo texto, incluidas las divisorias de color pleno?
4. ¿El salto de escala tipográfica es extremo, o se quedó en tamaños medios?
5. ¿Cada elemento se alinea a la retícula, o hay posiciones arbitrarias disfrazadas de brutalismo?
6. ¿La rareza se lee como decisión o como error?
7. ¿El logotipo está intacto, con sus 2ø de área de protección?
8. ¿Se lee sin esfuerzo el texto de lectura, entre 45 y 90 caracteres por línea?
9. ¿Se imprime bien? (ver `suki-brand-tokens/reference/impresion.md`)
10. ¿Esto podría ser de Suki aunque se le quitara el logotipo?

## Referencia bajo demanda

| Archivo | Cuándo abrirlo |
|---|---|
| `reference/web.md` | Estructura de la web, sección por sección, y reglas de scroll |
| `reference/redes.md` | Medidas, avatar, portadas, plantillas de publicación y carrusel |
| `reference/presentaciones.md` | Presentaciones y portadas de propuesta |
| `reference/papeleria.md` | Tarjeta de presentación y firma de correo |
| `assets/verbos.html` | Los cinco bloques de verbos, listos para copiar |
| `assets/brutal.css` | Clases de la dirección de arte sobre los tokens |

Textos en `suki-voice`. Valores en `suki-brand-tokens`.
