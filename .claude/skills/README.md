# Skills de Suki

Seis skills que convierten el manual de marca en reglas ejecutables. Cada una se carga sola cuando la tarea la necesita: lo que dispara la carga es el campo `description` del frontmatter, por eso están escritas de forma insistente y con anti-disparadores explícitos.

## Qué hace cada una

| Skill | Responde a | Se activa cuando |
|---|---|---|
| `suki-brand-tokens` | Qué valor usar | Se elige un color, un tamaño, un espaciado, un radio o una duración en una pieza propia |
| `suki-voice` | Cómo se dice | Se escribe o revisa cualquier texto que Suki publica o envía |
| `suki-brutalist-design` | Cómo se compone lo que se mira | Web, landing, redes, presentaciones, portadas, papelería |
| `suki-documents` | Cómo se estructura lo que se firma | Propuesta, presupuesto, cotización, informe de Suki Labs |
| `suki-product-ui` | Cómo se construye lo propio que se usa | Tonemap y las herramientas de Suki Labs |
| `suki-client-ui` | Cómo se construye lo ajeno | ERP, CRM, tableros y aplicaciones entregadas a un cliente |

## Las dos reglas que sostienen el reparto

**1. El trabajo entregado a un cliente lleva la identidad del cliente, nunca la de Suki.**
`suki-client-ui` transfiere el método —escala de espaciado, jerarquía tipográfica, contraste AA, densidad cómoda, ausencia de sombras— con los colores y la tipografía del cliente. La paleta de Suki está prohibida ahí, y la prohibición es la primera línea de esa skill.

**2. El brutalismo es cómo se comunica Suki, no cómo construye software.**
`suki-brutalist-design` aplica a lo que alguien mira treinta segundos. `suki-product-ui` y `suki-client-ui` usan densidad cómoda y composición sobria, porque son pantallas donde alguien trabaja ocho horas.

## Cómo se relacionan

`suki-brand-tokens` es el fundamento: la paleta, las escalas y los contrastes viven solo ahí. Las demás la referencian, nunca la repiten. Si un valor cambia, se cambia en un sitio.

`suki-client-ui` es la excepción deliberada: **no hereda de `suki-brand-tokens`**, porque su punto de partida es la marca del cliente.

```
suki-brand-tokens ──┬── suki-brutalist-design ── piezas que se miran
                    ├── suki-documents ───────── documentos que se firman
                    └── suki-product-ui ──────── productos propios que se usan

suki-client-ui ───────────────────────────────── software de cliente (sistema propio)

suki-voice ───────────────────────────────────── el texto de todo lo anterior
```

## Archivos ejecutables

| Archivo | Qué hace |
|---|---|
| `suki-brand-tokens/assets/tokens.css` | El sistema completo en variables CSS. Primer archivo de cualquier proyecto propio |
| `suki-brand-tokens/assets/tokens.json` | Los mismos tokens con verbo, familia y contraste anotados |
| `suki-brand-tokens/assets/tailwind-v4.css` · `tailwind-v3.js` | La forma que corresponda según la versión detectada |
| `suki-brand-tokens/assets/contraste.py` | Audita la paleta o un par suelto. Sale con código 1 si no llega a AA |
| `suki-brutalist-design/assets/verbos.html` · `brutal.css` | Los cinco bloques de verbos y la capa de dirección de arte |
| `suki-documents/assets/propuesta.md` · `presupuesto.md` · `cotizacion.md` | Plantillas listas para rellenar |
| `suki-documents/assets/documento.css` | Maquetación de impresión: portada oscura, interior claro |
| `suki-product-ui/assets/ui.css` · `componentes.tsx` | Capa de componentes y componentes React de referencia |
| `suki-client-ui/assets/derivar.py` | Deriva el sistema de color del cliente y verifica toda la matriz |
| `suki-client-ui/assets/tokens-cliente.css` | Plantilla de tokens con marcadores, uno por proyecto |

## Antes de usarlas

Los `{{marcadores}}` de las plantillas de `suki-documents` y de `tokens-cliente.css` están a propósito: **rompen a la vista antes que rellenarse con algo inventado.** Los tributarios —IGV, régimen, RUC, tipo de comprobante— se confirman con el contador; un error tributario en una propuesta es un problema legal, no de maquetación.

## Fuente

Manual de Marca de Suki v1.0 y los archivos de `Branding Context`. Cuando haya conflicto sobre un valor concreto —un HEX, un tamaño mínimo, una regla de contraste—, manda `03-visual.md`. Los HEX de estas skills se verificaron uno a uno contra ese archivo.
