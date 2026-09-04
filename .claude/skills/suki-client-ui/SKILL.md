---
name: suki-client-ui
description: Método de diseño de Suki aplicado al software que se entrega a un cliente —ERP, CRM, tableros, portales y aplicaciones a medida— con los colores y la tipografía del cliente: la paleta de Suki está prohibida en estos proyectos. Da el procedimiento para derivar un sistema de color desde la marca del cliente, qué hacer cuando el cliente no tiene marca, qué se transfiere del método de Suki —escala de espaciado, jerarquía tipográfica, contraste AA, densidad cómoda, sin sombras— y la firma discreta «Desarrollado por Suki» en el pie. Úsala en cuanto la interfaz sea para un cliente, aunque el encargo no lo diga: si aparece el nombre de una empresa ajena, aplica esta. NO se usa en piezas propias de Suki ni en productos propios (suki-brand-tokens, suki-product-ui).
---

# Software entregado a clientes

## La paleta de Suki no se aplica aquí

**El trabajo entregado a un cliente lleva la identidad del cliente, nunca la de Suki.**

Un sistema de gestión para una ferretería no se pinta con el verde `#06D6A0`: se pinta con la marca de la ferretería. Lo contrario es pisar la identidad de quien paga, y es un error grave, no una preferencia de estilo.

Prohibidos en estos proyectos: `#06D6A0` · `#8338EC` · `#FFBE0B` · `#FF006E` · `#3A86FF` · el logotipo de Suki · los cinco puntos · Montserrat como tipografía de marca · el tagline de los cinco verbos.

**Lo que sí se transfiere es el método.** Suki aporta cómo se construye un sistema de diseño coherente, no con qué colores.

## Qué se transfiere y qué no

| Se transfiere | No se transfiere |
|---|---|
| Escala de espaciado de 8, sin valores intermedios | La paleta de Suki, completa |
| Jerarquía tipográfica y escala de tamaños | Montserrat y las familias de Suki |
| Reglas de contraste y objetivo WCAG AA | Los ratios concretos, que dependen de otros colores |
| Densidad cómoda | El brutalismo, en cualquier forma |
| Ausencia de sombras y de degradados | El logotipo y los cinco puntos |
| Tokens como fuente única de valores | Los nombres de token ligados a los verbos |
| El color nunca como único portador de información | — |

**Radio:** lo dicta la marca del cliente. Si su identidad usa formas redondeadas, la interfaz las usa. El radio 0 es firma formal de Suki, así que imponerlo sería exactamente lo que esta skill evita. Si el cliente no tiene criterio, se elige **un solo valor consistente** para todo el sistema, y 0 es una opción sobria y válida.

**El brutalismo no entra nunca.** Aquí alguien trabaja ocho horas al día. Un tablero brutalista es un tablero que se termina odiando, y eso destruye el argumento comercial de Suki más rápido que cualquier retraso.

## Derivar el sistema de color en cinco pasos

### 1. Tomar el color del cliente

Del manual de marca si lo tiene; si no, del logotipo, la fachada, la ficha del producto o el uniforme. Se toma **un color de acción**, no una paleta entera. Dos o tres colores de marca compitiendo en una interfaz producen exactamente el ruido que esta skill evita.

Anotar el HEX exacto; si viene de una foto o de un PDF, muestrear y **confirmarlo con el cliente por escrito** antes de construir nada encima.

### 2. Verificar el color de acción

```bash
python3 assets/derivar.py '#RRGGBB'
```

Devuelve la escala completa, el contraste sobre fondo claro y oscuro, y qué texto va encima. Si el color de marca no llega a 4,5 : 1 sobre el fondo —pasa con amarillos, verdes claros y naranjas—, **no se cambia el color de la marca**: se usa una variante más oscura de la misma escala para los elementos que llevan texto, y el color original se reserva para rellenos con texto oscuro encima, bordes e íconos. El script marca cuál sirve.

### 3. Construir la escala de neutros

Neutros con el mismo criterio que el sistema de Suki: **neutra pura, sin matiz**, salvo que la marca del cliente pida un gris cálido o frío. Once pasos, del 50 al 950, generados por el script a partir del fondo elegido. Regla que no cambia: el gris de texto secundario llega a 4,5 : 1 sobre su fondo, y el de texto deshabilitado no se usa para texto que alguien deba leer.

### 4. Definir los funcionales

Error, éxito, advertencia e información. **No se copian los de Suki**, porque el éxito de Suki es su verde de marca.

Juego neutro de arranque, verificado a AA, para partir de algo y ajustarlo a la marca del cliente:

| Estado | Sobre fondo claro | Ratio | Sobre fondo oscuro |
|---|---|---|---|
| Error | `#B91C1C` | 6,5 : 1 | `#F87171` |
| Éxito | `#15803D` | 5,0 : 1 | `#4ADE80` |
| Advertencia | `#B45309` | 5,0 : 1 | `#FBBF24` |
| Información | `#1D4ED8` | 6,7 : 1 | `#60A5FA` |

Ratios sobre `#FFFFFF`. **Son valores de arranque, no la paleta de Suki ni la del cliente**, y se ajustan si la marca del cliente ya define estados. Si el color de acción del cliente es verde, el éxito **cambia** a otro tono o se distingue solo por ícono y texto: un estado que se confunde con un botón no informa.

### 5. Verificar la matriz completa

Cada combinación de texto y fondo que aparezca en la interfaz llega a AA. `assets/derivar.py` imprime la matriz; lo que no pase se corrige antes de construir el primer componente. Procedimiento detallado en `reference/derivar-color.md`.

## Cuando el cliente no tiene marca

Pasa a menudo: un logotipo hecho en Word, tres azules distintos según el documento, ninguna tipografía definida.

**No se rellena el hueco con la marca de Suki.** Se construye un sistema mínimo y neutro, propiedad del cliente:

1. **Un color de acción sobrio**, elegido con el cliente entre dos o tres opciones que se le presentan aplicadas a la pantalla real, no como muestras sueltas. Verificado a AA.
2. **Neutros puros** y fondo claro por defecto: es lo que espera quien usa un sistema de gestión.
3. **Una sola tipografía** de sistema o de código abierto, con licencia clara. Inter es una opción legítima aquí porque es neutra y gratuita, no porque sea la de Suki.
4. **Se entrega documentado** como sistema del cliente, en su repositorio, con los tokens y las razones. Es suyo y puede cambiarlo.

Detalle en `reference/sin-marca.md`.

## Densidad y accesibilidad

Aquí alguien trabaja ocho horas al día. La densidad es **cómoda**, no compacta ni espaciosa.

```
Altura de control                  40 px  ·  48 px en la acción principal
Fila de tabla                      48 px, padding 12 / 16
Separación entre campos            24        entre grupos de campos    32
Padding de tarjeta y panel         24        entre bloques             48
Margen de contenido                32 en escritorio  ·  20 en móvil
```

Escala de 8, sin valores intermedios. Si una tabla no cabe se quitan columnas o se paginan filas, no se aprieta el interlineado.

**WCAG AA es el mínimo:** 4,5 : 1 en texto normal, 3 : 1 en texto grande y elementos de interfaz. Foco visible en todo elemento interactivo, navegación completa por teclado, `prefers-reduced-motion` respetado, etiqueta visible en cada campo.

**El color nunca es el único portador de información.** Todo estado lleva ícono y texto. En un ERP esto no es un detalle: quien lo usa mira la pantalla ocho horas y no debería tener que interpretar un tono.

Los patrones de componente de `suki-product-ui/reference/componentes.md` sirven aquí **cambiando los tokens**: la estructura y el comportamiento se transfieren, los colores no.

## La firma

Una sola línea en el pie de la aplicación:

> Desarrollado por Suki

- En el **color de texto secundario del sistema del cliente**, no en un color de Suki.
- Sin logotipo, sin ícono, sin enlace destacado. Un enlace discreto al sitio de Suki es aceptable si el cliente lo aprueba.
- **Se acuerda con el cliente antes de entregar.** Si no la quiere, no va, y no se discute.
- No aparece en pantallas impresas, reportes exportados ni documentos generados por el sistema.

## El error que más se comete

**Empezar a maquetar con los tokens de Suki «para ir avanzando» y cambiar los colores al final.** Nunca se cambian todos: quedan un borde verde en un estado de foco, un `#06D6A0` en un gráfico, un hover que nadie revisó. Y el cliente lo ve, porque es su marca la que conoce de memoria.

Los tokens del cliente se definen **antes** del primer componente: es media hora al principio y un rediseño al final. El segundo error: **usar el color de marca del cliente sin verificar su contraste.** Muchas marcas pequeñas tienen un amarillo o un verde claro que falla como texto. La respuesta no es cambiar la marca del cliente ni ignorar el contraste: es usar una variante oscura de su misma escala para lo que lleva texto.

## Checklist — correr antes de entregar

1. ¿Aparece algún HEX de la paleta de Suki en el código? (comando abajo)
2. ¿El color de acción sale de la marca del cliente y está confirmado por escrito?
3. ¿Cada combinación de texto y fondo llega a AA sobre el fondo real?
4. ¿Los funcionales son del cliente o del juego neutro, y ninguno es `#06D6A0`?
5. ¿El éxito se distingue del color de acción, o al menos lleva ícono y texto?
6. ¿El radio es un solo valor consistente, coherente con la marca del cliente?
7. ¿La densidad es cómoda, con la escala de 8 y sin valores intermedios?
8. ¿Cada estado lleva ícono y texto además de color?
9. ¿Se recorre y opera la aplicación entera con teclado, con foco siempre visible?
10. ¿La firma está acordada con el cliente y va en su color de texto secundario?

```bash
# Rastro de la paleta de Suki en un proyecto de cliente. Debe salir vacío.
grep -rniE "#(06D6A0|8338EC|FFBE0B|FF006E|3A86FF)" src
grep -rni "montserrat\|suki" src --include=*.css --include=*.tsx --include=*.ts
```

## Referencia bajo demanda

| Archivo | Cuándo abrirlo |
|---|---|
| `reference/derivar-color.md` | Procedimiento completo: escala, neutros, funcionales, casos difíciles |
| `reference/sin-marca.md` | El cliente no tiene identidad definida |
| `reference/entrega.md` | Documentación, traspaso, accesos y qué queda en manos del cliente |
| `assets/tokens-cliente.css` | Plantilla de tokens con marcadores, para rellenar por proyecto |
| `assets/derivar.py` | Genera la escala y verifica toda la matriz de contraste |
