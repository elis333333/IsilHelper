<!-- =========================================================
     SUKI — Plantilla de propuesta comercial
     Rellenar los {{marcadores}} y exportar a PDF.
     Portada oscura, interior claro, un solo acento:
     el de la familia del proyecto.
     Los {{marcadores}} tributarios NO se rellenan a ojo.
     ========================================================= -->

# PORTADA

```
[ fondo #0D0D0D a sangre ]
[ suki_logotipo-completo_positivo_oscuro_rgb.svg ]

Propuesta

{{CLIENTE}}
{{FECHA}}          ← formato: 12 de marzo de 2026
```

---

# 1 · Lo que entendí de tu negocio

<!-- Con las palabras del cliente. Sin tecnología todavía.
     Si este apartado se puede escribir sin haber hablado con
     el cliente, no está bien escrito. -->

Hola, {{NOMBRE}}. Después de revisar cómo trabajan hoy en {{EMPRESA}}, esto es lo que propongo, en qué orden y cuánto cuesta cada parte.

{{DIAGNÓSTICO}}

<!-- Ejemplo del tono:
     El problema no es que les falte un programa. Es que el inventario
     vive en tres sitios a la vez y ninguno coincide al cierre del día. -->

---

# 2 · Qué propongo

<!-- Tres párrafos como máximo, en lenguaje de negocio.
     Nada de API, backend, deploy, stack, framework. -->

{{PROPUESTA}}

---

# 3 · Fases

```
[ fila de cinco puntos: contratadas a color, resto en #4D4D4D ]

FASE 1 · CONSTRUIR      #06D6A0    {{ESTADO}}
FASE 2 · ADAPTAR        #8338EC    {{ESTADO}}
FASE 3 · INTEGRAR       #FFBE0B    {{ESTADO}}
FASE 4 · ESCALAR        #FF006E    fuera de este alcance
FASE 5 · EVOLUCIONAR    #3A86FF    fuera de este alcance
```

Cada fase se entrega funcionando antes de empezar la siguiente, y se paga cuando la ves terminada. **Si decides parar al terminar una fase, no debes nada de las siguientes.**

<!-- Los cinco puntos aparecen SIEMPRE los cinco. Las fases no
     contratadas se muestran en #4D4D4D con la nota de que quedan
     fuera: el cliente ve el camino completo, no un recorte. -->

---

# 4 · Qué incluye y qué no incluye cada fase

## Fase 1 · Construir

| Incluye | No incluye |
|---|---|
| {{INCLUYE_1}} | {{NO_INCLUYE_1}} |

## Fase 2 · Adaptar

| Incluye | No incluye |
|---|---|
| {{INCLUYE_2}} | {{NO_INCLUYE_2}} |

## Fase 3 · Integrar

| Incluye | No incluye |
|---|---|
| {{INCLUYE_3}} | {{NO_INCLUYE_3}} |

<!-- Lo excluido dice a qué fase pertenece cuando corresponde:
     "Conexión con el sistema del proveedor (queda para la fase 3)".
     Un límite que señala un camino, no una negativa seca. -->

---

# 5 · Plazos

| Fase | Plazo | Empieza cuando |
|---|---|---|
| 1 · Construir | {{N}} semanas | Se confirma la propuesta |
| 2 · Adaptar | {{N}} semanas | Termina la fase 1 |
| 3 · Integrar | {{N}} semanas | {{DEPENDENCIA}} |

<!-- Plazos en semanas, en cifra. Si una fase depende de algo
     del cliente (accesos, datos, una decisión), se dice aquí. -->

---

# 6 · Inversión por fase

| Fase | Qué se entrega | Plazo | Inversión |
|---|---|---|---|
| 1 · Construir | {{ENTREGA_1}} | {{N}} semanas | S/ {{MONTO_1}} |
| 2 · Adaptar | {{ENTREGA_2}} | {{N}} semanas | S/ {{MONTO_2}} |
| 3 · Integrar | {{ENTREGA_3}} | {{N}} semanas | S/ {{MONTO_3}} |
| | | **Total** | **S/ {{TOTAL}}** |

**Condiciones de pago.** {{CONDICIONES}}

<!-- Qué porcentaje al inicio de cada fase, qué al cierre, y qué
     pasa si el cliente decide parar. Sin letra pequeña. -->

**Tributario:** {{IGV}} · {{REGIMEN}} · {{COMPROBANTE}}

<!-- ATENCIÓN. NO RELLENAR A OJO. IGV, régimen, tipo de comprobante y
     retenciones dependen del régimen en que se constituya la
     empresa y de la condición del cliente.
     CONFIRMAR CON EL CONTADOR antes de enviar.
     Es preferible que el marcador rompa a la vista antes que
     poner un dato inventado: un error tributario en una propuesta
     es un problema legal, no de maquetación. -->

---

# 7 · Qué pasa después de la entrega

- **Documentación:** {{QUÉ_SE_ENTREGA}}
- **Acompañamiento:** {{DURACIÓN}} desde la última entrega. Cubre {{QUÉ_CUBRE}}.
- **Correcciones sin costo:** {{QUÉ_ENTRA}}. Se considera trabajo nuevo {{QUÉ_NO_ENTRA}}.
- **Soporte:** se pide por {{CANAL}} y hay respuesta en {{TIEMPO}}.
- **Accesos e información:** {{QUÉ_PASA_SI_EL_CLIENTE_SIGUE_SOLO}}

Se entrega documentado y funcionando, no listo para probar.

---

```
[ pie ]
Suki · Construir · Adaptar · Integrar · Escalar · Evolucionar
suki.pe · {{TELÉFONO}}
Propuesta válida hasta {{FECHA_VALIDEZ}}
```

<!-- Archivo: suki_propuesta_{{cliente}}_{{aaaa-mm-dd}}.pdf
     Antes de enviar, correr la checklist del SKILL.md. -->
