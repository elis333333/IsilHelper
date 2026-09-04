# IsilHelper

Extensión de navegador que le devuelve a los estudiantes de ISIL el control
sobre su información académica. Producto de **Suki**.

Lee la API oficial de web services de Moodle (`platform.ecala.net`) y construye
encima una interfaz que sirve. No hay backend: todo corre en el navegador del
estudiante.

---

## Contexto

@context/project.md
@context/domain.md
@context/user.md
@context/session.md
@CONVENTIONS.md

El branding sale de las skills de **Suki**, en `.claude/skills/`:

- `suki-brand-tokens` — colores, tipografía, espaciado, radios. **Siempre.**
- `suki-product-ui` — componentes, accesibilidad, identidad de producto.
- `suki-voice` — textos de la UI, mensajes de error y estados vacíos.

Consúltalas antes de escribir CSS, elegir un color o un espaciado, o crear
cualquier componente. No inventes valores de diseño.

---

## Reglas que no se rompen

1. **Cero servidor.** No se añade backend, ni proxy, ni base de datos, ni
   telemetría. Si una solución los requiere, es la solución equivocada.
2. **Cero credenciales pedidas.** Nunca un formulario de usuario/contraseña de
   ISIL. El token sale de la sesión que el navegador ya tiene.
3. **Solo lectura.** No se escribe en la plataforma: no se entregan tareas, no
   se marca completado, no se responde en foros.
4. **El token no se muestra ni se registra.** Ni en la UI, ni en `console.log`,
   ni en mensajes de error.
5. **Nunca automatizar el login.** Hay captcha y TOTP; el flujo lo hace el
   estudiante a mano, una sola vez.
6. **Toda petición a `platform.ecala.net` lleva cabeceras de navegador reales.**
   Sin eso el WAF responde `418`. Ver `context/domain.md`.

---

## Cómo trabajar en este repo

- Antes de tocar código de red, lee `context/domain.md`. Contiene detalles de la
  API que costaron horas de ingeniería inversa y que no son evidentes.
- Antes de crear UI, consulta la skill de Suki.
- Al cerrar una tanda de trabajo, actualiza `context/session.md`.
- Fase actual y siguiente paso: `context/session.md`.

## Comandos

```bash
pnpm dev        # build en watch, cargar sin empaquetar desde dist/
pnpm build      # producción
pnpm typecheck
pnpm lint
pnpm test
```

Para cargar la extensión: `chrome://extensions` → modo desarrollador → *Cargar
sin empaquetar* → `dist/`.
