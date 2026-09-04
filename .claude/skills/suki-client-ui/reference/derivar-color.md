# Derivar un sistema de color desde la marca del cliente

La paleta de Suki no participa en este procedimiento en ningún paso. Lo que se transfiere es el método de construcción.

## 1. Levantar el color de marca

Por orden de fiabilidad:

1. **Manual de marca del cliente**, si existe. Se toma el HEX tal como está escrito.
2. **Archivo vectorial del logotipo** (SVG, AI, PDF). El HEX se lee del archivo, no de una captura.
3. **Muestreo de una imagen** — última opción. Una foto tiene balance de blancos, compresión y perfil de color: el HEX que sale de ahí es una aproximación.

**Si el color viene de un muestreo, se confirma con el cliente por escrito antes de construir nada encima.** Un sistema entero levantado sobre un azul que no era el suyo se rehace completo.

Se toma **un color de acción**, no una paleta. Si la marca tiene tres colores, uno es el de acción y los otros dos son datos: se usan en gráficos y categorías, no en botones.

## 2. Generar la escala

```bash
python3 assets/derivar.py '#1B5E9C'
python3 assets/derivar.py '#1B5E9C' --oscuro          # interfaz dark-first
python3 assets/derivar.py '#1B5E9C' --neutro '#0F172A' # neutros con 6 % de tinte
```

Once pasos, del 50 al 950, con el color de marca en el 500. Los pasos por debajo mezclan hacia blanco; los de arriba, hacia negro.

## 3. Elegir el paso que sirve como texto

**El color de marca no siempre cumple AA.** Pasa con amarillos, naranjas, verdes claros y cian: son los colores que peor contrastan sobre blanco.

Cuando el 500 no llega a 4,5 : 1:

- **No se cambia la marca del cliente.** Su amarillo sigue siendo su amarillo.
- **El texto y los enlaces usan el paso más cercano que sí cumple** — normalmente el 700 o el 800 en fondo claro, el 300 o el 400 en fondo oscuro. El script lo señala.
- **El color original se reserva** para rellenos con texto oscuro encima, bordes, íconos, barras de estado y elementos gráficos, donde el umbral es 3 : 1.

Ejemplo real con el amarillo `#F5C518`: da 1,63 : 1 sobre blanco y es ilegible como texto. El paso 800 (`#715B0B`) da 6,56 : 1 y sirve para enlaces y texto; el amarillo original se queda en el botón, con texto `#0D0D0D` encima.

Explicárselo al cliente cuesta dos frases y evita la conversación de «el azul se ve más apagado que en mi logo».

## 4. Construir los neutros

Rampa de blanco a negro en once pasos. **Neutra pura por defecto**, porque un gris con temperatura ensucia el conjunto cuando compite con un color de marca saturado.

Se admite un tinte del 6 % del color del cliente cuando su identidad es marcadamente cálida o fría, y solo entonces. Con `--neutro '#HEX'`.

Reglas que no cambian:

| Rol | Requisito |
|---|---|
| Texto principal | Máximo contraste razonable sobre el fondo |
| Texto secundario | 4,5 : 1 como mínimo sobre su fondo |
| Texto terciario | 4,5 : 1. Si no llega, no es texto: es decoración |
| Deshabilitado | Puede quedar por debajo, porque el estado se comunica también con `aria-disabled` y con el cursor |
| Borde | 3 : 1 si delimita un control; menos si es solo un divisor decorativo |

## 5. Definir los funcionales

Cuatro estados: error, éxito, advertencia, información. **No se copian los de Suki.**

Juego neutro de arranque, verificado sobre `#FFFFFF`:

| Estado | Claro | Ratio | Oscuro |
|---|---|---|---|
| Error | `#B91C1C` | 6,47 | `#F87171` |
| Éxito | `#15803D` | 5,02 | `#4ADE80` |
| Advertencia | `#B45309` | 5,02 | `#FBBF24` |
| Información | `#1D4ED8` | 6,70 | `#60A5FA` |

Tres correcciones frecuentes:

- **Si el color de acción del cliente es verde**, el éxito cambia de tono o se distingue solo por ícono y texto. Un estado que se confunde con un botón no informa. El script avisa cuando los tonos están a menos de 40 grados.
- **Si es rojo**, el error se distingue con un rojo más oscuro y siempre con ícono.
- **Si la marca del cliente ya define colores de estado**, mandan los suyos, verificados a AA.

## 6. Verificar la matriz completa

Cada combinación de texto sobre fondo que aparezca en la interfaz llega a AA: texto principal, secundario y de acción, sobre fondo, sobre superficie y sobre superficie elevada. El script imprime la matriz.

**Lo que no pase se corrige antes de construir el primer componente.** Después es un rediseño.

## 7. Dejarlo escrito

Los valores se pegan en `assets/tokens-cliente.css` con el origen de cada uno anotado. El archivo se entrega al cliente como parte del proyecto, en su repositorio: **el sistema es suyo.**

Se documenta también qué paso se usa para texto y por qué, porque es la decisión que alguien va a querer revertir dentro de seis meses sin saber que rompe el contraste.

## Casos difíciles

**El cliente tiene dos colores igual de importantes.** Uno es acción, el otro es acento de categoría. Se decide con el cliente y se escribe.

**El color de marca cambia según el soporte.** Pasa cuando el manual da un Pantone y la web usa otro HEX. Se toma el valor digital y se anota la diferencia.

**El cliente quiere el color en todas partes.** Se le muestra la proporción aplicada a su pantalla real: el color de marca funciona como acento, y un fondo de sección entero en su azul corporativo hace ilegible todo lo que va encima. La conversación se gana con la pantalla, no con la teoría.

**El logotipo del cliente no tiene contraste sobre el fondo de la aplicación.** Se usa su versión alternativa si la tiene, o se coloca sobre un contenedor sólido. Nunca se le añade sombra ni contorno.
