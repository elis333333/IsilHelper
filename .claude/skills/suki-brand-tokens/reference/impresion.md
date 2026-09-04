# Impresión

## Equivalencias

Los valores CMYK y Pantone son **aproximaciones**. Se verifican contra una guía física antes de cualquier tiraje.

| Token | HEX | RGB | CMYK aprox. | Pantone aprox. |
|---|---|---|---|---|
| `action` | `#06D6A0` | 6, 214, 160 | 70 / 0 / 50 / 0 | 3395 C |
| `adapt` | `#8338EC` | 131, 56, 236 | 60 / 75 / 0 / 0 | 2090 C |
| `integrate` | `#FFBE0B` | 255, 190, 11 | 0 / 25 / 95 / 0 | 123 C |
| `scale` | `#FF006E` | 255, 0, 110 | 0 / 100 / 25 / 0 | Rhodamine Red C |
| `evolve` | `#3A86FF` | 58, 134, 255 | 75 / 45 / 0 / 0 | 2727 C |
| `base` | `#0D0D0D` | 13, 13, 13 | 0 / 0 / 0 / 100 | Neutral Black C |

## Los tres colores fuera de gama

`#06D6A0`, `#FF006E` y `#8338EC` **están fuera del espacio CMYK** y se apagan notablemente al imprimirse en cuatricromía.

- En piezas donde el color sea crítico y el presupuesto lo permita, imprimir los puntos como **tintas directas Pantone**.
- En la tarjeta de presentación el problema es menor porque los puntos son pequeños: el desvío es tolerable.
- **Lo que no debe hacerse nunca es imprimir grandes superficies planas de estos tres colores en CMYK.** Un bloque a sangre de `#FF006E` en cuatricromía sale sucio y no se parece a la pantalla.

Siempre pedir prueba de color impresa antes del tiraje completo.

## Modo claro obligatorio

El interior de cualquier documento impreso va en modo claro: fondo `#F5F5F5`, texto `#0D0D0D`. Sesenta páginas en negativo son ilegibles en papel y un desastre en tinta. El negro vive en portadas, divisorias y bloques.

En modo claro, **el acento no colorea texto**: colorea un bloque, una regla o un punto. El verde y el amarillo sobre fondo claro dan 1,7 : 1 y 1,5 : 1 (ver `contraste.md`).

## Papel

Para la tarjeta: couché mate de 350 g con plastificado mate. El mate sostiene el negro `#0D0D0D`; el brillante lo convierte en un espejo de huellas.

Formato de tarjeta: 90 × 50 mm (estándar peruano) o 85 × 55 mm. Sangrado 3 mm, margen de seguridad 5 mm.

## Exportación

| Destino | Formato | Especificación |
|---|---|---|
| Web | SVG optimizado | Trazos convertidos a trazado, sin metadatos, sin capas ocultas |
| Web (respaldo) | PNG | @1x, @2x, @3x, fondo transparente |
| Imprenta | PDF/X-1a | Textos vectorizados, CMYK, sangrado 3 mm |
| Imprenta (tinta directa) | PDF | Con Pantone asignado a los cinco puntos |
| Presentaciones y documentos | PNG a 300 ppp | Fondo transparente |
| Favicon | ICO + PNG | 16, 32, 180, 512 px |

**Antes de exportar, siempre:** convertir texto a trazado, comprobar que no queden objetos fuera del lienzo, verificar que los cinco puntos mantengan diámetro idéntico y que los HEX sean exactamente los de la paleta.

## Facturación

Boleta y factura electrónicas: **manda el formato legal de SUNAT, no la marca**. El logotipo va en versión positiva clara, arriba a la izquierda. Sin acentos, sin elementos gráficos, sin tagline. Es el único lugar, junto a los contratos, donde aparece la razón social completa.
