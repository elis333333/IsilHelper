# Identidad de un producto propio

Aplica a Tonemap y a cualquier producto que salga de Suki Labs con nombre propio.

## El problema que resuelve

Un producto propio que se ve exactamente igual que su desarrolladora canibaliza a las dos marcas: Suki pierde especificidad —deja de ser una empresa de servicios y pasa a ser «la del producto»— y el producto pierde nombre propio, porque nadie lo recuerda separado de quien lo hizo.

Al mismo tiempo, un producto que no comparte nada con Suki desperdicia lo único que Suki ya tiene resuelto: un método.

**La línea: se hereda el método, no la paleta.**

## Qué se hereda y qué no

| Se hereda | No se hereda |
|---|---|
| Escala de espaciado de 8, sin valores intermedios | La paleta de acentos de Suki |
| Radio 0 y ausencia de sombras | El verde `#06D6A0` como color de acción |
| Profundidad por contraste de superficie | El logotipo y los cinco puntos |
| Reglas de contraste y criterios AA | Montserrat, que es tipografía de la marca madre |
| Densidad cómoda y patrones de componente | El tagline de los cinco verbos |
| Inter y JetBrains Mono como base tipográfica | La correspondencia verbo–color–familia |

Los cinco puntos y el logotipo de Suki **no aparecen** en la interfaz de un producto propio. El vínculo es la firma de respaldo, y nada más.

## Cómo se define el color de un producto

1. **Elegir un color de acción propio**, a partir de lo que el producto hace. Tonemap trabaja con acordes y con la carga emocional del color: ahí el color es contenido, y la paleta del producto puede ser mucho más amplia que la de Suki.
2. **Verificarlo a AA sobre `#0D0D0D`** con `suki-brand-tokens/assets/contraste.py`. Si no llega a 4,5 : 1, se ajusta la luminosidad hasta que llegue.
3. **Definir qué texto va encima** de ese color con el mismo script. Si el ratio con `#0D0D0D` es mayor que con blanco, el texto es oscuro.
4. **Mantener las superficies neutras** `#0D0D0D` / `#141414` / `#1A1A1A` / `#242424`, salvo que el producto tenga una razón concreta para otra base.
5. **Un solo color de acción.** El resto de la paleta del producto es contenido, no interfaz.

Puede coincidir con un acento de la paleta de Suki si hay una razón. Es una decisión del producto, no una herencia automática.

## La firma de respaldo

Es el único vínculo obligatorio:

> Tonemap · un proyecto de Suki Labs

- Inter 400, tamaño Caption (12 / 18), en `#999999`.
- Va en el pie de la aplicación o en la pantalla «acerca de».
- Sin logotipo de Suki a color, sin enlace destacado, sin banner.
- En inglés: `Tonemap · a Suki Labs project`.

## Nombre y voz

- El producto tiene nombre propio y no lleva descriptor pegado. `Tonemap`, no `Tonemap by Suki`.
- Los textos de interfaz siguen `suki-voice`: primera persona, sin jerga innecesaria, sin emojis, sin exclamaciones.
- El producto puede tener un registro propio más específico —Tonemap habla de música, y ahí «acorde», «escala» y «progresión» son el vocabulario correcto, no jerga—. La traducción de jerga aplica a la tecnología, no al dominio del producto.

## El marketing del producto es otra skill

La landing, las piezas de redes y la presentación de Tonemap se diseñan con `suki-brutalist-design`, aunque la aplicación se diseñe con esta. Son dos piezas distintas del mismo producto: una se mira, la otra se usa.
