# Mission Atlas brand kit

Final logo files for Mission Atlas. The emblem is a circular chart: an Earth horizon with a ground station tracking three missions on two crossing orbits. The lavender node is the active mission.

## Folder contents

```
mission-atlas-brand/
├── README.md
├── svg/   vector masters (use these whenever the format allows)
├── png/   raster exports for places that need an image file
└── web/   drop-in favicon set for a website root
```

### svg/

| File | Use |
| --- | --- |
| `mission-atlas-emblem.svg` | Master emblem, transparent outside the circle. Use at 64 px and larger. |
| `mission-atlas-mark-small.svg` | Simplified emblem for 40–96 px (heavier lines, simpler coastline, no stars). |
| `mission-atlas-favicon.svg` | Simplified emblem for 24–32 px. Also copied to `web/favicon.svg`. |
| `mission-atlas-favicon-16.svg` | Emblem for 16 px: ring, horizon, one orbit, active mission. |
| `mission-atlas-app-icon.svg` | Emblem on a rounded dark tile, for app icons and launchers. |
| `mission-atlas-lockup-on-dark.svg` | Emblem + wordmark + caption, light text, for dark backgrounds. |
| `mission-atlas-lockup-on-light.svg` | Same lockup with dark text, for light backgrounds. |
| `mission-atlas-wordmark-on-dark.svg` | Wordmark alone, light. |
| `mission-atlas-wordmark-on-light.svg` | Wordmark alone, dark. |
| `mission-atlas-social-preview.svg` | Source for the 1280×640 GitHub social preview. |

All text in these files is converted to outlines, so they render the same everywhere without the fonts installed.

### png/

| File | Use |
| --- | --- |
| `mission-atlas-emblem-1024.png`, `-512.png`, `-256.png` | Emblem with transparent background. |
| `mission-atlas-app-icon-1024.png`, `-512.png` | Rounded-tile app icon. |
| `mission-atlas-avatar-500.png` | Square avatar for GitHub organizations, Slack, etc. Safe if the platform crops it to a circle. |
| `mission-atlas-lockup-on-dark@2x.png`, `-on-light@2x.png` | Lockups at double resolution. |
| `github-social-preview.png` | 1280×640 repository social preview. |
| `favicon-16.png`, `-32.png`, `-48.png` | Individual favicon sizes, each drawn for its size. |

### web/

Copy everything in this folder to the root of the website.

| File | Use |
| --- | --- |
| `favicon.ico` | 16, 32 and 48 px in one file, for browsers and tools that only read `.ico`. |
| `favicon.svg` | Scalable favicon for modern browsers. |
| `apple-touch-icon.png` | 180×180 iOS home-screen icon (square, iOS rounds the corners). |
| `icon-192.png`, `icon-512.png` | Android and installed web app icons. |
| `site.webmanifest` | Web app manifest that points to the two icons above. |

## Using it

### Website `<head>`

```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#0F1126">
```

### GitHub README header

GitHub supports `<picture>` with `prefers-color-scheme`, so the header switches with the reader's theme. Adjust the paths to wherever the kit lives in the repo.

```html
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/svg/mission-atlas-lockup-on-dark.svg">
    <img alt="Mission Atlas" src="brand/svg/mission-atlas-lockup-on-light.svg" width="520">
  </picture>
</p>
```

### GitHub repository and organization

- **Social preview:** repository Settings › General › Social preview › upload `png/github-social-preview.png`.
- **Organization or account avatar:** `png/mission-atlas-avatar-500.png`.

## Choosing a size

| Displayed size | File |
| --- | --- |
| 64 px and up | `mission-atlas-emblem.svg` |
| 40–96 px | `mission-atlas-mark-small.svg` |
| 24–32 px | `mission-atlas-favicon.svg` |
| 16 px | `mission-atlas-favicon-16.svg` |

The 40–96 and 64+ ranges overlap on purpose. Between 64 and 96 px either works; use the full emblem when the coastline matters and the small mark when the icon sits among other small UI icons.

## Colors: Celestial Cartography

| Name | Hex | Role |
| --- | --- | --- |
| Deep Space | `#0F1126` | Page, tile and banner background |
| Indigo Sky | `#191C3C` | Emblem disc; dark wordmark on light backgrounds |
| Earth Indigo | `#2A2C5F` | Oceans |
| Land Violet | `#55529F` | Continents |
| Orbit Violet | `#968DD3` | Dashed orbit, caption text on dark |
| Caption Violet | `#5B53A0` | Caption text and rule on light backgrounds |
| Signal Lavender | `#C4BCF1` | Active mission node, tracking lines |
| Parchment | `#EFE8D6` | Ring, Earth limb, solid orbit, wordmark on dark |
| Light ground | `#F3EFE4` | Suggested light background |

## Typography

| Role | Typeface | Setting |
| --- | --- | --- |
| Wordmark | Archivo | Weight 640, width 118%, all caps, letter-spacing 0.06em |
| Tagline / body | Archivo | Weight 400, normal width |
| Captions and labels | IBM Plex Mono | Weight 500, all caps, letter-spacing 0.18–0.22em |

Both families are free on Google Fonts under the SIL Open Font License. For live web text:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=IBM+Plex+Mono:wght@400;500&display=swap">
```

```css
.wordmark { font-family: "Archivo", sans-serif; font-weight: 640; font-stretch: 118%; letter-spacing: 0.06em; text-transform: uppercase; }
.caption  { font-family: "IBM Plex Mono", monospace; font-weight: 500; letter-spacing: 0.22em; text-transform: uppercase; }
```

## Usage rules

- **Clear space:** keep empty space around the emblem of at least one quarter of its diameter.
- **Background:** the emblem carries its own dark disc and a thin dark keyline outside the ring, so it works on dark, light and mid-tone backgrounds. Avoid busy photos behind it.
- **Pick the lockup by background:** `on-dark` for dark backgrounds, `on-light` for light ones.
- **Don't** recolor parts of the emblem, stretch or rotate it, add shadows, glows or gradients, or re-set the wordmark in another typeface.
- **Don't** scale the full emblem below 64 px; switch to the small mark or a favicon file.

## Construction notes

- Canvas: 512×512, emblem circle radius 240.
- Earth is an orthographic view centered at 39° S, 81° W, which puts the Gulf of Mexico, Florida, Cuba and Central America in the visible cap. Coastlines come from Natural Earth 1:50m land data (public domain), simplified for each size.
- Smaller files drop details in steps: the 40–96 px mark drops the stars and the ring around the active mission; 24–32 px also drops the tracking lines and one mission, and draws the dashed orbit solid; 16 px keeps only the ring, horizon, solid orbit and active mission.
