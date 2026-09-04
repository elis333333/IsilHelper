#!/usr/bin/env python3
"""Suki — verificación de contraste WCAG 2.1.

Sin argumentos: audita la paleta completa contra los fondos del sistema.
Con dos colores: devuelve el ratio de ese par y si cumple AA y AAA.

    python3 contraste.py
    python3 contraste.py '#06D6A0' '#FFFFFF'

Umbrales: AA 4,5:1 en texto normal · 3:1 en texto grande (>=18,66px negrita
o >=24px) y en elementos de interfaz. AAA 7:1 en texto normal.
"""
import sys

PALETA = {
    "action  #06D6A0": "#06D6A0", "adapt   #8338EC": "#8338EC",
    "integr  #FFBE0B": "#FFBE0B", "scale   #FF006E": "#FF006E",
    "evolve  #3A86FF": "#3A86FF",
}
NEUTROS = {
    "disabled  #737373": "#737373", "subtle    #999999": "#999999",
    "muted     #B3B3B3": "#B3B3B3", "text      #CCCCCC": "#CCCCCC",
    "heading   #E6E6E6": "#E6E6E6", "white     #FFFFFF": "#FFFFFF",
}
FONDOS_OSCUROS = {"base #0D0D0D": "#0D0D0D", "surface #1A1A1A": "#1A1A1A", "elevated #242424": "#242424"}
FONDOS_CLAROS = {"light #F5F5F5": "#F5F5F5", "white #FFFFFF": "#FFFFFF"}


def luminancia(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def ratio(a: str, b: str) -> float:
    l1, l2 = sorted((luminancia(a), luminancia(b)), reverse=True)
    return (l1 + 0.05) / (l2 + 0.05)


def veredicto(r: float) -> str:
    if r >= 7:    return "AAA · todo"
    if r >= 4.5:  return "AA  · texto normal"
    if r >= 3:    return "AA  · SOLO texto grande e interfaz"
    return "FALLA · no usar como texto"


def tabla(titulo, colores, fondos):
    print(f"\n{titulo}")
    print("  " + " " * 20 + "".join(f"{k:>22}" for k in fondos))
    for nombre, c in colores.items():
        fila = "".join(f"{ratio(c, f):>10.2f}  {veredicto(ratio(c,f))[:10]:<10}" for f in fondos.values())
        print(f"  {nombre:<20}{fila}")


def main() -> int:
    if len(sys.argv) == 3:
        a, b = sys.argv[1], sys.argv[2]
        r = ratio(a, b)
        print(f"{a} sobre {b} → {r:.2f} : 1 — {veredicto(r)}")
        return 0 if r >= 4.5 else 1

    tabla("ACENTOS sobre fondos oscuros", PALETA, FONDOS_OSCUROS)
    tabla("ACENTOS sobre fondos claros", PALETA, FONDOS_CLAROS)
    tabla("NEUTROS sobre fondos oscuros", NEUTROS, FONDOS_OSCUROS)

    print("\nTEXTO ENCIMA DE CADA ACENTO")
    for nombre, c in PALETA.items():
        osc, bla = ratio(c, "#0D0D0D"), ratio(c, "#FFFFFF")
        elegido = "#0D0D0D" if osc >= bla else "#FFFFFF"
        print(f"  {nombre:<20} #0D0D0D {osc:5.2f}   #FFFFFF {bla:5.2f}   → usar {elegido}")

    print("\nLAS TRES REGLAS NO NEGOCIABLES")
    print("  1. Sobre #06D6A0 y #FFBE0B el texto es siempre #0D0D0D. Nunca blanco.")
    print("  2. #8338EC no se usa como texto sobre fondo oscuro. Relleno con blanco encima.")
    print("  3. Mínimo AA: 4,5:1 texto normal · 3:1 texto grande e interfaz.")
    print("\n  El ratio se mide sobre el fondo REAL. Sobre #242424 varios acentos bajan de AA.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
