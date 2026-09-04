# Maquetación de documentos

## Página

**A4 vertical**, 210 × 297 mm. Márgenes asimétricos: izquierdo 45 mm, derecho 18 mm, superior 22 mm, inferior 22 mm.

**El margen izquierdo ancho es la columna de etiquetas.** Ahí viven la numeración de apartado, las notas al margen y las etiquetas en monoespaciada. No es un margen desperdiciado: es una columna con función.

## Colores del documento

| Elemento | Valor |
|---|---|
| Portada | Fondo `#0D0D0D`, logotipo, texto `#E6E6E6` |
| Interior | Fondo `#F5F5F5`, texto `#0D0D0D` |
| Texto secundario | `#4D4D4D` |
| Borde de tabla | `#CCCCCC`, 1 px |
| Acento | El de la familia del proyecto, **uno solo en todo el documento** |

**En modo claro el acento nunca colorea texto.** Colorea un bloque, una regla de 3 pt o un punto. El verde da 1,7 : 1 sobre `#F5F5F5` y el amarillo 1,5 : 1: como texto son ilegibles. El morado `#8338EC` es el único acento que sí funciona como texto sobre claro (5,15 : 1), y aun así se reserva para titulares.

## Estilos

| Estilo | Composición |
|---|---|
| Título de apartado | Inter 600, 24 / 32, `#0D0D0D`, con regla superior de 3 pt |
| Subtítulo | Inter 600, 20 / 28 |
| Cuerpo | Inter 400, 11 pt / 17 pt en papel, alineado a la izquierda |
| Etiqueta de apartado | JetBrains Mono, mayúsculas, 9 pt, tracking +8 %, en la columna izquierda |
| Nota al margen | Inter 400, 9 pt, `#4D4D4D` |
| Cifra destacada | Montserrat 600, a gran tamaño |

Se usan **estilos nativos** del procesador de texto (Título 1, Título 2, Normal), no formato aplicado a mano: así el documento puede regenerar su índice y mantiene la coherencia entre versiones.

## Tablas

- Regla superior de 3 pt, regla inferior de 1 pt.
- Encabezado en JetBrains Mono, mayúsculas.
- **Sin relleno alternado, sin bordes decorativos, sin color de fondo.**
- Cifras alineadas a la derecha; texto a la izquierda.
- La fila del total en negrita, separada por una regla de 1 pt.

## Encabezado y pie

Encabezado con el logotipo pequeño en versión positiva clara, a la izquierda. Pie con el número de página a la derecha. La portada no se numera.

## Los cinco puntos en el documento

- **Cabecera del apartado de fases:** la fila completa, a color las contratadas y en `#4D4D4D` el resto.
- **Marcador de apartado:** un punto del color de la familia junto al título.
- **Viñetas de lista:** un punto del color de la familia, del tamaño del texto.

Diámetro mínimo impreso: 2 mm. Por debajo se cierran y se convierten en una mancha.

## Exportación

PDF, siempre. Nunca un formato editable, porque un documento editable invita a que se edite y deja de ser el documento que se firmó.

- Fuentes incrustadas.
- Sin marcas de revisión ni comentarios.
- Nombre de archivo: `suki_propuesta_[cliente]_[aaaa-mm-dd].pdf`, todo en minúscula, sin tildes ni espacios.
- Si se imprime, revisar `suki-brand-tokens/reference/impresion.md`: los bloques grandes de verde, rosa y morado en CMYK salen apagados.
