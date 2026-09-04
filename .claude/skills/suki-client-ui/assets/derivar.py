#!/usr/bin/env python3
"""Suki — deriva un sistema de color desde la marca de un cliente.

La paleta de Suki NO se usa en proyectos de cliente. Este script
construye el sistema del cliente a partir de SU color y verifica
que toda la matriz de texto sobre fondo llegue a WCAG AA.

    python3 derivar.py '#1B5E9C'                 # fondo claro (por defecto)
    python3 derivar.py '#1B5E9C' --oscuro        # interfaz dark-first
    python3 derivar.py '#1B5E9C' --neutro '#0F172A'   # neutros con matiz del cliente

Salida: escala 50–950 del color de acción, escala de neutros,
funcionales de arranque y la matriz de contraste completa.
"""
import sys

AA_NORMAL, AA_GRANDE = 4.5, 3.0

FUNCIONALES_CLARO = {"error": "#B91C1C", "exito": "#15803D", "advertencia": "#B45309", "info": "#1D4ED8"}
FUNCIONALES_OSCURO = {"error": "#F87171", "exito": "#4ADE80", "advertencia": "#FBBF24", "info": "#60A5FA"}
PALETA_SUKI = {"#06D6A0", "#8338EC", "#FFBE0B", "#FF006E", "#3A86FF"}
PASOS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]


def a_rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def a_hex(rgb):
    return "#{:02X}{:02X}{:02X}".format(*(max(0, min(255, round(c))) for c in rgb))


def luminancia(h):
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (c / 255 for c in a_rgb(h))
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def ratio(a, b):
    l1, l2 = sorted((luminancia(a), luminancia(b)), reverse=True)
    return (l1 + 0.05) / (l2 + 0.05)


def mezclar(h, destino, cantidad):
    """Mezcla lineal hacia blanco o negro. cantidad 0..1."""
    return a_hex(tuple(c + (d - c) * cantidad for c, d in zip(a_rgb(h), a_rgb(destino))))


def hue(h):
    r, g, b = (c / 255 for c in a_rgb(h))
    mx, mn = max(r, g, b), min(r, g, b)
    if mx == mn:
        return None
    d = mx - mn
    if mx == r:
        t = ((g - b) / d) % 6
    elif mx == g:
        t = (b - r) / d + 2
    else:
        t = (r - g) / d + 4
    return t * 60


def escala_neutros(tinte=None, fuerza=0.06):
    """Rampa de blanco a negro. Con tinte, mezcla un 6 % del color del cliente."""
    luces = {50: 0.98, 100: 0.96, 200: 0.90, 300: 0.80, 400: 0.62,
             500: 0.45, 600: 0.34, 700: 0.24, 800: 0.15, 900: 0.09, 950: 0.05}
    out = {}
    for p, l in luces.items():
        gris = a_hex((l * 255,) * 3)
        out[p] = mezclar(gris, tinte, fuerza) if tinte else gris
    return out


def escala(base):
    """Once pasos alrededor del color, con el original en el 500."""
    hacia_blanco = {50: 0.95, 100: 0.88, 200: 0.74, 300: 0.56, 400: 0.30}
    hacia_negro = {600: 0.18, 700: 0.36, 800: 0.54, 900: 0.70, 950: 0.82}
    out = {}
    for p in PASOS:
        if p < 500:
            out[p] = mezclar(base, "#FFFFFF", hacia_blanco[p])
        elif p == 500:
            out[p] = base.upper()
        else:
            out[p] = mezclar(base, "#000000", hacia_negro[p])
    return out


def texto_encima(color):
    osc, cla = ratio(color, "#0D0D0D"), ratio(color, "#FFFFFF")
    return ("#0D0D0D", osc) if osc >= cla else ("#FFFFFF", cla)


def marca(r, grande=False):
    umbral = AA_GRANDE if grande else AA_NORMAL
    return "OK " if r >= umbral else "NO "


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        print(__doc__)
        return 2
    base = args[0].upper()
    oscuro = "--oscuro" in sys.argv
    neutro_base = args[1] if "--neutro" in sys.argv and len(args) > 1 else ("#0D0D0D" if oscuro else "#111111")

    if base in PALETA_SUKI:
        print(f"AVISO: {base} pertenece a la paleta de Suki y no se usa en proyectos de cliente.")
        print("       El trabajo entregado lleva la identidad del cliente. Usa el color del cliente.\n")

    fondo = "#0D0D0D" if oscuro else "#FFFFFF"
    superficie = "#1A1A1A" if oscuro else "#F7F7F7"
    esc = escala(base)
    tinte = neutro_base if "--neutro" in sys.argv else None
    neu = escala_neutros(tinte)

    print(f"\nCOLOR DE ACCIÓN DEL CLIENTE — {base}   (fondo {'oscuro' if oscuro else 'claro'})")
    print("  paso   hex        s/fondo   texto encima")
    for p in PASOS:
        c = esc[p]
        t, r = texto_encima(c)
        print(f"  {p:<5}  {c}   {ratio(c, fondo):6.2f}   {t} ({r:.2f})")

    accion = base
    if ratio(base, fondo) < AA_NORMAL:
        # se busca el paso MÁS CERCANO al color de marca que sí cumple, no el más extremo
        candidatos = ([p for p in PASOS if p > 500 and ratio(esc[p], fondo) >= AA_NORMAL] if not oscuro
                      else [p for p in reversed(PASOS) if p < 500 and ratio(esc[p], fondo) >= AA_NORMAL])
        if candidatos:
            accion = esc[candidatos[0]]
            print(f"\n  {base} da {ratio(base, fondo):.2f} sobre {fondo}: no llega a AA como texto.")
            print(f"  Para lo que lleva texto se usa el paso {candidatos[0]} ({accion}, {ratio(accion, fondo):.2f}).")
            print(f"  El color original queda para rellenos con texto oscuro encima, bordes e íconos.")

    print(f"\nNEUTROS — rampa neutra pura" + (f", con 6 % de tinte {neutro_base}" if tinte else ""))
    print("  paso   hex        s/fondo   uso sugerido")
    usos = {50: "fondo claro", 100: "superficie clara", 200: "borde sutil", 300: "borde",
            400: "deshabilitado", 500: "texto terciario", 600: "texto secundario",
            700: "texto secundario fuerte", 800: "texto principal", 900: "títulos",
            950: "fondo oscuro"}
    for p in PASOS:
        c = neu[p]
        r = ratio(c, fondo)
        apto = marca(r) if r >= AA_GRANDE else "NO "
        print(f"  {p:<5}  {c}   {r:6.2f}   {apto} {usos[p]}")

    print("\nFUNCIONALES DE ARRANQUE — no son de Suki ni del cliente; se ajustan a su marca")
    func = FUNCIONALES_OSCURO if oscuro else FUNCIONALES_CLARO
    for nombre, c in func.items():
        r = ratio(c, fondo)
        print(f"  {nombre:<12} {c}   s/fondo {r:5.2f}  {marca(r)}")
    ha, he = hue(base), hue(func["exito"])
    if ha is not None and he is not None and min(abs(ha - he), 360 - abs(ha - he)) < 40:
        print("  AVISO: el color de acción y el de éxito comparten tono.")
        print("         Cambia el tono del éxito, o distíngelo solo con ícono y texto.")

    print(f"\nMATRIZ — texto sobre fondo ({'oscuro' if oscuro else 'claro'})")
    textos = {"principal": neu[900] if not oscuro else neu[200],
              "secundario": neu[700] if not oscuro else neu[400],
              "acción": accion}
    for nf, f in {"fondo": fondo, "superficie": superficie}.items():
        for nt, t in textos.items():
            r = ratio(t, f)
            print(f"  {nt:<11} sobre {nf:<11} {t} / {f}   {r:5.2f}  {marca(r)}")

    print("\nREGLAS QUE NO CAMBIAN")
    print("  - La paleta de Suki no aparece en este proyecto. Ni un HEX, ni el logotipo, ni los cinco puntos.")
    print("  - AA es el mínimo: 4,5:1 texto normal, 3:1 texto grande y elementos de interfaz.")
    print("  - El color nunca es el único portador de información: todo estado lleva ícono y texto.")
    print("  - Un solo valor de radio en todo el sistema, coherente con la marca del cliente.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
