# IsilHelper

**Extensión de navegador para archivar tu material de ISIL antes de que cierren
el ciclo.**

Al terminar el ciclo el instituto revoca el acceso a la plataforma. Lo que no
bajaste, lo perdiste: los PDFs, las guías, los enunciados de las tareas. Bajar
todo a mano son cientos de clics repartidos en once cursos, así que casi nadie
lo hace hasta que ya es tarde.

IsilHelper lo hace por ti. Entras una vez, pulsas *Descargar todo el curso*, y
el material queda en tu carpeta de descargas, ordenado por curso y sección.

Producto de **Suki**. Proyecto estudiantil, no oficial, sin relación con ISIL.

---

## Qué hace

**Descargar es el producto.** Lo demás está para que llegar al material sea
cómodo.

| | |
|---|---|
| **Descargas** | Archivo suelto, sección entera o el curso completo. Cola con progreso, pausa y reanudación; salta lo que ya bajaste |
| **Google Drive** | Los temas y el sílabo viven en Drive: la extensión abre las carpetas, baja lo que hay dentro y entra en las subcarpetas. Sin configurar nada |
| **Índice del curso** | Un `metadata.json` junto al material, con la lista de archivos y los enlaces externos del curso |
| **Pendientes** | Las entregas de los once cursos en una sola lista por fecha, no una pestaña por curso |
| **Cursos** | Tu avance de un vistazo, y el contenido de cada uno |
| **Notas** | El boletín de todos los cursos en una tabla, con el promedio |
| **Buscar** | Sobre lo que ya está cargado, diciendo siempre qué alcance tiene |

### Dónde caen los archivos

```
Descargas/
└── IsilHelper/
    └── Base de Datos II/
        ├── metadata.json
        ├── Complementario/
        │   ├── guia-de-laboratorio.pdf
        │   └── Semana 3/          ← cuando un módulo trae varios archivos
        │       ├── practica.pdf
        │       └── datos.sql
        ├── Evaluaciones/
        │   └── TA1/
        │       └── enunciado.pdf
        └── Contenidos/
            └── T01 - Introducción/   ← el tema, tal como se llama en el curso
                ├── silabo.pdf
                └── Semana 3/         ← y debajo, las carpetas de Drive
                    └── lectura.pdf
```

### Sobre Drive

Los contenidos T01–T15 y los sílabos son enlaces a carpetas de Google Drive, y
son lo que motivó el proyecto. La extensión los baja **con tu sesión de
Google**, la que ya tienes abierta en el navegador: no hay que crear ninguna
credencial ni pasar por la consola de Google Cloud.

A cambio, esa vía es frágil: la extensión lee la página que Drive usa para
incrustar carpetas, y Google puede cambiarla sin avisar. Si eso pasa, **te lo
dice** —no te enseña una carpeta vacía— y habrá que actualizar la extensión.
Cuando una carpeta no se puede leer, aparece en la lista con el motivo, para
que puedas ir a buscarla a mano mientras todavía tienes acceso.

Con los archivos grandes Drive muestra un aviso de que no ha podido analizarlos
en busca de virus. La extensión lo confirma sola, igual que harías tú pulsando
el botón.

### Qué no hace, y por qué

- **No baja las clases grabadas de Zoom.** Dos en todo un ciclo, y muy frágil.
- **No escribe nada en la plataforma.** No entrega tareas, no marca completado,
  no responde en foros. Solo lee.
- **No automatiza el inicio de sesión.** Hay captcha y verificación en dos
  pasos: entras tú, una vez.

---

## Instalar

Todavía no está en las tiendas. Se carga sin empaquetar:

```
git clone https://github.com/elis333333/IsilHelper && cd IsilHelper
pnpm install
pnpm build
```

Luego, en Brave o Chrome: `chrome://extensions` → activa el **modo
desarrollador** → *Cargar sin empaquetar* → elige la carpeta `dist/`.

> Google Chrome de marca ignora `--load-extension` desde la línea de órdenes.
> Para probar sin empaquetar usa **Brave**, o cárgala a mano desde
> `chrome://extensions`.

## Usar

1. Entra a `platform.ecala.net` y termina de iniciar sesión como siempre.
2. Pulsa el icono de IsilHelper y luego **Conectar**.
3. Entra a un curso y pulsa **Descargar todo el curso**.
4. Para los temas y el sílabo, pulsa **Ver qué hay en Drive** y luego
   **Descargar**. Necesitas tener tu sesión de Google abierta en el mismo
   navegador.

La conexión con la plataforma se hace una sola vez, y después funciona aunque
cierres la sesión allí. La de Google es la que ya usas para abrir el material.

> **Si te pregunta dónde guardar cada archivo**, desactiva *Preguntar dónde
> guardar cada archivo antes de descargar* en `brave://settings/downloads` (o
> `chrome://settings/downloads`). Es una preferencia del navegador: la
> extensión ya pide no preguntar, porque calcula ella la carpeta de destino.

---

## Tu información

**No hay servidor.** Ni base de datos, ni servicio intermedio, ni estadísticas
de uso. Todo ocurre dentro de tu navegador, y las únicas peticiones que salen
van a **la plataforma del instituto y a Google Drive**, que son los dos sitios
donde está tu material. A ningún otro sitio, y menos a uno mío. El código está
abierto para que cualquiera lo verifique.

- **No se te pide usuario ni contraseña, nunca.** Ni de ISIL ni de Google.
  IsilHelper reutiliza las sesiones que tu navegador ya tiene abiertas.
  Cualquier extensión o página que te pida esas credenciales no es esta.
- **Tampoco se te pide crear credenciales de Google.** Nada de consolas ni de
  claves: si alguna guía te manda hacer eso para bajar de Drive, no es esta.
- **La credencial de acceso no se muestra ni se registra**, ni en pantalla, ni
  en los mensajes de error, ni en el historial de descargas del navegador.
- **Los archivos son tuyos y se quedan en tu disco**, en carpetas normales que
  puedes abrir con cualquier programa.

Puedes revocar el acceso cuando quieras desde
`platform.ecala.net/user/managetoken.php`.

La versión formal de todo esto, que es la que enlazan las tiendas, está en
[PRIVACY.md](PRIVACY.md).

---

## Apoyar el proyecto

**Si te ahorró la tarde, invítame un café.**

<img src="public/apoyo/yape.png" alt="Código QR de Yape para enviar un aporte" width="180">

Escanea el código con Yape. Es un aporte voluntario a quien mantiene esto, no un
pago por usarlo: IsilHelper es gratis y no deja de serlo si no lo haces.

Si prefieres ayudar sin poner dinero, también sirve: abre un incidente contando
qué se rompió, o pásaselo a alguien de tu ciclo.

---

## Aviso legal

Proyecto estudiantil sin relación con ISIL ni con sus proveedores. Usa los web
services públicos de Moodle con tu propia cuenta y solo para leer. Si el
instituto desactiva ese servicio, la extensión dejará de funcionar y te lo
dirá con claridad: aquí no se promete permanencia.

El detalle —falta de afiliación, uso del nombre, responsabilidad del estudiante
y ausencia de garantías— está en [LEGAL.md](LEGAL.md).

---

## Desarrollo

```bash
pnpm dev        # build en watch; se carga sin empaquetar desde dist/
pnpm build      # producción
pnpm typecheck
pnpm lint
pnpm test
```

El contexto del proyecto vive en `context/`: `project.md` (qué se construye y
en qué orden), `domain.md` (todo lo averiguado sobre la plataforma),
`session.md` (dónde se quedó el trabajo) y `tienda.md` (los textos y las
capturas de la ficha de tienda). Las convenciones, en `CONVENTIONS.md`.

---

IsilHelper · un proyecto de Suki
