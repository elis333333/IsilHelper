# Contraste — matriz completa

Valores WCAG 2.1 calculados sobre los HEX exactos de la paleta. Reproducibles con `assets/contraste.py`.

Umbrales: **AA** 4,5 : 1 en texto normal y 3 : 1 en texto grande (≥ 24 px, o ≥ 18,66 px en negrita) y en elementos de interfaz. **AAA** 7 : 1 en texto normal.

## Acentos como texto sobre fondos oscuros

| Color | `#0D0D0D` base | `#1A1A1A` superficie | `#242424` elevada |
|---|---|---|---|
| `#06D6A0` acción | 10,30 — todo | 9,23 — todo | 8,23 — todo |
| `#FFBE0B` integrar | 11,68 — todo | 10,46 — todo | 9,33 — todo |
| `#3A86FF` evolucionar | 5,58 — texto normal | 5,00 — texto normal | **4,46 — solo texto grande** |
| `#FF006E` escalar | 5,07 — texto normal | 4,54 — texto normal | **4,05 — solo texto grande** |
| `#8338EC` adaptar | 3,46 — solo grande | 3,10 — solo grande | **2,77 — falla, no usar** |

**Consecuencia práctica:** un dato en rosa o en azul que funciona sobre la tarjeta `#1A1A1A` deja de cumplir AA cuando esa tarjeta pasa a `#242424` en hover. Si el hover cambia la superficie, el texto de acento sube a `#CCCCCC` o el acento se reserva para el borde.

## Acentos como texto sobre fondos claros

| Color | `#F5F5F5` | `#FFFFFF` |
|---|---|---|
| `#8338EC` adaptar | 5,15 — texto normal | 5,61 — texto normal |
| `#FF006E` escalar | 3,52 — solo grande | 3,83 — solo grande |
| `#3A86FF` evolucionar | 3,19 — solo grande | 3,48 — solo grande |
| `#06D6A0` acción | **1,73 — falla** | **1,89 — falla** |
| `#FFBE0B` integrar | **1,53 — falla** | **1,66 — falla** |

**La regla se invierte en modo claro.** El morado, que no sirve como texto sobre oscuro, es el único acento apto para texto normal sobre claro. El verde y el amarillo, que sobre oscuro sirven para todo, sobre claro no se pueden usar como texto en ningún tamaño: solo como relleno con `#0D0D0D` encima, o como línea y bloque sin texto.

En un documento en modo claro —propuesta, presupuesto, informe— el acento nunca colorea el texto: colorea un bloque, una regla o un punto.

## Neutros como texto sobre fondos oscuros

| Color | `#0D0D0D` | `#1A1A1A` | `#242424` |
|---|---|---|---|
| `#FFFFFF` | 19,44 | 17,40 | 15,52 |
| `#E6E6E6` títulos | 15,57 | 13,94 | 12,44 |
| `#CCCCCC` texto principal | 12,10 | 10,84 | 9,67 |
| `#B3B3B3` secundario | 9,27 | 8,30 | 7,40 |
| `#999999` terciario | 6,82 | 6,11 | 5,45 |
| `#737373` deshabilitado | **4,10 — no apto** | **3,67** | **3,27** |

`#737373` no llega a AA sobre ningún fondo del sistema. Es color de elemento deshabilitado y de grafismo decorativo, nunca de texto que alguien deba leer. Un campo deshabilitado con etiqueta en `#737373` es correcto porque el estado deshabilitado también se comunica con el cursor y con el atributo, no solo con el color.

## Neutros como texto sobre fondos claros

| Color | `#F5F5F5` | `#FFFFFF` |
|---|---|---|
| `#0D0D0D` texto principal | 17,83 | 19,44 |
| `#333333` | 11,59 | 12,63 |
| `#4D4D4D` secundario | 7,75 | 8,45 |
| `#737373` | **4,35 — límite** | 4,74 |
| `#999999` | **2,61 — falla** | **2,85 — falla** |
| `#CCCCCC` | **1,47 — solo bordes** | **1,61 — solo bordes** |

`#737373` sobre `#F5F5F5` da 4,35 y se queda a un pelo de AA: en modo claro el texto terciario es `#4D4D4D`, no un gris más claro. `#CCCCCC` en modo claro es color de borde, nunca de texto.

## Funcionales

| Color | Sobre `#0D0D0D` | Sobre `#1A1A1A` | Sobre `#242424` | Sobre `#F5F5F5` |
|---|---|---|---|---|
| `#FF3B30` error, oscuro | 5,48 | 4,91 | **4,38 — solo grande** | 3,25 |
| `#C62828` error, claro | 3,46 | 3,10 | 2,77 | 5,16 |

Cada rojo cumple AA únicamente en su modo. Intercambiarlos rompe el contraste en los dos sentidos.

## Texto encima de cada color

| Relleno | `#0D0D0D` encima | `#FFFFFF` encima | Se usa |
|---|---|---|---|
| `#06D6A0` | 10,30 | 1,89 | `#0D0D0D` |
| `#FFBE0B` | 11,68 | 1,66 | `#0D0D0D` |
| `#FF006E` | 5,07 | 3,83 | `#0D0D0D` |
| `#3A86FF` | 5,58 | 3,48 | `#0D0D0D` |
| `#8338EC` | 3,46 | 5,61 | `#FFFFFF` |

El morado es el único relleno de la paleta que lleva texto blanco. Los otros cuatro llevan `#0D0D0D`.

## Cómo recalcular

```bash
python3 assets/contraste.py                       # audita la paleta completa
python3 assets/contraste.py '#3A86FF' '#242424'   # comprueba un par; sale con código 1 si no llega a 4,5
```

Fórmula: luminancia relativa WCAG 2.1 y ratio `(L_claro + 0,05) / (L_oscuro + 0,05)`. Se mide siempre contra el **fondo real** que queda detrás, no contra el fondo de la página. Si hay una superficie intermedia, una opacidad o un bloque de color, el fondo real es ese.

## Nota sobre dos valores del manual

El manual de marca v1.0 registra `#FFFFFF` en 18,3 : 1 y `#E6E6E6` en 15,4 : 1 sobre `#0D0D0D`. El cálculo WCAG da 19,44 y 15,57. Aquí se usan los valores calculados. Ninguna decisión cambia —los dos superan AAA con holgura— y ningún HEX se modifica.
