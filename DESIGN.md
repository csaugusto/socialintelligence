# DESIGN.md — Sistema de Diseño
## Creator Co-Pilot

> Este documento es la fuente de verdad visual del producto.
> Todo componente, pantalla o flujo nuevo debe seguir estas reglas antes de ser implementado.
> Si algo no está aquí, se define aquí antes de codear.

---

## 1. Personalidad visual

**Oscuro, cósmico, inteligente. No técnico.**

Sensación: estás usando algo que sabe más que tú, pero te habla en tu idioma.
Referentes: Linear + Notion + herramienta de IA premium.
Anti-referentes: dashboard de analítica corporativa, SaaS genérico azul/blanco.

---

## 2. Paleta de colores

### Fondos
| Token | Hex | Uso |
|-------|-----|-----|
| `bg-base` | `#0B0A1A` | Fondo principal de toda la app |
| `bg-surface` | `#13112A` | Sidebar, panels secundarios |
| `bg-card` | `#1A1836` | Cards, modales, inputs |
| `bg-card-hover` | `#211E42` | Hover state de cards |
| `bg-selected` | `#2D2860` | Card seleccionada en wizard/multiselect |

### Texto
| Token | Hex | Uso |
|-------|-----|-----|
| `text-primary` | `#FFFFFF` | Títulos, datos importantes |
| `text-secondary` | `#A09EC0` | Subtítulos, descripciones |
| `text-muted` | `#5C5A7A` | Labels, hints, metadata |
| `text-disabled` | `#3A3858` | Elementos inactivos |

### Acentos
| Token | Hex | Uso |
|-------|-----|-----|
| `accent-purple` | `#7C3AED` | CTA primarios, elementos activos |
| `accent-purple-light` | `#A855F7` | Hover de acentos, badges |
| `accent-pink` | `#EC4899` | Urgente, destacado, score alto |
| `accent-blue` | `#3B82F6` | Info, enlaces, secundario |
| `accent-cyan` | `#06B6D4` | Tendencias, señales |

### Gradientes
```css
/* Botón primario */
background: linear-gradient(90deg, #5B21B6 0%, #7C3AED 50%, #A855F7 100%);

/* Card seleccionada / activa */
background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(168,85,247,0.1));
border: 1px solid rgba(124,58,237,0.5);

/* Score circle */
background: conic-gradient(from 0deg, #7C3AED, #EC4899, #7C3AED);

/* Fondo cósmico sutil (onboarding) */
background: radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(236,72,153,0.10) 0%, transparent 50%),
            #0B0A1A;
```

### Estados y semántica
| Token | Hex | Uso |
|-------|-----|-----|
| `success` | `#10B981` | Métricas positivas, ✓ completado |
| `warning` | `#F59E0B` | Alertas suaves, pendiente |
| `danger` | `#EF4444` | Errores, eliminar |
| `info` | `#3B82F6` | Información neutral |

### Bordes
```css
border-subtle:  1px solid rgba(255,255,255,0.06);   /* separadores */
border-card:    1px solid rgba(255,255,255,0.10);   /* cards en reposo */
border-active:  1px solid rgba(124,58,237,0.60);   /* cards seleccionadas */
border-focus:   1px solid #7C3AED;                  /* inputs con focus */
```

---

## 3. Tipografía

### Fuentes
| Fuente | Uso | Variable CSS |
|--------|-----|-------------|
| **Oxanium** | UI completa: navegación, botones, títulos, labels, inputs | `--font-oxanium` |
| **Geist Sans** | Texto de contenido largo: párrafos, descripciones, artículos | `--font-geist-sans` |
| **Geist Mono** | Código, valores técnicos, IDs | `--font-geist-mono` |

> Oxanium es la fuente principal del producto. Da personalidad cósmica/tech sin sacrificar legibilidad en tamaños de UI. Geist se reserva para bloques de texto largo donde la lectura continua importa.

### Implementación en CSS
```css
html  { font-size: 17px; font-family: var(--font-oxanium), sans-serif; }
body  { font-family: var(--font-oxanium), sans-serif; }
p, li, blockquote { font-family: var(--font-geist-sans), sans-serif; }
h1, h2, h3 { font-family: var(--font-oxanium), sans-serif; }
.font-display { font-family: var(--font-oxanium); }
.font-body    { font-family: var(--font-geist-sans); }
```

> `font-size: 17px` en `html` escala todos los valores `rem` de Tailwind ~6% arriba de forma uniforme.

### Escala
| Nombre | Tamaño | Peso | Uso |
|--------|--------|------|-----|
| `display` | 28–32px | 700 | Títulos de pantalla (onboarding h1) |
| `title` | 20px | 600 | Títulos de sección, headers de pantalla |
| `heading` | 16px | 600 | Subtítulos de card, nombres |
| `body` | 14–15px | 400–500 | Contenido UI general (Oxanium) |
| `small` | 12px | 400 | Labels, metadata, hints (Geist) |
| `micro` | 11px | 500 | Badges, tags, uppercase labels |

### Reglas
- Los labels de sección: `micro` + `uppercase` + `tracking-wider` + `text-muted`
- Los números grandes (scores, KPIs): `display` o mayor, peso 700, Oxanium
- Botones CTA siempre en Oxanium weight 600, letter-spacing 0.03em
- Nunca mezclar más de 3 tamaños en la misma card

---

## 4. Espaciado y radios

### Espaciado (base 4px)
```
xs:  4px   — gap entre elementos inline
sm:  8px   — padding interno de badges/tags
md:  12px  — padding interno de cards pequeñas
lg:  16px  — padding estándar de cards
xl:  24px  — padding de secciones, gaps entre cards
2xl: 32px  — separación entre módulos
3xl: 48px  — padding de pantallas
```

### Border radius
```
sm:   6px  — badges, tags, inputs pequeños
md:   10px — botones, inputs
lg:   14px — cards estándar
xl:   18px — cards grandes, modales
full: 9999px — pills, avatars
```

---

## 5. Componentes base

### Card seleccionable (wizard / multi-select)
```
Estado reposo:
  bg: bg-card
  border: border-card
  text: text-secondary

Estado hover:
  bg: bg-card-hover
  border: rgba(124,58,237,0.3)
  cursor: pointer

Estado selected:
  bg: bg-selected + gradiente sutil
  border: border-active
  text: text-primary
  → checkmark o ícono activo visible
  → glow sutil: box-shadow: 0 0 20px rgba(124,58,237,0.2)

Transición: all 150ms ease
```

### Botón primario (clase `.btn-primary`)
```
background: #7C3AED  (sólido, sin gradiente)
hover:  #6D28D9 + translateY(-1px)
active: #5B21B6 + translateY(0)
text: white, Oxanium 600, 15px, letter-spacing 0.03em
padding: 14–16px vertical / 20–28px horizontal
border-radius: xl (14px) o 2xl (18px)
disabled: opacity-35, cursor-not-allowed
```

### Botón secundario
```
background: transparent
border: border-card
text: text-secondary
hover: bg-card-hover, text-primary
```

### Botón ghost / link
```
background: transparent, no border
text: accent-purple-light
hover: text-primary
```

### Input / Select
```
bg: bg-card
border: border-card
text: text-primary
placeholder: text-muted
focus: border-focus + ring sutil rgba(124,58,237,0.2)
border-radius: md
padding: 10px 12px
```

### Badge / Tag
```
Variantes por color:
  purple: bg rgba(124,58,237,0.2) + text accent-purple-light + border rgba(124,58,237,0.3)
  pink:   bg rgba(236,72,153,0.2) + text #F472B6
  cyan:   bg rgba(6,182,212,0.2)  + text #22D3EE
  green:  bg rgba(16,185,129,0.2) + text #34D399
  gray:   bg rgba(255,255,255,0.06) + text text-secondary

Tamaño: micro (11px), uppercase, font-medium
padding: 3px 8px, border-radius: full
```

### Score circle
```
Círculo SVG con stroke-dasharray animado
Interior: número grande (24-32px, bold) + "%" o valor
Color del stroke: gradiente purple → pink según score
Tamaño estándar: 56px (card) / 80px (detalle de brief)
```

### Progress bar (wizard)
```
Track: bg-card, border-radius: full, height: 4px
Fill: gradiente accent-purple → accent-purple-light
Transición: width 300ms ease
```

### Sidebar
```
Ancho: 220px fijo
bg: bg-surface
border-right: border-subtle

Item inactivo:
  icon + label, text-muted, padding 10px 16px
  hover: text-secondary, bg sutil

Item activo:
  text-primary, font-medium
  left border: 2px solid accent-purple
  bg: rgba(124,58,237,0.08)

Secciones separadas por border-subtle
Logo/nombre producto: top, padding 20px 16px
```

### KPI Card (pantalla Inicio)
```
bg: bg-card
border: border-card
border-radius: lg
padding: lg (16px)
Número: title o display, text-primary
Label: small, text-muted
Variación: small + color según positivo/negativo
Ancho mínimo: 140px
```

---

## 6. Layout del producto

### Shell principal (post-onboarding)
```
┌─────────────────────────────────────────────────────┐
│ Sidebar (220px fijo)  │  Header (48px)              │
│                       ├─────────────────────────────│
│  Logo                 │                             │
│  ─────────────        │   Contenido principal       │
│  nav items            │   (scroll vertical)         │
│                       │                             │
│  ─────────────        │                             │
│  nav secundario       │                             │
│  (ajustes, ayuda)     │                             │
└───────────────────────┴─────────────────────────────┘
```

### Header
```
height: 48px
bg: bg-base con border-bottom: border-subtle
Derecha: selector de proyecto + notificaciones + avatar
Posición: sticky top
```

### Wizard (onboarding)
```
Fondo: gradiente cósmico (bg-base + radial purples)
Centro: card blanca oscura centrada, max-width: 720px
Top: progress steps numerados (1-9)
Bottom: botones Continuar / Anterior + "Omitir configuración inicial"
```

### Panel de detalle (Brief, Content Studio)
```
Layout 2 columnas:
  Left (60%): contenido principal, editor
  Right (40%): panel de acciones, recomendaciones, metadata
  Separados por border-subtle
```

---

## 7. Animaciones y transiciones

```
Hover de card:     150ms ease
Selección:         150ms ease + box-shadow aparecer
Cambio de paso:    slide horizontal 250ms ease (wizard)
Fade in pantalla:  200ms ease-in opacity 0→1
Score circle:      stroke-dashoffset 600ms ease-out al montar
Loading skeleton:  pulse 1.5s ease-in-out infinite
```

---

## 8. Íconos

**Librería:** Phosphor Icons (`@phosphor-icons/react` v2.1+)
**Tamaño estándar:** 16px en sidebar/inline, 20px en cards, 24px en pantallas grandes
**Color:** heredado del texto del contenedor (currentColor)
**Stroke width:** 1.5 (default de Lucide)

---

## 9. Patrones de UX

### Selección múltiple
- Cards en grid (2-4 columnas según pantalla)
- Click para toggle — sin checkboxes explícitos
- Checkmark sutil en esquina superior derecha cuando está seleccionado
- Máximo visible en descripción debajo del grid

### Feedback inmediato
- Toda acción tiene respuesta visual en < 150ms
- Botones muestran spinner mientras cargan (no deshabilitar sin feedback)
- Errores inline debajo del campo, nunca en alert/toast molesto

### Lenguaje
- Sin tecnicismos de marketing (no TOFU, BOFU, funnel, KPI en UI visible)
- Español, tono cercano pero profesional
- Preguntas directas: "¿Qué quieres lograr?" no "Selecciona tus objetivos de conversión"

---

## 10. Lo que NO hacemos

- No usar azul corporativo (#3B82F6 solo como acento secundario, nunca como color base)
- No bordes blancos sólidos — siempre con opacidad
- No sombras negras duras — solo glows de color o sombras muy suaves
- No tablas de datos frías — preferir cards con contexto visual
- No modales para flujos de más de 2 pasos — usar páginas completas
- No usar más de 2 fuentes — Oxanium (UI) + Geist Sans (contenido largo)
- No gradientes de texto excepto en logos o elementos muy específicos
- No usar Geist en botones, nav o elementos de UI principal — siempre Oxanium
