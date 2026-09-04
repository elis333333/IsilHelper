#!/usr/bin/env python3
"""
Baja los enlaces de Google Drive de enlaces_externos.json usando rclone,
colocando cada uno en downloads/<Curso>/<Sección>/<Tema>/

Requiere un remote de rclone ya configurado (por defecto 'isil').

Uso:
    ./drive_rclone.py --list
    ./drive_rclone.py --limit 3
    ./drive_rclone.py
    ./drive_rclone.py --course "BASE DE DATOS"
    ./drive_rclone.py --retry          # solo los que fallaron
"""

import argparse
import json
import re
import shutil
import subprocess
import sys
import time
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "downloads"
LINKS = OUT / "enlaces_externos.json"
FAILED = OUT / "drive_fallidos.json"

REMOTE = "isil"
PAUSE = 1.0
TIMEOUT = 900

# los Google Docs nativos no son archivos binarios: hay que exportarlos
EXPORT = "pdf,docx,xlsx,pptx"

RUIDO = re.compile(
    r"ayúdanos a mejorar|ayudanos a mejorar|tus calificaciones|encuesta",
    re.IGNORECASE)

# /folders/ID   /file/d/ID   /document/d/ID   ?id=ID
RE_FOLDER = re.compile(r"/folders/([A-Za-z0-9_-]{10,})")
RE_FILE = re.compile(r"/(?:file|document|spreadsheets|presentation)/d/"
                     r"([A-Za-z0-9_-]{10,})")
RE_QUERY = re.compile(r"[?&]id=([A-Za-z0-9_-]{10,})")


def parse_url(url):
    """Devuelve ('folder'|'file'|'?', id) o (None, None).

    Los enlaces tipo ?id=... son ambiguos: pueden apuntar a un archivo
    o a una carpeta. Se marcan con '?' y se resuelven consultando Drive.
    """
    m = RE_FOLDER.search(url)
    if m:
        return "folder", m.group(1)
    m = RE_FILE.search(url)
    if m:
        return "file", m.group(1)
    m = RE_QUERY.search(url)
    if m:
        return "?", m.group(1)
    return None, None


def is_folder(gid, remote):
    """True si el ID corresponde a una carpeta accesible."""
    r = subprocess.run(
        ["rclone", "lsf", "--drive-root-folder-id", gid, f"{remote}:",
         "--max-depth", "1"],
        capture_output=True, text=True, timeout=60)
    return r.returncode == 0


def slug(name, maxlen=90):
    name = unicodedata.normalize("NFC", str(name or "sin_nombre"))
    name = re.sub(r"[<>:\"/\\|?*\x00-\x1f]", "-", name)
    name = re.sub(r"\s+", " ", name).strip(" .")
    return name[:maxlen].rstrip() or "sin_nombre"


def check_remote(remote):
    if not shutil.which("rclone"):
        sys.exit("rclone no está instalado:  sudo pacman -S rclone")
    r = subprocess.run(["rclone", "listremotes"], capture_output=True, text=True)
    if f"{remote}:" not in r.stdout:
        sys.exit(f"No existe el remote '{remote}:'. Córrelo con: rclone config\n"
                 f"Remotes actuales: {r.stdout.strip() or '(ninguno)'}")


def load_targets(only_failed=False):
    src = FAILED if only_failed else LINKS
    if not src.exists():
        sys.exit(f"Falta {src}. Corre primero ./isil_download.py")

    entries = json.loads(src.read_text(encoding="utf-8"))
    seen, targets, raros = set(), [], []

    for e in entries:
        url = e.get("url", "")
        if "google.com" not in url:
            continue
        if RUIDO.search(e.get("module") or ""):
            continue
        if url in seen:
            continue
        seen.add(url)

        kind, gid = parse_url(url)
        if not gid:
            raros.append(e)
            continue

        dest = (OUT / slug(e.get("course"))
                    / slug(e.get("section") or "General")
                    / slug(e.get("module"), 70))
        targets.append({"url": url, "kind": kind, "id": gid, "dest": dest,
                        "course": e.get("course"), "module": e.get("module")})
    return targets, raros


def already_done(dest: Path):
    return dest.exists() and any(p.is_file() for p in dest.rglob("*"))


def fetch(target, remote):
    dest = target["dest"]
    dest.mkdir(parents=True, exist_ok=True)
    common = ["--drive-export-formats", EXPORT, "--transfers", "4",
              "--drive-acknowledge-abuse", "--retries", "2", "--stats", "0"]

    # enlace ambiguo: preguntarle a Drive qué es
    if target["kind"] == "?":
        try:
            target["kind"] = "folder" if is_folder(target["id"], remote) else "file"
        except subprocess.TimeoutExpired:
            return "timeout al identificar el tipo"

    if target["kind"] == "folder":
        cmd = ["rclone", "copy", "--drive-root-folder-id", target["id"],
               f"{remote}:", str(dest)] + common
    else:
        cmd = ["rclone", "backend", "copyid", f"{remote}:",
               target["id"], str(dest) + "/"] + common

    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=TIMEOUT)
    except subprocess.TimeoutExpired:
        return "timeout"

    if any(p.is_file() for p in dest.rglob("*")):
        return "ok"

    err = [l for l in (r.stderr or r.stdout or "").strip().splitlines()
           if l.strip()]
    msg = " | ".join(err[-3:]) if err else f"vacío (código {r.returncode})"
    low = msg.lower()
    if "404" in low or "not found" in low:
        msg = "no encontrado — el enlace puede estar roto: " + msg
    elif "403" in low or "permission" in low:
        msg = "sin permiso con esta cuenta: " + msg
    return msg


def main():
    ap = argparse.ArgumentParser(description="Baja los Drive de ECALA con rclone")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--retry", action="store_true", help="solo los fallidos")
    ap.add_argument("--course", help="filtra por texto del nombre del curso")
    ap.add_argument("--limit", type=int)
    ap.add_argument("--remote", default=REMOTE)
    args = ap.parse_args()

    targets, raros = load_targets(only_failed=args.retry)

    if raros:
        print(f"! {len(raros)} enlaces sin ID reconocible de Drive:")
        for e in raros[:5]:
            print(f"    {e.get('module')} -> {e.get('url')[:90]}")
        print()

    if args.course:
        needle = args.course.lower()
        targets = [t for t in targets if needle in (t["course"] or "").lower()]
    if args.limit:
        targets = targets[:args.limit]
    if not targets:
        sys.exit("Nada que bajar con ese filtro.")

    if args.list:
        actual = None
        for t in targets:
            if t["course"] != actual:
                actual = t["course"]
                print(f"\n{actual}")
            estado = "ya está" if already_done(t["dest"]) else "pendiente"
            print(f"   [{estado:9}] {t['kind']:6} {t['module']}")
        pend = sum(1 for t in targets if not already_done(t["dest"]))
        print(f"\n{len(targets)} enlaces — {pend} pendientes")
        return

    if not args.dry_run:
        check_remote(args.remote)

    hechos = saltados = 0
    fallos = []

    for i, t in enumerate(targets, 1):
        etq = f"[{i}/{len(targets)}] {(t['module'] or '')[:58]}"
        if already_done(t["dest"]):
            print(f"  = {etq}")
            saltados += 1
            continue
        if args.dry_run:
            print(f"  · {etq}  ({t['kind']})\n      -> {t['dest'].relative_to(OUT)}")
            continue

        res = fetch(t, args.remote)
        if res == "ok":
            n = sum(1 for p in t["dest"].rglob("*") if p.is_file())
            print(f"  ✓ {etq}  ({n} archivo{'s' if n != 1 else ''})")
            hechos += 1
        else:
            print(f"  ✗ {etq}\n      {res}")
            fallos.append({k: t[k] for k in ("url", "course", "module")}
                          | {"error": res})
            try:
                t["dest"].rmdir()
            except OSError:
                pass
        time.sleep(PAUSE)

    if args.dry_run:
        return

    print("\n--- Resumen ---")
    print(f"  bajados    : {hechos}")
    print(f"  ya estaban : {saltados}")
    print(f"  fallidos   : {len(fallos)}")
    if fallos:
        FAILED.write_text(json.dumps(fallos, ensure_ascii=False, indent=2),
                          encoding="utf-8")
        print(f"  detalle en {FAILED.name} — reintenta con: {sys.argv[0]} --retry")
    elif FAILED.exists() and not args.retry:
        FAILED.unlink()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrumpido. Vuelve a correrlo y sigue donde quedó.")