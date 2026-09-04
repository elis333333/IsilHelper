# Web de Suki

Modo oscuro, `#0D0D0D` de base, **sin alternativa clara**. Secciones a pantalla completa separadas por cortes de color pleno. Ancho de contenido 1 200 px, márgenes 64–120, separación entre secciones 96–128.

## Estructura mínima

| # | Sección | Qué hace |
|---|---|---|
| 1 | **Portada** | Una frase que diga qué hace Suki en lenguaje de negocio. Un solo botón de acción en `#06D6A0` con texto `#0D0D0D` |
| 2 | **El problema** | Escrito desde la experiencia del cliente, no desde la tecnología |
| 3 | **Cómo trabajo** | Los cinco verbos como fases, con los cinco puntos como indicador. Aquí se explica el cobro por fases: es el argumento que desactiva la objeción del precio |
| 4 | **Qué construyo** | Las familias A, B y C, cada una con su color. D y E se mencionan sin desarrollar |
| 5 | **Trabajo real** | Capturas de lo entregado. **Si todavía no hay casos publicables, esta sección se omite**: no se rellena con maquetas inventadas |
| 6 | **Contacto** | Formulario de tres campos o enlace directo a WhatsApp |

**Suki Labs vive en una página aparte**, enlazada desde el pie, no en la navegación principal. No compite por atención con los servicios.

## La sección de los cinco verbos

Es el corazón de la web y la única composición donde conviven los cinco acentos. Cinco bloques macizos a pantalla completa, en orden fijo, cada uno con su color de fondo y su etiqueta mono. Plantilla en `assets/verbos.html`.

Debajo de los cinco bloques va la explicación del cobro por fases, en texto normal sobre `#0D0D0D`. El argumento comercial no se pone dentro de un bloque de color: se pone donde se puede leer despacio.

## Movimiento

- Aparición suave al entrar en el viewport: opacidad y 16 px de desplazamiento, 250 ms, curva `cubic-bezier(0.2, 0, 0, 1)`.
- **Cero animación al hacer scroll más allá de eso.** Sin paralaje, sin elementos que se enganchan, sin contadores que suben.
- La animación firma de los cinco puntos se usa una vez, en la carga.
- Con `prefers-reduced-motion` activo, todo aparece sin animación.

## Retícula visible

Se permite mostrar las líneas de columna como elemento gráfico a baja opacidad, en `#4D4D4D` al 20 % o menos. Se usa en una o dos secciones, no en todas: un recurso que aparece en cada pantalla deja de ser un recurso.

## Formulario de contacto

Tres campos: nombre, forma de contacto, qué necesitas resolver. Campos con radio 0, fondo `#1A1A1A`, borde de 1 px en `#4D4D4D`, foco con borde de 2 px en `#06D6A0`. Etiqueta siempre visible encima del campo, nunca como placeholder que desaparece.

El error de validación lleva **ícono y texto**, no solo el borde en rojo: el color nunca es el único portador de información.

## Pie

Logotipo, tagline completo con los cinco verbos, enlace a Suki Labs, correo y WhatsApp. Sin logotipos de redes en color, sin frases legales de relleno. Borde superior de 4 px.

## Rendimiento y accesibilidad

- Las tres tipografías en formato variable, con `font-display: swap` y los fallbacks declarados.
- Foco visible en todo elemento interactivo: borde de 2 px en `#06D6A0`, nunca `outline: none`.
- Navegación completa por teclado. Los bloques de color no capturan el foco.
- Los cinco bloques de verbos son `section`, no `div`: la estructura semántica también es estructura.
