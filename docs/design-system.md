# BaseAgent OS — Design System

## Design Philosophy

BaseAgent OS follows a premium fintech design language inspired by Stripe, Coinbase, Linear, and Mercury. The system prioritizes clarity, information density, and professional aesthetics.

## Design Tokens

### Colors

#### Brand
| Token | Light | Dark |
|-------|-------|------|
| `--color-brand` | #0052FF (Base Blue) | #3B82F6 |
| `--color-brand-hover` | #0045D9 | #2563EB |
| `--color-brand-muted` | #EFF6FF | #1E3A5F |

#### Semantic
| Token | Light | Dark |
|-------|-------|------|
| `--color-success` | #10B981 | #34D399 |
| `--color-warning` | #F59E0B | #FBBF24 |
| `--color-error` | #EF4444 | #F87171 |
| `--color-info` | #3B82F6 | #60A5FA |

#### Neutrals (Slate scale)
- `--color-bg`: White / #0F172A
- `--color-surface`: #F8FAFC / #1E293B
- `--color-surface-hover`: #F1F5F9 / #334155
- `--color-border`: #E2E8F0 / #334155
- `--color-text`: #0F172A / #F8FAFC
- `--color-text-secondary`: #64748B / #94A3B8
- `--color-text-muted`: #94A3B8 / #64748B

### Typography

| Token | Value |
|-------|-------|
| Font Family | Inter, system-ui, sans-serif |
| Font Mono | JetBrains Mono, monospace |
| Size XS | 0.75rem (12px) |
| Size SM | 0.875rem (14px) |
| Size Base | 1rem (16px) |
| Size LG | 1.125rem (18px) |
| Size XL | 1.25rem (20px) |
| Size 2XL | 1.5rem (24px) |
| Size 3XL | 1.875rem (30px) |
| Size 4XL | 2.25rem (36px) |

### Spacing

4px base unit: 0, 1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px), 12 (48px), 16 (64px)

### Shadows

| Token | Value |
|-------|-------|
| Shadow SM | 0 1px 2px rgba(0,0,0,0.05) |
| Shadow MD | 0 4px 6px rgba(0,0,0,0.07) |
| Shadow LG | 0 10px 15px rgba(0,0,0,0.1) |
| Shadow XL | 0 20px 25px rgba(0,0,0,0.15) |

### Border Radius

| Token | Value |
|-------|-------|
| Radius SM | 4px |
| Radius MD | 8px |
| Radius LG | 12px |
| Radius XL | 16px |
| Radius Full | 9999px |

## Components

### Button
Variants: primary, secondary, outline, ghost, destructive
Sizes: sm (32px), md (40px), lg (48px)
States: default, hover, active, disabled, loading

### Card
Standard card with optional header, body, footer.
Glassmorphism variant: backdrop-blur-lg, semi-transparent background.

### Badge / StatusBadge
Color-coded status indicators.
Mission status mapping: planning (blue), queued (slate), running (amber), completed (green), failed (red).

### Table
Sortable columns, hover rows, empty state.

### Dialog
Radix UI Dialog with overlay, title, description, close button.

### Input
Label, helper text, error state, icon prefix/suffix.

### Select
Radix UI Select with search, groups, icons.

### Timeline
Vertical timeline for mission steps. Color-coded step status.

### WalletCard
Displays wallet address (truncated), type badge, balances, copy button.

### ActivityFeed
Chronological list of recent actions with relative timestamps.

## Layout

### Grid System
12-column responsive grid using Tailwind CSS.

### Breakpoints
| Name | Width |
|------|-------|
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |
| 2xl | 1536px |

### Sidebar
Fixed left sidebar (256px), collapsible to icon-only (64px).

### Header
Fixed top header (64px) with breadcrumbs, command palette trigger, notifications.

## Theme

Light and dark themes via CSS custom properties.
Toggle via `next-themes` ThemeProvider.
System preference detection supported.

## Animations

- Page transitions: fade + slide (framer-motion)
- Hover effects: subtle scale and shadow changes
- Loading: skeleton pulse animation
- Toast notifications: slide in from top-right
- Status changes: color transition (200ms ease)
