# Logotipo

## Anatomía

Dos elementos, siempre en la misma relación:

- **Logotipo:** la palabra *Suki* compuesta en Montserrat, en gris claro `#CCCCCC`.
- **Los cinco puntos:** una fila de cinco círculos del mismo diámetro, alineados bajo la palabra.

| Posición | Verbo | Color |
|---|---|---|
| 1 | Construir | `#06D6A0` |
| 2 | Adaptar | `#8338EC` |
| 3 | Integrar | `#FFBE0B` |
| 4 | Escalar | `#FF006E` |
| 5 | Evolucionar | `#3A86FF` |

**El orden es fijo y no se altera nunca.** Los puntos no son cinco colores bonitos: son un índice donde cada posición corresponde a un verbo, a una familia de servicio y a una fase de cobro.

## El módulo ø

Toda la geometría se mide en **ø**, el diámetro de un punto, para que las reglas sigan siendo válidas a cualquier escala.

- **Área de protección: 2ø libres en los cuatro lados.** No entra nada: ni texto, ni otro logo, ni el borde de la pieza.
- **Separación entre puntos** y **distancia de la palabra a los puntos:** las del archivo original. No se modifican.

## Versiones

| Versión | Qué incluye | Cuándo |
|---|---|---|
| Principal | Palabra + cinco puntos sobre `#0D0D0D` | Uso por defecto en todo |
| Positiva clara | Palabra en `#0D0D0D` sobre fondo claro | Impresión, documentos, correo, modo claro |
| Isotipo | La *S* con los cinco puntos, dentro de la cajita | Avatares, sellos, espacios cuadrados |
| Favicon | La *S* sola, sin puntos | Solo por debajo de 32 px |
| Horizontal | Compacta para cabeceras estrechas — *pendiente de diseñar* | Barras de navegación, firmas |
| Apilada | Vertical — *pendiente de diseñar* | Formatos verticales, papelería |
| Monocromática | Un solo color plano | Bordado, grabado, sello, una tinta |

**Los cinco puntos se usan siempre que sea técnicamente posible.** Solo desaparecen en el favicon y en la excepción de la monocromática.

**Norma de la versión monocromática:** los cinco puntos se mantienen, compuestos en el mismo color plano del logotipo. No se convierten a grises distintos —quedarían sucios y sin sentido, porque el gris no comunica ningún verbo—. Se omiten solo cuando la técnica no los admite: bordado por debajo del tamaño en que cinco círculos separados se funden, o un sello que no resuelve el detalle. En ese caso se usa la palabra sola y se documenta la excepción en el archivo.

## Tamaños mínimos

| Versión | Digital | Impreso |
|---|---|---|
| Logotipo completo | 96 px de ancho | 25 mm de ancho |
| Isotipo con puntos | 32 px | 10 mm |
| Favicon (S sola) | 16 px | no aplica |

Por debajo del mínimo los puntos se cierran y se convierten en una mancha. Es un límite físico, no una recomendación.

## Fondos y la cajita

El logotipo por sí solo **no tiene contraste suficiente sobre fotografía**. Por eso existe la cajita: un contenedor sólido, normalmente `#0D0D0D`, dentro del cual el logo siempre se lee.

- Sobre fondo plano de la paleta, el logo va directo.
- Sobre fotografía, textura, ilustración o cualquier fondo no controlado, **va siempre dentro de la cajita**.
- No hay tercera opción. No se usan sombras ni contornos para salvar el contraste.

La cajita es **la única excepción a las esquinas rectas** del sistema: radio del **8 % del lado menor**, lo que la mantiene proporcional a cualquier tamaño.

## Usos prohibidos

Cada uno con lo que rompe:

1. **Deformar o cambiar la proporción** — los puntos dejan de ser círculos y el sistema pierde su única forma redonda.
2. **Rotar** — la fila de puntos deja de leerse como secuencia de izquierda a derecha, que es lo que la hace un índice.
3. **Cambiar el color de cualquiera de los cinco puntos** — cada color pertenece a un verbo; cambiarlo rompe la correspondencia con las familias y con las fases de cobro.
4. **Alterar el orden de los puntos** — reordena los verbos y desactiva el indicador de fases.
5. **Cambiar la tipografía o recomponer el nombre con otra fuente** — el logotipo es un dibujo cerrado, no un texto que se vuelve a escribir.
6. **Aplicar sombra, resplandor, biselado o contorno** — el sistema no tiene difuminado en ninguna parte.
7. **Aplicar degradado al logotipo o a los puntos** — no hay degradados en la marca.
8. **Colocarlo sobre fondos sin contraste suficiente** — se lee mal justo donde más importa que se lea.
9. **Colocarlo sobre fotografía sin cajita** — la fotografía es un fondo no controlado y el contraste deja de ser verificable.
10. **Invadir el área de protección de 2ø** — el vacío es parte de la pieza, no un sobrante que se pueda ocupar.
11. **Usarlo por debajo del tamaño mínimo** — los puntos se funden en una mancha.
12. **Encerrarlo en formas ajenas al sistema** — círculos, rombos o marcos con radio son formas que la marca no tiene.
13. **Añadirle un descriptor** («Suki Tecnología», «Suki Software») — ningún descriptor acompaña al nombre; Suki va solo.
14. **Usar los puntos separados como si fueran un logo distinto** — son un elemento gráfico de la marca, no una marca alternativa.
15. **Rellenar la palabra con una imagen o textura** — el logotipo es color plano.
16. **Convertir los puntos en cuadrados o en otra cantidad** — cinco, circulares, o no son los puntos.

Ninguno se resuelve con una excepción puntual. Si el espacio es estrecho, se usa la versión horizontal o el isotipo; si el fondo es una fotografía, la cajita; si la tinta es una sola, la monocromática. El sistema ya tiene una respuesta para cada caso.

## Firmas de submarca

- **Suki Labs:** se compone junto al logotipo, con *Labs* en Inter 400 y en `#999999`.
- **Producto propio con respaldo:** `Tonemap · un proyecto de Suki Labs`, en Inter 400, tamaño Caption, en `#999999`.
- **Servicios:** siempre firmados como *Suki*, sin descriptor.
- **Trabajo entregado a cliente:** el logotipo de Suki **no aparece**. La única firma permitida es una línea de texto, `Desarrollado por Suki`, en el color de texto secundario del sistema del cliente y acordada antes de entregar. Ver `suki-client-ui`.

## Nomenclatura de archivo

```
suki_[elemento]_[variante]_[fondo]_[espacio-color][@tamaño].[ext]
```

Todo en minúscula, guion bajo entre segmentos, guion medio dentro de un segmento, sin tildes ni espacios. Los segmentos que no apliquen se omiten sin dejar el guion suelto.

```
suki_logotipo-completo_positivo_oscuro_rgb.svg
suki_logotipo-completo_positivo_claro_cmyk.pdf
suki_isotipo_positivo_oscuro_rgb@2x.png
suki_favicon_32.png
suki-labs_logotipo-completo_positivo_oscuro_rgb.svg
tonemap_logotipo_positivo_oscuro_rgb.svg
```

Versión `_v1.0` solo en archivos fuente y en el manual. Los exportados no llevan versión: se reemplazan.
