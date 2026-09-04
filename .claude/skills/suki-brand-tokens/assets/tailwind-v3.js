/* =========================================================
   SUKI — Tailwind v3 · theme.extend de tailwind.config.js
   Solo para piezas propias de Suki. El software entregado a
   clientes usa los colores del cliente (skill suki-client-ui).
   ========================================================= */

module.exports = {
  theme: {
    extend: {
      colors: {
        // marca · verbo · familia
        action:    '#06D6A0', // Construir   · familia C · botones, enlaces, activos
        adapt:     '#8338EC', // Adaptar     · familia A
        integrate: '#FFBE0B', // Integrar    · familia B
        scale:     '#FF006E', // Escalar     · familia D
        evolve:    '#3A86FF', // Evolucionar · familia E
        // neutros
        base:        '#0D0D0D',
        surface1:    '#141414',
        surface:     '#1A1A1A',
        elevated:    '#242424',
        borderStrong:'#333333',
        line:        '#4D4D4D', // borde sutil; 'border' colisiona con la utilidad
        disabled:    '#737373', // 4,1:1 — no apto para texto
        subtle:      '#999999',
        muted:       '#B3B3B3',
        ink:         '#CCCCCC', // texto principal · gris del logotipo
        heading:     '#E6E6E6',
        light:       '#F5F5F5',
        // funcionales · solo interfaces
        error:      '#FF3B30',
        errorLight: '#C62828',
      },
      fontFamily: {
        brand: ['Montserrat', 'Arial', 'sans-serif'],
        body:  ['Inter', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Consolas', 'Courier New', 'monospace'],
      },
      fontSize: {
        display: ['3rem',      { lineHeight: '3.5rem',   letterSpacing: '-0.02em', fontWeight: '600' }],
        h1:      ['2.25rem',   { lineHeight: '2.75rem',  letterSpacing: '-0.01em', fontWeight: '700' }],
        h2:      ['1.875rem',  { lineHeight: '2.375rem', letterSpacing: '-0.01em', fontWeight: '600' }],
        h3:      ['1.5rem',    { lineHeight: '2rem',     fontWeight: '600' }],
        h4:      ['1.25rem',   { lineHeight: '1.75rem',  fontWeight: '600' }],
        bodyLg:  ['1.125rem',  { lineHeight: '1.875rem' }],
        body:    ['1rem',      { lineHeight: '1.625rem' }],
        bodySm:  ['0.875rem',  { lineHeight: '1.375rem' }],
        caption: ['0.75rem',   { lineHeight: '1.125rem' }],
        label:   ['0.75rem',   { lineHeight: '1rem', letterSpacing: '0.06em', fontWeight: '600' }],
        monoSm:  ['0.875rem',  { lineHeight: '1.375rem' }],
      },
      fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' }, // nunca 800 ni 900
      spacing: {
        1: '4px', 2: '8px', 3: '12px', 4: '16px', 6: '24px', 8: '32px',
        12: '48px', 16: '64px', 24: '96px', 32: '128px',
      },
      maxWidth: { content: '1200px', container: '1280px', measure: '65ch' },
      borderRadius: { DEFAULT: '0', none: '0', box: '8%' }, // radio 0 · box solo para la cajita
      borderWidth: { DEFAULT: '1px', zone: '4px' },
      boxShadow: { none: 'none' }, // sin sombras en todo el sistema
      transitionDuration: { fast: '150ms', base: '250ms', max: '400ms' },
      transitionTimingFunction: { suki: 'cubic-bezier(0.2, 0, 0, 1)' },
      gridTemplateColumns: { desktop: 'repeat(12, minmax(0, 1fr))', tablet: 'repeat(8, minmax(0, 1fr))', mobile: 'repeat(4, minmax(0, 1fr))' },
    },
  },
};

/* Reglas que las utilidades no imponen solas:
   - Sobre bg-action y bg-integrate el texto es text-base (#0D0D0D). Nunca text-white.
   - text-adapt no se usa sobre fondo oscuro: 3,5:1.
   - Prohibidos shadow-*, bg-gradient-*, backdrop-blur-*.
   - Un solo color de acento por composición.
   - Espaciados solo de la escala. Nada de p-[30px]. */
