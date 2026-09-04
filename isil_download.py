#!/usr/bin/env python3
"""
IsilHelper — descarga todo tu material de ECALA vía los web services de Moodle.

Uso:
    ./isil_download.py --list                 # solo lista tus cursos
    ./isil_download.py --dry-run              # muestra qué haría, sin descargar
    ./isil_download.py                        # descarga todo
    ./isil_download.py --course 47854 53519   # solo esos cursos

Lee BASE, TOKEN y UA desde .env (generado por get-token.sh).
"""

import argparse
import json
import os
import re
import sys
import time
import unicodedata
from pathlib import Path
from urllib.parse import urlparse, urlencode

import requests

HERE = Path(__file__).resolve().parent
ENV = HERE / ".env"
OUT = HERE / "downloads"

PAUSE = 0.6        # segundos entre peticiones (el WAF castiga las ráfagas)
TIMEOUT = 60
RETRIES = 4

# Enlaces externos que no se pueden descargar con el token: se registran aparte.
EXTERNAL_HOSTS = ("drive.google.com", "docs.google.com", "zoom.us",
                  "youtube.com", "youtu.be", "forms.gle", "onedrive.live.com",
                  "sharepoint.com", "vimeo.com")


# --------------------------------------------------------------------------- #
# configuración

def load_env():
    if not ENV.exists():
        sys.exit(f"No encuentro {ENV}. Corre primero ./get-token.sh 'MoodleSession'")
    cfg = {}
    for line in ENV.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        cfg[k.strip()] = v.strip().strip("'\"")
    for key in ("BASE", "TOKEN"):
        if not cfg.get(key):
            sys.exit(f"Falta {key} en .env")
    cfg.setdefault("UA", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                         "(KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36")
    return cfg


CFG = load_env()
BASE, TOKEN = CFG["BASE"].rstrip("/"), CFG["TOKEN"]

session = requests.Session()
session.headers.update({
    "User-Agent": CFG["UA"],
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-419,es;q=0.9",
    "Referer": f"{BASE}/my/",
})


# --------------------------------------------------------------------------- #
# capa de red

def ws(function, **params):
    """Llama a un web service y devuelve el JSON, reintentando ante el WAF."""
    payload = {"wstoken": TOKEN, "wsfunction": function,
               "moodlewsrestformat": "json", **params}
    for attempt in range(RETRIES):
        time.sleep(PAUSE)
        try:
            r = session.post(f"{BASE}/webservice/rest/server.php",
                             data=payload, timeout=TIMEOUT)
        except requests.RequestException as e:
            print(f"    red: {e}; reintento {attempt + 1}")
            time.sleep(3 * (attempt + 1))
            continue

        if r.status_code == 418:              # WAF de Huawei
            wait = 5 * (attempt + 1)
            print(f"    WAF bloqueó ({function}), esperando {wait}s")
            time.sleep(wait)
            continue
        if r.status_code != 200:
            print(f"    HTTP {r.status_code} en {function}; reintento")
            time.sleep(3 * (attempt + 1))
            continue

        try:
            data = r.json()
        except ValueError:
            print(f"    respuesta no-JSON en {function}")
            time.sleep(3)
            continue

        if isinstance(data, dict) and "exception" in data:
            raise RuntimeError(f"{function}: {data.get('errorcode')} — "
                               f"{data.get('message')}")
        return data

    raise RuntimeError(f"{function}: agotados los reintentos")


def download(url, dest: Path):
    """Descarga un fichero. Devuelve 'ok', 'skip' o un mensaje de error."""
    if dest.exists() and dest.stat().st_size > 0:
        return "skip"

    # los fileurl de la API necesitan el token pegado como parámetro
    sep = "&" if "?" in url else "?"
    full = f"{url}{sep}{urlencode({'token': TOKEN})}"

    for attempt in range(RETRIES):
        time.sleep(PAUSE)
        try:
            with session.get(full, stream=True, timeout=TIMEOUT) as r:
                if r.status_code == 418:
                    time.sleep(5 * (attempt + 1))
                    continue
                if r.status_code != 200:
                    return f"HTTP {r.status_code}"

                # Moodle responde con HTML (login o error) en vez de 4xx
                ctype = r.headers.get("Content-Type", "")
                if ctype.startswith("text/html"):
                    head = next(r.iter_content(2048), b"")
                    if b"errorcode" in head or b"login" in head.lower():
                        return "devolvió HTML (token o permisos)"

                dest.parent.mkdir(parents=True, exist_ok=True)
                tmp = dest.with_suffix(dest.suffix + ".part")
                with open(tmp, "wb") as fh:
                    for chunk in r.iter_content(1 << 16):
                        fh.write(chunk)
                tmp.replace(dest)
                return "ok"
        except requests.RequestException as e:
            if attempt == RETRIES - 1:
                return f"red: {e}"
            time.sleep(3 * (attempt + 1))
    return "agotados los reintentos"


# --------------------------------------------------------------------------- #
# utilidades

def slug(name, maxlen=90):
    """Nombre de carpeta/fichero seguro, conservando tildes legibles."""
    name = unicodedata.normalize("NFC", str(name or "sin_nombre"))
    name = re.sub(r"[<>:\"/\\|?*\x00-\x1f]", "-", name)
    name = re.sub(r"\s+", " ", name).strip(" .")
    return (name[:maxlen].rstrip() or "sin_nombre")


def is_external(url):
    host = (urlparse(url).netloc or "").lower()
    return any(h in host for h in EXTERNAL_HOSTS) or "ecala.net" not in host


# --------------------------------------------------------------------------- #
# lógica principal

def get_courses():
    info = ws("core_webservice_get_site_info")
    courses = ws("core_enrol_get_users_courses", userid=info["userid"])
    return info, sorted(courses, key=lambda c: c.get("fullname", ""))


def assign_files(course_id):
    """{cmid: [ficheros]} para las tareas, que no vienen en get_contents."""
    try:
        data = ws("mod_assign_get_assignments", **{"courseids[0]": course_id})
    except RuntimeError as e:
        print(f"    (sin acceso a tareas: {e})")
        return {}
    out = {}
    for course in data.get("courses", []):
        for a in course.get("assignments", []):
            files = (a.get("introattachments") or []) + (a.get("introfiles") or [])
            if files:
                out[a["cmid"]] = files
    return out


def process_course(course, dry_run=False):
    cid = course["id"]
    cname = slug(course.get("fullname") or course.get("shortname"))
    croot = OUT / cname
    print(f"\n=== {cname}  (id {cid}) ===")

    try:
        sections = ws("core_course_get_contents", courseid=cid)
    except RuntimeError as e:
        print(f"  ! no se pudo leer: {e}")
        return None

    tareas = assign_files(cid)
    meta = {"id": cid, "fullname": course.get("fullname"),
            "shortname": course.get("shortname"), "sections": [],
            "external": [], "errors": []}

    for section in sections:
        sname = slug(section.get("name") or "General")
        sdir = croot / sname
        smeta = {"name": section.get("name"), "modules": []}

        for mod in section.get("modules", []):
            mtype = mod.get("modname")
            mname = mod.get("name", "")
            cmid = mod.get("id")
            smeta["modules"].append({
                "cmid": cmid, "type": mtype, "name": mname,
                "url": mod.get("url"),
                "completed": (mod.get("completiondata") or {}).get("state"),
            })

            entries = list(mod.get("contents") or [])
            entries += tareas.get(cmid, [])

            if not entries:
                continue

            for item in entries:
                fileurl = item.get("fileurl")
                if not fileurl:
                    continue

                # enlaces externos: Drive, Zoom, Forms... solo se registran
                if item.get("type") == "url" or is_external(fileurl):
                    meta["external"].append({
                        "course": course.get("fullname"), "section": section.get("name"),
                        "module": mname, "type": mtype, "url": fileurl,
                    })
                    print(f"  → externo: {mname[:55]}")
                    continue

                fname = slug(item.get("filename") or f"{mname}.bin")
                dest = sdir / f"{slug(mname, 60)}" / fname if len(entries) > 1 else sdir / fname

                if dry_run:
                    print(f"  · {dest.relative_to(OUT)}")
                    continue

                res = download(fileurl, dest)
                if res == "ok":
                    print(f"  ✓ {dest.relative_to(OUT)}")
                elif res == "skip":
                    print(f"  = {fname} (ya estaba)")
                else:
                    print(f"  ✗ {fname}: {res}")
                    meta["errors"].append({"file": fname, "module": mname, "reason": res})

        meta["sections"].append(smeta)

    if not dry_run:
        croot.mkdir(parents=True, exist_ok=True)
        (croot / "metadata.json").write_text(
            json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    return meta


def main():
    ap = argparse.ArgumentParser(description="Descarga tu material de ECALA")
    ap.add_argument("--list", action="store_true", help="solo listar cursos")
    ap.add_argument("--dry-run", action="store_true", help="no descargar nada")
    ap.add_argument("--course", nargs="+", type=int, help="ids de curso concretos")
    args = ap.parse_args()

    info, courses = get_courses()
    print(f"Conectado como {info.get('username')} — {len(courses)} cursos\n")

    if args.list:
        for c in courses:
            print(f"  {c['id']:>7}  {c.get('fullname')}")
        return

    if args.course:
        courses = [c for c in courses if c["id"] in args.course]
        if not courses:
            sys.exit("Ninguno de esos ids está en tu lista de cursos.")

    externos, errores = [], []
    for c in courses:
        meta = process_course(c, dry_run=args.dry_run)
        if meta:
            externos += meta["external"]
            errores += meta["errors"]

    if args.dry_run:
        return

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "enlaces_externos.json").write_text(
        json.dumps(externos, ensure_ascii=False, indent=2), encoding="utf-8")

    drive = [e for e in externos if "drive.google" in e["url"] or "docs.google" in e["url"]]
    (OUT / "drive_urls.txt").write_text(
        "\n".join(dict.fromkeys(e["url"] for e in drive)), encoding="utf-8")

    print(f"\n--- Resumen ---")
    print(f"  enlaces externos : {len(externos)}  (de ellos {len(drive)} de Drive)")
    print(f"  errores          : {len(errores)}")
    print(f"  carpeta          : {OUT}")
    if drive:
        print("\n  Para bajar los Drive:  ./drive_rclone.py --list")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrumpido. Vuelve a correrlo y continúa donde quedó.")
    except RuntimeError as e:
        sys.exit(f"Error: {e}")
