---
name: suki-documents
description: Documentos comerciales y editoriales de Suki — propuesta, presupuesto, cotización, informe y publicaciones de Suki Labs. Da la estructura sección por sección, el indicador de cinco fases que desactiva la objeción del precio, el apartado de qué incluye y qué no incluye cada fase, la tabla de inversión, la maquetación (portada oscura, interior claro, un solo acento), el formato de moneda S/ 4,500 y plantillas listas para rellenar. Úsala cuando haya que armar o revisar una propuesta, cotizar o presupuestar un trabajo para un cliente, o preparar un informe firmado por Suki Labs. NO es para piezas visuales de comunicación (suki-brutalist-design) ni para facturas y boletas, donde manda el formato de SUNAT. El tratamiento tributario nunca se inventa: queda marcado para confirmar con el contador.
---

# Documentos de Suki

La propuesta es el documento que más trabaja contra las tres objeciones: precio, edad y desconfianza. Todo lo que sigue existe para eso.

**Dónde no se usa:** portadas y piezas visuales van con `suki-brutalist-design` · facturas y boletas siguen el formato de SUNAT, no la marca · los textos se redactan con `suki-voice` · los valores visuales salen de `suki-brand-tokens`.

## Los tres documentos, y cuál corresponde

| Documento | Cuándo | Qué lleva | Extensión |
|---|---|---|---|
| **Cotización** | El cliente pide un precio por algo ya definido | Concepto, precio, plazo, validez. Sin diagnóstico | 1 página |
| **Presupuesto** | El alcance está claro pero tiene partes | Desglose por partida con precio de cada una, plazo y condiciones | 1–2 páginas |
| **Propuesta** | Hubo conversación y hay un problema de negocio que resolver | Diagnóstico, alcance, cinco fases, inversión por fase, qué pasa después | 4–8 páginas |

**Por defecto se envía una propuesta.** Cotización y presupuesto son para encargos puntuales de la familia C: un script, un ajuste, una pieza suelta. Si el trabajo tiene fases, es una propuesta, aunque el cliente haya pedido «una cotización rápida».

*Esta distinción es una propuesta del sistema, sujeta a validación.*

## Estructura de la propuesta

| # | Apartado | Qué resuelve |
|---|---|---|
| 1 | **Lo que entendí de tu negocio** | Demuestra que hubo comprensión antes de proponer. Se escribe con las palabras del cliente, no con las de la tecnología |
| 2 | **Qué propongo** | La solución en lenguaje de negocio, en tres párrafos como máximo |
| 3 | **Fases** | Con los cinco puntos como indicador. Hace visible el cobro por fases |
| 4 | **Qué incluye y qué no incluye cada fase** | El apartado que evita la discusión de alcance |
| 5 | **Plazos** | Por fase, en semanas, con la condición de la que depende cada una |
| 6 | **Inversión por fase** | La tabla. Nunca un número único al final |
| 7 | **Qué pasa después de la entrega** | Responde al freelancer que desaparece |

El apartado 1 va primero **siempre**. Una propuesta que empieza por lo que se va a construir pierde al decisor en la primera línea.

## El indicador de cinco fases

Cinco puntos, cinco verbos, cinco fases, y el cobro va por fases alcanzadas. Esa coincidencia convierte un recurso gráfico en el argumento que desactiva la objeción del precio: **el cliente ve dónde está y qué está pagando sin que nadie se lo explique.**

Completados a color, pendientes en `#4D4D4D`.

```
FASE 1 · CONSTRUIR      #06D6A0   completada
FASE 2 · ADAPTAR        #8338EC   completada
FASE 3 · INTEGRAR       #FFBE0B   en curso
FASE 4 · ESCALAR        #FF006E   pendiente
FASE 5 · EVOLUCIONAR    #3A86FF   pendiente
```

- **El orden es fijo y los cinco aparecen siempre**, aunque el proyecto solo contrate tres: las no contratadas se muestran en `#4D4D4D` con la nota de que quedan fuera de este alcance. Así el cliente ve qué está dejando de comprar, no un recorte disimulado.
- **No se marca como completada una fase que no se entregó.** El indicador solo sirve si el cliente puede confiar en él, y basta una vez para perderlo.
- Aparece en la cabecera del apartado 3, repetido en cada fase, y en la firma de los correos de avance.

## Qué incluye y qué no incluye

Es el apartado que evita la discusión de alcance, y sin él los cinco puntos no dicen nada. **Cada fase lleva las dos listas**, en la misma página y con el mismo peso tipográfico. Una lista de «incluye» sin su «no incluye» es una lista incompleta.

```
FASE 2 · ADAPTAR

Incluye        Ajuste del registro de mercadería al flujo actual del almacén
               Migración de los datos de la hoja de cálculo de caja
               Dos rondas de ajustes tras la prueba con el equipo

No incluye     Cambios en el proceso de compras
               Conexión con el sistema del proveedor (queda para la fase 3)
               Capacitación presencial fuera de Lima
```

Lo que no incluye no se escribe como una negativa seca: cuando algo cae en otra fase, se dice en qué fase cae. Convierte un límite en un camino.

## Inversión por fase

Nunca un número único al final. La tabla es el argumento.

| Fase | Qué se entrega | Plazo | Inversión |
|---|---|---|---|
| 1 · Construir | El sistema funcionando con datos reales | 3 semanas | S/ 4,500 |
| 2 · Adaptar | Ajustado al flujo del almacén | 2 semanas | S/ 2,800 |
| 3 · Integrar | Caja y almacén con el mismo número | 2 semanas | S/ 3,200 |
| | | **Total** | **S/ 10,500** |

- **Moneda: `S/ 4,500`** — símbolo, espacio, coma como separador de miles. Nunca `S/.`, ni `4500`, ni `S/4,500`. Plazos en semanas, en cifra, con la dependencia explícita si la hay.
- **Cada fila dice qué se entrega**, no en qué se trabaja. «El sistema funcionando con datos reales» es verificable; «desarrollo del módulo» no.
- El total va al final, en negrita, y siempre acompañado de las filas: un total suelto invita a comparar por número.

**Condiciones de pago** debajo de la tabla: qué porcentaje al inicio de cada fase y qué al cierre, y qué pasa si el cliente decide parar. Sin letra pequeña.

## Datos tributarios

**No se inventa tratamiento fiscal.** IGV, régimen tributario, RUC, tipo de comprobante y retenciones dependen del régimen en que se constituya la empresa y de la condición del cliente.

En las plantillas estos datos van como marcador visible:

```
{{IGV}}            ← confirmar con el contador
{{REGIMEN}}        ← confirmar con el contador
{{RUC}}            ← confirmar con el contador
{{COMPROBANTE}}    ← boleta o factura, según el cliente
```

Los marcadores se dejan tal cual hasta tener el dato. **Es preferible que rompan a la vista antes que rellenarlos con algo inventado**, porque un error tributario en una propuesta es un problema legal, no un problema de maquetación.

La figura legal de la empresa **no aparece** en la propuesta: vive en facturas, contratos y documentos legales.

## Maquetación

**Portada:** fondo `#0D0D0D`, logotipo, nombre del cliente, fecha; sigue `suki-brutalist-design` y es la única página oscura. **Interior en modo claro:** fondo `#F5F5F5`, texto `#0D0D0D`, secundario `#4D4D4D`. Se lee y se imprime; un interior en negativo es ilegible en papel y un desastre en tinta.

- **Un solo acento en todo el documento: el de la familia del proyecto.** No el verde por costumbre. Un ERP es familia A, y su acento es `#8338EC`.
- **En modo claro el acento no colorea texto.** Colorea un bloque, una regla o un punto. El verde da 1,7 : 1 sobre `#F5F5F5` y el amarillo 1,5 : 1. Ver `suki-brand-tokens/reference/contraste.md`.
- Encabezado con logotipo pequeño; pie con número de página.
- Tablas con borde de 1 px en `#CCCCCC`, sin relleno de color, encabezado en mono mayúsculas.
- Etiquetas de apartado en JetBrains Mono, mayúsculas, tracking +8 %.
- Alineación izquierda, sin texto justificado. Línea de 45 a 90 caracteres.
- Se entrega en **PDF**, nunca en un formato editable.

## El error que más se comete

**Enviar un precio único.** Un total sin fases es un número que solo se puede comparar contra otro número, y ahí Suki pierde siempre contra el freelancer y contra el sobrino que sabe Excel. La tabla por fases cambia la pregunta: de «cuánto cuesta» a «qué recibo en cada paso».

El segundo: **escribir qué incluye y saltarse qué no incluye.** El apartado completo es lo que evita la discusión de alcance en la semana cinco. Media lista es peor que ninguna, porque genera una expectativa que después hay que desmontar.

## Checklist — correr antes de enviar el documento

1. ¿El apartado 1 habla del negocio del cliente, con sus palabras, antes de mencionar tecnología?
2. ¿Cada fase tiene su «incluye» y su «no incluye», y lo excluido dice a qué fase pertenece?
3. ¿La inversión va por fase, con qué se entrega en cada una, y no como un número único?
4. ¿La moneda está escrita `S/ 4,500`, y los plazos en cifra?
5. ¿Los cinco puntos aparecen los cinco, con las fases no contratadas en `#4D4D4D`?
6. ¿Hay un solo acento en todo el documento, y es el de la familia del proyecto?
7. ¿Queda algún marcador tributario sin confirmar con el contador, o peor, rellenado a ojo?
8. ¿El interior está en modo claro y ningún acento colorea texto?
9. ¿Queda jerga sin traducir, algún «nosotros» o alguna palabra de la lista prohibida? (`suki-voice`)
10. ¿Se entrega en PDF, con la portada oscura y el interior claro?

## Referencia y plantillas

| Archivo | Cuándo abrirlo |
|---|---|
| `reference/fases.md` | Qué alcance típico tiene cada fase y cómo se reparte un proyecto real entre las cinco |
| `reference/maquetacion.md` | Medidas de página, retícula del documento, estilos y tablas |
| `reference/informes-labs.md` | Informes, estudios y publicaciones firmadas por Suki Labs |
| `assets/propuesta.md` | Plantilla completa de propuesta, lista para rellenar |
| `assets/presupuesto.md` | Plantilla de presupuesto por partidas |
| `assets/cotizacion.md` | Plantilla de cotización de una página |
| `assets/documento.css` | Hoja de estilo de impresión, sobre los tokens |
