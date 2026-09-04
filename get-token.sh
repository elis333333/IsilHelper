#!/usr/bin/env bash
# Obtiene el token de web service de Moodle (ECALA) y lo valida.
# Uso:  ./get-token.sh 'valor_de_MoodleSession'

set -uo pipefail

BASE='https://platform.ecala.net'
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'

RED=$'\e[31m'; GRN=$'\e[32m'; YEL=$'\e[33m'; RST=$'\e[0m'
ok()   { echo "${GRN}✓${RST} $*"; }
bad()  { echo "${RED}✗${RST} $*"; }
warn() { echo "${YEL}!${RST} $*"; }

if [ $# -lt 1 ]; then
  bad "Falta la cookie. Uso: $0 '<MOODLESESSION>'"
  echo "  DevTools > Application > Cookies > platform.ecala.net > MoodleSession"
  exit 1
fi

# acepta tanto 'abc123' como 'MoodleSession=abc123'
SESS="${1#MoodleSession=}"
COOKIE="MoodleSession=$SESS"

# cabeceras que hacen falta para pasar el WAF de Huawei (Server: CW)
req() {
  curl -s --compressed -A "$UA" \
    -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
    -H 'Accept-Language: es-419,es;q=0.9' \
    -H "Referer: $BASE/my/" \
    "$@"
}

echo "--- 1. Comprobando la sesión ---"
HDRS=$(req -o /dev/null -D - -b "$COOKIE" "$BASE/my/")
CODE=$(printf '%s' "$HDRS" | head -1 | awk '{print $2}')

case "$CODE" in
  418) bad "418 — bloqueado por el WAF. Reintenta en un minuto."; exit 1 ;;
  200) ok  "Sesión viva (200)." ;;
  30*) LOC=$(printf '%s' "$HDRS" | grep -i '^location:' | tr -d '\r')
       bad "La cookie no sirve ($CODE)."
       echo "    -> $LOC"
       echo "    Copia el valor ACTUAL de MoodleSession desde DevTools."
       exit 1 ;;
  *)   bad "Respuesta inesperada: $CODE"; exit 1 ;;
esac

echo "--- 2. Pidiendo el token ---"
LAUNCH="$BASE/admin/tool/mobile/launch.php?service=moodle_mobile_app&passport=1&urlscheme=isilhelper"
LHDRS=$(req -o /dev/null -D - -b "$COOKIE" "$LAUNCH")
LCODE=$(printf '%s' "$LHDRS" | head -1 | awk '{print $2}')
LOC=$(printf '%s' "$LHDRS" | grep -i '^location:' | tr -d '\r' | sed 's/^[Ll]ocation:[[:space:]]*//')

if [ -z "$LOC" ]; then
  bad "Sin cabecera Location (HTTP $LCODE). El servicio móvil podría estar apagado."
  printf '%s\n' "$LHDRS" | head -20
  exit 1
fi

case "$LOC" in
  *token=*) ok "Location con token." ;;
  *)        bad "Location sin token: $LOC"; exit 1 ;;
esac

B64="${LOC#*token=}"

echo "--- 3. Decodificando ---"
TOKEN=$(python3 - "$B64" <<'PY'
import base64, sys
s = sys.argv[1].strip()
s += '=' * (-len(s) % 4)
try:
    raw = base64.b64decode(s).decode()
except Exception as e:
    sys.exit(f"no se pudo decodificar: {e}")
parts = raw.split(':::')
if len(parts) < 2:
    sys.exit(f"formato raro, {len(parts)} campo(s)")
print(parts[1])
PY
) || { bad "$TOKEN"; exit 1; }

if [ ${#TOKEN} -ne 32 ]; then
  bad "El token mide ${#TOKEN} caracteres, deberían ser 32."
  exit 1
fi
ok "Token de 32 caracteres obtenido."

echo "--- 4. Validando contra la API ---"
RESP=$(curl -s --compressed -A "$UA" \
  "$BASE/webservice/rest/server.php?wstoken=$TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json")

if printf '%s' "$RESP" | grep -q '"exception"'; then
  bad "La API rechazó el token:"
  printf '%s\n' "$RESP"
  exit 1
fi

python3 - "$RESP" <<'PY'
import json, sys
d = json.loads(sys.argv[1])
fns = {f['name'] for f in d.get('functions', [])}
print(f"  userid   : {d.get('userid')}")
print(f"  usuario  : {d.get('username')}")
print(f"  sitio    : {d.get('sitename')}")
print(f"  funciones: {len(fns)}")
print()
for f in ('core_enrol_get_users_courses',
          'core_course_get_contents',
          'core_course_get_course_module',
          'mod_resource_get_resources_by_courses',
          'mod_url_get_urls_by_courses',
          'mod_assign_get_assignments'):
    print(f"  {'OK  ' if f in fns else 'NO  '} {f}")
PY

# guardar para los siguientes scripts
ENV_FILE="$(dirname "$0")/.env"
umask 077
cat > "$ENV_FILE" <<EOF
BASE=$BASE
TOKEN=$TOKEN
UA='$UA'
EOF
ok "Guardado en $ENV_FILE (cárgalo con: set -a; source .env; set +a)"