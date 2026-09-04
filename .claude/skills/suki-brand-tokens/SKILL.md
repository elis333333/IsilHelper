---
name: suki-brand-tokens
description: Valores exactos del sistema visual de Suki — paleta con HEX, correspondencia verbo–color–familia, proporción 70/20/10, escala de neutros con sus contrastes, tipografía, espaciado, radio 0, movimiento, y tokens listos para CSS, Tailwind y JSON. Úsala siempre que haya que elegir un color, un tamaño de texto, un espaciado, un radio o una duración para una pieza propia de Suki, o juzgar si algo cumple el sistema, aunque no se nombren la marca ni los tokens. Es la base que las demás skills de Suki cargan por referencia. NO se usa en software entregado a clientes, donde la paleta de Suki está prohibida (suki-client-ui), ni para redactar textos (suki-voice), ni decide la composición de una pieza completa (suki-brutalist-design).
---

# Sistema visual de Suki — valores ejecutables

Autoridad sobre cualquier valor visual de una pieza propia. La personalidad sale de la precisión del sistema, no de gestos llamativos: ante una decisión dudosa gana la opción que transmite fiabilidad.

## Alcance: esta paleta es solo para piezas propias

Se aplica a web y landing de Suki, redes, presentaciones, papelería, documentos y productos propios (Tonemap, Suki Labs). **No se aplica a software entregado a un cliente:** un ERP para una ferretería en `#06D6A0` pisa la marca de quien paga. Ese trabajo lleva los colores del cliente — usa `suki-client-ui`.

## Antes de escribir CSS

Copiar `assets/tokens.css` al proyecto. Ningún otro archivo declara colores, espaciados, radios ni duraciones. Para Tailwind, detectar la versión y copiar la forma correspondiente:

```bash
node -p "require('./package.json').devDependencies?.tailwindcss ?? require('./package.json').dependencies?.tailwindcss"
# empieza en 4 → assets/tailwind-v4.css (bloque @theme, se importa en el CSS)
# empieza en 3 → assets/tailwind-v3.js  (theme.extend de tailwind.config.js)
```

## La regla que más se incumple

**70 % neutros oscuros · 20 % verde · 10 % resto de acentos.** El verde es acento: un botón, un enlace, un borde activo, un número. Nunca fondo de sección ni de tarjeta. Los otros cuatro son puntuación: un ícono, un borde, una etiqueta.

Se verifica **por sección mientras se maqueta**, no al final; al final ya es un rediseño. **Un solo color de acento por composición** — única excepción, la fila completa de los cinco puntos.

## Paleta de marca

Cerrada, no se añaden colores. Cada acento pertenece a un verbo y a una familia, y eso convierte la paleta en un código legible. El logotipo es gris y eso es correcto: la identidad son los cinco puntos y la palabra, no el verde.

| Token | HEX | Verbo | Familia | Rol |
|---|---|---|---|---|
| `--color-action` | `#06D6A0` | Construir | C · Producto digital | **Acción.** Botones, enlaces, estados activos |
| `--color-adapt` | `#8338EC` | Adaptar | A · Sistemas de gestión | Acento |
| `--color-integrate` | `#FFBE0B` | Integrar | B · Automatización e IA | Acento |
| `--color-scale` | `#FF006E` | Escalar | D · Datos e inteligencia | Acento |
| `--color-evolve` | `#3A86FF` | Evolucionar | E · Suki Labs | Acento |
| `--color-base` | `#0D0D0D` | — | — | Fondo base. El territorio de la marca |

## Neutros, modo oscuro y modo claro

Escala neutra pura, sin matiz: la paleta ya es muy saturada. Los ratios son sobre `#0D0D0D`.

```
#0D0D0D  base            #141414  superficie 1     #1A1A1A  superficie 2, tarjetas
#242424  elevada, hover  #333333  borde marcado    #4D4D4D  borde sutil, divisores
#737373  deshabilitado, decorativo       4,1 : 1  → NO APTO PARA TEXTO
#999999  terciario, pies de foto         6,8 : 1
#B3B3B3  texto secundario                9,3 : 1
#CCCCCC  TEXTO PRINCIPAL, gris del logotipo       12,1 : 1
#E6E6E6  títulos                        15,6 : 1
#F5F5F5  fondo del modo claro    ·   #FFFFFF  texto sobre color    19,4 : 1
```

El blanco puro casi no se usa como texto sobre oscuro: `#CCCCCC` es el color de lectura por defecto, cansa menos y es el gris del logotipo. **El modo oscuro es el oficial.** El claro existe para impresión, documentos y correo: fondo `#F5F5F5`, superficie `#FFFFFF`, texto `#0D0D0D`, secundario `#4D4D4D`, borde `#CCCCCC`. En los dos modos la acción es `#06D6A0` con texto `#0D0D0D` encima.

## Contraste — las tres reglas no negociables

| Color | Como texto sobre `#0D0D0D` | Texto encima del color |
|---|---|---|
| `#06D6A0` | 10,3 : 1 — apto para todo | **Solo `#0D0D0D`.** Blanco da 1,9 : 1 |
| `#FFBE0B` | 11,7 : 1 — apto para todo | **Solo `#0D0D0D`.** Blanco da 1,7 : 1 |
| `#3A86FF` | 5,6 : 1 — apto para texto normal | Blanco solo en texto grande (3,5 : 1) |
| `#FF006E` | 5,1 : 1 — apto para texto normal | Blanco solo en texto grande (3,8 : 1) |
| `#8338EC` | 3,5 : 1 — **no apto para texto pequeño** | Blanco sí funciona (5,6 : 1) |

1. **Sobre verde y sobre amarillo el texto siempre es `#0D0D0D`.** Nunca blanco.
2. **El morado `#8338EC` no se usa como texto sobre fondo oscuro.** Va como relleno con blanco encima, o como elemento gráfico sin texto.
3. **Mínimo WCAG AA:** 4,5 : 1 en texto normal, 3 : 1 en texto grande y elementos de interfaz.

El ratio se mide sobre el fondo **real**: sobre `#242424` el rosa cae a 4,1 : 1 y el azul a 4,5 : 1. Matriz completa y modo claro en `reference/contraste.md`.

## Colores funcionales

Fuera de la paleta de marca, **existen solo dentro de interfaces**; no aparecen en comunicación ni papelería. Error `#FF3B30` en oscuro y `#C62828` en claro · Éxito `#06D6A0` · Advertencia `#FFBE0B` · Información `#3A86FF`. El error usa un rojo propio porque nadie interpreta un magenta como alarma. **El color nunca es el único portador de información:** todo estado lleva ícono y texto además del color. Es accesibilidad y también claridad, porque el verde de éxito es el mismo verde de acción.

## Tipografía

- **Montserrat** — logotipo y titulares de marca de hasta cinco palabras. Nunca párrafos, tablas ni interfaces: es una geométrica de cartel y en texto corrido se vuelve incómoda.
- **Inter** — todo lo demás: web, interfaces, documentos, redes. Pesos 400 · 500 · 600 · 700. **Nunca 800 ni 900.**
- **JetBrains Mono** — código, datos tabulados, etiquetas técnicas, numeración. Nunca texto comercial.
- Fallbacks: `Montserrat → Arial → sans-serif` · `Inter → Segoe UI → Helvetica → Arial → sans-serif` · `JetBrains Mono → Consolas → Courier New → monospace`.

```
Display  48 / 56  Montserrat 600, tracking −2 %    H1  36 / 44  Inter 700, tracking −1 %
H2       30 / 38  Inter 600, tracking −1 %         H3  24 / 32  Inter 600
H4       20 / 28  Inter 600                        Body L  18 / 30  Inter 400
Body     16 / 26  Inter 400                        Body S  14 / 22  Inter 400
Caption  12 / 18  Inter 400                        Mono    14 / 22  JetBrains Mono 400
Etiqueta 12 / 16  Inter 600, mayúsculas, tracking +6 %
```

Títulos en caja normal, nunca en mayúsculas completas: las mayúsculas quedan para etiquetas y overlines. Interlineado de párrafo nunca por debajo del 140 %. Línea de 45 a 90 caracteres (`max-width: 65ch`). Alineación izquierda siempre, **sin texto justificado**. Negrita para un dato puntual, nunca un párrafo entero. Cursiva solo en citas, notas y términos extranjeros. Sin subrayado salvo en enlaces.

## Espaciado y retícula

Base 4, escala en múltiplos de 8: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128`. **No existen valores intermedios:** si algo «necesita» 30 px, la respuesta es 32 o 24. Densidad cómoda, se prefiere el aire: secciones 96–128 · bloques 48–64 · componentes 24–32 · elementos pequeños 8–16.

Retícula — escritorio 12 columnas, medianil 24, márgenes 64–120 · tableta 8 columnas, márgenes 48 · móvil 4 columnas, márgenes 20. Contenedor máximo 1 280, contenido 1 200.

## Forma, elevación y movimiento

**Radio 0 en todo el sistema:** botones, campos, tarjetas, contenedores, imágenes. La rectitud contrasta con la redondez de los cinco puntos, y esa tensión es la firma formal de la marca. **Dos excepciones únicas:** los cinco puntos, circulares por definición, y la cajita del logotipo, con radio del 8 % del lado menor.

**Sin sombras, sin resplandores, sin degradados, sin efectos de cristal.** La profundidad se consigue con contraste entre superficies (`#0D0D0D` → `#1A1A1A` → `#242424`) y bordes de 1 px en `#4D4D4D`. Una sombra difuminada se ve limpia en pantalla y sucia en papel, y este sistema funciona en los dos sitios.

Movimiento: 150 ms en microinteracciones, 250 ms en transiciones de bloque, 400 ms como máximo absoluto. Curva única `cubic-bezier(0.2, 0, 0, 1)`. Se animan opacidad y posición; el color nunca es el único cambio. La animación firma son los cinco puntos apareciendo en secuencia con 60 ms de desfase, reservada a la carga de la web. Sin parpadeos, sin rebotes, sin rotaciones continuas. Con `prefers-reduced-motion` activo, todo aparece sin animación.

## El error que más se comete

**Texto blanco sobre el verde `#06D6A0`.** Da 1,9 : 1 y es ilegible. Pasa porque el verde se ve oscuro en el monitor de quien maqueta y porque el blanco sobre color es el reflejo por defecto. Sobre verde y sobre amarillo el texto es siempre `#0D0D0D`. El segundo error: **usar el verde como fondo de sección o de tarjeta.** Deja de ser acción, pasa a ser decoración y arrastra el 70/20/10 al primer intento.

## Checklist — correr antes de dar por terminada cualquier pieza

1. ¿Todos los valores salen de tokens? (buscar HEX, px y ms escritos a mano)
2. ¿La proporción 70/20/10 se sostiene en esta sección?
3. ¿El verde aparece como acento y no como fondo?
4. ¿Hay un solo color de acento en la composición?
5. ¿El texto sobre verde y sobre amarillo es `#0D0D0D`?
6. ¿El contraste llega a AA sobre el fondo real, no sobre el supuesto?
7. ¿Los espaciados salen de la escala de 8, sin valores intermedios?
8. ¿El radio es 0 en todo salvo los cinco puntos y la cajita?
9. ¿Se coló alguna sombra o algún degradado?
10. ¿Esto podría ser de Suki aunque se le quitara el logotipo? Si la respuesta es «no», el problema no es un detalle: es el planteamiento.

## Detectar valores fuera del sistema

```bash
grep -rn --include=*.css --include=*.tsx --include=*.jsx -E "#[0-9A-Fa-f]{3,8}\b" src | grep -v tokens.css   # HEX a mano
grep -rnE "(padding|margin|gap):[^;]*[0-9]+px" src --include=*.css | grep -vE "\b(0|4|8|12|16|24|32|48|64|96|128)px"
grep -rnE "box-shadow|text-shadow|linear-gradient|radial-gradient|border-radius" src --include=*.css        # prohibidos
python3 assets/contraste.py                      # audita la paleta completa
python3 assets/contraste.py '#06D6A0' '#FFFFFF'  # comprueba un par cualquiera
```

## Referencia bajo demanda

| Archivo | Cuándo abrirlo |
|---|---|
| `reference/logotipo.md` | Colocar, escalar o exportar el logotipo; cajita, área de protección, usos prohibidos |
| `reference/elementos-graficos.md` | Los cinco puntos, すき, la retícula modular, íconos, imágenes |
| `reference/contraste.md` | Matriz completa, modo claro, superficies elevadas, cómo recalcular |
| `reference/impresion.md` | Piezas impresas: CMYK, Pantone y los tres colores fuera de gama |

Piezas completas: composición en `suki-brutalist-design`, documentos en `suki-documents`, interfaces propias en `suki-product-ui`, software de cliente en `suki-client-ui`, textos en `suki-voice`.
