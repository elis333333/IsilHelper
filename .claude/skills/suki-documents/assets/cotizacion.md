<!-- =========================================================
     SUKI — Plantilla de cotización, una página
     Para cuando el cliente pide un precio por algo ya definido.
     Sin diagnóstico: si hace falta diagnosticar, es una propuesta.
     ========================================================= -->

```
[ cabecera: suki_logotipo-completo_positivo_claro_rgb.svg ]

Cotización
{{CLIENTE}}
{{FECHA}}
Válida hasta {{FECHA_VALIDEZ}}
```

---

| Concepto | Qué se entrega | Plazo | Inversión |
|---|---|---|---|
| {{CONCEPTO}} | {{ENTREGA}} | {{N}} semanas | S/ {{MONTO}} |

**No incluye:** {{NO_INCLUYE}}

**Condiciones de pago:** {{CONDICIONES}}

**Tributario:** {{IGV}} · {{REGIMEN}} · {{COMPROBANTE}}

<!-- ATENCIÓN. CONFIRMAR CON EL CONTADOR. No rellenar a ojo. -->

---

```
[ pie ]
Suki · suki.pe · {{TELÉFONO}}
```

<!-- Si al escribir esto aparecen fases, dependencias entre partes
     o un problema que hay que entender antes de cotizar, el
     documento correcto no es una cotización: es una propuesta.
     Ver assets/propuesta.md -->

<!-- Archivo: suki_cotizacion_{{cliente}}_{{aaaa-mm-dd}}.pdf -->
