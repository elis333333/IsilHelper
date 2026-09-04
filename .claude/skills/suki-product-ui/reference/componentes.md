# Patrones de componente

Todos los valores salen de `suki-brand-tokens`. Los ejemplos usan Tailwind con los nombres de token de `tailwind-v3.js`; en v4 son las mismas utilidades sobre el bloque `@theme`.

## Botones

```tsx
// Principal — texto SIEMPRE oscuro sobre verde (1,9:1 con blanco)
<button className="h-12 px-8 bg-action text-base font-semibold rounded-none
                   transition-colors duration-fast ease-suki
                   hover:bg-base hover:text-action hover:ring-2 hover:ring-action
                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-action
                   focus-visible:outline-offset-2 disabled:bg-disabled disabled:text-base">
  Guardar cambios
</button>

// Secundario
<button className="h-10 px-6 bg-transparent text-ink border border-line rounded-none
                   hover:bg-elevated focus-visible:outline focus-visible:outline-2
                   focus-visible:outline-action focus-visible:outline-offset-2">
  Cancelar
</button>

// Destructivo — relleno solo en la confirmación final
<button className="h-10 px-6 border border-error text-error rounded-none hover:bg-error hover:text-base">
  Eliminar proyecto
</button>
```

Toda acción destructiva pide confirmación y el diálogo escribe **el nombre de lo que se borra**. «¿Eliminar el proyecto Distribuidora Andina?» funciona; «¿Estás seguro?» no.

## Campos

La etiqueta va **siempre visible encima**. Un placeholder que desaparece al escribir deja al usuario sin saber qué campo está llenando, y desaparece también para los lectores de pantalla.

```tsx
<div className="flex flex-col gap-2">
  <label htmlFor="nombre" className="text-bodySm font-medium text-ink">
    Nombre del proyecto
  </label>
  <input
    id="nombre"
    className="h-10 px-4 bg-surface text-ink border border-line rounded-none
               placeholder:text-disabled
               focus:border-action focus:ring-1 focus:ring-action focus:outline-none
               aria-[invalid=true]:border-error"
    aria-invalid={hayError}
    aria-describedby={hayError ? "nombre-error" : undefined}
  />
  {hayError && (
    <p id="nombre-error" className="flex items-center gap-2 text-bodySm text-error">
      <AlertCircle size={16} aria-hidden="true" />
      Escribe un nombre para el proyecto
    </p>
  )}
</div>
```

El mensaje de error dice **qué corregir**, no que algo falló. Lleva ícono y texto, no solo el borde rojo.

Separación entre campos 24, entre grupos de campos 32.

## Tabla

```tsx
<table className="w-full border-collapse">
  <thead>
    <tr>
      <th className="text-left font-mono text-bodySm uppercase tracking-[0.08em] text-subtle
                     py-3 border-b border-line">Proyecto</th>
      <th className="text-right font-mono text-bodySm uppercase tracking-[0.08em] text-subtle
                     py-3 border-b border-line tabular-nums">Inversión</th>
    </tr>
  </thead>
  <tbody>
    <tr className="h-12 border-b border-line hover:bg-elevated">
      <td className="py-3 text-ink">Distribuidora Andina</td>
      <td className="py-3 text-right tabular-nums text-ink">S/ 10,500</td>
    </tr>
  </tbody>
</table>
```

- Encabezado en JetBrains Mono mayúsculas, tracking +8 %.
- Filas de 48 px, separadas por borde inferior de 1 px. **Sin relleno alternado.**
- Cifras a la derecha con `tabular-nums` para que las columnas se alineen.
- Si la tabla no cabe, se quitan columnas o se paginan filas. No se aprieta el interlineado.

## Navegación lateral

```tsx
<nav className="w-64 bg-surface1 border-r border-line p-6">
  <a href="/proyectos"
     aria-current={activo ? "page" : undefined}
     className="flex items-center gap-3 h-10 px-4 text-muted
                aria-[current=page]:text-heading
                aria-[current=page]:border-l-[3px] aria-[current=page]:border-action
                hover:bg-elevated">
    <Boxes size={20} aria-hidden="true" />
    Proyectos
  </a>
</nav>
```

El elemento activo cambia **el color del texto y la barra de la izquierda**. La barra sola sería color como único portador.

## Modal

```tsx
<div className="fixed inset-0 bg-base/70" onClick={cerrar} aria-hidden="true" />
<div role="dialog" aria-modal="true" aria-labelledby="titulo-modal"
     className="fixed inset-0 m-auto h-fit max-w-[560px] bg-elevated border border-line
                rounded-none p-8">
  <h2 id="titulo-modal" className="text-h3 font-semibold text-heading">Eliminar proyecto</h2>
  ...
</div>
```

Velo `#0D0D0D` al 70 %, **sin desenfoque**. Cierra con Escape, atrapa el foco mientras está abierto y lo devuelve al elemento que lo abrió al cerrarse.

## Estados de la pantalla

| Estado | Qué se muestra |
|---|---|
| **Cargando** | Texto que dice qué está pasando: «Cargando tus proyectos». Un giro sin texto no informa |
| **Vacío por primera vez** | Qué es esta pantalla, qué aparecerá aquí y un botón para crear el primero |
| **Vacío por filtro** | Qué filtro está aplicado y cómo quitarlo. Nunca el mismo mensaje que el vacío inicial |
| **Error de carga** | Qué falló, si se puede reintentar, y el botón para hacerlo |
| **Parcial** | Lo que sí cargó se muestra; lo que falló se marca en su sitio, no se oculta la pantalla entera |

Los estados vacíos no llevan ilustración. Una composición tipográfica sobre `#0D0D0D` es mejor que un dibujo de relleno.

## Notificaciones

Aparecen abajo a la derecha, superficie `#242424`, borde de 1 px, radio 0. Llevan ícono, texto y —si la acción es reversible— un botón para deshacer.

Duración mínima 5 segundos; las de error no se cierran solas. Nunca comunican el resultado solo con el color del borde.

## Gráficos

Un solo acento por gráfico. Las series se distinguen por **forma, patrón o etiqueta directa** además de por color. Ejes y cuadrícula en `#4D4D4D`, etiquetas en `#999999`, cifras en JetBrains Mono con `tabular-nums`. Sin degradados de relleno, sin sombras, sin 3D.
