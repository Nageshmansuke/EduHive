# EduHive Design System

## Direction
Cool ink atelier. One honey accent. Tight type hierarchy. Borders over cards. Motion for feedback only.

## Color
- Background: cool mist slate (not cream, not purple)
- Foreground: deep ink charcoal
- Primary / accent: honey amber (hive)
- Secondary: teal (live / success signals)
- Surfaces: white / elevated ink panels with hairline borders
- Dark: near-black ink with muted honey

## Type
- Display / headings: Bricolage Grotesque
- Body / UI: IBM Plex Sans
- Scale: page title 1.75–2rem, section 1.25rem, body 0.9375rem, meta 0.75rem
- Weights: 500–700; reserve 800 for brand wordmark only

## Shape
- Radius base: 10px (`--radius: 0.625rem`)
- Buttons: 10px (not pills)
- Inputs: 10px
- Panels: 12px max

## Elevation
- Prefer `border` + spacing over shadows
- Soft tinted shadow only for floating overlays (dialogs, sticky headers)

## Motion (Emil)
- Ease-out: `cubic-bezier(0.23, 1, 0.32, 1)`
- Press: `scale(0.97)` 120ms
- Page enter: 200ms opacity + 8px y
- Active nav: layout spring, low bounce
- Respect `prefers-reduced-motion`
- Never animate high-frequency keyboard actions

## Layout
- App: fixed sidebar (desktop) / sheet (mobile)
- Content max-width ~72rem
- Avoid card-in-card; use divide rows and section headers
- Landing: asymmetric split (copy left, auth right) — no centered mesh hero
