# Usuario

**Elis** — estudiante de ISIL (Lima, Perú) y programador. Autor y usuario cero
de este proyecto.

## Entorno

| | |
|---|---|
| SO | Arch Linux |
| Shell | zsh |
| Paquetes | `pacman` para lo que esté en repos; venv o `pipx` para Python. **No usar `pip` suelto**: no existe en el sistema y no debe usarse contra el Python del sistema |
| Navegador | Brave (Chromium) |
| Proyecto | `~/Projects/IsilHelper` |
| Idioma | Español |

## Marca

**Suki** es su empresa (aún no registrada). Todos sus productos y aplicaciones
llevan ese branding. IsilHelper es el primer producto público de Suki, así que
funciona como carta de presentación: la UI debe verse como un producto de Suki,
no como una extensión genérica.

El sistema de diseño está en la skill de Suki. **Consultarla siempre** antes de
escribir CSS, elegir colores, espaciados o radios, o crear componentes visuales.
No inventar valores de diseño.

## Cómo trabajar con él

- **Explicar el porqué, no solo el qué.** Entiende bien la técnica y agradece
  saber la razón detrás de una decisión.
- **Diagnóstico antes que parche.** Cuando algo falla, prefiere un comando que
  aísle la causa antes de una solución a ciegas.
- **Directo.** Ir al grano; no hace falta suavizar los errores.
- **Un paso a la vez.** Probar con `--limit` antes de correr sobre 166 elementos.
- **Comandos de una sola línea.** Los bloques multilínea con `\` se le rompen al
  pegarlos en la terminal. Preferir scripts a comandos largos pegados.
- Tiene `setopt interactive_comments` activado; los `#` en comandos ya funcionan.

## Motivación

El problema es real y compartido: todos los estudiantes de ISIL lo tienen. La
app oficial (ISIL+) tiene una UX que él describe sin rodeos como mala, con la
información repartida entre tres plataformas de forma poco coherente.

El objetivo original era archivar su material antes del cierre del ciclo. Eso ya
está resuelto. Ahora el objetivo es que el resto de estudiantes tenga una
herramienta decente.

## Seguridad

Durante el desarrollo pegó tokens y credenciales en chats y capturas varias
veces, y las revocó cuando se le señaló. **Al escribir código o documentación,
no incluir tokens, cookies ni secretos reales en ejemplos, logs o mensajes de
error.** Usar siempre marcadores.
