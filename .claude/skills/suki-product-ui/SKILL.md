---
name: suki-product-ui
description: Interfaces de los productos propios de Suki — Tonemap y las herramientas de Suki Labs. Dark-first sobre #0D0D0D, densidad cómoda, React y Tailwind, patrones de componente con radio 0 y sin sombras, estados que nunca dependen solo del color, la variante de Suki Labs con azul #3A86FF como acento dominante y la firma de respaldo «un proyecto de Suki Labs». Úsala al construir o revisar pantallas, componentes, formularios, tablas o flujos de un producto propio de Suki. NO se usa para el marketing de esos productos —landing, redes o presentación van con suki-brutalist-design— ni para software hecho para un cliente, que nunca lleva la paleta de Suki (suki-client-ui).
---

# Interfaces de producto propio

Aquí alguien trabaja. Una pieza de comunicación se mira treinta segundos; una interfaz se usa durante horas, y eso cambia todas las decisiones.

## Dónde no se usa

| Tarea | Skill |
|---|---|
| Landing, redes o presentación de Tonemap | `suki-brutalist-design` |
| Software entregado a un cliente: ERP, CRM, tableros, portales | `suki-client-ui` — la paleta de Suki está prohibida ahí |
| Propuestas, informes y documentos | `suki-documents` |
| Textos de la interfaz | `suki-voice` |

**El brutalismo no entra en el producto.** Sin escala extrema, sin bloques a sangre, sin márgenes asimétricos, sin números gigantes. Lo que se transfiere es el sistema: radio 0, sin sombras, contraste por superficie, escala de 8, las tres tipografías. Los valores están en `suki-brand-tokens`.

## Dark-first

`#0D0D0D` es la base y el modo por defecto. El modo claro es opcional en un producto propio; si existe, se implementa completo desde el primer día, no como parche.

| Nivel | Color | Para qué |
|---|---|---|
| Fondo de aplicación | `#0D0D0D` | Lienzo |
| Superficie 1 | `#141414` | Barras, paneles laterales |
| Superficie 2 | `#1A1A1A` | Tarjetas, filas de tabla, campos |
| Elevada | `#242424` | Hover, menús, modales |
| Borde | `#4D4D4D` | 1 px, todos los contenedores |
| Borde marcado | `#333333` | Separación de zonas |

La profundidad se consigue subiendo de nivel, nunca con sombra: un modal es `#242424` con borde de 1 px sobre un velo `#0D0D0D` al 70 %, sin desenfoque. **Cuidado con el hover:** sobre `#242424` el rosa cae a 4,05 : 1 y el azul a 4,46 : 1. Si una fila con texto de acento cambia de superficie al pasar el cursor, el texto sube a `#CCCCCC` y el acento se queda en el borde o en el ícono.

## Densidad cómoda

Se prefiere el aire. Un producto propio no es un panel de control industrial: es una herramienta que alguien elige abrir.

```
Altura de control (botón, campo, selector)   40 px  ·  48 px en acción principal
Padding interno de control                   12 / 16
Fila de tabla                                48 px de alto, padding 12 / 16
Separación entre campos de un formulario     24
Separación entre grupos de campos            32
Padding de tarjeta y de panel                24
Separación entre bloques de una pantalla     48
Margen de contenido                          32 en escritorio  ·  20 en móvil
Ancho máximo de columna de lectura           65ch
```

Todos los valores salen de la escala de 8. **No hay modo compacto:** si una tabla no cabe, se quitan columnas o se paginan filas, no se aprieta el interlineado.

## Base técnica

React y Tailwind. Detectar la versión y copiar la configuración de `suki-brand-tokens/assets/` (`tailwind-v4.css` o `tailwind-v3.js`). Íconos **Lucide**, trazo 1,5 px, retícula 24 px, tamaño 16 px en línea y 24 px por defecto.

- Ningún componente declara colores, espaciados ni duraciones propios: todo sale de los tokens.
- Radio 0 en todo. `rounded-none` es el estado por defecto, no una corrección.
- Sin `shadow-*`, sin `bg-gradient-*`, sin `backdrop-blur-*`.
- Transiciones de 150 ms con `cubic-bezier(0.2, 0, 0, 1)`, sobre opacidad y posición.

Patrones con código en `reference/componentes.md`; base copiable en `assets/ui.css` y `assets/componentes.tsx`.

## Componentes

- **Botón principal:** `#06D6A0` con texto `#0D0D0D`. Nunca texto blanco: da 1,9 : 1. Altura 48, padding 16/32, Inter 600.
- **Botón secundario:** transparente, borde 1 px `#4D4D4D`, texto `#CCCCCC`. Hover: fondo `#242424`.
- **Botón destructivo:** borde y texto `#FF3B30`, relleno solo en la confirmación final. Toda acción destructiva pide confirmación con el nombre de lo que se borra escrito en el diálogo.
- **Campo:** fondo `#1A1A1A`, borde 1 px `#4D4D4D`, altura 40, texto `#CCCCCC`. **Etiqueta siempre visible encima**, nunca un placeholder que desaparece al escribir. Foco: borde 2 px `#06D6A0`.
- **Tabla:** encabezado en JetBrains Mono mayúsculas, tracking +8 %, `#999999`. Filas de 48 px separadas por borde inferior de 1 px `#4D4D4D`, sin relleno alternado. Cifras alineadas a la derecha con `tabular-nums`.
- **Navegación lateral:** `#141414`, borde derecho 1 px. Elemento activo con barra de 3 px `#06D6A0` a la izquierda **y** texto en `#E6E6E6`: la barra sola es color como único portador.
- **Modal:** `#242424`, borde 1 px, radio 0, ancho máximo 560. Cierra con Escape y devuelve el foco al elemento que lo abrió.

## Estados y accesibilidad

**El color nunca es el único portador de información.** Es la regla que más se rompe en interfaces y la que más cuesta después.

| Estado | Color | Qué lleva además |
|---|---|---|
| Éxito | `#06D6A0` | Ícono `check` y texto. El verde de éxito es el mismo verde de acción, así que sin texto es ambiguo |
| Error | `#FF3B30` | Ícono `alert-circle`, texto que dice qué corregir, y foco en el campo |
| Advertencia | `#FFBE0B` | Ícono `alert-triangle` y texto |
| Información | `#3A86FF` | Ícono `info` y texto |
| Cargando | — | Texto que dice qué está pasando, no solo un giro |
| Deshabilitado | `#737373` | `aria-disabled` y, si no es obvio, una nota de por qué |
| Seleccionado | Acento | Borde de 2 px **y** cambio de superficie |

Además: foco visible en todo elemento interactivo con borde de 2 px en `#06D6A0`, nunca `outline: none` · navegación completa por teclado, con orden de tabulación que sigue el orden visual · contraste AA mínimo sobre el fondo real · `prefers-reduced-motion` respetado · texto redimensionable hasta el 200 % sin romper la maqueta · un gráfico distingue series por forma o etiqueta además de por color.

## Suki Labs: la variante azul

Las herramientas firmadas por Suki Labs cambian **un solo valor**: el acento dominante pasa del verde `#06D6A0` al azul `#3A86FF`, el color del verbo *Evolucionar*.

- Botón principal `#3A86FF` con texto `#0D0D0D` (5,58 : 1). Blanco encima da 3,48 y solo vale para texto grande.
- El verde sigue siendo el color de éxito, porque es un estado, no un acento. Aparece siempre con ícono y texto, así que no compite.
- Enlaces, foco y elementos activos pasan a azul.
- Firma: `Suki Labs`, con *Labs* en Inter 400 y `#999999`.

Todo lo demás —superficies, tipografía, espaciado, componentes— es idéntico.

## Identidad de un producto propio

Tonemap tiene marca propia. **Su identidad no es la de Suki, y no debe parecerlo.** Un producto que se ve exactamente como su desarrolladora canibaliza a las dos: la marca madre pierde especificidad y el producto pierde nombre propio.

Qué toma del sistema y qué no:

| Toma de Suki | No toma |
|---|---|
| El método: escala de 8, radio 0, sin sombras, contraste por superficie | La paleta de acentos de Suki |
| Las reglas de contraste y accesibilidad | El logotipo y los cinco puntos |
| Inter y JetBrains Mono como base | Montserrat, que es tipografía de la marca madre |
| Densidad cómoda y patrones de componente | El verde `#06D6A0` como color de acción |

El producto **elige su propio color de acción**, verificado a AA sobre `#0D0D0D` con `suki-brand-tokens/assets/contraste.py`. Puede coincidir con un acento de la paleta si hay una razón —Tonemap trabaja con color y emoción, y ahí el color es contenido, no decoración—, pero es una decisión del producto, no una herencia automática. **El único vínculo obligatorio** es la firma de respaldo, en el pie o en la pantalla «acerca de»:

> Tonemap · un proyecto de Suki Labs

Inter 400, tamaño Caption (12/18), en `#999999`. Sin logotipo de Suki a color, sin enlace destacado.

## El error que más se comete

**Traer el brutalismo al producto.** El titular a `clamp(2.75rem, 11vw, 9rem)` que funciona en la landing convierte la pantalla de trabajo en algo que cansa a los veinte minutos. La landing de Tonemap y la pantalla de acordes de Tonemap son dos piezas distintas con dos skills distintas, aunque sean el mismo producto.

El segundo: **comunicar un estado solo con color.** Una fila que se pone verde cuando algo se guardó, un borde rojo sin mensaje, un punto de color sin etiqueta. Falla para quien no distingue esos colores y también para cualquiera que llegue a la pantalla sin contexto.

## Checklist — correr antes de dar por terminada una pantalla

1. ¿Todos los valores salen de tokens, sin HEX ni px escritos a mano?
2. ¿El radio es 0 y no hay ninguna sombra ni degradado?
3. ¿La profundidad se consigue con superficie y borde de 1 px?
4. ¿Cada estado lleva ícono y texto además de color?
5. ¿El texto sobre el botón principal es `#0D0D0D`?
6. ¿El contraste llega a AA sobre el fondo real, incluido el hover en `#242424`?
7. ¿La densidad es cómoda: controles de 40 px, filas de 48 px, campos separados 24?
8. ¿Cada campo tiene etiqueta visible, no un placeholder que desaparece?
9. ¿Se puede recorrer y operar la pantalla entera con el teclado, con el foco siempre visible?
10. ¿Se coló algún recurso brutalista que aquí no toca?

## Referencia bajo demanda

| Archivo | Cuándo abrirlo |
|---|---|
| `reference/componentes.md` | Patrones completos con código: formularios, tablas, navegación, modales, estados vacíos |
| `reference/accesibilidad.md` | Foco, teclado, lectores de pantalla, criterios AA aplicados a interfaz |
| `reference/identidad-de-producto.md` | Definir la identidad de un producto propio nuevo sin canibalizar la de Suki |
| `assets/ui.css` | Capa de componentes sobre los tokens |
| `assets/componentes.tsx` | Componentes React de referencia |
