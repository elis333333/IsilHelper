# Elementos gráficos

## Los cinco puntos — elemento primario

Es el activo gráfico más valioso de la marca: se reconoce sin el logotipo. Y es lo único del sistema que puede aparecer solo, siempre que no pretenda sustituir a la marca.

| Uso aprobado | Cómo |
|---|---|
| Separador | Entre secciones o entre bloques de texto |
| Viñeta de lista | Un punto, con el color de la familia correspondiente |
| Indicador de fases | El uso más importante. Detalle abajo |
| Marcador de sección | En documentos y presentaciones |
| Patrón | La fila repetida a gran escala, a baja opacidad, nunca detrás de texto |

**Nunca:** los puntos como logotipo independiente · en otro orden · en otros colores · en cantidad distinta de cinco · deformados o convertidos en cuadrados.

### Indicador de fases

Cinco puntos, cinco verbos, cinco fases del proyecto, y el cobro va por fases alcanzadas. Esa coincidencia convierte un recurso gráfico en un argumento comercial: el cliente ve dónde está y qué está pagando sin que nadie se lo explique.

Los puntos completados se muestran a color; los pendientes en `#4D4D4D`.

```
FASE 1 · CONSTRUIR      completada
FASE 2 · ADAPTAR        completada
FASE 3 · INTEGRAR       en curso
FASE 4 · ESCALAR        pendiente
FASE 5 · EVOLUCIONAR    pendiente
```

**No se marca como completada una fase que no se entregó.** El indicador solo sirve si el cliente puede confiar en él, y basta una vez para perderlo.

La estructura completa de la propuesta y el apartado de qué incluye cada fase están en `suki-documents`.

### Animación firma

Los cinco puntos aparecen en secuencia con 60 ms de desfase entre uno y otro. Se anima opacidad y posición, con la curva `cubic-bezier(0.2, 0, 0, 1)`. Se reserva para la carga de la web o la apertura de una presentación, nunca para una interacción repetida. Con `prefers-reduced-motion` activo, aparecen los cinco a la vez, sin animación.

## すき — recurso gráfico

Los caracteres hiragana funcionan como sello o marca de agua discreta: en portadas a gran escala y baja opacidad, en el reverso de la tarjeta, como detalle en piezas de redes.

| Regla | Motivo |
|---|---|
| Es decorativo, nunca parte del logotipo ni sustituto del nombre | El logotipo está cerrado y no admite añadidos |
| Nunca junto a una traducción o a una afirmación de significado | En hiragana puede corresponder a más de una palabra |
| Nunca donde pueda leerse como que Suki es una empresa japonesa | No lo es, y fingirlo es el tipo de adorno que la marca rechaza |
| Opacidad máxima del 8 % como fondo | Por encima compite con el contenido |
| Nunca detrás de texto que deba leerse | El contraste se mide sobre el fondo real |
| Composición correcta con Noto Sans JP | Un dibujo aproximado de los caracteres se nota, y se nota mal |

**No se compone ninguna frase en japonés en ninguna pieza.** Ni eslogan, ni firma, ni pie de página. Los dos caracteres funcionan como sello precisamente porque no pretenden decir nada.

## Retícula modular — recurso estructural

El tercer elemento del sistema, el que da cuerpo a las composiciones grandes: una malla de módulos cuadrados de la que se activan algunos, dibujada con líneas de 1 px y rellenos de color plano. Es la traducción literal de *Construir* y es la misma retícula que ya gobierna las piezas, hecha visible.

| Regla | Valor |
|---|---|
| Módulo | Cuadrado, con el lado tomado de la escala: 16, 24, 32, 48 o 64 |
| Línea de la malla | 1 px, `#4D4D4D` sobre oscuro o `#CCCCCC` sobre claro |
| Módulos activados | Nunca más de un tercio del total: la malla debe seguir leyéndose como malla |
| Color del módulo activado | El acento de la familia de la pieza, o una superficie neutra |
| Forma | Radio 0, sin sombra, sin degradado |
| Alineación | Los módulos coinciden con las columnas de la pieza |
| Prohibido | Que los módulos formen una figura reconocible, y estar detrás de texto |

**Dónde se usa:** fondo de portada de propuesta con los módulos del color de la familia · separador entre secciones de la web · marca de agua de una lámina de redes · composición geométrica propia cuando no hay imagen que mostrar.

## Iconografía

**Lucide**, trazo de 1,5 px, retícula de 24 px. Es el estándar del entorno React/Tailwind en el que trabaja Suki, lo que evita mantener un set propio.

| Tamaño | Uso |
|---|---|
| 16 px | Texto en línea y tablas densas |
| 24 px | Tamaño por defecto |
| 32 px | Encabezado de bloque |
| 48 px | Encabezado de familia |

El grosor de trazo se escala con el ícono y no se ajusta a mano: engordarlo a 48 px produce un peso distinto al del resto de la pieza.

- Un solo grosor en toda la pieza; dos se leen como dos sets distintos.
- Color heredado del texto. Acento solo cuando el ícono representa una familia de servicio: es el único caso en que el color informa.
- Nunca íconos rellenos mezclados con íconos de trazo.
- Nunca íconos decorativos que repitan lo que ya dice el texto. Un sobre junto a «correo» no añade nada.
- Alineación óptica con la altura de x, no con la línea base, y respeto de 4 px.
- Si necesita fondo, es un cuadrado de radio 0. Nunca un círculo.
- **No se dibujan íconos propios.** Si el set no tiene el concepto, se usa texto.

**Íconos por familia:** A `boxes` · B `zap` · C `monitor` · D `bar-chart-3` · E `flask-conical`. Cada uno con el color de su familia.

## Imágenes

**Prohibido, sin excepciones:** banco de imágenes de gente sonriendo frente a una laptop · manos tocando hologramas · cerebros digitales · circuitos · código verde sobre negro · candados y escudos como metáfora · el planeta rodeado de líneas. Si la imagen serviría igual para otra empresa de tecnología, no dice nada de esta.

**Permitido, en este orden de preferencia:**

1. **Capturas reales de trabajo entregado**, en marcos de dispositivo sobrios. Es lo que más ayuda con la objeción de la desconfianza: se ve lo que se hizo. Datos anonimizados, nunca inventados.
2. **Fotografía real del negocio del cliente**, con permiso, mostrando el antes y el después de un proceso. Luz existente, sin flash; solo exposición y balance. Personas trabajando, no posando.
3. **Composiciones geométricas propias** con la retícula modular, los puntos y la malla.
4. **Sin imagen.** Una composición tipográfica limpia sobre `#0D0D0D` es siempre mejor que una foto de relleno.

En los cuatro casos: recorte recto, radio 0, borde de 1 px si lo necesita, sin sombra, sin viñeteado, sin filtros ni duotono. Si una imagen no funciona a color, no se usa.

**El texto nunca va sobre una imagen:** va sobre un bloque de color pleno.
