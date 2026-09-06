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
        └── Evaluaciones/
            └── TA1/
                └── enunciado.pdf
```

### Qué no hace, y por qué

- **No baja el material de Google Drive todavía.** Los contenidos T01–T15 y los
  sílabos son enlaces a Drive, y bajarlos necesita permisos de Google que
  todavía se están evaluando. Mientras tanto, el índice del curso te deja la
  lista de enlaces a mano.
- **No baja las clases grabadas de Zoom.** Dos en todo un ciclo, y muy frágil.
- **No escribe nada en la plataforma.** No entrega tareas, no marca completado,
  no responde en foros. Solo lee.
- **No automatiza el inicio de sesión.** Hay captcha y verificación en dos
  pasos: entras tú, una vez.

---

## Instalar

Todavía no está en las tiendas. Se carga sin empaquetar:

```
git clone <este repositorio> && cd IsilHelper
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

La conexión se hace una sola vez. Después funciona aunque cierres la sesión en
la plataforma.

---

## Tu información

**No hay servidor.** Ni base de datos, ni servicio intermedio, ni estadísticas
de uso. Todo ocurre dentro de tu navegador, y las únicas peticiones que salen
van a `platform.ecala.net`. El código está abierto para que cualquiera lo
verifique.

- **No se te pide usuario ni contraseña, nunca.** IsilHelper reutiliza la
  sesión que tu navegador ya tiene con la plataforma. Cualquier extensión o
  página que te pida tus credenciales de ISIL no es esta.
- **La credencial de acceso no se muestra ni se registra**, ni en pantalla, ni
  en los mensajes de error, ni en el historial de descargas del navegador.
- **Los archivos son tuyos y se quedan en tu disco**, en carpetas normales que
  puedes abrir con cualquier programa.

Puedes revocar el acceso cuando quieras desde
`platform.ecala.net/user/managetoken.php`.

---

## Aviso

Proyecto estudiantil sin relación con ISIL ni con sus proveedores. Usa los web
services públicos de Moodle con tu propia cuenta y solo para leer. Si el
instituto desactiva ese servicio, la extensión dejará de funcionar y te lo
dirá con claridad: aquí no se promete permanencia.

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
en qué orden), `domain.md` (todo lo averiguado sobre la plataforma) y
`session.md` (dónde se quedó el trabajo). Las convenciones, en
`CONVENTIONS.md`.

---

IsilHelper · un proyecto de Suki
