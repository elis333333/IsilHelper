<!-- =========================================================
     SUKI — Plantilla de presupuesto por partidas
     Para cuando el alcance ya está claro y tiene partes,
     pero no hay fases de proyecto.
     Si el trabajo tiene fases, se usa assets/propuesta.md.
     ========================================================= -->

```
[ cabecera: suki_logotipo-completo_positivo_claro_rgb.svg ]

Presupuesto
{{CLIENTE}}
{{FECHA}}
Válido hasta {{FECHA_VALIDEZ}}
```

---

## Qué se presupuesta

{{DESCRIPCIÓN}}

<!-- Dos o tres frases en lenguaje de negocio. Qué problema
     resuelve esto, no qué tecnología se va a usar. -->

---

## Partidas

| # | Partida | Qué se entrega | Inversión |
|---|---|---|---|
| 1 | {{PARTIDA_1}} | {{ENTREGA_1}} | S/ {{MONTO_1}} |
| 2 | {{PARTIDA_2}} | {{ENTREGA_2}} | S/ {{MONTO_2}} |
| 3 | {{PARTIDA_3}} | {{ENTREGA_3}} | S/ {{MONTO_3}} |
| | | **Total** | **S/ {{TOTAL}}** |

<!-- Cada partida dice QUÉ SE ENTREGA, no en qué se trabaja.
     "El catálogo cargado con tus 400 productos" es verificable.
     "Desarrollo del módulo de catálogo" no lo es. -->

---

## Qué no incluye

- {{NO_INCLUYE_1}}
- {{NO_INCLUYE_2}}
- {{NO_INCLUYE_3}}

<!-- Este apartado no es opcional. Es lo que evita la discusión
     de alcance a mitad del trabajo. -->

---

## Plazo

{{N}} semanas desde la confirmación. {{DEPENDENCIAS}}

## Condiciones de pago

{{CONDICIONES}}

**Tributario:** {{IGV}} · {{REGIMEN}} · {{COMPROBANTE}}

<!-- ATENCIÓN. CONFIRMAR CON EL CONTADOR. No rellenar a ojo. -->

---

```
[ pie ]
Suki · suki.pe · {{TELÉFONO}}
```

<!-- Archivo: suki_presupuesto_{{cliente}}_{{aaaa-mm-dd}}.pdf -->
