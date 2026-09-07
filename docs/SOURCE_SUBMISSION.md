# Reproducir el build para la revisión de código fuente

Firefox AMO exige que, para una extensión cuyo bundle está minificado, se
suba también el código fuente del que sale ese bundle, con instrucciones para
reconstruirlo. **El bundle de producción de IsilHelper está minificado**: Vite
usa `esbuild` para minificar por defecto y `vite.config.ts` no desactiva esa
opción (`build.minify` no aparece en el archivo, así que aplica el valor por
defecto). Comprobado sobre el build real: `src/` tiene 8756 líneas de
TypeScript legible repartidas en decenas de archivos, y el `.js` principal que
sale del build las condensa en 24 líneas sin espacios ni nombres de variable
legibles. Sin este documento, quien revise no puede saber que ese archivo sale
literalmente de este repositorio.

Este documento es exactamente eso: los pasos para que un revisor —o cualquiera
con este repositorio— reconstruya el build de Firefox byte a byte equivalente
al que se subió, y cómo se preparó el `.zip` de código fuente que acompaña al
envío.

---

## Dos builds, uno por navegador

El repositorio produce **dos salidas distintas**, no una:

```bash
pnpm build            # Chrome y Brave → dist/
pnpm build:firefox    # Firefox        → dist-firefox/
```

No es cosmético. Firefox tiene el service worker de Manifest V3 detrás de un
flag apagado por defecto y exige `background.scripts` como respaldo, algo que
Chrome no usa y que `@crxjs/vite-plugin` no puede meter en un solo manifest a
la vez que `background.service_worker` —lo comprobó `web-ext lint`
(`BACKGROUND_SERVICE_WORKER_NOFALLBACK`) y lo confirmó instalar de verdad en
Firefox 153 el 7 de septiembre de 2026, antes de separar los dos builds—.
`vite.config.ts` decide cuál construir según `--mode`, y `manifest.config.ts`
refleja esa misma decisión para la forma de `background`; los dos leen la
misma variable, así que nunca sale un manifest de un navegador con la salida
del otro. Detalle completo del porqué en `context/session.md`, 7 de
septiembre de 2026.

**Todo lo que sigue en este documento es sobre `dist-firefox/`**, que es lo
que se sube a AMO. `dist/` es el envío de Chrome Web Store y no lleva
`browser_specific_settings` con efecto ninguno para Firefox.

---

## Antes de nada: fija la revisión exacta

Antes de subir nada a AMO, marca el commit exacto que se está enviando:

```bash
git rev-parse HEAD
git tag amo-envio-vX.Y.Z   # X.Y.Z = el mismo número que package.json / manifest.config.ts
git push origin amo-envio-vX.Y.Z
```

Sin esto, "reconstruir desde el repositorio" es ambiguo: el repositorio sigue
cambiando después del envío. La cifra de versión sale de `package.json`
(`pkg.version`, que `manifest.config.ts` copia tal cual al manifest); confirma
que coincide con la que aparece en el panel de AMO antes de etiquetar.

---

## Herramientas exactas

| Herramienta | Versión | De dónde sale el dato |
|---|---|---|
| Node.js | El proyecto **no fija una versión** con `engines` en `package.json` ni con `.nvmrc` — no existen ninguno de los dos archivos. Derivado de las dependencias reales: Vite 8 exige `^20.19.0 \|\| >=22.12.0`, ESLint 10 exige `^20.19.0 \|\| ^22.13.0 \|\| >=24`, Vitest exige `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0`. La intersección de las tres es **Node 22.13 o superior** (una LTS de Node 22 sirve; también sirve Node 24). Comprobado leyendo el campo `engines` de cada paquete instalado en `node_modules/` |
| Gestor de paquetes | **pnpm**, sin versión fijada en `package.json` (no hay campo `packageManager`). El repositorio se ha construido con pnpm 10.x (`npx pnpm@10`, ver `context/session.md` § Notas de entorno). Usa pnpm 10 para evitar diferencias de resolución de dependencias frente al `pnpm-lock.yaml` versionado |
| Lockfile | `pnpm-lock.yaml`, versionado en el repositorio (`lockfileVersion: 9.0`). Es lo que hace el build reproducible: instalar sin él resolvería versiones distintas de las que se usaron |

---

## Reconstruir el build

```bash
git clone https://github.com/elis333333/IsilHelper
cd IsilHelper
git checkout amo-envio-vX.Y.Z   # o el hash de commit exacto

corepack enable pnpm            # o: npm install -g pnpm@10

pnpm install --frozen-lockfile  # falla si el lockfile no coincide exacto:
                                 # es la señal de que algo no cuadra
pnpm build:firefox
```

`pnpm build:firefox` es `tsc --noEmit && vite build --mode firefox`
(`package.json`, script `build:firefox`): primero comprueba los tipos sin
emitir nada, después Vite genera el paquete con `browser: "firefox"` pasado
al plugin de la extensión. No hay ningún paso oculto, ni un script de
`postinstall`, ni un `Makefile` aparte: esos dos comandos son el build
completo.

**No hace falta ninguna variable de entorno ni ningún secreto.** Verificado:
no hay una sola referencia a `import.meta.env` ni a `process.env` en
`src/`, `vite.config.ts` ni `manifest.config.ts`. El archivo `.env` que
existe en la raíz del repositorio en desarrollo **no lo usa la extensión**:
lo leen `get-token.sh` e `isil_download.py`, los scripts de Python de
referencia que preceden a la extensión y que no forman parte de este build
(están documentados en el README bajo «Precedente en Python»). `.env` está en
`.gitignore` y no se sube nunca; no hace falta un `.env.example` porque no hay
nada que rellenar para compilar.

El resultado queda en `dist-firefox/`. Ese directorio no está versionado
(`.gitignore` lo excluye) porque es exactamente lo que este documento enseña
a reproducir.

---

## Verificar que coincide con lo enviado

```bash
diff <(cat dist-firefox/manifest.json) <(unzip -p isilhelper-vX.Y.Z.xpi manifest.json)
```

Si el `.xpi` subido a AMO se generó desde `dist-firefox/` sin tocar nada a
mano —que es como debe hacerse—, esta comparación no debería mostrar
diferencias más allá del formato de salida del `.zip`. Lo mismo vale para
cualquier otro archivo del paquete: `dist-firefox/` es, archivo por archivo,
el contenido del `.xpi`.

Comprobación rápida de que el manifest corresponde de verdad a un build de
Firefox y no al de Chrome subido por error: `background` tiene que traer
`scripts`, nunca `service_worker`.

```bash
python3 -c "import json; print(json.load(open('dist-firefox/manifest.json'))['background'])"
# {'scripts': ['service-worker-loader.js'], 'type': 'module'}
```

---

## Empaquetar el código fuente para el envío a AMO

AMO pide el código fuente como un `.zip` aparte del `.xpi`. La forma correcta
de generarlo es desde `git`, no a mano con `zip`, porque así se excluye
automáticamente todo lo que el repositorio ya marca como no versionado —sin
tener que acordarse de cada carpeta— y se garantiza que el `.zip` contiene
exactamente lo que hay en el commit etiquetado, ni un archivo modificado de
más:

```bash
git archive --format=zip --output=isilhelper-fuente-vX.Y.Z.zip amo-envio-vX.Y.Z
```

`git archive` empaqueta únicamente los archivos **versionados** en esa
revisión. Como consecuencia, quedan fuera del `.zip` sin necesidad de
excluirlos a mano:

- `node_modules/` — nunca se ha añadido a git
- `dist/` y `dist-firefox/` — están en `.gitignore`
- `.env`, `.venv/`, `downloads/`, `*.part`, `client_secret_*.json` — están en
  `.gitignore`
- `.git/` — `git archive` no incluye el propio repositorio, solo su contenido

Quien reciba `isilhelper-fuente-vX.Y.Z.zip` ejecuta `pnpm install &&
pnpm build:firefox` dentro de la carpeta descomprimida y obtiene el mismo
`dist-firefox/`.

**Nota para quien prepare el envío de Chrome Web Store**: ese es
`pnpm build`, no `pnpm build:firefox`, y el manifest correcto trae
`service_worker` y no `scripts`. Es fácil confundir los dos justo porque solo
cambia una palabra en el comando: comprobar el contenido de `background` en
el manifest generado antes de subir nada, con el mismo `python3 -c "..."` de
arriba.
