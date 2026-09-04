# Accesibilidad en producto propio

Objetivo declarado: **WCAG 2.1 nivel AA**. No es un extra que se añade al final; es parte del criterio de terminado.

## Contraste

- 4,5 : 1 en texto normal, 3 : 1 en texto grande (≥ 24 px, o ≥ 18,66 px en negrita) y en elementos de interfaz.
- **Se mide sobre el fondo real**, no sobre `#0D0D0D` por costumbre. Sobre `#242424` el rosa cae a 4,05 y el azul a 4,46.
- El borde de un campo, el ícono de un estado y la barra del elemento activo son elementos de interfaz: también necesitan 3 : 1.
- Verificar con `suki-brand-tokens/assets/contraste.py`, que sale con código 1 si el par no llega a 4,5.

`#737373` no llega a AA sobre ningún fondo del sistema. Es color de elemento deshabilitado, nunca de texto que alguien deba leer.

## El color nunca es el único portador

Es el criterio 1.4.1 y el que más se rompe. Cada vez que un color comunica algo, algo más lo comunica también:

| Se comunica con | Se añade |
|---|---|
| Fila verde = guardado | Ícono `check` y texto |
| Borde rojo = campo inválido | `aria-invalid`, ícono y mensaje que dice qué corregir |
| Punto de color = estado | Etiqueta de texto junto al punto |
| Serie de un gráfico | Forma, patrón o etiqueta directa |
| Elemento activo en navegación | Cambio de color de texto además de la barra |

## Foco

- Visible en **todo** elemento interactivo: borde de 2 px en el color de acción, con 2 px de separación.
- **Nunca `outline: none`** sin un reemplazo con al menos el mismo contraste.
- El orden de tabulación sigue el orden visual. Si hay que forzarlo con `tabindex` positivo, la maqueta está mal ordenada.
- Un modal atrapa el foco mientras está abierto y lo devuelve al elemento que lo abrió.
- Enlace «saltar al contenido» como primer elemento enfocable de la aplicación.

## Teclado

Toda acción posible con el ratón es posible con el teclado. En particular: cerrar con Escape, confirmar con Enter, moverse en listas y tablas con las flechas, y activar botones con Espacio.

Nada depende de pasar el cursor por encima. Si una información solo aparece en hover, también aparece en foco.

## Movimiento

- Duraciones de 150 a 250 ms, máximo 400. Se animan opacidad y posición.
- **Con `prefers-reduced-motion: reduce` todo aparece sin animación.** Está en el reset de `tokens.css`.
- Sin parpadeos, sin rebotes, sin rotaciones continuas. Nada que destelle más de tres veces por segundo.

## Texto

- Redimensionable hasta el 200 % sin que se pierda contenido ni función. Por eso los tamaños van en `rem`, no en `px`.
- Interlineado de párrafo nunca por debajo del 140 %.
- Línea de 45 a 90 caracteres.
- Sin texto justificado.
- Los textos de interfaz se redactan con `suki-voice`: un mensaje de error en jerga es un problema de accesibilidad cognitiva.

## Estructura

- Encabezados en orden, sin saltarse niveles. El nivel se elige por jerarquía, no por tamaño.
- Elementos semánticos reales: `button` para acciones, `a` para navegación, `table` para datos tabulados. Un `div` con `onClick` no recibe foco ni se anuncia.
- Toda imagen con `alt`; las decorativas con `alt=""` y `aria-hidden`.
- Los íconos que acompañan texto van con `aria-hidden="true"`: el texto ya lo dice.
- Un ícono solo, sin texto, lleva `aria-label`.
- Formularios con `label` asociado por `htmlFor`. El `placeholder` no es una etiqueta.

## Comprobación mínima antes de cerrar una pantalla

1. Recorrer la pantalla entera con Tab: ¿el foco se ve siempre y el orden tiene sentido?
2. Operar la acción principal sin ratón.
3. Verificar el contraste de cada texto sobre su fondo real, incluido el estado hover.
4. Quitar el color mentalmente: ¿se entiende igual?
5. Ampliar el navegador al 200 %: ¿se pierde algo?
6. Activar `prefers-reduced-motion`: ¿algo sigue moviéndose?
